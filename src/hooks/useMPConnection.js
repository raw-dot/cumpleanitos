// src/hooks/useMPConnection.js
// Consulta si el usuario tiene cuenta de MP conectada.
// Devuelve { connection, loading, refetch }

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useMPConnection(userId) {
  const [connection, setConnection] = useState(null); // null = cargando, false = sin conexión
  const [loading, setLoading]       = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setConnection(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('mp_connections')
      .select('id, mp_email, mp_nickname, status, connected_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      setConnection(false);
    } else {
      setConnection(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { connection, loading, refetch: fetch };
}
