import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  RotateCw,
  ReceiptText,
  Filter,
  Check,
  RefreshCw,
  Wallet,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Transaction, FinancialAccount } from '../types';
import {
  parseUploadedTransactionFile,
  ImportParseResult,
  ParsedTransactionCandidate,
  downloadTransactionTemplate,
  findBestMatchingAccountId,
  getTransactionTypeLabel,
} from '../lib/transactionImportExport';
import { formatCurrency } from '../lib/formatters';

interface TransactionImportModalProps {
  accounts: FinancialAccount[];
  existingTransactions: Transaction[];
  onClose: () => void;
  onImportConfirm: (
    importedTransactions: Transaction[],
    syncAccountBalances: boolean
  ) => void;
  onShowToast: (msg: string) => void;
}

export const TransactionImportModal: React.FC<TransactionImportModalProps> = ({
  accounts,
  existingTransactions,
  onClose,
  onImportConfirm,
  onShowToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');

  // Mapping state: [detectedName]: targetAccountId
  const [accountMappings, setAccountMappings] = useState<Record<string, string>>({});
  // Global fallback account
  const [fallbackAccountId, setFallbackAccountId] = useState<string>(accounts[0]?.id || '');
  // Sync account balance option
  const [syncAccountBalances, setSyncAccountBalances] = useState<boolean>(true);
  // Candidate rows state
  const [candidates, setCandidates] = useState<ParsedTransactionCandidate[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File size formatter
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Process File
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setIsParsing(true);
    setUploadedFileName(file.name);
    setUploadedFileSize(formatFileSize(file.size));

    try {
      const result = await parseUploadedTransactionFile(file, existingTransactions, accounts);
      setParseResult(result);
      setCandidates(result.candidates);

      // Initialize account mappings
      const initialMap: Record<string, string> = {};
      result.detectedAccountNames.forEach((name) => {
        const matched = findBestMatchingAccountId(name, accounts);
        initialMap[name] = matched || accounts[0]?.id || '';
      });
      setAccountMappings(initialMap);

      if (result.candidates.length === 0) {
        onShowToast('未能从文件中提取到有效流水，请检查文件格式或下载标准模板');
      } else {
        onShowToast(`已解析出 ${result.candidates.length} 条流水，有效 ${result.validRows} 笔`);
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(`解析失败: ${err.message || '文件读取错误'}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Account mapping change handler
  const handleMappingChange = (detectedName: string, newAccountId: string) => {
    setAccountMappings((prev) => ({ ...prev, [detectedName]: newAccountId }));
    // Update candidate transactions
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.accountNameOriginal === detectedName) {
          return {
            ...c,
            matchedAccountId: newAccountId,
            transaction: {
              ...c.transaction,
              accountId: newAccountId,
            },
          };
        }
        return c;
      })
    );
  };

  // Toggle single candidate selection
  const handleToggleSelect = (tempId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, selected: !c.selected } : c))
    );
  };

  // Toggle select all
  const handleToggleSelectAll = (select: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: select && c.isValid })));
  };

  // Single candidate account change
  const handleRowAccountChange = (tempId: string, accId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.tempId === tempId) {
          return {
            ...c,
            matchedAccountId: accId,
            transaction: {
              ...c.transaction,
              accountId: accId,
            },
          };
        }
        return c;
      })
    );
  };

  // Filtered candidate list for display
  const displayCandidates = candidates.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.transaction.description.toLowerCase().includes(q) ||
      c.transaction.category.toLowerCase().includes(q) ||
      (c.transaction.merchant && c.transaction.merchant.toLowerCase().includes(q)) ||
      c.transaction.date.includes(q) ||
      (c.accountNameOriginal && c.accountNameOriginal.toLowerCase().includes(q))
    );
  });

  const selectedCount = candidates.filter((c) => c.selected).length;
  const selectedExpense = candidates
    .filter((c) => c.selected && c.transaction.type === 'EXPENSE')
    .reduce((sum, c) => sum + c.transaction.amount, 0);
  const selectedIncome = candidates
    .filter((c) => c.selected && c.transaction.type === 'INCOME')
    .reduce((sum, c) => sum + c.transaction.amount, 0);

  // Submit Import
  const handleConfirmImport = () => {
    const toImport = candidates
      .filter((c) => c.selected && c.isValid)
      .map((c) => ({
        ...c.transaction,
        accountId: c.matchedAccountId || fallbackAccountId || accounts[0]?.id || '',
      }));

    if (toImport.length === 0) {
      onShowToast('请至少勾选一笔有效的流水记录进行导入');
      return;
    }

    onImportConfirm(toImport, syncAccountBalances);
    onShowToast(`🎉 成功导入 ${toImport.length} 笔流水记录！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                上传导入记账流水
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                支持支付宝、微信支付账单、银行流水表格与标准 CSV / Excel / JSON
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Step 1: Upload Dropzone */}
          {!parseResult ? (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/80 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-3xl bg-emerald-100/80 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  {isParsing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isParsing ? '正在智能解析流水数据...' : '点击选择文件 或 将账单表格拖拽至此处'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  支持 <strong>支付宝账单</strong>、<strong>微信支付账单</strong>、<strong>各类银行导出流水</strong> 及 <strong>标准 CSV / Excel / JSON</strong>
                </p>

                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap text-xs text-slate-400">
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">.csv</span>
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">.xlsx</span>
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">.xls</span>
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">.json</span>
                </div>
              </div>

              {/* Template Download Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      需要标准导入模板？
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      下载标准示例模板，填入您的日常记账数据即可一键批量导入
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTransactionTemplate('csv');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV 模板</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTransactionTemplate('xlsx');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx) 模板</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Parsed Result, Mapping & Preview */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {uploadedFileName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300">
                        {parseResult.sourceDescription}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      大小: {uploadedFileSize} · 识别有效流水 <strong>{parseResult.validRows}</strong> 笔
                      {parseResult.duplicateRows > 0 && (
                        <span className="text-amber-700 dark:text-amber-400 font-medium ml-1.5">
                          (发现 {parseResult.duplicateRows} 笔疑似与现有流水重复)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setParseResult(null);
                    setCandidates([]);
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline self-start sm:self-center"
                >
                  重新上传其他文件
                </button>
              </div>

              {/* Account Mapping Section */}
              {parseResult.detectedAccountNames.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        智能账户映射规整
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      自动匹配或指派导入流水所属的资产账户
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {parseResult.detectedAccountNames.map((detectedName) => (
                      <div
                        key={detectedName}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                            账单内名称: <span className="text-emerald-700 dark:text-emerald-400">{detectedName}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs text-slate-400">➔ 映射至:</span>
                          <select
                            value={accountMappings[detectedName] || fallbackAccountId}
                            onChange={(e) => handleMappingChange(detectedName, e.target.value)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                          >
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Options & Selection Statistics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncAccountBalances}
                      onChange={(e) => setSyncAccountBalances(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      导入后同步增减对应账户的余额 / 欠款
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    已勾选 <strong className="text-slate-900 dark:text-white font-bold">{selectedCount}</strong> 笔
                  </span>
                  <span className="text-rose-600 font-semibold font-mono">
                    支出: ¥{selectedExpense.toFixed(2)}
                  </span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    收入: ¥{selectedIncome.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Table Controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    全选
                  </button>
                  <button
                    onClick={() => handleToggleSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    取消全选
                  </button>
                  {parseResult.duplicateRows > 0 && (
                    <button
                      onClick={() => {
                        setCandidates((prev) =>
                          prev.map((c) => ({
                            ...c,
                            selected: c.isValid && !c.isDuplicate,
                          }))
                        );
                        onShowToast('已自动取消勾选所有疑似重复记录');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-800/60 transition-colors"
                    >
                      仅保留非重复记录
                    </button>
                  )}
                </div>

                <div className="relative w-48 sm:w-64">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="在预览中搜索..."
                    className="w-full pl-3 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Transactions Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCount > 0 && selectedCount === candidates.filter((c) => c.isValid).length}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                      </th>
                      <th className="p-3">日期时间</th>
                      <th className="p-3">类型</th>
                      <th className="p-3">分类/说明</th>
                      <th className="p-3">商户/对手</th>
                      <th className="p-3">关联账户</th>
                      <th className="p-3 text-right">金额 (CNY)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {displayCandidates.map((c) => {
                      const isExpense = c.transaction.type === 'EXPENSE';
                      const isIncome = c.transaction.type === 'INCOME';
                      const isRepayment = c.transaction.type === 'REPAYMENT';
                      const isTransfer = c.transaction.type === 'TRANSFER';

                      return (
                        <tr
                          key={c.tempId}
                          onClick={() => handleToggleSelect(c.tempId)}
                          className={`cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                            !c.selected ? 'opacity-50' : ''
                          } ${c.isDuplicate ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={c.selected}
                              onChange={() => handleToggleSelect(c.tempId)}
                              disabled={!c.isValid}
                              className="rounded text-emerald-600"
                            />
                          </td>
                          <td className="p-3 font-mono whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {c.transaction.date} {c.transaction.time || ''}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isExpense
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                  : isIncome
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                  : isRepayment
                                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {getTransactionTypeLabel(c.transaction.type)}
                            </span>
                            {c.isDuplicate && (
                              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300">
                                疑似重复
                              </span>
                            )}
                          </td>
                          <td className="p-3 max-w-[200px]">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {c.transaction.description || c.transaction.category}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {c.transaction.category}
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                            {c.transaction.merchant || '-'}
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={c.matchedAccountId || fallbackAccountId}
                              onChange={(e) => handleRowAccountChange(c.tempId, e.target.value)}
                              className="text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                            <span
                              className={
                                isExpense
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isIncome
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }
                            >
                              {isExpense ? '-' : isIncome ? '+' : ''}¥{c.transaction.amount.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            取消
          </button>

          {parseResult ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setParseResult(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                上一步
              </button>
              <button
                id="btn-confirm-import"
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>确认导入 ({selectedCount} 笔流水)</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>选择账单文件</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
