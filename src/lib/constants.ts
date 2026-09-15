import { AccountCategory, ExpenseCategory, IncomeCategory, FinancialAccount, Transaction, AssetGroup, LedgerProject } from '../types';

export const ACCOUNT_CATEGORY_CONFIG: Record<
  AccountCategory,
  {
    label: string;
    description: string;
    group: AssetGroup;
    groupLabel: string;
    defaultColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  DEBIT_CARD: {
    label: '银行借记卡',
    description: '各大银行储蓄卡、活期存款',
    group: 'DEBIT_CARD',
    groupLabel: '借记卡',
    defaultColor: '#2563eb', // blue
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400 border-blue-500/20',
  },
  CREDIT_CARD: {
    label: '借贷信用卡',
    description: '银行信用卡（总额度/已用/可用）',
    group: 'CREDIT_CARD',
    groupLabel: '信用卡',
    defaultColor: '#f43f5e', // rose
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400 border-rose-500/20',
  },
  ALIPAY: {
    label: '支付宝余额',
    description: '支付宝账户可用零钱',
    group: 'DIGITAL_WALLET',
    groupLabel: '数字钱包',
    defaultColor: '#1677ff', // official alipay blue
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-500 border-blue-500/20',
  },
  WECHAT: {
    label: '微信支付',
    description: '微信零钱、零钱通、微信数字钱包',
    group: 'DIGITAL_WALLET',
    groupLabel: '数字钱包',
    defaultColor: '#07c160', // official wechat green
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-500 border-emerald-500/20',
  },
  YUEBAO: {
    label: '余额宝',
    description: '支付宝零钱理财/货币基金',
    group: 'FUND',
    groupLabel: '理财基金',
    defaultColor: '#f97316', // orange
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-400 border-orange-500/20',
  },
  FUND: {
    label: '基金理财',
    description: '公募基金、股票ETF、理财产品',
    group: 'FUND',
    groupLabel: '理财基金',
    defaultColor: '#8b5cf6', // purple
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400 border-purple-500/20',
  },
  GOLD: {
    label: '黄金理财',
    description: '积存金、实物黄金、纸黄金',
    group: 'FUND',
    groupLabel: '理财基金',
    defaultColor: '#eab308', // gold
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400 border-amber-500/20',
  },
  JD_FINANCE: {
    label: '京东金融',
    description: '京东小金库、京东理财',
    group: 'FUND',
    groupLabel: '理财基金',
    defaultColor: '#ef4444', // red
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-400 border-red-500/20',
  },
  JD_BAITIAO: {
    label: '京东白条',
    description: '京东先用后付信贷额度',
    group: 'CREDIT_CARD',
    groupLabel: '信用卡',
    defaultColor: '#ec4899', // pink
    badgeBg: 'bg-pink-500/10',
    badgeText: 'text-pink-400 border-pink-500/20',
  },
  HUABEI: {
    label: '蚂蚁花呗',
    description: '支付宝蚂蚁花呗消费信用额度 (先享后付)',
    group: 'CREDIT_CARD',
    groupLabel: '信用卡',
    defaultColor: '#0083ff', // huabei vibrant blue
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-400 border-sky-500/20',
  },
  CASH: {
    label: '现金备用金',
    description: '纸币现金、钱包备用金',
    group: 'CASH',
    groupLabel: '现金',
    defaultColor: '#10b981', // emerald
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400 border-emerald-500/20',
  },
  RECEIVABLE: {
    label: '借出款项 (待收回)',
    description: '借给他人暂未收回的债权',
    group: 'LEND_BORROW',
    groupLabel: '借贷',
    defaultColor: '#06b6d4', // cyan
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400 border-cyan-500/20',
  },
  PAYABLE: {
    label: '借入款项 (待偿还)',
    description: '向他人借入暂未归还的借款',
    group: 'LEND_BORROW',
    groupLabel: '借贷',
    defaultColor: '#a855f7', // violet
    badgeBg: 'bg-violet-500/10',
    badgeText: 'text-violet-400 border-violet-500/20',
  },
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', name: '餐饮美食', icon: 'UtensilsCrossed', color: '#f97316' },
  { id: 'shopping', name: '日用百货', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'transport', name: '交通出行', icon: 'Car', color: '#3b82f6' },
  { id: 'housing', name: '房租物业', icon: 'Home', color: '#8b5cf6' },
  { id: 'digital', name: '数码科技', icon: 'Laptop', color: '#06b6d4' },
  { id: 'clothing', name: '服饰装扮', icon: 'Shirt', color: '#f43f5e' },
  { id: 'medical', name: '医疗健康', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'entertainment', name: '休闲娱乐', icon: 'Gamepad2', color: '#10b981' },
  { id: 'pets', name: '宠物萌宠', icon: 'PawPrint', color: '#eab308' },
  { id: 'education', name: '学习培训', icon: 'GraduationCap', color: '#6366f1' },
  { id: 'social', name: '人情往来', icon: 'Gift', color: '#d97706' },
  { id: 'bills', name: '充值水电气', icon: 'Zap', color: '#0284c7' },
  { id: 'repay_fee', name: '分期与手续费', icon: 'Percent', color: '#e11d48' },
  { id: 'other_exp', name: '其他杂项', icon: 'MoreHorizontal', color: '#64748b' },
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  { id: 'salary', name: '工资薪酬', icon: 'Briefcase', color: '#10b981' },
  { id: 'bonus', name: '奖金提成', icon: 'Award', color: '#eab308' },
  { id: 'investment_yield', name: '理财分红收益', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: 'sideline', name: '副业外快', icon: 'Sparkles', color: '#06b6d4' },
  { id: 'refund', name: '退款退税', icon: 'RotateCcw', color: '#3b82f6' },
  { id: 'reimburse', name: '报销补贴', icon: 'Receipt', color: '#14b8a6' },
  { id: 'redpacket', name: '红包礼金', icon: 'Gift', color: '#f43f5e' },
  { id: 'other_inc', name: '其他收入', icon: 'PlusCircle', color: '#64748b' },
];

