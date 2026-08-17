import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ReceiptText,
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { formatCurrency } from '../lib/formatters';

interface RepaymentModalProps {
  accounts: FinancialAccount[];
  targetAccountId?: string;
  suggestedAmount?: number;
  onClose: () => void;
  onSubmitRepayment: (sourceAccountId: string, targetAccountId: string, amount: number) => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  accounts,
  targetAccountId,
  suggestedAmount,
  onClose,
  onSubmitRepayment,
}) => {
  // Available credit cards, baitiao and huabei accounts that need repayment
  const creditAccounts = accounts.filter(
    (a) => a.category === 'CREDIT_CARD' || a.category === 'JD_BAITIAO' || a.category === 'HUABEI' || a.category === 'PAYABLE'
  );

  // Available source accounts with liquid funds (debit, alipay, yuebaobao, cash, etc.)
  const liquidAccounts = accounts.filter(
    (a) => ['DEBIT_CARD', 'ALIPAY', 'YUEBAO', 'JD_FINANCE', 'CASH'].includes(a.category)
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    targetAccountId || (creditAccounts.length > 0 ? creditAccounts[0].id : '')
  );

  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    liquidAccounts.length > 0 ? liquidAccounts[0].id : ''
  );

  const targetAcc = accounts.find((a) => a.id === selectedTargetId);

  const [amount, setAmount] = useState<string>(() => {
    if (suggestedAmount && suggestedAmount > 0) {
      return suggestedAmount.toString();
    }
    if (targetAcc && (targetAcc.usedCredit || targetAcc.balance)) {
      return (targetAcc.usedCredit || targetAcc.balance || 0).toString();
    }
    return '';
  });

  useEffect(() => {
    if (targetAcc) {
      const debt = targetAcc.usedCredit !== undefined ? targetAcc.usedCredit : targetAcc.balance || 0;
      if (debt > 0) {
        setAmount(debt.toString());
      }
    }
  }, [selectedTargetId, targetAcc]);

  const handleFullRepay = () => {
    if (targetAcc) {
      const debt = targetAcc.usedCredit !== undefined ? targetAcc.usedCredit : targetAcc.balance || 0;
      setAmount(debt.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      alert('请输入有效的还款金额');
      return;
    }
    if (!selectedSourceId || !selectedTargetId) {
      alert('请选择还款与扣款账户');
      return;
    }

    onSubmitRepayment(selectedSourceId, selectedTargetId, num);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                信用卡与信贷快速还款
              </h2>
              <p className="text-xs text-slate-500">
                还款成功后将自动扣减付款卡余额并实时恢复信用可用额度
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Target Account to repay */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              待还款信用卡 / 白条 / 借款
            </label>
            <select
              id="repay-target-select"
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            >
              {creditAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (当前应还: ¥{(a.usedCredit !== undefined ? a.usedCredit : a.balance || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">还款金额</span>
              <button
                type="button"
                onClick={handleFullRepay}
                className="text-xs text-purple-700 hover:text-purple-800 font-semibold"
              >
                全部还清本期账单
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-400">¥</span>
              <input
                id="repay-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-slate-900 placeholder-slate-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Source Account to deduct */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              扣款/出资账户
            </label>
            <select
              id="repay-source-select"
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            >
              {liquidAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (可用余额: ¥{(a.balance || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Preview hint */}
          {targetAcc && (
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-800 space-y-1">
              <div className="flex items-center justify-between">
                <span>还款前剩余可用额度:</span>
                <span className="font-medium">
                  {formatCurrency(Math.max(0, (targetAcc.creditLimit || 0) - (targetAcc.usedCredit || targetAcc.balance || 0)))}
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold text-emerald-700">
                <span>还款后预计可用额度:</span>
                <span>
                  {formatCurrency(
                    Math.max(
                      0,
                      (targetAcc.creditLimit || 0) -
                        Math.max(0, (targetAcc.usedCredit || targetAcc.balance || 0) - (parseFloat(amount) || 0))
                    )
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-confirm-repayment"
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>确认还款并恢复可用额度</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
