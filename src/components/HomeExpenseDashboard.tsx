import React, { useState } from 'react';
import {
  TrendingDown,
  Calendar,
  Zap,
  Tag,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  PieChart,
  Wallet,
  Clock,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { Transaction, FinancialAccount, FinancialSummary, UserProfile } from '../types';
import { EXPENSE_CATEGORIES } from '../lib/constants';
import { formatCurrency } from '../lib/formatters';

interface HomeExpenseDashboardProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  accounts: FinancialAccount[];
  currentUser: UserProfile;
  privacyMode: boolean;
  onQuickAddExpense: (amount: number, category: string, accountId: string, description: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onUpdateBudget: (newBudget: number) => void;
  onOpenFullTxModal: () => void;
  onNavigateToTransactions: () => void;
}

export const HomeExpenseDashboard: React.FC<HomeExpenseDashboardProps> = ({
  summary,
  transactions,
  accounts,
  currentUser,
  privacyMode,
  onQuickAddExpense,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateBudget,
  onOpenFullTxModal,
  onNavigateToTransactions,
}) => {
  // Inline Quick Add State
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState(EXPENSE_CATEGORIES[0]?.name || '餐饮美食');
  const [quickAccountId, setQuickAccountId] = useState(accounts[0]?.id || '');
  const [quickDescription, setQuickDescription] = useState('');
  const [isQuickSuccess, setIsQuickSuccess] = useState(false);

  // Budget Edit State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const currentBudget = currentUser.monthlyBudget || 8000;
  const [budgetValue, setBudgetValue] = useState(currentBudget.toString());

  // Date calculations
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth + 1);

  // Expense transactions this month
  const monthlyExpenses = transactions.filter(
    (tx) => tx.type === 'EXPENSE' && tx.date && tx.date.startsWith(currentYearMonth)
  );

  // Category breakdown calculation
  const categoryStats = React.useMemo(() => {
    const map: { [key: string]: { total: number; count: number } } = {};
    monthlyExpenses.forEach((tx) => {
      const cat = tx.category || '其他消费';
      if (!map[cat]) {
        map[cat] = { total: 0, count: 0 };
      }
      map[cat].total += tx.amount;
      map[cat].count += 1;
    });

    const list = Object.keys(map).map((cat) => ({
      name: cat,
      total: map[cat].total,
      count: map[cat].count,
      percent: summary.monthExpense > 0 ? (map[cat].total / summary.monthExpense) * 100 : 0,
    }));

    return list.sort((a, b) => b.total - a.total);
  }, [monthlyExpenses, summary.monthExpense]);

  // Daily metrics
  const dailyAverageExpense = dayOfMonth > 0 ? summary.monthExpense / dayOfMonth : 0;
  const budgetRemaining = currentBudget - summary.monthExpense;
  const budgetPercent = currentBudget > 0 ? (summary.monthExpense / currentBudget) * 100 : 0;
  const dailyRecommendedRemaining = budgetRemaining > 0 ? budgetRemaining / daysRemaining : 0;

  // Recent expense transactions (max 5)
  const recentExpenses = transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .slice(0, 5);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('请输入有效的支出金额');
      return;
    }
    const accId = quickAccountId || (accounts.length > 0 ? accounts[0].id : '');
    if (!accId) {
      alert('请选择扣款账户');
      return;
    }

    onQuickAddExpense(
      amt,
      quickCategory,
      accId,
      quickDescription.trim() || quickCategory
    );

    setQuickAmount('');
    setQuickDescription('');
    setIsQuickSuccess(true);
    setTimeout(() => setIsQuickSuccess(false), 2000);
  };

  const handleSaveBudget = () => {
    const b = parseFloat(budgetValue);
    if (!isNaN(b) && b > 0) {
      onUpdateBudget(b);
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Expense Dashboard Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-50/90 via-white to-orange-50/70 border border-rose-100 p-5 sm:p-7 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-rose-100/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-600/20">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  本月支出与消费预算中心
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                  {now.getFullYear()}年{now.getMonth() + 1}月
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                实时追踪今日花销、本月支出进度、日均额度与分类构成
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onOpenFullTxModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>记一笔支出</span>
            </button>
            <button
              onClick={onNavigateToTransactions}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
            >
              查看支出账单 ➔
            </button>
          </div>
        </div>

        {/* 4 Core Expense Numbers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: 今日总支出 */}
          <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                今日实时支出
              </span>
              <span className="text-[11px] text-slate-400">
                {now.getMonth() + 1}月{now.getDate()}日
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
                {formatCurrency(summary.todayExpense, privacyMode)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                今日已录入 {transactions.filter((t) => t.type === 'EXPENSE' && t.date === now.toISOString().split('T')[0]).length} 笔支出
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>日均支出参考</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(dailyAverageExpense, privacyMode)}/天
              </span>
            </div>
          </div>

          {/* Card 2: 本月累计支出 */}
          <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                本月累计总支出
              </span>
              <span className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                共 {monthlyExpenses.length} 笔
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(summary.monthExpense, privacyMode)}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <span>月支出占预算</span>
                <span className="font-bold text-rose-600">
                  {budgetPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    budgetPercent <= 70
                      ? 'bg-emerald-500'
                      : budgetPercent <= 95
                      ? 'bg-amber-500'
                      : 'bg-rose-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, budgetPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: 预算与剩余可用 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                本月预算与剩余
              </span>
              <button
                onClick={() => setIsEditingBudget(!isEditingBudget)}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-0.5 transition-colors"
                title="修改每月预算目标"
              >
                <Pencil className="w-3 h-3" />
                <span>设预算</span>
              </button>
            </div>

            <div className="mt-2">
              {isEditingBudget ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    className="w-24 px-2 py-1 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500"
                    placeholder="预算金额"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveBudget}
                    className="px-2 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline justify-between">
                  <div
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      budgetRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {budgetRemaining >= 0
                      ? formatCurrency(budgetRemaining, privacyMode)
                      : `超支 ${formatCurrency(Math.abs(budgetRemaining), privacyMode)}`}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-1">
                设定总预算: {formatCurrency(currentBudget, privacyMode)}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>本月剩余 {daysRemaining} 天</span>
              <span className="font-semibold text-emerald-700">
                可支配 {formatCurrency(dailyRecommendedRemaining, privacyMode)}/天
              </span>
            </div>
          </div>

          {/* Card 4: 月度结余健康度 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                本月收支结余
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                收入 {formatCurrency(summary.monthIncome, privacyMode)}
              </span>
            </div>
            <div className="mt-3">
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  summary.monthSavings >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {summary.monthSavings >= 0 ? '+' : ''}
                {formatCurrency(summary.monthSavings, privacyMode)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary.monthSavings >= 0
                  ? '支出合理受控，正向资产积累中'
                  : '当月支出超出入账，请注意节制'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>结余留存率</span>
              <span className="font-semibold text-slate-700">
                {summary.monthIncome > 0
                  ? `${((summary.monthSavings / summary.monthIncome) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Spending Categories Progress Bar on Home */}
        {categoryStats.length > 0 && (
          <div className="mt-5 pt-4 border-t border-rose-100/70">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-rose-600" />
                <span>本月主要消费支出分类构成 TOP</span>
              </span>
              <span className="text-xs text-slate-500">
                共产生 {categoryStats.length} 类支出
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {categoryStats.slice(0, 6).map((cat) => (
                <div
                  key={cat.name}
                  className="p-2.5 rounded-xl bg-white border border-rose-100/80 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate">{cat.name}</span>
                    <span className="text-rose-600 font-mono text-[11px]">
                      {cat.percent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {formatCurrency(cat.total, privacyMode)}
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, cat.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Direct Inline Quick-Add Expense Bar */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>首页快速记一笔支出 (随时随地直接输入并保存)</span>
          </h3>
          {isQuickSuccess && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              支出记账已保存，账户余额已扣减！
            </span>
          )}
        </div>

        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Amount */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              支出金额 (¥) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">¥</span>
              <input
                id="quick-expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="例如: 35.50"
                required
                className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white text-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Category */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              支出分类
            </label>
            <select
              id="quick-expense-category"
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              支付/扣款账户
            </label>
            <select
              id="quick-expense-account"
              value={quickAccountId}
              onChange={(e) => setQuickAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.category === 'CREDIT_CARD' || a.category === 'JD_BAITIAO' || a.category === 'HUABEI' ? '已用' : '余额'}: ¥{a.balance})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              备注说明
            </label>
            <input
              id="quick-expense-desc"
              type="text"
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              placeholder="午餐/买咖啡/打车..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800"
            />
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-2">
            <button
              id="btn-submit-quick-expense"
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>立即记录</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Recent Expense Ledger Flow with In-place Edit/Delete */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>最新支出明细记录 (支持直接编辑与删除)</span>
            </h3>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>全部支出流水</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            暂无支出记录，上方快捷栏输入金额即可随时记账！
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-1">
            {recentExpenses.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);

              return (
                <div
                  key={tx.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors group"
                >
                  {/* Left info */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-rose-100">
                      支
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                          {tx.description || tx.category}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[11px] text-slate-600 font-medium">
                          {tx.category}
                        </span>
                        {tx.tag && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200/50">
                            {tx.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {tx.date} {tx.time || ''} · 扣款账户: {acc?.name || '已设账户'}
                      </p>
                    </div>
                  </div>

                  {/* Right Amount & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base text-rose-600">
                      -{formatCurrency(tx.amount, privacyMode)}
                    </span>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                        title="编辑这笔支出"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确认删除支出记录 “${tx.description || tx.category}” (¥${tx.amount}) 吗？`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="删除这笔支出"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
