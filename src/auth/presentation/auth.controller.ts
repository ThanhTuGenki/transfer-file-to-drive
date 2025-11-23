import { HttpExceptionFilter } from '@core/filters/http-exception.filter';
import { ResponseInterceptor } from '@core/interceptors/response.interceptor';
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UseFilters,
	UseGuards,
	UseInterceptors,
	UsePipes,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthService } from '../application/auth.service';
import {
	LoginDto,
	LoginResponseDto,
	RegisterDto,
	RefreshTokenDto,
	RefreshTokenResponseDto,
} from './dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@UseGuards(LocalAuthGuard)
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	@UsePipes(new ZodValidationPipe(RegisterDto))
	async register(@Body() dto: RegisterDto): Promise<void> {
		await this.authService.register(dto);
	}

	@UseGuards(LocalAuthGuard)
	@Post('login')
	@UsePipes(new ZodValidationPipe(LoginDto))
	async login(
		@Req() req: Request & { user: Omit<User, 'password'> },
		@Body() dto: LoginDto,
	): Promise<LoginResponseDto> {
		const result = await this.authService.login(req.user);
		return LoginResponseDto.fromServiceResponse(result);
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@UsePipes(new ZodValidationPipe(RefreshTokenDto))
	async refreshToken(
		@Body() dto: RefreshTokenDto,
	): Promise<RefreshTokenResponseDto> {
		const result = await this.authService.refreshToken(dto.refreshToken);
		return RefreshTokenResponseDto.fromServiceResponse(result);
	}

	@UseGuards(JwtAuthGuard)
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@CurrentUser() user: { id: string }): Promise<void> {
		await this.authService.logout(user.id);
	}
}