export const STORAGE_KEY_USER_EXPENSE_CATS = 'asset_vault_custom_user_categories_expense_v4';
export const STORAGE_KEY_USER_INCOME_CATS = 'asset_vault_custom_user_categories_income_v4';

export function getStoredExpenseCategories(): ExpenseCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_EXPENSE_CATS) || localStorage.getItem('asset_vault_custom_user_categories_expense_v3');
    if (!raw) return [...EXPENSE_CATEGORIES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'string') {
        return parsed.map((name: string, i: number) => ({
          id: `custom-exp-${i}-${name}`,
          name: name === '数码数码' ? '数码科技' : name,
          icon: name === '数码数码' ? 'Laptop' : name,
          color: '#f43f5e',
        }));
      }
      return parsed.map((cat: ExpenseCategory) => {
        if (cat.name === '数码数码') {
          return { ...cat, name: '数码科技', icon: 'Laptop' };
        }
        return cat;
      });
    }
    return [...EXPENSE_CATEGORIES];
  } catch {
    return [...EXPENSE_CATEGORIES];
  }
}

export function saveStoredExpenseCategories(categories: ExpenseCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_EXPENSE_CATS, JSON.stringify(categories));
  } catch (e) {
    console.warn('Failed to save expense categories:', e);
  }
}

export function getStoredIncomeCategories(): IncomeCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_INCOME_CATS) || localStorage.getItem('asset_vault_custom_user_categories_income_v3');
    if (!raw) return [...INCOME_CATEGORIES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'string') {
        return parsed.map((name: string, i: number) => ({
          id: `custom-inc-${i}-${name}`,
          name,
          icon: name,
          color: '#10b981',
        }));
      }
      return parsed;
    }
    return [...INCOME_CATEGORIES];
  } catch {
    return [...INCOME_CATEGORIES];
  }
}

export function saveStoredIncomeCategories(categories: IncomeCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_INCOME_CATS, JSON.stringify(categories));
  } catch (e) {
    console.warn('Failed to save income categories:', e);
  }
}

