import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DriveAccount } from '../../domain/entities/drive-account.entity';
import {
	DRIVE_ACCOUNT_REPOSITORY,
	IDriveAccountRepository,
} from '../interfaces/drive-account.repository.interface';

@Injectable()
export class GetDriveAccountUseCase {
	constructor(
		@Inject(DRIVE_ACCOUNT_REPOSITORY)
		private readonly driveAccountRepo: IDriveAccountRepository,
	) {}

	async execute(id: string): Promise<DriveAccount> {
		const account = await this.driveAccountRepo.findById(id);

		if (!account) {
			throw new NotFoundException(`DriveAccount with ID '${id}' not found.`);
		}

		return account;
	}
}
