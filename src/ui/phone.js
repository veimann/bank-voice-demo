/* =========================================================================
   PHONE UI
   Renders the idle / connecting / active call states, the CIBA-style
   notification banner and the Face ID overlay. Pure DOM — no state of its
   own beyond what's needed for rendering; the call/auth state machines in
   integrations/livekit.js and ui/auth.js own the actual state.
   ========================================================================= */
let onStartCall = null;
let onEndCall = null;
let onBannerTap = null;

export function initPhoneUI({ onStart, onEnd, onBannerTap: onTap }) {
  onStartCall = onStart;
  onEndCall = onEnd;
  onBannerTap = onTap;

  const startBtn = document.getElementById('callStartBtn');
  const endBtn = document.getElementById('callEndBtn');
  const banner = document.getElementById('cibaBanner');

  if (startBtn) startBtn.addEventListener('click', () => onStartCall && onStartCall());
  if (endBtn) endBtn.addEventListener('click', () => onEndCall && onEndCall());
  if (banner) {
    banner.addEventListener('click', () => onBannerTap && onBannerTap());
    banner.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onBannerTap && onBannerTap();
      }
    });
  }

  tickClock();
  setInterval(tickClock, 15000);
}

function tickClock() {
  const el = document.getElementById('statusClock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function setCallStatus(status) {
  const phone = document.getElementById('phone');
  const sub = document.getElementById('callSub');
  const startBtn = document.getElementById('callStartBtn');
  const endBtn = document.getElementById('callEndBtn');
  if (!phone) return;

  phone.classList.remove('is-idle', 'is-connecting', 'is-active');
  phone.classList.add('is-' + status);

  if (status === 'idle') {
    if (sub) sub.textContent = 'Customer Service';
    if (startBtn) { startBtn.hidden = false; startBtn.disabled = false; }
    if (endBtn) endBtn.hidden = true;
    setCallTimer('');
  } else if (status === 'connecting') {
    if (sub) sub.textContent = 'Connecting…';
    if (startBtn) startBtn.disabled = true;
  } else if (status === 'active') {
    if (sub) sub.textContent = 'Connected';
    if (startBtn) startBtn.hidden = true;
    if (endBtn) endBtn.hidden = false;
  }
}

export function setCallTimer(text) {
  const el = document.getElementById('callTimer');
  if (el) el.textContent = text;
}

export function showCallError(message) {
  const el = document.getElementById('callError');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

export function clearCallError() {
  const el = document.getElementById('callError');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}

export function showCibaNotification() {
  const el = document.getElementById('cibaBanner');
  if (el) el.classList.add('show');
}

export function hideCibaNotification() {
  const el = document.getElementById('cibaBanner');
  if (el) el.classList.remove('show');
}

export function showFaceId() {
  const el = document.getElementById('faceidOverlay');
  const label = document.getElementById('faceidLabel');
  if (el) { el.classList.add('show'); el.classList.remove('success'); }
  if (label) label.textContent = 'Scanning…';
}

export function markFaceIdSuccess() {
  const el = document.getElementById('faceidOverlay');
  const label = document.getElementById('faceidLabel');
  if (el) el.classList.add('success');
  if (label) label.textContent = 'Identity verified';
}

export function hideFaceId() {
  const el = document.getElementById('faceidOverlay');
  if (el) el.classList.remove('show', 'success');
}
