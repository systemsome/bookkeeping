// Cardentify (https://cards.no2.ac) & CardArt (https://cardart.cc) Unified Card Face Engine
// Curated Apple Pay / Google Wallet PassKit lossless card face collections

import { CARDENTIFY_CARDS, CardentifyCard } from './cardentifyData';
import { getAllCardArtCards, CardArtItem, syncWithCardArtOnline, searchCardArtLive } from './cardArtSync';

export type { CardentifyCard, CardArtItem };
export { CARDENTIFY_CARDS, syncWithCardArtOnline, searchCardArtLive };

export interface CardFacePreset {
  id: string;
  name: string;
  bankName: string;
  englishName: string;
  cardCategory: 'DEBIT' | 'CREDIT' | 'DIGITAL';
  cardNetwork: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE';
  cardTier: string;
  logoType: string;
  textColorMode: 'light' | 'dark';
  cardStyle: {
    background: string;
    accentColor: string;
    borderColor: string;
    patternType?: 'waves' | 'mesh' | 'geometric' | 'radial-sheen' | 'silk-stripes' | 'circuit' | 'dots' | 'gradient';
  };
  cardImageUrl?: string;
  description: string;
}

// Unified card item format spanning Cardentify (cards.no2.ac) and CardArt (cardart.cc)
export interface UnifiedCardItem {
  id: string;
  name: string;
  titleEn?: string | null;
  issuerName: string;
  issuerEnglish: string;
  imageUrl: string;
  brand: string;
  type: string;
  country: string;
  cardTier?: string;
  source: 'cardentify' | 'cardart';
  sourceUrl: string;
  bins?: string[];
  tags?: string[];
}

// Convert Cardentify to Unified
export function cardentifyToUnified(c: CardentifyCard): UnifiedCardItem {
  const cardTier = c.name.includes('白金')
    ? '白金卡'
    : c.name.includes('黑') || c.name.includes('百夫长')
    ? '黑金卡'
    : c.name.includes('金卡') || c.name.includes('金葵花')
    ? '金卡'
    : '标准卡';

  return {
    id: `cardentify-${c.id}`,
    name: c.name,
    titleEn: c.issuerEnglish,
    issuerName: c.issuerName || '银行机构',
    issuerEnglish: c.issuerEnglish || 'BANK CARD',
    imageUrl: c.imageUrl,
    brand: c.brand || 'UnionPay',
    type: c.type || 'Debit',
    country: c.country || 'CN',
    cardTier,
    source: 'cardentify',
    sourceUrl: 'https://cards.no2.ac/',
    bins: c.bins,
    tags: [c.issuerName, c.name, c.brand, c.type, cardTier].filter(Boolean) as string[],
  };
}

// Convert CardArt to Unified
export function cardArtToUnified(c: CardArtItem): UnifiedCardItem {
  const cardTier = c.title.includes('白金')
    ? '白金卡'
    : c.title.includes('黑') || c.title.includes('百夫长')
    ? '黑金卡'
    : c.title.includes('金卡')
    ? '金卡'
    : '标准卡';

  return {
    id: `cardart-${c.id}`,
    name: c.title,
    titleEn: c.titleEn,
    issuerName: c.issuerName || 'CardArt 创意卡面',
    issuerEnglish: c.issuerEnglish || 'CardArt Community',
    imageUrl: c.imageUrl,
    brand: c.brand || 'UnionPay',
    type: c.type || 'Credit',
    country: c.country || 'CN',
    cardTier,
    source: 'cardart',
    sourceUrl: c.sourceUrl || `https://cardart.cc/c/${c.id}`,
    tags: c.tags,
  };
}

// Get all unified cards from both sources (801+ items)
export function getAllUnifiedCards(): UnifiedCardItem[] {
  const cardentifyList = CARDENTIFY_CARDS.map(cardentifyToUnified);
  const cardArtList = getAllCardArtCards().map(cardArtToUnified);
  return [...cardentifyList, ...cardArtList];
}

