import { RegisterDto } from '@auth/presentation/dto';
import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UserService } from '@user/application/user.service';
import { User } from '@user/domain/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterUserUseCase {
	constructor(private readonly userService: UserService) {}

	async execute(dto: RegisterDto): Promise<void> {
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(dto.password, salt);

		const newUser = User.create({
			email: dto.email,
			password: hashedPassword,
			name: dto.name,
			role: UserRole.USER,
		});

		await this.userService.create(newUser);
	}
}

