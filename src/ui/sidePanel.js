/* =========================================================================
   SIDE PANEL (Demo 1) — the area to the right of the phone.
   One panel, three mutually-exclusive sub-views: an idle placeholder, the
   live Day-1 chat, and the live Day-2 call transcript. The phone itself
   never shows the conversation text — clicking "Chat with us" or answering
   the incoming call opens the matching view here instead.
   ========================================================================= */
let onCloseChat = null;

export function initSidePanel(handlers) {
  onCloseChat = (handlers && handlers.onCloseChat) || null;
  const closeBtn = document.getElementById('sideChatCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      showPlaceholder();
      if (onCloseChat) onCloseChat();
    });
  }
  showPlaceholder();
}

function setTitle(text) {
  const el = document.getElementById('sidePanelTitle');
  if (el) el.textContent = text;
}

function showOnly(id) {
  ['sidePlaceholder', 'sideChat', 'sideTranscript'].forEach((sid) => {
    const el = document.getElementById(sid);
    if (el) el.hidden = sid !== id;
  });
}

export function showPlaceholder() {
  showOnly('sidePlaceholder');
  setTitle('Conversation');
}

export function showChat() {
  showOnly('sideChat');
  setTitle('Chat with Aulis');
}

export function showTranscript() {
  showOnly('sideTranscript');
  setTitle('Call transcript');
}

export function isChatOpen() {
  const el = document.getElementById('sideChat');
  return Boolean(el && !el.hidden);
}
