import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ValidateUserUseCase } from '../../application/use-cases';
import { IUser } from '@user/domain/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly validateUserUseCase: ValidateUserUseCase) {
		super({
			usernameField: 'email',
		});
	}

	async validate(
		email: string,
		password: string,
	): Promise<Omit<IUser, 'password'>> {
		const user = await this.validateUserUseCase.execute(email, password);
		return user;
	}
}
