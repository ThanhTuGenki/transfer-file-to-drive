import { Injectable } from '@nestjs/common';
import { UserService } from '@user/application/user.service';

@Injectable()
export class LogoutUseCase {
	constructor(private readonly userService: UserService) {}

	async execute(userId: string): Promise<void> {
		// Remove refresh token from database
		await this.userService.updateRefreshToken(userId, null);
	}
}

