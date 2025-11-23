import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DriveAccountStatus } from '@prisma/client';

/**
 * Helper function to convert empty strings to undefined for optional query params
 */
const emptyStringToUndefined = (val: unknown) => (val === '' ? undefined : val);

/**
 * Zod Schema for fetching a list of Drive Accounts.
 * Handles pagination, filtering, and sorting.
 */
const ListDriveAccountQuerySchema = z.object({
	page: z.preprocess(
		emptyStringToUndefined,
		z.coerce.number().optional().default(1),
	),
	limit: z.preprocess(
		emptyStringToUndefined,
		z.coerce.number().max(100).optional().default(10),
	),
	status: z.preprocess(
		emptyStringToUndefined,
		z
			.enum([
				DriveAccountStatus.ACTIVE,
				DriveAccountStatus.INACTIVE,
				DriveAccountStatus.QUOTA_EXCEEDED,
				DriveAccountStatus.AUTH_ERROR,
			])
			.optional(),
	),
	search: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
	orderBy: z.preprocess(
		emptyStringToUndefined,
		z
			.enum(['id', 'createdAt', 'storageTotal', 'name', 'email'])
			.optional()
			.default('id'),
	),
	order: z.preprocess(
		emptyStringToUndefined,
		z.enum(['asc', 'desc']).optional().default('desc'),
	),
});

const ListDriveAccountQuery2Schema = z.object({
	page: z.coerce.number().optional().default(1),
	limit: z.coerce.number().max(100).optional().default(10),
	status: z
		.enum([
			DriveAccountStatus.ACTIVE,
			DriveAccountStatus.INACTIVE,
			DriveAccountStatus.QUOTA_EXCEEDED,
			DriveAccountStatus.AUTH_ERROR,
		])
		.optional(),
	search: z.string().trim().optional(),
	orderBy: z
		.enum(['id', 'createdAt', 'storageTotal', 'name', 'email'])
		.optional()
		.default('id'),
	order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class ListDriveAccountQueryDto extends createZodDto(
	ListDriveAccountQuery2Schema,
) {}
