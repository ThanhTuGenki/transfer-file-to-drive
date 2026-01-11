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
    headers: BrowserHeaders;
}

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);
    private readonly DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');

    constructor(private readonly browserService: BrowserService) {}

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
                    await page.click(selector, { force: true }).catch(() => {});
                    await page.waitForTimeout(500);
                }
            }
        } catch (e) {
            // Ignore
        }

        this.logger.log('[3/4] Waiting for streams... (Timeout: 1 min)');
        let checks = 0;
        while ((!videoStreamUrl || !audioStreamUrl) && checks < 60) {
            await page.waitForTimeout(1000);
            checks++;
            if (checks % 5 === 0 && !videoStreamUrl) {
                await page.mouse.click(640, 360).catch(() => {});
            }
            if (checks % 10 === 0) process.stdout.write('.');
        }
        console.log('\n');

        if (!videoStreamUrl || !audioStreamUrl) {
            await page.close();
            throw new Error('TIMEOUT: Failed to capture streams.');
        }

        // Refine headers if needed
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

        await page.close();

        return { videoStreamUrl, audioStreamUrl, headers };
    }

    /**
     * Download and process a single video file
     */
    async downloadAndProcess(fileUrl: string): Promise<string> {
        await this.ensureDownloadsDir();

        this.logger.log('[0/4] Starting download process...');

        const { videoStreamUrl, audioStreamUrl, headers } = await this.captureStreams(fileUrl);

        this.logger.log('[4/4] Downloading streams (using Curl)...');

        const timestamp = Date.now();
        const videoPath = path.join(this.DOWNLOADS_DIR, `video_${timestamp}.mp4`);
        const audioPath = path.join(this.DOWNLOADS_DIR, `audio_${timestamp}.mp4`);
        const finalPath = path.join(this.DOWNLOADS_DIR, `output_${timestamp}.mp4`);

        this.logger.log('-> Downloading Video Track...');
        await this.downloadWithCurl(videoStreamUrl, headers, videoPath);

        this.logger.log('-> Downloading Audio Track...');
        await this.downloadWithCurl(audioStreamUrl, headers, audioPath);

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
