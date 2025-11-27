# WhatsApp to PDF Converter

Convert WhatsApp chat exports (Android/iOS) into beautifully formatted PDFs that look like the chat interface.

## 📋 Features

- ✅ **Multi-Platform Support**: Works with both Android and iOS exports
- ✅ **Chat Types**: Personal, Business, Group, and Disappearing messages
- ✅ **Privacy Mode**: Option to seal/hide contact names and messages
- ✅ **WhatsApp-Style UI**: Chat bubbles with proper formatting
- ✅ **Media Support**: Optional image inclusion at end of PDF
- ✅ **Original Timestamps**: Preserves exact datetime format
- ✅ **Multi-Language**: Python, Node.js, and Go implementations

## 📁 Project Structure

```
whatsapp-to-pdf/
├── config/
│   └── theme.json                 # Shared colors, layout config
│
├── python/
│   ├── __init__.py
│   ├── cli.py                     # Command-line interface
│   ├── parser.py                  # ZIP reader, platform detection, message parsing
│   ├── renderer.py                # PDF generation with ReportLab
│   └── utils.py                   # Helper functions
│
├── node/
│   ├── package.json
│   ├── cli.js                   # CLI entry point
│   ├── parser.js                  # Message parser
│   ├── renderer.js                # PDF generation with PDFKit
│   └── utils.js                   # Helper functions
│
└── go/
    ├── main.go                    # CLI entry point
    ├── go.mod                     # Dependencies
    ├── parser/
    │   └── parser.go              # Message parser
    └── renderer/
        └── renderer.go            # PDF generation with gofpdf
```

## 🚀 Installation

### Python Version

```bash
cd python
pip install reportlab
```

**Dependencies:**
- reportlab >= 4.0.0

### Node.js Version

```bash
cd node
npm install
```

**Dependencies:**
- pdfkit ^0.13.0
- adm-zip ^0.5.10
- commander ^11.0.0

### Go Version

```bash
cd go
go mod download
go build -o whatsapp-pdf main.go
```

**Dependencies:**
- github.com/jung-kurt/gofpdf v1.16.2

## 💻 Usage

### Python

```bash
# Basic usage
python cli.py /path/to/whatsapp_export.zip

# With options
python cli.py /path/to/whatsapp_export.zip \
  --output output.pdf \
  --main-user "John Doe" \
  --seal \
  --images

# All options
python cli.py input.zip \
  -o output.pdf \              # Output PDF path
  -u "John Doe" \              # Main user (appears on right)
  -s \                         # Seal contacts (privacy mode)
  -i \                         # Include images
  -c config/theme.json         # Custom theme config
```

### Node.js

```bash
# Basic usage
node cli.js input.zip

# With options
node cli.js input.zip \
  --output output.pdf \
  --main-user "John Doe" \
  --seal \
  --images

# Using as CLI tool (after npm link)
whatsapp-pdf input.zip -o output.pdf -u "John Doe" -s -i
```

### Go

```bash
# Build first
go build -o whatsapp-pdf main.go

# Basic usage
./whatsapp-pdf -input input.zip

# With options
./whatsapp-pdf \
  -input input.zip \
  -output output.pdf \
  -main-user "John Doe" \
  -seal \
  -images \
  -config config/theme.json
```

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

## ⚙️ Configuration

The `config/theme.json` file controls the PDF appearance:

```json
{
  "colors": {
    "main_user_bubble": "#DCF8C6",
    // Light green for your messages
    "other_user_bubble": "#E6E6FA",
    // Light blue for other messages
    "main_user_text": "#006400",
    // Dark green text
    "other_user_text": "#323296",
    // Dark blue text
    "datetime_text": "#646464",
    // Gray timestamp
    "sealed_text": "#000000"
    // Black for sealed content
  },
  "layout": {
    "page_width": 595.27,
    // A4 width in points
    "page_height": 841.89,
    // A4 height in points
    "margin": 40,
    // Page margins
    "bubble_max_width_percent": 0.65,
    // Max bubble width (65% of page)
    "bubble_padding": 8,
    // Padding inside bubbles
    "bubble_radius": 10,
    // Rounded corner radius
    "message_spacing": 15
    // Space between messages
  },
  "fonts": {
    "title": ""
  }
}
```

## 📱 How to Export WhatsApp Chat

### Android
1. Open WhatsApp chat → Tap ⋮ menu
2. **More** → **Export chat**
3. Choose **With media** or **Without media**
4. Save the ZIP file

### iOS
1. Open chat → Tap contact name
2. **Export Chat**
3. Choose **Attach Media** or **Without Media**
4. Save the ZIP file