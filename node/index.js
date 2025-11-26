/**
 * WhatsApp2PDF - Fluent API
 *
 * Usage:
 *   const Index = require("whatsapp2pdf");
 *
 *   // Simple usage
 *   await Index("chat.zip").output("chat.pdf").convert();
 *
 *   // With options
 *   await Index("chat.zip")
 *     .theme("dark")
 *     .mainUser("John")
 *     .seal()
 *     .includeImages()
 *     .output("chat.pdf")
 *     .convert();
 *
 *   // With custom theme config
 *   await Index("chat.zip", { theme: customThemeObject })
 *     .output("chat.pdf")
 *     .convert();
 *
 *   // Get parsed data without generating PDF
 *   const data = await Index("chat.zip").parse();
 */

const fs = require("fs");
const path = require("path");
const WhatsAppParser = require("./parser");
const PDFRenderer = require("./renderer");
const { loadTheme, formatFileSize } = require("./utils");

// Resolve assets directory
const NODE_DIR = __dirname;
let ASSETS_DIR = path.join(NODE_DIR, "assets");
if (!fs.existsSync(ASSETS_DIR)) {
    ASSETS_DIR = path.join(NODE_DIR, "..", "assets");
}
const THEMES_DIR = path.join(ASSETS_DIR, "themes");

// Built-in themes
const BUILT_IN_THEMES = ["light", "dark"];

/**
 * Main Index class with fluent API
 */
class Index {
    constructor(inputPath, options = {}) {
        this._inputPath = path.resolve(inputPath);
        this._outputPath = null;
        this._theme = null;
        this._themeName = "light";
        this._mainUser = null;
        this._sealContacts = false;
        this._includeImages = false;
        this._search = false;
        this._searchStartDate = null;
        this._searchEndDate = null;
        this._searchKeyword = null;
        this._verbose = false;

        // Validate input exists
        if (!fs.existsSync(this._inputPath)) {
            throw new Error(`Input file not found: ${this._inputPath}`);
        }

        // Apply initial options
        if (options.theme) this.theme(options.theme);
        if (options.output) this.output(options.output);
        if (options.mainUser) this.mainUser(options.mainUser);
        if (options.seal) this.seal(options.seal);
        if (options.searchStart || options.searchEnd) this.searchDate(options.searchStart, options.searchEnd);
        if (options.searchKeyword) this.searchKeyword(options.searchKeyword);
        if (options.images || options.includeImages) this.includeImages(options.images || options.includeImages);
        if (options.verbose) this.verbose(options.verbose);
    }

