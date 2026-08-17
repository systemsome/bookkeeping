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
import {
  CreditCard,
  Plus,
} from 'lucide-react';
import { formatCurrency } from './lib/formatters';

export default function App() {
  // Authentication & Lock state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isLocked, setIsLocked] = useState<boolean>(() => isAppLocked());
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => currentUser?.privacyMode || false);

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

  // Load data whenever user changes
  const loadUserData = useCallback((uid: string) => {
    const accs = getAccounts(uid);
    const txs = getTransactions(uid);
    setAccounts(accs);
    setTransactions(txs);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser.id);
      setPrivacyMode(currentUser.privacyMode || false);
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
      setTransactions(updatedTransactions);
    } else {
      const { accounts: updatedAccounts, transaction } = addTransaction(currentUser.id, txData);
      setAccounts(updatedAccounts);
      setTransactions((prev) => [transaction, ...prev]);
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
    setTransactions((prev) => [transaction, ...prev]);
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
    setTransactions((prev) => [transaction, ...prev]);
  };

  // Delete transaction
  const handleDeleteTx = (txId: string) => {
    if (!currentUser) return;
    const { transactions: updated } = deleteTransaction(currentUser.id, txId);
    setTransactions(updated);
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
  };

  // Delete Account
  const handleDeleteAccount = (accountId: string) => {
    if (!currentUser) return;
    const updated = accounts.filter((a) => a.id !== accountId);
    saveAccounts(currentUser.id, updated);
    setAccounts(updated);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased">
      {/* Top Navigation */}
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
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
              transactions={transactions}
              accounts={accounts}
              currentUser={currentUser}
              privacyMode={privacyMode}
              onQuickAddExpense={handleQuickAddExpense}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTx}
              onUpdateBudget={handleUpdateBudget}
              onOpenFullTxModal={() => handleOpenNewTx('EXPENSE')}
              onNavigateToTransactions={() => setActiveTab('transactions')}
            />

            {/* Quick Credit Overview & Fast Repayment Banner */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      信用卡与京东白条额度速览
                    </h3>
                    <p className="text-xs text-slate-500">
                      总额度 {formatCurrency(summary.totalCreditLimit, privacyMode)} · 已用待还{' '}
                      {formatCurrency(summary.totalUsedCredit, privacyMode)} · 剩余可用{' '}
                      {formatCurrency(summary.totalAvailableCredit, privacyMode)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRepayment()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all"
                  >
                    立即还款
                  </button>
                  <button
                    onClick={() => setActiveTab('credit')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                  >
                    查看全部信用卡 ➔
                  </button>
                </div>
              </div>

              {/* Mini Credit Accounts Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                {accounts
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
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-800 truncate">
                            {acc.name}
                          </span>
                          {acc.dueDay && (
                            <span className="text-[11px] text-amber-700 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                              {acc.dueDay}日还款
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline justify-between mt-2.5">
                          <span className="text-xs text-rose-600 font-medium">
                            待还: {formatCurrency(used, privacyMode)}
                          </span>
                          <span className="text-xs text-emerald-700 font-medium">
                            可用: {formatCurrency(avail, privacyMode)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
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
              accounts={accounts}
              summary={summary}
              privacyMode={privacyMode}
              onOpenRepayment={handleOpenRepayment}
              onAddAccount={handleOpenAddAccount}
              onEditAccount={handleOpenEditAccount}
            />
          </div>
        )}

        {/* 3. ALL ACCOUNTS VIEW - FULL MANUAL ENTRY & EDITING */}
        {activeTab === 'accounts' && (
          <div className="animate-in fade-in duration-300">
            <AccountsList
              accounts={accounts}
              privacyMode={privacyMode}
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
              transactions={transactions}
              accounts={accounts}
              privacyMode={privacyMode}
              onDeleteTransaction={handleDeleteTx}
              onEditTransaction={handleEditTransaction}
              onOpenNewTx={() => handleOpenNewTx('EXPENSE')}
            />
          </div>
        )}

        {/* 5. ANALYTICS & CHARTS VIEW */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300">
            <AnalyticsView
              accounts={accounts}
              transactions={transactions}
              summary={summary}
              privacyMode={privacyMode}
            />
          </div>
        )}
      </main>

      {/* Fixed Bottom-Right Floating Action Button (Only on 'accounts' and 'credit' tabs) */}
      {(activeTab === 'accounts' || activeTab === 'credit') && (
        <button
          id="btn-fixed-add-account"
          onClick={() => handleOpenAddAccount(activeTab === 'credit' ? 'CREDIT_CARD' : 'DEBIT_CARD')}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-900 text-white font-semibold text-sm sm:text-base px-5 py-3.5 sm:px-6 sm:py-4 rounded-full shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 border border-slate-700/60 backdrop-blur-md ring-4 ring-slate-900/10 animate-in fade-in slide-in-from-bottom-4"
          title="添加新资产或信用卡账户"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="tracking-wide">添加资产</span>
        </button>
      )}

      {/* Modals */}
      {isTxModalOpen && (
        <TransactionModal
          accounts={accounts}
          initialType={txModalDefaultType}
          initialAccountId={txModalAccountId}
          initialTransaction={editingTransaction}
          onClose={() => {
            setIsTxModalOpen(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleSubmitTransaction}
        />
      )}

      {isRepayModalOpen && (
        <RepaymentModal
          accounts={accounts}
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
          accounts={accounts}
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
        />
      )}
    </div>
  );
}
