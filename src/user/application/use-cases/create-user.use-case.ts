import { ConflictError } from '@core/base/error.base';
import { Inject, Injectable } from '@nestjs/common';
import { User } from '@user/domain/user.entity';
import {
	IUserRepository,
	USER_REPOSITORY,
} from '../interfaces/user.repository.interface';

@Injectable()
export class CreateUserUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}

	async execute(user: User): Promise<User> {
		const existingUser = await this.userRepository.findByEmail(user.email);
		if (existingUser) {
			throw ConflictError.duplicate('email', user.email);
		}

		return this.userRepository.save(user);
	}
}

