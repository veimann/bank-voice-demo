/* =========================================================================
   HUB PAGE — persona name entry
   The only interactive piece on the hub page: wires the "Demo customer name"
   box to persona.js, which carries the name into every demo part. See
   src/persona.js for the storage/Supabase details.
   ========================================================================= */
import { getCustomers } from './data/customers.js';
import { getPersonaName, setPersonaName, randomPersonaName } from './persona.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const input = document.getElementById('personaNameInput');
  const saveBtn = document.getElementById('personaSaveBtn');
  const randomBtn = document.getElementById('personaRandomBtn');
  const status = document.getElementById('personaStatus');
  if (!input || !saveBtn || !randomBtn) return;

  try {
    const stored = getPersonaName();
    const customers = await getCustomers();
    const current = customers[0];
    input.value = stored || (current && current.full_name) || '';
    setStatus(`Demo customer is currently: ${input.value || '—'}`);
  } catch (e) {
    setStatus('Could not load customer data — type a name and save to set it locally.');
  }

  saveBtn.addEventListener('click', () => save(input.value));
  randomBtn.addEventListener('click', () => {
    const name = randomPersonaName();
    input.value = name;
    save(name);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save(input.value);
  });

  function setStatus(text, ok) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('ok', Boolean(ok));
  }

  async function save(name) {
    const clean = (name || '').trim();
    if (!clean) {
      setStatus('Type a name first.');
      return;
    }
    saveBtn.disabled = true;
    randomBtn.disabled = true;
    setStatus('Saving…');
    try {
      const result = await setPersonaName(clean);
      const extra = result.supabaseUpdated ? '' : ' (saved locally — Supabase not updated)';
      setStatus(`Demo customer is now: ${clean}${extra}`, true);
    } catch (e) {
      setStatus('Could not save — try again.');
    } finally {
      saveBtn.disabled = false;
      randomBtn.disabled = false;
    }
  }
}
