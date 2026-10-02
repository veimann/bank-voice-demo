/* =========================================================================
   LIVEKIT / WEBRTC VOICE INTEGRATION
   Requests a session from the boost.ai voice entry point, connects to the
   LiveKit room, attaches the agent's audio, and feeds live transcription
   segments to the transcript panel. Pattern reused from the working
   reference project (requestMicPermission / RoomEvent wiring / JWT decode).
   ========================================================================= */
import { Room, RoomEvent, Track } from 'livekit-client';
import { CONFIG } from '../config.js';
import { appState } from '../state.js';
import { getRoomFromToken, openSessionSubscription, closeSessionSubscription } from './supabase.js';
import { onTranscriptSegment, clearTranscript, setLiveDot } from '../ui/transcript.js';
import { triggerAuthentication, initiateAuthentication } from '../ui/auth.js';
import { openGenesysView } from '../ui/genesys.js';
import * as phoneUI from '../ui/phone.js';

let room = null;
let remoteAudioEls = [];
let durationTimer = null;
let micMuted = false;

function VoiceError(message) {
  this.name = 'VoiceError';
  this.message = message;
}
VoiceError.prototype = Object.create(Error.prototype);

async function requestMicPermission() {
  if (!window.isSecureContext) {
    throw new VoiceError('This page must be served over HTTPS for the microphone to work.');
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new VoiceError('This browser does not allow microphone access.');
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch (e) {
    if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
      throw new VoiceError('Microphone permission was denied. Allow microphone access and try again.');
    }
    if (e && e.name === 'NotFoundError') {
      throw new VoiceError('No microphone was found on this device.');
    }
    throw new VoiceError('Microphone error: ' + (e && e.name ? e.name : 'unknown'));
  }
}

async function requestSession(lang) {
  const externalId = lang === 'en' ? CONFIG.VOICE_EXTERNAL_ID_EN : CONFIG.VOICE_EXTERNAL_ID_FI;
  const res = await fetch(CONFIG.VOICE_SESSION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ external_id: externalId })
  });
  if (!res.ok) throw new Error('Voice session request failed: ' + res.status);
  return res.json();
}

function startDurationTimer() {
  const startedAt = Date.now();
  appState.call.startedAt = startedAt;
  phoneUI.setCallTimer('00:00');
  durationTimer = setInterval(() => {
    const secs = Math.floor((Date.now() - startedAt) / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    phoneUI.setCallTimer(`${mm}:${ss}`);
  }, 1000);
}

function stopDurationTimer() {
  if (durationTimer) clearInterval(durationTimer);
  durationTimer = null;
}

/* Agent -> frontend bridge. Lets the Boost backend drive the same
   authentication state machine the presenter hotkey uses, once it's ready
   to do so live during a call — no frontend changes needed then. */
function handleAgentDataMessage(payload) {
  try {
    const text = new TextDecoder().decode(payload);
    const msg = JSON.parse(text);
    if (!msg || !msg.action) return;
    const customerId = msg.payload && msg.payload.customer_id;
    switch (msg.action) {
      case 'authentication_initiated':
        initiateAuthentication(customerId);
        break;
      case 'authentication_completed':
      case 'authenticate':
        triggerAuthentication(customerId);
        break;
      case 'handoff_to_human':
      case 'transfer_to_human':
        openGenesysView();
        break;
      default:
        console.warn('[livekit] unhandled agent action:', msg.action);
    }
  } catch (e) {
    console.warn('[livekit] could not parse agent data message:', e);
  }
}

export async function startCall(lang = 'fi') {
  if (room) {
    await endCall();
  }

  appState.language = lang;
  phoneUI.clearCallError();
  phoneUI.setCallStatus('connecting');

  try {
    await requestMicPermission();
    const session = await requestSession(lang);

    room = new Room();

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        const audioEl = track.attach();
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        remoteAudioEls.push(audioEl);
      }
    });

    room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
      const isAgent = !participant || participant.isAgent;
      segments.forEach((seg) => {
        onTranscriptSegment(seg.id, seg.text, seg.final, isAgent ? 'assistant' : 'customer');
      });
    });

    room.on(RoomEvent.DataReceived, (payload) => handleAgentDataMessage(payload));

    room.on(RoomEvent.Disconnected, () => {
      cleanupAfterDisconnect();
    });

    await room.connect(session.url, session.access_token);
    await room.localParticipant.setMicrophoneEnabled(true);
    micMuted = false;
    phoneUI.setMicMuted(false);

    clearTranscript();
    setLiveDot(true);

    appState.call.status = 'active';
    appState.call.room = getRoomFromToken(session.access_token);
    phoneUI.setCallStatus('active');
    startDurationTimer();

    // Optional, best-effort: lets a future Boost/Supabase backend signal
    // authentication for this specific call. No-ops if not configured.
    if (CONFIG.SESSION_TABLE && appState.call.room) {
      openSessionSubscription(appState.call.room, (row) => {
        if (row && row.authenticated && row.customer_id) {
          triggerAuthentication(row.customer_id);
        } else if (row && row.authentication_initiated && row.customer_id) {
          initiateAuthentication(row.customer_id);
        }
      });
    }
  } catch (e) {
    console.error('[livekit] startCall failed:', e);
    room = null;
    appState.call.status = 'idle';

    let reason;
    if (e && e.name === 'VoiceError') {
      reason = e.message;
    } else if (e && /fetch|network|failed to fetch/i.test(String(e.message || e))) {
      reason = 'Could not reach the S-Pankki voice service. Check your connection and try again.';
    } else if (e && /voice session request failed/i.test(String(e.message || e))) {
      reason = 'The voice service rejected the call. Please try again.';
    } else {
      reason = 'The call could not be started. Please try again.';
    }
    phoneUI.setCallStatus('idle');
    phoneUI.showCallError(reason);
  }
}

function cleanupAfterDisconnect() {
  stopDurationTimer();
  remoteAudioEls.forEach((el) => {
    try { el.remove(); } catch (e) { /* ignore */ }
  });
  remoteAudioEls = [];
  room = null;
  micMuted = false;
  appState.call.status = 'idle';
  appState.call.room = null;
  closeSessionSubscription();
  setLiveDot(false);
  phoneUI.setCallStatus('idle');
}

export async function endCall() {
  if (room) {
    try { await room.disconnect(); } catch (e) { /* ignore */ }
  } else {
    cleanupAfterDisconnect();
  }
}

export async function toggleMicMute() {
  if (!room) return;
  micMuted = !micMuted;
  try {
    await room.localParticipant.setMicrophoneEnabled(!micMuted);
  } catch (e) {
    console.warn('[livekit] mic toggle failed:', e);
    micMuted = !micMuted; // revert optimistic state on failure
    return;
  }
  phoneUI.setMicMuted(micMuted);
}

export function isCallActive() {
  return appState.call.status === 'active' || appState.call.status === 'connecting';
}
