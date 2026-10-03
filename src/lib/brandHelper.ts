import { AccountCategory, BankAccountClass } from '../types';
import { matchLogoHubBank } from './logohubData';

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
  bankLogoUrl?: string; // 🏦 官方正版矢量银行徽标URL (来源于 https://logohub.afengblog.com/)
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
    bankLogoUrl: 'https://logohub.afengblog.com/logos/library/svglogo/pay/Mybank.svg',
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
    bankLogoUrl: '/api/logos/webank.svg',
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
    bankLogoUrl: '/api/logos/aibank.svg',
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
    primaryColor: '#ff5b00',
    secondaryColor: '#c2410c',
    gradientClass: 'from-[#ff5b00] via-[#ea580c] to-[#9a3412]',
    cardSkin: 'gold-metallic',
    cardNetwork: 'NONE',
    logoType: 'yuebao',
    bankLogoUrl: 'https://logohub.afengblog.com/logos/library/svglogo/pay/yuebao.svg',
    defaultTier: '货币基金理财账户',
  },
  {
    id: 'WECHAT',
    name: '微信支付',
    shortName: '微信支付',
    englishName: 'WECHAT PAY',
    category: 'WECHAT',
    primaryColor: '#07c160',
    secondaryColor: '#065f46',
    gradientClass: 'from-[#07c160] via-[#059669] to-[#064e3b]',
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
  {
    id: 'CEB',
    name: '中国光大银行',
    shortName: '光大银行',
    englishName: 'CHINA EVERBRIGHT BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#7e22ce',
    secondaryColor: '#581c87',
    gradientClass: 'from-[#7e22ce] via-[#6b21a8] to-[#3b0764]',
    cardSkin: 'purple-aurora',
    cardNetwork: 'UNIONPAY',
    logoType: 'ceb',
    defaultTier: '阳光借记卡',
  },
  {
    id: 'CIB',
    name: '兴业银行',
    shortName: '兴业银行',
    englishName: 'INDUSTRIAL BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#1d4ed8',
    secondaryColor: '#1e3a8a',
    gradientClass: 'from-[#1d4ed8] via-[#1e40af] to-[#0f172a]',
    cardSkin: 'ccb-blue',
    cardNetwork: 'UNIONPAY',
    logoType: 'cib',
    defaultTier: '自然人生借记卡',
  },
  {
    id: 'CGB',
    name: '广发银行',
    shortName: '广发银行',
    englishName: 'CHINA GUANGFA BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#dc2626',
    secondaryColor: '#991b1b',
    gradientClass: 'from-[#dc2626] via-[#b91c1c] to-[#450a0a]',
    cardSkin: 'icbc-red',
    cardNetwork: 'UNIONPAY',
    logoType: 'cgb',
    defaultTier: '臻尚借记卡',
  },
  {
    id: 'HXB',
    name: '华夏银行',
    shortName: '华夏银行',
    englishName: 'HUA XIA BANK',
    category: 'DEBIT_CARD',
    primaryColor: '#b91c1c',
    secondaryColor: '#7f1d1d',
    gradientClass: 'from-[#b91c1c] via-[#991b1b] to-[#450a0a]',
    cardSkin: 'boc-red',
    cardNetwork: 'UNIONPAY',
    logoType: 'hxb',
    defaultTier: '华夏借记卡',
  },
  {
    id: 'APPLEPAY',
    name: 'Apple Pay 苹果支付',
    shortName: 'Apple Pay',
    englishName: 'APPLE PAY WALLET',
    category: 'ALIPAY',
    primaryColor: '#0f172a',
    secondaryColor: '#020617',
    gradientClass: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
    cardSkin: 'platinum-dark',
    cardNetwork: 'NONE',
    logoType: 'applepay',
    defaultTier: 'Apple Wallet 快捷支付',
  },
];

export interface CategoryPreset {
  category: AccountCategory;
  name: string;
  bankName: string;
  cardTier: string;
  cardSkin: string;
  cardNetwork: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE';
  primaryColor: string;
  logoType: string;
  bankLogoUrl?: string;
  balance?: string;
  creditLimit?: string;
  usedCredit?: string;
  billDay?: string;
  dueDay?: string;
  goldGrams?: string;
  goldUnitPrice?: string;
  counterparty?: string;
  dueDate?: string;
  notes?: string;
}

/**
 * Get standard recommended preset for an asset category
 */
