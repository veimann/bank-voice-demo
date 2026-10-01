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

  // Supabase — optional. Leave blank to run on local fallback customer data.
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  CUSTOMERS_TABLE: import.meta.env.VITE_CUSTOMERS_TABLE || 's_pankki_customers',

  // Optional forward-looking hook — see README "Going further".
  SESSION_TABLE: import.meta.env.VITE_SESSION_TABLE || ''
};
