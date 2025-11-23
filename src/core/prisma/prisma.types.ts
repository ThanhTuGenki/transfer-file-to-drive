import { PrismaClient } from '@prisma/client';

export type PrismaTransactionClient = Omit<
	PrismaClient,
	| '$connect'
	| '$disconnect'
	| '$on'
	| '$queryRaw'
	| '$executeRaw'
	| '$queryRawUnsafe'
	| '$executeRawUnsafe'
	| '$transaction'
>;
