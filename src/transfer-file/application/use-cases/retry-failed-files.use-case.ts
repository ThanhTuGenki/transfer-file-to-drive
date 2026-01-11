import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaTransferFileRepository } from '../../infrastructure/prisma-transfer-file.repository';

@Injectable()
export class RetryFailedFilesUseCase {
    private readonly logger = new Logger(RetryFailedFilesUseCase.name);

    constructor(
        private readonly fileRepo: PrismaTransferFileRepository,
        @InjectQueue('file-queue') private fileQueue: Queue,
    ) { }

    async execute(): Promise<{ count: number; files: any[] }> {
        this.logger.log('Finding failed files to retry...');

        // Find all failed files
        const failedFiles = await this.fileRepo.findFailedFiles();

        // Reset status to PENDING and clear error log
        for (const file of failedFiles) {
            file.markAsPending();
            await this.fileRepo.update(file);
        }

        // Add each file to the queue (sequential processing via concurrency: 1)
        for (const file of failedFiles) {
            await this.fileQueue.add('process-file', {
                fileId: file.id,
            });
        }

        this.logger.log(`Queued ${failedFiles.length} failed files for retry`);

        return {
            count: failedFiles.length,
            files: failedFiles.map(f => ({
                id: f.id,
                name: f.name,
                originalUrl: f.originalUrl,
            })),
        };
    }

    async executeOne(fileId: string): Promise<boolean> {
        this.logger.log(`Retrying failed file ${fileId}...`);

        const file = await this.fileRepo.findById(fileId);

        if (!file || file.status !== 'FAILED') {
            this.logger.warn(`File ${fileId} not found or not in failed status`);
            return false;
        }

        // Reset status to PENDING and clear error log
        file.markAsPending();
        await this.fileRepo.update(file);

        // Add to queue
        await this.fileQueue.add('process-file', {
            fileId: file.id,
        });

        this.logger.log(`Queued file ${fileId} for retry`);
        return true;
    }
}
