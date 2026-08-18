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
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  updateCurrentUser,
  getAccounts,
  getTransactions,
  saveAccounts,
  saveTransactions,
  resetToDemoData,
} from '../lib/storage';
import {
  uploadInitialAccountsCloud,
  uploadInitialTransactionsCloud,
  fetchCloudAccountsOnce,
  fetchCloudTransactionsOnce,
  updateUserProfileCloud,
} from '../lib/firebase';

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
  const [syncing, setSyncing] = useState(false);

  const handleUpdateSecurity = async (e: React.FormEvent) => {
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
      // Sync user profile updates to Firestore if logged in with cloud account
      if (!currentUser.id.startsWith('demo-')) {
        try {
          await updateUserProfileCloud(currentUser.id, {
            displayName: displayName.trim() || currentUser.username,
            pinCode: newPin,
            autoLockMinutes,
          });
        } catch (err) {
          console.warn('Failed to sync updated profile to Cloud', err);
        }
      }

      onUserUpdated(updated);
      setSuccessMsg('安全设置与 PIN 码更新成功！');
      setOldPassword('');
      setNewPassword('');
    }
  };

  // Manual trigger: Push local accounts and transactions to Cloud Firestore
  const handlePushToCloud = async () => {
    if (currentUser.id.startsWith('demo-')) {
      setErrorMsg('体验号模式为离线暂存，请使用注册账号登录即可开启多设备实时云端同步');
      return;
    }
    setSyncing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const localAccs = getAccounts(currentUser.id);
      const localTxs = getTransactions(currentUser.id);
      await uploadInitialAccountsCloud(currentUser.id, localAccs);
      await uploadInitialTransactionsCloud(currentUser.id, localTxs);
      setSuccessMsg(`云端同步成功！已将 ${localAccs.length} 个账户和 ${localTxs.length} 笔流水同步至云端。`);
      onRefreshData();
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      setErrorMsg(`同步至云端失败: ${err.message || '网络连接异常'}`);
    } finally {
      setSyncing(false);
    }
  };

  // Manual trigger: Pull latest data from Cloud Firestore
  const handlePullFromCloud = async () => {
    if (currentUser.id.startsWith('demo-')) {
      setErrorMsg('体验号模式为离线暂存，注册专属账号后即可跨设备随时拉取数据');
      return;
    }
    setSyncing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const cloudAccs = await fetchCloudAccountsOnce(currentUser.id);
      const cloudTxs = await fetchCloudTransactionsOnce(currentUser.id);
      saveAccounts(currentUser.id, cloudAccs);
      saveTransactions(currentUser.id, cloudTxs);
      setSuccessMsg(`从云端拉取成功！已同步 ${cloudAccs.length} 个账户与 ${cloudTxs.length} 笔流水。`);
      onRefreshData();
    } catch (err: any) {
      console.error('Cloud pull error:', err);
      setErrorMsg(`拉取云端数据失败: ${err.message || '网络连接异常'}`);
    } finally {
      setSyncing(false);
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
  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.accounts && Array.isArray(json.accounts)) {
          saveAccounts(currentUser.id, json.accounts);
          if (!currentUser.id.startsWith('demo-')) {
            await uploadInitialAccountsCloud(currentUser.id, json.accounts);
          }
        }
        if (json.transactions && Array.isArray(json.transactions)) {
          saveTransactions(currentUser.id, json.transactions);
          if (!currentUser.id.startsWith('demo-')) {
            await uploadInitialTransactionsCloud(currentUser.id, json.transactions);
          }
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
  const handleResetData = async () => {
    if (
      confirm(
        '确定要重置当前账本数据为默认的丰富示例数据吗？（包含各类银行借记卡、信用卡、理财、黄金、白条等）'
      )
    ) {
      resetToDemoData(currentUser.id);
      const accs = getAccounts(currentUser.id);
      const txs = getTransactions(currentUser.id);
      if (!currentUser.id.startsWith('demo-')) {
        await uploadInitialAccountsCloud(currentUser.id, accs);
        await uploadInitialTransactionsCloud(currentUser.id, txs);
      }
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
                安全保护与云端数据同步
              </h2>
              <p className="text-xs text-slate-500">
                管理登录密码、PIN码、自动锁屏与 Firebase 实时跨设备同步
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

        {/* Cloud Sync Status Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>云端数据库连接状态</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {currentUser.id.startsWith('demo-')
                  ? '当前为本地体验号，注册或登录云账号即可跨设备永久留存数据'
                  : `已接入 Firebase 专属云端存储 (UID: ${currentUser.id.slice(0, 10)}...)`}
              </div>
            </div>
          </div>

          {!currentUser.id.startsWith('demo-') && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePushToCloud}
                disabled={syncing}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>立即同步到云端</span>
              </button>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateSecurity} className="space-y-4 mt-4">
          {/* User Profile Info */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              账本名称 / 称谓
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white"
            />
          </div>

          {/* Auto Lock & PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                无操作自动锁屏 (分钟)
              </label>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white"
              >
                <option value={0}>从不自动锁定</option>
                <option value={5}>5 分钟</option>
                <option value={15}>15 分钟 (推荐)</option>
                <option value={30}>30 分钟</option>
                <option value={60}>1 小时</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                6位快捷锁屏 PIN 码
              </label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="6位纯数字"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Password modification */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              修改安全密码 (留空则保持原密码)
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
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-blue-600" />
            离线数据备份、恢复与重置
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
