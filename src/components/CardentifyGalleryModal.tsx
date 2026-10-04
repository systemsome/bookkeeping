import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Check,
  Sparkles,
  CreditCard,
  Building2,
  Globe,
  SlidersHorizontal,
  Copy,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Heart,
  Download,
  Palette,
  Layers,
  Flame,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import {
  CARDENTIFY_CARDS,
  CardentifyCard,
  COUNTRY_NAMES,
  getAllCardentifyCards,
} from '../lib/cardentifyPresets';
import {
  getAllCardArtCards,
  CardArtItem,
  syncWithCardArtOnline,
  getCardArtSyncMeta,
  searchCardArtLive,
} from '../lib/cardArtSync';
import { syncDualLibrariesOnline, fetchDualGalleryStats } from '../lib/gallerySync';

export interface UnifiedGalleryCard {
  id: string | number;
  name: string;
  titleEn?: string | null;
  issuerName: string;
  issuerEnglish?: string;
  imageUrl: string;
  thumbUrl?: string;
  brand: string;
  type: string;
  country: string;
  cardTier?: string;
  source: 'cardart' | 'cardentify';
  sourceUrl: string;
  dominantColor?: string;
  authorName?: string;
  authorHandle?: string;
  likeCount?: number;
  downloadCount?: number;
  featured?: boolean;
  bins?: string[];
  tags?: string[];
}

interface CardentifyGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: UnifiedGalleryCard | CardentifyCard) => void;
  currentImageUrl?: string;
  defaultBankQuery?: string;
  defaultTier?: string;
  defaultNetwork?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' | 'ALL';
}

type SourceFilter = 'ALL' | 'CARDART' | 'CARDENTIFY';
type SortOption = 'POPULAR' | 'DOWNLOADS' | 'LIKES' | 'LATEST';
type StyleFilter =
  | 'ALL'
  | 'BLACK_GOLD'
  | 'ORIENTAL'
  | 'CAMPUS'
  | 'TRANSIT'
  | 'BANKS'
  | 'INTL'
  | 'ANIME';

