import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

interface BrowserHeaders {
    cookie?: string;
    Cookie?: string;
    'user-agent'?: string;
    'User-Agent'?: string;
    referer?: string;
    Referer?: string;
}

interface StreamResult {
    videoStreamUrl: string;
    audioStreamUrl: string;
    headers: BrowserHeaders;
}

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);
    private readonly AUTH_FILE = path.join(process.cwd(), 'auth.json');
    private readonly DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');

    async ensureDownloadsDir(): Promise<void> {
        try {
            await fs.access(this.DOWNLOADS_DIR);
        } catch {
            await fs.mkdir(this.DOWNLOADS_DIR, { recursive: true });
        }
    }

    /**
     * Download file using curl (robust for large files)
     */
    private async downloadWithCurl(
        url: string,
        headers: BrowserHeaders,
        outputPath: string,
    ): Promise<void> {
        this.logger.log(`[Curl] Starting download to: ${outputPath}`);

        const cookieString = headers['cookie'] || headers['Cookie'];
        const userAgent = headers['user-agent'] || headers['User-Agent'];
        const referer = headers['referer'] || headers['Referer'];

        const command = `curl -L -k -b "${cookieString}" -A "${userAgent}" -e "${referer}" -o "${outputPath}" "${url}"`;

        try {
            await execAsync(command, { maxBuffer: 1024 * 1024 * 10 });

            const stats = await fs.stat(outputPath);
            const size = stats.size;

            this.logger.log(
                `[Curl] Download finished. Size: ${(size / 1024 / 1024).toFixed(2)} MB`,
            );

            if (size < 100000) {
                throw new Error(
                    `File too small: ${size} bytes. Likely an error page.`,
                );
            }
        } catch (error) {
            this.logger.error(`Curl error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Launch browser and capture video/audio streams
     */
    private async runBrowser(
        url: string,
        isHeadless: boolean = true,
    ): Promise<StreamResult> {
        this.logger.log(
            isHeadless
                ? '[1/6] Launching browser (Headless Mode)...'
                : '[1/6] Launching browser (UI Mode for Login)...',
        );

        let storageState = null;
        try {
            const authData = await fs.readFile(this.AUTH_FILE, 'utf8');
            storageState = JSON.parse(authData);
            this.logger.log('[Auth] Session loaded.');
        } catch (e) {
            // No session file or invalid JSON
        }

        const browser = await chromium.launch({
            headless: isHeadless,
            channel: 'chrome',
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--start-maximized',
                '--disable-infobars',
            ],
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            storageState: storageState || undefined,
            userAgent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        });

        const page = await context.newPage();

        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        let videoStreamUrl: string | null = null;
        let audioStreamUrl: string | null = null;
        let headers: BrowserHeaders = {};

        page.on('request', (request) => {
            const requestUrl = request.url();
            if (requestUrl.includes('videoplayback') && requestUrl.includes('clen=')) {
                const fullUrl = new URL(requestUrl);
                fullUrl.searchParams.delete('range');
                fullUrl.searchParams.delete('rbuf');
                fullUrl.searchParams.delete('ump');
                fullUrl.searchParams.delete('srfvp');

                if (requestUrl.includes('mime=video') && !videoStreamUrl) {
                    this.logger.log('-> Detected Video Stream!');
                    videoStreamUrl = fullUrl.toString();
                    headers = request.headers();
                } else if (requestUrl.includes('mime=audio') && !audioStreamUrl) {
                    this.logger.log('-> Detected Audio Stream!');
                    audioStreamUrl = fullUrl.toString();
                }
            }
        });

        this.logger.log(`[2/6] Navigating to ${url}`);
        await page.goto(url);
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const isLoginPage =
            currentUrl.includes('accounts.google.com') ||
            (await page.$('input[type="email"]'));

        if (isHeadless && isLoginPage) {
            this.logger.warn('⚠️  Session Expired or Missing. Switching to UI Mode...');
            await browser.close();
            throw new Error('SESSION_EXPIRED');
        }

        if (!isHeadless) {
            this.logger.log('\n===================================================');
            this.logger.log('⚠️  ACTION REQUIRED: PLEASE LOG IN MANUALLY');
            this.logger.log('   The script will wait until the video page loads.');
            this.logger.log('===================================================\n');

            while (true) {
                try {
                    if (
                        (await page.$('video')) ||
                        (await page.$('#drive-viewer-video-player-object-0'))
                    ) {
                        break;
                    }
                    const u = page.url();
                    if (
                        !u.includes('accounts.google.com') &&
                        u.includes('drive.google.com')
                    ) {
                        if (await page.$('div[role="button"][aria-label="Play"]'))
                            break;
                    }
                } catch (e) {
                    // Navigation happened, continue waiting
                }
                await page.waitForTimeout(1000);
            }

            this.logger.log('[Auth] Login detected! Saving session...');
            await context.storageState({ path: this.AUTH_FILE });
        }

        // Auto-play
        this.logger.log('[Auto-Play] Attempting to auto-play...');
        try {
            const playSelectors = [
                'div[role="button"][aria-label="Play"]',
                'video',
                '#drive-viewer-video-player-object-0',
            ];
            for (const selector of playSelectors) {
                if (await page.$(selector)) {
                    await page.click(selector, { force: true }).catch(() => { });
                    await page.waitForTimeout(500);
                }
            }
        } catch (e) {
            // Ignore
        }

        this.logger.log('[3/6] Waiting for streams... (Timeout: 1 min)');
        let checks = 0;
        while ((!videoStreamUrl || !audioStreamUrl) && checks < 60) {
            await page.waitForTimeout(1000);
            checks++;
            if (checks % 5 === 0 && !videoStreamUrl) {
                await page.mouse.click(640, 360).catch(() => { });
            }
            if (checks % 10 === 0) process.stdout.write('.');
        }
        console.log('\n');

        if (!videoStreamUrl || !audioStreamUrl) {
            await browser.close();
            throw new Error('TIMEOUT: Failed to capture streams.');
        }

        if (!headers['cookie'] && !headers['Cookie']) {
            this.logger.log('[Info] Refining headers from context...');
            const cookies = await context.cookies();
            const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
            const ua = await page.evaluate(() => navigator.userAgent);
            headers = {
                cookie: cookieHeader,
                'user-agent': ua,
                referer: 'https://drive.google.com/',
            };
        }

        await context.storageState({ path: this.AUTH_FILE });
        await browser.close();

        return { videoStreamUrl, audioStreamUrl, headers };
    }

    /**
     * Download and process a single video file
     */
    async downloadAndProcess(fileUrl: string): Promise<string> {
        await this.ensureDownloadsDir();

        let result: StreamResult;
        try {
            result = await this.runBrowser(fileUrl, true);
        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') {
                this.logger.log('\n[System] Restarting in UI Mode...');
                result = await this.runBrowser(fileUrl, false);
            } else {
                throw error;
            }
        }

        const { videoStreamUrl, audioStreamUrl, headers } = result;

        this.logger.log('[4/6] Downloading streams (using Curl)...');

        const timestamp = Date.now();
        const videoPath = path.join(this.DOWNLOADS_DIR, `video_${timestamp}.mp4`);
        const audioPath = path.join(this.DOWNLOADS_DIR, `audio_${timestamp}.mp4`);
        const finalPath = path.join(this.DOWNLOADS_DIR, `output_${timestamp}.mp4`);

        this.logger.log('-> Downloading Video Track...');
        await this.downloadWithCurl(videoStreamUrl, headers, videoPath);

        this.logger.log('-> Downloading Audio Track...');
        await this.downloadWithCurl(audioStreamUrl, headers, audioPath);

        this.logger.log('[6/6] Merging files with FFmpeg...');
        const ffmpegCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac "${finalPath}" -y`;

        await execAsync(ffmpegCommand);

        this.logger.log('\n==========================================');
        this.logger.log(' SUCCESS! Download Complete.');
        this.logger.log(` File Location: ${finalPath}`);
        this.logger.log('==========================================\n');

        // Cleanup temp files
        try {
            await fs.unlink(videoPath);
            await fs.unlink(audioPath);
        } catch (e) {
            // Ignore cleanup errors
        }

        return finalPath;
    }
}
