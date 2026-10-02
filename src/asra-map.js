/* =========================================================================
   ASRA ECOSYSTEM MAP — engine
   Renders src/data/asraMap.js onto a pan/zoom board:
     · zones + nodes as HTML, connections as SVG curves
     · flows (concepts) highlight their connections with moving dots
     · click a node → details, boost.ai's role, its connections
     · scroll/pinch zoom at cursor, drag to pan, semantic zoom (more text
       appears as you zoom in), guided tour through all flows
   URL hash: #flow=<id> or #node=<id> for deep links.
   ========================================================================= */
import { WORLD, ZONES, NODES, FLOWS, EDGES, KIND_LABEL } from './data/asraMap.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

const map = document.getElementById('map');
const world = document.getElementById('world');
const edgeSvg = document.getElementById('edges');
const labelSvg = document.getElementById('labels');
const zonesEl = document.getElementById('zones');
const nodesEl = document.getElementById('nodes');
const panel = document.getElementById('panel');
const panelBody = document.getElementById('panelBody');
const flowList = document.getElementById('flowList');
const zoomPct = document.getElementById('zoomPct');
const intro = document.getElementById('intro');
const helpEl = document.getElementById('help');
const tourLabel = document.getElementById('tourLabel');
const btnTour = document.getElementById('btnTour');
const btnFootprint = document.getElementById('btnFootprint');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PANEL_W = 380;
const Z_MIN = 0.2;
const Z_MAX = 2.6;

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const flowById = Object.fromEntries(FLOWS.map((f) => [f.id, f]));
const edges = EDGES.map(([from, to, flow, label], i) => ({ id: `e${i}`, from, to, flow, label }));
const isBoost = (id) => byId[id] && byId[id].kind === 'boost';

const state = { flow: null, node: null, footprint: false };

/* ======================================================= geometry */
const cx = (n) => n.x + n.w / 2;
const cy = (n) => n.y + n.h / 2;

function corridorBlocked(a, b) {
  // Is any other node sitting in the vertical corridor between a and b?
  const x0 = Math.max(a.x, b.x);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const top = Math.min(a.y + a.h, b.y + b.h);
  const bot = Math.max(a.y, b.y);
  return NODES.some((n) => n !== a && n !== b
    && n.x < x1 && n.x + n.w > x0 && n.y < bot && n.y + n.h > top);
}

function chooseSides(a, b) {
  const dx = cx(b) - cx(a);
  const dy = cy(b) - cy(a);
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  if (overlapX > 20) {
    if (corridorBlocked(a, b)) {
      // loop around the side where the two boxes line up best
      const dl = Math.abs(a.x - b.x);
      const dr = Math.abs(a.x + a.w - b.x - b.w);
      let side = dl < dr ? 'left' : 'right';
      if (Math.abs(dl - dr) < 1) side = cx(a) < WORLD.w / 2 ? 'left' : 'right';
      return { s1: side, s2: side, loop: true };
    }
    return dy > 0 ? { s1: 'bottom', s2: 'top' } : { s1: 'top', s2: 'bottom' };
  }
  if (Math.abs(dy) <= Math.abs(dx) * 2.2) {
    return dx > 0 ? { s1: 'right', s2: 'left' } : { s1: 'left', s2: 'right' };
  }
  return dy > 0 ? { s1: 'bottom', s2: 'top' } : { s1: 'top', s2: 'bottom' };
}

const NORMAL = { right: [1, 0], left: [-1, 0], bottom: [0, 1], top: [0, -1] };

