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
import { getRecentTranscript } from './transcript.js';

// Only used as a safety net if Genesys is opened with no real transcript yet
// (e.g. the presenter clicks the button to rehearse before placing a call).
const FALLBACK_SUMMARY =
  "No live transcript is available yet for this interaction. Start a call first " +
  "so the handoff view can show the real conversation.";

/* Builds the "summary" directly from the real transcript rather than an
   LLM-written abstract — there's no backend summarization call wired up, so
   this shows the last few real turns (where the handoff trigger fires),
   which is accurate and honest for a live demo. Swap this for a true
   generated summary later if/when a backend call is added. */
function buildSummaryFromTranscript() {
  const turns = getRecentTranscript(8);
  if (!turns.length) return FALLBACK_SUMMARY;
  return turns.map((t) => `${t.speaker}: ${t.text}`).join('\n');
}

let interactionId = null;
let ringTimerInterval = null;
let ringToneInterval = null;
let ringStartedAt = null;
let audioCtx = null;

/* Two short synthesized tones (not a reproduction of any vendor's actual
   ringtone) so there's no asset to host and no autoplay-blocked <audio> file
   — just a brief oscillator blip, repeated every few seconds while ringing. */
function playRingTone() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    [0, 0.42].forEach((offset) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 950;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.4);
    });
  } catch (e) {
    console.warn('[genesys] ring tone unavailable (non-fatal):', e);
  }
}

function startRinging() {
  ringStartedAt = Date.now();
  updateRingTimer();
  ringTimerInterval = setInterval(updateRingTimer, 1000);
  playRingTone();
  ringToneInterval = setInterval(playRingTone, 3500);
}

function stopRinging() {
  if (ringTimerInterval) clearInterval(ringTimerInterval);
  if (ringToneInterval) clearInterval(ringToneInterval);
  ringTimerInterval = null;
  ringToneInterval = null;
}

function updateRingTimer() {
  const secs = Math.floor((Date.now() - ringStartedAt) / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  setText('genesysRingTimer', `Ringing… ${mm}:${ss}`);
}

function setHidden(id, hidden) {
  const el = document.getElementById(id);
  if (el) el.hidden = hidden;
}

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

/* Opens the overlay in its "ringing" state — simulating the transferred call
   landing on a human agent's softphone. Call this from the visible Genesys
   button OR automatically from a LiveKit handoff signal (see livekit.js) —
   both paths funnel through here. */
export function openGenesysView() {
  const overlay = document.getElementById('genesysOverlay');
  if (!overlay) return;
  overlay.hidden = false;
  setText('genesysLivePillText', 'Ringing');
  setHidden('genesysRinging', false);
  setHidden('genesysWorkspace', true);
  startRinging();
}

/* The "human agent" picks up: reveal the customer info + summary workspace. */
function answerCall() {
  stopRinging();
  setHidden('genesysRinging', true);
  setHidden('genesysWorkspace', false);
  setText('genesysLivePillText', 'Active interaction');

  const customer = appState.auth.customer || FALLBACK_CUSTOMERS[0];
  renderCustomer(customer);
  setText('genesysSummary', buildSummaryFromTranscript());

  if (!interactionId) interactionId = randomInteractionId();
  setText('genesysInteractionId', interactionId);
}

export function closeGenesysView() {
  stopRinging();
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
  const answerBtn = document.getElementById('genesysAnswerBtn');
  if (openBtn) openBtn.addEventListener('click', openGenesysView);
  if (closeBtn) closeBtn.addEventListener('click', closeGenesysView);
  if (answerBtn) answerBtn.addEventListener('click', answerCall);
}
