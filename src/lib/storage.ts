import { FinancialAccount, Transaction, UserProfile, FinancialSummary, AccountCategory, LedgerProject, ProjectFinancialStats } from '../types';
import { INITIAL_DEMO_ACCOUNTS, INITIAL_DEMO_TRANSACTIONS, INITIAL_DEMO_PROJECTS } from './constants';
import { sortTransactions } from './formatters';
import { mergeAccounts, mergeTransactions, mergeProjects } from './backup';
import { getStoredCloudflareConfig, saveCloudflareConfig, syncWithCloudflare } from './cloudflareSync';
import { getStoredWebDavConfig, saveWebDavConfig, uploadToWebDav } from './webdav';

const STORAGE_KEYS = {
  USERS: 'asset_manager_users_v1',
  CURRENT_USER_ID: 'asset_manager_curr_uid_v1',
  ACCOUNTS_PREFIX: 'asset_manager_accs_',
  TRANSACTIONS_PREFIX: 'asset_manager_txs_',
  PROJECTS_PREFIX: 'asset_manager_projs_',
  IS_LOCKED: 'asset_manager_is_locked_v1',
  LAST_ACTIVITY: 'asset_manager_last_act_v1',
};

// Initial demo user
const DEFAULT_DEMO_USER: UserProfile = {
  id: 'demo-user-888',
  username: 'demo',
  displayName: '财务管理官 (体验号)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  passwordHash: 'demo123456', // In a real app this is salted hash
  pinCode: '123456', // 6-digit default PIN for unlock
  autoLockMinutes: 15,
  privacyMode: true, // 默认隐藏敏感金额
  lastLoginTime: new Date().toISOString(),
};

export const getStoredUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      const initialUsers = [DEFAULT_DEMO_USER];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      return initialUsers;
    }
    const users: UserProfile[] = JSON.parse(raw);
    if (!users.some((u) => u.username === 'demo')) {
      users.push(DEFAULT_DEMO_USER);
    }
    return users;
  } catch {
    return [DEFAULT_DEMO_USER];
  }
};

export const saveUsers = (users: UserProfile[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
};

export const setCurrentUserId = (uid: string | null) => {
  if (uid) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, uid);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
};

export const getCurrentUser = (): UserProfile | null => {
  const uid = getCurrentUserId();
  if (!uid) return null;
  const users = getStoredUsers();
  return users.find((u) => u.id === uid) || null;
};

// Debounce timer for auto-syncing with server and cloud storage
let syncTimeout: any = null;
export const triggerAutoServerSync = (userId: string, immediate = false) => {
  if (!userId) return;
  if (syncTimeout) clearTimeout(syncTimeout);

  const executeSync = async () => {
    const accounts = getAccounts(userId);
    const transactions = getTransactions(userId);
    const projects = getProjects(userId);
    const user: UserProfile = getCurrentUser() || getStoredUsers().find((u) => u.id === userId) || {
      id: userId,
      username: 'user',
      displayName: 'User',
      passwordHash: '',
      autoLockMinutes: 15,
      privacyMode: false,
      lastLoginTime: new Date().toISOString(),
    };

    // 1. 同步至 Express / NAS 服务端持久化文件存储
    try {
      await syncDataToServer(userId, accounts, transactions, projects, user);
    } catch (e) {
      console.warn('Server sync attempt:', e);
    }

    // 2. 如果开启了 Cloudflare 自动同步，静默推送到云端 D1
    try {
      const cfConfig = getStoredCloudflareConfig(userId);
      if (cfConfig.enabled && cfConfig.autoSync && cfConfig.apiUrl?.trim()) {
        const cfRes = await syncWithCloudflare(
          cfConfig,
          user,
          accounts,
          transactions,
          projects
        );
        if (cfRes.success) {
          saveCloudflareConfig(userId, { ...cfConfig, lastSyncTime: cfRes.timestamp, status: 'synced' });
        }
      }
    } catch {
      // 静默处理边缘同步异常
    }

    // 3. 如果开启了 WebDAV 实时自动备份，静默备份到 WebDAV 网盘
    try {
      const webDavConfig = getStoredWebDavConfig(userId);
      if (webDavConfig.enabled && webDavConfig.autoSyncOnSave && webDavConfig.serverUrl?.trim()) {
        const wdRes = await uploadToWebDav(
          webDavConfig,
          user,
          accounts,
          transactions,
          projects
        );
        if (wdRes.success) {
          saveWebDavConfig(userId, { ...webDavConfig, lastSyncTime: wdRes.timestamp });
        }
      }
    } catch {
      // 静默处理 WebDAV 异常
    }
  };

  if (immediate) {
    executeSync();
  } else {
    syncTimeout = setTimeout(executeSync, 400);
  }
};

