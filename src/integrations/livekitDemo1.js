/* =========================================================================
   LIVEKIT / WEBRTC VOICE INTEGRATION — Demo 1, Day 2 outbound call
   "Calling back as promised about the card charge." Same connect/transcribe
   pattern as integrations/livekit.js (Part 2) — mic permission, LiveKit room,
   remote audio attach, live transcription — adapted here as its own module
   because this call has no CIBA-style auth step and no Genesys handoff, so
   there's nothing to gain (and some risk) from sharing Part 2's module,
   which is wired tightly to that flow.

   Entry point: client SPANKKIRFP, same session URL as Part 2, external id
   24785a28-7bfd-4bfd-825a-7af57d5564fc (CONFIG.VOICE_EXTERNAL_ID_DEMO1_DAY2).
   ========================================================================= */
import { Room, RoomEvent, Track } from 'livekit-client';
import { CONFIG } from '../config.js';
import * as phoneUI from '../ui/phoneDemo1.js';
import * as sidePanel from '../ui/sidePanel.js';
import * as transcript from '../ui/transcriptDemo1.js';

let room = null;
let remoteAudioEls = [];
let durationTimer = null;
let micMuted = false;
let callActive = false;

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

async function requestSession() {
  const res = await fetch(CONFIG.VOICE_SESSION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ external_id: CONFIG.VOICE_EXTERNAL_ID_DEMO1_DAY2 })
  });
  if (!res.ok) throw new Error('Voice session request failed: ' + res.status);
  return res.json();
}

function startDurationTimer() {
  const startedAt = Date.now();
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

export async function startDay2Call() {
  if (room) {
    await endDay2Call();
  }

  phoneUI.clearCallError();
  phoneUI.setCallSub('Connecting…');
  callActive = true;

  try {
    await requestMicPermission();
    const session = await requestSession();

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
        transcript.onTranscriptSegment(seg.id, seg.text, seg.final, isAgent ? 'assistant' : 'customer');
      });
    });

    room.on(RoomEvent.Disconnected, () => {
      cleanupAfterDisconnect();
    });

    await room.connect(session.url, session.access_token);
    await room.localParticipant.setMicrophoneEnabled(true);
    micMuted = false;
    phoneUI.setMicMuted(false);

    transcript.clearTranscript();
    transcript.setLiveDot(true);
    sidePanel.showTranscript();

    phoneUI.setCallSub('Connected');
    phoneUI.setMuteVisible(true);
    startDurationTimer();
  } catch (e) {
    console.error('[livekitDemo1] startDay2Call failed:', e);
    room = null;

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
    phoneUI.setCallSub('Call failed');
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
  callActive = false;
  transcript.setLiveDot(false);
}

export async function endDay2Call() {
  if (room) {
    try { await room.disconnect(); } catch (e) { /* ignore */ }
  } else {
    cleanupAfterDisconnect();
  }
  phoneUI.goHome();
}

export async function toggleMicMute() {
  if (!room) return;
  micMuted = !micMuted;
  try {
    await room.localParticipant.setMicrophoneEnabled(!micMuted);
  } catch (e) {
    console.warn('[livekitDemo1] mic toggle failed:', e);
    micMuted = !micMuted; // revert optimistic state on failure
    return;
  }
  phoneUI.setMicMuted(micMuted);
}

export function isCallActive() {
  return callActive;
}
