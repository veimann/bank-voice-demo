/* =========================================================================
   PRESENTER CONTROLS
   Hidden from the audience by default. Shift+P reveals a small control panel
   (also usable by hotkey alone, without opening the panel):

     Shift+P  toggle the presenter panel
     Shift+A  trigger authentication for the selected demo customer
     Shift+E  start the hidden English test call
     Shift+R  full reset — safe to press any time, mid-call or not

   Also exposes window.boostDemo for console testing and as a landing spot
   for a future postMessage/backend bridge.
   ========================================================================= */
import { appState } from '../state.js';
import { getCustomers, getCustomersSource } from '../data/customers.js';
import { triggerAuthentication, resetAuth } from './auth.js';
import { startCall, endCall } from '../integrations/livekit.js';
import { clearTranscript } from './transcript.js';
import { lockCustomerPanel } from './customerPanel.js';
import { resetGenesysView } from './genesys.js';
import * as phoneUI from './phone.js';

let panelOpen = false;
let selectedCustomerId = null;

export async function initPresenterControls() {
  const panel = document.getElementById('presenterPanel');
  const select = document.getElementById('presenterCustomerSelect');
  const authBtn = document.getElementById('presenterAuthBtn');
  const enBtn = document.getElementById('presenterEnglishBtn');
  const resetBtn = document.getElementById('presenterResetBtn');

  try {
    const customers = await getCustomers();
    if (select) {
      select.innerHTML = '';
      customers.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.full_name || c.id;
        select.appendChild(opt);
      });
      selectedCustomerId = customers[0] ? customers[0].id : null;
      select.addEventListener('change', () => { selectedCustomerId = select.value; });
    }
    const source = getCustomersSource();
    setStatus('Customer data: ' + (source === 'supabase' ? 'Supabase (live)' : 'local fallback'));
  } catch (e) {
    setStatus('Customer data unavailable — using local fallback.');
  }

  if (authBtn) authBtn.addEventListener('click', () => triggerAuthentication(selectedCustomerId));
  if (enBtn) enBtn.addEventListener('click', () => startCall('en'));
  if (resetBtn) resetBtn.addEventListener('click', resetDemo);

  window.addEventListener('keydown', handleHotkeys);

  window.boostDemo = {
    authenticate: (id) => triggerAuthentication(id || selectedCustomerId),
    startEnglishTestCall: () => startCall('en'),
    reset: resetDemo
  };

  void panel; // referenced via togglePanel()
}

function handleHotkeys(e) {
  if (!e.shiftKey) return;
  const tag = ((e.target && e.target.tagName) || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  const key = e.key.toLowerCase();
  if (key === 'p') {
    togglePanel();
    e.preventDefault();
  } else if (key === 'a') {
    triggerAuthentication(selectedCustomerId);
    e.preventDefault();
  } else if (key === 'e') {
    startCall('en');
    e.preventDefault();
  } else if (key === 'r') {
    resetDemo();
    e.preventDefault();
  }
}

function togglePanel() {
  const panel = document.getElementById('presenterPanel');
  panelOpen = !panelOpen;
  if (panel) panel.classList.toggle('open', panelOpen);
}

async function resetDemo() {
  await endCall();
  resetAuth();
  clearTranscript();
  lockCustomerPanel();
  resetGenesysView();
  phoneUI.setCallStatus('idle');
  phoneUI.clearCallError();
  appState.language = 'fi';
  setStatus('Demo reset — ready to go again.');
}

function setStatus(text) {
  const el = document.getElementById('presenterStatus');
  if (el) el.textContent = text;
}
