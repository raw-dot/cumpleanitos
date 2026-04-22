// src/pages/MPPaymentResultPage.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const COLORS = { primary: '#7C3AED', success: '#16a34a', bg: '#F9FAFB', border: '#E5E7EB', text: '#111827', textLight: '#6B7280' };

function fmt(n) { return n ? '$' + Number(n).toLocaleString('es-AR') : ''; }

export default function MPPaymentResultPage({ navigate }) {
  const params      = new URLSearchParams(window.location.search);
  const path        = window.location.pathname;
  const externalRef = params.get('ref') || params.get('external_reference');
  const mpPaymentId = params.get('payment_id') || params.get('collection_id');
  const mpStatus    = params.get('status') || params.get('collection_status');

  const isError   = path.includes('/error') || (mpStatus && !['approved','pending','in_process'].includes(mpStatus));
  const isPending = !isError && (path.includes('/pendiente') || ['pending','in_process'].includes(mpStatus));
  const isSuccess = !isError && !isPending;

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState(isSuccess ? 'approved' : isPending ? 'pending' : 'error');
  const [countdown, setCountdown] = useState(10);
  const [cumpleUsername, setCumpleUsername] = useState(null);

  // Cargar la orden y confirmar pago
  useEffect(() => {
    if (!externalRef || externalRef === 'null') { setLoading(false); return; }

    const confirmAndLoad = async () => {
      if (mpPaymentId && (isSuccess || ['approved','pending','in_process'].includes(mpStatus))) {
        try {
          console.log('[MPResult] Confirmando pago:', { payment_id: mpPaymentId, external_reference: externalRef });
          const confirmRes = await fetch('/api/mp-confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_id: mpPaymentId,
              external_reference: externalRef,
            }),
          });
          const confirmData = await confirmRes.json();
          console.log('[MPResult] Confirm result:', confirmData);
        } catch (err) {
          console.error('[MPResult] Error confirmando pago:', err);
        }
      }

      // 2. Cargar mp_orders para obtener los detalles
      const { data } = await supabase
        .from('mp_orders')
        .select('*, gift_campaigns(birthday_person_name, birthday_person_id, title)')
        .eq('external_reference', externalRef)
        .maybeSingle();

      if (data) {
        console.log('[MPResult] Loaded order:', data);
        setOrder(data);
        if (data.status === 'approved') setStatus('approved');
        
        // Obtener el username del cumpleañero usando el birthday_person_id
        if (data.gift_campaigns?.birthday_person_id) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', data.gift_campaigns.birthday_person_id)
              .maybeSingle();
            if (profileData?.username) {
              console.log('[MPResult] Got cumpleUsername:', profileData.username);
              setCumpleUsername(profileData.username);
            } else {
              console.warn('[MPResult] No username found for birthday_person_id:', data.gift_campaigns.birthday_person_id);
            }
          } catch (err) {
            console.error('[MPResult] Error getting username:', err);
          }
        } else {
          console.warn('[MPResult] No birthday_person_id in gift_campaigns');
        }
      } else {
        console.warn('[MPResult] No order data found for externalRef:', externalRef);
      }
      setLoading(false);
    };
    confirmAndLoad();

    // Polling si está pendiente
    if (isPending) {
      let attempts = 0;
      const iv = setInterval(async () => {
        attempts++;
        const { data } = await supabase
          .from('mp_orders')
          .select('*, gift_campaigns(birthday_person_name, title, birthday_person_id)')
          .eq('external_reference', externalRef)
          .maybeSingle();
        if (data) {
          setOrder(data);
          if (data.status === 'approved' || data.status === 'rejected') {
            setStatus(data.status);
            clearInterval(iv);
          }
          
          // Obtener username también en polling si no lo tenemos
          if (data.gift_campaigns?.birthday_person_id && !cumpleUsername) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', data.gift_campaigns.birthday_person_id)
              .maybeSingle();
            if (profileData?.username) {
              setCumpleUsername(profileData.username);
            }
          }
        }
        if (attempts >= 30) clearInterval(iv);
      }, 2000);
      return () => clearInterval(iv);
    }
  }, [externalRef]);

  // Auto-redirect después de 10s con countdown
  useEffect(() => {
    if (status === 'approved' && cumpleUsername && navigate) {
      if (countdown === 0) {
        const profileUrl = '/u/' + cumpleUsername;
        console.log('[MPResult] Redirecting to:', profileUrl);
        navigate(profileUrl);
        return;
      }
      const timer = setTimeout(() => {
        setCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, cumpleUsername, countdown, navigate]);

  const goProfile = async () => {
    if (cumpleUsername && navigate) {
      console.log('[MPResult] goProfile to:', '/u/' + cumpleUsername);
      navigate('/u/' + cumpleUsername);
    }
  };

  const goExplore = () => {
    if (navigate) navigate('/explorar');
  };

  const approved  = status === 'approved';
  const pending   = status === 'pending' || status === 'in_process';
  const rejected  = status === 'rejected' || status === 'cancelled' || isError;

  const cfg = rejected
    ? { icon: '❌', title: 'El pago no se procesó',   color: '#dc2626', bg: '#fef2f2', bc: '#fca5a5' }
    : pending
    ? { icon: '⏳', title: 'Verificando tu pago...',  color: '#d97706', bg: '#fffbeb', bc: '#fde68a' }
    : { icon: '🎉', title: '¡Aporte registrado!',     color: '#16a34a', bg: '#f0fdf4', bc: '#86efac' };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', maxWidth: 440, width: '100%', border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{cfg.icon}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: cfg.color, margin: '0 0 8px' }}>{cfg.title}</h1>
          <p style={{ fontSize: 14, color: COLORS.textLight, lineHeight: 1.6, margin: 0 }}>
            {rejected && 'No pudimos procesar el pago. Podés intentarlo nuevamente.'}
            {pending  && 'Estamos esperando la confirmación de Mercado Pago. No cierres esta pantalla.'}
            {approved && 'Tu aporte fue procesado. El cumpleañero lo verá reflejado en breve.'}
          </p>
        </div>

        {/* Indicador de polling cuando está pendiente */}
        {pending && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fffbeb', borderRadius: 10, padding: '10px 16px', marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.2s infinite' }} />
            <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>Verificando con Mercado Pago...</span>
            <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
          </div>
        )}

        {/* Resumen del aporte */}
        {!loading && order && (
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.bc}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ background: 'rgba(0,0,0,0.04)', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Resumen del aporte
            </div>
            <div style={{ padding: '12px 14px' }}>
              {[
                ['Para',           order.gift_campaigns?.birthday_person_name || order.gift_campaigns?.title],
                ['Monto aportado', fmt(order.gross_amount)],
                ['Tu nombre',      order.is_anonymous ? 'Anónimo 💝' : order.payer_name],
                ['Referencia',     externalRef],
                ['ID de pago',     mpPaymentId && mpPaymentId !== 'null' ? mpPaymentId : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `0.5px solid ${cfg.bc}`, fontSize: 13 }}>
                  <span style={{ color: COLORS.textLight }}>{label}</span>
                  <span style={{ fontWeight: 600, color: COLORS.text, fontSize: label === 'Referencia' ? 10 : 13, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        {!pending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!rejected && (
              <button
                onClick={goProfile}
                disabled={!cumpleUsername}
                style={{ width: '100%', padding: 14, borderRadius: 12, background: cumpleUsername ? COLORS.primary : '#ccc', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: cumpleUsername ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
              >
                Ver el regalo de {order?.gift_campaigns?.birthday_person_name || 'cumpleañero'} 🎂
              </button>
            )}
            <button
              onClick={goExplore}
              style={{ width: '100%', padding: 14, borderRadius: 12, background: COLORS.border, color: COLORS.text, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Explorar otros regalos
            </button>
          </div>
        )}

        {/* Countdown auto-redirect */}
        {approved && countdown > 0 && cumpleUsername && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#166534', fontWeight: 600, margin: 0 }}>
              En {countdown} segundo{countdown !== 1 ? 's' : ''} te llevaremos al regalo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