// Get dynamic total card count across both databases (Cardentify + CardArt synced)
export function getTotalGalleryCardsCount(): number {
  return CARDENTIFY_CARDS.length + getAllCardArtCards().length;
}

// Convert Cardentify card to CardFacePreset format for backwards compatibility
export function cardentifyToPreset(c: CardentifyCard | UnifiedCardItem): CardFacePreset {
  const isCredit = c.type?.toLowerCase() === 'credit';
  let network: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = 'UNIONPAY';
  const brandUp = (c.brand || '').toUpperCase();
  if (brandUp.includes('VISA')) network = 'VISA';
  else if (brandUp.includes('MASTER')) network = 'MASTERCARD';
  else if (brandUp.includes('AMEX') || brandUp.includes('AMERICAN EXPRESS')) network = 'AMEX';
  else if (brandUp.includes('JCB')) network = 'JCB';
  else if (brandUp.includes('UNIONPAY')) network = 'UNIONPAY';

  const sourceName = 'source' in c && c.source === 'cardart' ? 'CardArt (cardart.cc)' : 'Cardentify (cards.no2.ac)';

  return {
    id: typeof c.id === 'string' && c.id.startsWith('card') ? c.id : `cardentify-${c.id}`,
    name: c.name,
    bankName: c.issuerName || '银行机构',
    englishName: c.issuerEnglish || 'BANK CARD',
    cardCategory: isCredit ? 'CREDIT' : 'DEBIT',
    cardNetwork: network,
    cardTier: c.name.includes('白金') ? '白金卡' : c.name.includes('金卡') ? '金卡' : '贵宾卡',
    logoType: 'generic',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      accentColor: '#38bdf8',
      borderColor: 'border-white/20',
      patternType: 'radial-sheen',
    },
    cardImageUrl: c.imageUrl,
    description: `官方原版 Apple Pay 卡面 (${sourceName} · ${c.issuerName} · ${c.brand})`,
  };
}

