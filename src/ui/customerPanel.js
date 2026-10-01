/* =========================================================================
   CUSTOMER INFORMATION PANEL
   Locked by default; unlocks once the auth state machine confirms
   authentication for THIS call. Never shows the raw database id.
   ========================================================================= */
const DEFAULT_LOCKED_TEXT = 'Sign in through the S-Pankki app notification to view customer details.';

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function lockCustomerPanel() {
  const locked = document.getElementById('infoLocked');
  const unlocked = document.getElementById('infoUnlocked');
  if (locked) {
    locked.hidden = false;
    setText('infoLockedText', DEFAULT_LOCKED_TEXT);
  }
  if (unlocked) unlocked.hidden = true;
}

export function showCustomerLoading() {
  const locked = document.getElementById('infoLocked');
  if (locked) {
    locked.hidden = false;
    setText('infoLockedText', 'Loading customer information…');
  }
}

export function showCustomerError() {
  const locked = document.getElementById('infoLocked');
  if (locked) {
    locked.hidden = false;
    setText('infoLockedText', 'Customer information is temporarily unavailable.');
  }
}

export function unlockCustomerPanel(customer) {
  const locked = document.getElementById('infoLocked');
  const unlocked = document.getElementById('infoUnlocked');
  if (locked) locked.hidden = true;
  if (!unlocked) return;
  unlocked.hidden = false;

  const initials = (customer.full_name || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  setText('infoAvatar', initials || '?');
  setText('infoName', customer.full_name || 'Unknown customer');
  setText('infoPersonalId', customer.personal_id || '—');
  setText('infoDob', formatDate(customer.date_of_birth));
  setText('infoPhone', customer.phone || '—');
  setText('infoEmail', customer.email || '—');
  setText('infoSegment', formatSegment(customer.customer_segment));
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return value;
  }
}

function formatSegment(value) {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
