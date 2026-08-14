import { CULTURES, DEFAULT_CULTURE, CULTURE_SIGNIFICANCE } from './config.js';
import {
  subscribe,
  getState,
  setCulture,
  getCurrentTrack,
  playTrackAt,
} from './store.js';
import {
  initPlayer,
  togglePlay,
  startPlayback,
  handleNext,
  handlePrev,
  handleShuffleToggle,
  setPlayerVolume,
  seekTo,
  loadCultureTracks,
  playAt,
} from './player.js';
import { initSlideshow, setCulture as setSlideCulture } from './slideshow.js';
import { initHorn } from './horn.js';
import { initTicket } from './ticket.js';
import { formatTime } from './utils.js';
import { inject } from '@vercel/analytics';

inject();

let isDraggingProgress = false;
let isDraggingVolume = false;
let clockTimer = null;

async function boot() {
  const params = new URLSearchParams(window.location.search);
  const cultureParam = params.get('culture');
  const trackParam = params.get('track');

  const slideshow = document.getElementById('slideshow');
  const heroTitle = document.getElementById('hero-title');

  const startCulture = CULTURES[cultureParam] ? cultureParam : DEFAULT_CULTURE;

  if (cultureParam && CULTURES[cultureParam]) {
    document.querySelectorAll('.culture-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.culture === cultureParam);
    });
    setCulture(cultureParam);
  }

  initSlideshow(slideshow, startCulture);
  initHorn(heroTitle);
  initTicket();
  initCultureTabs();
  initControls();
  initKeyboard();
  initClock();

  await loadCultureTracks(startCulture);

  if (trackParam !== null) {
    const idx = parseInt(trackParam, 10);
    if (!Number.isNaN(idx)) {
      playTrackAt(idx);
    }
  }

  await initPlayer();
  subscribe(renderUI);
  renderUI();
}

function initClock() {
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
}

function updateClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('hi-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function initCultureTabs() {
  document.querySelectorAll('.culture-tab').forEach((tab) => {
    tab.addEventListener('click', async () => {
      const id = tab.dataset.culture;
      if (id === getState().culture) return;

      document.querySelectorAll('.culture-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      setCulture(id);
      setSlideCulture(id, document.getElementById('slideshow'));
      await loadCultureTracks(id);
      renderUI();
    });
  });
}

function setRangeFill(el, value, max) {
  if (!el) return;
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  el.style.setProperty('--fill', `${pct}%`);
}

function initControls() {
  document.getElementById('play-btn')?.addEventListener('click', togglePlay);
  document.getElementById('next-btn')?.addEventListener('click', handleNext);
  document.getElementById('prev-btn')?.addEventListener('click', handlePrev);
  document.getElementById('shuffle-btn')?.addEventListener('click', handleShuffleToggle);

  const progress = document.getElementById('progress-bar');
  progress?.addEventListener('pointerdown', () => { isDraggingProgress = true; });
  progress?.addEventListener('pointerup', () => { isDraggingProgress = false; });
  progress?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    setRangeFill(e.target, val, Number(e.target.max));
    seekTo(val);
  });

  const volume = document.getElementById('volume-bar');
  volume?.addEventListener('pointerdown', () => { isDraggingVolume = true; });
  volume?.addEventListener('pointerup', () => { isDraggingVolume = false; });
  volume?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    setRangeFill(e.target, val, 100);
    setPlayerVolume(val);
  });

  document.getElementById('queue-btn')?.addEventListener('click', () => {
    document.getElementById('queue-panel')?.classList.toggle('open');
  });
}

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'ArrowLeft':
        handlePrev();
        break;
      case 'n':
      case 'N':
        handleNext();
        break;
      case 'p':
      case 'P':
        handlePrev();
        break;
      case 'q':
      case 'Q':
        document.getElementById('queue-panel')?.classList.toggle('open');
        break;
      case 'h':
      case 'H':
        document.getElementById('horn-btn')?.click();
        break;
      default:
        break;
    }
  });
}