/**
 * 手动触发全量双向同步 (拉取服务端无损合并 + 回写本地全部资产/流水/项目 + 联动 Cloudflare D1 / WebDAV)
 */
export const executeFullCloudSync = async (
  userId: string
): Promise<{ success: boolean; message?: string; timestamp?: string }> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, message: '网络已断开，当前处于离线模式' };
  }

  const user: UserProfile = getCurrentUser() || getStoredUsers().find((u) => u.id === userId) || {
    id: userId,
    username: 'user',
    displayName: 'User',
    passwordHash: '',
    autoLockMinutes: 15,
    privacyMode: false,
    lastLoginTime: new Date().toISOString(),
  };

  try {
    // 1. 先从服务端拉取并无损合并两端数据
    const fetchRes = await fetchLatestDataFromServer(userId);
    const accounts = fetchRes.success && fetchRes.accounts ? fetchRes.accounts : getAccounts(userId);
    const transactions = fetchRes.success && fetchRes.transactions ? fetchRes.transactions : getTransactions(userId);
    const projects = fetchRes.success && fetchRes.projects ? fetchRes.projects : getProjects(userId);

    // 2. 将合并后的全量数据持久化推送至服务端/NAS
    const serverRes = await syncDataToServer(userId, accounts, transactions, projects, user);

    const nowIso = new Date().toISOString();

    // 3. 联动 Cloudflare D1
    try {
      const cfConfig = getStoredCloudflareConfig(userId);
      if (cfConfig.enabled && cfConfig.apiUrl?.trim()) {
        const cfRes = await syncWithCloudflare(cfConfig, user, accounts, transactions, projects);
        if (cfRes.success) {
          saveCloudflareConfig(userId, { ...cfConfig, lastSyncTime: cfRes.timestamp, status: 'synced' });
        }
      }
    } catch {
      // 静默处理异常
    }

    // 4. 联动 WebDAV
    try {
      const webDavConfig = getStoredWebDavConfig(userId);
      if (webDavConfig.enabled && webDavConfig.serverUrl?.trim()) {
        const wdRes = await uploadToWebDav(webDavConfig, user, accounts, transactions, projects);
        if (wdRes.success) {
          saveWebDavConfig(userId, { ...webDavConfig, lastSyncTime: wdRes.timestamp });
        }
      }
    } catch {
      // 静默处理异常
    }

    if (serverRes.success) {
      return { success: true, message: '全量云端数据已成功双向同步', timestamp: nowIso };
    }
    return { success: false, message: serverRes.message || '服务端同步返回错误' };
  } catch (e: any) {
    return { success: false, message: e.message || '网络连接异常，同步中断' };
  }
};

export const updateCurrentUser = (updates: Partial<UserProfile>): UserProfile | null => {
  const user = getCurrentUser();
  if (!user) return null;
  const updated: UserProfile = { ...user, ...updates };
  const users = getStoredUsers().map((u) => (u.id === user.id ? updated : u));
  saveUsers(users);

  // Sync update to server
  updateUserOnline(user.id, updates).catch((e) => {
    console.warn('Online user update failed (will use local):', e);
  });

  return updated;
};

