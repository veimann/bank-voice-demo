/* =========================================================================
   SUPABASE INTEGRATION
   Read-only, frontend-safe access using the anon/publishable key only.
   Never put a service-role key here — restrict the anon role with Row Level
   Security instead (see README.md for the recommended policy).
   ========================================================================= */
import { CONFIG } from '../config.js';

function isConfigured() {
  return Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
}

/* Fetch the customer master-data columns we're allowed to show. Returns null
   (never throws) when Supabase isn't configured or the request fails, so
   callers can fall back to local demo data without special-casing errors. */
export async function fetchCustomers() {
  if (!isConfigured()) return null;
  try {
    const columns = 'id,personal_id,full_name,date_of_birth,phone,email,customer_segment';
    const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.CUSTOMERS_TABLE}?select=${columns}&order=full_name.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error('Supabase customers fetch failed: ' + res.status);
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch (e) {
    console.warn('[supabase] fetchCustomers failed, using local fallback data:', e.message);
    return null;
  }
}

/* Renames one customer row (full_name only — see README for the narrow
   RLS/column-privilege setup this needs on the anon role). Best-effort: never
   throws, returns false on any failure so callers can treat it as optional.
   Used by persona.js to carry a live-picked demo name into Supabase. */
export async function updateCustomerName(id, fullName) {
  if (!isConfigured() || !id) return false;
  try {
    const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.CUSTOMERS_TABLE}?id=eq.${id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ full_name: fullName })
    });
    if (!res.ok) throw new Error('Supabase name update failed: ' + res.status);
    return true;
  } catch (e) {
    console.warn('[supabase] updateCustomerName failed (non-fatal, local rename still applied):', e.message);
    return false;
  }
}

/* Decode the LiveKit room name out of the session JWT (no library needed —
   base64url-decode segment 1). Used to correlate a call with Supabase state. */
export function getRoomFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.video?.room ?? null;
  } catch (e) {
    console.warn('[supabase] could not decode room from token:', e);
    return null;
  }
}

/* =========================================================================
   OPTIONAL FORWARD-LOOKING HOOK
   Best-effort subscription to a call-session table (room, customer_id,
   authentication_initiated, authenticated, updated_at) filtered by the
   current LiveKit room name. Nothing in the demo requires this table to
   exist today — it quietly no-ops unless VITE_SESSION_TABLE is set, so it's
   safe to leave off until the Boost backend is ready to drive authentication
   automatically instead of the presenter hotkey. See README "Going further".
   ========================================================================= */
let sessionSocket = null;
let heartbeatTimer = null;

export function openSessionSubscription(room, onRow) {
  closeSessionSubscription();
  if (!isConfigured() || !CONFIG.SESSION_TABLE || !room) return;

  try {
    const wsUrl = `${CONFIG.SUPABASE_URL.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${CONFIG.SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const ws = new WebSocket(wsUrl);
    sessionSocket = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          topic: `realtime:public:${CONFIG.SESSION_TABLE}:room=eq.${room}`,
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { ack: false },
              presence: { key: '' },
              postgres_changes: [
                { event: 'INSERT', schema: 'public', table: CONFIG.SESSION_TABLE, filter: `room=eq.${room}` },
                { event: 'UPDATE', schema: 'public', table: CONFIG.SESSION_TABLE, filter: `room=eq.${room}` }
              ]
            }
          },
          ref: '1'
        })
      );
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === 'postgres_changes') {
          const record = msg.payload?.data?.record;
          if (record) onRow(record);
        }
      } catch (e) {
        /* ignore malformed realtime frames */
      }
    };

    heartbeatTimer = setInterval(() => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: null }));
      }
    }, 25000);

    ws.onclose = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    };
    ws.onerror = () => {
      /* this channel is optional — swallow errors so the call itself is unaffected */
    };
  } catch (e) {
    console.warn('[supabase] session subscription unavailable (non-fatal):', e.message);
  }
}

export function closeSessionSubscription() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (sessionSocket) {
    try { sessionSocket.close(); } catch (e) { /* ignore */ }
    sessionSocket = null;
  }
}
