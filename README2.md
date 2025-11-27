# WhatsApp2PDF — Multi‑Language Chat‑to‑PDF Converter

Convert WhatsApp chat exports into beautiful, printable PDF files.  
Supports multilingual text, emoji rendering, media attachments, theme customization, and high‑performance PDF generation.

---

## 🌍 Multi‑Language SDK

WhatsApp2PDF is designed as a cross‑language toolkit:

| Language | Status | Path |
|----------|--------|------|
| **Node.js** | ✅ Stable | `./node` |
| **Python** | 🚧 In Development | `./python` |
| **Go** | 🚧 In Development | `./go` |

Each language implementation provides:
- Programmatic API  
- CLI tool  
- Theme & asset support  
- High‑performance PDF rendering  

---

## ✨ Features

- Convert WhatsApp `.zip` or `.txt` to PDF  
- Full emoji support via Noto Emoji  
- Multilingual CN / JP / KR fonts  
- Themes with background colors & images  
- Filter by keyword / date range  
- Privacy mode (hide contact names)  
- Attach images into the final PDF  
- Cross‑platform (macOS / Linux / Windows)

---

## 📦 Quick Start (Node.js)

```bash
npm install whatsapp2pdf

whatsapp2pdf chat.zip -o chat.pdf
```

More details:  
👉 **Node.js Documentation:** `./node/README.md`

---

## 🖼 Assets (Themes & Fonts)

The shared assets directory contains:

```
assets/
  themes/
  fonts/
```

These assets are packaged into the npm module using `copy-assets`.

---

## 📜 License

MIT License © stlong5

---

## 🏷 Credits

WhatsApp UI and background images may be referenced in theme design.  
All trademarks and copyrights belong to **WhatsApp LLC / Meta Platforms Inc.**  
See `CREDITS.md`
