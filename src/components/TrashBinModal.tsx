import React, { useState } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ArchiveRestore,
  Calendar,
  Wallet,
} from 'lucide-react';
import { DeletedTransaction, FinancialAccount } from '../types';
import { formatCurrency } from '../lib/formatters';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashList: DeletedTransaction[];
  accounts: FinancialAccount[];
  privacyMode?: boolean;
  onRestore: (txId: string) => void;
  onEmptyTrash: () => void;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  trashList,
  accounts,
  privacyMode = false,
  onRestore,
  onEmptyTrash,
}) => {
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
              <ArchiveRestore className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  交易流水回收站
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {trashList.length} 笔记录
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                支持 30 天防误删恢复，一键还原流水并自动重新核算账户资产
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trashList.length > 0 && !showConfirmEmpty && (
              <button
                onClick={() => setShowConfirmEmpty(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
              >
                清空回收站
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirmation prompt */}
        {showConfirmEmpty && (
          <div className="px-6 py-3 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>确定彻底清空所有删除记录？此操作不可逆。</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirmEmpty(false)}
                className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-white/50 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onEmptyTrash();
                  setShowConfirmEmpty(false);
                }}
                className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                确认彻底清空
              </button>
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {trashList.length === 0 ? (
            <div className="text-center py-16">
              <Trash2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                回收站空空如也
              </p>
              <p className="text-xs text-slate-400 mt-1">
                日常误删的账单流水都会暂存在这里，支持随时一键还原
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trashList.map((item) => {
                const tx = item.transaction;
                const acc = accounts.find((a) => a.id === tx.accountId);
                const isExpense = tx.type === 'EXPENSE';

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isExpense
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '支' : '收'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {tx.description || tx.category}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {tx.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{tx.date}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3 h-3" />
                            <span>{acc?.name || '对应账户'}</span>
                          </span>
                          <span>删于 {new Date(item.deletedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm sm:text-base font-bold font-mono ${
                          isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(tx.amount, privacyMode)}
                      </span>

                      <button
                        onClick={() => onRestore(tx.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold active:scale-95 transition-all"
                        title="还原至账本并自动计入资产"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>一键还原</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>还原操作将精确恢复资产账户余额与分类收支流水</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
