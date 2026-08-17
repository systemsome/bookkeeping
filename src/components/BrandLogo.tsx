import React from 'react';

interface BrandLogoProps {
  type: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'solid' | 'transparent' | 'card-emboss';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  type,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-14 h-14 text-xl',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  switch (type.toLowerCase()) {
    case 'cmb':
      // China Merchants Bank (招商银行 - 招牌红葵花/几何LOGO)
      return (
        <div
          className={`${currentSize} rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="招商银行 China Merchants Bank"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7 3.13-7 7-7zm-4 4v6h2.5v-3.5L12 13l1.5-1.5V15H16V9h-2.5l-1.5 2-1.5-2H8z" />
          </svg>
        </div>
      );

    case 'icbc':
      // Industrial and Commercial Bank of China (中国工商银行 - 经典圆钱工字标)
      return (
        <div
          className={`${currentSize} rounded-xl bg-red-700 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="中国工商银行 ICBC"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M7 8h10v2.5H7zm0 5.5h10V16H7zm3.5-3.5h3v3.5h-3z" />
          </svg>
        </div>
      );

    case 'ccb':
      // China Construction Bank (中国建设银行 - 双C飞白标)
      return (
        <div
          className={`${currentSize} rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="中国建设银行 CCB"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6a6 6 0 0 0-6 6c0 3.31 2.69 6 6 6 2.2 0 4.12-1.19 5.16-2.95l-1.84-.9A3.98 3.98 0 0 1 12 16a4 4 0 0 1-4-4 4 4 0 0 1 4-4c1.47 0 2.74.8 3.32 1.95l1.84-.9A5.96 5.96 0 0 0 12 6z" />
          </svg>
        </div>
      );

    case 'abc':
      // Agricultural Bank of China (中国农业银行 - 麦穗铜钱标)
      return (
        <div
          className={`${currentSize} rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="中国农业银行 ABC"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 5v14M8.5 8.5l3.5-3.5 3.5 3.5M7.5 12l4.5-4.5 4.5 4.5M6.5 15.5l5.5-5.5 5.5 5.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'boc':
      // Bank of China (中国银行 - 天圆地方古钱标)
      return (
        <div
          className={`${currentSize} rounded-xl bg-red-700 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="中国银行 Bank of China"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="9" y="9" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 2.5v6.5M12 15v6.5" stroke="currentColor" strokeWidth="2.2" />
          </svg>
        </div>
      );

    case 'bocom':
      // Bank of Communications (交通银行 - 经典交行立体标)
      return (
        <div
          className={`${currentSize} rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="交通银行 BOCOM"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M12 3L3 9v12h18V9L12 3zm0 3.5l6 4v7.5H6v-7.5l6-4zm-3 7h6v2H9v-2z" />
          </svg>
        </div>
      );

    case 'mybank':
      // MYbank (网商银行 - 阿里巴巴蚂蚁集团旗下)
      return (
        <div
          className={`${currentSize} rounded-xl bg-[#0066cc] flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="网商银行 MYbank"
        >
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="font-black text-[9px] sm:text-[10px] tracking-tighter text-[#ff7a00]">MY</span>
            <span className="font-extrabold text-[7px] sm:text-[8px] tracking-tight">bank</span>
          </div>
        </div>
      );

    case 'webank':
      // WeBank (微众银行 - 腾讯旗下互联网银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-[#0052d9] flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="微众银行 WeBank"
        >
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="font-black text-[8px] sm:text-[9px] tracking-tight text-white">We</span>
            <span className="font-extrabold text-[7px] sm:text-[8px] tracking-tight text-sky-200">Bank</span>
          </div>
        </div>
      );

    case 'aibank':
      // aiBank (百信银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-gradient-to-r from-red-600 to-rose-700 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="百信银行 aiBank"
        >
          <span className="font-black tracking-tighter text-[9px] sm:text-[10px] leading-none">aiBank</span>
        </div>
      );

    case 'bob':
      // Bank of Beijing (北京银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-[#c8102e] flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="北京银行 Bank of Beijing"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">京行</span>
        </div>
      );

    case 'nbcb':
      // Bank of Ningbo (宁波银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="宁波银行 Bank of Ningbo"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">宁银</span>
        </div>
      );

    case 'bos':
      // Bank of Shanghai (上海银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-[#004b97] flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="上海银行 Bank of Shanghai"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">上行</span>
        </div>
      );

    case 'hxb':
      // Hua Xia Bank (华夏银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-red-700 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="华夏银行 HXB"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">华夏</span>
        </div>
      );

    case 'citic':
      // China CITIC Bank (中信银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="中信银行 CITIC"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">中信</span>
        </div>
      );

    case 'pingan':
      // Ping An Bank (平安银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="平安银行 Ping An"
        >
          <span className="font-black text-[10px] sm:text-[11px] leading-none">平安</span>
        </div>
      );

    case 'spdb':
      // SPDB (浦发银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-blue-800 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="浦发银行 SPDB"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">浦发</span>
        </div>
      );

    case 'psbc':
      // Postal Savings Bank of China (中国邮政储蓄银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-green-700 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="中国邮政储蓄银行 PSBC"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M3 5h18v14H3V5zm9 8.5L5.5 8h13L12 13.5zm-6.5-.5V17h13v-4l-6.5 4-6.5-4z" />
          </svg>
        </div>
      );

    case 'cmbc':
      // China Minsheng Bank (民生银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="中国民生银行 CMBC"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">民生</span>
        </div>
      );

    case 'ceb':
      // China Everbright Bank (光大银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="中国光大银行 CEB"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">光大</span>
        </div>
      );

    case 'cib':
      // Industrial Bank (兴业银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="兴业银行 CIB"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">兴业</span>
        </div>
      );

    case 'cgb':
      // China Guangfa Bank (广发银行)
      return (
        <div
          className={`${currentSize} rounded-xl bg-red-700 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="广发银行 CGB"
        >
          <span className="font-black tracking-tighter text-[10px] sm:text-[11px] leading-none">广发</span>
        </div>
      );

    case 'alipay':
      // Alipay (支付宝) - 官方标准 "支" 徽标矢量
      return (
        <div
          className={`${currentSize} rounded-xl bg-[#1677ff] flex items-center justify-center text-white shadow-xs p-1 shrink-0 overflow-hidden ${className}`}
          title="支付宝 Alipay"
        >
          <svg viewBox="0 0 16 16" className="w-full h-full" fill="none">
            <rect width="16" height="16" rx="2.5" fill="#ffffff" />
            <path
              d="M2.541 0H13.5a2.55 2.55 0 0 1 2.54 2.563v8.297c-.006 0-.531-.046-2.978-.813-.412-.14-.916-.327-1.479-.536q-.456-.17-.957-.353a13 13 0 0 0 1.325-3.373H8.822V4.649h3.831v-.634h-3.83V2.121H7.26c-.274 0-.274.273-.274.273v1.621H3.11v.634h3.875v1.136h-3.2v.634H9.99c-.227.789-.532 1.53-.894 2.202-2.013-.67-4.161-1.212-5.51-.878-.864.214-1.42.597-1.746.998-1.499 1.84-.424 4.633 2.741 4.633 1.872 0 3.675-1.053 5.072-2.787 2.08 1.008 6.37 2.738 6.387 2.745v.105A2.55 2.55 0 0 1 13.5 16H2.541A2.55 2.55 0 0 1 0 13.437V2.563A2.55 2.55 0 0 1 2.541 0"
              fill="#1677FF"
            />
            <path
              d="M2.309 9.27c-1.22 1.073-.49 3.034 1.978 3.034 1.434 0 2.868-.925 3.994-2.406-1.602-.789-2.959-1.353-4.425-1.207-.397.04-1.14.217-1.547.58Z"
              fill="#1677FF"
            />
          </svg>
        </div>
      );

    case 'huabei':
      // Ant Huabei (蚂蚁花呗) - 官方标准 "花" 专属字形与徽标
      return (
        <div
          className={`${currentSize} rounded-xl bg-gradient-to-br from-[#0091ff] via-[#0083ff] to-[#006bd6] flex items-center justify-center text-white shadow-xs p-1 shrink-0 select-none overflow-hidden ${className}`}
          title="蚂蚁花呗 Ant Huabei"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            {/* 艹字头横向笔画 */}
            <rect x="16" y="24" width="68" height="9" rx="4.5" />
            {/* 艹字头左竖 */}
            <rect x="32" y="14" width="9" height="22" rx="4.5" />
            {/* 艹字头右竖 */}
            <rect x="59" y="14" width="9" height="22" rx="4.5" />
            {/* 单人旁 撇 */}
            <path
              d="M 37 40 C 37 40 33 43 27 51 C 21 59 16 67 12 74 C 10 77.5 12 81 16 80 C 19.5 79 25 73.5 30 65 C 33.5 59.5 36.5 52 38 46 C 38.8 43 38.5 40.5 37 40 Z"
            />
            {/* 单人旁 竖 */}
            <rect x="27" y="55" width="9" height="31" rx="4.5" />
            {/* 匕首部 撇/横 */}
            <rect x="49" y="44" width="29" height="8.5" rx="4.25" />
            {/* 匕首部 竖弯钩 */}
            <path
              d="M 48 48 C 45 48 43 50.5 43 53.5 L 43 71 C 43 78.5 48.5 84 56 84 L 71 84 C 78.5 84 84 78.5 84 71 L 84 62 C 84 59.5 81.5 57.5 79 57.5 C 76.5 57.5 74.5 59.5 74.5 62 L 74.5 71 C 74.5 73.5 72.5 75.5 70 75.5 L 56.5 75.5 C 54 75.5 52 73.5 52 71 L 52 53.5 C 52 50.5 50.5 48 48 48 Z"
            />
          </svg>
        </div>
      );

    case 'wechat':
      // WeChat Pay (微信支付)
      return (
        <div
          className={`${currentSize} rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="微信支付 WeChat Pay"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M9.5 4C5.91 4 3 6.46 3 9.5c0 1.83 1.05 3.45 2.68 4.43l-.7 2.17 2.53-1.28c.62.18 1.29.28 1.99.28.2 0 .4-.01.6-.03C9.72 14.54 9.5 13.9 9.5 13.22c0-3.31 3.25-6 7.25-6 .34 0 .68.02 1.01.07C16.8 5.25 13.43 4 9.5 4zm-2.25 3.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm4.5 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM16.75 8.5c-3.45 0-6.25 2.24-6.25 5s2.8 5 6.25 5c.57 0 1.12-.07 1.64-.2l2.06 1.05-.57-1.76c1.33-.8 2.12-2.11 2.12-3.59 0-2.76-2.8-5-6.25-5zm-2 2.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
          </svg>
        </div>
      );

    case 'yuebao':
      // Yuebao (余额宝)
      return (
        <div
          className={`${currentSize} rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="余额宝 Yuebao"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
          </svg>
        </div>
      );

    case 'jd':
    case 'baitiao':
      // JD Finance & BaiTiao (京东金融 / 京东白条)
      return (
        <div
          className={`${currentSize} rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm p-0.5 shrink-0 ${className}`}
          title="京东金融 JD Finance"
        >
          <span className="font-black tracking-tight text-[11px] leading-none">JD</span>
        </div>
      );

    case 'applepay':
      // Apple Pay
      return (
        <div
          className={`${currentSize} rounded-xl bg-black flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="Apple Pay"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.73-.86 2.76 1.01.08 2.03-.51 2.57-1.26z" />
          </svg>
        </div>
      );

    case 'gold':
      // 24K Gold Ingot (黄金理财)
      return (
        <div
          className={`${currentSize} rounded-xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 flex items-center justify-center text-amber-950 shadow-sm p-1 shrink-0 ${className}`}
          title="黄金理财 24K Gold"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M4 8h16l-3 9H7L4 8zm2.4 2l1.7 5h7.8l1.7-5H6.4zM8 4h8v2H8V4z" />
          </svg>
        </div>
      );

    case 'fund':
      // Mutual Fund (公募基金)
      return (
        <div
          className={`${currentSize} rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="公募基金 Mutual Fund"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
          </svg>
        </div>
      );

    case 'cash':
      // Cash (现金)
      return (
        <div
          className={`${currentSize} rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="现金储蓄 Cash"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2zM12 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
          </svg>
        </div>
      );

    default:
      // Generic Bank Card Logo
      return (
        <div
          className={`${currentSize} rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-sm p-1 shrink-0 ${className}`}
          title="银行卡 / 金融账户"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        </div>
      );
  }
};

/**
 * HIGH-DEFINITION CARD NETWORK BADGES:
 * ALL TRANSPARENT BACKGROUNDS (No ugly opaque white/black boxes)
 * - 中国银联 (UnionPay) - 官方三色斜带 + 精准矢量书法中英文，全透明自然融合
 * - VISA - 经典透明矢量字体
 * - 万事达 (Mastercard) - 经典双相交红橙圆，全透明背景
 * - 美国运通 (AMEX) - 经典蓝白字标，透明融入
 * - JCB - 经典三色条字标，透明背景
 */
export const CardNetworkBadge: React.FC<{
  network?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ network = 'UNIONPAY', className = '', size = 'md' }) => {
  if (!network || network === 'NONE') return null;

  // 1. VISA (Authentic Official Vector Shape)
  if (network === 'VISA') {
    const svgWidth =
      size === 'sm' ? 'w-11 h-4' : size === 'lg' ? 'w-20 h-7' : 'w-14 h-5 sm:w-16 sm:h-5.5';
    return (
      <div
        className={`inline-flex items-center justify-center select-none ${className}`}
        title="VISA 国际卡组织"
      >
        <svg
          viewBox="0 7.8 24 8.5"
          className={`${svgWidth} drop-shadow-sm`}
          style={{ overflow: 'visible' }}
        >
          {/* Main Authentic VISA Wordmark */}
          <path
            d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
            fill="#FFFFFF"
          />
          {/* Classic Iconic Gold Wing on the top-left flick of the 'V' */}
          <path
            d="M0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338C4.5 11.8 3.5 10.5 2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479z"
            fill="#F7B600"
          />
        </svg>
      </div>
    );
  }

  // 2. 万事达 (Mastercard - Official Dual-Color Interlocking Vector Circles)
  if (network === 'MASTERCARD') {
    const svgWidth =
      size === 'sm' ? 'w-9 h-5.5' : size === 'lg' ? 'w-16 h-10' : 'w-12 h-7.5 sm:w-14 sm:h-8.5';
    return (
      <div
        className={`inline-flex items-center justify-center select-none ${className}`}
        title="Mastercard 万事达卡"
      >
        <svg
          viewBox="0 0 256 158"
          className={`${svgWidth} drop-shadow-md`}
          style={{ overflow: 'visible' }}
        >
          {/* Intersection Center Lens (Vibrant Orange) */}
          <rect
            fill="#FF5F00"
            x="93.298"
            y="16.903"
            width="69.15"
            height="124.251"
          />
          {/* Left Circle Body (Mastercard Red) */}
          <path
            d="M97.689 79.029C97.689 53.784 109.543 31.392 127.763 16.903 114.372 6.366 97.469 0 79.029 0 35.343 0 0 35.343 0 79.029s35.343 79.029 79.029 79.029c18.44 0 35.343-6.366 48.734-16.903C109.543 126.885 97.689 104.274 97.689 79.029z"
            fill="#EB001B"
          />
          {/* Right Circle Body (Mastercard Yellow-Orange) */}
          <path
            d="M255.746 79.029c0 43.685-35.343 79.029-79.029 79.029-18.44 0-35.343-6.366-48.734-16.903 18.44-14.489 30.075-36.88 30.075-62.126s-11.855-47.637-30.075-62.126C141.374 6.366 158.277 0 176.717 0c43.685 0 79.029 35.563 79.029 79.029z"
            fill="#F79E1B"
          />
        </svg>
      </div>
    );
  }

  // 3. 美国运通 (AMEX / American Express - Transparent Centered Badge)
  if (network === 'AMEX') {
    const dim = size === 'sm' ? 'h-4 px-1.5' : size === 'lg' ? 'h-6 px-2.5' : 'h-5 px-2';
    const textSz = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs' : 'text-[9px] sm:text-[10px]';
    return (
      <div
        className={`inline-flex items-center justify-center rounded-sm bg-[#006fcf] text-white select-none ${dim} shadow-xs border border-white/30 ${className}`}
        title="American Express 美国运通"
      >
        <span className={`font-black tracking-tighter uppercase font-sans ${textSz} leading-none`}>
          AMEX
        </span>
      </div>
    );
  }

  // 4. JCB (Transparent 3-Ribbon Clean Badge)
  if (network === 'JCB') {
    const height = size === 'sm' ? 'h-4' : size === 'lg' ? 'h-6' : 'h-5';
    return (
      <div
        className={`inline-flex items-center overflow-hidden rounded-[3px] select-none ${height} drop-shadow-sm ${className}`}
        title="JCB 国际卡组织"
      >
        <div className="flex items-center h-full space-x-[1px]">
          <div className="w-2.5 sm:w-3 h-full rounded-l-xs bg-[#003780] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-black text-white leading-none">J</span>
          </div>
          <div className="w-2.5 sm:w-3 h-full bg-[#dd1124] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-black text-white leading-none">C</span>
          </div>
          <div className="w-2.5 sm:w-3 h-full rounded-r-xs bg-[#008940] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-black text-white leading-none">B</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. 中国银联 (UnionPay) - 官方正规三色斜标 + 标准中英文字体 (全透明背景，高精矢量)
  const svgWidth = size === 'sm' ? 'w-11 h-5' : size === 'lg' ? 'w-18 h-8' : 'w-13 h-6 sm:w-15 sm:h-7';
  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      title="中国银联 UnionPay"
    >
      <svg
        viewBox="0 0 96 46"
        className={`${svgWidth} drop-shadow-sm`}
        style={{ overflow: 'visible' }}
      >
        {/* Three classic UnionPay skewed rounded color blocks (Red, Navy, Turquoise) */}
        <g transform="skewX(-14)">
          {/* Red Flag */}
          <rect x="22" y="2" width="22" height="42" rx="4" fill="#C8102E" />
          {/* Deep Blue Flag */}
          <rect x="42" y="2" width="22" height="42" rx="4" fill="#002F6C" />
          {/* Turquoise / Sky Blue Flag */}
          <rect x="62" y="2" width="22" height="42" rx="4" fill="#007B83" />
        </g>

        {/* Crisp Chinese calligraphy '银联' and modern 'UnionPay' */}
        {/* Silver/White Inscription over ribbons */}
        <text
          x="30"
          y="23"
          fill="#FFFFFF"
          fontSize="15"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          银联
        </text>
        <text
          x="26"
          y="36"
          fill="#FFFFFF"
          fontSize="8.5"
          fontWeight="800"
          fontStyle="italic"
          fontFamily="Arial, Helvetica, sans-serif"
          letterSpacing="0.2"
        >
          UnionPay
        </text>
      </svg>
    </div>
  );
};

/**
 * Realistic Gold EMV Smart Security Chip with contact lines
 */
export const EMVChip: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({
  className = '',
  size = 'md',
}) => {
  const chipDim = size === 'sm' ? 'w-8 h-6 rounded-md' : 'w-10 h-8 rounded-lg';
  return (
    <div
      className={`${chipDim} bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 border border-amber-500/70 shadow-inner relative overflow-hidden flex flex-col justify-between p-0.5 shrink-0 ${className}`}
      title="EMV 安全安全芯片 (ISO/IEC 7816)"
    >
      <div className="w-full h-px bg-amber-600/60 my-auto" />
      <div className="w-full h-px bg-amber-600/60 my-auto" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-amber-600/60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-2.5 rounded-xs border border-amber-600/70 bg-amber-200/40" />
    </div>
  );
};

/**
 * Contactless Radio Wave / NFC Icon
 */
export const ContactlessIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-2 opacity-85 ${className}`}
      title="非接触式 NFC 闪付感应"
    >
      <path d="M8.5 14.5A4.5 4.5 0 0 1 12 10a4.5 4.5 0 0 1 3.5 4.5" strokeLinecap="round" />
      <path d="M6 16.5A7.5 7.5 0 0 1 12 7a7.5 7.5 0 0 1 6 9.5" strokeLinecap="round" />
      <path d="M3.5 18.5A10.5 10.5 0 0 1 12 4a10.5 10.5 0 0 1 8.5 14.5" strokeLinecap="round" />
    </svg>
  );
};
