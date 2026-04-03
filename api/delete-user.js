// Vercel Edge Function para hard delete de usuarios
// Requiere SUPABASE_SERVICE_ROLE_KEY en env vars

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validar que viene de frontend autorizado
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userToken = authHeader.replace('Bearer ', '');
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    // Verificar que el token del usuario coincide con el userId
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }
    );

    const userData = await verifyResponse.json();
    
    if (userData.id !== userId) {
      return res.status(403).json({ error: 'Forbidden - user mismatch' });
    }

    // 1. Eliminar datos relacionados
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Obtener campañas del usuario
    const campaignsRes = await fetch(
      `${supabaseUrl}/rest/v1/gift_campaigns?birthday_person_id=eq.${userId}&select=id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );
    const campaigns = await campaignsRes.json();

    if (campaigns && campaigns.length > 0) {
      const campaignIds = campaigns.map(c => c.id);
      
      // Eliminar gift_items
      await fetch(
        `${supabaseUrl}/rest/v1/gift_items?campaign_id=in.(${campaignIds.join(',')})`,
        {
          method: 'DELETE',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        }
      );

      // Eliminar contributions
      await fetch(
        `${supabaseUrl}/rest/v1/contributions?campaign_id=in.(${campaignIds.join(',')})`,
        {
          method: 'DELETE',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        }
      );
    }

    // Eliminar campañas
    await fetch(
      `${supabaseUrl}/rest/v1/gift_campaigns?birthday_person_id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );

    // Eliminar friends
    await fetch(
      `${supabaseUrl}/rest/v1/friends?or=(user_id.eq.${userId},friend_id.eq.${userId})`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );

    // Eliminar profile
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );

    // 2. HARD DELETE de auth.users usando Admin API
    const deleteAuthRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );

    if (!deleteAuthRes.ok) {
      const error = await deleteAuthRes.text();
      console.error('Error deleting auth user:', error);
      return res.status(500).json({ error: 'Failed to delete auth user', details: error });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'User completely deleted' 
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
