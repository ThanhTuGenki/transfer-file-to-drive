import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaTransferFolderRepository } from '../../infrastructure/prisma-transfer-folder.repository';
import { TransferFolderEntity } from '../../domain/entities/transfer-folder.entity';

interface CreateTransferFolderInput {
    url: string;
    name?: string;
}

@Injectable()
export class CreateTransferFolderUseCase {
    private readonly logger = new Logger(CreateTransferFolderUseCase.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly folderRepo: PrismaTransferFolderRepository,
        @InjectQueue('folder-queue') private folderQueue: Queue,
    ) { }

    async execute(input: CreateTransferFolderInput): Promise<TransferFolderEntity> {
        this.logger.log(`Creating transfer folder: ${input.url}`);

        // Create folder entity
        const folder = TransferFolderEntity.createNew({
            url: input.url,
            name: input.name,
        });

        // Save to database
        const savedFolder = await this.folderRepo.create(folder);

        // Add to queue for scanning
        await this.folderQueue.add('scan-folder', {
            folderId: savedFolder.id,
            folderUrl: savedFolder.url,
        });

        this.logger.log(`Folder ${savedFolder.id} created and queued for scanning`);
        return savedFolder;
    }
}
