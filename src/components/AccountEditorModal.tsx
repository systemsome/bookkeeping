import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trash2,
  Check,
  Sparkles,
  CreditCard,
  Building2,
  Palette,
  Layers,
  Calendar,
  User,
  Wand2,
  Dices,
  RotateCcw,
  RefreshCw,
  RotateCw,
  Image as ImageIcon,
  SlidersHorizontal,
  SunMoon,
} from 'lucide-react';
import { FinancialAccount, AccountCategory } from '../types';
import { ACCOUNT_CATEGORY_CONFIG } from '../lib/constants';
import {
  BANK_BRANDS,
  CARD_SKINS,
  detectBrandInfo,
  BankBrandInfo,
  autoGenerateCardBackground,
  getRandomCardBackground,
  LUXURY_PALETTES,
  LuxuryPalette,
  getDefaultPresetForCategory,
  getBrandsForCategory,
  COMMON_CARD_TIERS,
  getTierTheme,
} from '../lib/brandHelper';
import {
  CARDENTIFY_PRESETS,
  CardFacePreset,
  matchBestCardentifyPreset,
  matchBestCardentifyCard,
  getTotalGalleryCardsCount,
  CardentifyCard,
} from '../lib/cardentifyPresets';
import { CardentifyGalleryModal } from './CardentifyGalleryModal';
import {
  fetchLiveGoldRate,
  getCachedGoldRate,
  GoldMarketRate,
} from '../lib/goldRates';
import { AccountCardFace } from './AccountCardFace';
import { BrandLogo, CardNetworkBadge } from './BrandLogo';

interface AccountEditorModalProps {
  initialAccount?: FinancialAccount | null;
  defaultCategory?: AccountCategory;
  onClose: () => void;
  onSave: (account: FinancialAccount) => void;
  onDelete?: (accountId: string) => void;
}

