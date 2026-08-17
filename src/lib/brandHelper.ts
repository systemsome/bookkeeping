import { AccountCategory } from '../types';

export interface BankBrandInfo {
  id: string;
  name: string;
  shortName: string;
  englishName: string;
  category: AccountCategory;
  primaryColor: string;
  secondaryColor: string;
  gradientClass: string;
  cardSkin: string;
  cardNetwork: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE';
  logoType: string;
  defaultTier: string;
}

export const BANK_BRANDS: BankBrandInfo[] = [
  {
    id: 'CMB',
    name: '招商银行',
    shortName: '招商银行',
    englishName: 'CHINA MERCHANTS BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#e11d48',
    secondaryColor: '#9f1239',
    gradientClass: 'from-[#e11d48] via-[#be123c] to-[#881337]',
    cardSkin: 'classic-cmb',
    cardNetwork: 'UNIONPAY',
    logoType: 'cmb',
    defaultTier: '金葵花一卡通',
  },
  {
    id: 'ICBC',
    name: '中国工商银行',
    shortName: '工商银行',
    englishName: 'INDUSTRIAL & COMMERCIAL BANK OF CHINA',
    category: 'DEBIT_CARD',
    primaryColor: '#dc2626',
    secondaryColor: '#7f1d1d',
    gradientClass: 'from-[#dc2626] via-[#b91c1c] to-[#450a0a]',
    cardSkin: 'icbc-red',
    cardNetwork: 'UNIONPAY',
    logoType: 'icbc',
    defaultTier: '理财金账户',
  },
  {
    id: 'CCB',
    name: '中国建设银行',
    shortName: '建设银行',
    englishName: 'CHINA CONSTRUCTION BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#0284c7',
    secondaryColor: '#0369a1',
    gradientClass: 'from-[#0369a1] via-[#075985] to-[#082f49]',
    cardSkin: 'ccb-blue',
    cardNetwork: 'UNIONPAY',
    logoType: 'ccb',
    defaultTier: '乐当家理财卡',
  },
  {
    id: 'ABC',
    name: '中国农业银行',
    shortName: '农业银行',
    englishName: 'AGRICULTURAL BANK OF CHINA',
    category: 'DEBIT_CARD',
    primaryColor: '#059669',
    secondaryColor: '#064e3b',
    gradientClass: 'from-[#059669] via-[#047857] to-[#022c22]',
    cardSkin: 'abc-green',
    cardNetwork: 'UNIONPAY',
    logoType: 'abc',
    defaultTier: '金穗借记卡',
  },
  {
    id: 'BOC',
    name: '中国银行',
    shortName: '中国银行',
    englishName: 'BANK OF CHINA',
    category: 'DEBIT_CARD',
    primaryColor: '#b91c1c',
    secondaryColor: '#7c2d12',
    gradientClass: 'from-[#b91c1c] via-[#991b1b] to-[#450a0a]',
    cardSkin: 'boc-red',
    cardNetwork: 'UNIONPAY',
    logoType: 'boc',
    defaultTier: '长城借记卡',
  },
  {
    id: 'BOCOM',
    name: '交通银行',
    shortName: '交通银行',
    englishName: 'BANK OF COMMUNICATIONS',
    category: 'DEBIT_CARD',
    primaryColor: '#1e3a8a',
    secondaryColor: '#0f172a',
    gradientClass: 'from-[#1e3a8a] via-[#172554] to-[#020617]',
    cardSkin: 'midnight-navy',
    cardNetwork: 'UNIONPAY',
    logoType: 'bocom',
    defaultTier: '沃德财富卡',
  },
  {
    id: 'CITIC',
    name: '中信银行',
    shortName: '中信银行',
    englishName: 'CHINA CITIC BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#e11d48',
    secondaryColor: '#1e293b',
    gradientClass: 'from-[#be123c] via-[#881337] to-[#0f172a]',
    cardSkin: 'classic-cmb',
    cardNetwork: 'UNIONPAY',
    logoType: 'citic',
    defaultTier: '中信理财借记卡',
  },
  {
    id: 'PINGAN',
    name: '平安银行',
    shortName: '平安银行',
    englishName: 'PING AN BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#ea580c',
    secondaryColor: '#7c2d12',
    gradientClass: 'from-[#ea580c] via-[#c2410c] to-[#431407]',
    cardSkin: 'classic-cmb',
    cardNetwork: 'UNIONPAY',
    logoType: 'pingan',
    defaultTier: '平安借记金卡',
  },
  {
    id: 'SPDB',
    name: '浦发银行',
    shortName: '浦发银行',
    englishName: 'SHANGHAI PUDONG DEVELOPMENT BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#1e40af',
    secondaryColor: '#172554',
    gradientClass: 'from-[#1e40af] via-[#1e3a8a] to-[#0f172a]',
    cardSkin: 'ccb-blue',
    cardNetwork: 'UNIONPAY',
    logoType: 'spdb',
    defaultTier: '东方借记卡',
  },
  {
    id: 'PSBC',
    name: '中国邮政储蓄银行',
    shortName: '邮储银行',
    englishName: 'POSTAL SAVINGS BANK OF CHINA',
    category: 'DEBIT_CARD',
    primaryColor: '#15803d',
    secondaryColor: '#14532d',
    gradientClass: 'from-[#15803d] via-[#166534] to-[#052e16]',
    cardSkin: 'abc-green',
    cardNetwork: 'UNIONPAY',
    logoType: 'psbc',
    defaultTier: '绿卡借记卡',
  },
  {
    id: 'CMBC',
    name: '中国民生银行',
    shortName: '民生银行',
    englishName: 'CHINA MINSHENG BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#0f766e',
    secondaryColor: '#134e4a',
    gradientClass: 'from-[#0f766e] via-[#115e59] to-[#042f2e]',
    cardSkin: 'emerald-cash',
    cardNetwork: 'UNIONPAY',
    logoType: 'cmbc',
    defaultTier: '民生借记卡',
  },
  {
    id: 'NBCB',
    name: '宁波银行',
    shortName: '宁波银行',
    englishName: 'BANK OF NINGBO',
    category: 'DEBIT_CARD',
    primaryColor: '#ea580c',
    secondaryColor: '#9a3412',
    gradientClass: 'from-[#f97316] via-[#ea580c] to-[#7c2d12]',
    cardSkin: 'ningbo-amber',
    cardNetwork: 'UNIONPAY',
    logoType: 'nbcb',
    defaultTier: '汇通借记金卡',
  },
  {
    id: 'BOB',
    name: '北京银行',
    shortName: '北京银行',
    englishName: 'BANK OF BEIJING',
    category: 'DEBIT_CARD',
    primaryColor: '#c8102e',
    secondaryColor: '#881337',
    gradientClass: 'from-[#be123c] via-[#9f1239] to-[#4c0519]',
    cardSkin: 'icbc-red',
    cardNetwork: 'UNIONPAY',
    logoType: 'bob',
    defaultTier: '京卡借记卡',
  },
  {
    id: 'BOS',
    name: '上海银行',
    shortName: '上海银行',
    englishName: 'BANK OF SHANGHAI',
    category: 'DEBIT_CARD',
    primaryColor: '#004b97',
    secondaryColor: '#002f6c',
    gradientClass: 'from-[#004b97] via-[#003875] to-[#082f49]',
    cardSkin: 'ccb-blue',
    cardNetwork: 'UNIONPAY',
    logoType: 'bos',
    defaultTier: '申卡借记金卡',
  },
  {
    id: 'MYBANK',
    name: '浙江网商银行',
    shortName: '网商银行',
    englishName: 'MYBANK (ANT GROUP DIGITAL BANK)',
    category: 'DEBIT_CARD',
    primaryColor: '#0066cc',
    secondaryColor: '#004080',
    gradientClass: 'from-[#0066cc] via-[#004f9e] to-[#022c60]',
    cardSkin: 'mybank-blue',
    cardNetwork: 'UNIONPAY',
    logoType: 'mybank',
    defaultTier: '网商普惠经营账户',
  },
  {
    id: 'WEBANK',
    name: '深圳前海微众银行',
    shortName: '微众银行',
    englishName: 'WEBANK (TENCENT DIGITAL BANK)',
    category: 'DEBIT_CARD',
    primaryColor: '#0052d9',
    secondaryColor: '#003699',
    gradientClass: 'from-[#0052d9] via-[#003db3] to-[#031e68]',
    cardSkin: 'webank-blue',
    cardNetwork: 'UNIONPAY',
    logoType: 'webank',
    defaultTier: '微众活期+ 结算账户',
  },
  {
    id: 'AIBANK',
    name: '百信银行',
    shortName: '百信银行',
    englishName: 'AIBANK DIGITAL BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#e11d48',
    secondaryColor: '#881337',
    gradientClass: 'from-[#e11d48] via-[#be123c] to-[#4c0519]',
    cardSkin: 'classic-cmb',
    cardNetwork: 'UNIONPAY',
    logoType: 'aibank',
    defaultTier: '百信智惠账户',
  },
  {
    id: 'ALIPAY',
    name: '支付宝',
    shortName: '支付宝',
    englishName: 'ALIPAY DIGITAL WALLET',
    category: 'ALIPAY',
    primaryColor: '#1677ff',
    secondaryColor: '#0958d9',
    gradientClass: 'from-[#1677ff] via-[#0958d9] to-[#002c8c]',
    cardSkin: 'alipay-blue',
    cardNetwork: 'NONE',
    logoType: 'alipay',
    defaultTier: '个人认证账户',
  },
  {
    id: 'HUABEI',
    name: '蚂蚁花呗',
    shortName: '花呗',
    englishName: 'ANT HUABEI CREDIT',
    category: 'HUABEI',
    primaryColor: '#0083ff',
    secondaryColor: '#005bb5',
    gradientClass: 'from-[#00a3ff] via-[#0077e6] to-[#003b80]',
    cardSkin: 'huabei-blue',
    cardNetwork: 'NONE',
    logoType: 'huabei',
    defaultTier: '花呗消费信贷额度',
  },
  {
    id: 'YUEBAO',
    name: '余额宝',
    shortName: '余额宝',
    englishName: 'YUE BAO MONEY FUND',
    category: 'YUEBAO',
    primaryColor: '#f97316',
    secondaryColor: '#c2410c',
    gradientClass: 'from-[#f97316] via-[#ea580c] to-[#9a3412]',
    cardSkin: 'gold-metallic',
    cardNetwork: 'NONE',
    logoType: 'yuebao',
    defaultTier: '货币基金理财账户',
  },
  {
    id: 'WECHAT',
    name: '微信支付',
    shortName: '微信支付',
    englishName: 'WECHAT PAY',
    category: 'ALIPAY',
    primaryColor: '#10b981',
    secondaryColor: '#065f46',
    gradientClass: 'from-[#10b981] via-[#059669] to-[#064e3b]',
    cardSkin: 'wechat-green',
    cardNetwork: 'NONE',
    logoType: 'wechat',
    defaultTier: '微信零钱 / 零钱通',
  },
  {
    id: 'JD_FINANCE',
    name: '京东金融',
    shortName: '京东金融',
    englishName: 'JD FINANCE',
    category: 'JD_FINANCE',
    primaryColor: '#ef4444',
    secondaryColor: '#991b1b',
    gradientClass: 'from-[#ef4444] via-[#dc2626] to-[#18181b]',
    cardSkin: 'jd-red',
    cardNetwork: 'NONE',
    logoType: 'jd',
    defaultTier: '京东小金库尊享',
  },
  {
    id: 'JD_BAITIAO',
    name: '京东白条',
    shortName: '京东白条',
    englishName: 'JD BAITIAO CREDIT',
    category: 'JD_BAITIAO',
    primaryColor: '#ec4899',
    secondaryColor: '#831843',
    gradientClass: 'from-[#ec4899] via-[#db2777] to-[#3b0764]',
    cardSkin: 'baitiao-pink',
    cardNetwork: 'NONE',
    logoType: 'baitiao',
    defaultTier: '先享后付白条额度',
  },
  {
    id: 'GOLD',
    name: '黄金积存金',
    shortName: '黄金',
    englishName: '24K PHYSICAL GOLD / ACCUMULATION',
    category: 'GOLD',
    primaryColor: '#d97706',
    secondaryColor: '#78350f',
    gradientClass: 'from-[#f59e0b] via-[#d97706] to-[#451a03]',
    cardSkin: 'gold-metallic',
    cardNetwork: 'NONE',
    logoType: 'gold',
    defaultTier: '9999足金积存账户',
  },
  {
    id: 'FUND',
    name: '公募基金理财',
    shortName: '公募基金',
    englishName: 'MUTUAL FUND ASSETS',
    category: 'FUND',
    primaryColor: '#8b5cf6',
    secondaryColor: '#4c1d95',
    gradientClass: 'from-[#8b5cf6] via-[#7c3aed] to-[#1e1b4b]',
    cardSkin: 'purple-aurora',
    cardNetwork: 'NONE',
    logoType: 'fund',
    defaultTier: '公募ETF/混合基金组合',
  },
  {
    id: 'CASH',
    name: '现金与备用金',
    shortName: '随身现金',
    englishName: 'CASH ON HAND & EMERGENCY FUND',
    category: 'CASH',
    primaryColor: '#059669',
    secondaryColor: '#022c22',
    gradientClass: 'from-[#059669] via-[#047857] to-[#064e3b]',
    cardSkin: 'emerald-cash',
    cardNetwork: 'NONE',
    logoType: 'cash',
    defaultTier: '纸币现金 / 备用钱包',
  },
  {
    id: 'RECEIVABLE',
    name: '借出款项 (债权待收)',
    shortName: '借出待收',
    englishName: 'RECEIVABLE DEBT / LOAN OUT',
    category: 'RECEIVABLE',
    primaryColor: '#0891b2',
    secondaryColor: '#164e63',
    gradientClass: 'from-[#0891b2] via-[#0e7490] to-[#082f49]',
    cardSkin: 'midnight-navy',
    cardNetwork: 'NONE',
    logoType: 'receivable',
    defaultTier: '借款人债权契约',
  },
  {
    id: 'PAYABLE',
    name: '借入借款 (债务待还)',
    shortName: '借入待还',
    englishName: 'PAYABLE DEBT / BORROW IN',
    category: 'PAYABLE',
    primaryColor: '#9333ea',
    secondaryColor: '#3b0764',
    gradientClass: 'from-[#9333ea] via-[#7e22ce] to-[#18181b]',
    cardSkin: 'purple-aurora',
    cardNetwork: 'NONE',
    logoType: 'payable',
    defaultTier: '个人借款债务',
  },
];

