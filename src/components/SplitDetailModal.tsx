import React from 'react';
import {
  X,
  Split,
  Calendar,
  Clock,
  Wallet,
  Receipt,
  Pencil,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';
import { Transaction, FinancialAccount } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface SplitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: FinancialAccount[];
  onEditTransaction?: (tx: Transaction, splitEnabled?: boolean) => void;
  onOpenReceipt?: (txId: string) => void;
}

const COLOR_PALETTE = [
  { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' },
  { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
  { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
  { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
  { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' },
  { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800' },
];

export const SplitDetailModal: React.FC<SplitDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  accounts,
  onEditTransaction,
  onOpenReceipt,
}) => {
  if (!isOpen || !transaction) return null;

  const isExpense = transaction.type === 'EXPENSE';
  const isIncome = transaction.type === 'INCOME';
  const splitItems = transaction.splitItems || [];
  const splitSum = splitItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const account = accounts.find((a) => a.id === transaction.accountId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>拆分记账详情</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {splitItems.length} 个子项
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                查看本笔交易完整子项构成、类目明细与占比分布
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="关闭窗口"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 modal-custom-scrollbar">
          {/* Main Bill Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                母单总金额
              </span>
              <div
                className={`text-xl sm:text-2xl font-black font-mono ${
                  isExpense
                    ? 'text-rose-600 dark:text-rose-400'
                    : isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {isExpense ? '-' : isIncome ? '+' : ''}¥{transaction.amount.toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{transaction.date}</span>
                {transaction.time && (
                  <span className="text-slate-400 font-mono">({transaction.time})</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{account?.name || '默认账户'}</span>
                {account?.cardNumberLast4 && (
                  <span className="text-[10px] font-mono text-slate-400">
                    *{account.cardNumberLast4}
                  </span>
                )}
              </div>

              {transaction.category && (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">主分类:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.category}
                  </span>
                </div>
              )}

              {transaction.projectName && (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {transaction.projectName}
                  </span>
                </div>
              )}

              {transaction.merchant && (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 col-span-2">
                  <span className="text-slate-400">商户:</span>
                  <span>{transaction.merchant}</span>
                </div>
              )}

              {transaction.description && (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 col-span-2">
                  <span className="text-slate-400">总备注:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {transaction.description}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sub-items Distribution & Visual Proportion Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                子项构成占比与进度
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-slate-400">子项合计:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ¥{splitSum.toFixed(2)}
                </span>
                {Math.abs(splitSum - transaction.amount) < 0.01 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 ml-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>已配平</span>
                  </span>
                ) : (
                  <span className="text-amber-600 ml-1">
                    (差额 ¥{(transaction.amount - splitSum).toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner p-0.5 border border-slate-200/60 dark:border-slate-700">
              {splitItems.map((item, idx) => {
                const pct = transaction.amount > 0 ? ((item.amount || 0) / transaction.amount) * 100 : 0;
                const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                return (
                  <div
                    key={item.id || idx}
                    style={{ width: `${Math.max(1, pct)}%` }}
                    className={`h-full ${palette.bg} rounded-sm transition-all first:rounded-l-full last:rounded-r-full`}
                    title={`${item.category}: ¥${(item.amount || 0).toFixed(2)} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Sub-items Detailed Table / List */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              各子项明细清单
            </div>

            {splitItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                该账单暂无拆分子项
              </div>
            ) : (
              <div className="space-y-2">
                {splitItems.map((item, idx) => {
                  const pct =
                    transaction.amount > 0
                      ? (((item.amount || 0) / transaction.amount) * 100).toFixed(1)
                      : '0';
                  const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length];

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${palette.bg}`} />
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                          #{idx + 1}
                        </span>

                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                          <CategoryIcon nameOrIcon={item.category} className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {item.category}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full border ${palette.badge} ${palette.text}`}
                            >
                              占比 {pct}%
                            </span>
                          </div>
                          {item.description ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {item.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-0.5 italic">
                              无额外子项说明
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                          ¥{(item.amount || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {isExpense ? '支出扣减' : '收入入账'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onOpenReceipt && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceipt(transaction.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-2xs active:scale-95 transition-all"
                title="生成此账单及拆分子项结算小票"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>生成小票</span>
              </button>
            )}

            {onEditTransaction && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditTransaction(transaction, true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-semibold shadow-2xs active:scale-95 transition-all"
                title="修改母单与拆分子项"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>编辑拆分</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