// Pre-packaged curated presets with authentic lossless images
export const CARDENTIFY_PRESETS: CardFacePreset[] = [
  // 招商银行
  {
    id: 'cmb-classic-sunflower',
    name: '招商银行财富绽放金葵花卡',
    bankName: '招商银行',
    englishName: 'CHINA MERCHANTS BANK',
    cardCategory: 'DEBIT',
    cardNetwork: 'UNIONPAY',
    cardTier: '金葵花贵宾卡',
    logoType: 'cmb',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 35%, #7f1d1d 70%, #450a0a 100%)',
      accentColor: '#fde047',
      borderColor: 'border-amber-400/40',
      patternType: 'radial-sheen',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/4c558a80095fe02b3de352e48b6d6ded3dfbffb3f90fc59eff33694ce88129d9.png',
    description: 'Apple Pay 招行官方财富绽放金葵花高清卡面',
  },
  {
    id: 'cmb-young-black',
    name: '招行Young卡(青年版)炫酷黑',
    bankName: '招商银行',
    englishName: 'CHINA MERCHANTS BANK',
    cardCategory: 'CREDIT',
    cardNetwork: 'UNIONPAY',
    cardTier: 'Young卡炫酷黑',
    logoType: 'cmb',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #18181b 0%, #09090b 55%, #000000 100%)',
      accentColor: '#e2e8f0',
      borderColor: 'border-slate-500/50',
      patternType: 'geometric',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/804b676762dbac00aefcfe8ebd93d8fa0e9a1bae7fb9fa1bcd9eaa32a669574c.png',
    description: 'Apple Pay 招行 Young 黑色青年信用卡官方卡面',
  },
  {
    id: 'cardart-cmb-master-black',
    name: '招商银行黑色银标万事达 (CardArt)',
    bankName: '招商银行',
    englishName: 'CHINA MERCHANTS BANK',
    cardCategory: 'CREDIT',
    cardNetwork: 'MASTERCARD',
    cardTier: '万事达黑卡',
    logoType: 'cmb',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #18181b 0%, #09090b 60%, #000000 100%)',
      accentColor: '#e2e8f0',
      borderColor: 'border-slate-400/40',
      patternType: 'geometric',
    },
    cardImageUrl: 'https://cardart.cc/img/cards/9ovQ6FvRK0/v1/w1024.webp',
    description: 'CardArt (cardart.cc) 招行黑色银标万事达尊享卡面',
  },
  {
    id: 'cmb-freedom-platinum',
    name: '招商银行自由人生白金信用卡',
    bankName: '招商银行',
    englishName: 'CHINA MERCHANTS BANK',
    cardCategory: 'CREDIT',
    cardNetwork: 'UNIONPAY',
    cardTier: '自由人生白金卡',
    logoType: 'cmb',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
      accentColor: '#e2e8f0',
      borderColor: 'border-slate-500/50',
      patternType: 'geometric',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/a0c1384018f6ebea167ca5f4c0c623099d7092314b8a64507815c8be27c8219b.png',
    description: 'Apple Pay 招行自由人生白金卡官方高定卡面',
  },

  // 工商银行
  {
    id: 'cardart-icbc-caishen',
    name: '工商银行工银聚财财神卡 (CardArt)',
    bankName: '中国工商银行',
    englishName: 'INDUSTRIAL & COMMERCIAL BANK OF CHINA',
    cardCategory: 'DEBIT',
    cardNetwork: 'UNIONPAY',
    cardTier: '聚财财神卡尊享版',
    logoType: 'icbc',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 60%, #450a0a 100%)',
      accentColor: '#fde047',
      borderColor: 'border-amber-400/50',
      patternType: 'radial-sheen',
    },
    cardImageUrl: 'https://cardart.cc/img/cards/HwcVIYdN84/v1/w1024.webp',
    description: 'CardArt (cardart.cc) 工商银行工银聚财财神卡尊享版',
  },
  {
    id: 'icbc-lingtong',
    name: '中国工商银行工银灵通卡',
    bankName: '中国工商银行',
    englishName: 'INDUSTRIAL & COMMERCIAL BANK OF CHINA',
    cardCategory: 'DEBIT',
    cardNetwork: 'UNIONPAY',
    cardTier: '灵通借记账户',
    logoType: 'icbc',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 45%, #7f1d1d 85%, #3f0708 100%)',
      accentColor: '#fef08a',
      borderColor: 'border-rose-400/40',
      patternType: 'radial-sheen',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/0b7f393e833fe583d1a6a41dfe8e9ddac80470b2c2942a4e17477653cfa9c17e.png',
    description: 'Apple Pay 工商银行工银灵通卡官方卡面',
  },
  {
    id: 'icbc-constellation',
    name: '中国工商银行宇宙星座卡',
    bankName: '中国工商银行',
    englishName: 'INDUSTRIAL & COMMERCIAL BANK OF CHINA',
    cardCategory: 'CREDIT',
    cardNetwork: 'UNIONPAY',
    cardTier: '宇宙星座白金卡',
    logoType: 'icbc',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #18181b 0%, #09090b 55%, #000000 100%)',
      accentColor: '#fbbf24',
      borderColor: 'border-amber-400/50',
      patternType: 'dots',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/61a36ec6f71b9855124adf63408ca1627e269fd70cd34b74cf418d2f8be260d8.png',
    description: 'Apple Pay 工银宇宙星座卡黑金官方卡面',
  },

  // 建设银行
  {
    id: 'ccb-dragon-joy',
    name: '中国建设银行龙卡JOY信用卡',
    bankName: '中国建设银行',
    englishName: 'CHINA CONSTRUCTION BANK',
    cardCategory: 'CREDIT',
    cardNetwork: 'UNIONPAY',
    cardTier: '龙卡JOY信用卡',
    logoType: 'ccb',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #1d4ed8 75%, #0284c7 100%)',
      accentColor: '#67e8f9',
      borderColor: 'border-blue-400/40',
      patternType: 'geometric',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/e109a083ddc610334cb50fdbc351acc21fec3aeddb269f6a8c820df5476a4260.png',
    description: 'Apple Pay 建行龙卡JOY信用卡官方原版',
  },

  // 中国银行
  {
    id: 'boc-bilibili',
    name: '中国银行上海哔哩哔哩联名借记卡',
    bankName: '中国银行',
    englishName: 'BANK OF CHINA',
    cardCategory: 'DEBIT',
    cardNetwork: 'UNIONPAY',
    cardTier: 'Bilibili 联名借记卡',
    logoType: 'boc',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 50%, #450a0a 100%)',
      accentColor: '#fca5a5',
      borderColor: 'border-red-400/40',
      patternType: 'waves',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/4d4392c526c76da42d7778862cc0bf7d532d5041dcae53a379aab87e3b8903e8.png',
    description: 'Apple Pay 中行B站联名借记卡官方高清卡面',
  },

  // 交通银行
  {
    id: 'bcm-pacific-debit',
    name: '交通银行太平洋借记卡',
    bankName: '交通银行',
    englishName: 'BANK OF COMMUNICATIONS',
    cardCategory: 'DEBIT',
    cardNetwork: 'UNIONPAY',
    cardTier: '太平洋借记卡',
    logoType: 'bcm',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #0e7490 0%, #155e75 45%, #164e63 100%)',
      accentColor: '#67e8f9',
      borderColor: 'border-cyan-400/40',
      patternType: 'waves',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/deedfc683cc3e355b31ff50729c77106081ff631c65033455b16461f169dfa53.png',
    description: 'Apple Pay 交行太平洋借记卡官方卡面',
  },

  // 中信银行
  {
    id: 'citic-mastercard-world',
    name: '中信银行万事达双币世界卡',
    bankName: '中信银行',
    englishName: 'CHINA CITIC BANK',
    cardCategory: 'DEBIT',
    cardNetwork: 'MASTERCARD',
    cardTier: '万事达世界借记卡',
    logoType: 'citic',
    textColorMode: 'light',
    cardStyle: {
      background: 'linear-gradient(135deg, #18181b 0%, #09090b 60%, #000000 100%)',
      accentColor: '#fbbf24',
      borderColor: 'border-amber-400/50',
      patternType: 'radial-sheen',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/cbf7809f99d0fae00c6f7edb2616ade819b062d8d1d839d7cac20b5dd74a2d6c.png',
    description: 'Apple Pay 中信万事达双币借记卡世界卡',
  },

  // 国际与交通卡 (CardArt 八达通 & Suica)
  {
    id: 'cardart-hk-octopus',
    name: '香港汇丰八达通 (CardArt)',
    bankName: '香港八达通 / 汇丰',
    englishName: 'Hong Kong Octopus',
    cardCategory: 'DIGITAL',
    cardNetwork: 'NONE',
    cardTier: '数字钱包公交卡',
    logoType: 'generic',
    textColorMode: 'dark',
    cardStyle: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      accentColor: '#f97316',
      borderColor: 'border-orange-300/50',
      patternType: 'waves',
    },
    cardImageUrl: 'https://cardart.cc/img/cards/g40OknIhxZ/v1/w1024.webp',
    description: 'CardArt (cardart.cc) 香港汇丰八达通定制数字钱包卡面',
  },
  {
    id: 'wise-card-green',
    name: 'Wise 多币种借记卡',
    bankName: 'Wise',
    englishName: 'WISE MULTI-CURRENCY',
    cardCategory: 'DEBIT',
    cardNetwork: 'VISA',
    cardTier: 'Wise Multi-Currency Card',
    logoType: 'generic',
    textColorMode: 'dark',
    cardStyle: {
      background: 'linear-gradient(135deg, #a3e635 0%, #84cc16 50%, #4d7c0f 100%)',
      accentColor: '#1a2e05',
      borderColor: 'border-lime-500/40',
      patternType: 'radial-sheen',
    },
    cardImageUrl: 'https://r2-cardentify.cdn.no2.ac/a8181a386b935e4c0721abf0119861682a1e8103b3a79b2cc7b1c903ab62a9ff.png',
    description: 'Apple Pay Wise 荧光绿官方借记卡卡面',
  },
];

