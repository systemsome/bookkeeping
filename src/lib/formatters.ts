/**
 * Format currency with Chinese Yuan ¥ symbol and thousands commas
 */
export const formatCurrency = (amount: number | undefined | null, privacyMode: boolean = false): string => {
  if (privacyMode) {
    return '¥ ****.**';
  }
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '¥ 0.00';
  }
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (amount: number | undefined | null, privacyMode: boolean = false): string => {
  if (privacyMode) {
    return '****';
  }
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00';
  }
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[0]}年${parts[1]}月${parts[2]}日`;
  }
  return dateStr;
};

export const getWeekdayName = (dateStr: string, format: 'short' | 'long' = 'short'): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return '';
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = date.getDay();
  const shortNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const longNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return format === 'long' ? longNames[day] : shortNames[day];
};

export const formatDateWithWeekday = (dateStr: string): string => {
  if (!dateStr) return '';
  return `${formatDate(dateStr)} ${getWeekdayName(dateStr, 'long')}`;
};

export const formatRelativeTime = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return dateStrOnly(date);
};

const dateStrOnly = (d: Date) => {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

/**
 * Sort transactions strictly chronologically by Date (YYYY-MM-DD) descending,
 * then Time (HH:mm) descending, then createdAt descending.
 */
export const sortTransactions = <T extends { date: string; time?: string; createdAt?: string }>(
  transactions: T[],
  order: 'desc' | 'asc' = 'desc'
): T[] => {
  return [...transactions].sort((a, b) => {
    // 1. Compare Date YYYY-MM-DD
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return order === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    }
    // 2. Compare Time HH:mm
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    if (timeA !== timeB) {
      return order === 'desc' ? timeB.localeCompare(timeA) : timeA.localeCompare(timeB);
    }
    // 3. Fallback to createdAt
    const createdA = a.createdAt || '';
    const createdB = b.createdAt || '';
    return order === 'desc' ? createdB.localeCompare(createdA) : createdA.localeCompare(createdB);
  });
};

