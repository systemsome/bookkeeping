import React, { useState } from 'react';
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
} from 'lucide-react';
import { UserProfile, FinancialSummary } from '../types';
import { formatCurrency } from '../lib/formatters';
import { ThemeMode } from '../lib/theme';

interface NavbarProps {
  currentUser: UserProfile | null;
  summary: FinancialSummary;
  activeTab: 'overview' | 'accounts' | 'credit' | 'transactions' | 'analytics';
  setActiveTab: (tab: 'overview' | 'accounts' | 'credit' | 'transactions' | 'analytics') => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onOpenNewTx: () => void;
  onLockApp: () => void;
  onLogout: () => void;
  onOpenSecuritySettings: () => void;
  onOpenSyncModal: () => void;
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
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

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
                全资产类别规整 · 信用卡额度与账单监控
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <button
              id="nav-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              财务全览
            </button>
            <button
              id="nav-tab-credit"
              onClick={() => setActiveTab('credit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'credit'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              信用卡
            </button>
            <button
              id="nav-tab-accounts"
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'accounts'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              资产账户
            </button>
            <button
              id="nav-tab-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <ListOrdered className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              记账流水与明细
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              统计分析
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Switcher Button (明亮 / 暗黑 / 跟随系统) */}
            <div className="relative">
              <button
                id="btn-toggle-theme"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title={`当前外观: ${
                  themeMode === 'light' ? '明亮模式' : themeMode === 'dark' ? '暗黑模式' : '跟随系统'
                }`}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center"
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
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {privacyMode ? (
                <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            {/* Quick Record CTA Button (Pure Icon Format: 顶部记一笔直接采用图标格式不再添加文字) */}
            <button
              id="btn-quick-record"
              onClick={onOpenNewTx}
              title="记一笔"
              aria-label="记一笔"
              className="p-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-emerald-400 dark:text-white shadow-xs transition-all active:scale-95 flex items-center justify-center border border-slate-800 dark:border-emerald-500/50"
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            {/* Quick Lock Button */}
            <button
              id="btn-quick-lock"
              onClick={onLockApp}
              title="立即锁定锁屏"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-colors hidden sm:inline-flex"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="btn-user-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
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
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95">
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

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 gap-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            财务全览
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'credit'
                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            信用卡
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'accounts'
                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            资产账户
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            流水明细
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            图表分析
          </button>
        </div>
      </div>
    </header>
  );
};