export const INITIAL_DEMO_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'acc-debit-cmb',
    name: '招商银行一卡通 (借记卡)',
    category: 'DEBIT_CARD',
    bankName: '招商银行',
    cardNumberLast4: '8826',
    holderName: '张伟',
    cardTier: '金葵花卡',
    cardSkin: 'classic-cmb',
    cardNetwork: 'UNIONPAY',
    balance: 28450.00,
    color: '#e11d48',
    notes: '主发工资卡与日常支出绑定卡',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-debit-icbc',
    name: '工商银行储蓄卡 (借记卡)',
    category: 'DEBIT_CARD',
    bankName: '中国工商银行',
    cardNumberLast4: '5190',
    holderName: '张伟',
    cardTier: '理财金账户',
    cardSkin: 'icbc-red',
    cardNetwork: 'UNIONPAY',
    balance: 15300.00,
    color: '#dc2626',
    notes: '房贷月供扣款与备用卡',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-credit-cmb',
    name: '招商银行经典白金卡 (信用卡)',
    category: 'CREDIT_CARD',
    bankName: '招商银行',
    cardNumberLast4: '3372',
    holderName: 'ZHANG WEI',
    cardTier: '经典白金卡',
    cardSkin: 'platinum-dark',
    cardNetwork: 'UNIONPAY',
    balance: 8540.00, // 当前已欠款 (usedCredit)
    creditLimit: 60000.00, // 信用总额度
    usedCredit: 8540.00, // 已用
    billDay: 5, // 5号出账单
    dueDay: 25, // 25号还款日
    color: '#9f1239',
    notes: '日常餐饮刷卡、享积分与机场贵宾权益',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-credit-citic',
    name: '中信银行悦卡信用卡 (信用卡)',
    category: 'CREDIT_CARD',
    bankName: '中信银行',
    cardNumberLast4: '6208',
    holderName: 'ZHANG WEI',
    cardTier: 'i白金信用卡',
    cardSkin: 'classic-cmb',
    cardNetwork: 'UNIONPAY',
    balance: 3200.00,
    creditLimit: 35000.00,
    usedCredit: 3200.00,
    billDay: 10,
    dueDay: 28,
    color: '#b91c1c',
    notes: '商旅酒店与加油优惠信用卡',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-alipay',
    name: '支付宝余额',
    category: 'ALIPAY',
    bankName: '支付宝',
    holderName: '张伟 (已认证)',
    cardTier: '个人认证账户',
    cardSkin: 'alipay-blue',
    cardNetwork: 'NONE',
    balance: 3680.50,
    color: '#1677ff',
    notes: '线上扫码与小额快捷支付零钱',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-yuebaobao',
    name: '余额宝 (天弘货币基金)',
    category: 'YUEBAO',
    bankName: '余额宝',
    holderName: '张伟',
    cardTier: '货币基金理财',
    cardSkin: 'gold-metallic',
    cardNetwork: 'NONE',
    balance: 35200.00,
    holdingProfit: 1420.50,
    color: '#f97316',
    notes: '活期闲钱自动生息，近七日年化约 1.88%',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-fund-main',
    name: '公募基金理财组合 (ETF与混合)',
    category: 'FUND',
    bankName: '公募基金',
    holderName: '张伟',
    cardTier: '组合持仓',
    cardSkin: 'purple-aurora',
    cardNetwork: 'NONE',
    balance: 52600.00,
    holdingProfit: 4580.00,
    color: '#7c3aed',
    notes: '易方达沪深300ETF + 招商中证白酒 + 固收增强基金',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-gold',
    name: '黄金理财 (工行积存金/实物金)',
    category: 'GOLD',
    bankName: '中国工商银行',
    holderName: '张伟',
    cardTier: '9999足金积存',
    cardSkin: 'gold-metallic',
    cardNetwork: 'NONE',
    balance: 31200.00, // 52g * 600元
    goldGrams: 52.0,
    goldUnitPrice: 600.0,
    holdingProfit: 3900.00,
    color: '#d97706',
    notes: '定投积存黄金 52克，对冲抗通胀配置',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-jd-finance',
    name: '京东金融 (小金库活期理财)',
    category: 'JD_FINANCE',
    bankName: '京东金融',
    holderName: '张伟',
    cardTier: '小金库尊享',
    cardSkin: 'jd-red',
    cardNetwork: 'NONE',
    balance: 19800.00,
    holdingProfit: 620.00,
    color: '#ef4444',
    notes: '京东平台零钱理财，享京东购物优惠与收益',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-jd-baitiao',
    name: '京东白条 (先享后付)',
    category: 'JD_BAITIAO',
    bankName: '京东白条',
    cardNumberLast4: '9901',
    holderName: 'ZHANG WEI',
    cardTier: '先享白条额度',
    cardSkin: 'baitiao-pink',
    cardNetwork: 'NONE',
    balance: 1850.00, // 当前待还账单
    creditLimit: 20000.00, // 白条总额度
    usedCredit: 1850.00,
    dueDay: 9, // 每月9日还款
    color: '#db2777',
    notes: '京东自营购物免息分期与白条额度',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-cash',
    name: '钱包现金与备用金',
    category: 'CASH',
    bankName: '随身现金',
    holderName: '现金储蓄',
    cardTier: '应急备用金',
    cardSkin: 'emerald-cash',
    cardNetwork: 'NONE',
    balance: 1500.00,
    color: '#059669',
    notes: '家中抽屉备用现金与随身钱包硬币',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-lend-out-1',
    name: '借出款 (同事张伟装修周转)',
    category: 'RECEIVABLE',
    balance: 10000.00,
    counterparty: '张伟',
    dueDate: '2026-10-15',
    isSettled: false,
    color: '#0891b2',
    notes: '借出装修暂借款，预计10月中旬随年终奖一次性归还',
    updatedAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'acc-borrow-in-1',
    name: '借入款 (表哥急用垫付暂存)',
    category: 'PAYABLE',
    balance: 4000.00,
    counterparty: '李表哥',
    dueDate: '2026-11-20',
    isSettled: false,
    color: '#9333ea',
    notes: '聚会垫付借入，约好11月底前微信转账结清',
    updatedAt: '2026-08-16T10:00:00Z',
  },
];

