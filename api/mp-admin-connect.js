// api/mp-admin-connect.js
// Solo para ambiente de TEST — permite insertar una conexión MP manualmente
// sin pasar por OAuth. Requiere is_admin = true.
// ELIMINAR antes de ir a producción.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const IS_TEST      = process.env.VITE_MP_PLATFORM_FEE_PCT !== undefined; // solo en test

  const { userId, accessToken, userToken } = req.body;

  if (!userId || !accessToken || !userToken) {
    return res.status(400).json({ error: 'userId, accessToken y userToken son requeridos' });
  }

  // Verificar que el userToken pertenece a un admin
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
      apikey: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  });
  const userData = await verifyRes.json();
  if (!verifyRes.ok || userData.id !== userId) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  // Verificar que es admin
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=is_admin`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const profileData = await profileRes.json();
  if (!profileData?.[0]?.is_admin) {
    return res.status(403).json({ error: 'Solo admins pueden usar este endpoint' });
  }

  // Insertar/actualizar la conexión MP
  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/mp_connections`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id:           userId,
      mp_user_id:        'TEST_USER',
      mp_email:          'test@cumpleanitos.com',
      mp_nickname:       'Test Cumpleanitos',
      access_token:      accessToken,
      status:            'active',
      connected_at:      new Date().toISOString(),
      last_validated_at: new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }),
  });

  if (!upsertRes.ok) {
    const err = await upsertRes.text();
    return res.status(500).json({ error: 'Error guardando conexión', detail: err });
  }

  return res.status(200).json({ success: true, message: 'Conexión MP insertada para testing' });
}
