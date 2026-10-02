/* =========================================================================
   CHAT PANEL UI (Demo 1 — Day 1 live webchat)
   Renders the real boost.ai conversation and wires the message input. Bot
   elements (text/html/links/image) are rendered generically; action_link
   buttons post back to the API when clicked. See integrations/chatApi.js
   for the data layer this talks to.
   ========================================================================= */
import { initConversation, sendText, sendActionLink } from '../integrations/chatApi.js';

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

function setSending(value) {
  sending = value;
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  if (input) input.disabled = value;
  if (sendBtn) sendBtn.disabled = value;
}

async function handleLinkClick(link) {
  if (link.type !== 'action_link' || sending || !conversationId) return;
  setSending(true);
  try {
    const messages = await sendActionLink(conversationId, link.id);
    messages.forEach((m) => { if (m.source === 'bot') renderBotMessage(m.elements); });
  } catch (e) {
    showError(e);
  } finally {
    setSending(false);
  }
}

export async function initChatPanel() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const body = document.getElementById('chatBody');
  if (!form || !input || !body) return;

  body.innerHTML = '';
  const loading = el('p', 'chat-loading', 'Connecting to Aulis…');
  body.appendChild(loading);

  try {
    const result = await initConversation();
    conversationId = result.conversationId;
    loading.remove();
    result.messages.forEach((m) => { if (m.source === 'bot') renderBotMessage(m.elements); });
  } catch (e) {
    loading.remove();
    showError(e);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || sending || !conversationId) return;
    renderClientMessage(text);
    input.value = '';
    setSending(true);
    try {
      const messages = await sendText(conversationId, text);
      messages.forEach((m) => { if (m.source === 'bot') renderBotMessage(m.elements); });
    } catch (e) {
      showError(e);
    } finally {
      setSending(false);
    }
  });
}