function layoutEdges() {
  // decide sides
  edges.forEach((e) => {
    const a = byId[e.from];
    const b = byId[e.to];
    Object.assign(e, chooseSides(a, b));
  });
  // distribute anchors along each node side
  const slots = {};
  const push = (nodeId, side, e, end, other) => {
    const k = `${nodeId}:${side}`;
    (slots[k] = slots[k] || []).push({ e, end, other });
  };
  edges.forEach((e) => {
    push(e.from, e.s1, e, 1, byId[e.to]);
    push(e.to, e.s2, e, 2, byId[e.from]);
  });
  Object.entries(slots).forEach(([k, list]) => {
    const [nodeId, side] = k.split(':');
    const n = byId[nodeId];
    const vertical = side === 'left' || side === 'right';
    list.sort((p, q) => (vertical ? cy(p.other) - cy(q.other) : cx(p.other) - cx(q.other)));
    list.forEach((slot, i) => {
      const t = (i + 1) / (list.length + 1);
      let x, y;
      if (side === 'left') { x = n.x; y = n.y + n.h * t; }
      if (side === 'right') { x = n.x + n.w; y = n.y + n.h * t; }
      if (side === 'top') { x = n.x + n.w * t; y = n.y; }
      if (side === 'bottom') { x = n.x + n.w * t; y = n.y + n.h; }
      slot.e[`p${slot.end}`] = [x, y];
    });
  });
  // bezier paths
  edges.forEach((e) => {
    const [x1, y1] = e.p1;
    const [x2, y2] = e.p2;
    const n1 = NORMAL[e.s1];
    const n2 = NORMAL[e.s2];
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const k = e.loop ? 50 + Math.abs(y2 - y1) * 0.12 : Math.max(40, Math.min(240, dist * 0.42));
    e.d = `M${x1},${y1} C${x1 + n1[0] * k},${y1 + n1[1] * k} ${x2 + n2[0] * k},${y2 + n2[1] * k} ${x2},${y2}`;
  });
}