export function getDefaultPresetForCategory(category: AccountCategory): CategoryPreset {
  switch (category) {
    case 'CREDIT_CARD':
      return {
        category: 'CREDIT_CARD',
        name: '招商银行经典白金信用卡',
        bankName: '招商银行',
        cardTier: '经典白金信用卡',
        cardSkin: 'classic-cmb',
        cardNetwork: 'UNIONPAY',
        primaryColor: '#e11d48',
        logoType: 'cmb',
        creditLimit: '20000',
        usedCredit: '0',
        billDay: '5',
        dueDay: '25',
      };
    case 'DEBIT_CARD':
      return {
        category: 'DEBIT_CARD',
        name: '招商银行一卡通',
        bankName: '招商银行',
        cardTier: '金葵花一卡通',
        cardSkin: 'classic-cmb',
        cardNetwork: 'UNIONPAY',
        primaryColor: '#e11d48',
        logoType: 'cmb',
        balance: '0',
      };
    case 'ALIPAY':
      return {
        category: 'ALIPAY',
        name: '支付宝余额账户',
        bankName: '支付宝',
        cardTier: '个人实名认证账户',
        cardSkin: 'alipay-blue',
        cardNetwork: 'NONE',
        primaryColor: '#1677ff',
        logoType: 'alipay',
        balance: '0',
      };
    case 'WECHAT':
      return {
        category: 'WECHAT',
        name: '微信支付 (微信零钱)',
        bankName: '微信支付',
        cardTier: '微信数字钱包',
        cardSkin: 'wechat-green',
        cardNetwork: 'NONE',
        primaryColor: '#07c160',
        logoType: 'wechat',
        balance: '0',
      };
    case 'HUABEI':
      return {
        category: 'HUABEI',
        name: '蚂蚁花呗',
        bankName: '蚂蚁花呗',
        cardTier: '花呗消费信贷额度',
        cardSkin: 'huabei-blue',
        cardNetwork: 'NONE',
        primaryColor: '#0083ff',
        logoType: 'huabei',
        creditLimit: '10000',
        usedCredit: '0',
        billDay: '1',
        dueDay: '10',
      };
    case 'JD_BAITIAO':
      return {
        category: 'JD_BAITIAO',
        name: '京东白条',
        bankName: '京东白条',
        cardTier: '先享后付白条额度',
        cardSkin: 'baitiao-pink',
        cardNetwork: 'NONE',
        primaryColor: '#ec4899',
        logoType: 'baitiao',
        creditLimit: '8000',
        usedCredit: '0',
        billDay: '8',
        dueDay: '28',
      };
    case 'JD_FINANCE':
      return {
        category: 'JD_FINANCE',
        name: '京东小金库',
        bankName: '京东金融',
        cardTier: '京东小金库尊享',
        cardSkin: 'jd-red',
        cardNetwork: 'NONE',
        primaryColor: '#ef4444',
        logoType: 'jd',
        balance: '0',
      };
    case 'YUEBAO':
      return {
        category: 'YUEBAO',
        name: '余额宝货币基金',
        bankName: '余额宝',
        cardTier: '货币基金理财账户',
        cardSkin: 'gold-metallic',
        cardNetwork: 'NONE',
        primaryColor: '#ff5b00',
        logoType: 'yuebao',
        bankLogoUrl: 'https://logohub.afengblog.com/logos/library/svglogo/pay/yuebao.svg',
        balance: '0',
      };
    case 'GOLD':
      return {
        category: 'GOLD',
        name: '黄金积存金 (9999足金)',
        bankName: '黄金积存',
        cardTier: '9999足金积存账户',
        cardSkin: 'gold-metallic',
        cardNetwork: 'NONE',
        primaryColor: '#d97706',
        logoType: 'gold',
        goldGrams: '50',
        goldUnitPrice: '600',
      };
    case 'FUND':
      return {
        category: 'FUND',
        name: '公募基金理财组合',
        bankName: '公募基金',
        cardTier: '公募ETF/混合基金组合',
        cardSkin: 'purple-aurora',
        cardNetwork: 'NONE',
        primaryColor: '#8b5cf6',
        logoType: 'fund',
        balance: '0',
      };
    case 'CASH':
      return {
        category: 'CASH',
        name: '随身现金与应急备用金',
        bankName: '随身现金',
        cardTier: '纸币现金 / 备用钱包',
        cardSkin: 'emerald-cash',
        cardNetwork: 'NONE',
        primaryColor: '#059669',
        logoType: 'cash',
        balance: '0',
      };
    case 'RECEIVABLE':
      return {
        category: 'RECEIVABLE',
        name: '借出款项 (债权待收)',
        bankName: '借出待收',
        cardTier: '借款人债权契约',
        cardSkin: 'midnight-navy',
        cardNetwork: 'NONE',
        primaryColor: '#0891b2',
        logoType: 'receivable',
        balance: '0',
        counterparty: '张三',
      };
    case 'PAYABLE':
      return {
        category: 'PAYABLE',
        name: '借入借款 (债务待还)',
        bankName: '借入待还',
        cardTier: '个人借款债务',
        cardSkin: 'purple-aurora',
        cardNetwork: 'NONE',
        primaryColor: '#9333ea',
        logoType: 'payable',
        balance: '0',
        counterparty: '李四',
      };
    default:
      return {
        category: 'DEBIT_CARD',
        name: '银行卡账户',
        bankName: '招商银行',
        cardTier: '标准一卡通',
        cardSkin: 'classic-cmb',
        cardNetwork: 'UNIONPAY',
        primaryColor: '#e11d48',
        logoType: 'cmb',
        balance: '0',
      };
  }
}

/**
 * Filter brands smartly based on Category and Tab selection
 */
