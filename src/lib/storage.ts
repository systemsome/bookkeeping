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
    return JSON.parse(raw);
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

export const updateCurrentUser = (updates: Partial<UserProfile>): UserProfile | null => {
  const user = getCurrentUser();
  if (!user) return null;
  const updated: UserProfile = { ...user, ...updates };
  const users = getStoredUsers().map((u) => (u.id === user.id ? updated : u));
  saveUsers(users);
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
  const netWorth = liquidAssets + investmentAssets + receivables - totalLiabilities;

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
