import * as fs from "fs";
import * as path from "path";
import {fileURLToPath} from "url";
import {WhatsAppParser} from "../src/parser.js";
import {PDFRenderer} from "../src/renderer.js";
import {loadTheme, formatFileSize} from "../src/utils.js";
import {WhatsApp2PDF} from "../src/index.js";
import {Theme, ChatData, Message, ConvertResult} from "../src/types/index.js";

const NODE_DIR = path.dirname(fileURLToPath(import.meta.url));
const input: string = path.join(NODE_DIR, "../../assets/example/%.zip");
const output: string = path.join(NODE_DIR, "../../assets/output/%.pdf");
const themes: string = path.join(NODE_DIR, "../../assets/themes/%/%.json");

/**
 * Example 1: Basic conversion with light theme
 */
async function example1_basic() {
    const theme: Theme = loadTheme(themes.replace(/%/g, "light"));
    const outputPath: string = output.replace("%", "example_01_basic");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    const renderer: PDFRenderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: outputPath,
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log(`Generated: example1_basic.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example11_basic() {
    const result: ConvertResult = await WhatsApp2PDF(input.replace("%", "chat01"))
        .output(output.replace("%", "example_01_basic"))
        .convert();

    console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
}

/**
 * Example 2: Dark theme with custom main user
 */
async function example2_darkTheme() {
    const theme: Theme = loadTheme(themes.replace(/%/g, "dark"));
    const outputPath: string = output.replace("%", "example_02_dark");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    const renderer: PDFRenderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: outputPath,
        mainUser: "Alice", // Specify main user
        sealContacts: false,
        includeImages: false
    });

    console.log(`Generated: example2_dark.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example12_darkTheme() {
    const result: ConvertResult = await WhatsApp2PDF(input.replace("%", "chat01"))
        .theme("dark")
        .output(output.replace("%", "example_02_dark"))
        .convert();

    console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
}

/**
 * Example 3: Privacy mode (sealed contacts)
 */
async function example3_privacyMode() {
    const theme: Theme = loadTheme(themes.replace(/%/g, "dark"));
    const outputPath: string = output.replace("%", "example_03_privacy");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    const renderer: PDFRenderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: outputPath,
        mainUser: chatData.contacts[0],
        sealContacts: true, // Enable privacy mode
        includeImages: false
    });

    console.log(`Generated: example3_privacy.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example13_privacyMode() {
    const result: ConvertResult = await WhatsApp2PDF(input.replace("%", "chat01"))
        .seal()
        .output(output.replace("%", "example_03_privacy"))
        .convert();

    console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
}

/**
 * Example 4: Include images
 */
async function example4_withImages() {
    const theme: Theme = loadTheme(themes.replace(/%/g, "light"));
    const outputPath: string = output.replace("%", "example_04_images");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    console.log(`Found ${Object.keys(chatData.mediaFiles).length} media files`);

    const renderer: PDFRenderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: outputPath,
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: true // Include images at end
    });

    console.log(`Generated: example4_images.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example14_withImages() {
    const result: ConvertResult = await WhatsApp2PDF(input.replace("%", "chat01"))
        .images()
        .output(output.replace("%", "example_04_images"))
        .convert();

    console.log(`Found ${result.media} media files`);
    console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
}

/**
 * Example 5: Custom theme
 */
async function example5_customTheme() {
    const outputPath: string = output.replace("%", "example_05_custom");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    const renderer: PDFRenderer = new PDFRenderer({
        background_color: "#F0F8FF", // Alice Blue
        bubble: {
            color: "#FFE4B5", // Moccasin
            color_other: "#E0FFFF", // Light Cyan
            max_width_percent: 0.7,
            margin_top: 0,
            margin_bottom: 5,
            padding_left: 12,
            padding_right: 12,
            padding_top: 8,
            padding_bottom: 8,
            radius: 10
        },
        fonts: {
            color: "#000080", // Navy
            family: "Helvetica",
            size: 15
        },
        layout: {
            margin_left: 100,
            margin_right: 100,
            margin_top: 80,
            margin_bottom: 80
        },
    });
    await renderer.render({
        chatData,
        outputPath: outputPath,
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log(`Generated: example5_custom.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example15_customTheme() {
    const result: ConvertResult = await WhatsApp2PDF(input.replace("%", "chat01"))
        .theme({
            background_color: "#F0F8FF", // Alice Blue
            bubble: {
                color: "#FFE4B5", // Moccasin
                color_other: "#E0FFFF", // Light Cyan
                max_width_percent: 0.7,
                margin_top: 0,
                margin_bottom: 5,
                padding_left: 12,
                padding_right: 12,
                padding_top: 8,
                padding_bottom: 8,
                radius: 10
            },
            fonts: {
                color: "#000080", // Navy
                family: "Helvetica",
                size: 15
            },
            layout: {
                margin_left: 100,
                margin_right: 100,
                margin_top: 80,
                margin_bottom: 80
            },
        })
        .output(output.replace("%", "example_05_custom"))
        .convert();

    console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
}

/**
 * Example 6: Process multiple chats
 */
async function example6_batchProcessing() {
    const chatFiles: string[] = ["chat01", "chat02", "chat03"];
    const theme: Theme = loadTheme(themes.replace(/%/g, "light"));

    for (let i: number = 0; i < chatFiles.length; i++) {
        const chatFile: string = chatFiles[i];
        console.log(`Processing ${i + 1}/${chatFiles.length}: ${chatFile}...`);

        try {
            const outputPath: string = output.replace("%", `example_06_batch_output_${i + 1}`);
            const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", chatFile));
            const chatData: ChatData = await parser.parse();

            const renderer: PDFRenderer = new PDFRenderer(theme);
            await renderer.render({
                chatData,
                outputPath: outputPath,
                mainUser: chatData.contacts[0],
                sealContacts: false,
                includeImages: false
            });

            console.log(`Generated: batch_output_${i + 1}.pdf (${formatFileSize(fs.statSync(outputPath).size)})`);
        } catch (e: any) {
            console.log(`Failed: ${e.message}`);
        }
    }

    console.log("\nBatch processing complete\n");
}

async function example16_batchProcessing() {
    const chatFiles: string[] = ["chat01", "chat02", "chat03"];

    for (let i: number = 0; i < chatFiles.length; i++) {
        const chatFile: string = chatFiles[i];
        console.log(`Processing ${i + 1}/${chatFiles.length}: ${chatFile}...`);

        const result: ConvertResult = await WhatsApp2PDF(input.replace("%", chatFile))
            .output(output.replace("%", `example_06_batch_output_${i + 1}`))
            .convert();

        console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
    }

    console.log("\nBatch processing complete\n");
}

/**
 * Example 7: Analyze chat before converting
 */
async function example7_analysis() {
    const outputPath: string = output.replace("%", "example_07_analyzed");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    // Analyze chat
    console.log("Chat Statistics:");
    console.log(`- Total Messages: ${chatData.totalMessages}`);
    console.log(`- Platform: ${chatData.platform}`);
    console.log(`- Participants: ${chatData.contacts.length}`);
    console.log(`- Media Files: ${Object.keys(chatData.mediaFiles).length}`);

    // Message breakdown per user
    const messageCount: Record<string, number> = {};
    chatData.messages.forEach(msg => {
        messageCount[msg.sender] = (messageCount[msg.sender] || 0) + 1;
    });

    console.log("\nMessages per participant:");
    Object.entries(messageCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([sender, count]) => {
            const percentage: string = ((count / chatData.totalMessages) * 100).toFixed(1);
            console.log(`${sender}: ${count} (${percentage}%)`);
        });

    // Date range
    const dates: Date[] = chatData.messages
        .map(m => m.parsedDatetime)
        .filter(d => d !== null)
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

    if (dates.length > 0) {
        console.log(`\nDate Range:`);
        console.log(`First: ${dates[0].toLocaleDateString()}`);
        console.log(`Last: ${dates[dates.length - 1].toLocaleDateString()}`);
        console.log(`Duration: ${Math.ceil((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24))} days`);
    }

    // Now generate PDF with this analysis
    const theme: Theme = loadTheme(themes.replace(/%/g, "dark"));
    const renderer: PDFRenderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: outputPath,
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log(`\nGenerated: example7_analyzed.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example17_analysis() {
    const chatData = await WhatsApp2PDF(input.replace("%", "chat01"))
        .parse();

    // Analyze chat
    console.log("Chat Statistics:");
    console.log(`- Total Messages: ${chatData.totalMessages}`);
    console.log(`- Platform: ${chatData.platform}`);
    console.log(`- Participants: ${chatData.contacts.length}`);
    console.log(`- Media Files: ${Object.keys(chatData.mediaFiles).length}`);

    // Message breakdown per user
    const messageCount: Record<string, number> = {};
    chatData.messages.forEach(msg => {
        messageCount[msg.sender] = (messageCount[msg.sender] || 0) + 1;
    });

    console.log("\nMessages per participant:");
    Object.entries(messageCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([sender, count]) => {
            const percentage: string = ((count / chatData.totalMessages) * 100).toFixed(1);
            console.log(`${sender}: ${count} (${percentage}%)`);
        });

    // Date range
    const dates: Date[] = chatData.messages
        .map(m => m.parsedDatetime)
        .filter(d => d !== null)
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

    if (dates.length > 0) {
        console.log(`\nDate Range:`);
        console.log(`First: ${dates[0].toLocaleDateString()}`);
        console.log(`Last: ${dates[dates.length - 1].toLocaleDateString()}`);
        console.log(`Duration: ${Math.ceil((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24))} days`);
    }
}

/**
 * Example 8: Filter messages by date range
 */
async function example8_dateFilter() {
    const outputPath: string = output.replace("%", "example_08_filtered");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    // Filter messages from last 30 days
    const thirtyDaysAgo: Date = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredMessages: Message[] = chatData.messages.filter(msg => {
        return msg.parsedDatetime && msg.parsedDatetime >= thirtyDaysAgo;
    });

    console.log(`Original messages: ${chatData.messages.length}`);
    console.log(`Filtered messages (last 30 days): ${filteredMessages.length}`);

    // Create filtered chat data
    const filteredChatData: ChatData = {
        ...chatData,
        messages: filteredMessages,
        totalMessages: filteredMessages.length
    };

    const theme: Theme = loadTheme(themes.replace(/%/g, "dark"));
    const renderer: PDFRenderer = new PDFRenderer(theme);
    await renderer.render({
        chatData: filteredChatData,
        outputPath: outputPath,
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log(`Generated: example8_filtered.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example18_dateFilter() {
    const thirtyDaysAgo: Date = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result: ConvertResult = await WhatsApp2PDF(input.replace("%", "chat01"))
        .searchDate(thirtyDaysAgo.toString())
        .output(output.replace("%", "example_08_filtered"))
        .convert();

    console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
}

/**
 * Example 9: Search and highlight keywords
 */
async function example9_searchKeywords() {
    const outputPath: string = output.replace("%", "example_09_search");
    const parser: WhatsAppParser = new WhatsAppParser(input.replace("%", "chat01"));
    const chatData: ChatData = await parser.parse();

    const keywords: string[] = ["WhatsApp", "export", "pdf"];
    const matchedMessages: Message[] = [];

    chatData.messages.forEach(msg => {
        const hasKeyword = keywords.some(keyword =>
            msg.text.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasKeyword) {
            matchedMessages.push(msg);
        }
    });

    console.log(`Found ${matchedMessages.length} messages with keywords: ${keywords.join(", ")}`);

    // Create filtered chat data with only matched messages
    const searchChatData: ChatData = {
        ...chatData,
        messages: matchedMessages,
        totalMessages: matchedMessages.length
    };

    const theme: Theme = loadTheme(themes.replace(/%/g, "light"));
    const renderer: PDFRenderer = new PDFRenderer(theme);

    await renderer.render({
        chatData: searchChatData,
        outputPath: outputPath,
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log(`Generated: example9_search.pdf (${formatFileSize(fs.statSync(outputPath).size)})\n`);
}

async function example19_searchKeywords() {
    const keywords: string[] = ["WhatsApp", "export", "pdf"];

    const result: ConvertResult = await WhatsApp2PDF(input.replace("%", "chat01"))
        .searchKeyword(keywords.join(","))
        .output(output.replace("%", "example_09_search"))
        .convert();

    console.log(`Generated: ${result.fileName} (${result.fileSizeFormatted})\n`);
}

/**
 * Example 10: Error handling
 */
async function example10_errorHandling() {
    try {
        // Attempt to parse non-existent file
        const parser: WhatsAppParser = new WhatsAppParser("non_existent.zip");
        await parser.parse();
    } catch (e: any) {
        console.log("Caught error (expected):", e.message);
    }

    try {
        // Attempt to load invalid theme
        loadTheme(path.join(__dirname, "./assets/themes/custom/invalid.json"));
    } catch (e: any) {
        console.log("Caught error (expected):", e.message);
    }

    console.log("\nError handling working correctly\n");
}

async function example20_errorHandling() {
    try {
        await WhatsApp2PDF(input.replace("%", "non_existent"))
    } catch (e: any) {
        console.log("Caught error (expected):", e.message);
    }

    try {
        await WhatsApp2PDF(input.replace("%", "chat01"))
            .theme(path.join(__dirname, "./assets/themes/custom/invalid.json"))
    } catch (e: any) {
        console.log("Caught error (expected):", e.message);
    }

    console.log("\nError handling working correctly\n");
}

// Menu for running examples
async function main() {
    console.log("╔═══════════════════════════════════════╗");
    console.log("║  WhatsApp to PDF - Example Suite      ║");
    console.log("╚═══════════════════════════════════════╝\n");

    const args = process.argv.slice(2);
    const exampleNum = args[0];

    const examples: {
        [key: string]: {
            name: string;
            fn: () => Promise<void>;
        }
    } = {
        "1": {name: "Basic Conversion", fn: example1_basic},
        "2": {name: "Dark Theme", fn: example2_darkTheme},
        "3": {name: "Privacy Mode", fn: example3_privacyMode},
        "4": {name: "With Images", fn: example4_withImages},
        "5": {name: "Custom Theme", fn: example5_customTheme},
        "6": {name: "Batch Processing", fn: example6_batchProcessing},
        "7": {name: "Chat Analysis", fn: example7_analysis},
        "8": {name: "Date Filter", fn: example8_dateFilter},
        "9": {name: "Search Keywords", fn: example9_searchKeywords},
        "10": {name: "Error Handling", fn: example10_errorHandling},
        "11": {name: "Basic Conversion (cli)", fn: example11_basic},
        "12": {name: "Dark Theme (cli)", fn: example12_darkTheme},
        "13": {name: "Privacy Mode (cli)", fn: example13_privacyMode},
        "14": {name: "With Images (cli)", fn: example14_withImages},
        "15": {name: "Custom Theme (cli)", fn: example15_customTheme},
        "16": {name: "Batch Processing (cli)", fn: example16_batchProcessing},
        "17": {name: "Chat Analysis (cli)", fn: example17_analysis},
        "18": {name: "Date Filter (cli)", fn: example18_dateFilter},
        "19": {name: "Search Keywords (cli)", fn: example19_searchKeywords},
        "20": {name: "Error Handling (cli)", fn: example20_errorHandling}
    };

    if (!exampleNum || !examples[exampleNum]) {
        console.log("Available Examples:\n");
        Object.entries(examples).forEach(([num, {name}]) => {
            console.log(`${num}. ${name}`);
        });
        console.log("\nUsage: npm run example <example_number>");
        console.log("Example: npm run example 1\n");
        return;
    }

    const example = examples[exampleNum];
    console.log(`Running: Example ${exampleNum} - ${example.name}\n`);
    console.log("─".repeat(50) + "\n");

    try {
        console.time("Example completed successfully!");
        await example.fn();
        console.log("─".repeat(50));
        console.timeEnd("Example completed successfully!");
    } catch (e: any) {
        console.log("─".repeat(50));
        console.log(`Example failed: ${e.message}\n`);
        if (process.env.DEBUG) {
            console.error(e.stack);
        }
        process.exit(1);
    }
}

main().catch(console.error);