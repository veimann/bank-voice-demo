/* =========================================================================
   PERSONA (dynamic demo customer name)
   Lets a presenter rename "the" demo customer — e.g. to a name picked live
   from the audience — from one place (the hub page), and have it carry over
   into every demo part automatically.

   How it carries over:
   - localStorage, read by applyStoredPersonaIfAny() on every page's load —
     this is what makes the name persist across the hub / Demo 1 / Demo 2.
   - the in-memory customer cache (data/customers.js), patched immediately,
     so it works even with no network and before any Supabase round-trip
     resolves.
   - Supabase itself (UPDATE full_name on that customer's row), best-effort —
     only if VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are configured. If
     not, or if the request fails, the demo still works from the two layers
     above; nothing here ever throws or blocks the presenter.

   There is deliberately no concept of "Anna" anywhere in this file — the
   target is always whichever row getCustomers() returns first (Supabase row
   or local fallback, whichever is active), matching the same convention
   already used by getCustomerById() in data/customers.js.
   ========================================================================= */
import { CONFIG } from './config.js';
import { getCustomers, patchCachedCustomerName } from './data/customers.js';
import { updateCustomerName } from './integrations/supabase.js';

const STORAGE_KEY = 'sp_demo_persona_name';

const RANDOM_FIRST_NAMES = ['Aino', 'Elina', 'Jukka', 'Kaisa', 'Lauri', 'Matti', 'Noora', 'Pekka', 'Sanna', 'Ville'];
const RANDOM_LAST_NAMES = ['Virtanen', 'Korhonen', 'Mäkinen', 'Nieminen', 'Laine', 'Heikkinen', 'Koskinen', 'Järvinen'];

export function getPersonaName() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function randomPersonaName() {
  const first = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
  const last = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
  return `${first} ${last}`;
}

/* Renames the current demo customer everywhere at once. Returns
   {id, supabaseUpdated} — supabaseUpdated is false whenever Supabase isn't
   configured or the write failed, which is fine: the local rename already
   applied regardless. */
export async function setPersonaName(name) {
  const clean = (name || '').trim();
  if (!clean) return { id: null, supabaseUpdated: false };

  try { localStorage.setItem(STORAGE_KEY, clean); } catch (e) { /* ignore */ }

  const customers = await getCustomers();
  const target = customers[0];
  if (!target) return { id: null, supabaseUpdated: false };

  patchCachedCustomerName(target.id, clean);

  let supabaseUpdated = false;
  if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    supabaseUpdated = await updateCustomerName(target.id, clean);
  }
  return { id: target.id, supabaseUpdated };
}

/* Call once on page load (hub, Demo 1, Demo 2) before anything renders a
   customer name, so a previously-saved persona applies immediately. No-op
   if nothing has been saved yet, or if the stored name already matches. */
export async function applyStoredPersonaIfAny() {
  const stored = getPersonaName();
  if (!stored) return;
  const customers = await getCustomers();
  const target = customers[0];
  if (target && target.full_name !== stored) {
    patchCachedCustomerName(target.id, stored);
  }
}
