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
  const moodParam = params.get('mood');
  const trackParam = params.get('track');
  const viewParam = params.get('view');

  const slideshow = document.getElementById('slideshow');
  const heroTitle = document.getElementById('hero-title');

  const startCulture = CULTURES[cultureParam] ? cultureParam : DEFAULT_CULTURE;

  document.querySelectorAll('.culture-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.culture === startCulture);
  });
  setCulture(startCulture, moodParam);

  initSlideshow(slideshow, startCulture);
  initHorn(heroTitle);
  initTicket();
  initCultureTabs();
  initControls();
  initKeyboard();
  initClock();
  initNavigationViews();

  await loadCultureTracks(startCulture, moodParam);
  renderMoodChips();

  if (trackParam !== null) {
    const idx = parseInt(trackParam, 10);
    if (!Number.isNaN(idx)) {
      playTrackAt(idx);
    }
  }

  await initPlayer();
  subscribe(renderUI);
  renderUI();

  if (viewParam === 'playlists') {
    openPlaylistsView(cultureParam);
  } else if (viewParam === 'songs') {
    openSongsView();
  }
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

function renderMoodChips() {
  const container = document.getElementById('mood-chips');
  if (!container) return;
  const currentCulture = getState().culture;
  const currentMood = getState().activeMood;
  const meta = CULTURES[currentCulture];
  if (!meta || !meta.moods || meta.moods.length <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';
  meta.moods.forEach((m) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `mood-chip ${m.id === currentMood ? 'active' : ''}`;
    chip.textContent = m.label;
    chip.addEventListener('click', async () => {
      if (m.id === getState().activeMood) return;
      const wasPlaying = getState().isPlaying;
      await loadCultureTracks(currentCulture, m.id);
      renderMoodChips();
      if (wasPlaying) {
        startPlayback();
      }
      renderUI();
    });
    container.appendChild(chip);
  });
}

function initCultureTabs() {
  document.querySelectorAll('.culture-tab').forEach((tab) => {
    tab.addEventListener('click', async () => {
      const id = tab.dataset.culture;
      if (id === getState().culture) return;

      document.querySelectorAll('.culture-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const wasPlaying = getState().isPlaying;
      setCulture(id);
      setSlideCulture(id, document.getElementById('slideshow'));
      await loadCultureTracks(id);
      renderMoodChips();
      if (wasPlaying) {
        startPlayback();
      }
      renderUI();
    });
  });
}

let playlistsLoaded = false;
let songsLoaded = false;

function initNavigationViews() {
  const navRadio = document.getElementById('nav-radio');
  const navPlaylists = document.getElementById('nav-playlists');
  const navSongs = document.getElementById('nav-songs');
  const playlistsView = document.getElementById('playlists-view');
  const songsView = document.getElementById('songs-view');

  navRadio?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAllViews();
  });

  navPlaylists?.addEventListener('click', (e) => {
    e.preventDefault();
    openPlaylistsView();
  });

  navSongs?.addEventListener('click', (e) => {
    e.preventDefault();
    openSongsView();
  });

  document.querySelectorAll('.view-close-btn, .view-back-btn').forEach((btn) => {
    btn.addEventListener('click', () => closeAllViews());
  });

  playlistsView?.addEventListener('click', (e) => {
    if (e.target === playlistsView) closeAllViews();
  });

  songsView?.addEventListener('click', (e) => {
    if (e.target === songsView) closeAllViews();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (playlistsView?.classList.contains('open') || songsView?.classList.contains('open')) {
        closeAllViews();
      }
    }
  });
}

function updateNavActive(activeId) {
  document.getElementById('nav-radio')?.classList.toggle('active', activeId === 'radio');
  document.getElementById('nav-playlists')?.classList.toggle('active', activeId === 'playlists');
  document.getElementById('nav-songs')?.classList.toggle('active', activeId === 'songs');
}

async function openPlaylistsView(initialCulture = null) {
  const modal = document.getElementById('playlists-view');
  if (!modal) return;
  document.getElementById('songs-view')?.classList.remove('open');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  updateNavActive('playlists');

  const cardsEl = document.getElementById('view-playlist-cards');
  const detailEl = document.getElementById('view-playlist-detail');

  if (!playlistsLoaded && cardsEl) {
    cardsEl.innerHTML = '';
    for (const [id, meta] of Object.entries(CULTURES)) {
      const moodsList = meta.moods && meta.moods.length > 0 ? meta.moods : [{ id: 'default', label: meta.label, file: meta.dataFile, ytMusic: meta.ytMusic }];
      for (const mood of moodsList) {
        try {
          const res = await fetch(mood.file);
          const data = await res.json();
          const thumb = data.tracks[0]?.thumbnail || '';

          const card = document.createElement('a');
          card.className = 'playlist-card';
          card.href = '#';
          card.innerHTML = `
            <img src="${thumb}" alt="${meta.label}" loading="lazy" />
            <div>
              <h3>${meta.emoji} ${meta.label} — ${mood.label}</h3>
              <p>${meta.route}</p>
              <p>${data.tracks.length} गाने · ${meta.boarding}</p>
            </div>
          `;
          card.addEventListener('click', (e) => {
            e.preventDefault();
            renderPlaylistDetail(id, mood.id, meta, mood, data.tracks, detailEl);
          });
          cardsEl.appendChild(card);
        } catch (err) {
          console.error(err);
        }
      }
    }
    playlistsLoaded = true;
  }

  if (initialCulture && CULTURES[initialCulture] && detailEl) {
    const meta = CULTURES[initialCulture];
    const defaultMood = meta.moods?.[0] || { id: 'default', label: meta.label, file: meta.dataFile, ytMusic: meta.ytMusic };
    const res = await fetch(defaultMood.file);
    const data = await res.json();
    renderPlaylistDetail(initialCulture, defaultMood.id, meta, defaultMood, data.tracks, detailEl);
  }
}

