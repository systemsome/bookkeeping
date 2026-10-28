import { Transaction } from '../types';
import { STORAGE_KEYS, getCurrentUserId } from './storage';

// 基础预设高频常用备注
export const DEFAULT_COMMON_REMARKS: string[] = [
  '工作日午餐',
  '外卖点餐',
  '咖啡下午茶',
  '超市买菜',
  '便利店',
  '水果零食',
  '周末聚餐',
  '打车出行',
  '地铁公交通勤',
  '自驾加油',
  '停车缴费',
  '话费宽带充值',
  '水电燃气费',
  '每月房租',
  '物业管理费',
  '日用品补仓',
  '快递包裹',
  '药房买药',
  '数码办公配件',
  '理发护理',
  '电影演出',
  '每月工资',
  '奖金分红',
  '理财收益',
  '出差垫付报销',
];

// 细分消费 / 收入类别的智能联动推荐备注表
export const CATEGORY_REMARKS_MAP: Record<string, string[]> = {
  // 餐饮美食类
  餐饮美食: ['工作日午餐', '工作日晚餐', '外卖点餐', '咖啡下午茶', '朋友聚餐', '便利店零食', '夜宵烧烤', '面包甜品', '商务宴请'],
  早餐: ['豆浆油条', '包子早点', '咖啡面包', '便利店早餐', '肯德基早餐'],
  午餐: ['工作日快餐', '商务便当', '外卖点餐', '员工食堂', '拉面米线'],
  晚餐: ['家庭聚餐', '下馆子聚餐', '外卖夜宵', '火锅烤肉'],
  咖啡奶茶: ['瑞幸咖啡', '星巴克', '喜茶奶茶', '手冲咖啡', '下午茶甜点'],

  // 交通出行类
  交通出行: ['打车出行', '地铁公交通勤', '自驾加油', '停车缴费', '高速通行费', '高铁火车票', '共享单车', '机场打车'],
  打车: ['滴滴打车', '网约车', '加班打车', '雨天打车', '出差打车'],
  加油: ['中国石化加油', '中国石油加油', '新能源充电桩', '自驾加油'],
  停车: ['商场地下车库', '小区停车月费', '路边停车泊位', '医院停车场'],

  // 购物与日常百货
  日用百货: ['超市买菜', '日用品补仓', '生鲜蔬果', '厨房纸巾', '洗发沐浴', '收纳清洁'],
  日常百货: ['超市买菜', '日用品补仓', '生鲜蔬果', '厨房纸巾', '洗发沐浴', '收纳清洁'],
  日常购物: ['超市买菜', '电商网购', '生鲜水果', '生活消耗品', '便利店小购'],
  购物消费: ['淘宝京东网购', '数码周边', '服饰鞋包', '家居用品', '图书文具', '海淘代购'],
  服饰装扮: ['购买新衣', '鞋袜换季', '护肤彩妆', '包袋饰品', '理发美甲'],

  // 居住生活
  房租物业: ['每月房租', '物业管理费', '水电燃气费', '宽带光纤费', '暖气费', '房屋维修'],
  住房物业: ['每月房租', '物业管理费', '水电燃气费', '宽带光纤费', '暖气费', '保洁打扫'],

  // 数码科技与办公
  数码科技: ['电子数码', '手机电脑配件', '云服务订阅', '软件应用会员', '数码维修', '充电宝线材'],

  // 休闲娱乐
  休闲娱乐: ['电影院观影', '周末聚会', '游戏充值/Steam', '运动健身私教', '户外露营', '展览演出门票', '剧本杀桌游'],
  运动健身: ['健身房年卡', '羽毛球馆场地', '游泳次卡', '运动装备', '私教课'],

  // 医疗健康
  医疗健康: ['药房买药', '医院门诊挂号', '定期体检化验', '看牙洁牙', '医美护肤', '保健营养品'],

  // 收入分类联动
  工资薪酬: ['每月工资发放', '季度绩效奖金', '年终奖金', '加班补贴', '节日慰问金'],
  职业收入: ['每月基本工资', '绩效提成', '年终奖金', '差旅交通补贴'],
  奖金提成: ['季度销售提成', '项目里程碑奖金', '年终绩效大奖', '优秀员工奖'],
  副业外快: ['咨询劳务报酬', '独立开发外包', '设计文案稿酬', '自媒体广告', '兼职代课'],
  理财分红收益: ['基金定投收益', '股票分红到账', '银行理财结息', '活期存款利息', '国债逆回购收益'],
  理财收益: ['基金赎回结盈', '股票投资分红', '银行利息入账', '稳健理财收益'],
  报销补贴: ['出差交通报销', '差旅酒店住宿', '业务招待餐费报销', '采购办公用品报销'],
  退款退税: ['个税年度汇算清缴退税', '电商无理由退货退款', '机票火车票退款', '押金退回'],
  红包礼金: ['过年长辈红包', '生日祝福红包', '结婚喜礼红包', '满月喜宴礼金'],
  其他收入: ['二手闲置转卖', '押金返还', '意外中奖', '杂项零星进账'],
};

