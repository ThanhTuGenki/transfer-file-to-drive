import { BaseEntity } from '@core/base/entity.base';
import { TransferStatus } from './transfer-folder.entity';

interface TransferFileProps {
    id: string;
    folderId: string;
    originalUrl: string;
    name: string;
    status: TransferStatus;
    errorLog: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class TransferFileEntity extends BaseEntity<TransferFileProps> {
    public readonly id: string;
    public readonly folderId: string;
    public originalUrl: string;
    public name: string;
    public status: TransferStatus;
    public errorLog: string | null;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: TransferFileProps) {
        super();
        this.id = props.id;
        this.folderId = props.folderId;
        this.originalUrl = props.originalUrl;
        this.name = props.name;
        this.status = props.status;
        this.errorLog = props.errorLog;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.setInitialState();
    }

    protected getCurrentState(): Omit<TransferFileProps, 'id'> {
        return {
            folderId: this.folderId,
            originalUrl: this.originalUrl,
            name: this.name,
            status: this.status,
            errorLog: this.errorLog,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    public toObject(): TransferFileProps {
        return {
            id: this.id,
            folderId: this.folderId,
            originalUrl: this.originalUrl,
            name: this.name,
            status: this.status,
            errorLog: this.errorLog,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    markAsProcessing(): void {
        this.status = TransferStatus.PROCESSING;
    }

    markAsCompleted(): void {
        this.status = TransferStatus.COMPLETED;
        this.errorLog = null;
    }

    markAsFailed(error: string): void {
        this.status = TransferStatus.FAILED;
        this.errorLog = error;
    }

    markAsPending(): void {
        this.status = TransferStatus.PENDING;
        this.errorLog = null;
    }

    updateName(name: string): void {
        this.name = name;
    }

    static createNew(data: {
        folderId: string;
        originalUrl: string;
        name: string;
    }): TransferFileEntity {
        return new TransferFileEntity({
            id: '0',
            folderId: data.folderId,
            originalUrl: data.originalUrl,
            name: data.name,
            status: TransferStatus.PENDING,
            errorLog: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static fromData(data: {
        id: string;
        folderId: string;
        originalUrl: string;
        name: string;
        status: TransferStatus;
        errorLog: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): TransferFileEntity {
        return new TransferFileEntity(data);
    }
}
