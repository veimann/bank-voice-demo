/* =========================================================================
   STATE
   Single source of truth for the demo. Nothing here is persisted anywhere —
   it all lives for the lifetime of the browser tab, which is what lets the
   presenter reset() and run the demo again without a page reload.
   ========================================================================= */
export const appState = {
  language: 'fi', // 'fi' (default/visible) | 'en' (hidden presenter test mode)

  call: {
    status: 'idle', // idle | connecting | active
    room: null, // LiveKit room name, decoded from the session JWT once connected
    startedAt: null
  },

  auth: {
    status: 'idle', // idle | initiated | scanning | authenticated
    customerId: null,
    pendingCustomerId: null,
    customer: null // the resolved customer record, once authenticated — reused by the Genesys handoff view
  }
};
