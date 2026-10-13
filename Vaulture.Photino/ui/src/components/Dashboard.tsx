import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import {
  Plus,
  Lock,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Edit3,
  RefreshCw,
  Sparkles,
  Search,
  X,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Layers,
  History,
  RotateCcw,
  KeyRound,
  CornerDownRight
} from 'lucide-react';
import { VaultEntry, VaultFolder, UserProfile } from '../types';
import {
  generateSecurePassword,
  extractDomain,
  formatDate,
  calculatePasswordStrength
} from '../utils/security';
import { VaultIcon } from '../utils/iconRegistry';
import { IconPickerModal } from './IconPickerModal';
import { VaultBreadcrumbs, BreadcrumbNode } from './VaultBreadcrumbs';
import { ParentChildHierarchy } from './ParentChildHierarchy';
import logoUrl from '../assets/logo.png';

interface DashboardProps {
  onLock: () => void;
  onWipeVault: () => void;
}

// ---------------------------------------------------------------------------
// PasswordItem — memoized so it only re-renders when its own props change.
// Previously this was an inline renderPasswordItem() call inside Dashboard,
// meaning every state change (copiedField, dropTargetId, searchMatchIndex…)
// caused the entire list to re-render from scratch.
// ---------------------------------------------------------------------------
interface PasswordItemProps {
  item: VaultEntry;
  isSelected: boolean;
  isCopied: boolean;
  isCurrentSearchMatch: boolean;
  searchQuery: string;
  onSelect: (id: number) => void;
  onCopy: (text: string, fieldId: string) => void;
  onDragStart: (e: React.DragEvent, type: 'entry' | 'folder', id: number) => void;
  onOpenIconPicker: (item: VaultEntry) => void;
  highlightText: (text: string | null | undefined, query: string, isCurrent: boolean) => React.ReactNode;
  extractDomain: (url: string) => string;
}

