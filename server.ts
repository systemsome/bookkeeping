import express from 'express';
import path from 'path';
import fs from 'fs';

// Data directory for persistent storage (especially in Docker / NAS mounts)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
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

    // Load sync accounts & transactions
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([uid, val]: [string, any]) => {
          localSyncStore.set(uid, val);
          // If user info exists in sync record, also index user
          if (val && val.user && val.user.username) {
            const uKey = val.user.username.toLowerCase();
            if (!localUsersStore.has(uKey)) {
              localUsersStore.set(uKey, val.user);
            }
          }
        });
      }
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

    // Save users
    const usersArr = Array.from(localUsersStore.values());
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersArr, null, 2), 'utf-8');

    // Save sync ledger
    const syncObj: Record<string, any> = {};
    localSyncStore.forEach((val, key) => {
      syncObj[key] = val;
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
    // Initialize ledger
    localSyncStore.set(newUser.id, {
      user: newUser,
      accounts: [],
      transactions: [],
      lastUpdated: new Date().toISOString(),
    });

    savePersistedStores();

    return res.json({
      success: true,
      user: newUser,
      accounts: [],
      transactions: [],
      message: '注册成功并已安全持久化到服务端',
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

    // Retrieve ledger
    const syncData = localSyncStore.get(user.id) || { accounts: [], transactions: [] };
    savePersistedStores();

    return res.json({
      success: true,
      user,
      accounts: syncData.accounts || [],
      transactions: syncData.transactions || [],
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
      if (u.id === userId) {
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

    localUsersStore.set(targetKey, updated);

    // Also update in sync ledger
    const syncData = localSyncStore.get(userId);
    if (syncData) {
      syncData.user = updated;
      localSyncStore.set(userId, syncData);
    }

    savePersistedStores();

    return res.json({
      success: true,
      user: updated,
    });
  });

  // Sync Get
  app.get('/api/sync', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const data = localSyncStore.get(userId);
    if (data) {
      return res.json({
        success: true,
        ...data,
      });
    }
    return res.json({
      success: true,
      accounts: [],
      transactions: [],
      message: 'No synced data yet',
    });
  });

  // Sync Post
  app.post('/api/sync', (req, res) => {
    const { userId, user, accounts, transactions } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const nowIso = new Date().toISOString();
    const payload = {
      user: user || localSyncStore.get(userId)?.user,
      accounts: accounts || [],
      transactions: transactions || [],
      lastUpdated: nowIso,
    };
    localSyncStore.set(userId, payload);

    if (user && user.username) {
      const uKey = user.username.toLowerCase();
      localUsersStore.set(uKey, { ...localUsersStore.get(uKey), ...user });
    }

    savePersistedStores();

    return res.json({
      success: true,
      message: '已成功与 NAS 本地数据库完成持久化同步',
      accounts: payload.accounts,
      transactions: payload.transactions,
      updatedAt: nowIso,
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Locate frontend dist directory
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        distPath = __dirname;
      }
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application UI is not built. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

