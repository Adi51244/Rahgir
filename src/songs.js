import { CULTURES } from './config.js';
import { formatTime } from './utils.js';

async function loadAll() {
  const container = document.getElementById('songs-container');

  for (const [id, meta] of Object.entries(CULTURES)) {
    const res = await fetch(meta.dataFile);
    const data = await res.json();

    const section = document.createElement('div');
    section.innerHTML = `<h2 class="section-title">${meta.emoji} ${meta.label} (${data.tracks.length} गाने)</h2>`;

    const ul = document.createElement('ul');
    ul.className = 'song-list';

    data.tracks.forEach((track, i) => {
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
      ul.appendChild(li);
    });

    section.appendChild(ul);
    container.appendChild(section);
  }
}

loadAll();
