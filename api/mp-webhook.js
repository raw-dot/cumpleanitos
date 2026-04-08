// api/mp-webhook.js
// Endpoint público que recibe notificaciones de Mercado Pago.
// Valida autenticidad, es idempotente, actualiza estados internos.

export default async function handler(req, res) {
  // MP envía POST para notificaciones
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MP_ACCESS_TOKEN_TEST = process.env.MP_ACCESS_TOKEN_TEST;
  const MP_WEBHOOK_SECRET    = process.env.MP_WEBHOOK_SECRET;

  // Validar firma HMAC de MP si está configurada
  if (MP_WEBHOOK_SECRET) {
    const xSignature = req.headers['x-signature'] || '';
    const xRequestId = req.headers['x-request-id'] || '';
    const dataId     = req.query?.['data.id'] || req.body?.data?.id || '';
    const manifest   = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(';').find(p => p.startsWith('ts='))?.split('=')[1] || ''};`;
    try {
      const crypto  = await import('crypto');
      const ts      = xSignature.split(';').find(p => p.startsWith('ts='))?.split('=')[1] || '';
      const v1      = xSignature.split(';').find(p => p.startsWith('v1='))?.split('=')[1] || '';
      const hmac    = crypto.default.createHmac('sha256', MP_WEBHOOK_SECRET);
      hmac.update(`id:${dataId};request-id:${xRequestId};ts:${ts};`);
      const computed = hmac.digest('hex');
      if (v1 && computed !== v1) {
        console.warn('Webhook firma inválida — ignorado');
        return res.status(200).json({ received: true, ignored: 'invalid_signature' });
      }
    } catch (e) {
      console.warn('Error validando firma webhook:', e.message);
    }
  }

  const payload = req.body;
  const topic   = payload.type || payload.topic || req.query.topic;
  const action  = payload.action || '';
  const resourceId = payload.data?.id || payload.id || req.query.id;

  // Log inmediato para auditoría
  let webhookLogId = null;
  try {
    const logRes = await fetch(`${SUPABASE_URL}/rest/v1/mp_webhook_logs`, {
      method: 'POST',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        Prefer:          'return=representation',
      },
      body: JSON.stringify({
        topic,
        action,
        resource_id:      String(resourceId || ''),
        payload,
        received_at:      new Date().toISOString(),
        processing_status: 'received',
      }),
    });
    const logData = await logRes.json();
    webhookLogId = logData?.[0]?.id;
  } catch (e) {
    console.error('Error logging webhook:', e);
  }

  // Responder 200 a MP inmediatamente (evita retries por timeout)
  res.status(200).json({ received: true });

  // Procesar de forma asíncrona
  processWebhook({ topic, action, resourceId, payload, webhookLogId, SUPABASE_URL, SERVICE_KEY, MP_ACCESS_TOKEN_TEST });
}

async function processWebhook({ topic, action, resourceId, payload, webhookLogId, SUPABASE_URL, SERVICE_KEY, MP_ACCESS_TOKEN_TEST }) {
  try {
    // Solo procesar eventos de pagos por ahora
    if (topic !== 'payment' && topic !== 'merchant_order') {
      await updateWebhookLog(webhookLogId, 'processed', null, SUPABASE_URL, SERVICE_KEY);
      return;
    }

    if (topic === 'payment' && resourceId) {
      await handlePaymentEvent(resourceId, webhookLogId, payload, SUPABASE_URL, SERVICE_KEY, MP_ACCESS_TOKEN_TEST);
    }

    if (topic === 'merchant_order' && resourceId) {
      // Por ahora solo loggeamos merchant_order
      await updateWebhookLog(webhookLogId, 'processed', null, SUPABASE_URL, SERVICE_KEY);
    }

  } catch (err) {
    console.error('processWebhook error:', err);
    await updateWebhookLog(webhookLogId, 'error', err.message, SUPABASE_URL, SERVICE_KEY);
  }
}

async function handlePaymentEvent(mpPaymentId, webhookLogId, payload, SUPABASE_URL, SERVICE_KEY, MP_ACCESS_TOKEN_TEST) {
  // IDEMPOTENCIA: verificar si ya procesamos este mp_payment_id
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mp_transactions?mp_payment_id=eq.${mpPaymentId}&processing_status=eq.processed&select=id`,
    {
      headers: {
        apikey:        SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  // Si ya existe transacción procesada, marcar como duplicate y salir
  const existing = await existingRes.json();
  if (existing && existing.length > 0) {
    await updateWebhookLog(webhookLogId, 'duplicate', null, SUPABASE_URL, SERVICE_KEY);
    return;
  }

  // Consultar el estado real del pago a la API de MP
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN_TEST}` },
  });
  const mpPayment = await mpRes.json();

  if (!mpRes.ok || !mpPayment.id) {
    throw new Error(`MP payment fetch failed: ${JSON.stringify(mpPayment)}`);
  }

  const externalRef   = mpPayment.external_reference;
  const mpStatus      = mpPayment.status;
  const mpStatusDetail = mpPayment.status_detail;
  const grossAmount   = mpPayment.transaction_amount;
  const approvedAt    = mpPayment.date_approved;
  const paymentMethod = mpPayment.payment_method_id;
  const paymentType   = mpPayment.payment_type_id;

  // Buscar la orden interna por external_reference
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mp_orders?external_reference=eq.${externalRef}&select=*`,
    {
      headers: {
        apikey:        SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  const orders = await orderRes.json();
  const order = orders?.[0];

  if (!order) {
    throw new Error(`Orden no encontrada para external_reference: ${externalRef}`);
  }

  // Guardar transacción
  const txRes = await fetch(`${SUPABASE_URL}/rest/v1/mp_transactions`, {
    method: 'POST',
    headers: {
      apikey:          SERVICE_KEY,
      Authorization:   `Bearer ${SERVICE_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'return=representation',
    },
    body: JSON.stringify({
      order_id:              order.id,
      mp_payment_id:         String(mpPaymentId),
      mp_merchant_order_id:  String(mpPayment.order?.id || ''),
      mp_status:             mpStatus,
      mp_status_detail:      mpStatusDetail,
      mp_payment_method:     paymentMethod,
      mp_payment_type:       paymentType,
      gross_amount:          grossAmount,
      approved_at:           approvedAt || null,
      raw_payload:           mpPayment,
      updated_at:            new Date().toISOString(),
    }),
  });
  const txData = await txRes.json();
  const txId = txData?.[0]?.id;

  // Mapear estado MP → estado interno
  const internalStatus = mapMPStatus(mpStatus);

  // Actualizar mp_order
  await fetch(`${SUPABASE_URL}/rest/v1/mp_orders?id=eq.${order.id}`, {
    method: 'PATCH',
    headers: {
      apikey:          SERVICE_KEY,
      Authorization:   `Bearer ${SERVICE_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      status:     internalStatus,
      updated_at: new Date().toISOString(),
    }),
  });

  // Si hay contribution_id, actualizarla
  if (order.contribution_id) {
    await fetch(`${SUPABASE_URL}/rest/v1/contributions?id=eq.${order.contribution_id}`, {
      method: 'PATCH',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        mp_order_id: order.id,
        updated_at:  new Date().toISOString(),
      }),
    });
  }

  // Si el pago fue aprobado → registrar comisión
  if (mpStatus === 'approved' && txId) {
    await fetch(`${SUPABASE_URL}/rest/v1/mp_commissions`, {
      method: 'POST',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        order_id:         order.id,
        transaction_id:   txId,
        fee_pct:          order.platform_fee_pct,
        fee_amount:       order.platform_fee_amount,
        settlement_status: 'pending',
      }),
    });
  }

  // Actualizar external_reference en el log
  if (webhookLogId) {
    await fetch(`${SUPABASE_URL}/rest/v1/mp_webhook_logs?id=eq.${webhookLogId}`, {
      method: 'PATCH',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ external_reference: externalRef }),
    });
  }

  await updateWebhookLog(webhookLogId, 'processed', null, SUPABASE_URL, SERVICE_KEY);
}

function mapMPStatus(mpStatus) {
  const map = {
    approved:   'approved',
    pending:    'pending',
    in_process: 'in_process',
    rejected:   'rejected',
    cancelled:  'cancelled',
    refunded:   'refunded',
    charged_back: 'chargeback',
  };
  return map[mpStatus] || 'pending';
}

async function updateWebhookLog(logId, status, errorMessage, SUPABASE_URL, SERVICE_KEY) {
  if (!logId) return;
  await fetch(`${SUPABASE_URL}/rest/v1/mp_webhook_logs?id=eq.${logId}`, {
    method: 'PATCH',
    headers: {
      apikey:          SERVICE_KEY,
      Authorization:   `Bearer ${SERVICE_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      processing_status: status,
      processed_at:      new Date().toISOString(),
      error_message:     errorMessage || null,
    }),
  });
}