/**
 * CURATED LUXURY CARD GRADIENT RECIPES
 * For smart automatic generation and instant randomized styling
 */
export interface LuxuryPalette {
  id: string;
  name: string;
  tag: string;
  gradient: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  subText: string;
}

export const LUXURY_PALETTES: LuxuryPalette[] = [
  {
    id: 'obsidian_gold',
    name: '曜石黑金 (Centurion)',
    tag: '黑金尊享',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 45%, #020617 100%)',
    primaryColor: '#0f172a',
    accentColor: '#fbbf24',
    borderColor: 'border-amber-400/40',
    subText: '顶级尊荣哑光黑金',
  },
  {
    id: 'sapphire_navy',
    name: '皇家蓝钻 (Royal Sapphire)',
    tag: '商务深蓝',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #0f172a 100%)',
    primaryColor: '#1e3a8a',
    accentColor: '#60a5fa',
    borderColor: 'border-blue-300/40',
    subText: '深邃高贵皇家蓝',
  },
  {
    id: 'bordeaux_crimson',
    name: '勃艮第红 (Bordeaux Wine)',
    tag: '尊爵深红',
    gradient: 'linear-gradient(135deg, #991b1b 0%, #881337 40%, #18181b 100%)',
    primaryColor: '#881337',
    accentColor: '#f43f5e',
    borderColor: 'border-rose-400/30',
    subText: '法式典雅醇厚红酒',
  },
  {
    id: 'racing_emerald',
    name: '英伦翡翠 (British Racing Green)',
    tag: '贵族墨绿',
    gradient: 'linear-gradient(135deg, #065f46 0%, #047857 35%, #022c22 100%)',
    primaryColor: '#064e3b',
    accentColor: '#34d399',
    borderColor: 'border-emerald-300/40',
    subText: '复古名仕奢品绿',
  },
  {
    id: 'cosmic_amethyst',
    name: '极光霓虹紫 (Cosmic Aurora)',
    tag: '星云秘境',
    gradient: 'linear-gradient(135deg, #6b21a8 0%, #581c87 40%, #1e1b4b 100%)',
    primaryColor: '#581c87',
    accentColor: '#c084fc',
    borderColor: 'border-purple-300/40',
    subText: '梦幻星河极光紫',
  },
  {
    id: 'titanium_slate',
    name: '钛合金灰 (Titanium Carbon)',
    tag: '极简冷灰',
    gradient: 'linear-gradient(135deg, #334155 0%, #1e293b 45%, #09090b 100%)',
    primaryColor: '#1e293b',
    accentColor: '#94a3b8',
    borderColor: 'border-slate-400/30',
    subText: '精工科技哑光钛合金',
  },
  {
    id: 'champagne_amber',
    name: '香槟流金 (Champagne Gold)',
    tag: '暖调璨金',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 45%, #451a03 100%)',
    primaryColor: '#b45309',
    accentColor: '#fde047',
    borderColor: 'border-amber-300/50',
    subText: '璀璨奢华香槟暖光',
  },
  {
    id: 'sunset_tangerine',
    name: '日落赤橙 (Sunset Coral)',
    tag: '活力暖橙',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 45%, #431407 100%)',
    primaryColor: '#c2410c',
    accentColor: '#fb923c',
    borderColor: 'border-orange-400/40',
    subText: '黄昏霞光炽热橙红',
  },
  {
    id: 'deep_marine',
    name: '深海碧涛 (Deep Marine)',
    tag: '科技湖蓝',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #082f49 100%)',
    primaryColor: '#0369a1',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-300/40',
    subText: '无垠深海纯净湛蓝',
  },
  {
    id: 'rose_copper',
    name: '晶钻玫瑰金 (Rose Copper)',
    tag: '摩登晶粉',
    gradient: 'linear-gradient(135deg, #db2777 0%, #9d174d 40%, #3b0764 100%)',
    primaryColor: '#9d174d',
    accentColor: '#f472b6',
    borderColor: 'border-pink-300/40',
    subText: '流光溢彩玫瑰金属',
  },
  {
    id: 'velvet_midnight',
    name: '丝绒暗夜 (Midnight Velvet)',
    tag: '极度纯黑',
    gradient: 'linear-gradient(135deg, #18181b 0%, #09090b 50%, #000000 100%)',
    primaryColor: '#09090b',
    accentColor: '#e4e4e7',
    borderColor: 'border-zinc-700/50',
    subText: '深沉纯粹暗夜黑',
  },
  {
    id: 'cyber_cyan',
    name: '赛博极电青 (Cyber Neon)',
    tag: '未来霓虹',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #0f766e 40%, #042f2e 100%)',
    primaryColor: '#0f766e',
    accentColor: '#2dd4bf',
    borderColor: 'border-teal-300/40',
    subText: '未来科技霓虹青',
  },
];

