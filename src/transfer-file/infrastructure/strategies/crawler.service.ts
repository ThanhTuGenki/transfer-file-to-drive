import { Injectable, Logger } from '@nestjs/common';
import { promises as fs, createWriteStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { BrowserService } from './browser.service';
import { Readable } from 'stream';

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
     * Download file using fetch with streaming (fast pipe method)
     */
    private async downloadWithFetch(
        url: string,
        headers: BrowserHeaders,
        outputPath: string,
    ): Promise<void> {
        const cookieString = headers['cookie'] || headers['Cookie'];
        const userAgent = headers['user-agent'] || headers['User-Agent'];
        const referer = headers['referer'] || headers['Referer'];

        const fetchHeaders: Record<string, string> = {
            // Google video streams require Range header
            'range': 'bytes=0-',
            'accept-encoding': 'identity',
        };
        if (cookieString) fetchHeaders['cookie'] = cookieString;
        if (userAgent) fetchHeaders['user-agent'] = userAgent;
        if (referer) fetchHeaders['referer'] = referer;

        try {
            const response = await fetch(url, {
                headers: fetchHeaders,
                redirect: 'manual',  // Handle redirects manually to keep Range header
            });

            // Handle redirect manually
            if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
                const redirectUrl = response.headers.get('location');
                if (redirectUrl) {
                    this.logger.log(`[Debug] Redirecting to: ${redirectUrl.substring(0, 100)}...`);
                    const redirectResponse = await fetch(redirectUrl, {
                        headers: fetchHeaders,
                        redirect: 'manual',
                    });

                    this.logger.log(`[Debug] Final Status: ${redirectResponse.status}, Type: ${redirectResponse.headers.get('content-type')}`);

                    if (!redirectResponse.ok) {
                        throw new Error(`HTTP ${redirectResponse.status}: ${redirectResponse.statusText}`);
                    }

                    await this.pipeToFile(redirectResponse.body!, outputPath, redirectResponse.headers.get('content-length'));
                    return;
                }
            }

            this.logger.log(`[Debug] Status: ${response.status}, Type: ${response.headers.get('content-type')}, Length: ${response.headers.get('content-length')}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if response is text (might be redirect URL in body)
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/plain')) {
                const stream = response.body as any;
                const reader = stream.getReader();
                const { value } = await reader.read();

                if (value) {
                    const text = Buffer.from(value).toString('utf8').trim();
                    if (text.startsWith('https://') || text.startsWith('http://')) {
                        this.logger.log(`[Debug] Got redirect URL in body, fetching: ${text.substring(0, 80)}...`);
                        const redirectResponse = await fetch(text, {
                            headers: fetchHeaders,
                            redirect: 'manual',
                        });

                        this.logger.log(`[Debug] Final Status: ${redirectResponse.status}, Type: ${redirectResponse.headers.get('content-type')}`);

                        if (!redirectResponse.ok) {
                            throw new Error(`HTTP ${redirectResponse.status}: ${redirectResponse.statusText}`);
                        }

                        await this.pipeToFile(redirectResponse.body!, outputPath, redirectResponse.headers.get('content-length'));
                        return;
                    }
                }
            }

            await this.pipeToFile(response.body!, outputPath, response.headers.get('content-length'));
        } catch (error) {
            this.logger.error(`Fetch error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Pipe fetch response body to file using Node.js streams (fast)
     */
    private async pipeToFile(body: ReadableStream, outputPath: string, contentLength: string | null): Promise<void> {
        const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

        // Convert Web Stream to Node.js Readable
        const nodeStream = Readable.fromWeb(body as any);
        const writeStream = createWriteStream(outputPath);

        return new Promise<void>((resolve, reject) => {
            let downloadedBytes = 0;
            let lastLoggedPercent = -1;

            nodeStream.on('data', (chunk) => {
                downloadedBytes += chunk.length;

                // Log progress every 10%
                if (totalBytes) {
                    const percent = Math.floor((downloadedBytes / totalBytes) * 100);
                    if (percent > lastLoggedPercent && percent % 10 === 0) {
                        const mb = (downloadedBytes / 1024 / 1024).toFixed(2);
                        const totalMb = (totalBytes / 1024 / 1024).toFixed(2);
                        this.logger.log(`[Download] ${percent}% (${mb}/${totalMb} MB)`);
                        lastLoggedPercent = percent;
                    }
                }
            });

            nodeStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', async () => {
                const stats = await fs.stat(outputPath);
                const size = stats.size;

                if (size < 100000) {
                    reject(new Error(`File too small: ${size} bytes. Likely an error page.`));
                } else {
                    resolve();
                }
            });

            nodeStream.pipe(writeStream);
        });
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

        return { videoStreamUrl, audioStreamUrl, headers };
    }

    /**
     * Download and process a single video file
     */
    async downloadAndProcess(fileUrl: string): Promise<string> {
        await this.ensureDownloadsDir();

        this.logger.log('[0/4] Starting download process...');

        const { videoStreamUrl, audioStreamUrl, headers } = await this.captureStreams(fileUrl);

        this.logger.log('[4/4] Downloading streams (using Fetch)...');

        const timestamp = Date.now();
        const videoPath = path.join(this.DOWNLOADS_DIR, `video_${timestamp}.mp4`);
        const audioPath = path.join(this.DOWNLOADS_DIR, `audio_${timestamp}.mp4`);
        const finalPath = path.join(this.DOWNLOADS_DIR, `output_${timestamp}.mp4`);

        this.logger.log('-> Downloading Video Track...');
        await this.downloadWithFetch(videoStreamUrl, headers, videoPath);

        this.logger.log('-> Downloading Audio Track...');
        await this.downloadWithFetch(audioStreamUrl, headers, audioPath);

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
