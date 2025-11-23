import { Inject, Injectable } from '@nestjs/common';
import { User } from '@user/domain/user.entity';
import {
	IUserRepository,
	USER_REPOSITORY,
} from '../interfaces/user.repository.interface';

@Injectable()
export class GetUserProfileUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}

	async execute(userId: string): Promise<User | null> {
		return this.userRepository.findById(userId);
	}
}

