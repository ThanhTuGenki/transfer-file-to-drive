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
    videoDownloadUrl: string;   // Valid URL for curl download (after following redirects)
    audioDownloadUrl: string;   // Valid URL for curl download (after following redirects)
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
     * Navigate to stream URL and follow redirects to find actual video stream
     * - If <video> tag exists → Return URL (VALID)
     * - If no <video> → Check <pre> → Follow redirect
     * - If no <pre> → Reload page and retry
     * - Each attempt 5 seconds apart, max 5 attempts
     */
    private async getDownloadLinkFromStreamUrl(streamUrl: string): Promise<string> {
        const page = await this.browserService.newPage();

        let currentUrl = streamUrl;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            attempts++;
            this.logger.log(`-> [Attempt ${attempts}/${maxAttempts}] Checking: ${currentUrl.substring(0, 80)}...`);

            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 100000 });
            await page.waitForTimeout(5000);  // Wait 5 seconds for content to load

            // Priority 1: Check for <video> tag - if exists, this is VALID URL
            const videoElement = await page.$('video');
            if (videoElement) {
                // Try to get src from video element
                let videoSrc = await videoElement.evaluate((el: any) => el.src);
                if (!videoSrc) {
                    // Try to get src from <source> tag inside video
                    const sourceElement = await videoElement.$('source');
                    if (sourceElement) {
                        videoSrc = await sourceElement.evaluate((el: any) => el.src);
                    }
                }
                if (videoSrc) {
                    this.logger.log(`-> [SUCCESS] Found <video> tag with src: ${videoSrc.substring(0, 80)}...`);
                    await page.close();
                    return videoSrc;
                }
            }

            // Priority 2: Check for <pre> tag with redirect URL
            const preElement = await page.$('pre');
            if (preElement) {
                const preContentRaw = await preElement.evaluate((el: any) => el.textContent?.trim());
                if (preContentRaw) {
                    // Decode HTML entities using browser
                    const preContent = await page.evaluate((content) => {
                        const textarea = document.createElement('textarea');
                        textarea.innerHTML = content;
                        return textarea.value;
                    }, preContentRaw);

                    if (preContent.startsWith('http')) {
                        this.logger.log(`-> [REDIRECT] Found URL in <pre>, following...`);
                        this.logger.log(`-> [REDIRECT] URL: ${preContent.substring(0, 80)}...`);
                        currentUrl = preContent;
                        continue;  // Try the redirect URL
                    }
                }
            }

            // Priority 3: No <video> and no <pre> - reload same page
            this.logger.log(`-> [RETRY] No <video> or <pre> found, reloading...`);
        }

        await page.close();
        throw new Error(`Failed to find video stream after ${maxAttempts} attempts.`);
    }

    /**
     * Download file using aria2c with 16 parallel connections (much faster than curl)
     */
    private async downloadWithAria(
        url: string,
        cookies: string,
        userAgent: string,
        outputPath: string,
    ): Promise<void> {
        // Escape special characters for shell
        const escapedUrl = url.replace(/"/g, '\\"');
        const escapedCookies = cookies.replace(/'/g, "'\\''");
        const escapedUserAgent = userAgent.replace(/'/g, "'\\''");

        // aria2c requires separate directory and filename
        const outputDir = path.dirname(outputPath);
        const outputFileName = path.basename(outputPath);
        const escapedDir = outputDir.replace(/"/g, '\\"');
        const escapedFileName = outputFileName.replace(/"/g, '\\"');

        // Build aria2c command with 16 parallel connections
        // -x 16: 16 connections per server
        // -s 16: Split file into 16 pieces
        // -k 1M: Minimum chunk size 1MB
        // --continue=true: Resume partial downloads
        const ariaCommand = `aria2c -x 16 -s 16 -k 1M \
            -d "${escapedDir}" \
            -o "${escapedFileName}" \
            --header="Cookie: ${escapedCookies}" \
            --header="User-Agent: ${escapedUserAgent}" \
            --header="Referer: https://drive.google.com/" \
            --max-tries=5 \
            --retry-wait=5 \
            --timeout=600 \
            --max-file-not-found=5 \
            --continue=true \
            --auto-file-renaming=false \
            --allow-overwrite=true \
            --check-integrity=false \
            "${escapedUrl}"`;

        this.logger.log(`-> [ARIA2] Starting download to: ${outputFileName}`);
        this.logger.log(`-> [ARIA2] Using 16 parallel connections`);
        this.logger.log(`-> [ARIA2] URL length: ${url.length} chars`);

        try {
            this.logger.log(`-> [ARIA2] Executing command...`);

            const { stdout, stderr } = await execAsync(ariaCommand, {
                maxBuffer: 50 * 1024 * 1024, // 50MB buffer for aria2c verbose output
                timeout: 18000000, // 10 minutes timeout
            });

            // Log aria2c output (it shows download progress)
            if (stdout) {
                this.logger.log(`-> [ARIA2] stdout: ${stdout.substring(0, 500)}`);
            }
            if (stderr) {
                this.logger.log(`-> [ARIA2] stderr: ${stderr.substring(0, 500)}`);
            }

            // Verify file was downloaded successfully
            this.logger.log(`-> [ARIA2] Checking downloaded file...`);
            const stats = await fs.stat(outputPath);
            this.logger.log(`-> [ARIA2] File size: ${stats.size} bytes`);

            if (stats.size < 100000) {
                throw new Error(`Downloaded file too small: ${stats.size} bytes`);
            }

            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            this.logger.log(`-> Download complete: ${sizeMB} MB`);
        } catch (error) {
            this.logger.error(`-> [ARIA2] Download failed: ${error.message}`);
            // Try to check partial file
            try {
                const stats = await fs.stat(outputPath);
                this.logger.error(`-> [ARIA2] Partial file size: ${stats.size} bytes`);
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
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 100000 });
        await page.waitForTimeout(10000);

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

        // Navigate to stream URLs to find valid download URLs (follow redirects)
        this.logger.log('[4/4] Exploring stream URLs to find valid download URLs...');

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

        this.logger.log('[4/4] Downloading with aria2c (16 connections, PARALLEL)...');

        const timestamp = Date.now();
        const videoPath = path.join(this.DOWNLOADS_DIR, `video_${timestamp}.mp4`);
        const audioPath = path.join(this.DOWNLOADS_DIR, `audio_${timestamp}.mp4`);
        const finalPath = path.join(this.DOWNLOADS_DIR, `output_${timestamp}.mp4`);

        const cookieString = headers.cookie || headers.Cookie || '';
        const userAgent = headers['user-agent'] || headers['User-Agent'] || '';

        // PARALLEL DOWNLOAD - both video and audio at the same time!
        this.logger.log('-> Starting PARALLEL download of Video and Audio tracks...');
        await Promise.all([
            this.downloadWithAria(videoDownloadUrl, cookieString, userAgent, videoPath),
            this.downloadWithAria(audioDownloadUrl, cookieString, userAgent, audioPath),
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