/**
 * Deterministic hash to convert any string seed into a luxury color gradient
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * AUTOMATICALLY GENERATE LUXURY CARD BACKGROUND
 * Deterministically or procedurally derives an optimal high-contrast gradient
 */
export function autoGenerateCardBackground(seed: string = '', category?: AccountCategory): {
  gradient: string;
  name: string;
  palette: LuxuryPalette;
} {
  const cleanSeed = (seed || '').trim();
  
  if (!cleanSeed) {
    // Pick random luxury palette
    const randomIndex = Math.floor(Math.random() * LUXURY_PALETTES.length);
    const p = LUXURY_PALETTES[randomIndex];
    return {
      gradient: p.gradient,
      name: p.name,
      palette: p,
    };
  }

  // 1. Check if name directly maps to a branded palette
  const brand = detectBrandInfo(cleanSeed, undefined, category);
  if (brand && brand.id !== 'DEBIT_CARD' && brand.id !== 'CASH') {
    // If recognized brand, derive from brand colors
    const matchedSkin = CARD_SKINS.find(s => s.id === brand.cardSkin);
    if (matchedSkin) {
      const gradient = `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.secondaryColor} 60%, #09090b 100%)`;
      return {
        gradient,
        name: `${brand.shortName}专属定制底色`,
        palette: {
          id: brand.id.toLowerCase(),
          name: brand.name,
          tag: '品牌定制',
          gradient,
          primaryColor: brand.primaryColor,
          accentColor: '#ffffff',
          borderColor: matchedSkin.borderColor,
          subText: brand.englishName,
        },
      };
    }
  }

  // 2. Hash-based deterministic selection from curated luxury palettes
  const hash = hashString(cleanSeed);
  const paletteIndex = hash % LUXURY_PALETTES.length;
  const chosenPalette = LUXURY_PALETTES[paletteIndex];

  return {
    gradient: chosenPalette.gradient,
    name: chosenPalette.name,
    palette: chosenPalette,
  };
}

