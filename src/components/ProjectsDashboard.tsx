import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  Archive,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Pencil,
  Trash2,
  Tag,
  ReceiptText,
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Layers,
  PieChart as PieChartIcon,
  X,
  Wallet,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import {
  LedgerProject,
  Transaction,
  FinancialAccount,
  ProjectFinancialStats,
  ProjectStatus,
  TransactionType,
  UserProfile,
} from '../types';
import { calculateProjectStats } from '../lib/storage';
import { formatCurrency } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { AccountCardFace } from './AccountCardFace';

interface ProjectsDashboardProps {
  projects?: LedgerProject[];
  transactions?: Transaction[];
  accounts?: FinancialAccount[];
  privacyMode?: boolean;
  currentUser?: UserProfile | null;
  onSaveProject?: (project: LedgerProject) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenNewTx?: (type?: TransactionType, accountId?: string, defaultDate?: string, projectId?: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onRefundTransaction?: (originalTx: Transaction) => void;
  onOpenProjectEditor?: (project?: LedgerProject | null) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: LedgerProject) => void;
  onTriggerSync?: () => Promise<void>;
  onUpdateAccount?: (account: FinancialAccount) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects = [],
  transactions = [],
  accounts = [],
  privacyMode = false,
  currentUser,
  onSaveProject,
  onDeleteProject,
  onOpenNewTx,
  onEditTransaction,
  onDeleteTransaction,
  onRefundTransaction,
  onOpenProjectEditor,
  onCreateProject,
  onEditProject,
  onTriggerSync,
  onUpdateAccount,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (onTriggerSync) {
        await onTriggerSync();
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };
  // Safe helper to open project editor modal
  const handleOpenEditor = (proj?: LedgerProject | null) => {
    if (onOpenProjectEditor) {
      onOpenProjectEditor(proj);
    } else if (proj && onEditProject) {
      onEditProject(proj);
    } else if (!proj && onCreateProject) {
      onCreateProject();
    }
  };

  // Navigation: null means all projects overview, string means viewing single project statistics
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // In-app deletion confirmation states (avoids blocked window.confirm in iframe/sandboxes)
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<LedgerProject | null>(null);
  const [deleteAckChecked, setDeleteAckChecked] = useState(false);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  const openDeleteProjectConfirm = (proj: LedgerProject) => {
    setDeleteAckChecked(false);
    setConfirmDeleteProject(proj);
  };

  // Filters for all projects view (归档项目默认在主界面隐藏)
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Single project transaction filter
  const [singleProjectTxType, setSingleProjectTxType] = useState<string>('ALL');
  const [singleProjectTxSearch, setSingleProjectTxSearch] = useState<string>('');