export function getBrandsForCategory(
  category: AccountCategory,
  activeTab: 'RECOMMENDED' | 'BANKS' | 'DIGITAL' | 'CREDIT' | 'ALL' = 'RECOMMENDED'
): BankBrandInfo[] {
  let list: BankBrandInfo[] = [];

  if (activeTab === 'BANKS') {
    list = BANK_BRANDS.filter(
      (b) => b.category === 'DEBIT_CARD' || ['CMB', 'ICBC', 'CCB', 'ABC', 'BOC', 'BOCOM', 'CITIC', 'PINGAN', 'SPDB', 'PSBC', 'CMBC', 'CEB', 'CIB', 'CGB', 'HXB', 'NBCB', 'BOB', 'BOS', 'MYBANK', 'WEBANK', 'AIBANK'].includes(b.id)
    );
  } else if (activeTab === 'DIGITAL') {
    list = BANK_BRANDS.filter(
      (b) => ['YUEBAO', 'ALIPAY', 'WECHAT', 'APPLEPAY', 'MYBANK', 'WEBANK', 'JD_FINANCE'].includes(b.id)
    );
  } else if (activeTab === 'CREDIT') {
    list = BANK_BRANDS.filter(
      (b) => ['HUABEI', 'JD_BAITIAO', 'CMB', 'ICBC', 'CCB', 'CITIC', 'PINGAN', 'SPDB', 'PAYABLE', 'RECEIVABLE'].includes(b.id)
    );
  } else if (activeTab === 'ALL') {
    list = BANK_BRANDS;
  } else {
    // RECOMMENDED Mode: Dynamically select brands tailored strictly for this category
    switch (category) {
      case 'DEBIT_CARD':
      case 'CREDIT_CARD':
        list = BANK_BRANDS.filter(
          (b) => ['CMB', 'ICBC', 'CCB', 'ABC', 'BOC', 'BOCOM', 'CITIC', 'PINGAN', 'SPDB', 'PSBC', 'CMBC', 'CEB', 'CIB', 'CGB', 'HXB', 'NBCB', 'BOB', 'BOS', 'MYBANK', 'WEBANK', 'AIBANK'].includes(b.id)
        );
        break;

      case 'ALIPAY':
      case 'WECHAT':
        list = BANK_BRANDS.filter(
          (b) => ['WECHAT', 'ALIPAY', 'APPLEPAY', 'MYBANK', 'WEBANK', 'JD_FINANCE'].includes(b.id)
        );
        break;

      case 'HUABEI':
        list = BANK_BRANDS.filter(
          (b) => ['HUABEI', 'ALIPAY', 'JD_BAITIAO', 'CMB', 'ICBC'].includes(b.id)
        );
        break;

      case 'JD_BAITIAO':
      case 'JD_FINANCE':
        list = BANK_BRANDS.filter(
          (b) => ['JD_BAITIAO', 'JD_FINANCE', 'ALIPAY', 'WECHAT'].includes(b.id)
        );
        break;

      case 'YUEBAO':
        list = BANK_BRANDS.filter(
          (b) => ['YUEBAO', 'ALIPAY', 'WECHAT', 'MYBANK', 'WEBANK', 'JD_FINANCE'].includes(b.id)
        );
        break;

      case 'GOLD':
        list = BANK_BRANDS.filter(
          (b) => ['GOLD', 'ICBC', 'CMB', 'CCB', 'ABC', 'ALIPAY'].includes(b.id)
        );
        break;

      case 'FUND':
        list = BANK_BRANDS.filter(
          (b) => ['FUND', 'CMB', 'ALIPAY', 'WECHAT', 'ICBC', 'CCB', 'PINGAN'].includes(b.id)
        );
        break;

      case 'CASH':
        list = BANK_BRANDS.filter(
          (b) => ['CASH', 'ICBC', 'BOC', 'CCB', 'ABC'].includes(b.id)
        );
        break;

      case 'RECEIVABLE':
        list = BANK_BRANDS.filter(
          (b) => ['RECEIVABLE', 'ALIPAY', 'WECHAT', 'CMB', 'ICBC'].includes(b.id)
        );
        break;

      case 'PAYABLE':
        list = BANK_BRANDS.filter(
          (b) => ['PAYABLE', 'HUABEI', 'JD_BAITIAO', 'CMB', 'ICBC', 'CCB'].includes(b.id)
        );
        break;

      default:
        list = BANK_BRANDS;
        break;
    }
  }

  // 🏦 永久调用 https://logohub.afengblog.com/ 官方矢量库数据绑定各品牌 Logo
  return list.map((b) => {
    const logohubMatch =
      matchLogoHubBank(b.name) ||
      matchLogoHubBank(b.shortName) ||
      matchLogoHubBank(b.id) ||
      matchLogoHubBank(b.logoType);
    return {
      ...b,
      bankLogoUrl: b.bankLogoUrl || logohubMatch?.logoUrl,
    };
  });
}

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
 * Match a BankBrandInfo by keyword in a given string
 */
