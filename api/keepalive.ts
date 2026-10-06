// Cron de Vercel (ver vercel.json): hace una consulta diaria a Supabase
// para que el proyecto del plan gratuito no se pause por inactividad.

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    return Response.json({ ok: false, error: 'Faltan variables de Supabase' }, { status: 500 })
  }

  const res = await fetch(`${url}/rest/v1/settings?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() }, { status: res.ok ? 200 : 502 })
}
