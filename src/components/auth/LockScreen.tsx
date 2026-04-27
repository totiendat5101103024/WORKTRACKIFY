/**
 * App Lock Screen — PIN verification / setup.
 * Beautiful glassmorphic design with animated PIN dots,
 * number pad, and micro-interactions via Framer Motion.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldCheck, Trash2, AlertTriangle, Lock, Fingerprint } from 'lucide-react';
import { isPinSet, savePin, verifyPin, wipeAllAppData } from '../../lib/crypto';

interface Props {
  onUnlock: () => void;
}

type Mode = 'enter' | 'setup' | 'confirm';

export default function LockScreen({ onUnlock }: Props) {
  const pinExists = isPinSet();
  const [mode, setMode] = useState<Mode>(pinExists ? 'enter' : 'setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const maxLength = 6;
  const minLength = 4;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    timeoutRef.current = setTimeout(() => setShake(false), 500);
  }, []);

  const handleNumberPress = useCallback((num: string) => {
    if (success) return;
    setError('');

    if (mode === 'confirm') {
      // In confirm mode, limit to the length of the original PIN
      if (confirmPin.length < pin.length) {
        setConfirmPin(prev => prev + num);
      }
    } else {
      if (pin.length < maxLength) {
        setPin(prev => prev + num);
      }
    }
  }, [mode, pin, confirmPin, success]);

  const handleDelete = useCallback(() => {
    if (success) return;
    if (mode === 'confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
    setError('');
  }, [mode, success]);

  // Keyboard input support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberPress, handleDelete]);

  // Auto-submit on reaching valid length
  useEffect(() => {
    const currentPin = mode === 'confirm' ? confirmPin : pin;
    if (currentPin.length < minLength) return;

    // For enter mode, auto-verify at 4+ digits
    if (mode === 'enter' && currentPin.length >= minLength) {
      // Verify after a tiny delay to show the dot fill
      const timer = setTimeout(async () => {
        const valid = await verifyPin(pin);
        if (valid) {
          setSuccess(true);
          setTimeout(onUnlock, 600);
        } else if (pin.length === maxLength) {
          setError('Sai mã PIN. Vui lòng thử lại.');
          triggerShake();
          setPin('');
        }
      }, 150);
      return () => clearTimeout(timer);
    }

    // For setup mode, auto-transition to confirm when max length reached
    if (mode === 'setup' && pin.length === maxLength) {
      const timer = setTimeout(() => setMode('confirm'), 200);
      return () => clearTimeout(timer);
    }

    // For confirm mode, verify match when confirm reaches original PIN length
    if (mode === 'confirm' && confirmPin.length === pin.length) {
      const timer = setTimeout(async () => {
        if (confirmPin === pin) {
          await savePin(pin);
          setSuccess(true);
          setTimeout(onUnlock, 600);
        } else {
          setError('Mã PIN không khớp. Thử lại.');
          triggerShake();
          setConfirmPin('');
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pin, confirmPin, mode, onUnlock, triggerShake]);

  const handleClear = useCallback(() => {
    setPin('');
    setConfirmPin('');
    setError('');
    if (mode === 'confirm') setMode('setup');
  }, [mode]);

  const currentPin = mode === 'confirm' ? confirmPin : pin;

  const titleText = mode === 'setup'
    ? 'Tạo mã PIN mới'
    : mode === 'confirm'
      ? 'Xác nhận mã PIN'
      : 'Nhập mã PIN';

  const subtitleText = mode === 'setup'
    ? 'Thiết lập mã PIN 4-6 chữ số để bảo vệ dữ liệu của bạn'
    : mode === 'confirm'
      ? 'Nhập lại mã PIN vừa tạo để xác nhận'
      : 'Nhập mã PIN để mở khóa ứng dụng';

  const numberPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-brand-400/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-brand-400/30 rounded-full animate-pulse" />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-brand-300/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-brand-500/40 rounded-full animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-6"
          animate={success ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
            success
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
              : 'bg-gradient-to-br from-brand-400 to-brand-600 shadow-brand-500/30'
          }`}>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <ShieldCheck className="w-10 h-10 text-white" />
                </motion.div>
              ) : mode === 'setup' ? (
                <motion.div
                  key="setup"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Fingerprint className="w-10 h-10 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="lock"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Lock className="w-10 h-10 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">{titleText}</h1>
            <p className="text-sm text-surface-400 leading-relaxed">{subtitleText}</p>
          </motion.div>
        </AnimatePresence>

        {/* PIN Dots */}
        <motion.div
          className="flex justify-center gap-3.5 mb-8"
          animate={shake ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {Array.from({ length: mode === 'confirm' ? pin.length : maxLength }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < currentPin.length
                  ? error
                    ? 'bg-red-400 border-red-400 shadow-lg shadow-red-500/30'
                    : success
                      ? 'bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-500/30'
                      : 'bg-brand-400 border-brand-400 shadow-lg shadow-brand-500/30'
                  : 'border-surface-600 bg-transparent'
              }`}
              animate={i < currentPin.length ? { scale: [0.8, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </motion.div>

        {/* Setup mode: show "next" hint */}
        {mode === 'setup' && pin.length >= minLength && pin.length < maxLength && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <button
              onClick={() => setMode('confirm')}
              className="text-xs text-brand-400 font-bold hover:text-brand-300 transition-colors"
            >
              Dùng {pin.length} chữ số → Tiếp tục
            </button>
          </motion.div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="text-center mb-4"
            >
              <span className="text-red-400 text-sm font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {numberPad.map((key, idx) => {
            if (key === '') {
              return <div key={idx} />;
            }

            if (key === 'del') {
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-16 rounded-2xl flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700/50 transition-all active:bg-surface-600/50"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNumberPress(key)}
                onMouseDown={(e) => e.preventDefault()}
                className="h-16 rounded-2xl text-2xl font-bold text-white bg-surface-800/60 border border-surface-700/50 backdrop-blur-sm hover:bg-surface-700/70 hover:border-surface-600 transition-all active:bg-surface-600/50 shadow-lg shadow-black/10"
              >
                {key}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {mode !== 'setup' && currentPin.length > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleClear}
              className="text-xs text-surface-500 font-bold hover:text-surface-300 transition-colors"
            >
              Xóa tất cả
            </motion.button>
          )}

          {/* Forgot PIN / Wipe */}
          {pinExists && mode === 'enter' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setShowWipeConfirm(true)}
              className="text-xs text-surface-600 hover:text-red-400 transition-colors font-medium"
            >
              Quên mã PIN?
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Wipe Confirmation Modal */}
      <AnimatePresence>
        {showWipeConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowWipeConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-surface-900 border border-surface-700 rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Xóa toàn bộ dữ liệu?</h3>
              <p className="text-sm text-surface-400 mb-6 leading-relaxed">
                Tất cả dữ liệu tài chính, mã PIN, và cài đặt sẽ bị <span className="text-red-400 font-bold">xóa vĩnh viễn</span>. Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWipeConfirm(false)}
                  className="flex-1 py-3.5 bg-surface-800 border border-surface-700 text-surface-300 rounded-2xl font-bold text-sm hover:bg-surface-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={wipeAllAppData}
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
