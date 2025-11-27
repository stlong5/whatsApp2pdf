# WhatsApp2PDF (Node.js)

[![node](https://img.shields.io/badge/node-%3E=18.7-blue)]
[![npm version](https://badge.fury.io/js/whatsapp2pdf.svg)](https://www.npmjs.com/package/whatsapp2pdf)
[![npm downloads](https://img.shields.io/npm/dm/whatsapp2pdf.svg)](https://www.npmjs.com/package/whatsapp2pdf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Node.js implementation of **WhatsApp2PDF**, a high‑performance tool that converts WhatsApp chat exports into beautiful
PDF files.

![WhatsApp to PDF Demo](https://raw.githubusercontent.com/stlong5/whatsApp2pdf/assets/output/example_01_basic.pdf)

## ✨ Features

- 🎨 **Multiple Themes** - Light & Dark WhatsApp themes included
- 📱 **Cross-Platform** - Works with Android & iOS exports
- 🔒 **Privacy Mode** - Seal/hide contact names
- 🔍 **Filters Mode** - Date, keyword
- 🖼️ **Media Support** - Include images in PDF
- 🌍 **Multi-Language** - Emoji, Chinese, Japanese, Korean support
- 📄 **Professional Output** - A4 PDF with authentic WhatsApp styling
- 🖥 CLI & programmatic API
- ⚡ High performance renderer

## ⚠️ Requirements

Requires **Node 18.7+**

## 📦 Installation

macOS / Linux / Windows supported

```bash
# Global installation (recommended for CLI)
npm install -g whatsapp2pdf

# Local installation
npm install whatsapp2pdf
```

## 🚀 Quick Start

### CLI Usage

```bash
# Basic conversion
whatsapp2pdf chat.zip -o chat.pdf

# Use dark theme
whatsapp2pdf chat.zip -o chat.pdf --images --theme ./assets/themes/dark/dark.json

# Full CLI Help
whatsapp2pdf --help
```

### 📋 CLI Options

| Option                     | Description             | Default                    |
|----------------------------|-------------------------|----------------------------|
| `--list-themes`            | Display built‑in themes | -                          |
| `-o, --output <file>`      | Output PDF path         | `whatsapp_chat_<name>.pdf` |
| `-u, --main-user <name>`   | Set right‑side sender   | First contact              |
| `-p, --privacy`            | Hide contact names      | `true`                     |
| `-i, --images`             | Include attachments     | `true`                     |
| `-t, --theme <name>`       | Theme: `light` / `dark` | `light`                    |
| `--theme-path <json>`      | Load custom theme JSON  | ""                         |
| `-s, --start <YYYY-MM-DD>` | Filter start date       | ""                         |
| `-e, --end <YYYY-MM-DD>`   | Filter end date         | ""                         |
| `-k, --keyword <word>`     | Keyword filter          | ""                         |
| `-v, --verbose`            | Debug info              | -                          |
| `-h, --help`               | Show help               | -                          |
| `-V, --version`            | Show version            | -                          |

### Programmatic Usage

```javascript
const WhatsApp2PDF = require("whatsapp2pdf");

async function run() {
    const parser = new WhatsApp2PDF("./chat.zip");

    parser.output("chat.pdf");
    parser.theme("./assets/themes/light/light.json");
    parser.images(true);

    const result = await parser.convert();
    console.log(result);
}

run();
```

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

## 🔧 Supported Fonts

Built-in PDFKit fonts:

- `Courier`, `Courier-Bold`, `Courier-Oblique`, `Courier-BoldOblique`
- `Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`, `Helvetica-BoldOblique`
- `Times-Roman`, `Times-Bold`, `Times-Italic`, `Times-BoldItalic`
- `Symbol`, `ZapfDingbats`

Additional fonts (if included in `assets/fonts/`):

- `NotoEmoji.ttf` - Emoji support
- `NotoSansJP.ttf` - Japanese
- `NotoSansKR.ttf` - Korean
- `NotoSansSC.ttf` - Chinese

## 📊 Message Types

| Type            | Description        | Rendering                  |
|-----------------|--------------------|----------------------------|
| `text`          | Regular messages   | Text with emoji support    |
| `image`         | Image attachments  | Placeholder box + filename |
| `video`         | Video attachments  | Placeholder box + filename |
| `voice`         | Voice messages     | Play icon + filename       |
| `file`          | Documents          | Placeholder box + filename |
| `sticker`       | Stickers           | Placeholder box + filename |
| `media_omitted` | Media not exported | Dashed box                 |

## 🧪 Test

```bash
npm test
```

## 🐛 Troubleshooting

### "No chat text file found"

Ensure the ZIP contains a file starting with "WhatsApp Chat" and ending with `.txt`.

### Emoji not rendering

Add Noto Emoji font to `assets/fonts/NotoEmoji.ttf`.

### Memory issues with large chats

```bash
node --max-old-space-size=4096 $(which whatsapp-pdf) chat.zip
```

## 📄 License

MIT © [stlong5](https://github.com/stlong5)

## ⭐ GitHub

https://github.com/stlong5/whatsApp2pdf

## 📮 Support

- 🐛 [Report Bug](https://github.com/stlong5/whatsApp2pdf/issues)
- 💡 [Request Feature](https://github.com/stlong5/whatsApp2pdf/issues)
- ⭐ [Star on GitHub](https://github.com/stlong5/whatsApp2pdf)

---

**Made with ❤️ for preserving memories**