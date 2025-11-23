import { Injectable } from '@nestjs/common';
import { DriveAccount } from '../domain/entities/drive-account.entity';
import {
	CreateDriveAccountDto,
	ListDriveAccountQueryDto,
	UpdateDriveAccountDto,
} from '../presentation/dto';
import {
	CreateDriveAccountUseCase,
	GetDriveAccountUseCase,
	ListDriveAccountsUseCase,
	UpdateDriveAccountUseCase,
	DeleteDriveAccountsUseCase,
} from './use-cases';

@Injectable()
export class DriveAccountsService {
	constructor(
		private readonly createUseCase: CreateDriveAccountUseCase,
		private readonly getUseCase: GetDriveAccountUseCase,
		private readonly listUseCase: ListDriveAccountsUseCase,
		private readonly updateUseCase: UpdateDriveAccountUseCase,
		private readonly deleteUseCase: DeleteDriveAccountsUseCase,
	) {}

	async create(dto: CreateDriveAccountDto): Promise<DriveAccount> {
		return this.createUseCase.execute(dto);
	}

	async findOne(id: string): Promise<DriveAccount> {
		return this.getUseCase.execute(id);
	}

	async list(
		query: ListDriveAccountQueryDto,
	): Promise<[DriveAccount[], number]> {
		return this.listUseCase.execute(query);
	}

	async update(id: string, dto: UpdateDriveAccountDto): Promise<DriveAccount> {
		return this.updateUseCase.execute(id, dto);
	}

	async deleteMany(ids: string[]): Promise<void> {
		return this.deleteUseCase.execute(ids);
	}
}
