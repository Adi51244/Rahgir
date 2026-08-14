import { HORN_SOUNDS } from './config.js';
import { setHornPlaying } from './store.js';
import { duckMusicVolume, restoreMusicVolume } from './player.js';

let hornAudio = null;
let lastHornIndex = -1;

export function initHorn(titleEl) {
  const btn = document.getElementById('horn-btn');
  const stopBtn = document.getElementById('horn-stop-btn');
  if (!btn) return;

  btn.addEventListener('click', () => playHorn(titleEl));
  stopBtn?.addEventListener('click', () => stopHorn(titleEl));
}

function pickHorn() {
  let idx;
  do {
    idx = Math.floor(Math.random() * HORN_SOUNDS.length);
  } while (idx === lastHornIndex && HORN_SOUNDS.length > 1);
  lastHornIndex = idx;
  return HORN_SOUNDS[idx];
}

export function playHorn(titleEl) {
  stopHorn(titleEl, false);

  const src = pickHorn();
  hornAudio = new Audio(src);
  hornAudio.volume = 0.42;

  setHornPlaying(true);
  duckMusicVolume();
  titleEl?.classList.add('horn-dancing');

  const stopBtn = document.getElementById('horn-stop-btn');
  if (stopBtn) stopBtn.hidden = false;

  hornAudio.addEventListener('ended', () => stopHorn(titleEl));
  hornAudio.addEventListener('error', () => stopHorn(titleEl));

  hornAudio.play().catch(() => stopHorn(titleEl));
}

export function stopHorn(titleEl, restoreMusic = true) {
  if (hornAudio) {
    hornAudio.pause();
    hornAudio.currentTime = 0;
    hornAudio = null;
  }

  setHornPlaying(false);
  titleEl?.classList.remove('horn-dancing');
  document.getElementById('hero-title')?.classList.remove('horn-dancing');

  const stopBtn = document.getElementById('horn-stop-btn');
  if (stopBtn) stopBtn.hidden = true;

  if (restoreMusic) {
    restoreMusicVolume();
  }
}
