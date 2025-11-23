import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetDriveAccountParamsSchema = z.object({
	id: z.cuid(),
});

export class GetDriveAccountParamsDto extends createZodDto(
	GetDriveAccountParamsSchema,
) {}
