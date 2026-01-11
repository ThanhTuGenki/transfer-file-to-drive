import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, BrowserContext, Page } from 'playwright';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BrowserService.name);
    private readonly PROFILE_DIR = path.join(process.cwd(), '.chrome-profile');

    private context: BrowserContext | null = null;

    async onModuleInit() {
        await this.launchBrowser();
    }

    async onModuleDestroy() {
        await this.closeBrowser();
    }

    /**
     * Check if profile exists (has valid session)
     * Check for Default/ folder and Local State (regular file, not symlink)
     */
    private async hasValidProfile(): Promise<boolean> {
        try {
            const defaultDir = path.join(this.PROFILE_DIR, 'Default');
            const localState = path.join(this.PROFILE_DIR, 'Local State');
            await fs.access(defaultDir);
            await fs.access(localState);
            // Also check for cookies file inside Default
            const cookiesFile = path.join(defaultDir, 'Cookies');
            await fs.access(cookiesFile);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Ensure profile directory exists
     */
    private async ensureProfileDir(): Promise<void> {
        try {
            await fs.access(this.PROFILE_DIR);
        } catch {
            await fs.mkdir(this.PROFILE_DIR, { recursive: true });
        }
    }

    /**
     * Clean Chrome SingletonLock and kill any existing Chrome processes using this profile
     */
    private async cleanSingletonLock(): Promise<void> {
        const lockFile = path.join(this.PROFILE_DIR, 'SingletonLock');
        try {
            await fs.unlink(lockFile);
            this.logger.log('[Profile] Cleaned SingletonLock');
        } catch {
            // Lock file doesn't exist, ignore
        }

        // Also kill any Chrome processes using this profile
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            // Kill Chrome processes with user-data-dir pointing to our profile
            const killCommand = `pkill -f "user-data-dir=${this.PROFILE_DIR}" || true`;
            await execAsync(killCommand);
            this.logger.log('[Profile] Killed existing Chrome processes using this profile');

            // Wait a bit for processes to fully terminate
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            // Ignore errors
        }
    }

    /**
     * Launch browser with persistent context
     * Called once on application startup
     */
    private async launchBrowser(): Promise<void> {
        if (this.context) {
            this.logger.warn('[Browser] Browser already running');
            return;
        }

        await this.ensureProfileDir();
        await this.cleanSingletonLock();

        const hasProfile = await this.hasValidProfile();

        this.logger.log(
            hasProfile
                ? '[Browser] Launching Chrome (Headless Mode with saved profile)...'
                : '[Browser] Launching Chrome (UI Mode for first-time login)...',
        );

        if (!hasProfile) {
            this.logger.log('\n===================================================');
            this.logger.log('⚠️  FIRST TIME SETUP: PLEASE LOG IN MANUALLY');
            this.logger.log('   Profile will be saved for future use.');
            this.logger.log('   Browser will stay open until server stops.');
            this.logger.log('===================================================\n');
        }

        // Use persistent context - saves all session data automatically
        this.context = await chromium.launchPersistentContext(this.PROFILE_DIR, {
            headless: hasProfile,
            channel: 'chrome',
            viewport: hasProfile ? undefined : { width: 1280, height: 720 },
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--start-maximized',
                '--disable-infobars',
            ],
        });

        // Hide webdriver flag
        await this.context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        this.logger.log(`[Browser] Chrome is running. Profile: ${this.PROFILE_DIR}`);

        // If no profile, wait for manual login
        if (!hasProfile) {
            await this.waitForLogin();
        }
    }

    /**
     * Wait for user to complete Google login
     */
    private async waitForLogin(): Promise<void> {
        const page = this.getPage();

        this.logger.log('\n===================================================');
        this.logger.log('⚠️  ACTION REQUIRED: PLEASE LOG IN TO GOOGLE DRIVE');
        this.logger.log('   The browser is open. Please complete login.');
        this.logger.log('   Script will auto-detect when login is complete.');
        this.logger.log('===================================================\n');

        while (true) {
            try {
                const url = page.url();
                if (!url.includes('accounts.google.com') && url.includes('drive.google.com')) {
                    await page.waitForTimeout(2000);
                    if (!page.url().includes('accounts.google.com')) {
                        break;
                    }
                }
            } catch (e) {
                // Navigation happened
            }
            await page.waitForTimeout(1000);
        }

        this.logger.log('[Browser] Login detected! Profile saved.');
    }

    /**
     * Close browser gracefully
     * Called on application shutdown
     */
    private async closeBrowser(): Promise<void> {
        if (this.context) {
            this.logger.log('[Browser] Closing Chrome...');
            await this.context.close();
            this.context = null;
            this.logger.log('[Browser] Chrome closed.');
        }
    }

    /**
     * Get the current browser context
     */
    getContext(): BrowserContext {
        if (!this.context) {
            throw new Error('[Browser] Browser not initialized. Call launchBrowser first.');
        }
        return this.context;
    }

    /**
     * Get or create a page
     * Reuses existing page if available
     */
    getPage(): Page {
        const context = this.getContext();
        const pages = context.pages();
        if (pages.length > 0) {
            return pages[0];
        }
        // Note: This returns a Promise, caller should await if using this branch
        // For simplicity, we always use newPage() method for new pages
        return pages[0]; // Will never reach here if pages is empty
    }

    /**
     * Create a new page (for operations that need separate tab)
     */
    async newPage(): Promise<Page> {
        const context = this.getContext();
        return await context.newPage();
    }

    /**
     * Check if session is still valid (not logged out)
     */
    async isSessionValid(): Promise<boolean> {
        try {
            const page = this.getPage();
            const url = page.url();
            const hasEmailInput = await page.$('input[type="email"]');
            return !url.includes('accounts.google.com') && !hasEmailInput;
        } catch {
            return false;
        }
    }

    /**
     * Navigate to URL
     */
    async navigateTo(url: string): Promise<Page> {
        const page = this.getPage();
        await page.goto(url);
        return page;
    }
}