// Lookup by preset ID
export function getCardentifyPreset(presetId: string): CardFacePreset | undefined {
  const p = CARDENTIFY_PRESETS.find((item) => item.id === presetId);
  if (p) return p;
  if (presetId.startsWith('cardentify-')) {
    const rawId = parseInt(presetId.replace('cardentify-', ''), 10);
    const card = CARDENTIFY_CARDS.find((c) => c.id === rawId);
    if (card) return cardentifyToPreset(card);
  }
  if (presetId.startsWith('cardart-')) {
    const rawId = presetId.replace('cardart-', '');
    const card = getAllCardArtCards().find((c) => c.id === rawId);
    if (card) return cardentifyToPreset(cardArtToUnified(card));
  }
  return undefined;
}

// Find card in full database by ID
export function getCardentifyCardById(id: number | string): CardentifyCard | undefined {
  const numId = typeof id === 'number' ? id : parseInt(id.replace('cardentify-', ''), 10);
  return CARDENTIFY_CARDS.find((c) => c.id === numId);
}

// Find card in full database by direct Image URL
export function findCardentifyCardByUrl(url: string): UnifiedCardItem | undefined {
  if (!url) return undefined;
  const unified = getAllUnifiedCards();
  return unified.find((c) => c.imageUrl === url);
}