function renderUI() {
  const state = getState();
  const track = getCurrentTrack();
  const meta = CULTURES[state.culture];
  const significance = CULTURE_SIGNIFICANCE[state.culture];

  document.getElementById('track-count').textContent =
    `${state.tracks.length} गाने · नॉन-स्टॉप`;

  const altBadge = document.getElementById('altitude-badge');
  if (altBadge) {
    if (meta.altitude) {
      altBadge.hidden = false;
      altBadge.textContent = `${meta.altitude} · ${meta.altitudeLabel || 'ऊँचाई'}`;
    } else {
      altBadge.hidden = true;
    }
  }

  document.getElementById('route-label').textContent = meta.route;
  document.getElementById('culture-sub').textContent =
    `${meta.label} · रात भर सफर`;

  const quoteLeft = document.getElementById('hero-quote-left');
  const quoteRight = document.getElementById('hero-quote-right');
  if (quoteLeft) quoteLeft.textContent = meta.quoteLeft || 'रात भर · सफर';
  if (quoteRight) quoteRight.textContent = meta.quoteRight || 'यात्रा';

  const sigTitle = document.getElementById('culture-significance-title');
  const sigBody = document.getElementById('culture-significance-body');
  const sigExtra = document.getElementById('culture-significance-extra');
  const sigJourney = document.getElementById('culture-journey');
  const highlightsEl = document.getElementById('culture-highlights');
  const songsBody = document.getElementById('songs-about-body');
  if (sigTitle && significance) sigTitle.textContent = significance.title;
  if (sigBody && significance) sigBody.textContent = significance.body;
  if (sigExtra && significance) sigExtra.textContent = significance.extra || '';
  if (sigJourney && significance) sigJourney.textContent = significance.journey || '';
  if (songsBody && significance) songsBody.textContent = significance.songs;
  if (highlightsEl && significance?.highlights) {
    highlightsEl.innerHTML = significance.highlights
      .map((h) => `<li>${h}</li>`)
      .join('');
  }

  const titleEl = document.getElementById('now-playing-title');
  const artistEl = document.getElementById('now-playing-artist');
  if (titleEl) titleEl.textContent = track?.title || 'ट्यून हो रहा है…';
  if (artistEl) artistEl.textContent = track?.artist || '—';

  const sectionArt = document.getElementById('section-track-art');
  const sectionTitle = document.getElementById('section-track-title');
  const sectionArtist = document.getElementById('section-track-artist');
  if (sectionArt) sectionArt.src = track?.thumbnail || '';
  if (sectionTitle) sectionTitle.textContent = track?.title || '—';
  if (sectionArtist) sectionArtist.textContent = track?.artist || '—';

  const cd = document.getElementById('cd-art');
  if (cd) {
    cd.src = track?.thumbnail || '';
    cd.classList.toggle('spinning', state.isPlaying);
  }

  const playBtn = document.getElementById('play-btn');
  if (playBtn) playBtn.textContent = state.isPlaying ? '⏸' : '▶';

  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) shuffleBtn.classList.toggle('active', state.isShuffled);

  const progress = document.getElementById('progress-bar');
  const duration = state.duration || track?.duration || 0;
  if (progress && !isDraggingProgress) {
    progress.max = duration > 0 ? duration : 100;
    progress.value = state.progress || 0;
    setRangeFill(progress, state.progress || 0, duration > 0 ? duration : 100);
  }

  document.getElementById('time-current').textContent = formatTime(state.progress);
  document.getElementById('time-total').textContent = formatTime(duration);

  const vol = document.getElementById('volume-bar');
  if (vol && !isDraggingVolume) {
    vol.value = state.volume;
    setRangeFill(vol, state.volume, 100);
  }

  renderQueue(state);
}

function renderQueue(state) {
  const list = document.getElementById('queue-list');
  if (!list) return;
  list.innerHTML = '';

  const order = state.isShuffled
    ? state.shuffledOrder
    : state.tracks.map((_, i) => i);

  order.forEach((trackIdx, queuePos) => {
    const track = state.tracks[trackIdx];
    if (!track) return;
    const li = document.createElement('li');
    li.className = queuePos === state.currentIndex ? 'active' : '';
    li.innerHTML = `
      <img src="${track.thumbnail}" alt="" loading="lazy" />
      <div class="queue-info">
        <span class="queue-title">${track.title}</span>
        <span class="queue-artist">${track.artist}</span>
      </div>
      <span class="queue-dur">${formatTime(track.duration)}</span>
    `;
    li.addEventListener('click', () => {
      playAt(queuePos);
    });
    list.appendChild(li);
  });
}

boot();
