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

