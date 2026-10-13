import React from 'react';
import { ChevronRight, CornerLeftUp, Layers } from 'lucide-react';
import { VaultFolder } from '../types';
import { VaultIcon } from '../utils/iconRegistry';

export interface BreadcrumbNode {
  id: number | null;
  name: string;
  icon?: string | null;
  isRoot: boolean;
  itemCount: number;
  subfolderCount?: number;
}

interface VaultBreadcrumbsProps {
  breadcrumbs: BreadcrumbNode[];
  activeFolderId: number | null;
  folders: VaultFolder[];
  onSelectFolder: (id: number | null) => void;
  onDrop: (e: React.DragEvent, targetFolderId: number | null) => void;
  dropTargetId: number | 'root' | null;
  setDropTargetId: (id: number | 'root' | null) => void;
}

export const VaultBreadcrumbs: React.FC<VaultBreadcrumbsProps> = ({
  breadcrumbs,
  activeFolderId,
  folders,
  onSelectFolder,
  onDrop,
  dropTargetId,
  setDropTargetId,
}) => {
  // Find parent folder for "Up" button
  const currentFolder = folders.find((f) => f.id === activeFolderId);
  const parentFolder = currentFolder
    ? currentFolder.parentFolderId !== null
      ? folders.find((f) => f.id === currentFolder.parentFolderId)
      : { id: null, name: 'All Passwords' }
    : null;

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Up Button: Only when inside a folder */}
      {activeFolderId !== null && (
        <button
          type="button"
          onClick={() => onSelectFolder(parentFolder ? parentFolder.id : null)}
          title={`Go back up to ${parentFolder?.name || 'All Passwords'}`}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-medium transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <CornerLeftUp size={13} className="text-emerald-400" />
          <span className="text-[11px]">Up</span>
        </button>
      )}

      {/* Breadcrumb Capsule Path */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 bg-neutral-900/80 border border-neutral-800/80 rounded-xl px-2 py-1 overflow-x-auto scrollbar-none"
      >
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isDropTarget = dropTargetId === (crumb.id ?? 'root');

          return (
            <React.Fragment key={crumb.id ?? 'root'}>
              {idx > 0 && (
                <ChevronRight size={12} className="text-neutral-600 shrink-0 mx-0.5" />
              )}

              <button
                type="button"
                onClick={() => onSelectFolder(crumb.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropTargetId(crumb.id ?? 'root');
                }}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => onDrop(e, crumb.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isLast
                    ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-semibold shadow-sm'
                    : isDropTarget
                    ? 'bg-emerald-500/25 border border-emerald-400 text-white ring-2 ring-emerald-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80 border border-transparent'
                }`}
              >
                {crumb.isRoot ? (
                  <Layers size={13} className={isLast ? 'text-emerald-400' : 'text-neutral-500'} />
                ) : (
                  <VaultIcon
                    iconId={crumb.icon}
                    defaultType="folder"
                    size={13}
                    className={isLast ? 'text-emerald-400' : 'text-amber-400'}
                  />
                )}
                <span className="truncate max-w-[140px]">{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
