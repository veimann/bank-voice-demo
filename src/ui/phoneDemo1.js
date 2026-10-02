/* =========================================================================
   PHONE UI — Demo 1 (S-mobiili app shell)
   Everything that happens visually on the phone screen: in-app navigation
   (home <-> messages <-> inbox message <-> notification detail), the bottom
   nav bar, the push-notification banner, the Day-2 incoming-call ringing/
   in-call states, and a synthesized ringtone. Pure DOM — no state of its own
   beyond which screen is currently visible. Mirrors the conventions of
   ui/phone.js (Part 2) but scoped to demo-1's own element ids, so neither
   demo can affect the other.
   ========================================================================= */
const SCREEN_IDS = ['appHome', 'appInboxList', 'appInboxDetail', 'd1NotifDetail', 'd1Ring', 'd1InCall'];
// These two take over the whole phone screen like a real incoming-call /
// in-call UI would — no app chrome (bottom nav) visible underneath.
const FULLSCREEN_IDS = ['d1Ring', 'd1InCall'];

let onOpenChat = null;
let onAnswerCall = null;
let onDeclineCall = null;
let onEndCall = null;
let onToggleMute = null;
let onPushBannerTap = null;

let currentNotificationText = '';

export function initPhoneDemo1UI(handlers) {
  onOpenChat = handlers.onOpenChat;
  onAnswerCall = handlers.onAnswerCall;
  onDeclineCall = handlers.onDeclineCall;
  onEndCall = handlers.onEndCall;
  onToggleMute = handlers.onToggleMute;
  onPushBannerTap = handlers.onPushBannerTap;

  const navHomeBtn = document.getElementById('navHomeBtn');
  const navMessagesBtn = document.getElementById('navMessagesBtn');
  const navChatBtn = document.getElementById('navChatBtn');
  const inboxItemBtn = document.getElementById('inboxItemBtn');
  const inboxDetailBackBtn = document.getElementById('inboxDetailBackBtn');
  const notifDetailBackBtn = document.getElementById('notifDetailBackBtn');
  const declineBtn = document.getElementById('d1DeclineBtn');
  const answerBtn = document.getElementById('d1AnswerBtn');
  const endBtn = document.getElementById('d1EndBtn');
  const muteBtn = document.getElementById('d1MuteBtn');
  const banner = document.getElementById('d1PushBanner');

  if (navHomeBtn) navHomeBtn.addEventListener('click', goHome);
  if (navMessagesBtn) navMessagesBtn.addEventListener('click', showInboxList);
  if (navChatBtn) navChatBtn.addEventListener('click', () => onOpenChat && onOpenChat());
  if (inboxItemBtn) inboxItemBtn.addEventListener('click', showInboxDetail);
  if (inboxDetailBackBtn) inboxDetailBackBtn.addEventListener('click', showInboxList);
  if (notifDetailBackBtn) notifDetailBackBtn.addEventListener('click', goHome);

  if (declineBtn) declineBtn.addEventListener('click', () => {
    stopRingtone();
    goHome();
    if (onDeclineCall) onDeclineCall();
  });
  if (answerBtn) answerBtn.addEventListener('click', () => {
    stopRingtone();
    showScreen('d1InCall');
    if (onAnswerCall) onAnswerCall();
  });
  if (endBtn) endBtn.addEventListener('click', () => onEndCall && onEndCall());
  if (muteBtn) muteBtn.addEventListener('click', () => onToggleMute && onToggleMute());

  if (banner) {
    banner.addEventListener('click', openNotificationDetail);
    banner.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openNotificationDetail();
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
    if (el) el.classList.toggle('on', sid === id);
  });

  const nav = document.getElementById('bottomNav');
  if (nav) nav.hidden = FULLSCREEN_IDS.includes(id);

  const homeBtn = document.getElementById('navHomeBtn');
  const messagesBtn = document.getElementById('navMessagesBtn');
  if (homeBtn) homeBtn.classList.toggle('on', id === 'appHome');
  if (messagesBtn) messagesBtn.classList.toggle('on', id === 'appInboxList' || id === 'appInboxDetail');
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

/* Highlights/un-highlights the "Chat" nav tab to reflect whether the side
   panel is currently showing the chat (owned by main-demo1.js, which is the
   only module that knows about both the phone and the side panel). */
export function setChatNavActive(active) {
  const navChatBtn = document.getElementById('navChatBtn');
  if (navChatBtn) navChatBtn.classList.toggle('on', Boolean(active));
}

/* ---- Push notification banner (Day 2 morning) ----
   The banner itself only ever shows a short teaser (the first sentence) —
   tapping it is what reveals the full text, on its own screen. */
export function showPushNotification(fullText) {
  currentNotificationText = fullText || '';
  const periodIdx = currentNotificationText.indexOf('.');
  const teaser = periodIdx >= 0 ? currentNotificationText.slice(0, periodIdx + 1) : currentNotificationText;
  const textEl = document.getElementById('d1PushText');
  if (textEl) textEl.textContent = teaser;
  const el = document.getElementById('d1PushBanner');
  if (el) el.classList.add('show');
}

export function hidePushNotification() {
  const el = document.getElementById('d1PushBanner');
  if (el) el.classList.remove('show');
}

function openNotificationDetail() {
  hidePushNotification();
  const bodyEl = document.getElementById('d1NotifBody');
  if (bodyEl) bodyEl.textContent = currentNotificationText;
  showScreen('d1NotifDetail');
  if (onPushBannerTap) onPushBannerTap();
}

/* ---- Incoming call (Day 2) ---- */
export function showIncomingCall() {
  showScreen('d1Ring');
  startRingtone();
}

export function hideIncomingCall() {
  stopRingtone();
  // Only reverts to home if the ringing screen is still what's showing —
  // if the call was already answered, d1InCall is current and this is a no-op.
  const ring = document.getElementById('d1Ring');
  if (ring && ring.classList.contains('on')) goHome();
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

/* ---- Ringtone ----
   A small synthesized two-tone ring (Web Audio API) rather than an external
   audio file — no asset to host, no network fetch, nothing that can 404
   mid-demo. Started/stopped from the same user-gesture handlers that show
   and hide the ringing screen, which satisfies browser autoplay policy. */
let audioCtx = null;
let ringIntervalId = null;

function ensureAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { audioCtx = new Ctx(); } catch (e) { return null; }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { /* ignore */ });
  }
  return audioCtx;
}

function playTone(ctx, freq, startTime, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.16, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function ringBurst() {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 950, now, 0.4);
  playTone(ctx, 950, now + 0.5, 0.4);
}

export function startRingtone() {
  stopRingtone();
  const ctx = ensureAudioCtx();
  if (!ctx) return; // no Web Audio support — the visual ring still works fine
  ringBurst();
  ringIntervalId = setInterval(ringBurst, 2200);
}

export function stopRingtone() {
  if (ringIntervalId) clearInterval(ringIntervalId);
  ringIntervalId = null;
}

/* Full visual reset — safe to call at any time (mirrors Part 2's Shift+R). */
export function resetPhoneUI() {
  stopRingtone();
  hidePushNotification();
  clearCallError();
  setCallSub('Connecting…');
  setCallTimer('');
  setMuteVisible(false);
  setMicMuted(false);
  setChatNavActive(false);
  goHome();
}
