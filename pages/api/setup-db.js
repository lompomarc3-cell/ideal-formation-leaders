export const runtime = 'edge'

// SECURITY: Endpoint neutralized in production.
// Database initialization should be performed only via the Supabase SQL Editor
// by an authenticated administrator. This route is intentionally disabled
// to prevent any unauthorized schema/admin manipulation through the public API.
export default async function handler() {
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'This endpoint is disabled. Use the Supabase SQL Editor.'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
}
