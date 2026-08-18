import { CloudflareSyncConfig, UserProfile, FinancialAccount, Transaction, BackupPackage } from '../types';

const CF_CONFIG_STORAGE_KEY = 'finance_cf_sync_config_';

/**
 * 获取 Cloudflare 同步设置
 */
export const getStoredCloudflareConfig = (userId: string): CloudflareSyncConfig => {
  try {
    const raw = localStorage.getItem(`${CF_CONFIG_STORAGE_KEY}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load Cloudflare sync config', e);
  }
  return {
    enabled: true,
    apiUrl: '',
    autoSync: true,
    status: 'idle',
  };
};

/**
 * 保存 Cloudflare 同步设置
 */
export const saveCloudflareConfig = (userId: string, config: CloudflareSyncConfig): void => {
  try {
    localStorage.setItem(`${CF_CONFIG_STORAGE_KEY}${userId}`, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Cloudflare sync config', e);
  }
};

/**
 * 获取 Cloudflare API 同步 endpoint
 */
const getSyncEndpoint = (config?: CloudflareSyncConfig): string => {
  if (config?.apiUrl && config.apiUrl.trim()) {
    const base = config.apiUrl.trim().replace(/\/+$/, '');
    return `${base}/api/sync`;
  }
  // 默认使用当前域名同源 API 路由
  return '/api/sync';
};

/**
 * 测试 Cloudflare D1 / Worker 接口连通性
 */
export const testCloudflareConnection = async (
  config?: CloudflareSyncConfig
): Promise<{ success: boolean; message: string; version?: string; backend?: string }> => {
  try {
    const endpoint = getSyncEndpoint(config);
    const healthUrl = endpoint.replace(/\/sync$/, '/health');
    const res = await fetch(healthUrl, { method: 'GET' });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        message: 'Cloudflare D1 / Worker 后端接口响应正常',
        version: data.version || '1.0.0',
        backend: data.backend || 'Cloudflare Pages / D1',
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        message: '未检测到云端 /api/health 路由。如已部署到 Cloudflare Pages，请确保 functions 目录生效。',
      };
    }

    return {
      success: false,
      message: `云端接口返回 HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `无法连接 Cloudflare 接口: ${err.message || '网络离线或尚未部署后端'}`,
    };
  }
};

/**
 * 向 Cloudflare D1 / KV 数据库推送本地数据进行双向同步
 */
export const syncWithCloudflare = async (
  config: CloudflareSyncConfig,
  user: UserProfile,
  accounts: FinancialAccount[],
  transactions: Transaction[]
): Promise<{
  success: boolean;
  message: string;
  mergedAccounts?: FinancialAccount[];
  mergedTransactions?: Transaction[];
  timestamp?: string;
}> => {
  try {
    const endpoint = getSyncEndpoint(config);
    const payload = {
      userId: user.id,
      user,
      accounts,
      transactions,
      clientTimestamp: new Date().toISOString(),
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          message: 'Cloudflare D1 /api/sync 路由不存在（当前处于纯前端离线环境，部署至 Cloudflare 后即可自动启用）',
        };
      }
      const errText = await res.text().catch(() => '');
      return {
        success: false,
        message: `云端同步失败 (HTTP ${res.status}): ${errText || res.statusText}`,
      };
    }

    const result = await res.json();
    const nowStr = new Date().toLocaleString();

    return {
      success: true,
      message: result.message || '已成功与 Cloudflare D1 云数据库完成双向同步',
      mergedAccounts: result.accounts || accounts,
      mergedTransactions: result.transactions || transactions,
      timestamp: nowStr,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `云端同步未完成: ${err.message || '网络离线'}`,
    };
  }
};

/**
 * 从 Cloudflare D1 仅拉取云端最新数据
 */
export const fetchFromCloudflare = async (
  config: CloudflareSyncConfig,
  userId: string
): Promise<{
  success: boolean;
  message: string;
  data?: {
    user?: UserProfile;
    accounts?: FinancialAccount[];
    transactions?: Transaction[];
    lastUpdated?: string;
  };
}> => {
  try {
    const endpoint = `${getSyncEndpoint(config)}?userId=${encodeURIComponent(userId)}`;
    const res = await fetch(endpoint, { method: 'GET' });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          message: '未发现云端存储记录（尚未同步或初次部署）',
        };
      }
      return {
        success: false,
        message: `拉取失败 (HTTP ${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      message: '成功从 Cloudflare D1 拉取最新云端数据',
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `拉取失败: ${err.message || '网络连接异常'}`,
    };
  }
};
