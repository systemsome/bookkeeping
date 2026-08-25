import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Receipt,
  X,
  Download,
  Share2,
  Copy,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Calendar,
  Store,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Stamp as StampIcon,
  Palette,
  Check,
  Filter,
  Layers,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import { Transaction, FinancialAccount } from '../types';
import { playPOSSound } from '../lib/receiptSound';
import { sortTransactions } from '../lib/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: FinancialAccount[];
  selectedDate?: string | null;
  initialSingleTxId?: string | null;
}

type ReceiptTheme = 'classic' | 'cafe' | 'cyber' | 'muji';
type ScopeType = 'TODAY' | 'MONTH' | 'DATE' | 'ALL' | 'SINGLE';
type StampShape = 'circle' | 'rect' | 'badge';
export type StampPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'middle-right'
  | 'center'
  | 'middle-left'
  | 'top-right'
  | 'top-left';

const STAMP_POSITIONS: { id: StampPosition; label: string; desc: string }[] = [
  { id: 'bottom-right', label: '右下角', desc: '经典收据盖章' },
  { id: 'bottom-left', label: '左下角', desc: '底部签名处' },
  { id: 'bottom-center', label: '底居中', desc: '正下方封签' },
  { id: 'middle-right', label: '中右侧', desc: '金额汇总旁' },
  { id: 'center', label: '正中央', desc: '居中透印水印' },
  { id: 'middle-left', label: '中左侧', desc: '明细列表旁' },
  { id: 'top-right', label: '右上角', desc: '标头右侧' },
  { id: 'top-left', label: '左上角', desc: '标头左侧' },
];

const STAMP_ROTATIONS = [
  { value: -25, label: '-25° 醒目' },
  { value: -12, label: '-12° 经典' },
  { value: 0, label: '0° 平整' },
  { value: 12, label: '+12° 微倾' },
  { value: 25, label: '+25° 动感' },
];

const QUOTES = [
  '每一次记账，都是对美好生活的用心投资 ☕',
  '钱并没有真正离开，只是换成了你喜欢的样子 ✨',
  '理性消费，丰俭由人，财富自由在路上 🚀',
  '把日子过得有声有色，把账目算得明明白白 🌸',
  '掌控收支，就是掌控人生的主动权 💡',
  '日积月累，小金库终将汇聚成星辰大海 🌟',
];

const PRESET_STORE_NAMES = [
  '我的生活记账本',
  '极简生活馆',
  '深夜食堂',
  '幸福便利店',
  '梦想储蓄所',
  '美好生活杂货铺',
];

const PRESET_STAMPS = [
  '已结算',
  '心满意足',
  '幸福买单',
  '犒劳自己',
  '理性消费',
  '值得拥有',
  '已核销',
  '快乐加倍',
];

