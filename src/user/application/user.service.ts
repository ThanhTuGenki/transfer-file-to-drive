import { Inject, Injectable } from '@nestjs/common';
import { User } from '@user/domain/user.entity';
import {
	IUserRepository,
	USER_REPOSITORY,
	UserWithRefreshToken,
} from './interfaces/user.repository.interface';
import { CreateUserUseCase, GetUserProfileUseCase } from './use-cases';

@Injectable()
export class UserService {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		private readonly createUserUseCase: CreateUserUseCase,
		private readonly getUserProfileUseCase: GetUserProfileUseCase,
	) {}

	// Simple repository calls - no use case needed
	async findByEmail(email: string): Promise<User | null> {
		return this.userRepository.findByEmail(email);
	}

	// Delegate to use case
	async findById(id: string): Promise<User | null> {
		return this.getUserProfileUseCase.execute(id);
	}

	// Delegate to use case
	async create(user: User): Promise<User> {
		return this.createUserUseCase.execute(user);
	}

	// Refresh token operations (infrastructure concern)
	async updateRefreshToken(
		userId: string,
		refreshToken: string | null,
	): Promise<void> {
		return this.userRepository.updateRefreshToken(userId, refreshToken);
	}

	async findByIdWithRefreshToken(
		userId: string,
	): Promise<UserWithRefreshToken | null> {
		return this.userRepository.findByIdWithRefreshToken(userId);
	}
}
