import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaBaseRepository } from '@core/base/repository.base';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { TransferFile as PrismaTransferFile, Prisma, TransferStatus } from '@prisma/client';
import { ITransferFileRepository } from '../application/interfaces/transfer.repository.interface';
import { TransferFileEntity } from '../domain/entities/transfer-file.entity';

@Injectable()
export class PrismaTransferFileRepository
    extends PrismaBaseRepository<
        TransferFileEntity,
        PrismaTransferFile,
        Prisma.TransferFileCreateInput,
        Prisma.TransferFileDelegate
    >
    implements ITransferFileRepository {
    constructor(protected readonly prisma: PrismaService) {
        super(prisma, 'transferFile');
    }

    protected fromData(data: PrismaTransferFile): TransferFileEntity {
        return TransferFileEntity.fromData({
            id: data.id,
            folderId: data.folderId,
            originalUrl: data.originalUrl,
            name: data.name,
            status: data.status as any,
            retryCount: data.retryCount,
            errorLog: data.errorLog,
            localPath: data.localPath,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    protected mapEntityToCreateInput(
        entity: TransferFileEntity,
    ): Prisma.TransferFileCreateInput {
        const data = entity.toObject();
        return {
            folderId: data.folderId,
            originalUrl: data.originalUrl,
            name: data.name,
            status: data.status,
            retryCount: data.retryCount,
            errorLog: data.errorLog,
            localPath: data.localPath,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        } as any;
    }

    async createMany(
        entities: TransferFileEntity[],
        tx?: PrismaTransactionClient,
    ): Promise<TransferFileEntity[]> {
        const client = this.getClient(tx);
        const data = entities.map((entity) => this.mapEntityToCreateInput(entity));

        await client.createMany({ data: data as any });

        // Fetch created entities
        const created = await client.findMany({
            where: {
                folderId: entities[0]?.folderId,
            },
            orderBy: { createdAt: 'desc' },
            take: entities.length,
        });

        return created.map((file) => this.fromData(file));
    }

    async findByFolderId(
        folderId: string,
        tx?: PrismaTransactionClient,
    ): Promise<TransferFileEntity[]> {
        const client = this.getClient(tx);
        const files = await client.findMany({
            where: { folderId },
            orderBy: { createdAt: 'asc' },
        });
        return files.map((file) => this.fromData(file));
    }

    async findPendingFiles(tx?: PrismaTransactionClient): Promise<TransferFileEntity[]> {
        const client = this.getClient(tx);
        const files = await client.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
        });
        return files.map((file) => this.fromData(file));
    }
}
