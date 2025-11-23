import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateDriveAccountSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255),
	email: z
		.string()
		.max(255)
		.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' }),
});

export class CreateDriveAccountDto extends createZodDto(
	CreateDriveAccountSchema,
) {}
