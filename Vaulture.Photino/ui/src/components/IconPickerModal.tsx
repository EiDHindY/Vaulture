import React, { useState, useMemo } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { ICON_REGISTRY, IconCategory, VaultIcon } from '../utils/iconRegistry';

interface IconPickerModalProps {
  isOpen: boolean;
  title?: string;
  selectedIconId?: string | null;
  defaultType?: 'entry' | 'folder';
  onSelect: (iconId: string | null) => void;
  onClose: () => void;
}

const CATEGORIES: { id: 'all' | IconCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'popular', label: 'Popular' },
  { id: 'tech', label: 'Tech & Work' },
  { id: 'social', label: 'Social' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'finance', label: 'Finance' },
  { id: 'system', label: 'System' },
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  title = 'Choose an Icon',
  selectedIconId,
  defaultType = 'entry',
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | IconCategory>('all');

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ICON_REGISTRY.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.id.toLowerCase().includes(q)) return true;
      return item.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [search, activeCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-[#121417] border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center">
              <VaultIcon iconId={selectedIconId} defaultType={defaultType} size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
              <p className="text-xs text-zinc-400">
                Pick a brand or category icon to personalize this item
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIconId && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/70 hover:bg-zinc-700/70 rounded-lg border border-zinc-700/60 transition"
                title="Reset to default icon"
              >
                <RotateCcw size={13} />
                <span>Reset to Default</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar & Categories */}
        <div className="p-5 border-b border-zinc-800/70 space-y-3 bg-[#121417]">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons (e.g. Gmail, Steam, Bank, GitHub, Lock)..."
              className="w-full bg-[#181B20] text-zinc-100 text-sm pl-10 pr-9 py-2.5 rounded-xl border border-zinc-800/90 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 outline-none placeholder:text-zinc-500 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-5 max-h-[460px] custom-scrollbar">
          {filteredIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
              <Search size={32} className="stroke-[1.5] mb-2 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-400">No matching icons</p>
              <p className="text-xs text-zinc-500 mt-1">
                Try searching for something else or browse categories
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
              {filteredIcons.map((item) => {
                const isSelected = selectedIconId?.toLowerCase() === item.id.toLowerCase();
                const Comp = item.component;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`group relative p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900/50 hover:bg-zinc-800/70 border-zinc-800/70 hover:border-zinc-700/80'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                      <Comp
                        size={22}
                        color={item.color}
                        style={{ color: item.color }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate max-w-full text-center px-0.5">
                      {item.name}
                    </span>

                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredIcons.length} icon{filteredIcons.length === 1 ? '' : 's'} available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
