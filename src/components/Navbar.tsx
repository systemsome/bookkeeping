import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Eye,
  EyeOff,
  PlusCircle,
  Lock,
  LogOut,
  ShieldCheck,
  CreditCard,
  BarChart3,
  ListOrdered,
  Layers,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  FolderSync,
  Sun,
  Moon,
  Monitor,
  Check,
  Github,
  ExternalLink,
  FolderKanban,
  Cloud,
  CloudOff,
  RefreshCw,
  WifiOff,
  Heart,
  Palette,
} from 'lucide-react';
import { UserProfile, FinancialSummary, CloudSyncStatus } from '../types';
import { formatCurrency } from '../lib/formatters';
import { ThemeMode } from '../lib/theme';
import { getAllCardArtCards } from '../lib/cardArtSync';
import { getAllCardentifyCards } from '../lib/cardentifyPresets';
import { fetchDualGalleryStats } from '../lib/gallerySync';

interface NavbarProps {
  currentUser: UserProfile | null;
  summary: FinancialSummary;
  activeTab: 'overview' | 'accounts' | 'credit' | 'transactions' | 'projects' | 'analytics';
  setActiveTab: (tab: 'overview' | 'accounts' | 'credit' | 'transactions' | 'projects' | 'analytics') => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onOpenNewTx: () => void;
  onLockApp: () => void;
  onLogout: () => void;
  onOpenSecuritySettings: () => void;
  onOpenSyncModal: () => void;
  syncStatus?: CloudSyncStatus;
  lastSyncTime?: string;
  onTriggerFullSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  summary,
  activeTab,
  setActiveTab,
  privacyMode,
  setPrivacyMode,
  themeMode,
  onThemeChange,
  onOpenNewTx,
  onLockApp,
  onLogout,
  onOpenSecuritySettings,
  onOpenSyncModal,
  syncStatus = 'synced',
  lastSyncTime,
  onTriggerFullSync,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Auto-updating card counts for CardArt (https://cardart.cc/) & Cardentify (https://cards.no2.ac/)
  const [cardArtCount, setCardArtCount] = useState<number>(4414);
  const [cardentifyCount, setCardentifyCount] = useState<number>(655);

  useEffect(() => {
    const handleCountUpdate = (e?: any) => {
      if (e?.detail) {
        if (e.detail.cardArtCount) setCardArtCount(e.detail.cardArtCount);
        if (e.detail.cardentifyCount) setCardentifyCount(e.detail.cardentifyCount);
      } else {
        fetchDualGalleryStats()
          .then((stats) => {
            if (stats.cardartCount) setCardArtCount(stats.cardartCount);
            if (stats.cardentifyCount) setCardentifyCount(stats.cardentifyCount);
          })
          .catch(() => {});
      }
    };

    window.addEventListener('gallery-updated', handleCountUpdate);
    window.addEventListener('cardart-updated', handleCountUpdate);
    window.addEventListener('cardentify-updated', handleCountUpdate);

    // Initial fetch from live server stats
    handleCountUpdate();

    return () => {
      window.removeEventListener('gallery-updated', handleCountUpdate);
      window.removeEventListener('cardart-updated', handleCountUpdate);
      window.removeEventListener('cardentify-updated', handleCountUpdate);
    };
  }, []);

  // Refresh counts when user opens user menu
  useEffect(() => {
    if (showUserMenu) {
      fetchDualGalleryStats()
        .then((stats) => {
          if (stats.cardartCount) setCardArtCount(stats.cardartCount);
          if (stats.cardentifyCount) setCardentifyCount(stats.cardentifyCount);
        })
        .catch(() => {});
    }
  }, [showUserMenu]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-sm text-white font-bold text-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  资产管家
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  加密保护
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                个人极简资产管理系统
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-transparent p-0">
            <button
              id="nav-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-emerald-600 dark:after:bg-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              财务全览
            </button>
            <button
              id="nav-tab-credit"
              onClick={() => setActiveTab('credit')}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'credit'
                  ? 'text-blue-700 dark:text-blue-400 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-blue-600 dark:after:bg-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              信用卡
            </button>
            <button
              id="nav-tab-accounts"
              onClick={() => setActiveTab('accounts')}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'accounts'
                  ? 'text-purple-700 dark:text-purple-400 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-purple-600 dark:after:bg-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              资产账户
            </button>
            <button
              id="nav-tab-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-amber-700 dark:text-amber-400 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-amber-600 dark:after:bg-amber-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              记账本
            </button>
            <button
              id="nav-tab-projects"
              onClick={() => setActiveTab('projects')}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'text-indigo-700 dark:text-indigo-400 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-indigo-600 dark:after:bg-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              账本项目
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-teal-700 dark:text-teal-400 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-teal-600 dark:after:bg-teal-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              统计分析
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Real-time Cloud Sync Status Indicator & Manual Trigger */}
            <button
              id="btn-cloud-sync-status"
              onClick={onTriggerFullSync}
              disabled={syncStatus === 'syncing'}
              title={
                syncStatus === 'syncing'
                  ? '⚡ 正在毫秒级推送同步最新数据...'
                  : syncStatus === 'synced'
                  ? `⚡ 毫秒级多端实时同步中${lastSyncTime ? ` (${lastSyncTime})` : ''} · 随时修改随时更新`
                  : syncStatus === 'error'
                  ? '云端同步失败，连接异常 · 点击立即重新全量同步'
                  : '当前处于离线模式（数据保存在本地，点击尝试重连云端）'
              }
              aria-label="手动全量云端同步"
              className="relative p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
            >
              <RefreshCw
                className={`w-4 h-4 transition-transform duration-300 ${
                  syncStatus === 'syncing'
                    ? 'animate-spin text-indigo-600 dark:text-indigo-400'
                    : syncStatus === 'error'
                    ? 'text-rose-500 group-hover:rotate-180'
                    : syncStatus === 'offline'
                    ? 'text-slate-400'
                    : 'text-slate-600 dark:text-slate-300 group-hover:rotate-180 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                }`}
              />

              {/* Status indicator dot */}
              {syncStatus === 'syncing' && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              )}
              {syncStatus === 'synced' && (
                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-400" />
              )}
            </button>

