import { BaseEntity } from '@core/base/entity.base';

export enum TransferStatus {
    PENDING = 'PENDING',
    SCANNING = 'SCANNING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

interface TransferFolderProps {
    id: string;
    url: string;
    name: string;
    path: string;
    parentId?: string;
    status: TransferStatus;
    createdAt: Date;
    updatedAt: Date;
}

export class TransferFolderEntity extends BaseEntity<TransferFolderProps> {
    public readonly id: string;
    public url: string;
    public name: string;
    public path: string;
    public readonly parentId?: string;
    public status: TransferStatus;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: TransferFolderProps) {
        super();
        this.id = props.id;
        this.url = props.url;
        this.name = props.name;
        this.path = props.path;
        this.parentId = props.parentId;
        this.status = props.status;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.setInitialState();
    }

    protected getCurrentState(): Omit<TransferFolderProps, 'id'> {
        return {
            url: this.url,
            name: this.name,
            path: this.path,
            parentId: this.parentId,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    public toObject(): TransferFolderProps {
        return {
            id: this.id,
            url: this.url,
            name: this.name,
            path: this.path,
            parentId: this.parentId,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    markAsScanning(): void {
        this.status = TransferStatus.SCANNING;
    }

    markAsCompleted(): void {
        this.status = TransferStatus.COMPLETED;
    }

    markAsFailed(): void {
        this.status = TransferStatus.FAILED;
    }

    updateName(name: string): void {
        this.name = name;
    }

    static createNew(data: { url: string; name?: string; parentId?: string; path?: string }): TransferFolderEntity {
        return new TransferFolderEntity({
            id: '0',
            url: data.url,
            name: data.name ?? 'Transfer',
            path: data.path ?? '',
            parentId: data.parentId,
            status: TransferStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static fromData(data: {
        id: string;
        url: string;
        name: string;
        path: string;
        parentId?: string;
        status: TransferStatus;
        createdAt: Date;
        updatedAt: Date;
    }): TransferFolderEntity {
        return new TransferFolderEntity(data);
    }
}
