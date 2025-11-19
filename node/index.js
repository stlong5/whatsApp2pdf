#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const WhatsAppParser = require('./parser');
const PDFRenderer = require('./renderer');
const { loadTheme } = require('./utils');

const program = new Command();

program
    .name('whatsapp-pdf')
    .description('Convert WhatsApp chat export to themed PDF')
    .version('2.0.0')
    .argument('<input>', 'Path to WhatsApp export ZIP file')
    .option('-o, --output <path>', 'Output PDF path')
    .option('-u, --main-user <name>', 'Main user name (appears on right)')
    .option('-s, --seal', 'Hide contact names and messages (privacy mode)')
    .option('-i, --images', 'Include images at end of PDF')
    .option('-t, --theme <name>', 'Theme name (light or dark)', 'light')
    .option('--theme-path <path>', 'Custom theme JSON path')
    .action(async (input, options) => {
        try {
            // Validate input file
            if (!fs.existsSync(input)) {
                console.error(`❌ Error: File not found: ${input}`);
                process.exit(1);
            }

            // Load theme
            let theme;
            if (options.themePath) {
                theme = loadTheme(options.themePath);
                console.log(`📝 Using custom theme: ${options.themePath}`);
            } else {
                const themePath = path.join(__dirname, '..', 'themes', options.theme, `${options.theme}.json`);
                if (!fs.existsSync(themePath)) {
                    console.error(`❌ Error: Theme not found: ${options.theme}`);
                    console.log('Available themes: light, dark');
                    process.exit(1);
                }
                theme = loadTheme(themePath);
                console.log(`🎨 Using theme: ${options.theme}`);
            }

            // Parse WhatsApp export
            console.log('\n📦 Parsing WhatsApp export...');
            const parser = new WhatsAppParser(input);
            const chatData = await parser.parse();

            console.log(`✅ Found ${chatData.messages.length} messages`);
            console.log(`📱 Platform: ${chatData.platform}`);
            console.log(`👥 Participants: ${chatData.contacts.slice(0, 5).join(', ')}${chatData.contacts.length > 5 ? '...' : ''}`);

            // Determine main user
            const mainUser = options.mainUser || chatData.contacts[0];
            if (!chatData.contacts.includes(mainUser)) {
                console.warn(`⚠️  Warning: '${mainUser}' not found in contacts, using first contact`);
            }

            // Determine output path
            const outputPath = options.output ||
                `whatsapp_chat_${path.basename(input, '.zip')}_${options.theme}.pdf`;

            console.log(`\n🔨 Generating PDF: ${outputPath}`);

            // Render PDF
            const renderer = new PDFRenderer(theme);
            await renderer.render({
                chatData,
                outputPath,
                mainUser,
                sealContacts: options.seal || false,
                includeImages: options.images || false
            });

            console.log(`\n✅ PDF generated successfully!`);
            console.log(`📄 Output: ${outputPath}`);
            console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

        } catch (error) {
            console.error(`\n❌ Error: ${error.message}`);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    });

program.parse();