const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");
const {detectBackgroundImage} = require("./utils");
const author = "stlong5";
const authorLink = "https://github.com/stlong5/whatsApp2pdf";
const now = new Date();
const fonts = ["Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique", "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique", "Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic", "Symbol", "ZapfDingbats"];
const fontsExtra = [
    {name: "Emoji", file: "./assets/fonts/NotoEmoji.ttf", regex: /\p{Extended_Pictographic}/u},
    {name: "Japanese", file: "./assets/fonts/NotoSansJP.ttf", regex: /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/u},              // Hiragana, Katakana, Kanji
    {name: "Korean", file: "./assets/fonts/NotoSansKR.ttf", regex: /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u},                // Hangul, Jamo
    {
        name: "Chinese",
        file: "./assets/fonts/NotoSansSC.ttf",
        regex: /[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uFF00-\uFFEF]/u
    },  // Chinese (Simplified, Traditional)
];

class PDFRenderer {
    constructor(theme = {}) {
        this.charCache = {}
        this.theme = theme;

        // A4 size in points (72 points = 1 inch)
        // A4 = 210mm × 297mm = 595.28pt × 841.89pt
        this.pageWidth = 595.28;
        this.pageHeight = 841.89;

        // Convert pixel margins to points (assuming 96 DPI)
        this.margins = {
            left: Number(this.theme?.layout?.margin_left ?? 120) * 0.75,    // 120px = 90pt
            right: Number(this.theme?.layout?.margin_right ?? 120) * 0.75,  // 120px = 90pt
            top: Number(this.theme?.layout?.margin_top ?? 96) * 0.75,      // 96px = 72pt
            bottom: Number(this.theme?.layout?.margin_bottom ?? 96) * 0.75 // 96px = 72pt
        };

        // A4 size in points (72 points = 1 inch)
        // A4 = 210mm × 297mm = 595.28pt × 841.89pt
        this.backgrounds = {
            color: String(this.theme?.background_color ?? "#EAE6DF"),
            image: String(this.theme?.background_image ?? ""),
            ext: String(this.theme?.background_image_ext ?? ""),
            height: Number(this.pageHeight - this.margins.top - this.margins.bottom),   // content max height
            width: Number(this.pageWidth - this.margins.left - this.margins.right)      // content max width
        };

        this.bubbles = {
            color: String(this.theme?.bubble?.color ?? "#D9FDD3"),
            color_other: String(this.theme?.bubble?.color_other ?? "#FFFFFF"),
            percent: Number(this.theme?.bubble?.max_width_percent ?? 0.65),
            mTop: Number(this.theme?.bubble?.margin_top ?? 3),
            mBottom: Number(this.theme?.bubble?.margin_bottom ?? 3),
            pLeft: Number(this.theme?.bubble?.padding_left ?? 7),
            pRight: Number(this.theme?.bubble?.padding_right ?? 7),
            pTop: Number(this.theme?.bubble?.padding_top ?? 6),
            pBottom: Number(this.theme?.bubble?.padding_bottom ?? 6),
            radius: Number(this.theme?.bubble?.radius ?? 7.5)
        };

        this.fonts = {
            color: String(this.theme?.fonts?.color ?? "#111B21"),
            family: String((this.theme?.fonts?.family ?? "Helvetica").split(",")[0].trim()),
            size: Number(this.theme?.fonts?.size ?? 14)
        };

        this.bubbleMaxWidth = this.backgrounds.width * this.bubbles.percent;

        if (!fonts.includes(this.fonts.family)) throw new Error(`Supported font list: "${fonts.join('", "')}"`)
    }