export const getAccounts = (userId: string): FinancialAccount[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`);
    if (!raw) {
      if (userId === DEFAULT_DEMO_USER.id) {
        localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(INITIAL_DEMO_ACCOUNTS));
        return INITIAL_DEMO_ACCOUNTS;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAccounts = (userId: string, accounts: FinancialAccount[]) => {
  localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(accounts || []));
  triggerAutoServerSync(userId);
};

export const getTransactions = (userId: string): Transaction[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`);
    if (!raw) {
      if (userId === DEFAULT_DEMO_USER.id) {
        const sortedDemo = sortTransactions(INITIAL_DEMO_TRANSACTIONS);
        localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(sortedDemo));
        return sortedDemo;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortTransactions(parsed) : [];
  } catch {
    return [];
  }
};

export const saveTransactions = (userId: string, transactions: Transaction[]) => {
  const sorted = sortTransactions(transactions || []);
  localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(sorted));
  triggerAutoServerSync(userId);
};

export const getProjects = (userId: string): LedgerProject[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${userId}`);
    if (!raw) {
      if (userId === DEFAULT_DEMO_USER.id) {
        localStorage.setItem(
          `${STORAGE_KEYS.PROJECTS_PREFIX}${userId}`,
          JSON.stringify(INITIAL_DEMO_PROJECTS)
        );
        return INITIAL_DEMO_PROJECTS;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveProjects = (userId: string, projects: LedgerProject[]) => {
  localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${userId}`, JSON.stringify(projects));
  triggerAutoServerSync(userId);
};

export const calculateProjectStats = (
  project: LedgerProject,
  transactions: Transaction[] = []
): ProjectFinancialStats => {
  const safeTxs = transactions || [];
  const projectTxs = safeTxs.filter(
    (t) => t.projectId === project.id || (t.projectName && t.projectName === project.name)
  );

  let totalIncome = 0;
  let grossExpense = 0;
  let refundAmount = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let refundCount = 0;

  projectTxs.forEach((tx) => {
    if (tx.type === 'INCOME') {
      totalIncome += tx.amount;
      incomeCount += 1;
    } else if (tx.type === 'EXPENSE') {
      grossExpense += tx.amount;
      expenseCount += 1;
    } else if (tx.type === 'REFUND') {
      refundAmount += tx.amount;
      refundCount += 1;
    }
  });

  // 净支出 = 原始支出 - 冲红退款
  const netExpense = Math.max(0, grossExpense - refundAmount);
  // 净结余 = 项目收入 - 项目净支出
  const netBalance = totalIncome - netExpense;

  const budget = project.budget || 0;
  const budgetRemaining = budget > 0 ? budget - netExpense : undefined;
  const budgetUsagePercent =
    budget > 0 ? Math.min(999, Math.round((netExpense / budget) * 1000) / 10) : 0;

  return {
    projectId: project.id,
    totalIncome,
    grossExpense,
    refundAmount,
    netExpense,
    netBalance,
    budget: project.budget,
    budgetRemaining,
    budgetUsagePercent,
    transactionCount: projectTxs.length,
    incomeCount,
    expenseCount,
    refundCount,
  };
};

export const calculateAllProjectStats = (
  projects: LedgerProject[] = [],
  transactions: Transaction[] = []
): Map<string, ProjectFinancialStats> => {
  const map = new Map<string, ProjectFinancialStats>();
  (projects || []).forEach((proj) => {
    map.set(proj.id, calculateProjectStats(proj, transactions || []));
  });
  return map;
};

/**
 * Server Authentication: Register User
 */
