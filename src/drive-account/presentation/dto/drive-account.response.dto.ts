import { DriveAccount as DriveAccountEntity } from '@drive-account/domain/entities/drive-account.entity';
import { DriveAccountStatus } from '@prisma/client';

export class DriveAccountResponseDto {
	id: string;
	name: string;
	email: string;
	status: DriveAccountStatus;
	storageUsed: number;
	storageTotal: number;
	createdAt: string;
	updatedAt: string;

	public static fromEntity(
		entity: DriveAccountEntity,
	): DriveAccountResponseDto {
		return {
			id: entity.id,
			name: entity.name,
			email: entity.email,
			status: entity.status,
			// Convert bigint to number
			storageUsed: Number(entity.storageUsed),
			storageTotal: Number(entity.storageTotal),
			// Convert Date to ISO string
			createdAt: entity.createdAt.toISOString(),
			updatedAt: entity.updatedAt.toISOString(),
		};
	}
}
