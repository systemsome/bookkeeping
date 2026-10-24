/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getCurrentUser,
  setCurrentUserId,
  getAccounts,
  saveAccounts,
  getTransactions,
  saveTransactions,
  calculateSummary,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsBatch,
  batchUpdateTransactions,
  updateAccountBalanceDirectly,
  clearAllUserData,
  isAppLocked,
  setAppLocked,
  updateCurrentUser,
  fetchLatestDataFromServer,
  getProjects,
  saveProjects,
  triggerAutoServerSync,
  executeFullCloudSync,
  initRealtimeSyncStream,
  getRecurringTasks,
  saveRecurringTasks,
  executeRecurringTask,
  getTrashTransactions,
  emptyTrash,
  restoreFromTrash,
} from './lib/storage';
import {
  UserProfile,
  FinancialAccount,
  Transaction,
  FinancialSummary,
  AccountCategory,
  TransactionType,
  LedgerProject,
  CloudSyncStatus,
  RecurringTask,
  DeletedTransaction,
} from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LockScreen } from './components/LockScreen';
import { OverviewCards } from './components/OverviewCards';
import { HomeExpenseDashboard } from './components/HomeExpenseDashboard';
import { CreditCardsSummary } from './components/CreditCardsSummary';
import { AccountsList } from './components/AccountsList';
import { TransactionLedger } from './components/TransactionLedger';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { ProjectEditorModal } from './components/ProjectEditorModal';
import { AnalyticsView } from './components/AnalyticsView';
import { TransactionModal } from './components/TransactionModal';
import { RepaymentModal } from './components/RepaymentModal';
import { AccountEditorModal } from './components/AccountEditorModal';
import { BatchReconcileModal } from './components/BatchReconcileModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { SyncBackupModal } from './components/SyncBackupModal';
import { CardentifyGalleryModal } from './components/CardentifyGalleryModal';
import { RecurringTasksModal } from './components/RecurringTasksModal';
import { TrashBinModal } from './components/TrashBinModal';
import { mergeAccounts, mergeTransactions, mergeProjects } from './lib/backup';
import { updateAccountsWithGoldPrice } from './lib/goldRates';
import { syncDualLibrariesOnline, fetchDualGalleryStats } from './lib/gallerySync';
import {
  ThemeMode,
  getStoredThemeMode,
  saveThemeMode,
  applyThemeToDocument,
} from './lib/theme';
import {
  CreditCard,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, sortTransactions } from './lib/formatters';

