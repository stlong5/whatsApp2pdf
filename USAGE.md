# Usage Guide

## Quick Start

```bash
# Install
cd node && npm install

# Convert 
node cli.js chat_export.zip

# With theme
node cli.js chat.zip -t dark -u "Your Name" -o output.pdf

# Test
npm test

# Examples
node examples.js 1
```


## Common Use Cases

### 1. Family Chat Archive
```bash
# Create a beautiful PDF of family memories
node cli.js family_chat.zip \
  --theme light \
  --main-user "Mom" \
  --images \
  --output family_memories_2025.pdf
```

### 2. Work Chat Backup
```bash
# Professional dark theme without images
node cli.js work_project.zip \
  --theme dark \
  --main-user "Your Name" \
  --output work_backup.pdf
```

### 3. Privacy Demo
```bash
# Show chat structure without revealing content
node cli.js demo_chat.zip \
  --seal \
  --output demo_layout.pdf
```

### 4. Long-term Archive
```bash
# Complete archive with all media
node cli.js important_chat.zip \
  --images \
  --output archive_2025.pdf
```

## Step-by-Step Tutorial

### Step 1: Export from WhatsApp

**On Android:**
1. Open the chat
2. Tap ⋮ (three dots)
3. More → Export chat
4. Choose "With media" or "Without media"
5. Save to device

**On iOS:**
1. Open the chat
2. Tap contact name
3. Export Chat
4. Choose "Attach Media" or "Without Media"
5. Save to Files

### Step 2: Transfer to Computer

- Email to yourself
- Use cloud storage (Google Drive, iCloud)
- Connect via USB and copy

### Step 3: Convert to PDF

```bash
cd node
node cli.js ~/Downloads/WhatsApp\ Chat\ with\ Alice.zip
```

### Step 4: Customize (Optional)

```bash
# Try dark theme
node cli.js chat.zip --theme dark

# Set yourself as main user
node cli.js chat.zip --main-user "Your Name"

# Include images
node cli.js chat.zip --images
```

## Theme Customization

### Using Built-in Themes

```bash
# Light theme (default)
node cli.js chat.zip --theme light

# Dark theme
node cli.js chat.zip --theme dark
```

### Creating Custom Theme

1. Copy an existing theme:
```bash
cp ../assets/themes/light/light.json ../assets/themes/custom/custom.json
```

2. Edit `custom.json` with your colors:
```json
{
  "background_color": "#YOUR_COLOR",
  "bubble": {
    "color": "#YOUR_BUBBLE_COLOR",
    "color_other": "#THEIR_BUBBLE_COLOR"
  }
}
```

3. Use your theme:
```bash
node cli.js chat.zip --theme-path ../assets/themes/custom/custom.json
```

## Advanced Features

### Message Filtering

Create a script to filter messages:

```javascript
const WhatsAppParser = require('./parser');
const PDFRenderer = require('./renderer');
const { loadTheme } = require('./utils');

async function filterByDate() {
  const parser = new WhatsAppParser('chat.zip');
  const chatData = await parser.parse();
  
  // Filter last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  chatData.messages = chatData.messages.filter(msg => 
    msg.parsedDatetime >= sevenDaysAgo
  );
  
  const theme = loadTheme('../assets/themes/light/light.json');
  const renderer = new PDFRenderer(theme);
  await renderer.render({
    chatData,
    outputPath: 'last_week.pdf',
    mainUser: 'Me',
    sealContacts: false,
    includeImages: false
  });
}

filterByDate();
```

### Batch Processing

Process multiple chats:

```javascript
const fs = require('fs');
const path = require('path');

async function batchConvert() {
  const chatDir = './chats';
  const files = fs.readdirSync(chatDir).filter(f => f.endsWith('.zip'));
  
  for (const file of files) {
    console.log(`Processing: ${file}`);
    const parser = new WhatsAppParser(path.join(chatDir, file));
    const chatData = await parser.parse();
    
    const theme = loadTheme('../assets/themes/light/light.json');
    const renderer = new PDFRenderer(theme);
    await renderer.render({
      chatData,
      outputPath: `output_${file.replace('.zip', '.pdf')}`,
      mainUser: chatData.contacts[0],
      sealContacts: false,
      includeImages: false
    });
  }
}
```

### Statistics Report

Get chat statistics before converting:

```javascript
async function analyzeChat() {
  const parser = new WhatsAppParser('chat.zip');
  const chatData = await parser.parse();
  
  console.log('Chat Analysis:');
  console.log('─'.repeat(40));
  console.log(`Total Messages: ${chatData.totalMessages}`);
  console.log(`Participants: ${chatData.contacts.join(', ')}`);
  console.log(`Media Files: ${Object.keys(chatData.mediaFiles).length}`);
  
  // Most active participant
  const counts = {};
  chatData.messages.forEach(m => {
    counts[m.sender] = (counts[m.sender] || 0) + 1;
  });
  
  const mostActive = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0];
  
  console.log(`Most Active: ${mostActive[0]} (${mostActive[1]} messages)`);
}
```

## Troubleshooting Tips

### Large Files (50K+ messages)

```bash
# Increase memory limit
node --max-old-space-size=4096 cli.js large_chat.zip
```

### Special Characters

Ensure your terminal supports UTF-8:
```bash
export LANG=en_US.UTF-8
node cli.js chat.zip
```

### Windows Path Issues

Use quotes for paths with spaces:
```bash
node cli.js "C:\Users\Name\Downloads\WhatsApp Chat.zip"
```

### Permission Errors

Run with appropriate permissions:
```bash
# Linux/Mac
sudo node cli.js chat.zip

# Windows (as Administrator)
node cli.js chat.zip
```

## Performance Optimization

### Disable Images for Speed
```bash
# Much faster for large chats
node cli.js chat.zip --no-images
```

### Process During Off-Hours
```bash
# Schedule for later (Linux/Mac)
echo "node cli.js huge_chat.zip" | at 2am

# Windows Task Scheduler
# Or use a scheduled task
```

## Best Practices

1. **Backup Original**: Keep the ZIP file
2. **Test Small First**: Try with a small chat
3. **Use Themes**: Dark for screen, Light for print
4. **Privacy Mode**: Use --seal for demos
5. **Name Outputs**: Use descriptive names
6. **Check Output**: Always verify the PDF

## Getting Help

Run any command with `--help`:
```bash
node cli.js --help
```

Enable debug mode:
```bash
DEBUG=1 node cli.js chat.zip
```

## Next Steps

- Try the test suite: `npm test`
- Run examples: `node examples.js 1`
- Create custom themes
- Automate with scripts
- Share your themes with the community!

---

**Happy Converting! 📱→📄**