  // Account map for fast lookup
  const accountMap = useMemo(() => {
    const map = new Map<string, FinancialAccount>();
    (accounts || []).forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Pre-calculate statistics for every project
  const projectStatsMap = useMemo(() => {
    const map = new Map<string, ProjectFinancialStats>();
    (projects || []).forEach((proj) => {
      map.set(proj.id, calculateProjectStats(proj, transactions || []));
    });
    return map;
  }, [projects, transactions]);

  // Overall statistics across all active/visible projects
  const overallStats = useMemo(() => {
    let totalIncome = 0;
    let grossExpense = 0;
    let refundAmount = 0;
    let totalBudget = 0;
    let totalTxCount = 0;

    (projects || []).forEach((proj) => {
      const s = projectStatsMap.get(proj.id);
      if (s) {
        totalIncome += s.totalIncome;
        grossExpense += s.grossExpense;
        refundAmount += s.refundAmount;
        if (s.budget) totalBudget += s.budget;
        totalTxCount += s.transactionCount;
      }
    });

    const netExpense = Math.max(0, grossExpense - refundAmount);
    const netBalance = totalIncome - netExpense;

    return {
      totalIncome,
      grossExpense,
      refundAmount,
      netExpense,
      netBalance,
      totalBudget,
      totalTxCount,
      activeProjectsCount: (projects || []).filter((p) => !p.isArchived && p.status === 'ACTIVE').length,
      completedProjectsCount: (projects || []).filter((p) => !p.isArchived && p.status === 'COMPLETED').length,
      archivedProjectsCount: (projects || []).filter((p) => Boolean(p.isArchived || p.status === 'ARCHIVED')).length,
      unarchivedProjectsCount: (projects || []).filter((p) => !p.isArchived && p.status !== 'ARCHIVED').length,
    };
  }, [projects, projectStatsMap]);

  // Extract unique categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (projects || []).forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  // Filtered projects list (核心：归档后的项目在主界面默认隐藏，但数据与统计完全保留)
  const filteredProjects = useMemo(() => {
    return (projects || []).filter((p) => {
      const isArchived = Boolean(p.isArchived || p.status === 'ARCHIVED');

      // 归档过滤：若处于查看归档模式 (showArchived 或 statusFilter === 'ARCHIVED')，展示归档项目
      if (showArchived || statusFilter === 'ARCHIVED') {
        if (!isArchived) return false;
      } else {
        // 主界面默认模式：归档后的项目在主界面中完全隐藏！
        if (isArchived) return false;

        // 对非归档项目的常规状态筛选
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      }

      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [projects, statusFilter, categoryFilter, searchQuery, showArchived]);

  // Selected project drilldown object & stats
  const activeProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const activeProjectStats = useMemo(() => {
    if (!activeProject) return null;
    return projectStatsMap.get(activeProject.id) || null;
  }, [activeProject, projectStatsMap]);

  // Transactions belonging to selected project
  const activeProjectTransactions = useMemo(() => {
    if (!activeProject) return [];
    return transactions.filter(
      (t) =>
        t.projectId === activeProject.id ||
        (t.projectName && t.projectName === activeProject.name)
    );
  }, [activeProject, transactions]);

  // Filtered transactions for active project
  const filteredActiveProjectTxs = useMemo(() => {
    return activeProjectTransactions.filter((t) => {
      if (singleProjectTxType === 'EXPENSE' && t.type !== 'EXPENSE') return false;
      if (singleProjectTxType === 'INCOME' && t.type !== 'INCOME') return false;
      if (singleProjectTxType === 'REFUND' && t.type !== 'REFUND' && !t.isRefund) return false;
      if (singleProjectTxSearch.trim()) {
        const q = singleProjectTxSearch.toLowerCase().trim();
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchMerchant = t.merchant?.toLowerCase().includes(q);
        const matchTag = t.tag?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchMerchant && !matchTag) return false;
      }
      return true;
    });
  }, [activeProjectTransactions, singleProjectTxType, singleProjectTxSearch]);

  // Active project category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!activeProject) return [];
    const catMap = new Map<string, { gross: number; refund: number; count: number }>();

    (activeProjectTransactions || []).forEach((t) => {
      if (t.type === 'EXPENSE') {
        const c = t.category || '其他';
        const cur = catMap.get(c) || { gross: 0, refund: 0, count: 0 };
        cur.gross += t.amount;
        cur.count += 1;
        catMap.set(c, cur);
      } else if (t.type === 'REFUND') {
        const c = t.category || '其他';
        const cur = catMap.get(c) || { gross: 0, refund: 0, count: 0 };
        cur.refund += t.amount;
        catMap.set(c, cur);
      }
    });

    const totalNetExpense = activeProjectStats?.netExpense || 1;
    const list = Array.from(catMap.entries()).map(([catName, data]) => {
      const net = Math.max(0, data.gross - data.refund);
      const percent = Math.min(100, Math.round((net / totalNetExpense) * 1000) / 10);
      return {
        category: catName,
        gross: data.gross,
        refund: data.refund,
        net,
        percent,
        count: data.count,
      };
    });

    return list.sort((a, b) => b.net - a.net);
  }, [activeProject, activeProjectTransactions, activeProjectStats]);

  // Accounts involved with this active project (explicitly linked or have transactions)
  const involvedAccounts = useMemo(() => {
    if (!activeProject) return [];
    const involvedIds = new Set<string>();
    if (Array.isArray(activeProject.linkedAccountIds)) {
      activeProject.linkedAccountIds.forEach((id) => involvedIds.add(id));
    }
    (accounts || []).forEach((acc) => {
      if (acc.projectId === activeProject.id) involvedIds.add(acc.id);
    });
    (activeProjectTransactions || []).forEach((tx) => {
      if (tx.accountId) involvedIds.add(tx.accountId);
      if (tx.targetAccountId) involvedIds.add(tx.targetAccountId);
    });
    if (involvedIds.size === 0 && accounts && accounts.length > 0) {
      accounts.slice(0, 3).forEach((acc) => involvedIds.add(acc.id));
    }
    return (accounts || []).filter((acc) => involvedIds.has(acc.id));
  }, [activeProject, accounts, activeProjectTransactions]);

  // Archive or Unarchive project (safe, reversible, keeps all statistics and transactions intact)
  const handleArchiveProject = (proj: LedgerProject, archive: boolean = true) => {
    const nextStatus: ProjectStatus = archive ? 'ARCHIVED' : 'ACTIVE';
    if (onSaveProject) {
      onSaveProject({
        ...proj,
        isArchived: archive,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Toggle project status between ACTIVE and COMPLETED
  const handleToggleProjectStatus = (proj: LedgerProject) => {
    const nextStatus: ProjectStatus = proj.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
    if (onSaveProject) {
      onSaveProject({
        ...proj,
        isArchived: false,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const isExceeded = Boolean(
    activeProject?.budget &&
      activeProjectStats &&
      activeProjectStats.netExpense > activeProject.budget
  );

  return (
    <div className="space-y-6 pb-20">
      {activeProject && activeProjectStats ? (
        /* ========================================================================= */
        /* VIEW 2: SINGLE PROJECT DRILLDOWN (单项目收支统计与流水) */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Back navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProjectId(null)}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center shadow-2xs"
              title="返回所有账本项目"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: activeProject.color || '#0d9488' }}
                />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeProject.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {activeProject.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED')
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : activeProject.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED')
                    ? '📦 已归档 (主界面已隐藏)'
                    : activeProject.status === 'ACTIVE'
                    ? '进行中'
                    : '已结项'}
                </span>
              </div>
              {activeProject.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activeProject.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions for this single project (纯功能图标展示，悬停显示文字浮层，与资产账户风格一致) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. 记支出 */}
            <button
              id="btn-project-add-expense"
              type="button"
              onClick={() => onOpenNewTx('EXPENSE', undefined, undefined, activeProject.id)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title="为此项目记一笔支出"
              aria-label="记支出"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-500 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                记支出
              </span>
            </button>

            {/* 2. 记收入 */}
            <button
              id="btn-project-add-income"
              type="button"
              onClick={() => onOpenNewTx('INCOME', undefined, undefined, activeProject.id)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title="为此项目记一笔收入 (如副业进账、报销返款、AA分摊)"
              aria-label="记收入"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                记收入
              </span>
            </button>

            {/* 3. 平账冲红 */}
            <button
              id="btn-project-refund"
              type="button"
              onClick={() => onOpenNewTx('REFUND', undefined, undefined, activeProject.id)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title="对该项目花出去的费用进行退费平账冲红"
              aria-label="平账冲红"
            >
              <RotateCcw className="w-4 h-4 text-rose-500 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                平账冲红
              </span>
            </button>

            {/* 4. 编辑项目信息 */}
            <button
              id="btn-project-edit"
              type="button"
              onClick={() => handleOpenEditor(activeProject)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title="编辑此项目信息"
              aria-label="编辑项目"
            >
              <Pencil className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                编辑项目
              </span>
            </button>

            {/* 5. 归档项目 / 取消归档 */}
            <button
              id="btn-project-archive"
              type="button"
              onClick={() => handleArchiveProject(activeProject, !Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED'))}
              className={`relative p-2 rounded-xl bg-transparent transition-all flex items-center justify-center active:scale-95 group border ${
                Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED')
                  ? 'hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                  : 'hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700'
              }`}
              title={Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED') ? '取消归档，重新恢复显示在主界面' : '归档此项目 (主界面隐藏并安全保留数据)'}
              aria-label={Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED') ? '取消归档' : '归档项目'}
            >
              <Archive className={`w-4 h-4 transition-transform group-hover:scale-110 ${Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED') ? 'text-amber-500' : ''}`} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                {Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED') ? '取消归档并恢复' : '归档此项目'}
              </span>
            </button>

            {/* 6. 设为进行中 / 标记已结项 */}
            <button
              id="btn-project-toggle-status"
              type="button"
              onClick={() => handleToggleProjectStatus(activeProject)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title={activeProject.status === 'COMPLETED' ? '设为进行中' : '标记已结项'}
              aria-label={activeProject.status === 'COMPLETED' ? '设为进行中' : '标记已结项'}
            >
              {activeProject.status === 'COMPLETED' ? (
                <Clock className="w-4 h-4 text-blue-500 transition-transform group-hover:scale-110" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 transition-transform group-hover:scale-110" />
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                {activeProject.status === 'COMPLETED' ? '设为进行中' : '标记已结项'}
              </span>
            </button>

            {/* 7. 删除项目 */}
            <button
              id="btn-project-delete"
              type="button"
              onClick={() => openDeleteProjectConfirm(activeProject)}
              className="relative p-2 rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group"
              title="删除此项目 (不可逆高危操作)"
              aria-label="删除项目"
            >
              <Trash2 className="w-4 h-4 text-rose-500 transition-transform group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                删除此项目
              </span>
            </button>
          </div>
        </div>

        {/* 归档状态横幅提醒 */}
        {Boolean(activeProject.isArchived || activeProject.status === 'ARCHIVED') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/70 text-amber-900 dark:text-amber-200 text-xs shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-xs sm:text-sm">
                  📦 本项目当前处于「已归档」状态
                </p>
                <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80">
                  项目已在主界面中自动隐藏，但<strong>所有历史收支统计与关联记账流水均已完整安全保留</strong>。您可以随时一键取消归档恢复到主界面。
                </p>
              </div>
            </div>
            <button
              onClick={() => handleArchiveProject(activeProject, false)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all self-start sm:self-auto shrink-0 flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>取消归档并恢复到主界面</span>
            </button>
          </div>
        )}

        {/* 6-Metric Financial Scoreboard for this Project */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. 项目总收入 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">项目总收入</span>
              <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
              +{formatCurrency(activeProjectStats.totalIncome, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              共 {activeProjectStats.incomeCount} 笔收款
            </div>
          </div>

          {/* 2. 原始支出总额 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">原始支出款</span>
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
              -{formatCurrency(activeProjectStats.grossExpense, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              共 {activeProjectStats.expenseCount} 笔支付
            </div>
          </div>

          {/* 3. 平账冲红退款 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">平账冲红</span>
              <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
              +{formatCurrency(activeProjectStats.refundAmount, privacyMode)}
            </div>
            <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 font-medium">
              冲减支出 {activeProjectStats.refundCount} 笔
            </div>
          </div>

          {/* 4. 实际净支出 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-2xs bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1.5">
              <span className="text-xs font-bold">实际净支出</span>
              <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400 font-mono">
              -{formatCurrency(activeProjectStats.netExpense, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              原始支出 扣除 冲红
            </div>
          </div>

          {/* 5. 项目净结余 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 mb-1.5">
              <span className="text-xs font-bold">项目净结余</span>
              <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div
              className={`text-base sm:text-lg font-black font-mono ${
                activeProjectStats.netBalance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {activeProjectStats.netBalance >= 0 ? '+' : ''}
              {formatCurrency(activeProjectStats.netBalance, privacyMode)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              收入 - 实际净支出
            </div>
          </div>

          {/* 6. 预算与剩余 */}
          <div
            className={`p-4 rounded-2xl border shadow-2xs ${
              isExceeded
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">
                {isExceeded ? '⚠️ 预算超支' : '预算消耗'}
              </span>
              <span className="text-xs font-bold font-mono">
                {activeProject.budget
                  ? `${activeProjectStats.budgetUsagePercent.toFixed(1)}%`
                  : '未设预算'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono">
              {activeProject.budget
                ? formatCurrency(activeProjectStats.budgetRemaining || 0, privacyMode)
                : '--'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {activeProject.budget
                ? `预算 ¥${activeProject.budget.toFixed(2)}`
                : '点击编辑可设置预算'}
            </div>
          </div>
        </div>

        {/* Budget Progress Bar if set */}
        {activeProject.budget && activeProject.budget > 0 && (
          <div
            className={`p-4 rounded-2xl border shadow-2xs space-y-2 transition-all ${
              isExceeded
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                : activeProjectStats.budgetUsagePercent >= 80
                ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  专项预算执行进度:
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  已支出 <strong>{formatCurrency(activeProjectStats.netExpense, privacyMode)}</strong> / 预算总额 <strong>¥{activeProject.budget.toFixed(2)}</strong>
                </span>
                {activeProjectStats.budgetUsagePercent >= 80 && !isExceeded && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>预警: 支出达{activeProjectStats.budgetUsagePercent.toFixed(1)}%</span>
                  </span>
                )}
                {isExceeded && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>预算超支</span>
                  </span>
                )}
              </div>
              <span
                className={`font-bold ${
                  isExceeded
                    ? 'text-rose-600'
                    : activeProjectStats.budgetUsagePercent >= 80
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {isExceeded
                  ? `已超支 ¥${(activeProjectStats.netExpense - activeProject.budget).toFixed(2)} (${activeProjectStats.budgetUsagePercent.toFixed(1)}%)`
                  : `剩余额度 ¥${(activeProject.budget - activeProjectStats.netExpense).toFixed(2)} (${activeProjectStats.budgetUsagePercent.toFixed(1)}%)`}
              </span>
            </div>
            <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-amber-400/90 z-10"
                style={{ left: '80%' }}
                title="80% 警戒线"
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExceeded
                    ? 'bg-rose-600'
                    : activeProjectStats.budgetUsagePercent >= 80
                    ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${Math.min(100, activeProjectStats.budgetUsagePercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* ================= 4. PROJECT INVOLVED ACCOUNTS / CARDS ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    该账本项目关联账本 / 卡片
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono">
                    {involvedAccounts.length} 个账本
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  所有参与此项目收支核算的账本卡片
                </p>
              </div>
            </div>
          </div>

          {/* Involved Accounts Grid */}
          {involvedAccounts.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
              暂无关联账本，在此项目下新增交易流水或在编辑账本时选择此项目
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {involvedAccounts.map((acc) => (
                <div key={acc.id} className="relative group/acc">
                  <AccountCardFace
                    account={acc}
                    privacyMode={privacyMode}
                    compact={true}
                    hideActionRow={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Expense Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  项目支出分类占比与构成
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                涵盖 {categoryBreakdown.length} 个支出类别
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <CategoryIcon nameOrIcon={item.category} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {item.percent}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>净支: ¥{item.net.toFixed(2)}</span>
                    {item.refund > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">
                        (含冲红 ¥{item.refund.toFixed(2)})
                      </span>
                    )}
                    <span>{item.count} 笔</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Transaction Flow for this Single Project */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Header & Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                该项目收支流水清单
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                共 {filteredActiveProjectTxs.length} 笔
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={singleProjectTxSearch}
                  onChange={(e) => setSingleProjectTxSearch(e.target.value)}
                  placeholder="搜索此项目账单..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Type Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setSingleProjectTxType('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setSingleProjectTxType('EXPENSE')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'EXPENSE'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 font-bold shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setSingleProjectTxType('INCOME')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'INCOME'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  收入
                </button>
                <button
                  onClick={() => setSingleProjectTxType('REFUND')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    singleProjectTxType === 'REFUND'
                      ? 'bg-white dark:bg-slate-700 text-rose-700 font-bold shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  冲红退费
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Items */}
          {filteredActiveProjectTxs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-3">
              <ReceiptText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                暂无符合条件的流水记录
              </div>
              <p className="text-xs text-slate-400">
                点击上方“记支出”或“记收入”即可为当前项目添加入账流水
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActiveProjectTxs.map((tx) => {
                const acc = accountMap.get(tx.accountId);
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';
                const isRefund = tx.type === 'REFUND' || tx.isRefund;
                const hasRefund = (tx.refundedAmount || 0) > 0;
                const netAmount = Math.max(0, tx.amount - (tx.refundedAmount || 0));

                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:px-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                            : isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        <CategoryIcon
                          nameOrIcon={tx.category}
                          className="w-4 h-4"
                          defaultIcon={
                            isExpense
                              ? ArrowDownRight
                              : isIncome
                              ? ArrowUpRight
                              : RotateCcw
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {tx.description || tx.category}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {tx.category}
                          </span>
                          {tx.tag && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100/80 dark:bg-slate-800/80 text-slate-400">
                              #{tx.tag}
                            </span>
                          )}
                          {isRefund && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                              平账冲红凭证
                            </span>
                          )}
                          {hasRefund && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                              已冲红退款 ¥{tx.refundedAmount?.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 flex-wrap font-mono">
                          <span>{tx.date}</span>
                          {tx.time && <span>{tx.time}</span>}
                          <span>·</span>
                          <span>{acc?.name || '账户'}</span>
                          {tx.merchant && <span>· 商户: {tx.merchant}</span>}
                          {isRefund && tx.refundedTxDescription && (
                            <span className="text-rose-600 dark:text-rose-400">
                              · 冲销原单: {tx.refundedTxDescription}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3 shrink-0">
                      <div>
                        <div
                          className={`text-sm sm:text-base font-bold font-mono ${
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : isIncome
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isExpense
                            ? `-${formatCurrency(tx.amount, privacyMode)}`
                            : isIncome
                            ? `+${formatCurrency(tx.amount, privacyMode)}`
                            : `+${formatCurrency(tx.amount, privacyMode)} (冲红)`}
                        </div>

                        {/* If expense has refund, show net expenditure */}
                        {isExpense && hasRefund && (
                          <div className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            净支出: {formatCurrency(netAmount, privacyMode)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        {/* Direct Red-ink Reversal Button for Expense */}
                        {isExpense && (
                          <button
                            onClick={() => onRefundTransaction(tx)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-all flex items-center gap-1"
                            title="对该笔支出进行平账冲红 (退费入账)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>冲红</span>
                          </button>
                        )}
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="编辑流水"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDeleteTxId === tx.id) {
                              if (onDeleteTransaction) onDeleteTransaction(tx.id);
                              setConfirmDeleteTxId(null);
                            } else {
                              setConfirmDeleteTxId(tx.id);
                              setTimeout(() => {
                                setConfirmDeleteTxId((cur) => (cur === tx.id ? null : cur));
                              }, 3500);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                            confirmDeleteTxId === tx.id
                              ? 'bg-rose-600 text-white hover:bg-rose-700 px-2'
                              : 'text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          }`}
                          title={confirmDeleteTxId === tx.id ? '点击确认删除此记录' : '删除流水'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {confirmDeleteTxId === tx.id && (
                            <span className="text-[10px] font-bold">确认删除</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 1: ALL PROJECTS OVERVIEW & MANAGEMENT (全部账本项目看板) */
        /* ========================================================================= */
        <>
          {/* Top Banner & Metric Summary (参考 CreditCardsSummary 布局模式重构) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-3">
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>账本项目专区</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    账本项目
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    共 {projects.length} 个项目
                  </span>
                  {currentUser && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>云端已同步</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions / CTA (功能图标与主要操作) */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {onTriggerSync && (
                  <button
                    id="btn-projects-cloud-sync"
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="relative p-2 rounded-xl bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95 group disabled:opacity-50"
                    title="立即同步最新项目与流水到云端服务器"
                    aria-label="云端同步"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : 'group-hover:rotate-180 transition-transform duration-300 text-slate-600 dark:text-slate-300'}`} />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-md border border-slate-700/50">
                      {isSyncing ? '正在同步...' : '云端同步'}
                    </span>
                  </button>
                )}

                <button
                  id="btn-add-project-main"
                  type="button"
                  onClick={() => handleOpenEditor(null)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>新增账本</span>
                </button>
              </div>
            </div>

            {/* 5 Metric Pillars (Matching CreditCardsSummary layout pattern) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">项目总数</span>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {projects.length}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  共创建 {projects.length} 个 · 进行中 {overallStats.activeProjectsCount} 个
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">项目总收入</span>
                <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                  +{formatCurrency(overallStats.totalIncome, privacyMode)}
                </div>
                <div className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-1">
                  累计收款与进账款项
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/40">
                <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">退款冲红</span>
                <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                  +{formatCurrency(overallStats.refundAmount, privacyMode)}
                </div>
                <div className="text-xs text-rose-500/80 dark:text-rose-400/80 mt-1">
                  退费抵消冲减支出
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
                <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">实际支出</span>
                <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">
                  -{formatCurrency(overallStats.netExpense, privacyMode)}
                </div>
                <div className="text-xs text-rose-600/80 dark:text-rose-500/80 mt-1">
                  剔除退款后的净支出
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 sm:col-span-2 lg:col-span-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">净结余</span>
                <div
                  className={`text-2xl font-bold font-mono mt-1 ${
                    overallStats.netBalance >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {overallStats.netBalance >= 0 ? '+' : ''}
                  {formatCurrency(overallStats.netBalance, privacyMode)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {overallStats.netBalance >= 0 ? '收支盈余充裕' : '当前收支出现赤字'}
                </div>
              </div>
            </div>
          </div>

      {/* Filter & Search Bar with dedicated Archived Switch */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索项目名称、分类或说明..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* 常规状态筛选 (未开启归档视图时) */}
            {!showArchived && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              >
                <option value="ALL">全部状态 (进行中 / 已结项)</option>
                <option value="ACTIVE">🟢 仅看进行中</option>
                <option value="COMPLETED">✅ 仅看已结项</option>
              </select>
            )}

            {availableCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              >
                <option value="ALL">全部分类</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || showArchived) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                  setShowArchived(false);
                }}
                className="text-xs text-rose-500 font-semibold hover:underline"
              >
                重置筛选
              </button>
            )}
          </div>

          {/* 核心功能：查看已归档项目切换开关 (Toggle Switch) */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => {
                const next = !showArchived;
                setShowArchived(next);
                if (next) {
                  setStatusFilter('ALL');
                }
              }}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showArchived
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
              title="切换是否查看已归档的账本项目（归档项目数据完整安全保留）"
            >
              <div className="flex items-center gap-1.5">
                <Archive className={`w-3.5 h-3.5 ${showArchived ? 'text-white' : 'text-amber-500'}`} />
                <span>查看已归档项目</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    showArchived
                      ? 'bg-amber-600/60 text-white'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {overallStats.archivedProjectsCount}
                </span>
              </div>

              {/* 现代开关滑块 UI */}
              <div
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                  showArchived ? 'bg-amber-700 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </div>
            </button>
          </div>
        </div>

        {/* 处于“已归档项目”浏览视图时的提示栏 */}
        {showArchived && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                正在浏览已归档项目 (共 {overallStats.archivedProjectsCount} 个)，点击卡片可随时恢复归档。
              </span>
            </div>
            <button
              onClick={() => setShowArchived(false)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 shadow-2xs transition-colors"
            >
              返回主界面
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-4">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? '暂无符合筛选条件的账本'
                : '暂无账本'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              创建账本即可将相关的支出、收入与冲红集中独立核算
            </p>
          </div>
          <button
            onClick={() => handleOpenEditor(null)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>新增账本</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const stats = projectStatsMap.get(proj.id) || {
              totalIncome: 0,
              grossExpense: 0,
              refundAmount: 0,
              netExpense: 0,
              netBalance: 0,
              transactionCount: 0,
              incomeCount: 0,
              expenseCount: 0,
              refundCount: 0,
              budgetUsagePercent: 0,
            };

            const hasBudget = Boolean(proj.budget && proj.budget > 0);
            const budgetAmount = proj.budget || 0;
            const usagePercent = hasBudget ? (stats.netExpense / budgetAmount) * 100 : 0;
            const isWarning = hasBudget && usagePercent >= 80 && usagePercent <= 100;
            const isExceeded = hasBudget && stats.netExpense > budgetAmount;

            return (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header Color Bar */}
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: proj.color || '#0d9488' }}
                  />

                  <div className="p-5 space-y-4">
                    {/* Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {proj.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              proj.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : proj.status === 'COMPLETED'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60'
                            }`}
                          >
                            {proj.status === 'ACTIVE'
                              ? '进行中'
                              : proj.status === 'COMPLETED'
                              ? '已结项'
                              : '📦 已归档'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                          {proj.name}
                        </h3>
                        {proj.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                            {proj.description}
                          </p>
                        )}
                        {(proj.startDate || proj.endDate) && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {proj.startDate || '未设开始'} {proj.endDate ? `~ ${proj.endDate}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditor(proj)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="编辑项目"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isCurrentlyArchived = Boolean(proj.isArchived || proj.status === 'ARCHIVED');
                            handleArchiveProject(proj, !isCurrentlyArchived);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            Boolean(proj.isArchived || proj.status === 'ARCHIVED')
                              ? 'text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                          title={Boolean(proj.isArchived || proj.status === 'ARCHIVED') ? '取消归档 / 恢复为进行中并在主界面展示' : '归档此项目 (主界面隐藏并安全保留数据)'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteProjectConfirm(proj);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="删除项目 (不可逆高危操作)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Financial Matrix (收入 / 支出 / 冲红 / 净支出 / 结余) */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">项目收入</div>
                        <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          +{formatCurrency(stats.totalIncome, privacyMode)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">原始支出</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                          -{formatCurrency(stats.grossExpense, privacyMode)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-rose-500 font-medium">平账冲红</div>
                        <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                          +{formatCurrency(stats.refundAmount, privacyMode)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                          实际净支出
                        </div>
                        <div className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-400 font-mono">
                          -{formatCurrency(stats.netExpense, privacyMode)}
                        </div>
                      </div>

                      <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          项目净结余 (收入-净支)
                        </span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            stats.netBalance >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {stats.netBalance >= 0 ? '+' : ''}
                          {formatCurrency(stats.netBalance, privacyMode)}
                        </span>
                      </div>
                    </div>

                    {/* 收支总预算进度条 (当支出达到80%预算时自动切换为预警色) */}
                    {hasBudget ? (
                      <div
                        className={`p-3 rounded-2xl border transition-all ${
                          isExceeded
                            ? 'bg-rose-50/60 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/60'
                            : isWarning
                            ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                              收支预算进度
                            </span>
                            {isWarning && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse shrink-0">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>预警 ≥80%</span>
                              </span>
                            )}
                            {isExceeded && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shrink-0">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>超支 {(usagePercent - 100).toFixed(0)}%</span>
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-mono text-xs font-bold shrink-0 ${
                              isExceeded
                                ? 'text-rose-600 dark:text-rose-400'
                                : isWarning
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            已用 {usagePercent.toFixed(1)}%
                          </span>
                        </div>

                        {/* Progress Bar Track with 80% warning marker */}
                        <div className="relative h-2.5 w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                          {/* 80% 警戒参考线 */}
                          <div
                            className="absolute top-0 bottom-0 w-[1.5px] bg-amber-400/90 z-10"
                            style={{ left: '80%' }}
                            title="80% 预算预警警戒线"
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExceeded
                                ? 'bg-rose-600 shadow-xs'
                                : isWarning
                                ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
                                : 'bg-teal-600'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, usagePercent))}%`,
                            }}
                          />
                        </div>

                        {/* Sub-metrics */}
                        <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 text-slate-500 dark:text-slate-400">
                          <span className="truncate">
                            支出: <strong className="text-slate-700 dark:text-slate-300">¥{formatCurrency(stats.netExpense, privacyMode)}</strong> / 预算: <strong>¥{budgetAmount.toFixed(0)}</strong>
                          </span>
                          <span
                            className={`shrink-0 font-medium ${
                              isExceeded
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : isWarning
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {isExceeded
                              ? `超 ¥${(stats.netExpense - budgetAmount).toFixed(0)}`
                              : `剩 ¥${(budgetAmount - stats.netExpense).toFixed(0)}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            收支总预算进度
                          </span>
                          <button
                            onClick={() => handleOpenEditor(proj)}
                            className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-0.5"
                            title="为此项目设置总预算以启用进度条与80%预警"
                          >
                            <Plus className="w-3 h-3" />
                            <span>设定预算</span>
                          </button>
                        </div>
                        <div className="h-2 w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-300 dark:bg-slate-600 w-0" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>未设总预算上限</span>
                          <span>净支出: ¥{formatCurrency(stats.netExpense, privacyMode)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-mono pl-1">
                    {stats.transactionCount} 笔流水
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenNewTx('EXPENSE', undefined, undefined, proj.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
                      title="记一笔该项目账单"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>记一笔</span>
                    </button>

                    <button
                      onClick={() => setSelectedProjectId(proj.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>明细统计</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* 确认删除账本项目专用弹窗 (强警示 + 优先引导归档 + 不可逆防误触) */}
      {confirmDeleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    确认永久删除账本？
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    目标账本：「{confirmDeleteProject.name}」
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteProject(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. 明确的不可逆警告信息 */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200 space-y-1.5 shadow-2xs">
              <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>严重警示：此删除操作为永久销毁，完全不可逆！</span>
              </div>
              <p className="text-xs text-rose-600/95 dark:text-rose-300 leading-relaxed">
                一旦确认删除，该项目的预算计划、财务看板、项目标签与收支统计将被<strong>永久彻底销毁，无法撤销，数据不可找回</strong>。
              </p>
            </div>

            {/* 2. 强烈推荐功能：优先选择「归档」而非直接删除 */}
            <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>更优解：强烈推荐选择【归档此项目】</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  安全推荐
                </span>
              </div>
              <p className="text-amber-700/95 dark:text-amber-300/90 text-xs leading-relaxed">
                若项目已完工或阶段性不再记账，建议进行<strong>安全归档</strong>。归档后项目移出日常活跃看板，但<strong>所有历史收支统计、明细流水完好留存</strong>，随时支持一键恢复为进行中。
              </p>
              <button
                type="button"
                onClick={() => {
                  handleArchiveProject(confirmDeleteProject, true);
                  setConfirmDeleteProject(null);
                  if (selectedProjectId === confirmDeleteProject.id) {
                    setSelectedProjectId(null);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Archive className="w-4 h-4" />
                <span>优先归档项目（安全留存，随时可恢复）</span>
              </button>
            </div>

            {/* 3. 关联账单保留说明 */}
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ✅ <strong>账单安全保障</strong>：该项目下已发生的记账流水（明细、金额、凭证）将<strong>完整安全保留在总账本中</strong>，仅解除项目分类绑定。
            </div>

            {/* 4. 防误触强制确认勾选框 */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deleteAckChecked}
                onChange={(e) => setDeleteAckChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-snug">
                我已知晓此删除操作【完全不可逆且数据无法找回】，我确定仍要永久彻底删除该项目
              </span>
            </label>

            {/* 5. 底部操作按钮 */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!deleteAckChecked}
                onClick={() => {
                  const targetId = confirmDeleteProject.id;
                  setConfirmDeleteProject(null);
                  if (selectedProjectId === targetId) {
                    setSelectedProjectId(null);
                  }
                  if (onDeleteProject) {
                    onDeleteProject(targetId);
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                <Trash2 className="w-4 h-4" />
                <span>确认彻底删除 (不可逆)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
