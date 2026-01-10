const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FOLDER_URL = "https://drive.google.com/drive/folders/1omoeYlHdcW1qjpYGsxweur3h83Rmz8jV";
const AUTH_FILE = path.join(__dirname, "..", "auth.json");

(async () => {
    console.log("🚀 Starting Google Drive login...");

    const browser = await chromium.launch({
        headless: false,
        channel: "chrome",
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--start-maximized'],
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });

    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();
    await page.goto(FOLDER_URL);

    console.log("\n===================================================");
    console.log("👆 PLEASE LOG IN TO GOOGLE IN THE BROWSER");
    console.log("   Script will automatically save session when ready");
    console.log("   Press Ctrl+C to cancel");
    console.log("===================================================\n");

    // Wait for folder to load (not on login page)
    while (true) {
        try {
            await page.waitForTimeout(1000);
            const url = page.url();

            // Check if we're on the folder page and NOT on login page
            if (url.includes('drive.google.com') && !url.includes('accounts.google.com')) {
                // Check if we can see folder content
                const hasDataId = await page.$('[data-id]').catch(() => null);
                if (hasDataId) {
                    console.log("\n✅ Folder loaded! Saving session...");
                    break;
                }
            }

            // Safe logging
            process.stdout.write('.');
        } catch (e) {
            // Ignore errors during navigation
        }
    }

    // Save session
    await context.storageState({ path: AUTH_FILE });
    console.log(`\n✅ Session saved to: ${AUTH_FILE}`);

    await browser.close();
    process.exit(0);
})();
