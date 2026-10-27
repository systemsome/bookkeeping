import { FinancialAccount, Transaction, UserProfile, FinancialSummary, AccountCategory, LedgerProject, ProjectFinancialStats, RecurringTask, QuickTemplate, DeletedTransaction, ExpenseCategory, IncomeCategory } from '../types';
import {
  INITIAL_DEMO_ACCOUNTS,
  INITIAL_DEMO_TRANSACTIONS,
  INITIAL_DEMO_PROJECTS,
  INITIAL_DEMO_RECURRING_TASKS,
  DEFAULT_QUICK_TEMPLATES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  DEFAULT_PRESET_TAGS,
} from './constants';
import { matchBestCardentifyPreset, matchBestCardentifyCard } from './cardentifyPresets';
import { matchLogoHubBank } from './logohubData';
import { sortTransactions } from './formatters';
import { mergeAccounts, mergeTransactions, mergeProjects } from './backup';
import { getStoredCloudflareConfig, saveCloudflareConfig, syncWithCloudflare } from './cloudflareSync';
import { getStoredWebDavConfig, saveWebDavConfig, uploadToWebDav } from './webdav';
import { getCustomCategoryIconMappings, saveAllCustomCategoryIconMappings } from '../components/CategoryIcon';


export const STORAGE_KEYS = {
  USERS: 'asset_manager_users_v1',
  CURRENT_USER_ID: 'asset_manager_curr_uid_v1',
  ACCOUNTS_PREFIX: 'asset_manager_accs_',
  TRANSACTIONS_PREFIX: 'asset_manager_txs_',
  PROJECTS_PREFIX: 'asset_manager_projs_',
  RECURRING_TASKS_PREFIX: 'asset_manager_recurring_tasks_',
  TRASH_PREFIX: 'asset_manager_trash_txs_',
  TEMPLATES_PREFIX: 'asset_manager_quick_templates_',
  // 统一用户 ID 命名空间下的记账类别、账户类别 (AccountCategory) 及分类标签
  ACCOUNT_CATEGORIES_PREFIX: 'asset_manager_account_cats_',
  EXPENSE_CATEGORIES_PREFIX: 'asset_manager_expense_cats_',
  INCOME_CATEGORIES_PREFIX: 'asset_manager_income_cats_',
  CATEGORY_ICONS_PREFIX: 'asset_manager_cat_icons_',
  CUSTOM_TAGS_PREFIX: 'asset_manager_custom_tags_',
  IS_LOCKED: 'asset_manager_is_locked_v1',
  LAST_ACTIVITY: 'asset_manager_last_act_v1',
  DEVICE_ID: 'asset_manager_device_id_v1',
  LAST_UPDATED_PREFIX: 'asset_manager_last_upd_',
};

// ==========================================
// 🏷️ 记账类别 (AccountCategory / 支出 / 收入 / 标签) 统一用户命名空间持久化
// ==========================================

export const normalizeExpenseCategories = (parsed: any[]): ExpenseCategory[] => {
  if (!Array.isArray(parsed) || parsed.length === 0) return [...EXPENSE_CATEGORIES];
  if (typeof parsed[0] === 'string') {
    return parsed.map((name: string, i: number) => ({
      id: `custom-exp-${i}-${name}`,
      name: name === '数码数码' ? '数码科技' : name,
      icon: name === '数码数码' ? 'Laptop' : name,
      color: '#f43f5e',
    }));
  }
  return parsed.map((cat: ExpenseCategory) => {
    if (cat.name === '数码数码') {
      return { ...cat, name: '数码科技', icon: 'Laptop' };
    }
    return cat;
  });
};

export const normalizeIncomeCategories = (parsed: any[]): IncomeCategory[] => {
  if (!Array.isArray(parsed) || parsed.length === 0) return [...INCOME_CATEGORIES];
  if (typeof parsed[0] === 'string') {
    return parsed.map((name: string, i: number) => ({
      id: `custom-inc-${i}-${name}`,
      name,
      icon: name,
      color: '#10b981',
    }));
  }
  return parsed;
};

/**
 * 获取与用户 ID 绑定的支出类别配置 (自动多重回退与向前平滑迁移)
 */
