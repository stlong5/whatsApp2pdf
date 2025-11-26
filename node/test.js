const fs = require("fs");
const path = require("path");
const WhatsAppParser = require("./parser");
const PDFRenderer = require("./renderer");
const { loadTheme, detectMessageType, formatFileSize } = require("./utils");
const output = path.join(__dirname, "./assets/output/%.pdf");
const themes = path.join(__dirname, "./assets/themes/%/%.json");

// Test data
const sampleMessages = [
    { datetime: "12/10/2025, 14:30", sender: "Alice", text: "Hey! How are you?" },
    { datetime: "12/10/2025, 14:31", sender: "🤔 Bob", text: "Im doing great! Just finished work 😊" },
    { datetime: "12/10/2025, 14:32", sender: "Alice", text: "Thats awesome!\nI was thinking we could meet up this weekend?" },
    { datetime: "12/10/2025, 14:35", sender: "🤔 Bob", text: "Sure! Where do you want to go?" },
    { datetime: "12/10/2025, 14:36", sender: "Alice", text: "How about that new cafe downtown? I heard they have amazing coffee ☕" },
];

async function runTests() {
    console.log(`╔══════════════════════════════╗`);
    console.log(`║ WhatsApp to PDF - Test Suite ║`);
    console.log(`╚══════════════════════════════╝`);

    let passed = 0;
    let failed = 0;

    // Test 1: Theme Loading
    console.log(`\nTest 1: Loading Themes...`);
    try {
        const lightTheme = loadTheme(themes.replaceAll("%", "light"));
        const darkTheme = loadTheme(themes.replaceAll("%", "dark"));

        if (lightTheme && darkTheme) {
            console.info(`PASSED: Themes loaded successfully`);
            passed++;
        }
    } catch (error) {
        console.error(`FAILED: ${error.message}`);
        failed++;
    }

    // Test 2: Parser (with mock data)
    console.log(`\nTest 2: Message Parsing...`);
    try {
        // Create a mock chat text
        const mockChatText = sampleMessages.map(m => `[${m.datetime}] ${m.sender}: ${m.text}`).join("\n");

        // Test the regex pattern
        const lines = mockChatText.split("\n");
        const pattern = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s*[-:]?\s*([^:]+?):\s*(.+)$/;

        let parsedCount = 0;
        lines.forEach(line => {
            if (pattern.test(line)) parsedCount++;
        });

        if (parsedCount === sampleMessages.length) {
            console.info(`PASSED: Parsed ${parsedCount}/${sampleMessages.length} messages`);
            passed++;
        } else {
            console.error(`FAILED: Only parsed ${parsedCount}/${sampleMessages.length} messages`);
            failed++;
        }
    } catch (error) {
        console.error(`FAILED: ${error.message}`);
        failed++;
    }

    // Test 3: PDF Generation (with mock data)
    console.log(`\nTest 3: PDF Generation...`);
    try {
        console.time("Time");
        const testOutputPath = output.replaceAll("%", "test");
        const theme = loadTheme(themes.replaceAll("%", "light"));
        const renderer = new PDFRenderer(theme);
        const contacts = [...new Set(sampleMessages.map(m => m.sender))].sort();

        const mockChatData = {
            messages: sampleMessages.map(m => ({
                ...m,
                ...detectMessageType(m.text),
                parsedDatetime: new Date()
            })),
            contacts: contacts,
            platform: "Android",
            mediaFiles: {},
            totalMessages: sampleMessages.length
        };

        await renderer.render({
            chatData: mockChatData,
            outputPath: testOutputPath,
            mainUser: contacts[0],
            sealContacts: false,
            includeImages: false
        });

        if (fs.existsSync(testOutputPath)) {
            console.info(`PASSED: PDF generated (${formatFileSize(fs.statSync(testOutputPath).size)})!`);
            console.info(`Output: ${testOutputPath}`);
            console.timeEnd("Time");
            passed++;
        } else {
            console.error(`FAILED: PDF file not created`);
            failed++;
        }
    } catch (error) {
        console.error(`FAILED: ${error.message}`);
        failed++;
    }

    // Test 4: Sealed Mode
    console.log(`\nTest 4: Privacy Mode (Sealed)...`);
    try {
        console.time("Time");
        const testOutputPath = output.replaceAll("%", "test_sealed");
        const theme = loadTheme(themes.replaceAll("%", "dark"));
        const renderer = new PDFRenderer(theme);
        const contacts = [...new Set(sampleMessages.map(m => m.sender))].sort();

        const mockChatData = {
            messages: sampleMessages.map(m => ({
                ...m,
                ...detectMessageType(m.text),
                parsedDatetime: new Date()
            })),
            contacts: contacts,
            platform: "iOS",
            mediaFiles: {},
            totalMessages: sampleMessages.length
        };
        
        await renderer.render({
            chatData: mockChatData,
            outputPath: testOutputPath,
            mainUser: contacts[1],
            sealContacts: true,
            includeImages: false
        });

        if (fs.existsSync(testOutputPath)) {
            console.info(`PASSED: PDF generated (${formatFileSize(fs.statSync(testOutputPath).size)})!`);
            console.info(`Output: ${testOutputPath}`);
            console.timeEnd("Time");
            passed++;
        } else {
            console.error(`FAILED: Sealed PDF not created`);
            failed++;
        }
    } catch (error) {
        console.error(`FAILED: ${error.message}`);
        failed++;
    }

    // Summary
    console.log(`\n================================`);
    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

    if (failed === 0) {
        console.info(`All tests passed!\n`);
    } else {
        console.error(`Some tests failed. Please review the errors above.\n`);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error(`Test suite failed:`, error);
    process.exit(1);
});