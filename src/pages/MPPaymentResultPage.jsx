// src/pages/MPPaymentResultPage.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function formatMoney(n) {
  if (!n) return '';
  return '$' + Number(n).toLocaleString('es-AR');
}

export default function MPPaymentResultPage() {
  const path   = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  
  // Parámetros que MP agrega al redirect
  const externalRef    = params.get('ref') || params.get('external_reference');
  const mpPaymentId    = params.get('payment_id');
  const mpStatus       = params.get('status') || params.get('collection_status');
  const mpStatusDetail = params.get('payment_status_detail') || params.get('status_detail');

  // Determinar tipo por ruta O por parámetro de MP
  const isSuccess = path.includes('/exito') || mpStatus === 'approved';
  const isPending = path.includes('/pendiente') || mpStatus === 'pending' || mpStatus === 'in_process';
  const isError   = path.includes('/error') || (mpStatus && mpStatus !== 'approved' && mpStatus !== 'pending' && mpStatus !== 'in_process');

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!externalRef || externalRef === 'null') { setLoading(false); return; }
    supabase
      .from('mp_orders')
      .select('*, gift_campaigns(birthday_person_name, title)')
      .eq('external_reference', externalRef)
      .single()
      .then(({ data }) => { setOrder(data); setLoading(false); });
  }, [externalRef]);

  // Si llegó payment_id real de MP, actualizar la orden
  useEffect(() => {
    if (!mpPaymentId || mpPaymentId === 'null' || !externalRef || externalRef === 'null') return;
    // Llamar al webhook manualmente para sincronizar el estado
    fetch('/api/mp-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment',
        data: { id: mpPaymentId },
        action: 'payment.updated',
      }),
    }).catch(() => {});
  }, [mpPaymentId, externalRef]);

  const cfg = isSuccess
    ? { icon: '🎉', title: '¡Aporte registrado!', color: '#16a34a', bg: '#f0fdf4', bc: '#86efac' }
    : isPending
    ? { icon: '⏳', title: 'Pago en proceso',      color: '#d97706', bg: '#fffbeb', bc: '#fde68a' }
    : { icon: '❌', title: 'El pago no se procesó', color: '#dc2626', bg: '#fef2f2', bc: '#fca5a5' };

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  const goProfile = () => {
    if (order?.seller_user_id) {
      supabase.from('profiles').select('username').eq('id', order.seller_user_id).single()
        .then(({ data }) => {
          const url = data?.username ? '/u/' + data.username : '/';
          window.history.pushState({}, '', url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
    } else goHome();
  };

  const S = {
    wrap: { minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', border: '1px solid #E5E7EB' },
    row:  { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `0.5px solid ${cfg.bc}`, fontSize: 13 },
    btn1: { width: '100%', padding: 13, borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    btn2: { width: '100%', padding: 11, borderRadius: 10, background: 'transparent', border: '1px solid #E5E7EB', color: '#6B7280', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{cfg.icon}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: cfg.color, margin: 0 }}>{cfg.title}</h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 1.6 }}>
            {isSuccess && 'Tu aporte fue procesado. El cumpleañero lo verá reflejado en breve.'}
            {isPending && 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.'}
            {!isSuccess && !isPending && 'No pudimos procesar el pago. Podés intentarlo nuevamente.'}
          </p>
        </div>

        {/* Comprobante */}
        {!loading && order && (
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.bc}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.04)', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resumen del aporte
            </div>
            <div style={{ padding: '12px 14px' }}>
              {[
                ['Para',           order.gift_campaigns?.birthday_person_name || order.gift_campaigns?.title],
                ['Monto aportado', formatMoney(order.gross_amount)],
                ['Tu nombre',      order.is_anonymous ? 'Anónimo 💝' : order.payer_name],
                ['Referencia',     externalRef],
                ['ID de pago',     mpPaymentId && mpPaymentId !== 'null' ? mpPaymentId : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={S.row}>
                  <span style={{ color: '#6B7280' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#111827', fontSize: label === 'Referencia' ? 11 : 13 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isPending && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
            ⚠️ El regalo <strong>no está confirmado todavía</strong>. Quedaremos atentos a la confirmación de Mercado Pago.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {order && <button style={S.btn1} onClick={goProfile}>Volver al perfil del cumpleañero</button>}
          <button style={S.btn2} onClick={goHome}>Ir al inicio</button>
        </div>

        {isError && (
          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            Si crees que es un error, podés intentar el pago nuevamente.
          </p>
        )}
      </div>
    </div>
  );
}
