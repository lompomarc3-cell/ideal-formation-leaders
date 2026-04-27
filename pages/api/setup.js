export const runtime = 'edge'

// SECURITY: Endpoint neutralized in production.
// Setup operations must be performed by an authenticated administrator
// via the Supabase Dashboard or the protected admin API routes.
export default async function handler() {
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'This endpoint is disabled.'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
}
