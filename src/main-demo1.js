/* =========================================================================
   ENTRY POINT — Demo 1 (Day 1: S-mobiili chat)
   Home screen <-> chat screen toggle, persona greeting, and lazy-starting the
   real chat conversation only once the user actually opens it.
   ========================================================================= */
import { applyStoredPersonaIfAny } from './persona.js';
import { getCustomers } from './data/customers.js';
import { initChatPanel } from './ui/chatPanel.js';

document.addEventListener('DOMContentLoaded', async () => {
  await applyStoredPersonaIfAny();
  await setGreeting();

  const home = document.getElementById('appHome');
  const chat = document.getElementById('appChat');
  const openBtn = document.getElementById('openChatBtn');
  const backBtn = document.getElementById('chatBackBtn');
  let chatStarted = false;

  function showChat() {
    if (home) home.hidden = true;
    if (chat) chat.hidden = false;
    if (!chatStarted) {
      chatStarted = true;
      initChatPanel();
    }
  }

  function showHome() {
    if (chat) chat.hidden = true;
    if (home) home.hidden = false;
  }

  if (openBtn) openBtn.addEventListener('click', showChat);
  if (backBtn) backBtn.addEventListener('click', showHome);
});

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
