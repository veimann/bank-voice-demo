# S-Pankki Voice Banking — Part 2 Demo

A phone-call microsite for the S-Pankki RFP voice demo: a live WebRTC call with
the boost.ai voice agent (Finnish by default), a live transcript, a CIBA-style
in-call authentication moment, and a customer information panel that unlocks
once authenticated.

Spoken conversation is Finnish. Every label, button and message in the
interface itself is in English, as requested.

## 1. Prerequisites

- Node.js 18+ (20 recommended — see `.nvmrc`)
- A terminal (`npm install`, `npm run dev`)

## 2. Run it locally

```bash
npm install
cp .env.example .env     # optional — see "Supabase" below
npm run dev
```

Open the local URL Vite prints (something like `http://localhost:5173`).
**Microphone access requires HTTPS or localhost** — `npm run dev` serves over
localhost, so that's fine. A Netlify deploy is HTTPS by default too.

Click the green call button to call the Finnish entry point. Press
**Shift+P** to reveal the hidden presenter panel (customer picker + buttons
for everything below), or use the hotkeys directly:

| Hotkey | Action |
|---|---|
| `Shift+P` | Show/hide the presenter panel |
| `Shift+A` | Trigger authentication (press once to show the phone notification, press again — or click the notification on screen — to run Face ID and unlock the customer panel) |
| `Shift+E` | Start the hidden English test call (for your own testing only — the visible button always calls Finnish) |
| `Shift+R` | Full reset: ends the call, stops the mic, clears the transcript, resets authentication and the customer panel, and returns to the Finnish idle state — no page reload needed |

## 3. Supabase (optional, recommended before the real demo)

The customer information panel works out of the box using a small local
fallback dataset (two demo customers), so you can rehearse the whole flow
immediately. To show live data from Supabase instead:

1. In `.env`, set:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_CUSTOMERS_TABLE=s_pankki_customers
   ```
   Use the **anon/publishable key only** — never the service-role key.

2. Make sure Row Level Security allows **read-only** access to just the
   columns the panel needs:
   ```sql
   alter table s_pankki_customers enable row level security;

   create policy "anon can read customer master data"
   on s_pankki_customers
   for select
   to anon
   using (true);
   ```
   If you'd rather not expose the whole table shape, create a narrow view
   instead and point `VITE_CUSTOMERS_TABLE` at it:
   ```sql
   create view customers_public as
     select id, personal_id, full_name, date_of_birth, phone, email, customer_segment
     from s_pankki_customers;

   grant select on customers_public to anon;
   ```

If Supabase is unreachable at any point (wrong keys, RLS misconfigured, no
network), the app silently falls back to the local demo data — the
presentation never breaks because of it. The presenter panel's status line
tells you which source is active ("Supabase (live)" vs "local fallback").

Only the customer master-data table is used. Loans, collateral, estates,
credit decisions and next-best-offers are deliberately not shown here.

## 4. Deploy to Netlify

```bash
netlify deploy --prod
```

or connect the repo in the Netlify UI — `netlify.toml` already points at
`npm install && npm run build` and publishes `dist/`. Either way, set the
same environment variables from `.env` in the Netlify site's **Site settings
→ Environment variables** (Netlify doesn't read your local `.env` file).

## 5. How authentication works

The sequence matches a CIBA-style out-of-band approval:

1. **Initiated** — a push-style notification slides down inside the phone
   screen ("S-Pankki — tap to verify your identity").
2. **Opened** — tapping the notification (or pressing the auth hotkey a
   second time) starts a Face ID–style scanning animation.
3. **Authenticated** — on success, the customer information panel unlocks
   with that customer's details.

This is driven by one small state machine (`src/ui/auth.js`) with three
functions — `initiateAuthentication()`, `openAuthenticationPrompt()`, and the
convenience wrapper `triggerAuthentication()` that advances one step each
call. All three entry points below call into the *same* state machine, so
nothing is hard-wired to the keyboard:

- the hidden presenter hotkey/panel,
- an `authenticate` / `authentication_initiated` message sent by the Boost
  agent over the LiveKit data channel during a real call (already wired in
  `src/integrations/livekit.js`),
- and, if you add a session-state table later (see below), a Supabase
  realtime update.

Authentication state lives only in the browser tab for the current call —
nothing is ever written back to the customer table as a permanent flag.

## 6. Going further: backend-driven authentication

Right now authentication is triggered by the presenter. To let the Boost
backend trigger it automatically instead (e.g. once your agent's CIBA flow
resolves), you have two options that both already work with this frontend
without code changes:

**Option A — LiveKit data message** (simplest): have the agent/backend send
a data message on the room with `{"action": "authenticate", "payload": {"customer_id": "..."}}`
(or `authentication_initiated` to just show the notification first). This is
already handled in `src/integrations/livekit.js`.

**Option B — Supabase session table**: create a small table, e.g.:

```sql
create table call_sessions (
  room text primary key,
  customer_id uuid,
  authentication_initiated boolean default false,
  authenticated boolean default false,
  updated_at timestamptz default now()
);
```

Set `VITE_SESSION_TABLE=call_sessions` in your environment. The frontend will
then open a realtime subscription filtered to the current LiveKit room name
(decoded from the session JWT) and call the same authentication functions
whenever your backend updates that row. Until you set this variable, the
app never touches this table — nothing extra is created or required.

## 7. Reliability notes

The demo is built to keep going rather than get stuck:

- Denied/missing microphone, failed session requests, and dropped
  connections all show a short inline message on the phone and return it to
  the idle state — never a frozen "Connecting…".
- Starting a new call always cleans up any previous one first.
- Supabase being unreachable falls back to local data automatically.
- `Shift+R` is a hard reset you can use at any point, including mid-call.

## 8. Project structure

```
index.html
src/
  main.js                     — wires everything together
  config.js                   — entry-point IDs, Supabase config (env-driven)
  state.js                    — single appState object
  data/
    customers.js              — Supabase-or-fallback customer lookup
    fallbackCustomers.js       — local demo data
  integrations/
    livekit.js                 — WebRTC call, live transcript, agent bridge
    supabase.js                 — customer fetch + optional session realtime
  ui/
    phone.js                    — phone screen rendering
    transcript.js                — transcript bubbles
    auth.js                      — CIBA-style auth state machine
    customerPanel.js              — locked/unlocked customer info panel
    presenter.js                  — hidden hotkeys/panel, full reset
  styles/
    main.css, phone.css, panels.css
```
