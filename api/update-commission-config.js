// Vercel Serverless Function para actualizar configuración de comisiones
// Usa service_role_key para bypass de RLS
// Requiere SUPABASE_SERVICE_ROLE_KEY en env vars

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const userToken = authHeader.replace('Bearer ', '');
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates array required' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[API] Env vars:', { 
    supabaseUrl: !!supabaseUrl, 
    serviceKey: !!serviceKey,
    urlValue: supabaseUrl?.slice(0, 40)
  });

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ 
      error: 'Server misconfigured',
      missing: { url: !supabaseUrl, serviceKey: !serviceKey }
    });
  }

  try {
    // 1. Verificar el token (usando service_role como apikey)
    const verifyResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'apikey': serviceKey
        }
      }
    );

    const userData = await verifyResponse.json();
    console.log('[API] Verify status:', verifyResponse.status, 'User:', userData?.id);
    
    if (!userData || !userData.id) {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: userData,
        status: verifyResponse.status
      });
    }

    // 2. Verificar que es admin en profiles
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}&select=role,username,name`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );
    const profiles = await profileRes.json();
    console.log('[API] Profiles:', profiles);
    
    if (!profiles || profiles.length === 0) {
      return res.status(403).json({ error: 'Profile not found', userId: userData.id });
    }

    const profile = profiles[0];
    const isAdmin = 
      profile.role === 'admin' || 
      profile.username === 'tororaw' ||
      userData.id === '59a97d43-cef2-4ecd-94f8-44fa1d1ae8b9';
    
    console.log('[API] Admin check:', { role: profile.role, username: profile.username, isAdmin });
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required', 
        yourRole: profile.role,
        yourUsername: profile.username 
      });
    }

    // 3. Actualizar cada campaña
    const results = [];
    for (const update of updates) {
      const { id, commission_enabled, commission_percentage } = update;
      
      if (!id) {
        results.push({ id, error: 'id required' });
        continue;
      }

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/gift_campaigns?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            commission_enabled: commission_enabled === true,
            commission_percentage: Number(commission_percentage) || 10
          })
        }
      );

      if (updateRes.ok) {
        const updated = await updateRes.json();
        results.push({ id, success: true, updated: updated[0] || null });
      } else {
        const errorText = await updateRes.text();
        console.error(`[API] ❌ ${id} failed:`, errorText);
        results.push({ id, success: false, error: errorText });
      }
    }

    const allSuccess = results.every(r => r.success);
    
    return res.status(200).json({ 
      success: allSuccess,
      results,
      total: results.length
    });

  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message
    });
  }
}
