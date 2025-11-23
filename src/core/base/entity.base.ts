import { isEqual } from 'lodash';

/**
 * Base class for all domain entities.
 * Implements "Dirty Checking" to track changes.
 * @template T - The type of the entity's full properties (as an interface).
 */
export abstract class BaseEntity<T> {
	/**
	 * Stores the original state of the entity when it was first hydrated.
	 * We compare against this state to find changes.
	 * We Omit 'id' because the ID is immutable and not part of "changes".
	 */
	protected _originalState: Omit<T, 'id'> | null = null;
	private _isInitialized = false;

	/**
	 * Base constructor is kept empty.
	 * Initialization is handled by subclasses.
	 */
	protected constructor() {}

	/**
	 * [Abstract] Subclasses must implement this.
	 * It should return a "snapshot" of the entity's current state,
	 * excluding the 'id'.
	 */
	protected abstract getCurrentState(): Omit<T, 'id'>;

	/**
	 * [Abstract] Subclasses must implement this.
	 * It should return a full Plain Old JavaScript Object (POJO)
	 * representation of the entity, including the 'id'.
	 */
	public abstract toObject(): T;

	/**
	 * Called by the subclass's constructor AFTER all properties
	 * have been assigned. This captures the initial state.
	 */
	protected setInitialState(): void {
		if (!this._isInitialized) {
			this._originalState = this.getCurrentState();
			this._isInitialized = true;
		}
	}

	/**
	 * Ensures the initial state has been captured before
	 * performing any comparisons.
	 */
	private ensureInitialized(): void {
		if (!this._isInitialized) {
			this.setInitialState();
		}
	}

	/**
	 * Checks if the entity's current state is different
	 * from its original state.
	 * @returns {boolean} True if changes are detected, false otherwise.
	 */
	public isDirty(): boolean {
		this.ensureInitialized();
		const changes = this.getChanges();
		return Object.keys(changes).length > 0;
	}

	/**
	 * Compares the original state with the current state and returns
	 * an object containing only the fields that have changed.
	 * @returns {Partial<Omit<T, 'id'>>} An object with the changed fields.
	 */
	public getChanges(): Partial<Omit<T, 'id'>> {
		this.ensureInitialized();
		const currentState = this.getCurrentState();
		const keys = Object.keys(currentState) as Array<keyof typeof currentState>;

		return keys.reduce(
			(acc, key) => {
				const originalValue = this._originalState![key];
				const currentValue = currentState[key];

				// Use Lodash's isEqual for a robust, deep comparison
				if (
					!isEqual(originalValue, currentValue) &&
					currentValue !== undefined
				) {
					acc[key] = currentValue;
				}
				return acc;
			},
			{} as Partial<Omit<T, 'id'>>,
		);
	}

	/**
	 * Gets the changed fields in a format ready for a Prisma 'update' query.
	 * Since Prisma schema uses @map to handle snake_case mapping automatically,
	 * we return camelCase keys directly (Prisma will map them to DB columns).
	 * @returns {Record<string, unknown> | null} An object for Prisma, or null if no changes.
	 */
	public getUpdateClause(): Record<string, unknown> | null {
		const changedFields = this.getChanges();

		if (Object.keys(changedFields).length === 0) {
			return null; // No changes, no update needed
		}

		// Return camelCase keys directly - Prisma @map will handle DB column mapping
		return changedFields as Record<string, unknown>;
	}
}
