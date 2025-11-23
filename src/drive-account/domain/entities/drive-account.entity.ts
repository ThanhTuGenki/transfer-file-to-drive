import { BaseEntity } from '@core/base';
import {
	DriveAccount as PrismaDriveAccount,
	DriveAccountStatus,
} from '@prisma/client';

/**
 * Interface defining the complete shape of the DriveAccount entity.
 * This will be used as the generic 'T' in BaseEntity.
 */
export interface IDriveAccount {
	id: string;
	email: string;
	name: string;
	status: DriveAccountStatus;
	storageUsed: bigint;
	storageTotal: bigint;
	tokenExpiresAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export class DriveAccount extends BaseEntity<IDriveAccount> {
	// --- Internal State ---
	private readonly _id: string;
	private readonly _email: string;
	private _name: string;
	private _status: DriveAccountStatus;
	private _storageUsed: bigint;
	private _storageTotal: bigint;
	private _tokenExpiresAt: Date | null;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	/**
	 * Private constructor forces creation through static factory methods.
	 * It assigns all properties and then calls 'setInitialState'
	 * from the BaseEntity to capture the original state.
	 */
	private constructor(props: IDriveAccount) {
		super(); // Call BaseEntity empty constructor

		// Assign all properties from props
		this._id = props.id;
		this._email = props.email;
		this._name = props.name;
		this._status = props.status;
		this._storageUsed = props.storageUsed;
		this._storageTotal = props.storageTotal;
		this._tokenExpiresAt = props.tokenExpiresAt;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;

		// !CRUCIAL: Capture the initial state AFTER all props are set
		this.setInitialState();
	}

	public get id(): string {
		return this._id;
	}
	public get email(): string {
		return this._email;
	}
	public get name(): string {
		return this._name;
	}
	public get status(): DriveAccountStatus {
		return this._status;
	}
	public get storageUsed(): bigint {
		return this._storageUsed;
	}
	public get storageTotal(): bigint {
		return this._storageTotal;
	}
	public get tokenExpiresAt(): Date | null {
		return this._tokenExpiresAt;
	}
	public get createdAt(): Date {
		return this._createdAt;
	}
	public get updatedAt(): Date {
		return this._updatedAt;
	}

	/**
	 * [Factory] Hydrates an entity from database data (Prisma object).
	 * @param data The raw object from Prisma (contains bigint).
	 * @returns A DriveAccount entity instance.
	 */
	public static fromData(data: PrismaDriveAccount): DriveAccount {
		const props: IDriveAccount = {
			id: data.id,
			email: data.email,
			name: data.name,
			status: data.status,
			storageUsed: data.storageUsed,
			storageTotal: data.storageTotal,
			tokenExpiresAt: data.tokenExpiresAt,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
		};

		return new DriveAccount(props);
	}

	/**
	 * [Factory] Creates a new entity instance (not yet in DB).
	 * @param props Input properties for creation.
	 * @returns A new DriveAccount entity instance.
	 */
	public static create(props: { email: string; name: string }): DriveAccount {
		const now = new Date();
		const entityProps: IDriveAccount = {
			id: '0', // Temporary ID for a new entity
			email: props.email,
			name: props.name,
			status: DriveAccountStatus.INACTIVE,
			storageUsed: 0n,
			storageTotal: 0n,
			tokenExpiresAt: null,
			createdAt: now,
			updatedAt: now,
		};

		return new DriveAccount(entityProps);
	}

	// !--- Abstract Method Implementations ---

	/**
	 * [Implementation] Returns a full POJO of the entity.
	 */
	public toObject(): IDriveAccount {
		return {
			id: this._id,
			email: this._email,
			name: this._name,
			status: this._status,
			storageUsed: this._storageUsed,
			storageTotal: this._storageTotal,
			tokenExpiresAt: this._tokenExpiresAt,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt,
		};
	}

	/**
	 * [Implementation] Returns a snapshot of the current state, excluding 'id'.
	 * This is used by BaseEntity for dirty checking.
	 */
	protected getCurrentState(): Omit<IDriveAccount, 'id'> {
		// Use toObject() to get the full state, then destructure 'id' out
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, ...currentState } = this.toObject();
		return currentState;
	}

	// !--- Business Logic ---
	// (These methods now automatically update 'updatedAt'
	//  and make the entity 'dirty')

	/**
	 * Activates the drive account.
	 */
	public activate(): void {
		this._status = DriveAccountStatus.ACTIVE;
		this.updateTimestamp();
	}

	/**
	 * Deactivates the drive account with an optional reason.
	 * @param reason The status to set (e.g., INACTIVE, QUOTA_EXCEEDED).
	 */
	public deactivate(
		reason: DriveAccountStatus = DriveAccountStatus.INACTIVE,
	): void {
		this._status = reason;
		this.updateTimestamp();
	}

	/**
	 * Updates the storage metrics from the cloud provider.
	 */
	public updateStorage(used: bigint, total: bigint): void {
		this._storageUsed = used;
		this._storageTotal = total;
		this.updateTimestamp();
	}

	/**
	 * Updates token information after a successful refresh.
	 * Automatically activates the account.
	 */
	public updateTokenInfo(expiresAt: Date): void {
		this._tokenExpiresAt = expiresAt;
		this.activate(); // Re-activate account on successful token refresh
	}

	/**
	 * Checks if the auth token is expired or missing.
	 */
	public isTokenExpired(): boolean {
		if (!this._tokenExpiresAt) return true;
		return this._tokenExpiresAt < new Date();
	}

	/**
	 * Checks if the account has enough free space.
	 * @param requiredSpace Space needed, in bytes (bigint).
	 */
	public hasSufficientSpace(requiredSpace: bigint): boolean {
		if (this._storageTotal === 0n) return false;
		const freeSpace = this._storageTotal - this._storageUsed;
		return freeSpace > requiredSpace;
	}

	/**
	 * Calculates the storage usage percentage.
	 * @returns A number (e.g., 33.5) representing the percentage.
	 */
	public getUsagePercentage(): number {
		if (this._storageTotal === 0n) return 0;
		const used = Number(this._storageUsed);
		const total = Number(this._storageTotal);
		return Math.round((used / total) * 1000) / 10;
	}

	/**
	 * Checks if the account is in a usable state (active and token is valid).
	 */
	public isUsable(): boolean {
		return this._status === DriveAccountStatus.ACTIVE && !this.isTokenExpired();
	}

	public markAsUpdateAPI(payload: {
		name?: string;
		status?: DriveAccountStatus;
	}): void {
		this._name = payload.name ?? this._name;
		this._status = payload.status ?? this._status;
		this.updateTimestamp();
	}

	// --- Protected Timestamp Update ---
	/**
	 * Overrides the base method to update our local private property.
	 */
	protected updateTimestamp(): void {
		this._updatedAt = new Date();
	}
}
