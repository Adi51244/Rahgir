import { CULTURES } from './config.js';
import { formatTime } from './utils.js';

const cardsEl = document.getElementById('playlist-cards');
const detailEl = document.getElementById('playlist-detail');

async function init() {
  for (const [id, meta] of Object.entries(CULTURES)) {
    const res = await fetch(meta.dataFile);
    const data = await res.json();
    const thumb = data.tracks[0]?.thumbnail || '';

    const card = document.createElement('a');
    card.className = 'playlist-card';
    card.href = '#';
    card.innerHTML = `
      <img src="${thumb}" alt="${meta.label}" loading="lazy" />
      <div>
        <h3>${meta.emoji} ${meta.label}</h3>
        <p>${meta.route}</p>
        <p>${data.tracks.length} गाने · ${meta.boarding}</p>
      </div>
    `;
    card.addEventListener('click', (e) => {
      e.preventDefault();
      showDetail(id, meta, data.tracks);
    });
    cardsEl.appendChild(card);
  }

  const params = new URLSearchParams(window.location.search);
  const culture = params.get('culture');
  if (culture && CULTURES[culture]) {
    const meta = CULTURES[culture];
    const res = await fetch(meta.dataFile);
    const data = await res.json();
    showDetail(culture, meta, data.tracks);
  }
}

function showDetail(id, meta, tracks) {
  detailEl.innerHTML = `
    <h2 class="section-title">${meta.emoji} ${meta.label} — ${tracks.length} गाने</h2>
    <p style="color:var(--text-muted);margin-bottom:1rem;font-size:0.85rem">
      <a href="${meta.ytMusic}" target="_blank" rel="noopener">YouTube Music पर सुनें ↗</a>
      · <a href="/?culture=${id}">रेडियो पर चलाएं ↗</a>
    </p>
    <ul class="song-list" id="detail-list"></ul>
  `;

  const list = document.getElementById('detail-list');
  tracks.forEach((track, i) => {
    const li = document.createElement('li');
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
      window.location.href = `/?culture=${id}&track=${i}`;
    });
    list.appendChild(li);
  });

  detailEl.scrollIntoView({ behavior: 'smooth' });
}

init();
