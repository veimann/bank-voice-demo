/* =========================================================================
   AUTHENTICATION STATE MACHINE (CIBA-style)
   idle -> initiated (push notification shown) -> scanning (Face ID) ->
   authenticated (customer panel unlocked).

   This is intentionally the ONLY place that drives this sequence, and every
   entry point funnels through the same few functions:
     - the hidden presenter hotkey/panel (ui/presenter.js)
     - a live agent action over the LiveKit data channel (integrations/livekit.js)
     - later, a Supabase realtime row update (integrations/supabase.js), once a
       session table exists
   so wiring up real backend-driven authentication later needs no changes here.

   Authentication state belongs to the current call only — nothing here ever
   writes a permanent "authenticated" flag back onto the customer record.
   ========================================================================= */
import { appState } from '../state.js';
import { getCustomerById } from '../data/customers.js';
import * as phoneUI from './phone.js';
import { lockCustomerPanel, showCustomerLoading, showCustomerError, unlockCustomerPanel } from './customerPanel.js';

const FACE_ID_DURATION_MS = 1900;
let faceIdTimeout = null;

export function resetAuth() {
  if (faceIdTimeout) {
    clearTimeout(faceIdTimeout);
    faceIdTimeout = null;
  }
  appState.auth = { status: 'idle', customerId: null, pendingCustomerId: null };
  phoneUI.hideCibaNotification();
  phoneUI.hideFaceId();
  lockCustomerPanel();
}

/* Step 1 — the backend "sends the push": show the notification on the phone. */
export function initiateAuthentication(customerId) {
  if (appState.auth.status !== 'idle') return;
  appState.auth.pendingCustomerId = customerId || null;
  appState.auth.status = 'initiated';
  phoneUI.showCibaNotification();
}

/* Step 2 — the "user" opens the notification: run the Face ID animation, then
   complete. Triggered by tapping the on-screen banner, or by calling
   triggerAuthentication() again once already initiated. */
export function openAuthenticationPrompt() {
  if (appState.auth.status !== 'initiated') return;
  appState.auth.status = 'scanning';
  phoneUI.hideCibaNotification();
  phoneUI.showFaceId();
  faceIdTimeout = setTimeout(() => {
    faceIdTimeout = null;
    completeAuthentication(appState.auth.pendingCustomerId);
  }, FACE_ID_DURATION_MS);
}

/* Convenience single entry point for the hidden hotkey/panel: advances the
   flow one step each time it's called, so pressing it twice (or once, then
   tapping the banner) runs through the whole sequence. Safe to call at any
   time — a no-op once already authenticated. */
export function triggerAuthentication(customerId) {
  if (appState.auth.status === 'authenticated') return;
  if (appState.auth.status === 'idle') {
    initiateAuthentication(customerId);
    return;
  }
  if (appState.auth.status === 'initiated') {
    if (customerId) appState.auth.pendingCustomerId = customerId;
    openAuthenticationPrompt();
  }
}

async function completeAuthentication(customerId) {
  phoneUI.markFaceIdSuccess();
  appState.auth.status = 'authenticated';
  appState.auth.customerId = customerId;

  showCustomerLoading();
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) showCustomerError();
    else unlockCustomerPanel(customer);
  } catch (e) {
    console.warn('[auth] could not load customer record:', e);
    showCustomerError();
  }

  setTimeout(() => phoneUI.hideFaceId(), 900);
}
