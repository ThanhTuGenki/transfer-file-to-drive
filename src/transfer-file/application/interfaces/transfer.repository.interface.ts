import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { TransferFolderEntity } from '../../domain/entities/transfer-folder.entity';
import { TransferFileEntity } from '../../domain/entities/transfer-file.entity';

export interface ITransferFolderRepository {
    create(
        entity: TransferFolderEntity,
        tx?: PrismaTransactionClient,
    ): Promise<TransferFolderEntity>;
    findById(id: string, tx?: PrismaTransactionClient): Promise<TransferFolderEntity | null>;
    findAll(tx?: PrismaTransactionClient): Promise<TransferFolderEntity[]>;
    update(
        entity: TransferFolderEntity,
        tx?: PrismaTransactionClient,
    ): Promise<TransferFolderEntity>;
    delete(entity: TransferFolderEntity, tx?: PrismaTransactionClient): Promise<void>;
}

export interface ITransferFileRepository {
    create(
        entity: TransferFileEntity,
        tx?: PrismaTransactionClient,
    ): Promise<TransferFileEntity>;
    createMany(
        entities: TransferFileEntity[],
        tx?: PrismaTransactionClient,
    ): Promise<TransferFileEntity[]>;
    findById(id: string, tx?: PrismaTransactionClient): Promise<TransferFileEntity | null>;
    findByFolderId(
        folderId: string,
        tx?: PrismaTransactionClient,
    ): Promise<TransferFileEntity[]>;
    findPendingFiles(tx?: PrismaTransactionClient): Promise<TransferFileEntity[]>;
    update(
        entity: TransferFileEntity,
        tx?: PrismaTransactionClient,
    ): Promise<TransferFileEntity>;
    delete(entity: TransferFileEntity, tx?: PrismaTransactionClient): Promise<void>;
}