export const registerUserOnline = async (
  username: string,
  displayName: string,
  password: string,
  pinCode: string
): Promise<{ success: boolean; user?: UserProfile; accounts?: FinancialAccount[]; transactions?: Transaction[]; projects?: LedgerProject[]; error?: string }> => {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        password,
        pinCode: pinCode && pinCode.length === 6 ? pinCode : '123456',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || '注册失败，请重试' };
    }

    const newUser: UserProfile = data.user;
    const users = getStoredUsers();
    const existingIndex = users.findIndex((u) => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    saveUsers(users);
    saveAccounts(newUser.id, data.accounts || []);
    saveTransactions(newUser.id, data.transactions || []);
    saveProjects(newUser.id, data.projects || []);
    setCurrentUserId(newUser.id);

    return {
      success: true,
      user: newUser,
      accounts: data.accounts || [],
      transactions: data.transactions || [],
      projects: data.projects || [],
    };
  } catch (err: any) {
    console.warn('[Auth] Server unavailable, falling back to local registration:', err);
    // Offline local fallback
    const users = getStoredUsers();
    if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      return { success: false, error: '该账号已在本地存在，请直接登录' };
    }

    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      username: username.trim(),
      displayName: displayName.trim() || username.trim(),
      passwordHash: password,
      pinCode: pinCode && pinCode.length === 6 ? pinCode : '123456',
      autoLockMinutes: 15,
      privacyMode: false,
      lastLoginTime: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    saveAccounts(newUser.id, []);
    saveTransactions(newUser.id, []);
    saveProjects(newUser.id, []);
    setCurrentUserId(newUser.id);

    return { success: true, user: newUser, accounts: [], transactions: [], projects: [] };
  }
};

/**
 * Server Authentication: Login User (Cross-Device Enabled)
 */
export const loginUserOnline = async (
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; accounts?: FinancialAccount[]; transactions?: Transaction[]; projects?: LedgerProject[]; error?: string }> => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || '账号或密码不正确' };
    }

    const user: UserProfile = data.user;
    const users = getStoredUsers();
    const existingIndex = users.findIndex((u) => u.username.toLowerCase() === user.username.toLowerCase() || u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    saveUsers(users);

    const accounts: FinancialAccount[] = data.accounts || [];
    const transactions: Transaction[] = data.transactions || [];
    const projects: LedgerProject[] = data.projects || [];

    // Cache to localStorage
    localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${user.id}`, JSON.stringify(accounts));
    localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(transactions));
    localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${user.id}`, JSON.stringify(projects));
    setCurrentUserId(user.id);

    return {
      success: true,
      user,
      accounts,
      transactions,
      projects,
    };
  } catch (err: any) {
    console.warn('[Auth] Server unavailable, falling back to local verification:', err);
    // Fallback to local storage if offline
    const users = getStoredUsers();
    const foundUser = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!foundUser || (foundUser.passwordHash !== password && foundUser.pinCode !== password)) {
      return { success: false, error: '账号或密码不正确，请重新输入' };
    }
    setCurrentUserId(foundUser.id);
    const accs = getAccounts(foundUser.id);
    const txs = getTransactions(foundUser.id);
    const projs = getProjects(foundUser.id);
    return { success: true, user: foundUser, accounts: accs, transactions: txs, projects: projs };
  }
};

/**
 * Server Authentication: Update User
 */
