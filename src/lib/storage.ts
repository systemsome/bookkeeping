import { FinancialAccount, Transaction, UserProfile, FinancialSummary, AccountCategory, LedgerProject, ProjectFinancialStats, RecurringTask, QuickTemplate, DeletedTransaction } from '../types';
import { INITIAL_DEMO_ACCOUNTS, INITIAL_DEMO_TRANSACTIONS, INITIAL_DEMO_PROJECTS, INITIAL_DEMO_RECURRING_TASKS, DEFAULT_QUICK_TEMPLATES } from './constants';
import { matchBestCardentifyPreset, matchBestCardentifyCard } from './cardentifyPresets';
import { matchLogoHubBank } from './logohubData';
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
  RECURRING_TASKS_PREFIX: 'asset_manager_recurring_tasks_',
  TRASH_PREFIX: 'asset_manager_trash_txs_',
  TEMPLATES_PREFIX: 'asset_manager_quick_templates_',
  IS_LOCKED: 'asset_manager_is_locked_v1',
  LAST_ACTIVITY: 'asset_manager_last_act_v1',
  DEVICE_ID: 'asset_manager_device_id_v1',
  LAST_UPDATED_PREFIX: 'asset_manager_last_upd_',
};

export const setLocalLastUpdated = (userId: string, timestamp?: string): string => {
  const ts = timestamp || new Date().toISOString();
  try {
    localStorage.setItem(`${STORAGE_KEYS.LAST_UPDATED_PREFIX}${userId}`, ts);
  } catch {}
  return ts;
};

export const getLocalLastUpdated = (userId: string): string => {
  try {
    return localStorage.getItem(`${STORAGE_KEYS.LAST_UPDATED_PREFIX}${userId}`) || '';
  } catch {
    return '';
  }
};

export const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  } catch {
    return 'dev-temp-' + Date.now();
  }
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
export const triggerAutoServerSync = (userId: string, immediate = true) => {
  if (!userId) return;
  if (syncTimeout) clearTimeout(syncTimeout);

  const executeSync = async () => {
    const accounts = getAccounts(userId);
    const transactions = getTransactions(userId);
    const projects = getProjects(userId);
    const recurringTasks = getRecurringTasks(userId);
    const user: UserProfile = getCurrentUser() || getStoredUsers().find((u) => u.id === userId) || {
      id: userId,
      username: 'user',
      displayName: 'User',
      passwordHash: '',
      autoLockMinutes: 15,
      privacyMode: false,
      lastLoginTime: new Date().toISOString(),
    };

    // 1. 同步至 Express / NAS 服务端持久化文件存储 (0ms立即推送到云端)
    try {
      await syncDataToServer(userId, accounts, transactions, projects, user, recurringTasks);
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
    syncTimeout = setTimeout(executeSync, 50);
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
    if (!Array.isArray(parsed)) return [];

    // Intelligently auto-populate Cardentify card faces only for fresh accounts with no card styling configured
    let needsResave = false;
    const enriched = parsed.map((acc: FinancialAccount) => {
      let updatedAcc = { ...acc };

      // Only auto-match card image if account has no cardImageUrl AND no custom skin/color/preset
      if (
        updatedAcc.cardImageUrl === undefined &&
        !updatedAcc.cardPresetId &&
        !updatedAcc.cardBgColor &&
        !updatedAcc.cardSkin
      ) {
        const matched = matchBestCardentifyCard(updatedAcc.name, updatedAcc.bankName, updatedAcc.category);
        if (matched) {
          needsResave = true;
          let net: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = 'UNIONPAY';
          const bUp = (matched.brand || '').toUpperCase();
          if (bUp.includes('VISA')) net = 'VISA';
          else if (bUp.includes('MASTER')) net = 'MASTERCARD';
          else if (bUp.includes('AMEX')) net = 'AMEX';
          else if (bUp.includes('JCB')) net = 'JCB';

          updatedAcc = {
            ...updatedAcc,
            cardImageUrl: matched.imageUrl,
            cardPresetId: `cardentify-${matched.id}`,
            cardNetwork: updatedAcc.cardNetwork && updatedAcc.cardNetwork !== 'NONE' ? updatedAcc.cardNetwork : net,
            bankName: updatedAcc.bankName || matched.issuerName,
            cardTier: updatedAcc.cardTier || (matched.name.includes('白金') ? '白金卡' : matched.name.includes('金卡') ? '金卡' : '标准卡'),
          };
        }
      }

      // Only auto-match preset if user has neither preset, pattern, skin, nor bg color
      if (!updatedAcc.cardPresetId && !updatedAcc.cardPattern && !updatedAcc.cardBgColor && !updatedAcc.cardSkin && !updatedAcc.cardImageUrl) {
        const preset = matchBestCardentifyPreset(updatedAcc.name, updatedAcc.bankName);
        if (preset) {
          needsResave = true;
          updatedAcc = {
            ...updatedAcc,
            cardPresetId: preset.id,
            cardPattern: preset.cardStyle.patternType || 'radial-sheen',
            cardTextColor: preset.textColorMode,
            cardBgColor: preset.cardStyle.background,
            cardTier: updatedAcc.cardTier || preset.cardTier,
            cardNetwork: updatedAcc.cardNetwork || preset.cardNetwork,
          };
        }
      }

      // Automatically enrich and correct LogoHub official bank vector logo
      const currentMatchedLogo = matchLogoHubBank(updatedAcc.bankName || updatedAcc.name);
      if (currentMatchedLogo?.logoUrl) {
        // If no logoUrl yet, or if it had the BOC mismatch bug, or if Yuebao had generic alipay logo
        const isBocBug =
          updatedAcc.bankLogoUrl?.includes('BOC.svg') &&
          !updatedAcc.bankName?.includes('中国银行') &&
          !updatedAcc.name?.includes('中国银行');
        const isYuebaoAlipayFallback =
          (updatedAcc.category === 'YUEBAO' || (updatedAcc.name || '').includes('余额宝')) &&
          updatedAcc.bankLogoUrl?.includes('alipay.svg');
        if (!updatedAcc.bankLogoUrl || isBocBug || isYuebaoAlipayFallback) {
          needsResave = true;
          updatedAcc = {
            ...updatedAcc,
            bankLogoUrl: currentMatchedLogo.logoUrl,
          };
        }
      }

      return updatedAcc;
    });

    if (needsResave) {
      try {
        localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(enriched));
      } catch {}
    }

    return enriched;
  } catch {
    return [];
  }
};

