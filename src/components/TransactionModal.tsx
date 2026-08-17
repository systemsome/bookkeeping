import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
} from 'lucide-react';
import { FinancialAccount, TransactionType, Transaction } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants';

interface TransactionModalProps {
  accounts: FinancialAccount[];
  initialType?: TransactionType;
  initialAccountId?: string;
  initialTransaction?: Transaction | null;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  accounts,
  initialType = 'EXPENSE',
  initialAccountId,
  initialTransaction,
  onClose,
  onSubmit,
}) => {
  const isEditing = !!initialTransaction;

  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type || initialType
  );
  const [amount, setAmount] = useState<string>(
    initialTransaction?.amount !== undefined ? initialTransaction.amount.toString() : ''
  );
  const [date, setDate] = useState<string>(
    initialTransaction?.date || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(
    initialTransaction?.time || new Date().toTimeString().split(' ')[0].substring(0, 5)
  );

  // Accounts
  const [accountId, setAccountId] = useState<string>(
    initialTransaction?.accountId ||
      initialAccountId ||
      (accounts.length > 0 ? accounts[0].id : '')
  );
  const [targetAccountId, setTargetAccountId] = useState<string>(
    initialTransaction?.targetAccountId ||
      (accounts.length > 1 ? accounts[1].id : '')
  );

  // Categories & Details
  const [category, setCategory] = useState<string>(
    initialTransaction?.category || '餐饮美食'
  );
  const [tag, setTag] = useState<string>(initialTransaction?.tag || '日常');
  const [description, setDescription] = useState<string>(
    initialTransaction?.description || ''
  );
  const [counterparty, setCounterparty] = useState<string>(
    initialTransaction?.counterparty || ''
  );
  const [merchant, setMerchant] = useState<string>(
    initialTransaction?.merchant || ''
  );

  // Update defaults when tab changes (only if creating fresh)
  useEffect(() => {
    if (!isEditing) {
      if (type === 'EXPENSE') {
        setCategory('餐饮美食');
      } else if (type === 'INCOME') {
        setCategory('工资薪酬');
      } else if (type === 'REPAYMENT') {
        setCategory('还信用卡/花呗/白条');
        const creditAcc = accounts.find(
          (a) => a.category === 'CREDIT_CARD' || a.category === 'JD_BAITIAO' || a.category === 'HUABEI'
        );
        if (creditAcc) {
          setTargetAccountId(creditAcc.id);
          if (creditAcc.usedCredit) {
            setAmount(creditAcc.usedCredit.toString());
          }
        }
      } else if (type === 'TRANSFER') {
        setCategory('资金划转');
      } else if (type === 'LEND_OUT') {
        setCategory('人情借出款');
      } else if (type === 'COLLECT_LENT') {
        setCategory('收回借款');
      } else if (type === 'BORROW_IN') {
        setCategory('借入款项');
      } else if (type === 'PAY_BORROW') {
        setCategory('归还借款');
      }
    }
  }, [type, accounts, isEditing]);

  const handleQuickAddAmount = (add: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + add).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('请输入有效的金额');
      return;
    }

    if (!accountId) {
      alert('请选择扣款或操作账户');
      return;
    }

    onSubmit(
      {
        type,
        amount: numAmount,
        date,
        time,
        accountId,
        targetAccountId:
          ['TRANSFER', 'REPAYMENT', 'LEND_OUT', 'COLLECT_LENT', 'BORROW_IN', 'PAY_BORROW'].includes(type)
            ? targetAccountId
            : undefined,
        category,
        tag: tag.trim() || undefined,
        description: description.trim() || category,
        counterparty: counterparty.trim() || undefined,
        merchant: merchant.trim() || undefined,
      },
      initialTransaction?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl my-auto">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>{isEditing ? '编辑流水账目明细' : '记一笔流水账目'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 my-4">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            收入
          </button>
          <button
            type="button"
            onClick={() => setType('TRANSFER')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'TRANSFER'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            转账/划转
          </button>
          <button
            type="button"
            onClick={() => setType('REPAYMENT')}
            className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              type === 'REPAYMENT'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            还信用卡/白条
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Big Input */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500">交易金额 (元)</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-400">¥</span>
              <input
                id="tx-input-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-slate-900 placeholder-slate-300 focus:outline-none"
              />
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 overflow-x-auto no-scrollbar">
              {[10, 50, 100, 500, 1000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-mono font-medium transition-colors whitespace-nowrap shadow-2xs"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2.5 py-1 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
              >
                重置
              </button>
            </div>
          </div>

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {type === 'INCOME'
                  ? '收款入账账户'
                  : type === 'TRANSFER' || type === 'REPAYMENT'
                  ? '转出/扣款付款账户'
                  : '支付/扣款账户'}
              </label>
              <select
                id="tx-select-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (余额: ¥{acc.balance?.toFixed(2) || '0.00'})
                  </option>
                ))}
              </select>
            </div>

            {['TRANSFER', 'REPAYMENT', 'LEND_OUT', 'COLLECT_LENT', 'BORROW_IN', 'PAY_BORROW'].includes(
              type
            ) && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  {type === 'REPAYMENT'
                    ? '待还款信用卡/白条'
                    : type === 'TRANSFER'
                    ? '转入目标账户'
                    : '目标关联账户'}
                </label>
                <select
                  id="tx-select-target-account"
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}{' '}
                      {acc.usedCredit !== undefined
                        ? `(待还: ¥${acc.usedCredit.toFixed(2)})`
                        : `(余额: ¥${acc.balance?.toFixed(2) || '0.00'})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category Selector for Expense & Income */}
          {type === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                支出类别
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
                {EXPENSE_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                      category === c.name
                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'INCOME' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                收入类别
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {INCOME_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                      category === c.name
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Description Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                记账日期与时间
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                标签分类
              </label>
              <div className="flex items-center gap-1.5">
                {['日常必要', '改善娱乐', '餐饮消费', '固定支出'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      tag === t
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              备注说明 / 商家对手方
            </label>
            <input
              id="tx-input-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如: 超市买菜、肯德基工作餐、房租转账..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              id="btn-submit-transaction"
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4" />
              <span>确认记账并更新资产与额度</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
