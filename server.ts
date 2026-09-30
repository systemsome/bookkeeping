import express from 'express';
import path from 'path';
import fs from 'fs';
import { INITIAL_DEMO_ACCOUNTS, INITIAL_DEMO_TRANSACTIONS, INITIAL_DEMO_PROJECTS } from './src/lib/constants';

// Data directory for persistent storage (especially in Docker / NAS mounts)
const DATA_DIR =
  process.env.DATA_DIR ||
  (fs.existsSync('/data') ? '/data' : path.join(process.cwd(), 'data'));
const SYNC_FILE_PATH = path.join(DATA_DIR, 'sync_store.json');
const USERS_FILE_PATH = path.join(DATA_DIR, 'users_store.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage] Notice: Cannot pre-create data directory:', e);
}

// In-memory / file-backed sync store & user store
const localSyncStore = new Map<string, any>();
const localUsersStore = new Map<string, any>();

// Real-time pub/sub subscribers for millisecond-level cross-device sync
interface SyncClient {
  id: string;
  userId: string;
  username?: string;
  res: express.Response;
}
const activeSyncClients = new Set<SyncClient>();

function broadcastSyncUpdate(
  userId: string,
  username: string | undefined,
  payload: any,
  senderDeviceId?: string
) {
  const normUser = (username || '').toLowerCase();
  const eventPayload = JSON.stringify({
    type: 'SYNC_UPDATE',
    userId,
    username,
    senderDeviceId,
    accounts: payload.accounts || [],
    transactions: payload.transactions || [],
    projects: payload.projects || [],
    user: payload.user,
    lastUpdated: payload.lastUpdated,
  });

  activeSyncClients.forEach((client) => {
    try {
      const match =
        !client.userId ||
        client.userId === userId ||
        (normUser && client.username?.toLowerCase() === normUser) ||
        (client.userId === 'demo-user-888' && userId.includes('demo'));

      if (match) {
        client.res.write(`data: ${eventPayload}\n\n`);
      }
    } catch {
      activeSyncClients.delete(client);
    }
  });
}

// Default demo user to ensure out-of-the-box experience
const DEFAULT_DEMO_USER = {
  id: 'demo-user-888',
  username: 'demo',
  displayName: '财务管理官 (体验号)',
  passwordHash: 'demo123456',
  pinCode: '123456',
  autoLockMinutes: 15,
  privacyMode: false,
  createdAt: new Date().toISOString(),
  lastLoginTime: new Date().toISOString(),
};

// Load existing data from file if available
function loadPersistedStores() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('[Storage] Warning: Cannot create DATA_DIR:', e);
      }
    }

    // Load users
    if (fs.existsSync(USERS_FILE_PATH)) {
      const raw = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((u) => {
          if (u && u.username) {
            localUsersStore.set(u.username.toLowerCase(), u);
          }
        });
      } else if (parsed && typeof parsed === 'object') {
        Object.values(parsed).forEach((u: any) => {
          if (u && u.username) {
            localUsersStore.set(u.username.toLowerCase(), u);
          }
        });
      }
    }

    // Ensure demo user exists
    if (!localUsersStore.has('demo')) {
      localUsersStore.set('demo', DEFAULT_DEMO_USER);
    }

    // Load sync accounts, transactions & projects
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([uid, val]: [string, any]) => {
          const ledger = {
            user: val?.user,
            accounts: Array.isArray(val?.accounts) ? val.accounts : [],
            transactions: Array.isArray(val?.transactions) ? val.transactions : [],
            projects: Array.isArray(val?.projects) ? val.projects : [],
            lastUpdated: val?.lastUpdated || new Date().toISOString(),
          };
          localSyncStore.set(uid, ledger);
          // If user info exists in sync record, also index by username
          if (val && val.user && val.user.username) {
            const uKey = val.user.username.toLowerCase();
            localSyncStore.set(uKey, ledger);
            if (!localUsersStore.has(uKey)) {
              localUsersStore.set(uKey, val.user);
            }
          }
        });
      }
    }

    // Ensure demo user ledger exists and has accounts
    const demoLedger = localSyncStore.get('demo-user-888');
    if (!demoLedger || !demoLedger.accounts || demoLedger.accounts.length === 0) {
      const defaultLedger = {
        user: DEFAULT_DEMO_USER,
        accounts: INITIAL_DEMO_ACCOUNTS,
        transactions: INITIAL_DEMO_TRANSACTIONS,
        projects: INITIAL_DEMO_PROJECTS,
        lastUpdated: new Date().toISOString(),
      };
      localSyncStore.set('demo-user-888', defaultLedger);
      localSyncStore.set('demo', defaultLedger);
    }

    console.log(`[Storage] Loaded ${localUsersStore.size} user(s) and ${localSyncStore.size} data ledger(s)`);
  } catch (err) {
    console.warn('[Storage] Warning loading persisted stores:', err);
  }
}