    /**
     * Set theme by name ("light", "dark") or path to custom theme JSON
     * @param {string} themeNameOrPath - Theme name or path
     * @returns {Index} this (for chaining)
     */
    theme(themeNameOrPath) {
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
     * @param {string} outputPath - Output file path
     * @returns {Index} this (for chaining)
     */
    output(outputPath) {
        this._outputPath = outputPath ? path.resolve(outputPath) : null;
        return this;
    }

    /**
     * Set main user (appears on right side with colored bubbles)
     * @param {string} userName - Main user's name
     * @returns {Index} this (for chaining)
     */
    mainUser(userName) {
        this._mainUser = userName ? String(userName).toLowerCase().trim() : null;
        return this;
    }

    /**
     * Enable privacy mode (partially hide contact names)
     * @param {boolean} enabled - Enable seal mode (default: true)
     * @returns {Index} this (for chaining)
     */
    seal(enabled = true) {
        this._sealContacts = enabled;
        return this;
    }

    /**
     * Search messages by date
     * @param {string} start - Search message from
     * @param {string} end - Search message until
     * @returns {Index} this (for chaining)
     */
    searchDate(start, end) {
        this._search = true
        if (start) this._searchStartDate = new Date(start);
        if (end) this._searchEndDate = new Date(end);
        return this;
    }

    /**
     * Search messages by keyword
     * @param {string} keyword - Search message with keyword
     * @returns {Index} this (for chaining)
     */
    searchKeyword(keyword) {
        this._search = true
        this._searchKeyword = keyword ? String(keyword).toLowerCase().split(",") : null;
        return this;
    }

    /**
     * Include images at end of PDF
     * @param {boolean} enabled - Enable images (default: true)
     * @returns {Index} this (for chaining)
     */
    includeImages(enabled = true) {
        this._includeImages = enabled;
        return this;
    }

    /**
     * Alias for includeImages()
     */
    images(enabled = true) {
        return this.includeImages(enabled);
    }

    /**
     * Enable verbose logging
     * @param {boolean} enabled - Enable verbose (default: true)
     * @returns {Index} this (for chaining)
     */
    verbose(enabled = true) {
        this._verbose = enabled;
        return this;
    }

    #_applySearch(messages) {
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

    /**
     * Parse the WhatsApp export without generating PDF
     * @returns {Promise<Object>} Parsed chat data
     */
    async parse() {
        const parser = new WhatsAppParser(this._inputPath);
        const chatData = await parser.parse();
        if (this._search) chatData.messages = this.#_applySearch(chatData.messages);
        return chatData;
    }

    /**
     * Convert WhatsApp export to PDF
     * @returns {Promise<Object>} Result object with stats
     */
    async convert() {
        const log = this._verbose ? console.log.bind(console) : () => {};

        log("📦 Parsing WhatsApp export...");

        // Parse chat
        const parser = new WhatsAppParser(this._inputPath);
        const chatData = await parser.parse();

        // Apply filters
        if (this._search) chatData.messages = this.#_applySearch(chatData.messages);

        log(`✅ Found ${chatData.messages.length} messages`);
        log(`📱 Platform: ${chatData.platform}`);
        log(`👥 Participants: ${chatData.contacts.join(", ")}`);

        // Load default theme if not set
        if (!this._theme) {
            try {
                this.theme("light");
            } catch (e) {
                throw new Error("Default theme 'light' could not be loaded. Please specify a theme.");
            }
        }

        // Determine main user
        const mainUser = this._mainUser || chatData.contacts[0];
        if (this._mainUser && !chatData.contacts.includes(this._mainUser)) {
            log(`⚠️Warning: "${this._mainUser}" not found, using: ${chatData.contacts[0]}`);
        }

        // Determine output path
        const inputBasename = path.basename(this._inputPath, ".zip");
        const outputPath = this._outputPath || path.resolve(`whatsapp_chat_${inputBasename}_${this._themeName}.pdf`);

        log(`\n🔨 Generating PDF: ${outputPath}`);

        // Render PDF
        const renderer = new PDFRenderer(this._theme);

        await renderer.render({
            chatData,
            outputPath,
            mainUser,
            sealContacts: this._sealContacts,
            includeImages: this._includeImages
        });

        // Get stats
        const stats = fs.statSync(outputPath);

        log(`\n✅ PASSED: PDF generated (${formatFileSize(stats.size)})!`);
        log(`📄 Output: ${outputPath}`);


        return {
            success: true,
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
    async render() {
        return this.convert();
    }

    /**
     * Alias for convert()
     */
    async generate() {
        return this.convert();
    }
}

/**
 * Factory function for cleaner syntax
 * @param {string} inputPath - Path to WhatsApp export ZIP
 * @param {Object} options - Optional config { theme: themeObject }
 * @returns {Index} Index instance
 *
 * @example
 * const Index = require("whatsapp2pdf");
 * await Index("chat.zip").theme("dark").output("out.pdf").convert();
 */
function createPDF(inputPath, options = {}) {
    return new Index(inputPath, options);
}

// Static methods on factory function
createPDF.themes = BUILT_IN_THEMES;

// Export class for advanced usage
createPDF.WhatsApp2PDF = Index;

/**
 * Load a theme by name or path
 * @param {string} themeNameOrPath
 * @returns {Object} Theme configuration object
 */
createPDF.loadTheme = async (themeNameOrPath) => {
    if (BUILT_IN_THEMES.includes(themeNameOrPath.toLowerCase())) {
        return loadTheme(path.join(THEMES_DIR, themeNameOrPath, `${themeNameOrPath}.json`));
    }
    return loadTheme(path.resolve(themeNameOrPath));
};

/**
 * List available built-in themes
 * @returns {string[]} Array of theme names
 */
createPDF.listThemes = () => BUILT_IN_THEMES;

module.exports = createPDF;