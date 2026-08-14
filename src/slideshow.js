import { CULTURES, SLIDE_DURATION_MS } from './config.js';
import { isMobile } from './utils.js';

let timer = null;
let currentIndex = 0;
let images = [];

export function initSlideshow(containerEl, cultureId) {
  if (!containerEl) return;
  setCulture(cultureId, containerEl);
}

export function setCulture(cultureId, containerEl) {
  const culture = CULTURES[cultureId];
  if (!culture) return;

  images = isMobile() ? culture.mobileImages : culture.webImages;
  currentIndex = 0;

  if (timer) clearInterval(timer);

  containerEl.innerHTML = '';
  images.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');
    slide.style.backgroundImage = `url('${src}')`;
    slide.dataset.index = i;
    containerEl.appendChild(slide);
  });

  timer = setInterval(() => advanceSlide(containerEl), SLIDE_DURATION_MS);
}

function advanceSlide(containerEl) {
  const slides = containerEl.querySelectorAll('.slide');
  if (!slides.length) return;

  slides[currentIndex]?.classList.remove('active');
  currentIndex = (currentIndex + 1) % slides.length;
  slides[currentIndex]?.classList.add('active');
}

export function destroySlideshow() {
  if (timer) clearInterval(timer);
  timer = null;
}

window.addEventListener('resize', () => {
  const container = document.getElementById('slideshow');
  const active = document.querySelector('.culture-tab.active')?.dataset.culture;
  if (container && active) {
    setCulture(active, container);
  }
});
