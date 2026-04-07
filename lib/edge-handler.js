// Utilitaire pour handlers Edge Runtime compatibles Next.js 15
// Remplace res.status(x).json(y) par le nouveau format Response

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function wrapHandler(handler) {
  return async function(req) {
    // Créer un objet res compatible avec le code existant
    let responseData = null
    let responseStatus = 200

    const res = {
      status(code) {
        responseStatus = code
        return {
          json(data) {
            responseData = { data, status: code }
          }
        }
      },
      json(data) {
        responseData = { data, status: responseStatus }
      }
    }

    // Parser le body JSON si nécessaire
    let body = {}
    if (req.method !== 'GET' && req.headers.get('content-type')?.includes('application/json')) {
      try {
        body = await req.json()
      } catch {}
    }

    // Créer un objet req compatible
    const reqCompat = {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body,
      query: Object.fromEntries(new URL(req.url).searchParams.entries()),
      url: req.url
    }

    const result = await handler(reqCompat, res)

    // Si le handler a retourné une valeur (Response directe), l'utiliser
    if (result instanceof Response) return result

    // Sinon utiliser ce qui a été set via res
    if (responseData) {
      return new Response(JSON.stringify(responseData.data), {
        status: responseData.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'No response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
