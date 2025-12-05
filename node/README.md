# WhatsApp2PDF (Node.js)

![node](https://img.shields.io/badge/node-%3E=18.7-blue)
[![npm version](https://badge.fury.io/js/whatsapp2pdf.svg)](https://www.npmjs.com/package/whatsapp2pdf)
[![npm downloads](https://img.shields.io/npm/dm/whatsapp2pdf.svg)](https://www.npmjs.com/package/whatsapp2pdf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Transform WhatsApp messages into beautiful, printable PDF documents (with TypeScript support).**

Convert WhatsApp chat exports (Android & iOS) into professional PDF files with authentic WhatsApp styling, emoji
support, themes, and media attachments. Perfect for preserving memories, creating archives, or sharing conversations.

---

## 🌟 Why WhatsApp2PDF?

- 📱 **Universal Support** - Works with both Android and iOS exports
- 🎨 **Beautiful Themes** - Light & Dark WhatsApp-authentic themes included
- 🔒 **Privacy First** - Optional privacy mode to hide sensitive information
- 🖼️ **Media Included** - Optionally embed images in your PDF
- 🌍 **International** - Full emoji and multi-language support (Chinese, Japanese, Korean)
- ⚡ **Lightning Fast** - High-performance rendering for large chats
- 🛠️ **Developer Friendly** - CLI and programmatic API
- 📄 **Professional Output** - A4-sized PDFs ready to print or share

---

## 📦 Installation

### Global (Recommended for CLI)

```bash
npm install -g whatsapp2pdf
```

### Local (For Node.js projects)

```bash
npm install whatsapp2pdf
```

**Requirements:** Node.js 18.7 or higher

---

## 🚀 Quick Start

### 📋 CLI Usage

```bash
# Basic conversion
whatsapp2pdf chat.zip

# With options
whatsapp2pdf chat.zip -o my-chat.pdf --theme dark --images

# Full help
whatsapp2pdf --help
```

### 📋 CLI Options

| Option                     | Description             | Default        |
|----------------------------|-------------------------|----------------|
| `--list-themes`            | Display built‑in themes | -              |
| `-o, --output <file>`      | Output PDF path         | Auto-generated |
| `-u, --main-user <name>`   | Set right‑side sender   | First contact  |
| `-p, --privacy`            | Hide contact names      | `true`         |
| `-i, --images`             | Include attachments     | `true`         |
| `-t, --theme <name>`       | Theme: `light` / `dark` | `light`        |
| `--theme-path <json>`      | Load custom theme JSON  | -              |
| `-s, --start <YYYY-MM-DD>` | Filter start date       | -              |
| `-e, --end <YYYY-MM-DD>`   | Filter end date         | -              |
| `-k, --keyword <word>`     | Keyword filter          | -              |
| `-v, --verbose`            | Debug info              | -              |
| `-h, --help`               | Show help               | -              |
| `-V, --version`            | Show version            | -              |

### 🛠️ Programmatic Usage

```javascript
const WhatsApp2PDF = require("whatsapp2pdf");

// Simple conversion
await WhatsApp2PDF("./chat.zip")
    .output("chat.pdf")
    .convert();

// Advanced options
await WhatsApp2PDF("./chat.zip")
    .theme("dark")
    .mainUser("Your Name")
    .seal()              // Privacy mode
    .images()            // Include media
    .searchDate("2024-01-01", "2024-12-31")
    .output("chat.pdf")
    .convert();
```

### 🛠️ Methods

**`.output(path)`** - Set output PDF path  
**`.theme(name|path|object)`** - Set theme  
**`.mainUser(name)`** - Set right-side sender  
**`.seal(enable)`** - Partially hide contact names  
**`.images(enable)`** - Include media  
**`.searchDate(start, end)`** - Filter by date  
**`.searchKeyword(keyword)`** - Filter by keyword  
**`.verbose(enable)`** - Enable debug logging  
**`.parse()`** - Parse without generating PDF  
**`.convert()`** - Generate PDF

### 🛠️ Static Methods

**`WhatsApp2PDF.listThemes()`** - Get available themes

---

## 🎨 Features

### Multiple Themes

- ✅ Built-in Light & Dark themes
- ✅ Custom theme support (JSON)
- ✅ WhatsApp-authentic styling

### Privacy Mode

- 🔒 Partially hide contact names (e.g., "Alice" → "Al***ce")
- 🔒 Chat messages remain visible
- 🔒 Perfect for demos and presentations

### Search & Filter

- 🔍 Filter by date range
- 🔍 Search by keywords
- 🔍 Extract specific conversations

### Media Support

- 🖼️ Images (JPG, PNG, GIF, WebP, HEIC, AVIF)

### Multi-Language Support

- 🌍 Full emoji rendering
- 🇨🇳 Chinese (Simplified & Traditional)
- 🇯🇵 Japanese (Hiragana, Katakana, Kanji)
- 🇰🇷 Korean (Hangul)

---

## ⚙ Architecture Diagram

```
[ CLI / API ]
      |
      v
+----------------+
|   Parser       |
|  chat.zip/txt  |
+----------------+
      |
      v
+----------------+
|  Renderer      |
| PDFKit + sharp |
+----------------+
      |
      v
   output.pdf
```

## 🎨 Themes

### Built-in Themes

```bash
whatsapp2pdf --list-themes
```

#### **Light Theme**

```json
{
  "background_color": "#EAE6DF",
  "background_image": "./light.png",
  "bubble": {
    "color": "#D9FDD3",
    "color_other": "#FFFFFF"
  },
  "fonts": {
    "color": "#111B21",
    "family": "Helvetica",
    "size": 14
  }
}

```

#### **Dark Theme**

```json
{
  "background_color": "#0A1014",
  "background_image": "./dark.png",
  "bubble": {
    "color": "#144D37",
    "color_other": "#233138"
  },
  "fonts": {
    "color": "#F7F8FA",
    "family": "Helvetica",
    "size": 14
  }
}
```

#### **Custom Themes**

Theme JSON supports:

- background_color
- background_image (file / URL / base64)
- bubble styles
- fonts
- layout margins
- watermark

Use with:

```bash
whatsapp2pdf chat.zip --theme-path ./my-theme.json
```

---

## 🧪 Testing

```bash
npm test
```

---

## 🐛 Troubleshooting

### Memory Issues (Large Chats)

```bash
node --max-old-space-size=4096 $(which whatsapp2pdf) chat.zip
```

### Emoji Not Rendering

Install Noto Emoji font in `assets/fonts/NotoEmoji.ttf`

### No Chat File Found

Ensure ZIP contains a file starting with "WhatsApp Chat" and ending with `.txt`

---

## 📊 Performance

- ⚡ Handles chats with 50K+ messages
- 🖼️ Processes hundreds of images
- 📦 Optimized memory usage
- 🚀 Fast multi-page rendering

---

## 🤝 Contributing

Contributions welcome! Please see our [GitHub repository](https://github.com/stlong5/whatsApp2pdf).

---

## 📄 License

MIT © [stlong5](https://github.com/stlong5)

---

## ⭐ Support This Project

If WhatsApp2PDF saves you time or helps preserve your memories:

- ⭐ [Star on GitHub](https://github.com/stlong5/whatsApp2pdf)
- 🐛 [Report Issues](https://github.com/stlong5/whatsApp2pdf/issues)
- 💡 [Request Features](https://github.com/stlong5/whatsApp2pdf/issues)
- ☕ [Sponsor](https://github.com/sponsors/stlong5)

---

## 🔗 Links

- **NPM Package:** https://www.npmjs.com/package/whatsapp2pdf
- **GitHub:** https://github.com/stlong5/whatsApp2pdf
- **Documentation:** [View Full Docs](https://github.com/stlong5/whatsApp2pdf/tree/main/node)

---

**Made with ❤️ for preserving memories**