import React, { useState } from 'react';
import { X, Key, Cloud, CheckCircle, ExternalLink, HelpCircle, Save, Trash2 } from 'lucide-react';
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

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');
  const [jsonPaste, setJsonPaste] = useState('');

  if (!isOpen) return null;

  const handleJsonPaste = (text: string) => {
    setJsonPaste(text);
    try {
      // Look for JSON object or const firebaseConfig = {...}
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Replace unquoted keys if necessary
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
      // Fallback regex extraction
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#181820] border-[3px] border-black dark:border-zinc-700 rounded-2xl shadow-brutal-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto transition-colors">
        {/* Header */}
        <div className="bg-[#8b5cf6] text-white p-4 sm:p-5 border-b-[2.5px] border-black dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fde047] text-black border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
              <Cloud className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Google Auth & Multi-User Cloud Setup
              </h2>
              <p className="text-xs font-bold text-purple-200">
                Isolate each user's pins and tasks using Firebase on Netlify
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white flex items-center justify-center border-2 border-black dark:border-zinc-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm bg-white dark:bg-[#181820]">
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
              <li>Enable <b>Cloud Firestore</b> (Start in test mode or deploy <code>firestore.rules</code>).</li>
              <li>Go to <b>Project settings &gt; General &gt; Your apps &gt; Web app</b> and copy the config.</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-black dark:text-zinc-200 mb-1">
                Paste Config Object (Optional quick auto-fill)
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
              <span className="font-bold text-black dark:text-white">🚀 For Production on Netlify:</span>
              <p className="mt-1">
                You can also add these as Environment Variables directly in Netlify under{' '}
                <b>Site configuration &gt; Environment variables</b>:
              </p>
              <code className="block mt-1 font-mono text-[10px] bg-white dark:bg-zinc-900 p-2 rounded border border-black dark:border-zinc-700 select-all text-black dark:text-zinc-200">
                VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_APP_ID
              </code>
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
      </div>
    </div>
  );
};
