import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@user/application/user.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class RefreshTokenUseCase {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
	) {}

	async execute(refreshToken: string): Promise<{
		accessToken: string;
		refreshToken: string;
	}> {
		try {
			// Verify refresh token
			const payload = await this.jwtService.verifyAsync<JwtPayload>(
				refreshToken,
			);

			if (!payload || !payload.sub) {
				throw new UnauthorizedException('Invalid refresh token');
			}

			// Get user WITH refresh token (infrastructure concern)
			const userData =
				await this.userService.findByIdWithRefreshToken(payload.sub);

			if (!userData || !userData.refreshToken) {
				throw new UnauthorizedException('Invalid refresh token');
			}

			// Compare refresh tokens (they're hashed in database)
			const isRefreshTokenValid = await bcrypt.compare(
				refreshToken,
				userData.refreshToken,
			);

			if (!isRefreshTokenValid) {
				throw new UnauthorizedException('Invalid refresh token');
			}

			// Generate new tokens
			const newPayload: JwtPayload = {
				sub: userData.id,
				email: userData.email,
				role: userData.role as UserRole,
			};

			const accessToken = await this.jwtService.signAsync(newPayload, {
				expiresIn: '15m',
			});

			const newRefreshToken = await this.jwtService.signAsync(
				{ sub: userData.id },
				{ expiresIn: '7d' },
			);

			// Hash and update new refresh token in database
			const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
			await this.userService.updateRefreshToken(
				userData.id,
				hashedRefreshToken,
			);

			return {
				accessToken,
				refreshToken: newRefreshToken,
			};
		} catch (error) {
			throw new UnauthorizedException('Invalid or expired refresh token');
		}
	}
}

