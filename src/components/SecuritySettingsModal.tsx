import React, { useState } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { updateCurrentUser, getAccounts, getTransactions, saveAccounts, saveTransactions, resetToDemoData } from '../lib/storage';

interface SecuritySettingsModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onRefreshData: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  currentUser,
  onClose,
  onUserUpdated,
  onRefreshData,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState(currentUser.pinCode || '123456');
  const [autoLockMinutes, setAutoLockMinutes] = useState(currentUser.autoLockMinutes || 15);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // If changing password, verify old password
    if (newPassword) {
      if (oldPassword !== currentUser.passwordHash) {
        setErrorMsg('原密码不正确，无法修改新密码');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('新密码长度不能少于 6 位');
        return;
      }
    }

    if (newPin && newPin.length !== 6) {
      setErrorMsg('PIN 码必须为 6 位纯数字');
      return;
    }

    const updated = updateCurrentUser({
      displayName: displayName.trim() || currentUser.username,
      passwordHash: newPassword ? newPassword : currentUser.passwordHash,
      pinCode: newPin,
      autoLockMinutes,
    });

    if (updated) {
      onUserUpdated(updated);
      setSuccessMsg('安全设置与密码更新成功！');
      setOldPassword('');
      setNewPassword('');
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const accounts = getAccounts(currentUser.id);
    const transactions = getTransactions(currentUser.id);
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        username: currentUser.username,
        displayName: currentUser.displayName,
      },
      accounts,
      transactions,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${currentUser.username}_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.accounts && Array.isArray(json.accounts)) {
          saveAccounts(currentUser.id, json.accounts);
        }
        if (json.transactions && Array.isArray(json.transactions)) {
          saveTransactions(currentUser.id, json.transactions);
        }
        onRefreshData();
        setSuccessMsg('数据备份导入并恢复成功！');
      } catch (err) {
        setErrorMsg('导入失败，请确保文件是有效的 JSON 备份文件');
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo Data
  const handleResetData = () => {
    if (
      confirm(
        '确定要重置当前账本数据为默认的丰富示例数据吗？（包含各类银行借记卡、信用卡、理财、黄金、白条等）'
      )
    ) {
      resetToDemoData(currentUser.id);
      onRefreshData();
      setSuccessMsg('已成功重置为标准示例资产账本！');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                安全保护与数据管理
              </h2>
              <p className="text-xs text-slate-500">
                修改登录密码、PIN码、自动锁屏与数据离线备份导出
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateSecurity} className="space-y-4 mt-4">
          {/* User Profile Info */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              账本名称 / 昵称
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* PIN and Auto-lock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                6 位锁屏 PIN 码
              </label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="6位数字"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                无操作自动锁屏时间
              </label>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value={5}>5 分钟后自动锁屏</option>
                <option value={15}>15 分钟后自动锁屏</option>
                <option value={30}>30 分钟后自动锁屏</option>
                <option value={0}>从不自动锁屏 (仅手动)</option>
              </select>
            </div>
          </div>

          {/* Password modification */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              修改登录密码 (留空则不修改)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原登录密码"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码 (≥6位)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm active:scale-[0.98] transition-all"
          >
            保存安全设置与 PIN 码
          </button>
        </form>

        {/* Data Backup & Restore */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-blue-600" />
            数据备份、恢复与重置
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleExportData}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>导出 JSON 备份</span>
            </button>

            <label className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>导入恢复备份</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetData}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium flex items-center justify-center gap-1.5 border border-rose-200/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>重置示例数据</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
