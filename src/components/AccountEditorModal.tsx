import React, { useState, useEffect } from 'react';
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
} from '../lib/brandHelper';
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
  const [cardExpiry, setCardExpiry] = useState(initialAccount?.cardExpiry || '08/29');
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

  // Auto set defaults when switching category for new account
  useEffect(() => {
    if (!isEdit) {
      const defaultBrand = BANK_BRANDS.find((b) => b.category === category) || BANK_BRANDS[0];
      if (!name) {
        setName(defaultBrand.name);
      }
      if (!bankName && (category === 'DEBIT_CARD' || category === 'CREDIT_CARD')) {
        setBankName(defaultBrand.shortName);
      }
      if (!cardTier) {
        setCardTier(defaultBrand.defaultTier);
      }
      if (!cardSkin) {
        setCardSkin(defaultBrand.cardSkin);
      }
      setCardNetwork(defaultBrand.cardNetwork);
    }
  }, [category, isEdit]);

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

  // Apply a brand preset directly
  const handleSelectBrandPreset = (brand: BankBrandInfo) => {
    const isSpecialCategory = [
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
    ].includes(brand.category);

    if (isSpecialCategory) {
      setCategory(brand.category);
      setName(brand.name);
      setBankName(brand.shortName);
      setCardTier(brand.defaultTier);
      setCardSkin(brand.cardSkin);
      setCardNetwork(brand.cardNetwork);
      setColor(brand.primaryColor);
      setCardBgColor('');
      return;
    }

    // Bank entity selected (e.g. 招商银行, 工商银行, 建设银行...)
    if (category === 'CREDIT_CARD') {
      // Retain credit card mode and bind bank info & official styling
      setBankName(brand.shortName);
      setName(`${brand.shortName}信用卡`);
      setCardTier('标准白金信用卡');
      setCardSkin(brand.cardSkin);
      setCardNetwork('UNIONPAY');
      setColor(brand.primaryColor);
      setCardBgColor('');
    } else {
      // Standard debit card / bank account
      setCategory('DEBIT_CARD');
      setName(brand.name);
      setBankName(brand.shortName);
      setCardTier(brand.defaultTier);
      setCardSkin(brand.cardSkin);
      setCardNetwork(brand.cardNetwork);
      setColor(brand.primaryColor);
      setCardBgColor('');
    }
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
    cardExpiry: cardExpiry || undefined,
    cardNetwork,
    updatedAt: new Date().toISOString(),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入账户名称');
      return;
    }

    const saved: FinancialAccount = {
      id: initialAccount?.id || 'acc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
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
      cardExpiry: cardExpiry.trim() || undefined,
      cardNetwork,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>卡面与账户</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              1:1还原现实卡面尺寸 (ISO 85.6×53.98mm)，可配置品牌LOGO、卡面底色、卡组织徽标 (银联/VISA/万事达/AMEX/JCB)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Presets Quick Bar */}
        <div className="mt-4 pb-3 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>一键选择开户银行 / 机构品牌 (自动匹配官方LOGO与卡面底色)</span>
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {BANK_BRANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBrandPreset(b)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 border transition-all ${
                  bankName === b.shortName || name.includes(b.shortName)
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-102'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <BrandLogo type={b.logoType} size="sm" />
                <span>{b.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dual Column Layout: Left Form, Right Live Card Face */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          {/* LEFT: Interactive Settings Form (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            {/* Category Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  资产大类
                </label>
                <select
                  id="acc-select-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AccountCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white"
                >
                  {Object.entries(ACCOUNT_CATEGORY_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} - ({val.groupLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  银行 / 机构品牌名称
                </label>
                <input
                  id="acc-input-bank"
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="如 招商银行 / 工商银行 / 支付宝"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  卡片等级
                </label>
                <input
                  type="text"
                  value={cardTier}
                  onChange={(e) => setCardTier(e.target.value)}
                  placeholder="如 经典白金"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
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
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 space-y-3">
                <span className="text-xs font-bold text-amber-800">
                  黄金理财持仓克重与实时金价
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">持仓克重 (克)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={goldGrams}
                      onChange={(e) => setGoldGrams(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">当前金价 (元/克)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={goldUnitPrice}
                      onChange={(e) => setGoldUnitPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none font-semibold"
                    />
                  </div>
                </div>
                <div className="text-xs text-amber-800 font-medium">
                  实时折算总估值: ¥{calcBalance.toFixed(2)}
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
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-600" />
                  <span>卡面底色与材质主题</span>
                </label>

                {/* Quick Auto Generation Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAutoGenerateBackground}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold border border-purple-200/80 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                    title="根据填写的卡片名称或所属银行，智能计算高质感专属底色"
                  >
                    <Wand2 className="w-3 h-3 text-purple-600" />
                    <span>✨ 智能自动匹配</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRandomBackground}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200/80 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                    title="从奢华黑金、皇家蓝、翡翠绿、香槟金等顶级卡面中随机换色"
                  >
                    <Dices className="w-3 h-3 text-amber-600" />
                    <span>🎲 随机灵感换色</span>
                  </button>
                </div>
              </div>

              {/* Dynamic feedback toast */}
              {autoGenMsg && (
                <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium flex items-center justify-between animate-fade-in shadow-2xs">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                    <span>{autoGenMsg}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoGenMsg('')}
                    className="text-purple-400 hover:text-purple-700 text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

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

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`确定要从资产库中移除「${name}」吗？`)) {
                      onDelete(initialAccount.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-xs flex items-center gap-1.5 transition-colors border border-rose-200/60"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除此卡片</span>
                </button>
              )}

              <button
                id="btn-save-account"
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <Check className="w-4 h-4" />
                <span>保存并更新卡面</span>
              </button>
            </div>
          </form>

          {/* RIGHT: Live Interactive Card Face Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80">
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
              <div className="w-full shadow-lg rounded-2xl">
                <AccountCardFace account={previewAccount} privacyMode={false} />
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

            <div className="mt-4 p-3 rounded-2xl bg-white border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
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
    </div>
  );
};