    async render({chatData, outputPath, mainUser, sealContacts, includeImages}) {
        return new Promise(async (resolve, reject) => {
            let doc = null;
            let stream = null;

            try {
                // Ensure output folder exists
                fs.mkdirSync(path.dirname(outputPath), {recursive: true});

                // Update the background image to sharp buffer
                if (this.backgrounds.image) {
                    this.backgrounds = await detectBackgroundImage(this.backgrounds, this.theme.path);
                    this.backgrounds.image = await sharp(this.backgrounds.image)
                        .png({quality: 80, palette: true, effort: 1})
                        .toBuffer();
                }

                // Create PDF document
                doc = new PDFDocument({
                    size: "A4",
                    font: this.fonts.family,
                    fontSize: this.fonts.size,
                    bufferPages: true,
                    margins: {
                        top: this.margins.top,
                        bottom: this.margins.bottom,
                        left: this.margins.left,
                        right: this.margins.right
                    },
                    info: {
                        Title: "WhatsApp Chat Export",
                        Author: author,
                        Subject: "WhatsApp conversation archive",
                        Keywords: "WhatsApp conversation archive"
                    }
                });

                // register new font
                for (const fonts of fontsExtra) {
                    const fontPath = path.join(__dirname, fonts.file);
                    if (fs.existsSync(fontPath)) {
                        doc.registerFont(fonts.name, fontPath);
                    } else {
                        console.warn(`${fonts.name} font not found and may not render correctly.`);
                    }
                }

                doc.on("pageAdded", () => {
                    // Add Background
                    this._drawBackground(doc);
                })

                // Pipe to file
                stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);

                // Add background if image exists
                this._drawBackground(doc);

                // Draw header
                const headerHeight = this._drawHeader(doc, chatData, sealContacts);

                // Draw messages
                let yPos = this.margins.top + headerHeight; // Start below header

                for (let i = 0; i < chatData.messages.length; i++) {
                    const message = chatData.messages[i];
                    const isMainUser = message.sender === mainUser;

                    yPos = await this._drawMessage(doc, message, yPos, isMainUser, sealContacts);
                }

                // Add images if requested
                if (includeImages && Object.keys(chatData.mediaFiles).length > 0) {
                    await this._addImages(doc, chatData.mediaFiles);
                }

                // add footer and watermark for all pages
                const range = doc.bufferedPageRange();
                for (let i = range.start, end = range.start + range.count; i < end; i++) {
                    doc.switchToPage(i);
                    // Add footer
                    this._drawFooter(doc, i + 1);

                    // Add watermark
                    this._drawWatermark(doc);
                }

                // Finalize PDF
                doc.end();

                stream.on("finish", () => resolve());
                stream.on("error", reject);
            } catch (e) {
                // Finalize the PDF document (if it exists)
                // This attempts to write any remaining content and close the document internally.
                if (doc && !doc._ended) doc.end();

                // Destroy the stream (if it exists and is open)
                // This immediately stops writing to the file and releases the file handle.
                if (stream && !stream.destroyed) stream.destroy();

                reject(e);
            }
        });
    }

    _drawBackground(doc) {
        // Fill background color
        doc.save()
            .rect(0, 0, this.pageWidth, this.pageHeight)
            .fillOpacity(0.5)
            .fill(this.backgrounds.color);

        // Add background image if it exists
        if (this.backgrounds.image) {
            doc.image(this.backgrounds.image, 0, 0, {
                width: this.pageWidth,
                height: this.pageHeight
            });
        }

        doc.restore();
    }

    _drawHeader(doc, chatData, sealContacts) {
        const x = this.margins.left;
        const y = this.margins.top;

        const names = chatData.contacts.map(name => this._sealedSender(name, sealContacts));

        doc.save()
            .fontSize(this.fonts.size * 1.15)
            .fillColor(this.fonts.color)
            .fillOpacity(1)
            .text("WhatsApp Chat Export", x, y)
            .fontSize(this.fonts.size * 0.95)
            .fillOpacity(0.8)
            .text(`Platform: ${chatData.platform} | Messages: ${chatData.totalMessages}`, x, y + this.fonts.size * 1.35)
            .fontSize(this.fonts.size * 0.85);

        const participants = `Participants: ${names.slice(0, 3).join(", ")}${names.length > 3 ? `, ...+${names.length - 3}` : ""}`
        this._drawSender(doc, participants, x, y + this.fonts.size * 2.45)

        doc.restore();

        return this.fonts.size * 2.45 + doc.currentLineHeight(true);
    }

    _drawFooter(doc, pageNum) {
        const totalPages = doc.bufferedPageRange().count;
        const y = this.pageHeight - this.margins.bottom * 0.5;
        const licenseText = `Generated by ${author}`;
        const pagingText = `Page ${pageNum} of ${totalPages}`;

        doc.save().fontSize(this.fonts.size * 0.7)

        const lineHeight = doc.currentLineHeight(true);
        const licenseWidth = doc.widthOfString(licenseText);
        const pagingWidth = doc.widthOfString(pagingText);
        const licenseXpos = (this.pageWidth - licenseWidth) / 2;

        doc.fillColor(this.fonts.color)
            .fillOpacity(0.8)
            .text(licenseText, licenseXpos, y, {
                lineBreak: false
            })
            .text(pagingText, this.pageWidth - this.margins.right - pagingWidth, y, {
                lineBreak: false
            })
            .fontSize(this.fonts.size * 0.5)
            .text(`Exported: ${now.toString()}`, this.margins.left, y + this.margins.bottom * 0.3, {
                lineBreak: false
            })

        // manually add link due to text() options.link occur error
        // options.textWidth : undefined; options.wordCount : undefined;
        doc.link(licenseXpos, y, licenseWidth, lineHeight, authorLink);

        doc.restore();
    }

    _drawWatermark(doc) {
        if (this.theme.watermark) {
            const watermarkText = this.theme.watermark.text ?? author;
            doc.save()
                .rotate(-45, {origin: [this.pageWidth / 2, this.pageHeight / 2]})
                .fontSize(this.theme.watermark.size)
                .fillColor(this.fonts.color)
                .fillOpacity(0.5);

            if (this.theme.watermark.style.toLowerCase() === "tiled") {
                const spacingX = 150; // horizontal gap between repeats
                const spacingY = 90; // vertical gap between repeats

                // Tile the watermark text across the rotated coordinate grid
                for (let y = -this.pageHeight; y < this.pageHeight * 2; y += spacingY) {
                    for (let x = -this.pageWidth; x < this.pageWidth * 2; x += spacingX) {
                        doc.text(watermarkText, x, y, {
                            lineBreak: false
                        });
                    }
                }
            }

            if (this.theme.watermark.style.toLowerCase() === "centered") {
                // Center the watermark text across the rotated coordinate grid
                doc.text(watermarkText, this.pageWidth / 2 - doc.widthOfString(watermarkText) / 2, this.pageHeight / 2, {
                    lineBreak: false
                });
            }

            doc.restore();
        }
    }

    async _drawMessage(doc, message, yPos, isMainUser, sealContacts) {
        const content = await this._layoutMessageContent(doc, message);
        const bubbleWidth = content.totalWidth + this.bubbles.pLeft + this.bubbles.pRight;
        const bubbleHeight = content.totalHeight + this.bubbles.pTop + this.bubbles.pBottom;
        const bubbleColor = isMainUser ? this.bubbles.color : this.bubbles.color_other;
        const xPos = isMainUser ? this.pageWidth - this.margins.right - bubbleWidth : this.margins.left;
        const labelxPos = xPos + this.bubbles.pLeft;
        let stringXpos = labelxPos;

        doc.fontSize(this.fonts.size * 0.8).fillColor(this.fonts.color).fillOpacity(0.8);
        const lineHeight = doc.currentLineHeight();

        const name = this._sealedSender(message.sender, sealContacts);
        const senderConvert = this._layoutTextWithEmoji(doc, {text: name, inline: true});
        const senderHeight = lineHeight + this.bubbles.mTop;
        const senderWidth = senderConvert.totalWidth;

        const time = message.parsedDatetime.toLocaleString();
        const timeHeight = lineHeight + this.bubbles.mBottom;
        const timeWidth = doc.widthOfString(time);

        // Check if we need a new page
        if (Number(yPos + senderHeight + bubbleHeight + timeHeight) > this.pageHeight - this.margins.bottom) {
            // font will reset after add new page
            doc.addPage().fontSize(this.fonts.size * 0.8).fillColor(this.fonts.color).fillOpacity(0.8);
            yPos = this.margins.top;
        }

        // Draw sender name
        if (isMainUser && Number(senderWidth + this.bubbles.pLeft) > bubbleWidth) {
            stringXpos = this.pageWidth - this.margins.right - this.bubbles.pRight - senderWidth
        }
        this._drawSender(doc, name, stringXpos, yPos)

        yPos += senderHeight;

        // Draw bubble
        doc.save()
            .roundedRect(xPos, yPos, bubbleWidth, bubbleHeight, this.bubbles.radius)
            .fillOpacity(1)
            .fill(bubbleColor)
            .restore();

        // Draw message text
        this._drawContent(doc, content, labelxPos, yPos + this.bubbles.pTop)

        yPos += bubbleHeight + this.bubbles.mBottom;

        // Draw datetime
        if (isMainUser && timeWidth + this.bubbles.pLeft > bubbleWidth) {
            stringXpos = this.pageWidth - this.margins.right - this.bubbles.pRight - timeWidth
        } else {
            stringXpos = labelxPos;
        }
        doc.fontSize(this.fonts.size * 0.8)
            .fillOpacity(0.8)
            .text(time, stringXpos, yPos);

        return yPos + timeHeight;
    }

    _drawSender(doc, sender, x, y) {
        const senderConvert = this._layoutTextWithEmoji(doc, {text: sender, inline: true});
        const lineHeight = doc.currentLineHeight();

        for (const line of senderConvert.lines) {
            const lx = x + Number(line.x ?? 0);
            let ly = y + Number(line.y ?? 0);

            if (line.family === "Emoji") ly -= lineHeight * 0.2
            if (["Chinese", "Japanese", "Korean"].includes(line.family)) ly -= lineHeight * 0.35

            doc.font(line.family).text(line.char, lx, ly);
        }
    }

    _sealedSender(sender, sealContacts) {
        const _sender = [...sender];
        let name = _sender.join("");
        if (sealContacts) name = _sender.slice(0, 2).join("") + "*".repeat(3) + _sender.slice(-2).join("");

        return name
    }

    async _layoutMessageContent(doc, message) {
        doc.font(this.fonts.family).fontSize(this.fonts.size);

        switch (message.type) {
            case "text":
                return this._layoutTextWithEmoji(doc, message);
            case "file":
            case "image":
            case "video":
            case "sticker":
            case "voice":
            case "media_omitted":
                return this._layoutMediaPlaceholder(doc, message);
            default:
                return {lines: [], totalHeight: 0, totalWidth: 0};
        }
    }

    _layoutTextWithEmoji(doc, message, x, y) {
        // Track current position manually
        const lineHeight = doc.currentLineHeight(true);
        const inline = Boolean(message?.inline ?? false)
        let lines = [];
        let currentX = Number(x ?? 0);
        let currentY = Number(y ?? 0);
        let maxLineWidth = 0;

        const words = message.text.split(/(\s+)/);
        for (const word of words) {
            if (!inline && (word.includes("\n") || currentX + doc.widthOfString(word) > this.bubbleMaxWidth)) {
                currentX = 0;
                currentY += lineHeight;
            }

            for (const char of [...word]) {
                const {width, fontKey} = this._getCacheWords(doc, char);

                if (!inline && (currentX > this.bubbleMaxWidth)) {
                    currentX = 0;
                    currentY += lineHeight;
                }

                lines.push({
                    char,
                    x: currentX,
                    y: currentY,
                    width,
                    family: fontKey,
                    type: "text",
                });

                currentX += width;
                maxLineWidth = Math.max(maxLineWidth, currentX);
            }
        }

        return {lines, totalHeight: currentY + lineHeight, totalWidth: maxLineWidth};
    }

    _getCacheWords(doc, text) {
        const match = fontsExtra.find(fe => fe.regex.test(text));
        const fontKey = match ? match.name : this.fonts.family;
        const key = `${fontKey}::${doc._fontSize}::${text}`;

        if (this.charCache[key]) return this.charCache[key];

        const needSwitch = fontKey !== this.fonts.family;
        if (needSwitch) doc.font(fontKey);
        const width = doc.widthOfString(text);
        this.charCache[key] = {width, fontKey};
        if (needSwitch) doc.font(this.fonts.family);

        return {width, fontKey};
    }

    _layoutMediaPlaceholder(doc, message) {
        const boxHeight = message.type === "voice" ? 36 : this.bubbleMaxWidth * 0.3
        const boxWidth = message.type === "voice" ? this.bubbleMaxWidth : this.bubbleMaxWidth * 0.6

        let lines = [{
            filename: message.filename ?? "",
            type: message.type,
            width: boxWidth,
            height: boxHeight
        }];

        let textExtra
        if (message.text) {
            textExtra = this._layoutTextWithEmoji(doc, message, 0, boxHeight * 1.05);
            textExtra.totalHeight -= boxHeight * 1.05;
            lines.push(...textExtra.lines);
        }

        return {
            lines,
            totalHeight: boxHeight + Number(textExtra?.totalHeight ?? 0),
            totalWidth: Math.max(boxWidth, Number(textExtra?.totalWidth ?? 0)),
        };
    }

    _drawContent(doc, message, x, y) {
        for (const line of message.lines) {
            let lx = x + Number(line.x ?? 0);
            let ly = y + Number(line.y ?? 0);

            switch (line.type) {
                case "text":
                    if (line.family === this.fonts.family) ly += doc.currentLineHeight(true) * 0.1
                    if (["Chinese", "Japanese", "Korean"].includes(line.family)) ly -= doc.currentLineHeight(true) * 0.2

                    doc.font(line.family)
                        .fontSize(this.fonts.size)
                        .fillOpacity(1)
                        .text(line.char, lx, ly)
                    break;
                case "voice":
                    // The original SVG path coordinates are roughly 0–20 units tall
                    const baseSize = 16;
                    const scale = line.height / baseSize;

                    // Translate so path origin (0,0) is top-left of the icon
                    const offsetX = lx - (baseSize * scale) * 0.5;
                    const offsetY = ly - (baseSize * scale) * 0.25;

                    doc.save()
                        .translate(offsetX, offsetY)
                        .scale(scale)
                        .path("M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82")
                        .fillColor(this.fonts.color)
                        .closePath()
                        .fill()
                        .restore();

                    doc.fontSize(this.fonts.size * 0.7)
                        .text(`${line.filename} (${line.type})`, lx + (baseSize * scale) * 0.7, ly + line.height * 0.4, {
                            width: line.width - (baseSize * scale) * 0.7,
                        })
                    break;
                case "file":
                case "image":
                case "video":
                case "sticker":
                    doc.save()
                        .roundedRect(lx, ly, line.width, line.height, this.bubbles.radius)
                        .strokeOpacity(0.4)
                        .stroke(this.fonts.color)
                        .fontSize(this.fonts.size * 0.7)
                        .text(`${line.filename} (${line.type})`, lx + line.width * 0.05, ly + line.height * 0.45, {
                            width: line.width * 0.85
                        })
                        .restore();
                    break;
                case "media_omitted":
                    doc.save()
                        .roundedRect(lx, ly, line.width, line.height, this.bubbles.radius)
                        .dash(3, {space: 3})
                        .strokeOpacity(0.4)
                        .stroke(this.fonts.color)
                        .undash()
                        .fontSize(this.fonts.size * 0.7)
                        .text(`${line.filename} (${line.type.replace("_", " ")})`, lx + line.width * 0.05, ly + line.height * 0.45, {
                            width: line.width
                        })
                        .restore();
                    break;
            }

            // reset back the font
            doc.font(this.fonts.family)
        }
    }

    async _addImages(doc, mediaFiles) {
        doc.addPage();

        let yPos = this.margins.top;

        doc.fontSize(this.fonts.size * 1.15)
            .fillColor(this.fonts.color)
            .fillOpacity(1)
            .text("Media Attachments", this.margins.left, yPos);

        yPos += doc.currentLineHeight(true) * 1.5;

        for (const [filename, data] of Object.entries(mediaFiles)) {
            const ext = path.extname(filename.toLowerCase());

            try {
                // handle images
                const imageBuffer = await this._bufferImage(data, ext);
                if (!imageBuffer) continue;

                // maintain images in ratio
                const meta = await sharp(imageBuffer).metadata();
                const metaW = meta.autoOrient?.width ?? meta.width;
                const metaH = meta.autoOrient?.height ?? meta.height;

                const scaleW = this.backgrounds.width / metaW;
                const scaleH = this.backgrounds.height / metaH;

                let scale = Math.min(scaleW, scaleH);
                if (scale > 1) scale = 1; // never upscale

                const imgWidth = metaW * scale;
                const imgHeight = metaH * scale;

                if (yPos + imgHeight > this.pageHeight - this.margins.bottom) {
                    doc.addPage();
                    yPos = this.margins.top;
                }

                // Draw image
                doc.image(imageBuffer, this.margins.left, yPos, {
                    fit: [imgWidth, imgHeight],
                });

                // Draw filename below image
                yPos += imgHeight + 3;

                doc.fontSize(this.fonts.size * 0.8)
                    .fillColor(this.fonts.color)
                    .text(filename, this.margins.left, yPos);

                yPos += doc.currentLineHeight(true) * 1.5;
            } catch (e) {
                console.warn(`Could not add image ${filename}`, e.message);
            }
        }
    }

    /**
     * Attempts to convert any supported image format to a static PNG buffer.
     * Explicitly filters out common non-image file types.
     * @param {Buffer<ArrayBufferLike>} buffer - The file buffer.
     * @param {string} ext - The file extension (e.g., ".jpg").
     * @returns {Promise<Buffer|null>} PNG buffer or null if unsupported/failed.
     */
    async _bufferImage(buffer, ext) {
        if (!buffer && !ext) return null;

        const nonImageExtensions = [
            // Videos
            ".mp4", ".3gp", ".mov", ".m4v", ".avi", ".mkv",

            // Audio
            ".opus", ".m4a", ".aac", ".mp3", ".amr", ".ogg", ".wav", ".flac",

            // Documents/Other (PDF, Office, Text, VCF contact cards, Archives)
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".vcf", ".zip", ".rar", ".7z"
        ];
        if (nonImageExtensions.includes(ext)) return null;

        let sharpInstance;
        if ([".gif", ".webp"].includes(ext)) {
            sharpInstance = sharp(buffer, {animated: true, pages: 1});
        } else {
            sharpInstance = sharp(buffer);
        }

        try {
            return await sharpInstance
                .jpeg()
                .toBuffer();
        } catch (e) {
            return null;
        }
    }
}

module.exports = PDFRenderer;