            {/* Theme Switcher Button (明亮 / 暗黑 / 跟随系统) */}
            <div className="relative">
              <button
                id="btn-toggle-theme"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title={`当前外观: ${
                  themeMode === 'light' ? '明亮模式' : themeMode === 'dark' ? '暗黑模式' : '跟随系统'
                }`}
                className="p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center"
              >
                {themeMode === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {showThemeMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowThemeMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      外观主题切换
                    </div>
                    <button
                      onClick={() => {
                        onThemeChange('light');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 transition-colors ${
                        themeMode === 'light'
                          ? 'bg-slate-100 dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>明亮模式</span>
                      </div>
                      {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                    <button
                      onClick={() => {
                        onThemeChange('dark');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 transition-colors ${
                        themeMode === 'dark'
                          ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>暗黑模式</span>
                      </div>
                      {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                    <button
                      onClick={() => {
                        onThemeChange('system');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 transition-colors ${
                        themeMode === 'system'
                          ? 'bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>跟随系统</span>
                      </div>
                      {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Privacy Mode Toggle */}
            <button
              id="btn-toggle-privacy"
              onClick={() => setPrivacyMode(!privacyMode)}
              title={privacyMode ? '显示金额' : '隐藏敏感金额'}
              className="p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {privacyMode ? (
                <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            {/* GitHub Repository Link Button */}
            <a
              id="btn-github-repo"
              href="https://github.com/systemsome/bookkeeping"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub 源码仓库 (systemsome/bookkeeping)"
              aria-label="GitHub 源码仓库"
              className="p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center group"
            >
              <Github className="w-4 h-4 transition-transform group-hover:scale-110" />
            </a>

            {/* Quick Record CTA Button (透明背景，绿色图标) */}
            <button
              id="btn-quick-record"
              onClick={onOpenNewTx}
              title="记一笔"
              aria-label="记一笔"
              className="p-2 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all active:scale-95 flex items-center justify-center border border-slate-200 dark:border-slate-700"
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            {/* Quick Lock Button */}
            <button
              id="btn-quick-lock"
              onClick={onLockApp}
              title="立即锁定锁屏"
              className="p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors hidden sm:inline-flex"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="btn-user-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  {currentUser?.displayName?.[0] || '用'}
                </div>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 hidden lg:inline max-w-[100px] truncate">
                  {currentUser?.displayName || '我的账户'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {currentUser?.displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        @{currentUser?.username}
                      </p>
                    </div>

                    <button
                      id="menu-item-sync"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSyncModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-medium"
                    >
                      <FolderSync className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>多端同步与数据备份</span>
                    </button>

                    <button
                      id="menu-item-security"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSecuritySettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-medium"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>安全与数据设置</span>
                    </button>

                    <button
                      id="menu-item-lock"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLockApp();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-medium"
                    >
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>锁定屏幕 (PIN码)</span>
                    </button>

                    <a
                      id="menu-item-github"
                      href="https://github.com/systemsome/bookkeeping"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Github className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        <span>GitHub 开源仓库</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    {/* 开源生态鸣谢 / Acknowledgements */}
                    <div className="border-t border-slate-100 dark:border-slate-700/80 my-1" />
                    
                    <div className="px-3.5 pt-1.5 pb-0.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span>卡面生态特别鸣谢</span>
                        </span>
                        <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                          共 {(cardArtCount + cardentifyCount).toLocaleString()} 款
                        </span>
                      </div>
                    </div>

                    <a
                      id="menu-item-cardart"
                      href="https://cardart.cc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition-colors text-xs font-medium group"
                      title="鸣谢 CardArt (https://cardart.cc/) 创意卡面社区"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Palette className="w-3 h-3" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-semibold leading-tight flex items-center gap-1.5">
                            <span className="truncate">CardArt</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-medium shrink-0">
                              {cardArtCount > 0 ? `${cardArtCount.toLocaleString()}款` : '4,414款'}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">cardart.cc 创意卡面社区</p>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0 transition-colors ml-1" />
                    </a>

                    <a
                      id="menu-item-cardentify"
                      href="https://cards.no2.ac/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors text-xs font-medium group"
                      title="鸣谢 Cardentify (https://cards.no2.ac/) 高清银行卡面资料库"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-semibold leading-tight flex items-center gap-1.5">
                            <span className="truncate">Cardentify</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium shrink-0">
                              {cardentifyCount > 0 ? `${cardentifyCount.toLocaleString()}款` : '655款'}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">cards.no2.ac 高清卡面库</p>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors ml-1" />
                    </a>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                    <button
                      id="menu-item-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Navigation Bar (原生质感移动端底部导航栏) */}
        <nav
          id="mobile-bottom-dock"
          aria-label="移动端底部导航"
          className="fixed md:hidden bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg shadow-slate-950/10 flex items-center justify-around select-none"
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 transition-transform ${activeTab === 'overview' ? 'scale-110' : ''}`}>
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">全览</span>
          </button>

          <button
            onClick={() => setActiveTab('credit')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'credit'
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 transition-transform ${activeTab === 'credit' ? 'scale-110' : ''}`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">信用卡</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'accounts'
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 transition-transform ${activeTab === 'accounts' ? 'scale-110' : ''}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">资产卡包</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'transactions'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 transition-transform ${activeTab === 'transactions' ? 'scale-110' : ''}`}>
              <ListOrdered className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">记账本</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'projects'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 transition-transform ${activeTab === 'projects' ? 'scale-110' : ''}`}>
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">项目</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'analytics'
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1 transition-transform ${activeTab === 'analytics' ? 'scale-110' : ''}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">图表分析</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

