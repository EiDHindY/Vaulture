import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Sparkles,
  UploadCloud,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Upload
} from 'lucide-react';
import {
  ICON_REGISTRY,
  IconCategory,
  VaultIcon,
  isCustomUploadedIcon
} from '../utils/iconRegistry';

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

/**
 * Resizes raster images to 256x256 transparent square or keeps small SVGs vector.
 * Returns a compact base64 data URL ready for SQLite storage and encrypted sync.
 */
async function processImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, SVG, WebP, GIF).');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file is too large. Maximum file size is 10 MB.');
  }

  // Preserve small SVGs (< 64KB) as pure vector data URLs
  if (file.type === 'image/svg+xml' && file.size < 64 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read SVG file.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
    });
  }

  // For raster formats, downscale onto a clean 256x256 canvas with transparency
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering context not available.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Center and fit without distortion
        const scale = Math.min(size / img.width, size / img.height);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const x = Math.round((size - w) / 2);
        const y = Math.round((size - h) / 2);

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, x, y, w, h);

        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch {
        reject(new Error('Failed to process image file.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image file.'));
    };

    img.src = objectUrl;
  });
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  title = 'Choose an Icon',
  selectedIconId,
  defaultType = 'entry',
  onSelect,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'icons' | 'custom'>(() => {
    return isCustomUploadedIcon(selectedIconId) ? 'custom' : 'icons';
  });

  // Library state
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | IconCategory>('all');

  // Custom upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stagedIcon, setStagedIcon] = useState<string | null>(() => {
    return isCustomUploadedIcon(selectedIconId) ? selectedIconId! : null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ICON_REGISTRY.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.id.toLowerCase().includes(q)) return true;
      return item.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [search, activeCategory]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const dataUrl = await processImageFile(file);
      setStagedIcon(dataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process image.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (!isOpen) return null;

  const currentPreviewIcon =
    activeTab === 'custom' && stagedIcon ? stagedIcon : selectedIconId;

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
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center overflow-hidden">
              <VaultIcon iconId={currentPreviewIcon} defaultType={defaultType} size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
              <p className="text-xs text-zinc-400">
                {activeTab === 'icons'
                  ? 'Pick a brand or category icon to personalize this item'
                  : 'Upload an icon or image from your device'}
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/70 hover:bg-zinc-700/70 rounded-lg border border-zinc-700/60 transition cursor-pointer"
                title="Reset to default icon"
              >
                <RotateCcw size={13} />
                <span>Reset to Default</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notion-style Top Tabs Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800/70 bg-[#121417]">
          <button
            type="button"
            onClick={() => setActiveTab('icons')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'icons'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Icons</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'custom'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload size={14} />
            <span>Custom</span>
            {isCustomUploadedIcon(selectedIconId) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Tab 1: Built-in Icons Library */}
        {activeTab === 'icons' && (
          <>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded cursor-pointer"
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
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
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
          </>
        )}

        {/* Tab 2: Notion-Style Custom Image Upload */}
        {activeTab === 'custom' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/x-icon"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Dropzone or Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition cursor-pointer select-none ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60'
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-emerald-400">
                    Optimizing image for encrypted storage...
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3.5 shadow-inner">
                    <UploadCloud size={28} className="text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-1">
                    Upload an icon or image from your device
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mb-4">
                    Drag and drop an image file here, or click to browse files
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700/60 shadow-sm transition">
                    <ImageIcon size={14} className="text-emerald-400" />
                    <span>Choose an Image</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-4">
                    Recommended: square image, 256×256 px. Supports PNG, JPG, SVG, WebP, GIF (max 10 MB)
                  </p>
                </>
              )}
            </div>

            {/* Custom Icon Preview & Actions */}
            {stagedIcon && (
              <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    {stagedIcon === selectedIconId ? 'Currently Applied Icon' : 'Preview New Custom Icon'}
                  </span>
                  {stagedIcon === selectedIconId ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Unsaved Preview
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                  {/* Large 64px preview */}
                  <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-inner">
                    <img
                      src={stagedIcon}
                      alt="Icon Preview"
                      className="w-full h-full object-contain rounded"
                    />
                  </div>

                  {/* Contextual mini sizes */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-xs text-zinc-300 font-medium truncate">
                      Custom Uploaded Image
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">List:</span>
                        <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center p-0.5">
                          <img src={stagedIcon} alt="mini" className="w-full h-full object-contain" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Tree:</span>
                        <div className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center p-0.5">
                          <img src={stagedIcon} alt="micro" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Stored encrypted with SQLCipher & automatically synced to cloud
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {stagedIcon !== selectedIconId && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(stagedIcon);
                        onClose();
                      }}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950/40"
                    >
                      <Check size={14} />
                      <span>Apply Custom Icon</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-zinc-700/60"
                  >
                    <Upload size={14} />
                    <span>Upload Different Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStagedIcon(null);
                      onSelect(null);
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-red-800/40"
                    title="Remove custom icon and revert to default"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {activeTab === 'icons'
              ? `${filteredIcons.length} icon${filteredIcons.length === 1 ? '' : 's'} available`
              : 'Custom uploaded icons are encrypted and synced automatically'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
