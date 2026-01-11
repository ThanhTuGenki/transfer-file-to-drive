import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaTransferFileRepository } from '../prisma-transfer-file.repository';
import { PrismaTransferFolderRepository } from '../prisma-transfer-folder.repository';
import { CrawlerService } from '../strategies/crawler.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface ProcessFileJobData {
    fileId: string;
}

@Processor('file-queue', {
    concurrency: 1, // Process files sequentially
    lockDuration: 0, // Disable lock - no need with concurrency=1
})
export class TransferFileProcessor extends WorkerHost {
    private readonly logger = new Logger(TransferFileProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly fileRepo: PrismaTransferFileRepository,
        private readonly folderRepo: PrismaTransferFolderRepository,
        private readonly crawler: CrawlerService,
        @InjectQueue('file-queue') private fileQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<ProcessFileJobData>): Promise<void> {
        const { fileId } = job.data;
        this.logger.log(`[File ${fileId}] Starting processing`);

        const file = await this.fileRepo.findById(fileId);
        if (!file) {
            throw new Error(`File ${fileId} not found`);
        }

        // Get folder to determine destination folder name
        const folder = await this.folderRepo.findById(file.folderId);
        if (!folder) {
            throw new Error(`Folder ${file.folderId} not found`);
        }

        let finalPath: string | null = null;
        let shouldCleanup = false;

        try {
            // Mark as PROCESSING
            file.markAsProcessing();
            await this.fileRepo.update(file);

            // Download and merge video
            const outputPath = await this.crawler.downloadAndProcess(file.originalUrl);
            this.logger.log(`[File ${fileId}] Downloaded to: ${outputPath}`);

            // Upload to destination Drive using Rclone
            finalPath = await this.uploadToDrive(outputPath, folder.name, file.name);

            // Mark as COMPLETED
            file.markAsCompleted();
            await this.fileRepo.update(file);

            // Cleanup on success
            shouldCleanup = true;

            this.logger.log(`[File ${fileId}] Processing completed successfully`);
        } catch (error) {
            this.logger.error(`[File ${fileId}] Processing failed: ${error.message}`);

            // Mark as FAILED (no automatic retry)
            file.markAsFailed(error.message);
            await this.fileRepo.update(file);

            // Cleanup local files on failure
            shouldCleanup = true;

            // Remove job from Redis (error already saved to database)
            await job.remove().catch(() => {
                // Job might already be removed, ignore error
            });

            throw error;
        } finally {
            // Cleanup local files after success or failure
            if (finalPath && shouldCleanup) {
                await this.cleanupLocalFiles(finalPath);
            }
        }
    }

    /**
     * Upload file to destination Google Drive using Rclone
     * @param filePath Local path to the merged output file
     * @param folderName Destination folder name on Drive B
     * @param fileName Original file name to use on Drive B
     * @returns Final path of the file (after rename)
     */
    private async uploadToDrive(filePath: string, folderName: string, fileName: string): Promise<string> {
        const RCLONE_CONF = path.join(process.cwd(), 'config', 'rclone.conf');
        const dir = path.dirname(filePath);

        // Rename file to correct name before upload
        const renamedPath = path.join(dir, fileName);
        let wasRenamed = false;
        try {
            if (filePath !== renamedPath) {
                fs.renameSync(filePath, renamedPath);
                wasRenamed = true;
                this.logger.log(`[Rclone] Renamed to: ${fileName}`);
            }
        } catch (e) {
            this.logger.warn(`[Rclone] Failed to rename: ${e.message}`);
        }

        const fileToUpload = wasRenamed ? renamedPath : filePath;
        const destPath = `tyziiu:"${folderName}"`;

        this.logger.log(`[Rclone] Uploading ${fileName} to ${destPath}...`);

        try {
            const uploadCmd = `rclone copy "${fileToUpload}" ${destPath} --config "${RCLONE_CONF}" --progress`;
            const { stdout, stderr } = await execAsync(uploadCmd);
            if (stdout) this.logger.log(stdout);
            if (stderr) this.logger.warn(stderr);
            this.logger.log(`[Rclone] Upload successful: ${fileName}`);
        } catch (error) {
            this.logger.error(`[Rclone] Upload failed: ${error.message}`);
            throw error;
        }

        return fileToUpload;
    }

    /**
     * Clean up local temporary files after successful upload
     * @param outputPath Path to the merged output file (may have been renamed)
     */
    private async cleanupLocalFiles(outputPath: string): Promise<void> {
        this.logger.log(`[Cleanup] Removing local files...`);

        const basename = path.basename(outputPath, '.mp4');
        const dir = path.dirname(outputPath);
        const timestamp = basename.replace('output_', '').replace('video_', '').replace('audio_', '');

        const filesToDelete = [
            outputPath, // output_xxx.mp4 (or renamed version)
            path.join(dir, `video_${timestamp}.mp4`),
            path.join(dir, `audio_${timestamp}.mp4`),
        ];

        for (const file of filesToDelete) {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    this.logger.log(`[Cleanup] Deleted: ${path.basename(file)}`);
                }
            } catch (e) {
                this.logger.warn(`[Cleanup] Failed to delete ${file}: ${e.message}`);
            }
        }
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
