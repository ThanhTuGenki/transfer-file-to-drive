import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserService } from '@user/application/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
	) {}

	async execute(user: Omit<User, 'password'>): Promise<{
		accessToken: string;
		refreshToken: string;
		user: Omit<User, 'password'>;
	}> {
		const payload: JwtPayload = {
			sub: user.id.toString(),
			email: user.email,
			role: user.role,
		};

		// Generate access token - 15 minutes
		const accessToken = await this.jwtService.signAsync(payload, {
			expiresIn: '15m',
		});

		// Generate refresh token - 7 days
		const refreshToken = await this.jwtService.signAsync(
			{ sub: user.id },
			{ expiresIn: '7d' },
		);

		// Hash and save refresh token to database
		const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
		await this.userService.updateRefreshToken(user.id, hashedRefreshToken);

		return {
			accessToken,
			refreshToken,
			user,
		};
	}
}