/* ======================================================= render */
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
function svg(tag, attrs = {}) {
  const n = document.createElementNS(SVGNS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
}

function render() {
  world.style.width = `${WORLD.w}px`;
  world.style.height = `${WORLD.h}px`;
  [edgeSvg, labelSvg].forEach((s) => {
    s.setAttribute('width', WORLD.w);
    s.setAttribute('height', WORLD.h);
    s.setAttribute('viewBox', `0 0 ${WORLD.w} ${WORLD.h}`);
  });

  ZONES.forEach((z) => {
    const d = el('div', `zone${z.boost ? ' zone-boost' : ''}${z.band ? ' zone-band' : ''}`);
    Object.assign(d.style, { left: `${z.x}px`, top: `${z.y}px`, width: `${z.w}px`, height: `${z.h}px` });
    d.innerHTML = `<span class="zone-title">${z.boost ? '<i class="mark"></i>' : ''}${z.title}</span>`;
    zonesEl.appendChild(d);
  });

  NODES.forEach((n) => {
    const d = el('button', `node k-${n.kind}${n.plug ? ' plug' : ''}`);
    d.type = 'button';
    d.dataset.id = n.id;
    Object.assign(d.style, { left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: `${n.h}px` });
    const kind = n.kind === 'boost'
      ? '<span class="n-kind"><i class="mark"></i>boost.ai</span>'
      : `<span class="n-kind">${KIND_LABEL[n.kind]}</span>`;
    const badge = n.plug
      ? '<span class="n-badge">Any vendor</span>'
      : n.kind === 'core' ? '<span class="n-badge core">System of record</span>' : '';
    d.innerHTML = `${kind}${badge}<span class="n-title">${n.title}</span><span class="n-desc">${n.desc || ''}</span>`;
    nodesEl.appendChild(d);
  });

  const defs = svg('defs');
  edgeSvg.appendChild(defs);
  edges.forEach((e) => {
    const p = svg('path', { id: e.id, d: e.d, class: 'edge', 'data-flow': e.flow });
    p.style.setProperty('--c', flowById[e.flow].color);
    edgeSvg.appendChild(p);
    e.el = p;
    e.len = p.getTotalLength();
  });
  const dots = svg('g', { class: 'dots' });
  edgeSvg.appendChild(dots);

  FLOWS.forEach((f) => {
    const b = el('button', 'flow-btn');
    b.type = 'button';
    b.dataset.flow = f.id;
    b.style.setProperty('--c', f.color);
    b.innerHTML = `<i class="sw"></i><span class="fl-t">${f.title}</span><kbd>${f.key}</kbd><span class="fl-l">${f.lead}</span>`;
    b.addEventListener('click', () => { stopTour(); setFlow(state.flow === f.id ? null : f.id); });
    flowList.appendChild(b);
  });
}

/* ======================================================= state → view */
function activeEdges() {
  if (state.node) return edges.filter((e) => e.from === state.node || e.to === state.node);
  if (state.flow) return edges.filter((e) => e.flow === state.flow);
  if (state.footprint) return edges.filter((e) => isBoost(e.from) || isBoost(e.to));
  return null;
}

function apply() {
  const act = activeEdges();
  const onEdges = new Set(act ? act.map((e) => e.id) : []);
  const onNodes = new Set();
  if (act) act.forEach((e) => { onNodes.add(e.from); onNodes.add(e.to); });
  if (state.node) onNodes.add(state.node);
  if (state.footprint && !state.node && !state.flow) NODES.filter((n) => n.kind === 'boost').forEach((n) => onNodes.add(n.id));

  map.classList.toggle('focusing', Boolean(act));
  map.classList.toggle('footprint', state.footprint);

  edges.forEach((e) => e.el.classList.toggle('on', onEdges.has(e.id)));
  nodesEl.querySelectorAll('.node').forEach((d) => {
    const id = d.dataset.id;
    d.classList.toggle('on', onNodes.has(id));
    d.classList.toggle('sel', id === state.node);
  });
  flowList.querySelectorAll('.flow-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.flow === state.flow));
  btnFootprint.classList.toggle('is-on', state.footprint);

  // moving dots + labels for the highlighted connections
  const dots = edgeSvg.querySelector('.dots');
  dots.innerHTML = '';
  labelSvg.innerHTML = '';
  if (act) {
    act.forEach((e) => {
      const color = flowById[e.flow].color;
      if (!reduceMotion) {
        const dur = Math.max(1.6, e.len / 170);
        for (let k = 0; k < 2; k++) {
          const c = svg('circle', { r: 5, fill: color, class: 'dot' });
          const m = svg('animateMotion', { dur: `${dur}s`, repeatCount: 'indefinite', begin: `${-(k * dur) / 2}s` });
          const mp = svg('mpath');
          mp.setAttribute('href', `#${e.id}`);
          mp.setAttributeNS(XLINK, 'xlink:href', `#${e.id}`);
          m.appendChild(mp);
          c.appendChild(m);
          dots.appendChild(c);
        }
      }
      if (e.label) {
        const pt = e.el.getPointAtLength(e.len / 2);
        const t = svg('text', { x: pt.x, y: pt.y + 5, class: 'elabel', 'text-anchor': 'middle' });
        t.style.setProperty('--c', color);
        t.textContent = e.label;
        labelSvg.appendChild(t);
      }
    });
  }

  renderPanel();
  writeHash();
}

/* ======================================================= panel */
function connRow(e, fromSide) {
  const other = byId[fromSide ? e.to : e.from];
  const f = flowById[e.flow];
  const arrow = fromSide ? '→' : '←';
  return `<button class="conn" data-goto="${other.id}" style="--c:${f.color}">
    <i class="sw"></i><span class="c-arrow">${arrow}</span><span class="c-name">${other.title}</span>
    ${e.label ? `<span class="c-label">${e.label}</span>` : ''}</button>`;
}

function renderPanel() {
  let html = '';
  if (state.node) {
    const n = byId[state.node];
    const mine = edges.filter((e) => e.from === n.id || e.to === n.id);
    const flowsHere = [...new Set(mine.map((e) => e.flow))].map((id) => flowById[id]);
    const boost = n.kind === 'boost';
    html += `<div class="p-kind k-${n.kind}">${boost ? '<i class="mark"></i>' : ''}${KIND_LABEL[n.kind]}</div>`;
    html += `<h2>${n.title}</h2>`;
    if (n.desc) html += `<p class="p-desc">${n.desc}</p>`;
    if (n.role) {
      html += `<div class="p-role${boost ? ' is-boost' : ''}"><div class="p-role-h"><i class="mark"></i>${boost ? 'boost.ai' : 'Where boost.ai fits'}</div><p>${n.role}</p></div>`;
    }
    if (n.plug) {
      html += `<div class="p-plug"><b>S-Bank’s choice — plug in any vendor.</b> boost.ai is best-of-breed conversational AI and connects through open APIs, MCP and standard hand-off. No lock-in either way.</div>`;
    }
    if (n.kind === 'core') {
      html += `<div class="p-plug core"><b>System of record.</b> boost.ai reaches it only through S-Bank’s integration layer — the data stays where it is.</div>`;
    }
    if (flowsHere.length) {
      html += '<h3>Part of flows</h3><div class="p-flows">';
      flowsHere.forEach((f) => { html += `<button class="chip" data-flow="${f.id}" style="--c:${f.color}"><i class="sw"></i>${f.title}</button>`; });
      html += '</div>';
    }
    if (mine.length) {
      html += '<h3>Connections</h3><div class="p-conns">';
      mine.forEach((e) => { html += connRow(e, e.from === n.id); });
      html += '</div>';
    }
  } else if (state.flow) {
    const f = flowById[state.flow];
    const list = edges.filter((e) => e.flow === f.id);
    const idx = FLOWS.indexOf(f);
    const next = FLOWS[(idx + 1) % FLOWS.length];
    html += `<div class="p-kind flow" style="--c:${f.color}"><i class="sw"></i>Flow ${f.key} of ${FLOWS.length}</div>`;
    html += `<h2>${f.title}</h2><p class="p-lead">${f.lead}</p><p class="p-desc">${f.text}</p>`;
    html += '<h3>Connections in this flow</h3><div class="p-conns">';
    list.filter((e) => e.label).forEach((e) => {
      html += `<button class="conn" data-goto="${e.from}" style="--c:${f.color}"><i class="sw"></i>
        <span class="c-name">${byId[e.from].title} <span class="c-arrow">→</span> ${byId[e.to].title}</span><span class="c-label">${e.label}</span></button>`;
    });
    html += '</div>';
    html += `<button class="next-flow" data-flow="${next.id}" style="--c:${next.color}">Next: ${next.title} →</button>`;
  } else if (state.footprint) {
    html += '<div class="p-kind k-boost"><i class="mark"></i>boost.ai footprint</div>';
    html += '<h2>Where boost.ai sits in ASRA</h2>';
    html += `<p class="p-desc">boost.ai is the AI-assisted service layer: AI agents for chat and voice, agentic orchestration, grounded knowledge, agent assist, proactive outreach and analytics — under one set of guardrails.</p>
      <p class="p-desc">Everything else stays S-Bank’s choice. boost.ai integrates with the contact center, case management, knowledge base and core systems S-Bank picks, through the integration layer — best of breed, no vendor lock-in.</p>`;
  }
  if (html) {
    panelBody.innerHTML = html;
    panel.hidden = false;
  } else {
    panel.hidden = true;
  }
  map.classList.toggle('panel-open', !panel.hidden);
}

panelBody.addEventListener('click', (e) => {
  const g = e.target.closest('[data-goto]');
  if (g) { stopTour(); selectNode(g.dataset.goto, true); return; }
  const f = e.target.closest('[data-flow]');
  if (f) { stopTour(); state.node = null; setFlow(f.dataset.flow); }
});
document.getElementById('panelClose').addEventListener('click', () => {
  stopTour();
  state.node = null; state.flow = null; state.footprint = false;
  apply();
});

/* ======================================================= actions */
function setFlow(id, fly = true) {
  state.flow = id;
  state.node = null;
  apply();
  if (fly && id) fitNodes(new Set(edges.filter((e) => e.flow === id).flatMap((e) => [e.from, e.to])));
}
function selectNode(id, fly = false) {
  state.node = id;
  apply();
  if (fly) centreOn(byId[id]);
}
function toggleFootprint() {
  state.footprint = !state.footprint;
  if (state.footprint) { state.node = null; state.flow = null; }
  apply();
  if (state.footprint) fitNodes(new Set(NODES.filter((n) => n.kind === 'boost').map((n) => n.id)), 0.9);
}

/* ======================================================= camera */
const cam = { x: 0, y: 0, z: 1 };

function visibleW() { return map.clientWidth - (panel.hidden ? 0 : Math.min(PANEL_W, map.clientWidth * 0.5)); }

function applyCam(animate = false) {
  world.style.transition = animate && !reduceMotion ? 'transform 0.7s cubic-bezier(.2,.8,.2,1)' : 'none';
  world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`;
  zoomPct.textContent = `${Math.round(cam.z * 100)}%`;
  world.classList.toggle('lod-near', cam.z >= 0.78);
  world.classList.toggle('lod-far', cam.z < 0.45);
}
function fitRect(r, animate = true, maxZ = 1.4) {
  const vw = visibleW();
  const vh = map.clientHeight;
  const pad = 48;
  cam.z = Math.max(Z_MIN, Math.min(maxZ, (vw - pad * 2) / r.w, (vh - pad * 2) / r.h));
  cam.x = (vw - r.w * cam.z) / 2 - r.x * cam.z;
  cam.y = (vh - r.h * cam.z) / 2 - r.y * cam.z;
  applyCam(animate);
}
function fitAll(animate = true) { fitRect({ x: 20, y: 40, w: WORLD.w - 20, h: WORLD.h - 30 }, animate); }
function fitNodes(ids, maxZ = 1.2) {
  const list = [...ids].map((id) => byId[id]);
  const x0 = Math.min(...list.map((n) => n.x)) - 40;
  const y0 = Math.min(...list.map((n) => n.y)) - 60;
  const x1 = Math.max(...list.map((n) => n.x + n.w)) + 40;
  const y1 = Math.max(...list.map((n) => n.y + n.h)) + 40;
  fitRect({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, true, maxZ);
}
function centreOn(n) {
  cam.z = Math.max(cam.z, 1);
  cam.x = visibleW() / 2 - cx(n) * cam.z;
  cam.y = map.clientHeight / 2 - cy(n) * cam.z;
  applyCam(true);
}
function zoomAt(px, py, factor, animate = false) {
  const wx = (px - cam.x) / cam.z;
  const wy = (py - cam.y) / cam.z;
  cam.z = Math.max(Z_MIN, Math.min(Z_MAX, cam.z * factor));
  cam.x = px - wx * cam.z;
  cam.y = py - wy * cam.z;
  applyCam(animate);
}
function zoomCentre(f) { zoomAt(visibleW() / 2, map.clientHeight / 2, f, true); }

map.addEventListener('wheel', (e) => {
  e.preventDefault();
  hideIntro();
  const r = map.getBoundingClientRect();
  const unit = e.deltaMode === 1 ? 16 : 1;
  const dy = Math.max(-120, Math.min(120, e.deltaY * unit));
  zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-dy * (e.ctrlKey ? 0.012 : 0.0028)));
}, { passive: false });

let drag = null;
let dragged = false;
map.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest('.zoom-ctl, .intro')) return;
  drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: cam.x, y: cam.y, moved: false };
  dragged = false;
});
window.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx;
  const dy = e.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) < 5) return;
  if (!drag.moved) { drag.moved = true; map.classList.add('panning'); hideIntro(); stopTour(); }
  cam.x = drag.x + dx;
  cam.y = drag.y + dy;
  applyCam();
});
window.addEventListener('pointerup', () => {
  if (drag && drag.moved) dragged = true;
  drag = null;
  map.classList.remove('panning');
});

// pinch on touch screens
const touches = new Map();
let pinch = null;
map.addEventListener('touchstart', (e) => {
  [...e.changedTouches].forEach((t) => touches.set(t.identifier, t));
  if (touches.size === 2) {
    const [a, b] = [...touches.values()];
    pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: cam.z };
  }
}, { passive: true });
map.addEventListener('touchmove', (e) => {
  [...e.changedTouches].forEach((t) => touches.set(t.identifier, t));
  if (pinch && touches.size === 2) {
    const [a, b] = [...touches.values()];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const r = map.getBoundingClientRect();
    zoomAt((a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top, (pinch.z * (d / pinch.d)) / cam.z);
  }
}, { passive: true });
map.addEventListener('touchend', (e) => {
  [...e.changedTouches].forEach((t) => touches.delete(t.identifier));
  if (touches.size < 2) pinch = null;
}, { passive: true });

map.addEventListener('click', (e) => {
  if (dragged) { dragged = false; return; }
  hideIntro();
  const n = e.target.closest('.node');
  if (n) {
    stopTour();
    selectNode(state.node === n.dataset.id ? null : n.dataset.id);
    return;
  }
  if (e.target.closest('.zoom-ctl')) return;
  if (state.node) { state.node = null; apply(); }
});
map.addEventListener('dblclick', (e) => {
  if (e.target.closest('.zoom-ctl')) return;
  const r = map.getBoundingClientRect();
  zoomAt(e.clientX - r.left, e.clientY - r.top, 1.8, true);
});

/* ======================================================= tour */
let tourTimer = null;
let tourIdx = -1;
function tourStep() {
  tourIdx += 1;
  if (tourIdx >= FLOWS.length) {
    stopTour();
    state.flow = null; state.footprint = true; apply();
    fitAll();
    return;
  }
  state.footprint = false;
  setFlow(FLOWS[tourIdx].id);
  tourLabel.textContent = `Tour · ${tourIdx + 1}/${FLOWS.length}`;
  tourTimer = setTimeout(tourStep, 7000);
}
function startTour() {
  hideIntro();
  tourIdx = -1;
  btnTour.classList.add('is-on');
  tourStep();
}
function stopTour() {
  if (!tourTimer && !btnTour.classList.contains('is-on')) return;
  clearTimeout(tourTimer);
  tourTimer = null;
  btnTour.classList.remove('is-on');
  tourLabel.textContent = 'Play tour';
}
btnTour.addEventListener('click', () => (btnTour.classList.contains('is-on') ? stopTour() : startTour()));
btnFootprint.addEventListener('click', () => { stopTour(); toggleFootprint(); });

/* ======================================================= misc controls */
function hideIntro() { intro.classList.add('gone'); }
function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
}
document.getElementById('btnFit').addEventListener('click', () => fitAll());
document.getElementById('btnFull').addEventListener('click', toggleFullscreen);
document.getElementById('btnIn').addEventListener('click', () => zoomCentre(1.3));
document.getElementById('btnOut').addEventListener('click', () => zoomCentre(1 / 1.3));
document.getElementById('btnHelp').addEventListener('click', () => { helpEl.hidden = !helpEl.hidden; });
helpEl.addEventListener('click', () => { helpEl.hidden = true; });

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === '?' ) { helpEl.hidden = !helpEl.hidden; return; }
  if (!helpEl.hidden) { helpEl.hidden = true; if (k === 'Escape') return; }
  if (k === 'p' || k === 'P') { btnTour.click(); return; }
  stopTour();
  hideIntro();
  const f = FLOWS.find((x) => x.key === k);
  if (f) { setFlow(state.flow === f.id ? null : f.id); return; }
  switch (k) {
    case 'Escape':
      if (state.node) state.node = null;
      else if (state.flow) state.flow = null;
      else state.footprint = false;
      apply();
      break;
    case 'b': case 'B': toggleFootprint(); break;
    case '0': fitAll(); break;
    case '+': case '=': zoomCentre(1.3); break;
    case '-': case '_': zoomCentre(1 / 1.3); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'w': case 'W': window.location.href = '/asra.html#3-1'; break;
    case 'ArrowLeft': cam.x += 80; applyCam(true); break;
    case 'ArrowRight': cam.x -= 80; applyCam(true); break;
    case 'ArrowUp': cam.y += 80; applyCam(true); break;
    case 'ArrowDown': cam.y -= 80; applyCam(true); break;
    default:
  }
});

/* ======================================================= hash */
function writeHash() {
  const h = state.node ? `#node=${state.node}` : state.flow ? `#flow=${state.flow}` : state.footprint ? '#boost' : '';
  history.replaceState(null, '', h || window.location.pathname);
}
function readHash() {
  const h = window.location.hash;
  let m = /^#node=([\w-]+)$/.exec(h);
  if (m && byId[m[1]]) { state.node = m[1]; return () => centreOn(byId[m[1]]); }
  m = /^#flow=([\w-]+)$/.exec(h);
  if (m && flowById[m[1]]) { state.flow = m[1]; return () => fitNodes(new Set(edges.filter((e) => e.flow === m[1]).flatMap((e) => [e.from, e.to]))); }
  if (h === '#boost') { state.footprint = true; }
  return null;
}

/* ======================================================= boot */
layoutEdges();
render();
const after = readHash();
apply();
fitAll(false);
if (after) { hideIntro(); requestAnimationFrame(after); }
window.addEventListener('resize', () => fitAll(false));
