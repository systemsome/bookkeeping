import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                全账户批量资产盘点与余额校准
              </h2>
              <p className="text-xs text-slate-500">
                快速手工录入与校对每一张银行卡、信用卡已用额度、钱包与理财最新真实余额
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

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {editedList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
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
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
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
                            className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-rose-600 focus:outline-none focus:border-rose-500"
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
                            className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-slate-500"
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
                            className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
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
                            className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
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
                          className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:border-slate-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>保存所有校准数据</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
