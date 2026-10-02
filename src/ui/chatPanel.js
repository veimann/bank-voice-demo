/* =========================================================================
   CHAT PANEL UI (Demo 1 — Day 1 live webchat)
   Renders the real boost.ai conversation and wires the message input. Bot
   elements (text/html/links/image) are rendered generically; action_link
   buttons post back to the API when clicked. See integrations/chatApi.js
   for the data layer this talks to.
   ========================================================================= */
import { initConversation, sendText, sendActionLink } from '../integrations/chatApi.js';

const TEXTAREA_MAX_HEIGHT = 120; // px — matches the CSS max-height on #chatInput

let conversationId = null;
let sending = false;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function scrollToBottom() {
  const body = document.getElementById('chatBody');
  if (body) body.scrollTop = body.scrollHeight;
}

function renderElement(element) {
  const payload = element.payload || {};
  switch (element.type) {
    case 'text':
      return el('p', 'chat-bubble', payload.text || '');
    case 'html': {
      const node = el('div', 'chat-bubble chat-bubble--html');
      node.innerHTML = payload.html || '';
      return node;
    }
    case 'links': {
      const wrap = el('div', 'chat-links');
      (payload.links || []).forEach((link) => {
        const btn = el('button', 'chat-link-btn', link.text);
        btn.type = 'button';
        btn.addEventListener('click', () => handleLinkClick(link));
        wrap.appendChild(btn);
      });
      return wrap;
    }
    case 'image': {
      const img = document.createElement('img');
      img.className = 'chat-image';
      img.src = payload.url;
      img.alt = payload.alt_text || '';
      return img;
    }
    default:
      return el('p', 'chat-bubble chat-bubble--muted', 'Unsupported message type: ' + element.type);
  }
}

function renderBotMessage(elements) {
  const body = document.getElementById('chatBody');
  if (!body || !elements || !elements.length) return;
  const wrap = el('div', 'chat-msg chat-msg--bot');
  elements.forEach((element) => wrap.appendChild(renderElement(element)));
  body.appendChild(wrap);
  scrollToBottom();
}

function renderClientMessage(text) {
  const body = document.getElementById('chatBody');
  if (!body) return;
  const wrap = el('div', 'chat-msg chat-msg--client');
  wrap.appendChild(el('p', 'chat-bubble', text));
  body.appendChild(wrap);
  scrollToBottom();
}

function showError(e) {
  const body = document.getElementById('chatBody');
  if (!body) return;
  const wrap = el('div', 'chat-msg chat-msg--error');
  wrap.appendChild(el('p', 'chat-bubble chat-bubble--error', (e && e.message) || 'Something went wrong. Please try again.'));
  body.appendChild(wrap);
  scrollToBottom();
}

/* ---- Typing indicator — shown any time we're waiting on a bot reply,
   including the very first welcome message. ---- */
function showTyping() {
  const body = document.getElementById('chatBody');
  if (!body || document.getElementById('chatTypingBubble')) return;
  const wrap = el('div', 'chat-msg chat-msg--bot');
  wrap.id = 'chatTypingBubble';
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-typing';
  bubble.innerHTML = '<span></span><span></span><span></span>';
  wrap.appendChild(bubble);
  body.appendChild(wrap);
  scrollToBottom();
}

function hideTyping() {
  const bubble = document.getElementById('chatTypingBubble');
  if (bubble) bubble.remove();
}

function setSending(value) {
  sending = value;
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  if (input) input.disabled = value;
  if (sendBtn) sendBtn.disabled = value;
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT) + 'px';
}

async function handleLinkClick(link) {
  if (link.type !== 'action_link' || sending || !conversationId) return;
  setSending(true);
  showTyping();
  try {
    const messages = await sendActionLink(conversationId, link.id);
    hideTyping();
    messages.forEach((m) => { if (m.source === 'bot') renderBotMessage(m.elements); });
  } catch (e) {
    hideTyping();
    showError(e);
  } finally {
    setSending(false);
  }
}

/* Clears whatever is currently rendered — used by "End chat" so a stale
   conversation never lingers on screen after it's been reset. */
export function clearChatBody() {
  const body = document.getElementById('chatBody');
  if (body) body.innerHTML = '';
}

export async function initChatPanel() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const body = document.getElementById('chatBody');
  if (!form || !input || !body) return;

  body.innerHTML = '';
  input.style.height = 'auto';
  showTyping();

  try {
    const result = await initConversation();
    conversationId = result.conversationId;
    hideTyping();
    result.messages.forEach((m) => { if (m.source === 'bot') renderBotMessage(m.elements); });
  } catch (e) {
    hideTyping();
    showError(e);
  }

  input.addEventListener('input', () => autoGrow(input));

  // Enter sends, Shift+Enter inserts a newline — textareas don't submit their
  // form on Enter by default, so this bridges that deliberately.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || sending || !conversationId) return;
    renderClientMessage(text);
    input.value = '';
    autoGrow(input);
    setSending(true);
    showTyping();
    try {
      const messages = await sendText(conversationId, text);
      hideTyping();
      messages.forEach((m) => { if (m.source === 'bot') renderBotMessage(m.elements); });
    } catch (e) {
      hideTyping();
      showError(e);
    } finally {
      setSending(false);
    }
  });
}
