import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaBaseRepository } from '@core/base/repository.base';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { TransferFolder as PrismaTransferFolder, Prisma, TransferStatus } from '@prisma/client';
import { ITransferFolderRepository } from '../application/interfaces/transfer.repository.interface';
import { TransferFolderEntity } from '../domain/entities/transfer-folder.entity';

@Injectable()
export class PrismaTransferFolderRepository
    extends PrismaBaseRepository<
        TransferFolderEntity,
        PrismaTransferFolder,
        Prisma.TransferFolderCreateInput,
        Prisma.TransferFolderDelegate
    >
    implements ITransferFolderRepository {
    constructor(protected readonly prisma: PrismaService) {
        super(prisma, 'transferFolder');
    }

    protected fromData(data: PrismaTransferFolder): TransferFolderEntity {
        return TransferFolderEntity.fromData({
            id: data.id,
            url: data.url,
            name: data.name,
            status: data.status as any,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    protected mapEntityToCreateInput(
        entity: TransferFolderEntity,
    ): Prisma.TransferFolderCreateInput {
        const { id, ...data } = entity.toObject();
        return data as any;
    }

    async findAll(tx?: PrismaTransactionClient): Promise<TransferFolderEntity[]> {
        const client = this.getClient(tx);
        const folders = await client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return folders.map((folder) => this.fromData(folder));
    }
}
