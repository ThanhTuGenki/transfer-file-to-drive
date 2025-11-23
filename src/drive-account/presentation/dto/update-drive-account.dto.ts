import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DriveAccountStatus } from '@prisma/client';

const UpdateDriveAccountSchema = z.object({
	name: z.string().min(1, 'Name cannot be empty').max(255).optional(),
	status: z
		.enum([
			DriveAccountStatus.ACTIVE,
			DriveAccountStatus.INACTIVE,
			DriveAccountStatus.QUOTA_EXCEEDED,
			DriveAccountStatus.AUTH_ERROR,
		])
		.optional(),
});

export class UpdateDriveAccountDto extends createZodDto(
	UpdateDriveAccountSchema,
) {}
