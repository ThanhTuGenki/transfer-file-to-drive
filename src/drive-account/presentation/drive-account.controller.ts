import { ResponseMessage } from '@core/decorators/response-message.decorator';
import type { IPaginatedData } from '@core/interceptors/response.interceptor';
import {
	Controller,
	Get,
	Param,
	UsePipes,
	Post,
	Body,
	Query,
	Put,
	Delete,
	UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { DriveAccountsService } from '../application/drive-account.service';
import {
	DriveAccountResponseDto,
	GetDriveAccountParamsDto,
	ListDriveAccountQueryDto,
	UpdateDriveAccountDto,
	DeleteDriveAccountDto,
	CreateDriveAccountDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@auth/presentation/guards';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('drive-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DriveAccountsController {
	constructor(private readonly driveAccountsService: DriveAccountsService) {}

	@Get()
	@UsePipes(new ZodValidationPipe(ListDriveAccountQueryDto))
	@ResponseMessage('List drive accounts successfully')
	async list(
		@Query() query: ListDriveAccountQueryDto,
	): Promise<IPaginatedData<DriveAccountResponseDto>> {
		const [entities, total] = await this.driveAccountsService.list(query);

		const items = entities.map(DriveAccountResponseDto.fromEntity);

		return {
			items: items,
			meta: {
				currentPage: query.page,
				totalPages: Math.ceil(total / query.limit),
				totalItems: total,
				itemsPerPage: query.limit,
			},
		};
	}

	@Get(':id')
	@UsePipes(new ZodValidationPipe(GetDriveAccountParamsDto))
	@ResponseMessage('Request successful')
	async getById(
		@Param() params: GetDriveAccountParamsDto,
	): Promise<DriveAccountResponseDto> {
		const entity = await this.driveAccountsService.findOne(params.id);

		return DriveAccountResponseDto.fromEntity(entity);
	}

	@Post()
	@UsePipes(new ZodValidationPipe(CreateDriveAccountDto))
	@ResponseMessage('Drive account created successfully')
	async create(
		@Body() dto: CreateDriveAccountDto,
	): Promise<DriveAccountResponseDto> {
		const entity = await this.driveAccountsService.create(dto);

		return DriveAccountResponseDto.fromEntity(entity);
	}

	@Put(':id')
	@ResponseMessage('Drive account updated successfully')
	async update(
		@Param(new ZodValidationPipe(GetDriveAccountParamsDto))
		params: GetDriveAccountParamsDto,
		@Body(new ZodValidationPipe(UpdateDriveAccountDto))
		dto: UpdateDriveAccountDto,
	): Promise<void> {
		await this.driveAccountsService.update(params.id, dto);
	}

	@Delete()
	@ResponseMessage('Multiple drive accounts deleted successfully')
	async deleteMany(@Body() dto: DeleteDriveAccountDto): Promise<void> {
		await this.driveAccountsService.deleteMany(dto.ids);
	}
}
