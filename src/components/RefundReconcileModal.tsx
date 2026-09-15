import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Calendar,
  Clock,
  Wallet,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Info,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react';
import { Transaction, FinancialAccount } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';

interface RefundReconcileModalProps {
  originalTx: Transaction;
  accounts: FinancialAccount[];
  privacyMode: boolean;
  onClose: () => void;
  onSubmitRefund: (refundData: {
    amount: number;
    accountId: string;
    date: string;
    time?: string;
    reason?: string;
    description?: string;
  }) => void;
}

const COMMON_REFUND_REASONS = [
  '售后退货退款',
  '商品少件/差价补偿',
  '押金/保证金退还',
  '机票/酒店退改签',
  'AA制收款平账',
  '活动/充值退费',
  '记错金额更正冲红',
];

export const RefundReconcileModal: React.FC<RefundReconcileModalProps> = ({
  originalTx,
  accounts,
  privacyMode,
  onClose,
  onSubmitRefund,
}) => {
  // Calculate remaining refundable amount
  const alreadyRefunded = originalTx.refundedAmount || 0;
  const remainingRefundable = Math.max(0, originalTx.amount - alreadyRefunded);

  // Default refund amount: if remaining is 100 and it's full, or remaining amount
  const [amountStr, setAmountStr] = useState<string>(
    remainingRefundable > 0 ? remainingRefundable.toString() : ''
  );

  // Date and Time (default today)
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

  // Recipient Account (default to original transaction's account, or first account)
  const [accountId, setAccountId] = useState<string>(() => {
    const matched = accounts.find((a) => a.id === originalTx.accountId);
    if (matched) return matched.id;
    return accounts.length > 0 ? accounts[0].id : '';
  });

  // Refund Reason / Tag
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REFUND_REASONS[0]);
  const [description, setDescription] = useState<string>(
    `退款平账: ${originalTx.description || originalTx.category} (冲红)`
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  const numAmount = parseFloat(amountStr) || 0;
  const isOverRemaining = numAmount > remainingRefundable + 0.001;
  const isInvalidAmount = numAmount <= 0;

  // Selected Account details
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isCreditAccount =
    selectedAccount?.category === 'CREDIT_CARD' ||
    selectedAccount?.category === 'JD_BAITIAO' ||
    selectedAccount?.category === 'HUABEI';

  // Net spend after this refund
  const netSpendAfter = Math.max(0, originalTx.amount - alreadyRefunded - numAmount);

  const handleQuickSetAmount = (pct: number) => {
    const calc = Math.round(remainingRefundable * pct * 100) / 100;
    setAmountStr(calc.toString());
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidAmount) {
      setErrorMsg('请输入大于0的有效退款冲红金额');
      return;
    }
    if (isOverRemaining) {
      setErrorMsg(`冲红金额不能超过当前剩余可退金额 ¥${remainingRefundable.toFixed(2)}`);
      return;
    }
    if (!accountId) {
      setErrorMsg('请选择接收退款入账的账户');
      return;
    }

    onSubmitRefund({
      amount: numAmount,
      accountId,
      date,
      time,
      reason: selectedReason,
      description: description.trim() || `退款平账: ${originalTx.description || originalTx.category} (冲红)`,
    });
  };

  return (
    <div
      id="refund-reconcile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="refund-reconcile-modal-card"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  支出账单平账冲红
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  红字冲销
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                原支出发生退款时，以红字冲减原单并入账退回资金，不虚增收入
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Transaction Summary Card */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>原支出流水明细</span>
            <span>{originalTx.date} {originalTx.time || ''}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <CategoryIcon nameOrIcon={originalTx.category} className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {originalTx.description || originalTx.category}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono mt-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px]">
                    {originalTx.category}
                  </span>
                  {originalTx.merchant && <span>商户: {originalTx.merchant}</span>}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 font-mono">
              <div className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                -{formatCurrency(originalTx.amount, privacyMode)}
              </div>
              <div className="text-[11px] text-slate-400">
                {alreadyRefunded > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    已退: -{formatCurrency(alreadyRefunded, privacyMode)}
                  </span>
                ) : (
                  '尚未冲红退款'
                )}
              </div>
            </div>
          </div>

          {/* Progress bar of refund */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">
              剩余最多可冲红退款:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(remainingRefundable, privacyMode)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>本次退款冲红金额 (元)</span>
                <span className="text-rose-500">*</span>
              </label>
              {/* Quick Amount Selectors */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickSetAmount(1)}
                  className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200/60 dark:border-rose-900/60 text-[11px] transition-colors"
                  title="全额退款冲红"
                >
                  全额冲红
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSetAmount(0.9)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition-colors"
                  title="退款 90%"
                >
                  退90%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSetAmount(0.5)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition-colors"
                  title="退款 50%"
                >
                  退一半
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold font-mono text-base">
                ¥
              </span>
              <input
                id="refund-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingRefundable}
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={`输入冲红金额，如 90.00`}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono text-lg font-bold focus:outline-none focus:bg-white dark:focus:bg-slate-800 transition-all ${
                  isOverRemaining
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-rose-500'
                }`}
                autoFocus
              />
            </div>
            {isOverRemaining && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                冲红金额超过了原单剩余可冲红限额 (¥{remainingRefundable.toFixed(2)})
              </p>
            )}
          </div>

          {/* Refund Date & Time (supports refunds that happened long after the original expense) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>退款到账日期</span>
              </label>
              <input
                id="refund-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>退款时间</span>
              </label>
              <input
                id="refund-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Receiving Account */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>退款接收账户 (款项退回到哪里)</span>
            </label>
            <select
              id="refund-target-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-rose-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName || a.name} {a.cardNumberLast4 ? `(*${a.cardNumberLast4})` : ''} - 现余额: ¥{a.balance.toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {isCreditAccount
                ? '💡 提示：此账户为信用类账户，退款将自动冲减已用借款，恢复可用信用额度。'
                : '💡 提示：退款到账后，该账户可用资金余额将实时增加相应金额。'}
            </p>
          </div>

          {/* Refund Reason Chips */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
              <span>冲红原因</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REFUND_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedReason(r);
                    setDescription(`退款平账: ${originalTx.description || originalTx.category} (${r})`);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                    selectedReason === r
                      ? 'bg-rose-500 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
              <span>冲红凭证备注</span>
            </label>
            <input
              id="refund-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可填写详细原因，如：商家售后退货退款90元"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Live Financial Reconciliation Impact Preview (实时平账冲红试算预览) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/5 via-amber-500/5 to-emerald-500/5 dark:from-rose-950/20 dark:via-amber-950/20 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>平账冲红后财务状态试算</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400">原单支出</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  ¥{originalTx.amount.toFixed(2)}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40">
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                  冲红退回
                </div>
                <div className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  -¥{(numAmount || 0).toFixed(2)}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  最终实际净支
                </div>
                <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  ¥{netSpendAfter.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 px-1">
              <span>资金流向: 入账至 {selectedAccount?.name || '选定账户'}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                +{formatCurrency(numAmount, privacyMode)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              取消
            </button>
            <button
              id="btn-confirm-refund-submit"
              type="submit"
              disabled={isInvalidAmount || isOverRemaining}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>确认冲红平账 (退回 ¥{numAmount.toFixed(2)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
