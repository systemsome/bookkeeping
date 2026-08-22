import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Transaction, FinancialAccount, TransactionType } from '../types';

export interface TransactionExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  scope: 'all' | 'filtered';
  includeFields?: string[];
  filename?: string;
}

export interface ParsedTransactionCandidate {
  tempId: string;
  transaction: Transaction;
  rawRow: Record<string, any>;
  accountNameOriginal?: string;
  targetAccountNameOriginal?: string;
  matchedAccountId?: string;
  matchedTargetAccountId?: string;
  isDuplicate: boolean;
  isValid: boolean;
  errorMessage?: string;
  selected: boolean;
}

export interface ImportParseResult {
  fileType: 'alipay' | 'wechat' | 'standard_csv' | 'excel' | 'json' | 'unknown';
  sourceDescription: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  totalExpense: number;
  totalIncome: number;
  candidates: ParsedTransactionCandidate[];
  detectedAccountNames: string[];
}

/**
 * 格式化交易类型为中文显示名称
 */
export const getTransactionTypeLabel = (type: TransactionType): string => {
  switch (type) {
    case 'EXPENSE':
      return '支出';
    case 'INCOME':
      return '收入';
    case 'TRANSFER':
      return '转账';
    case 'REPAYMENT':
      return '还款';
    case 'LEND_OUT':
      return '借出款项';
    case 'COLLECT_LENT':
      return '收回借款';
    case 'BORROW_IN':
      return '借入借款';
    case 'PAY_BORROW':
      return '归还借款';
    default:
      return '支出';
  }
};

/**
 * 将中文类型转换为 TransactionType
 */
export const parseTransactionTypeFromLabel = (label: string): TransactionType => {
  if (!label) return 'EXPENSE';
  const clean = label.trim();
  if (clean.includes('收') || clean.includes('入账') || clean.includes('工资') || clean === '收入') {
    return 'INCOME';
  }
  if (clean.includes('还款') || clean.includes('信用卡还款') || clean.includes('白条还款')) {
    return 'REPAYMENT';
  }
  if (clean.includes('转账') || clean.includes('划转') || clean.includes('提现')) {
    return 'TRANSFER';
  }
  if (clean.includes('借出') || clean.includes('应收')) {
    return 'LEND_OUT';
  }
  if (clean.includes('收回') || clean.includes('收债')) {
    return 'COLLECT_LENT';
  }
  if (clean.includes('借入') || clean.includes('借款')) {
    return 'BORROW_IN';
  }
  if (clean.includes('归还') || clean.includes('还债')) {
    return 'PAY_BORROW';
  }
  return 'EXPENSE';
};

/**
 * 导出流水为 CSV / XLSX / JSON
 */