export const updateUserOnline = async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
  try {
    const res = await fetch('/api/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Sync Local Data with Server / NAS
 */
export const syncDataToServer = async (
  userId: string,
  accounts: FinancialAccount[],
  transactions: Transaction[],
  projects: LedgerProject[] = [],
  user?: UserProfile
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        user: user || getCurrentUser(),
        accounts,
        transactions,
        projects,
      }),
    });
    const data = await res.json();
    return { success: res.ok && data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

/**
 * Fetch latest data from Server / NAS
 */
export const fetchLatestDataFromServer = async (
  userId: string
): Promise<{ success: boolean; accounts?: FinancialAccount[]; transactions?: Transaction[]; projects?: LedgerProject[]; user?: UserProfile }> => {
  try {
    const res = await fetch(`/api/sync?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return { success: false };
    const data = await res.json();
    if (data && data.success) {
      const localAccs = getAccounts(userId);
      const localTxs = getTransactions(userId);
      const localProjs = getProjects(userId);

      // 双向智能合并，防止本地刚创建的项目被服务端空数组覆盖冲刷
      const serverAccs = Array.isArray(data.accounts) ? data.accounts : [];
      const serverTxs = Array.isArray(data.transactions) ? data.transactions : [];
      const serverProjs = Array.isArray(data.projects) ? data.projects : [];

      const finalAccs = mergeAccounts(localAccs, serverAccs);
      const finalTxs = mergeTransactions(localTxs, serverTxs);
      const finalProjs = mergeProjects(localProjs, serverProjs);

      localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(finalAccs));
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(finalTxs));
      localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${userId}`, JSON.stringify(finalProjs));

      // 若本地有云端尚无的新项目或数据，立即回写同步至服务端，确保云端永远保有全量
      if (
        finalProjs.length > serverProjs.length ||
        finalAccs.length > serverAccs.length ||
        finalTxs.length > serverTxs.length
      ) {
        syncDataToServer(userId, finalAccs, finalTxs, finalProjs, getCurrentUser() || undefined).catch(() => {});
      }

      if (data.user) {
        const users = getStoredUsers();
        const idx = users.findIndex((u) => u.id === userId || u.username.toLowerCase() === data.user.username?.toLowerCase());
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...data.user };
        } else {
          users.push(data.user);
        }
        saveUsers(users);
      }
      return {
        success: true,
        accounts: finalAccs,
        transactions: finalTxs,
        projects: finalProjs,
        user: data.user,
      };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
};


export const calculateSummary = (
  accounts: FinancialAccount[] = [],
  transactions: Transaction[] = []
): FinancialSummary => {
  let liquidAssets = 0;
  let investmentAssets = 0;
  let receivables = 0;
  let totalCreditLimit = 0;
  let totalUsedCredit = 0;
  let totalPayableDebts = 0;

  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  safeAccounts.forEach((acc) => {
    switch (acc.category) {
      case 'DEBIT_CARD':
      case 'ALIPAY':
      case 'WECHAT':
      case 'CASH':
        liquidAssets += acc.balance || 0;
        break;
      case 'YUEBAO':
      case 'FUND':
      case 'GOLD':
      case 'JD_FINANCE':
        investmentAssets += acc.balance || 0;
        break;
      case 'RECEIVABLE':
        if (!acc.isSettled) {
          receivables += acc.balance || 0;
        }
        break;
      case 'CREDIT_CARD':
      case 'JD_BAITIAO':
      case 'HUABEI':
        totalCreditLimit += acc.creditLimit || 0;
        totalUsedCredit += acc.usedCredit !== undefined ? acc.usedCredit : acc.balance || 0;
        break;
      case 'PAYABLE':
        if (!acc.isSettled) {
          totalPayableDebts += acc.balance || 0;
        }
        break;
    }
  });

  const totalAvailableCredit = Math.max(0, totalCreditLimit - totalUsedCredit);
  const creditUtilizationRate = totalCreditLimit > 0 ? (totalUsedCredit / totalCreditLimit) * 100 : 0;
  const totalLiabilities = totalUsedCredit + totalPayableDebts;
  
  // 核心计算：可用流动资金合计 = 基础流动资产 + 理财投资合计
  const totalAvailableFunds = liquidAssets + investmentAssets;

  // 核心计算：净资产 = 现有流动资产 + 投资理财资产 + 借出待收款
  // （信用卡借贷欠款与借入资金不计入净资产中，而是单独设立专区展示）
  const netWorth = liquidAssets + investmentAssets + receivables;

  // Calculate current month's expenses, refunds and income
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let monthGrossExpense = 0;
  let monthRefund = 0;
  let monthIncome = 0;
  let todayGrossExpense = 0;
  let todayRefund = 0;

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  safeTransactions.forEach((tx) => {
    if (tx.date) {
      if (tx.date.startsWith(currentYearMonth)) {
        if (tx.type === 'EXPENSE') {
          monthGrossExpense += tx.amount;
        } else if (tx.type === 'REFUND') {
          monthRefund += tx.amount;
        } else if (tx.type === 'INCOME') {
          monthIncome += tx.amount;
        }
      }
      if (tx.date === todayStr) {
        if (tx.type === 'EXPENSE') {
          todayGrossExpense += tx.amount;
        } else if (tx.type === 'REFUND') {
          todayRefund += tx.amount;
        }
      }
    }
  });

  // 净支出 = 原始支出 - 冲红退款
  const monthExpense = Math.max(0, monthGrossExpense - monthRefund);
  const todayExpense = Math.max(0, todayGrossExpense - todayRefund);
  const monthSavings = monthIncome - monthExpense;

  return {
    netWorth,
    liquidAssets,
    investmentAssets,
    totalAvailableFunds,
    receivables,
    totalCreditLimit,
    totalUsedCredit,
    totalAvailableCredit,
    creditUtilizationRate,
    totalPayableDebts,
    totalLiabilities,
    todayExpense,
    monthExpense,
    monthGrossExpense,
    monthRefund,
    monthIncome,
    monthSavings,
  };
};

