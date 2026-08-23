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

  // 1. 流动资金比例划分 (两个颜色呈现为 100%: 基础活期流动 vs 投资理财)
  const totalAvail = summary.totalAvailableFunds > 0 ? summary.totalAvailableFunds : (summary.liquidAssets + summary.investmentAssets);
  const liquidShare = totalAvail > 0 ? (Math.max(0, summary.liquidAssets) / totalAvail) * 100 : 50;
  const investShare = totalAvail > 0 ? (Math.max(0, summary.investmentAssets) / totalAvail) * 100 : 50;

  // 2. 净资产比例划分 (三个颜色呈现为 100%: 基础流动 vs 投资理财 vs 待收应收)
  const totalNetAssets = (summary.liquidAssets > 0 ? summary.liquidAssets : 0) +
    (summary.investmentAssets > 0 ? summary.investmentAssets : 0) +
    (summary.receivables > 0 ? summary.receivables : 0);
  
  const netLiquidPercent = totalNetAssets > 0 ? (Math.max(0, summary.liquidAssets) / totalNetAssets) * 100 : 0;
  const netInvestPercent = totalNetAssets > 0 ? (Math.max(0, summary.investmentAssets) / totalNetAssets) * 100 : 0;
  const netReceivablePercent = totalNetAssets > 0 ? (Math.max(0, summary.receivables) / totalNetAssets) * 100 : 0;

  // Monthly Cash Flow Ratio (支出占收入比例，拥有同信用卡卡片一致的绿色比例条)
  const monthExpenseRatio = summary.monthIncome > 0
    ? (summary.monthExpense / summary.monthIncome) * 100
    : summary.monthExpense > 0
    ? 100
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. 净资产卡片 (Net Worth - 自有实有净资产，包含三色比例划分条) */}
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
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-1">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              流动 {formatCurrency(summary.liquidAssets, privacyMode)}
            </span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              理财 {formatCurrency(summary.investmentAssets, privacyMode)}
            </span>
            {summary.receivables > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                待收 {formatCurrency(summary.receivables, privacyMode)}
              </span>
            )}
          </div>

          {/* 净资产三色比例条 (100% 划分: 绿色流动 + 蓝色理财 + 橙色待收) */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden flex border border-slate-200/40 dark:border-slate-700">
            {totalNetAssets > 0 ? (
              <>
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${netLiquidPercent}%` }}
                  title={`流动资金: ${netLiquidPercent.toFixed(1)}%`}
                />
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${netInvestPercent}%` }}
                  title={`投资理财: ${netInvestPercent.toFixed(1)}%`}
                />
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${netReceivablePercent}%` }}
                  title={`借出待收: ${netReceivablePercent.toFixed(1)}%`}
                />
              </>
            ) : (
              <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>流动 {totalNetAssets > 0 ? `${netLiquidPercent.toFixed(0)}%` : '0%'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>理财 {totalNetAssets > 0 ? `${netInvestPercent.toFixed(0)}%` : '0%'}</span>
            </span>
            {summary.receivables > 0 && (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>待收 {totalNetAssets > 0 ? `${netReceivablePercent.toFixed(0)}%` : '0%'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. 流动资金 (原 现有可用流动资金 - 两个颜色呈现 100% 比例条) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            流动资金
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
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              活期: {formatCurrency(summary.liquidAssets, privacyMode)}
            </span>
            <span className="text-blue-700 dark:text-blue-300 font-semibold">
              理财: {formatCurrency(summary.investmentAssets, privacyMode)}
            </span>
          </div>

          {/* 流动资金双色比例条 (100% 划分: 翡翠绿活期 + 宝石蓝理财) */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden flex border border-slate-200/40 dark:border-slate-700">
            {totalAvail > 0 ? (
              <>
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${liquidShare}%` }}
                  title={`活期流动: ${liquidShare.toFixed(1)}%`}
                />
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${investShare}%` }}
                  title={`投资理财: ${investShare.toFixed(1)}%`}
                />
              </>
            ) : (
              <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>活期 {totalAvail > 0 ? `${liquidShare.toFixed(0)}%` : '0%'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>理财 {totalAvail > 0 ? `${investShare.toFixed(0)}%` : '0%'}</span>
            </span>
          </div>
          <span className="text-blue-600 dark:text-blue-400 font-medium">随取即用</span>
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
