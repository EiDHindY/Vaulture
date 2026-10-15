import { useState, useEffect, useRef, FormEvent } from 'react'
import {
  UserPlus,
  DownloadCloud,
  Copy,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import logoUrl from './assets/logo.png'
import { Dashboard } from './components/Dashboard'

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
)

const generatePassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const generateRecoveryKey = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts = [];
  for (let p = 0; p < 4; p++) {
    let chunk = "";
    for (let i = 0; i < 4; i++) {
      chunk += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(chunk);
  }
  return parts.join('-');
}

interface LinkedAccount {
  name: string;
  email: string;
  picture: string;
}

function App() {
  const [mode, setMode] = useState<'loading' | 'welcome' | 'login' | 'dashboard' | 'setup' | 'restore' | 'recover'>('loading')
  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])
  const [vaultExists, setVaultExists] = useState(false)
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccount | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isUnlockedSuccess, setIsUnlockedSuccess] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const unlockStartTimeRef = useRef<number>(0)

  // Setup Wizard State
  const [setupStep, setSetupStep] = useState(1)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [copiedPass, setCopiedPass] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [savedKey, setSavedKey] = useState(false)
  const [isCreatingVault, setIsCreatingVault] = useState(false)

  // Recovery State
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('')
  const [recoveredPassword, setRecoveredPassword] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [copiedRecoveredPass, setCopiedRecoveredPass] = useState(false)

  // Google Auth State
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [googleSuccess, setGoogleSuccess] = useState<string | null>(null)
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  // Restore Flow State
  const [restoreStep, setRestoreStep] = useState<'auth' | 'verify'>('auth')
  const [restorePassword, setRestorePassword] = useState('')
  const [restoreError, setRestoreError] = useState('')
  const [restoreVerifying, setRestoreVerifying] = useState(false)
  const [restoreUser, setRestoreUser] = useState<LinkedAccount | null>(null)
  const [restoreBackupDate, setRestoreBackupDate] = useState<string>('')

  // Modals
  const [showPassModal, setShowPassModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [showWipeModal, setShowWipeModal] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState<null | 'create' | 'restore'>(null)

  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    // @ts-ignore
    if (window.external && window.external.sendMessage && window.external.receiveMessage) {
      // @ts-ignore
      window.external.receiveMessage((message: string) => {
        try {
          const data = JSON.parse(message)
          if (data.type === 'INIT') {
            const exists = !!data.payload?.vaultExists;
            setVaultExists(exists);
            if (data.payload?.linkedAccount) {
              setLinkedAccount(data.payload.linkedAccount);
            } else {
              setLinkedAccount(null);
            }
            setMode(exists ? 'login' : 'welcome');
          } else if (data.type === 'LOGIN_RESULT') {
            const elapsed = performance.now() - unlockStartTimeRef.current;
            const remainingWait = Math.max(0, 500 - elapsed);
            setTimeout(() => {
              if (data.payload.success) {
                setIsUnlocking(false);
                setIsUnlockedSuccess(true);
                // Step 1: Hold the unlocked state for 380ms for user feedback
                setTimeout(() => {
                  // Step 2: Trigger smooth dissolve/scale exit animation on the lock card
                  setIsTransitioning(true);
                  setTimeout(() => {
                    // Step 3: Enter dashboard with View Transition if available
                    const proceed = () => {
                      setMode('dashboard');
                      setIsUnlockedSuccess(false);
                      setIsTransitioning(false);
                    };
                    // @ts-ignore
                    if (document.startViewTransition) {
                      // @ts-ignore
                      document.startViewTransition(proceed);
                    } else {
                      proceed();
                    }
                  }, 300);
                }, 380);
              } else {
                setIsUnlocking(false);
                setIsUnlockedSuccess(false);
                setIsTransitioning(false);
                setError(data.payload.error || 'Incorrect master password.');
              }
            }, remainingWait);
          } else if (data.type === 'CREATE_VAULT_RESULT') {
            setIsCreatingVault(false);
            if (data.payload.success) {
              setVaultExists(true);
            } else {
              setError(data.payload.error || 'Failed to create vault.');
              setGoogleError(data.payload.error || 'Failed to initialize vault.');
            }
          } else if (data.type === 'GOOGLE_AUTH_URL') {
            setAuthUrl(data.payload.url);
          } else if (data.type === 'GOOGLE_SIGN_IN_RESULT') {
            setGoogleLoading(false);
            setAuthUrl(null);
            if (data.payload.success) {
              const acc = {
                name: data.payload.name || '',
                email: data.payload.email || '',
                picture: data.payload.picture || ''
              };
              setLinkedAccount(acc);
              setGoogleSuccess(data.payload.email || 'Account connected');
              setGoogleError('');
              if (modeRef.current === 'restore') {
                // @ts-ignore
                if (window.external?.sendMessage) {
                  // @ts-ignore
                  window.external.sendMessage(JSON.stringify({ type: 'RESTORE_VAULT_BACKUP' }));
                }
              } else {
                setTimeout(() => {
                  setVaultExists(true);
                  setMode('dashboard');
                }, 1500);
              }
            } else {
              setGoogleError(data.payload.error || 'Google authentication failed.');
            }
          } else if (data.type === 'RESTORE_VAULT_BACKUP_RESULT') {
            if (data.payload.success) {
              setVaultExists(true);
              if (data.payload.user) {
                setRestoreUser(data.payload.user);
                setLinkedAccount(data.payload.user);
              }
              setRestoreBackupDate(data.payload.backupDate || 'Recent');
              setRestoreStep('verify');
              setRestorePassword('');
              setRestoreError('');
            } else {
              setGoogleLoading(false);
              setGoogleError(data.payload.error || 'Failed to download cloud backup.');
            }
          } else if (data.type === 'VERIFY_RESTORE_PASSWORD_RESULT') {
            setRestoreVerifying(false);
            if (data.payload.success) {
              if (data.payload.linkedAccount) {
                setLinkedAccount(data.payload.linkedAccount);
              }
              setMode('dashboard');
            } else {
              setRestoreError(data.payload.error || 'Incorrect master password for this backup.');
            }
          } else if (data.type === 'LOCK_RESULT') {
            setPassword('');
            if (data.payload?.linkedAccount) {
              setLinkedAccount(data.payload.linkedAccount);
            } else {
              setLinkedAccount(null);
            }
            setMode('login');
          } else if (data.type === 'RECOVER_RESULT') {
            if (data.payload.success) {
              setRecoveredPassword(data.payload.password);
              setRecoveryError('');
            } else {
              setRecoveryError(data.payload.error || 'Invalid recovery key.');
            }
          } else if (data.type === 'WIPE_RESULT') {
            if (data.payload.success) {
              setVaultExists(false);
              setPassword('');
              setRecoveredPassword('');
              setLinkedAccount(null);
              setShowWipeModal(false);
              setMode('welcome');
            } else {
              setError(data.payload.error || 'Failed to wipe vault.');
            }
          }
        } catch (e) {
          console.error('Parse error', e)
        }
      })

      // @ts-ignore
      window.external.sendMessage(JSON.stringify({ type: 'READY' }))
    } else {
      setTimeout(() => setMode('welcome'), 500)
    }
  }, [])

  const handleLogin = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!password) { setError('Please enter your password.'); return; }
    setIsUnlocking(true)
    unlockStartTimeRef.current = performance.now()
    const currentPassword = password
    // Allow browser to paint the loading spinner and animate before synchronous IPC work
    requestAnimationFrame(() => {
      setTimeout(() => {
        // @ts-ignore
        if (window.external?.sendMessage) {
          // @ts-ignore
          window.external.sendMessage(JSON.stringify({ type: 'LOGIN', payload: currentPassword }));
        }
      }, 300)
    })
  }

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleStartSetup = () => {
    setSetupStep(1);
    setNewPassword('');
    setConfirmPassword('');
    setCopiedPass(false);
    setRecoveryKey(generateRecoveryKey());
    setCopiedKey(false);
    setSavedKey(false);
    setIsCreatingVault(false);
    setGoogleLoading(false);
    setGoogleError('');
    setGoogleSuccess(null);
    setMode('setup');
  }

  const handleStartRestore = () => {
    setRestoreStep('auth');
    setRestorePassword('');
    setRestoreError('');
    setGoogleLoading(false);
    setGoogleError('');
    setGoogleSuccess(null);
    setAuthUrl(null);
    // @ts-ignore
    if (window.external?.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({ type: 'START_RESTORE' }));
    }
    setMode('restore');
  };

  const handleProceedReplace = () => {
    const target = showReplaceModal;
    setShowReplaceModal(null);
    if (target === 'create') {
      handleStartSetup();
    } else if (target === 'restore') {
      handleStartRestore();
    }
  };

  const handleVerifyRestore = (e: FormEvent) => {
    e.preventDefault();
    setRestoreError('');
    if (!restorePassword) {
      setRestoreError('Please enter your master password.');
      return;
    }
    setRestoreVerifying(true);
    // @ts-ignore
    if (window.external?.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({
        type: 'VERIFY_RESTORE_PASSWORD',
        payload: { password: restorePassword }
      }));
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setGoogleError('');
    setGoogleSuccess(null);
    setAuthUrl(null);

    // Trigger Google Sign In via C#
    // @ts-ignore
    if (window.external?.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({ type: 'GOOGLE_SIGN_IN' }));
    } else {
      setTimeout(() => {
        setGoogleLoading(false);
        setGoogleSuccess('user@gmail.com');
        setTimeout(() => setMode('dashboard'), 1500);
      }, 1500);
    }
  }

  const handleCancelGoogleAuth = () => {
    setGoogleLoading(false);
    setAuthUrl(null);
    setGoogleError('Sign-in cancelled. You can try again.');
    // @ts-ignore
    if (window.external?.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({ type: 'CANCEL_GOOGLE_AUTH' }));
    }
  };

  const handleOpenAuthUrl = () => {
    if (!authUrl) return;
    // @ts-ignore
    if (window.external?.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({
        type: 'OPEN_URL',
        payload: { url: authUrl }
      }));
    } else {
      window.open(authUrl, '_blank');
    }
  };

  const handleRecover = (e: FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!recoveryKeyInput.trim()) {
      setRecoveryError('Please enter your recovery key.');
      return;
    }
    // @ts-ignore
    if (window.external?.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({
        type: 'RECOVER_VAULT',
        payload: recoveryKeyInput.trim()
      }));
    }
  }

  const handleConfirmWipe = () => {
    // @ts-ignore
    if (window.external?.sendMessage) {
      // @ts-ignore
      window.external.sendMessage(JSON.stringify({ type: 'WIPE_VAULT' }));
    }
  }

  if (mode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-neutral-400 font-mono text-sm">
        <div className="animate-pulse flex flex-col items-center">
          <svg className="w-12 h-12 text-emerald-500 mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    )
  }

  if (mode === 'dashboard') {
    return (
      <Dashboard
        onLock={() => {
          // @ts-ignore
          if (window.external?.sendMessage) {
            // @ts-ignore
            window.external.sendMessage(JSON.stringify({ type: 'LOCK_VAULT' }));
          }
          setPassword('');
          const proceed = () => {
            setMode('login');
          };
          // @ts-ignore
          if (document.startViewTransition) {
            // @ts-ignore
            document.startViewTransition(proceed);
          } else {
            proceed();
          }
        }}
        onWipeVault={() => setShowWipeModal(true)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white font-sans select-none relative overflow-hidden">
      
      {/* Subtle Ambient Emerald Aura behind Vault during unlock */}
      <div 
        className={`absolute w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none transition-all duration-700 ease-out ${
          isUnlockedSuccess || isTransitioning
            ? 'opacity-100 scale-125'
            : 'opacity-0 scale-75'
        }`}
      />
      
      {/* Modal: Master Password Confirmation */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-emerald-500/30 p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4"><ShieldAlert size={48} className="text-emerald-500" /></div>
            <h3 className="text-xl font-bold text-center mb-2">Are you absolutely sure?</h3>
            <p className="text-sm text-neutral-300 text-center mb-6 leading-relaxed">
              If you lose this password, Vaulture <strong>cannot</strong> reset it for you. Your data will be permanently locked forever.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowPassModal(false)} className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-semibold transition-colors cursor-pointer">Go Back</button>
              <button onClick={() => { setShowPassModal(false); setSetupStep(2); }} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-colors text-white cursor-pointer">I'm Sure</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Recovery Key Confirmation */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-red-500/30 p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4"><AlertTriangle size={48} className="text-red-500" /></div>
            <h3 className="text-xl font-bold text-center mb-2">Final Warning</h3>
            <p className="text-sm text-neutral-300 text-center mb-6 leading-relaxed">
              This Recovery Key is the <strong>absolute last resort</strong> if you forget your Master Password. If you haven't written it down, do not proceed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowKeyModal(false)} className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-semibold transition-colors cursor-pointer">Go Back</button>
              <button 
                onClick={() => { 
                  setShowKeyModal(false); 
                  setSetupStep(3); 
                  setIsCreatingVault(true);
                  // @ts-ignore
                  if (window.external?.sendMessage) {
                    // @ts-ignore
                    window.external.sendMessage(JSON.stringify({
                      type: 'CREATE_VAULT',
                      payload: {
                        password: newPassword,
                        recoveryKey: recoveryKey
                      }
                    }));
                  }
                }} 
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors text-white cursor-pointer"
              >
                I Have It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Factory Reset / Wipe Confirmation */}
      {showWipeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-red-600/50 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4"><Trash2 size={48} className="text-red-500 animate-pulse" /></div>
            <h3 className="text-2xl font-bold text-center text-red-400 mb-2">Permanently Wipe Vault?</h3>
            <p className="text-sm text-neutral-300 text-center mb-4 leading-relaxed">
              This action is <strong>irreversible</strong>. Your encrypted database (<code className="text-red-300">vault.db</code>) and all stored passwords will be destroyed from this device.
            </p>
            <p className="text-xs text-neutral-400 text-center mb-6">
              You will start fresh with an empty setup.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowWipeModal(false)} className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-semibold transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleConfirmWipe} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors cursor-pointer">Wipe Everything</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Safe Vault Replacement Confirmation */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-amber-500/40 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4"><ShieldAlert size={48} className="text-amber-400" /></div>
            <h3 className="text-xl font-bold text-center text-white mb-2">Replace Current Local Vault?</h3>
            <p className="text-sm text-neutral-300 text-center mb-3 leading-relaxed">
              A vault already exists on this computer.
            </p>
            <div className="bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl mb-6 text-xs text-amber-200/90 text-left">
              If your current local vault is connected to Google, it will be automatically backed up to the cloud first. Proceeding will replace the local files on this machine.
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReplaceModal(null)} 
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleProceedReplace} 
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl relative transition-all duration-300 ${
        isTransitioning
          ? 'animate-lock-exit'
          : isUnlockedSuccess
          ? 'border-emerald-500/50 shadow-[0_0_45px_rgba(16,185,129,0.25)]'
          : 'animate-lock-enter'
      }`}>
        
        {/* Navigation Back button */}
        {(mode === 'setup' || mode === 'restore' || mode === 'recover') && (
          <button
            onClick={() => {
              setError('');
              setRecoveryError('');
              setGoogleLoading(false);
              setGoogleError('');
              setAuthUrl(null);
              setRestoreStep('auth');
              setRestorePassword('');
              setRestoreError('');
              // @ts-ignore
              if (window.external?.sendMessage) {
                // @ts-ignore
                window.external.sendMessage(JSON.stringify({ type: 'CANCEL_GOOGLE_AUTH' }));
              }
              setMode(vaultExists ? 'login' : 'welcome');
            }}
            className="absolute top-6 left-6 text-neutral-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <div className="flex flex-col items-center mb-4">
          <img src={logoUrl} alt="Vaulture Logo" className="w-20 h-20 mb-3 object-contain rounded-full drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Vaulture</h1>
          {mode === 'login' && <p className="text-neutral-400 mt-1 text-sm text-center">Enter your master password</p>}

          {/* Linked Account Badge on Lock Screen */}
          {mode === 'login' && linkedAccount && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-full mt-2 shadow-inner">
              {linkedAccount.picture ? (
                <img src={linkedAccount.picture} alt="Avatar" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] font-bold text-white">
                  {linkedAccount.name ? linkedAccount.name[0].toUpperCase() : 'V'}
                </div>
              )}
              <span className="text-[11px] text-neutral-300 font-medium truncate max-w-[200px]">
                {linkedAccount.email}
              </span>
            </div>
          )}

          {/* Animated Lock -> Unlock Badge */}
          {mode === 'login' && (
            <div className="mt-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isUnlockedSuccess
                  ? 'bg-emerald-500/25 border-2 border-emerald-400 text-emerald-400 scale-110 shadow-[0_0_30px_rgba(16,185,129,0.5)] rotate-3'
                  : isUnlocking
                  ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 animate-pulse'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-400 shadow-inner'
              }`}>
                {isUnlockedSuccess ? (
                  <Unlock size={32} className="text-emerald-400 animate-in zoom-in-50 duration-300" />
                ) : isUnlocking ? (
                  <Loader2 size={28} className="animate-spin text-emerald-400" />
                ) : (
                  <Lock size={26} className="text-neutral-400" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------------- LOGIN MODE ---------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                disabled={isUnlocking || isUnlockedSuccess}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Master Password"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-white placeholder-neutral-500 disabled:opacity-50"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isUnlocking || isUnlockedSuccess}
              className={`w-full py-3.5 px-4 font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isUnlockedSuccess
                  ? 'bg-emerald-500 text-white scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : isUnlocking
                  ? 'bg-emerald-600/80 text-white cursor-wait'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {isUnlockedSuccess ? (
                <>
                  <Unlock size={18} className="text-white animate-pulse" />
                  <span>Vault Decrypted</span>
                </>
              ) : isUnlocking ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Decrypting Vault...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Unlock Vault</span>
                </>
              )}
            </button>

            <div className="flex flex-col items-center gap-2.5 pt-2 text-sm">
              <button
                type="button"
                onClick={() => { setError(''); setMode('recover'); }}
                className="text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer text-xs"
              >
                Forgot Master Password?
              </button>

              <div className="w-full flex items-center gap-3 my-1">
                <div className="h-px bg-neutral-800 flex-1"></div>
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider">or</span>
                <div className="h-px bg-neutral-800 flex-1"></div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    if (vaultExists) {
                      setShowReplaceModal('restore');
                    } else {
                      handleStartRestore();
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <DownloadCloud size={14} className="text-emerald-400" />
                  Restore a Vault from Cloud
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    if (vaultExists) {
                      setShowReplaceModal('create');
                    } else {
                      handleStartSetup();
                    }
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer text-center py-1"
                >
                  Need a new vault? Create one
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ---------------- WELCOME MODE ---------------- */}
        {mode === 'welcome' && (
          <div className="space-y-3">
            {vaultExists && (
              <button
                onClick={() => { setError(''); setMode('login'); }}
                className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={20} /> Unlock Current Vault
              </button>
            )}

            <button
              onClick={() => {
                if (vaultExists) {
                  setShowReplaceModal('create');
                } else {
                  handleStartSetup();
                }
              }}
              className={`w-full py-4 px-4 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                vaultExists
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
              }`}
            >
              <UserPlus size={20} /> Create New Vault
            </button>

            <button
              onClick={() => {
                if (vaultExists) {
                  setShowReplaceModal('restore');
                } else {
                  handleStartRestore();
                }
              }}
              className="w-full py-4 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <DownloadCloud size={20} /> Restore Existing Vault
            </button>

            {!vaultExists && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setError(''); setMode('login'); }}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Already have a local vault file? Unlock it
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- RECOVER / WIPE MODE ---------------- */}
        {mode === 'recover' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">Recover Vault Access</h2>
              <p className="text-xs text-neutral-400">Enter your emergency recovery key to retrieve your Master Password.</p>
            </div>

            {!recoveredPassword ? (
              <form onSubmit={handleRecover} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={recoveryKeyInput}
                    onChange={(e) => setRecoveryKeyInput(e.target.value)}
                    placeholder="e.g. ABCD-EFGH-JKLM-NPQR"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-white font-mono text-sm placeholder-neutral-600"
                    autoFocus
                  />
                  {recoveryError && <p className="text-red-400 text-sm mt-2">{recoveryError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound size={18} /> Recover Master Password
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-center">
                  <p className="text-xs text-emerald-400 font-semibold mb-1">Master Password Recovered!</p>
                  <p className="text-lg font-mono text-white select-all break-all">{recoveredPassword}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(recoveredPassword, setCopiedRecoveredPass)}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedRecoveredPass ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  {copiedRecoveredPass ? 'Copied!' : 'Copy Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPassword(recoveredPassword);
                    setRecoveredPassword('');
                    setMode('login');
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Continue to Login
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowWipeModal(true)}
                className="w-full py-3 px-4 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-400 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} /> Factory Reset (Wipe Vault)
              </button>
            </div>
          </div>
        )}

        {/* ---------------- SETUP WIZARD MODE ---------------- */}
        {mode === 'setup' && setupStep === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Create Master Password</h2>
              <div className="bg-emerald-950/50 border border-emerald-900/50 p-3 rounded-xl mb-3">
                <p className="text-xs text-emerald-100/80 leading-relaxed text-left">
                  <strong>Why a Master Password?</strong> Vaulture is a zero-knowledge safe. This password is the cryptographic key that locks your data. It never leaves your computer, meaning even we cannot read your passwords.
                </p>
              </div>
              <div className="bg-amber-950/40 border border-amber-900/50 p-3 rounded-xl mb-4">
                <p className="text-xs text-amber-200/90 leading-relaxed text-left flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Critical: Copy & Save!</strong> This password is the <u>only way</u> to decrypt and access your vault. You must copy and save it securely before proceeding.
                  </span>
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Master Password"
                  className="w-full px-4 py-3 pr-24 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-white font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setNewPassword(generatePassword())}
                  className="absolute right-3 top-3.5 text-emerald-500 hover:text-emerald-400 cursor-pointer text-xs font-bold uppercase tracking-wider"
                  title="Generate Secure Password"
                >
                  Generate
                </button>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-white font-mono text-sm"
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => handleCopy(newPassword, setCopiedPass)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedPass ? <CheckCircle size={16} className="text-emerald-400"/> : <Copy size={16}/>}
              {copiedPass ? 'Copied to Clipboard' : 'Copy Password to Clipboard'}
            </button>

            <button 
              onClick={() => setShowPassModal(true)}
              disabled={!newPassword || newPassword !== confirmPassword || !copiedPass}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {mode === 'setup' && setupStep === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Emergency Recovery Key</h2>
              <div className="bg-red-950/30 border border-red-900/30 p-3 rounded-xl mb-4">
                <p className="text-xs text-red-200/80 leading-relaxed text-left">
                  This 16-character recovery key is the <strong>only</strong> way to recover your vault if you forget your master password. Write it down and keep it somewhere completely safe.
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl select-all font-mono text-emerald-400 text-center leading-relaxed text-sm tracking-wider">
              {recoveryKey}
            </div>

            <button 
              type="button" 
              onClick={() => handleCopy(recoveryKey, setCopiedKey)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedKey ? <CheckCircle size={16} className="text-emerald-400"/> : <Copy size={16}/>}
              {copiedKey ? 'Key Copied!' : 'Copy Recovery Key'}
            </button>

            <label className="flex items-center gap-3 cursor-pointer mt-4 group">
              <input type="checkbox" checked={savedKey} onChange={(e) => setSavedKey(e.target.checked)} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
              <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">I have safely stored my recovery key.</span>
            </label>

            <button 
              onClick={() => setShowKeyModal(true)}
              disabled={!savedKey || !copiedKey}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {mode === 'setup' && setupStep === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Mandatory Cloud Backup</h2>
              <p className="text-sm text-neutral-400 mb-4">Link your Google Account to automatically sync your encrypted vault to Supabase.</p>
            </div>

            {googleSuccess ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle size={32} className="text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-emerald-300">Successfully Linked!</p>
                <p className="text-xs text-neutral-300">{googleSuccess}</p>
                <p className="text-xs text-emerald-500 animate-pulse">Entering Dashboard...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {googleError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 text-center">
                    {googleError}
                  </div>
                )}

                {googleLoading && (
                  <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl text-center space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-medium">
                      <svg className="w-5 h-5 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Waiting for Google authorization...
                    </div>
                    <p className="text-xs text-neutral-400">
                      A browser tab has been opened. Please complete the sign-in prompt.
                    </p>
                    {authUrl && (
                      <p className="text-xs text-neutral-300 pt-1">
                        Browser didn't open?{' '}
                        <button
                          type="button"
                          onClick={handleOpenAuthUrl}
                          className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer inline"
                        >
                          Click here to open browser
                        </button>
                      </p>
                    )}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCancelGoogleAuth}
                        className="text-xs text-neutral-400 hover:text-red-400 transition-colors underline cursor-pointer"
                      >
                        Cancel sign-in
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || isCreatingVault}
                  className="w-full py-4 px-4 bg-white hover:bg-gray-100 disabled:opacity-50 text-neutral-900 font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-3 cursor-pointer"
                >
                  <GoogleIcon /> {isCreatingVault ? 'Initializing Encrypted Vault...' : googleLoading ? 'Signing In...' : 'Sign in with Google'}
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'restore' && restoreStep === 'auth' && (
          <div className="text-center space-y-4 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white">Restore Vault from Cloud</h2>
            <p className="text-neutral-400 text-sm mb-4">
              Sign in with Google to download your encrypted vault from cloud storage.
            </p>

            {googleSuccess ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle size={32} className="text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-emerald-300">Google Account Connected!</p>
                <p className="text-xs text-neutral-300">{googleSuccess}</p>
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs animate-pulse pt-1">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Downloading encrypted vault from cloud...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {googleError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 text-center">
                    {googleError}
                  </div>
                )}

                {googleLoading && (
                  <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl text-center space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-medium">
                      <Loader2 size={18} className="animate-spin text-blue-400" />
                      Waiting for Google authorization...
                    </div>
                    <p className="text-xs text-neutral-400">
                      A browser tab has been opened. Please select your Google account.
                    </p>
                    {authUrl && (
                      <p className="text-xs text-neutral-300 pt-1">
                        Browser didn't open?{' '}
                        <button
                          type="button"
                          onClick={handleOpenAuthUrl}
                          className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer inline"
                        >
                          Click here to open browser
                        </button>
                      </p>
                    )}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCancelGoogleAuth}
                        className="text-xs text-neutral-400 hover:text-red-400 transition-colors underline cursor-pointer"
                      >
                        Cancel sign-in
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full py-4 px-4 bg-white hover:bg-gray-100 disabled:opacity-50 text-neutral-900 font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-3 cursor-pointer"
                >
                  <GoogleIcon /> {googleLoading ? 'Signing In...' : 'Sign in with Google'}
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'restore' && restoreStep === 'verify' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">Verify Master Password</h2>
              <p className="text-xs text-neutral-400">
                Your encrypted vault was successfully downloaded. Enter its Master Password to decrypt and open it.
              </p>
            </div>

            {/* Restored Account Badge */}
            {restoreUser && (
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-3">
                {restoreUser.picture ? (
                  <img src={restoreUser.picture} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                    {restoreUser.name ? restoreUser.name[0].toUpperCase() : 'V'}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-white truncate">{restoreUser.name || 'Google User'}</div>
                  <div className="text-xs text-neutral-400 truncate">{restoreUser.email}</div>
                  {restoreBackupDate && (
                    <div className="text-[11px] text-emerald-400/90 mt-0.5">
                      Cloud Backup: {restoreBackupDate}
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyRestore} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={restorePassword}
                  disabled={restoreVerifying}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  placeholder="Master Password for this vault"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-white placeholder-neutral-500 disabled:opacity-50"
                  autoFocus
                />
                {restoreError && <p className="text-red-400 text-xs mt-2 text-left">{restoreError}</p>}
              </div>

              <button
                type="submit"
                disabled={restoreVerifying}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {restoreVerifying ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Verifying & Opening...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={18} />
                    <span>Unlock & Open Vault</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col items-center gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('recover');
                }}
                className="text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Forgot Master Password? Recover with key
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestoreStep('auth');
                  setRestorePassword('');
                  setRestoreError('');
                  handleStartRestore();
                }}
                className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Sign in with a different Google account
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