export const getStoredExpenseCategories = (userId?: string): ExpenseCategory[] => {
  const uid = userId || getCurrentUserId() || '';
  try {
    // 1. 优先读取统一命名空间: asset_manager_expense_cats_${userId}
    if (uid) {
      const unifiedRaw = localStorage.getItem(`${STORAGE_KEYS.EXPENSE_CATEGORIES_PREFIX}${uid}`);
      if (unifiedRaw) {
        const parsed = JSON.parse(unifiedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeExpenseCategories(parsed);
      }
      // 2. 兼容历史遗留带用户 ID 的键
      const legacyUserRaw = localStorage.getItem(`asset_vault_custom_user_categories_expense_v4_${uid}`);
      if (legacyUserRaw) {
        const parsed = JSON.parse(legacyUserRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = normalizeExpenseCategories(parsed);
          localStorage.setItem(`${STORAGE_KEYS.EXPENSE_CATEGORIES_PREFIX}${uid}`, JSON.stringify(normalized));
          return normalized;
        }
      }
    }
    // 3. 兼容未带 uid 的旧全局键并在有 uid 时自动迁移
    const globalRaw =
      localStorage.getItem('asset_vault_custom_user_categories_expense_v4') ||
      localStorage.getItem('asset_vault_custom_user_categories_expense_v3');
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = normalizeExpenseCategories(parsed);
        if (uid) {
          localStorage.setItem(`${STORAGE_KEYS.EXPENSE_CATEGORIES_PREFIX}${uid}`, JSON.stringify(normalized));
        }
        return normalized;
      }
    }
    return [...EXPENSE_CATEGORIES];
  } catch {
    return [...EXPENSE_CATEGORIES];
  }
};

/**
 * 持久化保存支出类别配置到用户统一命名空间
 */
export const saveStoredExpenseCategories = (categories: ExpenseCategory[], userId?: string): void => {
  const uid = userId || getCurrentUserId() || '';
  try {
    const serialized = JSON.stringify(categories);
    if (uid) {
      localStorage.setItem(`${STORAGE_KEYS.EXPENSE_CATEGORIES_PREFIX}${uid}`, serialized);
      localStorage.setItem(`asset_vault_custom_user_categories_expense_v4_${uid}`, serialized);
    }
    localStorage.setItem('asset_vault_custom_user_categories_expense_v4', serialized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('asset_vault_categories_changed', { detail: { type: 'EXPENSE', userId: uid } })
      );
    }
  } catch (e) {
    console.warn('Failed to save expense categories:', e);
  }
};

/**
 * 获取与用户 ID 绑定的收入类别配置
 */
export const getStoredIncomeCategories = (userId?: string): IncomeCategory[] => {
  const uid = userId || getCurrentUserId() || '';
  try {
    if (uid) {
      const unifiedRaw = localStorage.getItem(`${STORAGE_KEYS.INCOME_CATEGORIES_PREFIX}${uid}`);
      if (unifiedRaw) {
        const parsed = JSON.parse(unifiedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeIncomeCategories(parsed);
      }
      const legacyUserRaw = localStorage.getItem(`asset_vault_custom_user_categories_income_v4_${uid}`);
      if (legacyUserRaw) {
        const parsed = JSON.parse(legacyUserRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = normalizeIncomeCategories(parsed);
          localStorage.setItem(`${STORAGE_KEYS.INCOME_CATEGORIES_PREFIX}${uid}`, JSON.stringify(normalized));
          return normalized;
        }
      }
    }
    const globalRaw =
      localStorage.getItem('asset_vault_custom_user_categories_income_v4') ||
      localStorage.getItem('asset_vault_custom_user_categories_income_v3');
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = normalizeIncomeCategories(parsed);
        if (uid) {
          localStorage.setItem(`${STORAGE_KEYS.INCOME_CATEGORIES_PREFIX}${uid}`, JSON.stringify(normalized));
        }
        return normalized;
      }
    }
    return [...INCOME_CATEGORIES];
  } catch {
    return [...INCOME_CATEGORIES];
  }
};

/**
 * 持久化保存收入类别配置到用户统一命名空间
 */
export const saveStoredIncomeCategories = (categories: IncomeCategory[], userId?: string): void => {
  const uid = userId || getCurrentUserId() || '';
  try {
    const serialized = JSON.stringify(categories);
    if (uid) {
      localStorage.setItem(`${STORAGE_KEYS.INCOME_CATEGORIES_PREFIX}${uid}`, serialized);
      localStorage.setItem(`asset_vault_custom_user_categories_income_v4_${uid}`, serialized);
    }
    localStorage.setItem('asset_vault_custom_user_categories_income_v4', serialized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('asset_vault_categories_changed', { detail: { type: 'INCOME', userId: uid } })
      );
    }
  } catch (e) {
    console.warn('Failed to save income categories:', e);
  }
};

