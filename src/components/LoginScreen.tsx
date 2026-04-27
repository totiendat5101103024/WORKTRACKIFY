import { useState } from 'react';
import { Briefcase, Settings, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { AppSettings } from '../google-api';

interface Props {
  onLogin: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  error: string | null;
}

export default function LoginScreen({ onLogin, settings, onUpdateSettings, error }: Props) {
  const [showSetup, setShowSetup] = useState(!settings.clientId);
  const [clientId, setClientId] = useState(settings.clientId);

  const handleSaveAndLogin = () => {
    const updated = { ...settings, clientId };
    onUpdateSettings(updated);
    if (clientId) onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/30 to-surface-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-brand-200/30 p-10 text-center border border-surface-100"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand-300/40">
          <Briefcase className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-surface-900 mb-2 tracking-tight">WorkTrackify</h1>
        <p className="text-surface-500 mb-8 leading-relaxed text-sm">
          Theo dõi giờ làm & tính lương tự động từ Google Calendar.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {showSetup ? (
          <div className="text-left space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">
                Google OAuth Client ID *
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="xxxxxx.apps.googleusercontent.com"
                className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
              />
              <p className="mt-2 text-[10px] text-surface-400">
                Tạo tại{' '}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-brand-500 underline">
                  Google Cloud Console
                </a>
                . Chọn "Web application", thêm Authorized JavaScript origins là URL deploy của bạn.
              </p>
            </div>
            <button
              onClick={handleSaveAndLogin}
              disabled={!clientId}
              className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-300/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lưu & Kết nối Google
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-surface-200 py-4 px-6 rounded-2xl font-bold text-surface-700 hover:bg-surface-50 transition-all shadow-lg active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Kết nối Google Calendar
            </button>
            <button
              onClick={() => setShowSetup(true)}
              className="mt-4 flex items-center justify-center gap-2 text-xs text-surface-400 hover:text-surface-600 transition-colors mx-auto"
            >
              <Settings className="w-3.5 h-3.5" />
              Đổi Client ID
            </button>
          </>
        )}

        <div className="mt-10 pt-8 border-t border-surface-100 flex justify-center gap-8 opacity-60">
          <div className="text-center">
            <span className="block text-xl font-black text-surface-900">100%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400">Client-side</span>
          </div>
          <div className="w-px h-10 bg-surface-200" />
          <div className="text-center">
            <span className="block text-xl font-black text-surface-900">Auto</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400">Sync</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
