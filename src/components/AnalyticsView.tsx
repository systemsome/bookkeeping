import React, { useState } from 'react';
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
  BarChart3,
  Coins,
} from 'lucide-react';
import { FinancialAccount, Transaction, FinancialSummary } from '../types';
import { formatCurrency } from '../lib/formatters';

interface AnalyticsViewProps {
  accounts: FinancialAccount[];
  transactions: Transaction[];
  summary: FinancialSummary;
  privacyMode: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  accounts,
  transactions,
  summary,
  privacyMode,
}) => {
  // 1. Asset Distribution Data for Pie Chart
  const assetDistribution = React.useMemo(() => {
    let debitAndCash = 0;
    let alipay = 0;
    let yuebao = 0;
    let funds = 0;
    let gold = 0;
    let jdFinance = 0;
    let receivables = 0;

    accounts.forEach((acc) => {
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

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
        total += tx.amount;
      }
    });

    const list = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));

    return {
      list: list.sort((a, b) => b.amount - a.amount),
      total,
    };
  }, [transactions]);

  // 3. Monthly Trends
  const monthlyTrends = React.useMemo(() => {
    const monthMap: Record<string, { month: string; expense: number; income: number }> = {};

    transactions.forEach((tx) => {
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
  const goldAccount = accounts.find((a) => a.category === 'GOLD');
  const [calcGrams, setCalcGrams] = useState<string>(
    goldAccount?.goldGrams ? goldAccount.goldGrams.toString() : '50'
  );
  const [calcUnitPrice, setCalcUnitPrice] = useState<string>(
    goldAccount?.goldUnitPrice ? goldAccount.goldUnitPrice.toString() : '600'
  );

  const calcGoldTotal = (parseFloat(calcGrams) || 0) * (parseFloat(calcUnitPrice) || 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          全维度财务统计与资产分析
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          多维度洞察资产配置结构、信用卡负债健康度、分类支出排行榜与历史收支趋势
        </p>
      </div>

      {/* Main Row: Asset Structure Donut + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution Chart */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-600" />
              <span>全资产配置结构占比</span>
            </h3>
            <span className="text-xs text-slate-500">实时估值</span>
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
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                暂无资产数据
              </div>
            )}
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
            {assetDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>月度收支对比走势</span>
            </h3>
            <span className="text-xs text-slate-500">收入 vs 支出</span>
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
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="月度总收入" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="月度总支出" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                暂无收支流水记录
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>净结余增长率分析</span>
            <span className="text-emerald-700 font-semibold">稳健积累中</span>
          </div>
        </div>
      </div>

      {/* Second Row: Expense Category Ranking & Gold / Investment Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Ranking */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              <span>消费支出分类排行榜</span>
            </h3>
            <span className="text-xs text-slate-500">
              总支出: {formatCurrency(categoryStats.total, privacyMode)}
            </span>
          </div>

          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {categoryStats.list.length > 0 ? (
              categoryStats.list.map((cat, idx) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-4 text-slate-400 font-mono">{idx + 1}.</span>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(cat.amount, privacyMode)}
                      </span>
                      <span className="text-slate-400 text-xs font-mono w-12 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">暂无支出明细</p>
            )}
          </div>
        </div>

        {/* Gold & Wealth Calculator */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <span>黄金理财与持仓估值测算</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                实时测算
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              模拟工行积存金、黄金ETF或实物金条在不同克重与金价变动下的资产总市值：
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">
                  黄金克重 (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calcGrams}
                  onChange={(e) => setCalcGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">
                  每克金价单价 (元/克)
                </label>
                <input
                  type="number"
                  step="1"
                  value={calcUnitPrice}
                  onChange={(e) => setCalcUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
              <span className="text-xs text-amber-800 font-medium">
                折算黄金资产总市值
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1">
                {formatCurrency(calcGoldTotal, privacyMode)}
              </div>
              <p className="text-[11px] text-amber-600/80 mt-1">
                持仓 {calcGrams}g · 单价 ¥{calcUnitPrice}/g
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>抗通胀避险资产配置建议: 5% ~ 15%</span>
            <span className="text-amber-700 font-semibold">配置合理</span>
          </div>
        </div>
      </div>
    </div>
  );
};
