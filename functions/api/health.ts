// Cloudflare Pages Functions Health Check Endpoint
export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      version: '1.0.0',
      backend: 'Cloudflare Pages Functions + D1 Database',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
