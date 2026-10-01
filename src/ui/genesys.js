/* =========================================================================
   GENESYS HANDOFF VIEW
   A mockup of what a human agent would see in Genesys Cloud after the call
   is handed off — customer info + an AI-generated conversation summary.
   Uses the real authenticated customer for this call when there is one,
   otherwise falls back to sample data so the screen is never empty. The
   summary/interaction fields are placeholders for now; swap fillGenesysView()
   for a real data source later (e.g. fed from Supabase or the agent) without
   touching openGenesysView()/closeGenesysView().
   ========================================================================= */
import { appState } from '../state.js';
import { FALLBACK_CUSTOMERS } from '../data/fallbackCustomers.js';

const DUMMY_SUMMARY =
  "Customer called about their mortgage repayment schedule and an open estate matter. " +
  "Authenticated via the S-Pankki app during the call. Discussed releasing additional " +
  "collateral to lower the monthly payment, and asked whether a submitted estate inventory " +
  "had been received. Transferred to a specialist for the estate question.";

let interactionId = null;

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return value;
  }
}

function randomInteractionId() {
  return 'INT-' + Math.floor(100000 + Math.random() * 900000);
}

function renderCustomer(customer) {
  const initials = (customer.full_name || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  setText('genesysAvatar', initials || '?');
  setText('genesysName', customer.full_name || 'Unknown customer');
  setText('genesysSegment', customer.customer_segment || '');
  setText('genesysPersonalId', customer.personal_id || '—');
  setText('genesysDob', formatDate(customer.date_of_birth));
  setText('genesysPhone', customer.phone || '—');
  setText('genesysEmail', customer.email || '—');
}

export function openGenesysView() {
  const overlay = document.getElementById('genesysOverlay');
  if (!overlay) return;

  const customer = appState.auth.customer || FALLBACK_CUSTOMERS[0];
  renderCustomer(customer);
  setText('genesysSummary', DUMMY_SUMMARY);

  if (!interactionId) interactionId = randomInteractionId();
  setText('genesysInteractionId', interactionId);

  overlay.hidden = false;
}

export function closeGenesysView() {
  const overlay = document.getElementById('genesysOverlay');
  if (overlay) overlay.hidden = true;
}

export function resetGenesysView() {
  interactionId = null;
  closeGenesysView();
}

export function initGenesysView() {
  const openBtn = document.getElementById('genesysTriggerBtn');
  const closeBtn = document.getElementById('genesysCloseBtn');
  if (openBtn) openBtn.addEventListener('click', openGenesysView);
  if (closeBtn) closeBtn.addEventListener('click', closeGenesysView);
}
