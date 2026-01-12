import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { BrowserService } from './browser.service';

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
    videoDownloadUrl: string;
    audioDownloadUrl: string;
    headers: BrowserHeaders;
}

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);
    private readonly DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');

    constructor(private readonly browserService: BrowserService) { }

    async ensureDownloadsDir(): Promise<void> {
        try {
            await fs.access(this.DOWNLOADS_DIR);
        } catch {
            await fs.mkdir(this.DOWNLOADS_DIR, { recursive: true });
        }
    }

    /**
     * Navigate to stream URL page and look for download button
     * This is for DEBUGGING - to see what the page looks like
     */
    private async getDownloadLinkFromStreamUrl(streamUrl: string): Promise<string> {
        const page = await this.browserService.newPage();

        try {
            this.logger.log(`-> [DEBUG] Navigating to stream URL...`);
            this.logger.log(`-> [DEBUG] URL: ${streamUrl.substring(0, 100)}...`);

            // Navigate to see what happens
            await page.goto(streamUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Take screenshot for debugging
            const screenshotPath = path.join(process.cwd(), 'debug-screenshot.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            this.logger.log(`-> [DEBUG] Screenshot saved to: ${screenshotPath}`);

            // Wait to see what happens
            this.logger.log(`-> [DEBUG] Waiting 5 seconds to observe page...`);
            await page.waitForTimeout(5000);

            // Log page title and URL
            const title = await page.title();
            const currentUrl = page.url();
            this.logger.log(`-> [DEBUG] Page title: ${title}`);
            this.logger.log(`-> [DEBUG] Current URL: ${currentUrl.substring(0, 100)}...`);

            // Try to find download link
            const downloadSelectors = [
                'a[href*="export=download"]',
                'a[aria-label*="Download"]',
                '[data-tooltip="Download"]',
                'a[href*="uc?export=download"]',
            ];

            for (const selector of downloadSelectors) {
                const element = await page.$(selector);
                if (element) {
                    const href = await element.evaluate((el: any) => el.href);
                    this.logger.log(`-> [DEBUG] Found link with selector "${selector}": ${href?.substring(0, 80)}...`);
                }
            }

            // Get all links on page
            const allLinks = await page.$$eval('a', (anchors) =>
                anchors.map((a: any) => ({ href: a.href, text: a.textContent?.trim() }))
            );
            this.logger.log(`-> [DEBUG] Total links found: ${allLinks.length}`);

            await page.close();

            // For now, return original stream URL since we're just debugging
            return streamUrl;
        } catch (error) {
            await page.close();
            this.logger.error(`-> [DEBUG] Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Download file using curl (faster than fetch for large files)
     */
    private async downloadWithCurl(
        url: string,
        cookies: string,
        userAgent: string,
        outputPath: string,
    ): Promise<void> {
        // Escape special characters in URL and paths for shell
        const escapedUrl = url.replace(/"/g, '\\"');
        const escapedOutputPath = outputPath.replace(/"/g, '\\"');
        const escapedCookies = cookies.replace(/'/g, "'\\''");

        // Build curl command with progress and timeout
        const curlCommand = `curl -L -C - "${escapedUrl}" \
            -H "Cookie: ${escapedCookies}" \
            -H "User-Agent: ${userAgent}" \
            -H "Referer: https://drive.google.com/" \
            -o "${escapedOutputPath}" \
            --max-time 600 \
            --progress-bar \
            --verbose`;

        this.logger.log(`-> [CURL] Starting download to: ${path.basename(outputPath)}`);
        this.logger.log(`-> [CURL] URL length: ${url.length} chars`);

        try {
            this.logger.log(`-> [CURL] Executing command...`);

            const { stdout, stderr } = await execAsync(curlCommand, {
                maxBuffer: 30 * 1024 * 1024, // 10MB buffer
                timeout: 18000000, // 10 minutes timeout
            });

            // Log any output from curl
            if (stdout) {
                this.logger.log(`-> [CURL] stdout: ${stdout.substring(0, 200)}`);
            }
            if (stderr) {
                this.logger.log(`-> [CURL] stderr: ${stderr.substring(0, 500)}`);
            }

            // Verify file was downloaded successfully
            this.logger.log(`-> [CURL] Checking downloaded file...`);
            const stats = await fs.stat(outputPath);
            this.logger.log(`-> [CURL] File size: ${stats.size} bytes`);

            if (stats.size < 100000) {
                throw new Error(`Downloaded file too small: ${stats.size} bytes`);
            }

            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            this.logger.log(`-> Download complete: ${sizeMB} MB`);
        } catch (error) {
            this.logger.error(`-> [CURL] Download failed: ${error.message}`);
            // Try to check partial file
            try {
                const stats = await fs.stat(outputPath);
                this.logger.error(`-> [CURL] Partial file size: ${stats.size} bytes`);
            } catch {
                // No partial file
            }
            throw error;
        }
    }

    /**
     * Capture video/audio streams from Google Drive video page
     * Uses existing browser from BrowserService
     */
    private async captureStreams(fileUrl: string): Promise<StreamResult> {
        const context = this.browserService.getContext();
        const page = await this.browserService.newPage();

        let videoStreamUrl: string | null = null;
        let audioStreamUrl: string | null = null;
        let headers: BrowserHeaders = {};

        // Listen for stream requests
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

        this.logger.log(`[1/4] Navigating to ${fileUrl}`);
        await page.goto(fileUrl);
        await page.waitForTimeout(2000);

        // Check if session expired
        const currentUrl = page.url();
        const isLoginPage = currentUrl.includes('accounts.google.com') || (await page.$('input[type="email"]'));

        if (isLoginPage) {
            await page.close();
            throw new Error('SESSION_EXPIRED: Google session expired. Please restart server and login again.');
        }

        // Auto-play
        this.logger.log('[2/4] Attempting to auto-play...');
        try {
            const playSelectors = [
                'div[role="button"][aria-label="Play"]',
                'video',
                '#drive-viewer-video-player-object-0',
            ];
            for (const selector of playSelectors) {
                if (await page.$(selector)) {
                    await page.click(selector, { force: true }).catch(() => { });
                    await page.waitForTimeout(2000);
                }
            }
        } catch (e) {
            this.logger.error(`Auto-play error: ${e.message}`);
            throw e;
        }

        this.logger.log('[3/4] Waiting for streams... (Timeout: 1 min)');
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
            await page.close();
            throw new Error('TIMEOUT: Failed to capture streams.');
        }

        // Always refine headers from context to ensure complete cookies
        this.logger.log('[Info] Refining headers from context...');
        const cookies = await context.cookies();
        const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
        const ua = await page.evaluate(() => navigator.userAgent);
        headers = {
            cookie: cookieHeader,
            'user-agent': ua,
            referer: 'https://drive.google.com/',
        };

        await page.close();

        // DEBUG: Navigate to stream URLs to see what's there
        this.logger.log('[4/4] DEBUG: Exploring stream URLs...');

        this.logger.log('-> Exploring Video stream URL...');
        const videoDownloadUrl = await this.getDownloadLinkFromStreamUrl(videoStreamUrl);

        this.logger.log('-> Exploring Audio stream URL...');
        const audioDownloadUrl = await this.getDownloadLinkFromStreamUrl(audioStreamUrl);

        return { videoStreamUrl, audioStreamUrl, videoDownloadUrl, audioDownloadUrl, headers };
    }

    /**
     * Download and process a single video file
     */
    async downloadAndProcess(fileUrl: string): Promise<string> {
        await this.ensureDownloadsDir();

        this.logger.log('[0/4] Starting download process...');

        const { videoDownloadUrl, audioDownloadUrl, headers } = await this.captureStreams(fileUrl);

        this.logger.log('[4/4] Downloading with curl (PARALLEL)...');

        const timestamp = Date.now();
        const videoPath = path.join(this.DOWNLOADS_DIR, `video_${timestamp}.mp4`);
        const audioPath = path.join(this.DOWNLOADS_DIR, `audio_${timestamp}.mp4`);
        const finalPath = path.join(this.DOWNLOADS_DIR, `output_${timestamp}.mp4`);

        const cookieString = headers.cookie || headers.Cookie || '';
        const userAgent = headers['user-agent'] || headers['User-Agent'] || '';

        // PARALLEL DOWNLOAD - both video and audio at the same time!
        this.logger.log('-> Starting PARALLEL download of Video and Audio tracks...');
        await Promise.all([
            this.downloadWithCurl(videoDownloadUrl, cookieString, userAgent, videoPath),
            this.downloadWithCurl(audioDownloadUrl, cookieString, userAgent, audioPath),
        ]);

        this.logger.log('[Merging] Merging files with FFmpeg...');
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
