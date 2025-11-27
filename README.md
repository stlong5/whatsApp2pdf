# WhatsApp to PDF Converter

Convert WhatsApp chat exports into beautiful, printable PDF files.  
Supports multi-language text, emoji rendering, image attachments, themes, and more.

## 📋 Features

- ✅ **Multi-Platform Support**: Works with both Android and iOS exports
- ✅ **Chat Types**: Personal, Business, Group, and Disappearing messages
- ✅ **Privacy Mode**: Option to seal/hide contact names and messages
- ✅ **WhatsApp-Style UI**: Chat bubbles with proper formatting
- ✅ **Media Support**: Optional image inclusion at end of PDF
- ✅ **Original Timestamps**: Preserves exact datetime format
- ✅ **Multi-Language**: Python, Node.js, and Go implementations

Currently available in:

| Language | Status         | Path                   |
|----------|----------------|------------------------|
| Node.js  | ✅ Stable       | [`./node`](./node)     |
| Python   | 🔜 Coming soon | [`./python`](./python) |
| Go       | 🔜 Coming soon | [`./go`](./go)         |

## 📦 Node.js Usage (Quick Example)

```bash
npm install whatsapp2pdf
whatsapp2pdf chat.zip -o out.pdf
```

➡ Full Node.js documentation:  
👉 **[`./node/README.md`](./node/README.md)**

---

## 🖼 Themes & Assets

Themes, fonts and default backgrounds are located in:

```
assets/
  fonts/
  themes/
```

---

## 📱 How to Export WhatsApp Chat

### Android

1. Open WhatsApp chat
2. Tap the three dots (⋮) menu
3. Select **More** → **Export chat**
4. Choose **With media** or **Without media**
5. Save the ZIP file

### iOS

1. Open WhatsApp chat
2. Tap contact/group name at top
3. Scroll down and tap **Export Chat**
4. Choose **Attach Media** or **Without Media**
5. Save the ZIP file

## 📄 License

MIT © [stlong5](https://github.com/stlong5)

## 📮 Support

- 🐛 [Report Bug](https://github.com/stlong5/whatsApp2pdf/issues)
- 💡 [Request Feature](https://github.com/stlong5/whatsApp2pdf/issues)
- ⭐ [Star on GitHub](https://github.com/stlong5/whatsApp2pdf)

---

**Made with ❤️ for preserving memories**