import { CULTURES, SLIDE_DURATION_MS } from './config.js';
import { isMobile } from './utils.js';

let timer = null;
let currentIndex = 0;
let images = [];
let slideA = null;
let slideB = null;
let activeSlot = null;
let inactiveSlot = null;
let preloadLink = null;

export function initSlideshow(containerEl, cultureId) {
  if (!containerEl) return;
  setCulture(cultureId, containerEl);
}

function preloadImage(src) {
  if (!src) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

function preloadFirstSlideLink(src) {
  if (preloadLink) preloadLink.remove();
  if (!src) return;
  preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'image';
  preloadLink.href = src;
  document.head.appendChild(preloadLink);
}

export function setCulture(cultureId, containerEl) {
  const culture = CULTURES[cultureId];
  if (!culture || !containerEl) return;

  images = isMobile() ? culture.mobileImages : culture.webImages;
  currentIndex = 0;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  containerEl.innerHTML = '';

  if (!images || !images.length) return;

  preloadFirstSlideLink(images[0]);

  // Create exactly 2 slots for seamless cross-fade transitions
  slideA = document.createElement('div');
  slideA.className = 'slide active';
  slideA.style.backgroundImage = `url('${images[0]}')`;
  slideA.setAttribute('aria-hidden', 'true');

  slideB = document.createElement('div');
  slideB.className = 'slide';
  slideB.setAttribute('aria-hidden', 'true');

  containerEl.appendChild(slideA);
  containerEl.appendChild(slideB);

  activeSlot = slideA;
  inactiveSlot = slideB;

  // Preload next image lazily without blocking main thread
  if (images[1]) {
    setTimeout(() => {
      preloadImage(images[1]);
    }, 2000);
  }

  timer = setInterval(() => advanceSlide(), SLIDE_DURATION_MS);
}

function advanceSlide() {
  if (!images || images.length <= 1 || !activeSlot || !inactiveSlot) return;

  const nextIndex = (currentIndex + 1) % images.length;
  const nextSrc = images[nextIndex];

  // Prepare inactive slot with next image
  inactiveSlot.style.backgroundImage = `url('${nextSrc}')`;
  inactiveSlot.classList.add('active');
  activeSlot.classList.remove('active');

  currentIndex = nextIndex;

  // Swap active and inactive pointers
  const prevActive = activeSlot;
  activeSlot = inactiveSlot;
  inactiveSlot = prevActive;

  // Preload the one following next slide in the background
  const followingIndex = (currentIndex + 1) % images.length;
  if (images[followingIndex]) {
    preloadImage(images[followingIndex]);
  }
}

export function destroySlideshow() {
  if (timer) clearInterval(timer);
  timer = null;
  preloadLink?.remove();
  preloadLink = null;
  slideA = null;
  slideB = null;
  activeSlot = null;
  inactiveSlot = null;
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const container = document.getElementById('slideshow');
    const active = document.querySelector('.culture-tab.active')?.dataset.culture;
    if (container && active) setCulture(active, container);
  }, 350);
});
