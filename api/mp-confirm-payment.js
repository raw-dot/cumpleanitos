// api/mp-confirm-payment.js
// Se llama desde el frontend cuando MP redirige a /pago/exito
// Consulta el pago real a MP, graba todo en Supabase y es idempotente.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL     = process.env.SUPABASE_URL;
  const SERVICE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MP_ACCESS_TOKEN  = process.env.MP_ACCESS_TOKEN;

  if (!SUPABASE_URL || !SERVICE_KEY || !MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'missing_env_vars' });
  }

  const { payment_id, external_reference } = req.body || {};
  if (!payment_id || !external_reference) {
    return res.status(400).json({ error: 'Faltan payment_id o external_reference' });
  }

  try {
    // 1. Buscar orden interna
    const orderRes = await fetch(
      `${SUPABASE_URL}/rest/v1/mp_orders?external_reference=eq.${external_reference}&select=*`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const orders = await orderRes.json();
    const order = orders?.[0];
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // 2. Idempotencia: si ya tiene contribution_id, ya fue procesado
    if (order.contribution_id) {
      return res.status(200).json({ success: true, already_processed: true });
    }

    // 3. Consultar pago real a MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const mpPayment = await mpRes.json();

    if (!mpRes.ok || !mpPayment.id) {
      return res.status(502).json({ error: 'No se pudo consultar el pago en MP' });
    }

    const mpStatus = mpPayment.status;

    // 4. Actualizar estado de la orden
    await fetch(`${SUPABASE_URL}/rest/v1/mp_orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: mpStatus, updated_at: new Date().toISOString() }),
    });

    // 5. Solo si aprobado: grabar transacción, contribution y comisión
    if (mpStatus !== 'approved') {
      return res.status(200).json({ success: true, status: mpStatus });
    }

    // 5a. Grabar transacción (idempotente por mp_payment_id UNIQUE)
    let txId = null;
    const existingTxRes = await fetch(
      `${SUPABASE_URL}/rest/v1/mp_transactions?mp_payment_id=eq.${String(payment_id)}&select=id`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const existingTx = await existingTxRes.json();

    if (!existingTx?.length) {
      const txRes = await fetch(`${SUPABASE_URL}/rest/v1/mp_transactions`, {
        method: 'POST',
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({
          order_id:             order.id,
          mp_payment_id:        String(payment_id),
          mp_merchant_order_id: String(mpPayment.order?.id || ''),
          mp_status:            mpStatus,
          mp_status_detail:     mpPayment.status_detail,
          mp_payment_method:    mpPayment.payment_method_id,
          mp_payment_type:      mpPayment.payment_type_id,
          gross_amount:         mpPayment.transaction_amount,
          approved_at:          mpPayment.date_approved || null,
          raw_payload:          mpPayment,
          updated_at:           new Date().toISOString(),
        }),
      });
      const txData = await txRes.json();
      txId = txData?.[0]?.id;
    } else {
      txId = existingTx[0].id;
    }

    // 5b. Crear contribution (con fotos/videos)
    const contribRes = await fetch(`${SUPABASE_URL}/rest/v1/contributions`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        campaign_id:         order.campaign_id,
        gifter_id:           order.payer_user_id || null,
        gifter_name:         order.is_anonymous ? 'Anónimo' : order.payer_name,
        amount:              order.gross_amount,
        message:             order.message || null,
        emotional_foto_url:  order.foto_url || null,
        emotional_video_url: order.video_url || null,
        is_anonymous:        order.is_anonymous || false,
        anonymous:           order.is_anonymous || false,
        payment_method:      'mercadopago',
        mp_order_id:         order.id,
      }),
    });
    const contribData = await contribRes.json();
    const contributionId = contribData?.[0]?.id || null;

    // 5c. Linkear contribution a la orden
    if (contributionId) {
      await fetch(`${SUPABASE_URL}/rest/v1/mp_orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contribution_id: contributionId, updated_at: new Date().toISOString() }),
      });
    }

    // 5d. Grabar comisión
    if (txId) {
      await fetch(`${SUPABASE_URL}/rest/v1/mp_commissions`, {
        method: 'POST',
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id:          order.id,
          transaction_id:    txId,
          fee_pct:           order.platform_fee_pct,
          fee_amount:        order.platform_fee_amount,
          settlement_status: 'pending',
        }),
      });
    }

    return res.status(200).json({ success: true, status: 'approved', contribution_id: contributionId });

  } catch (err) {
    console.error('mp-confirm-payment error:', err);
    return res.status(500).json({ error: err.message });
  }
}
