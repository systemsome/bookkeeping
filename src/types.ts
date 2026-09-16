export type AccountCategory =
  | 'DEBIT_CARD'      // 银行借记卡
  | 'CREDIT_CARD'     // 借贷信用卡
  | 'ALIPAY'          // 支付宝
  | 'WECHAT'          // 微信支付 (微信零钱/零钱通)
  | 'YUEBAO'          // 余额宝
  | 'FUND'            // 基金理财
  | 'GOLD'            // 黄金理财
  | 'JD_FINANCE'      // 京东金融
  | 'JD_BAITIAO'      // 京东白条
  | 'HUABEI'          // 蚂蚁花呗
  | 'CASH'            // 现金
  | 'RECEIVABLE'      // 借出款项 (待收回)
  | 'PAYABLE';        // 借入款项 (待偿还)

export type AssetGroup =
  | 'DEBIT_CARD'      // 借记卡
  | 'CREDIT_CARD'     // 信用卡
  | 'DIGITAL_WALLET'  // 数字钱包
  | 'FUND'            // 理财基金
  | 'CASH'            // 现金
  | 'LEND_BORROW';    // 借贷

export interface FinancialAccount {
  id: string;
  name: string;
  category: AccountCategory;
  bankName?: string;
  cardNumberLast4?: string;
  balance: number; // 现有余额 / 市值 / 欠款金额 / 借出金额
  creditLimit?: number; // 信用总额度 (信用卡 & 京东白条专用)
  usedCredit?: number; // 已用信用额度 (信用卡 & 京东白条专用)
  billDay?: number; // 每月账单日 (如 5号)
  dueDay?: number; // 每月还款日 (如 25号)
  currency?: string; // 默认 CNY
  color?: string;
  icon?: string;
  notes?: string;
  updatedAt: string;
  
  // Card Face Customization fields
  holderName?: string; // 持卡人姓名 (如 "张伟" / "ZHANG WEI")
  cardNetwork?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE'; // 卡组织 (银联 / VISA / 万事达 / 美国运通 / JCB / 无)
  cardTier?: string; // 卡片等级 (如 "金卡", "白金卡", "金葵花", "黑金卡", "钻石卡")
  cardSkin?: string; // 卡面主题皮肤 (如 "classic-cmb", "icbc-red", "platinum-dark", "custom")
  cardBgColor?: string; // 自定义卡面底色 (HEX 颜色或渐变底色)
  cardTexture?: string; // 卡面纹理 (none, metallic, carbon, shimmer, leather, waves)
  cardExpiry?: string; // 有效期 (如 "08/29")
  
  // Specific fields for Fund
  fundCode?: string;
  holdingProfit?: number; // 持有收益
  
  // Specific fields for Gold
  goldGrams?: number; // 黄金克重 (g)
  goldUnitPrice?: number; // 买入均价/当前金价 (元/克)
  
  // Specific fields for Lend/Borrow
  counterparty?: string; // 债务人/债权人 (如 "李明", "张主管")
  dueDate?: string; // 约定还款日期 (YYYY-MM-DD)
  isSettled?: boolean; // 是否已结清
}

export type TransactionType =
  | 'EXPENSE'     // 支出
  | 'INCOME'      // 收入
  | 'TRANSFER'    // 账户转账
  | 'REPAYMENT'   // 还款 (信用卡/白条/借款)
  | 'REFUND'      // 平账冲红 / 退费冲销 (支出退费、红字冲账)
  | 'LEND_OUT'    // 借出款项
  | 'COLLECT_LENT'// 收回借出款
  | 'BORROW_IN'   // 借入资金
  | 'PAY_BORROW'; // 归还借入款

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // 记账基准金额 (折合人民币 CNY)
  originalAmount?: number; // 外币原币金额 (如 100 USD)
  currency?: string; // 币种代码 (如 'USD', 'EUR', 'JPY', 'HKD', 默认 'CNY')
  exchangeRate?: number; // 记账汇率 (1 外币 = X 人民币)
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  accountId: string; // 扣款/入账/支出账户 (冲红退款时为接收退款的入账账户)
  targetAccountId?: string; // 转账/还款目标账户
  category: string; // 分类名，如 "餐饮美食", "工资薪酬", "还信用卡"
  subCategory?: string;
  tag?: string; // 标签，如 "生活必要", "娱乐消费", "家庭公共"
  description: string; // 备注说明
  merchant?: string; // 商家/交易对手
  counterparty?: string; // 借还款人
  createdAt: string;

  // 账本项目 (Ledger Project) 关联
  projectId?: string; // 所属账本项目 ID (如 "proj-renovation-2026")
  projectName?: string; // 所属账本项目名称 (如 "房屋精简装修")

  // 平账冲红 (Red-ink Reversal & Refund Offset) 专用字段
  isRefund?: boolean; // 是否为冲红退款单 (红字冲销)
  refundedTxId?: string; // 冲红凭证关联的原支出账单 ID
  refundedTxDescription?: string; // 关联的原支出账单标题/商户简要
  refundedTxAmount?: number; // 关联的原支出账单金额 (如 100)
  refundReason?: string; // 冲红原因 (如 "商家售后退费", "活动押金退还", "AA制平账", "记错冲销")
  refundedAmount?: number; // 原账单上已被冲红退款的累计金额 (例如原花费100，被退回90，则此值为90)
  refundStatus?: 'NONE' | 'PARTIAL' | 'FULL'; // 原支出账单的冲红状态：未退款 / 部分冲红 / 全额冲红
  refundIds?: string[]; // 原支出账单关联的所有冲红凭证 ID 列表
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  passwordHash: string; // Simple hash simulation
  pinCode?: string; // 6-digit PIN for quick unlock
  autoLockMinutes: number; // 0 for never, or 5, 15, 30
  privacyMode: boolean; // Hide amounts with ***
  lastLoginTime: string;
  monthlyBudget?: number; // 每月支出预算，默认例如 8000
}

