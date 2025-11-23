import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { DriveAccount } from '../../domain/entities/drive-account.entity';
import { CreateDriveAccountDto } from '../../presentation/dto/create-drive-account.dto';
import {
	DRIVE_ACCOUNT_REPOSITORY,
	IDriveAccountRepository,
} from '../interfaces/drive-account.repository.interface';

@Injectable()
export class CreateDriveAccountUseCase {
	constructor(
		@Inject(DRIVE_ACCOUNT_REPOSITORY)
		private readonly driveAccountRepo: IDriveAccountRepository,
	) {}

	async execute(dto: CreateDriveAccountDto): Promise<DriveAccount> {
		const existingAccount = await this.driveAccountRepo.findByEmail(dto.email);
		if (existingAccount) {
			throw new ConflictException(
				`DriveAccount with email '${dto.email}' already exists.`,
			);
		}

		const newAccount = DriveAccount.create({
			email: dto.email,
			name: dto.name,
		});

		return this.driveAccountRepo.save(newAccount);
	}
}
