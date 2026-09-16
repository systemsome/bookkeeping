import React, { useState } from 'react';
import {
  X,
  Check,
  FolderKanban,
  DollarSign,
  Calendar,
  Sparkles,
  Tag,
  AlignLeft,
  CheckCircle2,
  Clock,
  Archive,
  Palette,
} from 'lucide-react';
import { LedgerProject, ProjectStatus, UserProfile } from '../types';

interface ProjectEditorModalProps {
  initialProject?: LedgerProject | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSave?: (project: LedgerProject) => void;
  onSubmit?: (
    projectData: Omit<LedgerProject, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => void;
  onDelete?: (id: string) => void;
}

const PROJECT_CATEGORIES = [
  { name: '家装工程', color: '#0d9488', icon: 'Hammer' },
  { name: '旅行度假', color: '#f43f5e', icon: 'Plane' },
  { name: '副业经营', color: '#8b5cf6', icon: 'Briefcase' },
  { name: '婚礼筹备', color: '#ec4899', icon: 'Heart' },
  { name: '商务出差', color: '#0284c7', icon: 'Building' },
  { name: '车辆维护', color: '#ea580c', icon: 'Car' },
  { name: '专项进修', color: '#10b981', icon: 'GraduationCap' },
  { name: '家庭大件', color: '#6366f1', icon: 'Tv' },
  { name: '医疗健康', color: '#ef4444', icon: 'Activity' },
  { name: '其他项目', color: '#64748b', icon: 'Folder' },
];

const PRESET_COLORS = [
  '#0d9488', // Teal
  '#f43f5e', // Rose
  '#8b5cf6', // Purple
  '#0284c7', // Sky Blue
  '#ea580c', // Orange
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#eab308', // Amber
  '#475569', // Slate
];

export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  initialProject,
  currentUser,
  onClose,
  onSave,
  onSubmit,
  onDelete,
}) => {
  const isEditing = !!initialProject;

  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [category, setCategory] = useState(initialProject?.category || '家装工程');
  const [budget, setBudget] = useState(initialProject?.budget?.toString() || '');
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status || 'ACTIVE');
  const [startDate, setStartDate] = useState(
    initialProject?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(initialProject?.endDate || '');
  const [color, setColor] = useState(
    initialProject?.color ||
      PROJECT_CATEGORIES.find((c) => c.name === category)?.color ||
      '#0d9488'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBudget = budget.trim() ? parseFloat(budget.trim()) : undefined;

    const projectData: LedgerProject = {
      id: initialProject?.id || `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      color,
      budget: numBudget && numBudget > 0 ? numBudget : undefined,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      createdAt: initialProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onSave) {
      onSave(projectData);
    } else if (onSubmit) {
      const { id, createdAt, updatedAt, ...rest } = projectData;
      onSubmit(rest, initialProject?.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold"
              style={{ backgroundColor: color }}
            >
              <FolderKanban className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditing ? '编辑账本项目' : '新增账本项目'}
                </h3>
                {currentUser && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                    <Check className="w-3 h-3 stroke-[3]" />
                    账号云端同步
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                用于专项核算装修、旅行、副业等特定事项的独立收支与结余
                {currentUser ? `，将与账号「${currentUser.displayName || currentUser.username}」自动实时云端同步保存` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              项目名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：新房极简智能装修、2026日本枫叶旅行、出海工具副业..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                项目类别
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  const matched = PROJECT_CATEGORIES.find((c) => c.name === newCat);
                  if (matched && !isEditing) {
                    setColor(matched.color);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none font-medium"
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                项目状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none font-medium"
              >
                <option value="ACTIVE">🟢 进行中 (Active)</option>
                <option value="COMPLETED">✅ 已结项 (Completed)</option>
                <option value="ARCHIVED">📦 已归档 (Archived)</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>专项预算金额 (元，选填)</span>
              <span className="text-[11px] font-normal text-slate-400">
                设定预算后可实时监控支出进度与防超支预警
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">
                ¥
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="例如：50000.00"
                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                预期结束 / 结项日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              项目主题颜色
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              项目目标与描述说明 (选填)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：主卧次卧硬装工程与定制柜体采购，控制总费用并记录各批次材料支出..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`确定删除项目「${name}」吗？已关联的历史账单不会被删除，仅解除项目关联。`)) {
                    onDelete(initialProject!.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                删除项目
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>{isEditing ? '保存修改并同步云端' : '立即创建并同步到账号'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
