import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Cloud, 
  CheckCircle, 
  ExternalLink, 
  HelpCircle, 
  Save, 
  Trash2, 
  Lock, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  KeyRound,
  Check
} from 'lucide-react';
import { 
  getActiveFirebaseConfig, 
  saveLocalFirebaseConfig, 
  clearLocalFirebaseConfig,
  FirebaseCustomConfig 
} from '../firebase/config';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getActiveFirebaseConfig();

  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('pinboard_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password management inside admin
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Firebase fields
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');
  const [jsonPaste, setJsonPaste] = useState('');

  if (!isOpen) return null;

  const getEffectiveAdminPassword = (): string => {
    const saved = localStorage.getItem('pinboard_admin_password');
    if (saved) return saved;
    const metaEnv = ((import.meta as unknown) as { env?: Record<string, string> }).env || {};
    return (metaEnv.VITE_ADMIN_PASSWORD as string) || 'admin123';
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const targetPassword = getEffectiveAdminPassword();
    if (passwordInput === targetPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('pinboard_admin_auth', 'true');
      setPasswordInput('');
    } else {
      setPasswordError('Incorrect administrator password. Access denied.');
      setPasswordInput('');
    }
  };

  const handleLockAdmin = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pinboard_admin_auth');
    setPasswordInput('');
    setPasswordError('');
  };

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || newPasswordInput.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    localStorage.setItem('pinboard_admin_password', newPasswordInput.trim());
    setNewPasswordInput('');
    setIsChangingPassword(false);
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 4000);
  };

  const handleJsonPaste = (text: string) => {
    setJsonPaste(text);
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleanJson = jsonMatch[0]
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"');
        const parsed = JSON.parse(cleanJson);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.authDomain) setAuthDomain(parsed.authDomain);
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
        if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
        if (parsed.appId) setAppId(parsed.appId);
      }
    } catch (e) {
      const extract = (key: string) => {
        const m = text.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`));
        return m ? m[1] : '';
      };
      if (extract('apiKey')) setApiKey(extract('apiKey'));
      if (extract('authDomain')) setAuthDomain(extract('authDomain'));
      if (extract('projectId')) setProjectId(extract('projectId'));
      if (extract('storageBucket')) setStorageBucket(extract('storageBucket'));
      if (extract('messagingSenderId')) setMessagingSenderId(extract('messagingSenderId'));
      if (extract('appId')) setAppId(extract('appId'));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('API Key and Project ID are required.');
      return;
    }
    const config: FirebaseCustomConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };
    saveLocalFirebaseConfig(config);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#181820] border-[3px] border-black dark:border-zinc-700 rounded-2xl shadow-brutal-xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto transition-colors">
        
        {/* ======================================================== */}
        {/* 1. ADMIN SECURITY GATE (LOCKED)                          */}
        {/* ======================================================== */}
        {!isAuthenticated ? (
          <>
            {/* Locked Gate Header */}
            <div className="bg-zinc-900 text-white p-5 border-b-[2.5px] border-black dark:border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    Admin Authorization Required
                  </h2>
                  <p className="text-xs font-semibold text-zinc-400">
                    Infrastructure & backend settings are password-protected
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center border-2 border-black"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Locked Gate Body */}
            <form onSubmit={handleAdminLogin} className="p-6 space-y-5 bg-white dark:bg-[#181820]">
              <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-black dark:border-amber-700/80 rounded-xl p-4 shadow-[2px_2px_0_#000] flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 stroke-[2.5]" />
                <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  <p className="font-black text-black dark:text-amber-200 mb-1">
                    Protected Admin Area
                  </p>
                  <p>
                    Please enter the Master Admin Password to view or modify Firebase cloud credentials. Unauthorized visitors cannot access this panel.
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-100 dark:bg-rose-950/80 border-2 border-black dark:border-rose-900 rounded-lg text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.5]" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-[2px_2px_0_#000] focus:shadow-brutal rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none pr-10 transition-all focus:border-brutal-purple"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Default: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold text-black dark:text-white">admin123</code> (Configurable inside or via VITE_ADMIN_PASSWORD)
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-black dark:border-zinc-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-brutal px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-bold text-xs border-2 border-black dark:border-zinc-600 shadow-[2px_2px_0_#000]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-brutal px-5 py-2 rounded-lg bg-brutal-purple hover:bg-brutal-purple-hover text-white font-black text-xs border-2 border-black shadow-brutal flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Authorize & Unlock</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* ======================================================== */
          /* 2. UNLOCKED ADMIN INFRASTRUCTURE CONSOLE                */
          /* ======================================================== */
          <>
            {/* Header */}
            <div className="bg-[#8b5cf6] text-white p-4 sm:p-5 border-b-[2.5px] border-black dark:border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#fde047] text-black border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                  <Cloud className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Admin Firebase Configuration</span>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-emerald-400 text-black rounded border border-black shadow-[1px_1px_0_#000]">
                      Unlocked
                    </span>
                  </h2>
                  <p className="text-xs font-bold text-purple-200">
                    Configure Google Auth & isolated multi-user cloud storage
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLockAdmin}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-bold border-2 border-black flex items-center gap-1"
                  title="Lock Admin Session"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white flex items-center justify-center border-2 border-black dark:border-zinc-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm bg-white dark:bg-[#181820]">
              {passwordChangeSuccess && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 border-2 border-black dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 text-xs font-bold rounded-lg flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Admin password successfully updated!</span>
                </div>
              )}

              {/* Quick Guide */}
              <div className="bg-[#fef9c3] dark:bg-amber-950/30 border-2 border-black dark:border-amber-700/80 rounded-xl p-4 shadow-[2px_2px_0_#000]">
                <h3 className="font-black text-black dark:text-amber-200 flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                  Quick 3-Minute Firebase Setup:
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  <li>
                    Create a project at{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#8b5cf6] dark:text-purple-300 underline font-bold inline-flex items-center gap-0.5"
                    >
                      Firebase Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Enable <b>Authentication &gt; Sign-in method &gt; Google</b>.</li>
                  <li>
                    In <b>Authentication &gt; Settings &gt; Authorized domains</b>, add your Netlify domain (e.g. <code>your-site.netlify.app</code>) and <code>localhost</code>.
                  </li>
                  <li>Enable <b>Cloud Firestore</b> (deploy <code>firestore.rules</code>).</li>
                  <li>Go to <b>Project settings &gt; General &gt; Your apps &gt; Web app</b> and copy the config.</li>
                </ol>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black dark:text-zinc-200 mb-1">
                    Paste Config Object (Auto-fill)
                  </label>
                  <textarea
                    rows={2}
                    placeholder='const firebaseConfig = { apiKey: "...", ... };'
                    value={jsonPaste}
                    onChange={e => handleJsonPaste(e.target.value)}
                    className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-lg p-2 font-mono text-xs text-black dark:text-white outline-none focus:border-brutal-purple"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-black dark:text-zinc-200 mb-0.5">
                      apiKey *
                    </label>
                    <input
                      type="text"
                      required
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-lg p-2 font-mono text-xs text-black dark:text-white outline-none focus:border-brutal-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-black dark:text-zinc-200 mb-0.5">
                      authDomain
                    </label>
                    <input
                      type="text"
                      value={authDomain}
                      onChange={e => setAuthDomain(e.target.value)}
                      placeholder="my-app.firebaseapp.com"
                      className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-lg p-2 font-mono text-xs text-black dark:text-white outline-none focus:border-brutal-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-black dark:text-zinc-200 mb-0.5">
                      projectId *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      placeholder="my-pinboard-app"
                      className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-lg p-2 font-mono text-xs text-black dark:text-white outline-none focus:border-brutal-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-black dark:text-zinc-200 mb-0.5">
                      appId
                    </label>
                    <input
                      type="text"
                      value={appId}
                      onChange={e => setAppId(e.target.value)}
                      placeholder="1:123456789:web:abcdef..."
                      className="w-full bg-[#faf8ff] dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-lg p-2 font-mono text-xs text-black dark:text-white outline-none focus:border-brutal-purple"
                    />
                  </div>
                </div>

                {/* Netlify Note */}
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border-2 border-black dark:border-purple-800 rounded-xl text-xs font-medium text-zinc-800 dark:text-purple-100">
                  <span className="font-bold text-black dark:text-white">🚀 Production on Netlify:</span>
                  <p className="mt-1">
                    Environment variables in Netlify under <b>Site configuration &gt; Environment variables</b> automatically take precedence:
                  </p>
                  <code className="block mt-1 font-mono text-[10px] bg-white dark:bg-zinc-900 p-2 rounded border border-black dark:border-zinc-700 select-all text-black dark:text-zinc-200">
                    VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_APP_ID
                  </code>
                </div>

                {/* Change Admin Password Section */}
                <div className="pt-2 border-t-2 border-black/10 dark:border-zinc-700">
                  {!isChangingPassword ? (
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(true)}
                      className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline flex items-center gap-1.5"
                    >
                      <Key className="w-3 h-3" />
                      <span>Change Master Admin Password</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border-2 border-black dark:border-zinc-700 space-y-2">
                      <label className="block text-[11px] font-black uppercase text-black dark:text-white">
                        New Admin Password
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPasswordInput}
                          onChange={e => setNewPasswordInput(e.target.value)}
                          placeholder="Enter new admin password..."
                          className="flex-1 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-600 rounded-lg p-2 text-xs font-semibold outline-none text-black dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleUpdateAdminPassword}
                          className="btn-brutal px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsChangingPassword(false)}
                          className="btn-brutal px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  {currentConfig ? (
                    <button
                      type="button"
                      onClick={clearLocalFirebaseConfig}
                      className="px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-200 font-bold text-xs border-2 border-black dark:border-rose-900 shadow-[2px_2px_0_#000] flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset Local Config</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-bold text-xs border-2 border-black dark:border-zinc-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-brutal px-5 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black text-xs border-2 border-black dark:border-zinc-600 shadow-brutal flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Save & Connect</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
