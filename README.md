# boost.ai × S-Pankki RFP Demo

This project is growing into a small multi-page demo hub:

- `index.html` — the hub/homepage. Links out to each part.
- `demo-2.html` — **Part 2: AI Voice Banking** (done, live). A phone-call
  microsite: a live WebRTC call with the boost.ai voice agent (Finnish by
  default), a live transcript, a CIBA-style in-call authentication moment, a
  customer information panel, and a Genesys-style human-handoff view.
- `demo-1.html` — **Part 1: The payment that wasn't hers** (live). A card
  dispute across two days: a live Day-1-evening chat with the real virtual
  agent (boost.ai Chat API v2, opens in the side panel next to the phone, not
  the embeddable widget — full visual control), an inbox screen on the phone
  holding the prerequisite "I think I've been a victim of fraud" message sent
  the evening before, a Day-2-morning push notification ("your new card is on
  its way"), and a Day-2 outbound call — the phone rings, answering it places
  a real outbound LiveKit call (client `SPANKKIRFP`, same session URL as Part
  2, external id `24785a28-7bfd-4bfd-825a-7af57d5564fc`) with its own live
  transcript in the side panel. Every Day-2 beat (push notification, incoming
  call) is a manual presenter hotkey for this version — see the table below.
- `asra.html` — **ASRA Ecosystem Visualization** (live). A 4-slide, keyboard
  step-through of S-Pankki's ASRA RFP material (productivity drivers, scope,
  reference/target architecture deep dive, maturity journey), each slide
  ending on a "boost.ai lens" step. `→`/Space step, `Z` or click to enlarge,
  `F` fullscreen, `1–4` jump, `?` help. Deep link with `#<slide>-<step>`,
  e.g. `/asra.html#3-12`. Content is all in `asra.html`; the generic step
  engine is `src/asra.js`, styles in `src/styles/asra.css`. Scroll/pinch
  zooms the slide at the cursor (drag to move, `0` resets).
- `asra-map.html` — **ASRA Ecosystem Map** (live). A pan/zoom "living" map of
  the ecosystem: channels, boost.ai, ASRA modules (S-Bank's choice, any
  vendor), people, integration layer, core and bank-wide systems. Seven
  concept flows (`1–7`), a boost.ai footprint view (`B`), a guided tour
  (`P`), and a details panel per box. All content — boxes, positions,
  connections, flow texts — is in `src/data/asraMap.js`. Deep links:
  `#flow=conv`, `#node=b-orch`, `#boost`.
- `public/brand/` — boost.ai logo mark (purple + white), used for every
  "boost.ai" marker.

Spoken conversation is Finnish throughout. Every label, button and message in
the interface itself is in English, as requested.

The rest of this README mostly documents **Part 2** (`demo-2.html` and its
`src/` code) — section 2a above covers Part 1's hotkeys specifically.

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

### 2a. Demo 1 hotkeys

Open `demo-1.html`. The phone has its own bottom nav — **Home**, **Messages**,
**Chat** — tap **Chat** to start the real, live Day-1 chat (opens in the side
panel). Everything else is a hidden presenter hotkey, same Shift+P
convention as above:

| Hotkey | Action |
|---|---|
| `Shift+P` | Show/hide the presenter panel (also has a "Callback time" field used in the push notification text, and buttons for everything below) |
| `Shift+N` | Push the Day-2-morning notification (a short teaser banner — tapping it opens the full text: new card ordered and on its way, approximate callback time) |
| `Shift+C` | Ring the phone with the Day-2 incoming call (plays a short ringtone). Tapping **Answer** on screen places the real outbound LiveKit call and opens its live transcript in the side panel; **Decline** just dismisses the ring |
| `Shift+R` | Full reset: ends any active call, hides the notification/ring, returns the phone to the home screen, closes the side panel, and ends the chat conversation so reopening it starts fresh |

The inbox (**Messages** tab) always has the prerequisite message in it —
styled as an in-app secure message, not a text message — that one doesn't
need a hotkey, it's meant to already be there before Day 2 starts.

**End chat**, in the chat panel's own header, ends the live conversation
outright (not just hiding the panel) — useful during rehearsal, since
reopening "Chat" after a RESUME would otherwise replay whatever was said in
the previous run rather than a fresh welcome. Full automation (auto-advancing
the Day-2 beats on a timer instead of a hotkey) is intentionally not built
yet.

