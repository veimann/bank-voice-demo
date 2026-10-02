/* =========================================================================
   CONFIG
   All values can be overridden with environment variables (see .env.example)
   but ship with working defaults for the SPANKKIRFP boost.ai client so the
   demo runs out of the box.
   ========================================================================= */
export const CONFIG = {
  VOICE_SESSION_URL:
    import.meta.env.VITE_VOICE_SESSION_URL || 'https://SPANKKIRFP.boost.ai/api/voice/v1/session',
  VOICE_EXTERNAL_ID_FI:
    import.meta.env.VITE_VOICE_EXTERNAL_ID_FI || 'b46a8cb8-cdd9-492c-ac9b-1f77a3e5552f',
  VOICE_EXTERNAL_ID_EN:
    import.meta.env.VITE_VOICE_EXTERNAL_ID_EN || '4613c31b-82f7-4d84-855c-8aecf297e084',

  // Demo 1 — Day 2 outbound call (same client/session URL pattern as above,
  // different entry point). Not wired into any UI yet.
  VOICE_EXTERNAL_ID_DEMO1_DAY2:
    import.meta.env.VITE_VOICE_EXTERNAL_ID_DEMO1_DAY2 || '24785a28-7bfd-4bfd-825a-7af57d5564fc',

  // Demo 1 — Day 1 live webchat (boost.ai Chat API v2), used by demo-1.html.
  CHAT_API_URL:
    import.meta.env.VITE_CHAT_API_URL || 'https://spankkirfp.boost.ai/api/chat/v2',

  // Supabase — this is the new-style "publishable" key (sb_publishable_...),
  // which is Supabase's current name for what used to be called the anon
  // key: it's meant to be shipped in frontend bundles (same as before, data
  // access is controlled by RLS, not by keeping this secret). Never put a
  // sb_secret_... key or the old service-role key here.
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://kuwwxbbsjgtyfrdguzkg.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Egtb64ftjnezLae9vTAfjQ_vXYC51YO',
  CUSTOMERS_TABLE: import.meta.env.VITE_CUSTOMERS_TABLE || 's_pankki_customers',

  // Optional forward-looking hook — see README "Going further".
  SESSION_TABLE: import.meta.env.VITE_SESSION_TABLE || ''
};
