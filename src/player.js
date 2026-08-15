import { loadYouTubeAPI } from './utils.js';
import {
  getState,
  getCurrentTrack,
  setPlaying,
  setProgress,
  setVolume,
  nextTrack,
  prevTrack,
  toggleShuffle,
  playTrackAt,
  subscribe,
  setTracks,
} from './store.js';
import { CULTURES } from './config.js';

let player = null;
let progressTimer = null;
let ready = false;
let duckedVolume = null;

const PLAYER_VARS = {
  autoplay: 0,
  controls: 0,
  disablekb: 1,
  enablejsapi: 1,
  fs: 0,
  iv_load_policy: 3,
  modestbranding: 1,
  playsinline: 1,
  rel: 0,
};

export async function initPlayer(containerId = 'yt-player') {
  await loadYouTubeAPI();
  const track = getCurrentTrack();

  player = new window.YT.Player(containerId, {
    host: 'https://www.youtube-nocookie.com',
    height: '0',
    width: '0',
    videoId: track?.id || 'tQWbVKki2Ck',
    playerVars: {
      ...PLAYER_VARS,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        ready = true;
        player.setVolume(getState().volume);
        player.cueVideoById(track?.id || 'tQWbVKki2Ck');
      },
      onStateChange: onStateChange,
    },
  });

  let lastIdx = getState().currentIndex;
  let lastCulture = getState().culture;

  subscribe((state) => {
    if (!ready) return;
    const trackChanged =
      state.currentIndex !== lastIdx || state.culture !== lastCulture;
    lastIdx = state.currentIndex;
    lastCulture = state.culture;

    if (trackChanged) {
      loadCurrentTrack();
    }
  });
}

function loadCurrentTrack() {
  if (!ready || !player) return;
  const state = getState();
  const t = getCurrentTrack();
  if (!t) return;

  if (state.userStarted) {
    player.loadVideoById({ videoId: t.id, startSeconds: 0 });
    if (state.isPlaying) {
      player.playVideo();
    }
  } else {
    player.cueVideoById(t.id);
  }
}

function onStateChange(event) {
  const YT = window.YT;
  if (event.data === YT.PlayerState.PLAYING) {
    setPlaying(true);
    startProgressTimer();
  } else if (event.data === YT.PlayerState.PAUSED) {
    setPlaying(false);
    stopProgressTimer();
  } else if (event.data === YT.PlayerState.ENDED) {
    stopProgressTimer();
    nextTrack();
    loadCurrentTrack();
  } else if (event.data === YT.PlayerState.CUED) {
    const dur = player.getDuration?.() || 0;
    setProgress(0, dur);
  }
}

function startProgressTimer() {
  stopProgressTimer();
  progressTimer = setInterval(() => {
    if (!player?.getCurrentTime) return;
    const current = player.getCurrentTime();
    const duration = player.getDuration() || 0;
    if (duration > 0) {
      setProgress(current, duration);
    }
  }, 250);
}

function stopProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

export function startPlayback() {
  if (!ready || !player) return;
  setPlaying(true);
  const t = getCurrentTrack();
  if (!t) return;
  const state = player.getPlayerState();
  const YT = window.YT;
  if (state === YT.PlayerState.PAUSED) {
    player.playVideo();
  } else {
    player.loadVideoById({ videoId: t.id, startSeconds: 0 });
  }
}

export function togglePlay() {
  if (!ready) return;
  const { isPlaying, userStarted } = getState();
  if (!userStarted) {
    startPlayback();
    return;
  }
  if (isPlaying) player.pauseVideo();
  else player.playVideo();
}

export function seekTo(seconds) {
  if (!player?.seekTo) return;
  player.seekTo(seconds, true);
  const duration = player.getDuration?.() || getState().duration || 0;
  setProgress(seconds, duration);
}

export function setPlayerVolume(vol) {
  if (duckedVolume !== null) {
    duckedVolume = vol;
  }
  player?.setVolume?.(vol);
  setVolume(vol);
}

export function duckMusicVolume() {
  if (!player || duckedVolume !== null) return;
  duckedVolume = getState().volume;
  const lowered = Math.max(12, Math.round(duckedVolume * 0.35));
  player.setVolume(lowered);
}

export function restoreMusicVolume() {
  if (!player || duckedVolume === null) return;
  player.setVolume(duckedVolume);
  duckedVolume = null;
}

export function handleNext() {
  nextTrack();
  loadCurrentTrack();
}

export function handlePrev() {
  const state = getState();
  if (state.progress > 3) {
    seekTo(0);
    return;
  }
  prevTrack();
  loadCurrentTrack();
}

export function handleShuffleToggle() {
  toggleShuffle();
}

export function playAt(index) {
  playTrackAt(index);
  startPlayback();
}

export async function loadCultureTracks(cultureId, initialIndex = null) {
  const meta = CULTURES[cultureId];
  const res = await fetch(meta.dataFile);
  const data = await res.json();
  setTracks(data.tracks, initialIndex);
  return data.tracks;
}

export function getPlayer() {
  return player;
}
