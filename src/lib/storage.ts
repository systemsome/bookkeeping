import { FinancialAccount, Transaction, UserProfile, FinancialSummary, AccountCategory } from '../types';
import { INITIAL_DEMO_ACCOUNTS, INITIAL_DEMO_TRANSACTIONS } from './constants';

const STORAGE_KEYS = {
  USERS: 'asset_manager_users_v1',
  CURRENT_USER_ID: 'asset_manager_curr_uid_v1',
  ACCOUNTS_PREFIX: 'asset_manager_accs_',
  TRANSACTIONS_PREFIX: 'asset_manager_txs_',
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
  privacyMode: false,
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

// Debounce timer for auto-syncing with server
let syncTimeout: any = null;
export const triggerAutoServerSync = (userId: string) => {
  if (!userId) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    const accounts = getAccounts(userId);
    const transactions = getTransactions(userId);
    const user = getCurrentUser();
    syncDataToServer(userId, accounts, transactions, user || undefined).catch(() => {});
  }, 1000);
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
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveAccounts = (userId: string, accounts: FinancialAccount[]) => {
  localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(accounts));
  triggerAutoServerSync(userId);
};

export const getTransactions = (userId: string): Transaction[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`);
    if (!raw) {
      if (userId === DEFAULT_DEMO_USER.id) {
        localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(INITIAL_DEMO_TRANSACTIONS));
        return INITIAL_DEMO_TRANSACTIONS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveTransactions = (userId: string, transactions: Transaction[]) => {
  localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(transactions));
  triggerAutoServerSync(userId);
};

/**
 * Server Authentication: Register User
 */
export const registerUserOnline = async (
  username: string,
  displayName: string,
  password: string,
  pinCode: string
): Promise<{ success: boolean; user?: UserProfile; accounts?: FinancialAccount[]; transactions?: Transaction[]; error?: string }> => {
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
    setCurrentUserId(newUser.id);

    return {
      success: true,
      user: newUser,
      accounts: data.accounts || [],
      transactions: data.transactions || [],
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
    setCurrentUserId(newUser.id);

    return { success: true, user: newUser, accounts: [], transactions: [] };
  }
};

/**
 * Server Authentication: Login User (Cross-Device Enabled)
 */
export const loginUserOnline = async (
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; accounts?: FinancialAccount[]; transactions?: Transaction[]; error?: string }> => {
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

    // Cache to localStorage
    localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${user.id}`, JSON.stringify(accounts));
    localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(transactions));
    setCurrentUserId(user.id);

    return {
      success: true,
      user,
      accounts,
      transactions,
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
    return { success: true, user: foundUser, accounts: accs, transactions: txs };
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
): Promise<{ success: boolean; accounts?: FinancialAccount[]; transactions?: Transaction[]; user?: UserProfile }> => {
  try {
    const res = await fetch(`/api/sync?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return { success: false };
    const data = await res.json();
    if (data && data.success) {
      if (Array.isArray(data.accounts)) {
        localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(data.accounts));
      }
      if (Array.isArray(data.transactions)) {
        localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(data.transactions));
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
        accounts: data.accounts,
        transactions: data.transactions,
        user: data.user,
      };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
};


export const calculateSummary = (accounts: FinancialAccount[], transactions: Transaction[]): FinancialSummary => {
  let liquidAssets = 0;
  let investmentAssets = 0;
  let receivables = 0;
  let totalCreditLimit = 0;
  let totalUsedCredit = 0;
  let totalPayableDebts = 0;

  accounts.forEach((acc) => {
    switch (acc.category) {
      case 'DEBIT_CARD':
      case 'ALIPAY':
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
  
  // 核心计算：净资产 = 现有流动资产 + 投资理财资产 + 借出待收款
  // （信用卡借贷欠款与借入资金不计入净资产中，而是单独设立专区展示）
  const netWorth = liquidAssets + investmentAssets + receivables;

  // Calculate current month's expenses and income
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let monthExpense = 0;
  let monthIncome = 0;
  let todayExpense = 0;

  transactions.forEach((tx) => {
    if (tx.date) {
      if (tx.date.startsWith(currentYearMonth)) {
        if (tx.type === 'EXPENSE') {
          monthExpense += tx.amount;
        } else if (tx.type === 'INCOME') {
          monthIncome += tx.amount;
        }
      }
      if (tx.date === todayStr && tx.type === 'EXPENSE') {
        todayExpense += tx.amount;
      }
    }
  });

  const monthSavings = monthIncome - monthExpense;

  return {
    netWorth,
    liquidAssets,
    investmentAssets,
    receivables,
    totalCreditLimit,
    totalUsedCredit,
    totalAvailableCredit,
    creditUtilizationRate,
    totalPayableDebts,
    totalLiabilities,
    todayExpense,
    monthExpense,
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

  const updatedAccounts = applyTransactionToAccounts(accounts, newTx, false);
  const updatedTransactions = [newTx, ...transactions];

  saveAccounts(userId, updatedAccounts);
  saveTransactions(userId, updatedTransactions);

  return { transaction: newTx, accounts: updatedAccounts };
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

  const updatedTransactions = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));

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

export const deleteTransaction = (userId: string, txId: string): { transactions: Transaction[] } => {
  const transactions = getTransactions(userId);
  const updated = transactions.filter((t) => t.id !== txId);
  saveTransactions(userId, updated);
  return { transactions: updated };
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
