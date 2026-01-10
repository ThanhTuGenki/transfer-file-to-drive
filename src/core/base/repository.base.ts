import { PrismaTransactionClient } from '../prisma/prisma.types';
import { BaseEntity } from './entity.base';
import { PrismaService } from '@core/prisma/prisma.service';

export interface PrismaDelegateConstraint {
	// Find methods
	findUnique(args: any): Promise<any>;
	findUniqueOrThrow(args: any): Promise<any>;
	findFirst(args?: any): Promise<any>;
	findFirstOrThrow(args?: any): Promise<any>;
	findMany(args?: any): Promise<any[]>;

	// Create methods
	create(args: any): Promise<any>;
	createMany(args: any): Promise<any>;

	// Update methods
	update(args: any): Promise<any>;
	updateMany(args: any): Promise<any>;
	upsert(args: any): Promise<any>;

	// Delete methods
	delete(args: any): Promise<any>;
	deleteMany(args: any): Promise<any>;

	// Aggregation methods
	count(args?: any): Promise<number>;
	aggregate(args: any): Promise<any>;
	groupBy(args: any): Promise<any>;
}

/**
 * The base contract (interface) for all repositories.
 *
 * @template T - The type of the Domain Entity (must extend BaseEntity AND have an 'id' property).
 */
export interface IBaseRepository<T extends BaseEntity<any> & { id: string }> {
	/**
	 * Finds a single entity by its unique ID.
	 */
	findById(id: string, tx?: PrismaTransactionClient): Promise<T | null>;

	/**
	 * Persists the state of an entity (either creates or updates).
	 * @returns A Promise resolving to the *persisted entity*.
	 */
	save(entity: T, tx?: PrismaTransactionClient): Promise<T>;

	/**
	 * Deletes a single entity.
	 */
	delete(entity: T, tx?: PrismaTransactionClient): Promise<void>;

	/**
	 * Efficiently deletes multiple entities by their IDs.
	 * @returns A Promise resolving to the *number* of entities actually deleted.
	 */
	deleteByIds(ids: string[], tx?: PrismaTransactionClient): Promise<number>;

	/**
	 * Efficiently creates multiple new entities.
	 * @returns A Promise resolving to an *array of the created entities*.
	 */
	createMany(entities: T[], tx?: PrismaTransactionClient): Promise<T[]>;
}

/**
 * Abstract base class for Prisma-based repositories.
 * Implements the common IBaseRepository methods.
 *
 * @template TEntity The domain entity type (e.g., DriveAccount)
 * @template TPrismaModel The raw Prisma model type (e.g., PrismaDriveAccount)
 * @template TPrismaCreateInput The Prisma create input type
 * @template TPrismaDelegate The Prisma delegate type (e.g., PrismaClient['driveAccount'])
 */
export abstract class PrismaBaseRepository<
	TEntity extends BaseEntity<any> & { id: string },
	TPrismaModel,
	TPrismaCreateInput,
	TPrismaDelegate extends PrismaDelegateConstraint = any,
> implements IBaseRepository<TEntity> {
	/**
	 * The default (global) Prisma model delegate (e.g., this.prisma.driveAccount).
	 */
	private readonly _model: TPrismaDelegate;

	/**
	 * The string name of the model (e.g., 'driveAccount').
	 * Used for dynamic calls inside transactions.
	 */
	private readonly _modelName: keyof PrismaService;

	/**
	 * [Abstract] Subclass MUST implement this.
	 * Maps a raw Prisma model object to a domain entity.
	 */
	protected abstract fromData(data: TPrismaModel): TEntity;

	/**
	 * [Abstract] Subclass MUST implement this.
	 * Maps a domain entity to a Prisma create input object.
	 */
	protected abstract mapEntityToCreateInput(
		entity: TEntity,
	): TPrismaCreateInput;

	/**
	 * @param prisma The injected PrismaService.
	 * @param modelName The string key of the model in the PrismaClient (e.g., 'driveAccount').
	 */
	constructor(
		protected readonly prisma: PrismaService,
		modelName: keyof PrismaService,
	) {
		this._model = this.prisma[modelName] as unknown as TPrismaDelegate;
		this._modelName = modelName; // Store the string name
	}

	/**
	 * Gets the correct Prisma client (global or transactional)
	 * and returns the specific model delegate.
	 */
	public getClient(tx?: PrismaTransactionClient): TPrismaDelegate {
		// If 'tx' exists, use it. Otherwise, use the default global '_model'.
		// We use the string '_modelName' to access the delegate on the tx object.
		return (tx ? tx[this._modelName] : this._model) as TPrismaDelegate;
	}

	// !--- Implementation of IBaseRepository ---

	async findById(
		id: string,
		tx?: PrismaTransactionClient,
	): Promise<TEntity | null> {
		const client = this.getClient(tx);
		const data = await client.findUnique({
			where: { id: id },
		});

		if (!data) return null;
		return this.fromData(data);
	}

	async save(entity: TEntity, tx?: PrismaTransactionClient): Promise<TEntity> {
		if (entity.id === '0') {
			return this.create(entity, tx);
		} else {
			return this.update(entity, tx);
		}
	}

	async delete(entity: TEntity, tx?: PrismaTransactionClient): Promise<void> {
		const client = this.getClient(tx);
		await client.delete({
			where: { id: entity.id },
		});
	}

	async deleteByIds(
		ids: string[],
		tx?: PrismaTransactionClient,
	): Promise<number> {
		const client = this.getClient(tx);
		const result = await client.deleteMany({
			where: { id: { in: ids } },
		});
		return result.count;
	}

	async createMany(
		entities: TEntity[],
		tx?: PrismaTransactionClient, // Type from 'src/core/prisma/prisma.types.ts'
	): Promise<TEntity[]> {
		// 1. Map TEntity (domain) to TPrismaCreateInput (prisma data)
		// This one also needs an arrow function to preserve 'this'
		const createData = entities.map((entity) =>
			this.mapEntityToCreateInput(entity),
		);

		if (tx) {
			// --- CASE 1: Already inside a transaction (tx) ---
			// Run 'create' calls directly on the 'tx' client.
			const createdData = await Promise.all(
				createData.map((data) =>
					(tx as any)[this._modelName].create({ data: data }),
				),
			);

			return createdData.map((data) => this.fromData(data));
		} else {
			// --- CASE 2: No transaction provided ---
			// Create a new transaction using 'this.prisma' for atomicity.
			const createdData = await this.prisma.$transaction(
				createData.map((data) =>
					(this.prisma as any)[this._modelName].create({ data: data }),
				),
			);

			return createdData.map((data) => this.fromData(data));
		}
	}

	// !--- Public Helper Methods ---
	// These methods are exposed to allow concrete repositories to implement
	// their own create/update methods if needed by their interfaces

	public async create(
		entity: TEntity,
		tx?: PrismaTransactionClient,
	): Promise<TEntity> {
		const client = this.getClient(tx);
		const createData = this.mapEntityToCreateInput(entity);

		const newData = await client.create({
			data: createData,
		});

		return this.fromData(newData);
	}

	public async update(
		entity: TEntity,
		tx?: PrismaTransactionClient,
	): Promise<TEntity> {
		const client = this.getClient(tx);
		if (!entity.isDirty()) {
			return entity; // No changes, return original entity
		}

		const updateData = entity.getUpdateClause();
		if (!updateData) {
			return entity; // No detectable changes
		}

		const updatedData = await client.update({
			where: { id: entity.id },
			data: updateData,
		});

		return this.fromData(updatedData);
	}
}
