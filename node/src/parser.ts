import AdmZip from "adm-zip"
import {detectPlatform, parseDateTime, detectMessageType} from "./utils.js";
import {ChatData, Message, Platform} from "./types/index.js";

export class WhatsAppParser {
    private readonly zipPath: string;
    private platform: Platform;
    private chatText: string;
    private mediaFiles: Record<string, Buffer>;

    // Regex patterns for different formats
    private static  PATTERNS: { standard: RegExp, ios: RegExp } = {
        // [DD/MM/YYYY, HH:MM:SS] or [DD/MM/YYYY, HH:MM] format
        standard: /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s*[-:]?\s*([^:]+?):\s*(.+)$/,
        // M/D/YY, H:MM AM/PM format (iOS)
        ios: /^\[?(\d{1,2}\/\d{1,2}\/\d{2},?\s+\d{1,2}:\d{2}(?::\d{2})?\s?[AP]M)\]?\s*([^:]+?):\s*(.+)$/
    };

    // Define common WhatsApp media and document extensions
    private static MEDIA_EXTENSIONS: string[] = [
        // Images (Common & Sharp-supported - JPG, PNG, GIF, WebP, TIFF, SVG, HEIC, AVIF, BMP)
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff", ".heic", ".heif", ".avif", ".svg", ".bmp",

        // Videos
        ".mp4", ".3gp", ".mov", ".m4v", ".avi", ".mkv",

        // Audio
        ".opus", ".m4a", ".aac", ".mp3", ".amr", ".ogg", ".wav", ".flac",

        // Documents/Other (PDF, Office, Text, VCF contact cards, Archives)
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".vcf", ".zip", ".rar", ".7z"
    ];

    constructor(zipPath: string) {
        this.zipPath = zipPath;
        this.platform = null;
        this.chatText = "";
        this.mediaFiles = {};
    }

    async parse(): Promise<ChatData> {
        try {
            // Extract ZIP contents
            this._extractZip();

            // Detect platform
            this.platform = detectPlatform(this.chatText);

            // Parse messages
            const messages = this._parseMessages();

            if (messages.length === 0) {
                throw new Error("No messages found in chat file. Please check the export format.");
            }

            // Extract unique contacts
            const contacts = [...new Set(messages.map(m => m.sender))].sort();

            return {
                messages,
                contacts,
                platform: this.platform,
                mediaFiles: this.mediaFiles,
                totalMessages: messages.length
            };
        } catch (e: unknown) {
            if (e instanceof Error) {
                throw new Error(`Parser error: ${e.message}`);
            } else {
                throw new Error(`Parser error: ${String(e)}`);
            }
        }
    }

    private _extractZip() {
        try {
            const zip: AdmZip = new AdmZip(this.zipPath);
            const zipEntries: AdmZip.IZipEntry[] = zip.getEntries();

            // Initialize chatText to null/undefined before the loop
            this.chatText = "";

            for (const entry of zipEntries) {
                // Use the original entryName for key in mediaFiles, but check lowercase for logic
                const originalFileName: string = entry.entryName;
                const lowerFileName: string = originalFileName.toLowerCase();

                // Skip directories and artifacts (__MACOSX, etc.)
                if (entry.isDirectory || lowerFileName.startsWith("__")) continue;

                // Identify the Main Chat Text File (e.g., "WhatsApp Chat - John Doe.txt")
                // We use the "whatsapp chat" prefix for a common, robust match.
                if (lowerFileName.startsWith("whatsapp chat") && lowerFileName.endsWith(".txt")) {
                    // CRITICAL: Read main chat text with proper UTF-8 decoding
                    this.chatText = entry.getData().toString("utf8");
                }

                // Identify and Extract all Media/Document Files (as Buffers)
                else if (WhatsAppParser.MEDIA_EXTENSIONS.some(e => lowerFileName.endsWith(e))) {
                    try {
                        // Store the file content as a Buffer. The key is the original file name.
                        this.mediaFiles[originalFileName] = entry.getData();
                    } catch (e: unknown) {
                        if (e instanceof Error) {
                            console.warn(`Warning: Could not extract media: ${originalFileName} - ${e.message}`);
                        } else {
                            console.error(`Error: Could not extract media: ${originalFileName} - ${String(e)}`);
                        }
                    }
                }
            }

            // Final check to ensure the main chat text was found
            if (!this.chatText) {
                throw new Error("No main chat text file found in ZIP. Check export format.");
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                throw new Error(`Failed to extract ZIP: ${e.message}`);
            } else {
                throw new Error(`Failed to extract ZIP: ${String(e)}`);
            }
        }
    }

    private _parseMessages(): Message[] {
        const messages: Message[] = [];
        const lines: string[] = this.chatText.split(/\r?\n/);

        let currentMessage: Message | null = null;
        let lineNumber: number = 0;

        for (let line of lines) {
            lineNumber++;
            line = line.trim();

            if (!line) continue;

            // Try both patterns
            let match = line.match(WhatsAppParser.PATTERNS.standard) ||
                line.match(WhatsAppParser.PATTERNS.ios);

            if (match && match.length >= 4) {
                // Save previous message
                if (currentMessage) {
                    messages.push(currentMessage);
                }

                // Start new message
                const [, datetime, sender, text] = match;
                currentMessage = {
                    datetime: datetime.trim(),
                    sender: sender.trim(),
                    parsedDatetime: parseDateTime(datetime.trim()),
                    lineNumber,
                    ...detectMessageType(text.trim())
                };
            } else if (currentMessage) {
                // Continuation of previous message (multi-line)
                currentMessage.text += "\n" + line;
                if (!["media_omitted", detectMessageType(line).type].includes(currentMessage.type)) currentMessage.type = "mixed"
            }
        }

        // Don't forget last message
        if (currentMessage) {
            messages.push(currentMessage);
        }

        return messages;
    }
}