export const exportTransactions = (
  transactions: Transaction[],
  accounts: FinancialAccount[],
  options: TransactionExportOptions
): void => {
  const accountMap = new Map<string, FinancialAccount>();
  accounts.forEach((a) => accountMap.set(a.id, a));

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const baseFilename = options.filename || `财务记账流水明细_${dateStr}`;

  if (options.format === 'json') {
    const jsonStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `${baseFilename}.json`);
    return;
  }

  // 整理表格行数据
  const rows = transactions.map((t, idx) => {
    const acc = accountMap.get(t.accountId);
    const targetAcc = t.targetAccountId ? accountMap.get(t.targetAccountId) : null;
    return {
      '序号': idx + 1,
      '交易日期': t.date || '',
      '交易时间': t.time || '',
      '交易类型': getTransactionTypeLabel(t.type),
      '交易分类': t.category || '',
      '记账金额(CNY)': t.amount,
      '币种': t.currency || 'CNY',
      '外币原币金额': t.originalAmount !== undefined ? t.originalAmount : '',
      '折算汇率': t.exchangeRate !== undefined ? t.exchangeRate : '',
      '扣款/收支账户': acc ? acc.name : '未指定账户',
      '目标账户': targetAcc ? targetAcc.name : '',
      '商户/交易对手': t.merchant || t.counterparty || '',
      '标签': t.tag || '',
      '备注说明': t.description || '',
      '交易流水号(ID)': t.id,
    };
  });

  if (options.format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows);
    // 设置列宽
    ws['!cols'] = [
      { wch: 6 },  // 序号
      { wch: 12 }, // 日期
      { wch: 8 },  // 时间
      { wch: 10 }, // 类型
      { wch: 12 }, // 分类
      { wch: 14 }, // 金额
      { wch: 8 },  // 币种
      { wch: 12 }, // 原币金额
      { wch: 10 }, // 汇率
      { wch: 16 }, // 扣款账户
      { wch: 16 }, // 目标账户
      { wch: 16 }, // 商户/对方
      { wch: 10 }, // 标签
      { wch: 22 }, // 备注
      { wch: 20 }, // ID
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '记账流水明细');
    XLSX.writeFile(wb, `${baseFilename}.xlsx`);
    return;
  }

  // 默认 CSV 导出 (使用 \uFEFF UTF-8 BOM 确保 Excel/WPS 打开不乱码)
  const csvContent = Papa.unparse(rows);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${baseFilename}.csv`);
};

/**
 * 触发文件下载辅助函数
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 下载标准流水导入模板 (CSV / XLSX)
 */
export const downloadTransactionTemplate = (format: 'csv' | 'xlsx' = 'csv'): void => {
  const sampleData = [
    {
      '交易日期': '2026-08-21',
      '交易时间': '12:30',
      '交易类型': '支出',
      '交易分类': '餐饮美食',
      '记账金额': 38.5,
      '支付账户': '支付宝',
      '目标账户': '',
      '商户/交易对手': '麦当劳餐厅',
      '币种': 'CNY',
      '原币金额': '',
      '汇率': '',
      '标签': '日常',
      '备注说明': '工作日午餐汉堡套餐',
    },
    {
      '交易日期': '2026-08-20',
      '交易时间': '10:00',
      '交易类型': '收入',
      '交易分类': '工资薪酬',
      '记账金额': 15000.0,
      '支付账户': '招商银行借记卡',
      '目标账户': '',
      '商户/交易对手': '公司财务部',
      '币种': 'CNY',
      '原币金额': '',
      '汇率': '',
      '标签': '工资',
      '备注说明': '8月份月度税后薪酬发放',
    },
    {
      '交易日期': '2026-08-19',
      '交易时间': '19:45',
      '交易类型': '支出',
      '交易分类': '电子数码',
      '记账金额': 699.0,
      '支付账户': '招商经典白金卡',
      '目标账户': '',
      '商户/交易对手': 'Apple 官方直营店',
      '币种': 'CNY',
      '原币金额': '',
      '汇率': '',
      '标签': '数码',
      '备注说明': '购买无线耳机配件',
    },
    {
      '交易日期': '2026-08-18',
      '交易时间': '15:20',
      '交易类型': '转账',
      '交易分类': '资金划转',
      '记账金额': 2000.0,
      '支付账户': '招商银行借记卡',
      '目标账户': '余额宝',
      '商户/交易对手': '自己',
      '币种': 'CNY',
      '原币金额': '',
      '汇率': '',
      '标签': '理财',
      '备注说明': '转入余额宝理财',
    },
    {
      '交易日期': '2026-08-17',
      '交易时间': '16:10',
      '交易类型': '支出',
      '交易分类': '应用订阅',
      '记账金额': 71.9,
      '支付账户': '招商经典白金卡',
      '目标账户': '',
      '商户/交易对手': 'ChatGPT Plus',
      '币种': 'USD',
      '原币金额': 9.99,
      '汇率': 7.2,
      '标签': 'AI工具',
      '备注说明': '月度开发者订阅 (外币折算)',
    },
  ];

  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 25 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '记账流水导入模板');
    XLSX.writeFile(wb, '记账流水导入标准模板.xlsx');
  } else {
    const csvContent = Papa.unparse(sampleData);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, '记账流水导入标准模板.csv');
  }
};

/**
 * 智能匹配账户：根据导入文件里的账户名匹配现有账户
 */
export const findBestMatchingAccountId = (
  rawAccountName: string | undefined,
  accounts: FinancialAccount[]
): string | undefined => {
  if (!rawAccountName || !rawAccountName.trim()) return undefined;
  const target = rawAccountName.trim().toLowerCase();

  // 1. 完全名称匹配
  const exact = accounts.find((a) => a.name.toLowerCase() === target);
  if (exact) return exact.id;

  // 2. 卡号后4位匹配 (如 "招商银行(8888)" 匹配 cardNumberLast4 为 "8888")
  const digitsMatch = target.match(/\d{4}/);
  if (digitsMatch) {
    const digits = digitsMatch[0];
    const cardMatch = accounts.find((a) => a.cardNumberLast4 === digits);
    if (cardMatch) return cardMatch.id;
  }

  // 3. 关键字包含匹配
  const partial = accounts.find(
    (a) =>
      target.includes(a.name.toLowerCase()) ||
      a.name.toLowerCase().includes(target) ||
      (a.bankName && target.includes(a.bankName.toLowerCase()))
  );
  if (partial) return partial.id;

  // 4. 特殊常见别名匹配
  if (target.includes('微信') || target.includes('零钱')) {
    const wx = accounts.find((a) => a.category === 'ALIPAY' || a.name.includes('微信') || a.name.includes('零钱'));
    if (wx) return wx.id;
  }
  if (target.includes('支付宝') || target.includes('花呗') || target.includes('余额宝')) {
    const ali = accounts.find(
      (a) => a.category === 'ALIPAY' || a.category === 'HUABEI' || a.category === 'YUEBAO' || a.name.includes('支付宝')
    );
    if (ali) return ali.id;
  }

  return undefined;
};

/**
 * 解析并检测上传的文件 (CSV, XLSX, XLS, JSON)
 */
export const parseUploadedTransactionFile = async (
  file: File,
  existingTransactions: Transaction[],
  accounts: FinancialAccount[]
): Promise<ImportParseResult> => {
  const fileName = file.name.toLowerCase();

  // 1. JSON 文件处理
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    return parseJsonTransactionData(text, existingTransactions, accounts);
  }

  // 2. Excel (.xlsx, .xls) 处理
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // 转换为二维数组解析
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
    return parseMatrixTransactionData(rawMatrix, existingTransactions, accounts, 'excel');
  }

  // 3. CSV / TSV / 文本处理 (智能兼容 UTF-8 与 GBK/GB2312 编码)
  const buffer = await file.arrayBuffer();
  let csvText = '';
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    csvText = utf8Decoder.decode(buffer);
  } catch {
    // UTF-8 解码失败时尝试 GBK / GB2312 (国内银行/支付宝导出常用编码)
    try {
      const gbkDecoder = new TextDecoder('gbk');
      csvText = gbkDecoder.decode(buffer);
    } catch {
      const fallbackDecoder = new TextDecoder('utf-8');
      csvText = fallbackDecoder.decode(buffer);
    }
  }

  // 使用 PapaParse 解析 CSV 内容为二维数组
  const parsedCsv = Papa.parse(csvText, {
    skipEmptyLines: 'greedy',
  });

  const matrix = parsedCsv.data as string[][];
  return parseMatrixTransactionData(matrix, existingTransactions, accounts, 'standard_csv');
};

/**
 * 解析 JSON 数据
 */
const parseJsonTransactionData = (
  text: string,
  existingTransactions: Transaction[],
  accounts: FinancialAccount[]
): ImportParseResult => {
  try {
    const parsed = JSON.parse(text);
    const txArray: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.transactions)
      ? parsed.transactions
      : [];

    if (txArray.length === 0) {
      return {
        fileType: 'json',
        sourceDescription: 'JSON 格式数据 (未提取到流水明细)',
        totalRows: 0,
        validRows: 0,
        duplicateRows: 0,
        totalExpense: 0,
        totalIncome: 0,
        candidates: [],
        detectedAccountNames: [],
      };
    }

    const defaultAccId = accounts[0]?.id || 'acc_default';
    const detectedAccounts = new Set<string>();
    const candidates: ParsedTransactionCandidate[] = [];

    let totalExpense = 0;
    let totalIncome = 0;
    let duplicateCount = 0;

    txArray.forEach((row, idx) => {
      const amount = Math.abs(parseFloat(row.amount) || 0);
      const type = (row.type as TransactionType) || 'EXPENSE';
      const date = normalizeDateString(row.date);
      const time = row.time || '';
      const category = row.category || (type === 'INCOME' ? '收入' : '日常消费');
      const desc = row.description || row.desc || category;
      const merchant = row.merchant || row.counterparty || '';

      const matchedAccId =
        (row.accountId && accounts.some((a) => a.id === row.accountId) ? row.accountId : undefined) ||
        findBestMatchingAccountId(row.accountName, accounts) ||
        defaultAccId;

      const isDup = isTransactionDuplicate(
        { date, amount, type, description: desc, merchant },
        existingTransactions
      );

      if (isDup) duplicateCount++;
      if (type === 'EXPENSE') totalExpense += amount;
      if (type === 'INCOME') totalIncome += amount;

      const tx: Transaction = {
        id: row.id || `tx_import_${Date.now()}_${idx}`,
        type,
        amount,
        originalAmount: row.originalAmount,
        currency: row.currency || 'CNY',
        exchangeRate: row.exchangeRate,
        date,
        time,
        accountId: matchedAccId,
        targetAccountId: row.targetAccountId,
        category,
        subCategory: row.subCategory,
        tag: row.tag || '导入',
        description: desc,
        merchant,
        counterparty: row.counterparty,
        createdAt: new Date().toISOString(),
      };

      candidates.push({
        tempId: `tmp_${idx}`,
        transaction: tx,
        rawRow: row,
        accountNameOriginal: row.accountName,
        matchedAccountId: matchedAccId,
        isDuplicate: isDup,
        isValid: amount > 0 && !!date,
        selected: amount > 0 && !isDup,
      });
    });

    return {
      fileType: 'json',
      sourceDescription: 'JSON 结构化流水数据',
      totalRows: txArray.length,
      validRows: candidates.filter((c) => c.isValid).length,
      duplicateRows: duplicateCount,
      totalExpense,
      totalIncome,
      candidates,
      detectedAccountNames: Array.from(detectedAccounts),
    };
  } catch (err: any) {
    return {
      fileType: 'json',
      sourceDescription: 'JSON 解析异常',
      totalRows: 0,
      validRows: 0,
      duplicateRows: 0,
      totalExpense: 0,
      totalIncome: 0,
      candidates: [],
      detectedAccountNames: [],
    };
  }
};

/**
 * 核心表格矩阵解析器：智能识别 支付宝 / 微信 / 标准表格 / 银行账单
 */
const parseMatrixTransactionData = (
  matrix: any[][],
  existingTransactions: Transaction[],
  accounts: FinancialAccount[],
  baseType: 'excel' | 'standard_csv'
): ImportParseResult => {
  if (!matrix || matrix.length === 0) {
    return {
      fileType: 'unknown',
      sourceDescription: '空文件或无数据',
      totalRows: 0,
      validRows: 0,
      duplicateRows: 0,
      totalExpense: 0,
      totalIncome: 0,
      candidates: [],
      detectedAccountNames: [],
    };
  }

  // 1. 寻找表头行 (Header Row)
  let headerIndex = -1;
  let fileKind: 'alipay' | 'wechat' | 'standard_csv' | 'excel' = baseType;
  let sourceDesc = '标准流水表格';

  for (let r = 0; r < Math.min(matrix.length, 30); r++) {
    const rowStr = matrix[r].map((c) => String(c || '').trim()).join(' ');

    // 检查支付宝格式
    if (
      (rowStr.includes('交易时间') || rowStr.includes('交易创建时间')) &&
      (rowStr.includes('交易分类') || rowStr.includes('交易对方') || rowStr.includes('金额')) &&
      (rowStr.includes('收/支') || rowStr.includes('收/付款方式') || rowStr.includes('交易来源地'))
    ) {
      headerIndex = r;
      fileKind = 'alipay';
      sourceDesc = '支付宝官方流水账单 (Alipay)';
      break;
    }

    // 检查微信支付格式
    if (
      rowStr.includes('交易时间') &&
      rowStr.includes('交易类型') &&
      rowStr.includes('收/支') &&
      (rowStr.includes('金额') || rowStr.includes('金额(元)')) &&
      (rowStr.includes('支付方式') || rowStr.includes('交易单号'))
    ) {
      headerIndex = r;
      fileKind = 'wechat';
      sourceDesc = '微信支付官方账单 (WeChat Pay)';
      break;
    }

    // 检查标准通用表头
    if (
      (rowStr.includes('日期') || rowStr.includes('时间') || rowStr.includes('date')) &&
      (rowStr.includes('金额') || rowStr.includes('amount') || rowStr.includes('收/支'))
    ) {
      headerIndex = r;
      fileKind = baseType;
      sourceDesc = baseType === 'excel' ? 'Excel 电子表格' : 'CSV 数据流水表格';
      break;
    }
  }

  // 如果没有找到特定表头，默认第 0 行作为表头
  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const rawHeaders = matrix[headerIndex].map((h) => String(h || '').trim());
  const headerMap = new Map<string, number>();
  rawHeaders.forEach((h, idx) => {
    if (h) headerMap.set(h, idx);
  });

  // 列别名查找辅助函数
  const findCol = (...aliases: string[]): number => {
    for (const a of aliases) {
      for (const [headerText, colIdx] of headerMap.entries()) {
        if (headerText.toLowerCase() === a.toLowerCase() || headerText.includes(a)) {
          return colIdx;
        }
      }
    }
    return -1;
  };

  const colDate = findCol('交易时间', '交易创建时间', '日期', '交易日期', 'Date', 'time', '记账日期');
  const colType = findCol('收/支', '收支类型', '交易类型', '类型', 'Type', '收支');
  const colCategory = findCol('交易分类', '分类', '交易类型', 'Category', '消费类别');
  const colAmount = findCol('金额(元)', '金额（元）', '金额', '记账金额', 'Amount', '收支金额');
  const colAccount = findCol('收/付款方式', '支付方式', '付款账户', '支付账户', '扣款账户', '账户', 'Account');
  const colTargetAccount = findCol('目标账户', '收款账户', '转入账户', 'TargetAccount');
  const colMerchant = findCol('交易对方', '商户', '交易对手', 'Merchant', '对方名称');
  const colDesc = findCol('商品说明', '商品名称', '商品', '备注说明', '备注', '说明', 'Description', 'Note');
  const colCurrency = findCol('币种', 'Currency');
  const colOriginalAmount = findCol('外币金额', '原币金额', 'OriginalAmount');
  const colExchangeRate = findCol('汇率', '折算汇率', 'ExchangeRate');
  const colTag = findCol('标签', 'Tag');

  const defaultAccId = accounts[0]?.id || 'acc_default';
  const detectedAccountsSet = new Set<string>();
  const candidates: ParsedTransactionCandidate[] = [];

  let totalExpense = 0;
  let totalIncome = 0;
  let duplicateCount = 0;

  for (let r = headerIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0) continue;

    // 过滤末尾汇总或无效行
    const rowContent = row.join(' ').trim();
    if (
      rowContent.startsWith('----------------') ||
      rowContent.startsWith('注：') ||
      rowContent.startsWith('总计') ||
      rowContent.startsWith('共 ') ||
      rowContent.length === 0
    ) {
      continue;
    }

    const rawDateStr = colDate >= 0 ? String(row[colDate] || '').trim() : '';
    const rawTypeStr = colType >= 0 ? String(row[colType] || '').trim() : '';
    const rawCategoryStr = colCategory >= 0 ? String(row[colCategory] || '').trim() : '';
    const rawAmountStr = colAmount >= 0 ? String(row[colAmount] || '').trim() : '';
    const rawAccountStr = colAccount >= 0 ? String(row[colAccount] || '').trim() : '';
    const rawTargetAccountStr = colTargetAccount >= 0 ? String(row[colTargetAccount] || '').trim() : '';
    const rawMerchantStr = colMerchant >= 0 ? String(row[colMerchant] || '').trim() : '';
    const rawDescStr = colDesc >= 0 ? String(row[colDesc] || '').trim() : '';
    const rawCurrencyStr = colCurrency >= 0 ? String(row[colCurrency] || '').trim() : 'CNY';
    const rawOriginalAmountStr = colOriginalAmount >= 0 ? String(row[colOriginalAmount] || '').trim() : '';
    const rawExchangeRateStr = colExchangeRate >= 0 ? String(row[colExchangeRate] || '').trim() : '';
    const rawTagStr = colTag >= 0 ? String(row[colTag] || '').trim() : '';

    // 解析金额
    const cleanAmountStr = rawAmountStr.replace(/[¥$,\s+]/g, '');
    const numAmount = Math.abs(parseFloat(cleanAmountStr) || 0);

    if (numAmount === 0 && !rawDescStr && !rawMerchantStr) {
      continue; // 跳过空无效行
    }

    // 解析日期与时间
    const { date, time } = parseDateTime(rawDateStr);

    // 解析收支类型
    let txType: TransactionType = 'EXPENSE';
    if (rawTypeStr === '收入' || rawTypeStr.includes('收') || cleanAmountStr.startsWith('+')) {
      txType = 'INCOME';
    } else if (rawTypeStr.includes('还款') || rawCategoryStr.includes('还款') || rawDescStr.includes('还款')) {
      txType = 'REPAYMENT';
    } else if (rawTypeStr.includes('转账') || rawCategoryStr.includes('转账') || rawDescStr.includes('转账')) {
      txType = 'TRANSFER';
    } else if (rawTypeStr.includes('不计收支') || rawTypeStr.includes('其他')) {
      // 支付宝/微信中部分转账或退款显示不计收支，根据描述判定
      if (rawDescStr.includes('退款') || rawCategoryStr.includes('退款')) {
        txType = 'INCOME';
      } else if (rawDescStr.includes('还款')) {
        txType = 'REPAYMENT';
      } else {
        txType = 'EXPENSE';
      }
    } else {
      txType = parseTransactionTypeFromLabel(rawTypeStr);
    }

    // 分类提取
    const category =
      rawCategoryStr ||
      (txType === 'INCOME' ? '收入进账' : txType === 'REPAYMENT' ? '还信用卡/白条' : '日常消费');

    // 描述与商户
    const description = rawDescStr || rawMerchantStr || category;
    const merchant = rawMerchantStr || '';

    // 记录检测到的账户名
    if (rawAccountStr) {
      detectedAccountsSet.add(rawAccountStr);
    }

    // 尝试匹配账户
    const matchedAccId =
      findBestMatchingAccountId(rawAccountStr, accounts) ||
      defaultAccId;

    const matchedTargetAccId = rawTargetAccountStr
      ? findBestMatchingAccountId(rawTargetAccountStr, accounts)
      : undefined;

    // 查重
    const isDup = isTransactionDuplicate(
      { date, amount: numAmount, type: txType, description, merchant },
      existingTransactions
    );

    if (isDup) duplicateCount++;
    if (txType === 'EXPENSE') totalExpense += numAmount;
    if (txType === 'INCOME') totalIncome += numAmount;

    const originalAmount = rawOriginalAmountStr ? parseFloat(rawOriginalAmountStr.replace(/[$,\s]/g, '')) : undefined;
    const exchangeRate = rawExchangeRateStr ? parseFloat(rawExchangeRateStr) : undefined;

    const tx: Transaction = {
      id: `tx_import_${Date.now()}_${r}`,
      type: txType,
      amount: numAmount,
      originalAmount: originalAmount && !isNaN(originalAmount) ? originalAmount : undefined,
      currency: rawCurrencyStr && rawCurrencyStr !== '' ? rawCurrencyStr.toUpperCase() : 'CNY',
      exchangeRate: exchangeRate && !isNaN(exchangeRate) ? exchangeRate : undefined,
      date,
      time,
      accountId: matchedAccId,
      targetAccountId: matchedTargetAccId,
      category,
      tag: rawTagStr || (fileKind === 'alipay' ? '支付宝' : fileKind === 'wechat' ? '微信支付' : '表格导入'),
      description,
      merchant,
      counterparty: txType === 'LEND_OUT' || txType === 'BORROW_IN' ? merchant : undefined,
      createdAt: new Date().toISOString(),
    };

    const isValid = numAmount > 0 && !!date;

    candidates.push({
      tempId: `tmp_${r}`,
      transaction: tx,
      rawRow: row,
      accountNameOriginal: rawAccountStr,
      targetAccountNameOriginal: rawTargetAccountStr,
      matchedAccountId: matchedAccId,
      matchedTargetAccountId: matchedTargetAccId,
      isDuplicate: isDup,
      isValid,
      errorMessage: !isValid ? '金额必须大于0且日期有效' : undefined,
      selected: isValid && !isDup,
    });
  }

  return {
    fileType: fileKind,
    sourceDescription: sourceDesc,
    totalRows: candidates.length,
    validRows: candidates.filter((c) => c.isValid).length,
    duplicateRows: duplicateCount,
    totalExpense,
    totalIncome,
    candidates,
    detectedAccountNames: Array.from(detectedAccountsSet),
  };
};

/**
 * 日期时间智能格式化
 */
const parseDateTime = (raw: string): { date: string; time: string } => {
  if (!raw || !raw.trim()) {
    const now = new Date();
    return {
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
  }

  const clean = raw.trim();

  // 1. 处理常见格式 YYYY-MM-DD HH:mm:ss 或 YYYY/MM/DD HH:mm
  const parts = clean.split(/\s+/);
  let datePart = parts[0] || '';
  let timePart = parts[1] || '';

  // 转换 2026/08/21 或 2026.08.21 为 2026-08-21
  datePart = datePart.replace(/[\/\.]/g, '-');
  const dateSegments = datePart.split('-');
  if (dateSegments.length === 3) {
    const y = dateSegments[0].padStart(4, '20');
    const m = dateSegments[1].padStart(2, '0');
    const d = dateSegments[2].padStart(2, '0');
    datePart = `${y}-${m}-${d}`;
  } else {
    // 无法直接解析时使用今天
    const now = new Date();
    datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  if (timePart) {
    const timeSegments = timePart.split(':');
    if (timeSegments.length >= 2) {
      timePart = `${timeSegments[0].padStart(2, '0')}:${timeSegments[1].padStart(2, '0')}`;
    }
  } else {
    timePart = '00:00';
  }

  return { date: datePart, time: timePart };
};

const normalizeDateString = (raw: any): string => {
  if (!raw) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  return String(raw).substring(0, 10).replace(/[\/\.]/g, '-');
};

/**
 * 查重判断：判断是否与已有流水重复
 */
const isTransactionDuplicate = (
  candidate: { date: string; amount: number; type: TransactionType; description: string; merchant: string },
  existing: Transaction[]
): boolean => {
  return existing.some((t) => {
    const sameDate = t.date === candidate.date;
    const sameAmount = Math.abs(t.amount - candidate.amount) < 0.001;
    const sameType = t.type === candidate.type;
    const sameDesc =
      t.description === candidate.description ||
      (candidate.merchant && t.merchant === candidate.merchant) ||
      (t.description && candidate.description && (t.description.includes(candidate.description) || candidate.description.includes(t.description)));

    return sameDate && sameAmount && sameType && sameDesc;
  });
};
