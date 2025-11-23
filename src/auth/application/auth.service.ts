import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { RegisterDto } from '@auth/presentation/dto';
import {
	RegisterUserUseCase,
	LoginUseCase,
	RefreshTokenUseCase,
	LogoutUseCase,
} from './use-cases';

@Injectable()
export class AuthService {
	constructor(
		private readonly registerUserUseCase: RegisterUserUseCase,
		private readonly loginUseCase: LoginUseCase,
		private readonly refreshTokenUseCase: RefreshTokenUseCase,
		private readonly logoutUseCase: LogoutUseCase,
	) {}

	async login(user: Omit<User, 'password'>): Promise<{
		accessToken: string;
		refreshToken: string;
		user: Omit<User, 'password'>;
	}> {
		return this.loginUseCase.execute(user);
	}

	async register(dto: RegisterDto): Promise<void> {
		await this.registerUserUseCase.execute(dto);
	}

	async refreshToken(refreshToken: string): Promise<{
		accessToken: string;
		refreshToken: string;
	}> {
		return this.refreshTokenUseCase.execute(refreshToken);
	}

	async logout(userId: string): Promise<void> {
		return this.logoutUseCase.execute(userId);
	}
}