export const saveAccounts = (userId: string, accounts: FinancialAccount[]) => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(accounts || []));
    setLocalLastUpdated(userId);
  } catch (err) {
    console.warn('LocalStorage saveAccounts warning:', err);
  }
  triggerAutoServerSync(userId, true);
};

export const getTransactions = (userId: string): Transaction[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`);
    if (!raw) {
      if (userId === DEFAULT_DEMO_USER.id) {
        const sortedDemo = sortTransactions(INITIAL_DEMO_TRANSACTIONS);
        try {
          localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(sortedDemo));
        } catch {}
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
  try {
    localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(sorted));
    setLocalLastUpdated(userId);
  } catch (err) {
    console.warn('LocalStorage saveTransactions warning:', err);
  }
  triggerAutoServerSync(userId, true);
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
  try {
    localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${userId}`, JSON.stringify(projects));
    setLocalLastUpdated(userId);
  } catch (err) {
    console.warn('LocalStorage saveProjects warning:', err);
  }
  triggerAutoServerSync(userId, true);
};

export const getRecurringTasks = (userId: string): RecurringTask[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.RECURRING_TASKS_PREFIX}${userId}`);
    if (!raw) {
      if (userId === DEFAULT_DEMO_USER.id) {
        localStorage.setItem(
          `${STORAGE_KEYS.RECURRING_TASKS_PREFIX}${userId}`,
          JSON.stringify(INITIAL_DEMO_RECURRING_TASKS)
        );
        return INITIAL_DEMO_RECURRING_TASKS;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveRecurringTasks = (userId: string, tasks: RecurringTask[]) => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.RECURRING_TASKS_PREFIX}${userId}`, JSON.stringify(tasks));
  } catch (err) {
    console.warn('LocalStorage saveRecurringTasks warning:', err);
  }
  triggerAutoServerSync(userId, true);
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
  user?: UserProfile,
  recurringTasks?: RecurringTask[]
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        senderDeviceId: getDeviceId(),
        user: user || getCurrentUser(),
        accounts,
        transactions,
        projects,
        recurringTasks: Array.isArray(recurringTasks) ? recurringTasks : getRecurringTasks(userId),
      }),
    });
    const data = await res.json();
    return { success: res.ok && data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

/**
 * 跨端实时同步流 (已按用户需求关闭多端实时自动同步，避免本地与域名间数据覆盖冲突)
 * 本地数据作为唯一权威工作区，需要同步时由用户主动触发「全量云端双向同步」
 */
export const initRealtimeSyncStream = (
  _userId: string,
  _username: string | undefined,
  _onRemoteUpdate: (payload: {
    accounts: FinancialAccount[];
    transactions: Transaction[];
    projects: LedgerProject[];
    recurringTasks?: RecurringTask[];
    user?: UserProfile;
    lastUpdated?: string;
  }) => void
): (() => void) => {
  return () => {};
};

/**
 * Fetch latest data from Server / NAS
 */
export const fetchLatestDataFromServer = async (
  userId: string
): Promise<{ success: boolean; accounts?: FinancialAccount[]; transactions?: Transaction[]; projects?: LedgerProject[]; recurringTasks?: RecurringTask[]; user?: UserProfile; lastUpdated?: string }> => {
  try {
    const res = await fetch(`/api/sync?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return { success: false };
    const data = await res.json();
    if (data && data.success) {
      const serverAccs = Array.isArray(data.accounts) ? data.accounts : [];
      const serverTxs = Array.isArray(data.transactions) ? data.transactions : [];
      const serverProjs = Array.isArray(data.projects) ? data.projects : [];
      const serverRec = Array.isArray(data.recurringTasks) ? data.recurringTasks : [];
      const serverLastUpdated = data.lastUpdated || '';

      const localUpdated = getLocalLastUpdated(userId);
      const localAccs = getAccounts(userId);
      const localTxs = getTransactions(userId);
      const localProjs = getProjects(userId);

      // 核心判断逻辑：
      // 1. 如果当前端口/域名的本地缓存为空（例如在 localhost 记账后切换到自定义域名，新源首开），直接拉取服务端的最新全量数据
      // 2. 如果服务端时间戳严格晚于当前客户端记录的最后更新时间戳（说明用户在另一个端口或域名上进行了更新），直接无缝采用服务端的最新全量数据
      const isLocalEmpty = localAccs.length === 0 && localTxs.length === 0 && localProjs.length === 0;
      const isServerNewer = !!serverLastUpdated && (!localUpdated || serverLastUpdated > localUpdated);

      if (isServerNewer || (isLocalEmpty && (serverAccs.length > 0 || serverTxs.length > 0 || serverProjs.length > 0))) {
        localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(serverAccs));
        localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(serverTxs));
        localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${userId}`, JSON.stringify(serverProjs));
        localStorage.setItem(`${STORAGE_KEYS.RECURRING_TASKS_PREFIX}${userId}`, JSON.stringify(serverRec));
        if (serverLastUpdated) {
          setLocalLastUpdated(userId, serverLastUpdated);
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
          accounts: serverAccs,
          transactions: serverTxs,
          projects: serverProjs,
          recurringTasks: serverRec,
          user: data.user,
          lastUpdated: serverLastUpdated,
        };
      }

      // 如果当前本地已包含更新的数据，则以当前本地为主，并确保服务端也同步拥有最新全量
      if (localAccs.length > 0 || localTxs.length > 0 || localProjs.length > 0) {
        syncDataToServer(userId, localAccs, localTxs, localProjs, getCurrentUser() || undefined, getRecurringTasks(userId)).catch(() => {});
      }

      return {
        success: true,
        accounts: localAccs,
        transactions: localTxs,
        projects: localProjs,
        recurringTasks: getRecurringTasks(userId),
        user: data.user,
        lastUpdated: localUpdated || serverLastUpdated,
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
  saveProjects(userId, []);
  saveRecurringTasks(userId, []);
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

  // Push to trash before removing
  try {
    const trash = getTrashTransactions(userId);
    saveTrashTransactions(userId, [{ transaction: targetTx, deletedAt: new Date().toISOString() }, ...trash].slice(0, 60));
  } catch {}

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

export const deleteTransactionsBatch = (
  userId: string,
  txIds: string[]
): { transactions: Transaction[]; accounts: FinancialAccount[] } => {
  let accounts = getAccounts(userId);
  let transactions = getTransactions(userId);
  const idSet = new Set(txIds);
  const deletedItems: DeletedTransaction[] = [];

  // Roll back balances for all deleted transactions
  txIds.forEach((txId) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (targetTx) {
      accounts = applyTransactionToAccounts(accounts, targetTx, true);
      deletedItems.push({ transaction: targetTx, deletedAt: new Date().toISOString() });
    }
  });

  if (deletedItems.length > 0) {
    try {
      const trash = getTrashTransactions(userId);
      saveTrashTransactions(userId, [...deletedItems, ...trash].slice(0, 100));
    } catch {}
  }

  const updatedTransactions = transactions.filter((t) => !idSet.has(t.id));

  saveAccounts(userId, accounts);
  saveTransactions(userId, updatedTransactions);
  return { transactions: updatedTransactions, accounts };
};

// ==========================================
// 🗑️ 回收站与防误删回滚 (Trash & Undo)
// ==========================================
export const getTrashTransactions = (userId: string): DeletedTransaction[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.TRASH_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveTrashTransactions = (userId: string, list: DeletedTransaction[]) => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.TRASH_PREFIX}${userId}`, JSON.stringify(list));
  } catch {}
};

export const emptyTrash = (userId: string) => {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.TRASH_PREFIX}${userId}`);
  } catch {}
};

