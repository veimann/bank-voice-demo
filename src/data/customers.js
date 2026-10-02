/* =========================================================================
   CUSTOMER DATA ACCESS
   Thin cache in front of Supabase, with an automatic, silent fallback to
   local demo data. This is the ONLY place the rest of the app asks for
   customer records — it never knows or cares whether the data came from
   Supabase or the fallback list.
   ========================================================================= */
import { fetchCustomers as fetchFromSupabase } from '../integrations/supabase.js';
import { FALLBACK_CUSTOMERS } from './fallbackCustomers.js';

let _cache = null; // { list, source: 'supabase' | 'fallback' }

export async function getCustomers(forceRefresh = false) {
  if (_cache && !forceRefresh) return _cache.list;

  const remote = await fetchFromSupabase();
  if (remote && remote.length) {
    _cache = { list: remote, source: 'supabase' };
  } else {
    _cache = { list: FALLBACK_CUSTOMERS, source: 'fallback' };
  }
  return _cache.list;
}

export function getCustomersSource() {
  return _cache ? _cache.source : 'unknown';
}

/* Updates a customer's display name in the in-memory cache only (no network
   call) — used by persona.js so a rename shows up everywhere immediately,
   regardless of whether the Supabase write succeeds. */
export function patchCachedCustomerName(id, fullName) {
  if (!_cache) return;
  const row = _cache.list.find((c) => c.id === id);
  if (row) row.full_name = fullName;
}

export async function getCustomerById(id) {
  const list = await getCustomers();
  if (!list.length) return null;
  return list.find((c) => c.id === id) || list[0];
}
