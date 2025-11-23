import { UnauthorizedError } from '@core/base/error.base';
import { Injectable } from '@nestjs/common';
import { UserService } from '@user/application/user.service';
import { IUser } from '@user/domain/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ValidateUserUseCase {
	constructor(private readonly userService: UserService) {}

	async execute(
		email: string,
		password: string,
	): Promise<Omit<IUser, 'password'>> {
		const user = await this.userService.findByEmail(email);

		if (
			!user ||
			!user.password ||
			!(await bcrypt.compare(password, user.password))
		) {
			throw UnauthorizedError.invalidCredentials();
		}

		const userObject = user.toObject();

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _, ...result } = userObject;

		return result;
	}
}