/**
 * 获取与用户 ID 绑定的记账类别 / 账户类别 (AccountCategory) 配置
 */
export const getStoredAccountCategories = (userId?: string): Record<string, any> | null => {
  const uid = userId || getCurrentUserId() || '';
  try {
    if (uid) {
      const unifiedRaw = localStorage.getItem(`${STORAGE_KEYS.ACCOUNT_CATEGORIES_PREFIX}${uid}`);
      if (unifiedRaw) return JSON.parse(unifiedRaw);

      const legacyUserRaw = localStorage.getItem(`asset_vault_custom_account_categories_${uid}`);
      if (legacyUserRaw) {
        const parsed = JSON.parse(legacyUserRaw);
        localStorage.setItem(`${STORAGE_KEYS.ACCOUNT_CATEGORIES_PREFIX}${uid}`, JSON.stringify(parsed));
        return parsed;
      }
    }
    const globalRaw = localStorage.getItem('asset_vault_custom_account_categories');
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (uid) {
        localStorage.setItem(`${STORAGE_KEYS.ACCOUNT_CATEGORIES_PREFIX}${uid}`, JSON.stringify(parsed));
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * 持久化保存记账类别 / 账户类别 (AccountCategory) 配置到用户统一命名空间
 */
export const saveStoredAccountCategories = (config: Record<string, any>, userId?: string): void => {
  const uid = userId || getCurrentUserId() || '';
  try {
    const serialized = JSON.stringify(config || {});
    if (uid) {
      localStorage.setItem(`${STORAGE_KEYS.ACCOUNT_CATEGORIES_PREFIX}${uid}`, serialized);
      localStorage.setItem(`asset_vault_custom_account_categories_${uid}`, serialized);
    }
    localStorage.setItem('asset_vault_custom_account_categories', serialized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('asset_vault_categories_changed', { detail: { type: 'ACCOUNT_CATEGORIES', userId: uid } })
      );
    }
  } catch (e) {
    console.warn('Failed to save account categories config:', e);
  }
};

/**
 * 获取与用户 ID 绑定的自定义标签
 */
export const getStoredCustomTags = (userId?: string): string[] => {
  const uid = userId || getCurrentUserId() || '';
  try {
    if (uid) {
      const unifiedRaw = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_TAGS_PREFIX}${uid}`);
      if (unifiedRaw) {
        const parsed = JSON.parse(unifiedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...DEFAULT_PRESET_TAGS, ...parsed]));
        }
      }
      const legacyUserRaw = localStorage.getItem(`asset_vault_custom_user_tags_${uid}`);
      if (legacyUserRaw) {
        const parsed = JSON.parse(legacyUserRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = Array.from(new Set([...DEFAULT_PRESET_TAGS, ...parsed]));
          localStorage.setItem(`${STORAGE_KEYS.CUSTOM_TAGS_PREFIX}${uid}`, JSON.stringify(merged));
          return merged;
        }
      }
    }
    const globalRaw = localStorage.getItem('asset_vault_custom_user_tags');
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = Array.from(new Set([...DEFAULT_PRESET_TAGS, ...parsed]));
        if (uid) {
          localStorage.setItem(`${STORAGE_KEYS.CUSTOM_TAGS_PREFIX}${uid}`, JSON.stringify(merged));
        }
        return merged;
      }
    }
    return [...DEFAULT_PRESET_TAGS];
  } catch {
    return [...DEFAULT_PRESET_TAGS];
  }
};

/**
 * 持久化保存自定义标签到用户统一命名空间
 */
export const saveStoredCustomTags = (tags: string[], userId?: string): void => {
  const uid = userId || getCurrentUserId() || '';
  try {
    const serialized = JSON.stringify(tags);
    if (uid) {
      localStorage.setItem(`${STORAGE_KEYS.CUSTOM_TAGS_PREFIX}${uid}`, serialized);
      localStorage.setItem(`asset_vault_custom_user_tags_${uid}`, serialized);
    }
    localStorage.setItem('asset_vault_custom_user_tags', serialized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('asset_vault_categories_changed', { detail: { type: 'CUSTOM_TAGS', userId: uid } })
      );
    }
  } catch (e) {
    console.warn('Failed to save custom tags:', e);
  }
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

/**
 * Auto-Discovery Guard:
 * Scans transactions and automatically adds any missing custom categories to user-stored categories.
 * This ensures historical transactions or transactions synced from other origins never downgrade to "其他".
 */
export const autoDiscoverCategoriesFromTransactions = (transactions: Transaction[], userId: string) => {
  if (!transactions || !transactions.length || !userId) return;
  try {
    const expenseCats = getStoredExpenseCategories(userId);
    const existingExpenseNames = new Set(expenseCats.map((c) => c.name.trim()));
    let hasNewExpense = false;

    const incomeCats = getStoredIncomeCategories(userId);
    const existingIncomeNames = new Set(incomeCats.map((c) => c.name.trim()));
    let hasNewIncome = false;

    transactions.forEach((tx) => {
      // 1. Expense categories
      if (tx.type === 'EXPENSE' || tx.type === 'REFUND') {
        const catName = tx.category?.trim();
        if (catName && catName !== '其他' && catName !== '其他杂项' && !existingExpenseNames.has(catName)) {
          expenseCats.push({
            id: `custom-exp-discovered-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: catName,
            icon: catName,
            color: '#6366f1',
          });
          existingExpenseNames.add(catName);
          hasNewExpense = true;
        }

        // Split items
        if (Array.isArray(tx.splitItems)) {
          tx.splitItems.forEach((sp) => {
            const spCat = sp.category?.trim();
            if (spCat && spCat !== '其他' && spCat !== '其他杂项' && !existingExpenseNames.has(spCat)) {
              expenseCats.push({
                id: `custom-exp-discovered-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: spCat,
                icon: spCat,
                color: '#6366f1',
              });
              existingExpenseNames.add(spCat);
              hasNewExpense = true;
            }
          });
        }
      } else if (tx.type === 'INCOME') {
        const catName = tx.category?.trim();
        if (catName && catName !== '其他' && catName !== '其他收入' && !existingIncomeNames.has(catName)) {
          incomeCats.push({
            id: `custom-inc-discovered-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: catName,
            icon: catName,
            color: '#10b981',
          });
          existingIncomeNames.add(catName);
          hasNewIncome = true;
        }
      }
    });

    if (hasNewExpense) {
      saveStoredExpenseCategories(expenseCats, userId);
    }
    if (hasNewIncome) {
      saveStoredIncomeCategories(incomeCats, userId);
    }
  } catch (err) {
    console.warn('Auto-discovery categories error:', err);
  }
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
    const expenseCategories = getStoredExpenseCategories(userId);
    const incomeCategories = getStoredIncomeCategories(userId);
    const accountCategories = getStoredAccountCategories(userId);
    const categoryIconMappings = getCustomCategoryIconMappings(userId);
    const customTags = getStoredCustomTags(userId);
    const quickTemplates = getQuickTemplates(userId);
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
      await syncDataToServer(
        userId,
        accounts,
        transactions,
        projects,
        user,
        recurringTasks,
        expenseCategories,
        incomeCategories,
        categoryIconMappings,
        customTags,
        quickTemplates,
        accountCategories
      );
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
    const fetchRes = await fetchLatestDataFromServer(userId);
    const accounts = fetchRes.success && fetchRes.accounts ? fetchRes.accounts : getAccounts(userId);
    const transactions = fetchRes.success && fetchRes.transactions ? fetchRes.transactions : getTransactions(userId);
    const projects = fetchRes.success && fetchRes.projects ? fetchRes.projects : getProjects(userId);
    const recurringTasks = fetchRes.success && fetchRes.recurringTasks ? fetchRes.recurringTasks : getRecurringTasks(userId);
    const expenseCategories = getStoredExpenseCategories(userId);
    const incomeCategories = getStoredIncomeCategories(userId);
    const accountCategories = getStoredAccountCategories(userId);
    const categoryIconMappings = getCustomCategoryIconMappings(userId);
    const customTags = getStoredCustomTags(userId);
    const quickTemplates = getQuickTemplates(userId);

    // 2. 将合并后的全量数据持久化推送至服务端/NAS
    const serverRes = await syncDataToServer(
      userId,
      accounts,
      transactions,
      projects,
      user,
      recurringTasks,
      expenseCategories,
      incomeCategories,
      categoryIconMappings,
      customTags,
      quickTemplates,
      accountCategories
    );

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
    setLocalLastUpdated(userId);
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
    const recurringTasks: RecurringTask[] = data.recurringTasks || [];
    const expenseCategories: ExpenseCategory[] = data.expenseCategories || [];
    const incomeCategories: IncomeCategory[] = data.incomeCategories || [];
    const accountCategories = data.accountCategories || null;
    const categoryIconMappings: Record<string, string> = data.categoryIconMappings || {};
    const customTags: string[] = data.customTags || [];
    const quickTemplates: QuickTemplate[] = data.quickTemplates || [];

    // Cache to localStorage
    localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${user.id}`, JSON.stringify(accounts));
    localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(transactions));
    localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${user.id}`, JSON.stringify(projects));
    if (recurringTasks.length > 0) {
      localStorage.setItem(`${STORAGE_KEYS.RECURRING_TASKS_PREFIX}${user.id}`, JSON.stringify(recurringTasks));
    }
    if (expenseCategories.length > 0) {
      saveStoredExpenseCategories(expenseCategories, user.id);
    }
    if (incomeCategories.length > 0) {
      saveStoredIncomeCategories(incomeCategories, user.id);
    }
    if (accountCategories) {
      saveStoredAccountCategories(accountCategories, user.id);
    }
    if (categoryIconMappings && Object.keys(categoryIconMappings).length > 0) {
      saveAllCustomCategoryIconMappings(categoryIconMappings, user.id);
    }
    if (customTags.length > 0) {
      saveStoredCustomTags(customTags, user.id);
    }
    if (quickTemplates.length > 0) {
      saveQuickTemplates(user.id, quickTemplates);
    }
    autoDiscoverCategoriesFromTransactions(transactions, user.id);
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
  recurringTasks?: RecurringTask[],
  expenseCategories?: ExpenseCategory[],
  incomeCategories?: IncomeCategory[],
  categoryIconMappings?: Record<string, string>,
  customTags?: string[],
  quickTemplates?: QuickTemplate[],
  accountCategories?: Record<string, any> | null
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
        expenseCategories: Array.isArray(expenseCategories) ? expenseCategories : getStoredExpenseCategories(userId),
        incomeCategories: Array.isArray(incomeCategories) ? incomeCategories : getStoredIncomeCategories(userId),
        accountCategories: accountCategories || getStoredAccountCategories(userId),
        categoryIconMappings: categoryIconMappings || getCustomCategoryIconMappings(userId),
        customTags: Array.isArray(customTags) ? customTags : getStoredCustomTags(userId),
        quickTemplates: Array.isArray(quickTemplates) ? quickTemplates : getQuickTemplates(userId),
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
      const localRec = getRecurringTasks(userId);

      // 安全智能双向无损合并周期任务，优先保留已推进的下次到期日(nextDueDate)和最新更新时间
      // 防止服务端较旧的 nextDueDate 覆盖本地已执行完成的最新状态而导致循环重复添加
      const mergedRecMap = new Map<string, RecurringTask>();
      localRec.forEach((t) => mergedRecMap.set(t.id, t));

      serverRec.forEach((st) => {
        const lt = mergedRecMap.get(st.id);
        if (!lt) {
          mergedRecMap.set(st.id, st);
        } else {
          // 比较下次执行日期：推进到更晚日期的记录代表已完成执行，绝不能倒退回过去或今日
          const localDue = lt.nextDueDate || '';
          const serverDue = st.nextDueDate || '';
          const localUpdatedTime = lt.updatedAt || '';
          const serverUpdatedTime = st.updatedAt || '';

          if (localDue > serverDue) {
            mergedRecMap.set(st.id, lt);
          } else if (serverDue > localDue) {
            mergedRecMap.set(st.id, st);
          } else if (serverUpdatedTime > localUpdatedTime) {
            mergedRecMap.set(st.id, st);
          } else {
            mergedRecMap.set(st.id, lt);
          }
        }
      });
      const resolvedRec = mergedRecMap.size > 0 ? Array.from(mergedRecMap.values()) : serverRec;

      // 1. 同步服务端下发的自定义支出/收入分类、分类图标映射、标签、快捷模板、账户类别配置到本地
      if (Array.isArray(data.expenseCategories) && data.expenseCategories.length > 0) {
        saveStoredExpenseCategories(data.expenseCategories, userId);
      }
      if (Array.isArray(data.incomeCategories) && data.incomeCategories.length > 0) {
        saveStoredIncomeCategories(data.incomeCategories, userId);
      }
      if (data.accountCategories && typeof data.accountCategories === 'object') {
        saveStoredAccountCategories(data.accountCategories, userId);
      }
      if (data.categoryIconMappings && Object.keys(data.categoryIconMappings).length > 0) {
        saveAllCustomCategoryIconMappings(data.categoryIconMappings, userId);
      }
      if (Array.isArray(data.customTags) && data.customTags.length > 0) {
        saveStoredCustomTags(data.customTags, userId);
      }
      if (Array.isArray(data.quickTemplates) && data.quickTemplates.length > 0) {
        saveQuickTemplates(userId, data.quickTemplates);
      }

      // 2. 自动探测并补全新旧流水中的所有自定义分类，确保在任何端都不降级为“其他”
      autoDiscoverCategoriesFromTransactions([...serverTxs, ...localTxs], userId);

      // 核心判断逻辑：
      // 1. 如果当前端口/域名的本地缓存为空（例如在 localhost 记账后切换到自定义域名，新源首开），直接拉取服务端的最新全量数据
      // 2. 如果服务端时间戳严格晚于当前客户端记录的最后更新时间戳（说明用户在另一个端口或域名上进行了更新），直接无缝采用服务端的最新全量数据
      const isLocalEmpty = localAccs.length === 0 && localTxs.length === 0 && localProjs.length === 0;
      const isServerNewer = !!serverLastUpdated && (!localUpdated || serverLastUpdated > localUpdated);

      if (isServerNewer || (isLocalEmpty && (serverAccs.length > 0 || serverTxs.length > 0 || serverProjs.length > 0))) {
        localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS_PREFIX}${userId}`, JSON.stringify(serverAccs));
        localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(serverTxs));
        localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${userId}`, JSON.stringify(serverProjs));
        localStorage.setItem(`${STORAGE_KEYS.RECURRING_TASKS_PREFIX}${userId}`, JSON.stringify(resolvedRec));
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
          recurringTasks: resolvedRec,
          user: data.user,
          lastUpdated: serverLastUpdated,
        };
      }

      // 如果当前本地已包含更新的数据，则以当前本地为主，并确保服务端也同步拥有最新全量
      if (localAccs.length > 0 || localTxs.length > 0 || localProjs.length > 0) {
        syncDataToServer(userId, localAccs, localTxs, localProjs, getCurrentUser() || undefined, resolvedRec).catch(() => {});
      }

      return {
        success: true,
        accounts: localAccs,
        transactions: localTxs,
        projects: localProjs,
        recurringTasks: resolvedRec,
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
export const calculateNextDueDate = (
  task: RecurringTask,
  fromDateStr?: string,
  forceAdvance: boolean = false
): string => {
  const todayIso = new Date().toISOString().split('T')[0];
  const refDateStr = fromDateStr || todayIso;
  const refDate = new Date(refDateStr);
  const now = isNaN(refDate.getTime()) ? new Date() : refDate;

  const y = now.getFullYear();
  const m = now.getMonth(); // 0-11
  const freq = task.frequency || 'MONTHLY';

  if (freq === 'MONTHLY') {
    const targetDay = Math.max(1, Math.min(31, task.dayOfMonth || 1));

    // 计算当月的目标日期 (若当月总天数不足 targetDay 则取当月最后一天，如 2 月 28/29 日)
    const daysInThisMonth = new Date(y, m + 1, 0).getDate();
    const actualDayThisMonth = Math.min(targetDay, daysInThisMonth);
    const candidateThisMonth = `${y}-${String(m + 1).padStart(2, '0')}-${String(actualDayThisMonth).padStart(2, '0')}`;

    // 计算次月的目标日期
    const nextMonthObj = new Date(y, m + 1, 1);
    const nextY = nextMonthObj.getFullYear();
    const nextM = nextMonthObj.getMonth();
    const daysInNextMonth = new Date(nextY, nextM + 1, 0).getDate();
    const actualDayNextMonth = Math.min(targetDay, daysInNextMonth);
    const candidateNextMonth = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(actualDayNextMonth).padStart(2, '0')}`;

    // 核心判定：
    // 1. 如果强制推入下一周期 (forceAdvance，例如刚执行过记账)，或者今天已执行过该任务，推入次月
    if (forceAdvance || (task.lastExecutedDate && task.lastExecutedDate >= candidateThisMonth)) {
      return candidateNextMonth;
    }

    // 2. 如果当月目标日期在今天之后，说明本月还没有到执行日，取本月目标日 (例如今天是 25 号，修改为 28 号执行)
    if (candidateThisMonth > todayIso) {
      return candidateThisMonth;
    }

    // 3. 如果当月目标日期就是今天，且今天尚未执行过，则今日即为执行日
    if (candidateThisMonth === todayIso) {
      if (task.lastExecutedDate !== todayIso) {
        return candidateThisMonth;
      }
      return candidateNextMonth;
    }

    // 4. 如果当月目标日期已在今天之前 (例如今天是 25 号，修改为 5 号或 20 号执行)，说明本月已过，取次月
    return candidateNextMonth;
  }

  if (freq === 'DAILY') {
    if (forceAdvance || task.lastExecutedDate === todayIso) {
      const tomorrow = new Date(now.getTime() + 86400000);
      return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    }
    return todayIso;
  }

  if (freq === 'WEEKLY') {
    if (forceAdvance || task.lastExecutedDate === todayIso) {
      const nextWeek = new Date(now.getTime() + 7 * 86400000);
      return `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
    }
    if (task.nextDueDate && task.nextDueDate >= todayIso) {
      return task.nextDueDate;
    }
    const nextWeek = new Date(now.getTime() + 7 * 86400000);
    return `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
  }

  if (freq === 'YEARLY') {
    const candidateThisYear = `${y}-01-01`;
    if (forceAdvance || candidateThisYear <= todayIso) {
      return `${y + 1}-01-01`;
    }
    return candidateThisYear;
  }

  return todayIso;
};

export const executeRecurringTask = (
  userId: string,
  taskId: string,
  force: boolean = false
): {
  success: boolean;
  transaction?: Transaction;
  accounts?: FinancialAccount[];
  updatedTasks?: RecurringTask[];
  alreadyExecuted?: boolean;
} => {
  const tasks = getRecurringTasks(userId);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { success: false };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-10"
  const currentYearStr = todayStr.substring(0, 4);

  // 1. 严格幂等性检查与防重复添加过滤
  const existingTxs = getTransactions(userId);
  const isDuplicate = !force && existingTxs.some((tx) => {
    // 优先通过关联的 recurringTaskId 进行精准识别
    if (tx.recurringTaskId === task.id) {
      if (task.frequency === 'DAILY') return tx.date === todayStr;
      if (task.frequency === 'MONTHLY') return tx.date.startsWith(currentMonthStr) || tx.date === task.nextDueDate;
      if (task.frequency === 'YEARLY') return tx.date.startsWith(currentYearStr) || tx.date === task.nextDueDate;
      if (task.frequency === 'WEEKLY') {
        const diffDays = Math.abs((new Date(todayStr).getTime() - new Date(tx.date).getTime()) / 86400000);
        return diffDays < 6 || tx.date === task.nextDueDate;
      }
    }

    // 针对旧历史未打标签的记录，通过核心交易特征做智能去重识别
    const matchDesc = (tx.description || '').trim() === (task.description || task.name || '').trim();
    const matchAcc = tx.accountId === task.accountId;
    const matchAmount = Math.abs(tx.amount - task.amount) < 0.001;
    const matchTag = tx.tag === (task.tag || '周期固定') || tx.tag === '周期固定';
    const matchType = tx.type === task.type;

    if (matchDesc && matchAcc && matchAmount && (matchTag || matchType)) {
      if (task.frequency === 'DAILY') return tx.date === todayStr;
      if (task.frequency === 'MONTHLY') return tx.date.startsWith(currentMonthStr) || tx.date === task.nextDueDate;
      if (task.frequency === 'YEARLY') return tx.date.startsWith(currentYearStr) || tx.date === task.nextDueDate;
      if (task.frequency === 'WEEKLY') {
        const diffDays = Math.abs((new Date(todayStr).getTime() - new Date(tx.date).getTime()) / 86400000);
        return diffDays < 6 || tx.date === task.nextDueDate;
      }
    }

    return false;
  });

  // 如果当前周期已存在对应流水，直接将下次执行日期推进到下一期，不再重复扣款入账
  if (isDuplicate) {
    const nextDate = calculateNextDueDate(task, todayStr, true);
    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? { ...t, lastExecutedDate: todayStr, nextDueDate: nextDate, updatedAt: now.toISOString() }
        : t
    );
    saveRecurringTasks(userId, updatedTasks);

    const currentAccs = getAccounts(userId);
    const currentProjs = getProjects(userId);
    syncDataToServer(userId, currentAccs, existingTxs, currentProjs, getCurrentUser() || undefined, updatedTasks).catch(() => {});

    return {
      success: true,
      alreadyExecuted: true,
      accounts: currentAccs,
      updatedTasks,
    };
  }

  // 2. 创建真实流水并扣减/增加账户资产
  const cycleTag = task.frequency === 'MONTHLY' ? currentMonthStr : task.frequency === 'YEARLY' ? currentYearStr : todayStr;
  const { accounts: updatedAccounts, transaction } = addTransaction(userId, {
    type: task.type,
    amount: task.amount,
    originalAmount: task.originalAmount,
    currency: task.currency || 'CNY',
    exchangeRate: task.exchangeRate,
    date: todayStr,
    time: timeStr,
    accountId: task.accountId,
    targetAccountId: task.targetAccountId,
    category: task.category,
    tag: task.tag || '周期固定',
    description: task.description || task.name,
    merchant: task.merchant,
    projectId: task.projectId,
    recurringTaskId: task.id,
    recurringTaskCycle: cycleTag,
  });

  const nextDate = calculateNextDueDate(task, todayStr, true);
  const updatedTasks = tasks.map((t) =>
    t.id === taskId
      ? { ...t, lastExecutedDate: todayStr, nextDueDate: nextDate, updatedAt: now.toISOString() }
      : t
  );

  saveRecurringTasks(userId, updatedTasks);

  // 3. 立即同步到服务端，防止并发拉取时拿到过期任务时间导致再次触发
  const latestTxs = getTransactions(userId);
  const currentProjs = getProjects(userId);
  syncDataToServer(userId, updatedAccounts, latestTxs, currentProjs, getCurrentUser() || undefined, updatedTasks).catch(() => {});

  return { success: true, transaction, accounts: updatedAccounts, updatedTasks, alreadyExecuted: false };
};

/**
 * 智能清理因历史重复触发而产生的冗余重复周期账单
 * 针对相同任务/相同内容在同一周期(同日/同月)内重复生成的流水，仅保留第一笔，将其余重复流水批量安全删除并回滚账户余额
 */
export const cleanDuplicateRecurringTransactions = (
  userId: string
): {
  cleanedCount: number;
  transactions: Transaction[];
  accounts: FinancialAccount[];
} => {
  const transactions = getTransactions(userId);
  const accounts = getAccounts(userId);
  const tasks = getRecurringTasks(userId);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const duplicateTxIds: string[] = [];
  const seenCycleKeys = new Set<string>();

  // 按创建时间升序排列，保留最早生成的那一笔真实合法凭证
  const sorted = [...transactions].sort((a, b) => (a.createdAt || a.date).localeCompare(b.createdAt || b.date));

  sorted.forEach((tx) => {
    let isRecurring = false;
    let cycleKey = '';

    if (tx.recurringTaskId) {
      isRecurring = true;
      const task = taskMap.get(tx.recurringTaskId);
      const freq = task?.frequency || 'MONTHLY';
      const period = freq === 'MONTHLY' ? tx.date.slice(0, 7) : freq === 'YEARLY' ? tx.date.slice(0, 4) : tx.date;
      cycleKey = `rec_id_${tx.recurringTaskId}_${period}`;
    } else if (tx.tag === '周期固定') {
      isRecurring = true;
      const period = tx.date.slice(0, 7);
      cycleKey = `rec_tag_${tx.description?.trim()}_${tx.accountId}_${tx.amount}_${period}`;
    }

    if (isRecurring && cycleKey) {
      if (seenCycleKeys.has(cycleKey)) {
        duplicateTxIds.push(tx.id);
        return;
      }
      seenCycleKeys.add(cycleKey);
    }
  });

  if (duplicateTxIds.length === 0) {
    return { cleanedCount: 0, transactions, accounts };
  }

  // 批量删除多余的重复流水并原路回滚资产账户余额
  const { transactions: finalTxs, accounts: finalAccs } = deleteTransactionsBatch(userId, duplicateTxIds);
  const projs = getProjects(userId);
  syncDataToServer(userId, finalAccs, finalTxs, projs, getCurrentUser() || undefined, tasks).catch(() => {});

  return {
    cleanedCount: duplicateTxIds.length,
    transactions: finalTxs,
    accounts: finalAccs,
  };
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
  saveProjects(userId, INITIAL_DEMO_PROJECTS);
  saveRecurringTasks(userId, INITIAL_DEMO_RECURRING_TASKS);
};

// Listen for category/tag changes and trigger immediate auto-sync
if (typeof window !== 'undefined') {
  window.addEventListener('asset_vault_categories_changed', (e: any) => {
    const uid = e?.detail?.userId || getCurrentUserId();
    if (uid) {
      triggerAutoServerSync(uid, true);
    }
  });
}


