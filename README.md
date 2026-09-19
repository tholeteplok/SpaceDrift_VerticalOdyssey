# 🚀 SPACE DRIFT — Vertical Odyssey II

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Architecture: Native ESM](https://img.shields.io/badge/Architecture-Native%20ESM-blue.svg)](src/)
[![Audio: Web Audio API](https://img.shields.io/badge/Audio-Procedural%20Synth%20%2B%20BGM-orange.svg)](src/js/audio/)

> **Space Drift: Vertical Odyssey II** adalah game arcade *vertical-scrolling endless dodger* bernuansa *cyberpunk / retro-futuristik* yang dibangun menggunakan HTML5 Canvas, Vanilla JavaScript (Native ES Modules), dan CSS3 tanpa ketergantungan bundler eksternal.

---

## 🌟 Fitur Utama

- **Arsitektur Modular Murni (Native ESM)**:
  - Dipisahkan secara bersih menjadi modul-modul independen: *Core, Entities, Systems, Config, Render, Audio,* dan *UI*.
  - Pemisahan tanggung jawab (*Separation of Concerns*) dengan komunikasi *Decoupled EventBus*.
- **Integrasi Asset Pesawat & Asteroid Resolusi Tinggi**:
  - Armada kapal tempur futuristik: `DRIFT-01`, `NOVA-X`, `AEGIS-7`, dan `PHANTOM`.
  - **Dynamic Biome-Based Asteroid System**: Variasi rintangan asteroid berevolusi mengikuti level bioma (*Rocky, Cryo Ice, Cyber Debris, Void Amethyst,* dan *Toxic Core*).
- **Background Music (BGM) Hibrida**:
  - **Procedural Dynamic Synth Engine (0 KB)**: Musik *Dark Space Synthwave* di tangga nada D-Minor yang berdetak dan beradaptasi secara real-time terhadap situasi darurat (kecepatan, HP kritis, komet mendekat, dan Game Over).
  - **External Audio Track Player**: Mendukung pemutaran file musik audio studio bebas royalti secara *seamless loop*.
- **Peningkatan UX & Metagame (Retention Focused)**:
  - **Flight Log & Black Box Debriefing**: Layar Game Over bergaya panel kotak hitam kokpit lengkap dengan progress bar visual capaian, durasi terbang, kecepatan puncak, dan metrik telemetri.
  - **Personal Best Holographic Marker Line**: Proyeksi garis neon putus-putus di kanvas saat mendekati rekor penerbangan terbaik (*Goal Gradient Effect*).
  - **Instant Retry Loop**: Ulangi peluncuran misi tanpa jeda cukup dengan menekan tombol **SPASI** atau mengetuk layar.

---

## 📂 Struktur Proyek

```
SpaceDrift/
├── .gitignore                         # Penyaring artefak OS & data sensitif
├── README.md                          # Dokumentasi resmi proyek
├── docs/
│   └── space_drift_v3.6.html          # Golden Reference (Monolitik Asli)
└── src/
    ├── index.html                     # Entry point HTML Shell
    ├── assets/
    │   ├── ships/                     # Asset sprite PNG pesawat (SpaceShip_0-5)
    │   ├── asteroids/                 # Asset sprite PNG asteroid (Asteroid_0-5)
    │   └── audio/                     # Trek musik audio loopable (bgm_space.wav)
    ├── css/
    │   ├── variables.css              # Desain token: CSS Variables & neon palette
    │   ├── base.css                   # Global layout & vignette canvas
    │   ├── hud.css                    # In-game HUD, perisai, & energy bar
    │   └── overlays.css               # Menu, Hangar, Profil, & Black Box dialogs
    └── js/
        ├── config/                    # Konstanta fisika, senjata, tema, rintangan
        ├── core/                      # State manager, Loop, EventBus, AssetLoader
        ├── audio/                     # Web Audio Synthesizer, Sound Effects, Music Engine
        ├── input/                     # Multi-touch 3-zone handler & Keyboard Controller
        ├── entities/                  # Ship, Asteroids, Bullets, Pickups, Particles
        ├── systems/                   # Physics, Gravitasi Newtonian, Collision, Near-miss
        ├── render/                    # Parallax background, Minimap radar, Canvas compositor
        ├── ui/                        # HUD, Hangar/Menu Navigation, Profile config
        └── main.js                    # Application bootstrap & orchestrator
```

---

## 🎮 Kontrol Permainan

### Desktop / Keyboard:
- **`←` / `A`**: Bergerak ke kiri
- **`→` / `D`**: Bergerak ke kanan
- **`↑` / `W`**: Dorong vertikal (*Thrust*)
- **`SPASI`**: Manuver **BOOST** (atau melewati peluncuran / Instant Retry di Game Over)
- **`P`**: Jeda permainan (*Pause*)

### Layar Sentuh / Mobile:
- **Jempol Kiri**: Tahan untuk bergeser ke kiri, ketuk cepat untuk *dodge* kiri.
- **Zona Tengah**: Tahan untuk dorong lebih cepat, ketuk ganda (*double tap*) untuk **BOOST**.
- **Jempol Kanan**: Tahan untuk bergeser ke kanan, ketuk cepat untuk *dodge* kanan.

---

## 🚀 Cara Menjalankan Secara Lokal

Karena proyek ini menggunakan **Native ES Modules (`type="module"`)**, jalankan folder `src/` menggunakan web server lokal:

```bash
# Opsi 1: Menggunakan Python
python -m http.server 8080 --directory src

# Opsi 2: Menggunakan Node.js npx serve
npx serve src

# Opsi 3: Menggunakan VS Code Live Server
Buka folder proyek di VS Code, klik kanan pada `src/index.html` dan pilih "Open with Live Server".
```

Buka peramban Anda di `http://localhost:8080` (atau port yang tertera).

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Bebas untuk dimodifikasi dan dikembangkan lebih lanjut.
