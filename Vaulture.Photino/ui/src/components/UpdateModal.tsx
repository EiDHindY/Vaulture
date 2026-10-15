import React from 'react';
import {
  X,
  RefreshCw,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt?: string;
  downloadUrl?: string;
  assetSize?: number;
}

export interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  downloadState: 'idle' | 'downloading' | 'ready' | 'error';
  downloadProgress: number;
  errorMessage?: string | null;
  onCheckUpdate: () => void;
  onStartDownload: () => void;
  onApplyAndRestart: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  updateInfo,
  isChecking,
  downloadState,
  downloadProgress,
  errorMessage,
  onCheckUpdate,
  onStartDownload,
  onApplyAndRestart,
}) => {
  if (!isOpen) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const openGitHubRelease = () => {
    window.open('https://github.com/EiDHindY/Vaulture/releases', '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#121417] border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpCircle size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Software Update</h2>
              <p className="text-xs text-zinc-400">
                Keep Vaulture secure and up to date
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Checking Spinner */}
          {isChecking ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <RefreshCw size={32} className="text-emerald-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-zinc-200">Checking for updates...</p>
                <p className="text-xs text-zinc-500 mt-0.5">Connecting to GitHub Releases</p>
              </div>
            </div>
          ) : updateInfo?.hasUpdate ? (
            /* Update Available */
            <>
              {/* Version Comparison Card */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    New Version Available
                  </span>
                  {updateInfo.assetSize ? (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {formatSize(updateInfo.assetSize)}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-850 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Installed:</span>
                    <span className="text-xs font-mono font-medium text-zinc-300 px-2 py-0.5 rounded bg-zinc-800">
                      {currentVersion}
                    </span>
                  </div>
                  <span className="text-zinc-600">➔</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-semibold">Latest:</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                      {updateInfo.latestVersion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Release Notes */}
              {updateInfo.releaseNotes && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-400">What's New in {updateInfo.latestVersion}:</span>
                  <div className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-xl max-h-40 overflow-y-auto text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed custom-scrollbar font-sans">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              {/* Error state */}
              {downloadState === 'error' && (
                <div className="p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{errorMessage || 'Failed to download or apply the update.'}</span>
                </div>
              )}

              {/* Downloading State with Progress Bar */}
              {downloadState === 'downloading' && (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <RefreshCw size={13} className="animate-spin" />
                      Downloading update package...
                    </span>
                    <span className="font-mono text-zinc-300 font-semibold">{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${Math.max(downloadProgress, 3)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Vaulture will remain open. Once download completes, you will be prompted to restart.
                  </p>
                </div>
              )}

              {/* Ready State */}
              {downloadState === 'ready' && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-300">Update Ready to Install!</p>
                    <p className="text-neutral-400 mt-0.5">
                      Click Restart Now to seamlessly update Vaulture to {updateInfo.latestVersion}.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Up to Date State */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">You're Up to Date!</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Vaulture <span className="font-mono text-zinc-200 font-medium">{currentVersion}</span> is the latest version available.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={openGitHubRelease}
            className="text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1 cursor-pointer"
          >
            <span>GitHub Releases</span>
            <ExternalLink size={12} />
          </button>

          <div className="flex items-center gap-2">
            {updateInfo?.hasUpdate ? (
              downloadState === 'ready' ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl transition cursor-pointer"
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    onClick={onApplyAndRestart}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950/50"
                  >
                    <RotateCcw size={14} />
                    <span>Restart Now</span>
                  </button>
                </>
              ) : downloadState === 'downloading' ? (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-zinc-800 text-zinc-500 font-medium rounded-xl flex items-center gap-2 opacity-70 cursor-not-allowed"
                >
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Downloading...</span>
                </button>
              ) : downloadState === 'error' ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={onStartDownload}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Retry Download</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl transition cursor-pointer"
                  >
                    Remind Later
                  </button>
                  <button
                    type="button"
                    onClick={onStartDownload}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950/50"
                  >
                    <Download size={14} />
                    <span>Download & Update</span>
                  </button>
                </>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isChecking}
                  onClick={onCheckUpdate}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-zinc-700/60 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
                  <span>Check Again</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
