import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DriveAccount } from '../../domain/entities/drive-account.entity';
import { UpdateDriveAccountDto } from '../../presentation/dto/update-drive-account.dto';
import {
	DRIVE_ACCOUNT_REPOSITORY,
	IDriveAccountRepository,
} from '../interfaces/drive-account.repository.interface';

@Injectable()
export class UpdateDriveAccountUseCase {
	constructor(
		@Inject(DRIVE_ACCOUNT_REPOSITORY)
		private readonly driveAccountRepo: IDriveAccountRepository,
	) {}

	async execute(id: string, dto: UpdateDriveAccountDto): Promise<DriveAccount> {
		const entity = await this.driveAccountRepo.findById(id);
		if (!entity) {
			throw new NotFoundException(`DriveAccount with ID '${id}' not found.`);
		}

		entity.markAsUpdateAPI(dto);

		return this.driveAccountRepo.save(entity);
	}
}