/**
 * Get random unique card background recipe
 */
export function getRandomCardBackground(excludeId?: string): LuxuryPalette {
  const available = excludeId ? LUXURY_PALETTES.filter(p => p.id !== excludeId) : LUXURY_PALETTES;
  const index = Math.floor(Math.random() * available.length);
  return available[index] || LUXURY_PALETTES[0];
}

/**
 * Helper to auto-match brand logo and card skin by account name or bankName
 */
export function detectBrandInfo(accountName: string, bankName?: string, category?: AccountCategory): BankBrandInfo {
  const text = `${accountName} ${bankName || ''}`.toLowerCase();

  // Explicit check for major brands & internet banks
  if (text.includes('网商') || text.includes('mybank') || text.includes('浙江网商')) {
    return BANK_BRANDS.find((b) => b.id === 'MYBANK')!;
  }
  if (text.includes('微众') || text.includes('webank') || text.includes('微粒贷') || text.includes('前海微众')) {
    return BANK_BRANDS.find((b) => b.id === 'WEBANK')!;
  }
  if (text.includes('百信') || text.includes('aibank')) {
    return BANK_BRANDS.find((b) => b.id === 'AIBANK')!;
  }
  if (text.includes('北京银行') || text.includes('京行') || text.includes('bob')) {
    return BANK_BRANDS.find((b) => b.id === 'BOB')!;
  }
  if (text.includes('宁波银行') || text.includes('宁银') || text.includes('nbcb')) {
    return BANK_BRANDS.find((b) => b.id === 'NBCB')!;
  }
  if (text.includes('上海银行') || text.includes('上行') || text.includes('bos')) {
    return BANK_BRANDS.find((b) => b.id === 'BOS')!;
  }
  if (text.includes('招商') || text.includes('招行') || text.includes('cmb')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'CMB')!;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '经典白金信用卡' } : brand;
  }
  if (text.includes('工商') || text.includes('工行') || text.includes('icbc') || text.includes('牡丹')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'ICBC')!;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '牡丹白金信用卡' } : brand;
  }
  if (text.includes('建设') || text.includes('建行') || text.includes('ccb') || text.includes('龙卡')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'CCB')!;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '龙卡全球支付白金卡' } : brand;
  }
  if (text.includes('农业') || text.includes('农行') || text.includes('abc') || text.includes('金穗')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'ABC')!;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '金穗悠游白金卡' } : brand;
  }
  if (text.includes('中国银行') || text.includes('中行') || text.includes('boc') || text.includes('长城')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'BOC')!;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '长城卓隽白金卡' } : brand;
  }
  if (text.includes('交通') || text.includes('交行') || text.includes('bocom') || text.includes('白麒麟')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'BOCOM')!;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '白麒麟白金信用卡' } : brand;
  }
  if (text.includes('中信') || text.includes('citic')) {
    return BANK_BRANDS.find((b) => b.id === 'CITIC')!;
  }
  if (text.includes('平安') || text.includes('pingan')) {
    return BANK_BRANDS.find((b) => b.id === 'PINGAN')!;
  }
  if (text.includes('浦发') || text.includes('spdb')) {
    return BANK_BRANDS.find((b) => b.id === 'SPDB')!;
  }
  if (text.includes('邮政') || text.includes('邮储') || text.includes('psbc')) {
    return BANK_BRANDS.find((b) => b.id === 'PSBC')!;
  }
  if (text.includes('民生') || text.includes('cmbc')) {
    return BANK_BRANDS.find((b) => b.id === 'CMBC')!;
  }
  if (text.includes('白条') || text.includes('baitiao') || category === 'JD_BAITIAO') {
    return BANK_BRANDS.find((b) => b.id === 'JD_BAITIAO')!;
  }
  if (text.includes('花呗') || text.includes('huabei') || category === 'HUABEI') {
    return BANK_BRANDS.find((b) => b.id === 'HUABEI')!;
  }
  if (text.includes('京东') || text.includes('小金库') || category === 'JD_FINANCE') {
    return BANK_BRANDS.find((b) => b.id === 'JD_FINANCE')!;
  }
  if (text.includes('余额宝') || category === 'YUEBAO') {
    return BANK_BRANDS.find((b) => b.id === 'YUEBAO')!;
  }
  if (text.includes('微信') || text.includes('wechat')) {
    return BANK_BRANDS.find((b) => b.id === 'WECHAT')!;
  }
  if (text.includes('支付宝') || text.includes('alipay') || category === 'ALIPAY') {
    return BANK_BRANDS.find((b) => b.id === 'ALIPAY')!;
  }
  if (text.includes('黄金') || text.includes('金条') || text.includes('积存') || category === 'GOLD') {
    return BANK_BRANDS.find((b) => b.id === 'GOLD')!;
  }
  if (text.includes('基金') || text.includes('理财') || category === 'FUND') {
    return BANK_BRANDS.find((b) => b.id === 'FUND')!;
  }
  if (text.includes('现金') || text.includes('备用金') || category === 'CASH') {
    return BANK_BRANDS.find((b) => b.id === 'CASH')!;
  }
  if (text.includes('借出') || category === 'RECEIVABLE') {
    return BANK_BRANDS.find((b) => b.id === 'RECEIVABLE')!;
  }
  if (text.includes('借入') || category === 'PAYABLE') {
    return BANK_BRANDS.find((b) => b.id === 'PAYABLE')!;
  }

  // Fallback by category
  const matched = BANK_BRANDS.find((b) => b.category === category);
  return matched || BANK_BRANDS[0];
}

