const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

/**
 * Detect HTTP/HTTPS URL
 */
function isURL(str) {
    return /^https?:\/\//i.test(str);
}

/**
 * Detect data URI Base64
 */
function isDataURI(str) {
    return /^data:image\/(png|jpeg|jpg);base64,/i.test(str);
}

/**
 * Download file as buffer
 */
function downloadToBuffer(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;

        client.get(url, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} on ${url}`));
                return;
            }

            const chunks = [];
            res.on("data", d => chunks.push(d));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", reject);
    });
}

/**
 * Load background image buffer for theme
 */
async function detectBackgroundImage(background, themePath) {
    if (background.image) {
        const bg = background.image.trim();
        if (isDataURI(bg)) {
            const regex = /^data:image\/(png|jpeg|jpg);base64,/i
            const base64Data = bg.replace(regex, "");
            const match = bg.match(regex);
            background.image = Buffer.from(base64Data, "base64");
            background.ext = match ? `.${match[1].toLowerCase()}` : null;
        } else if (isURL(bg)) {
            const urlObj = new URL(bg);
            background.image = await downloadToBuffer(bg);
            background.ext = path.extname(urlObj.pathname).toLowerCase();
        } else {
            let fullPath = bg;

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
 */
function loadTheme(themePath) {
    try {
        const data = fs.readFileSync(themePath, "utf8");
        const theme = JSON.parse(data);
        theme.path = themePath;

        // Validate theme structure
        const required = ["background_color", "bubble", "fonts", "layout"];
        for (const key of required) {
            if (!theme[key]) throw new Error(`Missing required theme property: ${key}`);
        }

        return theme;
    } catch (error) {
        throw new Error(`Failed to load theme: ${error.message}`);
    }
}

/**
 * Detect if chat is from Android or iOS based on datetime format
 */
function detectPlatform(chatText) {
    // iOS typically uses 12-hour format with AM/PM
    // Android typically uses 24-hour format
    const lines = chatText.split("\n").slice(0, 100); // Check first 100 lines
    let amPmCount = 0, has24Hour = false;

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
 */
function parseDateTime(datetimeStr) {
    const formats = [
        // Android: DD/MM/YYYY, HH:MM:SS
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})/,
            parse: (m) => new Date(m[3], m[2] - 1, m[1], m[4], m[5], m[6])
        },
        // Android: DD/MM/YYYY, HH:MM
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})/,
            parse: (m) => new Date(m[3], m[2] - 1, m[1], m[4], m[5], 0)
        },
        // iOS: M/D/YY, H:MM:SS AM/PM
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{2}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i,
            parse: (m) => {
                let hour = parseInt(m[4]);
                const isPM = m[7].toUpperCase() === "PM";
                if (isPM && hour !== 12) hour += 12;
                if (!isPM && hour === 12) hour = 0;
                const year = parseInt(m[3]) + (parseInt(m[3]) < 50 ? 2000 : 1900);
                return new Date(year, m[1] - 1, m[2], hour, m[5], m[6]);
            }
        },
        // iOS: M/D/YY, H:MM AM/PM
        {
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{2}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i,
            parse: (m) => {
                let hour = parseInt(m[4]);
                const isPM = m[6].toUpperCase() === "PM";
                if (isPM && hour !== 12) hour += 12;
                if (!isPM && hour === 12) hour = 0;
                const year = parseInt(m[3]) + (parseInt(m[3]) < 50 ? 2000 : 1900);
                return new Date(year, m[1] - 1, m[2], hour, m[5], 0);
            }
        }
    ];

    for (const format of formats) {
        const match = datetimeStr.match(format.regex);
        if (match) {
            try {
                return format.parse(match);
            } catch (e) {
                continue;
            }
        }
    }

    return null;
}

/**
 * Detect if the message is which types
 */
function detectMessageType(chatText) {
    let type = "text"
    let content = chatText.trim()

    const fileExtension = "opus|mp4|jpg|jpeg|png|webp|pdf|docx|zip"
    // Use RegExp constructor for dynamic patterns
    // Note: Backslashes are doubled for string literal escaping
    const filePattern = new RegExp("(PTT-|VID-|IMG-|STK-|DOC-)\\S+\\.(" + fileExtension + ")\\s+\\(file attached\\)", "i");
    const filePattern2 = new RegExp("([^\\r\\n]+\\.)(" + fileExtension + ")", "i");

    const omitted = chatText.match(/<Media omitted>\n*/i);
    if (omitted) {
        type = "media_omitted";
        const remainText = omitted.input.replace(omitted[0], "").trim().split(/\r?\n/);
        if (remainText[0]) {
            const fileMatch = remainText[0].match(filePattern2);
            const filename = fileMatch ? fileMatch[0] : "";

            return {type, text: remainText.slice(1).join("\n").trim(), filename};
        } else {
            // reset the text
            content = "";
        }
    }

    const file = chatText.match(filePattern);
    if (file) {
        const filename = file[0].replace(" (file attached)", "").trim();
        const remainText = file.input.replace(file[0], "").trim();

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
 */
function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

module.exports = {
    loadTheme,
    detectBackgroundImage,
    detectPlatform,
    parseDateTime,
    detectMessageType,
    formatFileSize
};