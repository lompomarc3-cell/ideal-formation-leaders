/**
 * IFL Cron Worker - Anti cold start
 * Pings the IFL Pages app every 5 minutes to keep it warm.
 */
export default {
  async scheduled(event, env, ctx) {
    const targets = [
      'https://ideal-formation-leaders.pages.dev/',
      'https://ideal-formation-leaders.pages.dev/api/quiz/public-categories',
      'https://ifl-landing.pages.dev/'
    ];

    const results = await Promise.all(
      targets.map(async (url) => {
        try {
          const r = await fetch(url, {
            cf: { cacheTtl: 0 },
            headers: { 'User-Agent': 'IFL-Cron-Warmup/1.0' }
          });
          return { url, status: r.status, ok: r.ok };
        } catch (e) {
          return { url, status: 0, ok: false, error: String(e) };
        }
      })
    );

    console.log('IFL warmup at', new Date().toISOString(), JSON.stringify(results));
  },

  // Allow manual ping via HTTP for testing
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/ping') {
      const r = await fetch('https://ideal-formation-leaders.pages.dev/');
      return new Response(JSON.stringify({
        ok: r.ok,
        status: r.status,
        time: new Date().toISOString()
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('IFL Cron Worker - keeps app warm. POST /ping for manual test.', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
