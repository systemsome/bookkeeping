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
} from 'lucide-react';
import { UserProfile } from '../types';
import { getStoredUsers, saveUsers } from '../lib/storage';

interface AuthModalProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pinCode, setPinCode] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('请输入登录账号');
      return;
    }

    if (!password) {
      setErrorMsg('请输入密码');
      return;
    }

    const users = getStoredUsers();

    if (isRegisterMode) {
      if (password.length < 6) {
        setErrorMsg('密码长度不能少于 6 位');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('两次输入的密码不一致');
        return;
      }
      if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
        setErrorMsg('该账号已存在，请直接登录或换一个账号名');
        return;
      }

      const newUser: UserProfile = {
        id: 'user-' + Date.now(),
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        passwordHash: password,
        pinCode: pinCode && pinCode.length === 6 ? pinCode : '123456',
        autoLockMinutes: 15,
        privacyMode: false,
        lastLoginTime: new Date().toISOString(),
      };

      saveUsers([...users, newUser]);
      onLoginSuccess(newUser);
    } else {
      // Login mode
      const foundUser = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!foundUser || foundUser.passwordHash !== password) {
        setErrorMsg('账号或密码不正确，请重新输入');
        return;
      }

      onLoginSuccess(foundUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg text-white mb-3">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            全能资产记账管家
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {isRegisterMode
              ? '创建全新安全账本，开启全维度资产明细与额度管理'
              : '账号密码安全登录 · 银行卡/信用卡/理财多账户规整'}
          </p>
        </div>

        {/* Demo Account Fast Entry Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-emerald-900">
                一键体验演示账本
              </div>
              <div className="text-[11px] text-emerald-700/80">
                已预设借记卡、信用卡、理财、黄金及完整流水
              </div>
            </div>
          </div>
          <button
            id="btn-fast-demo-login"
            onClick={handleDemoLogin}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            直接进入
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              登录账号 (用户名)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                id="auth-input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: my_finance 或 demo"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                账本昵称 / 称谓
              </label>
              <input
                id="auth-input-displayname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如: 我的家庭账本"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              登录密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                id="auth-input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码 (体验号: demo123456)"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
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
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <button
            id="btn-auth-submit"
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-2"
          >
            <span>{isRegisterMode ? '立即注册并进入' : '安全密码登录'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="mt-5 text-center">
          <button
            id="btn-toggle-auth-mode"
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMsg('');
            }}
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            {isRegisterMode
              ? '已有账户？点击切换至 账号密码登录'
              : '还没有账号？点击注册新账本'}
          </button>
        </div>
      </div>
    </div>
  );
};