function matchBrandByKeyword(rawText: string, category?: AccountCategory): BankBrandInfo | null {
  if (!rawText || !rawText.trim()) return null;
  const text = rawText.toLowerCase().trim();

  // 1. Digital Wallets & Consumer Credit
  if (text.includes('支付宝') || text.includes('alipay')) {
    return BANK_BRANDS.find((b) => b.id === 'ALIPAY') || null;
  }
  if (text.includes('微信') || text.includes('wechat') || text.includes('财付通') || text.includes('零钱通')) {
    return BANK_BRANDS.find((b) => b.id === 'WECHAT') || null;
  }
  if (text.includes('花呗') || text.includes('huabei') || text.includes('蚂蚁花呗')) {
    return BANK_BRANDS.find((b) => b.id === 'HUABEI') || null;
  }
  if (text.includes('白条') || text.includes('baitiao') || text.includes('京东白条')) {
    return BANK_BRANDS.find((b) => b.id === 'JD_BAITIAO') || null;
  }
  if (text.includes('余额宝') || text.includes('yuebao')) {
    return BANK_BRANDS.find((b) => b.id === 'YUEBAO') || null;
  }
  if (text.includes('小金库') || text.includes('京东金融') || text.includes('jd finance') || text.includes('jd_finance')) {
    return BANK_BRANDS.find((b) => b.id === 'JD_FINANCE') || null;
  }
  if (text.includes('apple pay') || text.includes('applepay') || text.includes('苹果支付') || text.includes('apple wallet')) {
    return BANK_BRANDS.find((b) => b.id === 'APPLEPAY') || null;
  }

  // 2. Internet & FinTech Banks
  if (text.includes('网商') || text.includes('mybank') || text.includes('浙江网商')) {
    return BANK_BRANDS.find((b) => b.id === 'MYBANK') || null;
  }
  if (text.includes('微众') || text.includes('webank') || text.includes('微粒贷') || text.includes('前海微众')) {
    return BANK_BRANDS.find((b) => b.id === 'WEBANK') || null;
  }
  if (text.includes('百信') || text.includes('aibank')) {
    return BANK_BRANDS.find((b) => b.id === 'AIBANK') || null;
  }

  // 3. City Commercial Banks
  if (text.includes('宁波银行') || text.includes('宁银') || text.includes('nbcb') || text.includes('宁波')) {
    return BANK_BRANDS.find((b) => b.id === 'NBCB') || null;
  }
  if (text.includes('北京银行') || text.includes('京行') || text.includes('bob')) {
    return BANK_BRANDS.find((b) => b.id === 'BOB') || null;
  }
  if (text.includes('上海银行') || text.includes('上行') || text.includes('bos')) {
    return BANK_BRANDS.find((b) => b.id === 'BOS') || null;
  }

  // 4. Joint-stock and National Commercial Banks (State-owned and Major Commercial)
  if (text.includes('工商') || text.includes('工行') || text.includes('icbc') || text.includes('牡丹')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'ICBC');
    if (!brand) return null;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '牡丹白金信用卡' } : brand;
  }
  if (text.includes('建设') || text.includes('建行') || text.includes('ccb') || text.includes('龙卡')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'CCB');
    if (!brand) return null;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '龙卡全球支付白金卡' } : brand;
  }
  if (text.includes('农业') || text.includes('农行') || text.includes('abc') || text.includes('金穗')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'ABC');
    if (!brand) return null;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '金穗悠游白金卡' } : brand;
  }
  if (
    text.includes('中行') ||
    text.includes('boc') ||
    text.includes('长城卡') ||
    text.includes('长城借记') ||
    text.includes('长城信用卡') ||
    (text.includes('中国银行') && !text.includes('工商') && !text.includes('建设') && !text.includes('农业') && !text.includes('光大') && !text.includes('民生') && !text.includes('邮政'))
  ) {
    const brand = BANK_BRANDS.find((b) => b.id === 'BOC');
    if (!brand) return null;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '长城卓隽白金卡' } : brand;
  }
  if (text.includes('交通') || text.includes('交行') || text.includes('bocom') || text.includes('白麒麟')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'BOCOM');
    if (!brand) return null;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '白麒麟白金信用卡' } : brand;
  }
  if (text.includes('招商') || text.includes('招行') || text.includes('cmb') || text.includes('金葵花') || text.includes('掌上生活')) {
    const brand = BANK_BRANDS.find((b) => b.id === 'CMB');
    if (!brand) return null;
    return category === 'CREDIT_CARD' ? { ...brand, defaultTier: '经典白金信用卡' } : brand;
  }
  if (text.includes('中信') || text.includes('citic')) {
    return BANK_BRANDS.find((b) => b.id === 'CITIC') || null;
  }
  if (text.includes('平安') || text.includes('pingan') || text.includes('ping an')) {
    return BANK_BRANDS.find((b) => b.id === 'PINGAN') || null;
  }
  if (text.includes('浦发') || text.includes('浦东发展') || text.includes('spdb')) {
    return BANK_BRANDS.find((b) => b.id === 'SPDB') || null;
  }
  if (text.includes('邮政') || text.includes('邮储') || text.includes('psbc')) {
    return BANK_BRANDS.find((b) => b.id === 'PSBC') || null;
  }
  if (text.includes('民生') || text.includes('cmbc')) {
    return BANK_BRANDS.find((b) => b.id === 'CMBC') || null;
  }
  if (text.includes('光大') || text.includes('ceb') || text.includes('阳光卡')) {
    return BANK_BRANDS.find((b) => b.id === 'CEB') || null;
  }
  if (text.includes('兴业') || text.includes('cib') || text.includes('自然人生')) {
    return BANK_BRANDS.find((b) => b.id === 'CIB') || null;
  }
  if (text.includes('广发') || text.includes('cgb') || text.includes('臻尚')) {
    return BANK_BRANDS.find((b) => b.id === 'CGB') || null;
  }
  if (text.includes('华夏') || text.includes('hxb')) {
    return BANK_BRANDS.find((b) => b.id === 'HXB') || null;
  }

  // 5. Special asset categories
  if (text.includes('黄金') || text.includes('金条') || text.includes('积存') || text.includes('足金')) {
    return BANK_BRANDS.find((b) => b.id === 'GOLD') || null;
  }
  if (text.includes('基金') || text.includes('理财') || text.includes('公募') || text.includes('etf')) {
    return BANK_BRANDS.find((b) => b.id === 'FUND') || null;
  }
  if (text.includes('现金') || text.includes('备用金') || text.includes('零钱') || text.includes('纸币')) {
    return BANK_BRANDS.find((b) => b.id === 'CASH') || null;
  }
  if (text.includes('借出') || text.includes('债权') || text.includes('待收')) {
    return BANK_BRANDS.find((b) => b.id === 'RECEIVABLE') || null;
  }
  if (text.includes('借入') || text.includes('债务') || text.includes('待还') || text.includes('欠款')) {
    return BANK_BRANDS.find((b) => b.id === 'PAYABLE') || null;
  }

  return null;
}

/**
 * Helper to auto-match brand logo and card skin by account name or bankName.
 * BankName has absolute priority over generic accountName.
 */
