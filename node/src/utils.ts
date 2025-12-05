import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import {Platform, Theme, BackgroundConfig, MessageContentType} from "./types/index.js";

/**
 * Detect HTTP/HTTPS URL
 * @param {string} str
 * @return boolean
 */
export function isURL(str: string): boolean {
    return /^https?:\/\/\//i.test(str);
}

/**
 * Detect data URI Base64
 * @param {string} str
 * @return boolean
 */
export function isDataURI(str: string): boolean {
    return /^data:image\/(png|jpeg|jpg);base64,/i.test(str);
}

/**
 * Download file as buffer
 * @param {string} url
 * @return Promise<Buffer>
 */
export function downloadToBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;

        client.get(url, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} on ${url}`));
                return;
            }

            const chunks: Buffer[] = [];
            res.on("data", d => chunks.push(d));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", reject);
    });
}

/**
 * Load background image buffer for theme
 * @param {BackgroundConfig} background
 * @param {string} themePath
 * @return Promise<BackgroundConfig>
 */
export async function detectBackgroundImage(background: BackgroundConfig, themePath: string): Promise<BackgroundConfig> {
    if (background.image && typeof background.image === "string") {
        const bg: string = background.image.trim();
        if (isDataURI(bg)) {
            const regex: RegExp = /^data:image\/(png|jpeg|jpg);base64,/i
            const base64Data: string = bg.replace(regex, "");
            const match = bg.match(regex);
            background.image = Buffer.from(base64Data, "base64");
            background.ext = match ? `.${match[1].toLowerCase()}` : null;
        } else if (isURL(bg)) {
            const urlObj: URL = new URL(bg);
            background.image = await downloadToBuffer(bg);
            background.ext = path.extname(urlObj.pathname).toLowerCase();
        } else {
            let fullPath: string = bg;

            // If path is relative, resolve relative to theme.json
            if (!path.isAbsolute(bg)) fullPath = path.resolve(path.dirname(themePath), bg);

            if (!fs.existsSync(fullPath)) throw new Error(`Theme background image not found: ${fullPath}`);

            background.image = fs.readFileSync(fullPath);
            background.ext = path.extname(bg).toLowerCase();
        }
    }

    return background;
}

/**
 * Load theme configuration from JSON file
 * @param {string} themePath
 * @return Theme
 */
export function loadTheme(themePath: string): Theme {
    try {
        const data: string = fs.readFileSync(themePath, "utf8");
        const theme: Theme = JSON.parse(data);
        theme.path = themePath;

        // Validate theme structure
        const required: string[] = ["background_color", "bubble", "fonts", "layout"];
        for (const key of required) {
            if (!theme[key as keyof Theme]) throw new Error(`Missing required theme property: ${key}`);
        }

        return theme;
    } catch (e: unknown) {
        if (e instanceof Error) {
            throw new Error(`Failed to load theme: ${e.message}`);
        } else {
            throw new Error(`Failed to load theme: ${String(e)}`);
        }
    }
}

/**
 * Detect if chat is from Android or iOS based on datetime format
 * @param {string} chatText
 * @return Platform
 */
export function detectPlatform(chatText: string): Platform {
    // iOS typically uses 12-hour format with AM/PM
    // Android typically uses 24-hour format
    const lines: string[] = chatText.split("\n").slice(0, 100); // Check first 100 lines
    let amPmCount: number = 0, has24Hour: boolean = false;

    for (const line of lines) {
        if (line.includes(" AM") || line.includes(" PM")) amPmCount++;

        // Check for times like 13:00 or higher (24-hour format)
        if (/\s(1[3-9]|2[0-3]):\d{2}/.test(line)) has24Hour = true;
    }

    // If we find AM/PM more than a few times, it's likely iOS
    if (amPmCount > 3) return "iOS";

    // If we find 24-hour times, it's likely Android
    if (has24Hour) return "Android";

    // Default to Android if unclear
    return "Android";
}

/**
 * Parse datetime string to Date object
 * Supports multiple formats from both Android and iOS
 * @param {string} datetimeStr
 * @return Date
 */
export function parseDateTime(datetimeStr: string): Date {
    const formats: { regex: RegExp, parse: (m: string[]) => Date }[] = [
        // Android: DD/MM/YYYY, HH:MM:SS
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})/,
            parse: (m) => new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6]))
        },
        // Android: DD/MM/YYYY, HH:MM
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})/,
            parse: (m) => new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]), 0)
        },
        // iOS: M/D/YY, H:MM:SS AM/PM
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{2}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i,
            parse: (m) => {
                let hour: number = parseInt(m[4]);
                const isPM: boolean = m[7].toUpperCase() === "PM";
                if (isPM && hour !== 12) hour += 12;
                if (!isPM && hour === 12) hour = 0;
                const year: number = parseInt(m[3]) + (parseInt(m[3]) < 50 ? 2000 : 1900);
                return new Date(year, parseInt(m[1]) - 1, parseInt(m[2]), hour, parseInt(m[5]), parseInt(m[6]));
            }
        },
        // iOS: M/D/YY, H:MM AM/PM
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{2}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i,
            parse: (m) => {
                let hour: number = parseInt(m[4]);
                const isPM: boolean = m[6].toUpperCase() === "PM";
                if (isPM && hour !== 12) hour += 12;
                if (!isPM && hour === 12) hour = 0;
                const year: number = parseInt(m[3]) + (parseInt(m[3]) < 50 ? 2000 : 1900);
                return new Date(year, parseInt(m[1]) - 1, parseInt(m[2]), hour, parseInt(m[5]), 0);
            }
        }
    ];

    for (const format of formats) {
        const match = datetimeStr.match(format.regex);
        if (match) {
            try {
                return format.parse(match);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    console.error(e.message);
                } else {
                    console.error(String(e));
                }
            }
        }
    }

    return new Date();
}

/**
 * Detect if the message is which types
 * @param {string} chatText
 * @return MessageContentType
 */
export function detectMessageType(chatText: string): MessageContentType {
    let type: MessageContentType["type"] = "text";
    let content: string = chatText.trim();

    const fileExtension: string = "opus|mp4|jpg|jpeg|png|webp|pdf|docx|zip"
    // Use RegExp constructor for dynamic patterns
    // Note: Backslashes are doubled for string literal escaping
    const filePattern: RegExp = new RegExp("(PTT-|VID-|IMG-|STK-|DOC-)\\S+\\.(" + fileExtension + ")\\s+\\(file attached\\)", "i");
    const filePattern2: RegExp = new RegExp("([^\\r\\n]+\\.)(" + fileExtension + ")", "i");

    const omitted = chatText.match(/<Media omitted>\n*/i);
    if (omitted) {
        type = "media_omitted";
        const remainText = omitted.input!.replace(omitted[0], "").trim().split(/\r?\n/);
        if (remainText[0]) {
            const fileMatch = remainText[0].match(filePattern2);
            const filename = fileMatch ? fileMatch[0] : "";

            return {type, text: remainText.slice(1).join("\n").trim(), filename: filename};
        } else {
            // reset the text
            content = "";
        }
    }

    const file = chatText.match(filePattern);
    if (file) {
        const filename: string = file[0].replace(" (file attached)", "").trim();
        const remainText: string = file.input!.replace(file[0], "").trim();

        type = "file";
        if (chatText.startsWith("PTT-")) type = "voice";
        else if (chatText.startsWith("VID-")) type = "video";
        else if (chatText.startsWith("IMG-")) type = "image";
        else if (chatText.startsWith("STK-")) type = "sticker";

        return {type, text: remainText, filename};
    }

    return {type, text: content};
}

/**
 * Format file size in human-readable format
 * @param {number} bytes
 * @return string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k: number = 1024;
    const sizes: string[] = ["Bytes", "KB", "MB", "GB", "TB"];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}