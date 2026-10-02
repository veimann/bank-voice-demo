/* =========================================================================
   PRESENTER CONTROLS — Demo 1
   Hidden from the audience by default, same convention as Part 2:

     Shift+P  toggle the presenter panel
     Shift+N  push the "your new card is on its way" notification (Day 2 AM)
     Shift+C  simulate the incoming call (Day 2) — ringing only; answering it
              (on screen) is what actually places the outbound LiveKit call
     Shift+R  full reset — safe to press any time

   Full automation (auto-advancing from chat -> push -> call on a timer) is
   deliberately not built yet — every beat is a manual presenter trigger for
   this version, per the brief.
   ========================================================================= */
import * as phoneUI from './phoneDemo1.js';
import * as sidePanel from './sidePanel.js';
import * as transcript from './transcriptDemo1.js';
import * as livekitDemo1 from '../integrations/livekitDemo1.js';

let panelOpen = false;
let onReset = null;

export function initPresenterDemo1({ onReset: onResetHandler } = {}) {
  onReset = onResetHandler || null;

  const pushBtn = document.getElementById('d1PushBtn');
  const callBtn = document.getElementById('d1CallBtn');
  const resetBtn = document.getElementById('d1ResetBtn');

  if (pushBtn) pushBtn.addEventListener('click', triggerPushNotification);
  if (callBtn) callBtn.addEventListener('click', triggerIncomingCall);
  if (resetBtn) resetBtn.addEventListener('click', resetDemo);

  window.addEventListener('keydown', handleHotkeys);

  window.boostDemo1 = {
    pushNotification: triggerPushNotification,
    incomingCall: triggerIncomingCall,
    reset: resetDemo
  };
}

function handleHotkeys(e) {
  if (!e.shiftKey) return;
  const tag = ((e.target && e.target.tagName) || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  const key = e.key.toLowerCase();
  if (key === 'p') {
    togglePanel();
    e.preventDefault();
  } else if (key === 'n') {
    triggerPushNotification();
    e.preventDefault();
  } else if (key === 'c') {
    triggerIncomingCall();
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

function getCallbackTime() {
  const input = document.getElementById('d1CallbackTimeInput');
  const value = input && input.value.trim();
  return value || '2:00 PM';
}

function triggerPushNotification() {
  const time = getCallbackTime();
  phoneUI.showPushNotification(`Your new card is on its way. We'll call you at ${time} as agreed.`);
  setStatus('Push notification shown.');
}

function triggerIncomingCall() {
  phoneUI.showIncomingCall();
  setStatus('Incoming call ringing — answer it on the phone to place the real outbound call.');
}

async function resetDemo() {
  await livekitDemo1.endDay2Call();
  phoneUI.resetPhoneUI();
  transcript.clearTranscript();
  sidePanel.showPlaceholder();
  if (onReset) {
    try { await onReset(); } catch (e) { /* ignore */ }
  }
  setStatus('Demo reset — ready to go again.');
}

function setStatus(text) {
  const el = document.getElementById('presenterStatus');
  if (el) el.textContent = text;
}
