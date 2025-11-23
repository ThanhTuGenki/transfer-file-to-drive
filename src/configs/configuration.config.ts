import { z } from 'zod';

// Schema Zod để validate environment variables
export const envSchema = z.object({
	// Node Environment
	NODE_ENV: z
		.enum(['development', 'production', 'test', 'provision', 'staging'])
		.default('development'),

	// Server Port
	PORT: z.coerce.number().default(3000),

	// Database
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface DatabaseConfig {
	url: string;
}

export const databaseConfig = () => ({
	database: {
		url: process.env.DATABASE_URL,
	},
});