export const addTransaction = (
  userId: string,
  tx: Omit<Transaction, 'id' | 'createdAt'>
): { transaction: Transaction; accounts: FinancialAccount[] } => {
  const accounts = getAccounts(userId);
  const transactions = getTransactions(userId);

  const newTx: Transaction = {
    ...tx,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  let updatedTransactions = [newTx, ...transactions];

  // If this is a REFUND linked to an original transaction, update original transaction's refund status
  if (newTx.type === 'REFUND' && newTx.refundedTxId) {
    updatedTransactions = updatedTransactions.map((t) => {
      if (t.id === newTx.refundedTxId) {
        const newRefunded = (t.refundedAmount || 0) + newTx.amount;
        return {
          ...t,
          refundedAmount: newRefunded,
          refundStatus: newRefunded >= t.amount ? ('FULL' as const) : ('PARTIAL' as const),
          refundIds: Array.from(new Set([...(t.refundIds || []), newTx.id])),
        };
      }
      return t;
    });
  }

  const updatedAccounts = applyTransactionToAccounts(accounts, newTx, false);
  const sorted = sortTransactions(updatedTransactions);

  saveAccounts(userId, updatedAccounts);
  saveTransactions(userId, sorted);

  return { transaction: newTx, accounts: updatedAccounts };
};

/**
 * 平账冲红专项方法：将已支出的账单进行部分或全额冲红退费
 */
export const reconcileRefund = (
  userId: string,
  originalTxId: string,
  refundParams: {
    amount: number;
    accountId: string;
    date: string;
    time?: string;
    reason?: string;
    description?: string;
  }
): {
  refundTransaction: Transaction;
  updatedTransactions: Transaction[];
  accounts: FinancialAccount[];
} => {
  const accounts = getAccounts(userId);
  const transactions = getTransactions(userId);
  const origTx = transactions.find((t) => t.id === originalTxId);

  if (!origTx) {
    throw new Error('未找到原支出账单');
  }

  const refundId = 'tx-refund-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const refundTx: Transaction = {
    id: refundId,
    type: 'REFUND',
    amount: refundParams.amount,
    date: refundParams.date,
    time: refundParams.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
    accountId: refundParams.accountId,
    category: origTx.category || '冲红退费',
    tag: '平账冲红',
    description:
      refundParams.description ||
      `退款平账: ${origTx.description || origTx.category} (冲红)`,
    merchant: origTx.merchant,
    createdAt: new Date().toISOString(),
    isRefund: true,
    refundedTxId: origTx.id,
    refundedTxDescription: origTx.description || origTx.category,
    refundedTxAmount: origTx.amount,
    refundReason: refundParams.reason || '售后退费平账',
  };

  const newRefundedTotal = (origTx.refundedAmount || 0) + refundParams.amount;
  const newStatus = newRefundedTotal >= origTx.amount ? ('FULL' as const) : ('PARTIAL' as const);

  const updatedTransactions = transactions.map((t) => {
    if (t.id === originalTxId) {
      return {
        ...t,
        refundedAmount: newRefundedTotal,
        refundStatus: newStatus,
        refundIds: Array.from(new Set([...(t.refundIds || []), refundId])),
      };
    }
    return t;
  });

  updatedTransactions.unshift(refundTx);

  const updatedAccounts = applyTransactionToAccounts(accounts, refundTx, false);
  const sorted = sortTransactions(updatedTransactions);

  saveAccounts(userId, updatedAccounts);
  saveTransactions(userId, sorted);

  return {
    refundTransaction: refundTx,
    updatedTransactions: sorted,
    accounts: updatedAccounts,
  };
};

