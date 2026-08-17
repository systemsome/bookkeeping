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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. 净资产卡片 (Net Worth) */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            净资产总估值
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(summary.netWorth, privacyMode)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            <span className="text-emerald-700 font-medium">
              资产 {formatCurrency(summary.liquidAssets + summary.investmentAssets + summary.receivables, privacyMode)}
            </span>
            <span>-</span>
            <span className="text-rose-600 font-medium">
              负债 {formatCurrency(summary.totalLiabilities, privacyMode)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>待收债权: {formatCurrency(summary.receivables, privacyMode)}</span>
          <span className="text-emerald-600 font-medium">实时核算</span>
        </div>
      </div>

      {/* 2. 现有可用流动资金 (Liquid Funds) */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            现有可用流动资金
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
            {formatCurrency(summary.liquidAssets, privacyMode)}
          </div>
          <p className="text-xs text-slate-500 mt-2.5">
            借记卡 + 支付宝余额 + 随身现金
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>理财投资: {formatCurrency(summary.investmentAssets, privacyMode)}</span>
          <span className="text-blue-600 font-medium">随取即用</span>
        </div>
      </div>

      {/* 3. 信用卡与白条信贷总额度 & 可用额度 (Credit & Liabilities) */}
      <div
        onClick={onNavigateToCredit}
        className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow hover:border-slate-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              信用卡可用额度
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
            {formatCurrency(summary.totalAvailableCredit, privacyMode)}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>
              总额度: {formatCurrency(summary.totalCreditLimit, privacyMode)}
            </span>
            <span className="text-rose-600 font-semibold">
              已用: {formatCurrency(summary.totalUsedCredit, privacyMode)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-200/40">
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

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            额度使用率: {summary.creditUtilizationRate.toFixed(1)}%
          </span>
          <span
            className={`font-semibold ${
              isHealthyCredit
                ? 'text-emerald-700'
                : isWarningCredit
                ? 'text-amber-700'
                : 'text-rose-600'
            }`}
          >
            {isHealthyCredit ? '健康区间' : isWarningCredit ? '适度占用' : '额度紧张'}
          </span>
        </div>
      </div>

      {/* 4. 本月收支与结余 (Monthly Cash Flow) */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            本月累计支出与收入
          </span>
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-rose-600 font-semibold">支</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(summary.monthExpense, privacyMode)}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span className="text-emerald-700 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              收 {formatCurrency(summary.monthIncome, privacyMode)}
            </span>
            <span
              className={`font-semibold ${
                summary.monthSavings >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              结余 {formatCurrency(summary.monthSavings, privacyMode)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={onOpenNewTx}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            + 立即记一笔
          </button>
          <button
            onClick={onOpenRepayment}
            className="text-rose-600 hover:text-rose-700 font-medium transition-colors"
          >
            信用卡还款 ➔
          </button>
        </div>
      </div>
    </div>
  );
};
