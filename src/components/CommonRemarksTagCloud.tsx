import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Sparkles,
  Flame,
  Plus,
  X,
  Check,
  Star,
  Settings2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { Transaction } from '../types';
import {
  getStoredCustomRemarks,
  saveStoredCustomRemarks,
  addCustomRemark,
  removeCustomRemark,
  getAggregatedRemarks,
  RemarkItem,
} from '../lib/remarks';

interface CommonRemarksTagCloudProps {
  currentCategory?: string;
  currentDescription?: string;
  onSelectRemark: (remark: string, mode?: 'replace' | 'append') => void;
  allTransactions?: Transaction[];
  userId?: string;
  variant?: 'modal' | 'filter';
  className?: string;
}

type TabType = 'RECOMMENDED' | 'HISTORY' | 'CUSTOM' | 'ALL';

export const CommonRemarksTagCloud: React.FC<CommonRemarksTagCloudProps> = ({
  currentCategory = '',
  currentDescription = '',
  onSelectRemark,
  allTransactions = [],
  userId,
  variant = 'modal',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('RECOMMENDED');
  const [insertMode, setInsertMode] = useState<'replace' | 'append'>('replace');
  const [customRemarks, setCustomRemarks] = useState<string[]>(() =>
    getStoredCustomRemarks(userId)
  );
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newRemarkInput, setNewRemarkInput] = useState<string>('');
  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // 同步用户专属自定义备注变化 (跨组件或跨标签页监听)
  useEffect(() => {
    setCustomRemarks(getStoredCustomRemarks(userId));
    const handleRemarksChanged = (e: any) => {
      if (!userId || e.detail?.userId === userId) {
        setCustomRemarks(getStoredCustomRemarks(userId));
      }
    };
    window.addEventListener('asset_vault_common_remarks_changed', handleRemarksChanged);
    return () => {
      window.removeEventListener('asset_vault_common_remarks_changed', handleRemarksChanged);
    };
  }, [userId]);

  // 计算聚合的常用备注
  const {
    categoryMatched,
    historicalFrequent,
    customItems,
    presetGeneral,
    allCombined,
  } = useMemo(() => {
    return getAggregatedRemarks({
      category: currentCategory,
      transactions: allTransactions,
      customRemarks,
      maxItems: 30,
    });
  }, [currentCategory, allTransactions, customRemarks]);

  // 根据当前激活的标签页筛选呈现的列表
  const displayedRemarks: RemarkItem[] = useMemo(() => {
    switch (activeTab) {
      case 'RECOMMENDED': {
        // 推荐视图: 优先展示与当前分类契合的项 + 用户自定义项 + 历史高频前5
        const list: RemarkItem[] = [];
        const seen = new Set<string>();

        // 1. 分类契合
        categoryMatched.forEach((item) => {
          if (!seen.has(item.text)) {
            seen.add(item.text);
            list.push(item);
          }
        });
        // 2. 自定义
        customItems.forEach((item) => {
          if (!seen.has(item.text)) {
            seen.add(item.text);
            list.push(item);
          }
        });
        // 3. 历史高频
        historicalFrequent.slice(0, 6).forEach((item) => {
          if (!seen.has(item.text)) {
            seen.add(item.text);
            list.push(item);
          }
        });
        // 4. 若列表较少，补充通用预设
        if (list.length < 12) {
          presetGeneral.forEach((item) => {
            if (!seen.has(item.text) && list.length < 16) {
              seen.add(item.text);
              list.push(item);
            }
          });
        }
        return list;
      }
      case 'HISTORY':
        return historicalFrequent.length > 0 ? historicalFrequent : presetGeneral.slice(0, 10);
      case 'CUSTOM':
        return customItems;
      case 'ALL':
      default:
        return allCombined;
    }
  }, [activeTab, categoryMatched, customItems, historicalFrequent, presetGeneral, allCombined]);

  // 点击添加新自定义常用备注
  const handleAddNewRemark = () => {
    const trimmed = newRemarkInput.trim();
    if (!trimmed) return;
    const updated = addCustomRemark(trimmed, userId);
    setCustomRemarks(updated);
    setNewRemarkInput('');
    setIsAddingNew(false);
    triggerFeedback(`✨ 已新增常用备注「${trimmed}」`);
  };

  // 点击删除某个自定义常用备注
  const handleDeleteCustomRemark = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeCustomRemark(text, userId);
    setCustomRemarks(updated);
    triggerFeedback(`🗑️ 已移除常用备注「${text}」`);
  };

  // 点击某个备注标签
  const handleTagClick = (text: string) => {
    onSelectRemark(text, insertMode);
    triggerFeedback(`✓ 已填入「${text}」`);
  };

  const triggerFeedback = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 1800);
  };

  const isModal = variant === 'modal';

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isModal
          ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 p-3'
          : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 p-3 shadow-xs'
      } ${className}`}
    >
      {/* 顶部标题与功能操作栏 */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>常用备注标签云</span>
          </div>

          {currentCategory && (
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md truncate max-w-[100px]">
              {currentCategory}联动
            </span>
          )}

          {/* 状态轻提示 */}
          {feedbackToast && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 animate-in fade-in zoom-in-95 duration-150">
              {feedbackToast}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* 追加 / 覆盖切换 (仅在记账弹窗填入模式下生效) */}
          {isModal && (
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-700/70 p-0.5 rounded-lg text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setInsertMode('replace')}
                className={`px-1.5 py-0.5 rounded-md transition-all ${
                  insertMode === 'replace'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
                title="点击标签时直接替换当前输入的备注内容"
              >
                覆盖
              </button>
              <button
                type="button"
                onClick={() => setInsertMode('append')}
                className={`px-1.5 py-0.5 rounded-md transition-all ${
                  insertMode === 'append'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
                title="点击标签时在已有备注后空格追加"
              >
                追加
              </button>
            </div>
          )}

          {/* 新增自定义备注按钮 */}
          <button
            type="button"
            onClick={() => {
              setIsAddingNew((prev) => !prev);
              if (!isAddingNew) setActiveTab('CUSTOM');
            }}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors font-medium shadow-2xs"
            title="添加我常用的专属记账短语"
          >
            <Plus className="w-3 h-3" />
            <span>{isAddingNew ? '取消' : '新建'}</span>
          </button>

          {/* 管理模式 (删除自定义备注) */}
          {customRemarks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsManageMode((prev) => !prev);
                if (!isManageMode) setActiveTab('CUSTOM');
              }}
              className={`p-1 rounded-lg border transition-colors ${
                isManageMode
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title={isManageMode ? '退出管理' : '管理/删除我的自定义备注'}
            >
              <Settings2 className="w-3 h-3" />
            </button>
          )}

          {/* 折叠/展开标签云 */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title={isCollapsed ? '展开常用备注' : '收起常用备注'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-2">
          {/* 新建备注输入行 */}
          {isAddingNew && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 animate-in fade-in duration-150">
              <input
                type="text"
                value={newRemarkInput}
                onChange={(e) => setNewRemarkInput(e.target.value)}
                placeholder="输入常用备注短语 (如 自驾洗车、洗发水、房贷利息)..."
                className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewRemark();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewRemark}
                disabled={!newRemarkInput.trim()}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs whitespace-nowrap"
              >
                保存为常用
              </button>
            </div>
          )}

          {/* 分类筛选 Tab 导航 */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('RECOMMENDED')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'RECOMMENDED'
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>智能推荐</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'HISTORY'
                  ? 'bg-amber-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>历史高频 {historicalFrequent.length > 0 ? `(${historicalFrequent.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CUSTOM')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'CUSTOM'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Star className="w-3 h-3 text-emerald-400" />
              <span>我的自定义 {customRemarks.length > 0 ? `(${customRemarks.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-slate-800 dark:bg-slate-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>全部标签</span>
            </button>
          </div>

          {/* 标签云主体 Chip Badges 区域 */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto p-1 modal-custom-scrollbar">
            {displayedRemarks.length === 0 ? (
              <div className="w-full text-center py-4 text-xs text-slate-400 dark:text-slate-500">
                {activeTab === 'CUSTOM'
                  ? '暂未添加自定义常用备注，点击上方「新建」即可快速添加'
                  : activeTab === 'HISTORY'
                  ? '暂未统计到历史高频记账备注，多记几笔即可智能生成'
                  : '暂无推荐备注'}
              </div>
            ) : (
              displayedRemarks.map((item) => {
                const isSelected =
                  currentDescription === item.text ||
                  (currentDescription.split(/\s+/).includes(item.text));

                const isCustom = item.source === 'custom';
                const isHistorical = item.source === 'history';
                const isCategoryMatched = item.source === 'category';

                return (
                  <div
                    key={item.id}
                    className={`group inline-flex items-center text-xs font-medium rounded-xl border transition-all select-none cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                        : isCategoryMatched
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                        : isHistorical
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200/70 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                        : isCustom
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                    onClick={() => handleTagClick(item.text)}
                    title={
                      isSelected
                        ? `当前备注已包含「${item.text}」`
                        : `点击快速填入备注「${item.text}」${insertMode === 'append' ? ' (追加)' : ''}`
                    }
                  >
                    <span className="px-2.5 py-1 flex items-center gap-1.5">
                      {isHistorical && item.count && item.count > 1 && (
                        <span className="flex items-center gap-0.5 text-[10px] opacity-80 font-mono">
                          <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>{item.count}</span>
                        </span>
                      )}
                      <span>{item.text}</span>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>

                    {/* 自定义备注的快捷删除按钮 */}
                    {(isCustom || isManageMode) && isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomRemark(item.text, e)}
                        className={`pr-2 pl-0.5 text-slate-400 hover:text-rose-500 transition-colors ${
                          isManageMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title={`删除自定义备注「${item.text}」`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
