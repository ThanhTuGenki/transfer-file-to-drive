import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { DriveAccountsService } from './application/drive-account.service';
import { DRIVE_ACCOUNT_REPOSITORY } from './application/interfaces/drive-account.repository.interface';
import { PrismaDriveAccountRepository } from './infrastructure/prisma-drive-account.repository';
import { DriveAccountsController } from './presentation/drive-account.controller';
import {
	CreateDriveAccountUseCase,
	GetDriveAccountUseCase,
	ListDriveAccountsUseCase,
	UpdateDriveAccountUseCase,
	DeleteDriveAccountsUseCase,
} from './application/use-cases';
import { AuthModule } from '@auth/auth.module';

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [DriveAccountsController],
	providers: [
		DriveAccountsService,
		{
			provide: DRIVE_ACCOUNT_REPOSITORY,
			useClass: PrismaDriveAccountRepository,
		},
		CreateDriveAccountUseCase,
		GetDriveAccountUseCase,
		ListDriveAccountsUseCase,
		UpdateDriveAccountUseCase,
		DeleteDriveAccountsUseCase,
	],
	exports: [DriveAccountsService],
})
export class DriveAccountsModule {}
