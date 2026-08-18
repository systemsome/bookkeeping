// Cloudflare Pages Functions Sync Endpoint (D1 Database / KV Support)

interface Env {
  DB?: any; // Cloudflare D1 Database binding
  FINANCE_KV?: any; // Cloudflare KV binding (fallback)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

/**
 * GET /api/sync?userId=...
 * 从 Cloudflare D1 或 KV 拉取用户全部资产与明细
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId 参数必填' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. 如果配置了 Cloudflare D1 数据库
    if (env.DB) {
      // 检查/初始化表 (如果尚未执行 schema)
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS user_sync (
          user_id TEXT PRIMARY KEY,
          user_data TEXT,
          accounts_data TEXT,
          transactions_data TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      const result = await env.DB.prepare(
        'SELECT user_data, accounts_data, transactions_data, updated_at FROM user_sync WHERE user_id = ?'
      )
        .bind(userId)
        .first();

      if (result) {
        return new Response(
          JSON.stringify({
            success: true,
            user: JSON.parse(result.user_data || '{}'),
            accounts: JSON.parse(result.accounts_data || '[]'),
            transactions: JSON.parse(result.transactions_data || '[]'),
            lastUpdated: result.updated_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. 如果配置了 Cloudflare KV 存储
    if (env.FINANCE_KV) {
      const raw = await env.FINANCE_KV.get(`user_data_${userId}`);
      if (raw) {
        return new Response(raw, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        accounts: [],
        transactions: [],
        message: '暂无云端数据记录',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Cloudflare D1 查询错误: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST /api/sync
 * 将客户端本地数据同步/合并到 Cloudflare D1 / KV 数据库
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body: any = await request.json();
    const { userId, user, accounts, transactions, clientTimestamp } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId 参数必填' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accountsJson = JSON.stringify(accounts || []);
    const transactionsJson = JSON.stringify(transactions || []);
    const userJson = JSON.stringify(user || {});
    const nowIso = new Date().toISOString();

    // 1. 保存到 Cloudflare D1
    if (env.DB) {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS user_sync (
          user_id TEXT PRIMARY KEY,
          user_data TEXT,
          accounts_data TEXT,
          transactions_data TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      await env.DB.prepare(`
        INSERT INTO user_sync (user_id, user_data, accounts_data, transactions_data, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          user_data = excluded.user_data,
          accounts_data = excluded.accounts_data,
          transactions_data = excluded.transactions_data,
          updated_at = excluded.updated_at
      `)
        .bind(userId, userJson, accountsJson, transactionsJson, nowIso)
        .run();
    }

    // 2. 保存到 Cloudflare KV
    if (env.FINANCE_KV) {
      await env.FINANCE_KV.put(
        `user_data_${userId}`,
        JSON.stringify({
          success: true,
          user,
          accounts,
          transactions,
          lastUpdated: nowIso,
        })
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '数据已成功同步至 Cloudflare D1 云数据库',
        accounts,
        transactions,
        updatedAt: nowIso,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Cloudflare D1 同步异常: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
