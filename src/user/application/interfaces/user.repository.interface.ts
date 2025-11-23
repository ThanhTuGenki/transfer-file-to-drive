import { IBaseRepository } from '@core/base';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { User } from '../../domain/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

// Type for sensitive auth fields (not in domain entity)
export interface UserWithRefreshToken {
	id: string;
	email: string;
	role: string;
	refreshToken: string | null;
	tokenVersion: number;
}

export interface IUserRepository extends IBaseRepository<User> {
	findByEmail(
		email: string,
		tx?: PrismaTransactionClient,
	): Promise<User | null>;

	/**
	 * Update refresh token (sensitive operation)
	 * This bypasses domain entity to update infrastructure concern
	 */
	updateRefreshToken(
		userId: string,
		refreshToken: string | null,
		tx?: PrismaTransactionClient,
	): Promise<void>;

	/**
	 * Find user WITH refresh token for validation
	 * Returns raw data (not domain entity) because refreshToken is infrastructure concern
	 */
	findByIdWithRefreshToken(
		userId: string,
		tx?: PrismaTransactionClient,
	): Promise<UserWithRefreshToken | null>;
}
