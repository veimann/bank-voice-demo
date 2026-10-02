/* =========================================================================
   ASRA ECOSYSTEM — stepped, zoomable walkthrough
   -------------------------------------------------------------------------
   All content lives in asra.html. This file is a small, generic engine that
   reads data attributes on each <section class="slide" data-steps="N">:

     data-show="k"      visible from step k onwards
     data-only="range"  visible only during range   e.g. "0", "1-5", "4-7,11"
     data-focus="range" highlighted during range (siblings marked .f dim)
     data-active="range" gets .is-on during range (used for the view tabs)
     data-goto="k"      click → jump to step k on the current slide
     data-zoom="Label"  can be enlarged (Z key or click)

   URL hash is #<slide>-<step> (both 1-based), so any step can be deep-linked.
   ========================================================================= */

const DESIGN_W = 1600;
const DESIGN_H = 900;

const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');
const slides = [...document.querySelectorAll('.slide')];
const progressEl = document.getElementById('progress');
const navEl = document.getElementById('slideNav');
const counterEl = document.getElementById('counter');
const zoomEl = document.getElementById('zoom');
const zoomHost = document.getElementById('zoomHost');
const zoomTitle = document.getElementById('zoomTitle');
const helpEl = document.getElementById('help');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = { i: 0, k: 0 };
const stepsOf = (i) => Number(slides[i].dataset.steps || 1);

/* ---------- range parsing ---------- */
const rangeCache = new Map();
function inRange(str, k) {
  if (!rangeCache.has(str)) {
    const parts = str.split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
      if (!p.includes('-')) return [Number(p), Number(p)];
      const [a, b] = p.split('-');
      return [a === '' ? -Infinity : Number(a), b === '' ? Infinity : Number(b)];
    });
    rangeCache.set(str, parts);
  }
  return rangeCache.get(str).some(([a, b]) => k >= a && k <= b);
}

/* ---------- scaling ---------- */
function fit() {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  const s = Math.min(w / DESIGN_W, h / DESIGN_H);
  canvas.style.setProperty('--s', s);
}
window.addEventListener('resize', fit);

