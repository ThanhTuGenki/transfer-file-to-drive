import {
	Controller,
	Get,
	UseFilters,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../application/user.service';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { CurrentUser, ICurrentUser } from '@auth/presentation/decorators';
import { HttpExceptionFilter } from '@core/filters/http-exception.filter';
import { ResponseInterceptor } from '@core/interceptors/response.interceptor';

@UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get('profile')
	@UseGuards(JwtAuthGuard)
	async getProfile(@CurrentUser() user: ICurrentUser) {
		return this.userService.findById(user.id);
	}
}
