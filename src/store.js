import { DEFAULT_CULTURE } from './config.js';

const listeners = new Set();

const state = {
  culture: DEFAULT_CULTURE,
  activeMood: 'default',
  tracks: [],
  currentIndex: 0,
  isPlaying: false,
  isShuffled: false,
  shuffledOrder: [],
  volume: 80,
  progress: 0,
  duration: 0,
  userStarted: false,
  hornPlaying: false,
};

export function getState() {
  return { ...state };
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn(getState()));
}

export function setCulture(culture, mood = null) {
  state.culture = culture;
  if (mood) state.activeMood = mood;
  state.currentIndex = 0;
  state.progress = 0;
  state.duration = 0;
  emit();
}

export function setMood(mood) {
  state.activeMood = mood;
  state.currentIndex = 0;
  state.progress = 0;
  state.duration = 0;
  emit();
}

export function setTracks(tracks, initialIndex = null) {
  state.tracks = tracks;
  if (tracks && tracks.length > 0) {
    if (initialIndex !== null && initialIndex >= 0 && initialIndex < tracks.length) {
      state.currentIndex = initialIndex;
    } else {
      state.currentIndex = Math.floor(Math.random() * tracks.length);
    }
  } else {
    state.currentIndex = 0;
  }
  state.shuffledOrder = tracks.map((_, i) => i);
  state.progress = 0;
  emit();
}

export function setPlaying(playing) {
  state.isPlaying = playing;
  if (playing) state.userStarted = true;
  emit();
}

export function setProgress(progress, duration) {
  state.progress = progress;
  if (duration) state.duration = duration;
  emit();
}

export function setVolume(volume) {
  state.volume = volume;
  emit();
}

export function toggleShuffle() {
  state.isShuffled = !state.isShuffled;
  emit();
}

export function setHornPlaying(playing) {
  state.hornPlaying = playing;
  emit();
}

export function getCurrentTrack() {
  return state.tracks[state.currentIndex] ?? null;
}

export function nextTrack() {
  if (!state.tracks.length) return;
  if (state.isShuffled && state.tracks.length > 1) {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * state.tracks.length);
    } while (nextIdx === state.currentIndex);
    state.currentIndex = nextIdx;
  } else {
    state.currentIndex = (state.currentIndex + 1) % state.tracks.length;
  }
  state.progress = 0;
  emit();
}

export function prevTrack() {
  if (!state.tracks.length) return;
  if (state.progress > 3) {
    state.progress = 0;
  } else {
    state.currentIndex = (state.currentIndex - 1 + state.tracks.length) % state.tracks.length;
    state.progress = 0;
  }
  emit();
}

export function playTrackAt(index) {
  if (index < 0 || index >= state.tracks.length) return;
  state.currentIndex = index;
  state.progress = 0;
  state.userStarted = true;
  emit();
}

export function setShuffledOrder(order) {
  state.shuffledOrder = order;
  emit();
}
