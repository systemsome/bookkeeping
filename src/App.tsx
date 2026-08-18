/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  auth,
  mapFirebaseUserToProfile,
  subscribeToCloudData,
  saveAccountCloud,
  deleteAccountCloud,
  saveTransactionCloud,
  deleteTransactionCloud,
  uploadInitialAccountsCloud,
  uploadInitialTransactionsCloud,
  updateUserProfileCloud,
} from './lib/firebase';
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
  updateAccountBalanceDirectly,
  clearAllUserData,
  isAppLocked,
  setAppLocked,
  updateCurrentUser,
} from './lib/storage';
import {
  UserProfile,
  FinancialAccount,
  Transaction,
  FinancialSummary,
  AccountCategory,
  TransactionType,
} from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LockScreen } from './components/LockScreen';
import { OverviewCards } from './components/OverviewCards';
import { HomeExpenseDashboard } from './components/HomeExpenseDashboard';
import { CreditCardsSummary } from './components/CreditCardsSummary';
import { AccountsList } from './components/AccountsList';
import { TransactionLedger } from './components/TransactionLedger';
import { AnalyticsView } from './components/AnalyticsView';
import { TransactionModal } from './components/TransactionModal';
import { RepaymentModal } from './components/RepaymentModal';
import { AccountEditorModal } from './components/AccountEditorModal';
import { BatchReconcileModal } from './components/BatchReconcileModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { INITIAL_DEMO_ACCOUNTS, INITIAL_DEMO_TRANSACTIONS } from './lib/constants';

