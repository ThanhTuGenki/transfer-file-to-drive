import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { DriveAccount } from '../domain/entities/drive-account.entity';
import {
	DriveAccount as PrismaDriveAccount, // Type của Prisma
	Prisma,
	DriveAccountStatus,
} from '@prisma/client';
import { PrismaBaseRepository } from '@core/base';
import { IDriveAccountRepository } from '../application/interfaces/drive-account.repository.interface';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';

@Injectable()
export class PrismaDriveAccountRepository
	extends PrismaBaseRepository<
		DriveAccount,
		PrismaDriveAccount,
		Prisma.DriveAccountCreateInput,
		Prisma.DriveAccountDelegate
	>
	implements IDriveAccountRepository
{
	constructor(protected readonly prisma: PrismaService) {
		super(prisma, 'driveAccount');
	}

	protected fromData(data: PrismaDriveAccount): DriveAccount {
		return DriveAccount.fromData(data);
	}

	protected mapEntityToCreateInput(
		entity: DriveAccount,
	): Prisma.DriveAccountCreateInput {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, ...data } = entity.toObject();
		return data;
	}

	async findByEmail(
		email: string,
		tx?: PrismaTransactionClient,
	): Promise<DriveAccount | null> {
		const client = this.getClient(tx);

		const account = await client.findUnique({
			where: { email: email },
		});

		if (!account) return null;
		return DriveAccount.fromData(account);
	}

	async updateAuthTokens(
		id: string,
		tokens: {
			accessToken: string;
			refreshToken: string;
			tokenExpiresAt: Date;
		},
		tx?: PrismaTransactionClient,
	): Promise<void> {
		const client = this.getClient(tx);

		await client.update({
			where: { id: id },
			data: {
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				tokenExpiresAt: tokens.tokenExpiresAt,
			},
		});
	}

	async findManyWithCount(
		filter: {
			skip: number;
			take: number;
			status?: DriveAccountStatus;
			search?: string;
			orderBy: string;
			order: 'asc' | 'desc';
		},
		tx?: PrismaTransactionClient,
	): Promise<[DriveAccount[], number]> {
		const client = this.getClient(tx);

		const whereClause: Prisma.DriveAccountWhereInput = {
			...(filter.status && { status: filter.status }),
			...(filter.search && {
				OR: [
					{ name: { contains: filter.search, mode: 'insensitive' } },
					{ email: { contains: filter.search, mode: 'insensitive' } },
				],
			}),
		};

		// If we're already in a transaction, run queries sequentially
		// Otherwise, use $transaction for atomicity
		let accounts: PrismaDriveAccount[];
		let total: number;

		if (tx) {
			// Already in transaction, run queries sequentially
			[accounts, total] = await Promise.all([
				client.findMany({
					skip: filter.skip,
					take: filter.take,
					where: whereClause,
					orderBy: { [filter.orderBy]: filter.order },
				}),
				client.count({ where: whereClause }),
			]);
		} else {
			// Not in transaction, use $transaction for atomicity
			[accounts, total] = await this.prisma.$transaction([
				client.findMany({
					skip: filter.skip,
					take: filter.take,
					where: whereClause,
					orderBy: { [filter.orderBy]: filter.order },
				}),
				client.count({ where: whereClause }),
			]);
		}

		const entities = accounts.map(DriveAccount.fromData);
		return [entities, total];
	}
}
