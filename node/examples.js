const WhatsAppParser = require("./parser");
const PDFRenderer = require("./renderer");
const {loadTheme} = require("./utils");
const path = require("path");

/**
 * Example 1: Basic conversion with light theme
 */
async function example1_basic() {
    const theme = loadTheme(path.join(__dirname, "../assets/themes/light/light.json"));
    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    const renderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: path.join(__dirname, "../assets/output/example_01_basic.pdf"),
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log("Generated: example1_basic.pdf\n");
}

/**
 * Example 2: Dark theme with custom main user
 */
async function example2_darkTheme() {
    const theme = loadTheme(path.join(__dirname, "../assets/themes/dark/dark.json"));
    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    const renderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: path.join(__dirname, "../assets/output/example_02_dark.pdf"),
        mainUser: "Alice", // Specify main user
        sealContacts: false,
        includeImages: false
    });

    console.log("Generated: example2_dark.pdf\n");
}

/**
 * Example 3: Privacy mode (sealed contacts)
 */
async function example3_privacyMode() {
    const theme = loadTheme(path.join(__dirname, "../assets/themes/dark/dark.json"));
    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    const renderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: path.join(__dirname, "../assets/output/example_03_privacy.pdf"),
        mainUser: chatData.contacts[0],
        sealContacts: true, // Enable privacy mode
        includeImages: false
    });

    console.log("Generated: example3_privacy.pdf (all names hidden)\n");
}

/**
 * Example 4: Include images
 */
async function example4_withImages() {
    const theme = loadTheme(path.join(__dirname, "../assets/themes/light/light.json"));
    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    console.log(`Found ${Object.keys(chatData.mediaFiles).length} media files`);

    const renderer = new PDFRenderer(theme);
    await renderer.render({
        chatData,
        outputPath: path.join(__dirname, "../assets/output/example_04_images.pdf"),
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: true // Include images at end
    });

    console.log("Generated: example4_images.pdf\n");
}

/**
 * Example 5: Custom theme
 */