export const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'INCOME',
    amount: 18500.00,
    date: '2026-08-10',
    time: '09:30',
    accountId: 'acc-debit-cmb',
    category: '工资薪酬',
    tag: '月度固定',
    description: '8月份税后工资与岗位绩效发放',
    merchant: '科技集团薪酬代发',
    createdAt: '2026-08-10T09:30:00Z',
  },
  {
    id: 'tx-2',
    type: 'EXPENSE',
    amount: 268.00,
    date: '2026-08-15',
    time: '18:45',
    accountId: 'acc-credit-cmb',
    category: '餐饮美食',
    tag: '周末聚餐',
    description: '周末家庭日式烤肉聚餐',
    merchant: '赤坂炙烤料理',
    createdAt: '2026-08-15T18:45:00Z',
  },
  {
    id: 'tx-3',
    type: 'EXPENSE',
    amount: 589.00,
    date: '2026-08-14',
    time: '20:10',
    accountId: 'acc-jd-baitiao',
    category: '日用百货',
    tag: '家居消耗',
    description: '京东自营购买空气炸锅配件与厨房耗材',
    merchant: '京东自营旗舰店',
    createdAt: '2026-08-14T20:10:00Z',
  },
  {
    id: 'tx-4',
    type: 'REPAYMENT',
    amount: 4500.00,
    date: '2026-08-12',
    time: '14:20',
    accountId: 'acc-debit-cmb',
    targetAccountId: 'acc-credit-cmb',
    category: '还信用卡',
    description: '从招行借记卡还款至招行信用卡 (恢复额度)',
    createdAt: '2026-08-12T14:20:00Z',
  },
  {
    id: 'tx-5',
    type: 'TRANSFER',
    amount: 5000.00,
    date: '2026-08-11',
    time: '11:15',
    accountId: 'acc-debit-cmb',
    targetAccountId: 'acc-yuebaobao',
    category: '零钱理财划转',
    description: '招行卡转存余额宝，赚取货币基金利息',
    createdAt: '2026-08-11T11:15:00Z',
  },
  {
    id: 'tx-6',
    type: 'EXPENSE',
    amount: 156.50,
    date: '2026-08-16',
    time: '08:20',
    accountId: 'acc-alipay',
    category: '交通出行',
    tag: '通勤',
    description: '本周滴滴快车与地铁出行汇总',
    merchant: '滴滴出行 / 地铁乘车码',
    createdAt: '2026-08-16T08:20:00Z',
  },
  {
    id: 'tx-100-exp',
    type: 'EXPENSE',
    amount: 100.00,
    date: '2026-08-05',
    time: '14:20',
    accountId: 'acc-alipay',
    category: '日用百货',
    tag: '软装采购',
    projectId: 'proj-renovation',
    projectName: '新家极简智能装修',
    description: '网购多功能插座与收纳盒套装 (原支出100元)',
    merchant: '品质生活数码专营店',
    refundedAmount: 90.00,
    refundStatus: 'PARTIAL',
    refundIds: ['tx-90-refund'],
    createdAt: '2026-08-05T14:20:00Z',
  },
  {
    id: 'tx-90-refund',
    type: 'REFUND',
    amount: 90.00,
    date: '2026-08-16',
    time: '10:30',
    accountId: 'acc-alipay',
    category: '日用百货',
    tag: '平账冲红',
    projectId: 'proj-renovation',
    projectName: '新家极简智能装修',
    description: '售后缺件退费 (冲红平账90元，原单净支出10元)',
    merchant: '品质生活数码专营店',
    isRefund: true,
    refundedTxId: 'tx-100-exp',
    refundedTxDescription: '网购多功能插座与收纳盒套装 (原支出100元)',
    refundedTxAmount: 100.00,
    refundReason: '售后少件退差价退费 (平账冲红)',
    createdAt: '2026-08-16T10:30:00Z',
  },
  {
    id: 'tx-proj-renov-1',
    type: 'EXPENSE',
    amount: 12800.00,
    date: '2026-08-02',
    time: '11:00',
    accountId: 'acc-debit-cmb',
    category: '居家生活',
    tag: '硬装施工',
    projectId: 'proj-renovation',
    projectName: '新家极简智能装修',
    description: '全屋水电改造二期工程款与开槽布线',
    merchant: '居安装饰工程队',
    createdAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'tx-proj-side-inc',
    type: 'INCOME',
    amount: 4600.00,
    date: '2026-08-12',
    time: '15:30',
    accountId: 'acc-alipay',
    category: '副业创收',
    tag: '软件授权',
    projectId: 'proj-side-biz',
    projectName: '独立开发者工具副业',
    description: '独立工具软件企业永久授权费与技术咨询',
    merchant: 'Stripe / 支付宝企业商户',
    createdAt: '2026-08-12T15:30:00Z',
  },
  {
    id: 'tx-proj-side-exp',
    type: 'EXPENSE',
    amount: 580.00,
    date: '2026-08-08',
    time: '09:15',
    accountId: 'acc-credit-cmb',
    category: '数码电器',
    tag: '云服务',
    projectId: 'proj-side-biz',
    projectName: '独立开发者工具副业',
    description: '海外服务器续费与CDN流量加速节点',
    merchant: 'Cloudflare / AWS',
    createdAt: '2026-08-08T09:15:00Z',
  },
  {
    id: 'tx-proj-trip-1',
    type: 'EXPENSE',
    amount: 3880.00,
    date: '2026-08-06',
    time: '19:40',
    accountId: 'acc-credit-icbc',
    category: '休闲娱乐',
    tag: '机票住宿',
    projectId: 'proj-japan-trip',
    projectName: '2026金秋日本关西旅行',
    description: '预订关西国际机场往返机票(早鸟优惠)',
    merchant: '全日空航空 ANA',
    createdAt: '2026-08-06T19:40:00Z',
  },
  {
    id: 'tx-7',
    type: 'INCOME',
    amount: 320.00,
    date: '2026-08-13',
    time: '16:00',
    accountId: 'acc-yuebaobao',
    category: '理财分红收益',
    tag: '被动收入',
    description: '余额宝与理财基金累计结息',
    merchant: '天弘基金管理有限公司',
    createdAt: '2026-08-13T16:00:00Z',
  },
  {
    id: 'tx-8',
    type: 'EXPENSE',
    amount: 3500.00,
    date: '2026-08-01',
    time: '10:00',
    accountId: 'acc-debit-icbc',
    category: '房租物业',
    tag: '固定支出',
    description: '8月份房屋租金与物业管理费',
    merchant: '房东李女士',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'tx-9',
    type: 'LEND_OUT',
    amount: 10000.00,
    date: '2026-07-20',
    time: '15:30',
    accountId: 'acc-debit-cmb',
    targetAccountId: 'acc-lend-out-1',
    category: '人情借出款',
    counterparty: '张伟',
    description: '借给好友张伟装修临时周转金',
    createdAt: '2026-07-20T15:30:00Z',
  },
];

