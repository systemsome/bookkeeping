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
} from 'lucide-react';
import { UserProfile, FinancialSummary } from '../types';
import { formatCurrency } from '../lib/formatters';

interface NavbarProps {
  currentUser: UserProfile | null;
  summary: FinancialSummary;
  activeTab: 'overview' | 'accounts' | 'credit' | 'transactions' | 'analytics';
  setActiveTab: (tab: 'overview' | 'accounts' | 'credit' | 'transactions' | 'analytics') => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
  onOpenNewTx: () => void;
  onLockApp: () => void;
  onLogout: () => void;
  onOpenSecuritySettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  summary,
  activeTab,
  setActiveTab,
  privacyMode,
  setPrivacyMode,
  onOpenNewTx,
  onLockApp,
  onLogout,
  onOpenSecuritySettings,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-sm text-white font-bold text-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                  资产记账管家
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  加密保护
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                全资产类别规整 · 信用卡额度与账单监控
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
            <button
              id="nav-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              财务全览
            </button>
            <button
              id="nav-tab-credit"
              onClick={() => setActiveTab('credit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'credit'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              信用卡
            </button>
            <button
              id="nav-tab-accounts"
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'accounts'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Wallet className="w-4 h-4 text-purple-600" />
              资产账户
            </button>
            <button
              id="nav-tab-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ListOrdered className="w-4 h-4 text-amber-600" />
              记账明细
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-600" />
              统计分析
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Privacy Mode Toggle */}
            <button
              id="btn-toggle-privacy"
              onClick={() => setPrivacyMode(!privacyMode)}
              title={privacyMode ? '显示金额' : '隐藏敏感金额'}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              {privacyMode ? (
                <EyeOff className="w-4 h-4 text-amber-600" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            {/* Quick Record CTA Button */}
            <button
              id="btn-quick-record"
              onClick={onOpenNewTx}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>记一笔</span>
            </button>

            {/* Quick Lock Button */}
            <button
              id="btn-quick-lock"
              onClick={onLockApp}
              title="立即锁定锁屏"
              className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors hidden sm:inline-flex"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="btn-user-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  {currentUser?.displayName?.[0] || '用'}
                </div>
                <span className="text-xs font-medium text-slate-800 hidden lg:inline max-w-[100px] truncate">
                  {currentUser?.displayName || '我的账户'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">
                        {currentUser?.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        @{currentUser?.username}
                      </p>
                    </div>

                    <button
                      id="menu-item-security"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSecuritySettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-medium"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      <span>安全与数据设置</span>
                    </button>

                    <button
                      id="menu-item-lock"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLockApp();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-medium"
                    >
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>锁定屏幕 (PIN码)</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      id="menu-item-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-medium"
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
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-100 gap-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            财务全览
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'credit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            信用卡
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'accounts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            资产账户
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'transactions' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            流水明细
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            图表分析
          </button>
        </div>
      </div>
    </header>
  );
};
