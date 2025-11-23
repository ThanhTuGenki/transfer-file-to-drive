import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { UserModule } from '@user/user.module';
import { AuthService } from './application/auth.service';
import {
	RegisterUserUseCase,
	ValidateUserUseCase,
	LoginUseCase,
	RefreshTokenUseCase,
	LogoutUseCase,
} from './application/use-cases';
import { AuthController } from './presentation/auth.controller';
import { JwtStrategy, LocalStrategy } from './presentation/strategies';
import { RolesGuard } from './presentation/guards';
import { PrismaService } from '@core/prisma/prisma.service';

@Module({
	imports: [
		UserModule,
		PassportModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService): JwtModuleOptions => {
				const secret = config.get<string>('JWT_SECRET');
				if (!secret) {
					throw new Error('JWT_SECRET is not defined');
				}

				const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ??
					'15m') as StringValue;

				return {
					secret,
					signOptions: {
						expiresIn,
					},
				};
			},
		}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		RegisterUserUseCase,
		ValidateUserUseCase,
		LoginUseCase,
		RefreshTokenUseCase,
		LogoutUseCase,
		LocalStrategy,
		JwtStrategy,
		RolesGuard,
		PrismaService,
	],
	exports: [JwtStrategy, RolesGuard, PassportModule],
})
export class AuthModule {}
