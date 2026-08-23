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
  LucideIcon,
} from 'lucide-react';

export interface CategoryIconDef {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const CATEGORY_ICON_REGISTRY: Record<string, LucideIcon> = {
  // Common preset identifiers
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
};

// Popular icons palette for user selection
export const POPULAR_CATEGORY_ICONS: CategoryIconDef[] = [
  { id: 'PawPrint', name: '宠物动物', icon: PawPrint },
  { id: 'Coffee', name: '咖啡饮品', icon: Coffee },
  { id: 'Dumbbell', name: '运动健身', icon: Dumbbell },
  { id: 'GraduationCap', name: '学习培训', icon: GraduationCap },
  { id: 'Baby', name: '母婴育儿', icon: Baby },
  { id: 'Plane', name: '旅游出行', icon: Plane },
  { id: 'Shirt', name: '服饰穿搭', icon: Shirt },
  { id: 'Scissors', name: '美容美发', icon: Scissors },
  { id: 'Film', name: '电影娱乐', icon: Film },
  { id: 'Music', name: '音乐艺术', icon: Music },
  { id: 'Pill', name: '医药保健', icon: Pill },
  { id: 'Smartphone', name: '数码通讯', icon: Smartphone },
  { id: 'Camera', name: '摄影器材', icon: Camera },
  { id: 'Fuel', name: '加油车险', icon: Fuel },
  { id: 'Wrench', name: '维修工具', icon: Wrench },
  { id: 'Wine', name: '酒吧酒水', icon: Wine },
  { id: 'Apple', name: '水果生鲜', icon: Apple },
  { id: 'ShoppingCart', name: '超市购物', icon: ShoppingCart },
  { id: 'Wifi', name: '网络宽带', icon: Wifi },
  { id: 'Trophy', name: '奖品赛事', icon: Trophy },
  { id: 'PiggyBank', name: '储蓄存款', icon: PiggyBank },
  { id: 'Coins', name: '理财收益', icon: Coins },
  { id: 'Flower2', name: '鲜花绿植', icon: Flower2 },
  { id: 'Package', name: '快递物流', icon: Package },
];

/**
 * Intelligent keyword-to-icon matcher
 * Automatically detects keywords in Chinese/English and returns matching Lucide icon ID
 */
export function matchCategoryIconName(keyword: string): string {
  if (!keyword) return 'Folder';
  const q = keyword.toLowerCase().trim();

  // If directly matching an existing icon ID
  if (CATEGORY_ICON_REGISTRY[keyword]) {
    return keyword;
  }

  // 1. Pets / Animals (宠物/猫/狗/买粮/看病/疫苗)
  if (/(宠|猫|狗|喵|汪|粮|猫砂|宠物|兽医|水族|鸟|兔|仓鼠|pet|dog|cat)/i.test(q)) {
    return 'PawPrint';
  }

  // 2. Coffee / Drinks / Tea / Alcohol (咖啡/奶茶/饮料/茶/星巴克/瑞幸/酒/酒吧)
  if (/(咖啡|奶茶|饮品|茶|星巴克|瑞幸|喜茶|奈雪|可乐|果汁|饮料|coffee|tea|drink)/i.test(q)) {
    return 'Coffee';
  }
  if (/(酒|酒吧|啤酒|红酒|威士忌|白酒|精酿|微醺|bar|beer|wine|whiskey)/i.test(q)) {
    return 'Wine';
  }

  // 3. Fitness / Sports / Gym (健身/运动/游泳/瑜伽/羽毛球/跑步/私教/马拉松)
  if (/(健身|运动|游泳|瑜伽|羽毛球|网球|乒乓|跑步|私教|拳击|篮球|足球|滑雪|gym|fitness|sport)/i.test(q)) {
    return 'Dumbbell';
  }

  // 4. Study / Education / Books (学习/读书/考证/课程/培训/学费/书本/考研/考公)
  if (/(学|课|书|读书|考证|培训|学费|教程|知识|教育|考研|考公|英语|雅思|托福|study|book|course|learn)/i.test(q)) {
    return 'GraduationCap';
  }

  // 5. Baby / Parenting (母婴/育儿/宝宝/奶粉/尿不湿/玩具/幼儿园)
  if (/(母婴|育儿|宝宝|孩子|奶粉|尿不湿|玩具|儿童|亲子|产后|baby|kid|child)/i.test(q)) {
    return 'Baby';
  }

  // 6. Travel / Flight / Hotel (旅游/机票/酒店/度假/民宿/签证/景点/旅行)
  if (/(旅|机票|飞机|酒店|度假|民宿|门票|景点|自驾|游玩|出差|签证|高铁|航司|travel|hotel|flight|trip)/i.test(q)) {
    return 'Plane';
  }
  if (/(公交|巴士|大巴|地铁|bus)/i.test(q)) {
    return 'Bus';
  }
  if (/(火车|高铁|动车|动车组|train)/i.test(q)) {
    return 'Train';
  }
  if (/(单车|骑行|自行车|电瓶车|bike)/i.test(q)) {
    return 'Bike';
  }

  // 7. Clothing / Shoes / Jewelry (服饰/鞋/包/穿搭/衣服/首饰/配饰/手表)
  if (/(衣|服|裤|裙|鞋|包|穿搭|首饰|耳环|项链|外套|羽绒服|内衣|clothes|shoes|bag|shirt)/i.test(q)) {
    return 'Shirt';
  }
  if (/(表|手表|腕表|watch)/i.test(q)) {
    return 'Watch';
  }

  // 8. Beauty / Haircut / Skincare (美容/美发/理发/护肤/化妆/做脸/美甲/SPA)
  if (/(美发|理发|烫发|发廊|护肤|化妆|美甲|医美|美容|spa|做脸|香水|hair|beauty|skincare)/i.test(q)) {
    return 'Scissors';
  }

  // 9. Entertainment / Movies / Games (电影/看展/剧场/演出/话剧/KTV/密室/游戏/Steam)
  if (/(电影|看展|剧场|演出|话剧|音乐会|演唱会|ktv|密室|剧本杀|影院|film|movie|ticket)/i.test(q)) {
    return 'Film';
  }
  if (/(音乐|乐器|钢琴|吉他|黑胶|唱片|网易云|spotify|music)/i.test(q)) {
    return 'Music';
  }
  if (/(游戏|电竞|steam|switch|ps5|xbox|充值|皮肤|手游|手办|game|gaming)/i.test(q)) {
    return 'Gamepad2';
  }

  // 10. Medical / Health / Pharmacy (医疗/买药/看病/体检/挂号/牙医/疫苗/保健)
  if (/(医|药|看病|体检|挂号|医院|门诊|牙医|拔牙|疫苗|保健|眼科|诊所|pills|medical|health|hospital)/i.test(q)) {
    return 'Pill';
  }

  // 11. Digital / Tech / Phone / Camera (数码/手机/电脑/平板/相机/耳机/硬件)
  if (/(手机|iphone|android|华为|小米|苹果|phone|mobile)/i.test(q)) {
    return 'Smartphone';
  }
  if (/(相机|摄影|镜头|单反|无人机|gopro|拍立得|camera|photo)/i.test(q)) {
    return 'Camera';
  }
  if (/(数码|电脑|笔记本|显示器|显卡|外设|键盘|鼠标|耳机|音箱|laptop|pc|macbook)/i.test(q)) {
    return 'Laptop';
  }

  // 12. Car / Gas / Maintenance (汽车/加油/停车/洗车/保养/车险/过路费/代驾)
  if (/(加油|油费|燃油|充电桩|电费车|fuel|gas)/i.test(q)) {
    return 'Fuel';
  }
  if (/(车|租车|停车|洗车|过路费|代驾|保养|车险|打车|滴滴|高德|出租车|car|auto|parking)/i.test(q)) {
    return 'Car';
  }
  if (/(维修|修理|修缮|工具|五金|装修|改造|wrench|repair)/i.test(q)) {
    return 'Wrench';
  }

  // 13. Groceries / Food / Fruits (生鲜/水果/超市/零食/餐饮/外卖/买菜)
  if (/(水果|生鲜|菜场|买菜|苹果|零食|烘焙|蛋糕|面包|fruit|snack)/i.test(q)) {
    return 'Apple';
  }
  if (/(超市|便利店|沃尔玛|山姆|盒马|全家|shopping|market)/i.test(q)) {
    return 'ShoppingCart';
  }
  if (/(餐|吃|饭|外卖|烧烤|火锅|聚餐|早餐|午餐|晚餐|美团|饿了么|麦当劳|肯德基|food|eat|restaurant)/i.test(q)) {
    return 'UtensilsCrossed';
  }

  // 14. House / Utilities (房租/物业/水电气/宽带/家居)
  if (/(宽带|网络|话费|网费|流量|wifi|telecom)/i.test(q)) {
    return 'Wifi';
  }
  if (/(房|房租|物业|房贷|租金|家居|家具|家电|水费|电费|燃气|home|house|rent)/i.test(q)) {
    return 'Home';
  }

  // 15. Flowers / Gardening (鲜花/绿植/花艺/多肉)
  if (/(花|鲜花|绿植|盆栽|多肉|园艺|flower|plant)/i.test(q)) {
    return 'Flower2';
  }

  // 16. Express / Delivery (快递/跑腿/同城/顺丰)
  if (/(快递|顺丰|邮寄|包裹|集运|跑腿|package|delivery)/i.test(q)) {
    return 'Package';
  }

  // 17. Income / Investments / PiggyBank (工资/奖金/理财/收益/分红/副业/打赏/红包)
  if (/(理财|分红|股票|基金|收益|利息|投资|炒股|crypto|fund|stock|invest)/i.test(q)) {
    return 'TrendingUp';
  }
  if (/(工资|薪水|薪酬|月薪|薪资|salary|wage)/i.test(q)) {
    return 'Briefcase';
  }
  if (/(奖金|年终奖|提成|绩效|bonus|award)/i.test(q)) {
    return 'Award';
  }
  if (/(红包|礼金|压岁钱|打赏|礼品|gift|redpacket)/i.test(q)) {
    return 'Gift';
  }
  if (/(储蓄|存钱|定存|备用金|金库|piggy|savings)/i.test(q)) {
    return 'PiggyBank';
  }
  if (/(副业|外快|兼职|兼任|稿费|咨询|sidehustle)/i.test(q)) {
    return 'Sparkles';
  }
  if (/(退款|退税|反补贴|返现|refund)/i.test(q)) {
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
  // If directly matches registered icon ID
  if (CATEGORY_ICON_REGISTRY[nameOrIcon]) {
    const IconComp = CATEGORY_ICON_REGISTRY[nameOrIcon];
    return <IconComp className={className} />;
  }

  // Match keyword smartly
  const matchedId = matchCategoryIconName(nameOrIcon);
  const MatchedComp = CATEGORY_ICON_REGISTRY[matchedId] || defaultIcon;
  return <MatchedComp className={className} />;
};
