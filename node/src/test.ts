import * as fs from "fs";
import * as path from "path";
import {fileURLToPath} from "url";
import {PDFRenderer} from "./renderer.js";
import {loadTheme, detectMessageType, formatFileSize} from "./utils.js"
import {Theme, ChatData, Message} from "./types/index.js";

const NODE_DIR = path.dirname(fileURLToPath(import.meta.url));
const output: string = path.join(NODE_DIR, "../assets/output/%.pdf");
const themes: string = path.join(NODE_DIR, "../assets/themes/%/%.json");

// Test data
const sampleMessages: { datetime: string, sender: string, text: string }[] = [
    {datetime: "12/10/2025, 14:30", sender: "Alice", text: "Hey! How are you?"},
    {datetime: "12/10/2025, 14:31", sender: "Bob", text: "Im doing great! Just finished work 😊"},
    {datetime: "12/10/2025, 14:32", sender: "Alice", text: "That's awesome!\nI was thinking we could meet up this weekend?"},
    {datetime: "12/10/2025, 14:35", sender: "Bob", text: "Sure! Where do you want to go?"},
    {datetime: "12/10/2025, 14:36", sender: "Alice", text: "How about that new cafe downtown? I heard they have amazing coffee ☕"},
];

async function runTests() {
    console.log(`╔══════════════════════════════╗`);
    console.log(`║ WhatsApp to PDF - Test Suite ║`);
    console.log(`╚══════════════════════════════╝`);

    let passed: number = 0;
    let failed: number = 0;

    // Test 1: Theme Loading
    console.log(`\nTest 1: Loading Themes...`);
    try {
        const lightTheme: Theme = loadTheme(themes.replace(/%/g, "light"));
        const darkTheme: Theme = loadTheme(themes.replace(/%/g, "dark"));

        if (lightTheme && darkTheme) {
            console.info(`PASSED: Themes loaded successfully`);
            passed++;
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(`FAILED: ${e.message}`);
        } else {
            console.error(`FAILED: ${String(e)}`);
        }
        failed++;
    }

    // Test 2: Parser (with mock data)
    console.log(`\nTest 2: Message Parsing...`);
    try {
        // Create a mock chat text
        const mockChatText: string = sampleMessages.map(m => `[${m.datetime}] ${m.sender}: ${m.text}`).join("\n");

        // Test the regex pattern
        const lines: string[] = mockChatText.split("\n");
        const pattern: RegExp = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s*[-:]?\s*([^:]+?):\s*(.+)$/;

        let parsedCount: number = 0;
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
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(`FAILED: ${e.message}`);
        } else {
            console.error(`FAILED: ${String(e)}`);
        }
        failed++;
    }

    // Test 3: PDF Generation (with mock data)
    console.log(`\nTest 3: PDF Generation...`);
    try {
        console.time("Time");
        const testOutputPath: string = output.replace(/%/g, "test");
        const theme: Theme = loadTheme(themes.replace(/%/g, "light"));
        const renderer: PDFRenderer = new PDFRenderer(theme);
        const contacts: string[] = [...new Set(sampleMessages.map(m => m.sender))].sort();

        const mockChatData: ChatData = {
            messages: sampleMessages.map(m => ({
                ...m,
                ...detectMessageType(m.text),
                parsedDatetime: new Date()
            }) as Message),
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
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(`FAILED: ${e.message}`);
        } else {
            console.error(`FAILED: ${String(e)}`);
        }
        failed++;
    }

    // Test 4: Sealed Mode
    console.log(`\nTest 4: Privacy Mode (Sealed)...`);
    try {
        console.time("Time");
        const testOutputPath: string = output.replace(/%/g, "test_sealed");
        const theme: Theme = loadTheme(themes.replace(/%/g, "dark"));
        const renderer = new PDFRenderer(theme);
        const contacts: string[] = [...new Set(sampleMessages.map(m => m.sender))].sort();

        const mockChatData: ChatData = {
            messages: sampleMessages.map(m => ({
                ...m,
                ...detectMessageType(m.text),
                parsedDatetime: new Date()
            }) as Message),
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
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(`FAILED: ${e.message}`);
        } else {
            console.error(`FAILED: ${String(e)}`);
        }
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