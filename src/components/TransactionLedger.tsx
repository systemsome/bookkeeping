import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
  ReceiptText,
  HandCoins,
  Trash2,
  Pencil,
  Globe2,
  ArrowRightLeft,
} from 'lucide-react';
import { Transaction, FinancialAccount } from '../types';
import { formatCurrency } from '../lib/formatters';
import { getCurrencyInfo } from '../lib/forexRates';

interface TransactionLedgerProps {
  transactions: Transaction[];
  accounts: FinancialAccount[];
  privacyMode: boolean;
  onDeleteTransaction: (txId: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenNewTx: () => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  accounts,
  privacyMode,
  onDeleteTransaction,
  onEditTransaction,
  onOpenNewTx,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  // Account map for quick lookup
  const accountMap = React.useMemo(() => {
    const map = new Map<string, FinancialAccount>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Extract unique months for filter
  const months = React.useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Extract unique currencies for filter
  const currenciesPresent = React.useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.currency) set.add(t.currency);
    });
    return Array.from(set);
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (selectedType !== 'ALL' && tx.type !== selectedType) {
      return false;
    }
    if (
      selectedAccountId !== 'ALL' &&
      tx.accountId !== selectedAccountId &&
      tx.targetAccountId !== selectedAccountId
    ) {
      return false;
    }
    if (selectedMonth !== 'ALL' && !tx.date.startsWith(selectedMonth)) {
      return false;
    }
    if (selectedCurrency === 'FOREIGN_ONLY') {
      if (!tx.currency || tx.currency === 'CNY') return false;
    } else if (selectedCurrency !== 'ALL') {
      if ((tx.currency || 'CNY') !== selectedCurrency) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(term);
      const matchCat = tx.category?.toLowerCase().includes(term);
      const matchMerchant = tx.merchant?.toLowerCase().includes(term);
      const matchTag = tx.tag?.toLowerCase().includes(term);
      const matchCounterparty = tx.counterparty?.toLowerCase().includes(term);
      const matchCurrency = tx.currency?.toLowerCase().includes(term);
      if (!matchDesc && !matchCat && !matchMerchant && !matchTag && !matchCounterparty && !matchCurrency) {
        return false;
      }
    }
    return true;
  });

  // Calculate filtered totals
  let filteredExpense = 0;
  let filteredIncome = 0;
  let foreignCount = 0;
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'EXPENSE') filteredExpense += tx.amount;
    if (tx.type === 'INCOME') filteredIncome += tx.amount;
    if (tx.currency && tx.currency !== 'CNY') foreignCount += 1;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            记账流水与明细规整
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            清晰记录每一笔消费支出、工资收入、外币交易折算、账户划转、信用卡还款与借款往来
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="ledger-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索分类、备注、币种..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="ledger-filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="ALL">全部交易类型</option>
              <option value="EXPENSE">支出消费</option>
              <option value="INCOME">收入进账</option>
              <option value="TRANSFER">账户转账划转</option>
              <option value="REPAYMENT">信用卡与白条还款</option>
              <option value="LEND_OUT">借出款项</option>
              <option value="COLLECT_LENT">收回借款</option>
              <option value="BORROW_IN">借入款项</option>
              <option value="PAY_BORROW">归还借款</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              id="ledger-filter-account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="ALL">全部关联账户</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Filter */}
          <div>
            <select
              id="ledger-filter-currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="ALL">全部币种交易</option>
              <option value="FOREIGN_ONLY">🌐 仅外币折算交易</option>
              <option value="CNY">🇨🇳 人民币 (CNY)</option>
              {currenciesPresent
                .filter((c) => c !== 'CNY')
                .map((cur) => {
                  const info = getCurrencyInfo(cur);
                  return (
                    <option key={cur} value={cur}>
                      {info.flag} {info.code} ({info.name})
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              id="ledger-filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="ALL">全部历史月份</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Tags */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              共筛选出 <strong className="text-slate-800">{filteredTransactions.length}</strong> 条记录
            </span>
            <span className="text-rose-600 font-medium">
              总支出: {formatCurrency(filteredExpense, privacyMode)}
            </span>
            <span className="text-emerald-700 font-medium">
              总收入: {formatCurrency(filteredIncome, privacyMode)}
            </span>
            {foreignCount > 0 && (
              <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                包含 {foreignCount} 笔外币交易
              </span>
            )}
          </div>

          {(searchTerm || selectedType !== 'ALL' || selectedAccountId !== 'ALL' || selectedMonth !== 'ALL' || selectedCurrency !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedAccountId('ALL');
                setSelectedMonth('ALL');
                setSelectedCurrency('ALL');
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              清空筛选条件
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ReceiptText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">暂无符合条件的流水明细</p>
            <p className="text-xs text-slate-400 mt-1">
              点击右下角「记一笔」或添加流水开始记录，支持录入外币并按实时汇率折算
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const acc = accountMap.get(tx.accountId);
              const targetAcc = tx.targetAccountId ? accountMap.get(tx.targetAccountId) : null;

              const isExpense = tx.type === 'EXPENSE';
              const isIncome = tx.type === 'INCOME';
              const isTransfer = tx.type === 'TRANSFER';
              const isRepayment = tx.type === 'REPAYMENT';
              const isForeign = tx.currency && tx.currency !== 'CNY';
              const curInfo = isForeign ? getCurrencyInfo(tx.currency!) : null;

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Left info & Icon */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isExpense
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : isIncome
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : isRepayment
                          ? 'bg-purple-50 text-purple-600 border border-purple-100'
                          : isTransfer
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-cyan-50 text-cyan-600 border border-cyan-100'
                      }`}
                    >
                      {isExpense ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isRepayment ? (
                        <ReceiptText className="w-5 h-5" />
                      ) : isTransfer ? (
                        <RotateCw className="w-5 h-5" />
                      ) : (
                        <HandCoins className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                          {tx.description || tx.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                          {tx.category}
                        </span>
                        {isForeign && curInfo && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 flex items-center gap-1 shadow-2xs">
                            <span>{curInfo.flag}</span>
                            <span>{curInfo.code}</span>
                            <span className="font-mono font-normal">
                              ({curInfo.symbol}{tx.originalAmount || tx.amount} · 汇率 {tx.exchangeRate || 1})
                            </span>
                          </span>
                        )}
                        {tx.tag && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-50 text-slate-500 border border-slate-200/50">
                            #{tx.tag}
                          </span>
                        )}
                      </div>

                      {/* Account Route & Date */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                        <span>{tx.date}</span>
                        {tx.time && <span>{tx.time}</span>}
                        <span>·</span>
                        <span className="text-slate-600 font-medium">
                          {acc?.name || '未知账户'}
                        </span>
                        {targetAcc && (
                          <>
                            <span>➔</span>
                            <span className="text-slate-600 font-medium">{targetAcc.name}</span>
                          </>
                        )}
                        {tx.counterparty && (
                          <span className="text-amber-700">
                            (对手人: {tx.counterparty})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Amount & Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    <div>
                      {/* Converted RMB Base Amount */}
                      <div
                        className={`text-base sm:text-lg font-bold font-mono ${
                          isExpense
                            ? 'text-rose-600'
                            : isIncome
                            ? 'text-emerald-700'
                            : isRepayment
                            ? 'text-purple-600'
                            : isTransfer
                            ? 'text-blue-600'
                            : 'text-cyan-600'
                        }`}
                      >
                        {isExpense
                          ? `-${formatCurrency(tx.amount, privacyMode)}`
                          : isIncome
                          ? `+${formatCurrency(tx.amount, privacyMode)}`
                          : formatCurrency(tx.amount, privacyMode)}
                      </div>

                      {/* Foreign Amount & Subtitle */}
                      {isForeign && curInfo ? (
                        <div className="text-[11px] text-blue-700 font-mono font-medium flex items-center justify-end gap-1">
                          <span>原币:</span>
                          <span>
                            {isExpense ? '-' : isIncome ? '+' : ''}
                            {curInfo.symbol}{tx.originalAmount || tx.amount}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          {isExpense
                            ? '消费扣款'
                            : isIncome
                            ? '收入入账'
                            : isRepayment
                            ? '恢复授信'
                            : isTransfer
                            ? '资金划转'
                            : '借还变动'}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        title="编辑此笔流水"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定删除流水记录 “${tx.description || tx.category}” 吗？`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="删除此笔流水"
                      >
                        <Trash2 className="w-4 h-4" />
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

