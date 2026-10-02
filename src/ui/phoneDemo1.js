/* =========================================================================
   PHONE UI — Demo 1 (S-mobiili app shell)
   Everything that happens visually on the phone screen: in-app navigation
   (home <-> inbox list <-> inbox message), the push-notification banner, and
   the Day-2 incoming-call ringing/in-call states. Pure DOM — no state of its
   own beyond which screen is currently visible. Mirrors the conventions of
   ui/phone.js (Part 2) but scoped to demo-1's own element ids, so neither
   demo can affect the other.
   ========================================================================= */
const SCREEN_IDS = ['appHome', 'appInboxList', 'appInboxDetail', 'd1Ring', 'd1InCall'];

let onOpenChat = null;
let onAnswerCall = null;
let onDeclineCall = null;
let onEndCall = null;
let onToggleMute = null;
let onPushBannerTap = null;

export function initPhoneDemo1UI(handlers) {
  onOpenChat = handlers.onOpenChat;
  onAnswerCall = handlers.onAnswerCall;
  onDeclineCall = handlers.onDeclineCall;
  onEndCall = handlers.onEndCall;
  onToggleMute = handlers.onToggleMute;
  onPushBannerTap = handlers.onPushBannerTap;

  const openChatBtn = document.getElementById('openChatBtn');
  const openInboxBtn = document.getElementById('openInboxBtn');
  const inboxBackBtn = document.getElementById('inboxBackBtn');
  const inboxItemBtn = document.getElementById('inboxItemBtn');
  const inboxDetailBackBtn = document.getElementById('inboxDetailBackBtn');
  const declineBtn = document.getElementById('d1DeclineBtn');
  const answerBtn = document.getElementById('d1AnswerBtn');
  const endBtn = document.getElementById('d1EndBtn');
  const muteBtn = document.getElementById('d1MuteBtn');
  const banner = document.getElementById('d1PushBanner');

  if (openChatBtn) openChatBtn.addEventListener('click', () => onOpenChat && onOpenChat());
  if (openInboxBtn) openInboxBtn.addEventListener('click', showInboxList);
  if (inboxBackBtn) inboxBackBtn.addEventListener('click', goHome);
  if (inboxItemBtn) inboxItemBtn.addEventListener('click', showInboxDetail);
  if (inboxDetailBackBtn) inboxDetailBackBtn.addEventListener('click', showInboxList);

  if (declineBtn) declineBtn.addEventListener('click', () => {
    goHome();
    if (onDeclineCall) onDeclineCall();
  });
  if (answerBtn) answerBtn.addEventListener('click', () => {
    showScreen('d1InCall');
    if (onAnswerCall) onAnswerCall();
  });
  if (endBtn) endBtn.addEventListener('click', () => onEndCall && onEndCall());
  if (muteBtn) muteBtn.addEventListener('click', () => onToggleMute && onToggleMute());

  if (banner) {
    banner.addEventListener('click', () => {
      hidePushNotification();
      if (onPushBannerTap) onPushBannerTap();
    });
    banner.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hidePushNotification();
        if (onPushBannerTap) onPushBannerTap();
      }
    });
  }

  tickClock();
  setInterval(tickClock, 15000);

  goHome();
}

function tickClock() {
  const el = document.getElementById('d1StatusClock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function showScreen(id) {
  SCREEN_IDS.forEach((sid) => {
    const el = document.getElementById(sid);
    if (el) el.hidden = sid !== id;
  });
}

export function goHome() {
  showScreen('appHome');
}

export function showInboxList() {
  showScreen('appInboxList');
}

export function showInboxDetail() {
  showScreen('appInboxDetail');
}

/* ---- Push notification banner (Day 2 morning) ---- */
export function showPushNotification(text) {
  const textEl = document.getElementById('d1PushText');
  if (textEl && text) textEl.textContent = text;
  const el = document.getElementById('d1PushBanner');
  if (el) el.classList.add('show');
}

export function hidePushNotification() {
  const el = document.getElementById('d1PushBanner');
  if (el) el.classList.remove('show');
}

/* ---- Incoming call (Day 2) ---- */
export function showIncomingCall() {
  showScreen('d1Ring');
}

export function hideIncomingCall() {
  // Only reverts to home if the ringing screen is still what's showing —
  // if the call was already answered, d1InCall is current and this is a no-op.
  const ring = document.getElementById('d1Ring');
  if (ring && !ring.hidden) goHome();
}

export function setCallSub(text) {
  const el = document.getElementById('d1CallSub');
  if (el) el.textContent = text;
}

export function setCallTimer(text) {
  const el = document.getElementById('d1CallTimer');
  if (el) el.textContent = text;
}

export function setMuteVisible(visible) {
  const el = document.getElementById('d1MuteBtn');
  if (el) el.hidden = !visible;
}

export function setMicMuted(muted) {
  const muteBtn = document.getElementById('d1MuteBtn');
  const onIcon = document.getElementById('d1MicOnIcon');
  const offIcon = document.getElementById('d1MicOffIcon');
  if (muteBtn) {
    muteBtn.classList.toggle('is-muted', Boolean(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Unmute microphone' : 'Mute microphone');
  }
  if (onIcon) onIcon.hidden = Boolean(muted);
  if (offIcon) offIcon.hidden = !muted;
}

export function showCallError(message) {
  const el = document.getElementById('d1CallError');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

export function clearCallError() {
  const el = document.getElementById('d1CallError');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}

/* Full visual reset — safe to call at any time (mirrors Part 2's Shift+R). */
export function resetPhoneUI() {
  hidePushNotification();
  clearCallError();
  setCallSub('Connecting…');
  setCallTimer('');
  setMuteVisible(false);
  setMicMuted(false);
  goHome();
}
