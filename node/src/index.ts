import * as fs from "fs";
import * as path from "path";
import {fileURLToPath} from "url";
import {WhatsAppParser} from "./parser.js";
import {PDFRenderer} from "./renderer.js";
import {loadTheme, formatFileSize} from "./utils.js";
import {Theme, ChatData, WhatsApp2PDFOptions, ConvertResult, Message} from "./types/index.js";

// Resolve assets directory
const NODE_DIR = path.dirname(fileURLToPath(import.meta.url));
let ASSETS_DIR = path.join(NODE_DIR, "assets");
if (!fs.existsSync(ASSETS_DIR)) {
    ASSETS_DIR = path.join(NODE_DIR, "..", "assets");
}
const THEMES_DIR = path.join(ASSETS_DIR, "themes");

// Built-in themes
const BUILT_IN_THEMES: string[] = ["light", "dark"];

// Default configuration, used to populate unprovided options.
const DEFAULT_OPTIONS: WhatsApp2PDFOptions = {
    output: "",
    mainUser: "",
    privacy: false,
    start: "",
    end: "",
    keyword: "",
    images: false,
    verbose: false,
    theme: "light",
};

/**
 * WhatsApp2PDF Fluent API Class
 */
class Index {
    private readonly _inputPath: string;
    private _search: boolean = false;
    private _searchStartDate: Date | null = null;
    private _searchEndDate: Date | null = null;
    private _searchKeyword: string[] | null = null;
    private _options: WhatsApp2PDFOptions;
    private _theme: Theme | null = null;
    private _themeName: string = "light";

    constructor(inputPath: string, options: WhatsApp2PDFOptions = {}) {
        this._inputPath = path.resolve(inputPath);

        // Merge default values and user-provided options
        this._options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };

        // Validate input exists
        if (!fs.existsSync(this._inputPath)) {
            throw new Error(`Input file not found: ${this._inputPath}`);
        }

        if (this._options.themePath) {
            this.theme(this._options.themePath);
        } else if (this._options.theme) {
            this.theme(this._options.theme);
        } else {
            this.theme("light");
        }