/**
 * HIGH-DEFINITION CARD SKINS (Brand Base Colors & Textures)
 */
export const CARD_SKINS: {
  id: string;
  name: string;
  gradientClass: string;
  bgTexture: string;
  textColor: string;
  subTextColor: string;
  borderColor: string;
  accentColor: string;
  solidColor: string;
}[] = [
  {
    id: 'platinum-dark',
    name: '曜石钛黑 (黑金经典)',
    gradientClass: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
    bgTexture: 'radial-gradient(circle at 85% 15%, rgba(212,175,55,0.15) 0%, transparent 50%), linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
    textColor: 'text-white',
    subTextColor: 'text-amber-200/90',
    borderColor: 'border-amber-400/30',
    accentColor: '#f59e0b',
    solidColor: '#0f172a',
  },
  {
    id: 'mybank-blue',
    name: '网商科技蓝 (数字小微)',
    gradientClass: 'from-[#0066cc] via-[#004f9e] to-[#022c60]',
    bgTexture: 'radial-gradient(circle at 80% 20%, rgba(255,122,0,0.18) 0%, transparent 50%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
    textColor: 'text-white',
    subTextColor: 'text-sky-100/90',
    borderColor: 'border-sky-400/40',
    accentColor: '#0066cc',
    solidColor: '#0066cc',
  },
  {
    id: 'webank-blue',
    name: '微众极光蓝 (腾讯生态)',
    gradientClass: 'from-[#0052d9] via-[#003db3] to-[#031e68]',
    bgTexture: 'radial-gradient(circle at 20% 20%, rgba(43,164,113,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12) 0%, transparent 40%)',
    textColor: 'text-white',
    subTextColor: 'text-sky-100/90',
    borderColor: 'border-blue-400/40',
    accentColor: '#0052d9',
    solidColor: '#0052d9',
  },
  {
    id: 'classic-cmb',
    name: '招行经典红 (炽热烈焰)',
    gradientClass: 'from-[#e11d48] via-[#be123c] to-[#881337]',
    bgTexture: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    textColor: 'text-white',
    subTextColor: 'text-rose-100/90',
    borderColor: 'border-rose-300/40',
    accentColor: '#f43f5e',
    solidColor: '#e11d48',
  },
  {
    id: 'icbc-red',
    name: '工行牡丹红 (中国红)',
    gradientClass: 'from-[#dc2626] via-[#b91c1c] to-[#450a0a]',
    bgTexture: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 60%)',
    textColor: 'text-white',
    subTextColor: 'text-red-100/90',
    borderColor: 'border-red-400/40',
    accentColor: '#dc2626',
    solidColor: '#dc2626',
  },
  {
    id: 'ccb-blue',
    name: '建行深海蓝 (经典商务)',
    gradientClass: 'from-[#0284c7] via-[#0369a1] to-[#082f49]',
    bgTexture: 'radial-gradient(circle at 90% 10%, rgba(56,189,248,0.25) 0%, transparent 40%)',
    textColor: 'text-white',
    subTextColor: 'text-sky-100/90',
    borderColor: 'border-sky-300/40',
    accentColor: '#0284c7',
    solidColor: '#0284c7',
  },
  {
    id: 'abc-green',
    name: '农行翠竹绿 (生态生机)',
    gradientClass: 'from-[#059669] via-[#047857] to-[#022c22]',
    bgTexture: 'radial-gradient(circle at 10% 20%, rgba(52,211,153,0.2) 0%, transparent 50%)',
    textColor: 'text-white',
    subTextColor: 'text-emerald-100/90',
    borderColor: 'border-emerald-300/40',
    accentColor: '#059669',
    solidColor: '#059669',
  },
  {
    id: 'boc-red',
    name: '中行长城红 (深邃朱红)',
    gradientClass: 'from-[#b91c1c] via-[#991b1c] to-[#18181b]',
    bgTexture: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
    textColor: 'text-white',
    subTextColor: 'text-rose-100/90',
    borderColor: 'border-rose-400/30',
    accentColor: '#b91c1c',
    solidColor: '#b91c1c',
  },
  {
    id: 'ningbo-amber',
    name: '宁波金橙 (活力暖金)',
    gradientClass: 'from-[#f97316] via-[#ea580c] to-[#7c2d12]',
    bgTexture: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)',
    textColor: 'text-white',
    subTextColor: 'text-amber-100/90',
    borderColor: 'border-orange-300/40',
    accentColor: '#f97316',
    solidColor: '#f97316',
  },
  {
    id: 'gold-metallic',
    name: '24K璀璨纯金 (金卡尊享)',
    gradientClass: 'from-[#f59e0b] via-[#d97706] to-[#78350f]',
    bgTexture: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45) 0%, transparent 50%), linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
    textColor: 'text-amber-950',
    subTextColor: 'text-amber-900/90',
    borderColor: 'border-amber-300/80',
    accentColor: '#d97706',
    solidColor: '#d97706',
  },
  {
    id: 'midnight-navy',
    name: '星夜深蓝 (皇家蓝)',
    gradientClass: 'from-[#1e3a8a] via-[#172554] to-[#020617]',
    bgTexture: 'radial-gradient(circle at 75% 20%, rgba(147,197,253,0.2) 0%, transparent 50%)',
    textColor: 'text-white',
    subTextColor: 'text-blue-100/90',
    borderColor: 'border-blue-300/30',
    accentColor: '#3b82f6',
    solidColor: '#1e3a8a',
  },
  {
    id: 'alipay-blue',
    name: '支付宝科技蓝',
    gradientClass: 'from-[#1677ff] via-[#0958d9] to-[#002c8c]',
    bgTexture: 'radial-gradient(circle at 80% 10%, rgba(255,255,255,0.25) 0%, transparent 40%)',
    textColor: 'text-white',
    subTextColor: 'text-blue-100/90',
    borderColor: 'border-blue-300/40',
    accentColor: '#4096ff',
    solidColor: '#1677ff',
  },
  {
    id: 'huabei-blue',
    name: '花呗青空蓝',
    gradientClass: 'from-[#00a3ff] via-[#0077e6] to-[#003b80]',
    bgTexture: 'radial-gradient(circle at 80% 15%, rgba(255,255,255,0.3) 0%, transparent 40%)',
    textColor: 'text-white',
    subTextColor: 'text-sky-100/90',
    borderColor: 'border-sky-300/40',
    accentColor: '#38bdf8',
    solidColor: '#0083ff',
  },
  {
    id: 'wechat-green',
    name: '微信翡翠绿',
    gradientClass: 'from-[#10b981] via-[#059669] to-[#064e3b]',
    bgTexture: 'radial-gradient(circle at 75% 25%, rgba(255,255,255,0.2) 0%, transparent 45%)',
    textColor: 'text-white',
    subTextColor: 'text-emerald-100/90',
    borderColor: 'border-emerald-300/40',
    accentColor: '#10b981',
    solidColor: '#10b981',
  },
  {
    id: 'jd-red',
    name: '京东正品红',
    gradientClass: 'from-[#ef4444] via-[#dc2626] to-[#18181b]',
    bgTexture: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)',
    textColor: 'text-white',
    subTextColor: 'text-rose-100/90',
    borderColor: 'border-red-400/40',
    accentColor: '#ef4444',
    solidColor: '#ef4444',
  },
  {
    id: 'baitiao-pink',
    name: '白条晶钻粉',
    gradientClass: 'from-[#ec4899] via-[#db2777] to-[#3b0764]',
    bgTexture: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.25) 0%, transparent 45%)',
    textColor: 'text-white',
    subTextColor: 'text-pink-100/90',
    borderColor: 'border-pink-300/40',
    accentColor: '#ec4899',
    solidColor: '#ec4899',
  },
  {
    id: 'purple-aurora',
    name: '极光霓虹紫 (尊贵紫)',
    gradientClass: 'from-[#8b5cf6] via-[#7c3aed] to-[#1e1b4b]',
    bgTexture: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,0.25) 0%, transparent 45%)',
    textColor: 'text-white',
    subTextColor: 'text-purple-100/90',
    borderColor: 'border-purple-300/40',
    accentColor: '#a855f7',
    solidColor: '#7c3aed',
  },
  {
    id: 'emerald-cash',
    name: '清润薄荷绿',
    gradientClass: 'from-[#059669] via-[#047857] to-[#022c22]',
    bgTexture: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 60%)',
    textColor: 'text-white',
    subTextColor: 'text-emerald-100/90',
    borderColor: 'border-emerald-300/40',
    accentColor: '#059669',
    solidColor: '#059669',
  },
];