export const updateTransaction = (
  userId: string,
  updatedTx: Transaction
): { transactions: Transaction[]; accounts: FinancialAccount[] } => {
  const accounts = getAccounts(userId);
  const transactions = getTransactions(userId);
  const oldTx = transactions.find((t) => t.id === updatedTx.id);

  let updatedAccounts = [...accounts];
  // If old transaction existed, revert its effects
  if (oldTx) {
    updatedAccounts = applyTransactionToAccounts(updatedAccounts, oldTx, true);
  }
  // Apply new transaction effects
  updatedAccounts = applyTransactionToAccounts(updatedAccounts, updatedTx, false);

  const updatedTransactions = sortTransactions(
    transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t))
  );

  saveAccounts(userId, updatedAccounts);
  saveTransactions(userId, updatedTransactions);

  return { transactions: updatedTransactions, accounts: updatedAccounts };
};

const applyTransactionToAccounts = (
  accounts: FinancialAccount[],
  tx: Transaction,
  isRevert: boolean
): FinancialAccount[] => {
  const multiplier = isRevert ? -1 : 1;
  const delta = tx.amount * multiplier;

  return accounts.map((acc) => {
    // Main account
    if (acc.id === tx.accountId) {
      if (tx.type === 'EXPENSE') {
        if (acc.category === 'CREDIT_CARD' || acc.category === 'JD_BAITIAO' || acc.category === 'HUABEI') {
          const newUsed = Math.max(0, (acc.usedCredit || 0) + delta);
          return { ...acc, usedCredit: newUsed, balance: newUsed, updatedAt: new Date().toISOString() };
        } else {
          return { ...acc, balance: (acc.balance || 0) - delta, updatedAt: new Date().toISOString() };
        }
      } else if (tx.type === 'REFUND') {
        // 平账冲红 / 退费：款项退回到该账户 (支出的反向操作)
        if (acc.category === 'CREDIT_CARD' || acc.category === 'JD_BAITIAO' || acc.category === 'HUABEI') {
          // 信用卡/白条收到退款冲红：减少已用欠款，恢复信用额度
          const newUsed = Math.max(0, (acc.usedCredit || 0) - delta);
          return { ...acc, usedCredit: newUsed, balance: newUsed, updatedAt: new Date().toISOString() };
        } else {
          // 借记卡/支付宝/微信/现金收到退款：增加可用余额
          return { ...acc, balance: (acc.balance || 0) + delta, updatedAt: new Date().toISOString() };
        }
      } else if (tx.type === 'INCOME') {
        return { ...acc, balance: (acc.balance || 0) + delta, updatedAt: new Date().toISOString() };
      } else if (['TRANSFER', 'REPAYMENT', 'LEND_OUT', 'PAY_BORROW'].includes(tx.type)) {
        return { ...acc, balance: (acc.balance || 0) - delta, updatedAt: new Date().toISOString() };
      } else if (tx.type === 'COLLECT_LENT') {
        const rem = Math.max(0, (acc.balance || 0) - delta);
        return { ...acc, balance: rem, isSettled: rem === 0, updatedAt: new Date().toISOString() };
      } else if (tx.type === 'BORROW_IN') {
        return { ...acc, balance: (acc.balance || 0) + delta, updatedAt: new Date().toISOString() };
      }
    }

    // Target account
    if (acc.id === tx.targetAccountId) {
      if (tx.type === 'TRANSFER') {
        return { ...acc, balance: (acc.balance || 0) + delta, updatedAt: new Date().toISOString() };
      } else if (tx.type === 'REPAYMENT') {
        if (acc.category === 'CREDIT_CARD' || acc.category === 'JD_BAITIAO' || acc.category === 'HUABEI') {
          const newUsed = Math.max(0, (acc.usedCredit || 0) - delta);
          return { ...acc, usedCredit: newUsed, balance: newUsed, updatedAt: new Date().toISOString() };
        } else if (acc.category === 'PAYABLE') {
          const rem = Math.max(0, (acc.balance || 0) - delta);
          return { ...acc, balance: rem, isSettled: rem === 0, updatedAt: new Date().toISOString() };
        }
      } else if (tx.type === 'COLLECT_LENT') {
        return { ...acc, balance: (acc.balance || 0) + delta, updatedAt: new Date().toISOString() };
      } else if (tx.type === 'LEND_OUT') {
        if (acc.category === 'RECEIVABLE') {
          return { ...acc, balance: (acc.balance || 0) + delta, isSettled: false, updatedAt: new Date().toISOString() };
        }
      } else if (tx.type === 'BORROW_IN') {
        if (acc.category === 'PAYABLE') {
          return { ...acc, balance: (acc.balance || 0) + delta, isSettled: false, updatedAt: new Date().toISOString() };
        }
      }
    }

    return acc;
  });
};

