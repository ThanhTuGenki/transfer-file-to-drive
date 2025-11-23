import { Module } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { UserService } from './application/user.service';
import { USER_REPOSITORY } from './application/interfaces/user.repository.interface';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UserController } from './presentation/user.controller';
import { CreateUserUseCase, GetUserProfileUseCase } from './application/use-cases';

@Module({
	controllers: [UserController],
	providers: [
		UserService,
		CreateUserUseCase,
		GetUserProfileUseCase,
		PrismaService,
		{
			provide: USER_REPOSITORY,
			useClass: PrismaUserRepository,
		},
	],
	exports: [UserService],
})
export class UserModule {}
