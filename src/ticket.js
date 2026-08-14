import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { SITE_URL, CULTURES } from './config.js';
import { getCurrentTrack, getState } from './store.js';
import { randomSeat, nowDepartureTime } from './utils.js';

let ticketOpen = false;

export function initTicket() {
  const openBtn = document.getElementById('ticket-btn');
  const modal = document.getElementById('ticket-modal');
  const closeBtn = document.getElementById('ticket-close');
  const shareBtn = document.getElementById('ticket-share');
  const dismissBtn = document.getElementById('ticket-dismiss');

  openBtn?.addEventListener('click', openTicket);
  closeBtn?.addEventListener('click', closeTicket);
  dismissBtn?.addEventListener('click', closeTicket);
  shareBtn?.addEventListener('click', shareTicket);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeTicket();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      if (ticketOpen) closeTicket();
      else openTicket();
    }
    if (e.key === 'Escape' && ticketOpen) closeTicket();
  });
}

async function openTicket() {
  const modal = document.getElementById('ticket-modal');
  if (!modal) return;

  await renderTicket();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  ticketOpen = true;
}

function closeTicket() {
  const modal = document.getElementById('ticket-modal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  ticketOpen = false;
}

async function renderTicket() {
  const { culture } = getState();
  const track = getCurrentTrack();
  const meta = CULTURES[culture];
  const { seat, side } = randomSeat();
  const departs = nowDepartureTime();

  document.getElementById('ticket-route').textContent = meta.route;
  document.getElementById('ticket-boarding').textContent = meta.boarding;
  document.getElementById('ticket-service').textContent = meta.service;
  document.getElementById('ticket-song').textContent = track?.title || '—';
  document.getElementById('ticket-artist').textContent = track?.artist || '—';
  document.getElementById('ticket-seat').textContent = seat;
  document.getElementById('ticket-side').textContent = side;
  document.getElementById('ticket-departs').textContent = departs;

  const qrCanvas = document.getElementById('ticket-qr');
  if (qrCanvas) {
    await QRCode.toCanvas(qrCanvas, SITE_URL, {
      width: 120,
      margin: 1,
      color: { dark: '#1a0f0a', light: '#f5ebd7' },
    });
  }
}

async function captureTicketPng() {
  const el = document.getElementById('ticket-visual');
  if (!el) return null;

  const canvas = await html2canvas(el, {
    backgroundColor: '#f5ebd7',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function shareTicket() {
  const btn = document.getElementById('ticket-share');
  const orig = btn?.textContent;
  if (btn) btn.textContent = 'टिकट बन रही है…';

  try {
    const blob = await captureTicketPng();
    if (!blob) throw new Error('capture failed');

    const track = getCurrentTrack();
    const filename = `raahgir-ticket-${Date.now()}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    const text = `🚌 राहगीर — ${track?.title || 'music'}`;

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: 'राहगीर टिकट',
        text,
        files: [file],
      });
      if (btn) btn.textContent = 'शेयर हो गया!';
      setTimeout(() => { if (btn) btn.textContent = orig; }, 2000);
      return;
    }

    downloadBlob(blob, filename);

    const shareText = `${text} | ${SITE_URL}`;
    await navigator.clipboard?.writeText(shareText);

    if (btn) btn.textContent = 'PNG डाउनलोड + लिंक कॉपी!';
    setTimeout(() => { if (btn) btn.textContent = orig; }, 2500);
  } catch {
    const text = `🚌 राहगीर — ${getCurrentTrack()?.title || 'music'} | ${SITE_URL}`;
    await navigator.clipboard?.writeText(text);
    if (btn) btn.textContent = 'लिंक कॉपी हो गया!';
    setTimeout(() => { if (btn) btn.textContent = orig; }, 2000);
  }
}

export { openTicket, closeTicket };