const PasswordItem = memo(({
  item,
  isSelected,
  isCopied,
  isCurrentSearchMatch,
  searchQuery,
  onSelect,
  onCopy,
  onDragStart,
  onOpenIconPicker,
  highlightText,
  extractDomain,
}: PasswordItemProps) => {
  return (
    <div
      id={`entry-card-${item.id}`}
      draggable={true}
      onDragStart={(e) => onDragStart(e, 'entry', item.id)}
      onClick={() => onSelect(item.id)}
      className={`p-3 rounded-xl cursor-pointer flex items-center justify-between group relative border-l-4 ${
        isCurrentSearchMatch
          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 bg-neutral-900 border-t border-r border-b border-amber-500/50 border-l-amber-400 text-white'
          : isSelected
          ? 'bg-neutral-900 border-t border-r border-b border-emerald-500/50 border-l-emerald-400 text-white ring-1 ring-emerald-500/30'
          : 'bg-[#141414] hover:bg-neutral-900 border-t border-r border-b border-neutral-800 hover:border-neutral-700 border-l-emerald-500 hover:border-l-emerald-400 text-neutral-300'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Credential Icon with Key badge */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenIconPicker(item);
          }}
          title="Click to change icon"
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer relative ${
            isCurrentSearchMatch
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : isSelected
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-neutral-800 border border-neutral-700 text-emerald-400 group-hover:border-neutral-600'
          }`}
        >
          <VaultIcon iconId={item.icon} url={item.url} size={20} />
          {/* Dedicated Emerald Key Mini Badge */}
          <div
            title="Password Credential"
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${
              isCurrentSearchMatch ? 'bg-amber-400 text-neutral-950' : 'bg-emerald-500 text-neutral-950'
            } flex items-center justify-center ring-2 ring-neutral-900`}
          >
            <Key size={9} strokeWidth={2.5} />
          </div>
        </div>

        {/* Credential Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold truncate text-white group-hover:text-emerald-200">
              {highlightText(item.title, searchQuery, isCurrentSearchMatch)}
            </h4>
            {/* Unmistakable Password Badge */}
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              isCurrentSearchMatch
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
            } font-mono font-medium flex items-center gap-1 shrink-0`}>
              <Key size={9} /> Password
            </span>
          </div>

          {/* Username & Masked Password Dots */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 min-w-0">
            <span className="truncate max-w-[150px] sm:max-w-[220px] font-medium text-neutral-300">
              {highlightText(item.username || (item.url ? extractDomain(item.url) : 'No username'), searchQuery, isCurrentSearchMatch)}
            </span>
            {item.password && (
              <>
                <span className="text-neutral-600 shrink-0">•</span>
                <span className="font-mono tracking-widest text-neutral-500 group-hover:text-neutral-400 text-[11px] select-none shrink-0">
                  ••••••••••••
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls: Copy Password Pill & Chevron */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {item.password && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(item.password, `list-pass-${item.id}`);
            }}
            title="Copy Password"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer border ${
              isCopied
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 hover:border-emerald-500/40 text-neutral-300 hover:text-white'
            }`}
          >
            {isCopied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-[11px] text-emerald-300 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-neutral-400 group-hover:text-emerald-400" />
                <span className="text-[11px] text-neutral-300 font-mono">Copy</span>
              </>
            )}
          </button>
        )}

        <div
          className={`p-1 ${
            isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-neutral-600 group-hover:text-neutral-400'
          }`}
        >
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
});
PasswordItem.displayName = 'PasswordItem';

// ---------------------------------------------------------------------------
// HierarchicalFolder — memoized folder card rendered in the "All Passwords"
// view. Extracted from renderHierarchicalFolder() for the same reason.
// ---------------------------------------------------------------------------
interface HierarchicalFolderProps {
  folder: VaultFolder;
  level: number;
  folders: VaultFolder[];
  filteredEntriesByFolder: Map<number, VaultEntry[]>;
  folderDescendantsMap: Map<number, Set<number>>;
  searchQuery: string;
  dropTargetId: number | 'root' | null;
  selectedEntryId: number | null;
  isEditing: boolean;
  copiedField: string | null;
  searchMatchIndex: number;
  filteredEntries: VaultEntry[];
  onSelectFolder: (id: number) => void;
  onDrop: (e: React.DragEvent, targetFolderId: number | null) => void;
  onDragOver: (e: React.DragEvent, id: number) => void;
  onDragLeave: () => void;
  onSelect: (id: number) => void;
  onCopy: (text: string, fieldId: string) => void;
  onDragStart: (e: React.DragEvent, type: 'entry' | 'folder', id: number) => void;
  onOpenIconPicker: (item: VaultEntry) => void;
  highlightText: (text: string | null | undefined, query: string, isCurrent: boolean) => React.ReactNode;
  extractDomainFn: (url: string) => string;
}

const HierarchicalFolder = memo(({
  folder,
  level,
  folders,
  filteredEntriesByFolder,
  folderDescendantsMap,
  searchQuery,
  dropTargetId,
  selectedEntryId,
  isEditing,
  copiedField,
  searchMatchIndex,
  filteredEntries,
  onSelectFolder,
  onDrop,
  onDragOver,
  onDragLeave,
  onSelect,
  onCopy,
  onDragStart,
  onOpenIconPicker,
  highlightText,
  extractDomainFn,
}: HierarchicalFolderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const allDescendantIds = folderDescendantsMap.get(folder.id) || new Set([folder.id]);

  const directItems = filteredEntriesByFolder.get(folder.id) || [];

  let totalMatchingCount = 0;
  allDescendantIds.forEach((descId) => {
    const items = filteredEntriesByFolder.get(descId);
    if (items) totalMatchingCount += items.length;
  });

  const isSearchActive = Boolean(searchQuery.trim());
  const isExpanded = isSearchActive ? totalMatchingCount > 0 : !isCollapsed;

  // Mount children while expanded or during the 200ms collapse transition, then unmount for fast scrolling
  const [shouldRender, setShouldRender] = useState(isExpanded);
  const [isVisualOpen, setIsVisualOpen] = useState(isExpanded);

  useEffect(() => {
    let rafId1 = 0;
    let rafId2 = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (isExpanded) {
      setShouldRender(true);
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          setIsVisualOpen(true);
        });
      });
    } else {
      setIsVisualOpen(false);
      timerId = setTimeout(() => {
        setShouldRender(false);
      }, 220);
    }

    return () => {
      if (rafId1) cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      if (timerId) clearTimeout(timerId);
    };
  }, [isExpanded]);

  if (isSearchActive && totalMatchingCount === 0) return null;

  const childFolders = folders.filter((f) => f.parentFolderId === folder.id);
  const parent = folder.parentFolderId ? folders.find((f) => f.id === folder.parentFolderId) : null;
  const isDrop = dropTargetId === folder.id;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(e, folder.id); }}
      onDragLeave={(e) => { e.stopPropagation(); onDragLeave(); }}
      onDrop={(e) => onDrop(e, folder.id)}
      className={`rounded-2xl border px-3.5 py-2.5 ${
        isDrop
          ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30'
          : level === 0
          ? 'bg-[#0d0d0d] border-neutral-800'
          : 'bg-[#121212] border-neutral-800/80'
      }`}
    >
      {/* Collapsible Dropdown Folder Header */}
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex items-center justify-between px-1 cursor-pointer group/header select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {level > 0 && (
            <CornerDownRight size={13} className="text-emerald-500/80 shrink-0" />
          )}

          {/* Animated Dropdown Chevron */}
          <div className="p-0.5 rounded hover:bg-neutral-800 text-neutral-400 group-hover/header:text-white shrink-0">
            <ChevronRight
              size={15}
              className={`transition-transform duration-200 ease-out ${
                isExpanded ? 'rotate-90 text-emerald-400' : ''
              }`}
            />
          </div>

          {!folder.icon && isExpanded ? (
            <FolderOpen size={15} className="text-amber-400 shrink-0" />
          ) : (
            <VaultIcon
              iconId={folder.icon}
              defaultType="folder"
              size={15}
              className="text-amber-400 shrink-0"
            />
          )}

          <span className="text-xs font-bold text-neutral-200 group-hover/header:text-white tracking-wide truncate">
            {folder.name}
          </span>

          {level > 0 && parent && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/50 hidden sm:inline truncate max-w-[130px]">
              Subfolder of {parent.name}
            </span>
          )}

          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono font-medium shrink-0">
            {totalMatchingCount}
          </span>

          {childFolders.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800/80 text-neutral-400 font-mono hidden sm:inline shrink-0">
              {childFolders.length} {childFolders.length === 1 ? 'subfolder' : 'subfolders'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectFolder(folder.id);
          }}
          className="text-[11px] text-neutral-400 hover:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-neutral-800/70 cursor-pointer shrink-0"
        >
          <span>Open Folder</span>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Animated Dropdown Body: Direct Passwords + Nested Child Folders */}
      {shouldRender && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            isVisualOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-2.5 pt-2.5">
              {/* Direct Passwords in this folder */}
              {directItems.length > 0 && (
                <div className="space-y-2">
                  {directItems.map((item) => (
                    <PasswordItem
                      key={item.id}
                      item={item}
                      isSelected={selectedEntryId === item.id && !isEditing}
                      isCopied={copiedField === `list-pass-${item.id}`}
                      isCurrentSearchMatch={isSearchActive && filteredEntries[searchMatchIndex]?.id === item.id}
                      searchQuery={searchQuery}
                      onSelect={onSelect}
                      onCopy={onCopy}
                      onDragStart={onDragStart}
                      onOpenIconPicker={onOpenIconPicker}
                      highlightText={highlightText}
                      extractDomain={extractDomainFn}
                    />
                  ))}
                </div>
              )}

              {/* Nested Child Folders */}
              {childFolders.length > 0 && (
                <div className="pl-3 border-l-2 border-emerald-500/25 space-y-2 ml-1.5 mt-1">
                  {childFolders.map((child) => (
                    <HierarchicalFolder
                      key={child.id}
                      folder={child}
                      level={level + 1}
                      folders={folders}
                      filteredEntriesByFolder={filteredEntriesByFolder}
                      folderDescendantsMap={folderDescendantsMap}
                      searchQuery={searchQuery}
                      dropTargetId={dropTargetId}
                      selectedEntryId={selectedEntryId}
                      isEditing={isEditing}
                      copiedField={copiedField}
                      searchMatchIndex={searchMatchIndex}
                      filteredEntries={filteredEntries}
                      onSelectFolder={onSelectFolder}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onSelect={onSelect}
                      onCopy={onCopy}
                      onDragStart={onDragStart}
                      onOpenIconPicker={onOpenIconPicker}
                      highlightText={highlightText}
                      extractDomainFn={extractDomainFn}
                    />
                  ))}
                </div>
              )}

              {/* Empty state when folder has neither passwords nor subfolders */}
              {directItems.length === 0 && childFolders.length === 0 && (
                <div className="py-2.5 px-3 text-center border border-dashed border-neutral-800/70 rounded-xl bg-[#0a0a0a]">
                  <p className="text-[11px] text-neutral-500">
                    Empty folder — drag passwords here or click "Open Folder"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
HierarchicalFolder.displayName = 'HierarchicalFolder';

export const Dashboard: React.FC<DashboardProps> = ({ onLock }) => {
  // Core Data State
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [user, setUser] = useState<UserProfile>({
    name: 'Vaulture User',
    email: '',
    picture: '',
    isLinked: false,
  });
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Navigation & Hierarchy State
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null); // null means "All Passwords" (root)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const middleScrollRef = useRef<HTMLDivElement>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  // Folder Operations State
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [dropTargetId, setDropTargetId] = useState<number | 'root' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderId: number } | null>(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<VaultFolder | null>(null);

  // Password Edit / Create State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    id: number;
    title: string;
    username: string;
    password: string;
    url: string;
    notes: string;
    icon: string | null;
    folderId: number | null;
  }>({
    id: 0,
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    icon: null,
    folderId: null,
  });

  // Custom Icon Picker Modal State
  const [iconPickerTarget, setIconPickerTarget] = useState<{
    type: 'entry' | 'folder';
    id?: number;
    name?: string;
    currentIcon?: string | null;
    isForm?: boolean;
  } | null>(null);

  // UI helpers
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteEntryConfirmId, setDeleteEntryConfirmId] = useState<number | null>(null);

  // Change Password & History State
  const [changePasswordModalEntry, setChangePasswordModalEntry] = useState<VaultEntry | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPasswordInput, setShowNewPasswordInput] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [revealedHistoryIds, setRevealedHistoryIds] = useState<Set<number>>(new Set());
  const [restoreConfirm, setRestoreConfirm] = useState<{ entryId: number; oldPassword: string } | null>(null);



  // Custom Folder Selector Dropdown state
  const [isFolderSelectOpen, setIsFolderSelectOpen] = useState(false);
  const folderSelectRef = useRef<HTMLDivElement>(null);

  const renameInputRef = useRef<HTMLInputElement>(null);

  // Send IPC message to Photino backend
  const sendIPC = (type: string, payload?: any) => {
    // @ts-ignore
    if (window.external && window.external.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({ type, payload }));
    }
  };

  // Close context menu, custom dropdowns, and panels on Esc or outside click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      setContextMenu(null);
      if (folderSelectRef.current && !folderSelectRef.current.contains(e.target as Node)) {
        setIsFolderSelectOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (iconPickerTarget) {
          setIconPickerTarget(null);
        } else if (isFolderSelectOpen) {
          setIsFolderSelectOpen(false);
        } else if (restoreConfirm) {
          setRestoreConfirm(null);
        } else if (changePasswordModalEntry) {
          setChangePasswordModalEntry(null);
        } else if (renamingFolderId) {
          setRenamingFolderId(null);
        } else if (contextMenu) {
          setContextMenu(null);
        } else if (deleteEntryConfirmId) {
          setDeleteEntryConfirmId(null);
        } else if (deleteFolderConfirm) {
          setDeleteFolderConfirm(null);
        } else if (isEditing) {
          setIsEditing(false);
          if (!formData.id) setSelectedEntryId(null);
        } else if (selectedEntryId !== null) {
          setSelectedEntryId(null);
        }
      }
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [renamingFolderId, contextMenu, deleteEntryConfirmId, deleteFolderConfirm, isEditing, selectedEntryId, formData.id, changePasswordModalEntry, restoreConfirm, isFolderSelectOpen, iconPickerTarget]);

  // Focus rename input on rename activation
  useEffect(() => {
    if (renamingFolderId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingFolderId]);

  // Initial Data Fetch & IPC Message Listener (Registered with clean unmount)
  useEffect(() => {
    sendIPC('GET_DATA');

    const handleWebMessage = (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'DATA_RESULT') {
          if (data.payload.success) {
            const list: VaultEntry[] = data.payload.entries || [];
            const folderList: VaultFolder[] = data.payload.folders || [];
            setEntries(list);
            setFolders(folderList);
            if (data.payload.user) {
              setUser(data.payload.user);
            }
            // By default closed - no automatic item selection on launch
          }
        } else if (data.type === 'SAVE_ENTRY_RESULT') {
          if (data.payload.success && data.payload.entry) {
            const saved: VaultEntry = data.payload.entry;
            setEntries((prev) => {
              const idx = prev.findIndex((e) => e.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [saved, ...prev];
            });
            setSelectedEntryId(saved.id);
            setIsEditing(false);
          }
        } else if (data.type === 'DELETE_ENTRY_RESULT') {
          if (data.payload.success) {
            setEntries((prev) => prev.filter((e) => e.id !== data.payload.id));
            setSelectedEntryId((prev) => (prev === data.payload.id ? null : prev));
            setDeleteEntryConfirmId(null);
          }
        } else if (data.type === 'CREATE_FOLDER_RESULT') {
          if (data.payload.success && data.payload.folder) {
            const newF: VaultFolder = data.payload.folder;
            setFolders((prev) => {
              if (prev.some((f) => f.id === newF.id)) return prev;
              return [...prev, newF];
            });
            if (newF.parentFolderId) {
              setExpandedFolderIds((prev) => new Set([...prev, newF.parentFolderId!]));
            }
            // Trigger inline rename immediately
            setRenamingFolderId(newF.id);
            setRenameValue(newF.name);
          }
        } else if (data.type === 'RENAME_FOLDER_RESULT') {
          if (data.payload.success && data.payload.folder) {
            setFolders((prev) =>
              prev.map((f) => (f.id === data.payload.folder.id ? { ...f, name: data.payload.folder.name } : f))
            );
          }
        } else if (data.type === 'MOVE_FOLDER_RESULT') {
          if (data.payload.success) {
            setFolders((prev) =>
              prev.map((f) =>
                f.id === data.payload.id ? { ...f, parentFolderId: data.payload.targetParentFolderId } : f
              )
            );
          }
        } else if (data.type === 'MOVE_ENTRY_RESULT') {
          if (data.payload.success) {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === data.payload.id ? { ...e, folderId: data.payload.targetFolderId } : e
              )
            );
          }
        } else if (data.type === 'DELETE_FOLDER_RESULT') {
          if (data.payload.success) {
            const delId = data.payload.id;
            setFolders((prev) => prev.filter((f) => f.id !== delId));
            setEntries((prev) =>
              prev.map((e) => (e.folderId === delId ? { ...e, folderId: null } : e))
            );
            setActiveFolderId((prev) => (prev === delId ? null : prev));
            setDeleteFolderConfirm(null);
          }
        } else if (data.type === 'UPDATE_FOLDER_ICON_RESULT') {
          if (data.payload.success && data.payload.folder) {
            setFolders((prev) =>
              prev.map((f) =>
                f.id === data.payload.folder.id ? { ...f, icon: data.payload.folder.icon } : f
              )
            );
          }
        } else if (data.type === 'UPDATE_ENTRY_ICON_RESULT') {
          if (data.payload.success) {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === data.payload.id ? { ...e, icon: data.payload.icon } : e
              )
            );
          }
        } else if (data.type === 'SYNC_RESULT') {
          setIsSyncing(false);
          if (data.payload.success) {
            setLastSynced(data.payload.lastSynced || 'Just now');
          }
        }
      } catch (err) {
        console.error('IPC Message error:', err);
      }
    };

    // @ts-ignore
    if (window.external && window.external.receiveMessage) {
      // @ts-ignore
      window.external.receiveMessage(handleWebMessage);
    }

    return () => {
      // Clean up callback from Photino array so no leaks or duplicate triggers happen
      // @ts-ignore
      if (typeof window !== 'undefined' && window.__receiveMessageCallbacks) {
        // @ts-ignore
        const idx = window.__receiveMessageCallbacks.indexOf(handleWebMessage);
        if (idx !== -1) {
          // @ts-ignore
          window.__receiveMessageCallbacks.splice(idx, 1);
        }
      }
    };
  }, []);

  // Folder Helper: Build Tree Structure
  interface FolderNode extends VaultFolder {
    children: FolderNode[];
    itemCount: number;
  }

  const folderTree = useMemo(() => {
    const buildNodes = (parentId: number | null): FolderNode[] => {
      return folders
        .filter((f) => f.parentFolderId === parentId)
        .map((f) => {
          const children = buildNodes(f.id);
          const directCount = entries.filter((e) => e.folderId === f.id).length;
          const totalCount = directCount + children.reduce((acc, c) => acc + c.itemCount, 0);
          return {
            ...f,
            children,
            itemCount: totalCount,
          };
        });
    };
    return buildNodes(null);
  }, [folders, entries]);

  // Flatten folders tree for the custom folder selector dropdown with indentation levels
  const flattenedFolderOptions = useMemo(() => {
    const list: { id: number; name: string; icon?: string | null; level: number }[] = [];
    const traverse = (parentId: number | null, level: number) => {
      const children = folders.filter((f) => f.parentFolderId === parentId);
      for (const child of children) {
        list.push({ id: child.id, name: child.name, icon: child.icon, level });
        traverse(child.id, level + 1);
      }
    };
    traverse(null, 0);

    // Safeguard for any folders that might have an orphan parentFolderId
    const visited = new Set(list.map((f) => f.id));
    for (const f of folders) {
      if (!visited.has(f.id)) {
        list.push({ id: f.id, name: f.name, icon: f.icon, level: 0 });
      }
    }
    return list;
  }, [folders]);



  // Rich Breadcrumb Trail with icons, counts, and isRoot flag
  const breadcrumbs = useMemo<BreadcrumbNode[]>(() => {
    const rootCount = entries.length;
    const rootSubfolders = folders.filter((f) => f.parentFolderId === null).length;
    const trail: BreadcrumbNode[] = [
      {
        id: null,
        name: 'All Passwords',
        icon: null,
        isRoot: true,
        itemCount: rootCount,
        subfolderCount: rootSubfolders,
      },
    ];
    if (activeFolderId === null) return trail;

    const stack: BreadcrumbNode[] = [];
    let curr: number | null = activeFolderId;
    while (curr !== null) {
      const f = folders.find((item) => item.id === curr);
      if (f) {
        // Calculate total descendant items in this folder branch
        const getAllDescendantIds = (id: number): number[] => {
          const children = folders.filter((child) => child.parentFolderId === id);
          return [id, ...children.flatMap((c) => getAllDescendantIds(c.id))];
        };
        const allIds = new Set(getAllDescendantIds(f.id));
        const itemCount = entries.filter((e) => e.folderId !== null && allIds.has(e.folderId)).length;
        const subfolderCount = folders.filter((child) => child.parentFolderId === f.id).length;
        stack.unshift({
          id: f.id,
          name: f.name,
          icon: f.icon,
          isRoot: false,
          itemCount,
          subfolderCount,
        });
        curr = f.parentFolderId;
      } else {
        break;
      }
    }
    return [...trail, ...stack];
  }, [folders, entries, activeFolderId]);

  // Filter passwords by active folder & search query
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Folder Filter: If inside a folder, show items in this folder
    if (activeFolderId !== null) {
      result = result.filter((e) => e.folderId === activeFolderId);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.url.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
      );
    }

    return result;
  }, [entries, activeFolderId, searchQuery]);

  // Keep searchMatchIndex in bounds if filteredEntries changes
  useEffect(() => {
    if (searchMatchIndex >= filteredEntries.length && filteredEntries.length > 0) {
      setSearchMatchIndex(filteredEntries.length - 1);
    }
  }, [filteredEntries.length, searchMatchIndex]);

  // Scroll active search match into view smoothly (Google Sheets style)
  useEffect(() => {
    if (searchQuery.trim() && filteredEntries.length > 0) {
      const activeEntry = filteredEntries[searchMatchIndex];
      if (activeEntry) {
        const el = document.getElementById(`entry-card-${activeEntry.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [searchMatchIndex, searchQuery, filteredEntries]);

  const handleNextMatch = () => {
    if (filteredEntries.length === 0) return;
    setSearchMatchIndex((prev) => (prev + 1) % filteredEntries.length);
  };

  const handlePrevMatch = () => {
    if (filteredEntries.length === 0) return;
    setSearchMatchIndex((prev) => (prev - 1 + filteredEntries.length) % filteredEntries.length);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    } else if (e.key === 'Escape') {
      if (searchQuery) {
        e.preventDefault();
        setSearchQuery('');
        setSearchMatchIndex(0);
      }
    }
  };

  // Smooth, lightweight kinetic wheel scrolling for the middle explorer container
  useEffect(() => {
    const el = middleScrollRef.current;
    if (!el) return;

    let currentScrollTop = el.scrollTop;
    let targetScrollTop = el.scrollTop;
    let isAnimating = false;
    let animId = 0;
    let lastWheelTime = 0;
    let wheelStreak = 0;

    const smoothScroll = () => {
      if (!el) return;
      const diff = targetScrollTop - currentScrollTop;

      if (Math.abs(diff) < 0.5) {
        currentScrollTop = targetScrollTop;
        el.scrollTop = Math.round(targetScrollTop);
        isAnimating = false;
        el.classList.remove('scrolling-active');
        return;
      }

      currentScrollTop += diff * 0.36;
      el.scrollTop = Math.round(currentScrollTop);
      animId = requestAnimationFrame(smoothScroll);
    };

    const handleWheel = (e: WheelEvent) => {
      // Don't intercept zoom (ctrl+wheel) or horizontal scrolling
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;

      const now = performance.now();
      if (now - lastWheelTime < 120) {
        wheelStreak = Math.min(wheelStreak + 1, 5);
      } else {
        wheelStreak = 0;
      }
      lastWheelTime = now;

      // Normalize delta across DOM_DELTA_PIXEL (0), DOM_DELTA_LINE (1), DOM_DELTA_PAGE (2)
      let rawDelta = e.deltaY;
      if (e.deltaMode === 1) {
        rawDelta *= 40;
      } else if (e.deltaMode === 2) {
        rawDelta *= el.clientHeight * 0.85;
      }

      // WebKitGTK on Linux often reports a tiny ~15px delta per physical mouse wheel notch.
      // Boost discrete notches to at least 125px and add momentum when spinning the wheel rapidly.
      const sign = Math.sign(rawDelta);
      const abs = Math.abs(rawDelta);
      const streakBoost = 1 + wheelStreak * 0.18;
      const delta =
        abs >= 8
          ? sign * Math.max(abs * 4.5, 125) * streakBoost
          : rawDelta * 3.5;

      if (!isAnimating) {
        currentScrollTop = el.scrollTop;
        targetScrollTop = currentScrollTop;
      }

      targetScrollTop = Math.max(0, Math.min(maxScroll, targetScrollTop + delta));

      e.preventDefault();

      if (!isAnimating) {
        isAnimating = true;
        el.classList.add('scrolling-active');
        animId = requestAnimationFrame(smoothScroll);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.classList.remove('scrolling-active');
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Split filtered entries into root entries (no folder) and entries grouped by folder
  const rootEntries = useMemo(() => {
    return filteredEntries.filter((e) => e.folderId === null);
  }, [filteredEntries]);

  // All root entries (unfiltered) for the left sidebar explorer tree
  const allRootEntries = useMemo(() => {
    return entries.filter((e) => e.folderId === null);
  }, [entries]);

  // Top-level folders for hierarchical rendering in All Passwords
  const topLevelFolders = useMemo(() => {
    return folders.filter((f) => f.parentFolderId === null);
  }, [folders]);

  // Precompute descendant folder IDs for all folders using useMemo to avoid O(N^2) recursive walks on render
  const folderDescendantsMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    const getDescendants = (id: number): Set<number> => {
      if (map.has(id)) return map.get(id)!;
      const set = new Set<number>([id]);
      const children = folders.filter((f) => f.parentFolderId === id);
      for (const child of children) {
        for (const desc of getDescendants(child.id)) {
          set.add(desc);
        }
      }
      map.set(id, set);
      return set;
    };
    folders.forEach((f) => getDescendants(f.id));
    return map;
  }, [folders]);

  // Pre-group filtered entries by folder ID for O(1) lookups during hierarchical folder rendering
  const filteredEntriesByFolder = useMemo(() => {
    const map = new Map<number, VaultEntry[]>();
    for (const e of filteredEntries) {
      if (e.folderId !== null) {
        const list = map.get(e.folderId) || [];
        list.push(e);
        map.set(e.folderId, list);
      }
    }
    return map;
  }, [filteredEntries]);

  // Currently viewed/selected password
  const selectedEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  // Keep last active entry so closing animation doesn't flash empty content
  const [cachedEntry, setCachedEntry] = useState<VaultEntry | null>(null);
  useEffect(() => {
    if (selectedEntry) {
      setCachedEntry(selectedEntry);
    }
  }, [selectedEntry]);

  const activeDetailEntry = selectedEntry || cachedEntry;
  const isPanelOpen = selectedEntry !== null || isEditing;

  // Reset password states when selecting an entry
  useEffect(() => {
    setIsHistoryExpanded(false);
    setRevealedHistoryIds(new Set());
    setShowPassword(false);
  }, [selectedEntryId]);

  const handleOpenChangePassword = (entry: VaultEntry) => {
    setChangePasswordModalEntry(entry);
    setNewPasswordInput('');
    setShowNewPasswordInput(false);
  };

  const handleSaveChangedPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordModalEntry || !newPasswordInput.trim()) return;
    sendIPC('CHANGE_PASSWORD', {
      id: changePasswordModalEntry.id,
      newPassword: newPasswordInput,
    });
    setChangePasswordModalEntry(null);
  };

  const handleRestorePassword = (entryId: number, oldPassword: string) => {
    setRestoreConfirm({ entryId, oldPassword });
  };

  const handleConfirmRestore = () => {
    if (!restoreConfirm) return;
    sendIPC('CHANGE_PASSWORD', {
      id: restoreConfirm.entryId,
      newPassword: restoreConfirm.oldPassword,
    });
    setRestoreConfirm(null);
  };

  // Copy helper
  const handleCopy = useCallback((text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  // Open URL externally via backend
  const handleOpenUrl = (url: string) => {
    if (!url) return;
    sendIPC('OPEN_URL', { url });
  };

  // Trigger manual cloud sync
  const handleTriggerSync = () => {
    setIsSyncing(true);
    sendIPC('SYNC_VAULT');
  };

  // Toggle folder expansion in tree
  const toggleExpand = (folderId: number) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Create folder action
  const handleCreateFolder = (parentFolderId: number | null) => {
    sendIPC('CREATE_FOLDER', {
      name: 'New Folder',
      parentFolderId,
    });
  };

  // Submit rename
  const handleCommitRename = () => {
    if (!renamingFolderId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      sendIPC('RENAME_FOLDER', {
        id: renamingFolderId,
        name: trimmed,
      });
      setFolders((prev) =>
        prev.map((f) => (f.id === renamingFolderId ? { ...f, name: trimmed } : f))
      );
    }
    setRenamingFolderId(null);
    setRenameValue('');
  };

  // Drag & Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, type: 'entry' | 'folder', id: number) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'move';

    try {
      let title = '';
      if (type === 'entry') {
        const item = entries.find((x) => x.id === id);
        title = item?.title || 'Password';
      } else {
        const folder = folders.find((f) => f.id === id);
        title = folder?.name || 'Folder';
      }

      // Create a sleek, compact pill badge for drag preview instead of the gigantic full card
      const ghost = document.createElement('div');
      ghost.style.position = 'fixed';
      ghost.style.top = '-1000px';
      ghost.style.left = '-1000px';
      ghost.style.zIndex = '99999';
      ghost.style.pointerEvents = 'none';
      ghost.style.display = 'inline-flex';
      ghost.style.alignItems = 'center';
      ghost.style.gap = '8px';
      ghost.style.padding = '5px 12px';
      ghost.style.borderRadius = '9999px';
      ghost.style.backgroundColor = '#171717';
      ghost.style.border = type === 'entry' ? '1.5px solid #10b981' : '1.5px solid #f59e0b';
      ghost.style.color = '#ffffff';
      ghost.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ghost.style.fontSize = '12px';
      ghost.style.fontWeight = '600';
      ghost.style.whiteSpace = 'nowrap';
      ghost.style.boxShadow = '0 10px 25px rgba(0,0,0,0.8), 0 0 12px rgba(16,185,129,0.25)';

      const iconSvg = type === 'entry'
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;

      ghost.innerHTML = `
        <span style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:9999px;background-color:${type === 'entry' ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)'};">
          ${iconSvg}
        </span>
        <span style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1;">
          ${title}
        </span>
      `;

      document.body.appendChild(ghost);
      if (e.dataTransfer && e.dataTransfer.setDragImage) {
        e.dataTransfer.setDragImage(ghost, 20, 16);
      }

      setTimeout(() => {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      }, 100);
    } catch (err) {
      console.error('Drag ghost setup error:', err);
    }
  }, [entries, folders]);

  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    try {
      const { type, id } = JSON.parse(raw);

      if (type === 'entry') {
        const item = entries.find((x) => x.id === id);
        if (item && item.folderId !== targetFolderId) {
          // Optimistically update
          setEntries((prev) =>
            prev.map((x) => (x.id === id ? { ...x, folderId: targetFolderId } : x))
          );
          sendIPC('MOVE_ENTRY', { id, targetFolderId });
        }
      } else if (type === 'folder') {
        if (id === targetFolderId) return; // Cannot move into self

        // Check descendant loop
        let isChild = false;
        let curr: number | null = targetFolderId;
        while (curr !== null) {
          if (curr === id) {
            isChild = true;
            break;
          }
          const p = folders.find((f) => f.id === curr);
          curr = p ? p.parentFolderId : null;
        }

        if (!isChild) {
          setFolders((prev) =>
            prev.map((f) => (f.id === id ? { ...f, parentFolderId: targetFolderId } : f))
          );
          sendIPC('MOVE_FOLDER', { id, targetParentFolderId: targetFolderId });
        }
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  }, [entries, folders]);

  // Guarded drag-over: only trigger a state update when the highlighted target
  // actually changes. Without this guard, onDragOver fires on every mouse-move
  // pixel, calling setDropTargetId on every frame and causing constant re-renders
  // of the entire list even while the user is just hovering over the same folder.
  const dropTargetIdRef = useRef<number | 'root' | null>(null);
  const handleDragOver = useCallback((_e: React.DragEvent, id: number | 'root') => {
    if (dropTargetIdRef.current !== id) {
      dropTargetIdRef.current = id;
      setDropTargetId(id);
    }
  }, []);
  const handleDragLeave = useCallback(() => {
    if (dropTargetIdRef.current !== null) {
      dropTargetIdRef.current = null;
      setDropTargetId(null);
    }
  }, []);

  // Handle icon chosen from IconPickerModal
  const handleSelectIcon = (iconId: string | null) => {
    if (!iconPickerTarget) return;

    if (iconPickerTarget.type === 'folder' && iconPickerTarget.id) {
      const folderId = iconPickerTarget.id;
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, icon: iconId } : f))
      );
      sendIPC('UPDATE_FOLDER_ICON', { id: folderId, icon: iconId });
    } else if (iconPickerTarget.type === 'entry') {
      if (iconPickerTarget.isForm) {
        setFormData((prev) => ({ ...prev, icon: iconId }));
      } else if (iconPickerTarget.id) {
        const entryId = iconPickerTarget.id;
        setEntries((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, icon: iconId } : e))
        );
        sendIPC('UPDATE_ENTRY_ICON', { id: entryId, icon: iconId });
      }
    }

    setIconPickerTarget(null);
  };

  // Start new password form (preset folder to active folder!)
  const handleStartCreate = () => {
    setFormData({
      id: 0,
      title: '',
      username: '',
      password: '',
      url: '',
      notes: '',
      icon: null,
      folderId: activeFolderId,
    });
    setShowPassword(false);
    setIsEditing(true);
  };

  // Start edit form
  const handleStartEdit = (entry: VaultEntry) => {
    setFormData({
      id: entry.id,
      title: entry.title,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      notes: entry.notes,
      icon: entry.icon || null,
      folderId: entry.folderId,
    });
    setShowPassword(false);
    setIsEditing(true);
  };

  // Save form
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    sendIPC('SAVE_ENTRY', {
      id: formData.id,
      title: formData.title.trim(),
      username: formData.username.trim(),
      password: formData.password,
      url: formData.url.trim(),
      notes: formData.notes,
      icon: formData.icon,
      folderId: formData.folderId,
    });
  };

  // Recursive Tree Node Renderer for Left Sidebar (VS Code Explorer style)
  const renderFolderTreeNode = (node: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolderIds.has(node.id);
    const folderEntries = entries.filter((e) => e.folderId === node.id);
    const hasContents = node.children.length > 0 || folderEntries.length > 0;
    const isSelected = activeFolderId === node.id;
    const isDropTarget = dropTargetId === node.id;
    const isRenaming = renamingFolderId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          draggable={!isRenaming}
          onDragStart={(e) => handleDragStart(e, 'folder', node.id)}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragOver(e, node.id);
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            handleDragLeave();
          }}
          onDrop={(e) => handleDrop(e, node.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, folderId: node.id });
          }}
          onClick={() => {
            if (!isRenaming) {
              setActiveFolderId(node.id);
              if (hasContents) {
                toggleExpand(node.id);
              }
            }
          }}
          style={{ paddingLeft: `${Math.max(12, level * 16 + 12)}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-xl text-xs font-medium transition-all cursor-pointer relative ${
            isDropTarget
              ? 'bg-emerald-500/30 border-2 border-emerald-400 text-white shadow-lg'
              : isSelected
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white border border-transparent'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
            {/* Collapse/Expand chevron */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className={`p-0.5 rounded hover:bg-neutral-700/50 text-neutral-400 ${
                hasContents ? 'visible' : 'invisible'
              }`}
            >
              <ChevronRight
                size={13}
                className={`transition-transform duration-200 ease-out ${
                  isExpanded ? 'rotate-90 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Folder Icon */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIconPickerTarget({
                  type: 'folder',
                  id: node.id,
                  currentIcon: node.icon,
                  name: node.name,
                });
              }}
              title="Click to change icon"
              className="p-1 -m-1 rounded hover:bg-neutral-700/60 cursor-pointer flex items-center justify-center shrink-0 transition-transform hover:scale-110"
            >
              {node.icon ? (
                <VaultIcon
                  iconId={node.icon}
                  defaultType="folder"
                  size={15}
                  className="shrink-0"
                />
              ) : isExpanded ? (
                <FolderOpen size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <Folder
                  size={16}
                  className={`shrink-0 ${
                    isSelected ? 'text-emerald-400' : 'text-neutral-400 group-hover:text-emerald-400'
                  }`}
                />
              )}
            </div>

            {/* Folder Name (or Inline Rename Input) */}
            {isRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleCommitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitRename();
                  if (e.key === 'Escape') setRenamingFolderId(null);
                }}
                className="w-full bg-neutral-950 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white outline-none font-sans"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

          {/* Counts & Action Menu */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-400 px-1.5 py-0.5 rounded-full bg-neutral-900/80">
              {node.itemCount}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, folderId: node.id });
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-opacity"
            >
              <MoreVertical size={13} />
            </button>
          </div>
        </div>

        {/* Child Subfolders & Password Files (VS Code Explorer style) */}
        {hasContents && isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {/* Subfolders first */}
            {node.children.map((child) => renderFolderTreeNode(child, level + 1))}

            {/* Password Files inside this folder */}
            {folderEntries.map((entry) => renderEntryTreeNode(entry, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render individual password file node in Left Sidebar Tree (VS Code Explorer style)
  const renderEntryTreeNode = (item: VaultEntry, level: number = 0) => {
    const isSelected = selectedEntryId === item.id && !isEditing;

    return (
      <div
        key={`tree-entry-${item.id}`}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, 'entry', item.id)}
        onClick={() => {
          if (selectedEntryId === item.id && !isEditing) {
            setSelectedEntryId(null);
          } else {
            setSelectedEntryId(item.id);
            setIsEditing(false);
            if (activeFolderId !== null && activeFolderId !== item.folderId) {
              setActiveFolderId(item.folderId);
            }
          }
        }}
        title={`${item.title}${item.username ? ` (${item.username})` : ''}`}
        style={{ paddingLeft: `${Math.max(12, level * 16 + 12)}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-xl text-xs transition-all cursor-pointer select-none relative ${
          isSelected
            ? 'bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/30'
            : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
          {/* Spacer aligning with folder chevron so icons line up vertically like VS Code */}
          <div className="w-[17px] shrink-0 flex items-center justify-center">
            {/* Dedicated emerald indicator dot for password credential */}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 group-hover:bg-emerald-400 transition-colors" />
          </div>

          {/* Entry Icon */}
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <VaultIcon
              iconId={item.icon}
              url={item.url}
              defaultType="entry"
              size={13}
              className={isSelected ? 'text-emerald-400' : 'text-emerald-500/80 group-hover:text-emerald-400'}
            />
          </div>

          {/* Entry Title */}
          <span className="truncate">{item.title}</span>

          {/* Password Mask Indicator in Tree */}
          <span className="text-[9px] font-mono tracking-widest text-neutral-600 group-hover:text-neutral-500 select-none ml-1 hidden sm:inline">
            ••••
          </span>
        </div>

        {/* Quick Copy on Hover */}
        {item.password && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy(item.password, `tree-entry-${item.id}`);
            }}
            title="Copy Password"
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-emerald-400 transition-opacity shrink-0 cursor-pointer"
          >
            {copiedField === `tree-entry-${item.id}` ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        )}
      </div>
    );
  };

  // Highlight matching search text like Google Sheets.
  // Wrapped in useCallback so the stable reference can be passed to memo children.
  const highlightText = useCallback((text: string | null | undefined, query: string, isCurrentMatch: boolean): React.ReactNode => {
    if (!text) return null;
    if (!query.trim()) return text;

    const trimmed = query.trim();
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    if (parts.length <= 1) return text;

    return (
      <>
        {parts.map((part, index) => {
          if (part.toLowerCase() === trimmed.toLowerCase()) {
            return (
              <mark
                key={index}
                className={`${
                  isCurrentMatch
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                    : 'bg-emerald-500/35 text-emerald-200 font-semibold'
                } px-0.5 rounded-sm`}
              >
                {part}
              </mark>
            );
          }
          return part;
        })}
      </>
    );
  }, []);

  // Stable entry select handler for PasswordItem
  const handleSelectEntryItem = useCallback((id: number) => {
    setSelectedEntryId((prev) => {
      if (prev === id) {
        // toggling off — but we can't read isEditing here, so just check via setter
        return null;
      }
      return id;
    });
    setIsEditing(false);
  }, []);

  // Stable icon picker opener for PasswordItem
  const handleOpenIconPickerForEntry = useCallback((item: VaultEntry) => {
    setIconPickerTarget({
      type: 'entry',
      id: item.id,
      currentIcon: item.icon,
      name: item.title,
    });
  }, []);

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-white font-sans overflow-hidden select-none">
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR: Brand, User, Folder Explorer Tree        */}
      {/* ========================================================= */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/60 flex flex-col shrink-0 justify-between">
        
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={logoUrl} alt="Vaulture" className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg text-white">Vaulture</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Zero-Knowledge
            </span>
          </div>

          {/* User & Cloud Sync Card */}
          <div className="p-3 m-3 bg-neutral-950/80 border border-neutral-800 rounded-2xl flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center gap-3">
              {user.picture && !avatarError ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-10 h-10 rounded-full border border-neutral-700 shrink-0 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30 shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-neutral-400 truncate">{user.email || 'Local Vault'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] text-emerald-300 font-medium">
                  {lastSynced ? 'Cloud Synced' : 'Cloud Backup Active'}
                </span>
              </div>
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                title="Backup now"
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin text-emerald-400' : ''} />
              </button>
            </div>
          </div>

          {/* New Password CTA */}
          <div className="px-3 pb-2 shrink-0">
            <button
              onClick={handleStartCreate}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> New Password
            </button>
          </div>

          {/* File Explorer Folder Hierarchy */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1 pt-1 min-h-0">
            
            {/* Root: All Passwords */}
            <div
              onDragOver={(e) => { e.preventDefault(); handleDragOver(e, 'root'); }}
              onDragLeave={() => handleDragLeave()}
              onDrop={(e) => handleDrop(e, null)}
              onClick={() => setActiveFolderId(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dropTargetId === 'root'
                  ? 'bg-emerald-500/30 border-2 border-emerald-400 text-white'
                  : activeFolderId === null
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers size={16} className={activeFolderId === null ? 'text-emerald-400' : 'text-neutral-400'} />
                <span>All Passwords</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-1.5 py-0.5 rounded-full">
                {entries.length}
              </span>
            </div>

            {/* Folders Header */}
            <div className="flex items-center justify-between pt-4 pb-1 px-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Folders
              </span>
              <button
                onClick={() => handleCreateFolder(null)}
                title="Create Top-Level Folder"
                className="text-neutral-400 hover:text-emerald-400 p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <FolderPlus size={14} />
              </button>
            </div>

            {/* Folder & Password Tree List (VS Code Explorer style) */}
            {folderTree.length === 0 && allRootEntries.length === 0 ? (
              <div
                onClick={() => handleCreateFolder(null)}
                className="p-3 text-center border border-dashed border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <p className="text-xs text-neutral-500">+ Click to create your first folder</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {folderTree.map((node) => renderFolderTreeNode(node, 0))}
                {allRootEntries.map((entry) => renderEntryTreeNode(entry, 0))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Lock Vault Button */}
        <div className="p-3 border-t border-neutral-800 shrink-0">
          <button
            onClick={onLock}
            className="w-full py-2.5 px-3 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock size={15} /> Lock Vault
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. CENTER COLUMN: Hybrid Explorer View (Tiles + Passwords) */}
      {/* ========================================================= */}
      <section className="flex-1 bg-neutral-950 flex flex-col min-w-0 overflow-hidden">
        
        {/* Breadcrumbs Navigation Header */}
        <div className="px-4 py-3 border-b border-neutral-800/80 space-y-2.5 shrink-0">
          <VaultBreadcrumbs
            breadcrumbs={breadcrumbs}
            activeFolderId={activeFolderId}
            folders={folders}
            onSelectFolder={(id) => setActiveFolderId(id)}
            onDrop={handleDrop}
            dropTargetId={dropTargetId}
            setDropTargetId={setDropTargetId}
          />

          {/* Search bar with in-input match count & navigation (Google Sheets style) */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-neutral-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchMatchIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={`Search in ${breadcrumbs[breadcrumbs.length - 1].name}...`}
              className={`w-full pl-9 ${
                searchQuery.trim() ? 'pr-32 sm:pr-36' : 'pr-8'
              } py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
            />

            {/* In-Input Match Controls (Google Sheets / Find Style) */}
            {searchQuery.trim() && (
              <div className="absolute right-1.5 flex items-center gap-0.5 bg-neutral-950/90 py-0.5 px-1.5 rounded-lg border border-neutral-800 shadow-sm">
                {/* Result count: e.g. 1 of 3 */}
                <span
                  className={`text-[11px] font-mono px-1 font-medium ${
                    filteredEntries.length > 0 ? 'text-neutral-300' : 'text-red-400'
                  }`}
                >
                  {filteredEntries.length > 0
                    ? `${searchMatchIndex + 1} of ${filteredEntries.length}`
                    : '0 of 0'}
                </span>

                <div className="w-[1px] h-3 bg-neutral-800 mx-0.5" />

                {/* Up Button (Previous Match) */}
                <button
                  type="button"
                  disabled={filteredEntries.length === 0}
                  onClick={handlePrevMatch}
                  title="Previous match (Shift+Enter)"
                  className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronUp size={13} />
                </button>

                {/* Down Button (Next Match) */}
                <button
                  type="button"
                  disabled={filteredEntries.length === 0}
                  onClick={handleNextMatch}
                  title="Next match (Enter)"
                  className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronDown size={13} />
                </button>

                <div className="w-[1px] h-3 bg-neutral-800 mx-0.5" />

                {/* Clear Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchMatchIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search (Esc)"
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area: Parent & Children Hierarchy + Passwords */}
        <div
          ref={middleScrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
        >
          
          {/* Parent with Children Hierarchy */}
          <ParentChildHierarchy
            activeFolderId={activeFolderId}
            folders={folders}
            entries={entries}
            isPanelOpen={isPanelOpen}
            onSelectFolder={(id) => setActiveFolderId(id)}
            onCreateFolder={handleCreateFolder}
            onOpenIconPicker={(folder) =>
              setIconPickerTarget({
                type: 'folder',
                id: folder.id,
                currentIcon: folder.icon,
                name: folder.name,
              })
            }
            onContextMenu={(e, folderId) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({ x: e.clientX, y: e.clientY, folderId });
            }}
            handleDragStart={handleDragStart}
            handleDrop={handleDrop}
            dropTargetId={dropTargetId}
            setDropTargetId={setDropTargetId}
          />

          {/* Passwords Section */}
          <div className="space-y-3">
            {activeFolderId === null ? (
              <>
                {/* FOLDERS SECTIONS: Passwords organized hierarchically */}
                {topLevelFolders.map((folder) => (
                  <HierarchicalFolder
                    key={folder.id}
                    folder={folder}
                    level={0}
                    folders={folders}
                    filteredEntriesByFolder={filteredEntriesByFolder}
                    folderDescendantsMap={folderDescendantsMap}
                    searchQuery={searchQuery}
                    dropTargetId={dropTargetId}
                    selectedEntryId={selectedEntryId}
                    isEditing={isEditing}
                    copiedField={copiedField}
                    searchMatchIndex={searchMatchIndex}
                    filteredEntries={filteredEntries}
                    onSelectFolder={setActiveFolderId}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onSelect={handleSelectEntryItem}
                    onCopy={handleCopy}
                    onDragStart={handleDragStart}
                    onOpenIconPicker={handleOpenIconPickerForEntry}
                    highlightText={highlightText}
                    extractDomainFn={extractDomain}
                  />
                ))}

                {/* ROOT SECTION: Passwords that do not belong to any folder (at bottom) */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); handleDragOver(e, 'root'); }}
                  onDragLeave={(e) => { e.stopPropagation(); handleDragLeave(); }}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`rounded-xl border transition-colors duration-150 ${
                    dropTargetId === 'root'
                      ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30'
                      : 'bg-neutral-950/40 border-neutral-800/60'
                  } p-3 space-y-2.5`}
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Layers size={13} className="text-emerald-400" />
                      <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        Root
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 font-mono font-medium">
                        {rootEntries.length}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        — does not belong to any folder
                      </span>
                    </div>
                    {dropTargetId === 'root' && (
                      <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                        Drop here to move to Root
                      </span>
                    )}
                  </div>

                  {rootEntries.length === 0 ? (
                    <div className="py-4 text-center border border-dashed border-neutral-800/60 rounded-xl bg-neutral-900/20">
                      <p className="text-xs text-neutral-500">
                        No passwords in root. Drag items here to remove them from folders.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rootEntries.map((item) => (
                        <PasswordItem
                          key={item.id}
                          item={item}
                          isSelected={selectedEntryId === item.id && !isEditing}
                          isCopied={copiedField === `list-pass-${item.id}`}
                          isCurrentSearchMatch={Boolean(searchQuery.trim()) && filteredEntries[searchMatchIndex]?.id === item.id}
                          searchQuery={searchQuery}
                          onSelect={handleSelectEntryItem}
                          onCopy={handleCopy}
                          onDragStart={handleDragStart}
                          onOpenIconPicker={handleOpenIconPickerForEntry}
                          highlightText={highlightText}
                          extractDomain={extractDomain}
                        />
                      ))}
                    </div>
                  )}
                </div>

                    {filteredEntries.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-40 text-center p-6 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-900/20">
                        <Key size={24} className="text-neutral-600 mb-2.5" />
                        <p className="text-sm font-semibold text-neutral-400">No passwords found</p>
                        <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">
                          Click "New Password" to create your first password.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* INSIDE SPECIFIC FOLDER */
                  filteredEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-6 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-900/20">
                      <Key size={24} className="text-neutral-600 mb-2.5" />
                      <p className="text-sm font-semibold text-neutral-400">No passwords in this folder</p>
                      <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">
                        Drag passwords into this folder, or click "New Password" to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredEntries.map((item) => (
                        <PasswordItem
                          key={item.id}
                          item={item}
                          isSelected={selectedEntryId === item.id && !isEditing}
                          isCopied={copiedField === `list-pass-${item.id}`}
                          isCurrentSearchMatch={Boolean(searchQuery.trim()) && filteredEntries[searchMatchIndex]?.id === item.id}
                          searchQuery={searchQuery}
                          onSelect={handleSelectEntryItem}
                          onCopy={handleCopy}
                          onDragStart={handleDragStart}
                          onOpenIconPicker={handleOpenIconPickerForEntry}
                          highlightText={highlightText}
                          extractDomain={extractDomain}
                        />
                      ))}
                    </div>
                  )
                )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. RIGHT PANEL: Password Details & Creation Form          */}
      {/* (Collapsible with Smooth Opening & Closing Animation)     */}
      {/* ========================================================= */}
      <aside
        className={`bg-neutral-900 flex flex-col shrink-0 h-full z-10 transition-[width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isPanelOpen
            ? 'w-[360px] lg:w-[380px] xl:w-[420px] opacity-100 border-l border-neutral-800'
            : 'w-0 opacity-0 border-l-0 pointer-events-none'
        }`}
      >
        <div className="w-[360px] lg:w-[380px] xl:w-[420px] h-full flex flex-col overflow-y-auto shrink-0">
          {isEditing ? (
            /* CREATE / EDIT FORM */
            <form onSubmit={handleSave} className="w-full p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <h2 className="text-xl font-bold text-white">
                  {formData.id ? 'Edit Password' : 'New Password'}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (!formData.id) setSelectedEntryId(null);
                    }}
                    className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Save Password
                  </button>
                  <div className="w-[1px] h-4 bg-neutral-800 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedEntryId(null);
                    }}
                    className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Close panel (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Title & Custom Icon Picker */}
                <div>
                  <label className="block font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Icon & Title *
                  </label>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIconPickerTarget({
                          type: 'entry',
                          isForm: true,
                          currentIcon: formData.icon,
                          name: formData.title || 'Password',
                        });
                      }}
                      className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900 flex items-center justify-center shrink-0 transition-all cursor-pointer group/btn relative"
                      title="Choose custom brand or category icon"
                    >
                      <VaultIcon iconId={formData.icon} url={formData.url} size={20} />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                        <Sparkles size={8} />
                      </div>
                    </button>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Google, GitHub, Work VPN"
                      className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Folder Assignment Selector (Custom Themed Dropdown) */}
                <div>
                  <label className="block font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Folder
                  </label>
                  <div ref={folderSelectRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFolderSelectOpen(!isFolderSelectOpen)}
                      className={`w-full px-4 py-2.5 bg-neutral-950 border rounded-xl text-white text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isFolderSelectOpen
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {formData.folderId === null ? (
                          <>
                            <Layers size={14} className="text-emerald-400 shrink-0" />
                            <span className="text-neutral-300 font-medium truncate">Root (Unorganized)</span>
                          </>
                        ) : (
                          <>
                            <VaultIcon iconId={folders.find((f) => f.id === formData.folderId)?.icon} defaultType="folder" size={14} className="text-amber-400 shrink-0" />
                            <span className="text-white font-medium truncate">
                              {folders.find((f) => f.id === formData.folderId)?.name || 'Selected Folder'}
                            </span>
                          </>
                        )}
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-neutral-400 transition-transform duration-200 shrink-0 ml-2 ${
                          isFolderSelectOpen ? 'rotate-180 text-emerald-400' : ''
                        }`}
                      />
                    </button>

                    {isFolderSelectOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1.5 space-y-0.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        {/* Root Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, folderId: null });
                            setIsFolderSelectOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            formData.folderId === null
                              ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                              : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Layers size={14} className={formData.folderId === null ? 'text-emerald-400' : 'text-neutral-400'} />
                            <span>Root (Unorganized)</span>
                          </div>
                          {formData.folderId === null && <Check size={14} className="text-emerald-400" />}
                        </button>

                        {flattenedFolderOptions.length > 0 && (
                          <div className="border-t border-neutral-800/80 my-1" />
                        )}

                        {/* Folders List */}
                        {flattenedFolderOptions.map((opt) => {
                          const isSelected = formData.folderId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, folderId: opt.id });
                                setIsFolderSelectOpen(false);
                              }}
                              style={{ paddingLeft: `${opt.level * 14 + 12}px` }}
                              className={`w-full pr-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {opt.level > 0 && (
                                  <span className="text-neutral-600 font-mono text-[10px]">└</span>
                                )}
                                <VaultIcon iconId={opt.icon} defaultType="folder" size={14} className={isSelected ? 'text-emerald-400 shrink-0' : 'text-amber-400 shrink-0'} />
                                <span className="truncate">{opt.name}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-emerald-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Username / Email
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. user@gmail.com"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Password & Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-neutral-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newPass = generateSecurePassword({
                          length: 20,
                          uppercase: true,
                          lowercase: true,
                          numbers: true,
                          symbols: true,
                        });
                        setFormData({ ...formData, password: newPass });
                        setShowPassword(true);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={13} /> Generate Strong Password
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password..."
                      className="w-full px-4 py-2.5 pr-10 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.id > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-neutral-500">
                      <History size={12} className="text-emerald-400/80" />
                      <span>Changing this password will save the previous one to history.</span>
                    </div>
                  )}
                </div>

                {/* URL */}
                <div>
                  <label className="block font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional security questions or confidential notes..."
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                </div>
              </div>
            </form>
          ) : activeDetailEntry ? (
            /* VIEW PASSWORD DETAILS */
            <div className="w-full p-6 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-800">
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                  <div
                    onClick={() => {
                      setIconPickerTarget({
                        type: 'entry',
                        id: activeDetailEntry.id,
                        currentIcon: activeDetailEntry.icon,
                        name: activeDetailEntry.title,
                      });
                    }}
                    title="Click to change icon"
                    className="w-12 h-12 rounded-2xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 flex items-center justify-center font-bold text-emerald-400 shrink-0 cursor-pointer transition-all hover:scale-105 group/icon relative"
                  >
                    <VaultIcon iconId={activeDetailEntry.icon} url={activeDetailEntry.url} size={24} />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity shadow">
                      <Edit3 size={9} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-white tracking-tight truncate">{activeDetailEntry.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {activeDetailEntry.folderId && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                          <Folder size={12} />
                          {folders.find((f) => f.id === activeDetailEntry.folderId)?.name || 'Folder'}
                        </span>
                      )}
                      {activeDetailEntry.url && (
                        <span className="text-xs text-neutral-400 font-mono truncate block">
                          {extractDomain(activeDetailEntry.url)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartEdit(activeDetailEntry)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteEntryConfirmId(activeDetailEntry.id)}
                    className="p-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-400 rounded-xl transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className="w-[1px] h-4 bg-neutral-800 mx-1" />
                  <button
                    onClick={() => setSelectedEntryId(null)}
                    className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Close panel (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Credential Fields */}
              <div className="space-y-4">
                
                {/* Username */}
                {activeDetailEntry.username && (
                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                        Username / Email
                      </span>
                      <p className="text-white font-mono text-sm select-all break-all">{activeDetailEntry.username}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(activeDetailEntry.username, 'view-user')}
                      className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors flex items-center gap-1 text-xs cursor-pointer shrink-0"
                    >
                      {copiedField === 'view-user' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedField === 'view-user' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* Password */}
                {activeDetailEntry.password && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800/80 shadow-sm">
                    {/* Main Password Row */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Password
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenChangePassword(activeDetailEntry)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Change this password and archive the previous one"
                        >
                          <KeyRound size={12} />
                          <span>Change Password</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-white font-mono text-base select-all tracking-wider truncate">
                          {showPassword ? activeDetailEntry.password : '••••••••••••••••••••'}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                            title={showPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeDetailEntry.password, 'view-pass')}
                            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors flex items-center gap-1 text-xs cursor-pointer shadow-md"
                          >
                            {copiedField === 'view-pass' ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedField === 'view-pass' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Previous Passwords / History Section */}
                    {activeDetailEntry.passwordHistory && activeDetailEntry.passwordHistory.length > 0 && (
                      <div className="bg-neutral-900/40">
                        <button
                          type="button"
                          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                          className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <History size={13} className="text-emerald-400" />
                            <span>Previous Passwords ({activeDetailEntry.passwordHistory.length})</span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`transform transition-transform duration-200 ${
                              isHistoryExpanded ? 'rotate-180 text-emerald-400' : ''
                            }`}
                          />
                        </button>

                        {isHistoryExpanded && (
                          <div className="px-4 pb-3 space-y-2 border-t border-neutral-800/60 pt-2.5">
                            {activeDetailEntry.passwordHistory.map((item) => {
                              const isRevealed = revealedHistoryIds.has(item.id);
                              return (
                                <div
                                  key={item.id}
                                  className="p-2.5 bg-neutral-950/80 border border-neutral-800/70 rounded-xl flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="min-w-0 flex-1 pr-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-white tracking-wider text-xs select-all">
                                        {isRevealed ? item.oldPassword : '••••••••••••••••'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-neutral-500 mt-0.5 block">
                                      Changed {formatDate(item.changedAt)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRevealedHistoryIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(item.id)) next.delete(item.id);
                                          else next.add(item.id);
                                          return next;
                                        });
                                      }}
                                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                                    >
                                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(item.oldPassword, `history-${item.id}`)}
                                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                      title="Copy previous password"
                                    >
                                      {copiedField === `history-${item.id}` ? (
                                        <Check size={13} className="text-emerald-400" />
                                      ) : (
                                        <Copy size={13} />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRestorePassword(activeDetailEntry.id, item.oldPassword)}
                                      className="px-2 py-1 bg-neutral-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-neutral-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Restore as current password"
                                    >
                                      <RotateCcw size={11} />
                                      <span>Restore</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Website URL */}
                {activeDetailEntry.url && (
                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                        Website URL
                      </span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenUrl(activeDetailEntry.url);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-mono text-sm underline truncate block"
                      >
                        {activeDetailEntry.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(activeDetailEntry.url, 'view-url')}
                        className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors text-xs cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedField === 'view-url' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => handleOpenUrl(activeDetailEntry.url)}
                        className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <ExternalLink size={13} /> Open
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {activeDetailEntry.notes && (
                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Notes
                    </span>
                    <p className="text-neutral-200 text-xs whitespace-pre-wrap leading-relaxed">
                      {activeDetailEntry.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Created: {formatDate(activeDetailEntry.createdAt)}</span>
                  <span>Last updated: {formatDate(activeDetailEntry.updatedAt)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. MODALS & CONTEXT MENUS                                */}
      {/* ========================================================= */}

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl py-1.5 w-44 text-xs font-medium text-neutral-200 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => {
              const id = contextMenu.folderId;
              setContextMenu(null);
              handleCreateFolder(id);
            }}
            className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <FolderPlus size={14} className="text-emerald-400" />
            <span>New Subfolder</span>
          </button>

          <button
            onClick={() => {
              const id = contextMenu.folderId;
              const f = folders.find((x) => x.id === id);
              setContextMenu(null);
              if (f) {
                setIconPickerTarget({
                  type: 'folder',
                  id: f.id,
                  currentIcon: f.icon,
                  name: f.name,
                });
              }
            }}
            className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Change Icon</span>
          </button>

          <button
            onClick={() => {
              const id = contextMenu.folderId;
              const f = folders.find((x) => x.id === id);
              setContextMenu(null);
              if (f) {
                setRenamingFolderId(id);
                setRenameValue(f.name);
              }
            }}
            className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Edit3 size={14} className="text-blue-400" />
            <span>Rename</span>
          </button>

          <div className="border-t border-neutral-800 my-1"></div>

          <button
            onClick={() => {
              const id = contextMenu.folderId;
              const f = folders.find((x) => x.id === id);
              setContextMenu(null);
              if (f) setDeleteFolderConfirm(f);
            }}
            className="w-full px-3 py-2 text-left hover:bg-red-950/40 text-red-400 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 size={14} />
            <span>Delete Folder</span>
          </button>
        </div>
      )}

      {/* Delete Folder Confirmation Dialog */}
      {deleteFolderConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h4 className="text-lg font-bold text-red-400 mb-2">Delete Folder?</h4>
            <p className="text-xs text-neutral-300 mb-5 leading-relaxed">
              Delete folder <strong>"{deleteFolderConfirm.name}"</strong>? All passwords inside it will remain safe in your vault under "All Passwords".
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteFolderConfirm(null)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => sendIPC('DELETE_FOLDER', { id: deleteFolderConfirm.id })}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Entry Confirmation Dialog */}
      {deleteEntryConfirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h4 className="text-lg font-bold text-red-400 mb-2">Delete Password?</h4>
            <p className="text-xs text-neutral-300 mb-5 leading-relaxed">
              Are you sure you want to permanently delete this password?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteEntryConfirmId(null)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => sendIPC('DELETE_ENTRY', { id: deleteEntryConfirmId })}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      {changePasswordModalEntry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Change Password</h3>
                  <p className="text-xs text-neutral-400 truncate max-w-[240px]">
                    {changePasswordModalEntry.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordModalEntry(null)}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChangedPassword} className="space-y-4">
              {/* Generator Action */}
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newPass = generateSecurePassword({
                      length: 20,
                      uppercase: true,
                      lowercase: true,
                      numbers: true,
                      symbols: true,
                    });
                    setNewPasswordInput(newPass);
                    setShowNewPasswordInput(true);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} /> Generate Strong
                </button>
              </div>

              {/* Password Input Field */}
              <div className="relative">
                <input
                  type={showNewPasswordInput ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter or generate new password..."
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 pr-10 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPasswordInput(!showNewPasswordInput)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                >
                  {showNewPasswordInput ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPasswordInput && (
                <div className="space-y-1.5 pt-1">
                  {(() => {
                    const strength = calculatePasswordStrength(newPasswordInput);
                    return (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400 font-medium">Strength:</span>
                          <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${strength.bgColor} ${strength.width}`} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Informational Callout */}
              <div className="p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-xl flex items-start gap-2.5 text-xs text-neutral-400">
                <History size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Your previous password will be preserved in your history. You can view or restore it anytime.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalEntry(null)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPasswordInput.trim() || newPasswordInput === changePasswordModalEntry.password}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Check size={14} /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Password Confirmation Dialog */}
      {restoreConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-emerald-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw size={18} className="text-emerald-400" />
              Restore Password?
            </h4>
            <p className="text-xs text-neutral-300 mb-5 leading-relaxed">
              This will restore this previous password as your active password. Your current password will be moved into history so you never lose it.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setRestoreConfirm(null)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} /> Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Icon Picker Modal */}
      {iconPickerTarget && (
        <IconPickerModal
          isOpen={true}
          title={
            iconPickerTarget.type === 'folder'
              ? `Choose Folder Icon: ${iconPickerTarget.name || 'Folder'}`
              : `Choose Password Icon: ${iconPickerTarget.name || 'Password'}`
          }
          selectedIconId={iconPickerTarget.currentIcon}
          defaultType={iconPickerTarget.type}
          onSelect={handleSelectIcon}
          onClose={() => setIconPickerTarget(null)}
        />
      )}
    </div>
  );
};