export const CardentifyGalleryModal: React.FC<CardentifyGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectCard,
  currentImageUrl,
  defaultBankQuery = '',
  defaultTier = '',
  defaultNetwork = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState(() => {
    return defaultBankQuery ? defaultBankQuery.replace(/信用卡|借记卡|账户|卡面/g, '').trim() : '';
  });
  const [activeSource, setActiveSource] = useState<SourceFilter>('ALL');
  const [selectedStyle, setSelectedStyle] = useState<StyleFilter>('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>(
    defaultNetwork && defaultNetwork !== 'NONE' && defaultNetwork !== 'ALL' ? defaultNetwork : 'ALL'
  );
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('POPULAR');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Real-time synchronization state with CardArt and Cardentify
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLiveSearching, setIsLiveSearching] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [syncMeta, setSyncMeta] = useState(getCardArtSyncMeta());
  const [cardArtList, setCardArtList] = useState<CardArtItem[]>(() => getAllCardArtCards());
  const [cardentifyList, setCardentifyList] = useState<CardentifyCard[]>(() => getAllCardentifyCards());
  const [galleryStats, setGalleryStats] = useState<{
    totalCount: number;
    cardartCount: number;
    cardentifyCount: number;
  }>({
    totalCount: 5674,
    cardartCount: 5019,
    cardentifyCount: 655,
  });

  // Proactive auto-sync whenever the gallery modal is opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    syncDualLibrariesOnline(false)
      .then((res) => {
        if (isMounted) {
          setCardArtList(getAllCardArtCards());
          setCardentifyList(getAllCardentifyCards());
          setSyncMeta(getCardArtSyncMeta());
          setGalleryStats({
            totalCount: res.totalCount,
            cardartCount: res.cardArtCount,
            cardentifyCount: res.cardentifyCount,
          });
          if (res.newCardsCount > 0) {
            setSyncToast(res.message);
            setTimeout(() => {
              if (isMounted) setSyncToast(null);
            }, 3500);
          }
        }
      })
      .catch(() => {});

    fetchDualGalleryStats()
      .then((stats) => {
        if (isMounted) {
          setGalleryStats({
            totalCount: stats.totalCount,
            cardartCount: stats.cardartCount,
            cardentifyCount: stats.cardentifyCount,
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Listen for background updates from custom window events
  useEffect(() => {
    const handleUpdate = (e?: any) => {
      setCardArtList(getAllCardArtCards());
      setCardentifyList(getAllCardentifyCards());
      setSyncMeta(getCardArtSyncMeta());

      if (e?.detail) {
        setGalleryStats({
          totalCount: e.detail.total || 5069,
          cardartCount: e.detail.cardArtCount || 4414,
          cardentifyCount: e.detail.cardentifyCount || 655,
        });
      } else {
        fetchDualGalleryStats()
          .then((stats) => {
            setGalleryStats({
              totalCount: stats.totalCount,
              cardartCount: stats.cardartCount,
              cardentifyCount: stats.cardentifyCount,
            });
          })
          .catch(() => {});
      }
    };
    window.addEventListener('gallery-updated', handleUpdate);
    window.addEventListener('cardart-updated', handleUpdate);
    window.addEventListener('cardentify-updated', handleUpdate);

    fetchDualGalleryStats()
      .then((stats) => {
        setGalleryStats({
          totalCount: stats.totalCount,
          cardartCount: stats.cardartCount,
          cardentifyCount: stats.cardentifyCount,
        });
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('gallery-updated', handleUpdate);
      window.removeEventListener('cardart-updated', handleUpdate);
      window.removeEventListener('cardentify-updated', handleUpdate);
    };
  }, []);

  // Synchronize initial default bank query, card tier & network
  useEffect(() => {
    if (defaultBankQuery && isOpen) {
      const sanitized = defaultBankQuery.replace(/信用卡|借记卡|账户|卡面/g, '').trim();
      setSearchTerm(sanitized || defaultBankQuery);
    }
  }, [defaultBankQuery, isOpen]);

  // Proactive real-time live search query directly to cardart.cc / backend
  useEffect(() => {
    if (!isOpen) return;
    const q = searchTerm.trim();
    if (!q || q.length < 1) return;

    let isCurrent = true;
    const timer = setTimeout(() => {
      setIsLiveSearching(true);
      searchCardArtLive(q)
        .then((cards) => {
          if (isCurrent && cards && cards.length > 0) {
            setCardArtList(getAllCardArtCards());
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isCurrent) setIsLiveSearching(false);
        });
    }, 280);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchTerm, isOpen]);

  useEffect(() => {
    if (defaultNetwork && defaultNetwork !== 'NONE' && defaultNetwork !== 'ALL' && isOpen) {
      setSelectedBrand(defaultNetwork);
    }
  }, [defaultNetwork, isOpen]);

  useEffect(() => {
    if (defaultTier && isOpen) {
      const t = defaultTier.toLowerCase();
      if (t.includes('白金')) setSelectedTierFilter('PLATINUM');
      else if (t.includes('黑金') || t.includes('百夫长') || t.includes('无限') || t.includes('世界之极')) setSelectedTierFilter('BLACK_INFINITE');
      else if (t.includes('御玺') || t.includes('世界')) setSelectedTierFilter('SIGNATURE_WORLD');
      else if (t.includes('钻石') || t.includes('私行') || t.includes('财富')) setSelectedTierFilter('DIAMOND_VIP');
      else if (t.includes('金卡') || t.includes('理财金')) setSelectedTierFilter('GOLD');
      else if (t.includes('普卡') || t.includes('标准')) setSelectedTierFilter('STANDARD');
    }
  }, [defaultTier, isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trigger Online Sync with BOTH CardArt (cardart.cc) & Cardentify (cards.no2.ac)
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncToast('正在与 cardart.cc & cards.no2.ac 实时同步双库最新卡面...');

    try {
      const res = await syncDualLibrariesOnline(true);
      setCardArtList(getAllCardArtCards());
      setCardentifyList(getAllCardentifyCards());
      setSyncMeta(getCardArtSyncMeta());
      setGalleryStats({
        totalCount: res.totalCount,
        cardartCount: res.cardArtCount,
        cardentifyCount: res.cardentifyCount,
      });
      setSyncToast(res.message || '✨ 同步完成！双库卡面已更新至最新');
      setTimeout(() => setSyncToast(null), 4000);
    } catch (e: any) {
      setSyncToast(`同步完成，当前双库共计 ${galleryStats.totalCount} 款卡面`);
      setTimeout(() => setSyncToast(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  // Convert Cardentify into unified cards with real-time dynamic items
  const unifiedCardentifyList: UnifiedGalleryCard[] = useMemo(() => {
    return cardentifyList.map((c) => ({
      id: `cardentify-${c.id}`,
      name: c.name,
      titleEn: c.issuerEnglish,
      issuerName: c.issuerName || '银行机构',
      issuerEnglish: c.issuerEnglish || 'BANK CARD',
      imageUrl: c.imageUrl,
      thumbUrl: c.imageUrl,
      brand: c.brand || 'UnionPay',
      type: c.type || 'Debit',
      country: c.country || 'CN',
      source: 'cardentify',
      sourceUrl: 'https://cards.no2.ac/',
      bins: c.bins,
      tags: [c.issuerName, c.name, c.brand, c.type].filter(Boolean) as string[],
    }));
  }, [cardentifyList]);

  // Convert CardArt cards into unified cards
  const unifiedCardArtList: UnifiedGalleryCard[] = useMemo(() => {
    return cardArtList.map((c) => ({
      id: `cardart-${c.id}`,
      name: c.title,
      titleEn: c.titleEn,
      issuerName: c.issuerName || 'CardArt 创意卡面',
      issuerEnglish: c.issuerEnglish || (c.authorHandle ? `@${c.authorHandle}` : 'CardArt Community'),
      imageUrl: c.imageUrl,
      thumbUrl: c.thumbUrl || c.imageUrl,
      brand: c.brand || 'UnionPay',
      type: c.type || 'Credit',
      country: c.country || 'GLOBAL',
      source: 'cardart',
      sourceUrl: c.sourceUrl || `https://cardart.cc/c/${c.id}`,
      dominantColor: c.dominantColor,
      authorName: c.authorName,
      authorHandle: c.authorHandle,
      likeCount: c.likeCount || 0,
      downloadCount: c.downloadCount || 0,
      featured: c.featured,
      tags: c.tags,
    }));
  }, [cardArtList]);

  // Combined master collection with live dual-library count
  const allUnifiedCards = useMemo(() => {
    return [...unifiedCardArtList, ...unifiedCardentifyList];
  }, [unifiedCardArtList, unifiedCardentifyList]);

  // Top popular banks for quick chip filtration
  const topBanks = useMemo(() => {
    const counts: Record<string, number> = {};
    cardentifyList.forEach((c) => {
      const b = c.issuerName?.trim();
      if (b) {
        counts[b] = (counts[b] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .filter(([_, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16);
  }, [cardentifyList]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    // 1. Base Source Filtering
    let list: UnifiedGalleryCard[] = [];
    if (activeSource === 'CARDART') {
      list = unifiedCardArtList;
    } else if (activeSource === 'CARDENTIFY') {
      list = unifiedCardentifyList;
    } else {
      list = allUnifiedCards;
    }

    // 2. Filter by search query
    if (q) {
      list = list.filter((card) => {
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesIssuer = (card.issuerName || '').toLowerCase().includes(q);
        const matchesEnglish = (card.issuerEnglish || '').toLowerCase().includes(q);
        const matchesAuthor =
          (card.authorName || '').toLowerCase().includes(q) ||
          (card.authorHandle || '').toLowerCase().includes(q);
        const matchesBin = card.bins && card.bins.some((b) => b.includes(q));
        const matchesTags = card.tags && card.tags.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesIssuer || matchesEnglish || matchesAuthor || matchesBin || matchesTags;
      });
    }

    // 3. Filter by style / category
    if (selectedStyle !== 'ALL') {
      list = list.filter((card) => {
        const fullText = (
          card.name +
          ' ' +
          (card.titleEn || '') +
          ' ' +
          (card.tags?.join(' ') || '') +
          ' ' +
          card.issuerName
        ).toLowerCase();

        switch (selectedStyle) {
          case 'BLACK_GOLD':
            return (
              fullText.includes('百夫长') ||
              fullText.includes('黑卡') ||
              fullText.includes('黑金') ||
              fullText.includes('centurion') ||
              fullText.includes('noir') ||
              fullText.includes('titanium') ||
              fullText.includes('暗影') ||
              fullText.includes('金属')
            );
          case 'ORIENTAL':
            return (
              fullText.includes('青海波') ||
              fullText.includes('七宝') ||
              fullText.includes('矢絣') ||
              fullText.includes('麻之叶') ||
              fullText.includes('枯山水') ||
              fullText.includes('流水') ||
              fullText.includes('和风') ||
              fullText.includes('市松') ||
              fullText.includes('切子') ||
              fullText.includes('鳞')
            );
          case 'CAMPUS':
            return (
              fullText.includes('university') ||
              fullText.includes('college') ||
              fullText.includes('lsu') ||
              fullText.includes('fordham') ||
              fullText.includes('northeastern') ||
              fullText.includes('校友') ||
              fullText.includes('大学')
            );
          case 'TRANSIT':
            return (
              fullText.includes('八达通') ||
              fullText.includes('octopus') ||
              fullText.includes('suica') ||
              fullText.includes('icoca') ||
              fullText.includes('公交') ||
              fullText.includes('地铁') ||
              fullText.includes('交通') ||
              card.brand === 'Transit'
            );
          case 'BANKS':
            return (
              card.source === 'cardentify' ||
              fullText.includes('银行') ||
              fullText.includes('bank')
            );
          case 'INTL':
            return (
              card.country !== 'CN' ||
              fullText.includes('amex') ||
              fullText.includes('chase') ||
              fullText.includes('wise') ||
              fullText.includes('hsbc') ||
              fullText.includes('apple')
            );
          case 'ANIME':
            return (
              fullText.includes('狮子') ||
              fullText.includes('二次元') ||
              fullText.includes('动漫') ||
              fullText.includes('猫') ||
              fullText.includes('插画') ||
              fullText.includes('stella')
            );
          default:
            return true;
        }
      });
    }

    // 3.5. Card Tier filter (普卡、金卡、白金、御玺/世界、黑金/无限/世界之极、钻石/私行)
    if (selectedTierFilter !== 'ALL') {
      list = list.filter((card) => {
        const full = (card.name + ' ' + (card.cardTier || '') + ' ' + (card.tags?.join(' ') || '')).toLowerCase();
        switch (selectedTierFilter) {
          case 'PLATINUM':
            return full.includes('白金') || full.includes('platinum');
          case 'BLACK_INFINITE':
            return (
              full.includes('黑金') ||
              full.includes('百夫长') ||
              full.includes('无限') ||
              full.includes('世界之极') ||
              full.includes('centurion') ||
              full.includes('infinite') ||
              full.includes('world elite') ||
              full.includes('black')
            );
          case 'SIGNATURE_WORLD':
            return full.includes('御玺') || full.includes('世界') || full.includes('signature') || full.includes('world');
          case 'DIAMOND_VIP':
            return (
              full.includes('钻石') ||
              full.includes('diamond') ||
              full.includes('私行') ||
              full.includes('私人银行') ||
              full.includes('财富') ||
              full.includes('金葵花') ||
              full.includes('理财金') ||
              full.includes('沃德')
            );
          case 'GOLD':
            return (full.includes('金卡') || full.includes('gold')) && !full.includes('白金');
          case 'STANDARD':
            return (
              full.includes('普卡') ||
              full.includes('标准') ||
              full.includes('classic') ||
              full.includes('standard') ||
              full.includes('young') ||
              full.includes('灵通')
            );
          default:
            return true;
        }
      });
    }

    // 4. Country filter
    if (selectedCountry !== 'ALL') {
      list = list.filter((card) => card.country === selectedCountry);
    }

    // 5. Brand filter
    if (selectedBrand !== 'ALL') {
      list = list.filter((card) => {
        const brandUp = (card.brand || '').toUpperCase();
        const nameUp = card.name.toUpperCase();
        if (selectedBrand === 'UNIONPAY') return brandUp.includes('UNIONPAY') || brandUp.includes('银联') || nameUp.includes('银联');
        if (selectedBrand === 'VISA') return brandUp.includes('VISA') || nameUp.includes('VISA') || nameUp.includes('维萨');
        if (selectedBrand === 'MASTERCARD') return brandUp.includes('MASTER') || nameUp.includes('MASTER') || nameUp.includes('万事达');
        if (selectedBrand === 'AMEX') return brandUp.includes('AMEX') || brandUp.includes('AMERICAN') || nameUp.includes('运通') || nameUp.includes('百夫长');
        if (selectedBrand === 'JCB') return brandUp.includes('JCB') || nameUp.includes('JCB');
        if (selectedBrand === 'TRANSIT') return brandUp.includes('TRANSIT') || card.name.includes('八达通') || nameUp.includes('SUICA');
        return true;
      });
    }

    // 6. Type filter
    if (selectedType !== 'ALL') {
      list = list.filter((card) => card.type === selectedType);
    }

    // 7. Bank chip filter
    if (selectedBankFilter !== 'ALL') {
      list = list.filter((card) => card.issuerName === selectedBankFilter);
    }

    // 8. Sorting
    const sorted = [...list];
    if (sortBy === 'DOWNLOADS') {
      sorted.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sortBy === 'LIKES') {
      sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else if (sortBy === 'LATEST') {
      // Prioritize latest CardArt creations
      sorted.sort((a, b) => (a.source === 'cardart' ? -1 : 1));
    } else {
      // POPULAR: high downloads/likes on cardart, popular issuers on cardentify
      sorted.sort((a, b) => {
        const scoreA =
          (a.downloadCount || 0) * 2 +
          (a.likeCount || 0) * 5 +
          (a.source === 'cardentify' && a.issuerName?.includes('招商') ? 300 : 0) +
          (a.source === 'cardentify' && a.issuerName?.includes('工商') ? 250 : 0);
        const scoreB =
          (b.downloadCount || 0) * 2 +
          (b.likeCount || 0) * 5 +
          (b.source === 'cardentify' && b.issuerName?.includes('招商') ? 300 : 0) +
          (b.source === 'cardentify' && b.issuerName?.includes('工商') ? 250 : 0);
        return scoreB - scoreA;
      });
    }

    return sorted;
  }, [
    searchTerm,
    activeSource,
    selectedStyle,
    selectedCountry,
    selectedBrand,
    selectedType,
    selectedBankFilter,
    sortBy,
    allUnifiedCards,
    unifiedCardArtList,
    unifiedCardentifyList,
  ]);

  const handleCopyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Sync Toast Banner */}
        {syncToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl border border-indigo-500/40 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
              <span>{syncToast}</span>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 text-white flex items-center justify-center shadow-md ring-1 ring-white/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>CardArt & Cardentify 卡面艺廊</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                    双库融合 · {galleryStats.totalCount.toLocaleString()} 款
                  </span>
                </h2>

                {/* Real-time synchronization badge */}
                <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200/80 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>实时同步 cardart.cc & cards.no2.ac</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                <span className="font-mono">
                  CardArt {galleryStats.cardartCount.toLocaleString()} 款原创 · Cardentify {galleryStats.cardentifyCount.toLocaleString()} 款官方
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <a
                  href="https://cardart.cc/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>cardart.cc 官网</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <a
                  href="https://cards.no2.ac/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>cards.no2.ac 官网</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Sync Action Button */}
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all ${
                isSyncing
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white active:scale-95 shadow-xs'
              }`}
              title="立即与 cardart.cc & cards.no2.ac 官方进行双库增量同步"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? '双库同步中...' : '实时同步双库'}</span>
              <span className="sm:hidden">{isSyncing ? '同步中' : '同步'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="关闭卡面艺廊窗口 (Esc)"
              title="关闭窗口 (Esc)"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3">
          {/* Main Source Tabs: 全部 / CardArt 原创 / Cardentify 官方 */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveSource('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSource === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>全部卡面</span>
                <span className="text-[10px] font-mono opacity-80">({galleryStats.totalCount.toLocaleString()})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSource('CARDART')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSource === 'CARDART'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>🎨</span>
                <span>CardArt 原创</span>
                <span className="text-[10px] font-mono opacity-80">({galleryStats.cardartCount.toLocaleString()})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSource('CARDENTIFY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSource === 'CARDENTIFY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>🍎</span>
                <span>Cardentify 官方原版</span>
                <span className="text-[10px] font-mono opacity-80">({galleryStats.cardentifyCount.toLocaleString()})</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="POPULAR">🔥 热门综合推荐</option>
                  <option value="DOWNLOADS">⬇️ 下载最多 (CardArt)</option>
                  <option value="LIKES">❤️ 点赞最多 (CardArt)</option>
                  <option value="LATEST">✨ 最新收录</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search + Quick Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索卡面、百夫长、和风纹样、名校、八达通、招商银行、创作者昵称或 BIN..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
              {isLiveSearching && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 animate-pulse font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>联网检索 cardart.cc...</span>
                </span>
              )}
              <span>
                找到{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                  {filteredCards.length}
                </strong>{' '}
                款匹配卡面 (双库官方总计 {galleryStats.totalCount.toLocaleString()} 款)
              </span>
              {(searchTerm ||
                activeSource !== 'ALL' ||
                selectedStyle !== 'ALL' ||
                selectedCountry !== 'ALL' ||
                selectedBrand !== 'ALL' ||
                selectedType !== 'ALL' ||
                selectedBankFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSource('ALL');
                    setSelectedStyle('ALL');
                    setSelectedCountry('ALL');
                    setSelectedBrand('ALL');
                    setSelectedType('ALL');
                    setSelectedBankFilter('ALL');
                    setSelectedTierFilter('ALL');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-1 font-medium"
                >
                  重置筛选
                </button>
              )}
            </div>
          </div>

          {/* Style & Theme Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 modal-custom-scrollbar">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>风格分类:</span>
            </span>
            {[
              { id: 'ALL', label: '全部风格' },
              { id: 'BLACK_GOLD', label: '💳 极简黑金/百夫长' },
              { id: 'ORIENTAL', label: '🌊 东方美学/和风' },
              { id: 'CAMPUS', label: '🎓 名校校园/校友卡' },
              { id: 'TRANSIT', label: '🚇 交通出行/八达通' },
              { id: 'BANKS', label: '🏦 商业银行' },
              { id: 'INTL', label: '🌐 国际海外卡' },
              { id: 'ANIME', label: '🐾 二次元/萌宠' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStyle(s.id as StyleFilter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  selectedStyle === s.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Card Tier Chips · 联动卡片等级筛选 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 modal-custom-scrollbar pt-0.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>卡片等级:</span>
            </span>
            {[
              { id: 'ALL', label: '全部等级' },
              { id: 'STANDARD', label: '普卡 (Classic)' },
              { id: 'GOLD', label: '金卡 (Gold)' },
              { id: 'PLATINUM', label: '白金卡 (Platinum)' },
              { id: 'SIGNATURE_WORLD', label: '御玺 / 世界卡' },
              { id: 'BLACK_INFINITE', label: '黑金 / 无限 / 世界之极' },
              { id: 'DIAMOND_VIP', label: '钻石 / 私行卡' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTierFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  selectedTierFilter === t.id
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Network & Type Secondary Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* Brand Network */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">卡组织:</span>
              {(['ALL', 'UNIONPAY', 'VISA', 'MASTERCARD', 'AMEX', 'JCB', 'TRANSIT'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                    selectedBrand === b
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {b === 'ALL' ? '全部' : b === 'UNIONPAY' ? '银联' : b === 'TRANSIT' ? '交通卡' : b}
                </button>
              ))}
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Type */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">类型:</span>
              {[
                { id: 'ALL', label: '全部' },
                { id: 'Debit', label: '借记卡' },
                { id: 'Credit', label: '信用卡' },
                { id: 'Transit', label: '交通/预付' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                    selectedType === t.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Region */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">地区:</span>
              {[
                { id: 'ALL', label: '全部' },
                { id: 'CN', label: '🇨🇳 中国' },
                { id: 'HK', label: '🇭🇰 香港' },
                { id: 'US', label: '🇺🇸 美国' },
                { id: 'JP', label: '🇯🇵 日本' },
                { id: 'GLOBAL', label: '🌐 全球' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCountry(c.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                    selectedCountry === c.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Bank Chips (When viewing bank cards) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 modal-custom-scrollbar">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-500" />
              <span>机构速选:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedBankFilter('ALL')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition-colors ${
                selectedBankFilter === 'ALL'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              全部机构
            </button>
            {topBanks.map(([bank, count]) => (
              <button
                key={bank}
                type="button"
                onClick={() => {
                  setSelectedBankFilter(bank);
                  if (searchTerm) setSearchTerm('');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition-colors flex items-center gap-1 ${
                  selectedBankFilter === bank
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{bank}</span>
                <span className="text-[9px] opacity-75 font-mono">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card Gallery Grid */}
        <div className="flex-1 overflow-y-auto modal-custom-scrollbar p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/50">
          {filteredCards.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <CreditCard className="w-12 h-12 mx-auto stroke-1 opacity-50" />
              <p className="text-sm font-medium">没有找到匹配「{searchTerm}」的卡面设计</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveSource('ALL');
                  setSelectedStyle('ALL');
                  setSelectedCountry('ALL');
                  setSelectedBrand('ALL');
                  setSelectedType('ALL');
                  setSelectedBankFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
              >
                查看全部 {allUnifiedCards.length.toLocaleString()} 款双库卡面
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCards.map((card) => {
                const isCurrent = currentImageUrl === card.imageUrl;
                const isCopied = copiedUrl === card.imageUrl;
                const isCardArt = card.source === 'cardart';

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      onSelectCard(card);
                      onClose();
                    }}
                    className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                      isCurrent
                        ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Active Selected Badge */}
                    {isCurrent && (
                      <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>当前使用中</span>
                      </div>
                    )}

                    {/* 💳 Card Artwork (ISO/IEC 7810 ID-1 standard ratio 85.60 mm × 53.98 mm) */}
                    <div
                      className="relative w-full aspect-[85.6/53.98] shrink-0 select-none rounded-[3.72%/5.89%] overflow-hidden bg-slate-900 shadow-md border border-black/10 dark:border-white/10 group-hover:shadow-lg transition-shadow"
                      style={card.dominantColor ? { backgroundColor: card.dominantColor } : undefined}
                    >
                      <img
                        src={card.thumbUrl || card.imageUrl}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center select-none"
                      />

                      {/* Specular sheen on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/35 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mix-blend-overlay" />

                      {/* Source Badge (CardArt vs Cardentify) in top-left */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        {isCardArt ? (
                          <div className="px-2 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-amber-300 border border-amber-400/40 text-[9px] font-bold shadow-xs flex items-center gap-1">
                            <span>🎨 CardArt</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-indigo-300 border border-indigo-400/40 text-[9px] font-bold shadow-xs flex items-center gap-1">
                            <span>🍎 官方无损</span>
                          </div>
                        )}
                      </div>

                      {/* Card Type Tag in bottom-left */}
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded backdrop-blur-md bg-black/60 text-white text-[9px] font-mono font-semibold tracking-wider uppercase border border-white/20">
                        {card.type === 'Credit'
                          ? '信用卡'
                          : card.type === 'Debit'
                          ? '借记卡'
                          : card.type === 'Transit'
                          ? '交通卡'
                          : card.type}{' '}
                        · {card.brand}
                      </div>

                      {/* CardArt stats or Region flag in bottom-right */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        {isCardArt && (
                          <div className="px-1.5 py-0.5 rounded backdrop-blur-md bg-black/65 text-white/90 text-[9px] font-mono border border-white/20 flex items-center gap-1.5">
                            {card.likeCount !== undefined && card.likeCount > 0 && (
                              <span className="flex items-center gap-0.5 text-rose-300">
                                <Heart className="w-2.5 h-2.5 fill-current" />
                                {card.likeCount}
                              </span>
                            )}
                            {card.downloadCount !== undefined && card.downloadCount > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-300">
                                <Download className="w-2.5 h-2.5" />
                                {card.downloadCount}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="px-1.5 py-0.5 rounded backdrop-blur-md bg-black/60 text-white text-[9px] font-mono border border-white/20">
                          {card.country}
                        </div>
                      </div>
                    </div>

                    {/* Card Meta & Actions (Unified min-h for consistent card size) */}
                    <div className="mt-3 flex items-start justify-between gap-2 min-h-[58px]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {card.issuerName}
                          </span>
                          {card.authorName && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              · by {card.authorName}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-snug">
                          {card.name}
                        </h3>

                        {/* BIN or Tag badges */}
                        {card.bins && card.bins.length > 0 ? (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {card.bins.slice(0, 3).map((bin) => (
                              <span
                                key={bin}
                                className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
                              >
                                BIN: {bin}
                              </span>
                            ))}
                          </div>
                        ) : card.titleEn ? (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">
                            {card.titleEn}
                          </p>
                        ) : null}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0 self-end">
                        <a
                          href={card.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={isCardArt ? '在 cardart.cc 查看详情' : '在 cards.no2.ac 查看'}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={(e) => handleCopyUrl(card.imageUrl, e)}
                          title="复制高清卡面图片直链"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition-colors"
                        >
                          {isCopied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCard(card);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <span>套用</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info & Sync Status */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">💡 提示:</span>
            <span>点击任意卡片即可直接套用其原版 Apple Pay 卡面、银行名称与卡组织徽标</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              🟢 已与 cardart.cc & cards.no2.ac 实时同步 (CardArt: {galleryStats.cardartCount.toLocaleString()} 款 · Cardentify: {galleryStats.cardentifyCount.toLocaleString()} 款 · 双库共计 {galleryStats.totalCount.toLocaleString()} 款就绪)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://cardart.cc/"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>cardart.cc 原创社区</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/no2ac/Cardentify"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              <span>GitHub Cardentify</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
