// api/recover-missing-payments.js
// Script one-shot para recuperar pagos perdidos que no se registraron
// Uso: POST /api/recover-missing-payments con admin token
// Body: { payment_ids: ["155105242639", "155863373892"] }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No auth' });
  }
  const userToken = authHeader.replace('Bearer ', '');

  const SUPABASE_URL    = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!SUPABASE_URL || !SERVICE_KEY || !MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'missing_env_vars' });
  }

  // Verificar admin
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${userToken}`, apikey: SERVICE_KEY }
  });
  const userData = await verifyRes.json();
  if (!userData?.id) return res.status(401).json({ error: 'Invalid token' });

  const profRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=username`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const profs = await profRes.json();
  const isAdmin = profs[0]?.username === 'tororaw' || userData.id === '59a97d43-cef2-4ecd-94f8-44fa1d1ae8b9';
  if (!isAdmin) return res.status(403).json({ error: 'Admin only' });

  const { payment_ids } = req.body;
  if (!Array.isArray(payment_ids) || !payment_ids.length) {
    return res.status(400).json({ error: 'payment_ids array required' });
  }

  const results = [];

  for (const paymentId of payment_ids) {
    try {
      // 1. Consultar el pago en MP
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
      });
      const mpPayment = await mpRes.json();

      if (!mpRes.ok || !mpPayment.id) {
        results.push({ payment_id: paymentId, error: 'Not found in MP', detail: mpPayment });
        continue;
      }

      const externalRef = mpPayment.external_reference;
      if (!externalRef) {
        results.push({ payment_id: paymentId, error: 'No external_reference in MP payment' });
        continue;
      }

      // 2. Buscar la orden interna
      const orderRes = await fetch(
        `${SUPABASE_URL}/rest/v1/mp_orders?external_reference=eq.${externalRef}&select=*`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
      );
      const orders = await orderRes.json();
      const order = orders?.[0];

      if (!order) {
        results.push({ payment_id: paymentId, external_ref: externalRef, error: 'Order not found' });
        continue;
      }

      if (order.contribution_id) {
        results.push({ payment_id: paymentId, external_ref: externalRef, already_processed: true });
        continue;
      }

      // 3. Llamar al endpoint existente que hace todo el trabajo
      const confirmRes = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://www.cumpleanitos.com'}/api/mp-confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, external_reference: externalRef })
      });
      const confirmData = await confirmRes.json();

      results.push({
        payment_id: paymentId,
        external_ref: externalRef,
        order_id: order.id,
        confirm_result: confirmData
      });
    } catch (err) {
      results.push({ payment_id: paymentId, error: err.message });
    }
  }

  return res.status(200).json({ success: true, results });
}
