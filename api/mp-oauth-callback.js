// api/mp-oauth-callback.js
// Recibe el ?code= del redirect OAuth de Mercado Pago,
// lo intercambia por access_token y lo guarda en mp_connections.
// NUNCA expone el access_token al frontend.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, userId, userToken, codeVerifier } = req.body;

  if (!code || !userId || !userToken) {
    return res.status(400).json({ error: 'code, userId y userToken son requeridos' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MP_CLIENT_ID     = process.env.MP_CLIENT_ID;
  const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
  const MP_REDIRECT_URI  = process.env.MP_REDIRECT_URI;

  // 1. Verificar que el userToken pertenece al userId declarado
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
      apikey: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  });
  const userData = await verifyRes.json();
  if (!verifyRes.ok || userData.id !== userId) {
    return res.status(403).json({ error: 'Token inválido o usuario no coincide' });
  }

  try {
    // 2. Intercambiar code por access_token con MP
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     MP_CLIENT_ID,
        client_secret: MP_CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  MP_REDIRECT_URI,
        ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('MP token error:', tokenData);
      return res.status(400).json({ error: 'No se pudo obtener el token de Mercado Pago', detail: tokenData });
    }

    // 3. Obtener datos del usuario MP
    const mpUserRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const mpUser = await mpUserRes.json();

    // 4. Guardar en mp_connections (upsert por user_id)
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/mp_connections`, {
      method: 'POST',
      headers: {
        apikey:        SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type':       'application/json',
        Prefer:        'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id:           userId,
        mp_user_id:        String(mpUser.id || ''),
        mp_email:          mpUser.email || tokenData.user_email || '',
        mp_nickname:       mpUser.nickname || '',
        access_token:      tokenData.access_token,
        refresh_token:     tokenData.refresh_token || null,
        token_expires_at:  expiresAt,
        scopes:            tokenData.scope || '',
        status:            'active',
        connected_at:      new Date().toISOString(),
        last_validated_at: new Date().toISOString(),
        updated_at:        new Date().toISOString(),
      }),
    });

    if (!upsertRes.ok) {
      const err = await upsertRes.text();
      console.error('Supabase upsert error:', err);
      return res.status(500).json({ error: 'Error guardando conexión MP', detail: err });
    }

    return res.status(200).json({
      success:     true,
      mp_email:    mpUser.email || '',
      mp_nickname: mpUser.nickname || '',
    });

  } catch (err) {
    console.error('mp-oauth-callback error:', err);
    return res.status(500).json({ error: 'Error interno', message: err.message });
  }
}
