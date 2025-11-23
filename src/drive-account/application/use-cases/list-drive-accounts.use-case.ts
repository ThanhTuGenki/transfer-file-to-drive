import { Inject, Injectable } from '@nestjs/common';
import { DriveAccount } from '../../domain/entities/drive-account.entity';
import { ListDriveAccountQueryDto } from '../../presentation/dto/list-drive-account.query.dto';
import {
	DRIVE_ACCOUNT_REPOSITORY,
	IDriveAccountRepository,
} from '../interfaces/drive-account.repository.interface';

@Injectable()
export class ListDriveAccountsUseCase {
	constructor(
		@Inject(DRIVE_ACCOUNT_REPOSITORY)
		private readonly driveAccountRepo: IDriveAccountRepository,
	) {}

	async execute(
		query: ListDriveAccountQueryDto,
	): Promise<[DriveAccount[], number]> {
		const skip = (query.page - 1) * query.limit;
		const take = query.limit;

		return this.driveAccountRepo.findManyWithCount({
			skip,
			take,
			status: query.status,
			search: query.search,
			orderBy: query.orderBy,
			order: query.order,
		});
	}
}
