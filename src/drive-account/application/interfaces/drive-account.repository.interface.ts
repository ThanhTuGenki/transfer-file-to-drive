import { IBaseRepository } from '@core/base';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { DriveAccount } from '../../domain/entities/drive-account.entity';
import { DriveAccountStatus } from '@prisma/client';

export const DRIVE_ACCOUNT_REPOSITORY = 'DRIVE_ACCOUNT_REPOSITORY';

export interface IDriveAccountRepository extends IBaseRepository<DriveAccount> {
	findByEmail(
		email: string,
		tx?: PrismaTransactionClient,
	): Promise<DriveAccount | null>;

	updateAuthTokens(
		id: string,
		tokens: {
			accessToken: string;
			refreshToken: string;
			tokenExpiresAt: Date;
		},
		tx?: PrismaTransactionClient,
	): Promise<void>;
	findManyWithCount(
		filter: {
			skip: number;
			take: number;
			status?: DriveAccountStatus;
			search?: string;
			orderBy: string;
			order: 'asc' | 'desc';
		},
		tx?: PrismaTransactionClient,
	): Promise<[DriveAccount[], number]>;
}
