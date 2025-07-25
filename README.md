
<!-- --------------------------------------------------------------------- -->
<!--                         Torrent-Share README                          -->
<!-- --------------------------------------------------------------------- -->

# Torrent-Share &nbsp;·&nbsp; Minimal P2P File Sharing  
-fast browser-to-browser transfers powered by **WebTorrent** & **React**

<p align="center">
  <img src="https://img.shields.io/badge/Tech-React%20%7C%20WebTorrent%20%7C%20Vite-blue?style=flat-square">
  <img src="https://img.shields.io/badge/Design-Swiss%20Style-red?style=flat-square">
  <img src="https://img.shields.io/github/license/shornalore/torrent-share?style=flat-square">
</p>

---

## ✨ Features

|  | |
|---|---|
| **True P2P transfers** | Files travel directly between peers via WebRTC &mdash; never stored on a server. |
| **Share & Download panels** | Drag-and-drop to seed files, or paste any magnet link to fetch. |
| **One-click magnet generation** | Every torrent you seed returns a ready-to-share magnet URI. |
| **Real-time stats** | Progress %, peer count, and up/down speeds shown in clean progress bars. |
| **Swiss design** | Sans-serif type, strict grid layout, generous whitespace, muted-red accent #BA3C3C. |
| **Zero installs / plugins** | Pure JavaScript; runs in any modern browser with native WebRTC support. |

---

## 🔗 Live Demo

Experience the hosted build here → ****  
*(Open in two tabs or devices to watch the peer connection in action.)*

---

## 🛠 Tech Stack

| Layer            | Library / Tool | Notes                                  |
|------------------|---------------|----------------------------------------|
| Front-end UI     | **React 18**  | Functional components + hooks          |
| P2P engine       | **WebTorrent**| Browser build, WebRTC transport        |
| Bundler          | **Vite**      | Lightning-fast dev & prod builds       |
| Styling          | Vanilla CSS   | CSS Grid + custom properties           |

---

## 🚀 Quick Start

```git clone https://github.com/your-user/torrent-share.git```

```cd torrent-share```

```npm install```

```npm run dev # open http://localhost:5173```


Build for production:

```npm run build```

```npm run preview # local preview of dist/```


---

## 📦 Usage

```https://torrent-share.vercel.app/```

1. **Share a file**  
   • Drag a file onto the **“Share Files”** drop-zone (or click to pick).  
   • Copy the generated magnet link and send it to a friend.

2. **Download a file**  
   • Paste a magnet link into the **“Download Files”** field.  
   • Watch the progress bar fill, then click the file name to save.

---

## 📐 Swiss Design Guidelines

| Principle               | Implementation in Torrent-Share |
|-------------------------|---------------------------------|
| Grid-based layout       | CSS Grid with asymmetric balance |
| Typography              | Helvetica / Inter for legibility |
| Color palette           | `#FFFFFF #F8F8F8 #333333` + accent `#BA3C3C` |
| Whitespace & hierarchy  | Generous spacing; form follows function |

---

## ⚠️ Browser Support

WebTorrent requires native **WebRTC**. Supported on recent versions of:

* Chrome / Edge / Opera  
* Firefox  
* Safari  
* Mobile equivalents (iOS 15+, Android 10+)

---

## 🗺 Roadmap

- [ ] Dark-mode CSS vars  
- [ ] Selective file prioritization  
- [ ] TURN fallback for symmetric NATs  
- [ ] i18n support (EN, DE, FR)

---

## 🤝 Contributing

Pull requests and issues are welcome!  
Please run `npm run lint` before submitting any PR.

1. Fork the repo & create your branch: `git checkout -b feature/foo`  
2. Commit your changes: `git commit -m "Add foo"`  
3. Push to the branch: `git push origin feature/foo`  
4. Open a Pull Request

---

## 📄 License

**MIT** © 2025 shornalore

