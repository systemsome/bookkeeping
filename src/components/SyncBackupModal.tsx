import React, { useState, useEffect } from 'react';
import {
  Cloud,
  HardDrive,
  FileJson,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Server,
  FileDown,
  FileUp,
  Key,
  FolderSync,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, FinancialAccount, Transaction, WebDavConfig, CloudflareSyncConfig, BackupPackage } from '../types';
import { exportDataToJsonFile, parseBackupJson, mergeAccounts, mergeTransactions } from '../lib/backup';
import {
  getStoredWebDavConfig,
  saveWebDavConfig,
  testWebDavConnection,
  uploadToWebDav,
  downloadFromWebDav,
} from '../lib/webdav';
import {
  getStoredCloudflareConfig,
  saveCloudflareConfig,
  testCloudflareConnection,
  syncWithCloudflare,
  fetchFromCloudflare,
} from '../lib/cloudflareSync';

interface SyncBackupModalProps {
  currentUser: UserProfile;
  accounts: FinancialAccount[];
  transactions: Transaction[];
  onClose: () => void;
  onRestoreData: (newAccounts: FinancialAccount[], newTransactions: Transaction[], isMerge: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const SyncBackupModal: React.FC<SyncBackupModalProps> = ({
  currentUser,
  accounts,
  transactions,
  onClose,
  onRestoreData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'cloudflare' | 'webdav' | 'json'>('cloudflare');

  // Cloudflare State
  const [cfConfig, setCfConfig] = useState<CloudflareSyncConfig>(() =>
    getStoredCloudflareConfig(currentUser.id)
  );
  const [cfTesting, setCfTesting] = useState(false);
  const [cfSyncing, setCfSyncing] = useState(false);
  const [cfTestResult, setCfTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // WebDAV State
  const [webDavConfig, setWebDavConfig] = useState<WebDavConfig>(() =>
    getStoredWebDavConfig(currentUser.id)
  );
  const [webDavTesting, setWebDavTesting] = useState(false);
  const [webDavSyncing, setWebDavSyncing] = useState(false);
  const [webDavDownloading, setWebDavDownloading] = useState(false);
  const [webDavResult, setWebDavResult] = useState<{ success: boolean; message: string } | null>(null);

  // JSON File State
  const [importedBackup, setImportedBackup] = useState<BackupPackage | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Save configs when changed
  const handleSaveCfConfig = (newConfig: CloudflareSyncConfig) => {
    setCfConfig(newConfig);
    saveCloudflareConfig(currentUser.id, newConfig);
  };

  const handleSaveWebDavConfig = (newConfig: WebDavConfig) => {
    setWebDavConfig(newConfig);
    saveWebDavConfig(currentUser.id, newConfig);
  };

  // Test Cloudflare
  const handleTestCloudflare = async () => {
    setCfTesting(true);
    setCfTestResult(null);
    const res = await testCloudflareConnection(cfConfig);
    setCfTesting(false);
    setCfTestResult(res);
  };

  // Sync with Cloudflare
  const handleSyncCloudflare = async () => {
    setCfSyncing(true);
    setCfTestResult(null);
    const res = await syncWithCloudflare(cfConfig, currentUser, accounts, transactions);
    setCfSyncing(false);
    if (res.success) {
      const updated = { ...cfConfig, lastSyncTime: res.timestamp, status: 'synced' as const };
      handleSaveCfConfig(updated);
      onShowToast('✨ ' + res.message);
      if (res.mergedAccounts && res.mergedTransactions) {
        onRestoreData(res.mergedAccounts, res.mergedTransactions, true);
      }
    } else {
      setCfTestResult({ success: false, message: res.message });
      onShowToast('❌ ' + res.message);
    }
  };

  // Test WebDAV
  const handleTestWebDav = async () => {
    setWebDavTesting(true);
    setWebDavResult(null);
    const res = await testWebDavConnection(webDavConfig);
    setWebDavTesting(false);
    setWebDavResult(res);
  };

  // Upload to WebDAV
  const handleUploadWebDav = async () => {
    setWebDavSyncing(true);
    setWebDavResult(null);
    const res = await uploadToWebDav(webDavConfig, currentUser, accounts, transactions);
    setWebDavSyncing(false);
    if (res.success) {
      const updated = { ...webDavConfig, lastSyncTime: res.timestamp };
      handleSaveWebDavConfig(updated);
      setWebDavResult({ success: true, message: res.message });
      onShowToast('✨ ' + res.message);
    } else {
      setWebDavResult({ success: false, message: res.message });
      onShowToast('❌ ' + res.message);
    }
  };

  // Download from WebDAV
  const handleDownloadWebDav = async (isMerge: boolean) => {
    setWebDavDownloading(true);
    setWebDavResult(null);
    const res = await downloadFromWebDav(webDavConfig);
    setWebDavDownloading(false);
    if (res.success && res.data) {
      onRestoreData(res.data.accounts, res.data.transactions, isMerge);
      setWebDavResult({ success: true, message: `成功同步恢复 ${res.data.accounts.length} 个账户和 ${res.data.transactions.length} 条流水` });
      onShowToast('✨ WebDAV 数据恢复成功！');
    } else {
      setWebDavResult({ success: false, message: res.message });
      onShowToast('❌ ' + res.message);
    }
  };

  // Handle JSON File Pick
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const parsed = parseBackupJson(content);
      if (parsed.success && parsed.data) {
        setImportedBackup(parsed.data);
      } else {
        setImportError(parsed.error || '文件解析失败');
        setImportedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  // Apply JSON Restore
  const handleApplyJsonRestore = (isMerge: boolean) => {
    if (!importedBackup) return;
    onRestoreData(importedBackup.accounts, importedBackup.transactions, isMerge);
    onShowToast(`✨ 成功${isMerge ? '合并' : '覆盖'}导入 ${importedBackup.accounts.length} 个账户，${importedBackup.transactions.length} 条记账流水！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">多端数据同步与备份中心</h3>
              <p className="text-xs text-slate-300">
                支持 Cloudflare D1 跨设备实时同步 · WebDAV 私有云备份 · JSON 本地归档
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-t border-x transition-all ${
              activeTab === 'cloudflare'
                ? 'bg-white text-emerald-700 border-slate-200 -mb-px shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Cloudflare D1 云同步</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">推荐</span>
          </button>

          <button
            onClick={() => setActiveTab('webdav')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-t border-x transition-all ${
              activeTab === 'webdav'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>WebDAV 云盘同步</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-t border-x transition-all ${
              activeTab === 'json'
                ? 'bg-white text-purple-700 border-slate-200 -mb-px shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileJson className="w-4 h-4 text-purple-600" />
            <span>JSON 离线导入/导出</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: CLOUDFLARE D1 */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      Cloudflare D1 毫秒级多设备实时同步
                    </h4>
                    <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                      通过 GitHub 将本项目部署至 Cloudflare Pages 并绑定 D1 数据库后，多端登录即可实现无缝、实时的资产与记账数据双向同步。
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${cfConfig.lastSyncTime ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse' : 'bg-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-xs text-slate-800">
                      {cfConfig.lastSyncTime ? '已就绪 / 最近同步于: ' + cfConfig.lastSyncTime : '当前处于本地离线模式'}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      本地共有 {accounts.length} 个资产卡片 · {transactions.length} 条记账流水
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestCloudflare}
                    disabled={cfTesting}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cfTesting ? 'animate-spin' : ''}`} />
                    <span>{cfTesting ? '检测中...' : '检测连接'}</span>
                  </button>
                </div>
              </div>

              {/* Test Result Notice */}
              {cfTestResult && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-2 text-xs animate-in fade-in duration-150 ${
                    cfTestResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {cfTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{cfTestResult.message}</span>
                </div>
              )}

              {/* Custom API URL (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Cloudflare API 接入地址（可选）
                </label>
                <input
                  type="text"
                  placeholder="默认使用当前网站同源接口（留空即可）或填入自定义 Worker 地址"
                  value={cfConfig.apiUrl || ''}
                  onChange={(e) => handleSaveCfConfig({ ...cfConfig, apiUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  若部署在 Cloudflare Pages 上，留空即可自动通过同源 <code>/api/sync</code> 路由与 D1 数据库通信。
                </p>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSyncCloudflare}
                  disabled={cfSyncing}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-sm active:scale-98 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${cfSyncing ? 'animate-spin' : ''}`} />
                  <span>{cfSyncing ? '正在与云端双向同步...' : '立即与 Cloudflare 云端双向同步'}</span>
                </button>
              </div>

              {/* Deployment hint */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>如何开启 Cloudflare D1 自动同步？</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  项目根目录已为您生成 <code>d1-schema.sql</code>、<code>wrangler.toml</code> 及 <code>CLOUDFLARE_DEPLOY.md</code>。只需在 Cloudflare Pages 中添加名为 <code>DB</code> 的 D1 绑定，即可享有终身免费跨设备实时同步！
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: WEBDAV */}
          {activeTab === 'webdav' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 text-blue-950">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>私有 WebDAV 云端备份与多端同步</span>
                </p>
                <p className="mt-1 text-blue-800/90">
                  支持坚果云（Jianguoyun）、InfiniCLOUD、Nextcloud、Owncloud、群晖/极空间 NAS 等标准 WebDAV 协议。
                </p>
              </div>

              {/* Preset Shortcuts */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">常用服务器预设：</span>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveWebDavConfig({
                      ...webDavConfig,
                      serverUrl: 'https://dav.jianguoyun.com/dav/',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                >
                  坚果云
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveWebDavConfig({
                      ...webDavConfig,
                      serverUrl: 'https://tera.infinicloud.jp/dav/',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                >
                  InfiniCLOUD
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveWebDavConfig({
                      ...webDavConfig,
                      serverUrl: 'https://pan.example.com/remote.php/dav/files/user/',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                >
                  Nextcloud
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WebDAV 服务器地址 URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://dav.jianguoyun.com/dav/"
                    value={webDavConfig.serverUrl}
                    onChange={(e) =>
                      handleSaveWebDavConfig({ ...webDavConfig, serverUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    用户名 / 账号邮箱
                  </label>
                  <input
                    type="text"
                    placeholder="your-email@example.com"
                    value={webDavConfig.username}
                    onChange={(e) =>
                      handleSaveWebDavConfig({ ...webDavConfig, username: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    应用密码 / 授权 Token
                  </label>
                  <input
                    type="password"
                    placeholder="坚果云应用专用密码或 Token"
                    value={webDavConfig.password}
                    onChange={(e) =>
                      handleSaveWebDavConfig({ ...webDavConfig, password: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    备份文件名及云盘路径
                  </label>
                  <input
                    type="text"
                    placeholder="/my_finance_backup.json"
                    value={webDavConfig.remotePath}
                    onChange={(e) =>
                      handleSaveWebDavConfig({ ...webDavConfig, remotePath: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Status Message */}
              {webDavResult && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-2 text-xs animate-in fade-in duration-150 ${
                    webDavResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {webDavResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{webDavResult.message}</span>
                </div>
              )}

              {/* WebDAV Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleTestWebDav}
                  disabled={webDavTesting}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${webDavTesting ? 'animate-spin' : ''}`} />
                  <span>{webDavTesting ? '测试中...' : '测试连通性'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleUploadWebDav}
                  disabled={webDavSyncing}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className={`w-4 h-4 ${webDavSyncing ? 'animate-bounce' : ''}`} />
                  <span>{webDavSyncing ? '同步上传中...' : '立即同步上传至 WebDAV'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadWebDav(true)}
                  disabled={webDavDownloading}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <DownloadCloud className={`w-4 h-4 ${webDavDownloading ? 'animate-bounce' : ''}`} />
                  <span>{webDavDownloading ? '拉取中...' : '从云端下载并合并'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: JSON OFFLINE */}
          {activeTab === 'json' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Export Block */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">一键导出全部数据为 JSON 备份</h4>
                      <p className="text-xs text-slate-500">
                        将所有资产卡片、消费流水、账单明细打包保存至本地文件
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      exportDataToJsonFile(currentUser, accounts, transactions, webDavConfig);
                      onShowToast('✨ 备份文件已成功生成并开始下载！');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>立即导出下载</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>有效资产卡片: <strong>{accounts.length}</strong></span>
                  <span>记账流水条数: <strong>{transactions.length}</strong></span>
                  <span>格式: 标准 UTF-8 JSON</span>
                </div>
              </div>

              {/* Import Block */}
              <div className="p-5 rounded-2xl bg-white border-2 border-dashed border-slate-200 hover:border-purple-300 transition-colors space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <FileUp className="w-5 h-5 text-purple-600" />
                  <span>导入并恢复 JSON 备份数据</span>
                </div>

                <div>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>

                {importError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importedBackup && (
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-950">备份文件解析成功</span>
                      <span className="text-[11px] text-purple-700">导出时间: {new Date(importedBackup.exportedAt).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-purple-900">
                      <div className="bg-white p-2 rounded-lg border border-purple-100">
                        <span className="text-slate-500 text-[11px] block">备份用户</span>
                        <strong className="truncate block">{importedBackup.user?.displayName || '默认'}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-purple-100">
                        <span className="text-slate-500 text-[11px] block">包含资产账户</span>
                        <strong>{importedBackup.accounts.length} 个</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-purple-100">
                        <span className="text-slate-500 text-[11px] block">包含记账流水</span>
                        <strong>{importedBackup.transactions.length} 笔</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApplyJsonRestore(true)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all"
                      >
                        智能合并导入（推荐，保留现有）
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('确定要全量覆盖当前数据吗？现有未备份的账目将被替换。')) {
                            handleApplyJsonRestore(false);
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200 transition-colors"
                      >
                        全量覆盖恢复
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>所有数据均在客户端与您的私有云之间安全流转，保护您的个人资产隐私。</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