export function detectBrandInfo(accountName: string = '', bankName?: string, category?: AccountCategory): BankBrandInfo {
  // 1. Explicitly designated bankName has FIRST PRIORITY
  if (bankName && bankName.trim()) {
    const matchedFromBank = matchBrandByKeyword(bankName, category);
    if (matchedFromBank) return matchedFromBank;
  }

  // 2. Check accountName if bankName was not provided or inconclusive
  if (accountName && accountName.trim()) {
    const matchedFromName = matchBrandByKeyword(accountName, category);
    if (matchedFromName) return matchedFromName;
  }

  // 3. Category-based fallback
  if (category) {
    if (category === 'JD_BAITIAO') return BANK_BRANDS.find((b) => b.id === 'JD_BAITIAO')!;
    if (category === 'HUABEI') return BANK_BRANDS.find((b) => b.id === 'HUABEI')!;
    if (category === 'JD_FINANCE') return BANK_BRANDS.find((b) => b.id === 'JD_FINANCE')!;
    if (category === 'YUEBAO') return BANK_BRANDS.find((b) => b.id === 'YUEBAO')!;
    if (category === 'WECHAT') return BANK_BRANDS.find((b) => b.id === 'WECHAT')!;
    if (category === 'ALIPAY') return BANK_BRANDS.find((b) => b.id === 'ALIPAY')!;
    if (category === 'GOLD') return BANK_BRANDS.find((b) => b.id === 'GOLD')!;
    if (category === 'FUND') return BANK_BRANDS.find((b) => b.id === 'FUND')!;
    if (category === 'CASH') return BANK_BRANDS.find((b) => b.id === 'CASH')!;
    if (category === 'RECEIVABLE') return BANK_BRANDS.find((b) => b.id === 'RECEIVABLE')!;
    if (category === 'PAYABLE') return BANK_BRANDS.find((b) => b.id === 'PAYABLE')!;
    const matched = BANK_BRANDS.find((b) => b.category === category);
    if (matched) return matched;
  }

  return BANK_BRANDS[0];
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

/**
 * CardArt.cc official bank issuer mapping and direct make maker URLs
 */
export interface CardartIssuerMeta {
  slug: string;
  name: string;
  shortName: string;
  english: string;
  hasMakerAsset: boolean;
  makeUrl: string;
}

export const CARDART_ISSUER_MAP: Record<string, CardartIssuerMeta> = {
  CMB: {
    slug: 'cmb',
    name: '招商银行',
    shortName: '招行',
    english: 'China Merchants Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  ICBC: {
    slug: 'icbc',
    name: '中国工商银行',
    shortName: '工行',
    english: 'Industrial & Commercial Bank of China',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  CCB: {
    slug: 'ccb',
    name: '中国建设银行',
    shortName: '建行',
    english: 'China Construction Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  ABC: {
    slug: 'abc',
    name: '中国农业银行',
    shortName: '农行',
    english: 'Agricultural Bank of China',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  BOC: {
    slug: 'boc',
    name: '中国银行',
    shortName: '中行',
    english: 'Bank of China',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  BOCOM: {
    slug: 'bocom',
    name: '交通银行',
    shortName: '交行',
    english: 'Bank of Communications',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  CITIC: {
    slug: 'citic-bank',
    name: '中信银行',
    shortName: '中信',
    english: 'China CITIC Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  SPDB: {
    slug: 'spdb',
    name: '上海浦东发展银行',
    shortName: '浦发',
    english: 'Shanghai Pudong Development Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  PSBC: {
    slug: 'psbc',
    name: '中国邮政储蓄银行',
    shortName: '邮储',
    english: 'Postal Savings Bank of China',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  CEB: {
    slug: 'ceb',
    name: '中国光大银行',
    shortName: '光大',
    english: 'China Everbright Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  CMBC: {
    slug: 'cmbc',
    name: '中国民生银行',
    shortName: '民生',
    english: 'China Minsheng Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  CIB: {
    slug: 'cib',
    name: '兴业银行',
    shortName: '兴业',
    english: 'Industrial Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  CGB: {
    slug: 'cgb',
    name: '广发银行',
    shortName: '广发',
    english: 'China Guangfa Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  PINGAN: {
    slug: 'pingan',
    name: '平安银行',
    shortName: '平安',
    english: 'Ping An Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  HXB: {
    slug: 'hxb',
    name: '华夏银行',
    shortName: '华夏',
    english: 'Hua Xia Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  BOB: {
    slug: 'bob',
    name: '北京银行',
    shortName: '北京银行',
    english: 'Bank of Beijing',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
  BOS: {
    slug: 'bos',
    name: '上海银行',
    shortName: '上海银行',
    english: 'Bank of Shanghai',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  },
};

/**
 * Identify CardArt maker metadata by brand / bank name
 */
export function identifyCardartBankAsset(bankName: string = '', brandId: string = ''): CardartIssuerMeta {
  if (brandId && CARDART_ISSUER_MAP[brandId]) {
    return CARDART_ISSUER_MAP[brandId];
  }
  const matched = Object.values(CARDART_ISSUER_MAP).find(
    (m) =>
      (bankName && (m.name.includes(bankName) || bankName.includes(m.name) || bankName.includes(m.shortName))) ||
      (m.slug && bankName.toLowerCase().includes(m.slug))
  );
  if (matched) return matched;

  return {
    slug: 'generic',
    name: bankName || '商业银行',
    shortName: bankName || '银行',
    english: 'Commercial Bank',
    hasMakerAsset: true,
    makeUrl: 'https://cardart.cc/make?lang=zh',
  };
}

/**
 * Intelligently deduplicate bank brand name to guarantee ONLY ONE bank brand name is shown!
 */
export function getCleanSingleBrandCardTitle(
  rawName: string = '',
  bankName: string = '',
  shortName: string = '',
  hasCardImage: boolean = false
): {
  primaryBankTitle: string;
  distinctiveProductTitle: string;
  shouldHideProductTitle: boolean;
} {
  const cleanBank = (bankName || '').trim();
  const cleanName = (rawName || '').trim();
  const cleanShort = (shortName || '').trim();

  if (!cleanName && !cleanBank) {
    return { primaryBankTitle: '银行账户', distinctiveProductTitle: '', shouldHideProductTitle: true };
  }

  // If card has custom image: the image itself is hero, so distinctive title is cleanName without duplicate suffixes
  if (hasCardImage) {
    let clean = cleanName || cleanBank;
    // Remove duplicate trailing "· 银行名" if user typed it or if it was appended
    if (cleanBank && clean.endsWith(`· ${cleanBank}`)) {
      clean = clean.slice(0, -(`· ${cleanBank}`).length).trim();
    }
    return {
      primaryBankTitle: cleanBank || clean,
      distinctiveProductTitle: clean,
      shouldHideProductTitle: false,
    };
  }

  // If card has NO custom image (top row already displays primaryBankTitle prominently):
  const primaryBank = cleanBank || cleanName;

  // If the card name is identical to the bank name, we don't need a secondary pill at all!
  if (
    !cleanName ||
    cleanName.toLowerCase() === primaryBank.toLowerCase() ||
    (cleanShort && cleanName.toLowerCase() === cleanShort.toLowerCase())
  ) {
    return {
      primaryBankTitle: primaryBank,
      distinctiveProductTitle: '',
      shouldHideProductTitle: true,
    };
  }

  // Strip leading bank name / shortName prefix so the bank name is NOT duplicated
  let product = cleanName;
  if (cleanBank && product.startsWith(cleanBank)) {
    product = product.slice(cleanBank.length).replace(/^[\s·\-_—]+/, '').trim();
  } else if (cleanShort && product.startsWith(cleanShort)) {
    product = product.slice(cleanShort.length).replace(/^[\s·\-_—]+/, '').trim();
  }

  // If after stripping nothing is left, hide secondary
  if (!product) {
    return {
      primaryBankTitle: primaryBank,
      distinctiveProductTitle: '',
      shouldHideProductTitle: true,
    };
  }

  return {
    primaryBankTitle: primaryBank,
    distinctiveProductTitle: product,
    shouldHideProductTitle: false,
  };
}

/**
 * 📌 央行统一规定：储蓄卡个人结算账户功能权限级别
 */
export interface BankAccountClassDefinition {
  id: BankAccountClass;
  label: string;
  name: string;
  shortLabel: string;
  tag: string;
  badgeClass: string;
  features: string;
  limitations: string;
  iconText: string;
}

export const BANK_ACCOUNT_CLASSES: BankAccountClassDefinition[] = [
  {
    id: 'CLASS_1',
    label: 'Ⅰ类户 (全功能实体卡)',
    name: 'Ⅰ类户',
    shortLabel: 'Ⅰ类户',
    tag: '全功能无限制',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    features: '存取款、转账、理财、消费无金额限制',
    limitations: '同一个人在同一家银行只能开立 1 个',
    iconText: '✅',
  },
  {
    id: 'CLASS_2',
    label: 'Ⅱ类户 (虚拟/实体限额卡)',
    name: 'Ⅱ类户',
    shortLabel: 'Ⅱ类户',
    tag: '理财投资限额',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    features: '支持理财、投资、限额消费和缴费',
    limitations: '日支付限额 1 万元，年累计限额 20 万元',
    iconText: '⚠️',
  },
  {
    id: 'CLASS_3',
    label: 'Ⅲ类户 (微型零钱包)',
    name: 'Ⅲ类户',
    shortLabel: 'Ⅲ类户',
    tag: '微型快捷支付',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    features: '仅用于小额、快捷支付',
    limitations: '账户余额上限通常不超过 2000 元',
    iconText: '💡',
  },
];

/**
 * COMMON CARD TIERS AND PRESETS
 */
export interface CardTierDefinition {
  id: string;
  label: string;
  value: string;
  badgeClass: string;
  subText?: string;
  ladderOrder?: number;
}

/**
 * 💳 储蓄卡客户资产与卡片权益级别
 */
export const DEBIT_CARD_TIERS: CardTierDefinition[] = [
  { id: 'STANDARD', label: '普卡 (Classic)', value: '普卡', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', subText: '基础储蓄与结算', ladderOrder: 1 },
  { id: 'GOLD', label: '金卡 (Gold / 理财金)', value: '金卡', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', subText: '专属理财/免排队礼遇', ladderOrder: 2 },
  { id: 'PLATINUM', label: '白金卡 (Platinum)', value: '白金卡', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', subText: '贵宾室/费率全免特权', ladderOrder: 3 },
  { id: 'DIAMOND', label: '钻石卡 (Diamond)', value: '钻石卡', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', subText: '高净值客群尊享通道', ladderOrder: 4 },
  { id: 'PRIVATE_BANKING', label: '私行卡 (Private Banking)', value: '私行卡', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', subText: '私人银行/财富传承级', ladderOrder: 5 },
];

/**
 * 💳 各大国际卡组织阶梯级别划分 (从基础到高端阶梯式上升)
 */
export const CARD_NETWORK_TIERS: Record<string, CardTierDefinition[]> = {
  // ✅ Visa（维萨）: 普卡 (Classic) ➡️ 金卡 (Gold) ➡️ 白金卡 (Platinum) ➡️ 御玺卡 (Signature) ➡️ 无限卡 (Infinite)
  VISA: [
    { id: 'VISA_CLASSIC', label: '普卡 (Classic)', value: '普卡', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', subText: '全球通用基础卡', ladderOrder: 1 },
    { id: 'VISA_GOLD', label: '金卡 (Gold)', value: '金卡', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', subText: '全球紧急救援与优选折扣', ladderOrder: 2 },
    { id: 'VISA_PLATINUM', label: '白金卡 (Platinum)', value: '白金卡', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', subText: '高端商旅与精选礼遇', ladderOrder: 3 },
    { id: 'VISA_SIGNATURE', label: '御玺卡 (Signature)', value: '御玺卡', badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300', subText: '全球礼宾顾问与星级酒店', ladderOrder: 4 },
    { id: 'VISA_INFINITE', label: '无限卡 (Infinite)', value: '无限卡', badgeClass: 'bg-zinc-900 text-amber-300 border-zinc-700', subText: 'Visa 最高级别/无限专属礼遇', ladderOrder: 5 },
  ],

  // ✅ Mastercard（万事达卡）: 普卡 (Standard) ➡️ 金卡 (Gold) ➡️ 白金卡 (Platinum) ➡️ 钛金卡 (Titanium) ➡️ 世界卡 (World) ➡️ 世界之极卡 (World Elite)
  MASTERCARD: [
    { id: 'MC_STANDARD', label: '普卡 (Standard)', value: '普卡', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', subText: '万事达标准卡', ladderOrder: 1 },
    { id: 'MC_GOLD', label: '金卡 (Gold)', value: '金卡', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', subText: '无价体验优待', ladderOrder: 2 },
    { id: 'MC_PLATINUM', label: '白金卡 (Platinum)', value: '白金卡', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', subText: '精选商旅特权', ladderOrder: 3 },
    { id: 'MC_TITANIUM', label: '钛金卡 (Titanium)', value: '钛金卡', badgeClass: 'bg-slate-200 text-slate-800 border-slate-400', subText: '新锐品质精致礼遇', ladderOrder: 4 },
    { id: 'MC_WORLD', label: '世界卡 (World)', value: '世界卡', badgeClass: 'bg-sky-50 text-sky-800 border-sky-300', subText: '环球商旅及度假权益', ladderOrder: 5 },
    { id: 'MC_WORLD_ELITE', label: '世界之极卡 (World Elite)', value: '世界之极卡', badgeClass: 'bg-zinc-950 text-rose-300 border-zinc-800', subText: '万事达旗舰顶级黑卡', ladderOrder: 6 },
  ],

  // ✅ 中国银联 (UnionPay): 普卡 ➡️ 金卡 ➡️ 白金卡 ➡️ 钻石卡
  UNIONPAY: [
    { id: 'UP_STANDARD', label: '普卡 (Standard)', value: '普卡', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', subText: '全国及跨国清算通用', ladderOrder: 1 },
    { id: 'UP_GOLD', label: '金卡 (Gold)', value: '金卡', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', subText: '专属积分加倍/日常特惠', ladderOrder: 2 },
    { id: 'UP_PLATINUM', label: '白金卡 (Platinum)', value: '白金卡', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', subText: '1元机场高铁停车/贵宾CIP', ladderOrder: 3 },
    { id: 'UP_DIAMOND', label: '钻石卡 (Diamond)', value: '钻石卡', badgeClass: 'bg-blue-900 text-cyan-200 border-blue-700', subText: '银联最高级/机场礼宾/齿科健康', ladderOrder: 4 },
  ],

  // ✅ 美国运通 (American Express): 绿卡/金卡/百夫长白金卡 ➡️ 百夫长黑金卡（最高端）
  AMEX: [
    { id: 'AMEX_GREEN', label: '绿卡 (Green)', value: '绿卡', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300', subText: '经典百夫长入门名片', ladderOrder: 1 },
    { id: 'AMEX_GOLD', label: '金卡 (Gold)', value: '金卡', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', subText: '美运餐饮娱乐双倍积分', ladderOrder: 2 },
    { id: 'AMEX_PLATINUM', label: '百夫长白金卡 (Platinum)', value: '百夫长白金卡', badgeClass: 'bg-slate-200 text-slate-900 border-slate-400', subText: '全球百夫长贵宾室及顶级酒店', ladderOrder: 3 },
    { id: 'AMEX_CENTURION', label: '百夫长黑金卡 (Centurion)', value: '百夫长黑金卡', badgeClass: 'bg-black text-amber-300 border-zinc-700', subText: '顶级邀请制/全球无尽可能', ladderOrder: 4 },
  ],

  // ✅ JCB (吉士美): 普卡 ➡️ 金卡 ➡️ 白金卡 ➡️ 至臻/御玺卡
  JCB: [
    { id: 'JCB_STANDARD', label: '普卡 (Standard)', value: '普卡', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', subText: 'JCB标准卡', ladderOrder: 1 },
    { id: 'JCB_GOLD', label: '金卡 (Gold)', value: '金卡', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', subText: '日本及亚太消费优待', ladderOrder: 2 },
    { id: 'JCB_PLATINUM', label: '白金卡 (Platinum)', value: '白金卡', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', subText: '金色贵宾室/机场接送', ladderOrder: 3 },
    { id: 'JCB_ULTIMATE', label: '至臻卡 (Ultimate)', value: '至臻卡', badgeClass: 'bg-zinc-900 text-sky-300 border-zinc-700', subText: 'JCB最高旗舰等级', ladderOrder: 4 },
  ],
};

/**
 * 统一快捷卡片等级列表 (兼顾通用展示与向后兼容)
 */
export const COMMON_CARD_TIERS: CardTierDefinition[] = [
  { id: 'STANDARD', label: '普卡 (Classic)', value: '普卡', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'GOLD', label: '金卡 (Gold)', value: '金卡', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'PLATINUM', label: '白金卡 (Platinum)', value: '白金卡', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'DIAMOND', label: '钻石卡 (Diamond)', value: '钻石卡', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'WORLD', label: '御玺 / 世界卡', value: '御玺卡', badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
  { id: 'BLACK', label: '百夫长黑金 / 无限卡', value: '百夫长黑金卡', badgeClass: 'bg-zinc-900 text-amber-300 border-zinc-700' },
  { id: 'PRIVATE_BANKING', label: '私行卡 / 财富卡', value: '私行卡', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
];

/**
 * 根据账户大类与卡组织获取精准的级别阶梯列表
 */
export function getTiersForContext(
  category: AccountCategory,
  cardNetwork?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE'
): CardTierDefinition[] {
  if (category === 'DEBIT_CARD') {
    return DEBIT_CARD_TIERS;
  }
  if (category === 'CREDIT_CARD') {
    const net = cardNetwork || 'UNIONPAY';
    if (CARD_NETWORK_TIERS[net]) {
      return CARD_NETWORK_TIERS[net];
    }
    return CARD_NETWORK_TIERS.UNIONPAY;
  }
  return COMMON_CARD_TIERS;
}

export interface CardTierTheme {
  cardSkin: string;
  cardBgColor: string;
  cardPattern: string;
  cardTextColor: 'light' | 'dark';
  cardNetwork: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE';
  description: string;
}

/**
 * Intelligently derive card visual theme based on the card tier level & card network
 */
export function getTierTheme(
  tier: string = '',
  brand?: BankBrandInfo,
  preferredNetwork?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE'
): CardTierTheme {
  const t = (tier || '').toLowerCase();

  // 1. 百夫长黑金卡 / 世界之极卡 / 无限卡 (顶级殿堂黑金)
  if (
    t.includes('百夫长黑金') ||
    t.includes('黑金') ||
    t.includes('世界之极') ||
    t.includes('world elite') ||
    t.includes('无限卡') ||
    t.includes('infinite') ||
    t.includes('centurion black')
  ) {
    let network: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' =
      preferredNetwork && preferredNetwork !== 'NONE'
        ? preferredNetwork
        : t.includes('世界之极') || t.includes('world elite')
        ? 'MASTERCARD'
        : t.includes('无限') || t.includes('infinite')
        ? 'VISA'
        : 'AMEX';

    return {
      cardSkin: 'platinum-dark',
      cardBgColor: 'linear-gradient(135deg, #18181b 0%, #09090b 55%, #000000 100%)',
      cardPattern: 'mesh',
      cardTextColor: 'light',
      cardNetwork: network,
      description: '殿堂黑金 / 百夫长暗纹曜黑高定',
    };
  }

  // 2. 运通绿卡 (传奇经典百夫长罗马绿)
  if (t === '绿卡' || t.includes('运通绿') || t.includes('green')) {
    return {
      cardSkin: 'abc-green',
      cardBgColor: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)',
      cardPattern: 'geometric',
      cardTextColor: 'light',
      cardNetwork: preferredNetwork && preferredNetwork !== 'NONE' ? preferredNetwork : 'AMEX',
      description: '百夫长绿卡 / 传奇经典罗马绿',
    };
  }

  // 3. 钛金卡 (Titanium)
  if (t.includes('钛金') || t.includes('titanium')) {
    return {
      cardSkin: 'platinum-dark',
      cardBgColor: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #1e293b 100%)',
      cardPattern: 'silk-stripes',
      cardTextColor: 'light',
      cardNetwork: preferredNetwork || 'MASTERCARD',
      description: '航天钛金 / 拉丝精工哑光',
    };
  }

  // 4. 御玺卡 (Signature) / 世界卡 (World)
  if (t.includes('御玺') || t.includes('signature') || t.includes('世界卡') || t.includes('world')) {
    let network: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = 'VISA';
    if (t.includes('世界') || t.includes('world')) network = 'MASTERCARD';
    else if (preferredNetwork && preferredNetwork !== 'NONE') network = preferredNetwork;

    return {
      cardSkin: 'midnight-navy',
      cardBgColor: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0f172a 100%)',
      cardPattern: 'radial-sheen',
      cardTextColor: 'light',
      cardNetwork: network,
      description: '御玺·世界 / 寰宇曜蓝奢享微光',
    };
  }

  // 5. 钻石卡 (Diamond) / 私行卡 (Private Banking / 财富卡)
  if (
    t.includes('钻石') ||
    t.includes('diamond') ||
    t.includes('私行') ||
    t.includes('私人银行') ||
    t.includes('private banking') ||
    t.includes('财富卡') ||
    t.includes('沃德财富')
  ) {
    return {
      cardSkin: 'midnight-navy',
      cardBgColor: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 45%, #09090b 100%)',
      cardPattern: 'geometric',
      cardTextColor: 'light',
      cardNetwork: preferredNetwork || 'UNIONPAY',
      description: '皇家钻石·私行 / 晶辉深曜紫金',
    };
  }

  // 6. 白金卡 (Platinum) / 百夫长白金卡
  if (t.includes('白金') || t.includes('platinum')) {
    return {
      cardSkin: 'platinum-dark',
      cardBgColor: 'linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)',
      cardPattern: 'radial-sheen',
      cardTextColor: 'light',
      cardNetwork: preferredNetwork || brand?.cardNetwork || 'UNIONPAY',
      description: '曜石钛银 / 白金高定高光',
    };
  }

  // 7. 金卡 (Gold) / 金葵花 / 理财金
  if (t.includes('金卡') || t.includes('gold') || t.includes('金葵花') || t.includes('理财金')) {
    return {
      cardSkin: 'gold-metallic',
      cardBgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 45%, #78350f 100%)',
      cardPattern: 'waves',
      cardTextColor: 'dark',
      cardNetwork: preferredNetwork || brand?.cardNetwork || 'UNIONPAY',
      description: '24K璀璨纯金 / 流金波浪',
    };
  }

  // 8. 普卡 (Classic / Standard) / 默认
  return {
    cardSkin: brand?.cardSkin || 'classic-cmb',
    cardBgColor: '',
    cardPattern: 'radial-sheen',
    cardTextColor: 'light',
    cardNetwork: preferredNetwork || brand?.cardNetwork || 'UNIONPAY',
    description: '官方标准品牌卡面',
  };
}
