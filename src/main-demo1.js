/* =========================================================================
   ENTRY POINT — Demo 1 ("The payment that wasn't hers")
   Wires the S-mobiili phone shell to: the live Day-1 chat (opens in the side
   panel), the pre-existing inbox message (the prerequisite fraud flag), the
   Day-2 push notification, and the Day-2 outbound call — all through the
   same hidden presenter hotkeys used throughout the rest of the project.
   ========================================================================= */
import { applyStoredPersonaIfAny } from './persona.js';
import { getCustomers } from './data/customers.js';
import { initChatPanel } from './ui/chatPanel.js';
import { resetConversation } from './integrations/chatApi.js';
import * as phoneUI from './ui/phoneDemo1.js';
import * as sidePanel from './ui/sidePanel.js';
import * as livekitDemo1 from './integrations/livekitDemo1.js';
import { initPresenterDemo1 } from './ui/presenterDemo1.js';

let chatStarted = false;

document.addEventListener('DOMContentLoaded', async () => {
  await applyStoredPersonaIfAny();
  await setGreeting();

  initPhoneAndPanel();

  initPresenterDemo1({
    onReset: async () => {
      chatStarted = false;
      resetConversation();
    }
  });
});

function initPhoneAndPanel() {
  phoneUI.initPhoneDemo1UI({
    onOpenChat: openChat,
    onAnswerCall: () => livekitDemo1.startDay2Call(),
    onDeclineCall: () => { /* ringing screen already dismissed by phoneDemo1.js */ },
    onEndCall: () => livekitDemo1.endDay2Call(),
    onToggleMute: () => livekitDemo1.toggleMicMute(),
    onPushBannerTap: () => { /* dismissing the banner is enough — no action needed from the customer */ }
  });

  sidePanel.initSidePanel({
    onCloseChat: () => { /* conversation state persists; reopening "Chat with us" resumes it */ }
  });
}

function openChat() {
  sidePanel.showChat();
  if (!chatStarted) {
    chatStarted = true;
    initChatPanel();
  }
}

async function setGreeting() {
  const greetingEl = document.getElementById('appGreeting');
  if (!greetingEl) return;
  try {
    const customers = await getCustomers();
    const current = customers[0];
    if (current && current.full_name) {
      const firstName = current.full_name.trim().split(/\s+/)[0];
      greetingEl.textContent = `Hei, ${firstName}!`;
    }
  } catch (e) {
    /* keep the default greeting already in the HTML */
  }
}
