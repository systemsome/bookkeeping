import React from 'react';
import {
  CreditCard,
  Calendar,
  Clock,
  Plus,
  ReceiptText,
} from 'lucide-react';
import { FinancialAccount, FinancialSummary } from '../types';
import { formatCurrency } from '../lib/formatters';
import { AccountCardFace } from './AccountCardFace';

interface CreditCardsSummaryProps {
  accounts: FinancialAccount[];
  summary: FinancialSummary;
  privacyMode: boolean;
  onOpenRepayment: (targetAccountId?: string, suggestedAmount?: number) => void;
  onAddAccount: (category: 'CREDIT_CARD' | 'JD_BAITIAO' | 'HUABEI') => void;
  onEditAccount: (account: FinancialAccount) => void;
}

export const CreditCardsSummary: React.FC<CreditCardsSummaryProps> = ({
  accounts,
  summary,
  privacyMode,
  onOpenRepayment,
  onAddAccount,
  onEditAccount,
}) => {
  const creditAccounts = accounts.filter(
    (acc) => acc.category === 'CREDIT_CARD' || acc.category === 'JD_BAITIAO' || acc.category === 'HUABEI'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              <span>信用卡专区</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              信用卡与额度还款管理
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              实时规整各大银行信用卡及授信额度，监控已出账单、剩余可用额度及免息还款期。
            </p>
          </div>

          {/* Quick Repayment CTA */}
          <div className="flex items-center gap-3">
            <button
              id="btn-credit-repay-all"
              onClick={() => onOpenRepayment()}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs active:scale-95 transition-all text-sm"
            >
              <ReceiptText className="w-4 h-4" />
              <span>一键快速还款</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs text-slate-500 font-medium">总授信信用额度</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(summary.totalCreditLimit, privacyMode)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              共绑定 {creditAccounts.length} 张信贷卡片
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs text-rose-700 font-medium">当前已用金额 (待还账单)</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {formatCurrency(summary.totalUsedCredit, privacyMode)}
            </div>
            <div className="text-xs text-rose-500 mt-1">
              额度占用率: {summary.creditUtilizationRate.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs text-emerald-700 font-medium">当前剩余可用总额度</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(summary.totalAvailableCredit, privacyMode)}
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              随时可刷卡或白条消费
            </div>
          </div>
        </div>
      </div>

      {/* Credit Cards & JD Baitiao List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {creditAccounts.map((acc) => {
          const used = acc.usedCredit !== undefined ? acc.usedCredit : acc.balance || 0;

          return (
            <div key={acc.id} className="h-full">
              <AccountCardFace
                account={acc}
                privacyMode={privacyMode}
                onEditAccount={onEditAccount}
                onOpenRepayment={(accountId, amount) => onOpenRepayment(accountId, amount || used)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
