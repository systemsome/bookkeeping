import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, UserCheck, AlertCircle, ArrowRight, Delete } from 'lucide-react';
import { UserProfile } from '../types';

interface LockScreenProps {
  currentUser: UserProfile;
  onUnlock: () => void;
  onSwitchUser: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  currentUser,
  onUnlock,
  onSwitchUser,
}) => {
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [usePasswordMode, setUsePasswordMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');

      if (newPin.length === 6) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
    }, 600);
  };

  const verifyPin = (inputPin: string) => {
    const validPin = currentUser.pinCode || '123456';
    if (inputPin === validPin) {
      onUnlock();
    } else {
      triggerError('PIN 码错误，请重新输入');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('请输入登录密码');
      return;
    }
    if (password === currentUser.passwordHash) {
      onUnlock();
    } else {
      triggerError('密码验证失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
      <div
        className={`relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Avatar & User Info */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 p-0.5 shadow-sm border border-slate-200">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold">
              {currentUser.displayName?.[0] || '用'}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full border-2 border-white">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          {currentUser.displayName}
        </h2>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          资产与记账隐私已安全锁定
        </p>

        {errorMsg && (
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN MODE */}
        {!usePasswordMode ? (
          <div className="w-full mt-6 flex flex-col items-center">
            <div className="text-xs text-slate-500 mb-3 font-medium">
              请输入 6 位安全 PIN 码解开屏幕 (默认: 123456)
            </div>

            {/* PIN Dots */}
            <div className="flex items-center gap-3 my-2">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-slate-900 scale-110 shadow-sm'
                        : 'bg-slate-100 border border-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Number Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mt-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  id={`pin-key-${num}`}
                  onClick={() => handleKeyPress(num)}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-xl active:scale-95 transition-all border border-slate-200/80 flex items-center justify-center shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                id="pin-key-clear"
                onClick={handleClear}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-medium active:scale-95 transition-all flex items-center justify-center border border-slate-200/60"
              >
                清空
              </button>
              <button
                id="pin-key-0"
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-xl active:scale-95 transition-all border border-slate-200/80 flex items-center justify-center shadow-xs"
              >
                0
              </button>
              <button
                id="pin-key-delete"
                onClick={handleDelete}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all flex items-center justify-center border border-slate-200/60"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Switch to password */}
            <button
              id="btn-switch-to-password"
              onClick={() => {
                setUsePasswordMode(true);
                setErrorMsg('');
              }}
              className="mt-6 text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              使用完整账号密码解锁
            </button>
          </div>
        ) : (
          /* PASSWORD MODE */
          <form onSubmit={handlePasswordSubmit} className="w-full mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                账号登录密码
              </label>
              <input
                id="lock-input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入登录密码 (体验号: demo123456)"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white text-sm"
              />
            </div>

            <button
              id="btn-password-unlock-submit"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <span>验证并进入</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-switch-to-pin"
              type="button"
              onClick={() => {
                setUsePasswordMode(false);
                setErrorMsg('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 text-center transition-colors font-medium"
            >
              返回 6 位 PIN 码解锁
            </button>
          </form>
        )}

        {/* Footer actions */}
        <div className="w-full border-t border-slate-100 mt-6 pt-4 flex items-center justify-between text-xs text-slate-500">
          <button
            id="btn-lock-switch-user"
            onClick={onSwitchUser}
            className="hover:text-slate-900 flex items-center gap-1 transition-colors font-medium"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            切换其他账号
          </button>

          <span className="text-slate-400">
            全加密存储 · 隐私保护
          </span>
        </div>
      </div>
    </div>
  );
};