// Smart Best Matcher across BOTH Cardentify and CardArt with cardTier intelligence
export function matchBestCardentifyCard(
  name: string,
  bankName?: string,
  category?: string,
  cardTier?: string
): UnifiedCardItem | undefined {
  const isCredit = category === 'CREDIT_CARD';
  const query = `${bankName || ''} ${name || ''} ${cardTier || ''}`.toLowerCase();
  const allCards = getAllUnifiedCards();

  // 1. Bank matching
  let matches = allCards.filter((c) => {
    const bName = (c.issuerName || '').toLowerCase();
    const bEng = (c.issuerEnglish || '').toLowerCase();
    const cName = (c.name || '').toLowerCase();

    if (query.includes('招商') || query.includes('招行') || query.includes('cmb')) {
      return bName.includes('招商') || cName.includes('招商') || bEng.includes('merchants');
    }
    if (query.includes('工商') || query.includes('工行') || query.includes('icbc')) {
      return bName.includes('工商') || cName.includes('工行') || cName.includes('工银') || bEng.includes('icbc');
    }
    if (query.includes('建设') || query.includes('建行') || query.includes('ccb') || query.includes('龙卡')) {
      return bName.includes('建设') || cName.includes('龙卡') || cName.includes('建行') || bEng.includes('construction');
    }
    if (query.includes('中国银行') || query.includes('中行') || query.includes('boc') || query.includes('中银')) {
      return bName.includes('中国银行') || cName.includes('中银') || cName.includes('中行') || bEng.includes('bank of china');
    }
    if (query.includes('农业') || query.includes('农行') || query.includes('abc') || query.includes('金穗')) {
      return bName.includes('农业') || cName.includes('金穗') || cName.includes('农行') || bEng.includes('agricultural');
    }
    if (query.includes('交通') || query.includes('交行') || query.includes('bcm') || query.includes('太平洋')) {
      return bName.includes('交通') || cName.includes('太平洋') || cName.includes('交行') || bEng.includes('communications');
    }
    if (query.includes('中信') || query.includes('citic')) {
      return bName.includes('中信') || cName.includes('中信') || bEng.includes('citic');
    }
    if (query.includes('浦发') || query.includes('浦东发展') || query.includes('spdb')) {
      return bName.includes('浦发') || cName.includes('浦发') || bEng.includes('pudong');
    }
    if (query.includes('民生') || query.includes('cmbc')) {
      return bName.includes('民生') || cName.includes('民生') || bEng.includes('minsheng');
    }
    if (query.includes('平安') || query.includes('pab')) {
      return bName.includes('平安') || cName.includes('平安') || bEng.includes('ping an');
    }
    if (query.includes('广发') || query.includes('cgb')) {
      return bName.includes('广发') || cName.includes('广发') || bEng.includes('guangfa');
    }
    if (query.includes('兴业') || query.includes('cib')) {
      return bName.includes('兴业') || cName.includes('兴业') || bEng.includes('industrial');
    }
    if (query.includes('邮政') || query.includes('邮储') || query.includes('psbc')) {
      return bName.includes('邮政') || bName.includes('邮储') || cName.includes('邮储') || bEng.includes('postal');
    }
    if (query.includes('光大') || query.includes('ceb')) {
      return bName.includes('光大') || cName.includes('光大') || bEng.includes('everbright');
    }
    if (query.includes('汇丰') || query.includes('hsbc')) {
      return bName.includes('汇丰') || cName.includes('汇丰') || bEng.includes('hsbc');
    }
    if (query.includes('八达通') || query.includes('octopus')) {
      return cName.includes('八达通') || cName.includes('octopus');
    }
    if (query.includes('suica') || query.includes('西瓜卡')) {
      return cName.includes('suica');
    }
    if (query.includes('wise')) {
      return bName.includes('wise') || cName.includes('wise');
    }
    if (query.includes('apple')) {
      return bName.includes('apple') || cName.includes('apple');
    }
    if (query.includes('chase') || query.includes('摩根')) {
      return bName.includes('chase') || cName.includes('chase');
    }
    if (query.includes('amex') || query.includes('运通') || query.includes('american express')) {
      return bName.includes('american express') || cName.includes('amex') || cName.includes('运通');
    }
    return false;
  });

  if (matches.length === 0) {
    // General keyword search fallback
    matches = allCards.filter((c) => {
      const allText = `${c.name} ${c.issuerName} ${c.issuerEnglish} ${c.tags?.join(' ') || ''}`.toLowerCase();
      const words = query.split(/[\s·\-_()（）/]+/);
      return words.some((w) => w.length >= 2 && allText.includes(w));
    });
  }

  if (matches.length === 0) return undefined;

  // Prioritize matching card type
  if (category) {
    const targetType = isCredit ? 'Credit' : 'Debit';
    const sameType = matches.filter((c) => c.type.toLowerCase() === targetType.toLowerCase());
    if (sameType.length > 0) {
      matches = sameType;
    }
  }

  // Scoring by specific product keywords and explicit card tier
  let best = matches[0];
  let maxScore = -999;
  const keywords = [
    '金葵花', '一卡通', 'young', '经典', '白金', '世界', 'world', '财神', '黑色',
    '灵通', '牡丹', '星座', '环球', '飞龙',
    '龙卡', 'joy', '全球支付',
    '哔哩哔哩', 'bilibili', '无界', '长城', '星空',
    '太平洋', '得利',
    '万豪', '旅享家', '麦当劳',
    '山水', '悠然', '白鹭',
    '财富', '梵高', '市民', '普卡', '八达通', 'suica'
  ];

  const targetTier = (cardTier || '').toLowerCase();

  for (const c of matches) {
    let score = 0;
    const cName = c.name.toLowerCase();
    const cTier = (c.cardTier || '').toLowerCase();
    const cTags = (c.tags || []).join(' ').toLowerCase();

    // 1. General query keyword match
    for (const kw of keywords) {
      if (query.includes(kw) && cName.includes(kw)) {
        score += 15;
      }
    }

    // 2. High-precision Card Tier matching
    if (targetTier) {
      // Platinum (白金)
      if (targetTier.includes('白金') || targetTier.includes('platinum')) {
        if (cName.includes('白金') || cTier.includes('白金') || cTags.includes('platinum')) {
          score += 45;
        } else if (cName.includes('金卡') && !cName.includes('白金')) {
          score -= 20; // Ordinary gold card is not platinum
        }
      }
      // Black / Centurion / Infinite (黑金 / 黑卡 / 百夫长)
      else if (
        targetTier.includes('黑金') ||
        targetTier.includes('百夫长') ||
        targetTier.includes('无限') ||
        targetTier.includes('黑卡') ||
        targetTier.includes('centurion')
      ) {
        if (cName.includes('黑金') || cName.includes('百夫长') || cName.includes('无限') || cName.includes('黑卡') || cName.includes('black') || cTier.includes('黑')) {
          score += 50;
        }
      }
      // Diamond (钻石)
      else if (targetTier.includes('钻石') || targetTier.includes('diamond')) {
        if (cName.includes('钻石') || cTier.includes('钻石') || cTags.includes('diamond')) {
          score += 50;
        }
      }
      // VIP Banking (金葵花 / 理财金 / 沃德 / 财富)
      else if (targetTier.includes('金葵花') || targetTier.includes('理财金') || targetTier.includes('沃德') || targetTier.includes('财富') || targetTier.includes('贵宾')) {
        if (cName.includes('金葵花') || cName.includes('理财金') || cName.includes('沃德') || cName.includes('财富') || cName.includes('贵宾')) {
          score += 50;
        }
      }
      // Gold (金卡，不含白金)
      else if (targetTier.includes('金卡') || targetTier.includes('gold')) {
        if ((cName.includes('金卡') || cTier.includes('金卡') || cTags.includes('gold') || cName.includes('财神') || cName.includes('乐当家')) && !cName.includes('白金')) {
          score += 45;
        } else if (cName.includes('白金')) {
          score -= 15;
        }
      }
      // Standard / Young / Normal (普卡 / 标准 / 青年)
      else if (targetTier.includes('普卡') || targetTier.includes('标准') || targetTier.includes('young') || targetTier.includes('青年')) {
        if (cName.includes('普卡') || cName.includes('标准') || cName.includes('young') || cName.includes('灵通') || cName.includes('经典') || cTier.includes('标准')) {
          score += 40;
        } else if (cName.includes('白金') || cName.includes('黑金')) {
          score -= 20;
        }
      }
    }

    // Prefer official source slightly unless exact match
    if (c.source === 'cardentify') {
      score += 2;
    }
    if (score > maxScore) {
      maxScore = score;
      best = c;
    }
  }

  return best;
}

// Backwards-compatible best match returning CardFacePreset
export function matchBestCardentifyPreset(
  name: string,
  bankName?: string,
  category?: string,
  cardTier?: string
): CardFacePreset {
  const card = matchBestCardentifyCard(name, bankName, category, cardTier);
  if (card) {
    return cardentifyToPreset(card);
  }
  return CARDENTIFY_PRESETS[0];
}

// Countries metadata for Filter Tabs
export const COUNTRY_NAMES: Record<string, string> = {
  CN: '中国大陆',
  HK: '中国香港',
  TW: '中国台湾',
  US: '美国',
  JP: '日本',
  AU: '澳大利亚',
  GB: '英国',
  CA: '加拿大',
  SG: '新加坡',
  MO: '中国澳门',
  DE: '德国',
  RU: '俄罗斯',
  EE: '爱沙尼亚',
  IE: '爱尔兰',
  KZ: '哈萨克斯坦',
  MY: '马来西亚',
  PR: '波多黎各',
  GR: '希腊',
};
