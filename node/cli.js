#!/usr/bin/env node

const {Command} = require("commander");
const fs = require("fs");
const path = require("path");
const WhatsApp2PDF = require("./index");

const program = new Command();

program
    .name("whatsapp-pdf")
    .description("Convert WhatsApp chat export to PDF File")
    .version("1.0.0")
    .option("--list-themes", "List available built-in themes")
    .argument("[input]", "Path to WhatsApp exported ZIP file")
    .option("-o, --output <path>", "Output PDF file path")
    .option("-u, --main-user <name>", "Main user name (appears on right)")
    .option("-p, --privacy", "Hide contact names (privacy mode)", true)
    .option("-i, --images", "Include images at end of PDF", true)
    .option("-t, --theme <name>", "Theme name (light or dark)", "light")
    .option("--theme-path <path>", "Custom theme JSON path")
    .option("-s, --start <date>", "Search: start date YYYY-MM-DD")
    .option("-e, --end <date>", "Search: end date YYYY-MM-DD")
    .option("-k, --keyword <word>", "Search: messages containing keyword")
    .option("-v, --verbose", "Enable verbose mode", true)
    .action(async (input, options) => {
        try {
            // Handle --list-themes option
            if (options.listThemes) {
                console.log("\n📋 Available built-in themes:");
                WhatsApp2PDF.listThemes().forEach(theme => {
                    console.log(`   ✅  ${theme}`);
                });

                console.log("💡 Use --theme-path for custom themes\n");
                process.exit(0);
            }

            if (!input) {
                console.error("❌ Error: <input> missing\n");
                process.exit(1);
            }

            console.time("⏱ Time");
            console.log("📦 Reading ZIP:", input);

            // Validate input file (resolve from current working directory)
            const inputPath = path.resolve(process.cwd(), input);
            if (!fs.existsSync(inputPath)) {
                console.error(`❌ Error: File not found: ${inputPath}`);
                process.exit(1);
            }

            // Parse WhatsApp export
            console.log("\n📄 Parsing WhatsApp export...");
            let parser = new WhatsApp2PDF(inputPath);

            // Build parser instance
            if (options.themePath) {
                parser.theme(options.themePath);
            } else if (options.theme) {
                parser.theme(options.theme);
            }
            if (options.output) parser.output(options.output);
            if (options.mainUser) parser.mainUser(options.mainUser);
            if (options.privacy) parser.seal(true);
            if (options.start || options.end) parser.searchDate(options.start, options.end);
            if (options.keyword) parser.searchKeyword(options.keyword);
            if (options.images) parser.images(true);
            if (options.verbose) parser.verbose(true);

            // Execute conversion
            const result = await parser.convert();

            console.log(`\n✅ PASSED: PDF generated (${result.fileSizeFormatted})!`);
            console.log(`📄 Output: ${result.outputPath}`);
            console.timeEnd("⏱ Time");
        } catch (error) {
            console.error(`\n❌ Error: ${error.message}`);
            process.exit(1);
        }
    });

// Show help when no arguments are provided
if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
}

program.parse();