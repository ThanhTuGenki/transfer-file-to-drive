import { Injectable } from '@nestjs/common';
import { UserService } from '@user/application/user.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UnauthorizedError } from '@core/base/error.base';
import { IUser } from '@user/domain/user.entity';

@Injectable()
export class AuthDomainService {
	constructor(private readonly userService: UserService) { }

	async validateUser(
		email: string,
		pass: string,
	): Promise<Omit<IUser, 'password'>> {
		const user = await this.userService.findByEmail(email);

		if (
			!user ||
			user.role !== UserRole.ADMIN ||
			!user.password ||
			!(await bcrypt.compare(pass, user.password))
		) {
			throw UnauthorizedError.invalidCredentials();
		}

		return {
			id: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
			emailVerified: user.emailVerified,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}
}
