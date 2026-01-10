import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaTransferFileRepository } from '../../infrastructure/prisma-transfer-file.repository';
import { TransferFileEntity } from '../../domain/entities/transfer-file.entity';

@Injectable()
export class ProcessPendingFilesUseCase {
    private readonly logger = new Logger(ProcessPendingFilesUseCase.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly fileRepo: PrismaTransferFileRepository,
        @InjectQueue('file-queue') private fileQueue: Queue,
    ) { }

    async execute(): Promise<number> {
        this.logger.log('Processing pending files...');

        // Find all pending files
        const pendingFiles = await this.fileRepo.findPendingFiles();

        // Add each file to the queue
        for (const file of pendingFiles) {
            await this.fileQueue.add('process-file', {
                fileId: file.id,
            });
        }

        this.logger.log(`Queued ${pendingFiles.length} files for processing`);
        return pendingFiles.length;
    }
}
