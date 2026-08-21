import express from 'express';
import path from 'path';
import fs from 'fs';

// Data directory for persistent storage (especially in Docker / NAS mounts)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const SYNC_FILE_PATH = path.join(DATA_DIR, 'sync_store.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage] Notice: Cannot pre-create data directory:', e);
}

// In-memory / file-backed sync store
const localSyncStore = new Map<string, any>();

// Load existing data from file if available
function loadPersistedSyncStore() {
  try {
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([uid, val]) => {
          localSyncStore.set(uid, val);
        });
        console.log(`[Storage] Successfully loaded ${localSyncStore.size} user profile(s) from ${SYNC_FILE_PATH}`);
      }
    }
  } catch (err) {
    console.error('[Storage] Error loading persisted sync store:', err);
  }
}

function savePersistedSyncStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj: Record<string, any> = {};
    localSyncStore.forEach((val, key) => {
      obj[key] = val;
    });
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving persisted sync store:', err);
  }
}

// Load data on bootstrap
loadPersistedSyncStore();

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
      timestamp: new Date().toISOString(),
    });
  });

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

  app.post('/api/sync', (req, res) => {
    const { userId, user, accounts, transactions } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const nowIso = new Date().toISOString();
    const payload = {
      user,
      accounts,
      transactions,
      lastUpdated: nowIso,
    };
    localSyncStore.set(userId, payload);
    savePersistedSyncStore();

    return res.json({
      success: true,
      message: '已成功与 NAS 本地数据库完成持久化同步',
      accounts,
      transactions,
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