/* ---------- chrome ---------- */
function buildChrome() {
  slides.forEach((slide, i) => {
    const b = document.createElement('button');
    b.className = 'slide-link';
    b.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span>${slide.dataset.title || ''}`;
    b.addEventListener('click', () => go(i, 0));
    navEl.appendChild(b);

    const seg = document.createElement('div');
    seg.className = 'seg';
    seg.style.flex = String(stepsOf(i));
    for (let k = 0; k < stepsOf(i); k++) {
      const t = document.createElement('button');
      t.className = 'tick';
      t.setAttribute('aria-label', `Slide ${i + 1}, step ${k + 1}`);
      t.addEventListener('click', () => go(i, k));
      seg.appendChild(t);
    }
    progressEl.appendChild(seg);
  });
}

/* ---------- render ---------- */
function render() {
  const { i, k } = state;
  slides.forEach((slide, idx) => slide.classList.toggle('is-active', idx === i));
  const slide = slides[i];

  slide.querySelectorAll('[data-show]').forEach((el) => {
    el.classList.toggle('is-out', k < Number(el.dataset.show));
  });
  slide.querySelectorAll('[data-only]').forEach((el) => {
    el.classList.toggle('is-out', !inRange(el.dataset.only, k));
  });
  slide.querySelectorAll('[data-focus]').forEach((el) => {
    el.classList.toggle('is-focus', inRange(el.dataset.focus, k));
  });
  slide.querySelectorAll('[data-active]').forEach((el) => {
    el.classList.toggle('is-on', inRange(el.dataset.active, k));
  });

  // Dim every .f that is not focused, inside a focus, or containing a focus.
  const foci = [...slide.querySelectorAll('.is-focus')].filter((el) => !el.closest('.is-out'));
  const focusing = foci.length > 0;
  slide.querySelectorAll('.f').forEach((el) => {
    const lit = el.classList.contains('is-focus')
      || el.closest('.is-focus')
      || foci.some((f) => el.contains(f));
    el.classList.toggle('is-dim', focusing && !lit);
  });

  // chrome
  [...navEl.children].forEach((b, idx) => b.classList.toggle('is-on', idx === i));
  [...progressEl.children].forEach((seg, si) => {
    [...seg.children].forEach((t, ti) => {
      t.classList.toggle('done', si < i || (si === i && ti <= k));
      t.classList.toggle('cur', si === i && ti === k);
    });
  });
  counterEl.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;

  history.replaceState(null, '', `#${i + 1}-${k + 1}`);
}

function go(i, k = 0) {
  state.i = Math.max(0, Math.min(slides.length - 1, i));
  state.k = Math.max(0, Math.min(stepsOf(state.i) - 1, k));
  render();
}
function next() {
  if (state.k < stepsOf(state.i) - 1) go(state.i, state.k + 1);
  else if (state.i < slides.length - 1) go(state.i + 1, 0);
}
function prev() {
  if (state.k > 0) go(state.i, state.k - 1);
  else if (state.i > 0) go(state.i - 1, stepsOf(state.i - 1) - 1);
}

/* ---------- zoom ---------- */
let zoomList = [];
let zoomIdx = -1;

const isVisible = (el) => !el.closest('.is-out');

function zoomCandidates() {
  return [...slides[state.i].querySelectorAll('[data-zoom]')].filter(isVisible);
}

function defaultZoomTarget() {
  const slide = slides[state.i];
  const focus = [...slide.querySelectorAll('.is-focus')].filter(isVisible);
  for (const f of focus) {
    const z = f.matches('[data-zoom]') ? f : f.closest('[data-zoom]');
    if (z) return z;
  }
  return zoomCandidates()[0];
}

function openZoom(target, animateFrom = true) {
  if (!target) return;
  zoomList = zoomCandidates();
  zoomIdx = zoomList.indexOf(target);

  const w = target.offsetWidth;
  const h = target.offsetHeight;
  const clone = target.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  [clone, ...clone.querySelectorAll('.is-dim')].forEach((n) => n.classList.remove('is-dim'));
  clone.classList.add('zoom-clone');
  clone.style.width = `${w}px`;
  clone.style.height = `${h}px`;

  zoomHost.innerHTML = '';
  zoomHost.appendChild(clone);
  zoomTitle.textContent = target.dataset.zoom || '';
  zoomEl.hidden = false;
  document.body.classList.add('zoomed');

  const maxW = window.innerWidth * 0.92;
  const maxH = window.innerHeight * 0.82;
  const s = Math.min(maxW / w, maxH / h, 3.2);
  const finalT = `translate(-50%, -50%) scale(${s})`;
  clone.style.transform = finalT;

  if (animateFrom && !reduceMotion && clone.animate) {
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2 - window.innerWidth / 2;
    const cy = r.top + r.height / 2 - window.innerHeight / 2;
    const s0 = r.width / w;
    clone.animate(
      [
        { transform: `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px)) scale(${s0})`, opacity: 0.6 },
        { transform: finalT, opacity: 1 }
      ],
      { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
  }
}

function closeZoom() {
  zoomEl.hidden = true;
  zoomHost.innerHTML = '';
  document.body.classList.remove('zoomed');
  zoomIdx = -1;
}

function stepZoom(dir) {
  if (!zoomList.length) return;
  zoomIdx = (zoomIdx + dir + zoomList.length) % zoomList.length;
  openZoom(zoomList[zoomIdx], false);
}

const isZoomed = () => !zoomEl.hidden;
const isHelp = () => !helpEl.hidden;

/* ---------- fullscreen ---------- */
function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } else {
    const el = d.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  }
}

/* ---------- input ---------- */
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key;

  if (key === 'Escape') {
    if (isHelp()) helpEl.hidden = true;
    else if (isZoomed()) closeZoom();
    return;
  }
  if (key === '?' || (key === '/' && e.shiftKey)) { helpEl.hidden = !helpEl.hidden; return; }
  if (key === 'f' || key === 'F') { toggleFullscreen(); return; }
  if (key === 'h' || key === 'H') { window.location.href = '/index.html'; return; }

  if (isHelp()) { helpEl.hidden = true; }

  if (key === 'z' || key === 'Z') {
    if (isZoomed()) closeZoom(); else openZoom(defaultZoomTarget());
    return;
  }

  if (isZoomed()) {
    if (key === 'ArrowRight' || key === 'ArrowDown' || key === ' ') { e.preventDefault(); stepZoom(1); }
    else if (key === 'ArrowLeft' || key === 'ArrowUp') { e.preventDefault(); stepZoom(-1); }
    return;
  }

  switch (key) {
    case 'ArrowRight': case 'ArrowDown': case ' ': case 'Enter':
      e.preventDefault(); next(); break;
    case 'ArrowLeft': case 'ArrowUp': case 'Backspace':
      e.preventDefault(); prev(); break;
    case 'PageDown': e.preventDefault(); go(state.i + 1, 0); break;
    case 'PageUp': e.preventDefault(); go(state.i - 1, 0); break;
    case 'Home': go(0, 0); break;
    case 'End': go(slides.length - 1, stepsOf(slides.length - 1) - 1); break;
    default:
      if (/^[1-9]$/.test(key) && Number(key) <= slides.length) go(Number(key) - 1, 0);
  }
});

// Click to enlarge the innermost zoomable item (links/buttons keep their own behaviour).
canvas.addEventListener('click', (e) => {
  const gotoBtn = e.target.closest('[data-goto]');
  if (gotoBtn) { go(state.i, Number(gotoBtn.dataset.goto)); return; }
  if (e.target.closest('a, button')) return;
  const z = e.target.closest('[data-zoom]');
  if (z && isVisible(z)) openZoom(z);
});

zoomEl.addEventListener('click', closeZoom);
helpEl.addEventListener('click', () => { helpEl.hidden = true; });

document.getElementById('btnNext').addEventListener('click', next);
document.getElementById('btnPrev').addEventListener('click', prev);
document.getElementById('btnFull').addEventListener('click', toggleFullscreen);
document.getElementById('btnHelp').addEventListener('click', () => { helpEl.hidden = !helpEl.hidden; });
document.getElementById('btnZoom').addEventListener('click', () => {
  if (isZoomed()) closeZoom(); else openZoom(defaultZoomTarget());
});

// Simple swipe for touch screens / tablets.
let touchX = null;
viewport.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
viewport.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
  touchX = null;
});

/* ---------- boot ---------- */
function fromHash() {
  const m = /^#(\d+)(?:-(\d+))?$/.exec(window.location.hash);
  if (!m) return go(0, 0);
  go(Number(m[1]) - 1, m[2] ? Number(m[2]) - 1 : 0);
}

buildChrome();
fit();
fromHash();
requestAnimationFrame(() => document.body.classList.add('ready'));
