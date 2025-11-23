import { PrismaBaseRepository } from '@core/base';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { IUserRepository } from '../application/interfaces/user.repository.interface';
import { User } from '../domain/user.entity';

@Injectable()
export class PrismaUserRepository
	extends PrismaBaseRepository<
		User,
		PrismaUser,
		Prisma.UserCreateInput,
		Prisma.UserDelegate
	>
	implements IUserRepository
{
	constructor(protected readonly prisma: PrismaService) {
		super(prisma, 'user');
	}

	protected fromData(data: PrismaUser): User {
		return User.fromData(data);
	}

	protected mapEntityToCreateInput(entity: User): Prisma.UserCreateInput {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, ...data } = entity.toObject();
		return data;
	}

	async findByEmail(
		email: string,
		tx?: PrismaTransactionClient,
	): Promise<User | null> {
		const client = this.getClient(tx);

		const user = await client.findUnique({
			where: { email: email },
		});

		if (!user) return null;
		return User.fromData(user);
	}

	async updateRefreshToken(
		userId: string,
		refreshToken: string | null,
		tx?: PrismaTransactionClient,
	): Promise<void> {
		const client = this.getClient(tx);

		await client.update({
			where: { id: userId },
			data: { refreshToken },
		});
	}

	async findByIdWithRefreshToken(
		userId: string,
		tx?: PrismaTransactionClient,
	) {
		const client = this.getClient(tx);

		// Return raw data with sensitive fields (not domain entity)
		const user = await client.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				role: true,
				refreshToken: true,
				tokenVersion: true,
			},
		});

		return user;
	}
}
