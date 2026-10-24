import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Clock,
  Wallet,
  Tag as TagIcon,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { LedgerProject, FinancialAccount, Transaction, TransactionType } from '../types';
import { calculateProjectStats } from '../lib/storage';
import { formatCurrency } from '../lib/formatters';

interface ProjectQuickReconcileModalProps {
  project: LedgerProject;
  transactions: Transaction[];
  accounts: FinancialAccount[];
  privacyMode?: boolean;
  onClose: () => void;
  onConfirmReconcile: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const ProjectQuickReconcileModal: React.FC<ProjectQuickReconcileModalProps> = ({
  project,
  transactions,
  accounts,
  privacyMode = false,
  onClose,
  onConfirmReconcile,
}) => {
  // 1. Calculate current project stats
  const currentStats = useMemo(() => {
    return calculateProjectStats(project, transactions);
  }, [project, transactions]);

  const currentBookBalance = currentStats.netBalance; // totalIncome - netExpense

  // 2. State for user's inputted actual target balance
  const [actualBalanceInput, setActualBalanceInput] = useState<string>(() => {
    return currentBookBalance.toFixed(2);
  });

  // Account for adjustment
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (accounts.length > 0) {
      // Prefer an account already linked or liquid
      const debitOrWallet = accounts.find((a) =>
        ['DEBIT_CARD', 'WECHAT', 'ALIPAY', 'CASH'].includes(a.category)
      );
      return debitOrWallet ? debitOrWallet.id : accounts[0].id;
    }
    return '';
  });

  // Date and Time
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
    2,
    '0'
  )}`;

  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>(timeStr);

  // Preferred positive adjustment mode: 'REFUND' (平账冲红冲减历史支出) vs 'INCOME' (补充收入入账)
  const [positiveMode, setPositiveMode] = useState<'REFUND' | 'INCOME'>(() => {
    return currentStats.netExpense > 0 ? 'REFUND' : 'INCOME';
  });

  // Description & Tag
  const [userCustomDesc, setUserCustomDesc] = useState<string>('');
  const [tag, setTag] = useState<string>('项目平账');

  // Compute numerical values
  const targetActualBalance = parseFloat(actualBalanceInput) || 0;
  // Difference = target - book
  // e.g. target 1500, book 1000 -> diff = +500 (needs to increase project balance by 500)
  // e.g. target 800, book 1000 -> diff = -200 (needs to decrease project balance by 200)
  const difference = Math.round((targetActualBalance - currentBookBalance) * 100) / 100;
  const isMatch = Math.abs(difference) < 0.009;
  const isNeedIncrease = difference > 0.009;
  const isNeedDecrease = difference < -0.009;

  // Determine transaction type
  const adjustmentType: TransactionType = isNeedIncrease
    ? positiveMode === 'REFUND'
      ? 'REFUND'
      : 'INCOME'
    : 'EXPENSE';

  const adjustmentAmount = Math.abs(difference);

  // Auto-generate recommended description if user hasn't explicitly customized it
  const defaultDesc = useMemo(() => {
    if (isMatch) return `[项目快速平账] 项目结余已核准相符 (¥${targetActualBalance.toFixed(2)})`;
    if (isNeedIncrease) {
      if (positiveMode === 'REFUND') {
        return `[项目平账冲红] 校准结余：账面 ¥${currentBookBalance.toFixed(2)} ➔ 实际 ¥${targetActualBalance.toFixed(2)} (冲减支出 ¥${adjustmentAmount.toFixed(2)})`;
      }
      return `[项目平账入账] 补充收入：账面 ¥${currentBookBalance.toFixed(2)} ➔ 实际 ¥${targetActualBalance.toFixed(2)} (调增 ¥${adjustmentAmount.toFixed(2)})`;
    }
    return `[项目平账调减] 支出补差：账面 ¥${currentBookBalance.toFixed(2)} ➔ 实际 ¥${targetActualBalance.toFixed(2)} (调减支出 ¥${adjustmentAmount.toFixed(2)})`;
  }, [isMatch, isNeedIncrease, positiveMode, currentBookBalance, targetActualBalance, adjustmentAmount]);

  const finalDescription = userCustomDesc.trim() || defaultDesc;

  // Category
  const defaultCategory = useMemo(() => {
    if (adjustmentType === 'REFUND') return '平账冲红';
    if (adjustmentType === 'INCOME') return '平账调节';
    return '平账调节';
  }, [adjustmentType]);

  // Quick preset shortcuts
  const handleSetPreset = (val: number) => {
    setActualBalanceInput(val.toFixed(2));
  };

  const handleAdjustBy = (delta: number) => {
    const current = parseFloat(actualBalanceInput) || 0;
    setActualBalanceInput((current + delta).toFixed(2));
  };

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Submission handler
  const handleSaveReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatch) return;
    if (!selectedAccountId) return;
    if (adjustmentAmount <= 0) return;

    const txData: Omit<Transaction, 'id' | 'createdAt'> = {
      type: adjustmentType,
      amount: adjustmentAmount,
      currency: 'CNY',
      exchangeRate: 1,
      date,
      time,
      accountId: selectedAccountId,
      category: defaultCategory,
      description: finalDescription,
      tag: tag || '项目平账',
      projectId: project.id,
      projectName: project.name,
      isRefund: adjustmentType === 'REFUND',
      refundReason: adjustmentType === 'REFUND' ? '项目账本快速平账冲销' : undefined,
    };

    onConfirmReconcile(txData);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-indigo-100 dark:border-indigo-900/60">
              <Scale className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  项目快速平账调节
                </h2>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: project.color || '#6366f1' }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>目标项目：</span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  {project.name}
                </strong>
                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                  {project.category}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="关闭窗口 (Esc)"
            title="关闭窗口 (Esc)"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveReconcile} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto modal-custom-scrollbar">
          {/* 1. Comparison & Target Input Scoreboard */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-3.5">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">
                  当前账面结余 (收入-净支)
                </span>
                <div
                  className={`text-lg sm:text-xl font-black font-mono ${
                    currentBookBalance >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {currentBookBalance >= 0 ? '+' : ''}
                  {formatCurrency(currentBookBalance, privacyMode)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  项目收入 ¥{currentStats.totalIncome.toFixed(2)} · 净支 ¥{currentStats.netExpense.toFixed(2)}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">
                  需调节差额 (实际 - 账面)
                </span>
                <div
                  className={`text-lg sm:text-xl font-black font-mono ${
                    isMatch
                      ? 'text-slate-500'
                      : isNeedIncrease
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isMatch ? '¥0.00' : `${difference > 0 ? '+' : ''}${formatCurrency(difference, privacyMode)}`}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isMatch
                    ? '✨ 账实已相符，无需调账'
                    : isNeedIncrease
                    ? '▲ 实际资产更多，需调增'
                    : '▼ 实际资产更少，需调减'}
                </div>
              </div>
            </div>

            {/* Target Actual Balance Input */}
            <div>
              <label htmlFor="tx-reconcile-target-input" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                项目当前的实际结余金额 (¥)
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                <span className="shrink-0 text-slate-400 font-bold text-base font-mono select-none mr-2">
                  ¥
                </span>
                <input
                  id="tx-reconcile-target-input"
                  type="number"
                  step="0.01"
                  value={actualBalanceInput}
                  onChange={(e) => setActualBalanceInput(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                  className="w-full bg-transparent text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none p-0 border-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-slate-400 font-medium">快捷调整:</span>
                <button
                  type="button"
                  onClick={() => handleSetPreset(0)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  清零 (¥0.00)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset(currentBookBalance)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  重置为账面值
                </button>
                {project.budget && project.budget > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPreset(project.budget! - currentStats.netExpense)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100"
                    title="平账至预算剩余金额 (项目预算 - 实际净支出)"
                  >
                    预算剩余 (¥{(project.budget - currentStats.netExpense).toFixed(2)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAdjustBy(100)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustBy(-100)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 hover:bg-amber-100"
                >
                  -100
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustBy(500)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustBy(-500)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 hover:bg-amber-100"
                >
                  -500
                </button>
              </div>
            </div>
          </div>

          {/* 2. Differential Analysis & Resolution Mode */}
          {isMatch ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>当前账面结余与输入的目标实际结余完全一致。</strong>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  账实相符，无需生成调账差额流水。若需调节，请在上方输入不同的实际结余。
                </p>
              </div>
            </div>
          ) : isNeedIncrease ? (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    差额计算：需为账本调增 +¥{adjustmentAmount.toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                    请选择平账方式：冲减历史支出（平账冲红），或作为盘盈补充资金入账。
                  </p>
                </div>
              </div>

              {/* Mode switch: REFUND vs INCOME */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPositiveMode('REFUND')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    positiveMode === 'REFUND'
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xs ring-1 ring-indigo-400'
                      : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      平账冲红 (推荐)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    冲减项目累计支出 ¥{adjustmentAmount.toFixed(2)}，净支出减少，结余相应增加
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPositiveMode('INCOME')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    positiveMode === 'INCOME'
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xs ring-1 ring-indigo-400'
                      : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      补充金额 (收入)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    作为外部追加或盘盈收入 +¥{adjustmentAmount.toFixed(2)}，结余相应增加
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    差额计算：需为账本调减 -¥{adjustmentAmount.toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    实际结余低于账面（可能存在漏记支出或盘亏），系统将自动生成一条平账支出明细以补平差额。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Transaction Details Form */}
          {!isMatch && (
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>自动生成调账明细配置</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Account Selection */}
                <div>
                  <label htmlFor="tx-reconcile-account-select" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    资金结算/归属账户
                  </label>
                  <select
                    id="tx-reconcile-account-select"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {accounts.map((acc) => {
                      const suffix = acc.cardNumberLast4 ? ` [尾号${acc.cardNumberLast4}]` : '';
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}{suffix} (余额: ¥{acc.balance?.toFixed(2) || '0.00'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    调账入账时间
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-20 px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description & Note */}
              <div>
                <label htmlFor="tx-reconcile-description" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  调账凭证备注说明
                </label>
                <input
                  id="tx-reconcile-description"
                  type="text"
                  value={userCustomDesc}
                  onChange={(e) => setUserCustomDesc(e.target.value)}
                  placeholder={defaultDesc}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Tag Selection */}
              <div>
                <label htmlFor="tx-reconcile-tag" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  标签分类
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['项目平账', '结余校准', '冲红冲销', '盘盈调增', '预算核销'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        tag === t
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                  <input
                    id="tx-reconcile-tag"
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="自定义标签..."
                    className="w-28 px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={isMatch || adjustmentAmount <= 0}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Scale className="w-4 h-4" />
              <span>
                {isMatch
                  ? '账实一致无需平账'
                  : isNeedIncrease
                  ? positiveMode === 'REFUND'
                    ? `生成冲红明细 (¥${adjustmentAmount.toFixed(2)})`
                    : `生成补充收入 (+¥${adjustmentAmount.toFixed(2)})`
                  : `生成平账支出 (-¥${adjustmentAmount.toFixed(2)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
