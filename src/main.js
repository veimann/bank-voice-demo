/* =========================================================================
   ENTRY POINT
   Wires the phone UI to the call/auth logic and starts the presenter
   controls. Kept deliberately thin — each module owns its own behaviour.
   ========================================================================= */
import * as phoneUI from './ui/phone.js';
import { initPresenterControls } from './ui/presenter.js';
import { triggerAuthentication } from './ui/auth.js';
import { startCall, endCall } from './integrations/livekit.js';
import { lockCustomerPanel } from './ui/customerPanel.js';
import { clearTranscript } from './ui/transcript.js';

document.addEventListener('DOMContentLoaded', () => {
  phoneUI.initPhoneUI({
    onStart: () => startCall('fi'), // the visible call button always calls the Finnish entry point
    onEnd: () => endCall(),
    onBannerTap: () => triggerAuthentication()
  });

  phoneUI.setCallStatus('idle');
  lockCustomerPanel();
  clearTranscript();

  initPresenterControls();
});