export default function App() {
  // Authentication & Lock state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isLocked, setIsLocked] = useState<boolean>(() => isAppLocked());
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    const user = getCurrentUser();
    if (user && typeof user.privacyMode === 'boolean') {
      return user.privacyMode;
    }
    return true; // 默认隐藏敏感金额
  });

  // Appearance Theme state (明亮 / 暗黑 / 跟随系统)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());

  useEffect(() => {
    applyThemeToDocument(themeMode);
    saveThemeMode(themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyThemeToDocument('system');
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, [themeMode]);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'credit' | 'transactions' | 'projects' | 'analytics'>('overview');

  // CardArt & Cardentify 卡面艺廊 与 卡面生态特别鸣谢 保持每10秒自动与官方网站双向实时同步
  useEffect(() => {
    let lastSyncTime = Date.now();

    // 初始启动时触发一次静默同步与数据统计
    syncDualLibrariesOnline(false).catch(() => {});
    fetchDualGalleryStats().catch(() => {});

    // 每10秒自动周期刷新一次，确保与 CardArt (cardart.cc) 及 Cardentify (cards.no2.ac) 双向实时同步
    const intervalId = setInterval(() => {
      lastSyncTime = Date.now();
      fetchDualGalleryStats().catch(() => {});
      syncDualLibrariesOnline(false).catch(() => {});
    }, 10 * 1000);

    // 页面切回前台时，若距离上次同步已超过10秒则主动同步最新卡面数据
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSyncTime >= 10 * 1000) {
        lastSyncTime = Date.now();
        fetchDualGalleryStats().catch(() => {});
        syncDualLibrariesOnline(false).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 当切换功能 Tab 时，自动滚动回页面顶部
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Main Data States
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<LedgerProject[]>([]);

  // Project Modals State
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<LedgerProject | null>(null);

  // Modals State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('EXPENSE');
  const [txModalAccountId, setTxModalAccountId] = useState<string | undefined>(undefined);
  const [txModalDefaultDate, setTxModalDefaultDate] = useState<string | undefined>(undefined);
  const [txModalProjectId, setTxModalProjectId] = useState<string | undefined>(undefined);
  const [txModalRefundedTxId, setTxModalRefundedTxId] = useState<string | undefined>(undefined);
  const [txModalSplitEnabled, setTxModalSplitEnabled] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayTargetAccountId, setRepayTargetAccountId] = useState<string | undefined>(undefined);
  const [repaySuggestedAmount, setRepaySuggestedAmount] = useState<number | undefined>(undefined);

  const [isAccEditorOpen, setIsAccEditorOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [defaultAccCategory, setDefaultAccCategory] = useState<AccountCategory>('DEBIT_CARD');

  const [isBatchReconcileOpen, setIsBatchReconcileOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // 🔄 Recurring Tasks & 🗑️ Trash Bin States
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [trashTransactions, setTrashTransactions] = useState<DeletedTransaction[]>([]);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [undoTxId, setUndoTxId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Cloud Sync Status (连接中、已同步、同步失败、离线模式)
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Load data whenever user changes (local storage is primary workspace, auto-hydrating with server)
  const loadUserData = useCallback((uid: string) => {
    // 1. 0ms 本地秒开展示
    const accs = getAccounts(uid);
    const txs = getTransactions(uid);
    const projs = getProjects(uid);
    const recs = getRecurringTasks(uid);
    const trash = getTrashTransactions(uid);
    setAccounts(accs);
    setTransactions(txs);
    setProjects(projs);
    setRecurringTasks(recs);
    setTrashTransactions(trash);

    // 自动扫描到期周期账单并自动入账 (针对开启 autoExecute 的规则)
    const todayStr = new Date().toISOString().split('T')[0];
    let executedCount = 0;
    let currAccs = accs;
    let currTxs = txs;
    let currTasks = recs;

    recs.forEach((task) => {
      if (task.enabled && task.autoExecute && task.nextDueDate <= todayStr) {
        const res = executeRecurringTask(uid, task.id);
        if (res.success && res.transaction && res.accounts && res.updatedTasks) {
          executedCount++;
          currAccs = res.accounts;
          currTxs = [res.transaction, ...currTxs];
          currTasks = res.updatedTasks;
        }
      }
    });

    if (executedCount > 0) {
      setAccounts(currAccs);
      setTransactions(sortTransactions(currTxs));
      setRecurringTasks(currTasks);
      showToast(`🔄 已自动执行入账 ${executedCount} 笔到期周期固定账单`);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');

    // 2. 查询本地持久化服务端
    fetchLatestDataFromServer(uid)
      .then((res) => {
        if (res.success && res.accounts && res.transactions) {
          setAccounts(res.accounts);
          setTransactions(res.transactions);
          setProjects(res.projects || []);
          if (res.recurringTasks) setRecurringTasks(res.recurringTasks);
        }
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      })
      .catch(() => {
        setSyncStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced');
      });
  }, [showToast]);

  // 手动触发全量双向同步
  const handleTriggerFullSync = useCallback(async () => {
    if (!currentUser) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      showToast('当前处于离线模式，数据已暂存本地，请检查网络连接');
      return;
    }

    setSyncStatus('syncing');
    showToast('正在触发全量云端双向同步...');

    try {
      const res = await executeFullCloudSync(currentUser.id);
      if (res.success) {
        // 重新拉取同步并合并后的本地完整数据集
        const accs = getAccounts(currentUser.id);
        const txs = getTransactions(currentUser.id);
        const projs = getProjects(currentUser.id);
        setAccounts(accs);
        setTransactions(txs);
        setProjects(projs);
        setSyncStatus('synced');
        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeStr);
        showToast(`全量云端同步完成（${timeStr}）`);
      } else {
        setSyncStatus('error');
        showToast(res.message || '云端同步失败，请检查网络或后端服务');
      }
    } catch {
      setSyncStatus('error');
      showToast('云端同步异常，请稍后重试');
    }
  }, [currentUser, showToast]);

  // 监听网络状态变更（在线 / 离线自动切换）
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      showToast('网络已重新连接，正在自动同步云端数据...');
      if (currentUser) {
        executeFullCloudSync(currentUser.id).then((res) => {
          if (res.success) {
            const accs = getAccounts(currentUser.id);
            const txs = getTransactions(currentUser.id);
            const projs = getProjects(currentUser.id);
            setAccounts(accs);
            setTransactions(txs);
            setProjects(projs);
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
          } else {
            setSyncStatus('error');
          }
        }).catch(() => setSyncStatus('error'));
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
      showToast('网络连接已断开，已无缝切换至离线模式（数据安全保存在本地）');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, showToast]);

  // Restore/Merge data from Cloudflare / WebDAV / JSON Backup
  const handleRestoreData = useCallback(
    (newAccounts: FinancialAccount[], newTransactions: Transaction[], isMerge: boolean, newProjects?: LedgerProject[]) => {
      if (!currentUser) return;
      let finalAccs = newAccounts;
      let finalTxs = newTransactions;
      let finalProjects = newProjects || [];

      if (isMerge) {
        finalAccs = mergeAccounts(accounts, newAccounts);
        finalTxs = mergeTransactions(transactions, newTransactions);
        if (newProjects && newProjects.length > 0) {
          finalProjects = mergeProjects(projects, newProjects);
        } else {
          finalProjects = projects;
        }
      }

      setAccounts(finalAccs);
      setTransactions(finalTxs);
      setProjects(finalProjects);
      saveAccounts(currentUser.id, finalAccs);
      saveTransactions(currentUser.id, finalTxs);
      saveProjects(currentUser.id, finalProjects);
    },
    [currentUser, accounts, transactions, projects]
  );

  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser.id);
      setPrivacyMode(currentUser.privacyMode || false);

      // 当用户在本地端口(localhost)与域名之间切换窗口时，自动无损刷新对应最新数据
      const handleTabVisibility = () => {
        if (document.visibilityState === 'visible') {
          loadUserData(currentUser.id);
        }
      };
      window.addEventListener('visibilitychange', handleTabVisibility);
      window.addEventListener('focus', handleTabVisibility);
      return () => {
        window.removeEventListener('visibilitychange', handleTabVisibility);
        window.removeEventListener('focus', handleTabVisibility);
      };
    }
  }, [currentUser, loadUserData]);

  // Compute summary metrics
  const summary: FinancialSummary = useMemo(() => {
    return calculateSummary(accounts, transactions);
  }, [accounts, transactions]);

  // Auto-lock timer effect
  useEffect(() => {
    if (!currentUser || isLocked || currentUser.autoLockMinutes <= 0) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
        setAppLocked(true);
      }, currentUser.autoLockMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser, isLocked]);

  // Handlers
  const handleLoginSuccess = (
    user: UserProfile,
    onlineAccounts?: FinancialAccount[],
    onlineTransactions?: Transaction[],
    onlineProjects?: LedgerProject[]
  ) => {
    setCurrentUserId(user.id);
    setCurrentUser(user);
    setIsLocked(false);
    setAppLocked(false);

    if (onlineAccounts !== undefined && onlineTransactions !== undefined) {
      setAccounts(onlineAccounts);
      setTransactions(onlineTransactions);
      const projs = onlineProjects || [];
      setProjects(projs);
      saveAccounts(user.id, onlineAccounts);
      saveTransactions(user.id, onlineTransactions);
      saveProjects(user.id, projs);
    } else {
      loadUserData(user.id);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setAppLocked(false);
  };

  const handleLock = () => {
    setIsLocked(true);
    setAppLocked(true);
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setCurrentUser(null);
    setIsLocked(false);
    setAppLocked(false);
  };

  const handleTogglePrivacy = (val: boolean) => {
    setPrivacyMode(val);
    if (currentUser) {
      updateCurrentUser({ privacyMode: val });
    }
  };

  const handleOpenNewTx = (
    type: string = 'EXPENSE',
    accountId?: string,
    defaultDate?: string,
    projectId?: string,
    splitEnabled?: boolean
  ) => {
    setEditingTransaction(null);
    setTxModalDefaultType(type as TransactionType);
    setTxModalAccountId(accountId);
    setTxModalDefaultDate(defaultDate);
    setTxModalProjectId(projectId);
    setTxModalRefundedTxId(undefined);
    setTxModalSplitEnabled(Boolean(splitEnabled));
    setIsTxModalOpen(true);
  };

  const handleRefundExpense = (tx: Transaction) => {
    setEditingTransaction(null);
    setTxModalDefaultType('REFUND');
    setTxModalRefundedTxId(tx.id);
    setTxModalAccountId(tx.accountId);
    setTxModalProjectId(tx.projectId);
    setTxModalSplitEnabled(false);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction, splitEnabled?: boolean) => {
    setEditingTransaction(tx);
    setTxModalDefaultType(tx.type);
    setTxModalAccountId(tx.accountId);
    setTxModalDefaultDate(tx.date);
    setTxModalProjectId(tx.projectId);
    setTxModalRefundedTxId(tx.refundedTxId);
    setTxModalSplitEnabled(
      splitEnabled !== undefined
        ? splitEnabled
        : Boolean(tx.splitItems && tx.splitItems.length > 0)
    );
    setIsTxModalOpen(true);
  };

  const handleOpenRepayment = (targetAccountId?: string, suggestedAmount?: number) => {
    setRepayTargetAccountId(targetAccountId);
    setRepaySuggestedAmount(suggestedAmount);
    setIsRepayModalOpen(true);
  };

  const handleOpenAddAccount = (category: AccountCategory = 'DEBIT_CARD', prefillAccount?: Partial<FinancialAccount>) => {
    if (prefillAccount) {
      setEditingAccount(prefillAccount as FinancialAccount);
    } else {
      setEditingAccount(null);
    }
    setDefaultAccCategory(category);
    setIsAccEditorOpen(true);
  };

  const handleOpenEditAccount = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setDefaultAccCategory(acc.category);
    setIsAccEditorOpen(true);
  };

  // Project CRUD handlers
  const handleSaveProject = (
    projectData: Omit<LedgerProject, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    let updatedProjects: LedgerProject[];
    if (existingId) {
      updatedProjects = projects.map((p) =>
        p.id === existingId
          ? { ...p, ...projectData, userId: currentUser.id, updatedAt: now }
          : p
      );
      showToast(`项目「${projectData.name}」已更新并同步到账号`);
    } else {
      const newProj: LedgerProject = {
        ...projectData,
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id, // 明确绑定当前用户账号ID
        createdAt: now,
        updatedAt: now,
      };
      updatedProjects = [newProj, ...projects];
      showToast(`账本「${projectData.name}」已创建`);
    }
    setProjects(updatedProjects);
    saveProjects(currentUser.id, updatedProjects);
    // 立即向服务端与云端发起全量持久化同步，无需等待
    triggerAutoServerSync(currentUser.id, true);
    setIsProjectEditorOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!currentUser) return;
    const target = projects.find((p) => p.id === projectId);
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    saveProjects(currentUser.id, updated);

    // Unlink transactions from the deleted project so they are safely kept in ledger
    let txUpdated = false;
    const updatedTxs = transactions.map((t) => {
      if (t.projectId === projectId) {
        txUpdated = true;
        return { ...t, projectId: undefined };
      }
      return t;
    });

    if (txUpdated) {
      setTransactions(updatedTxs);
      saveTransactions(currentUser.id, updatedTxs);
    }
    showToast(`账本「${target?.name || '未命名'}」已删除`);
  };

  const handleDirectSaveProject = (project: LedgerProject) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updated = projects.map((p) => (p.id === project.id ? { ...project, userId: currentUser.id, updatedAt: now } : p));
    setProjects(updated);
    saveProjects(currentUser.id, updated);
    triggerAutoServerSync(currentUser.id, true);
    showToast(`项目「${project.name}」状态已更新并同步云端`);
  };

  // Transaction submission (create or update)
  const handleSubmitTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (!currentUser) return;

    if (existingId) {
      const existingTx = transactions.find((t) => t.id === existingId);
      const updatedTx: Transaction = {
        ...txData,
        id: existingId,
        createdAt: existingTx?.createdAt || new Date().toISOString(),
      };
      const { transactions: updatedTransactions, accounts: updatedAccounts } = updateTransaction(
        currentUser.id,
        updatedTx
      );
      setAccounts(updatedAccounts);
      setTransactions(sortTransactions(updatedTransactions));
    } else {
      const { accounts: updatedAccounts, transaction } = addTransaction(currentUser.id, txData);
      setAccounts(updatedAccounts);
      setTransactions((prev) => sortTransactions([transaction, ...prev]));
    }
  };

  // Inline Quick Add Expense from Home Page
  const handleQuickAddExpense = (
    amount: number,
    category: string,
    accountId: string,
    description: string
  ) => {
    if (!currentUser) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}`;

    const { accounts: updatedAccounts, transaction } = addTransaction(currentUser.id, {
      type: 'EXPENSE',
      amount,
      date: dateStr,
      time: timeStr,
      accountId,
      category,
      tag: '日常',
      description: description || category,
    });

    setAccounts(updatedAccounts);
    setTransactions((prev) => sortTransactions([transaction, ...prev]));
  };

  // Repayment submission
  const handleSubmitRepayment = (sourceAccountId: string, targetAccountId: string, amount: number) => {
    if (!currentUser) return;
    const targetAcc = accounts.find((a) => a.id === targetAccountId);
    const { accounts: updatedAccounts, transaction } = addTransaction(currentUser.id, {
      type: 'REPAYMENT',
      amount,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      accountId: sourceAccountId,
      targetAccountId: targetAccountId,
      category: '还信用卡/白条',
      description: `还款至 ${targetAcc?.name || '信用卡/信贷'} (恢复可用额度)`,
    });
    setAccounts(updatedAccounts);
    setTransactions((prev) => sortTransactions([transaction, ...prev]));
  };

  // Delete transaction with Trash Bin and Undo tracking
  const handleDeleteTx = (txId: string) => {
    if (!currentUser) return;
    const { transactions: updated, accounts: updatedAccs } = deleteTransaction(currentUser.id, txId);
    setAccounts(updatedAccs);
    setTransactions(sortTransactions(updated));
    setTrashTransactions(getTrashTransactions(currentUser.id));
    setUndoTxId(txId);
    showToast('🗑️ 账单已移至回收站，可随时在回收站还原');
  };

  // Batch delete transactions
  const handleBatchDeleteTx = (txIds: string[]) => {
    if (!currentUser || txIds.length === 0) return;
    const { transactions: updated, accounts: updatedAccs } = deleteTransactionsBatch(currentUser.id, txIds);
    setAccounts(updatedAccs);
    setTransactions(sortTransactions(updated));
    setTrashTransactions(getTrashTransactions(currentUser.id));
    showToast(`🗑️ 已批量删除 ${txIds.length} 笔账单流水（已暂存回收站防误删）`);
  };

  // 🔄 Recurring Tasks Handlers (Guaranteed no task loss on consecutive creations)
  const handleSaveRecurringTask = (task: RecurringTask) => {
    if (!currentUser) return;
    setRecurringTasks((prev) => {
      const currentStored = getRecurringTasks(currentUser.id);
      // 聚合当前内存与本地存储的所有已知任务，确保连续新增任务绝不丢失前序任务
      const taskMap = new Map<string, RecurringTask>();
      currentStored.forEach((t) => taskMap.set(t.id, t));
      prev.forEach((t) => taskMap.set(t.id, t));
      const isExisting = taskMap.has(task.id);
      taskMap.set(task.id, task);

      const updated = Array.from(taskMap.values());
      saveRecurringTasks(currentUser.id, updated);
      showToast(isExisting ? `✨ 周期规则「${task.name}」已更新` : `✨ 周期规则「${task.name}」已创建`);
      return updated;
    });
  };

  const handleDeleteRecurringTask = (taskId: string) => {
    if (!currentUser) return;
    setRecurringTasks((prev) => {
      const currentStored = getRecurringTasks(currentUser.id);
      const taskMap = new Map<string, RecurringTask>();
      currentStored.forEach((t) => taskMap.set(t.id, t));
      prev.forEach((t) => taskMap.set(t.id, t));
      const target = taskMap.get(taskId);
      taskMap.delete(taskId);
      const updated = Array.from(taskMap.values());
      saveRecurringTasks(currentUser.id, updated);
      showToast(`🗑️ 周期规则「${target?.name || ''}」已删除`);
      return updated;
    });
  };

  const handleExecuteRecurringTask = (taskId: string) => {
    if (!currentUser) return;
    const res = executeRecurringTask(currentUser.id, taskId);
    if (res.success && res.transaction && res.accounts && res.updatedTasks) {
      setAccounts(res.accounts);
      setTransactions((prev) => sortTransactions([res.transaction!, ...prev]));
      setRecurringTasks(res.updatedTasks);
      const isCurForeign = res.transaction.currency && res.transaction.currency !== 'CNY';
      const amtDisplay = isCurForeign
        ? `${res.transaction.originalAmount !== undefined ? res.transaction.originalAmount : ''} ${res.transaction.currency} (折合 ¥${res.transaction.amount})`
        : `¥${res.transaction.amount}`;
      showToast(`⚡ 已成功入账「${res.transaction.description}」${amtDisplay}`);
    }
  };

  const handleExecuteAllDueRecurring = () => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    let executedCount = 0;
    let currAccs = accounts;
    let currTxs = transactions;
    let currTasks = recurringTasks;

    recurringTasks.forEach((task) => {
      if (task.enabled && task.nextDueDate <= todayStr) {
        const res = executeRecurringTask(currentUser.id, task.id);
        if (res.success && res.transaction && res.accounts && res.updatedTasks) {
          executedCount++;
          currAccs = res.accounts;
          currTxs = [res.transaction, ...currTxs];
          currTasks = res.updatedTasks;
        }
      }
    });

    if (executedCount > 0) {
      setAccounts(currAccs);
      setTransactions(sortTransactions(currTxs));
      setRecurringTasks(currTasks);
      showToast(`⚡ 已成功批量执行入账 ${executedCount} 笔到期账单`);
    } else {
      showToast('当前没有待入账的到期周期账单');
    }
  };

  // 🗑️ Trash Bin Handlers
  const handleRestoreFromTrash = (txId: string) => {
    if (!currentUser) return;
    const res = restoreFromTrash(currentUser.id, txId);
    if (res.success) {
      setAccounts(res.accounts);
      setTransactions(res.transactions);
      setTrashTransactions(getTrashTransactions(currentUser.id));
      setUndoTxId(null);
      showToast('✨ 账单流水已还原并重新计入资产');
    }
  };

  const handleEmptyTrash = () => {
    if (!currentUser) return;
    emptyTrash(currentUser.id);
    setTrashTransactions([]);
    setUndoTxId(null);
    showToast('🗑️ 回收站已彻底清空');
  };

  // Batch update transactions project or category
  const handleBatchUpdateTx = (txIds: string[], updates: Partial<Transaction>) => {
    if (!currentUser || txIds.length === 0) return;
    const updated = batchUpdateTransactions(currentUser.id, txIds, updates);
    setTransactions(sortTransactions(updated));
    showToast(`✨ 已成功批量更新 ${txIds.length} 笔账单`);
  };

  // Duplicate / Clone transaction
  const handleDuplicateTransaction = (tx: Transaction, cloneImmediately: boolean = false) => {
    if (!currentUser) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}`;

    if (cloneImmediately) {
      const clonedTxData: Omit<Transaction, 'id' | 'createdAt'> = {
        type: tx.type,
        amount: tx.amount,
        date: todayStr,
        time: timeStr,
        accountId: tx.accountId,
        targetAccountId: tx.targetAccountId,
        category: tx.category,
        description: tx.description,
        merchant: tx.merchant,
        tag: tx.tag,
        projectId: tx.projectId,
        projectName: tx.projectName,
        currency: tx.currency,
        originalAmount: tx.originalAmount,
      };
      const { accounts: updatedAccounts, transaction } = addTransaction(currentUser.id, clonedTxData);
      setAccounts(updatedAccounts);
      setTransactions((prev) => sortTransactions([transaction, ...prev]));
      showToast(`✨ 已一键再记一笔: ${tx.description || tx.category} (¥${tx.amount})`);
    } else {
      setEditingTransaction({
        ...tx,
        id: '',
        date: todayStr,
        time: timeStr,
      });
      setTxModalDefaultType(tx.type);
      setTxModalAccountId(tx.accountId);
      setTxModalDefaultDate(todayStr);
      setTxModalProjectId(tx.projectId);
      setTxModalRefundedTxId(undefined);
      setIsTxModalOpen(true);
    }
  };

  // Batch Import Transactions from Upload (CSV / Excel / Alipay / WeChat / JSON)
  const handleImportTransactions = (
    importedList: Transaction[],
    syncAccountBalances: boolean
  ) => {
    if (!currentUser || !Array.isArray(importedList) || importedList.length === 0) return;

    let updatedAccounts = [...(accounts || [])];

    if (syncAccountBalances) {
      const accMap = new Map<string, FinancialAccount>();
      (updatedAccounts || []).forEach((a) => accMap.set(a.id, { ...a }));

      (importedList || []).forEach((tx) => {
        const sourceAcc = accMap.get(tx.accountId);
        const targetAcc = tx.targetAccountId ? accMap.get(tx.targetAccountId) : null;

        if (sourceAcc) {
          const isCredit =
            sourceAcc.category === 'CREDIT_CARD' ||
            sourceAcc.category === 'JD_BAITIAO' ||
            sourceAcc.category === 'HUABEI';

          if (tx.type === 'EXPENSE') {
            if (isCredit) {
              sourceAcc.usedCredit = (sourceAcc.usedCredit || 0) + tx.amount;
              sourceAcc.balance = sourceAcc.usedCredit;
            } else {
              sourceAcc.balance = (sourceAcc.balance || 0) - tx.amount;
            }
          } else if (tx.type === 'INCOME') {
            if (isCredit) {
              sourceAcc.usedCredit = Math.max(0, (sourceAcc.usedCredit || 0) - tx.amount);
              sourceAcc.balance = sourceAcc.usedCredit;
            } else {
              sourceAcc.balance = (sourceAcc.balance || 0) + tx.amount;
            }
          } else if (tx.type === 'TRANSFER') {
            if (isCredit) {
              sourceAcc.usedCredit = (sourceAcc.usedCredit || 0) + tx.amount;
              sourceAcc.balance = sourceAcc.usedCredit;
            } else {
              sourceAcc.balance = (sourceAcc.balance || 0) - tx.amount;
            }
            if (targetAcc) {
              const isTargetCredit =
                targetAcc.category === 'CREDIT_CARD' ||
                targetAcc.category === 'JD_BAITIAO' ||
                targetAcc.category === 'HUABEI';
              if (isTargetCredit) {
                targetAcc.usedCredit = Math.max(0, (targetAcc.usedCredit || 0) - tx.amount);
                targetAcc.balance = targetAcc.usedCredit;
              } else {
                targetAcc.balance = (targetAcc.balance || 0) + tx.amount;
              }
            }
          } else if (tx.type === 'REPAYMENT') {
            sourceAcc.balance = (sourceAcc.balance || 0) - tx.amount;
            if (targetAcc) {
              targetAcc.usedCredit = Math.max(0, (targetAcc.usedCredit || 0) - tx.amount);
              targetAcc.balance = targetAcc.usedCredit;
            }
          }
        }
      });

      updatedAccounts = Array.from(accMap.values());
      saveAccounts(currentUser.id, updatedAccounts);
      setAccounts(updatedAccounts);
    }

    const mergedTransactions = sortTransactions(mergeTransactions(transactions, importedList));
    saveTransactions(currentUser.id, mergedTransactions);
    setTransactions(mergedTransactions);
  };

  // Save Account (Create or Update from Modal)
  const handleSaveAccount = (accountToSave: FinancialAccount) => {
    if (!currentUser) return;
    const existingIndex = accounts.findIndex((a) => a.id === accountToSave.id);
    let updated: FinancialAccount[];
    if (existingIndex >= 0) {
      updated = [...accounts];
      updated[existingIndex] = accountToSave;
    } else {
      updated = [accountToSave, ...accounts];
    }
    saveAccounts(currentUser.id, updated);
    setAccounts(updated);
  };

  // Reorder Accounts (Drag & Drop layout customization)
  const handleReorderAccounts = (newAccounts: FinancialAccount[]) => {
    if (!currentUser) return;
    saveAccounts(currentUser.id, newAccounts);
    setAccounts(newAccounts);
  };

  // Direct In-line Account Update
  const handleDirectUpdateAccount = (accountId: string, updates: Partial<FinancialAccount>) => {
    if (!currentUser) return;
    const updated = updateAccountBalanceDirectly(currentUser.id, accountId, updates);
    setAccounts(updated);
  };

  // Save Batch Reconcile
  const handleSaveBatchAccounts = (updatedAccounts: FinancialAccount[]) => {
    if (!currentUser) return;
    saveAccounts(currentUser.id, updatedAccounts);
    setAccounts(updatedAccounts);
  };

  // Clear Preset Demo Accounts
  const handleClearPresetData = () => {
    if (!currentUser) return;
    clearAllUserData(currentUser.id);
    setAccounts([]);
    setTransactions([]);
    setProjects([]);
  };

  // Delete Account
  const handleDeleteAccount = (accountId: string) => {
    if (!currentUser) return;
    const updated = accounts.filter((a) => a.id !== accountId);
    saveAccounts(currentUser.id, updated);
    setAccounts(updated);
  };

  // Synchronize all gold accounts with latest market price
  const handleSyncGoldAccountsValuation = (newPrice: number) => {
    if (!currentUser) return;
    const result = updateAccountsWithGoldPrice(accounts, newPrice);
    if (result.updatedCount > 0) {
      saveAccounts(currentUser.id, result.updatedAccounts);
      setAccounts(result.updatedAccounts);
      showToast(
        `✨ 已按实时金价 ¥${newPrice}/克 同步更新 ${result.updatedCount} 个黄金账户，市值折合 ¥${result.totalGoldValuation.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
      );
    } else {
      showToast('未检测到黄金理财账户，您可在「账户卡包」中添加「黄金理财」账户');
    }
  };

  // Update Monthly Budget
  const handleUpdateBudget = (newBudget: number) => {
    if (!currentUser) return;
    const updatedUser = updateCurrentUser({ monthlyBudget: newBudget });
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
  };

  // If not logged in, show Auth modal
  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  // If locked, show Lock screen
  if (isLocked) {
    return (
      <LockScreen
        currentUser={currentUser}
        onUnlock={handleUnlock}
        onSwitchUser={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        summary={summary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        privacyMode={privacyMode}
        setPrivacyMode={handleTogglePrivacy}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        onOpenNewTx={() => handleOpenNewTx('EXPENSE')}
        onLockApp={handleLock}
        onLogout={handleLogout}
        onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenGalleryModal={() => setIsGalleryModalOpen(true)}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        onTriggerFullSync={handleTriggerFullSync}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12 space-y-5 sm:space-y-7">
        {/* 1. OVERVIEW VIEW - Centered on Expense Tracking & Financial Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-7 animate-in fade-in duration-300">
            {/* Top 4 Core Financial Summary Cards */}
            <OverviewCards
              summary={summary}
              privacyMode={privacyMode}
              onOpenNewTx={() => handleOpenNewTx('EXPENSE')}
              onOpenRepayment={() => handleOpenRepayment()}
              onNavigateToCredit={() => setActiveTab('credit')}
            />

            {/* 🌟 Prominently Featured: Expense Command Center (今日支出/本月支出/预算进度/极速记账/最新支出明细) */}
            <HomeExpenseDashboard
              summary={summary}
              transactions={transactions || []}
              accounts={accounts || []}
              currentUser={currentUser}
              privacyMode={false}
              onQuickAddExpense={handleQuickAddExpense}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTx}
              onUpdateBudget={handleUpdateBudget}
              onOpenFullTxModal={() => handleOpenNewTx('EXPENSE')}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onOpenRecurringTasks={() => setIsRecurringModalOpen(true)}
            />

            {/* 3. 🌟 信用卡与信贷借贷资金独立专区 (Dedicated Credit Card & Borrowed Funds Center) */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/60 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rose-100/70 dark:border-rose-950/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                        信用卡与信贷借贷资金独立专区
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                        独立借贷核算 · 不计入净资产
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      信贷已用欠款 {formatCurrency(summary.totalUsedCredit, privacyMode)} · 剩余免息可用{' '}
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{formatCurrency(summary.totalAvailableCredit, privacyMode)}</span> · 总额度{' '}
                      {formatCurrency(summary.totalCreditLimit, privacyMode)}
                      {summary.totalPayableDebts > 0 && (
                        <span> · 其他借入负债 {formatCurrency(summary.totalPayableDebts, privacyMode)}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRepayment()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all"
                  >
                    立即快速还款
                  </button>
                  <button
                    onClick={() => setActiveTab('credit')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    查看全部信用卡 ➔
                  </button>
                </div>
              </div>

              {/* Mini Credit Accounts Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                {(accounts || [])
                  .filter((a) => a.category === 'CREDIT_CARD' || a.category === 'JD_BAITIAO' || a.category === 'HUABEI')
                  .slice(0, 3)
                  .map((acc) => {
                    const limit = acc.creditLimit || 0;
                    const used = acc.usedCredit !== undefined ? acc.usedCredit : acc.balance || 0;
                    const avail = Math.max(0, limit - used);
                    const util = limit > 0 ? (used / limit) * 100 : 0;

                    return (
                      <div
                        key={acc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {acc.name}
                          </span>
                          {acc.dueDay && (
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60 font-medium">
                              每月{acc.dueDay}日还款
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline justify-between mt-2.5">
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                            已借用待还: {formatCurrency(used, privacyMode)}
                          </span>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                            剩余可用: {formatCurrency(avail, privacyMode)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              util <= 30 ? 'bg-emerald-500' : util <= 70 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, util)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 2. CREDIT & LIABILITIES VIEW */}
        {activeTab === 'credit' && (
          <div className="animate-in fade-in duration-300">
            <CreditCardsSummary
              accounts={accounts || []}
              summary={summary}
              privacyMode={privacyMode}
              onOpenRepayment={handleOpenRepayment}
              onAddAccount={handleOpenAddAccount}
              onEditAccount={handleOpenEditAccount}
              onOpenNewTx={handleOpenNewTx}
              onQuickReconcile={(acc) => handleOpenEditAccount(acc)}
            />
          </div>
        )}

        {/* 3. ALL ACCOUNTS VIEW - FULL MANUAL ENTRY & EDITING */}
        {activeTab === 'accounts' && (
          <div className="animate-in fade-in duration-300">
            <AccountsList
              accounts={accounts || []}
              privacyMode={privacyMode}
              currentUser={currentUser}
              onTriggerSync={async () => {
                if (!currentUser) return;
                triggerAutoServerSync(currentUser.id, true);
                showToast('已同步最新资产账户到云端账号');
              }}
              onAddAccount={handleOpenAddAccount}
              onEditAccount={handleOpenEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onReorderAccounts={handleReorderAccounts}
              onDirectUpdateAccount={handleDirectUpdateAccount}
              onClearPresetData={handleClearPresetData}
              onOpenBatchReconcile={() => setIsBatchReconcileOpen(true)}
              onOpenRepayment={(accId, amt) => handleOpenRepayment(accId, amt)}
              onOpenNewTx={handleOpenNewTx}
            />
          </div>
        )}

        {/* 4. TRANSACTIONS LEDGER VIEW */}
        {activeTab === 'transactions' && (
          <div className="animate-in fade-in duration-300">
            <TransactionLedger
              transactions={transactions || []}
              accounts={accounts || []}
              projects={projects || []}
              privacyMode={privacyMode}
              currentUser={currentUser}
              onTriggerSync={async () => {
                if (!currentUser) return;
                triggerAutoServerSync(currentUser.id, true);
                showToast('已同步最新账本明细到云端账号');
              }}
              onDeleteTransaction={handleDeleteTx}
              onBatchDeleteTransactions={handleBatchDeleteTx}
              onBatchUpdateTransactions={handleBatchUpdateTx}
              onDuplicateTransaction={handleDuplicateTransaction}
              onEditTransaction={handleEditTransaction}
              onOpenNewTx={(type, accId, date, projId, splitEnabled) =>
                handleOpenNewTx(type || 'EXPENSE', accId, date, projId, splitEnabled)
              }
              onRefundTransaction={handleRefundExpense}
              onImportTransactions={handleImportTransactions}
              onShowToast={showToast}
              onOpenRecurringTasks={() => setIsRecurringModalOpen(true)}
              recurringTasksCount={recurringTasks.filter((t) => t.enabled).length}
              onOpenTrashBin={() => setIsTrashModalOpen(true)}
              trashCount={trashTransactions.length}
            />
          </div>
        )}

        {/* 5. LEDGER PROJECTS VIEW - 独立统计单项目支出与收入 */}
        {activeTab === 'projects' && (
          <div className="animate-in fade-in duration-300">
            <ProjectsDashboard
              projects={projects || []}
              transactions={transactions || []}
              accounts={accounts || []}
              privacyMode={privacyMode}
              currentUser={currentUser}
              onTriggerSync={async () => {
                if (!currentUser) return;
                triggerAutoServerSync(currentUser.id, true);
                showToast('已同步最新项目与流水到云端账号');
              }}
              onSaveProject={handleDirectSaveProject}
              onDeleteProject={handleDeleteProject}
              onOpenNewTx={(type, accId, date, projId, splitEnabled) =>
                handleOpenNewTx(type || 'EXPENSE', accId, date, projId, splitEnabled)
              }
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTx}
              onRefundTransaction={handleRefundExpense}
              onOpenProjectEditor={(p) => {
                setEditingProject(p || null);
                setIsProjectEditorOpen(true);
              }}
              onCreateProject={() => {
                setEditingProject(null);
                setIsProjectEditorOpen(true);
              }}
              onEditProject={(p) => {
                setEditingProject(p);
                setIsProjectEditorOpen(true);
              }}
              onAddTransaction={(txData) => handleSubmitTransaction(txData)}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* 6. ANALYTICS & CHARTS VIEW */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300">
            <AnalyticsView
              accounts={accounts || []}
              transactions={transactions || []}
              summary={summary}
              privacyMode={privacyMode}
              onSyncGoldAccountsValuation={handleSyncGoldAccountsValuation}
            />
          </div>
        )}
      </main>

      {/* Fixed Bottom-Center Floating Action Button for Accounts & Credit (小巧精致悬浮胶囊按钮) */}
      {(activeTab === 'accounts' || activeTab === 'credit') && (
        <button
          id="btn-fixed-add-account"
          onClick={() => handleOpenAddAccount(activeTab === 'credit' ? 'CREDIT_CARD' : 'DEBIT_CARD')}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-35 flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-900 dark:hover:bg-slate-700 text-white font-medium text-xs sm:text-sm px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full shadow-lg shadow-slate-950/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-700/50 dark:border-slate-600/60 backdrop-blur-md whitespace-nowrap"
          title="添加新资产或信用卡账户"
        >
          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide">添加资产</span>
        </button>
      )}

      {/* Fixed Bottom-Center Floating Action Button for Transactions (记账本 - 小巧精致悬浮胶囊按钮) */}
      {activeTab === 'transactions' && (
        <button
          id="btn-fixed-add-tx"
          onClick={() => handleOpenNewTx('EXPENSE')}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-35 flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-900 dark:hover:bg-slate-700 text-white font-medium text-xs sm:text-sm px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full shadow-lg shadow-slate-950/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-700/50 dark:border-slate-600/60 backdrop-blur-md whitespace-nowrap"
          title="快速记录一笔新消费支出、收入或转账"
        >
          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide">记一笔</span>
        </button>
      )}

      {/* Fixed Bottom-Center Floating Action Button for Projects (新建账本项目) */}
      {activeTab === 'projects' && (
        <button
          id="btn-fixed-add-project"
          onClick={() => {
            setEditingProject(null);
            setIsProjectEditorOpen(true);
          }}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-35 flex items-center gap-1.5 sm:gap-2 bg-indigo-600/95 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full shadow-lg shadow-indigo-950/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-indigo-500/50 backdrop-blur-md whitespace-nowrap"
          title="新增账本"
        >
          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide">新增账本</span>
        </button>
      )}

      {/* Modals */}
      {isTxModalOpen && (
        <TransactionModal
          accounts={accounts || []}
          projects={projects || []}
          initialType={txModalDefaultType}
          initialAccountId={txModalAccountId}
          initialProjectId={txModalProjectId}
          initialRefundedTxId={txModalRefundedTxId}
          initialTransaction={editingTransaction}
          initialDate={txModalDefaultDate}
          initialSplitEnabled={txModalSplitEnabled}
          allTransactions={transactions || []}
          onClose={() => {
            setIsTxModalOpen(false);
            setEditingTransaction(null);
            setTxModalDefaultDate(undefined);
            setTxModalProjectId(undefined);
            setTxModalRefundedTxId(undefined);
            setTxModalSplitEnabled(false);
          }}
          onSubmit={handleSubmitTransaction}
        />
      )}

      {isProjectEditorOpen && (
        <ProjectEditorModal
          initialProject={editingProject}
          currentUser={currentUser}
          onClose={() => {
            setIsProjectEditorOpen(false);
            setEditingProject(null);
          }}
          onSubmit={handleSaveProject}
          onDelete={(id) => {
            handleDeleteProject(id);
            setIsProjectEditorOpen(false);
            setEditingProject(null);
          }}
        />
      )}

      {isRepayModalOpen && (
        <RepaymentModal
          accounts={accounts || []}
          targetAccountId={repayTargetAccountId}
          suggestedAmount={repaySuggestedAmount}
          onClose={() => setIsRepayModalOpen(false)}
          onSubmitRepayment={handleSubmitRepayment}
        />
      )}

      {isAccEditorOpen && (
        <AccountEditorModal
          initialAccount={editingAccount}
          defaultCategory={defaultAccCategory}
          onClose={() => setIsAccEditorOpen(false)}
          onSave={handleSaveAccount}
          onDelete={handleDeleteAccount}
        />
      )}

      {isBatchReconcileOpen && (
        <BatchReconcileModal
          accounts={accounts || []}
          onClose={() => setIsBatchReconcileOpen(false)}
          onSaveBatch={handleSaveBatchAccounts}
        />
      )}

      {isSecurityModalOpen && currentUser && (
        <SecuritySettingsModal
          currentUser={currentUser}
          onClose={() => setIsSecurityModalOpen(false)}
          onUserUpdated={(updated) => setCurrentUser(updated)}
          onRefreshData={() => loadUserData(currentUser.id)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
        />
      )}

      {/* Cloud Sync & Backup Modal */}
      {isSyncModalOpen && currentUser && (
        <SyncBackupModal
          currentUser={currentUser}
          accounts={accounts || []}
          transactions={transactions || []}
          projects={projects || []}
          onClose={() => setIsSyncModalOpen(false)}
          onRestoreData={handleRestoreData}
          onShowToast={showToast}
        />
      )}

      {/* CardArt & Cardentify 卡面艺廊 (双向互通) */}
      <CardentifyGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectCard={(card) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(card.imageUrl);
          }
          showToast(`🎨 已复制「${card.name}」卡面链接，可在编辑资产账户时直接套用`);
          setIsGalleryModalOpen(false);
        }}
      />

      {/* 🔄 Recurring Tasks & Fixed Bills Modal */}
      {isRecurringModalOpen && currentUser && (
        <RecurringTasksModal
          isOpen={isRecurringModalOpen}
          onClose={() => setIsRecurringModalOpen(false)}
          tasks={recurringTasks}
          accounts={accounts || []}
          projects={projects || []}
          currentUser={currentUser}
          privacyMode={privacyMode}
          onSaveTask={handleSaveRecurringTask}
          onDeleteTask={handleDeleteRecurringTask}
          onExecuteTask={handleExecuteRecurringTask}
          onExecuteAllDue={handleExecuteAllDueRecurring}
        />
      )}

      {/* 🗑️ Trash Bin Modal */}
      {isTrashModalOpen && (
        <TrashBinModal
          isOpen={isTrashModalOpen}
          onClose={() => setIsTrashModalOpen(false)}
          trashList={trashTransactions}
          accounts={accounts || []}
          privacyMode={privacyMode}
          onRestore={handleRestoreFromTrash}
          onEmptyTrash={handleEmptyTrash}
        />
      )}

      {/* Floating Toast Notification with Quick Undo */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white text-xs sm:text-sm font-medium shadow-2xl border border-slate-700/60 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          {undoTxId && (
            <button
              onClick={() => {
                handleRestoreFromTrash(undoTxId);
              }}
              className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              一键撤销
            </button>
          )}
        </div>
      )}
    </div>
  );
}
