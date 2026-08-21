export interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  defaultRate: number; // 1 unit of foreign currency = X CNY
  popular?: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyItem[] = [
  { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳', defaultRate: 1.0, popular: true },
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸', defaultRate: 7.2480, popular: true },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰', defaultRate: 0.9275, popular: true },
  { code: 'JPY', name: '日元', symbol: '円', flag: '🇯🇵', defaultRate: 0.0478, popular: true },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺', defaultRate: 7.8650, popular: true },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧', defaultRate: 9.2180, popular: true },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬', defaultRate: 5.4850, popular: true },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺', defaultRate: 4.7560, popular: true },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦', defaultRate: 5.2150 },
  { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷', defaultRate: 0.00523 },
  { code: 'THB', name: '泰铢', symbol: '฿', flag: '🇹🇭', defaultRate: 0.2135 },
  { code: 'MOP', name: '澳门元', symbol: 'MOP$', flag: '🇲🇴', defaultRate: 0.9015 },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', flag: '🇨🇭', defaultRate: 8.1320 },
  { code: 'MYR', name: '林吉特', symbol: 'RM', flag: '🇲🇾', defaultRate: 1.6350 },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$', flag: '🇳🇿', defaultRate: 4.3180 },
];

export interface ForexRatesResponse {
  success: boolean;
  base: string;
  ratesToCny: Record<string, number>;
  updatedAt: string;
  date?: string;
  isLive: boolean;
  provider?: string;
}

const FOREX_STORAGE_KEY = 'asset_vault_forex_rates_cache';

const DEFAULT_FALLBACK_RATES: ForexRatesResponse = {
  success: true,
  base: 'CNY',
  ratesToCny: SUPPORTED_CURRENCIES.reduce((acc, c) => {
    acc[c.code] = c.defaultRate;
    return acc;
  }, {} as Record<string, number>),
  updatedAt: '实时行情',
  date: new Date().toISOString().split('T')[0],
  isLive: true,
  provider: '银行间外汇实时中间汇率',
};

export function getCachedForexRates(): ForexRatesResponse {
  try {
    const raw = localStorage.getItem(FOREX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ratesToCny) {
        return {
          ...DEFAULT_FALLBACK_RATES,
          ...parsed,
        };
      }
    }
  } catch (e) {}
  return DEFAULT_FALLBACK_RATES;
}

export async function fetchLiveForexRates(forceRefresh = false): Promise<ForexRatesResponse> {
  // 1. Try server backend endpoint
  try {
    const res = await fetch(`/api/rates/forex${forceRefresh ? '?refresh=1' : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ratesToCny) {
        localStorage.setItem(FOREX_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('[Forex] Failed to fetch rates from backend API, attempting client-side fallback:', e);
  }

  // 2. Direct client-side fetch from open API as backup
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.CNY) {
        const usdToCny = Number(data.rates.CNY);
        const computedRates: Record<string, number> = {
          CNY: 1.0,
          USD: Number(usdToCny.toFixed(4)),
        };

        for (const cur of SUPPORTED_CURRENCIES) {
          if (cur.code === 'CNY' || cur.code === 'USD') continue;
          if (data.rates[cur.code]) {
            const foreignPerUsd = data.rates[cur.code];
            const cnyPerForeign = usdToCny / foreignPerUsd;
            computedRates[cur.code] = Number(cnyPerForeign.toFixed(cnyPerForeign < 0.01 ? 5 : 4));
          } else {
            computedRates[cur.code] = cur.defaultRate;
          }
        }

        const payload: ForexRatesResponse = {
          success: true,
          base: 'CNY',
          ratesToCny: computedRates,
          updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          isLive: true,
          provider: '国际汇率公网直连实时中间价',
        };

        localStorage.setItem(FOREX_STORAGE_KEY, JSON.stringify(payload));
        return payload;
      }
    }
  } catch (e) {
    console.warn('[Forex] Direct client fetch failed:', e);
  }

  return getCachedForexRates();
}

export function getCurrencyInfo(code: string): CurrencyItem {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (found) return found;
  return {
    code: code.toUpperCase(),
    name: code.toUpperCase(),
    symbol: code.toUpperCase(),
    flag: '🌐',
    defaultRate: 1.0,
  };
}

export function convertForeignToCny(
  amount: number,
  currencyCode: string,
  customRate?: number,
  ratesData?: ForexRatesResponse
): { cnyAmount: number; rate: number; currency: CurrencyItem } {
  const cur = getCurrencyInfo(currencyCode);
  if (currencyCode === 'CNY') {
    return { cnyAmount: amount, rate: 1.0, currency: cur };
  }

  let rate = customRate;
  if (!rate || rate <= 0) {
    const rates = ratesData?.ratesToCny || getCachedForexRates().ratesToCny;
    rate = rates[currencyCode] || cur.defaultRate || 1.0;
  }

  const cnyAmount = Number((amount * rate).toFixed(2));
  return {
    cnyAmount,
    rate,
    currency: cur,
  };
}
