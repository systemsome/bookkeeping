import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  X,
  Download,
  Share2,
  Copy,
  Printer,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Calendar,
  Tag,
  Store,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Stamp as StampIcon,
  Palette,
  Scissors,
  Check,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import { Transaction, FinancialAccount } from '../types';
import { playPOSSound } from '../lib/receiptSound';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: FinancialAccount[];
  selectedDate?: string | null;
  initialSingleTxId?: string | null;
}

type ReceiptTheme = 'classic' | 'cafe' | 'cyber' | 'muji';
type ScopeType = 'SELECTED_DATE' | 'TODAY' | 'MONTH' | 'ALL_FILTERED' | 'SINGLE';
type StampShape = 'circle' | 'rect' | 'badge';

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
  transactions,
  accounts,
  selectedDate,
  initialSingleTxId,
}) => {
  // Theme & Scope
  const [theme, setTheme] = useState<ReceiptTheme>('classic');
  const [scope, setScope] = useState<ScopeType>(() => {
    if (initialSingleTxId) return 'SINGLE';
    if (selectedDate) return 'SELECTED_DATE';
    return 'MONTH';
  });
  const [singleTxId, setSingleTxId] = useState<string | null>(initialSingleTxId || null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('EXPENSE');

  // Custom Header & Custom Stamp States
  const [storeName, setStoreName] = useState<string>('我的生活记账本');
  const [storeSubtitle, setStoreSubtitle] = useState<string>('消费结算凭证');
  const [stampMainText, setStampMainText] = useState<string>('已结算');
  const [stampTopText, setStampTopText] = useState<string>('★ 官方认证 ★');
  const [stampBottomText, setStampBottomText] = useState<string>('消费入账');
  const [stampColorId, setStampColorId] = useState<string>('crimson');
  const [stampShape, setStampShape] = useState<StampShape>('circle');

  // Controls auto-hide / collapse state (默认自动折叠隐藏，呈现纯净出票机与小票)
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'scope' | 'header' | 'stamp' | 'theme'>('scope');

  // Realistic POS Printer & Cutting Blade Animation States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [printStage, setPrintStage] = useState<'idle' | 'printing' | 'cutting' | 'done'>('done');
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [isCutterActive, setIsCutterActive] = useState<boolean>(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [randomQuote, setRandomQuote] = useState<string>(QUOTES[0]);

  const receiptRef = useRef<HTMLDivElement>(null);

  const accountMap = new Map<string, FinancialAccount>();
  accounts.forEach((acc) => accountMap.set(acc.id, acc));

  // Determine current date strings
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Sync initial single tx
  useEffect(() => {
    if (initialSingleTxId) {
      setSingleTxId(initialSingleTxId);
      setScope('SINGLE');
    }
  }, [initialSingleTxId]);

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

  // Filter transactions based on scope and type
  const targetTransactions = transactions.filter((tx) => {
    if (typeFilter === 'EXPENSE' && tx.type !== 'EXPENSE') return false;
    if (typeFilter === 'INCOME' && tx.type !== 'INCOME') return false;

    if (scope === 'SINGLE') {
      return singleTxId ? tx.id === singleTxId : true;
    }
    if (scope === 'SELECTED_DATE' && selectedDate) {
      return tx.date === selectedDate;
    }
    if (scope === 'TODAY') {
      return tx.date === todayStr;
    }
    if (scope === 'MONTH') {
      return tx.date.startsWith(currentMonthStr);
    }
    return true;
  });

  // Calculate totals
  const totalExpense = targetTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = targetTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const itemCount = targetTransactions.length;

  const showNotification = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2500);
  };

  // Receipt ID & Timestamp
  const receiptNo = `POS-${todayStr.replace(/-/g, '')}-${String(itemCount).padStart(3, '0')}`;
  const printTimeStr = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 1. Download as PNG Image (With exact 1:1 layout, font, background and dimensions preservation)
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

      showNotification('✅ 账单小票已保存为高清长图！');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Failed to export receipt image:', err);
      showNotification('❌ 生成小票图片失败，请重试');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // 2. Copy Image to Clipboard (With exact layout matching)
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

  // 3. Copy Plain Text Receipt
  const handleCopyText = () => {
    const divider = '--------------------------------';
    const lines = [
      `🧾 【${storeName} · ${storeSubtitle}】`,
      `流水单号: ${receiptNo}`,
      `打印时间: ${todayStr} ${printTimeStr}`,
      `收银终端: 01号收银台 (记账员: 本人)`,
      divider,
      `[序号]  品类明细        方式        金额`,
    ];

    targetTransactions.slice(0, 30).forEach((t, i) => {
      const acc = accountMap.get(t.accountId);
      const accName = acc?.name || '默认账户';
      const typeSign = t.type === 'EXPENSE' ? '-' : '+';
      const desc = t.description || t.category;
      lines.push(
        `${String(i + 1).padStart(2, '0')}.  ${desc.padEnd(10, ' ')}  ${accName.substring(0, 4)}  ${typeSign}¥${t.amount.toFixed(2)}`
      );
    });

    if (targetTransactions.length > 30) {
      lines.push(`... 还有 ${targetTransactions.length - 30} 笔明细已汇总 ...`);
    }

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
    showNotification('📄 纯文本小票已复制，可直接发微信或备忘录！');
  };

  // 4. Native Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        if (!receiptRef.current) return;
        const blob = await toBlob(receiptRef.current, { pixelRatio: 2 });
        if (blob) {
          const file = new File([blob], `账单小票_${receiptNo}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${storeName} - ${storeSubtitle}`,
              text: `我的消费小票：共计 ${itemCount} 笔，支出 ¥${totalExpense.toFixed(2)}。`,
            });
            return;
          }
        }
        await navigator.share({
          title: `${storeName} - ${storeSubtitle}`,
          text: `我的消费小票：共计 ${itemCount} 笔，支出 ¥${totalExpense.toFixed(2)}。${randomQuote}`,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyImage();
    }
  };

  // 5. System Print
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Selected Stamp Color Config
  const selectedStampColor = STAMP_COLORS.find((c) => c.id === stampColorId) || STAMP_COLORS[0];

  // Theme styling configurations - Clean, pure paper surfaces WITHOUT dot-matrix
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-5 z-60 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-medium shadow-2xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-top-4 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Adjusted Modal Dialog Container (Sleek, well-proportioned, max-w-2xl) */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95 shrink-0">
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
                  沉浸式出票
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                模拟真实收银机热敏出票、激光切纸与印章落戳
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Customization Toggle Button (自动隐藏/一键展开) */}
            <button
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isControlsExpanded
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
              }`}
              title="展开/隐藏自定义标头、印章与范围设置"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isControlsExpanded ? '收起自定义' : '自定义设置'}</span>
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

        {/* Collapsible / Auto-Hide Customization Drawer */}
        {isControlsExpanded && (
          <div className="bg-slate-950/90 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-3 duration-200">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'scope', label: '范围筛选', icon: Calendar },
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

            {/* Tab 1: Scope & Date Filter */}
            {activeTab === 'scope' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'TODAY', label: '今日小票', sub: todayStr },
                    { id: 'MONTH', label: '当月汇总', sub: `${currentMonthStr} 月` },
                    { id: 'SELECTED_DATE', label: '已选日期', sub: selectedDate || '当前未选' },
                    { id: 'ALL_FILTERED', label: '当前全部', sub: `共 ${transactions.length} 笔` },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setScope(item.id as ScopeType);
                        triggerPrintEffect();
                      }}
                      className={`p-2 rounded-xl text-left border text-xs transition-all ${
                        scope === item.id
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Single Tx Selector */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <span className="text-xs text-slate-400 whitespace-nowrap">单笔消费:</span>
                  <select
                    value={singleTxId || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSingleTxId(e.target.value);
                        setScope('SINGLE');
                        triggerPrintEffect();
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- 选择任意单笔交易生成专属小票 --</option>
                    {transactions.slice(0, 30).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.date} · {t.category} {t.description ? `(${t.description})` : ''} · ¥{t.amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Tab 2: Custom Header (自定义标头) */}
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

            {/* Tab 3: Custom Stamp (自定义印章) */}
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

            {/* Tab 4: Themes */}
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

        {/* Modal Main Body (Centering the Realistic Thermal Printer & Receipt) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-start bg-slate-950/60">
          {/* Realistic High-End POS Thermal Printer Hardware Frame (设备比出票偏大一号：外壳宽阔舒展，工业质感拉满) */}
          <div className="w-full max-w-lg bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] relative z-10 select-none ring-1 ring-white/10">
            {/* Top Surface Bar with Hardware Branding & Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/70">
              {/* Brand & Model Logo */}
              <div className="flex items-center gap-2.5">
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

              {/* Status Indicators & Action Button */}
              <div className="flex items-center gap-3">
                {/* LED Status Indicators Group */}
                <div className="flex items-center gap-2.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  {/* Power LED */}
                  <div className="flex items-center gap-1" title="电源指示正常">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-mono text-slate-400">电源</span>
                  </div>

                  {/* Status / Working LED */}
                  <div className="flex items-center gap-1" title="出票运行指示">
                    <div
                      className={`w-2 h-2 rounded-full transition-all ${
                        printStage === 'printing'
                          ? 'bg-blue-400 animate-ping shadow-[0_0_8px_#60a5fa]'
                          : 'bg-blue-500/40'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-slate-400">出票</span>
                  </div>

                  {/* Cutter LED */}
                  <div className="flex items-center gap-1" title="自动切刀状态">
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

                {/* FEED / Re-Print Hardware Button */}
                <button
                  type="button"
                  onClick={triggerPrintEffect}
                  disabled={printStage === 'printing' || printStage === 'cutting'}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-slate-750 to-slate-800 hover:from-slate-700 hover:to-slate-750 active:scale-95 border border-slate-600/70 text-[11px] text-slate-200 font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-md shadow-black/40"
                  title="重新进纸并演示激光切纸效果"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>进纸 (FEED)</span>
                </button>
              </div>
            </div>

            {/* Recessed Thermal Print Engine & Metallic Paper Ejection Slot (微凹出票槽与机械切刀) */}
            <div className="relative mt-3 p-1 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
              {/* Inner Slot Bezel */}
              <div className="relative h-4 bg-black rounded-lg border-t border-b border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center">
                {/* Paper Delivery Rubber Rollers Accent */}
                <div className="absolute inset-x-8 top-0.5 h-0.5 bg-slate-800/80 rounded-full" />
                <div className="w-48 h-0.5 bg-slate-700/40 rounded-full" />

                {/* Left/Right Paper Guide Aligners (两端金属导纸卡口) */}
                <div className="absolute left-2 inset-y-0.5 w-1.5 bg-slate-800 rounded-xs border-r border-slate-700" />
                <div className="absolute right-2 inset-y-0.5 w-1.5 bg-slate-800 rounded-xs border-l border-slate-700" />

                {/* Dynamic Metallic Guillotine Cutter Blade Animation (激光与金属切刀划过光效) */}
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

          {/* Paper Ejection Slide Container with Physical Cutting Bounce Separation (小票尺寸相比打印机适中收敛) */}
          <div
            className={`w-full max-w-sm sm:max-w-md transition-all duration-700 ease-out origin-top -mt-2 ${
              printStage === 'printing'
                ? '-translate-y-10 opacity-30 scale-y-75 blur-[0.5px]'
                : printStage === 'cutting'
                ? 'translate-y-1 opacity-90 scale-y-98'
                : 'translate-y-2 opacity-100 scale-y-100'
            }`}
          >
            {/* The Actual Receipt Document Node to Capture (固定宽度与强制防折行保护，确保导出长图与展示 100% 绝对一致) */}
            <div
              ref={receiptRef}
              className={`relative mt-2 p-6 sm:p-7 rounded-sm ${themeStyles.bg} ${themeStyles.text} ${themeStyles.font} ${themeStyles.paperShadow} transition-colors select-none w-[360px] sm:w-[380px] mx-auto box-border`}
            >
              {/* Top Sawtooth / Zigzag Edge */}
              <div
                className="absolute -top-2 left-0 right-0 h-2 bg-repeat-x pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 4px 0px, transparent 4px, ${themeStyles.zigzagColor} 4.5px)`,
                  backgroundSize: '8px 8px',
                }}
              />

              {/* Receipt Header (自定义标头) */}
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

              {/* Goods / Transactions List */}
              <div className="py-3">
                <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-slate-400/50 tracking-wider whitespace-nowrap">
                  <span className="w-2/5 shrink-0">品类明细</span>
                  <span className="w-1/4 text-center shrink-0">支付方式</span>
                  <span className="w-1/3 text-right shrink-0">金额</span>
                </div>

                {targetTransactions.length === 0 ? (
                  <div className="py-6 text-center text-xs opacity-60 whitespace-nowrap">
                    当前范围暂无记账明细
                  </div>
                ) : (
                  <div className="divide-y divide-dashed divide-slate-300/40 dark:divide-slate-700/40 text-xs">
                    {targetTransactions.slice(0, 15).map((tx, idx) => {
                      const acc = accountMap.get(tx.accountId);
                      const isExp = tx.type === 'EXPENSE';
                      return (
                        <div key={tx.id} className="py-2 flex items-center justify-between gap-1 whitespace-nowrap">
                          <div className="w-2/5 min-w-0 pr-1">
                            <div className="font-bold truncate flex items-center gap-1">
                              <span className="text-[10px] opacity-60 font-mono shrink-0">{idx + 1}.</span>
                              <span className="truncate">{tx.category}</span>
                            </div>
                            {tx.description && (
                              <div className="text-[10px] opacity-70 truncate">
                                {tx.description}
                              </div>
                            )}
                            <div className="text-[9px] opacity-50 font-mono">{tx.date}</div>
                          </div>

                          <div className="w-1/4 text-center text-[10px] opacity-80 truncate px-1 shrink-0">
                            {acc?.name || '默认卡'}
                          </div>

                          <div className="w-1/3 text-right font-mono font-bold whitespace-nowrap shrink-0">
                            <span className={isExp ? '' : 'text-emerald-600 dark:text-emerald-400'}>
                              {isExp ? '-' : '+'}¥{tx.amount.toFixed(2)}
                            </span>
                            {tx.originalAmount && tx.currency && tx.currency !== 'CNY' && (
                              <div className="text-[9px] opacity-60">
                                ({tx.currency} {tx.originalAmount})
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {targetTransactions.length > 15 && (
                  <div className="pt-2 text-center text-[10px] opacity-60 border-t border-dashed border-slate-300/40 whitespace-nowrap">
                    ... 还有 {targetTransactions.length - 15} 笔消费明细已合并计入 ...
                  </div>
                )}
              </div>

              {/* Subtotal & Summary Calculation */}
              <div className="pt-3 border-t-2 border-slate-800 dark:border-slate-300 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="opacity-75 shrink-0 whitespace-nowrap">消费总笔数:</span>
                  <span className="font-bold shrink-0 whitespace-nowrap font-mono">{itemCount} 笔</span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold pt-1 whitespace-nowrap">
                  <span className="shrink-0 whitespace-nowrap">总支出:</span>
                  <span className="shrink-0 whitespace-nowrap font-mono tracking-tight">¥{totalExpense.toFixed(2)}</span>
                </div>
                {totalIncome > 0 && (
                  <>
                    <div className="flex items-center justify-between opacity-85 whitespace-nowrap">
                      <span className="shrink-0 whitespace-nowrap">同期总入账:</span>
                      <span className="text-emerald-600 font-bold shrink-0 whitespace-nowrap font-mono">+¥{totalIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between opacity-85 whitespace-nowrap">
                      <span className="shrink-0 whitespace-nowrap">收支净结余:</span>
                      <span className="font-bold shrink-0 whitespace-nowrap font-mono">
                        {netBalance >= 0 ? '+' : '-'}¥{Math.abs(netBalance).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between opacity-75 text-[11px] pt-1 whitespace-nowrap">
                  <span className="shrink-0 whitespace-nowrap">付款状态:</span>
                  <span className="font-bold tracking-wider shrink-0 whitespace-nowrap">支付成功 (已核销入账)</span>
                </div>
              </div>

              {/* Quotes / Life Motto */}
              <div className="mt-4 p-2.5 rounded-lg bg-black/5 dark:bg-white/5 text-center text-[11px] italic opacity-85 border border-dashed border-slate-300/60 dark:border-slate-700/60">
                “ {randomQuote} ”
              </div>

              {/* Barcode & Footer */}
              <div className="mt-5 pt-3 border-t border-dashed border-slate-400/40 text-center space-y-2">
                <div className="flex items-center justify-center gap-0.5 h-9 opacity-85 overflow-hidden max-w-[240px] mx-auto">
                  {[
                    2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 2, 4, 1,
                    3, 1, 2, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2,
                  ].map((w, i) => (
                    <div
                      key={i}
                      className="bg-current h-full"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-mono tracking-widest opacity-70 whitespace-nowrap">
                  * 6 9 2 8 8 2 0 1 9 4 8 2 6 *
                </div>

                <div className="text-[11px] font-bold tracking-wider pt-1 whitespace-nowrap">
                  ★ 感谢惠顾 · 欢迎再次记账 ★
                </div>
                <div className="text-[9px] opacity-60 whitespace-nowrap">
                  个人极简资产管理系统
                </div>
              </div>

              {/* Bottom Sawtooth / Zigzag Edge */}
              <div
                className="absolute -bottom-2 left-0 right-0 h-2 bg-repeat-x pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 4px 8px, transparent 4px, ${themeStyles.zigzagColor} 4.5px)`,
                  backgroundSize: '8px 8px',
                }}
              />

              {/* Custom Stamped Seal (自定义印章与落戳动效：尺寸舒展、严格防折行防重叠) */}
              {showStamp && (
                <div className="absolute right-3 bottom-20 sm:right-5 sm:bottom-24 pointer-events-none transform -rotate-12 select-none">
                  {stampShape === 'circle' && (
                    <div
                      className={`w-28 h-28 rounded-full border-4 border-dashed ${selectedStampColor.border} ${selectedStampColor.text} flex flex-col items-center justify-center p-1.5 text-center font-bold tracking-tight shadow-sm opacity-90 box-border`}
                    >
                      <div className="text-[8px] font-bold tracking-wider opacity-90 whitespace-nowrap shrink-0 leading-tight">
                        {stampTopText}
                      </div>
                      <div className="text-base font-extrabold tracking-wider my-0.5 whitespace-nowrap shrink-0 leading-tight">
                        {stampMainText}
                      </div>
                      <div className="text-[9px] font-bold whitespace-nowrap shrink-0 leading-tight">
                        {stampBottomText}
                      </div>
                      <div className="text-[8px] font-mono opacity-80 whitespace-nowrap shrink-0 leading-tight mt-0.5">
                        {todayStr}
                      </div>
                    </div>
                  )}

                  {stampShape === 'rect' && (
                    <div
                      className={`w-28 h-22 rounded-xl border-4 border-double ${selectedStampColor.border} ${selectedStampColor.text} flex flex-col items-center justify-center p-1.5 text-center font-bold tracking-tight shadow-sm opacity-90 box-border`}
                    >
                      <div className="text-[8px] font-bold tracking-wider whitespace-nowrap shrink-0 leading-tight">
                        {stampTopText}
                      </div>
                      <div className="text-sm font-extrabold tracking-widest my-0.5 border-t border-b border-current px-2 whitespace-nowrap shrink-0 leading-tight">
                        {stampMainText}
                      </div>
                      <div className="text-[8px] font-mono whitespace-nowrap shrink-0 leading-tight">
                        {stampBottomText} · {todayStr}
                      </div>
                    </div>
                  )}

                  {stampShape === 'badge' && (
                    <div
                      className={`w-28 h-28 rounded-2xl rotate-45 border-4 border-dashed ${selectedStampColor.border} ${selectedStampColor.text} flex flex-col items-center justify-center p-1.5 text-center font-bold shadow-sm opacity-90 box-border`}
                    >
                      <div className="-rotate-45 flex flex-col items-center justify-center">
                        <div className="text-[8px] font-bold whitespace-nowrap shrink-0 leading-tight">
                          {stampTopText}
                        </div>
                        <div className="text-sm font-extrabold tracking-wider whitespace-nowrap shrink-0 leading-tight my-0.5">
                          {stampMainText}
                        </div>
                        <div className="text-[8px] whitespace-nowrap shrink-0 leading-tight">
                          {stampBottomText}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar (居中在下方展示：保存小票长图、复制小票图片、复制文本、分享、打印) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-center gap-2 sm:gap-3 flex-wrap shrink-0">
          {/* 1. 保存小票长图 (Primary) */}
          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingImg}
            className="flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md active:scale-95 transition-all disabled:opacity-50"
            title="保存高清长图到本地相册"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingImg ? '生成中...' : '保存小票长图'}</span>
          </button>

          {/* 2. 复制小票图片 */}
          <button
            onClick={handleCopyImage}
            disabled={isGeneratingImg}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm shadow-xs active:scale-95 transition-all"
            title="复制小票图片到剪贴板，可直接粘贴发微信/备忘录"
          >
            <Copy className="w-4 h-4 text-emerald-400" />
            <span>复制小票图片</span>
          </button>

          {/* 3. 复制文本 */}
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm transition-all"
            title="复制纯文本格式排版"
          >
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>复制文本</span>
          </button>

          {/* 4. 分享 */}
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm transition-all"
            title="调起系统分享"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>分享</span>
          </button>

          {/* 5. 打印 */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm transition-all"
            title="调起系统打印机"
          >
            <Printer className="w-3.5 h-3.5 text-purple-400" />
            <span>打印</span>
          </button>
        </div>
      </div>
    </div>
  );
};