export const INITIAL_DEMO_PROJECTS: LedgerProject[] = [
  {
    id: 'proj-renovation',
    name: '新家极简智能装修',
    description: '新房硬装与全屋智能家居配置，预算控制在6-8万元以内',
    category: '家装工程',
    icon: 'Hammer',
    color: '#0d9488', // teal-600
    budget: 80000.00,
    status: 'ACTIVE',
    startDate: '2026-07-01',
    endDate: '2026-11-30',
    createdAt: '2026-07-01T08:00:00Z',
  },
  {
    id: 'proj-japan-trip',
    name: '2026金秋日本关西旅行',
    description: '京都红叶季与大阪环球影城5日自由行开销预算',
    category: '旅行度假',
    icon: 'Plane',
    color: '#f43f5e', // rose-500
    budget: 22000.00,
    status: 'ACTIVE',
    startDate: '2026-10-15',
    endDate: '2026-10-22',
    createdAt: '2026-07-15T09:00:00Z',
  },
  {
    id: 'proj-side-biz',
    name: '独立开发者工具副业',
    description: '出海SaaS与AI生产力工具项目收支独立核算',
    category: '副业经营',
    icon: 'Briefcase',
    color: '#8b5cf6', // purple-500
    budget: 15000.00,
    status: 'ACTIVE',
    startDate: '2026-06-01',
    createdAt: '2026-06-01T10:00:00Z',
  },
];