## 3. Supabase (optional, recommended before the real demo)

The customer information panel works out of the box using a small local
fallback dataset (two demo customers), so you can rehearse the whole flow
immediately. To show live data from Supabase instead:

1. The project URL is already wired in as a default
   (`https://kuwwxbbsjgtyfrdguzkg.supabase.co`). Still needed, in `.env` (or
   as Netlify env vars for the deployed site):
   ```
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_CUSTOMERS_TABLE=the-real-table-name
   ```
   Use the **anon/publishable key only** — never the service-role key. The
   Supabase dashboard's table editor URL only shows a numeric table id, not
   its name — open the table and check the name shown above the grid (the
   code currently defaults to `s_pankki_customers`; confirm or correct it).

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

3. **Only if you want the hub's "set demo persona" name to also update
   Supabase** (it always updates locally regardless — see section 3b below),
   add a narrow write policy. This only ever allows changing `full_name`,
   never anything else, by combining a column-level grant with a row policy:
   ```sql
   grant update (full_name) on s_pankki_customers to anon;

   create policy "anon can rename the demo customer"
   on s_pankki_customers
   for update
   to anon
   using (true)
   with check (true);
   ```
   Since the anon key ships inside the deployed site's JS bundle (anyone can
   view-source it), anyone could in principle call this endpoint directly.
   The `grant update (full_name)` above limits the blast radius to that one
   column; if you want to go further, scope the policy to one specific row
   instead of `using (true)` — e.g. `using (id = 'the-demo-customer-row-id')`
   — using the actual row id from the table editor.

If Supabase is unreachable at any point (wrong keys, RLS misconfigured, no
network), the app silently falls back to the local demo data — the
presentation never breaks because of it. The presenter panel's status line
tells you which source is active ("Supabase (live)" vs "local fallback").

Only the customer master-data table is used. Loans, collateral, estates,
credit decisions and next-best-offers are deliberately not shown here.

### 3b. Setting the demo persona name

The hub page (`index.html`) has a small "Set up this demo" box: type a name
(or click "Random name") and it becomes the customer's name everywhere —
Demo 1 and Demo 2 both read it. It works in three layers, in order:

1. Saved to the browser's `localStorage`, so it survives navigating between
   pages during the demo.
2. Applied immediately to the in-memory customer cache, so it shows up even
   with no network at all.
3. Sent to Supabase as an `UPDATE … SET full_name = …` on that customer's
   row, **only if** Supabase is configured with the write policy from step 3
   above. If this step fails or isn't configured, 1 and 2 already cover the
   demo — nothing breaks.

See `src/persona.js`.

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
demo-1.html                    — Part 1 (its own entry point, main-demo1.js)
src/
  main.js                     — wires everything together (Part 2)
  main-demo1.js               — wires everything together (Part 1)
  config.js                   — entry-point IDs, Supabase config (env-driven)
  state.js                    — single appState object (Part 2)
  data/
    customers.js              — Supabase-or-fallback customer lookup
    fallbackCustomers.js       — local demo data
  integrations/
    livekit.js                 — WebRTC call, live transcript, agent bridge (Part 2)
    livekitDemo1.js              — Day-2 outbound call (Part 1), same pattern
    chatApi.js                   — boost.ai Chat API v2 client (Part 1, Day 1)
    supabase.js                 — customer fetch + optional session realtime
  ui/
    phone.js                    — phone screen rendering (Part 2)
    phoneDemo1.js                 — phone screen rendering (Part 1): in-app
                                     nav, push banner, ring/in-call views
    sidePanel.js                  — Part 1's side panel mode switching
                                     (placeholder / live chat / call transcript)
    chatPanel.js                  — Part 1's live chat rendering
    transcript.js                — transcript bubbles (Part 2, Finnish labels)
    transcriptDemo1.js            — transcript bubbles (Part 1, English labels)
    auth.js                      — CIBA-style auth state machine (Part 2)
    customerPanel.js              — locked/unlocked customer info panel (Part 2)
    presenter.js                  — hidden hotkeys/panel, full reset (Part 2)
    presenterDemo1.js             — hidden hotkeys/panel, full reset (Part 1)
  styles/
    main.css, phone.css, panels.css, chat.css
```
