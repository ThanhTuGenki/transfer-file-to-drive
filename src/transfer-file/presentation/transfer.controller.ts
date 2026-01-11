import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateTransferFolderUseCase } from '../application/use-cases/create-transfer-folder.use-case';
import { ProcessPendingFilesUseCase } from '../application/use-cases/process-pending-files.use-case';
import { RetryFailedFilesUseCase } from '../application/use-cases/retry-failed-files.use-case';
import { PrismaTransferFolderRepository } from '../infrastructure/prisma-transfer-folder.repository';
import { PrismaTransferFileRepository } from '../infrastructure/prisma-transfer-file.repository';

class CreateFolderDto {
    url: string;
    name?: string;
}

@Controller('transfer')
export class TransferController {
    constructor(
        private readonly createFolderUseCase: CreateTransferFolderUseCase,
        private readonly processPendingFilesUseCase: ProcessPendingFilesUseCase,
        private readonly retryFailedFilesUseCase: RetryFailedFilesUseCase,
        private readonly folderRepo: PrismaTransferFolderRepository,
        private readonly fileRepo: PrismaTransferFileRepository,
    ) { }

    @Post('folders')
    @HttpCode(HttpStatus.CREATED)
    async createFolder(@Body() dto: CreateFolderDto): Promise<{ success: boolean; data: any }> {
        const folder = await this.createFolderUseCase.execute(dto);
        return {
            success: true,
            data: folder.toObject(),
        };
    }

    @Get('folders')
    async listFolders(): Promise<{ success: boolean; data: any[] }> {
        const folders = await this.folderRepo.findAll();
        return {
            success: true,
            data: folders.map((f) => f.toObject()),
        };
    }

    @Get('folders/:id/files')
    async listFolderFiles(@Param('id') id: string): Promise<{ success: boolean; data: any[] }> {
        const files = await this.fileRepo.findByFolderId(id);
        return {
            success: true,
            data: files.map((f) => f.toObject()),
        };
    }

    @Post('process-pending')
    @HttpCode(HttpStatus.OK)
    async processPending(): Promise<{ success: boolean; message: string }> {
        const count = await this.processPendingFilesUseCase.execute();
        return {
            success: true,
            message: `Queued ${count} files for processing`,
        };
    }

    @Post('retry-failed')
    @HttpCode(HttpStatus.OK)
    async retryFailed(): Promise<{ success: boolean; data: any }> {
        const result = await this.retryFailedFilesUseCase.execute();
        return {
            success: true,
            data: result,
        };
    }

    @Post('retry-failed/:id')
    @HttpCode(HttpStatus.OK)
    async retryFailedById(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
        const result = await this.retryFailedFilesUseCase.executeOne(id);
        return {
            success: true,
            message: result ? 'File queued for retry' : 'File not found or not in failed status',
        };
    }
}
