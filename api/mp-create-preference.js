// api/mp-create-preference.js
// Crea una preferencia de pago Checkout Pro marketplace.
// El access_token del cumpleañero vive en server, nunca en el cliente.
// La comisión se descuenta vía marketplace_fee.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    campaignId,
    giftItemId,
    sellerUserId,
    payerName,
    payerUserId,
    isAnonymous,
    message,
    amount,
    userToken, // token del regalador (para verificar autenticidad si está logueado)
  } = req.body;

  if (!campaignId || !sellerUserId || !payerName || !amount) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (isNaN(amount) || Number(amount) < 100) {
    return res.status(400).json({ error: 'Monto inválido (mínimo $100)' });
  }

  const SUPABASE_URL  = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const APP_BASE_URL  = process.env.MP_REDIRECT_BASE || 'https://test.cumpleanitos.com';
  const FEE_PCT       = parseFloat(process.env.MP_PLATFORM_FEE_PCT || '10');

  try {
    // 1. Obtener el access_token de MP del cumpleañero desde server
    const connRes = await fetch(
      `${SUPABASE_URL}/rest/v1/mp_connections?user_id=eq.${sellerUserId}&status=eq.active&select=access_token`,
      {
        headers: {
          apikey:        SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    const connData = await connRes.json();

    if (!connData || connData.length === 0 || !connData[0].access_token) {
      return res.status(400).json({
        error: 'El cumpleañero no tiene cuenta de Mercado Pago conectada',
        code:  'MP_NOT_CONNECTED',
      });
    }

    const sellerAccessToken = connData[0].access_token;

    // 2. Calcular comisión y neto
    const grossAmount      = Math.round(Number(amount) * 100) / 100;
    const feeAmount        = Math.round(grossAmount * FEE_PCT) / 100;
    const netAmount        = Math.round((grossAmount - feeAmount) * 100) / 100;

    // 3. Generar referencia externa única
    const externalRef = `CPÑ-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

    // 4. Obtener info de campaña para el título
    const campRes = await fetch(
      `${SUPABASE_URL}/rest/v1/gift_campaigns?id=eq.${campaignId}&select=birthday_person_name,title`,
      {
        headers: {
          apikey:        SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    const campData = await campRes.json();
    const campTitle = campData?.[0]?.title || `Cumpleaños de ${campData?.[0]?.birthday_person_name || '...'}`;

    // 5. Crear contribución base en estado 'pending' para tener el contribution_id
    const contribRes = await fetch(`${SUPABASE_URL}/rest/v1/contributions`, {
      method: 'POST',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        Prefer:          'return=representation',
      },
      body: JSON.stringify({
        campaign_id:    campaignId,
        gifter_id:      payerUserId || null,
        gifter_name:    isAnonymous ? 'Anónimo' : payerName,
        amount:         grossAmount,
        message:        message || null,
        is_anonymous:   isAnonymous || false,
        anonymous:      isAnonymous || false,
        payment_method: 'mercadopago',
      }),
    });
    const contribData = await contribRes.json();
    const contributionId = contribData?.[0]?.id || null;

    // 6. Guardar mp_order con estado pending
    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/mp_orders`, {
      method: 'POST',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        Prefer:          'return=representation',
      },
      body: JSON.stringify({
        campaign_id:         campaignId,
        gift_item_id:        giftItemId || null,
        contribution_id:     contributionId,
        seller_user_id:      sellerUserId,
        payer_name:          payerName,
        payer_user_id:       payerUserId || null,
        is_anonymous:        isAnonymous || false,
        message:             message || null,
        gross_amount:        grossAmount,
        platform_fee_pct:    FEE_PCT,
        platform_fee_amount: feeAmount,
        net_amount:          netAmount,
        external_reference:  externalRef,
        status:              'pending',
      }),
    });
    const orderData = await orderRes.json();
    const orderId = orderData?.[0]?.id;

    if (!orderId) {
      console.error('Error creando mp_order:', orderData);
      return res.status(500).json({ error: 'Error creando la orden interna' });
    }

    // 7. Crear preferencia en MP con el access_token del cumpleañero (marketplace)
    const preference = {
      items: [
        {
          id:          campaignId,
          title:       campTitle,
          description: `Aporte de ${payerName} - Cumpleañitos`,
          quantity:    1,
          unit_price:  grossAmount,
          currency_id: 'ARS',
        },
      ],
      payer: {
        name:  payerName,
      },
      marketplace_fee: feeAmount,
      external_reference: externalRef,
      back_urls: {
        success: `${APP_BASE_URL}/pago/exito?ref=${externalRef}`,
        pending: `${APP_BASE_URL}/pago/pendiente?ref=${externalRef}`,
        failure: `${APP_BASE_URL}/pago/error?ref=${externalRef}`,
      },
      auto_return: 'approved',
      statement_descriptor: 'CUMPLEANITOS',
      metadata: {
        order_id:       orderId,
        campaign_id:    campaignId,
        contribution_id: contributionId,
      },
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization:   `Bearer ${sellerAccessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok || !mpData.id) {
      console.error('MP preference error:', mpData);
      return res.status(500).json({ error: 'Error creando preferencia en Mercado Pago', detail: mpData });
    }

    // 8. Guardar preference_id e init_point en la orden
    await fetch(`${SUPABASE_URL}/rest/v1/mp_orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        mp_preference_id: mpData.id,
        mp_init_point:    mpData.sandbox_init_point || mpData.init_point,
        updated_at:       new Date().toISOString(),
      }),
    });

    return res.status(200).json({
      success:            true,
      order_id:           orderId,
      external_reference: externalRef,
      init_point:         mpData.sandbox_init_point || mpData.init_point,
      gross_amount:       grossAmount,
      fee_amount:         feeAmount,
      net_amount:         netAmount,
    });

  } catch (err) {
    console.error('mp-create-preference error:', err);
    return res.status(500).json({ error: 'Error interno', message: err.message });
  }
}
