import React, { useState } from 'react';
import {
  FolderKanban,
  Move,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Check,
} from 'lucide-react';
import { ProjectBadgePosition } from '../types';

interface ProjectBadgeOverlayProps {
  projectName: string;
  projectColor?: string;
  position?: ProjectBadgePosition;
  onPositionChange?: (newPos: ProjectBadgePosition) => void;
  interactive?: boolean;
  className?: string;
}

export const ProjectBadgeOverlay: React.FC<ProjectBadgeOverlayProps> = ({
  projectName,
  projectColor = '#0d9488',
  position = 'top-left',
  onPositionChange,
  interactive = true,
  className = '',
}) => {
  const [showPosMenu, setShowPosMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Position coordinates on the card
  const posClasses: Record<ProjectBadgePosition, string> = {
    'top-left': 'top-2.5 left-2.5 sm:top-3 sm:left-3',
    'top-right': 'top-2.5 right-2.5 sm:top-3 sm:right-3',
    'bottom-left': 'bottom-2.5 left-2.5 sm:bottom-3 sm:left-3',
    'bottom-right': 'bottom-2.5 right-2.5 sm:bottom-3 sm:right-3',
  };

  const handleSelectPos = (e: React.MouseEvent, newPos: ProjectBadgePosition) => {
    e.stopPropagation();
    e.preventDefault();
    if (onPositionChange) {
      onPositionChange(newPos);
    }
    setShowPosMenu(false);
  };

  const cycleNextPos = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const order: ProjectBadgePosition[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
    const currentPos: ProjectBadgePosition = (position as ProjectBadgePosition) || 'top-left';
    const currIdx = order.indexOf(currentPos);
    const nextPos = order[(currIdx + 1) % order.length];
    if (onPositionChange) {
      onPositionChange(nextPos);
    }
  };

  return (
    <>
      {/* 1. Main Project Badge */}
      <div
        className={`absolute z-30 transition-all duration-300 pointer-events-auto ${posClasses[position]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative group/badge">
          <div
            onClick={interactive ? cycleNextPos : undefined}
            onContextMenu={(e) => {
              if (interactive) {
                e.preventDefault();
                setShowPosMenu(!showPosMenu);
              }
            }}
            draggable={interactive}
            onDragStart={(e) => {
              setIsDragging(true);
              e.dataTransfer.setData('text/plain', position);
            }}
            onDragEnd={() => setIsDragging(false)}
            title={interactive ? '🏷️ 项目角标：点击切换角落位置，或右键/长按自选位置' : '🏷️ 所属账本项目'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shadow-md backdrop-blur-md border transition-all select-none ${
              interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
            }`}
            style={{
              backgroundColor: `${projectColor}25`,
              borderColor: `${projectColor}60`,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.85)',
            }}
          >
            {/* Color Dot / Icon */}
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: projectColor }}
            />
            <span className="truncate max-w-[100px] sm:max-w-[130px] font-medium tracking-wide">
              {projectName}
            </span>

            {/* Move indicator icon on interactive */}
            {interactive && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPosMenu(!showPosMenu);
                }}
                className="p-0.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="选择角标位置"
              >
                <Move className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          {/* 4-Corner Quick Position Picker Popover */}
          {interactive && showPosMenu && (
            <div
              className={`absolute mt-1 p-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl z-50 flex items-center gap-1 min-w-[140px] text-white ${
                position.includes('bottom') ? 'bottom-full mb-1' : 'top-full mt-1'
              } ${position.includes('right') ? 'right-0' : 'left-0'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => handleSelectPos(e, 'top-left')}
                className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                  position === 'top-left'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title="左上角"
              >
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => handleSelectPos(e, 'top-right')}
                className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                  position === 'top-right'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title="右上角"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => handleSelectPos(e, 'bottom-left')}
                className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                  position === 'bottom-left'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title="左下角"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => handleSelectPos(e, 'bottom-right')}
                className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                  position === 'bottom-right'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title="右下角"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Drag & Drop 4-Corner Drop Target Zones (Visible when dragging) */}
      {interactive && isDragging && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-2xs rounded-[20px] p-2 grid grid-cols-2 grid-rows-2 gap-2 pointer-events-auto">
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as ProjectBadgePosition[]).map(
            (pos) => (
              <div
                key={pos}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (onPositionChange) onPositionChange(pos);
                }}
                className={`border-2 border-dashed rounded-xl flex items-center justify-center transition-all ${
                  position === pos
                    ? 'border-indigo-400 bg-indigo-500/30 text-white'
                    : 'border-white/40 hover:border-white hover:bg-white/20 text-white/80'
                }`}
              >
                <span className="text-[11px] font-bold">
                  {pos === 'top-left' && '↖ 移动到左上'}
                  {pos === 'top-right' && '↗ 移动到右上'}
                  {pos === 'bottom-left' && '↙ 移动到左下'}
                  {pos === 'bottom-right' && '↘ 移动到右下'}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
};