async function example5_customTheme() {
    // Create custom theme
    const customTheme = {
        background_color: "#F0F8FF", // Alice Blue
        background_image: "",
        datetime_text: "#708090",
        bubble: {
            main_user: "#FFE4B5", // Moccasin
            other_user: "#E0FFFF", // Light Cyan
            max_width_percent: 0.7,
            margin_bottom: 5,
            padding_left: 12,
            padding_right: 12,
            padding_top: 8,
            padding_bottom: 8,
            radius: 10
        },
        fonts: {
            colour: "#000080", // Navy
            family: "Helvetica",
            size: 15
        },
        layout: {
            margin_left: 100,
            margin_right: 100,
            margin_top: 80,
            margin_bottom: 80
        }
    };

    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    const renderer = new PDFRenderer(customTheme);
    await renderer.render({
        chatData,
        outputPath: path.join(__dirname, "../assets/output/example_05_custom.pdf"),
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log("Generated: example5_custom.pdf (with custom theme)\n");
}

/**
 * Example 6: Process multiple chats
 */
async function example6_batchProcessing() {
    const chatFiles = ["chat01.zip", "chat02.zip", "chat03.zip"];
    const theme = loadTheme(path.join(__dirname, "../assets/themes/light/light.json"));

    for (let i = 0; i < chatFiles.length; i++) {
        const chatFile = chatFiles[i];
        console.log(`Processing ${i + 1}/${chatFiles.length}: ${chatFile}...`);

        try {
            const parser = new WhatsAppParser(`../assets/example/${chatFile}`);
            const chatData = await parser.parse();

            const renderer = new PDFRenderer(theme);
            await renderer.render({
                chatData,
                outputPath: path.join(__dirname, `../assets/output/example_06_batch_output_${i + 1}.pdf`),
                mainUser: chatData.contacts[0],
                sealContacts: false,
                includeImages: false
            });

            console.log(`Generated: batch_output_${i + 1}.pdf`);
        } catch (error) {
            console.log(`Failed: ${error.message}`);
        }
    }

    console.log("\nBatch processing complete\n");
}

/**
 * Example 7: Analyze chat before converting
 */
async function example7_analysis() {
    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    // Analyze chat
    console.log("Chat Statistics:");
    console.log(`- Total Messages: ${chatData.totalMessages}`);
    console.log(`- Platform: ${chatData.platform}`);
    console.log(`- Participants: ${chatData.contacts.length}`);
    console.log(`- Media Files: ${Object.keys(chatData.mediaFiles).length}`);

    // Message breakdown per user
    const messageCount = {};
    chatData.messages.forEach(msg => {
        messageCount[msg.sender] = (messageCount[msg.sender] || 0) + 1;
    });

    console.log("\nMessages per participant:");
    Object.entries(messageCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([sender, count]) => {
            const percentage = ((count / chatData.totalMessages) * 100).toFixed(1);
            console.log(`${sender}: ${count} (${percentage}%)`);
        });

    // Date range
    const dates = chatData.messages
        .map(m => m.parsedDatetime)
        .filter(d => d !== null)
        .sort((a, b) => a - b);

    if (dates.length > 0) {
        console.log(`\nDate Range:`);
        console.log(`First: ${dates[0].toLocaleDateString()}`);
        console.log(`Last: ${dates[dates.length - 1].toLocaleDateString()}`);
        console.log(`Duration: ${Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))} days`);
    }

    // Now generate PDF with this analysis
    const theme = loadTheme(path.join(__dirname, "../assets/themes/dark/dark.json"));
    const renderer = new PDFRenderer(theme);

    await renderer.render({
        chatData,
        outputPath: path.join(__dirname, "../assets/output/example_07_analyzed.pdf"),
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log("\nGenerated: example7_analyzed.pdf\n");
}

/**
 * Example 8: Filter messages by date range
 */
async function example8_dateFilter() {
    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    // Filter messages from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);

    const filteredMessages = chatData.messages.filter(msg => {
        return msg.parsedDatetime && msg.parsedDatetime >= thirtyDaysAgo;
    });

    console.log(`Original messages: ${chatData.messages.length}`);
    console.log(`Filtered messages (last 30 days): ${filteredMessages.length}`);

    // Create filtered chat data
    const filteredChatData = {
        ...chatData,
        messages: filteredMessages,
        totalMessages: filteredMessages.length
    };

    const theme = loadTheme(path.join(__dirname, "../assets/themes/dark/dark.json"));
    const renderer = new PDFRenderer(theme);

    await renderer.render({
        chatData: filteredChatData,
        outputPath: path.join(__dirname, "../assets/output/example_08_filtered.pdf"),
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log("Generated: example8_filtered.pdf\n");
}

/**
 * Example 9: Search and highlight keywords
 */
async function example9_searchKeywords() {
    const parser = new WhatsAppParser("../assets/example/chat01.zip");
    const chatData = await parser.parse();

    const keywords = ["WhatsApp", "export", "pdf"];
    const matchedMessages = [];

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
    const searchChatData = {
        ...chatData,
        messages: matchedMessages,
        totalMessages: matchedMessages.length
    };

    const theme = loadTheme(path.join(__dirname, "../assets/themes/light/light.json"));
    const renderer = new PDFRenderer(theme);

    await renderer.render({
        chatData: searchChatData,
        outputPath: path.join(__dirname, "../assets/output/example_09_search.pdf"),
        mainUser: chatData.contacts[0],
        sealContacts: false,
        includeImages: false
    });

    console.log("Generated: example9_search.pdf\n");
}

/**
 * Example 10: Error handling
 */
async function example10_errorHandling() {
    try {
        // Attempt to parse non-existent file
        const parser = new WhatsAppParser("non_existent.zip");
        await parser.parse();
    } catch (error) {
        console.log("Caught error (expected):", error.message);
    }

    try {
        // Attempt to load invalid theme
        loadTheme(path.join(__dirname, "../assets/themes/custom/invalid.json"));
    } catch (error) {
        console.log("Caught error (expected):", error.message);
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

    const examples = {
        "1": {name: "Basic Conversion", fn: example1_basic},
        "2": {name: "Dark Theme", fn: example2_darkTheme},
        "3": {name: "Privacy Mode", fn: example3_privacyMode},
        "4": {name: "With Images", fn: example4_withImages},
        "5": {name: "Custom Theme", fn: example5_customTheme},
        "6": {name: "Batch Processing", fn: example6_batchProcessing},
        "7": {name: "Chat Analysis", fn: example7_analysis},
        "8": {name: "Date Filter", fn: example8_dateFilter},
        "9": {name: "Search Keywords", fn: example9_searchKeywords},
        "10": {name: "Error Handling", fn: example10_errorHandling}
    };

    if (!exampleNum || !examples[exampleNum]) {
        console.log("Available Examples:\n");
        Object.entries(examples).forEach(([num, {name}]) => {
            console.log(`${num}. ${name}`);
        });
        console.log("\nUsage: node examples.js <example_number>");
        console.log("Example: node examples.js 1\n");
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
    } catch (error) {
        console.log("─".repeat(50));
        console.log(`Example failed: ${error.message}\n`);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

// Export for use as module
module.exports = {
    example1_basic,
    example2_darkTheme,
    example3_privacyMode,
    example4_withImages,
    example5_customTheme,
    example6_batchProcessing,
    example7_analysis,
    example8_dateFilter,
    example9_searchKeywords,
    example10_errorHandling
};