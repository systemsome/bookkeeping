import React, { useState, useEffect } from 'react';
import { X, Check, Sliders, RefreshCw, AlertCircle } from 'lucide-react';
import { FinancialAccount } from '../types';
import { ACCOUNT_CATEGORY_CONFIG } from '../lib/constants';

interface BatchReconcileModalProps {
  accounts: FinancialAccount[];
  onClose: () => void;
  onSaveBatch: (updatedAccounts: FinancialAccount[]) => void;
}

export const BatchReconcileModal: React.FC<BatchReconcileModalProps> = ({
  accounts,
  onClose,
  onSaveBatch,
}) => {
  const [editedList, setEditedList] = useState<FinancialAccount[]>(() =>
    accounts.map((a) => ({ ...a }))
  );

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFieldChange = (id: string, field: keyof FinancialAccount, value: any) => {
    setEditedList((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const updated = { ...acc, [field]: value };
          // If gold, recalculate balance
          if (acc.category === 'GOLD') {
            const grams = field === 'goldGrams' ? parseFloat(value) || 0 : acc.goldGrams || 0;
            const price = field === 'goldUnitPrice' ? parseFloat(value) || 0 : acc.goldUnitPrice || 0;
            updated.balance = grams * price;
          }
          return updated;
        }
        return acc;
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBatch(editedList);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Fixed Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>全账户批量资产盘点与余额校准</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  共 {editedList.length} 个账户
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="关闭窗口 (Esc)"
            title="关闭窗口 (Esc)"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          id="batch-reconcile-form"
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto modal-custom-scrollbar px-6 py-4 space-y-3"
        >
          {editedList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              暂无账户，请先在资产页面手动添加账户。
            </div>
          ) : (
            editedList.map((acc) => {
              const config = ACCOUNT_CATEGORY_CONFIG[acc.category];
              const isCredit = acc.category === 'CREDIT_CARD' || acc.category === 'JD_BAITIAO' || acc.category === 'HUABEI';
              const isGold = acc.category === 'GOLD';

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:border-slate-300 transition-colors"
                >
                  {/* Account Name & Category */}
                  <div className="sm:col-span-4">
                    <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      {acc.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {config?.label || '账户'}
                      </span>
                      {acc.cardNumberLast4 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          尾号 {acc.cardNumberLast4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Inputs based on type */}
                  {isCredit ? (
                    <>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-rose-600 mb-0.5">
                          当前已用欠款额度 (¥)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={acc.usedCredit !== undefined ? acc.usedCredit : acc.balance}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleFieldChange(acc.id, 'usedCredit', val);
                            handleFieldChange(acc.id, 'balance', val);
                          }}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-rose-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          授信总额度 (¥)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={acc.creditLimit || 0}
                          onChange={(e) =>
                            handleFieldChange(acc.id, 'creditLimit', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-slate-500"
                        />
                      </div>
                    </>
                  ) : isGold ? (
                    <>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-amber-700 mb-0.5">
                          持仓克重 (克)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={acc.goldGrams || 0}
                          onChange={(e) =>
                            handleFieldChange(acc.id, 'goldGrams', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-amber-700 mb-0.5">
                          实时金价单价 (¥/克)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={acc.goldUnitPrice || 0}
                          onChange={(e) =>
                            handleFieldChange(acc.id, 'goldUnitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-8">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        真实账户余额 (¥)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={acc.balance}
                        onChange={(e) =>
                          handleFieldChange(acc.id, 'balance', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </form>

        {/* Fixed Footer */}
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-md flex items-center justify-end gap-2.5 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            取消
          </button>
          <button
            id="btn-save-batch-reconcile"
            type="submit"
            form="batch-reconcile-form"
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>保存所有校准数据</span>
          </button>
        </div>
      </div>
    </div>
  );
};
