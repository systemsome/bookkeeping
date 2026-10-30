import React from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Home,
  Laptop,
  HeartPulse,
  Gamepad2,
  Gift,
  Zap,
  Percent,
  MoreHorizontal,
  Briefcase,
  Award,
  TrendingUp,
  Sparkles,
  RotateCcw,
  PlusCircle,
  Folder,
  Tag,
  CreditCard,
  Building,
  PawPrint,
  Baby,
  GraduationCap,
  BookOpen,
  Dumbbell,
  Coffee,
  Wine,
  Beer,
  Plane,
  Film,
  Music,
  Shirt,
  Smartphone,
  Camera,
  Fuel,
  Wrench,
  Pill,
  Apple,
  ShoppingCart,
  Scissors,
  Wifi,
  Trophy,
  Coins,
  DollarSign,
  Wallet,
  Landmark,
  ShieldCheck,
  Package,
  PiggyBank,
  Receipt,
  Bus,
  Train,
  Bike,
  Watch,
  Flower2,
  Stethoscope,
  Gem,
  Glasses,
  Bed,
  Bath,
  Armchair,
  Pizza,
  Sandwich,
  Cake,
  IceCream,
  Utensils,
  Drumstick,
  Key,
  Lightbulb,
  Bell,
  MapPin,
  Smile,
  Store,
  FileText,
  RotateCw,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  TreePine,
  Luggage,
  Compass,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';

export interface CategoryIconDef {
  id: string;
  name: string;
  categoryGroup: string;
  icon: LucideIcon;
}

// 1. Comprehensive Master Registry of all supported Lucide icons for categories
export const CATEGORY_ICON_REGISTRY: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Home,
  Laptop,
  HeartPulse,
  Gamepad2,
  Gift,
  Zap,
  Percent,
  MoreHorizontal,
  Briefcase,
  Award,
  TrendingUp,
  Sparkles,
  RotateCcw,
  PlusCircle,
  Folder,
  Tag,
  CreditCard,
  Building,
  PawPrint,
  Baby,
  GraduationCap,
  BookOpen,
  Dumbbell,
  Coffee,
  Wine,
  Beer,
  Plane,
  Film,
  Music,
  Shirt,
  Smartphone,
  Camera,
  Fuel,
  Wrench,
  Pill,
  Apple,
  ShoppingCart,
  Scissors,
  Wifi,
  Trophy,
  Coins,
  DollarSign,
  Wallet,
  Landmark,
  ShieldCheck,
  Package,
  PiggyBank,
  Receipt,
  Bus,
  Train,
  Bike,
  Watch,
  Flower2,
  Stethoscope,
  Gem,
  Glasses,
  Bed,
  Bath,
  Armchair,
  Pizza,
  Sandwich,
  Cake,
  IceCream,
  Utensils,
  Drumstick,
  Key,
  Lightbulb,
  Bell,
  MapPin,
  Smile,
  Store,
  FileText,
  RotateCw,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  TreePine,
  Luggage,
  Compass,
  CheckCircle2,
};

// 2. Preset mapping for built-in category names (Strict 1:1 match to prevent surface vs ledger mismatch)
export const PRESET_CATEGORY_ICON_MAP: Record<string, string> = {
  // Built-in Expenses
  '餐饮美食': 'UtensilsCrossed',
  '日用百货': 'ShoppingBag',
  '交通出行': 'Car',
  '房租物业': 'Home',
  '数码科技': 'Laptop',
  '数码数码': 'Laptop',
  '数码3C': 'Laptop',
  '服饰装扮': 'Shirt',
  '医疗健康': 'HeartPulse',
  '休闲娱乐': 'Gamepad2',
  '宠物萌宠': 'PawPrint',
  '学习培训': 'GraduationCap',
  '人情往来': 'Gift',
  '充值水电气': 'Zap',
  '水电气费': 'Zap',
  '分期与手续费': 'Percent',
  '其他杂项': 'MoreHorizontal',
  '其他支出': 'MoreHorizontal',

  // Built-in Incomes
  '工资薪酬': 'Briefcase',
  '奖金提成': 'Award',
  '年终奖金': 'Award',
  '理财分红收益': 'TrendingUp',
  '理财分红': 'TrendingUp',
  '理财收益': 'TrendingUp',
  '副业外快': 'Sparkles',
  '退款退税': 'RotateCcw',
  '报销补贴': 'Receipt',
  '红包礼金': 'Gift',
  '其他收入': 'PlusCircle',

  // Transfers & Credit
  '信用卡还款': 'CreditCard',
  '还信用卡/花呗/白条': 'CreditCard',
  '账户转账': 'RotateCw',
  '资金划转': 'RotateCw',
  '转账': 'RotateCw',
  '还款': 'CreditCard',
  '借出款项': 'ArrowUpRight',
  '人情借出款': 'ArrowUpRight',
  '收回借出款': 'ArrowDownRight',
  '收回借款': 'ArrowDownRight',
  '借入资金': 'Coins',
  '借入款项': 'Coins',
  '归还借款': 'Receipt',
};

