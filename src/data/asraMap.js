/* =========================================================================
   ASRA ECOSYSTEM MAP — content
   Everything shown on asra-map.html lives here: zones, nodes, connections
   and the concept "flows". Edit text freely; positions are world units on a
   2080 × 1500 board (x, y = top-left corner).

   node.kind: customer | channel | boost | asra | people | integration |
              core | bankwide | ecosystem
   node.plug: true → shown as an "S-Bank's choice · any vendor" slot
   ========================================================================= */

export const WORLD = { w: 2080, h: 1500 };

export const ZONES = [
  { id: 'z-channels', title: 'Customers & channels', x: 40, y: 70, w: 340, h: 790 },
  { id: 'z-boost', title: 'boost.ai · AI-assisted service', x: 460, y: 70, w: 640, h: 790, boost: true },
  { id: 'z-asra', title: 'ASRA modules · S-Bank’s best-of-breed choice', x: 1180, y: 70, w: 440, h: 790 },
  { id: 'z-people', title: 'People', x: 1700, y: 70, w: 340, h: 790 },
  { id: 'z-eco', title: 'Ecosystem', x: 40, y: 910, w: 340, h: 560 },
  { id: 'z-int', title: 'Integration & service layer', x: 460, y: 910, w: 1580, h: 160, band: true },
  { id: 'z-core', title: 'Core systems · systems of record', x: 460, y: 1110, w: 1580, h: 160, band: true },
  { id: 'z-bank', title: 'Bank-wide capabilities', x: 460, y: 1310, w: 1580, h: 160, band: true }
];

const CH = { x: 70, w: 280, h: 76 };
const BX1 = 490, BX2 = 790, BW = 280, BH = 92;
const AX = 1210, AW = 380, AH = 100;
const PX = 1730, PW = 280, PH = 84;

