import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaTransferFolderRepository } from '../prisma-transfer-folder.repository';
import { PrismaTransferFileRepository } from '../prisma-transfer-file.repository';
import { CrawlerService } from '../strategies/crawler.service';
import { TransferFileEntity } from '../../domain/entities/transfer-file.entity';
import { chromium } from 'playwright';
import * as fs from 'fs';
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
     */
    private async scanFolderForVideos(
        folderUrl: string,
    ): Promise<{ videos: Array<{ url: string; name: string }>; folderName: string }> {
        this.logger.log(`Scanning folder: ${folderUrl}`);

        // Load auth state for Google login
        const authFile = path.join(process.cwd(), 'auth.json');
        let storageState = null;
        if (fs.existsSync(authFile)) {
            try {
                storageState = JSON.parse(fs.readFileSync(authFile, 'utf8'));
                this.logger.log('Session loaded from auth.json');
            } catch (e) {
                this.logger.warn('Failed to load auth.json, continuing without auth');
            }
        }

        const browser = await chromium.launch({
            headless: true,
            channel: 'chrome',
            args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            storageState: storageState || undefined,
            userAgent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        });

        // Hide webdriver flag
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        const page = await context.newPage();
        await page.goto(folderUrl);
        await page.waitForTimeout(3000);

        // Check if redirected to login page (session expired)
        const url = page.url();
        if (url.includes('accounts.google.com') || await page.$('input[type="email"]')) {
            this.logger.error('⚠️  Session expired! Please refresh auth.json by logging in again.');
            await browser.close();
            throw new Error('SESSION_EXPIRED: Google session expired. Please update auth.json');
        }

        // Wait for initial page load
        await page.waitForTimeout(5000);

        // Try to switch to list view (grid view might hide file names)
        try {
            // Look for view toggle button
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
            // Try to get folder name from page title (format: "FolderName - Google Drive")
            const titleMatch = pageTitle.match(/^(.+?)\s*-\s*Google Drive/);
            if (titleMatch && titleMatch[1]) {
                folderName = titleMatch[1].trim();
            } else {
                // Try to get from meta tag or heading
                const nameFromMeta = await page.evaluate(() => {
                    // Try various selectors for folder name
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

        // Debug: Count elements with data-id
        const elementCount = await page.evaluate(() => {
            return document.querySelectorAll('[data-id]').length;
        });
        this.logger.log(`Found ${elementCount} elements with [data-id]`);

        // Debug: Get all file names found
        const allFileNames = await page.evaluate(() => {
            const names: string[] = [];
            document.querySelectorAll('[data-id]').forEach((el) => {
                const nameEl = el.querySelector('[data-tooltip]');
                const name = nameEl?.getAttribute('data-tooltip') || '';
                if (name) names.push(name);
            });
            return names;
        });
        this.logger.log(`All files found: ${JSON.stringify(allFileNames)}`);

        // Debug: Check actual HTML structure of first element
        const firstElementHTML = await page.evaluate(() => {
            const el = document.querySelector('[data-id]');
            if (!el) return 'No element found';
            return {
                outerHTML: el.outerHTML.substring(0, 500),
                attributes: Array.from(el.attributes).map(a => `${a.name}=${a.value}`),
                textContent: el.textContent?.substring(0, 100),
                childrenHTML: Array.from(el.children).slice(0, 3).map(c => ({
                    tag: c.tagName,
                    className: c.className,
                    attributes: Array.from(c.attributes).map(a => `${a.name}=${a.value}`).slice(0, 5)
                }))
            };
        });
        this.logger.log(`First element structure: ${JSON.stringify(firstElementHTML)}`);

        // Debug: Find elements with role="listitem" or aria-label (common for Drive items)
        const listItemInfo = await page.evaluate(() => {
            const listItems = document.querySelectorAll('[role="listitem"]');
            const ariaItems = document.querySelectorAll('[aria-label]');
            return {
                listItemCount: listItems.length,
                ariaLabelCount: ariaItems.length,
                firstThreeAriaLabels: Array.from(ariaItems).slice(0, 5).map(el => ({
                    label: el.getAttribute('aria-label'),
                    tag: el.tagName,
                    dataId: el.getAttribute('data-id')
                }))
            };
        });
        this.logger.log(`List item info: ${JSON.stringify(listItemInfo)}`);

        // Extract video file links
        const videoLinks = await page.evaluate(() => {
            const items: Array<{ url: string; name: string }> = [];
            const fileElements = document.querySelectorAll('[data-id]');

            fileElements.forEach((el) => {
                const nameEl = el.querySelector('[data-tooltip]');
                const name = nameEl?.getAttribute('data-tooltip') || '';

                // Check if it's a video file (extension anywhere in name)
                const lowerName = name.toLowerCase();
                if (
                    lowerName.includes('.mp4') ||
                    lowerName.includes('.mkv') ||
                    lowerName.includes('.avi') ||
                    lowerName.includes('.mov') ||
                    lowerName.includes('.webm')
                ) {
                    const fileId = el.getAttribute('data-id');
                    if (fileId && fileId !== '_gd') { // Skip script tags
                        // Clean up name (remove " Video", " MKV" etc suffixes)
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

        // Validate that all files have names
        const invalidFiles = videoLinks.filter(link => !link.name || link.name.trim() === '');
        if (invalidFiles.length > 0) {
            throw new Error(`Failed to extract names for ${invalidFiles.length} file(s). Cannot proceed without valid file names.`);
        }

        await browser.close();
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
