import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@core/prisma/prisma.module';
import { TransferFolderProcessor } from './infrastructure/workers/transfer-folder.processor';
import { TransferFileProcessor } from './infrastructure/workers/transfer-file.processor';
import { CrawlerService } from './infrastructure/strategies/crawler.service';
import { BrowserService } from './infrastructure/strategies/browser.service';
import { PrismaTransferFolderRepository } from './infrastructure/prisma-transfer-folder.repository';
import { PrismaTransferFileRepository } from './infrastructure/prisma-transfer-file.repository';
import { CreateTransferFolderUseCase } from './application/use-cases/create-transfer-folder.use-case';
import { ProcessPendingFilesUseCase } from './application/use-cases/process-pending-files.use-case';
import { TransferController } from './presentation/transfer.controller';

@Module({
    imports: [
        PrismaModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST', 'localhost'),
                    port: configService.get('REDIS_PORT', 6379),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue(
            {
                name: 'folder-queue',
            },
            {
                name: 'file-queue',
            },
        ),
    ],
    controllers: [TransferController],
    providers: [
        BrowserService,
        CrawlerService,
        PrismaTransferFolderRepository,
        PrismaTransferFileRepository,
        CreateTransferFolderUseCase,
        ProcessPendingFilesUseCase,
        TransferFolderProcessor,
        TransferFileProcessor,
    ],
    exports: [
        BrowserService,
        CrawlerService,
        PrismaTransferFolderRepository,
        PrismaTransferFileRepository,
        BullModule,
    ],
})
export class TransferFileModule { }
