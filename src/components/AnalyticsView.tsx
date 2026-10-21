import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Coins,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  CheckCircle2,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { FinancialAccount, Transaction, FinancialSummary } from '../types';
import { formatCurrency } from '../lib/formatters';
import {
  fetchLiveGoldRate,
  getCachedGoldRate,
  GoldMarketRate,
} from '../lib/goldRates';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsViewProps {
  accounts?: FinancialAccount[];
  transactions?: Transaction[];
  summary: FinancialSummary;
  privacyMode: boolean;
  onSyncGoldAccountsValuation?: (newPrice: number) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  accounts = [],
  transactions = [],
  summary,
  privacyMode,
  onSyncGoldAccountsValuation,
}) => {
  // Live Gold Rate State
  const [liveGoldRate, setLiveGoldRate] = useState<GoldMarketRate>(() => getCachedGoldRate());
  const [isRefreshingGold, setIsRefreshingGold] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string>('');
  // 消费支出分类排行榜显示条数状态 (默认显示前 15 条)
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  // Fetch live market gold rates on mount
  useEffect(() => {
    let mounted = true;
    fetchLiveGoldRate().then((rate) => {
      if (mounted) {
        setLiveGoldRate(rate);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleManualRefreshGold = async () => {
    setIsRefreshingGold(true);
    try {
      const rate = await fetchLiveGoldRate(true);
      setLiveGoldRate(rate);
      setCalcUnitPrice(rate.priceRmbGram.toString());
      setSyncFeedback(`✨ 已成功刷新最新现货金价行情 (¥${rate.priceRmbGram}/g)`);
      setTimeout(() => setSyncFeedback(''), 3500);
    } catch (e) {
      setSyncFeedback('刷新失败，请检查网络连接');
      setTimeout(() => setSyncFeedback(''), 3500);
    } finally {
      setIsRefreshingGold(false);
    }
  };

  // Actual User Gold Accounts
  const userGoldAccounts = useMemo(() => {
    return (accounts || []).filter((a) => a.category === 'GOLD');
  }, [accounts]);

  const userTotalGoldGrams = useMemo(() => {
    return (userGoldAccounts || []).reduce((acc, a) => {
      const g = a.goldGrams || (a.balance && a.goldUnitPrice ? a.balance / a.goldUnitPrice : 0) || 0;
      return acc + g;
    }, 0);
  }, [userGoldAccounts]);

  const userTotalGoldBalance = useMemo(() => {
    return (userGoldAccounts || []).reduce((acc, a) => acc + (a.balance || 0), 0);
  }, [userGoldAccounts]);

  // 1. Asset Distribution Data for Pie Chart
  const assetDistribution = React.useMemo(() => {
    let debitAndCash = 0;
    let alipay = 0;
    let yuebao = 0;
    let funds = 0;
    let gold = 0;
    let jdFinance = 0;
    let receivables = 0;

    (accounts || []).forEach((acc) => {
      const bal = acc.balance || 0;
      if (acc.category === 'DEBIT_CARD' || acc.category === 'CASH') {
        debitAndCash += bal;
      } else if (acc.category === 'ALIPAY') {
        alipay += bal;
      } else if (acc.category === 'YUEBAO') {
        yuebao += bal;
      } else if (acc.category === 'FUND') {
        funds += bal;
      } else if (acc.category === 'GOLD') {
        gold += bal;
      } else if (acc.category === 'JD_FINANCE') {
        jdFinance += bal;
      } else if (acc.category === 'RECEIVABLE' && !acc.isSettled) {
        receivables += bal;
      }
    });

    return [
      { name: '银行借记卡/现金', value: Math.max(0, debitAndCash), color: '#3b82f6' },
      { name: '支付宝余额', value: Math.max(0, alipay), color: '#1677ff' },
      { name: '余额宝货币基金', value: Math.max(0, yuebao), color: '#f97316' },
      { name: '公募基金组合', value: Math.max(0, funds), color: '#8b5cf6' },
      { name: '黄金理财资产', value: Math.max(0, gold), color: '#eab308' },
      { name: '京东金融理财', value: Math.max(0, jdFinance), color: '#ef4444' },
      { name: '借出待收债权', value: Math.max(0, receivables), color: '#06b6d4' },
    ].filter((item) => item.value > 0);
  }, [accounts]);

  // 2. Expense Category breakdown
  const categoryStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;

    (transactions || []).forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
        total += tx.amount;
      }
    });

    const sortedList = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      list: sortedList,
      top15: sortedList.slice(0, 15),
      total,
      totalCount: sortedList.length,
    };
  }, [transactions]);

  // 3. Monthly Trends
  const monthlyTrends = React.useMemo(() => {
    const monthMap: Record<string, { month: string; expense: number; income: number }> = {};

    (transactions || []).forEach((tx) => {
      const m = tx.date ? tx.date.substring(0, 7) : '未知';
      if (!monthMap[m]) {
        monthMap[m] = { month: m, expense: 0, income: 0 };
      }
      if (tx.type === 'EXPENSE') {
        monthMap[m].expense += tx.amount;
      } else if (tx.type === 'INCOME') {
        monthMap[m].income += tx.amount;
      }
    });

    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // 4. Gold Valuation Calculator State
  const defaultGrams = userTotalGoldGrams > 0 ? userTotalGoldGrams.toString() : '50';
  const defaultPrice = liveGoldRate?.priceRmbGram ? liveGoldRate.priceRmbGram.toString() : '688.6';

  const [calcGrams, setCalcGrams] = useState<string>(defaultGrams);
  const [calcUnitPrice, setCalcUnitPrice] = useState<string>(defaultPrice);
  const [calcCostPrice, setCalcCostPrice] = useState<string>('580');

  // Update calculator when user gold accounts change
  useEffect(() => {
    if (userTotalGoldGrams > 0) {
      setCalcGrams(userTotalGoldGrams.toString());
    }
  }, [userTotalGoldGrams]);

  // Update unit price on live rate fetch if user hasn't heavily customized
  useEffect(() => {
    if (liveGoldRate?.priceRmbGram) {
      setCalcUnitPrice(liveGoldRate.priceRmbGram.toString());
    }
  }, [liveGoldRate]);

  const numGrams = parseFloat(calcGrams) || 0;
  const numUnitPrice = parseFloat(calcUnitPrice) || 0;
  const numCostPrice = parseFloat(calcCostPrice) || 0;

  const calcGoldTotal = numGrams * numUnitPrice;
  const totalCost = numGrams * numCostPrice;
  const totalProfit = numCostPrice > 0 ? calcGoldTotal - totalCost : 0;
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  // Handle Synchronize all actual gold accounts with current market rate
  const handleSyncActualAccounts = () => {
    const price = parseFloat(calcUnitPrice) || liveGoldRate.priceRmbGram;
    if (onSyncGoldAccountsValuation) {
      onSyncGoldAccountsValuation(price);
      setSyncFeedback(`✨ 已按最新金价 ¥${price}/克 自动同步更新所有黄金资产账户！`);
      setTimeout(() => setSyncFeedback(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary (与记账本 / 资产账户 / 账本项目顶部样式完全统一) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-400 text-xs font-semibold mb-3">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>统计分析专区</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                全维度财务统计与资产分析
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60 font-mono">
                {transactions.length} 笔流水 · {accounts.length} 张账户
              </span>
            </div>
          </div>

          {/* Quick Actions (纯功能图标展示，悬停显示文字浮层，与其它板块统一) */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              id="btn-refresh-gold-quote"
              type="button"
              onClick={handleManualRefreshGold}
              disabled={isRefreshingGold}
              className="relative p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group disabled:opacity-50"
              title="实时拉取上海黄金交易所与国际汇率最新行情"
              aria-label="刷新金价行情"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingGold ? 'animate-spin text-amber-600' : 'text-amber-500 transition-transform group-hover:scale-110'}`} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                {isRefreshingGold ? '正在拉取...' : '刷新行情'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Metric Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">净资产估值</span>
            <div className={`text-2xl font-bold font-mono mt-1 ${summary.netAssets >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {summary.netAssets >= 0 ? '+' : ''}{formatCurrency(summary.netAssets, privacyMode)}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              总资产 ¥{formatCurrency(summary.totalAssets, privacyMode)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">累计已入账总收入</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              +{formatCurrency(summary.totalIncome, privacyMode)}
            </div>
            <div className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-1">
              各项薪酬、副业与投资收益
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
            <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">累计全量支出</span>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              -{formatCurrency(summary.totalExpense, privacyMode)}
            </div>
            <div className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
              生活消费与固定支出
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">实时黄金 Au9999</span>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
              ¥{liveGoldRate.priceRmbGram.toFixed(2)}<span className="text-xs font-normal text-amber-600 ml-0.5">/g</span>
            </div>
            <div className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1 flex items-center justify-between">
              <span>上海金现货基准</span>
              <span className={`font-mono font-bold ${liveGoldRate.change24h >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {liveGoldRate.change24h >= 0 ? '+' : ''}{liveGoldRate.change24h}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Row: Asset Structure Donut + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution Chart */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>全资产配置结构占比</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">实时估值</span>
          </div>

          <div className="h-64 w-full">
            {assetDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {assetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      formatCurrency(Number(value), privacyMode),
                      '资产金额',
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                暂无资产数据
              </div>
            )}
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            {assetDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>月度收支对比走势</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">收入 vs 支出</span>
          </div>

          <div className="h-64 w-full">
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val), privacyMode)}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="月度总收入" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="月度总支出" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                暂无收支流水记录
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>净结余增长率分析</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">稳健积累中</span>
          </div>
        </div>
      </div>

      {/* Second Row: Expense Category Ranking & Gold / Investment Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Ranking */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>消费支出分类排行榜</span>
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                  {showAllCategories ? `全量 ${categoryStats.totalCount} 类` : `前 ${Math.min(15, categoryStats.totalCount)} 条`}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                总支出: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(categoryStats.total, privacyMode)}</strong>
              </span>
            </div>

            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {categoryStats.list.length > 0 ? (
                (showAllCategories ? categoryStats.list : categoryStats.top15).map((cat, idx) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className={`w-5 text-xs font-mono font-bold text-center ${
                          idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          {idx + 1}.
                        </span>
                        <CategoryIcon nameOrIcon={cat.name} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{cat.name}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {formatCurrency(cat.amount, privacyMode)}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs font-mono w-12 text-right">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-700/40">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">暂无支出明细</p>
              )}
            </div>
          </div>

          {/* If there are more than 15 categories, provide a toggle to see all or collapse back to 15 */}
          {categoryStats.totalCount > 15 && (
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                当前显示前 {showAllCategories ? categoryStats.totalCount : 15} 条（共 {categoryStats.totalCount} 类）
              </span>
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline transition-colors"
              >
                {showAllCategories ? '收起至前 15 条' : `展开查看全部 ${categoryStats.totalCount} 类`}
              </button>
            </div>
          )}
        </div>

        {/* Gold & Wealth Calculator - Enhanced Real-time Market Center */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                    <span>黄金理财与持仓估值测算</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      实时汇率与行情
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    已打通上海黄金交易所 Au9999 现货基准与国际汇率换算，无需手动查价
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualRefreshGold}
                disabled={isRefreshingGold}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 border border-slate-200/80 dark:border-slate-750 shadow-2xs"
                title="刷新今日最新金价与实时汇率"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGold ? 'animate-spin text-amber-600' : ''}`} />
                <span className="hidden sm:inline">刷新行情</span>
              </button>
            </div>

            {/* Live Gold Ticker Strip */}
            <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-yellow-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">国内 Au9999 现货:</span>
                  <span className="text-lg sm:text-xl font-extrabold text-amber-900 dark:text-amber-300 font-mono">
                    ¥{liveGoldRate.priceRmbGram.toFixed(2)}
                    <span className="text-xs font-normal text-amber-700 dark:text-amber-400 ml-0.5">/克</span>
                  </span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center ${
                    liveGoldRate.change24h >= 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {liveGoldRate.change24h >= 0 ? '+' : ''}{liveGoldRate.change24h}%
                  </span>
                </div>

                <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-mono flex items-center gap-2">
                  <span>国际 XAU: ${liveGoldRate.priceUsdOz}/oz</span>
                  <span>·</span>
                  <span>USD/CNY: {liveGoldRate.usdCnyRate}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-amber-800/70 dark:text-amber-300/70 pt-1.5 border-t border-amber-200/60 dark:border-amber-900/50">
                <span>工行积存金参考: ¥{liveGoldRate.icbcPrice}/g · 招行参考: ¥{liveGoldRate.cmbPrice}/g</span>
                <span>更新于 {liveGoldRate.updatedAt}</span>
              </div>
            </div>

            {/* Notification / Sync Feedback Banner */}
            {syncFeedback && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Actual Holdings Linkage Bar */}
            {userGoldAccounts.length > 0 ? (
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    📋 我的黄金实有持仓 ({userGoldAccounts.length} 个账户)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    累计持有 {userTotalGoldGrams} 克 · 账面当前市值 {formatCurrency(userTotalGoldBalance, privacyMode)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcGrams(userTotalGoldGrams.toString())}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors"
                  >
                    带入实际克重
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncActualAccounts}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>一键同步更新资产市值</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Interactive Calculator Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  黄金克重 (g)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcGrams}
                  onChange={(e) => setCalcGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-750 font-semibold font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    单价 (元/克)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCalcUnitPrice(liveGoldRate.priceRmbGram.toString())}
                    className="text-[10px] text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-semibold"
                  >
                    ⚡ 今日价
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={calcUnitPrice}
                  onChange={(e) => setCalcUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-750 font-semibold font-mono text-amber-700 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  成本均价 (元/克, 选填)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcCostPrice}
                  onChange={(e) => setCalcCostPrice(e.target.value)}
                  placeholder="如 580"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-750 font-semibold font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Quick Price Scenario Stress Testing */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">模拟敏感度:</span>
              {[
                { label: '今日行情', price: liveGoldRate.priceRmbGram },
                { label: '+5%', price: Number((liveGoldRate.priceRmbGram * 1.05).toFixed(2)) },
                { label: '+10%', price: Number((liveGoldRate.priceRmbGram * 1.1).toFixed(2)) },
                { label: '+20%', price: Number((liveGoldRate.priceRmbGram * 1.2).toFixed(2)) },
                { label: '-5%', price: Number((liveGoldRate.priceRmbGram * 0.95).toFixed(2)) },
              ].map((sc) => (
                <button
                  key={sc.label}
                  type="button"
                  onClick={() => setCalcUnitPrice(sc.price.toString())}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono shrink-0 transition-colors ${
                    calcUnitPrice === sc.price.toString()
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {sc.label} (¥{sc.price})
                </button>
              ))}
            </div>

            {/* Calculation Result Box */}
            <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-900/50 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold block">
                  折算黄金资产总市值
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-300 font-mono tracking-tight mt-0.5">
                  {formatCurrency(calcGoldTotal, privacyMode)}
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                  持仓 {calcGrams}g · 单价 ¥{calcUnitPrice}/g
                </p>
              </div>

              {numCostPrice > 0 && (
                <div className="sm:border-l sm:border-amber-200/80 dark:sm:border-amber-900/60 sm:pl-4">
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block">
                    持仓浮动盈亏预估 (较成本价 ¥{calcCostPrice}/g)
                  </span>
                  <div className={`text-lg sm:text-xl font-extrabold font-mono mt-0.5 flex items-center gap-1.5 ${
                    totalProfit >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <span>{totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, privacyMode)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">
                      {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    总持仓成本: {formatCurrency(totalCost, privacyMode)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>抗通胀避险资产配置建议: 5% ~ 15%</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold">随国际汇率与上海金自动更新</span>
          </div>
        </div>
      </div>
    </div>
  );
};
