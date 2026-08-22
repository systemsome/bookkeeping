import React from 'react';
import {
  Wallet,
  CreditCard,
  Coins,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { FinancialSummary } from '../types';
import { formatCurrency } from '../lib/formatters';

interface OverviewCardsProps {
  summary: FinancialSummary;
  privacyMode: boolean;
  onOpenNewTx: () => void;
  onOpenRepayment: () => void;
  onNavigateToCredit: () => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  summary,
  privacyMode,
  onOpenNewTx,
  onOpenRepayment,
  onNavigateToCredit,
}) => {
  // Utilization status logic
  const isHealthyCredit = summary.creditUtilizationRate <= 30;
  const isWarningCredit = summary.creditUtilizationRate > 30 && summary.creditUtilizationRate <= 70;

  // Monthly Cash Flow Ratio (支出占收入比例，拥有同信用卡卡片一致的绿色比例条)
  const monthExpenseRatio = summary.monthIncome > 0
    ? (summary.monthExpense / summary.monthIncome) * 100
    : summary.monthExpense > 0
    ? 100
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. 净资产卡片 (Net Worth - 自有实有净资产) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            净资产
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary.netWorth, privacyMode)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              流动 {formatCurrency(summary.liquidAssets, privacyMode)}
            </span>
            <span>+</span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              理财 {formatCurrency(summary.investmentAssets, privacyMode)}
            </span>
            {summary.receivables > 0 && (
              <>
                <span>+</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                  待收 {formatCurrency(summary.receivables, privacyMode)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% 自有实有资金</span>
          <span className="text-slate-400 dark:text-slate-500">不含借贷负债</span>
        </div>
      </div>

      {/* 2. 现有可用流动资金 (Liquid Funds - 包含理财投资合计) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            现有可用流动资金
          </span>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
            {formatCurrency(summary.totalAvailableFunds, privacyMode)}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              活期: {formatCurrency(summary.liquidAssets, privacyMode)}
            </span>
            <span className="text-blue-700 dark:text-blue-300 font-semibold">
              理财: {formatCurrency(summary.investmentAssets, privacyMode)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>包含理财投资合计</span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">随取即用 · 随时变现</span>
        </div>
      </div>

      {/* 3. 信用卡与借贷 (Credit & Loan Debts - 单独独立设立展示) */}
      <div
        onClick={onNavigateToCredit}
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 p-5 shadow-sm hover:shadow hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              信用卡与借贷
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {formatCurrency(summary.totalLiabilities, privacyMode)}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              总授信: {formatCurrency(summary.totalCreditLimit, privacyMode)}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              剩余可用: {formatCurrency(summary.totalAvailableCredit, privacyMode)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden border border-slate-200/40 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all ${
                isHealthyCredit
                  ? 'bg-emerald-500'
                  : isWarningCredit
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, summary.creditUtilizationRate))}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-rose-100/70 dark:border-rose-900/40 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            信贷占用率: {summary.creditUtilizationRate.toFixed(1)}%
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
            <span>单独借贷核算</span>
            <span>➔</span>
          </span>
        </div>
      </div>

      {/* 4. 本月累计支出与收入 (Monthly Cash Flow - 拥有同信用卡卡片一致的绿色比例条，始终保留展示) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            本月累计支出与收入
          </span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/60">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">支</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(summary.monthExpense, false)}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              收 {formatCurrency(summary.monthIncome, false)}
            </span>
            <span
              className={`font-semibold ${
                summary.monthSavings >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              结余 {formatCurrency(summary.monthSavings, false)}
            </span>
          </div>

          {/* Progress bar - 绿色比例条 (同信用卡与借贷卡片一样拥有绿色比例条) */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden border border-slate-200/40 dark:border-slate-700">
            <div
              className="h-full rounded-full transition-all bg-emerald-500"
              style={{
                width: `${Math.min(100, Math.max(0, monthExpenseRatio))}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {summary.monthIncome > 0
              ? `支出占收入: ${monthExpenseRatio.toFixed(1)}%`
              : summary.monthExpense > 0
              ? '当月仅支出'
              : '本月暂无收支'}
          </span>
          <button
            onClick={onOpenNewTx}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors flex items-center gap-0.5"
          >
            <span>+ 立即记一笔</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