function renderPlaylistDetail(cultureId, moodId, meta, mood, tracks, detailEl) {
  if (!detailEl) return;
  detailEl.innerHTML = `
    <h2 class="section-title" style="margin-top:1.5rem;font-size:1.35rem">${meta.emoji} ${meta.label} (${mood.label}) — ${tracks.length} गाने</h2>
    <p style="color:var(--text-muted);margin-bottom:1rem;font-size:0.85rem">
      <a href="${mood.ytMusic || meta.ytMusic}" target="_blank" rel="noopener">YouTube Music पर सुनें ↗</a>
    </p>
    <ul class="song-list"></ul>
  `;

  const list = detailEl.querySelector('.song-list');
  tracks.forEach((track, i) => {
    const li = document.createElement('li');
    li.style.cursor = 'pointer';
    li.innerHTML = `
      <span class="num">${i + 1}</span>
      <img src="${track.thumbnail}" alt="" loading="lazy" />
      <div class="info">
        <div class="title">${track.title}</div>
        <div class="artist">${track.artist}</div>
      </div>
      <span class="dur">${formatTime(track.duration)}</span>
    `;
    li.addEventListener('click', () => {
      selectTrackAndPlay(cultureId, moodId, i);
    });
    list.appendChild(li);
  });

  detailEl.scrollIntoView({ behavior: 'smooth' });
}

async function openSongsView() {
  const modal = document.getElementById('songs-view');
  if (!modal) return;
  document.getElementById('playlists-view')?.classList.remove('open');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  updateNavActive('songs');

  const container = document.getElementById('view-songs-container');
  if (!songsLoaded && container) {
    container.innerHTML = '';
    for (const [cultureId, meta] of Object.entries(CULTURES)) {
      const moodsList = meta.moods && meta.moods.length > 0 ? meta.moods : [{ id: 'default', label: meta.label, file: meta.dataFile, ytMusic: meta.ytMusic }];
      for (const mood of moodsList) {
        try {
          const res = await fetch(mood.file);
          const data = await res.json();

          const section = document.createElement('div');
          section.style.marginBottom = '2rem';
          section.innerHTML = `<h2 class="section-title" style="margin-bottom:0.75rem;font-size:1.25rem">${meta.emoji} ${meta.label} — ${mood.label} (${data.tracks.length} गाने)</h2>`;

          const ul = document.createElement('ul');
          ul.className = 'song-list';

          data.tracks.forEach((track, i) => {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.innerHTML = `
              <span class="num">${i + 1}</span>
              <img src="${track.thumbnail}" alt="" loading="lazy" />
              <div class="info">
                <div class="title">${track.title}</div>
                <div class="artist">${track.artist}</div>
              </div>
              <span class="dur">${formatTime(track.duration)}</span>
            `;
            li.addEventListener('click', () => {
              selectTrackAndPlay(cultureId, mood.id, i);
            });
            ul.appendChild(li);
          });

          section.appendChild(ul);
          container.appendChild(section);
        } catch (err) {
          console.error(err);
        }
      }
    }
    songsLoaded = true;
  }
}

function closeAllViews() {
  document.getElementById('playlists-view')?.classList.remove('open');
  document.getElementById('playlists-view')?.setAttribute('aria-hidden', 'true');
  document.getElementById('songs-view')?.classList.remove('open');
  document.getElementById('songs-view')?.setAttribute('aria-hidden', 'true');
  updateNavActive('radio');
}

async function selectTrackAndPlay(cultureId, moodId, trackIndex) {
  const slideshow = document.getElementById('slideshow');
  const needsCultureChange = cultureId !== getState().culture;
  const needsMoodChange = moodId !== getState().activeMood;

  if (needsCultureChange || needsMoodChange) {
    setCulture(cultureId, moodId);
    setSlideCulture(cultureId, slideshow);
    document.querySelectorAll('.culture-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.culture === cultureId);
    });
    await loadCultureTracks(cultureId, moodId, trackIndex);
    renderMoodChips();
  } else {
    playTrackAt(trackIndex);
  }
  closeAllViews();
  playAt(trackIndex);
  renderUI();
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