// 3. User Custom Category Icon Mapping Persistence in localStorage
const CUSTOM_CATEGORY_ICON_STORAGE_KEY = 'asset_vault_category_icon_mapping_v2';

export function getCustomCategoryIconMappings(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORY_ICON_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCustomCategoryIcon(categoryName: string, iconId: string): void {
  if (!categoryName) return;
  try {
    const current = getCustomCategoryIconMappings();
    current[categoryName.trim()] = iconId;
    localStorage.setItem(CUSTOM_CATEGORY_ICON_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save category icon mapping:', e);
  }
}

export function removeCustomCategoryIcon(categoryName: string): void {
  if (!categoryName) return;
  try {
    const current = getCustomCategoryIconMappings();
    delete current[categoryName.trim()];
    localStorage.setItem(CUSTOM_CATEGORY_ICON_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to remove category icon mapping:', e);
  }
}

// 4. Categorized & Filterable Popular Icons Palette
export const POPULAR_CATEGORY_ICONS: CategoryIconDef[] = [
  // 餐饮美食
  { id: 'UtensilsCrossed', name: '正餐聚餐', categoryGroup: '餐饮食品', icon: UtensilsCrossed },
  { id: 'Coffee', name: '咖啡茶饮', categoryGroup: '餐饮食品', icon: Coffee },
  { id: 'Apple', name: '水果生鲜', categoryGroup: '餐饮食品', icon: Apple },
  { id: 'Pizza', name: '快餐披萨', categoryGroup: '餐饮食品', icon: Pizza },
  { id: 'Sandwich', name: '早餐简餐', categoryGroup: '餐饮食品', icon: Sandwich },
  { id: 'Drumstick', name: '炸鸡夜宵', categoryGroup: '餐饮食品', icon: Drumstick },
  { id: 'Cake', name: '烘焙甜点', categoryGroup: '餐饮食品', icon: Cake },
  { id: 'IceCream', name: '冷饮冰品', categoryGroup: '餐饮食品', icon: IceCream },
  { id: 'Wine', name: '红酒酒吧', categoryGroup: '餐饮食品', icon: Wine },
  { id: 'Beer', name: '啤酒精酿', categoryGroup: '餐饮食品', icon: Beer },

  // 购物百货
  { id: 'ShoppingBag', name: '日用百货', categoryGroup: '购物百货', icon: ShoppingBag },
  { id: 'ShoppingCart', name: '超市便利', categoryGroup: '购物百货', icon: ShoppingCart },
  { id: 'Shirt', name: '服饰穿搭', categoryGroup: '购物百货', icon: Shirt },
  { id: 'Scissors', name: '美发护肤', categoryGroup: '购物百货', icon: Scissors },
  { id: 'Watch', name: '手表名品', categoryGroup: '购物百货', icon: Watch },
  { id: 'Gem', name: '首饰珠宝', categoryGroup: '购物百货', icon: Gem },
  { id: 'Glasses', name: '眼镜视力', categoryGroup: '购物百货', icon: Glasses },
  { id: 'Package', name: '快递网购', categoryGroup: '购物百货', icon: Package },
  { id: 'Store', name: '商场门店', categoryGroup: '购物百货', icon: Store },
  { id: 'Tag', name: '打折促销', categoryGroup: '购物百货', icon: Tag },

  // 交通出行
  { id: 'Car', name: '打车自驾', categoryGroup: '交通出行', icon: Car },
  { id: 'Fuel', name: '加油充电', categoryGroup: '交通出行', icon: Fuel },
  { id: 'Bus', name: '公交客运', categoryGroup: '交通出行', icon: Bus },
  { id: 'Train', name: '火车高铁', categoryGroup: '交通出行', icon: Train },
  { id: 'Plane', name: '飞机航司', categoryGroup: '交通出行', icon: Plane },
  { id: 'Bike', name: '单车骑行', categoryGroup: '交通出行', icon: Bike },
  { id: 'Luggage', name: '旅游出行', categoryGroup: '交通出行', icon: Luggage },
  { id: 'MapPin', name: '位置导航', categoryGroup: '交通出行', icon: MapPin },

  // 居家生活
  { id: 'Home', name: '房租房贷', categoryGroup: '居家生活', icon: Home },
  { id: 'Zap', name: '水电气费', categoryGroup: '居家生活', icon: Zap },
  { id: 'Wifi', name: '宽带话费', categoryGroup: '居家生活', icon: Wifi },
  { id: 'Wrench', name: '维修五金', categoryGroup: '居家生活', icon: Wrench },
  { id: 'Flower2', name: '鲜花绿植', categoryGroup: '居家生活', icon: Flower2 },
  { id: 'Bed', name: '家纺床品', categoryGroup: '居家生活', icon: Bed },
  { id: 'Key', name: '门禁开锁', categoryGroup: '居家生活', icon: Key },
  { id: 'Lightbulb', name: '日常用电', categoryGroup: '居家生活', icon: Lightbulb },

  // 休闲数码
  { id: 'Laptop', name: '电脑办公', categoryGroup: '休闲数码', icon: Laptop },
  { id: 'Smartphone', name: '手机数码', categoryGroup: '休闲数码', icon: Smartphone },
  { id: 'Camera', name: '摄影摄像', categoryGroup: '休闲数码', icon: Camera },
  { id: 'Gamepad2', name: '游戏电竞', categoryGroup: '休闲数码', icon: Gamepad2 },
  { id: 'Film', name: '电影演出', categoryGroup: '休闲数码', icon: Film },
  { id: 'Music', name: '音乐乐器', categoryGroup: '休闲数码', icon: Music },
  { id: 'Dumbbell', name: '运动健身', categoryGroup: '休闲数码', icon: Dumbbell },
  { id: 'Trophy', name: '赛事奖项', categoryGroup: '休闲数码', icon: Trophy },

  // 医疗母婴教育
  { id: 'HeartPulse', name: '医疗健康', categoryGroup: '健康教育', icon: HeartPulse },
  { id: 'Pill', name: '买药医药', categoryGroup: '健康教育', icon: Pill },
  { id: 'Baby', name: '母婴育儿', categoryGroup: '健康教育', icon: Baby },
  { id: 'PawPrint', name: '宠物动物', categoryGroup: '健康教育', icon: PawPrint },
  { id: 'GraduationCap', name: '学习考证', categoryGroup: '健康教育', icon: GraduationCap },
  { id: 'BookOpen', name: '书籍阅读', categoryGroup: '健康教育', icon: BookOpen },

  // 金融与收入
  { id: 'Briefcase', name: '工资薪酬', categoryGroup: '金融收入', icon: Briefcase },
  { id: 'Award', name: '奖金提成', categoryGroup: '金融收入', icon: Award },
  { id: 'TrendingUp', name: '理财收益', categoryGroup: '金融收入', icon: TrendingUp },
  { id: 'Sparkles', name: '副业外快', categoryGroup: '金融收入', icon: Sparkles },
  { id: 'PiggyBank', name: '存款储蓄', categoryGroup: '金融收入', icon: PiggyBank },
  { id: 'Coins', name: '硬币零钱', categoryGroup: '金融收入', icon: Coins },
  { id: 'DollarSign', name: '现金资金', categoryGroup: '金融收入', icon: DollarSign },
  { id: 'Wallet', name: '钱包卡券', categoryGroup: '金融收入', icon: Wallet },
  { id: 'CreditCard', name: '借贷信用', categoryGroup: '金融收入', icon: CreditCard },
  { id: 'RotateCcw', name: '退款退税', categoryGroup: '金融收入', icon: RotateCcw },
  { id: 'Gift', name: '人情礼金', categoryGroup: '金融收入', icon: Gift },
  { id: 'Percent', name: '手续利息', categoryGroup: '金融收入', icon: Percent },
  { id: 'MoreHorizontal', name: '其他杂项', categoryGroup: '金融收入', icon: MoreHorizontal },
];

/**
 * Intelligent keyword-to-icon matcher
 * Comprehensive Chinese/English keyword recognition engine
 */
export function matchCategoryIconName(keyword: string): string {
  if (!keyword) return 'Folder';
  const raw = keyword.trim();
  const q = raw.toLowerCase();

  // 1. Direct Lucide Icon Name Match
  if (CATEGORY_ICON_REGISTRY[raw]) {
    return raw;
  }

  // 2. User Explicit Mapping Lookup
  const userMap = getCustomCategoryIconMappings();
  if (userMap[raw] && CATEGORY_ICON_REGISTRY[userMap[raw]]) {
    return userMap[raw];
  }

  // 3. Preset Built-in Exact Match
  if (PRESET_CATEGORY_ICON_MAP[raw]) {
    return PRESET_CATEGORY_ICON_MAP[raw];
  }

  // 4. Intelligent Regex Matching Engine

  // (A) Pet / Animals
  if (/(宠|猫|狗|喵|汪|幼犬|幼猫|猫粮|狗粮|猫砂|罐头|冻干|驱虫|宠物医院|水族|鸟|兔|仓鼠|pet|dog|cat|puppy|kitten)/i.test(q)) {
    return 'PawPrint';
  }

  // (B) Coffee / Milk Tea / Beverages
  if (/(咖啡|拿铁|美式|星巴克|瑞幸|库迪|奶茶|喜茶|奈雪|茶|绿茶|红茶|饮料|果汁|可乐|雪碧|饮品|coffee|tea|latte|boba|drink)/i.test(q)) {
    return 'Coffee';
  }

  // (C) Alcohol / Bar / Wine
  if (/(酒|酒吧|啤酒|红酒|白酒|威士忌|精酿|鸡尾酒|微醺|居酒屋|清吧|bar|beer|wine|whiskey|cocktail|alcohol)/i.test(q)) {
    return 'Wine';
  }

  // (D) Fruits & Vegetables & Fresh Food
  if (/(水果|苹果|香蕉|西瓜|橙子|生鲜|蔬菜|菜场|买菜|农贸|净菜|fruit|vegetable|fresh)/i.test(q)) {
    return 'Apple';
  }

  // (E) Food & Dining & Restaurants
  if (/(餐饮|美食|外卖|烧烤|火锅|聚餐|正餐|便当|快餐|早饭|早餐|午饭|午餐|晚饭|晚餐|夜宵|宵夜|吃|饭|面|肯德基|麦当劳|汉堡|披萨|寿司|自助餐|美团外卖|饿了么|food|eat|dinner|lunch|breakfast|restaurant|diner|meal)/i.test(q)) {
    return 'UtensilsCrossed';
  }

  // (F) Supermarket & Groceries & Daily Needs (日用百货/超市/便利店)
  if (/(百货|日用|日用品|日杂|杂货|超市|便利店|沃尔玛|山姆|盒马|全家|罗森|711|屈臣氏|购物|买买买|大润发|永辉|shopping|market|grocery|supermarket)/i.test(q)) {
    return 'ShoppingBag';
  }

  // (G) Beauty / Haircut / Skincare (理发/护肤/美容/美甲)
  if (/(理发|剪发|烫发|染发|发廊|美发|护肤|化妆|口红|美甲|美睫|医美|做脸|美容|spa|芳疗|香水|洁面|面霜|面膜|hair|beauty|skincare|salon|makeup)/i.test(q)) {
    return 'Scissors';
  }

  // (H) Clothing & Shoes & Bags (服饰/鞋包/配饰)
  if (/(衣|服|裤|裙|外套|羽绒服|衬衫|t恤|卫衣|内衣|袜子|鞋|球鞋|高跟鞋|包包|箱包|皮带|围巾|帽子|穿搭|女装|男装|clothes|apparel|shoes|bag|shirt)/i.test(q)) {
    return 'Shirt';
  }

  // (I) Jewelry & Watches (手表/首饰/珠宝)
  if (/(手表|腕表|劳力士|欧米茄|浪琴|卡西欧|watch)/i.test(q)) {
    return 'Watch';
  }
  if (/(珠宝|首饰|项链|戒指|手镯|耳环|钻石|黄金|白银|gem|jewelry|diamond)/i.test(q)) {
    return 'Gem';
  }

  // (J) Utilities & Electricity (充值水电气/水费/电费/燃气)
  if (/(水电气|水费|电费|燃气|煤气|暖气|供暖|充值|充电宝|缴费|电卡|水卡|zap|electricity|utility|energy)/i.test(q)) {
    return 'Zap';
  }

  // (K) Network & Telecom (话费/宽带/流量/wifi)
  if (/(宽带|网络|话费|网费|流量|光纤|移动|联通|电信|wifi|telecom|internet)/i.test(q)) {
    return 'Wifi';
  }

  // (L) Housing & Rent & Property (房租/房贷/物业)
  if (/(房租|租房|房贷|月供|物业|物业费|中介费|装修|家具|家居|家纺|床品|厨具|宜家|rent|housing|home|house|mortgage)/i.test(q)) {
    return 'Home';
  }

  // (M) Vehicle Fuel & Charging (加油/充电)
  if (/(加油|油费|汽油|柴油|充电桩|特斯拉充电|换电|fuel|gas|petrol)/i.test(q)) {
    return 'Fuel';
  }

  // (N) Traffic & Taxi & Car (打车/交通/停车/保养)
  if (/(交通|打车|滴滴|出租车|顺风车|专车|租车|自驾|代驾|停车|停车费|洗车|过路费|高速费|汽车|车险|保养|验车|car|taxi|uber|parking|auto)/i.test(q)) {
    return 'Car';
  }
  if (/(公交|巴士|大巴|地铁|轻轨|subway|bus|metro)/i.test(q)) {
    return 'Bus';
  }
  if (/(火车|高铁|动车|列车|12306|铁道|train|railway)/i.test(q)) {
    return 'Train';
  }
  if (/(单车|骑行|自行车|电动车|电瓶车|小牛|摩托车|bike|bicycle|motorcycle)/i.test(q)) {
    return 'Bike';
  }

  // (O) Travel & Flight & Hotel (旅游/机票/酒店/度假)
  if (/(旅|机票|飞机|机场|航班|航司|登机|酒店|民宿|度假|景点|门票|签证|出境游|旅行|travel|hotel|flight|trip|airplane|vacation)/i.test(q)) {
    return 'Plane';
  }

  // (P) Digital / Tech / Computers / Phones (数码/电脑/手机/相机)
  if (/(手机|iphone|android|华为|小米|荣耀|vivo|oppo|碎屏险|phone|mobile|smartphone)/i.test(q)) {
    return 'Smartphone';
  }
  if (/(相机|单反|微单|镜头|摄影|摄像|拍照|拍立得|大疆|无人机|gopro|camera|photo)/i.test(q)) {
    return 'Camera';
  }
  if (/(数码|电脑|笔记本|显示器|显卡|机械键盘|鼠标|耳机|音箱|投影仪|主机|ipad|平板|macbook|laptop|pc|computer|hardware)/i.test(q)) {
    return 'Laptop';
  }

  // (Q) Entertainment & Games & Movies (娱乐/游戏/电影/演出)
  if (/(游戏|电竞|steam|switch|ps5|xbox|手游|充值|原神|皮肤|抽卡|剧本杀|密室|桌游|手办|盲盒|潮玩|乐高|game|gaming)/i.test(q)) {
    return 'Gamepad2';
  }
  if (/(电影|影院|万达|imax|话剧|音乐剧|剧场|看展|展会|音乐节|演唱会|livehouse|脱口秀|大麦|淘票票|ktv|唱歌|film|movie|cinema|concert|show)/i.test(q)) {
    return 'Film';
  }
  if (/(音乐|乐器|吉他|钢琴|小提琴|黑胶|唱片|网易云|qq音乐|spotify|apple music|music|audio)/i.test(q)) {
    return 'Music';
  }

  // (R) Sports & Fitness (健身/运动)
  if (/(健身|私教|健身房|瑜伽|普拉提|游泳|跑步|跑鞋|马拉松|羽毛球|乒乓球|网球|篮球|足球|攀岩|滑雪|潜水|徒步|动感单车|蛋白粉|gym|fitness|sport|workout)/i.test(q)) {
    return 'Dumbbell';
  }

  // (S) Medical & Health & Pharmacy (医疗/买药/体检/看病)
  if (/(医|药|买药|药店|看病|医院|门诊|挂号|体检|牙医|洗牙|拔牙|补牙|牙科|正畸|眼科|眼镜|隐形眼镜|疫苗|保健品|维生素|medical|hospital|pharmacy|health|pill|dentist)/i.test(q)) {
    return 'HeartPulse';
  }

  // (T) Baby & Kids & Parenting (母婴/育儿)
  if (/(母婴|育儿|宝宝|婴儿|孩子|儿童|奶粉|尿不湿|纸尿裤|辅食|婴儿车|奶瓶|玩具|绘本|早教|幼儿园|托育|产检|baby|infant|toddler|kid|child)/i.test(q)) {
    return 'Baby';
  }

  // (U) Education & Study & Books (学习/考证/培训/书籍)
  if (/(学习|培训|考证|课程|学费|读书|教材|考研|考公|雅思|托福|驾校|知识付费|讲座|专升本|study|course|learn|education|exam)/i.test(q)) {
    return 'GraduationCap';
  }
  if (/(书|书店|图书|微信读书|kindle|杂志|报刊|漫画|小说|book|reading|novel)/i.test(q)) {
    return 'BookOpen';
  }

  // (V) Gifts & Social (人情/礼金/红包)
  if (/(人情|礼物|礼品|送礼|伴手礼|生日|结婚|随礼|份子钱|压岁钱|满月|探望|慰问|红包|打赏|gift|present|redpacket)/i.test(q)) {
    return 'Gift';
  }

  // (W) Flowers & Gardening (鲜花/绿植)
  if (/(花|鲜花|绿植|盆栽|多肉|玫瑰|百合|插花|花店|园艺|flower|plant|garden)/i.test(q)) {
    return 'Flower2';
  }

  // (X) Express & Delivery (快递/跑腿)
  if (/(快递|顺丰|菜鸟|申通|圆通|中通|韵达|京东快递|邮寄|寄件|包裹|集运|跑腿|同城送|package|delivery|shipping|express)/i.test(q)) {
    return 'Package';
  }

  // (Y) Maintenance & Cleaning & Tools (维修/家政/五金)
  if (/(维修|修理|家政|保洁|钟点工|疏通|开锁|洗衣|干洗|工具|五金|扳手|wrench|repair|clean)/i.test(q)) {
    return 'Wrench';
  }

  // (Z) Fee & Interest (分期与手续费/利息)
  if (/(手续费|利息|分期|分期费|违约金|滞纳金|汇费|交易费|管理费|年费|印花税|fee|interest|percent)/i.test(q)) {
    return 'Percent';
  }

  // (AA) Income & Salary & Bonus & Invest (收入/工资/理财)
  if (/(工资|薪水|薪酬|月薪|年薪|兼职工资|劳务费|稿费|稿酬|结算|salary|wage|income)/i.test(q)) {
    return 'Briefcase';
  }
  if (/(奖金|年终奖|季度奖|绩效|提成|激励|分红|评优|bonus|award|trophy)/i.test(q)) {
    return 'Award';
  }
  if (/(理财|基金|股票|炒股|etf|证券|股息|分红收益|收益|盈余|债券|币圈|invest|stock|fund|crypto|yield)/i.test(q)) {
    return 'TrendingUp';
  }
  if (/(储蓄|存钱|攒钱|定存|大额存单|活期|小金库|零钱|存钱罐|savings|deposit|piggy)/i.test(q)) {
    return 'PiggyBank';
  }
  if (/(副业|外快|兼职|咨询|接单|私活|跑腿兼职|兼薪|佣金|sidehustle|freelance|sparkles)/i.test(q)) {
    return 'Sparkles';
  }
  if (/(退款|退税|返现|售后|赔付|报销|补贴|抵扣|优惠返还|refund|cashback|rebate)/i.test(q)) {
    return 'RotateCcw';
  }

  // Fallback defaults
  return 'Folder';
}

interface CategoryIconProps {
  nameOrIcon: string;
  className?: string;
  defaultIcon?: LucideIcon;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  nameOrIcon,
  className = 'w-4 h-4',
  defaultIcon = Folder,
}) => {
  if (!nameOrIcon) {
    const Fallback = defaultIcon;
    return <Fallback className={className} />;
  }

  // 1. Direct match by Lucide Icon Name
  if (CATEGORY_ICON_REGISTRY[nameOrIcon]) {
    const IconComp = CATEGORY_ICON_REGISTRY[nameOrIcon];
    return <IconComp className={className} />;
  }

  // 2. Custom User mapping or intelligent lookup
  const matchedId = matchCategoryIconName(nameOrIcon);
  const MatchedComp = CATEGORY_ICON_REGISTRY[matchedId] || defaultIcon;
  return <MatchedComp className={className} />;
};