        this.searchDate(this._options.start, this._options.end);
        this.searchKeyword(this._options.keyword)
    }

    /**
     * Set theme by name ("light", "dark") or path to custom theme JSON
     * @param themeNameOrPath - Theme name or file path
     */
    public theme(themeNameOrPath: string | Theme): Index {
        if (typeof themeNameOrPath === "string" && BUILT_IN_THEMES.includes(themeNameOrPath.toLowerCase())) {
            // Built-in theme
            const themePath = path.join(THEMES_DIR, themeNameOrPath, `${themeNameOrPath}.json`);
            if (!fs.existsSync(themePath)) {
                throw new Error(`Theme not found: ${themePath}`);
            }
            this._theme = loadTheme(themePath);
            this._themeName = themeNameOrPath.toLowerCase();
        } else if (typeof themeNameOrPath === "string" && fs.existsSync(themeNameOrPath)) {
            // Custom theme path
            this._theme = loadTheme(path.resolve(themeNameOrPath));
            this._themeName = path.basename(themeNameOrPath, ".json");
        } else if (typeof themeNameOrPath === "object") {
            // Theme config object
            this._theme = themeNameOrPath;
            this._themeName = "custom";
        } else {
            throw new Error(`Invalid theme: ${themeNameOrPath}. Use "light", "dark", or a valid path.`);
        }
        return this;
    }

    /**
     * Set output PDF path
     * @param outputPath - Output file path / name
     */
    public output(outputPath: string): Index {
        this._options.output = path.resolve(outputPath);
        return this;
    }

    /**
     * Set main user (appears on right side with colored bubbles)
     * @param userName - Main user's name
     */
    public mainUser(userName: string): Index {
        this._options.mainUser = userName;
        return this;
    }

    /**
     * Enable privacy mode (partially hide contact names)
     * @param enabled - Enable seal mode (default: true)
     */
    public seal(enabled: boolean = true): Index {
        this._options.privacy = enabled;
        return this;
    }

    /**
     * Search messages by date
     * @param start - Search message from
     * @param end - Search message until
     */
    public searchDate(start: string | null = null, end: string | null = null): Index {
        if (start) {
            this._searchStartDate = new Date(start)
            this._options.start = start;
            this._search = true
        }
        if (end) {
            this._searchEndDate = new Date(end)
            this._options.end = end;
            this._search = true
        }
        return this;
    }

    /**
     * Search messages by keyword
     * @param keyword - Search message with keyword
     */
    public searchKeyword(keyword: string | null = null): Index {
        if (keyword) {
            this._searchKeyword = keyword.toLowerCase().split(",")
            this._options.keyword = keyword;
            this._search = true
        }
        return this;
    }

    /**
     * Include images at end of PDF
     * @param enabled - Enable images (default: true)
     */
    public includeImages(enabled = true): Index {
        this._options.images = enabled;
        return this;
    }

    /**
     * Alias for includeImages()
     */
    public images(enabled = true): Index {
        return this.includeImages(enabled);
    }

    /**
     * Enable verbose logging
     * @param enabled - Enable verbose (default: true)
     */
    public verbose(enabled: boolean = true): Index {
        this._options.verbose = enabled;
        return this;
    }

    /**
     * Parse the WhatsApp export without generating PDF
     * @returns Parsed chat data
     */
    public async parse(): Promise<ChatData> {
        const parser = new WhatsAppParser(this._inputPath);
        const chatData = await parser.parse();
        if (this._search) chatData.messages = this._applySearch(chatData.messages);
        return chatData;
    }

    /**
     * Convert WhatsApp export to PDF
     * @returns Result object with stats
     */
    public async convert(): Promise<ConvertResult> {
        const log = this._options.verbose ? console.log.bind(console) : () => {};
        log("📦 Parsing WhatsApp export...");

        // Parse chat
        const parser = new WhatsAppParser(this._inputPath);
        const chatData = await parser.parse();

        // Apply filters
        if (this._search) chatData.messages = this._applySearch(chatData.messages);

        log(`✅ Found ${chatData.messages.length} messages`);
        log(`📱 Platform: ${chatData.platform}`);
        log(`👥 Participants: ${chatData.contacts.join(", ")}`);

        // Load default theme if not set
        if (!this._theme) this.theme("light");

        // Determine main user
        const mainUser = this._options.mainUser || chatData.contacts[0];
        if (this._options.mainUser && !chatData.contacts.includes(this._options.mainUser)) {
            log(`⚠️Warning: User(${this._options.mainUser}) not found, using: User(${chatData.contacts[0]})`);
        }

        // Determine output path
        const inputBasename = path.basename(this._inputPath, ".zip");
        const outputPath = this._options.output || path.resolve(`whatsapp_chat_${inputBasename}_${this._themeName}.pdf`);

        log(`\n🔨 Generating PDF: ${outputPath}`);

        // Render PDF
        const renderer = new PDFRenderer(this._theme!);

        await renderer.render({
            chatData,
            outputPath,
            mainUser,
            sealContacts: this._options.privacy!,
            includeImages: this._options.images!
        });

        // Get stats
        const stats = fs.statSync(outputPath);

        log(`\n✅ PASSED: PDF generated (${formatFileSize(stats.size)})!`);
        log(`📄 Output: ${outputPath}`);

        return {
            outputPath,
            fileName: path.basename(outputPath),
            fileSize: stats.size,
            fileSizeFormatted: formatFileSize(stats.size),
            messages: chatData.messages.length,
            media: Object.keys(chatData.mediaFiles).length,
            contacts: chatData.contacts,
            platform: chatData.platform,
            mainUser,
            theme: this._themeName
        };
    }

    /**
     * Alias for convert()
     */
    public async render(): Promise<ConvertResult> {
        return this.convert();
    }

    /**
     * Alias for convert()
     */
    public async generate(): Promise<ConvertResult> {
        return this.convert();
    }

    /**
     * Search for the messages
     * @param messages whole messages list
     * @returns Match the keyword or within time period
     */
    private _applySearch(messages: Message[]): Message[] {
        return messages.filter(msg => {
            // Check Start Date: If start date exists AND message is before it, exclude.
            if (this._searchStartDate && msg.parsedDatetime < this._searchStartDate) return false;

            // Check End Date: If end date exists AND message is after it, exclude.
            if (this._searchEndDate && msg.parsedDatetime > this._searchEndDate) return false;

            // Check Keywords: If keywords exist, message must contain at least one.
            if (this._searchKeyword) {
                const hasKeyword = this._searchKeyword.some(keyword => msg.text.toLowerCase().includes(keyword.toLowerCase()));
                if (!hasKeyword) return false;
            }

            // If it passed all checks, include the message.
            return true;
        });
    }
}

/**
 * Factory function for cleaner syntax
 * @param {string} inputPath - Path to WhatsApp export ZIP
 * @param {Object} options - Optional config { theme: themeObject }
 *
 * @example
 * import {WhatsApp2PDF} from “whatsApp2PDF”
 * await WhatsApp2PDF("chat.zip").theme("dark").output("out.pdf").convert();
 */
export function WhatsApp2PDF(inputPath: string, options: WhatsApp2PDFOptions = {}) {
    return new Index(inputPath, options);
}

/**
 * List available built-in themes
 * @returns {string[]} Array of theme names
 */
export function listThemes() {
    return BUILT_IN_THEMES
}