export default function App() {
  // Authentication & Lock state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isLocked, setIsLocked] = useState<boolean>(() => isAppLocked());
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => currentUser?.privacyMode || false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'credit' | 'transactions' | 'analytics'>('overview');

  // Main Data States
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('EXPENSE');
  const [txModalAccountId, setTxModalAccountId] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayTargetAccountId, setRepayTargetAccountId] = useState<string | undefined>(undefined);
  const [repaySuggestedAmount, setRepaySuggestedAmount] = useState<number | undefined>(undefined);

  const [isAccEditorOpen, setIsAccEditorOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [defaultAccCategory, setDefaultAccCategory] = useState<AccountCategory>('DEBIT_CARD');

  const [isBatchReconcileOpen, setIsBatchReconcileOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Reference for unsubscription
  const unsubscribeCloudRef = useRef<(() => void) | null>(null);

  // Load data whenever user changes
  const loadUserData = useCallback((uid: string) => {
    const accs = getAccounts(uid);
    const txs = getTransactions(uid);
    setAccounts(accs);
    setTransactions(txs);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await mapFirebaseUserToProfile(fbUser);
          setCurrentUserId(profile.id);
          setCurrentUser(profile);
          setIsLocked(false);
          setAppLocked(false);
        } catch (err) {
          console.error('Failed to map Firebase user:', err);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Subscribe to Cloud Firestore when a cloud user is logged in
  useEffect(() => {
    if (unsubscribeCloudRef.current) {
      unsubscribeCloudRef.current();
      unsubscribeCloudRef.current = null;
    }

    if (!currentUser) {
      setAccounts([]);
      setTransactions([]);
      return;
    }

    setPrivacyMode(currentUser.privacyMode || false);

    // If demo / local guest account
    if (currentUser.id.startsWith('demo-')) {
      loadUserData(currentUser.id);
      setIsCloudConnected(false);
      return;
    }

    // Cloud authenticated user
    setIsCloudConnected(true);
    setIsCloudSyncing(true);

    // Initial local cache load for instantaneous UI response
    const cachedAccs = getAccounts(currentUser.id);
    const cachedTxs = getTransactions(currentUser.id);
    if (cachedAccs.length > 0) setAccounts(cachedAccs);
    if (cachedTxs.length > 0) setTransactions(cachedTxs);

    // Start Realtime Firestore Subscription
    const unsub = subscribeToCloudData(
      currentUser.id,
      async (cloudAccounts, cloudTxs) => {
        setIsCloudSyncing(false);

        // If cloud is completely empty on fresh sign up, optionally seed initial default set
        if (cloudAccounts.length === 0 && cloudTxs.length === 0) {
          const localAccs = getAccounts(currentUser.id);
          if (localAccs.length > 0) {
            // Push existing local data to cloud
            try {
              await uploadInitialAccountsCloud(currentUser.id, localAccs);
              await uploadInitialTransactionsCloud(currentUser.id, getTransactions(currentUser.id));
            } catch (e) {
              console.warn('Initial push to cloud failed:', e);
            }
          } else {
            // Seed starter demo structure so user is not facing a completely blank screen
            try {
              await uploadInitialAccountsCloud(currentUser.id, INITIAL_DEMO_ACCOUNTS);
              await uploadInitialTransactionsCloud(currentUser.id, INITIAL_DEMO_TRANSACTIONS);
            } catch (e) {
              console.warn('Initial seed to cloud failed:', e);
            }
          }
          return;
        }

        setAccounts(cloudAccounts);
        setTransactions(cloudTxs);
        // Keep local storage cache updated for offline resilience
        saveAccounts(currentUser.id, cloudAccounts);
        saveTransactions(currentUser.id, cloudTxs);
      },
      (err) => {
        console.error('Cloud data sync error:', err);
        setIsCloudSyncing(false);
      }
    );

    unsubscribeCloudRef.current = unsub;

    return () => {
      if (unsubscribeCloudRef.current) {
        unsubscribeCloudRef.current();
        unsubscribeCloudRef.current = null;
      }
    };
  }, [currentUser?.id, loadUserData]);

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
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUserId(user.id);
    setCurrentUser(user);
    setIsLocked(false);
    setAppLocked(false);
    loadUserData(user.id);
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setAppLocked(false);
  };

  const handleLock = () => {
    setIsLocked(true);
    setAppLocked(true);
  };

  const handleLogout = async () => {
    if (unsubscribeCloudRef.current) {
      unsubscribeCloudRef.current();
      unsubscribeCloudRef.current = null;
    }
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUserId(null);
    setCurrentUser(null);
    setIsLocked(false);
    setAppLocked(false);
    setAccounts([]);
    setTransactions([]);
  };

  const handleTogglePrivacy = (val: boolean) => {
    setPrivacyMode(val);
    if (currentUser) {
      updateCurrentUser({ privacyMode: val });
      if (!currentUser.id.startsWith('demo-')) {
        updateUserProfileCloud(currentUser.id, { privacyMode: val });
      }
    }
  };

  const handleOpenNewTx = (type: string = 'EXPENSE', accountId?: string) => {
    setEditingTransaction(null);
    setTxModalDefaultType(type as TransactionType);
    setTxModalAccountId(accountId);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalDefaultType(tx.type);
    setTxModalAccountId(tx.accountId);
    setIsTxModalOpen(true);
  };

  const handleOpenRepayment = (targetAccountId?: string, suggestedAmount?: number) => {
    setRepayTargetAccountId(targetAccountId);
    setRepaySuggestedAmount(suggestedAmount);
    setIsRepayModalOpen(true);
  };

  const handleOpenAddAccount = (category: AccountCategory = 'DEBIT_CARD') => {
    setEditingAccount(null);
    setDefaultAccCategory(category);
    setIsAccEditorOpen(true);
  };

  const handleOpenEditAccount = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setDefaultAccCategory(acc.category);
    setIsAccEditorOpen(true);
  };

  // Transaction submission (create or update)
  const handleSubmitTransaction = async (
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
      setTransactions(updatedTransactions);

      if (!currentUser.id.startsWith('demo-')) {
        setIsCloudSyncing(true);
        try {
          await saveTransactionCloud(currentUser.id, updatedTx);
          // Sync affected accounts
          const acc = updatedAccounts.find((a) => a.id === updatedTx.accountId);
          if (acc) await saveAccountCloud(currentUser.id, acc);
          if (updatedTx.targetAccountId) {
            const targetAcc = updatedAccounts.find((a) => a.id === updatedTx.targetAccountId);
            if (targetAcc) await saveAccountCloud(currentUser.id, targetAcc);
          }
        } catch (e) {
          console.error('Failed to sync transaction to Cloud:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    } else {
      const { accounts: updatedAccounts, transaction } = addTransaction(currentUser.id, txData);
      setAccounts(updatedAccounts);
      setTransactions((prev) => [transaction, ...prev]);

      if (!currentUser.id.startsWith('demo-')) {
        setIsCloudSyncing(true);
        try {
          await saveTransactionCloud(currentUser.id, transaction);
          const acc = updatedAccounts.find((a) => a.id === transaction.accountId);
          if (acc) await saveAccountCloud(currentUser.id, acc);
          if (transaction.targetAccountId) {
            const targetAcc = updatedAccounts.find((a) => a.id === transaction.targetAccountId);
            if (targetAcc) await saveAccountCloud(currentUser.id, targetAcc);
          }
        } catch (e) {
          console.error('Failed to sync new transaction to Cloud:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    }
  };

  // Inline Quick Add Expense from Home Page
  const handleQuickAddExpense = async (
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
    setTransactions((prev) => [transaction, ...prev]);

    if (!currentUser.id.startsWith('demo-')) {
      setIsCloudSyncing(true);
      try {
        await saveTransactionCloud(currentUser.id, transaction);
        const acc = updatedAccounts.find((a) => a.id === transaction.accountId);
        if (acc) await saveAccountCloud(currentUser.id, acc);
      } catch (e) {
        console.error('Cloud quick add expense sync error:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Repayment submission
  const handleSubmitRepayment = async (sourceAccountId: string, targetAccountId: string, amount: number) => {
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
    setTransactions((prev) => [transaction, ...prev]);

    if (!currentUser.id.startsWith('demo-')) {
      setIsCloudSyncing(true);
      try {
        await saveTransactionCloud(currentUser.id, transaction);
        const src = updatedAccounts.find((a) => a.id === sourceAccountId);
        const tgt = updatedAccounts.find((a) => a.id === targetAccountId);
        if (src) await saveAccountCloud(currentUser.id, src);
        if (tgt) await saveAccountCloud(currentUser.id, tgt);
      } catch (e) {
        console.error('Repayment cloud sync error:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Delete transaction
  const handleDeleteTx = async (txId: string) => {
    if (!currentUser) return;
    const { transactions: updated } = deleteTransaction(currentUser.id, txId);
    setTransactions(updated);

    if (!currentUser.id.startsWith('demo-')) {
      setIsCloudSyncing(true);
      try {
        await deleteTransactionCloud(currentUser.id, txId);
      } catch (e) {
        console.error('Delete tx cloud error:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Save Account (Create or Update from Modal)
  const handleSaveAccount = async (accountToSave: FinancialAccount) => {
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

    if (!currentUser.id.startsWith('demo-')) {
      setIsCloudSyncing(true);
      try {
        await saveAccountCloud(currentUser.id, accountToSave);
      } catch (e) {
        console.error('Save account cloud error:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Reorder Accounts (Drag & Drop layout customization)
  const handleReorderAccounts = async (newAccounts: FinancialAccount[]) => {
    if (!currentUser) return;
    saveAccounts(currentUser.id, newAccounts);
    setAccounts(newAccounts);

    if (!currentUser.id.startsWith('demo-')) {
      try {
        await uploadInitialAccountsCloud(currentUser.id, newAccounts);
      } catch (e) {
        console.error('Reorder accounts sync error:', e);
      }
    }
  };

  // Direct In-line Account Update
  const handleDirectUpdateAccount = async (accountId: string, updates: Partial<FinancialAccount>) => {
    if (!currentUser) return;
    const updated = updateAccountBalanceDirectly(currentUser.id, accountId, updates);
    setAccounts(updated);

    if (!currentUser.id.startsWith('demo-')) {
      const targetAcc = updated.find((a) => a.id === accountId);
      if (targetAcc) {
        try {
          await saveAccountCloud(currentUser.id, targetAcc);
        } catch (e) {
          console.error('Direct update account cloud error:', e);
        }
      }
    }
  };

  // Save Batch Reconcile
  const handleSaveBatchAccounts = async (updatedAccounts: FinancialAccount[]) => {
    if (!currentUser) return;
    saveAccounts(currentUser.id, updatedAccounts);
    setAccounts(updatedAccounts);

    if (!currentUser.id.startsWith('demo-')) {
      setIsCloudSyncing(true);
      try {
        await uploadInitialAccountsCloud(currentUser.id, updatedAccounts);
      } catch (e) {
        console.error('Batch save accounts cloud error:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Clear Preset Demo Accounts
  const handleClearPresetData = async () => {
    if (!currentUser) return;
    clearAllUserData(currentUser.id);
    setAccounts([]);
    setTransactions([]);

    if (!currentUser.id.startsWith('demo-')) {
      setIsCloudSyncing(true);
      try {
        for (const acc of accounts) {
          await deleteAccountCloud(currentUser.id, acc.id);
        }
        for (const tx of transactions) {
          await deleteTransactionCloud(currentUser.id, tx.id);
        }
      } catch (e) {
        console.error('Clear cloud data error:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Delete Account
  const handleDeleteAccount = async (accountId: string) => {
    if (!currentUser) return;
    const updated = accounts.filter((a) => a.id !== accountId);
    saveAccounts(currentUser.id, updated);
    setAccounts(updated);

    if (!currentUser.id.startsWith('demo-')) {
      setIsCloudSyncing(true);
      try {
        await deleteAccountCloud(currentUser.id, accountId);
      } catch (e) {
        console.error('Delete account cloud error:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Update Monthly Budget
  const handleUpdateBudget = (newBudget: number) => {
    if (!currentUser) return;
    const updatedUser = updateCurrentUser({ monthlyBudget: newBudget });
    if (updatedUser) {
      setCurrentUser(updatedUser);
      if (!currentUser.id.startsWith('demo-')) {
        updateUserProfileCloud(currentUser.id, { monthlyBudget: newBudget });
      }
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
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-20 sm:pb-12 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        summary={summary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        privacyMode={privacyMode}
        setPrivacyMode={handleTogglePrivacy}
        onOpenNewTx={() => handleOpenNewTx('EXPENSE')}
        onLockApp={handleLock}
        onLogout={handleLogout}
        onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
        isCloudSyncing={isCloudSyncing}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5 sm:space-y-6">
        {/* VIEW 1: Overview & Balance Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            {/* Top Metric Cards */}
            <OverviewCards
              summary={summary}
              privacyMode={privacyMode}
              onOpenNewTx={handleOpenNewTx}
              onOpenAddAccount={handleOpenAddAccount}
              onOpenRepayment={handleOpenRepayment}
              accountsCount={accounts.length}
            />

            {/* Quick Record & Monthly Budget Dashboard */}
            <HomeExpenseDashboard
              transactions={transactions}
              accounts={accounts}
              monthlyBudget={currentUser.monthlyBudget || 8000}
              onUpdateBudget={handleUpdateBudget}
              privacyMode={privacyMode}
              onQuickAddExpense={handleQuickAddExpense}
              onOpenNewTxModal={handleOpenNewTx}
              onOpenAddAccountModal={handleOpenAddAccount}
              onOpenRepayModal={handleOpenRepayment}
              onViewAllTransactions={() => setActiveTab('transactions')}
              onViewAllCredit={() => setActiveTab('credit')}
            />

            {/* Credit Cards Summary Preview */}
            <CreditCardsSummary
              accounts={accounts}
              privacyMode={privacyMode}
              onOpenRepayment={handleOpenRepayment}
              onOpenNewTx={handleOpenNewTx}
              onOpenAddCard={() => handleOpenAddAccount('CREDIT_CARD')}
              onEditAccount={handleOpenEditAccount}
              onDirectUpdateAccount={handleDirectUpdateAccount}
              onReorderAccounts={handleReorderAccounts}
              onBatchReconcile={() => setIsBatchReconcileOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2: Credit Cards & Lines of Credit Dedicated Workspace */}
        {activeTab === 'credit' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            <CreditCardsSummary
              accounts={accounts}
              privacyMode={privacyMode}
              onOpenRepayment={handleOpenRepayment}
              onOpenNewTx={handleOpenNewTx}
              onOpenAddCard={() => handleOpenAddAccount('CREDIT_CARD')}
              onEditAccount={handleOpenEditAccount}
              onDirectUpdateAccount={handleDirectUpdateAccount}
              onReorderAccounts={handleReorderAccounts}
              onBatchReconcile={() => setIsBatchReconcileOpen(true)}
            />
          </div>
        )}

        {/* VIEW 3: All Assets & Accounts Directory */}
        {activeTab === 'accounts' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            <AccountsList
              accounts={accounts}
              privacyMode={privacyMode}
              onAddAccount={handleOpenAddAccount}
              onEditAccount={handleOpenEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onDirectUpdateAccount={handleDirectUpdateAccount}
              onReorderAccounts={handleReorderAccounts}
              onOpenNewTx={handleOpenNewTx}
              onOpenRepayment={handleOpenRepayment}
              onBatchReconcile={() => setIsBatchReconcileOpen(true)}
              onClearAllPresetData={handleClearPresetData}
            />
          </div>
        )}

        {/* VIEW 4: Transactions Ledger */}
        {activeTab === 'transactions' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            <TransactionLedger
              transactions={transactions}
              accounts={accounts}
              privacyMode={privacyMode}
              onOpenNewTx={handleOpenNewTx}
              onEditTx={handleEditTransaction}
              onDeleteTx={handleDeleteTx}
            />
          </div>
        )}

        {/* VIEW 5: Analytics & Visual Charts */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            <AnalyticsView
              transactions={transactions}
              accounts={accounts}
              summary={summary}
              privacyMode={privacyMode}
            />
          </div>
        )}
      </main>

      {/* ================= MODAL DIALOGS ================= */}

      {/* Transaction Modal (Record / Edit) */}
      {isTxModalOpen && (
        <TransactionModal
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          onSubmit={handleSubmitTransaction}
          accounts={accounts}
          defaultType={txModalDefaultType}
          defaultAccountId={txModalAccountId}
          editingTransaction={editingTransaction}
        />
      )}

      {/* Repayment Modal */}
      {isRepayModalOpen && (
        <RepaymentModal
          isOpen={isRepayModalOpen}
          onClose={() => setIsRepayModalOpen(false)}
          onSubmit={handleSubmitRepayment}
          accounts={accounts}
          initialTargetAccountId={repayTargetAccountId}
          suggestedAmount={repaySuggestedAmount}
        />
      )}

      {/* Account Editor Modal (Add/Edit) */}
      {isAccEditorOpen && (
        <AccountEditorModal
          isOpen={isAccEditorOpen}
          onClose={() => setIsAccEditorOpen(false)}
          onSave={handleSaveAccount}
          editingAccount={editingAccount}
          defaultCategory={defaultAccCategory}
        />
      )}

      {/* Batch Balance Reconcile Modal */}
      {isBatchReconcileOpen && (
        <BatchReconcileModal
          isOpen={isBatchReconcileOpen}
          onClose={() => setIsBatchReconcileOpen(false)}
          onSave={handleSaveBatchAccounts}
          accounts={accounts}
        />
      )}

      {/* Security & Cloud Sync Settings Modal */}
      {isSecurityModalOpen && currentUser && (
        <SecuritySettingsModal
          currentUser={currentUser}
          onClose={() => setIsSecurityModalOpen(false)}
          onUserUpdated={(u) => setCurrentUser(u)}
          onRefreshData={() => loadUserData(currentUser.id)}
        />
      )}
    </div>
  );
}
