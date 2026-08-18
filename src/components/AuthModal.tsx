import React, { useState } from 'react';
import {
  Wallet,
  Lock,
  User,
  KeyRound,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Cloud,
  Loader2,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, mapFirebaseUserToProfile } from '../lib/firebase';
import { UserProfile } from '../types';
import { getStoredUsers, saveUsers } from '../lib/storage';

interface AuthModalProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [accountInput, setAccountInput] = useState(''); // Email or Username
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pinCode, setPinCode] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to format email from username or direct email
  const formatEmail = (input: string): string => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    // Convert alphanumeric username to internal cloud email alias
    const sanitized = trimmed.replace(/[^a-z0-9._-]/g, '');
    return `${sanitized || 'user'}@assetflow.cloud`;
  };

  const handleDemoLogin = () => {
    const users = getStoredUsers();
    let demoUser = users.find((u) => u.username === 'demo');
    if (!demoUser) {
      demoUser = {
        id: 'demo-user-888',
        username: 'demo',
        displayName: '财务管理官 (体验号)',
        passwordHash: 'demo123456',
        pinCode: '123456',
        autoLockMinutes: 15,
        privacyMode: false,
        lastLoginTime: new Date().toISOString(),
      };
      saveUsers([...users, demoUser]);
    }
    onLoginSuccess(demoUser);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const profile = await mapFirebaseUserToProfile(res.user, '123456');
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('登录窗口已取消');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('登录请求已被新窗口覆盖');
      } else {
        setErrorMsg(`Google 登录失败: ${err.message || '网络连接超时'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetAccount = accountInput.trim();
    if (!targetAccount) {
      setErrorMsg('请输入登录账号或电子邮箱');
      return;
    }

    if (!password) {
      setErrorMsg('请输入密码');
      return;
    }

    // Special check for legacy local demo user
    if (targetAccount.toLowerCase() === 'demo' && password === 'demo123456') {
      handleDemoLogin();
      return;
    }

    const email = formatEmail(targetAccount);

    if (isRegisterMode) {
      if (password.length < 6) {
        setErrorMsg('密码长度不能少于 6 位');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('两次输入的密码不一致');
        return;
      }

      setLoading(true);
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const name = displayName.trim() || targetAccount.split('@')[0];
        
        try {
          await updateProfile(fbUser, { displayName: name });
        } catch (e) {
          console.warn('Could not update display name in Auth', e);
        }

        const profile = await mapFirebaseUserToProfile(fbUser, pinCode || '123456');
        profile.displayName = name;
        profile.username = targetAccount.split('@')[0];

        onLoginSuccess(profile);
      } catch (err: any) {
        console.error('Firebase Register Error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setErrorMsg('该账号已存在，请直接输入密码登录');
        } else if (err.code === 'auth/invalid-email') {
          setErrorMsg('账号或邮箱格式不合法，请输入标准英文字母或邮箱');
        } else if (err.code === 'auth/weak-password') {
          setErrorMsg('密码强度不足，请输入至少6位字符');
        } else {
          setErrorMsg(`注册失败: ${err.message || '网络错误，请稍后重试'}`);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Login mode
      setLoading(true);
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await mapFirebaseUserToProfile(userCred.user, '123456');
        onLoginSuccess(profile);
      } catch (err: any) {
        console.error('Firebase Login Error:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // Check if user exists in local legacy storage
          const localUsers = getStoredUsers();
          const localFound = localUsers.find(
            (u) =>
              (u.username.toLowerCase() === targetAccount.toLowerCase() ||
                (u.email && u.email.toLowerCase() === targetAccount.toLowerCase())) &&
              u.passwordHash === password
          );
          if (localFound) {
            onLoginSuccess(localFound);
            return;
          }
          setErrorMsg('账号或密码不正确，若未注册请先切换为注册');
        } else if (err.code === 'auth/wrong-password') {
          setErrorMsg('登录密码错误，请重新输入');
        } else if (err.code === 'auth/too-many-requests') {
          setErrorMsg('尝试次数过多，请稍候重试');
        } else {
          setErrorMsg(`登录失败: ${err.message || '网络连接异常'}`);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-800 flex items-center justify-center shadow-lg text-white mb-3">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            全能资产记账管家
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-700">
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>云端跨设备实时数据同步已就绪</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-xs">
            {isRegisterMode
              ? '创建云端账本，多设备登录自动同步所有卡片与流水'
              : '登录后任意设备无缝访问你的专属卡片与账目'}
          </p>
        </div>

        {/* Demo Account Fast Entry Banner */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800">
                一键体验演示账本
              </div>
              <div className="text-[10px] text-slate-500">
                免注册直接进入体验丰富卡片预设
              </div>
            </div>
          </div>
          <button
            id="btn-fast-demo-login"
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-all shadow-2xs active:scale-95 whitespace-nowrap"
          >
            体验号进入
          </button>
        </div>

        {/* Google Quick Sign-In */}
        <div className="mb-4">
          <button
            id="btn-google-signin"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>使用 Google 账号一键安全登录</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
            或使用 账号 / 邮箱 密码登录
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              登录账号 / 电子邮箱
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                id="auth-input-username"
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder="用户名 (如 my_account) 或 邮箱"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                账本昵称 / 称谓
              </label>
              <input
                id="auth-input-displayname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如: 我的家庭账本"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              登录密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                id="auth-input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码 (至少6位)"
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  确认登录密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-input-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码确认"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  6位快捷锁屏 PIN 码 (默认: 123456)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-input-pin"
                    type="password"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6位数字"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-mono transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-3 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <>
                <span>{isRegisterMode ? '立即注册并同步' : '登录云端账本'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="mt-5 text-center">
          <button
            id="btn-toggle-auth-mode"
            type="button"
            disabled={loading}
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMsg('');
            }}
            className="text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium underline underline-offset-4"
          >
            {isRegisterMode
              ? '已有账户？点击切换至 账号登录'
              : '还没有云端账号？点击注册新账本并跨设备同步'}
          </button>
        </div>
      </div>
    </div>
  );
};
