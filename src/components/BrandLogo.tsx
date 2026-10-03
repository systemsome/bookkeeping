import React, { useState } from 'react';
import { matchLogoHubBank } from '../lib/logohubData';

export interface BrandLogoProps {
  type: string;
  logoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * 官方标准级银行与金融机构正版矢量LOGO
 * 优先调用 https://logohub.afengblog.com/ 官方正版矢量库数据
 * 内置高保真离线矢量兜底
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  type,
  logoUrl,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const brandKey = (type || '').toLowerCase().trim();

  // 🏦 优先使用来源于 https://logohub.afengblog.com/ 的正版矢量 SVG
  const yuebaoOfficialUrl = 'https://logohub.afengblog.com/logos/library/svglogo/pay/yuebao.svg';
  const effectiveLogoUrl = !imgError
    ? (logoUrl || (brandKey === 'yuebao' || brandKey === 'yuebaobao' ? yuebaoOfficialUrl : matchLogoHubBank(type)?.logoUrl))
    : null;
  if (effectiveLogoUrl) {
    return (
      <div
        className={`${currentSize} aspect-square rounded-full bg-white flex items-center justify-center p-0.5 shadow-2xs shrink-0 select-none overflow-hidden border border-slate-100/90 ${className}`}
        title={type || '银行徽标'}
      >
        <img
          src={effectiveLogoUrl}
          alt={type || 'Bank Logo'}
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  switch (brandKey) {
    // 1. 招商银行 (CMB) - 招商银行经典C-M-B飞帆标
    case 'cmb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#E11922] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="招商银行 China Merchants Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            {/* 招行标志性外圈C形环弧 */}
            <path
              d="M 79 25 A 39 39 0 1 0 79 75"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 招行稳健M字双峰造型 */}
            <path
              d="M 27 68 L 38 30 L 50 48 L 62 30 L 73 68"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 基底横线（与M结合构成B字寓意） */}
            <line
              x1="20"
              y1="70"
              x2="80"
              y2="70"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 底部速度平行射线 */}
            <line
              x1="32"
              y1="80"
              x2="68"
              y2="80"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    // 2. 中国工商银行 (ICBC) - 工字方圆古钱标
    case 'icbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C7000B] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国工商银行 ICBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M50 8C26.8 8 8 26.8 8 50s18.8 42 42 42 42-18.8 42-42S73.2 8 50 8zm0 8c18.78 0 34 15.22 34 34S68.78 84 50 84 16 68.78 16 50s15.22-34 34-34zm-22 17v8h44v-8H28zm14 13v12h16V46H42zm-14 17v8h44v-8H28z" />
          </svg>
        </div>
      );

    // 3. 中国建设银行 (CCB) - 双C飞白龙鼎标
    case 'ccb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#0054A6] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国建设银行 CCB"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M50 25c-13.8 0-25 11.2-25 25s11.2 25 25 25c9.2 0 17.2-5 21.5-12.3l-7.7-3.8C60.4 63.8 55.6 67 50 67c-9.4 0-17-7.6-17-17s7.6-17 17-17c5.6 0 10.4 3.2 13.8 8.1l7.7-3.8C67.2 30 59.2 25 50 25z" />
          </svg>
        </div>
      );

    // 4. 中国农业银行 (ABC) - 麦穗铜钱标
    case 'abc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#00897B] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国农业银行 ABC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-white fill-none stroke-[7]" strokeLinecap="round">
            <circle cx="50" cy="50" r="41" strokeWidth="8" />
            <line x1="50" y1="20" x2="50" y2="80" strokeWidth="8" />
            <path d="M35 35 L50 20 L65 35" strokeWidth="7" />
            <path d="M30 50 L50 35 L70 50" strokeWidth="7" />
            <path d="M26 65 L50 50 L74 65" strokeWidth="7" />
          </svg>
        </div>
      );

    // 5. 中国银行 (BOC) - 天圆地方古钱标
    case 'boc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#B20015] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国银行 Bank of China"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <rect x="36" y="36" width="28" height="28" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <line x1="50" y1="8" x2="50" y2="36" stroke="#FFFFFF" strokeWidth="9" />
            <line x1="50" y1="64" x2="50" y2="92" stroke="#FFFFFF" strokeWidth="9" />
          </svg>
        </div>
      );

    // 6. 交通银行 (BOCOM) - 经典立体交标
    case 'bocom':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#002B66] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="交通银行 BOCOM"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M50 12 L14 36 L14 84 L86 84 L86 36 Z M50 28 L72 44 L72 72 L28 72 L28 44 Z M38 52 L62 52 L62 62 L38 62 Z" />
          </svg>
        </div>
      );

    // 7. 中国邮政储蓄银行 (PSBC) - 绿色经典邮雁标
    case 'psbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#007A3D] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国邮政储蓄银行 PSBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M22 34 L78 34 L50 56 Z M20 40 L48 62 L20 74 Z M80 40 L52 62 L80 74 Z M26 76 L74 76 L50 65 Z" />
          </svg>
        </div>
      );

    // 8. 中信银行 (CITIC) - 红色方印双窗标
    case 'citic':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#DB0011] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中信银行 China CITIC Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <rect x="18" y="18" width="64" height="64" rx="8" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <rect x="32" y="32" width="16" height="36" rx="2" fill="#FFFFFF" />
            <rect x="52" y="32" width="16" height="36" rx="2" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 9. 中国光大银行 (CEB) - 紫色光芒S纽带标
    case 'ceb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#671E75] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国光大银行 China Everbright Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M35 34 C35 26 44 22 53 22 C64 22 70 28 68 36 C66 44 50 46 44 52 C38 58 40 68 50 68 C58 68 64 64 66 58 L74 62 C70 72 61 78 49 78 C35 78 28 68 32 56 C35 46 50 43 56 38 C60 34 58 30 52 30 C46 30 43 33 42 37 Z" />
          </svg>
        </div>
      );

    // 10. 华夏银行 (HXB) - 红色玉龙玉佩C形标
    case 'hxb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#CD0000] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="华夏银行 Hua Xia Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C30 85 15 70 15 50 C15 30 30 15 50 15 Z M50 27 C37 27 27 37 27 50 C27 63 37 73 50 73 C60 73 68 66 71 58 L81 64 C76 77 64 85 50 85" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 11. 中国民生银行 (CMBC) - 蓝绿渐变民生帆标
    case 'cmbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#007078] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国民生银行 CMBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M16 80 L50 20 L84 80 L62 80 L50 56 L38 80 Z M50 38 L58 54 L42 54 Z" />
          </svg>
        </div>
      );

    // 12. 广发银行 (CGB) - 红色现代折角标
    case 'cgb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C60000] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="广发银行 China Guangfa Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <polygon points="50,28 72,42 72,60 50,72 28,60 28,42" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 13. 平安银行 (PINGAN / PAB) - 橙红相间平安方印标
    case 'pingan':
    case 'pab':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#EA5404] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="平安银行 Ping An Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <rect x="18" y="18" width="64" height="64" rx="14" fill="#FFFFFF" />
            <rect x="25" y="25" width="22" height="22" rx="4" fill="#EA5404" />
            <rect x="53" y="25" width="22" height="22" rx="4" fill="#EA5404" />
            <rect x="25" y="53" width="22" height="22" rx="4" fill="#EA5404" />
            <circle cx="64" cy="64" r="11" fill="#EA5404" />
          </svg>
        </div>
      );

    // 14. 浦发银行 (SPDB) - 蓝色极简SPD聚合标
    case 'spdb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#0C326E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="浦发银行 SPDB"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M30 35 L48 35 C58 35 64 41 64 50 C64 59 58 65 48 65 L30 65 Z M42 45 L42 55 L48 55 C52 55 54 53 54 50 C54 47 52 45 48 45 Z" />
          </svg>
        </div>
      );

    // 15. 兴业银行 (CIB) - 科技深蓝太极环标
    case 'cib':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#004A97] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="兴业银行 Industrial Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M50 18 A32 32 0 0 1 82 50 A16 16 0 0 1 50 50 A16 16 0 0 0 18 50 A32 32 0 0 1 50 18 Z" fill="#FFFFFF" />
            <circle cx="50" cy="34" r="5" fill="#004A97" />
            <circle cx="50" cy="66" r="5" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 16. 浙商银行 (CZB) - 红色正方鼎标
    case 'czb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C9151E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="浙商银行 China Zheshang Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M34 36 L66 36 L44 64 L66 64" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    // 17. 宁波银行 (NBCB) - 温暖金橙汇通标
    case 'nbcb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#F58220] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="宁波银行 Bank of Ningbo"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M28 70 L28 30 L45 56 L45 30 M55 70 L55 30 L72 56 L72 30" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
          </svg>
        </div>
      );

    // 18. 北京银行 (BOB) - 经典京韵红标
    case 'bob':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C8102E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="北京银行 Bank of Beijing"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <rect x="34" y="30" width="32" height="40" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="7" />
            <line x1="34" y1="50" x2="66" y2="50" stroke="#FFFFFF" strokeWidth="7" />
          </svg>
        </div>
      );

    // 19. 上海银行 (BOS) - 经典海韵蓝标
    case 'bos':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#004B97] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="上海银行 Bank of Shanghai"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M28 50 C28 35 40 28 50 28 C62 28 72 36 72 48 C72 62 58 64 50 68 C44 71 38 74 38 80 L72 80" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </div>
      );

    // 20. 江苏银行 (JSB) - 金辉融汇J标
    case 'jsb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#D4AF37] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="江苏银行 Bank of Jiangsu"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-[#1A1A1A]" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="#D4AF37" />
            <path d="M56 25 L56 60 C56 68 50 74 40 74 C32 74 26 68 26 60 L36 60 C36 63 38 66 41 66 C44 66 46 64 46 60 L46 25 Z" fill="#1A1A1A" />
          </svg>
        </div>
      );

    // 21. 汇丰银行 (HSBC) - 经典六角红白菱形标
    case 'hsbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="汇丰银行 HSBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <polygon points="50,15 85,50 50,85 15,50" fill="#DB0011" />
            <polygon points="50,15 15,50 15,15" fill="#DB0011" />
            <polygon points="50,85 85,50 85,85" fill="#DB0011" />
            <polygon points="50,15 85,15 85,50" fill="#FFFFFF" />
            <polygon points="15,50 15,85 50,85" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 22. 渣打银行 (SCB) - 经典双螺旋蓝绿标
    case 'scb':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="渣打银行 Standard Chartered"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <path d="M30 20 C18 32 18 52 30 64 L50 84 C62 72 62 52 50 40 Z" fill="#0072CE" />
            <path d="M70 20 C82 32 82 52 70 64 L50 84 C38 72 38 52 50 40 Z" fill="#00A54F" />
          </svg>
        </div>
      );

    // 23. 花旗银行 (CITI) - 经典红蓝弧拱标
    case 'citi':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#003B70] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="花旗银行 Citibank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <path d="M35 30 C50 15 65 15 80 30" fill="none" stroke="#ED1B2D" strokeWidth="8" strokeLinecap="round" />
            <text x="50" y="68" fill="#FFFFFF" fontSize="30" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">citi</text>
          </svg>
        </div>
      );

    // 24. 浙江网商银行 (MYBANK) - 阿里蚂蚁互联网银行
    case 'mybank':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#0066CC] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="网商银行 MYbank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <rect width="100" height="100" rx="50" fill="#0066CC" />
            <text x="35" y="48" fill="#FF7A00" fontSize="28" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">MY</text>
            <text x="50" y="78" fill="#FFFFFF" fontSize="24" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">bank</text>
          </svg>
        </div>
      );

    // 25. 微众银行 (WEBANK) - 官方正版矢量标 (来自 https://www.bootstrapmb.com/icon/VNNjq2VNNj-10)
    case 'webank':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-0.5 shadow-2xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="微众银行 WeBank"
        >
          <svg viewBox="-208 -208 1434 1434" className="w-full h-full" aria-hidden="true">
            <path d="M920.22784 483.43552c-8.448-0.29696-40.9856 9.08288-51.82976 11.2896-17.39264 3.56864-34.82624 7.20384-52.21888 10.57792-88.00768 17.11616-194.8416 28.72832-285.25568 28.80512-18.13504 0.01536-45.21984-2.04288-62.01856-0.32768-9.98912 12.93312-19.79904 24.84736-29.12768 40.064-28.1856 45.9008-46.7968 92.25216-54.62016 148.49536-7.1424 51.79904-3.05152 130.87744 18.5856 178.29376 8.17664 17.88416 25.8048 39.33696 23.46496 44.33408-9.0368 8.6528-27.25888 2.51904-38.93248-0.57856-78.3872-20.79232-159.93344-67.28704-190.63296-148.18304-34.90816-92.06784 3.52256-186.27584 48.92672-265.18016 5.92384-10.29632 13.24544-20.09088 18.19648-29.6448-4.27008-2.90816-33.54624-11.7248-42.01984-15.0528-6.88128-2.7136-12.94848-5.25824-20.12672-8.22272-6.28224-2.62144-12.59008-6.784-19.61472-8.22272-42.40384 55.20896-79.91808 145.41312-91.5968 217.66144-11.23328 69.52448 2.81088 128.02048 38.3744 185.12384 12.73856 20.5056 29.5424 37.20192 33.72032 43.79648-10.368 7.69024-110.35648 32.87552-60.9024 59.81696 40.48384 22.03648 167.66976 30.61248 216.29952 33.77152 123.19232 8.00256 260.57216 14.81728 382.45376 0.49152 48.4864-5.69344 124.96384-17.60256 156.13952-43.57632 26.94144-22.46656 3.584-43.97568-6.5792-68.50048-26.01472-62.75072 14.14144-186.32192 33.4592-249.78432 15.34976-50.36032 29.39904-109.4912 35.85536-165.248zM253.1072 324.64384c8.6528 0.54784 27.2384 6.72768 37.69856 8.87296 11.64288 2.40128 27.56096 6.80448 39.29088 7.424-8.79616-30.52032-10.78272-50.37568 2.58048-83.73248 28.15488-70.23104 93.81888-116.5312 178.51392-120.41728 63.89248-2.93376 110.1824 26.83392 130.77504 68.46976 24.50432 49.59232 10.66496 108.28288-19.67616 152.45312 24.26368 0.384 56.15616-3.69152 80.6912-6.31296a1509.12 1509.12 0 0 0 78.17728-10.5216c49.75616-7.9872 98.88768-18.29888 145.50528-30.99648-7.37792-48.02048-9.60512-73.27232-28.33408-119.54688-13.89568-34.4064-32.29696-65.13664-56.86272-91.01824-44.21632-46.61248-114.50368-84.56192-204.65664-92.38016-157.17376-13.6192-298.4704 49.19296-365.14304 186.76736-4.53632 9.39008-6.99392 18.2272-10.99264 27.10016-24.6528 0.33792-44.32896 0.89088-65.22368 8.66816-44.94848 16.75776-49.34144 49.93024 3.91168 75.66848 16.34816 7.90016 52.6848 18.86208 53.74464 19.50208z" fill="#040000" />
            <path d="M622.28992 357.71392c-46.7968 4.35712-106.14784 2.58048-153.11872-0.2816-24.18688-1.46432-48.3072-3.24608-72.13056-6.25152-16.59392-2.10432-53.34016-5.49376-66.944-10.24-11.72992-0.61952-27.64288-5.02272-39.29088-7.424-10.46016-2.14528-29.04576-8.32512-37.69856-8.87296-2.8416 4.63872-7.19872 9.73312-10.7264 14.82752-11.34592 16.37376-20.98176 34.59584-29.21984 52.25984-11.55584 24.83712-21.39648 50.88256-30.16704 78.14656 7.02464 1.43872 13.33248 5.60128 19.61472 8.22272 7.17312 2.96448 13.24544 5.51424 20.12672 8.22272 8.4736 3.33312 37.74976 12.14976 42.01984 15.0528l47.08864 11.61216c33.51552 7.83872 68.30592 12.61056 102.58944 16.12288 6.16448 0.62464 53.22752 3.2768 54.47168 4.66944 16.79872-1.7152 43.88352 0.34304 62.01856 0.32768 90.41408-0.0768 197.24288-11.68896 285.25568-28.80512 17.39264-3.3792 34.82624-7.00928 52.21888-10.57792 10.84416-2.20672 43.38176-11.58656 51.82976-11.2896 12.14464-53.5808 25.90208-119.1424 6.43072-173.54752-46.61248 12.6976-95.74912 23.00928-145.50528 30.99648a1513.9584 1513.9584 0 0 1-78.17728 10.5216c-24.52992 2.61632-56.4224 6.69184-80.68608 6.30784z" fill="#D10C18" />
            <path d="M451.59424 213.14048c-60.53888 8.1664-48.62464 97.2288 11.59168 89.83552 22.36928-2.74432 41.66656-24.07936 38.70208-50.28864-2.6368-23.1424-24.30464-43.05408-50.29376-39.54688z" fill="#040000" />
          </svg>
        </div>
      );

    // 26. 百信银行 (AIBANK) - 百度中信AI银行
    case 'aibank':
      return (
        <div
          className={`${currentSize} aspect-square rounded-full bg-white flex items-center justify-center p-0.5 shadow-2xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="百信银行 aiBank"
        >
          <svg viewBox="0 0 1024 1024" className="w-full h-full" aria-hidden="true">
            <rect x="134" y="134" width="756" height="756" rx="378" fill="#E11922" />
            <text x="512" y="585" fill="#FFFFFF" fontSize="205" fontWeight="900" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" textAnchor="middle" letterSpacing="-5">aiBank</text>
            <circle cx="365" cy="430" r="28" fill="#FFD200" />
          </svg>
        </div>
      );

    // 27. 支付宝 (ALIPAY) - 官方正版矢量标
    case 'alipay':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#1677FF] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="支付宝 Alipay"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M16 10 C12.7 10 10 12.7 10 16 L10 84 C10 87.3 12.7 90 16 90 L84 90 C87.3 90 90 87.3 90 84 L90 16 C90 12.7 87.3 10 84 10 Z" fill="#1677FF" />
            <path d="M22 34 L78 34 M22 46 L78 46 M50 20 L50 46 M32 60 C40 54 46 48 50 46 C56 54 66 64 78 72 M30 76 C42 76 56 68 62 58" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    // 28. 蚂蚁花呗 (HUABEI)
    case 'huabei':
      return (
        <div
          className={`${currentSize} rounded-full bg-gradient-to-br from-[#00A3FF] to-[#0066DB] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="蚂蚁花呗 Ant Huabei"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            {/* 艹字头 */}
            <rect x="18" y="24" width="64" height="8" rx="4" />
            <rect x="34" y="16" width="8" height="20" rx="4" />
            <rect x="58" y="16" width="8" height="20" rx="4" />
            {/* 单人旁 */}
            <path d="M38 40 C32 48 24 58 16 68" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" fill="none" />
            <rect x="28" y="52" width="8" height="30" rx="4" />
            {/* 匕字底 */}
            <path d="M48 46 L74 46 M48 46 L48 70 C48 76 52 80 58 80 L72 80 C78 80 82 76 82 70" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    // 29. 微信支付 (WECHAT) - 官方翡翠绿双气泡
    case 'wechat':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#07C160] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="微信支付 WeChat Pay"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M42 22 C25 22 12 33 12 47 C12 55 17 62 25 67 L21 78 L33 72 C36 73 39 73 42 73 C42 72 42 70 42 68 C42 53 56 41 72 41 C73 41 75 41 76 41 C73 30 59 22 42 22 Z M32 36 A5 5 0 1 1 32 46 A5 5 0 1 1 32 36 Z M52 36 A5 5 0 1 1 52 46 A5 5 0 1 1 52 36 Z" />
            <path d="M70 44 C56 44 45 53 45 65 C45 71 49 77 55 81 L52 90 L61 86 C64 87 67 87 70 87 C84 87 95 77 95 65 C95 53 84 44 70 44 Z M62 55 A4 4 0 1 1 62 63 A4 4 0 1 1 62 55 Z M78 55 A4 4 0 1 1 78 63 A4 4 0 1 1 78 55 Z" />
          </svg>
        </div>
      );

    // 30. 京东金融 / 京东白条 (JD / BAITIAO)
    case 'jd':
    case 'baitiao':
    case 'jd_finance':
    case 'jd_baitiao':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#E1251B] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="京东金融 JD Finance"
        >
          <span className="font-black text-[10px] sm:text-xs text-white tracking-tighter">JD</span>
        </div>
      );

    // 31. 余额宝 (YUEBAO)
    case 'yuebao':
    case 'yuebaobao':
      return (
        <div
          className={`${currentSize} rounded-full bg-gradient-to-tr from-[#FF5B00] to-[#FF7A00] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="余额宝 Yuebao"
        >
          <svg viewBox="0 0 60 60" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M30.247 14.3c-13.671 0-24.754 10.836-24.754 24.55 0 13.713 11.083 18.405 24.754 18.405C43.917 57.255 55 52.563 55 38.849S43.917 14.301 30.247 14.301m9.487 20.653A1.65 1.65 0 0 1 38.09 36.6h-5.37a.41.41 0 0 0-.413.411v2.9h5.78a1.645 1.645 0 0 1 1.646 1.647v.836a1.65 1.65 0 0 1-1.646 1.647h-5.37a.416.416 0 0 0-.418.417v3.716a1.647 1.647 0 0 1-1.646 1.648h-.832a1.64 1.64 0 0 1-1.646-1.648v-3.716a.416.416 0 0 0-.397-.417h-5.37a1.645 1.645 0 0 1-1.646-1.647v-.836a1.65 1.65 0 0 1 1.646-1.647h5.778v-2.892a.41.41 0 0 0-.408-.414h-5.37a1.645 1.645 0 0 1-1.646-1.647v-.836a1.65 1.65 0 0 1 1.646-1.644h4.921l-5.1-5.106a1.65 1.65 0 0 1 0-2.335l.584-.586a1.65 1.65 0 0 1 2.333 0l4.809 4.815a.416.416 0 0 0 .585 0l4.811-4.818a1.65 1.65 0 0 1 2.333 0l.586.586a1.65 1.65 0 0 1 0 2.335l-5.102 5.106h4.924a1.645 1.645 0 0 1 1.646 1.647zm-9.487-22.298c5.37 0 8.843-1.795 10.792-3.859 1.098-1.287 1.023-2.937-.343-3.926-2.073-1.497-6.054-2.126-10.45-2.126-4.394 0-8.376.63-10.448 2.126-1.367.989-1.442 2.639-.344 3.926 1.949 2.064 5.423 3.86 10.793 3.86" fill="currentColor"/>
          </svg>
        </div>
      );

    // 32. 苹果支付 (APPLEPAY)
    case 'applepay':
      return (
        <div
          className={`${currentSize} rounded-full bg-black flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="Apple Pay"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M68 50 C68 41 76 36 76 36 C72 30 65 29 63 29 C57 28 51 32 48 32 C45 32 40 28 35 29 C27 29 19 35 15 44 C8 58 13 78 20 88 C24 93 28 99 34 99 C39 99 41 96 47 96 C53 96 55 99 61 99 C66 99 70 94 74 88 C78 82 80 77 80 76 C80 76 68 71 68 50 Z M56 21 C59 17 61 12 60 7 C55 7 50 10 47 14 C44 18 42 23 43 28 C49 28 53 25 56 21 Z" />
          </svg>
        </div>
      );

    // 33. 云闪付 (UNIONPAY APP)
    case 'unionpay_app':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C8102E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="云闪付 UnionPay App"
        >
          <span className="font-bold text-[8px] sm:text-[9px] text-white tracking-tighter">云闪付</span>
        </div>
      );

    // 34. 黄金积存金 (GOLD)
    case 'gold':
      return (
        <div
          className={`${currentSize} rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-amber-950 font-bold ${className}`}
          title="黄金理财 24K Gold"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M4 8h16l-3 9H7L4 8zm2.4 2l1.7 5h7.8l1.7-5H6.4zM8 4h8v2H8V4z" />
          </svg>
        </div>
      );

    // 35. 公募基金 (FUND)
    case 'fund':
      return (
        <div
          className={`${currentSize} rounded-full bg-purple-600 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="公募基金 Mutual Fund"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
          </svg>
        </div>
      );

    // 36. 现金储备 (CASH)
    case 'cash':
      return (
        <div
          className={`${currentSize} rounded-full bg-emerald-600 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="现金备用金 Cash"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2zM12 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
          </svg>
        </div>
      );

    // 37. 借出款项 (RECEIVABLE)
    case 'receivable':
      return (
        <div
          className={`${currentSize} rounded-full bg-cyan-600 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="借出款项 (债权待收)"
        >
          <span className="font-medium text-[8px] sm:text-[9px]">待收</span>
        </div>
      );

    // 38. 借入款项 (PAYABLE)
    case 'payable':
      return (
        <div
          className={`${currentSize} rounded-full bg-purple-700 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="借入款项 (债务待还)"
        >
          <span className="font-medium text-[8px] sm:text-[9px]">待还</span>
        </div>
      );

    // 通用银行卡缺省
    default:
      return (
        <div
          className={`${currentSize} rounded-full bg-slate-800 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="银行卡账户"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        </div>
      );
  }
};

/**
 * 国际主流卡组织徽标：
 * - 中国银联 (UnionPay) - 官方正版红蓝青三色斜带 + 优雅矢量银联中英文字体
 * - VISA - 经典矢量字标 + 左上翼金光弧
 * - 万事达 (Mastercard) - 双色正圆交错
 * - 美国运通 (AMEX) - 经典运通蓝白居中标
 * - JCB - 经典三色圆角条标
 * 全透明背景，严格保留在卡面右上角展示
 */
export const CardNetworkBadge: React.FC<{
  network?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ network = 'UNIONPAY', className = '', size = 'md' }) => {
  if (!network || network === 'NONE') return null;

  // 1. VISA
  if (network === 'VISA') {
    const dim =
      size === 'sm' ? 'w-10 h-3.5' : size === 'lg' ? 'w-16 h-5.5' : 'w-12 h-4 sm:w-14 sm:h-4.5';
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        title="VISA 国际卡组织"
      >
        <svg
          viewBox="0 7.8 24 8.5"
          className={`${dim} drop-shadow-sm`}
          style={{ overflow: 'visible' }}
        >
          <path
            d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
            fill="#FFFFFF"
          />
          <path
            d="M0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338C4.5 11.8 3.5 10.5 2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479z"
            fill="#F7B600"
          />
        </svg>
      </div>
    );
  }

  // 2. 万事达 (Mastercard)
  if (network === 'MASTERCARD') {
    const dim =
      size === 'sm' ? 'w-8 h-5' : size === 'lg' ? 'w-14 h-9' : 'w-11 h-7 sm:w-12 sm:h-7.5';
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        title="Mastercard 万事达卡"
      >
        <svg
          viewBox="0 0 256 158"
          className={`${dim} drop-shadow-md`}
          style={{ overflow: 'visible' }}
        >
          <rect fill="#FF5F00" x="93.298" y="16.903" width="69.15" height="124.251" />
          <path
            d="M97.689 79.029C97.689 53.784 109.543 31.392 127.763 16.903 114.372 6.366 97.469 0 79.029 0 35.343 0 0 35.343 0 79.029s35.343 79.029 79.029 79.029c18.44 0 35.343-6.366 48.734-16.903C109.543 126.885 97.689 104.274 97.689 79.029z"
            fill="#EB001B"
          />
          <path
            d="M255.746 79.029c0 43.685-35.343 79.029-79.029 79.029-18.44 0-35.343-6.366-48.734-16.903 18.44-14.489 30.075-36.88 30.075-62.126s-11.855-47.637-30.075-62.126C141.374 6.366 158.277 0 176.717 0c43.685 0 79.029 35.563 79.029 79.029z"
            fill="#F79E1B"
          />
        </svg>
      </div>
    );
  }

  // 3. 美国运通 (AMEX)
  if (network === 'AMEX') {
    const dim = size === 'sm' ? 'h-3.5 px-1.5' : size === 'lg' ? 'h-5.5 px-2.5' : 'h-4.5 px-2';
    return (
      <div
        className={`inline-flex items-center justify-center rounded-[3px] bg-[#006FCF] text-white select-none ${dim} shadow-xs border border-white/30 shrink-0 ${className}`}
        title="American Express 美国运通"
      >
        <span className="font-medium tracking-tight uppercase text-[9px] sm:text-[10px] leading-none">
          AMEX
        </span>
      </div>
    );
  }

  // 4. JCB
  if (network === 'JCB') {
    const height = size === 'sm' ? 'h-3.5' : size === 'lg' ? 'h-5.5' : 'h-4.5';
    return (
      <div
        className={`inline-flex items-center overflow-hidden rounded-[3px] select-none ${height} drop-shadow-sm shrink-0 ${className}`}
        title="JCB 国际卡组织"
      >
        <div className="flex items-center h-full space-x-[1px]">
          <div className="w-2.5 sm:w-3 h-full rounded-l-xs bg-[#003780] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-medium text-white leading-none">J</span>
          </div>
          <div className="w-2.5 sm:w-3 h-full bg-[#DD1124] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-medium text-white leading-none">C</span>
          </div>
          <div className="w-2.5 sm:w-3 h-full rounded-r-xs bg-[#008940] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-medium text-white leading-none">B</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. 中国银联 (UNIONPAY) - 官方正版矢量规范
  const dim = size === 'sm' ? 'w-10 h-4.5' : size === 'lg' ? 'w-16 h-7' : 'w-12 h-5 sm:w-14 sm:h-6';
  return (
    <div
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      title="中国银联 UnionPay"
    >
      <svg
        viewBox="0 0 96 46"
        className={`${dim} drop-shadow-sm`}
        style={{ overflow: 'visible' }}
      >
        <g transform="skewX(-14)">
          <rect x="22" y="2" width="22" height="42" rx="3.5" fill="#C8102E" />
          <rect x="42" y="2" width="22" height="42" rx="3.5" fill="#002F6C" />
          <rect x="62" y="2" width="22" height="42" rx="3.5" fill="#007B83" />
        </g>
        <text
          x="30"
          y="23"
          fill="#FFFFFF"
          fontSize="14.5"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.4"
        >
          银联
        </text>
        <text
          x="26"
          y="36"
          fill="#FFFFFF"
          fontSize="8"
          fontWeight="600"
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
 * 仿真智能 EMV 芯片 (ISO/IEC 7816)
 */
export const EMVChip: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({
  className = '',
  size = 'md',
}) => {
  const chipDim = size === 'sm' ? 'w-7 h-5 rounded-md' : 'w-9 h-6.5 rounded-lg';
  return (
    <div
      className={`${chipDim} bg-gradient-to-tr from-amber-300 via-yellow-100 to-amber-400 border border-amber-500/70 shadow-inner relative overflow-hidden flex flex-col justify-between p-0.5 shrink-0 select-none ${className}`}
      title="EMV 智能防伪安全芯片"
    >
      <div className="w-full h-px bg-amber-600/50 my-auto" />
      <div className="w-full h-px bg-amber-600/50 my-auto" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-amber-600/50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-2 rounded-xs border border-amber-600/60 bg-amber-200/40" />
    </div>
  );
};

/**
 * 非接触式无线感应射频波 (Contactless NFC)
 */
export const ContactlessIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 fill-none stroke-current stroke-[1.8] opacity-75 shrink-0 ${className}`}
      title="NFC 非接触式无线感应"
      aria-hidden="true"
    >
      <path d="M8.5 14.5A4.5 4.5 0 0 1 12 10a4.5 4.5 0 0 1 3.5 4.5" strokeLinecap="round" />
      <path d="M6 16.5A7.5 7.5 0 0 1 12 7a7.5 7.5 0 0 1 6 9.5" strokeLinecap="round" />
      <path d="M3.5 18.5A10.5 10.5 0 0 1 12 4a10.5 10.5 0 0 1 8.5 14.5" strokeLinecap="round" />
    </svg>
  );
};
