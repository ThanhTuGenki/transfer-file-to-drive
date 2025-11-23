import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DeleteDriveAccountSchema = z.object({
	ids: z.array(z.cuid()).min(1, 'IDs array cannot be empty'),
});

export class DeleteDriveAccountDto extends createZodDto(
	DeleteDriveAccountSchema,
) {}