export const NODES = [
  /* ---------------- customers & channels ---------------- */
  { id: 'customer', kind: 'customer', title: 'Customer', x: CH.x, y: 130, w: CH.w, h: CH.h,
    desc: 'S-Bank’s customers — many of them S-Group co-op members — reaching out on whatever channel suits them.',
    role: 'Gets one conversation that remembers them, wherever they continue it.' },
  { id: 'ch-mobile', kind: 'channel', title: 'S-mobile', x: CH.x, y: 240, w: CH.w, h: CH.h,
    desc: 'The S-Bank app: in-app chat, push notifications and authenticated self-service.',
    role: 'boost.ai AI agent embedded in the app, already knowing who the customer is.' },
  { id: 'ch-netbank', kind: 'channel', title: 'Netbank & secure messages', x: CH.x, y: 336, w: CH.w, h: CH.h,
    desc: 'Logged-in web bank and secure messaging.',
    role: 'Same AI agent and the same conversation history as in the app.' },
  { id: 'ch-chat', kind: 'channel', title: 'Web chat · s-pankki.fi', x: CH.x, y: 432, w: CH.w, h: CH.h,
    desc: 'Public website chat for prospects and customers who are not logged in.',
    role: 'AI agent answers product questions and steps up to authentication when needed.' },
  { id: 'ch-voice', kind: 'channel', title: 'Voice / phone', x: CH.x, y: 528, w: CH.w, h: CH.h,
    desc: 'Customer service phone line and call center.',
    role: 'boost.ai voice agent answers in natural language before any queue.' },
  { id: 'ch-branch', kind: 'channel', title: 'Physical branches', x: CH.x, y: 624, w: CH.w, h: CH.h,
    desc: 'In-person appointments and branch service.',
    role: 'Branch staff can use the same knowledge and agent assist as the contact center.' },
  { id: 'ch-other', kind: 'channel', title: 'Other & new channels', x: CH.x, y: 720, w: CH.w, h: CH.h,
    desc: 'Email, messaging apps and whatever comes next.',
    role: 'One agent built once, published to new channels without a rebuild.' },

  /* ---------------- boost.ai ---------------- */
  { id: 'b-chat', kind: 'boost', title: 'AI agent · chat & messaging', x: BX1, y: 140, w: BW, h: BH,
    desc: 'Resolves customer requests in S-mobile, netbank and web chat — in the customer’s language.',
    role: 'boost.ai core product.' },
  { id: 'b-voice', kind: 'boost', title: 'AI agent · voice', x: BX2, y: 140, w: BW, h: BH,
    desc: 'Natural-language voice agent on the phone line: understands, authenticates, resolves or routes.',
    role: 'boost.ai core product — the same brain as chat.' },
  { id: 'b-orch', kind: 'boost', title: 'Agentic orchestration', x: BX1, y: 264, w: BX2 + BW - BX1, h: 104,
    desc: 'Understands intent, plans the next step and calls the right tools, APIs and agents — deciding when to resolve and when to hand over to a human.',
    role: 'The heart of boost.ai: deterministic where it must be, generative where it helps.' },
  { id: 'b-know', kind: 'boost', title: 'Knowledge & grounded GenAI', x: BX1, y: 400, w: BW, h: BH,
    desc: 'Retrieves from S-Bank’s approved knowledge and generates answers grounded in it — using the bank’s approved models.',
    role: 'Every generated answer can be traced back to approved content.' },
  { id: 'b-assist', kind: 'boost', title: 'Agent assist', x: BX2, y: 400, w: BW, h: BH,
    desc: 'Gives human experts suggested answers, summaries and next steps from the same knowledge and context.',
    role: 'Makes the human hand-off faster, not just possible.' },
  { id: 'b-proactive', kind: 'boost', title: 'Proactive outreach', x: BX1, y: 524, w: BW, h: BH,
    desc: 'Starts the conversation when something happens — a push message, an in-app chat or an outbound call.',
    role: 'Moves S-Bank from “answer when asked” to “act before asked”.' },
  { id: 'b-insight', kind: 'boost', title: 'Insights & analytics', x: BX2, y: 524, w: BW, h: BH,
    desc: 'Intent, containment and resolution data from every conversation.',
    role: 'Feeds forecasting, content work and product decisions.' },
  { id: 'b-guard', kind: 'boost', title: 'Guardrails & governance', x: BX1, y: 648, w: BX2 + BW - BX1, h: 92,
    desc: 'Access control, data protection, audit trails and controlled GenAI behaviour — built for regulated banking.',
    role: 'Every answer and action is explainable and auditable.' },

  /* ---------------- ASRA modules (pluggable) ---------------- */
  { id: 'a-view', kind: 'asra', plug: true, title: 'Common customer view', x: AX, y: 140, w: AW, h: AH,
    desc: 'Real-time situational overview: shared interaction history, open and planned activities, events, ownership and documents.',
    role: 'boost.ai reads it to personalise the conversation — and writes back what happened, so every channel sees it.' },
  { id: 'a-cc', kind: 'asra', plug: true, title: 'Omnichannel contact center', x: AX, y: 290, w: AW, h: AH,
    desc: 'Voice, chat, email and messaging. Routing, queue management, recording and the agent desktop.',
    role: 'boost.ai is the first line in chat and voice and hands over with the full conversation, intent and context — no repeating.' },
  { id: 'a-case', kind: 'asra', plug: true, title: 'Case management & orchestration', x: AX, y: 440, w: AW, h: AH,
    desc: 'Case status, SLA management, routing, auditing and traceability.',
    role: 'boost.ai opens, enriches and updates cases straight from the conversation — and lets customers ask for status any time.' },
  { id: 'a-kb', kind: 'asra', plug: true, title: 'Knowledge base', x: AX, y: 590, w: AW, h: AH,
    desc: 'Knowledge creation, maintenance and retrieval — used by representatives, agents, bots and channels.',
    role: 'boost.ai can retrieve from S-Bank’s chosen knowledge base, keeping humans and AI on one source of truth.' },
  { id: 'a-wem', kind: 'asra', plug: true, title: 'Workforce engagement management', x: AX, y: 740, w: AW, h: AH - 10,
    desc: 'Workforce scheduling, demand forecasting, quality, performance management and coaching.',
    role: 'Not a boost.ai product. boost.ai feeds it intent and demand signals — and contained volume flattens the peaks.' },

  /* ---------------- people ---------------- */
  { id: 'p-experts', kind: 'people', title: 'Customer service experts', x: PX, y: 298, w: PW, h: PH,
    desc: 'One pool of experts across channels (phased), allocated on demand and skills.',
    role: 'Receive warm hand-offs with context, supported by agent assist.' },
  { id: 'p-back', kind: 'people', title: 'Back-office & specialist teams', x: PX, y: 448, w: PW, h: PH,
    desc: 'Disputes, lending, estates and other specialist case work.',
    role: 'Get structured cases instead of free-text emails.' },
  { id: 'p-know', kind: 'people', title: 'Knowledge owners', x: PX, y: 598, w: PW, h: PH,
    desc: 'Product and process owners who keep content correct and approved.',
    role: 'See which questions the AI cannot answer yet — and fix the content once.' },
  { id: 'p-wfm', kind: 'people', title: 'Workforce planners & team leads', x: PX, y: 744, w: PW, h: PH,
    desc: 'Plan capacity, quality and coaching.',
    role: 'Plan with real intent data instead of call volumes alone.' },

  /* ---------------- ecosystem ---------------- */
  { id: 'e-sgroup', kind: 'ecosystem', title: 'S-Group ecosystem', x: CH.x, y: 970, w: CH.w, h: 92,
    desc: 'S-market, Prisma, Alepa, Sale, ABC and the wider co-op — plus S-Group common services.',
    role: 'Co-op membership and benefits become context for the conversation.' },
  { id: 'e-partner', kind: 'ecosystem', title: 'Partner ecosystem', x: CH.x, y: 1110, w: CH.w, h: 92,
    desc: 'Value-add services and insurance, authorities, other financial institutions, IT suppliers.',
    role: 'Partner services can be reached as tools through the integration layer.' },
  { id: 'e-cyber', kind: 'ecosystem', title: 'Cybersecurity', x: CH.x, y: 1250, w: CH.w, h: 92,
    desc: 'Spans every layer of the reference architecture.',
    role: 'boost.ai runs inside S-Bank’s security model, not beside it.' },

  /* ---------------- integration & service layer ---------------- */
  { id: 'i-api', kind: 'integration', title: 'APIs', x: 490, y: 966, w: 280, h: 80,
    desc: 'Bank service APIs exposed through the integration layer.',
    role: 'boost.ai calls them as actions — check a payment, block a card, open a case.' },
  { id: 'i-mcp', kind: 'integration', title: 'MCP servers', x: 800, y: 966, w: 280, h: 80,
    desc: 'Model Context Protocol: a standard way to expose bank tools and data to AI agents.',
    role: 'boost.ai agents can use MCP-exposed tools without custom point-to-point work.' },
  { id: 'i-ctx', kind: 'integration', title: 'Customer context', x: 1110, y: 966, w: 280, h: 80,
    desc: 'Who is this customer, what is open and what happened recently.',
    role: 'Lets the AI agent start the conversation already informed.' },
  { id: 'i-ai', kind: 'integration', title: 'AI services', x: 1420, y: 966, w: 280, h: 80,
    desc: 'Shared AI services that any channel or system can reuse.',
    role: 'boost.ai can consume — and contribute — reusable AI services.' },
  { id: 'i-data', kind: 'integration', title: 'Microservices & data integrations', x: 1730, y: 966, w: 280, h: 80,
    desc: 'Microservices and data pipelines connecting services, processes and data.',
    role: 'Conversation data leaves boost.ai in open formats.' },

  /* ---------------- core systems (systems of record) ---------------- */
  { id: 'c-crm', kind: 'core', title: 'Customer data (CRM)', x: 490, y: 1166, w: 232, h: 80, desc: 'Customer master data and relationship.' },
  { id: 'c-pay', kind: 'core', title: 'Accounts & payments', x: 748, y: 1166, w: 232, h: 80, desc: 'Accounts, transfers and payment history.' },
  { id: 'c-cards', kind: 'core', title: 'Cards', x: 1006, y: 1166, w: 232, h: 80, desc: 'Card lifecycle, limits, blocking and transactions.' },
  { id: 'c-lend', kind: 'core', title: 'Lending', x: 1264, y: 1166, w: 232, h: 80, desc: 'Loans, applications and credit decisions.' },
  { id: 'c-wealth', kind: 'core', title: 'Wealth & asset mgmt.', x: 1522, y: 1166, w: 232, h: 80, desc: 'Funds, savings and investment services.' },
  { id: 'c-doc', kind: 'core', title: 'Document management', x: 1780, y: 1166, w: 232, h: 80, desc: 'Agreements, statements and customer documents.' },

  /* ---------------- bank-wide ---------------- */
  { id: 'x-iam', kind: 'bankwide', title: 'Identity & access', x: 490, y: 1366, w: 280, h: 80,
    desc: 'Strong customer authentication and employee access management.',
    role: 'boost.ai triggers strong authentication mid-conversation and respects every entitlement.' },
  { id: 'x-event', kind: 'bankwide', title: 'Event backbone', x: 800, y: 1366, w: 280, h: 80,
    desc: 'Transaction and lifecycle events published across the bank.',
    role: 'Events become triggers for proactive service.' },
  { id: 'x-data', kind: 'bankwide', title: 'Data platform', x: 1110, y: 1366, w: 280, h: 80,
    desc: 'Bank-wide analytics and data products.',
    role: 'Conversation insight lands next to the rest of the bank’s data.' },
  { id: 'x-ai', kind: 'bankwide', title: 'Bank’s common AI platform', x: 1420, y: 1366, w: 280, h: 80,
    desc: 'The bank’s approved models and AI tooling.',
    role: 'boost.ai can use the bank’s approved models instead of locking S-Bank into one.' },
  { id: 'x-audit', kind: 'bankwide', title: 'Auditing & security', x: 1730, y: 1366, w: 280, h: 80,
    desc: 'Audit trail, monitoring and reporting.',
    role: 'Every AI decision is logged where S-Bank already looks.' }
];

