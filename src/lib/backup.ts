import { UserProfile, FinancialAccount, Transaction, LedgerProject, WebDavConfig, BackupPackage, TransactionType } from '../types';

export const APP_BACKUP_VERSION = '1.0.0';

/**
 * 导出全部数据为 JSON 备份文件并自动触发浏览器下载
 */
export const exportDataToJsonFile = (
  user: UserProfile,
  accounts: FinancialAccount[],
  transactions: Transaction[],
  projects: LedgerProject[] = [],
  webDavConfig?: WebDavConfig
): void => {
  const backup: BackupPackage = {
    version: APP_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'FinanceApp',
    user,
    accounts: accounts || [],
    transactions: transactions || [],
    projects: projects || [],
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
 * 格式化标准化日期 YYYY-MM-DD
 */
const normalizeDate = (rawDate: any): string => {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim().replace(/[/.]/g, '-');
  const match = str.match(/\d{4}-\d{1,2}-\d{1,2}/);
  if (match) {
    const parts = match[0].split('-');
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
};

/**
 * 智能解析并校验各版本及格式的备份 JSON 字符串
 * 全面兼容：完整备份、交易流水导出文件、资产账户导出文件、旧版本备份、嵌套 data 结构等
 * 保证零丢失：自动补全缺失 ID、自动规整化流水与账户、自动建立关联
 */
export const parseBackupJson = (jsonString: string): { success: boolean; data?: BackupPackage; error?: string } => {
  try {
    let parsed: any = JSON.parse(jsonString);
    if (!parsed) {
      return { success: false, error: 'JSON 文件内容为空' };
    }

    // 1. 如果包裹在 data 或 backup 节点中，进行解包
    if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
      parsed = { ...parsed, ...parsed.data };
    }
    if (parsed.backup && typeof parsed.backup === 'object' && !Array.isArray(parsed.backup)) {
      parsed = { ...parsed, ...parsed.backup };
    }

    let rawAccounts: any[] = [];
    let rawTransactions: any[] = [];
    let rawProjects: any[] = [];
    let user: any = parsed.user || undefined;

    // 2. 如果根节点是数组，智能判断是流水数组还是账户数组
    if (Array.isArray(parsed)) {
      if (parsed.length > 0) {
        const first = parsed[0];
        if (first && (first.amount !== undefined || first.date !== undefined || first.category !== undefined)) {
          rawTransactions = parsed;
        } else if (first && (first.balance !== undefined || first.bankName !== undefined || first.accountNumber !== undefined)) {
          rawAccounts = parsed;
        } else {
          rawTransactions = parsed;
        }
      }
    } else if (typeof parsed === 'object') {
      // 提取账户列表
      if (Array.isArray(parsed.accounts)) {
        rawAccounts = parsed.accounts;
      } else if (Array.isArray(parsed.accountList)) {
        rawAccounts = parsed.accountList;
      } else if (Array.isArray(parsed.cards)) {
        rawAccounts = parsed.cards;
      }

      // 提取记账流水明细
      if (Array.isArray(parsed.transactions)) {
        rawTransactions = parsed.transactions;
      } else if (Array.isArray(parsed.transactionList)) {
        rawTransactions = parsed.transactionList;
      } else if (Array.isArray(parsed.records)) {
        rawTransactions = parsed.records;
      } else if (Array.isArray(parsed.bills)) {
        rawTransactions = parsed.bills;
      } else if (Array.isArray(parsed.items)) {
        rawTransactions = parsed.items;
      }

      // 提取专项账本项目
      if (Array.isArray(parsed.projects)) {
        rawProjects = parsed.projects;
      } else if (Array.isArray(parsed.projectList)) {
        rawProjects = parsed.projectList;
      }
    }

    if (rawAccounts.length === 0 && rawTransactions.length === 0 && rawProjects.length === 0) {
      return { success: false, error: '未在文件中检测到有效的资产账户、记账流水或项目数据' };
    }

    // 3. 规范化并清洗账户数据
    const normalizedAccounts: FinancialAccount[] = [];
    const knownAccountIds = new Set<string>();

    rawAccounts.forEach((acc, idx) => {
      if (!acc) return;
      const accId = String(acc.id || `acc_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`);
      knownAccountIds.add(accId);
      normalizedAccounts.push({
        id: accId,
        name: String(acc.name || acc.accountName || '资产账户').trim(),
        category: acc.category || 'DEBIT_CARD',
        balance: typeof acc.balance === 'number' ? acc.balance : parseFloat(acc.balance) || 0,
        currency: acc.currency || 'CNY',
        bankName: acc.bankName || acc.bank || undefined,
        cardNumberLast4: acc.cardNumberLast4 || (acc.accountNumber ? String(acc.accountNumber).slice(-4) : (acc.cardNo ? String(acc.cardNo).slice(-4) : undefined)),
        cardImageUrl: acc.cardImageUrl || undefined,
        cardBgColor: acc.cardBgColor || undefined,
        cardSkin: acc.cardSkin || undefined,
        creditLimit: acc.creditLimit !== undefined ? Number(acc.creditLimit) : undefined,
        billDay: acc.billDay ? Number(acc.billDay) : (acc.billingDay ? Number(acc.billingDay) : undefined),
        dueDay: acc.dueDay ? Number(acc.dueDay) : (acc.repaymentDay ? Number(acc.repaymentDay) : undefined),
        updatedAt: acc.updatedAt || new Date().toISOString(),
      });
    });

    // 4. 规范化并清洗记账流水数据 (确保 0 丢失，无 ID 时自动生成唯一标识)
    const normalizedTransactions: Transaction[] = [];
    const missingAccountIds = new Map<string, string>(); // accId -> accName

    rawTransactions.forEach((tx, idx) => {
      if (!tx) return;
      const amount = Math.abs(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0);
      const rawType = String(tx.type || '').toUpperCase();
      let type: TransactionType = 'EXPENSE';
      if (rawType === 'INCOME' || rawType === '收入') type = 'INCOME';
      else if (rawType === 'TRANSFER' || rawType === '转账') type = 'TRANSFER';
      else if (rawType === 'REFUND' || rawType === '退款' || rawType === '冲红') type = 'REFUND';

      const txId = String(tx.id || `tx_imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`);
      const date = normalizeDate(tx.date);
      const accountId = String(tx.accountId || tx.account || 'acc_default');
      const accountName = String(tx.accountName || tx.account || '默认账户');

      // 记录可能缺失的账户
      if (!knownAccountIds.has(accountId)) {
        missingAccountIds.set(accountId, accountName);
      }

      normalizedTransactions.push({
        id: txId,
        type,
        amount,
        originalAmount: tx.originalAmount !== undefined ? Number(tx.originalAmount) : undefined,
        currency: tx.currency || 'CNY',
        exchangeRate: tx.exchangeRate ? Number(tx.exchangeRate) : undefined,
        date,
        time: tx.time ? String(tx.time) : '',
        accountId,
        targetAccountId: tx.targetAccountId ? String(tx.targetAccountId) : undefined,
        category: String(tx.category || (type === 'INCOME' ? '收入' : '日常支出')),
        subCategory: tx.subCategory ? String(tx.subCategory) : undefined,
        tag: tx.tag ? String(tx.tag) : undefined,
        description: String(tx.description || tx.desc || tx.category || '记账明细'),
        merchant: tx.merchant ? String(tx.merchant) : undefined,
        counterparty: tx.counterparty ? String(tx.counterparty) : undefined,
        projectId: tx.projectId ? String(tx.projectId) : undefined,
        createdAt: tx.createdAt || new Date().toISOString(),
      });
    });

    // 5. 若流水中引用的账户在账户列表中不存在，自动智能补齐，防止流水成为“孤儿明细”而无法显示
    missingAccountIds.forEach((accName, accId) => {
      normalizedAccounts.push({
        id: accId,
        name: accName || '导入关联账户',
        category: 'DEBIT_CARD',
        balance: 0,
        currency: 'CNY',
        updatedAt: new Date().toISOString(),
      });
      knownAccountIds.add(accId);
    });

    // 6. 规范化专项账本项目
    const normalizedProjects: LedgerProject[] = [];
    rawProjects.forEach((proj, idx) => {
      if (!proj) return;
      normalizedProjects.push({
        id: String(proj.id || `proj_imp_${Date.now()}_${idx}`),
        name: String(proj.name || '未命名项目').trim(),
        description: proj.description ? String(proj.description) : undefined,
        category: proj.category || '综合项目',
        color: proj.color || '#0d9488',
        budget: proj.budget ? Number(proj.budget) : undefined,
        status: proj.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
        startDate: proj.startDate ? String(proj.startDate) : undefined,
        endDate: proj.endDate ? String(proj.endDate) : undefined,
        createdAt: proj.createdAt || new Date().toISOString(),
        updatedAt: proj.updatedAt || new Date().toISOString(),
      });
    });

    return {
      success: true,
      data: {
        version: parsed.version || APP_BACKUP_VERSION,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        app: 'FinanceApp',
        user: user || undefined,
        accounts: normalizedAccounts,
        transactions: normalizedTransactions,
        projects: normalizedProjects,
        webDavConfig: parsed.webDavConfig || undefined,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'JSON 解析失败' };
  }
};

/**
 * 智能合并账户数据 (保留原有或更新属性，补充缺失账户，保证 0 丢失)
 */
export const mergeAccounts = (
  existing: FinancialAccount[] = [],
  incoming: FinancialAccount[] = []
): FinancialAccount[] => {
  const existingMap = new Map<string, FinancialAccount>();
  (existing || []).forEach((a) => {
    if (a && a.id) existingMap.set(a.id, a);
  });

  (incoming || []).forEach((inAcc) => {
    if (!inAcc || !inAcc.id) return;
    if (existingMap.has(inAcc.id)) {
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
 * 智能合并流水明细 (去重合并且绝对不丢单)
 * 仅当 ID 相同或 (日期 + 金额 + 收支类型 + 账户 + 描述) 完全一致时才视为重复；
 * 否则哪怕 ID 发生意外冲突，也会重分配唯一 ID 并完整保留两条记录！
 */
export const mergeTransactions = (
  existing: Transaction[] = [],
  incoming: Transaction[] = []
): Transaction[] => {
  const result: Transaction[] = [...(existing || [])];
  const existingIdSet = new Set<string>();
  const existingFingerprints = new Set<string>();

  const makeFingerprint = (t: Transaction) =>
    `${t.date}_${t.time || ''}_${t.amount}_${t.type}_${t.accountId}_${(t.description || '').trim()}_${(t.merchant || '').trim()}`;

  (existing || []).forEach((t) => {
    if (t && t.id) {
      existingIdSet.add(t.id);
      existingFingerprints.add(makeFingerprint(t));
    }
  });

  (incoming || []).forEach((inTx, idx) => {
    if (!inTx) return;

    // 检查是否有完全相同的数据指纹（日期+时间+金额+类型+账户+商户描述）
    const fp = makeFingerprint(inTx);
    if (existingFingerprints.has(fp)) {
      // 已存在完全相同的流水明细，跳过以避免重复计入
      return;
    }

    let finalId = inTx.id;
    // 如果 ID 缺失或者与已存在 ID 冲突（但数据指纹不同），则重新分配独立 ID 保证两条均被保留
    if (!finalId || existingIdSet.has(finalId)) {
      finalId = `tx_merged_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
    }

    const txToInsert: Transaction = {
      ...inTx,
      id: finalId,
    };

    result.push(txToInsert);
    existingIdSet.add(finalId);
    existingFingerprints.add(fp);
  });

  // 按日期时间倒序排序
  return result.sort((a, b) => {
    const timeA = `${a.date} ${a.time || '00:00'}`;
    const timeB = `${b.date} ${b.time || '00:00'}`;
    return timeB.localeCompare(timeA);
  });
};

/**
 * 智能合并专项账本项目 (去重合并)
 */
export const mergeProjects = (
  existing: LedgerProject[] = [],
  incoming: LedgerProject[] = []
): LedgerProject[] => {
  const existingMap = new Map<string, LedgerProject>();
  (existing || []).forEach((p) => {
    if (p && p.id) existingMap.set(p.id, p);
  });

  (incoming || []).forEach((inProj) => {
    if (!inProj || !inProj.id) return;
    if (existingMap.has(inProj.id)) {
      existingMap.set(inProj.id, {
        ...existingMap.get(inProj.id)!,
        ...inProj,
      });
    } else {
      existingMap.set(inProj.id, inProj);
    }
  });

  return Array.from(existingMap.values());
};