export const updateAccountBalanceDirectly = (
  userId: string,
  accountId: string,
  updates: Partial<FinancialAccount>
): FinancialAccount[] => {
  const accounts = getAccounts(userId);
  const updated = accounts.map((acc) => {
    if (acc.id === accountId) {
      return {
        ...acc,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return acc;
  });
  saveAccounts(userId, updated);
  return updated;
};

export const clearAllUserData = (userId: string) => {
  saveAccounts(userId, []);
  saveTransactions(userId, []);
};

export const deleteTransaction = (
  userId: string,
  txId: string
): { transactions: Transaction[]; accounts: FinancialAccount[] } => {
  const accounts = getAccounts(userId);
  const transactions = getTransactions(userId);
  const targetTx = transactions.find((t) => t.id === txId);

  if (!targetTx) {
    return { transactions, accounts };
  }

  // Revert account balances
  const updatedAccounts = applyTransactionToAccounts(accounts, targetTx, true);

  // If this was a REFUND transaction linked to an original transaction, restore original transaction
  let updatedTransactions = transactions.filter((t) => t.id !== txId);
  if (targetTx.type === 'REFUND' && targetTx.refundedTxId) {
    updatedTransactions = updatedTransactions.map((t) => {
      if (t.id === targetTx.refundedTxId) {
        const remainingRefunded = Math.max(0, (t.refundedAmount || 0) - targetTx.amount);
        const remainingIds = (t.refundIds || []).filter((id) => id !== txId);
        return {
          ...t,
          refundedAmount: remainingRefunded,
          refundStatus:
            remainingRefunded === 0
              ? ('NONE' as const)
              : remainingRefunded >= t.amount
              ? ('FULL' as const)
              : ('PARTIAL' as const),
          refundIds: remainingIds,
        };
      }
      return t;
    });
  }

  saveAccounts(userId, updatedAccounts);
  saveTransactions(userId, updatedTransactions);
  return { transactions: updatedTransactions, accounts: updatedAccounts };
};

export const isAppLocked = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.IS_LOCKED) === 'true';
};

export const setAppLocked = (locked: boolean) => {
  localStorage.setItem(STORAGE_KEYS.IS_LOCKED, locked ? 'true' : 'false');
};

export const resetToDemoData = (userId: string) => {
  saveAccounts(userId, INITIAL_DEMO_ACCOUNTS);
  saveTransactions(userId, INITIAL_DEMO_TRANSACTIONS);
};
