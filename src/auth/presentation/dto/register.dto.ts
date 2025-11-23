import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const registerSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	name: z.string().optional(),
});

export class RegisterDto extends createZodDto(registerSchema) {}
