import { UserProfile, FinancialAccount, Transaction, WebDavConfig, BackupPackage } from '../types';

export const APP_BACKUP_VERSION = '1.0.0';

/**
 * 导出全部数据为 JSON 备份文件并自动触发浏览器下载
 */
export const exportDataToJsonFile = (
  user: UserProfile,
  accounts: FinancialAccount[],
  transactions: Transaction[],
  webDavConfig?: WebDavConfig
): void => {
  const backup: BackupPackage = {
    version: APP_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'FinanceApp',
    user,
    accounts,
    transactions,
    webDavConfig: webDavConfig
      ? {
          enabled: webDavConfig.enabled,
          serverUrl: webDavConfig.serverUrl,
          username: webDavConfig.username,
          remotePath: webDavConfig.remotePath,
          autoSyncOnSave: webDavConfig.autoSyncOnSave,
          lastSyncTime: webDavConfig.lastSyncTime,
        }
      : undefined,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  const filename = `finance_backup_${user.username || 'user'}_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 解析并校验备份 JSON 字符串
 */
export const parseBackupJson = (jsonString: string): { success: boolean; data?: BackupPackage; error?: string } => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: '无效的 JSON 格式' };
    }

    if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) {
      return { success: false, error: '备份文件中缺少必要的账户或流水记录数据结构' };
    }

    return {
      success: true,
      data: parsed as BackupPackage,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'JSON 解析失败' };
  }
};

/**
 * 智能合并账户数据 (保留原有或更新属性，补充缺失账户)
 */
export const mergeAccounts = (
  existing: FinancialAccount[],
  incoming: FinancialAccount[]
): FinancialAccount[] => {
  const existingMap = new Map<string, FinancialAccount>();
  existing.forEach((a) => existingMap.set(a.id, a));

  incoming.forEach((inAcc) => {
    if (existingMap.has(inAcc.id)) {
      // 存在相同 ID 则以最新导入为准或合并
      existingMap.set(inAcc.id, {
        ...existingMap.get(inAcc.id)!,
        ...inAcc,
      });
    } else {
      existingMap.set(inAcc.id, inAcc);
    }
  });

  return Array.from(existingMap.values());
};

/**
 * 智能合并流水明细 (去重合并)
 */
export const mergeTransactions = (
  existing: Transaction[],
  incoming: Transaction[]
): Transaction[] => {
  const existingMap = new Map<string, Transaction>();
  existing.forEach((t) => existingMap.set(t.id, t));

  incoming.forEach((inTx) => {
    existingMap.set(inTx.id, inTx);
  });

  // 按日期时间倒序排序
  return Array.from(existingMap.values()).sort((a, b) => {
    const timeA = `${a.date} ${a.time || '00:00'}`;
    const timeB = `${b.date} ${b.time || '00:00'}`;
    return timeB.localeCompare(timeA);
  });
};
