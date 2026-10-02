/* =========================================================================
   ENTRY POINT
   Wires the phone UI to the call/auth logic and starts the presenter
   controls. Kept deliberately thin — each module owns its own behaviour.
   ========================================================================= */
import * as phoneUI from './ui/phone.js';
import { initPresenterControls } from './ui/presenter.js';
import { triggerAuthentication } from './ui/auth.js';
import { startCall, endCall, toggleMicMute } from './integrations/livekit.js';
import { lockCustomerPanel } from './ui/customerPanel.js';
import { clearTranscript } from './ui/transcript.js';
import { initGenesysView } from './ui/genesys.js';
import { applyStoredPersonaIfAny } from './persona.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Apply a persona name saved earlier on the hub page, if any, before the
  // presenter panel's customer picker (and anything else) reads customer data.
  await applyStoredPersonaIfAny();

  phoneUI.initPhoneUI({
    onStart: () => startCall('fi'), // the visible call button always calls the Finnish entry point
    onEnd: () => endCall(),
    onBannerTap: () => triggerAuthentication(),
    onToggleMute: () => toggleMicMute()
  });

  phoneUI.setCallStatus('idle');
  lockCustomerPanel();
  clearTranscript();

  initPresenterControls();
  initGenesysView();
});
