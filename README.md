# <img src="public/favicon.svg" width="36" height="36" alt="राहगीर Logo" style="vertical-align:middle;margin-right:8px" /> राहगीर — 5 Cultures & Moods Bus Radio

🌐 **Live Website**: [https://rahgir-beige.vercel.app/](https://rahgir-beige.vercel.app/)

A viral-style highway bus music radio website inspired by [busdriver.wtf](https://busdriver.wtf/) and [deluxesalon.in](https://deluxesalon.in/). Sit on a virtual bus passenger seat, pick your culture and mood, and listen to nonstop music all night — across the Himalayas, Punjab, Delhi, Haryana, and the Ganges.

---

## 🚍 5 Cultures & Routes

| Culture | Service | Route | Moods Available |
|---------|---------|-------|-----------------|
| **🌾 पंजाबी (Default)** | सरहद सेवा | अमृतसर – चंडीगढ़ – दिल्ली | 🌾 ऑल-टाइम हिट्स, ❤️ Love, 💔 Sad |
| **📻 हिंदी** | राजधानी सेवा | दिल्ली – आगरा – जयपुर | ❤️ Love, 📻 Old Classics, 🎉 Party |
| **🚜 हरियाणवी** | देसी सेवा | रोहतक – गुरुग्राम – हिसार | 🎉 Party, ❤️ Love |
| **🪔 भोजपुरी** | गंगा सेवा | पटना – वाराणसी – गंगा घाट | 🪔 गंगा सेवा हिट्स, 🪔 छठ Special |
| **🇳🇵 नेपाली** | हिमालय सेवा | काठमाण्डौ – पोखरा – बागलुङ | 🏔️ हिमालयन धुन |

---

## ✨ Features

- **Dynamic Mood Selector** — Switch instantly between Love, Old Classics, Party, Sad, and Chhath Special mood playlists right under the culture tabs.
- **Surprise Song on Every Visit** — Every time you visit or switch cultures/moods, a fresh random surprise track from that playlist is cued up.
- **Continuous Background Playback** — Browse Playlists and Songs views without interrupting audio playback.
- **Interactive Horn System** — Realistic Indian & regional bus horns (`🚌 हॉर्न OK Please`) that dynamically duck background music volume while playing.
- **Shareable Travel Ticket** — Generates a retro bus boarding ticket with live route info, song title, departure time, seat number, and QR code pointing to [rahgir-beige.vercel.app](https://rahgir-beige.vercel.app/).
- **Lightweight Optimized Scenery** — Fullscreen 15s rotating cross-fade slideshow with WebP backgrounds and lazy prefetching.
- **Audio Visualizer / Rotating CD** — Real album art from YouTube with rotating animation.
- **Real-Time Live Clock & Altitude** — Live Hindi time format and regional mountain elevation metrics.
- **Vercel Analytics Integrated** — Built-in traffic and interaction analytics.

---

## 📁 Asset Folders

Roadway scenery images for Web (16:9) and Mobile (9:16):

```
Asset/
├── Punjab/     # Web & Mobile scenery
├── Hindi/      # Web & Mobile scenery
├── Haryana/    # Web & Mobile scenery
├── Bihar/      # Web & Mobile scenery
├── Nepal/      # Web & Mobile scenery
└── Horn Sound/ # Regional bus horn MP3s
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Play / Pause music |
| **← / →** | Previous / Next song |
| **N / P** | Next / Previous track |
| **Q** | Open / Close Queue panel |
| **T** | Generate & Share Ticket |
| **H** | Blow Bus Horn |
| **Esc** | Close overlays & modals |

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 📬 Contact & Credits

- **Author**: **[Aditya Kumar](https://github.com/Adi51244)** ([@Adi51244](https://github.com/Adi51244))
- **Email**: [goswamiadi79@gmail.com](mailto:goswamiadi79@gmail.com)
- **Repository**: [https://github.com/Adi51244/Rahgir](https://github.com/Adi51244/Rahgir)

*Audio playback streams via YouTube embedded player. All musical rights belong to their respective record labels, artists, and creators.*