export const restoreFromTrash = (
  userId: string,
  txId: string
): { success: boolean; transactions: Transaction[]; accounts: FinancialAccount[] } => {
  const trash = getTrashTransactions(userId);
  const targetIndex = trash.findIndex((t) => t.transaction.id === txId);
  if (targetIndex < 0) {
    return { success: false, transactions: getTransactions(userId), accounts: getAccounts(userId) };
  }

  const restoredTx = trash[targetIndex].transaction;
  const updatedTrash = trash.filter((_, idx) => idx !== targetIndex);
  saveTrashTransactions(userId, updatedTrash);

  // 恢复账户余额
  let accounts = getAccounts(userId);
  let transactions = getTransactions(userId);
  accounts = applyTransactionToAccounts(accounts, restoredTx, false);
  transactions = sortTransactions([restoredTx, ...transactions]);

  saveAccounts(userId, accounts);
  saveTransactions(userId, transactions);
  return { success: true, transactions, accounts };
};

// ==========================================
// ⚡ 快捷记账模板 (Quick Transaction Templates)
// ==========================================
export const getQuickTemplates = (userId: string): QuickTemplate[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.TEMPLATES_PREFIX}${userId}`);
    if (!raw) {
      localStorage.setItem(`${STORAGE_KEYS.TEMPLATES_PREFIX}${userId}`, JSON.stringify(DEFAULT_QUICK_TEMPLATES));
      return DEFAULT_QUICK_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_QUICK_TEMPLATES;
  } catch {
    return DEFAULT_QUICK_TEMPLATES;
  }
};

export const saveQuickTemplates = (userId: string, templates: QuickTemplate[]) => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.TEMPLATES_PREFIX}${userId}`, JSON.stringify(templates));
  } catch {}
};