export interface FinancialSummary {
  netWorth: number; // 净资产 (流动资产 + 投资理财 + 借出应收，不含信用卡借贷)
  liquidAssets: number; // 基础流动资金 (借记卡 + 支付宝 + 现金)
  investmentAssets: number; // 投资理财总额 (余额宝 + 基金 + 黄金 + 京东金融)
  totalAvailableFunds: number; // 现有可用流动资金合计 (包含理财投资合计 = 流动资金 + 理财投资)
  receivables: number; // 借出待收金额
  
  totalCreditLimit: number; // 信用卡与白条信贷总额度
  totalUsedCredit: number; // 信用卡与白条已用借贷欠款
  totalAvailableCredit: number; // 剩余可用信贷额度
  creditUtilizationRate: number; // 信贷利用率百分比 (0-100%)
  
  totalPayableDebts: number; // 借入待还金额
  totalLiabilities: number; // 全部借贷负债 = 信用卡已用 + 白条已用 + 借入待还
  
  todayExpense: number; // 今日净支出 (已扣除今日冲红)
  monthExpense: number; // 本月实际净支出 (原始支出 - 冲红退费)
  monthGrossExpense: number; // 本月原始支出总额 (未冲红前)
  monthRefund: number; // 本月累计冲红退费总额 (红字冲销款)
  monthIncome: number; // 本月总收入
  monthSavings: number; // 本月结余 (收入 - 净支出)
}

export interface WebDavConfig {
  enabled: boolean;
  serverUrl: string; // WebDAV 服务器地址，如 https://dav.jianguoyun.com/dav/
  username: string; // 用户名 / 邮箱
  password: string; // 密码 / 授权应用专用密码
  remotePath: string; // 备份文件存放路径，如 /my_finance_backup.json
  autoSyncOnSave: boolean; // 记账或更新资产时自动静默同步
  lastSyncTime?: string; // 最近一次同步成功时间
}

export interface CloudflareSyncConfig {
  enabled: boolean;
  apiUrl?: string; // 部署在 Cloudflare 上的 API 地址，默认同源 /api/sync
  autoSync: boolean; // 是否开启实时自动双向同步
  lastSyncTime?: string; // 最近一次云端同步时间
  status?: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
}

export interface BackupPackage {
  version: string;
  exportedAt: string;
  app: string;
  user: UserProfile;
  accounts: FinancialAccount[];
  transactions: Transaction[];
  projects?: LedgerProject[];
  webDavConfig?: Partial<WebDavConfig>;
}

// ==========================================
// 账本项目 (Ledger Project) 专项管理与统计类型
// ==========================================

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface LedgerProject {
  id: string;
  userId?: string; // 归属用户唯一ID，保障账号多端多域名的专属绑定
  name: string; // 项目名称，如 "房屋装修", "日本秋季旅行", "独立开发副业"
  description?: string; // 项目描述与目标
  category: string; // 分类: "旅行度假" | "家装工程" | "副业经营" | "婚礼筹备" | "商务差旅" | "车辆维护" | "专项学习" | "其他"
  icon?: string; // 图标名称或标识
  color?: string; // 主题色 hex
  budget?: number; // 专项预算金额 (元)
  status: ProjectStatus; // 状态：进行中 / 已结项 / 归档
  startDate?: string; // 开始日期 YYYY-MM-DD
  endDate?: string; // 结束日期 YYYY-MM-DD
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectFinancialStats {
  projectId: string;
  totalIncome: number; // 单项目收入总额
  grossExpense: number; // 单项目原始支出总额
  refundAmount: number; // 单项目冲红退费总额
  netExpense: number; // 单项目实际净支出 (grossExpense - refundAmount)
  netBalance: number; // 单项目净结余 (totalIncome - netExpense)
  budget?: number;
  budgetRemaining?: number;
  budgetUsagePercent: number; // 预算消耗比例 (0-100+)
  transactionCount: number; // 账单总笔数
  incomeCount: number;
  expenseCount: number;
  refundCount: number;
}

export type CloudSyncStatus = 'syncing' | 'synced' | 'error' | 'offline';

