import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaTransferFolderRepository } from '../prisma-transfer-folder.repository';
import { PrismaTransferFileRepository } from '../prisma-transfer-file.repository';
import { CrawlerService } from '../strategies/crawler.service';
import { BrowserService } from '../strategies/browser.service';
import { TransferFileEntity } from '../../domain/entities/transfer-file.entity';
import * as path from 'path';

interface ScanFolderJobData {
    folderId: string;
    folderUrl: string;
}

@Processor('folder-queue')
export class TransferFolderProcessor extends WorkerHost {
    private readonly logger = new Logger(TransferFolderProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly folderRepo: PrismaTransferFolderRepository,
        private readonly fileRepo: PrismaTransferFileRepository,
        private readonly crawler: CrawlerService,
        private readonly browserService: BrowserService,
    ) {
        super();
    }

    async process(job: Job<ScanFolderJobData>): Promise<void> {
        const { folderId, folderUrl } = job.data;
        this.logger.log(`[Folder ${folderId}] Starting scan: ${folderUrl}`);

        try {
            // Update folder status to SCANNING
            const folder = await this.folderRepo.findById(folderId);
            if (!folder) {
                throw new Error(`Folder ${folderId} not found`);
            }
            folder.markAsScanning();
            await this.folderRepo.update(folder);

            // Scan folder for video links and extract folder name
            const result = await this.scanFolderForVideos(folderUrl);
            this.logger.log(`[Folder ${folderId}] Found ${result.videos.length} videos`);
            if (result.folderName) {
                this.logger.log(`[Folder ${folderId}] Folder name: ${result.folderName}`);
                folder.updateName(result.folderName);
                await this.folderRepo.update(folder);
            }

            // Create TransferFile entities
            const fileEntities = result.videos.map((link) =>
                TransferFileEntity.createNew({
                    folderId,
                    originalUrl: link.url,
                    name: link.name,
                }),
            );

            // Batch insert
            await this.fileRepo.createMany(fileEntities);

            // Update folder status to COMPLETED
            folder.markAsCompleted();
            await this.folderRepo.update(folder);

            this.logger.log(`[Folder ${folderId}] Scan completed successfully`);
        } catch (error) {
            this.logger.error(`[Folder ${folderId}] Scan failed: ${error.message}`);
            const folder = await this.folderRepo.findById(folderId);
            if (folder) {
                folder.markAsFailed();
                await this.folderRepo.update(folder);
            }
            throw error;
        }
    }

    /**
     * Scan Google Drive folder and extract video file links
     * Uses existing browser from BrowserService
     */
    private async scanFolderForVideos(
        folderUrl: string,
    ): Promise<{ videos: Array<{ url: string; name: string }>; folderName: string }> {
        this.logger.log(`Scanning folder: ${folderUrl}`);

        // Create a new page for scanning
        const page = await this.browserService.newPage();

        // Check if session is valid before navigating
        const isSessionValid = await this.browserService.isSessionValid();
        if (!isSessionValid) {
            await page.close();
            throw new Error('SESSION_EXPIRED: Google session expired. Please restart server and login again.');
        }

        await page.goto(folderUrl);
        await page.waitForTimeout(3000);

        // Wait for initial page load
        await page.waitForTimeout(5000);

        // Try to switch to list view (grid view might hide file names)
        try {
            await page.click('button[aria-label*="List"], button[aria-label*="list"]').catch(() => {});
            await page.waitForTimeout(1000);
        } catch (e) {
            // Ignore
        }

        // Scroll to load all items
        for (let i = 0; i < 8; i++) {
            await page.keyboard.press('End');
            await page.waitForTimeout(1500);
        }

        // Additional wait for lazy loading
        await page.waitForTimeout(3000);

        // Take screenshot for debugging
        const screenshotPath = path.join(process.cwd(), 'screenshot-debug.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        this.logger.log(`Screenshot saved to: ${screenshotPath}`);

        // Debug: Log page title and URL
        const pageTitle = await page.title();
        const currentUrl = page.url();
        this.logger.log(`Page title: ${pageTitle}, URL: ${currentUrl}`);

        // Extract folder name from page title or other elements
        let folderName = 'Transfer';
        try {
            const titleMatch = pageTitle.match(/^(.+?)\s*-\s*Google Drive/);
            if (titleMatch && titleMatch[1]) {
                folderName = titleMatch[1].trim();
            } else {
                const nameFromMeta = await page.evaluate(() => {
                    const selectors = [
                        'meta[property="og:title"]',
                        'title',
                        '[data-folder-name]',
                        'h1',
                    ];
                    for (const selector of selectors) {
                        const el = document.querySelector(selector);
                        if (el) {
                            const content = el.getAttribute('content') || el.textContent;
                            if (content && !content.includes('Google Drive')) {
                                return content.trim();
                            }
                        }
                    }
                    return null;
                });
                if (nameFromMeta) {
                    folderName = nameFromMeta;
                }
            }
            this.logger.log(`Extracted folder name: ${folderName}`);
        } catch (e) {
            this.logger.warn(`Could not extract folder name: ${e.message}`);
        }

        // Extract video file links
        const videoLinks = await page.evaluate(() => {
            const items: Array<{ url: string; name: string }> = [];
            const fileElements = document.querySelectorAll('[data-id]');

            fileElements.forEach((el) => {
                const nameEl = el.querySelector('[data-tooltip]');
                const name = nameEl?.getAttribute('data-tooltip') || '';

                const lowerName = name.toLowerCase();
                if (
                    lowerName.includes('.mp4') ||
                    lowerName.includes('.mkv') ||
                    lowerName.includes('.avi') ||
                    lowerName.includes('.mov') ||
                    lowerName.includes('.webm')
                ) {
                    const fileId = el.getAttribute('data-id');
                    if (fileId && fileId !== '_gd') {
                        const cleanName = name.replace(/\s+(Video|MKV|AVI|MOV|WEBM|MP4)$/i, '');
                        items.push({
                            url: `https://drive.google.com/file/d/${fileId}/view`,
                            name: cleanName,
                        });
                    }
                }
            });

            return items;
        });

        await page.close();

        // Validate that all files have names
        const invalidFiles = videoLinks.filter(link => !link.name || link.name.trim() === '');
        if (invalidFiles.length > 0) {
            throw new Error(`Failed to extract names for ${invalidFiles.length} file(s). Cannot proceed without valid file names.`);
        }

        return { videos: videoLinks, folderName };
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.id} completed`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`);
    }
}
