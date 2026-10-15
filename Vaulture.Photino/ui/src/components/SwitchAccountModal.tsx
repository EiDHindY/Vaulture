import React from 'react';
import { X, Check, ArrowRightLeft, ShieldCheck, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  isSwitching: boolean;
  authUrl: string | null;
  errorMessage: string | null;
  successEmail: string | null;
  onStartSwitch: () => void;
  onCancelSwitch: () => void;
  onOpenBrowser: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isSwitching,
  authUrl,
  errorMessage,
  successEmail,
  onStartSwitch,
  onCancelSwitch,
  onOpenBrowser,
}) => {
  if (!isOpen) return null;

  const isLinked = currentUser.isLinked && !!currentUser.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isLinked ? 'Switch Google Account' : 'Link Google Account'}
              </h3>
              <p className="text-xs text-neutral-400">
                {isLinked ? 'Connect cloud backup to a different account' : 'Enable zero-knowledge cloud backup'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Current Linked Status Card */}
          <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full border border-neutral-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30 shrink-0 text-sm">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-neutral-400 truncate">{currentUser.email || 'Local Vault (Not linked)'}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                isLinked
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {isLinked ? 'Active Cloud' : 'Offline'}
            </span>
          </div>

          {/* Guarantee / Security Callout */}
          <div className="p-3 bg-neutral-950/40 border border-neutral-800/80 rounded-xl flex gap-2.5 items-start text-xs text-neutral-300">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Your local data is 100% safe</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Switching accounts will <strong className="text-neutral-200">never</strong> delete or overwrite your local passwords. Your existing encrypted database will be backed up to your new Google account automatically.
              </p>
            </div>
          </div>

          {/* Status: Error */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2.5 text-xs text-red-300 animate-in fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status: Authorizing (Waiting on Google) */}
          {isSwitching && (
            <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl text-center space-y-3 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-semibold">
                <RefreshCw size={18} className="animate-spin text-blue-400" />
                <span>Waiting for Google authorization...</span>
              </div>
              <p className="text-xs text-neutral-400">
                A browser window has opened. Please select or sign in with your new Google account.
              </p>
              {authUrl && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenBrowser}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    <span>Click here to open browser tab manually</span>
                  </button>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCancelSwitch}
                  className="text-xs text-neutral-400 hover:text-red-400 transition-colors underline cursor-pointer"
                >
                  Cancel sign-in
                </button>
              </div>
            </div>
          )}

          {/* Status: Success */}
          {successEmail && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-center space-y-2 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check size={22} />
              </div>
              <p className="text-sm font-bold text-emerald-300">Google Account Linked!</p>
              <p className="text-xs text-neutral-300 font-medium truncate">{successEmail}</p>
              <p className="text-[11px] text-emerald-400/90 pt-1">
                Your local encrypted vault has been uploaded and synced.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-end gap-2.5">
          {successEmail ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Check size={14} /> Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSwitching}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onStartSwitch}
                disabled={isSwitching}
                className="py-2.5 px-4 bg-white hover:bg-gray-100 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
              >
                <GoogleIcon />
                <span>{isSwitching ? 'Authorizing...' : isLinked ? 'Sign in to Different Account' : 'Sign in with Google'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
