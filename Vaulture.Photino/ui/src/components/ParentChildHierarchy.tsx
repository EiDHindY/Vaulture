import React from 'react';
import { Plus, ArrowRight, CornerLeftUp, Layers } from 'lucide-react';
import { VaultFolder, VaultEntry } from '../types';
import { VaultIcon } from '../utils/iconRegistry';

interface ParentChildHierarchyProps {
  activeFolderId: number | null;
  folders: VaultFolder[];
  entries: VaultEntry[];
  isPanelOpen?: boolean;
  onSelectFolder: (id: number | null) => void;
  onCreateFolder: (parentFolderId: number | null) => void;
  onOpenIconPicker: (folder: VaultFolder) => void;
  onContextMenu: (e: React.MouseEvent, folderId: number) => void;
  handleDragStart: (e: React.DragEvent, type: 'entry' | 'folder', id: number) => void;
  handleDrop: (e: React.DragEvent, targetFolderId: number | null) => void;
  dropTargetId: number | 'root' | null;
  setDropTargetId: (id: number | 'root' | null) => void;
}

export const ParentChildHierarchy: React.FC<ParentChildHierarchyProps> = ({
  activeFolderId,
  folders,
  entries,
  isPanelOpen = false,
  onSelectFolder,
  onCreateFolder,
  onOpenIconPicker,
  onContextMenu,
  handleDragStart,
  handleDrop,
  dropTargetId,
  setDropTargetId,
}) => {
  // Current active folder (null if at Root)
  const activeFolder = activeFolderId !== null
    ? folders.find((f) => f.id === activeFolderId) || null
    : null;

  // Children of the active folder
  const childFolders = folders.filter((f) => f.parentFolderId === activeFolderId);

  // Precompute stats for all folders using useMemo to avoid O(N^2) recursive walks on render
  const folderStatsMap = React.useMemo(() => {
    const descMap = new Map<number, Set<number>>();
    const getDesc = (id: number): Set<number> => {
      if (descMap.has(id)) return descMap.get(id)!;
      const s = new Set<number>([id]);
      const children = folders.filter((f) => f.parentFolderId === id);
      for (const c of children) {
        for (const d of getDesc(c.id)) {
          s.add(d);
        }
      }
      descMap.set(id, s);
      return s;
    };
    folders.forEach((f) => getDesc(f.id));

    const entryFolderCounts = new Map<number, number>();
    for (const e of entries) {
      if (e.folderId !== null) {
        entryFolderCounts.set(e.folderId, (entryFolderCounts.get(e.folderId) || 0) + 1);
      }
    }

    const subCounts = new Map<number, number>();
    for (const f of folders) {
      if (f.parentFolderId !== null) {
        subCounts.set(f.parentFolderId, (subCounts.get(f.parentFolderId) || 0) + 1);
      }
    }

    const stats = new Map<number, { totalCount: number; directCount: number; subCount: number }>();
    for (const f of folders) {
      const allIds = descMap.get(f.id) || new Set([f.id]);
      let totalCount = 0;
      allIds.forEach((id) => {
        totalCount += entryFolderCounts.get(id) || 0;
      });
      const directCount = entryFolderCounts.get(f.id) || 0;
      const subCount = subCounts.get(f.id) || 0;
      stats.set(f.id, { totalCount, directCount, subCount });
    }
    return stats;
  }, [folders, entries]);

  const getFolderStats = (folderId: number) => {
    return folderStatsMap.get(folderId) || { totalCount: 0, directCount: 0, subCount: 0 };
  };

  // Parent of the active folder (if activeFolder is not null)
  const parentOfActive = activeFolder
    ? activeFolder.parentFolderId !== null
      ? folders.find((f) => f.id === activeFolder.parentFolderId) || null
      : { id: null, name: 'All Passwords', icon: null }
    : null;

  return (
    <div className="p-3.5 bg-[#111111] border border-neutral-800 rounded-2xl space-y-3">
      {/* Section Title */}
      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-1">
        <span>
          {activeFolder ? `${activeFolder.name} Hierarchy` : 'Vault Folders'}
        </span>
        <button
          type="button"
          onClick={() => onCreateFolder(activeFolderId)}
          className="text-neutral-400 hover:text-emerald-400 text-xs flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} /> New Subfolder
        </button>
      </div>

      {/* Visual Flow: PARENT ──► CHILDREN */}
      <div className={`flex ${isPanelOpen ? 'flex-col gap-2.5' : 'flex-col lg:flex-row lg:items-center gap-3'}`}>
        {/* ========================================= */}
        {/* 1. THE PARENT CARD                        */}
        {/* ========================================= */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropTargetId(activeFolderId ?? 'root');
          }}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={(e) => handleDrop(e, activeFolderId)}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            isPanelOpen ? 'w-full' : 'shrink-0 min-w-[200px] lg:max-w-[260px]'
          } ${
            dropTargetId === (activeFolderId ?? 'root')
              ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-neutral-900 border-emerald-500/40'
          }`}
        >
          {/* Parent Icon */}
          <div
            onClick={(e) => {
              if (activeFolder) {
                e.stopPropagation();
                onOpenIconPicker(activeFolder);
              }
            }}
            title={activeFolder ? 'Click to change folder icon' : undefined}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              activeFolder
                ? 'bg-neutral-800 border-neutral-700/80 hover:scale-105 cursor-pointer'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {activeFolder ? (
              <VaultIcon
                iconId={activeFolder.icon}
                defaultType="folder"
                size={20}
                className="text-amber-400"
              />
            ) : (
              <Layers size={20} />
            )}
          </div>

          {/* Parent Info */}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              {activeFolder ? 'Current Parent' : 'Vault Root'}
            </span>
            <p className="text-xs font-bold text-white truncate">
              {activeFolder ? activeFolder.name : 'All Passwords'}
            </p>
            <p className="text-[10px] text-neutral-400">
              {activeFolder === null
                ? `${childFolders.length} folders • ${entries.length} items`
                : `${childFolders.length} subfolders • ${getFolderStats(activeFolder.id).totalCount} items`}
            </p>
          </div>
        </div>

        {/* Visual Connector Arrow */}
        {isPanelOpen ? (
          <div className="flex items-center gap-2 text-[10px] text-neutral-500 px-1">
            <span className="h-px bg-neutral-800 flex-1" />
            <span className="text-emerald-500/80 font-mono text-[10px]">▼ Contains</span>
            <span className="h-px bg-neutral-800 flex-1" />
          </div>
        ) : (
          <>
            <div className="hidden lg:flex items-center justify-center text-neutral-600 px-1">
              <ArrowRight size={18} className="text-emerald-500/70" />
            </div>

            <div className="flex lg:hidden items-center gap-2 text-[10px] text-neutral-500 px-1">
              <span className="h-px bg-neutral-800 flex-1" />
              <span>Contains</span>
              <span className="h-px bg-neutral-800 flex-1" />
            </div>
          </>
        )}

        {/* ========================================= */}
        {/* 2. THE CHILDREN TILES                     */}
        {/* ========================================= */}
        <div className="flex-1 min-w-0">
          {childFolders.length > 0 ? (
            <div className={`grid gap-2 ${isPanelOpen ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'}`}>
              {childFolders.map((sub) => {
                const isDrop = dropTargetId === sub.id;
                const { totalCount, subCount } = getFolderStats(sub.id);

                return (
                  <div
                    key={sub.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, 'folder', sub.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropTargetId(sub.id);
                    }}
                    onDragLeave={() => setDropTargetId(null)}
                    onDrop={(e) => handleDrop(e, sub.id)}
                    onContextMenu={(e) => onContextMenu(e, sub.id)}
                    onClick={() => onSelectFolder(sub.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer group ${
                      isDrop
                        ? 'bg-emerald-500/25 border-emerald-400 scale-[1.02]'
                        : 'bg-[#161616] hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenIconPicker(sub);
                      }}
                      title="Click to change icon"
                      className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 flex items-center justify-center shrink-0"
                    >
                      <VaultIcon
                        iconId={sub.icon}
                        defaultType="folder"
                        size={16}
                        className="text-amber-400"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-300">
                        {sub.name}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {totalCount} items {subCount > 0 && `• ${subCount} subfolders`}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Add Subfolder Tile */}
              <button
                type="button"
                onClick={() => onCreateFolder(activeFolderId)}
                className="p-2.5 rounded-xl border border-dashed border-neutral-800 hover:border-emerald-500/50 bg-[#0e0e0e] hover:bg-emerald-950/20 text-neutral-400 hover:text-emerald-400 flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <div className="w-8 h-8 rounded-lg border border-neutral-800 flex items-center justify-center shrink-0">
                  <Plus size={15} />
                </div>
                <span className="truncate">Add Subfolder</span>
              </button>
            </div>
          ) : (
            /* When this folder has no children (e.g. Pros in Screenshot 1) */
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl border border-neutral-800/60 bg-neutral-900/30 text-xs">
              <div className="text-neutral-400 min-w-0 flex-1">
                <span className="font-semibold text-neutral-300 block truncate">
                  {activeFolder ? `No subfolders inside ${activeFolder.name}` : 'No folders in vault'}
                </span>
                {parentOfActive && (
                  <p className="text-[10px] text-neutral-500 mt-0.5 truncate">
                    Child of <strong className="text-neutral-400">{parentOfActive.name}</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {parentOfActive && (
                  <button
                    type="button"
                    onClick={() => onSelectFolder(parentOfActive.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CornerLeftUp size={12} className="text-emerald-400" />
                    <span>Go to {parentOfActive.name}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onCreateFolder(activeFolderId)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={12} />
                  <span>Add Subfolder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
