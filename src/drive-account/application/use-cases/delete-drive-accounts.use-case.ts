import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	DRIVE_ACCOUNT_REPOSITORY,
	IDriveAccountRepository,
} from '../interfaces/drive-account.repository.interface';

@Injectable()
export class DeleteDriveAccountsUseCase {
	constructor(
		@Inject(DRIVE_ACCOUNT_REPOSITORY)
		private readonly driveAccountRepo: IDriveAccountRepository,
	) {}

	async execute(ids: string[]): Promise<void> {
		const deletedCount = await this.driveAccountRepo.deleteByIds(ids);

		if (deletedCount === 0 && ids.length > 0) {
			throw new NotFoundException(
				'One or more drive accounts not found or could not be deleted.',
			);
		}
	}
}
