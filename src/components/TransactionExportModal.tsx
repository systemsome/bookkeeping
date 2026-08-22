import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  X,
  Check,
  Calendar,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Transaction, FinancialAccount } from '../types';
import {
  exportTransactions,
  downloadTransactionTemplate,
  TransactionExportOptions,
} from '../lib/transactionImportExport';
import { formatCurrency } from '../lib/formatters';

interface TransactionExportModalProps {
  allTransactions: Transaction[];
  filteredTransactions: Transaction[];
  accounts: FinancialAccount[];
  privacyMode: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const TransactionExportModal: React.FC<TransactionExportModalProps> = ({
  allTransactions,
  filteredTransactions,
  accounts,
  privacyMode,
  onClose,
  onShowToast,
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('xlsx');
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [customFileName, setCustomFileName] = useState('');

  const targetTransactions = exportScope === 'filtered' ? filteredTransactions : allTransactions;

  // Calculate totals
  const totalExpense = targetTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = targetTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExecuteExport = () => {
    if (targetTransactions.length === 0) {
      onShowToast('当前导出范围内没有流水记录可供导出');
      return;
    }

    const options: TransactionExportOptions = {
      format: exportFormat,
      scope: exportScope,
      filename: customFileName.trim() || undefined,
    };

    exportTransactions(targetTransactions, accounts, options);
    onShowToast(
      `🎉 已成功导出 ${targetTransactions.length} 笔流水明细 (${
        exportFormat === 'xlsx' ? 'Excel .xlsx' : exportFormat === 'csv' ? 'CSV 格式' : 'JSON 格式'
      })！`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                导出记账流水与明细
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                支持导出 Excel 表格、CSV 及 JSON 备份
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Export Scope Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              1. 导出数据范围
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>全部历史流水</span>
                  </div>
                  {exportScope === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-normal font-mono">
                  共 {allTransactions.length} 笔记录
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  exportScope === 'filtered'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>当前筛选结果</span>
                  </div>
                  {exportScope === 'filtered' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-normal font-mono">
                  当前筛选 {filteredTransactions.length} 笔
                </div>
              </button>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              2. 导出文件格式
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Excel XLSX */}
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  exportFormat === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold">Excel 工作表</span>
                <span className="text-[10px] text-slate-400 font-mono">.xlsx 格式</span>
              </button>

              {/* CSV */}
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  exportFormat === 'csv'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold">CSV 表格</span>
                <span className="text-[10px] text-slate-400 font-mono">.csv (UTF-8)</span>
              </button>

              {/* JSON */}
              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  exportFormat === 'json'
                    ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileJson className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold">JSON 数据</span>
                <span className="text-[10px] text-slate-400 font-mono">.json 结构</span>
              </button>
            </div>
          </div>

          {/* Optional File Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              3. 自定义导出文件名 (可选)
            </label>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="留空则自动按日期生成，如 财务记账流水明细_20260821"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Export Preview Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span>待导出流水总量:</span>
              <strong className="text-slate-900 dark:text-white font-bold">{targetTransactions.length} 笔</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span>累计支出总额:</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono font-semibold">
                ¥{totalExpense.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span>累计收入总额:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                ¥{totalIncome.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            取消
          </button>

          <button
            id="btn-execute-export"
            onClick={handleExecuteExport}
            disabled={targetTransactions.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>立即导出并下载 ({targetTransactions.length} 笔)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
