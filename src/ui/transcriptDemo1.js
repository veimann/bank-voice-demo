/* =========================================================================
   LIVE CALL TRANSCRIPT — Demo 1, Day 2 outbound call
   Same approach as ui/transcript.js (Part 2): partial segments update in
   place until final, keyed by role+segment id. Kept as its own small module
   (rather than reusing ui/transcript.js directly) only because the speaker
   labels differ — this call is in English, Part 2's is Finnish — everything
   else about the two is deliberately identical.
   ========================================================================= */
const DEFAULT_EMPTY_TEXT = 'Transcript will appear here once the call connects.';
const segmentEls = {};

function cleanText(text, role) {
  if (role !== 'assistant') return text;
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function onTranscriptSegment(id, rawText, isFinal, role) {
  const text = cleanText(rawText, role);
  if (!text || !text.trim()) return;
  const body = document.getElementById('transcriptBody');
  if (!body) return;

  const empty = document.getElementById('transcriptEmpty');
  if (empty) empty.remove();

  const key = role + ':' + id;
  let bubble = segmentEls[key];

  if (bubble) {
    bubble.querySelector('.t-text').textContent = text;
    if (isFinal) {
      bubble.classList.remove('partial');
      delete segmentEls[key];
    }
  } else {
    bubble = document.createElement('div');
    bubble.className = 't-bubble t-' + role + (isFinal ? '' : ' partial');
    const speakerEl = document.createElement('span');
    speakerEl.className = 't-speaker';
    speakerEl.textContent = role === 'assistant' ? 'Aulis' : 'You';
    const textEl = document.createElement('span');
    textEl.className = 't-text';
    textEl.textContent = text;
    bubble.appendChild(speakerEl);
    bubble.appendChild(textEl);
    body.appendChild(bubble);
    if (!isFinal) segmentEls[key] = bubble;
  }

  body.scrollTop = body.scrollHeight;
}

export function clearTranscript() {
  Object.keys(segmentEls).forEach((k) => delete segmentEls[k]);
  const body = document.getElementById('transcriptBody');
  if (body) {
    body.innerHTML = '';
    const empty = document.createElement('p');
    empty.className = 'transcript-empty';
    empty.id = 'transcriptEmpty';
    empty.textContent = DEFAULT_EMPTY_TEXT;
    body.appendChild(empty);
  }
  setLiveDot(false);
}

export function setLiveDot(live) {
  const dot = document.getElementById('sideLiveDot');
  if (dot) dot.classList.toggle('live', Boolean(live));
}