const STAMP_COLORS = [
  { id: 'crimson', name: '朱砂红', text: 'text-rose-600 dark:text-rose-500', border: 'border-rose-600 dark:border-rose-500', bg: 'bg-rose-500' },
  { id: 'amber', name: '暖金橙', text: 'text-amber-600 dark:text-amber-500', border: 'border-amber-600 dark:border-amber-500', bg: 'bg-amber-500' },
  { id: 'emerald', name: '翡翠绿', text: 'text-emerald-600 dark:text-emerald-500', border: 'border-emerald-600 dark:border-emerald-500', bg: 'bg-emerald-500' },
  { id: 'blue', name: '深海蓝', text: 'text-blue-600 dark:text-blue-500', border: 'border-blue-600 dark:border-blue-500', bg: 'bg-blue-500' },
  { id: 'purple', name: '紫罗兰', text: 'text-purple-600 dark:text-purple-500', border: 'border-purple-600 dark:border-purple-500', bg: 'bg-purple-500' },
  { id: 'charcoal', name: '玄墨黑', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-800 dark:border-slate-200', bg: 'bg-slate-700' },
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  accounts = [],
  selectedDate,
  initialSingleTxId,
}) => {
  // Today and current month dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // Extract all available months from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    set.add(currentMonthStr);
    return Array.from(set).sort().reverse();
  }, [transactions, currentMonthStr]);

  // Extract all dates that have transactions
  const datesWithTransactions = useMemo(() => {
    const map = new Map<string, { count: number; expense: number; income: number }>();
    transactions.forEach((t) => {
      if (t.date) {
        const entry = map.get(t.date) || { count: 0, expense: 0, income: 0 };
        entry.count += 1;
        if (t.type === 'EXPENSE') entry.expense += t.amount;
        if (t.type === 'INCOME') entry.income += t.amount;
        map.set(t.date, entry);
      }
    });
    return Array.from(map.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  // All transactions sorted chronologically descending (latest first)
  const sortedAllTransactions = useMemo(() => {
    return sortTransactions(transactions, 'desc');
  }, [transactions]);

  // Latest recorded transaction ID (最后一笔/最新记账明细)
  const latestTxId = useMemo(() => {
    return sortedAllTransactions[0]?.id || null;
  }, [sortedAllTransactions]);

  // Theme & Scope States
  const [theme, setTheme] = useState<ReceiptTheme>('classic');
  const [scope, setScope] = useState<ScopeType>(() => {
    if (initialSingleTxId) return 'SINGLE';
    if (selectedDate) return 'DATE';
    return 'TODAY';
  });

  // Selected Start Date (起始日) and End Date (截止日) filters
  const [customStartDate, setCustomStartDate] = useState<string>(() => selectedDate || todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(() => selectedDate || todayStr);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (selectedDate && selectedDate.length >= 7) return selectedDate.substring(0, 7);
    return currentMonthStr;
  });

  // 单笔打单默认选择单笔明细为最后一笔记账明细
  const [singleTxId, setSingleTxId] = useState<string | null>(() => {
    return initialSingleTxId || (sortedAllTransactions[0]?.id ?? null);
  });
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('EXPENSE');

  // Custom Header & Custom Stamp States
  const [storeName, setStoreName] = useState<string>('我的生活记账本');
  const [storeSubtitle, setStoreSubtitle] = useState<string>('消费结算凭证');
  const [stampMainText, setStampMainText] = useState<string>('已结算');
  const [stampTopText, setStampTopText] = useState<string>('★ 官方认证 ★');
  const [stampBottomText, setStampBottomText] = useState<string>('消费入账');
  const [stampColorId, setStampColorId] = useState<string>('crimson');
  const [stampShape, setStampShape] = useState<StampShape>('circle');
  const [stampPosition, setStampPosition] = useState<StampPosition>('bottom-right');
  const [stampRotation, setStampRotation] = useState<number>(-12);

  // Controls auto-hide / collapse state
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'header' | 'stamp' | 'theme'>('header');

  // Realistic POS Printer & Cutting Blade Animation States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [printStage, setPrintStage] = useState<'idle' | 'printing' | 'cutting' | 'done'>('done');
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [isCutterActive, setIsCutterActive] = useState<boolean>(false);
  const [, setIsGeneratingImg] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [randomQuote, setRandomQuote] = useState<string>(QUOTES[0]);

  const receiptRef = useRef<HTMLDivElement>(null);

  const accountMap = useMemo(() => {
    const map = new Map<string, FinancialAccount>();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  // Sync initial single tx or selected date
  useEffect(() => {
    if (initialSingleTxId) {
      setSingleTxId(initialSingleTxId);
      setScope('SINGLE');
    } else if (!singleTxId && latestTxId) {
      setSingleTxId(latestTxId);
    }
  }, [initialSingleTxId, latestTxId, singleTxId]);

  useEffect(() => {
    if (selectedDate) {
      setCustomStartDate(selectedDate);
      setCustomEndDate(selectedDate);
      if (selectedDate.length >= 7) setSelectedMonth(selectedDate.substring(0, 7));
    }
  }, [selectedDate]);

  // Random quote & trigger print effect on modal open
  useEffect(() => {
    if (isOpen) {
      const idx = Math.floor(Math.random() * QUOTES.length);
      setRandomQuote(QUOTES[idx]);
      triggerPrintEffect();
    }
  }, [isOpen]);

  // Trigger high-fidelity print sequence with realistic cutter & stamp
  const triggerPrintEffect = () => {
    setPrintStage('printing');
    setShowStamp(false);
    setIsCutterActive(false);

    // Step 1: POS Scanner Beep & Thermal Motor Roll
    if (soundEnabled) {
      playPOSSound('beep');
      setTimeout(() => {
        playPOSSound('print');
      }, 180);
    }

    // Step 2: Paper reaches bottom, mechanical blade slides across (切纸)
    setTimeout(() => {
      setPrintStage('cutting');
      setIsCutterActive(true);
      if (soundEnabled) {
        playPOSSound('cutter');
      }
    }, 900);

    // Step 3: Paper separates slightly with a gentle release drop & Cash drawer Cha-ching!
    setTimeout(() => {
      setIsCutterActive(false);
      if (soundEnabled) {
        playPOSSound('chaching');
      }
    }, 1150);

    // Step 4: Rubber Stamp impacts with stamp thud sound & celebratory confetti
    setTimeout(() => {
      setPrintStage('done');
      setShowStamp(true);
      if (soundEnabled) {
        playPOSSound('stamp');
      }
      try {
        confetti({
          particleCount: 22,
          spread: 40,
          origin: { y: 0.72, x: 0.5 },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
        });
      } catch {
        // ignore
      }
    }, 1350);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    const newMonth = `${y}-${String(m).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
    setScope('MONTH');
    triggerPrintEffect();
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const newMonth = `${y}-${String(m).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
    setScope('MONTH');
    triggerPrintEffect();
  };

  // Quick Date Range Helpers
  const handleSetQuickRange = (preset: 'today' | 'yesterday' | '3days' | '7days' | '30days' | 'thisMonth') => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      const yStr = formatDate(yDate);
      setCustomStartDate(yStr);
      setCustomEndDate(yStr);
    } else if (preset === '3days') {
      const past = new Date();
      past.setDate(past.getDate() - 2);
      setCustomStartDate(formatDate(past));
      setCustomEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setCustomStartDate(formatDate(past));
      setCustomEndDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      setCustomStartDate(formatDate(past));
      setCustomEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setCustomStartDate(formatDate(firstDay));
      setCustomEndDate(todayStr);
    }

    setScope('DATE');
    triggerPrintEffect();
  };

  // Resolve valid date range
  const minDate = customStartDate <= customEndDate ? customStartDate : customEndDate;
  const maxDate = customStartDate <= customEndDate ? customEndDate : customStartDate;
  const isSingleDay = minDate === maxDate;

  // Filter transactions strictly based on selected scope and type
  const targetTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx) return false;
      
      if (scope === 'SINGLE') {
        const effectiveId = singleTxId || latestTxId;
        return effectiveId ? tx.id === effectiveId : false;
      }

      if (typeFilter === 'EXPENSE' && tx.type !== 'EXPENSE') return false;
      if (typeFilter === 'INCOME' && tx.type !== 'INCOME') return false;

      if (scope === 'DATE') {
        return tx.date >= minDate && tx.date <= maxDate;
      }
      if (scope === 'TODAY') {
        return tx.date === todayStr;
      }
      if (scope === 'MONTH') {
        return tx.date && tx.date.startsWith(selectedMonth);
      }
      return true; // ALL
    });
  }, [transactions, typeFilter, scope, singleTxId, latestTxId, minDate, maxDate, todayStr, selectedMonth]);

  // Calculate totals
  const totalExpense = useMemo(() => {
    return targetTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [targetTransactions]);

  const totalIncome = useMemo(() => {
    return targetTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [targetTransactions]);

  const netBalance = totalIncome - totalExpense;
  const itemCount = targetTransactions.length;

  const showNotification = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2500);
  };

  // Descriptive period label
  const periodLabel = useMemo(() => {
    if (scope === 'TODAY') return `今日小票 (${todayStr})`;
    if (scope === 'MONTH') return `月度汇总 (${selectedMonth} 月)`;
    if (scope === 'SINGLE') return `单笔流水专属小票`;
    if (scope === 'ALL') return `全量账单汇总 (${transactions.length} 笔)`;
    if (isSingleDay) return `指定日期 (${minDate})`;
    return `指定区间 (${minDate} 至 ${maxDate})`;
  }, [scope, todayStr, selectedMonth, transactions.length, isSingleDay, minDate, maxDate]);

  // Receipt ID & Timestamp based on selected date
  const receiptDateRef = scope === 'DATE' ? `${minDate.replace(/-/g, '')}${isSingleDay ? '' : `_${maxDate.replace(/-/g, '')}`}` : scope === 'MONTH' ? selectedMonth.replace(/-/g, '') : todayStr.replace(/-/g, '');
  const receiptNo = `POS-${receiptDateRef}-${String(itemCount).padStart(3, '0')}`;
  const printTimeStr = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 1. Download as PNG Image (Showing all transactions cleanly)
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      setIsGeneratingImg(true);
      if (soundEnabled) playPOSSound('tear');

      const el = receiptRef.current;

      const bgColor = {
        classic: '#ffffff',
        cafe: '#fbf7ee',
        cyber: '#020617',
        muji: '#fafafa',
      }[theme];

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: bgColor,
        style: {
          transform: 'none',
          margin: '0',
        },
      });

      const link = document.createElement('a');
      link.download = `账单小票_${receiptNo}.png`;
      link.href = dataUrl;
      link.click();

      showNotification('✅ 账单小票已保存为高清长图（含全部明细）！');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Failed to export receipt image:', err);
      showNotification('❌ 生成小票图片失败，请重试');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!receiptRef.current) return;
    try {
      setIsGeneratingImg(true);
      if (soundEnabled) playPOSSound('tear');

      const el = receiptRef.current;

      const bgColor = {
        classic: '#ffffff',
        cafe: '#fbf7ee',
        cyber: '#020617',
        muji: '#fafafa',
      }[theme];

      const blob = await toBlob(el, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: bgColor,
        style: {
          transform: 'none',
          margin: '0',
        },
      });

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showNotification('📋 小票图片已复制到剪贴板，可直接粘贴！');
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      } else {
        handleCopyText();
      }
    } catch (err) {
      console.error('Copy image failed:', err);
      handleCopyText();
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // 3. Copy Plain Text Receipt (Display ALL transactions without truncation)
  const handleCopyText = () => {
    const divider = '--------------------------------';
    const lines = [
      `🧾 【${storeName} · ${storeSubtitle}】`,
      `流水单号: ${receiptNo}`,
      `结算范围: ${periodLabel}`,
      `打印时间: ${todayStr} ${printTimeStr}`,
      `收银终端: 01号收银台 (记账员: 本人)`,
      divider,
      `[序号]  品类明细        方式        金额`,
    ];

    // List ALL items without truncation
    targetTransactions.forEach((t, i) => {
      const acc = accountMap.get(t.accountId);
      const accName = acc?.name || '默认账户';
      const typeSign = t.type === 'EXPENSE' ? '-' : '+';
      const desc = t.description ? `${t.category}(${t.description})` : t.category;
      lines.push(
        `${String(i + 1).padStart(2, '0')}.  ${desc.padEnd(12, ' ')}  ${accName.substring(0, 4)}  ${typeSign}¥${t.amount.toFixed(2)}`
      );
    });

    lines.push(divider);
    lines.push(`消费总笔数: ${itemCount} 笔`);
    lines.push(`总支出: ¥${totalExpense.toFixed(2)}`);
    if (totalIncome > 0) {
      lines.push(`同期总入账: +¥${totalIncome.toFixed(2)}`);
      lines.push(`收支净结余: ¥${netBalance.toFixed(2)}`);
    }
    lines.push(divider);
    lines.push(`印章: [${stampMainText}] · ${stampBottomText}`);
    lines.push(`寄语: ${randomQuote}`);
    lines.push(`★ 感谢惠顾 · 欢迎再次记账 ★`);

    navigator.clipboard.writeText(lines.join('\n'));
    showNotification('📄 纯文本小票（全部明细）已复制，可直接发微信或备忘录！');
  };

  if (!isOpen) return null;

  // Selected Stamp Color Config
  const selectedStampColor = STAMP_COLORS.find((c) => c.id === stampColorId) || STAMP_COLORS[0];

  // Theme styling configurations
  const themeStyles = {
    classic: {
      bg: 'bg-white',
      text: 'text-slate-900',
      font: 'font-mono',
      border: 'border-slate-300',
      accent: 'text-slate-800',
      divider: 'border-dashed border-slate-300',
      paperShadow: 'shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80',
      zigzagColor: '#ffffff',
    },
    cafe: {
      bg: 'bg-[#fbf7ee]',
      text: 'text-[#4a3b32]',
      font: 'font-serif',
      border: 'border-[#d8c7b5]',
      accent: 'text-[#6b4226]',
      divider: 'border-dashed border-[#d8c7b5]',
      paperShadow: 'shadow-xl shadow-[#5c4028]/15 ring-1 ring-[#e6dac9]',
      zigzagColor: '#fbf7ee',
    },
    cyber: {
      bg: 'bg-slate-950',
      text: 'text-emerald-400',
      font: 'font-mono',
      border: 'border-emerald-800/80',
      accent: 'text-emerald-300',
      divider: 'border-dashed border-emerald-800',
      paperShadow: 'shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-900/60',
      zigzagColor: '#020617',
    },
    muji: {
      bg: 'bg-[#fafafa]',
      text: 'text-[#2b2b2b]',
      font: 'font-sans',
      border: 'border-slate-200',
      accent: 'text-[#1e1e1e]',
      divider: 'border-dotted border-slate-300',
      paperShadow: 'shadow-xl shadow-slate-400/20 ring-1 ring-slate-200',
      zigzagColor: '#fafafa',
    },
  }[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-5 z-60 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-medium shadow-2xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-top-4 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  账单小票生成器
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  全明细完整打单
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                支持今日、当月汇总、起始日~截止日区间打单及全量明细输出
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Customization Toggle Button */}
            <button
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isControlsExpanded
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
              }`}
              title="展开/隐藏自定义标头、印章与风格设置"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isControlsExpanded ? '收起配置' : '外观配置'}</span>
              <span className="sm:hidden">配置</span>
              {isControlsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playPOSSound('beep');
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={soundEnabled ? '音效已开启（点击静音）' : '音效已关闭（点击开启）'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? '音效开' : '静音'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Prominent Scope & Date Selection Bar (清晰的一级筛选器) */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800/80 space-y-2.5 shrink-0">
          {/* Main Scope Tabs */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              {
                id: 'TODAY',
                label: '今日小票',
                icon: Calendar,
                badge: `${transactions.filter((t) => t.date === todayStr).length} 笔`,
              },
              {
                id: 'MONTH',
                label: '当月汇总',
                icon: CalendarDays,
                badge: `${transactions.filter((t) => t.date && t.date.startsWith(selectedMonth)).length} 笔`,
              },
              {
                id: 'DATE',
                label: '指定日期/区间',
                icon: Filter,
                badge: `${targetTransactions.length} 笔`,
              },
              {
                id: 'ALL',
                label: '全部流水',
                icon: Layers,
                badge: `${transactions.length} 笔`,
              },
              {
                id: 'SINGLE',
                label: '单笔打单',
                icon: Receipt,
                badge: '专属',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setScope(tab.id as ScopeType);
                    if (tab.id === 'SINGLE' && !singleTxId && latestTxId) {
                      setSingleTxId(latestTxId);
                    }
                    triggerPrintEffect();
                  }}
                  className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-1 ring-emerald-400 font-bold'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs">{tab.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      isActive ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-Controllers based on selected Scope */}
          {/* 1. Month Switcher (When scope is MONTH) */}
          {scope === 'MONTH' && (
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                  title="上一月"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-xs">上一月</span>
                </button>

                <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 font-mono">
                    {selectedMonth} 月度账单
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                  title="下一月"
                >
                  <span className="text-xs">下一月</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Month Dropdown fast selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 hidden sm:inline">选择月份:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    triggerPrintEffect();
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m} 月 ({transactions.filter((t) => t.date && t.date.startsWith(m)).length} 笔)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 2. Clickable Date Range Picker (起始日 + 截止日) & Quick Range Buttons (When scope is DATE) */}
          {scope === 'DATE' && (
            <div className="space-y-2.5 p-2.5 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in duration-150">
              {/* Start Date & End Date Inputs */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Start Date (起始日) */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
                    <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">起始日:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCustomStartDate(e.target.value);
                          triggerPrintEffect();
                        }
                      }}
                      className="bg-transparent text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

                  {/* End Date (截止日) */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
                    <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">截止日:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCustomEndDate(e.target.value);
                          triggerPrintEffect();
                        }
                      }}
                      className="bg-transparent text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-300 font-medium">
                  区间共 <strong className="text-emerald-400 font-mono font-bold">{targetTransactions.length}</strong> 笔明细
                </div>
              </div>

              {/* Quick Range Presets (快捷区间预设) */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-slate-400">快捷区间:</span>
                {[
                  { id: 'today', label: '今天' },
                  { id: 'yesterday', label: '昨天' },
                  { id: '3days', label: '近3天' },
                  { id: '7days', label: '近7天' },
                  { id: '30days', label: '近30天' },
                  { id: 'thisMonth', label: '本月至今' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSetQuickRange(preset.id as any)}
                    className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-[11px] font-medium transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Clickable Quick Date Chips */}
              {datesWithTransactions.length > 0 && (
                <div className="pt-1 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>快捷单日打单 (点击直接填入):</span>
                    <span className="text-[10px] text-slate-500">点击任意日期即刻出票</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                    {datesWithTransactions.slice(0, 10).map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          setCustomStartDate(d.date);
                          setCustomEndDate(d.date);
                          triggerPrintEffect();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1 border shrink-0 ${
                          customStartDate === d.date && customEndDate === d.date
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{d.date}</span>
                        <span className="text-[10px] opacity-75">({d.count}笔)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Single Tx Selector (When scope is SINGLE) */}
          {scope === 'SINGLE' && (
            <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in duration-150">
              <span className="text-xs text-slate-300 font-medium whitespace-nowrap">选择单笔明细:</span>
              <select
                value={singleTxId || latestTxId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSingleTxId(e.target.value);
                    triggerPrintEffect();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                {sortedAllTransactions.length === 0 ? (
                  <option value="">暂无记账明细</option>
                ) : (
                  sortedAllTransactions.map((t, idx) => (
                    <option key={t.id} value={t.id}>
                      {idx === 0 ? '【最新一笔】' : ''}{t.date} · {t.category} {t.description ? `(${t.description})` : ''} · {t.type === 'EXPENSE' ? '-' : '+'}¥{t.amount.toFixed(2)} ({accountMap.get(t.accountId)?.name || '账户'})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Transaction Type Filter (全部 / 仅支出 / 仅收入) */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              {[
                { id: 'EXPENSE', label: '仅支出' },
                { id: 'ALL', label: '全部收支' },
                { id: 'INCOME', label: '仅收入' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTypeFilter(t.id as typeof typeFilter);
                    triggerPrintEffect();
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    typeFilter === t.id
                      ? 'bg-slate-800 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400">
              当前打单明细: <strong className="text-emerald-400 font-mono font-bold">{targetTransactions.length}</strong> 笔，总计{' '}
              <strong className="text-white font-mono font-bold">¥{totalExpense.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Collapsible Customization Drawer (标头 / 印章 / 风格) */}
        {isControlsExpanded && (
          <div className="bg-slate-950/95 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-3 duration-200 shrink-0">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'header', label: '自定义标头', icon: Store },
                { id: 'stamp', label: '自定义印章', icon: StampIcon },
                { id: 'theme', label: '小票风格', icon: Palette },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Custom Header (自定义标头) */}
            {activeTab === 'header' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      标头名称 (主标题)
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="如：我的生活记账本 / 幸福便利店"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      标头副标题 (结算凭证说明)
                    </label>
                    <input
                      type="text"
                      value={storeSubtitle}
                      onChange={(e) => setStoreSubtitle(e.target.value)}
                      placeholder="如：消费结算凭证 / 今日小确幸"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Preset Store Names Fast Selector */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">常用标头快速填入：</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_STORE_NAMES.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setStoreName(name)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                          storeName === name
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Custom Stamp (自定义印章) */}
            {activeTab === 'stamp' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      印章主文字
                    </label>
                    <input
                      type="text"
                      value={stampMainText}
                      onChange={(e) => setStampMainText(e.target.value)}
                      maxLength={6}
                      placeholder="如：已结算 / 心满意足"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      印章顶标
                    </label>
                    <input
                      type="text"
                      value={stampTopText}
                      onChange={(e) => setStampTopText(e.target.value)}
                      placeholder="如：★ 官方认证 ★"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      印章副文字
                    </label>
                    <input
                      type="text"
                      value={stampBottomText}
                      onChange={(e) => setStampBottomText(e.target.value)}
                      placeholder="如：消费入账 / 犒劳自己"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Preset Stamps Quick Selector */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400">预设印章:</span>
                  {PRESET_STAMPS.map((stamp) => (
                    <button
                      key={stamp}
                      type="button"
                      onClick={() => setStampMainText(stamp)}
                      className={`px-2 py-0.5 rounded-md text-xs transition-all ${
                        stampMainText === stamp
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {stamp}
                    </button>
                  ))}
                </div>

                {/* Stamp Color & Shape Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">印泥色彩:</span>
                    <div className="flex items-center gap-1.5">
                      {STAMP_COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setStampColorId(color.id)}
                          className={`w-6 h-6 rounded-full ${color.bg} flex items-center justify-center transition-transform ${
                            stampColorId === color.id ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={color.name}
                        >
                          {stampColorId === color.id && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <span className="text-xs text-slate-400">印章外形:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'circle', label: '双圈圆章' },
                        { id: 'rect', label: '圆角方章' },
                        { id: 'badge', label: '齿轮花边' },
                      ].map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setStampShape(shape.id as StampShape)}
                          className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                            stampShape === shape.id
                              ? 'bg-slate-700 text-white font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Themes */}
            {activeTab === 'theme' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'classic', name: '经典热敏纸', desc: '纯净白纸 · 真实质感' },
                  { id: 'cafe', name: '复古牛皮纸', desc: '暖棕文艺 · 慢调生活' },
                  { id: 'cyber', name: '赛博极客', desc: '深黑终端 · 荧光绿' },
                  { id: 'muji', name: '日系杂货铺', desc: '素雅灰白 · 极简美学' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTheme(item.id as ReceiptTheme);
                      if (soundEnabled) playPOSSound('beep');
                    }}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                      theme === item.id
                        ? 'bg-slate-800 text-white border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Main Body (Centering the Realistic Thermal Printer & Full Receipt) */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center justify-start bg-slate-950/60">
          {/* POS Thermal Printer Frame */}
          <div className="w-full max-w-lg bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-3.5 sm:p-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] relative z-10 select-none ring-1 ring-white/10 shrink-0">
            {/* Top Surface Bar */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/70">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-200 tracking-wider font-mono flex items-center gap-1.5">
                    <span>THERMO-PRO 80</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      AUTO CUT
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400">80mm 智能微型热敏票据打印机</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 bg-slate-950/70 px-2 py-1 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-mono text-slate-400">电源</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full transition-all ${
                        printStage === 'printing'
                          ? 'bg-blue-400 animate-ping shadow-[0_0_8px_#60a5fa]'
                          : 'bg-blue-500/40'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-slate-400">出票</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full transition-all ${
                        isCutterActive
                          ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]'
                          : 'bg-amber-500/30'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-slate-400">切纸</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerPrintEffect}
                  disabled={printStage === 'printing' || printStage === 'cutting'}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-b from-slate-750 to-slate-800 hover:from-slate-700 hover:to-slate-750 active:scale-95 border border-slate-600/70 text-[10px] text-slate-200 font-semibold flex items-center gap-1 transition-all disabled:opacity-50 shadow-md"
                  title="重新进纸并演示激光切纸效果"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>进纸</span>
                </button>
              </div>
            </div>

            {/* Recessed Slot */}
            <div className="relative mt-2.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
              <div className="relative h-3.5 bg-black rounded-lg border-t border-b border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-x-8 top-0.5 h-0.5 bg-slate-800/80 rounded-full" />
                <div className="w-48 h-0.5 bg-slate-700/40 rounded-full" />
                <div className="absolute left-2 inset-y-0.5 w-1.5 bg-slate-800 rounded-xs border-r border-slate-700" />
                <div className="absolute right-2 inset-y-0.5 w-1.5 bg-slate-800 rounded-xs border-l border-slate-700" />

                {isCutterActive && (
                  <div
                    className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-95 shadow-[0_0_16px_#38bdf8] pointer-events-none"
                    style={{
                      animation: 'cutterSlide 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Paper Slide Container */}
          <div
            className={`w-full max-w-sm sm:max-w-md transition-all duration-700 ease-out origin-top -mt-2 ${
              printStage === 'printing'
                ? '-translate-y-10 opacity-30 scale-y-75 blur-[0.5px]'
                : printStage === 'cutting'
                ? 'translate-y-1 opacity-90 scale-y-98'
                : 'translate-y-2 opacity-100 scale-y-100'
            }`}
          >
            {/* The Actual Receipt Document Node to Capture */}
            <div
              ref={receiptRef}
              className={`relative mt-2 p-6 sm:p-7 rounded-xs ${themeStyles.bg} ${themeStyles.text} ${themeStyles.font} ${themeStyles.paperShadow} transition-colors select-none w-[360px] sm:w-[380px] mx-auto box-border`}
            >
              {/* Top Sawtooth Edge */}
              <div
                className="absolute -top-2 left-0 right-0 h-2 bg-repeat-x pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 4px 0px, transparent 4px, ${themeStyles.zigzagColor} 4.5px)`,
                  backgroundSize: '8px 8px',
                }}
              />

              {/* Receipt Header */}
              <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-400/40">
                <div className="inline-flex items-center justify-center p-2 rounded-full border-2 border-current mb-1">
                  <Store className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
                  {storeName}
                </h2>
                <div className="text-[11px] opacity-75 font-medium tracking-wide whitespace-nowrap">
                  *** {storeSubtitle} ***
                </div>
                <div className="text-[10px] opacity-70 whitespace-nowrap">用心记录每一笔开销 · 让生活更有质感</div>
              </div>

              {/* Meta Details */}
              <div className="py-3 text-[11px] space-y-1.5 border-b border-dashed border-slate-400/40 font-mono">
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <span className="opacity-75 shrink-0 whitespace-nowrap">流水单号:</span>
                  <span className="font-bold shrink-0 whitespace-nowrap">{receiptNo}</span>
                </div>
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <span className="opacity-75 shrink-0 whitespace-nowrap">结算周期:</span>
                  <span className="font-bold shrink-0 whitespace-nowrap">
                    {periodLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <span className="opacity-75 shrink-0 whitespace-nowrap">打印时间:</span>
                  <span className="shrink-0 whitespace-nowrap">
                    {todayStr} {printTimeStr}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <span className="opacity-75 shrink-0 whitespace-nowrap">收银终端:</span>
                  <span className="shrink-0 whitespace-nowrap">01号收银台</span>
                </div>
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <span className="opacity-75 shrink-0 whitespace-nowrap">记账员:</span>
                  <span className="font-bold shrink-0 whitespace-nowrap">本人 (生活账管家)</span>
                </div>
              </div>

              {/* Goods / Transactions List (Showing ALL transactions without truncation) */}
              <div className="py-3">
                <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-slate-400/50 tracking-wider whitespace-nowrap">
                  <span className="w-2/5 shrink-0">品类明细</span>
                  <span className="w-1/4 text-center shrink-0">支付方式</span>
                  <span className="w-1/3 text-right shrink-0">金额</span>
                </div>

                {targetTransactions.length === 0 ? (
                  <div className="py-8 text-center text-xs opacity-60">
                    <p className="font-bold">当前筛选范围暂无流水记录</p>
                    <p className="text-[10px] mt-1 opacity-75">
                      可切换上方「今日小票 / 当月汇总 / 起始~截止日」查看其他记账记录
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-dashed divide-slate-300/40 dark:divide-slate-700/40 text-xs">
                    {targetTransactions.map((tx, idx) => {
                      const acc = accountMap.get(tx.accountId);
                      const isExp = tx.type === 'EXPENSE';
                      return (
                        <div key={tx.id} className="py-2 flex items-center justify-between gap-1">
                          {/* Item Name & Meta */}
                          <div className="w-2/5 shrink-0 pr-1">
                            <div className="font-semibold flex items-center gap-1 truncate">
                              <span className="opacity-50 text-[10px] font-mono">
                                {String(idx + 1).padStart(2, '0')}.
                              </span>
                              <span className="truncate">{tx.category}</span>
                            </div>
                            {tx.description && (
                              <div className="text-[10px] opacity-70 truncate font-sans">
                                {tx.description}
                              </div>
                            )}
                            <div className="text-[9px] opacity-50 font-mono">
                              {tx.date} {tx.time || ''}
                            </div>
                          </div>

                          {/* Account */}
                          <div className="w-1/4 shrink-0 text-center text-[10px] opacity-80 truncate font-sans">
                            {acc ? (
                              <span title={`${acc.name}${acc.cardNumberLast4 ? ` (尾号 ${acc.cardNumberLast4})` : ''}`}>
                                {acc.bankName || acc.name}
                                {acc.cardNumberLast4 ? ` (*${acc.cardNumberLast4})` : ''}
                              </span>
                            ) : (
                              '默认账户'
                            )}
                          </div>

                          {/* Amount */}
                          <div className="w-1/3 shrink-0 text-right font-mono font-bold">
                            <span className={isExp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {isExp ? '-' : '+'}¥{tx.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Totals & Summary */}
              <div className="py-3 border-t border-b border-dashed border-slate-400/50 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="opacity-75">消费笔数:</span>
                  <span className="font-bold">{itemCount} 笔</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-1">
                  <span>总支出:</span>
                  <span className="text-rose-600 dark:text-rose-400">¥{totalExpense.toFixed(2)}</span>
                </div>
                {totalIncome > 0 && (
                  <div className="flex items-center justify-between text-xs opacity-80">
                    <span>同期总入账:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">+¥{totalIncome.toFixed(2)}</span>
                  </div>
                )}
                {totalIncome > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-dotted border-slate-400/40">
                    <span>收支净结余:</span>
                    <span>¥{netBalance.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Barcode & Signature */}
              <div className="pt-4 text-center space-y-2">
                {/* Visual Barcode */}
                <div className="flex flex-col items-center justify-center opacity-85">
                  <div
                    className="h-10 w-44 bg-current opacity-80"
                    style={{
                      maskImage:
                        'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px, #000 9px, #000 12px, transparent 12px, transparent 15px)',
                      WebkitMaskImage:
                        'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px, #000 9px, #000 12px, transparent 12px, transparent 15px)',
                    }}
                  />
                  <div className="text-[9px] font-mono tracking-widest mt-1 opacity-70">
                    {receiptNo}
                  </div>
                </div>

                {/* Quote / Slogan */}
                <p className="text-[10px] italic opacity-75 font-serif px-2">
                  “ {randomQuote} ”
                </p>

                <div className="text-[9px] opacity-60 font-sans">
                  ★ 凭此票据享受生活 · 欢迎再次记账 ★
                </div>
              </div>

              {/* Stamp Impact (Realistic rubber stamp) */}
              {showStamp && (
                <div
                  className={`absolute right-4 bottom-24 pointer-events-none transition-all duration-300 ${
                    printStage === 'done'
                      ? 'scale-100 opacity-85 -rotate-12'
                      : 'scale-150 opacity-0 -rotate-45'
                  }`}
                  style={{
                    animation: printStage === 'done' ? 'stampImpact 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                  }}
                >
                  {stampShape === 'circle' && (
                    <div
                      className={`w-24 h-24 rounded-full border-3 border-double ${selectedStampColor.border} p-1 flex flex-col items-center justify-center text-center shadow-xs backdrop-blur-[0.5px]`}
                    >
                      <div
                        className={`w-full h-full rounded-full border border-dashed ${selectedStampColor.border} flex flex-col items-center justify-center p-1`}
                      >
                        <span className={`text-[8px] font-bold ${selectedStampColor.text} tracking-tighter uppercase scale-90`}>
                          {stampTopText}
                        </span>
                        <span
                          className={`text-base font-black ${selectedStampColor.text} tracking-wider my-0.5 font-serif`}
                        >
                          {stampMainText}
                        </span>
                        <span className={`text-[7px] font-mono ${selectedStampColor.text} scale-85 opacity-90`}>
                          {stampBottomText}
                        </span>
                      </div>
                    </div>
                  )}

                  {stampShape === 'rect' && (
                    <div
                      className={`px-3 py-2 rounded-xl border-3 ${selectedStampColor.border} flex flex-col items-center justify-center text-center shadow-xs`}
                    >
                      <span className={`text-[8px] font-bold ${selectedStampColor.text} tracking-wider`}>
                        {stampTopText}
                      </span>
                      <span className={`text-base font-black ${selectedStampColor.text} tracking-widest font-serif`}>
                        {stampMainText}
                      </span>
                      <span className={`text-[8px] font-mono ${selectedStampColor.text}`}>
                        {stampBottomText}
                      </span>
                    </div>
                  )}

                  {stampShape === 'badge' && (
                    <div
                      className={`w-24 h-24 rounded-2xl border-3 border-dashed ${selectedStampColor.border} p-1 flex flex-col items-center justify-center text-center rotate-6`}
                    >
                      <span className={`text-[8px] font-bold ${selectedStampColor.text}`}>
                        {stampTopText}
                      </span>
                      <span className={`text-sm font-black ${selectedStampColor.text} tracking-wider my-0.5`}>
                        {stampMainText}
                      </span>
                      <span className={`text-[7px] font-mono ${selectedStampColor.text}`}>
                        {stampBottomText}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Sawtooth Edge */}
              <div
                className="absolute -bottom-2 left-0 right-0 h-2 bg-repeat-x pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 4px 8px, transparent 4px, ${themeStyles.zigzagColor} 4.5px)`,
                  backgroundSize: '8px 8px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Action Bar (高清长图保存 / 复制小票图片 / 复制文本 / 分享) */}
        <div className="px-4 py-3 sm:px-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">已选打单明细:</span>
            <span className="text-xs font-bold text-white font-mono">{itemCount} 笔</span>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">¥{totalExpense.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy Plain Text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="复制全部明细的纯文本小票"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>复制文本</span>
            </button>

            {/* Copy Image */}
            <button
              type="button"
              onClick={handleCopyImage}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="复制小票长图到剪贴板"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>复制图片</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              title="保存包含全部明细的高清小票长图"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存高清小票长图</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
