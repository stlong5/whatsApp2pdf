import * as fs from "fs";
import * as path from "path";
import {fileURLToPath} from "url";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import {detectBackgroundImage} from "./utils.js";
import {Theme, FontsConfig, BubbleConfig, BackgroundConfig, LayoutConfig, PDFConfig, Message, ChatData, linesData, lineResult} from "./types/index.js";

const NODE_DIR = path.dirname(fileURLToPath(import.meta.url));
const author: string = "stlong5";
const authorLink: string = "https://github.com/stlong5/whatsApp2pdf";
const now: Date = new Date();
const fonts: string[] = ["Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique", "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique", "Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic", "Symbol", "ZapfDingbats"];
const fontsExtra: { name: string, file: string, regex: RegExp }[] = [
    {name: "Emoji", file: "../assets/fonts/NotoEmoji.ttf", regex: /\p{Extended_Pictographic}/u},
    {name: "Japanese", file: "../assets/fonts/NotoSansJP.ttf", regex: /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/u},              // Hiragana, Katakana, Kanji
    {name: "Korean", file: "../assets/fonts/NotoSansKR.ttf", regex: /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u},                // Hangul, Jamo
    {name: "Chinese", file: "../assets/fonts/NotoSansSC.ttf", regex: /[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uFF00-\uFFEF]/u},  // Chinese (Simplified, Traditional)
];

export class PDFRenderer {
    private readonly pageWidth: number;
    private readonly pageHeight: number;
    private readonly bubbleMaxWidth: number;
    private theme: Theme;
    private charCache: Record<string, { width: number, fontKey: string }>;
    private layout: LayoutConfig;
    private backgrounds: BackgroundConfig;
    private bubbles: BubbleConfig;
    private fonts: FontsConfig;
    private metadata: PDFConfig

    constructor(theme: Theme) {
        this.charCache = {}
        this.theme = theme;

        // A4 size in points (72 points = 1 inch)
        // A4 = 210mm × 297mm = 595.28pt × 841.89pt
        this.pageWidth = 595.28;
        this.pageHeight = 841.89;

        this.metadata = {
            title: String(this.theme?.metadata?.title || "WhatsApp Chat Export").trim(),
            author: String(this.theme?.metadata?.author || author).trim(),
            subject: String(this.theme?.metadata?.subject || "WhatsApp conversation archive").trim(),
            keywords: String(this.theme?.metadata?.keywords || "WhatsApp conversation archive").trim(),
            password: String(this.theme?.metadata?.password || "").trim()
        }

        // Convert pixel margins to points (assuming 96 DPI)
        this.layout = {
            margin_left: Number(this.theme?.layout?.margin_left ?? 120) * 0.75,    // 120px = 90pt
            margin_right: Number(this.theme?.layout?.margin_right ?? 120) * 0.75,  // 120px = 90pt
            margin_top: Number(this.theme?.layout?.margin_top ?? 96) * 0.75,      // 96px = 72pt
            margin_bottom: Number(this.theme?.layout?.margin_bottom ?? 96) * 0.75 // 96px = 72pt
        };

        // A4 size in points (72 points = 1 inch)
        // A4 = 210mm × 297mm = 595.28pt × 841.89pt
        this.backgrounds = {
            color: String(this.theme?.background_color ?? "#EAE6DF").trim(),
            image: String(this.theme?.background_image ?? "").trim(),
            ext: String(this.theme?.background_image_ext ?? "").trim(),
            height: Number(this.pageHeight - this.layout.margin_top - this.layout.margin_bottom),   // content max height
            width: Number(this.pageWidth - this.layout.margin_left - this.layout.margin_right)      // content max width
        };

        this.bubbles = {
            color: String(this.theme?.bubble?.color ?? "#D9FDD3").trim(),
            color_other: String(this.theme?.bubble?.color_other ?? "#FFFFFF").trim(),
            max_width_percent: Number(this.theme?.bubble?.max_width_percent ?? 0.65),
            margin_top: Number(this.theme?.bubble?.margin_top ?? 3),
            margin_bottom: Number(this.theme?.bubble?.margin_bottom ?? 3),
            padding_left: Number(this.theme?.bubble?.padding_left ?? 7),
            padding_right: Number(this.theme?.bubble?.padding_right ?? 7),
            padding_top: Number(this.theme?.bubble?.padding_top ?? 6),
            padding_bottom: Number(this.theme?.bubble?.padding_bottom ?? 6),
            radius: Number(this.theme?.bubble?.radius ?? 7.5)
        };

        this.fonts = {
            color: String(this.theme?.fonts?.color ?? "#111B21").trim(),
            family: String((this.theme?.fonts?.family ?? "Helvetica").split(",")[0].trim()),
            size: Number(this.theme?.fonts?.size ?? 14)
        };

        this.bubbleMaxWidth = this.backgrounds.width * this.bubbles.max_width_percent;

        if (!fonts.includes(this.fonts.family)) throw new Error(`Supported font list: "${fonts.join('", "')}"`)
    }