export const AccountEditorModal: React.FC<AccountEditorModalProps> = ({
  initialAccount,
  defaultCategory = 'DEBIT_CARD',
  onClose,
  onSave,
  onDelete,
}) => {
  const isEdit = !!initialAccount;

  const [category, setCategory] = useState<AccountCategory>(
    initialAccount?.category || defaultCategory
  );
  const [name, setName] = useState(initialAccount?.name || '');
  const [bankName, setBankName] = useState(initialAccount?.bankName || '');
  const [cardNumberLast4, setCardNumberLast4] = useState(initialAccount?.cardNumberLast4 || '');
  const [holderName, setHolderName] = useState(initialAccount?.holderName || '持卡人姓名');
  const [cardTier, setCardTier] = useState(initialAccount?.cardTier || '');
  const [cardSkin, setCardSkin] = useState(initialAccount?.cardSkin || '');
  const [cardBgColor, setCardBgColor] = useState(initialAccount?.cardBgColor || '');
  const [cardPattern, setCardPattern] = useState(initialAccount?.cardPattern || 'radial-sheen');
  const [cardTextColor, setCardTextColor] = useState<'light' | 'dark'>(initialAccount?.cardTextColor || 'light');
  const [cardImageUrl, setCardImageUrl] = useState(initialAccount?.cardImageUrl || '');
  const [cardPresetId, setCardPresetId] = useState(initialAccount?.cardPresetId || '');
  const [cardExpiry, setCardExpiry] = useState(initialAccount?.cardExpiry || '08/29');
  const [showBrandLogo, setShowBrandLogo] = useState<boolean>(initialAccount?.showBrandLogo || false);
  const [cardNetwork, setCardNetwork] = useState<'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE'>(
    initialAccount?.cardNetwork || 'UNIONPAY'
  );

  const [balance, setBalance] = useState<string>(
    initialAccount?.balance !== undefined ? initialAccount.balance.toString() : '0'
  );
  const [creditLimit, setCreditLimit] = useState<string>(
    initialAccount?.creditLimit !== undefined ? initialAccount.creditLimit.toString() : '20000'
  );
  const [usedCredit, setUsedCredit] = useState<string>(
    initialAccount?.usedCredit !== undefined ? initialAccount.usedCredit.toString() : '0'
  );
  const [billDay, setBillDay] = useState<string>(
    initialAccount?.billDay !== undefined ? initialAccount.billDay.toString() : '5'
  );
  const [dueDay, setDueDay] = useState<string>(
    initialAccount?.dueDay !== undefined ? initialAccount.dueDay.toString() : '25'
  );
  const [goldGrams, setGoldGrams] = useState<string>(
    initialAccount?.goldGrams !== undefined ? initialAccount.goldGrams.toString() : '50'
  );
  const [goldUnitPrice, setGoldUnitPrice] = useState<string>(
    initialAccount?.goldUnitPrice !== undefined ? initialAccount.goldUnitPrice.toString() : '600'
  );
  const [counterparty, setCounterparty] = useState(initialAccount?.counterparty || '');
  const [dueDate, setDueDate] = useState(initialAccount?.dueDate || '');
  const [notes, setNotes] = useState(initialAccount?.notes || '');
  const [color, setColor] = useState(
    initialAccount?.color || ACCOUNT_CATEGORY_CONFIG[category]?.defaultColor || '#2563eb'
  );

  const [autoGenMsg, setAutoGenMsg] = useState<string>('');
  const [brandFilterTab, setBrandFilterTab] = useState<'RECOMMENDED' | 'BANKS' | 'DIGITAL' | 'CREDIT' | 'ALL'>('RECOMMENDED');
  const [liveGoldRate, setLiveGoldRate] = useState<GoldMarketRate>(() => getCachedGoldRate());
  const [isFetchingGold, setIsFetchingGold] = useState<boolean>(false);
  const [isCardentifyGalleryOpen, setIsCardentifyGalleryOpen] = useState<boolean>(false);
  const [totalGalleryCardsCount, setTotalGalleryCardsCount] = useState<number>(() => getTotalGalleryCardsCount());

  // Real-time listener for dual-library gallery updates
  useEffect(() => {
    const handleGalleryUpdate = () => {
      setTotalGalleryCardsCount(getTotalGalleryCardsCount());
    };
    window.addEventListener('gallery-updated', handleGalleryUpdate);
    window.addEventListener('cardart-updated', handleGalleryUpdate);
    window.addEventListener('cardentify-updated', handleGalleryUpdate);
    return () => {
      window.removeEventListener('gallery-updated', handleGalleryUpdate);
      window.removeEventListener('cardart-updated', handleGalleryUpdate);
      window.removeEventListener('cardentify-updated', handleGalleryUpdate);
    };
  }, []);

  // Update whenever gallery modal closes or opens
  useEffect(() => {
    setTotalGalleryCardsCount(getTotalGalleryCardsCount());
  }, [isCardentifyGalleryOpen]);

  // Auto fetch latest gold market price
  useEffect(() => {
    let isMounted = true;
    fetchLiveGoldRate().then((rate) => {
      if (isMounted) {
        setLiveGoldRate(rate);
        // If creating new gold account and gold price is default or unset, pre-fill with live rate
        if (!isEdit && category === 'GOLD' && (!goldUnitPrice || goldUnitPrice === '600')) {
          setGoldUnitPrice(rate.priceRmbGram.toString());
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [category, isEdit]);

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

  const handleRefreshGoldRate = async () => {
    setIsFetchingGold(true);
    try {
      const rate = await fetchLiveGoldRate(true);
      setLiveGoldRate(rate);
      setGoldUnitPrice(rate.priceRmbGram.toString());
      setAutoGenMsg(`⚡ 已获取今日最新国内 Au9999 金价 ¥${rate.priceRmbGram}/克并自动填入`);
      setTimeout(() => setAutoGenMsg(''), 4000);
    } finally {
      setIsFetchingGold(false);
    }
  };

  // Intelligent Auto-select Card Face based on Card Tier & Bank
  const applyCardTierAndFace = (
    newTier: string,
    targetBank?: string,
    targetName?: string,
    targetCategory?: AccountCategory
  ) => {
    const effectiveBank = targetBank !== undefined ? targetBank : bankName;
    const effectiveCategory = targetCategory !== undefined ? targetCategory : category;
    const effectiveName = targetName !== undefined ? targetName : (name || `${effectiveBank || ''}${newTier}`);

    setCardTier(newTier);

    // 1. Try to match the best authentic Cardentify & CardArt card face based on bank + name + category + tier!
    const matchedCard = matchBestCardentifyCard(
      effectiveName,
      effectiveBank,
      effectiveCategory,
      newTier
    );

    if (matchedCard) {
      const presetId = String(matchedCard.id).startsWith('card')
        ? String(matchedCard.id)
        : `cardentify-${matchedCard.id}`;

      setCardPresetId(presetId);
      setCardImageUrl(matchedCard.imageUrl);

      let net: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = 'UNIONPAY';
      const brandUp = (matchedCard.brand || '').toUpperCase();
      if (brandUp.includes('VISA')) net = 'VISA';
      else if (brandUp.includes('MASTER')) net = 'MASTERCARD';
      else if (brandUp.includes('AMEX')) net = 'AMEX';
      else if (brandUp.includes('JCB')) net = 'JCB';
      setCardNetwork(net);

      const brandInfo = detectBrandInfo(effectiveName, effectiveBank, effectiveCategory);
      const tierTheme = getTierTheme(newTier, brandInfo);
      setCardSkin(tierTheme.cardSkin);
      setCardPattern(tierTheme.cardPattern);
      setCardTextColor(tierTheme.cardTextColor);
      setCardBgColor('');

      setAutoGenMsg(`✨ 已根据「${newTier}」智能匹配「${matchedCard.name}」高清卡面`);
      setTimeout(() => setAutoGenMsg(''), 3500);
      return;
    }

    // 2. If no exact HD card face image exists, apply tier-specific luxury skin & gradient
    const brandInfo = detectBrandInfo(effectiveName, effectiveBank, effectiveCategory);
    const tierTheme = getTierTheme(newTier, brandInfo);

    if (!cardImageUrl) {
      setCardPresetId('');
      setCardSkin(tierTheme.cardSkin);
      setCardBgColor(tierTheme.cardBgColor);
      setCardPattern(tierTheme.cardPattern);
      setCardTextColor(tierTheme.cardTextColor);
    }
    if (tierTheme.cardNetwork && (!cardNetwork || cardNetwork === 'NONE')) {
      setCardNetwork(tierTheme.cardNetwork);
    }

    setAutoGenMsg(`🎨 已根据「${newTier}」自动适配 ${tierTheme.description}`);
    setTimeout(() => setAutoGenMsg(''), 3500);
  };

  // Handle category switching with complete intelligent auto-matching
  const handleCategoryChange = (newCategory: AccountCategory) => {
    setCategory(newCategory);
    setBrandFilterTab('RECOMMENDED'); // Reset filter to recommended for new category

    const preset = getDefaultPresetForCategory(newCategory);
    setName(preset.name);
    setBankName(preset.bankName);
    setCardNetwork(preset.cardNetwork);
    setColor(preset.primaryColor);
    setCardBgColor('');

    if (preset.creditLimit !== undefined) {
      setCreditLimit(preset.creditLimit);
    }
    if (preset.usedCredit !== undefined) {
      setUsedCredit(preset.usedCredit);
    }
    if (preset.billDay !== undefined) {
      setBillDay(preset.billDay);
    }
    if (preset.dueDay !== undefined) {
      setDueDay(preset.dueDay);
    }
    if (preset.goldGrams !== undefined) {
      setGoldGrams(preset.goldGrams);
    }
    if (newCategory === 'GOLD') {
      const livePrice = liveGoldRate?.priceRmbGram || 688.6;
      setGoldUnitPrice(livePrice.toString());
    } else if (preset.goldUnitPrice !== undefined) {
      setGoldUnitPrice(preset.goldUnitPrice);
    }
    if (preset.counterparty !== undefined) {
      setCounterparty(preset.counterparty);
    }
    if (preset.balance !== undefined) {
      setBalance(preset.balance);
    }

    // Automatically select card face based on tier
    applyCardTierAndFace(preset.cardTier, preset.bankName, preset.name, newCategory);
  };

  // Auto set defaults on initial creation
  useEffect(() => {
    if (!isEdit && !name) {
      const preset = getDefaultPresetForCategory(category);
      setName(preset.name);
      setBankName(preset.bankName);
      setCardNetwork(preset.cardNetwork);
      setColor(preset.primaryColor);
      applyCardTierAndFace(preset.cardTier, preset.bankName, preset.name, category);
    }
  }, [isEdit]);

  // Automatic Background Color Generation
  const handleAutoGenerateBackground = () => {
    const result = autoGenerateCardBackground(name || bankName, category);
    setCardBgColor(result.gradient);
    setAutoGenMsg(`✨ 已根据卡名自动匹配: ${result.name}`);
    setTimeout(() => setAutoGenMsg(''), 3500);
  };

  const handleRandomBackground = () => {
    const pal = getRandomCardBackground();
    setCardBgColor(pal.gradient);
    setAutoGenMsg(`🎲 已为您生成灵感配色: ${pal.name}`);
    setTimeout(() => setAutoGenMsg(''), 3500);
  };

  const handleApplyPalette = (palette: LuxuryPalette) => {
    setCardBgColor(palette.gradient);
    setAutoGenMsg(`🎨 已应用主题: ${palette.name}`);
    setTimeout(() => setAutoGenMsg(''), 3500);
  };

  const handleResetToDefaultSkin = () => {
    setCardBgColor('');
    const brand = detectBrandInfo(name, bankName, category);
    setCardSkin(brand.cardSkin);
    setAutoGenMsg(`↺ 已恢复「${brand.name}」官方默认卡面`);
    setTimeout(() => setAutoGenMsg(''), 3500);
  };

  // Apply a brand preset directly with context awareness and tier-based cardface selection
  const handleSelectBrandPreset = (brand: BankBrandInfo) => {
    const isDedicatedCategoryBrand = [
      'HUABEI',
      'JD_BAITIAO',
      'YUEBAO',
      'GOLD',
      'FUND',
      'CASH',
      'RECEIVABLE',
      'PAYABLE',
      'ALIPAY',
      'JD_FINANCE',
    ].includes(brand.id);

    if (isDedicatedCategoryBrand) {
      handleCategoryChange(brand.category);
      return;
    }

    // Clear old custom settings
    setCardPresetId('');
    setCardImageUrl('');
    setCardBgColor('');

    // Bank entity selected (e.g. 招商银行, 工商银行, 建设银行, 农业银行, 交通银行, 宁波银行...)
    if (category === 'CREDIT_CARD') {
      const bName = brand.shortName;
      const curTier = cardTier || '白金卡';
      const accName = `${bName}${curTier.includes('白金') ? '经典白金信用卡' : '信用卡'}`;
      setBankName(bName);
      setName(accName);
      setColor(brand.primaryColor);
      applyCardTierAndFace(curTier, bName, accName, 'CREDIT_CARD');
      return;
    }

    if (category === 'GOLD') {
      setBankName(brand.shortName);
      setName(`${brand.shortName}贵金属积存账户`);
      setCardTier('9999足金积存账户');
      setCardSkin('gold-metallic');
      setColor(brand.primaryColor);
      setAutoGenMsg(`✨ 已应用「${brand.shortName}」贵金属积存官方卡面与LOGO`);
      setTimeout(() => setAutoGenMsg(''), 3500);
      return;
    }

    if (category === 'FUND') {
      setBankName(brand.shortName);
      setName(`${brand.shortName}公募基金理财组合`);
      setCardTier('公募ETF/混合基金组合');
      setCardSkin(brand.cardSkin);
      setColor(brand.primaryColor);
      setAutoGenMsg(`✨ 已应用「${brand.shortName}」公募基金理财卡面与LOGO`);
      setTimeout(() => setAutoGenMsg(''), 3500);
      return;
    }

    // Default to debit card / general account
    setCategory('DEBIT_CARD');
    const bName = brand.shortName;
    const curTier = cardTier || brand.defaultTier;
    const accName = brand.name;
    setBankName(bName);
    setName(accName);
    setColor(brand.primaryColor);
    applyCardTierAndFace(curTier, bName, accName, 'DEBIT_CARD');
  };

  // Bank name input handler: updates bank name only, no longer forced real-time exclusive logo linkage
  const handleBankNameChange = (newBankVal: string) => {
    setBankName(newBankVal);
  };

  const isCredit = category === 'CREDIT_CARD' || category === 'JD_BAITIAO' || category === 'HUABEI';
  const isGold = category === 'GOLD';
  const isLendOrBorrow = category === 'RECEIVABLE' || category === 'PAYABLE';

  // Construct preview account object
  let calcBalance = parseFloat(balance) || 0;
  if (isGold) {
    calcBalance = (parseFloat(goldGrams) || 0) * (parseFloat(goldUnitPrice) || 0);
  } else if (isCredit) {
    calcBalance = parseFloat(usedCredit) || 0;
  }

  const previewAccount: FinancialAccount = {
    id: initialAccount?.id || 'preview-id',
    name: name || '资产卡片名称',
    category,
    bankName: bankName || undefined,
    cardNumberLast4: cardNumberLast4 || undefined,
    balance: calcBalance,
    creditLimit: isCredit ? parseFloat(creditLimit) || 0 : undefined,
    usedCredit: isCredit ? parseFloat(usedCredit) || 0 : undefined,
    billDay: category === 'CREDIT_CARD' ? parseInt(billDay, 10) || undefined : undefined,
    dueDay: isCredit ? parseInt(dueDay, 10) || undefined : undefined,
    goldGrams: isGold ? parseFloat(goldGrams) || undefined : undefined,
    goldUnitPrice: isGold ? parseFloat(goldUnitPrice) || undefined : undefined,
    counterparty: isLendOrBorrow ? counterparty || undefined : undefined,
    dueDate: isLendOrBorrow ? dueDate || undefined : undefined,
    notes: notes || undefined,
    color,
    holderName: holderName || undefined,
    cardTier: cardTier || undefined,
    cardSkin: cardSkin || undefined,
    cardBgColor: cardBgColor || undefined,
    cardPattern: cardPattern || undefined,
    cardTextColor: cardTextColor || undefined,
    cardImageUrl: cardImageUrl || undefined,
    cardPresetId: cardPresetId || undefined,
    cardExpiry: cardExpiry || undefined,
    cardNetwork,
    showBrandLogo,
    updatedAt: new Date().toISOString(),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || bankName.trim() || (ACCOUNT_CATEGORY_CONFIG[category]?.label || '银行卡账户');

    const saved: FinancialAccount = {
      id: initialAccount?.id || 'acc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: finalName,
      category,
      bankName: bankName.trim() || undefined,
      cardNumberLast4: cardNumberLast4.trim() || undefined,
      balance: calcBalance,
      creditLimit: isCredit ? parseFloat(creditLimit) || 0 : undefined,
      usedCredit: isCredit ? parseFloat(usedCredit) || 0 : undefined,
      billDay: category === 'CREDIT_CARD' ? parseInt(billDay, 10) || undefined : undefined,
      dueDay: isCredit ? parseInt(dueDay, 10) || undefined : undefined,
      goldGrams: isGold ? parseFloat(goldGrams) || undefined : undefined,
      goldUnitPrice: isGold ? parseFloat(goldUnitPrice) || undefined : undefined,
      counterparty: isLendOrBorrow ? counterparty.trim() || undefined : undefined,
      dueDate: isLendOrBorrow ? dueDate || undefined : undefined,
      color,
      holderName: holderName.trim() || undefined,
      cardTier: cardTier.trim() || undefined,
      cardSkin: cardSkin || undefined,
      cardBgColor: cardBgColor.trim() || undefined,
      cardPattern: cardPattern || undefined,
      cardTextColor: cardTextColor || undefined,
      cardImageUrl: cardImageUrl.trim() || undefined,
      cardPresetId: cardPresetId || undefined,
      cardExpiry: cardExpiry.trim() || undefined,
      cardNetwork,
      showBrandLogo,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(saved);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Fixed Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isEdit ? '编辑卡面与账户' : '添加新卡面与账户'}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                  {ACCOUNT_CATEGORY_CONFIG[category]?.label || '账户'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                1:1 仿真卡面物理尺寸 · 支持官方主题与尊享奢华高定底色
              </p>
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
        <div className="flex-1 overflow-y-auto modal-custom-scrollbar px-5 sm:px-6 py-5 space-y-4">
          {/* Notification Banner when auto-matched or customized */}
          {autoGenMsg && (
            <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                <span>{autoGenMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoGenMsg('')}
                className="text-emerald-700 hover:text-emerald-900 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Brand Presets Quick Bar - Dynamically Filtered & Category-Aware */}
          <div className="pb-3.5 border-b border-slate-100 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>一键选择开户银行 / 机构品牌 (已为您联动「{ACCOUNT_CATEGORY_CONFIG[category]?.label || '当前资产大类'}」)</span>
              </label>

              {/* Brand Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('RECOMMENDED')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'RECOMMENDED'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🌟 分类精选
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('BANKS')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'BANKS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🏦 商业银行
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('DIGITAL')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'DIGITAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📱 移动支付
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('CREDIT')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'CREDIT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  💳 消费信贷
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('ALL')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📋 全部品牌
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 modal-custom-scrollbar">
              {getBrandsForCategory(category, brandFilterTab).map((b) => {
                const isSelected = bankName === b.shortName || name.includes(b.shortName);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBrandPreset(b)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-102 ring-2 ring-blue-500/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                    title={`点击快速套用「${b.name}」官方卡面、LOGO与品牌底色`}
                  >
                    <BrandLogo type={b.logoType} size="sm" />
                    <span>{b.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual Column Layout: Left Form, Right Live Card Face */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
            {/* LEFT: Interactive Settings Form (7 cols) */}
            <form id="account-editor-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            {/* Category Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    资产大类
                  </label>
                  <span className="text-[10px] text-blue-600 font-medium">⚡ 切换自动联动官方属性</span>
                </div>
                <select
                  id="acc-select-category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as AccountCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white"
                >
                  <optgroup label="💳 借记卡">
                    <option value="DEBIT_CARD">银行借记卡 (储蓄卡/活期)</option>
                  </optgroup>
                  <optgroup label="💳 信用卡">
                    <option value="CREDIT_CARD">借贷信用卡 (银行信用卡)</option>
                    <option value="JD_BAITIAO">京东白条 (先用后付)</option>
                    <option value="HUABEI">蚂蚁花呗 (先享后付)</option>
                  </optgroup>
                  <optgroup label="📱 数字钱包">
                    <option value="ALIPAY">支付宝余额 (数字零钱钱包)</option>
                    <option value="WECHAT">微信支付 (微信零钱/零钱通)</option>
                  </optgroup>
                  <optgroup label="📈 理财基金">
                    <option value="YUEBAO">余额宝 (零钱货币基金)</option>
                    <option value="FUND">基金理财 (公募基金/理财组合)</option>
                    <option value="GOLD">黄金理财 (积存金/实物黄金)</option>
                    <option value="JD_FINANCE">京东金融 (京东小金库/理财)</option>
                  </optgroup>
                  <optgroup label="💵 现金">
                    <option value="CASH">现金备用金 (纸币/零钱备用)</option>
                  </optgroup>
                  <optgroup label="🤝 借贷">
                    <option value="RECEIVABLE">借出款项 (待收回债权)</option>
                    <option value="PAYABLE">借入款项 (待偿还债务)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label htmlFor="acc-input-bank" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  银行名称
                </label>
                <input
                  id="acc-input-bank"
                  type="text"
                  value={bankName}
                  onChange={(e) => handleBankNameChange(e.target.value)}
                  placeholder="如 工商银行 / 建设银行 / 招商银行"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-medium"
                />
              </div>
            </div>

            {/* Account Display Name & Cardholder Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  账户卡片显示名称
                </label>
                <input
                  id="acc-input-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如: 招行经典白金信用卡"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>持卡人姓名 (显示在卡面)</span>
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="如 ZHANG WEI / 张伟"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-mono uppercase"
                />
              </div>
            </div>

            {/* Card Tier, Tail Number, Expiry, and Card Network */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  卡号后4位
                </label>
                <input
                  id="acc-input-card-last4"
                  type="text"
                  maxLength={4}
                  value={cardNumberLast4}
                  onChange={(e) => setCardNumberLast4(e.target.value)}
                  placeholder="如 8826"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none font-mono tracking-widest text-center font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    卡片等级
                  </label>
                  <button
                    type="button"
                    onClick={() => applyCardTierAndFace(cardTier || '白金卡')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                    title="根据填写的等级自动重新匹配对应卡面"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>联动卡面</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={cardTier}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCardTier(val);
                  }}
                  onBlur={() => {
                    if (cardTier && cardTier.trim().length >= 2) {
                      applyCardTierAndFace(cardTier.trim());
                    }
                  }}
                  placeholder="如 经典白金 / 金卡"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  有效期 (MM/YY)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="08/29"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  卡组织徽标
                </label>
                <select
                  value={cardNetwork}
                  onChange={(e) => setCardNetwork(e.target.value as any)}
                  className="w-full px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none font-bold"
                >
                  <option value="UNIONPAY">中国银联 UnionPay</option>
                  <option value="VISA">VISA</option>
                  <option value="MASTERCARD">万事达 Mastercard</option>
                  <option value="AMEX">美国运通 AMEX</option>
                  <option value="JCB">JCB (吉士美)</option>
                  <option value="NONE">无卡组织</option>
                </select>
              </div>
            </div>

            {/* Quick Card Tier Chips · Automatically Selects Corresponding Card Face */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/70 border border-indigo-100/90 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>卡片等级快捷切换（自动联动对应卡面艺廊与质感）</span>
                </span>
                <span className="text-[10px] text-slate-400">点击自动匹配对应卡面</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COMMON_CARD_TIERS.map((tierItem) => {
                  const isCurrent =
                    cardTier === tierItem.value ||
                    (tierItem.id === 'PLATINUM' && cardTier.includes('白金')) ||
                    (tierItem.id === 'GOLD' && cardTier.includes('金卡') && !cardTier.includes('白金')) ||
                    (tierItem.id === 'BLACK' && (cardTier.includes('黑') || cardTier.includes('百夫长') || cardTier.includes('无限'))) ||
                    (tierItem.id === 'DIAMOND' && cardTier.includes('钻石')) ||
                    (tierItem.id === 'VIP' && (cardTier.includes('金葵花') || cardTier.includes('理财金') || cardTier.includes('沃德') || cardTier.includes('贵宾'))) ||
                    (tierItem.id === 'STANDARD' && (cardTier.includes('普卡') || cardTier.includes('标准') || cardTier.includes('借记')));

                  return (
                    <button
                      key={tierItem.id}
                      type="button"
                      onClick={() => applyCardTierAndFace(tierItem.value)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all active:scale-95 border flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold scale-102 ring-2 ring-indigo-500/20'
                          : 'bg-white text-slate-700 border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/60 shadow-2xs'
                      }`}
                    >
                      <span>{tierItem.label}</span>
                      {isCurrent && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific fields for Credit Card / BaiTiao */}
            {isCredit ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 space-y-3">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>信用卡 / 白条额度与账单周期设置</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      总信用额度 (元)
                    </label>
                    <input
                      id="acc-input-credit-limit"
                      type="number"
                      step="100"
                      required
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-rose-700 mb-1">
                      已用额度 / 当前欠款 (元)
                    </label>
                    <input
                      id="acc-input-used-credit"
                      type="number"
                      step="0.01"
                      required
                      value={usedCredit}
                      onChange={(e) => setUsedCredit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 text-sm focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-rose-200/60">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">每月账单日 (如5号)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={billDay}
                      onChange={(e) => setBillDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">每月还款日 (如25号)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none font-semibold text-rose-600"
                    />
                  </div>
                </div>
              </div>
            ) : isGold ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-yellow-50/80 border border-amber-200 space-y-3.5 shadow-xs">
                {/* Live Market Rate Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-500 text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        上海黄金交易所 Au9999 现货基准
                      </span>
                      <span className="text-[11px] text-amber-700/90 font-mono">
                        实时金价: ¥{liveGoldRate.priceRmbGram}/g · 汇率: 1 USD = {liveGoldRate.usdCnyRate} CNY
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setGoldUnitPrice(liveGoldRate.priceRmbGram.toString())}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1"
                      title="将当前输入框的金价自动填充为今日最新现货金价"
                    >
                      <span>⚡ 填入今日最新价 (¥{liveGoldRate.priceRmbGram})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshGoldRate}
                      disabled={isFetchingGold}
                      className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs transition-colors disabled:opacity-50"
                      title="刷新最新行情"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isFetchingGold ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-amber-900 font-semibold mb-1">
                      持仓克重 (克 / g)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={goldGrams}
                      onChange={(e) => setGoldGrams(e.target.value)}
                      placeholder="例如: 50"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-amber-900 font-semibold">
                        当前金价 (元/克)
                      </label>
                      <span className="text-[10px] text-amber-700 font-medium">
                        国际折算: ${liveGoldRate.priceUsdOz}/oz
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={goldUnitPrice}
                      onChange={(e) => setGoldUnitPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-200/80 flex items-center justify-between">
                  <span className="text-xs text-amber-900 font-medium">
                    折算黄金资产总市值 (克重 × 金价):
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-amber-900 font-mono">
                    ¥{calcBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ) : isLendOrBorrow ? (
              <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200/60 space-y-3">
                <span className="text-xs font-bold text-cyan-800">
                  {category === 'RECEIVABLE' ? '借出债权信息' : '借入债务信息'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">金额 (元)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      {category === 'RECEIVABLE' ? '借款人 (债务人)' : '出借人 (债权人)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={counterparty}
                      onChange={(e) => setCounterparty(e.target.value)}
                      placeholder="如 张伟"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">约定还款日</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  现有可用余额 (元)
                </label>
                <input
                  id="acc-input-balance"
                  type="number"
                  step="0.01"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            )}

              {/* Card Base Color & Texture Skin Selection */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    <span>CardArt & Cardentify 高清卡面艺廊 ({totalGalleryCardsCount.toLocaleString()} 款)</span>
                  </label>

                  {/* Quick Auto Generation Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsCardentifyGalleryOpen(true)}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                      title={`打开 CardArt (cardart.cc) & Cardentify (cards.no2.ac) 双库高清卡面艺廊 (${totalGalleryCardsCount.toLocaleString()} 款)`}
                    >
                      <span>🎨 打开卡面艺廊 ({totalGalleryCardsCount.toLocaleString()} 款)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const matched = matchBestCardentifyCard(name, bankName, category);
                        if (matched) {
                          setCardImageUrl(matched.imageUrl);
                          if (!bankName) setBankName(matched.issuerName);
                          let net: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = 'UNIONPAY';
                          const bUp = (matched.brand || '').toUpperCase();
                          if (bUp.includes('VISA')) net = 'VISA';
                          else if (bUp.includes('MASTER')) net = 'MASTERCARD';
                          else if (bUp.includes('AMEX')) net = 'AMEX';
                          else if (bUp.includes('JCB')) net = 'JCB';
                          setCardNetwork(net);
                          setCardTier(matched.name.includes('白金') ? '白金卡' : matched.name.includes('金卡') ? '金卡' : '贵宾卡');
                          setAutoGenMsg(`🍎 已智能匹配 Cardentify 原版卡面: 「${matched.name}」`);
                        } else {
                          const p = matchBestCardentifyPreset(name, bankName, category);
                          setCardPresetId(p.id);
                          if (p.cardImageUrl) setCardImageUrl(p.cardImageUrl);
                          setCardBgColor(p.cardStyle.background);
                          setAutoGenMsg(`🍎 已匹配 Cardentify 主题卡面: 「${p.name}」`);
                        }
                        setTimeout(() => setAutoGenMsg(''), 3500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold border border-indigo-200/80 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                      title="根据当前填写的银行或卡名自动匹配官方卡面"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>✨ 智能匹配</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoGenerateBackground}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold border border-purple-200/80 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                      title="根据填写的卡片名称或所属银行，智能计算高质感专属底色"
                    >
                      <Wand2 className="w-3 h-3 text-purple-600" />
                      <span>✨ 智能底色</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRandomBackground}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200/80 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                      title="从奢华黑金、皇家蓝、翡翠绿、香槟金等顶级卡面中随机换色"
                    >
                      <Dices className="w-3 h-3 text-amber-600" />
                      <span>🎲 灵感换色</span>
                    </button>
                  </div>
                </div>

                {/* Cardentify Official HD Card Faces Carousel */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50/50 via-slate-50 to-indigo-50/50 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-base">🍎</span>
                      <span>Cardentify 精选官方原版卡面 (直接点击套用)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCardentifyGalleryOpen(true)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      <span>查看全部 557+ 张 &gt;</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 modal-custom-scrollbar">
                    {CARDENTIFY_PRESETS.map((p) => {
                      const isSelected = cardImageUrl === p.cardImageUrl || cardPresetId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setCardPresetId(p.id);
                            if (p.cardImageUrl) setCardImageUrl(p.cardImageUrl);
                            setCardBgColor(p.cardStyle.background);
                            setCardPattern(p.cardStyle.patternType || 'radial-sheen');
                            setCardTextColor(p.textColorMode);
                            setCardTier(p.cardTier);
                            setCardNetwork(p.cardNetwork);
                            if (!bankName) setBankName(p.bankName);
                            setAutoGenMsg(`🍎 已应用 Cardentify 卡面: 「${p.name}」`);
                            setTimeout(() => setAutoGenMsg(''), 3500);
                          }}
                          className={`p-2 rounded-xl border text-left shrink-0 w-36 transition-all relative overflow-hidden group/item ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-white shadow-sm scale-102'
                              : 'border-slate-200 hover:border-slate-300 bg-white/80 hover:bg-white'
                          }`}
                        >
                          <div
                            className="w-full h-11 rounded-lg mb-1.5 relative overflow-hidden flex flex-col justify-between p-1.5 text-white shadow-2xs border border-white/20 bg-slate-900"
                          >
                            {p.cardImageUrl ? (
                              <img
                                src={p.cardImageUrl}
                                alt={p.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="absolute inset-0"
                                style={{ background: p.cardStyle.background }}
                              />
                            )}
                            <div className="relative z-10 flex items-center justify-between">
                              <span className="text-[8px] font-bold truncate max-w-[70px] drop-shadow-md text-white">
                                {p.bankName}
                              </span>
                              <span className="text-[7px] uppercase font-mono tracking-tighter text-white drop-shadow-md">
                                {p.cardNetwork}
                              </span>
                            </div>
                            <span className="relative z-10 text-[7px] truncate text-white drop-shadow-md">{p.cardTier}</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                            {p.name}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate mt-0.5 font-mono">
                            {p.englishName}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Micro Customization: Surface Patterns & Text Color Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                      <span>Apple Pay 仿真微光暗纹</span>
                    </label>
                    <select
                      value={cardPattern}
                      onChange={(e) => setCardPattern(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none"
                    >
                      <option value="radial-sheen">高光微晕 (Radial Specular)</option>
                      <option value="waves">流动波浪 (Flowing Waves)</option>
                      <option value="geometric">几何度量 (Geometric Lines)</option>
                      <option value="mesh">经纬网格 (Precision Mesh)</option>
                      <option value="silk-stripes">丝绸斜纹 (Silk Stripes)</option>
                      <option value="circuit">科技电路线 (Cyber Circuit)</option>
                      <option value="dots">点阵星芒 (Matrix Dots)</option>
                      <option value="none">纯净哑光 (无暗纹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <SunMoon className="w-3.5 h-3.5 text-slate-600" />
                      <span>卡面文字色调模式</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCardTextColor('light')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          cardTextColor === 'light'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 shadow-xs" />
                        <span>白银微光字 (深色卡)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardTextColor('dark')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          cardTextColor === 'dark'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/50 shadow-xs" />
                        <span>钛黑石墨字 (浅色卡)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bank Logo Badge Display Option */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">卡面银行标志显示</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">默认仅显示优雅银行名称文本，不再强制联动显示圆形专属LOGO</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showBrandLogo}
                      onChange={(e) => setShowBrandLogo(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 font-medium">显示专属LOGO</span>
                  </label>
                </div>

                {/* Custom Card Face Image URL or File Upload */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cardentify / Apple Pay 自定义高清卡面图像 (可选)</span>
                    </label>
                    {cardImageUrl && (
                      <button
                        type="button"
                        onClick={() => setCardImageUrl('')}
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        清除图像
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cardImageUrl}
                      onChange={(e) => setCardImageUrl(e.target.value)}
                      placeholder="粘贴原图 URL (如 GitHub Raw / Apple Pay 提取图)"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none"
                    />
                    <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs cursor-pointer shrink-0 transition-colors">
                      <span>本地上传</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const src = ev.target?.result as string;
                              if (!src) return;
                              const img = new Image();
                              img.onload = () => {
                                const maxWidth = 1024;
                                const maxHeight = 640;
                                let { width, height } = img;
                                if (width > maxWidth || height > maxHeight) {
                                  const ratio = Math.min(maxWidth / width, maxHeight / height);
                                  width = Math.round(width * ratio);
                                  height = Math.round(height * ratio);
                                }
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  try {
                                    const webp = canvas.toDataURL('image/webp', 0.88);
                                    setCardImageUrl(webp);
                                  } catch {
                                    setCardImageUrl(canvas.toDataURL('image/jpeg', 0.85));
                                  }
                                } else {
                                  setCardImageUrl(src);
                                }
                                setAutoGenMsg('📷 已载入并优化本地高清卡面图像');
                                setTimeout(() => setAutoGenMsg(''), 3500);
                              };
                              img.onerror = () => {
                                setCardImageUrl(src);
                              };
                              img.src = src;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    支持粘贴 Cardentify 仓库原图链接或从相册上传从 Apple Pay / 云闪付 导出的高清卡面切图。
                  </p>
                </div>

                {/* 1. Curated Luxury Gradient Recipes */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <span>💎 尊享奢华高定色系 (点击应用)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">已收录12款顶级卡面渐变</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LUXURY_PALETTES.map((pal) => {
                      const isSelected = cardBgColor === pal.gradient;
                      return (
                        <button
                          key={pal.id}
                          type="button"
                          onClick={() => handleApplyPalette(pal)}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 relative overflow-hidden ${
                            isSelected
                              ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-lg shrink-0 shadow-2xs border border-white/20"
                            style={{ background: pal.gradient }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-semibold text-slate-800 truncate">
                              {pal.name}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate font-mono">
                              {pal.tag}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Official Bank Skins & Custom Hex Color */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      🏛️ 银行官方标准材质主题
                    </span>
                    {/* Custom color picker */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">调色板:</span>
                      <input
                        type="color"
                        value={cardBgColor && !cardBgColor.includes('gradient') ? cardBgColor : '#0f172a'}
                        onChange={(e) => setCardBgColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-200"
                        title="选择任意自定义纯色底色"
                      />
                      {cardBgColor && (
                        <button
                          type="button"
                          onClick={handleResetToDefaultSkin}
                          className="text-[10px] text-purple-600 hover:text-purple-800 underline font-medium"
                        >
                          恢复官方默认
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CARD_SKINS.slice(0, 8).map((skin) => {
                      const isSelected =
                        (cardSkin || detectBrandInfo(name, bankName, category).cardSkin) === skin.id &&
                        !cardBgColor;
                      return (
                        <button
                          key={skin.id}
                          type="button"
                          onClick={() => {
                            setCardSkin(skin.id);
                            setCardBgColor(''); // clear custom hex to use skin
                          }}
                          className={`p-1.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs scale-102 bg-slate-50 font-semibold'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md bg-gradient-to-br ${skin.gradientClass} shrink-0 shadow-2xs border border-black/10`}
                          />
                          <span className="text-[11px] text-slate-700 truncate">{skin.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                卡片备注说明
              </label>
              <input
                id="acc-input-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如: 主发工资卡、日常扫码扣费..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
          </form>

          {/* RIGHT: Live Interactive Card Face Preview (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-0 self-start flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-700" />
                  <span>1:1 真实卡面尺寸实时预览</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  ISO 85.6×53.98mm
                </span>
              </div>

              {/* Renders real realistic Card Face Component */}
              <div className="w-full shadow-lg rounded-2xl overflow-hidden">
                <AccountCardFace account={previewAccount} privacyMode={false} hideActionRow={true} />
              </div>

              {/* Interactive Quick-Switch Controls under Live Preview */}
              <div className="mt-3 flex items-center justify-center gap-2 p-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={handleAutoGenerateBackground}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                  title="根据卡名自动匹配"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>智能匹配</span>
                </button>
                <button
                  type="button"
                  onClick={handleRandomBackground}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                  title="随机切换下一张奢华底色"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>换一张</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaultSkin}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors flex items-center justify-center gap-1"
                  title="恢复官方默认卡面"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>自动生成底色与高级材质</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                • <strong>智能卡名哈希算法</strong>：输入银行卡或自定义账户名称后，可一键自动合成符合物理卡片质感的高对比度渐变底色。
                <br />
                • <strong>灵感色盘库</strong>：支持 曜石黑金、皇家蓝钻、英伦翡翠、香槟流金、赛博极电青 等12款尊享高定色系自由切换。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-md flex items-center justify-between gap-3 z-20">
        <div>
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`确定要从资产库中移除「${name}」吗？`)) {
                  onDelete(initialAccount.id);
                  onClose();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-xs flex items-center gap-1.5 transition-colors border border-rose-200/60 shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除此卡片</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
          >
            取消
          </button>

          <button
            id="btn-save-account"
            type="submit"
            form="account-editor-form"
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4" />
            <span>保存并更新卡面</span>
          </button>
        </div>
      </div>
    </div>

    {/* Cardentify Official Gallery & Selector Modal */}
    <CardentifyGalleryModal
      isOpen={isCardentifyGalleryOpen}
      onClose={() => setIsCardentifyGalleryOpen(false)}
      currentImageUrl={cardImageUrl}
      defaultBankQuery={bankName || name}
      onSelectCard={(card) => {
        setCardImageUrl(card.imageUrl);
        const presetId = String(card.id).startsWith('card') ? String(card.id) : `cardentify-${card.id}`;
        setCardPresetId(presetId);
        if (!bankName || bankName === '中国银行' || bankName === '银行账户') {
          setBankName(card.issuerName);
        }
        if (!name || name === '借记卡' || name === '信用卡' || name === '银行账户' || name === '账户') {
          setName(card.name);
        }
        let net: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = 'UNIONPAY';
        const brandUp = (card.brand || '').toUpperCase();
        if (brandUp.includes('VISA')) net = 'VISA';
        else if (brandUp.includes('MASTER')) net = 'MASTERCARD';
        else if (brandUp.includes('AMEX')) net = 'AMEX';
        else if (brandUp.includes('JCB')) net = 'JCB';
        setCardNetwork(net);
        setCardTier(card.name.includes('白金') ? '白金卡' : card.name.includes('金卡') ? '金卡' : '标准卡');
        setAutoGenMsg(`🍎 已从卡面艺廊套用原版卡面: 「${card.name}」`);
        setIsCardentifyGalleryOpen(false);
        setTimeout(() => setAutoGenMsg(''), 4000);
      }}
    />
  </div>
  );
};
