// src/pages/MPOAuthCallbackPage.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function MPOAuthCallbackPage() {
  const [status, setStatus]     = useState('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code   = params.get('code');
      const state  = params.get('state');

      if (!code) {
        setStatus('error');
        setErrorMsg('No se recibió el código de autorización de Mercado Pago.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setErrorMsg('Tu sesión expiró. Por favor volvé a iniciar sesión.');
        return;
      }

      try {
        const codeVerifier = sessionStorage.getItem('mp_code_verifier') || null;
        const storedState  = sessionStorage.getItem('mp_oauth_state') || null;
        const userId = storedState ? storedState.split(':')[0] : (state || session.user.id);
        sessionStorage.removeItem('mp_code_verifier');
        sessionStorage.removeItem('mp_oauth_state');
        const res  = await fetch('/api/mp-oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            userId,
            userToken:    session.access_token,
            codeVerifier,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setStatus('error');
          setErrorMsg(data.error || 'Error al conectar Mercado Pago. Intentá de nuevo.');
          return;
        }

        setStatus('success');
        setTimeout(() => {
          window.history.pushState({}, '', '/configuracion');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 2000);
      } catch {
        setStatus('error');
        setErrorMsg('Error de red. Por favor intentá de nuevo.');
      }
    }
    handleCallback();
  }, []);

  const S = {
    wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F9FAFB' },
    card: { background: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center', border: '1px solid #E5E7EB' },
    spinner: { width: 48, height: 48, border: '3px solid #E5E7EB', borderTop: '3px solid #009EE3', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
    title: { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 },
    sub:   { fontSize: 14, color: '#6B7280', lineHeight: 1.6 },
    btn:   { marginTop: 20, padding: '10px 20px', borderRadius: 8, background: '#7C3AED', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  };

  const goSettings = () => { window.history.pushState({}, '', '/configuracion'); window.dispatchEvent(new PopStateEvent('popstate')); };

  return (
    <div style={S.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={S.card}>
        {status === 'processing' && (<><div style={S.spinner} /><div style={S.title}>Conectando tu cuenta...</div><div style={S.sub}>Estamos vinculando tu Mercado Pago. Un momento.</div></>)}
        {status === 'success'    && (<><div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div><div style={S.title}>¡Cuenta conectada!</div><div style={S.sub}>Tu Mercado Pago quedó vinculado.<br />Te redirigimos...</div></>)}
        {status === 'error'      && (<><div style={{ fontSize: 48, marginBottom: 16 }}>❌</div><div style={S.title}>Error al conectar</div><div style={S.sub}>{errorMsg}</div><button style={S.btn} onClick={goSettings}>Volver a configuración</button></>)}
      </div>
    </div>
  );
}