/* Flows = concepts, not customer journeys. Each connection belongs to one. */
export const FLOWS = [
  { id: 'conv', key: '1', title: 'Conversations', color: '#3ee27e',
    lead: 'Every conversation starts with the AI agent — on any channel.',
    text: 'Chat and voice meet the same boost.ai agent. It resolves what it can end-to-end, and when a human is needed it hands over warmly into S-Bank’s contact center, with the full conversation and context attached.' },
  { id: 'ctx', key: '2', title: 'Context & data', color: '#4fb3ff',
    lead: 'The agent acts on real data — through S-Bank’s own integration layer.',
    text: 'boost.ai reads and writes the common customer view and calls bank APIs and MCP tools to look things up and get things done. Core systems stay the systems of record; boost.ai never needs to own the data.' },
  { id: 'know', key: '3', title: 'Knowledge', color: '#ffd166',
    lead: 'One source of truth for humans and AI.',
    text: 'Knowledge owners maintain approved content once. boost.ai grounds every generated answer in it — for customers through the AI agent and for employees through agent assist — using the bank’s approved models.' },
  { id: 'case', key: '4', title: 'Cases & work', color: '#ff9f6b',
    lead: 'Conversations become cases, not re-keying.',
    text: 'When something needs follow-up, boost.ai opens or updates the case directly. The same case follows the customer across channels, and work lands in the right queue for the right expert.' },
  { id: 'trust', key: '5', title: 'Identity & trust', color: '#c8a2ff',
    lead: 'Built for regulated banking.',
    text: 'Strong customer authentication can be triggered mid-conversation. Guardrails control what the AI may say and do, and every decision is logged into S-Bank’s auditing and security.' },
  { id: 'insight', key: '6', title: 'Insights & learning', color: '#5ce1e6',
    lead: 'Every conversation makes the operating model smarter.',
    text: 'Intent, containment and resolution data flows into the data platform and workforce planning, and shows knowledge owners exactly where content is missing.' },
  { id: 'proactive', key: '7', title: 'Proactive service', color: '#ff6fb5',
    lead: 'From answering to anticipating.',
    text: 'Events from core systems flow through the event backbone and trigger boost.ai to reach out first — a push, an in-app conversation or an outbound call — with a human as escalation.' }
];