    async render({chatData, outputPath, mainUser, sealContacts, includeImages}: { chatData: ChatData; outputPath: string; mainUser: string; sealContacts: boolean; includeImages: boolean; }) {
        return new Promise<void>(async (resolve, reject) => {
            let doc: PDFKit.PDFDocument | null = null;
            let stream = null;

            try {
                // Ensure output folder exists
                fs.mkdirSync(path.dirname(outputPath), {recursive: true});

                // Update the background image to sharp buffer
                if (this.backgrounds.image) {
                    this.backgrounds = await detectBackgroundImage(this.backgrounds, this.theme.path!);
                    this.backgrounds.image = await sharp(this.backgrounds.image)
                        .png({quality: 80, palette: true, effort: 1})
                        .toBuffer();
                }

                // Create PDF document
                doc = new PDFDocument({
                    size: "A4",
                    font: this.fonts.family,
                    bufferPages: true,
                    margins: {
                        top: this.layout.margin_top,
                        bottom: this.layout.margin_bottom,
                        left: this.layout.margin_left,
                        right: this.layout.margin_right
                    },
                    info: {
                        Producer: authorLink,
                        Title: this.metadata.title,
                        Author: this.metadata.author,
                        Subject: this.metadata.subject,
                        Keywords: this.metadata.keywords,
                    },
                    ...(this.metadata.password && {
                        userPassword: this.metadata.password
                    })
                });
                doc!.fontSize(this.fonts.size);

                // register new font
                for (const fonts of fontsExtra) {
                    const fontPath = path.join(NODE_DIR, fonts.file);
                    if (fs.existsSync(fontPath)) {
                        doc!.registerFont(fonts.name, fontPath);
                    } else {
                        console.warn(`${fonts.name} font not found and may not render correctly.`);
                    }
                }

                doc!.on("pageAdded", () => {
                    // Add Background
                    this._drawBackground(doc!);
                })

                // Pipe to file
                stream = fs.createWriteStream(outputPath);
                doc!.pipe(stream);

                // Add background if image exists
                this._drawBackground(doc!);

                // Draw header
                const headerHeight = this._drawHeader(doc, chatData, sealContacts);

                // Draw messages
                let yPos = this.layout.margin_top + headerHeight; // Start below header

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
                const range = doc!.bufferedPageRange();
                for (let i = range.start, end = range.start + range.count; i < end; i++) {
                    doc!.switchToPage(i);
                    // Add footer
                    this._drawFooter(doc, i + 1);

                    // Add watermark
                    this._drawWatermark(doc);
                }

                // Finalize PDF
                doc!.end();

                stream.on("finish", () => resolve());
                stream.on("error", reject);
            } catch (e: unknown) {
                // Finalize the PDF document (if it exists)
                // This attempts to write any remaining content and close the document internally.
                doc!.end();

                // Destroy the stream (if it exists and is open)
                // This immediately stops writing to the file and releases the file handle.
                if (stream && !stream.destroyed) stream.destroy();

                reject(e);
            }
        });
    }

