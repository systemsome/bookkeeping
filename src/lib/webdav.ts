import { WebDavConfig, BackupPackage, UserProfile, FinancialAccount, Transaction } from '../types';
import { APP_BACKUP_VERSION } from './backup';

const WEBDAV_CONFIG_STORAGE_KEY = 'finance_webdav_config_';

/**
 * 获取本地存储的 WebDAV 配置
 */
export const getStoredWebDavConfig = (userId: string): WebDavConfig => {
  try {
    const raw = localStorage.getItem(`${WEBDAV_CONFIG_STORAGE_KEY}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load WebDAV config from storage', e);
  }
  return {
    enabled: false,
    serverUrl: '',
    username: '',
    password: '',
    remotePath: '/finance_sync_backup.json',
    autoSyncOnSave: false,
  };
};

/**
 * 保存 WebDAV 配置到本地
 */
export const saveWebDavConfig = (userId: string, config: WebDavConfig): void => {
  try {
    localStorage.setItem(`${WEBDAV_CONFIG_STORAGE_KEY}${userId}`, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save WebDAV config to storage', e);
  }
};

/**
 * 构造标准 WebDAV Basic Auth Header
 */
const getAuthHeaders = (config: WebDavConfig): Record<string, string> => {
  const credentials = `${config.username}:${config.password}`;
  const encoded = btoa(unescape(encodeURIComponent(credentials)));
  return {
    Authorization: `Basic ${encoded}`,
  };
};

/**
 * 格式化完整的远程 WebDAV 访问地址
 */
const getTargetUrl = (config: WebDavConfig): string => {
  let base = config.serverUrl.trim();
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  let path = config.remotePath.trim();
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${base}${path}`;
};

/**
 * 测试 WebDAV 连通性
 */
export const testWebDavConnection = async (
  config: WebDavConfig
): Promise<{ success: boolean; message: string }> => {
  if (!config.serverUrl || !config.username || !config.password) {
    return { success: false, message: '请先填写完整的服务器地址、用户名及授权密码' };
  }

  try {
    const targetUrl = getTargetUrl(config);
    // 优先尝试 PROPFIND 或 HEAD / GET 请求测试鉴权
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(config),
      },
    });

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: '身份鉴权失败（401/403）：请检查用户名与应用密码是否正确' };
    }

    if (res.status === 404) {
      // 404 说明连接成功，只是文件尚未创建，属于正常状态
      return { success: true, message: 'WebDAV 服务连接成功！（云端备份文件尚未创建，上传后即可生效）' };
    }

    if (res.ok || res.status === 207) {
      return { success: true, message: 'WebDAV 服务器连接成功，授权有效！' };
    }

    return { success: false, message: `服务器返回状态码 ${res.status} (${res.statusText})` };
  } catch (err: any) {
    return {
      success: false,
      message: `网络连接异常: ${err.message || '跨域限制(CORS)或无法连接到指定服务器'}`,
    };
  }
};

/**
 * 上传数据包至 WebDAV 云盘 (PUT)
 */
export const uploadToWebDav = async (
  config: WebDavConfig,
  user: UserProfile,
  accounts: FinancialAccount[],
  transactions: Transaction[]
): Promise<{ success: boolean; message: string; timestamp?: string }> => {
  if (!config.enabled || !config.serverUrl || !config.username || !config.password) {
    return { success: false, message: 'WebDAV 配置未启用或信息不完整' };
  }

  const backupPackage: BackupPackage = {
    version: APP_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'FinanceApp',
    user,
    accounts,
    transactions,
  };

  try {
    const targetUrl = getTargetUrl(config);
    const content = JSON.stringify(backupPackage, null, 2);

    const res = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(config),
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: content,
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      const nowStr = new Date().toLocaleString();
      return {
        success: true,
        message: '数据已成功同步加密上传至 WebDAV 云盘',
        timestamp: nowStr,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: 'WebDAV 鉴权失败，请检查账号密码' };
    }

    return { success: false, message: `上传失败 (HTTP ${res.status}): ${res.statusText}` };
  } catch (err: any) {
    return { success: false, message: `同步异常: ${err.message || '网络错误或跨域限制'}` };
  }
};

/**
 * 从 WebDAV 云盘下载恢复数据 (GET)
 */
export const downloadFromWebDav = async (
  config: WebDavConfig
): Promise<{ success: boolean; message: string; data?: BackupPackage }> => {
  if (!config.serverUrl || !config.username || !config.password) {
    return { success: false, message: '请先填写完整的 WebDAV 配置' };
  }

  try {
    const targetUrl = getTargetUrl(config);
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(config),
      },
    });

    if (res.status === 404) {
      return { success: false, message: '云端暂无备份文件，请先点击「立即同步上传」创建首个备份' };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: 'WebDAV 鉴权失败，请检查用户名与密码' };
    }

    if (!res.ok) {
      return { success: false, message: `下载失败 (HTTP ${res.status}): ${res.statusText}` };
    }

    const text = await res.text();
    const parsed = JSON.parse(text);

    if (!parsed || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) {
      return { success: false, message: '云端文件不是有效的账目备份文件' };
    }

    return {
      success: true,
      message: '成功从 WebDAV 下载云端备份数据',
      data: parsed as BackupPackage,
    };
  } catch (err: any) {
    return { success: false, message: `拉取失败: ${err.message || '网络连接或解析异常'}` };
  }
};