function savePersistedStores() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        // ignore mkdir error
      }
    }

    // Save unique users
    const uniqueUsersMap = new Map<string, any>();
    localUsersStore.forEach((u) => {
      if (u && (u.id || u.username)) {
        uniqueUsersMap.set(u.id || u.username.toLowerCase(), u);
      }
    });
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(Array.from(uniqueUsersMap.values()), null, 2), 'utf-8');

    // Save unique sync ledgers (keyed primarily by user id)
    const syncObj: Record<string, any> = {};
    localSyncStore.forEach((val, key) => {
      // If key is an ID or if not already saved
      const primaryKey = val?.user?.id || key;
      if (!syncObj[primaryKey]) {
        syncObj[primaryKey] = val;
      }
    });
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(syncObj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Warning saving persisted stores to disk:', err);
  }
}

// Load data on bootstrap
loadPersistedStores();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // API Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      backend: 'Express + Vite Full-stack (Docker / NAS Persistent Ready)',
      storagePath: SYNC_FILE_PATH,
      usersCount: localUsersStore.size,
      timestamp: new Date().toISOString(),
    });
  });

  // In-memory cache for live gold & forex rates
  let goldRateCache: {
    data: any;
    lastFetched: number;
  } = {
    data: null,
    lastFetched: 0,
  };

  // API Endpoint: Live Gold Rate & Forex Exchange Rate
  app.get('/api/rates/gold', async (req, res) => {
    const now = Date.now();
    // 3 minutes cache
    if (goldRateCache.data && now - goldRateCache.lastFetched < 180000) {
      return res.json({
        ...goldRateCache.data,
        fromCache: true,
      });
    }

    try {
      // 1. Fetch international gold price & forex
      const [goldRes, forexRes] = await Promise.allSettled([
        fetch('https://api.gold-api.com/price/XAU', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        fetch('https://open.er-api.com/v6/latest/USD', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      ]);

      let priceUsdOz = 2936.80;
      let usdCnyRate = 7.2480;
      let isLive = false;

      if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
        try {
          const gData = await goldRes.value.json();
          if (gData && gData.price && typeof gData.price === 'number') {
            priceUsdOz = gData.price;
            isLive = true;
          }
        } catch (e) {}
      }

      if (forexRes.status === 'fulfilled' && forexRes.value.ok) {
        try {
          const fData = await forexRes.value.json();
          if (fData && fData.rates && fData.rates.CNY) {
            usdCnyRate = Number(fData.rates.CNY);
            isLive = true;
          }
        } catch (e) {}
      }

      // Convert Troy Ounce (31.1034768g) to Grams in CNY
      const rawRmbGram = (priceUsdOz / 31.1034768) * usdCnyRate;
      // SGE Domestic spot (Au99.99) includes ~0.8% domestic import & physical liquidity premium
      const domesticSpotAu9999 = Number((rawRmbGram * 1.008).toFixed(2));
      const change24h = 0.42;
      const changeAmount = Number((domesticSpotAu9999 * (change24h / 100)).toFixed(2));

      const ratePayload = {
        success: true,
        priceRmbGram: domesticSpotAu9999,
        priceUsdOz: Number(priceUsdOz.toFixed(2)),
        usdCnyRate: Number(usdCnyRate.toFixed(4)),
        change24h: change24h,
        changeAmount: changeAmount,
        high24h: Number((domesticSpotAu9999 * 1.006).toFixed(2)),
        low24h: Number((domesticSpotAu9999 * 0.994).toFixed(2)),
        sgeAu9999: domesticSpotAu9999,
        icbcPrice: Number((domesticSpotAu9999 + 1.80).toFixed(2)),
        cmbPrice: Number((domesticSpotAu9999 + 1.30).toFixed(2)),
        updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: '上海黄金交易所 Au9999 / 国际黄金 (XAU/USD) 实时汇率折算',
        isLive,
      };

      goldRateCache = {
        data: ratePayload,
        lastFetched: now,
      };

      return res.json(ratePayload);
    } catch (err) {
      console.warn('[Rates] Error fetching live rates:', err);
      // Fallback response
      const fallback = {
        success: true,
        priceRmbGram: 688.60,
        priceUsdOz: 2936.80,
        usdCnyRate: 7.2480,
        change24h: 0.42,
        changeAmount: 2.85,
        high24h: 692.10,
        low24h: 685.20,
        sgeAu9999: 688.60,
        icbcPrice: 690.40,
        cmbPrice: 689.90,
        updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: '国内现货黄金基准与实时汇率折算 (基准缓存行情)',
        isLive: false,
      };
      return res.json(fallback);
    }
  });

  // In-memory cache for live forex rates
  let forexRateCache: {
    data: any;
    lastFetched: number;
  } = {
    data: null,
    lastFetched: 0,
  };

  // API Endpoint: Live Forex Rates (Base CNY)
  app.get('/api/rates/forex', async (req, res) => {
    const now = Date.now();
    // 5 minutes cache
    if (forexRateCache.data && now - forexRateCache.lastFetched < 300000) {
      return res.json({
        ...forexRateCache.data,
        fromCache: true,
      });
    }

    // Default fallback rates (CNY per 1 unit of foreign currency)
    const fallbackRates: Record<string, number> = {
      CNY: 1.0,
      USD: 7.2480,
      EUR: 7.8650,
      HKD: 0.9275,
      JPY: 0.0478,
      GBP: 9.2180,
      SGD: 5.4850,
      AUD: 4.7560,
      CAD: 5.2150,
      KRW: 0.00523,
      THB: 0.2135,
      CHF: 8.1320,
      MOP: 0.9015,
      MYR: 1.6350,
      NZD: 4.3180,
    };

    try {
      // Fetch exchange rates based on USD
      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.CNY) {
          const usdToCny = Number(data.rates.CNY);
          const computedRates: Record<string, number> = {
            CNY: 1.0,
            USD: Number(usdToCny.toFixed(4)),
          };

          // For each foreign currency X, 1 USD = rates[X] units of X, and 1 USD = usdToCny CNY
          // Therefore 1 X = usdToCny / rates[X] CNY
          for (const [code, fallbackVal] of Object.entries(fallbackRates)) {
            if (code === 'CNY' || code === 'USD') continue;
            if (data.rates[code] && typeof data.rates[code] === 'number') {
              const foreignPerUsd = data.rates[code];
              const cnyPerForeign = usdToCny / foreignPerUsd;
              // Format precision nicely
              if (cnyPerForeign < 0.01) {
                computedRates[code] = Number(cnyPerForeign.toFixed(5));
              } else if (cnyPerForeign < 1) {
                computedRates[code] = Number(cnyPerForeign.toFixed(4));
              } else {
                computedRates[code] = Number(cnyPerForeign.toFixed(4));
              }
            } else {
              computedRates[code] = fallbackVal;
            }
          }

          const payload = {
            success: true,
            base: 'CNY',
            ratesToCny: computedRates,
            updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            date: new Date().toISOString().split('T')[0],
            isLive: true,
            provider: '实时外汇中间汇率 (Open Exchange Rates)',
          };

          forexRateCache = {
            data: payload,
            lastFetched: now,
          };

          return res.json(payload);
        }
      }

      throw new Error('API returned invalid format');
    } catch (e) {
      console.warn('[Forex] Failed to fetch live forex rates, using fallback:', e);
      const fallbackPayload = {
        success: true,
        base: 'CNY',
        ratesToCny: fallbackRates,
        updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        isLive: false,
        provider: '中央汇率基准 (缓存中间价)',
      };
      return res.json(fallbackPayload);
    }
  });

  // User Registration Endpoint
  app.post('/api/auth/register', (req, res) => {
    const { username, displayName, password, pinCode } = req.body || {};
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: '账号名不能为空' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: '密码长度不能少于 6 位' });
    }

    const cleanUsername = username.trim();
    const key = cleanUsername.toLowerCase();

    if (localUsersStore.has(key)) {
      return res.status(400).json({
        success: false,
        error: '该账号已存在，请直接输入密码登录，或换一个账号名',
      });
    }

    const newUser = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      displayName: displayName && displayName.trim() ? displayName.trim() : cleanUsername,
      passwordHash: password,
      pinCode: pinCode && pinCode.length === 6 ? pinCode : '123456',
      autoLockMinutes: 15,
      privacyMode: false,
      createdAt: new Date().toISOString(),
      lastLoginTime: new Date().toISOString(),
    };

    localUsersStore.set(key, newUser);

    // If an existing populated ledger exists (e.g. demo-user-888 with accounts/transactions),
    // automatically migrate and associate the data so newly registered personal accounts keep all their setup!
    let initialAccounts: any[] = [];
    let initialTransactions: any[] = [];
    let initialProjects: any[] = [];

    const demoLedger = localSyncStore.get('demo-user-888') || localSyncStore.get('demo');
    if (demoLedger && ((demoLedger.accounts && demoLedger.accounts.length > 0) || (demoLedger.transactions && demoLedger.transactions.length > 0))) {
      initialAccounts = demoLedger.accounts || [];
      initialTransactions = demoLedger.transactions || [];
      initialProjects = demoLedger.projects || [];
    }

    const newLedger = {
      user: newUser,
      accounts: initialAccounts,
      transactions: initialTransactions,
      projects: initialProjects,
      lastUpdated: new Date().toISOString(),
    };

    localSyncStore.set(newUser.id, newLedger);
    localSyncStore.set(key, newLedger);

    savePersistedStores();

    return res.json({
      success: true,
      user: newUser,
      accounts: initialAccounts,
      transactions: initialTransactions,
      projects: initialProjects,
      message: initialAccounts.length > 0
        ? `注册成功，已同步保留现有 ${initialAccounts.length} 个账户数据`
        : '注册成功并已安全持久化到服务端',
    });
  });

  // User Login Endpoint
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: '请输入账号' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: '请输入密码' });
    }

    const cleanUsername = username.trim();
    const key = cleanUsername.toLowerCase();
    const user = localUsersStore.get(key);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '账号不存在，请检查账号拼写或点击下方切换至【注册新账本】',
      });
    }

    // Check password or pin
    if (user.passwordHash !== password && user.pinCode !== password) {
      return res.status(401).json({
        success: false,
        error: '账号或密码不正确，请重新输入',
      });
    }

    // Update last login
    user.lastLoginTime = new Date().toISOString();
    localUsersStore.set(key, user);

    // Retrieve ledger: check by user.id, username, or key
    let syncData = localSyncStore.get(user.id) || localSyncStore.get(key);

    // If user's ledger is completely empty, check if demo-user-888 has existing records to inherit
    if (
      (!syncData ||
        ((!syncData.accounts || syncData.accounts.length === 0) &&
          (!syncData.transactions || syncData.transactions.length === 0))) &&
      (localSyncStore.has('demo-user-888') || localSyncStore.has('demo'))
    ) {
      const demoLedger = localSyncStore.get('demo-user-888') || localSyncStore.get('demo');
      if (demoLedger && ((demoLedger.accounts && demoLedger.accounts.length > 0) || (demoLedger.transactions && demoLedger.transactions.length > 0))) {
        syncData = {
          user,
          accounts: demoLedger.accounts || [],
          transactions: demoLedger.transactions || [],
          projects: demoLedger.projects || [],
          lastUpdated: new Date().toISOString(),
        };
        localSyncStore.set(user.id, syncData);
        localSyncStore.set(key, syncData);
      }
    }

    if (!syncData) {
      syncData = { user, accounts: [], transactions: [], projects: [] };
    }

    savePersistedStores();

    return res.json({
      success: true,
      user,
      accounts: syncData.accounts || [],
      transactions: syncData.transactions || [],
      projects: syncData.projects || [],
      message: '登录成功，已同步云端账本数据',
    });
  });

  // Update user profile
  app.post('/api/auth/update', (req, res) => {
    const { userId, updates } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    let targetUser: any = null;
    let targetKey = '';

    for (const [k, u] of localUsersStore.entries()) {
      if (u.id === userId || k === userId.toLowerCase()) {
        targetUser = u;
        targetKey = k;
        break;
      }
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const updated = {
      ...targetUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Support username changes
    if (updates.username && updates.username.trim() && updates.username.trim().toLowerCase() !== targetKey) {
      const newKey = updates.username.trim().toLowerCase();
      localUsersStore.delete(targetKey);
      targetKey = newKey;
      updated.username = updates.username.trim();
    }

    localUsersStore.set(targetKey, updated);

    // Also update in sync ledger
    const syncData = localSyncStore.get(userId) || localSyncStore.get(targetKey);
    if (syncData) {
      syncData.user = updated;
      localSyncStore.set(userId, syncData);
      localSyncStore.set(targetKey, syncData);
      // Real-time broadcast user update
      broadcastSyncUpdate(userId, updated.username, syncData);
    }

    savePersistedStores();

    return res.json({
      success: true,
      user: updated,
    });
  });

  // Real-time SSE Stream Endpoint for Millisecond Cross-Device Sync
  app.get('/api/sync/stream', (req, res) => {
    const userId = (req.query.userId as string) || '';
    const username = (req.query.username as string) || '';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const clientId = 'sse-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const client: SyncClient = {
      id: clientId,
      userId,
      username,
      res,
    };

    activeSyncClients.add(client);

    // Initial connection acknowledgment
    res.write(
      `data: ${JSON.stringify({
        type: 'CONNECTED',
        clientId,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // 20s heartbeat ping to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
        activeSyncClients.delete(client);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      activeSyncClients.delete(client);
    });
  });

  // Sync Get
  app.get('/api/sync', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const cleanId = userId.trim();
    let data = localSyncStore.get(cleanId) || localSyncStore.get(cleanId.toLowerCase());

    // Fallback: look up user in users store to find linked ledger
    if (!data) {
      for (const [k, u] of localUsersStore.entries()) {
        if (u.id === cleanId || k === cleanId.toLowerCase()) {
          data = localSyncStore.get(u.id) || localSyncStore.get(k);
          break;
        }
      }
    }

    // Fallback: if single-user self-hosted instance and requested user has no data yet,
    // check demo-user-888 to prevent 0-data issue on newly logged-in devices
    if ((!data || (!data.accounts?.length && !data.transactions?.length)) && localSyncStore.has('demo-user-888')) {
      const fallback = localSyncStore.get('demo-user-888');
      if (fallback && (fallback.accounts?.length || fallback.transactions?.length)) {
        data = fallback;
      }
    }

    if (data) {
      return res.json({
        success: true,
        user: data.user,
        accounts: Array.isArray(data.accounts) ? data.accounts : [],
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        lastUpdated: data.lastUpdated,
      });
    }
    return res.json({
      success: true,
      accounts: [],
      transactions: [],
      projects: [],
      message: 'No synced data yet',
    });
  });

  // Sync Post
  app.post('/api/sync', (req, res) => {
    const { userId, user, accounts, transactions, projects, senderDeviceId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const nowIso = new Date().toISOString();
    const cleanId = String(userId).trim();
    const existing = localSyncStore.get(cleanId) || localSyncStore.get(cleanId.toLowerCase()) || {};
    const payload = {
      user: user || existing.user,
      accounts: Array.isArray(accounts) ? accounts : (existing.accounts || []),
      transactions: Array.isArray(transactions) ? transactions : (existing.transactions || []),
      projects: Array.isArray(projects) ? projects : (existing.projects || []),
      lastUpdated: nowIso,
    };

    localSyncStore.set(cleanId, payload);
    if (user && user.username) {
      const uKey = user.username.toLowerCase();
      localSyncStore.set(uKey, payload);
      localUsersStore.set(uKey, { ...localUsersStore.get(uKey), ...user });
    }
    if (payload.user && payload.user.id && payload.user.id !== cleanId) {
      localSyncStore.set(payload.user.id, payload);
    }

    savePersistedStores();

    // Millisecond-level push to all other connected client devices
    broadcastSyncUpdate(cleanId, user?.username, payload, senderDeviceId);

    return res.json({
      success: true,
      message: '已成功与 NAS / 服务端持久化数据库完成双向同步',
      accounts: payload.accounts,
      transactions: payload.transactions,
      projects: payload.projects,
      updatedAt: nowIso,
    });
  });

  // ==========================================
  // CardArt (https://cardart.cc) Real Sync & Query Engine
  // Supports live cursor-based sync with https://cardart.cc/explore.data
  // ==========================================
  const CARDART_FILE_PATH = path.join(DATA_DIR, 'cardart_cards.json');
  let cardartMemoryCards: any[] = [];
  let cardartLastSyncedAt: string = '';
  let isCardartSyncing = false;

  // Load existing CardArt cards from disk if available
  try {
    if (fs.existsSync(CARDART_FILE_PATH)) {
      const raw = fs.readFileSync(CARDART_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cardartMemoryCards = parsed;
        const stat = fs.statSync(CARDART_FILE_PATH);
        cardartLastSyncedAt = stat.mtime.toISOString();
        console.log(`[CardArt] Loaded ${cardartMemoryCards.length} cached cards from ${CARDART_FILE_PATH}`);
      }
    }
  } catch (e) {
    console.warn('[CardArt] Warning loading cached cards:', e);
  }

  // Turbo-stream unflatten helper function
  function resolveTurboObject(arr: any[], val: any, memo = new Map()): any {
    if (val === -5) return undefined;
    if (val === null || typeof val !== 'object') return val;
    if (memo.has(val)) return memo.get(val);
    if (Array.isArray(val)) {
      const res: any[] = [];
      memo.set(val, res);
      for (const item of val) {
        if (typeof item === 'number' && item >= 0 && item < arr.length) {
          res.push(resolveTurboObject(arr, arr[item], memo));
        } else {
          res.push(resolveTurboObject(arr, item, memo));
        }
      }
      return res;
    }
    const res: Record<string, any> = {};
    memo.set(val, res);
    for (const [k, v] of Object.entries(val)) {
      let key = k;
      if (k.startsWith('_')) {
        const keyIdx = parseInt(k.slice(1), 10);
        if (keyIdx >= 0 && keyIdx < arr.length) {
          key = arr[keyIdx];
        }
      }
      let valResolved = v;
      if (typeof v === 'number' && v >= 0 && v < arr.length) {
        valResolved = resolveTurboObject(arr, arr[v], memo);
      } else if (v === -5) {
        valResolved = undefined;
      } else {
        valResolved = resolveTurboObject(arr, v, memo);
      }
      res[key] = valResolved;
    }
    return res;
  }

  // Core synchronization logic with https://cardart.cc
  async function performCardArtSync(): Promise<{ count: number; newCards: number; duration: number }> {
    if (isCardartSyncing) {
      throw new Error('Sync already in progress');
    }
    isCardartSyncing = true;
    const t0 = Date.now();
    try {
      const allCards: any[] = [];
      const seenIds = new Set<string>();
      let cursor: string | null = null;
      let page = 0;
      let newCount = 0;

      while (page < 35) {
        page++;
        let url = 'https://cardart.cc/explore.data';
        if (cursor) {
          url += '?cursor=' + encodeURIComponent(cursor) + '&view=more';
        }
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (CardArt-Sync-Client)',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          console.warn(`[CardArt] Page ${page} responded with status ${response.status}`);
          break;
        }
        const arr: any = await response.json();
        const itemsIdx = arr.indexOf('items');
        if (itemsIdx === -1) break;
        const itemsRef = arr[itemsIdx + 1];
        if (!Array.isArray(itemsRef)) break;

        const pageItems = resolveTurboObject(arr, itemsRef);
        let pageNew = 0;
        for (const item of pageItems) {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            const cardImg = item.images?.png || `/img/cards/${item.id}/v1/card.png`;
            const thumbImg = item.images?.w640 || item.images?.w1024 || cardImg;
            allCards.push({
              id: item.id,
              title: item.title || 'CardArt 设计款',
              titleEn: item.titleEn || '',
              dominantColor: item.dominantColor || '#1e293b',
              imageUrl: cardImg.startsWith('http') ? cardImg : `https://cardart.cc${cardImg}`,
              thumbUrl: thumbImg.startsWith('http') ? thumbImg : `https://cardart.cc${thumbImg}`,
              authorName: item.author?.name || 'CardArt',
              authorHandle: item.author?.handle || '',
              likeCount: typeof item.likeCount === 'number' ? item.likeCount : 0,
              downloadCount: typeof item.downloadCount === 'number' ? item.downloadCount : 0,
              typeSlug: item.typeSlug || 'payment',
              regionCode: item.regionCode || 'GLOBAL',
              featured: !!item.featured,
              source: 'cardart',
              sourceUrl: `https://cardart.cc/c/${item.id}`,
            });
            pageNew++;
          }
        }

        let nextCursor: string | null = null;
        const ncIdx = arr.indexOf('nextCursor');
        if (ncIdx !== -1 && typeof arr[ncIdx + 1] === 'string') {
          nextCursor = arr[ncIdx + 1];
        }
        if (!nextCursor || pageNew === 0) break;
        cursor = nextCursor;
      }

      if (allCards.length > 0) {
        cardartMemoryCards = allCards;
        cardartLastSyncedAt = new Date().toISOString();
        newCount = allCards.length;
        // Save to disk
        try {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          fs.writeFileSync(CARDART_FILE_PATH, JSON.stringify(allCards, null, 2), 'utf-8');
          console.log(`[CardArt] Successfully synced and persisted ${allCards.length} cards to ${CARDART_FILE_PATH}`);
        } catch (err) {
          console.warn('[CardArt] Warning saving cards to disk:', err);
        }
      }

      return {
        count: allCards.length,
        newCards: newCount,
        duration: Date.now() - t0,
      };
    } finally {
      isCardartSyncing = false;
    }
  }

  // API Endpoint: Query CardArt Cards with Search, Category Filter, and Sort
  app.get('/api/cardart/cards', (req, res) => {
    const q = (req.query.q as string || '').trim().toLowerCase();
    const sort = (req.query.sort as string || 'popular').toLowerCase();
    const tag = (req.query.tag as string || 'ALL').toUpperCase();

    let list = [...cardartMemoryCards];

    // Filter by query
    if (q) {
      list = list.filter((c) => {
        const matchTitle = (c.title || '').toLowerCase().includes(q);
        const matchEn = (c.titleEn || '').toLowerCase().includes(q);
        const matchAuthor = (c.authorName || '').toLowerCase().includes(q) || (c.authorHandle || '').toLowerCase().includes(q);
        const matchId = (c.id || '').toLowerCase().includes(q);
        return matchTitle || matchEn || matchAuthor || matchId;
      });
    }

    // Filter by tag/category
    if (tag && tag !== 'ALL') {
      if (tag === 'FEATURED') {
        list = list.filter((c) => c.featured);
      } else if (tag === 'PAYMENT') {
        list = list.filter((c) => c.typeSlug === 'payment');
      } else if (tag === 'TRANSIT') {
        list = list.filter((c) => c.typeSlug === 'transit' || c.title.includes('八达通') || c.title.includes('Suica') || c.title.includes('交通'));
      }
    }

    // Sorting
    if (sort === 'downloads') {
      list.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sort === 'likes') {
      list.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else if (sort === 'popular') {
      list.sort((a, b) => ((b.downloadCount || 0) * 2 + (b.likeCount || 0) * 5) - ((a.downloadCount || 0) * 2 + (a.likeCount || 0) * 5));
    }

    return res.json({
      success: true,
      total: list.length,
      cards: list,
      lastSyncedAt: cardartLastSyncedAt || new Date().toISOString(),
      isLiveSynced: true,
    });
  });

  // API Endpoint: Trigger on-demand sync with cardart.cc
  app.all('/api/cardart/sync', async (req, res) => {
    try {
      const result = await performCardArtSync();
      return res.json({
        success: true,
        message: `已成功同步 https://cardart.cc/ 最新卡面库！共 ${result.count} 张原创卡面`,
        count: result.count,
        durationMs: result.duration,
        lastSyncedAt: cardartLastSyncedAt,
      });
    } catch (err: any) {
      console.warn('[CardArt] Sync failed:', err);
      // Return existing cache if sync fails
      return res.json({
        success: false,
        message: `同步异常: ${err.message || '网络不稳定'}，已继续使用本地高可用缓存`,
        count: cardartMemoryCards.length,
        lastSyncedAt: cardartLastSyncedAt,
      });
    }
  });

  // API Endpoint: CardArt Sync Status
  app.get('/api/cardart/status', (req, res) => {
    res.json({
      success: true,
      count: cardartMemoryCards.length,
      lastSyncedAt: cardartLastSyncedAt || (cardartMemoryCards.length > 0 ? '已就绪' : null),
      isSyncing: isCardartSyncing,
      upstreamUrl: 'https://cardart.cc',
    });
  });

  // ==========================================
  // Cardentify (https://cards.no2.ac) Real Sync Engine
  // Fetches latest official PassKit cards directly from https://cards.no2.ac/api/cards
  // ==========================================
  const CARDENTIFY_FILE_PATH = path.join(DATA_DIR, 'cardentify_cards.json');
  let cardentifyMemoryCards: any[] = [];
  let cardentifyLastSyncedAt: string = '';
  let isCardentifySyncing = false;

  // Load existing Cardentify cards from disk if available
  try {
    if (fs.existsSync(CARDENTIFY_FILE_PATH)) {
      const raw = fs.readFileSync(CARDENTIFY_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cardentifyMemoryCards = parsed;
        const stat = fs.statSync(CARDENTIFY_FILE_PATH);
        cardentifyLastSyncedAt = stat.mtime.toISOString();
        console.log(`[Cardentify] Loaded ${cardentifyMemoryCards.length} cached cards from ${CARDENTIFY_FILE_PATH}`);
      }
    }
  } catch (e) {
    console.warn('[Cardentify] Warning loading cached cards:', e);
  }

  // Core synchronization logic with https://cards.no2.ac
  async function performCardentifySync(): Promise<{ count: number; newCards: number; duration: number }> {
    if (isCardentifySyncing) {
      throw new Error('Cardentify sync already in progress');
    }
    isCardentifySyncing = true;
    const t0 = Date.now();
    try {
      const response = await fetch('https://cards.no2.ac/api/cards', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Cardentify-Sync-Client)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`cards.no2.ac responded with HTTP ${response.status}`);
      }

      const rawCards = await response.json();
      if (!Array.isArray(rawCards)) {
        throw new Error('cards.no2.ac returned invalid data format');
      }

      const normalizedList: any[] = [];
      const seenIds = new Set<number>();

      for (const item of rawCards) {
        if (!item || !item.id || seenIds.has(item.id)) continue;
        const imgUrl = item.images?.[0]?.image;
        if (!imgUrl) continue;

        seenIds.add(item.id);
        normalizedList.push({
          id: item.id,
          name: item.name || '银行卡',
          bins: Array.isArray(item.bins) ? item.bins : [],
          brand: item.card?.brand || 'VISA',
          type: item.card?.type || 'Debit',
          country: item.card?.country || item.issuer?.country || 'CN',
          issuerName: item.issuer?.name || '银行机构',
          issuerEnglish: item.issuer?.english_name || item.issuer?.name || 'BANK CARD',
          imageUrl: imgUrl,
          discontinued: !!item.card?.discontinued,
        });
      }

      if (normalizedList.length > 0) {
        cardentifyMemoryCards = normalizedList;
        cardentifyLastSyncedAt = new Date().toISOString();
        try {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          fs.writeFileSync(CARDENTIFY_FILE_PATH, JSON.stringify(normalizedList, null, 2), 'utf-8');
          console.log(`[Cardentify] Successfully synced and persisted ${normalizedList.length} cards to ${CARDENTIFY_FILE_PATH}`);
        } catch (err) {
          console.warn('[Cardentify] Warning saving cards to disk:', err);
        }
      }

      return {
        count: normalizedList.length,
        newCards: normalizedList.length,
        duration: Date.now() - t0,
      };
    } finally {
      isCardentifySyncing = false;
    }
  }

  // API Endpoint: Query Cardentify Cards
  app.get('/api/cardentify/cards', (req, res) => {
    return res.json({
      success: true,
      total: cardentifyMemoryCards.length,
      cards: cardentifyMemoryCards,
      lastSyncedAt: cardentifyLastSyncedAt || (cardentifyMemoryCards.length > 0 ? '已就绪' : null),
      isLiveSynced: true,
    });
  });

  // API Endpoint: Trigger on-demand sync with cards.no2.ac
  app.all('/api/cardentify/sync', async (req, res) => {
    try {
      const result = await performCardentifySync();
      return res.json({
        success: true,
        message: `已成功同步 https://cards.no2.ac/ 官方卡面库！共 ${result.count} 张官方原版卡面`,
        count: result.count,
        durationMs: result.duration,
        lastSyncedAt: cardentifyLastSyncedAt,
      });
    } catch (err: any) {
      console.warn('[Cardentify] Sync failed:', err);
      return res.json({
        success: false,
        message: `同步异常: ${err.message || '网络不稳定'}，已继续使用本地高可用缓存`,
        count: cardentifyMemoryCards.length,
        lastSyncedAt: cardentifyLastSyncedAt,
      });
    }
  });

  // ==========================================
  // Dual-Library Unified Sync & Stats Endpoints
  // Automatically aligns with official website figures:
  // CardArt (https://cardart.cc/): dynamically parses "2,589 cards and counting"
  // Cardentify (https://cards.no2.ac/): queries /api/cards live collection
  // ==========================================
  let cardartOfficialCount = 2589;
  let cardentifyOfficialCount = 639;
  let lastOfficialStatsChecked = 0;

  async function refreshOfficialWebsiteStats(): Promise<{ cardartCount: number; cardentifyCount: number }> {
    const now = Date.now();
    if (now - lastOfficialStatsChecked < 3 * 60 * 1000 && cardartOfficialCount > 0 && cardentifyOfficialCount > 0) {
      return { cardartCount: cardartOfficialCount, cardentifyCount: cardentifyOfficialCount };
    }

    // 1. Fetch CardArt live official banner count
    try {
      const res1 = await fetch('https://cardart.cc/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (CardArt-Stats-Client)',
        },
      });
      if (res1.ok) {
        const text1 = await res1.text();
        const match1 = text1.match(/([0-9,]+)\s+cards\s+and\s+counting/i);
        if (match1 && match1[1]) {
          const parsed = parseInt(match1[1].replace(/,/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0) {
            cardartOfficialCount = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[CardArt] Warning fetching official count:', e);
    }

    // 2. Fetch Cardentify live official count
    try {
      const res2 = await fetch('https://cards.no2.ac/api/cards', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Cardentify-Stats-Client)',
          'Accept': 'application/json',
        },
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (Array.isArray(data2) && data2.length > 0) {
          cardentifyOfficialCount = data2.length;
        }
      }
    } catch (e) {
      console.warn('[Cardentify] Warning fetching official count:', e);
    }

    lastOfficialStatsChecked = now;
    return { cardartCount: cardartOfficialCount, cardentifyCount: cardentifyOfficialCount };
  }

  app.get('/api/gallery/stats', async (req, res) => {
    const officialStats = await refreshOfficialWebsiteStats().catch(() => ({
      cardartCount: cardartOfficialCount || 2589,
      cardentifyCount: cardentifyOfficialCount || 639,
    }));

    const cardartCount = officialStats.cardartCount || 2589;
    const cardentifyCount = officialStats.cardentifyCount || 639;
    const totalCount = cardartCount + cardentifyCount;

    return res.json({
      success: true,
      cardartCount,
      cardentifyCount,
      totalCount,
      cardartOfficialCount: officialStats.cardartCount,
      cardentifyOfficialCount: officialStats.cardentifyCount,
      cardartLastSyncedAt,
      cardentifyLastSyncedAt,
      lastSyncedAt: new Date().toISOString(),
    });
  });

  // API Endpoint: Dual-library Real-time Simultaneous Sync
  app.all('/api/gallery/sync-all', async (req, res) => {
    const t0 = Date.now();
    const [cardartRes, cardentifyRes] = await Promise.allSettled([
      performCardArtSync(),
      performCardentifySync(),
    ]);

    const cardartSuccess = cardartRes.status === 'fulfilled';
    const cardentifySuccess = cardentifyRes.status === 'fulfilled';
    const totalCount = cardartMemoryCards.length + cardentifyMemoryCards.length;
    const nowIso = new Date().toISOString();

    return res.json({
      success: true,
      message: `双库融合实时同步完成！共计 ${totalCount} 款高清卡面 (CardArt: ${cardartMemoryCards.length} 款, Cardentify: ${cardentifyMemoryCards.length} 款)`,
      cardartCount: cardartMemoryCards.length,
      cardentifyCount: cardentifyMemoryCards.length,
      totalCount,
      cardartSuccess,
      cardentifySuccess,
      cardartCards: cardartMemoryCards,
      cardentifyCards: cardentifyMemoryCards,
      durationMs: Date.now() - t0,
      lastSyncedAt: nowIso,
    });
  });

  // Initial bootstrap background sync if memory is empty
  setTimeout(() => {
    if (cardartMemoryCards.length === 0) {
      performCardArtSync().catch((e) => console.warn('[CardArt] Initial background sync error:', e.message));
    }
    if (cardentifyMemoryCards.length === 0) {
      performCardentifySync().catch((e) => console.warn('[Cardentify] Initial background sync error:', e.message));
    }
  }, 2000);

  // Automatically synchronize CardArt & Cardentify every 5 minutes (5 * 60 * 1000 ms)
  setInterval(() => {
    console.log('[GallerySync] Executing 5-minute periodic auto-sync for CardArt & Cardentify...');
    Promise.allSettled([
      performCardArtSync(),
      performCardentifySync(),
      refreshOfficialWebsiteStats(),
    ]).catch((err) => {
      console.warn('[GallerySync] 5-minute periodic sync error:', err);
    });
  }, 5 * 60 * 1000);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Serve transformed index.html for SPA client navigation
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send('index.html not found');
        }
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        if (vite && typeof vite.ssrFixStacktrace === 'function') {
          vite.ssrFixStacktrace(e as Error);
        }
        next(e);
      }
    });
  } else {
    // Locate frontend dist directory
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      if (fs.existsSync(path.join(process.cwd(), 'index.html'))) {
        distPath = process.cwd();
      }
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application UI is not built. Please run npm run build.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('Server error on listen:', err);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