    /**
     * Add the Background design
     * @param doc Pdfkit Object
     * @return void
     */
    private _drawBackground(doc: PDFKit.PDFDocument): void {
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

    /**
     * Add the Header Section
     * Contain info of Participants, Platform, Messages
     * @param doc Pdfkit Object
     * @param chatData Whole Chat Object
     * @param sealContacts whether is seal Contact name
     * @return total height of header
     */
    private _drawHeader(doc: PDFKit.PDFDocument, chatData: ChatData, sealContacts: boolean): number {
        const x: number = this.layout.margin_left;
        const y: number = this.layout.margin_top;

        const names: string[] = chatData.contacts.map((name: string) => this._sealedSender(name, sealContacts));

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

    /**
     * Add the Footer Section
     * Contain info of ownership and page number
     * @param doc Pdfkit Object
     * @param pageNum Number of Page
     * @return void
     */
    private _drawFooter(doc: PDFKit.PDFDocument, pageNum: number): void {
        const totalPages: number = doc.bufferedPageRange().count;
        const y: number = this.pageHeight - this.layout.margin_bottom * 0.5;
        const licenseText: string = `Generated by ${author}`;
        const pagingText: string = `Page ${pageNum} of ${totalPages}`;

        doc.save().fontSize(this.fonts.size * 0.7)

        const lineHeight: number = doc.currentLineHeight(true);
        const licenseWidth: number = doc.widthOfString(licenseText);
        const pagingWidth: number = doc.widthOfString(pagingText);
        const licenseXpos: number = (this.pageWidth - licenseWidth) / 2;

        doc.fillColor(this.fonts.color)
            .fillOpacity(0.8)
            .text(licenseText, licenseXpos, y, {
                lineBreak: false
            })
            .text(pagingText, this.pageWidth - this.layout.margin_right - pagingWidth, y, {
                lineBreak: false
            })
            .fontSize(this.fonts.size * 0.5)
            .text(`Exported: ${now.toString()}`, this.layout.margin_left, y + this.layout.margin_bottom * 0.3, {
                lineBreak: false
            })

        // manually add link due to text() options.link occur error
        // options.textWidth : undefined; options.wordCount : undefined;
        doc.link(licenseXpos, y, licenseWidth, lineHeight, authorLink);

        doc.restore();
    }

    /**
     * Add the Watermark Design
     * Either tiled or centered style
     * @param doc Pdfkit Object
     * @return void
     */
    private _drawWatermark(doc: PDFKit.PDFDocument): void {
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

    /**
     * Add the message Section
     * Contain info of Participants, Platform, Messages
     * @param doc Pdfkit Object
     * @param message message Object
     * @param yPos current Y-axis position
     * @param isMainUser whether is Main user
     * @param sealContacts whether is seal Contact name
     * @return Total height of the message
     */
    private async _drawMessage(doc: PDFKit.PDFDocument, message: Message, yPos: number, isMainUser: boolean, sealContacts: boolean): Promise<number> {
        const content: lineResult = await this._layoutMessageContent(doc, message);
        const bubbleWidth: number = content.totalWidth + this.bubbles.padding_left + this.bubbles.padding_right;
        const bubbleHeight: number = content.totalHeight + this.bubbles.padding_top + this.bubbles.padding_bottom;
        const bubbleColor: string = isMainUser ? this.bubbles.color : this.bubbles.color_other;
        const xPos: number = isMainUser ? this.pageWidth - this.layout.margin_right - bubbleWidth : this.layout.margin_left;
        const labelxPos: number = xPos + this.bubbles.padding_left;
        let stringXpos: number = labelxPos;

        doc.fontSize(this.fonts.size * 0.8).fillColor(this.fonts.color).fillOpacity(0.8);
        const lineHeight: number = doc.currentLineHeight();

        const name: string = this._sealedSender(message.sender, sealContacts);
        const senderConvert: lineResult = this._layoutTextWithEmoji(doc, {text: name, inline: true});
        const senderHeight: number = lineHeight + this.bubbles.margin_top;
        const senderWidth: number = senderConvert.totalWidth;

        const time = message.parsedDatetime? message.parsedDatetime.toLocaleString() : "";
        const timeHeight = lineHeight + this.bubbles.margin_bottom;
        const timeWidth = doc.widthOfString(time);

        // Check if we need a new page
        if (Number(yPos + senderHeight + bubbleHeight + timeHeight) > this.pageHeight - this.layout.margin_bottom) {
            // font will reset after add new page
            doc.addPage().fontSize(this.fonts.size * 0.8).fillColor(this.fonts.color).fillOpacity(0.8);
            yPos = this.layout.margin_top;
        }

        // Draw sender name
        if (isMainUser && Number(senderWidth + this.bubbles.padding_left) > bubbleWidth) {
            stringXpos = this.pageWidth - this.layout.margin_right - this.bubbles.padding_right - senderWidth
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
        this._drawContent(doc, content, labelxPos, yPos + this.bubbles.padding_top)

        yPos += bubbleHeight + this.bubbles.margin_bottom;

        // Draw datetime
        if (isMainUser && timeWidth + this.bubbles.padding_left > bubbleWidth) {
            stringXpos = this.pageWidth - this.layout.margin_right - this.bubbles.padding_right - timeWidth
        } else {
            stringXpos = labelxPos;
        }
        doc.fontSize(this.fonts.size * 0.8)
            .fillOpacity(0.8)
            .text(time, stringXpos, yPos);

        return yPos + timeHeight;
    }

    /**
     * Add the sender
     * @param doc Pdfkit Object
     * @param sender User in the chat
     * @param x X-axis position, default 0
     * @param y Y-axis position, default 0
     * @return void
     */
    private _drawSender(doc: PDFKit.PDFDocument, sender: string, x: number = 0, y: number = 0): void {
        const senderConvert: lineResult = this._layoutTextWithEmoji(doc, {text: sender, inline: true});
        const lineHeight: number = doc.currentLineHeight();

        for (const line of senderConvert.lines) {
            if (!line.family || !line.char) continue;
            const lx: number = x + Number(line.x ?? 0);
            let ly: number = y + Number(line.y ?? 0);

            if (line.family === "Emoji") ly -= lineHeight * 0.2
            if (["Chinese", "Japanese", "Korean"].includes(String(line.family))) ly -= lineHeight * 0.35

            doc.font(line.family).text(line.char, lx, ly);
        }
    }

    /**
     * Sealed Sender when need
     * @param sender User in the chat
     * @param sealContacts whether is seal Contact name
     * @return
     */
    private _sealedSender(sender: string, sealContacts: boolean): string {
        const _sender = [...sender];
        let name = _sender.join("");
        if (sealContacts) name = _sender.slice(0, 2).join("") + "*".repeat(3) + _sender.slice(-2).join("");

        return name
    }

    /**
     * Split the Estimation by type
     * @param doc Pdfkit Object
     * @param message message Object
     * @return
     */
    private async _layoutMessageContent(doc: PDFKit.PDFDocument, message: Message): Promise<{ lines: linesData[]; totalHeight: number; totalWidth: number }> {
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

    /**
     * Estimate the content needed space (height and width)
     * @param doc Pdfkit Object
     * @param message message Object
     * @param x X-axis position, default 0
     * @param y Y-axis position, default 0
     * @return
     */
    private _layoutTextWithEmoji(doc: PDFKit.PDFDocument, message: Message | { text: string, inline: boolean }, x: number = 0, y: number = 0): { lines: linesData[]; totalHeight: number; totalWidth: number } {
        // Track current position manually
        const lineHeight: number = doc.currentLineHeight(true);
        const inline: boolean = Boolean(message?.inline ?? false)
        let lines: linesData[] = [];
        let currentX: number = Number(x ?? 0);
        let currentY: number = Number(y ?? 0);
        let maxLineWidth: number = 0;

        const words: string[] = message.text.split(/(\s+)/);
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

    /**
     * Add cache for letter width
     * @param doc Pdfkit Object
     * @param text letter
     * @return width and font family
     */
    private _getCacheWords(doc: PDFKit.PDFDocument, text: string): { width: number; fontKey: string } {
        const match: { name: string, file: string, regex: RegExp } | undefined = fontsExtra.find(fe => fe.regex.test(text));
        const fontKey: string = match ? match.name : this.fonts.family;
        const key: string = `${fontKey}::${doc.fontSize}::${text}`;

        if (this.charCache[key]) return this.charCache[key];

        const needSwitch: boolean = fontKey !== this.fonts.family;
        if (needSwitch) doc.font(fontKey);
        const width: number = doc.widthOfString(text);
        this.charCache[key] = {width, fontKey};
        if (needSwitch) doc.font(this.fonts.family);

        return {width, fontKey};
    }

    /**
     * Estimate the Media Placeholder box (height and width)
     * @param doc Pdfkit Object
     * @param message message Object
     * @return
     */
    private _layoutMediaPlaceholder(doc: PDFKit.PDFDocument, message: Message): { lines: linesData[]; totalHeight: number; totalWidth: number } {
        const boxHeight = message.type === "voice" ? 36 : this.bubbleMaxWidth * 0.3
        const boxWidth = message.type === "voice" ? this.bubbleMaxWidth : this.bubbleMaxWidth * 0.6

        let lines: linesData[]= [{
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

    /**
     * Add the content
     * @param doc Pdfkit Object
     * @param message message Object
     * @param x X-axis position, default 0
     * @param y Y-axis position, default 0
     * @return void
     */
    private _drawContent(doc: PDFKit.PDFDocument, message: lineResult, x: number = 0, y: number = 0): void {
        for (const line of message.lines) {
            let lx: number = x + Number(line.x ?? 0);
            let ly: number = y + Number(line.y ?? 0);

            switch (line.type) {
                case "text":
                    if (line.family === this.fonts.family) ly += doc.currentLineHeight(true) * 0.1
                    if (["Chinese", "Japanese", "Korean"].includes(line.family!)) ly -= doc.currentLineHeight(true) * 0.2

                    doc.font(line.family!)
                        .fontSize(this.fonts.size)
                        .fillOpacity(1)
                        .text(line.char!, lx, ly)
                    break;
                case "voice":
                    // The original SVG path coordinates are roughly 0–20 units tall
                    const baseSize = 16;
                    const scale = line.height! / baseSize;

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
                        .text(`${line.filename} (${line.type})`, lx + (baseSize * scale) * 0.7, ly + line.height! * 0.4, {
                            width: line.width - (baseSize * scale) * 0.7,
                        })
                    break;
                case "file":
                case "image":
                case "video":
                case "sticker":
                    doc.save()
                        .roundedRect(lx, ly, line.width, line.height!, this.bubbles.radius)
                        .strokeOpacity(0.4)
                        .stroke(this.fonts.color)
                        .fontSize(this.fonts.size * 0.7)
                        .text(`${line.filename} (${line.type})`, lx + line.width * 0.05, ly + line.height! * 0.45, {
                            width: line.width * 0.85
                        })
                        .restore();
                    break;
                case "media_omitted":
                    doc.save()
                        .roundedRect(lx, ly, line.width, line.height!, this.bubbles.radius)
                        .dash(3, {space: 3})
                        .strokeOpacity(0.4)
                        .stroke(this.fonts.color)
                        .undash()
                        .fontSize(this.fonts.size * 0.7)
                        .text(`${line.filename} (${line.type.replace("_", " ")})`, lx + line.width * 0.05, ly + line.height! * 0.45, {
                            width: line.width
                        })
                        .restore();
                    break;
            }

            // reset back the font
            doc.font(this.fonts.family)
        }
    }

    /**
     * Add the images from buffer
     * @param doc Pdfkit Object
     * @param mediaFiles media attachment
     * @return void
     */
    private async _addImages(doc: PDFKit.PDFDocument, mediaFiles: Record<string, Buffer>): Promise<void> {
        doc.addPage();

        let yPos: number = this.layout.margin_top;

        doc.fontSize(this.fonts.size * 1.15)
            .fillColor(this.fonts.color)
            .fillOpacity(1)
            .text("Media Attachments", this.layout.margin_left, yPos);

        yPos += doc.currentLineHeight(true) * 1.5;

        for (const [filename, data] of Object.entries(mediaFiles)) {
            const ext: string = path.extname(filename.toLowerCase());

            try {
                // handle images
                const imageBuffer: Buffer | null = await this._bufferImage(data, ext);
                if (!imageBuffer) continue;

                // maintain images in ratio
                const meta = await sharp(imageBuffer).metadata();
                const metaW: number = meta.autoOrient?.width ?? meta.width;
                const metaH: number = meta.autoOrient?.height ?? meta.height;

                const scaleW: number = this.backgrounds.width / metaW;
                const scaleH: number = this.backgrounds.height / metaH;

                let scale: number = Math.min(scaleW, scaleH);
                if (scale > 1) scale = 1; // never upscale

                const imgWidth: number = metaW * scale;
                const imgHeight: number = metaH * scale;

                if (yPos + imgHeight > this.pageHeight - this.layout.margin_bottom) {
                    doc.addPage();
                    yPos = this.layout.margin_top;
                }

                // Draw image
                doc.image(imageBuffer, this.layout.margin_left, yPos, {
                    fit: [imgWidth, imgHeight],
                });

                // Draw filename below image
                yPos += imgHeight + 3;

                doc.fontSize(this.fonts.size * 0.8)
                    .fillColor(this.fonts.color)
                    .text(filename, this.layout.margin_left, yPos);

                yPos += doc.currentLineHeight(true) * 1.5;
            } catch (e: unknown) {
                if (e instanceof Error) {
                    console.warn(`Could not add image ${filename} - ${e.message}`, );
                } else {
                    console.error(`Could not add image ${filename} - ${String(e)}`);
                }
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
    private async _bufferImage(buffer: Buffer, ext: string): Promise<Buffer | null> {
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
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.warn(`Unable to convert sharp's buffer - ${e.message}`, );
            } else {
                console.error(`Unable to convert sharp's buffer - ${String(e)}`);
            }
            return null;
        }
    }
}