export interface RemarkItem {
  id: string;
  text: string;
  source: 'category' | 'history' | 'custom' | 'preset';
  count?: number; // 仅历史高频展示出现次数
}

/**
 * 从历史交易列表中智能提取高频使用的备注短语 (自动去重、过滤空白、统计使用频次)
 */
export const extractFrequentRemarksFromTransactions = (
  transactions: Transaction[] = [],
  limit = 20
): { text: string; count: number }[] => {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const freqMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.description && typeof tx.description === 'string') {
      const trimmed = tx.description.trim();
      // 排除过长句子或无意义字符
      if (trimmed.length >= 2 && trimmed.length <= 30) {
        freqMap.set(trimmed, (freqMap.get(trimmed) || 0) + 1);
      }
    }
    // 如果有拆分子项，也统计子项的有效备注
    if (Array.isArray(tx.splitItems)) {
      for (const item of tx.splitItems) {
        if (item.description && typeof item.description === 'string') {
          const trimmed = item.description.trim();
          if (trimmed.length >= 2 && trimmed.length <= 30) {
            freqMap.set(trimmed, (freqMap.get(trimmed) || 0) + 1);
          }
        }
      }
    }
  }

  return Array.from(freqMap.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * 获取与当前用户 ID 绑定的自定义常用备注
 */
export const getStoredCustomRemarks = (userId?: string): string[] => {
  const uid = userId || getCurrentUserId() || '';
  try {
    if (uid) {
      const unifiedRaw = localStorage.getItem(`${STORAGE_KEYS.COMMON_REMARKS_PREFIX}${uid}`);
      if (unifiedRaw) {
        const parsed = JSON.parse(unifiedRaw);
        if (Array.isArray(parsed)) return parsed.filter((r) => typeof r === 'string' && r.trim().length > 0);
      }
      const legacyRaw = localStorage.getItem(`asset_vault_custom_remarks_${uid}`);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed)) {
          localStorage.setItem(`${STORAGE_KEYS.COMMON_REMARKS_PREFIX}${uid}`, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
    const globalRaw = localStorage.getItem('asset_vault_custom_remarks');
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (Array.isArray(parsed)) {
        if (uid) {
          localStorage.setItem(`${STORAGE_KEYS.COMMON_REMARKS_PREFIX}${uid}`, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
    return [];
  } catch (err) {
    console.warn('Failed to read custom remarks from localStorage:', err);
    return [];
  }
};

/**
 * 持久化保存自定义常用备注到当前用户命名空间
 */
export const saveStoredCustomRemarks = (remarks: string[], userId?: string): void => {
  const uid = userId || getCurrentUserId() || '';
  try {
    const cleaned = Array.from(
      new Set(remarks.map((r) => (typeof r === 'string' ? r.trim() : '')).filter(Boolean))
    );
    const serialized = JSON.stringify(cleaned);
    if (uid) {
      localStorage.setItem(`${STORAGE_KEYS.COMMON_REMARKS_PREFIX}${uid}`, serialized);
      localStorage.setItem(`asset_vault_custom_remarks_${uid}`, serialized);
    }
    localStorage.setItem('asset_vault_custom_remarks', serialized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('asset_vault_common_remarks_changed', {
          detail: { remarks: cleaned, userId: uid },
        })
      );
    }
  } catch (err) {
    console.warn('Failed to save custom remarks to localStorage:', err);
  }
};

/**
 * 添加一个自定义常用备注
 */
export const addCustomRemark = (newRemark: string, userId?: string): string[] => {
  const trimmed = (newRemark || '').trim();
  if (!trimmed) return getStoredCustomRemarks(userId);

  const current = getStoredCustomRemarks(userId);
  if (!current.includes(trimmed)) {
    const updated = [trimmed, ...current];
    saveStoredCustomRemarks(updated, userId);
    return updated;
  }
  return current;
};

/**
 * 删除一个自定义常用备注
 */
export const removeCustomRemark = (remarkToRemove: string, userId?: string): string[] => {
  const current = getStoredCustomRemarks(userId);
  const updated = current.filter((r) => r !== remarkToRemove);
  saveStoredCustomRemarks(updated, userId);
  return updated;
};

/**
 * 智能汇总当前场景下的常用备注列表 (按优先级与分类组织)
 */
export const getAggregatedRemarks = (params: {
  category?: string;
  transactions?: Transaction[];
  customRemarks?: string[];
  maxItems?: number;
}): {
  categoryMatched: RemarkItem[];
  historicalFrequent: RemarkItem[];
  customItems: RemarkItem[];
  presetGeneral: RemarkItem[];
  allCombined: RemarkItem[];
} => {
  const { category = '', transactions = [], customRemarks = [], maxItems = 35 } = params;

  // 1. 分类匹配推荐
  const categoryMatched: RemarkItem[] = [];
  const trimmedCat = category.trim();
  if (trimmedCat) {
    // 精确匹配
    let matchedList = CATEGORY_REMARKS_MAP[trimmedCat];
    // 模糊或包含匹配
    if (!matchedList) {
      for (const [key, list] of Object.entries(CATEGORY_REMARKS_MAP)) {
        if (trimmedCat.includes(key) || key.includes(trimmedCat)) {
          matchedList = list;
          break;
        }
      }
    }
    if (matchedList && Array.isArray(matchedList)) {
      matchedList.forEach((text, i) => {
        categoryMatched.push({
          id: `cat-${i}-${text}`,
          text,
          source: 'category',
        });
      });
    }
  }

  // 2. 历史高频提取
  const frequentList = extractFrequentRemarksFromTransactions(transactions, 15);
  const historicalFrequent: RemarkItem[] = frequentList.map((item, i) => ({
    id: `hist-${i}-${item.text}`,
    text: item.text,
    source: 'history',
    count: item.count,
  }));

  // 3. 用户专属自定义备注
  const customItems: RemarkItem[] = customRemarks.map((text, i) => ({
    id: `cust-${i}-${text}`,
    text,
    source: 'custom',
  }));

  // 4. 通用预设
  const presetGeneral: RemarkItem[] = DEFAULT_COMMON_REMARKS.map((text, i) => ({
    id: `preset-${i}-${text}`,
    text,
    source: 'preset',
  }));

  // 5. 综合去重聚合 (按优先级: 自定义 -> 分类关联 -> 历史高频 -> 通用预设)
  const seenTexts = new Set<string>();
  const allCombined: RemarkItem[] = [];

  const addUnique = (item: RemarkItem) => {
    if (!seenTexts.has(item.text) && allCombined.length < maxItems) {
      seenTexts.add(item.text);
      allCombined.push(item);
    }
  };

  customItems.forEach(addUnique);
  categoryMatched.forEach(addUnique);
  historicalFrequent.forEach(addUnique);
  presetGeneral.forEach(addUnique);

  return {
    categoryMatched,
    historicalFrequent,
    customItems,
    presetGeneral,
    allCombined,
  };
};