/* [from, to, flow, label] */
export const EDGES = [
  // conversations
  ['customer', 'ch-mobile', 'conv'], ['customer', 'ch-netbank', 'conv'], ['customer', 'ch-chat', 'conv'],
  ['customer', 'ch-voice', 'conv'], ['customer', 'ch-branch', 'conv'], ['customer', 'ch-other', 'conv'],
  ['ch-mobile', 'b-chat', 'conv', 'in-app chat'], ['ch-netbank', 'b-chat', 'conv'], ['ch-chat', 'b-chat', 'conv'],
  ['ch-other', 'b-chat', 'conv'], ['ch-voice', 'b-voice', 'conv', 'calls'],
  ['b-chat', 'b-orch', 'conv'], ['b-voice', 'b-orch', 'conv'],
  ['b-orch', 'a-cc', 'conv', 'warm handoff + context'], ['a-cc', 'p-experts', 'conv', 'routed to the right expert'],

  // context & data
  ['b-orch', 'a-view', 'ctx', 'reads & writes context'], ['b-orch', 'i-api', 'ctx', 'actions'], ['b-orch', 'i-mcp', 'ctx', 'tools'],
  ['i-ctx', 'a-view', 'ctx'], ['c-crm', 'i-ctx', 'ctx'],
  ['i-api', 'c-pay', 'ctx'], ['i-api', 'c-cards', 'ctx'], ['i-mcp', 'c-lend', 'ctx'], ['i-mcp', 'c-wealth', 'ctx'], ['i-data', 'c-doc', 'ctx'],
  ['e-sgroup', 'i-api', 'ctx', 'S-Group common services'], ['e-partner', 'i-api', 'ctx', 'partner services'],

  // knowledge
  ['p-know', 'a-kb', 'know', 'author & approve'], ['a-kb', 'b-know', 'know', 'approved content'],
  ['b-know', 'b-orch', 'know', 'grounded answers'], ['b-know', 'b-assist', 'know'],
  ['b-assist', 'p-experts', 'know', 'suggested answers'], ['x-ai', 'b-know', 'know', 'bank’s approved models'],

  // cases & work
  ['b-orch', 'a-case', 'case', 'create & update cases'], ['a-cc', 'a-case', 'case', 'one case, any channel'],
  ['a-case', 'p-back', 'case', 'work queues'], ['a-case', 'a-view', 'case', 'case status'],
  ['a-wem', 'p-experts', 'case', 'schedules & skills'], ['p-wfm', 'a-wem', 'case'],

  // identity & trust
  ['b-orch', 'x-iam', 'trust', 'strong authentication'], ['b-guard', 'b-orch', 'trust', 'policies'],
  ['b-guard', 'x-audit', 'trust', 'audit trail'], ['e-cyber', 'x-iam', 'trust'],

  // insights
  ['b-orch', 'b-insight', 'insight'], ['b-insight', 'x-data', 'insight', 'conversation data'],
  ['b-insight', 'a-wem', 'insight', 'intent & demand signals'], ['b-insight', 'p-know', 'insight', 'content gaps'],
  ['b-insight', 'i-data', 'insight'],

  // proactive
  ['c-cards', 'x-event', 'proactive', 'transaction events'], ['c-pay', 'x-event', 'proactive'],
  ['x-event', 'b-proactive', 'proactive', 'trigger'], ['b-proactive', 'b-orch', 'proactive'],
  ['b-proactive', 'ch-mobile', 'proactive', 'push'], ['b-proactive', 'ch-voice', 'proactive', 'outbound call']
];

export const KIND_LABEL = {
  customer: 'Customer',
  channel: 'Channel',
  boost: 'boost.ai',
  asra: 'ASRA module',
  people: 'People',
  integration: 'Integration layer',
  core: 'Core system',
  bankwide: 'Bank-wide capability',
  ecosystem: 'Ecosystem'
};
