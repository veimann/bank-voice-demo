/* =========================================================================
   BOOST.AI CHAT API v2 — DATA LAYER
   Thin client for POST /api/chat/v2, used to drive a real, live conversation
   with the S-Pankki virtual agent inside the Demo 1 "S-mobiili" app shell —
   instead of embedding boost.ai's own chat panel widget — so the UI can be
   styled to match the mobile app exactly.

   This file owns only the API calls and response shape; src/ui/chatPanel.js
   owns rendering. Pattern mirrors integrations/livekit.js + ui/phone.js.

   NOTE: this calls spankkirfp.boost.ai directly from the browser. It could
   not be tested from the build sandbox here (no outbound internet access),
   so please smoke-test it once deployed. If the browser console shows a CORS
   error, the site/domain this runs on needs to be allowed for API access in
   the boost.ai Admin Panel — that's a one-line config change there, not a
   code change here.
   ========================================================================= */
import { CONFIG } from '../config.js';

const STORAGE_KEY = 'sp_demo1_chat_conversation_id';

function ChatApiError(message, tag) {
  this.name = 'ChatApiError';
  this.message = message;
  this.tag = tag;
}
ChatApiError.prototype = Object.create(Error.prototype);

async function postCommand(body) {
  let res;
  try {
    res = await fetch(CONFIG.CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new ChatApiError('Could not reach the chat service. Check your connection and try again.');
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new ChatApiError('The chat service returned an unexpected response.');
  }

  if (!res.ok || data.error) {
    throw new ChatApiError(data.error || ('Chat request failed: ' + res.status), data.tag);
  }
  return data;
}

/* Normalizes a Start/Post `response` object or a Resume `responses` array
   into a flat list: [{ source: 'bot'|'client', elements, id, dateCreated }] */
function normalize(data) {
  if (Array.isArray(data.responses)) {
    return data.responses.map((r) => ({
      source: r.source,
      elements: r.elements || [],
      id: r.id,
      dateCreated: r.date_created
    }));
  }
  if (data.response) {
    return [{
      source: data.response.source,
      elements: data.response.elements || [],
      id: data.response.id,
      dateCreated: data.response.date_created
    }];
  }
  return [];
}

function getStoredConversationId() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
}

function storeConversationId(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* ignore */ }
}

/* Resumes a previously stored conversation (e.g. the page was reloaded
   mid-demo); starts a fresh one if there is none, or if resuming fails
   (the stored conversation may have expired server-side). Always returns
   {conversationId, messages}. */
export async function initConversation() {
  const stored = getStoredConversationId();
  if (stored) {
    try {
      const data = await postCommand({ command: 'RESUME', conversation_id: stored, language: 'fi-FI' });
      const conversationId = data.conversation && data.conversation.id;
      storeConversationId(conversationId);
      return { conversationId, messages: normalize(data) };
    } catch (e) {
      storeConversationId(null); // fall through to START below
    }
  }
  const data = await postCommand({ command: 'START', language: 'fi-FI' });
  const conversationId = data.conversation && data.conversation.id;
  storeConversationId(conversationId);
  return { conversationId, messages: normalize(data) };
}

export async function sendText(conversationId, text) {
  const data = await postCommand({ command: 'POST', conversation_id: conversationId, type: 'text', value: text });
  return normalize(data);
}

export async function sendActionLink(conversationId, id) {
  const data = await postCommand({ command: 'POST', conversation_id: conversationId, type: 'action_link', id });
  return normalize(data);
}

/* Used by the presenter reset — starts clean next time initConversation() runs. */
export function resetConversation() {
  storeConversationId(null);
}