// ==========================================
// 🔄 周期性任务计算与一键/自动入账 (Recurring Execution)
// ==========================================
export const calculateNextDueDate = (task: RecurringTask, fromDateStr?: string): string => {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  if (isNaN(base.getTime())) return new Date().toISOString().split('T')[0];

  const next = new Date(base.getTime());
  if (task.frequency === 'DAILY') {
    next.setDate(next.getDate() + 1);
  } else if (task.frequency === 'WEEKLY') {
    next.setDate(next.getDate() + 7);
  } else if (task.frequency === 'MONTHLY') {
    const targetDay = task.dayOfMonth || base.getDate();
    next.setMonth(next.getMonth() + 1);
    const maxDays = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(targetDay, maxDays));
  } else if (task.frequency === 'YEARLY') {
    next.setFullYear(next.getFullYear() + 1);
  }

  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const executeRecurringTask = (
  userId: string,
  taskId: string
): { success: boolean; transaction?: Transaction; accounts?: FinancialAccount[]; updatedTasks?: RecurringTask[] } => {
  const tasks = getRecurringTasks(userId);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { success: false };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 创建流水
  const { accounts: updatedAccounts, transaction } = addTransaction(userId, {
    type: task.type,
    amount: task.amount,
    date: todayStr,
    time: timeStr,
    accountId: task.accountId,
    targetAccountId: task.targetAccountId,
    category: task.category,
    tag: task.tag || '周期固定',
    description: task.description || task.name,
    merchant: task.merchant,
    projectId: task.projectId,
  });

  const nextDate = calculateNextDueDate(task, todayStr);
  const updatedTasks = tasks.map((t) =>
    t.id === taskId
      ? { ...t, lastExecutedDate: todayStr, nextDueDate: nextDate, updatedAt: now.toISOString() }
      : t
  );

  saveRecurringTasks(userId, updatedTasks);
  return { success: true, transaction, accounts: updatedAccounts, updatedTasks };
};

export const batchUpdateTransactions = (
  userId: string,
  txIds: string[],
  updates: Partial<Transaction>
): Transaction[] => {
  const transactions = getTransactions(userId);
  const idSet = new Set(txIds);

  const updatedTransactions = transactions.map((t) => {
    if (idSet.has(t.id)) {
      return { ...t, ...updates };
    }
    return t;
  });

  saveTransactions(userId, updatedTransactions);
  return updatedTransactions;
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

