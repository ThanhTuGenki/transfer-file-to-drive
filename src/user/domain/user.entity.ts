import { BaseEntity } from '@core/base';
import { User as PrismaUser, UserRole } from '@prisma/client';

/**
 * Interface defining the complete shape of the User entity.
 * This will be used as the generic 'T' in BaseEntity.
 */
export interface IUser {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	emailVerified: Date | null;
	role: UserRole;
	password?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export class User extends BaseEntity<IUser> {
	// --- Internal State ---
	private readonly _id: string;
	private readonly _email: string;
	private _name: string | null;
	private _image: string | null;
	private _emailVerified: Date | null;
	private readonly _role: UserRole;
	private readonly _password?: string | null;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	/**
	 * Private constructor forces creation through static factory methods.
	 */
	private constructor(props: IUser) {
		super();

		this._id = props.id;
		this._email = props.email;
		this._name = props.name;
		this._image = props.image;
		this._emailVerified = props.emailVerified;
		this._role = props.role;
		this._password = props.password;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;

		// !CRUCIAL: Capture the initial state AFTER all props are set
		this.setInitialState();
	}

	// --- Getters ---
	public get id(): string {
		return this._id;
	}
	public get email(): string {
		return this._email;
	}
	public get name(): string | null {
		return this._name;
	}
	public get image(): string | null {
		return this._image;
	}
	public get emailVerified(): Date | null {
		return this._emailVerified;
	}
	public get role(): UserRole {
		return this._role;
	}
	public get password(): string | null | undefined {
		return this._password;
	}
	public get createdAt(): Date {
		return this._createdAt;
	}
	public get updatedAt(): Date {
		return this._updatedAt;
	}

	/**
	 * [Factory] Hydrates an entity from database data (Prisma object).
	 */
	public static fromData(data: PrismaUser): User {
		const props: IUser = {
			id: data.id,
			email: data.email,
			name: data.name,
			image: data.image, // Prisma Client đã map avatar_url -> image rồi
			emailVerified: data.emailVerified,
			role: data.role,
			password: data.password,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
		};

		return new User(props);
	}

	/**
	 * [Factory] Creates a new entity instance (e.g. Register new user).
	 */
	public static create(props: {
		email: string;
		name?: string;
		image?: string;
		role?: UserRole;
		password?: string;
	}): User {
		const now = new Date();
		const entityProps: IUser = {
			id: '0',
			email: props.email,
			name: props.name || null,
			image: props.image || null,
			emailVerified: null,
			role: props.role || UserRole.USER,
			password: props.password || null,
			createdAt: now,
			updatedAt: now,
		};

		return new User(entityProps);
	}

	// !--- Abstract Method Implementations ---

	public toObject(): IUser {
		return {
			id: this._id,
			email: this._email,
			name: this._name,
			image: this._image,
			emailVerified: this._emailVerified,
			role: this._role,
			password: this._password,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt,
		};
	}

	protected getCurrentState(): Omit<IUser, 'id'> {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, ...currentState } = this.toObject();
		return currentState;
	}

	protected updateTimestamp(): void {
		this._updatedAt = new Date();
	}

	// !--- Business Logic ---

	public isAdmin(): boolean {
		return this._role === UserRole.ADMIN;
	}

	public updateProfile(name?: string, image?: string): void {
		if (name !== undefined) this._name = name;
		if (image !== undefined) this._image = image;
		this.updateTimestamp();
	}

	public verifyEmail(): void {
		this._emailVerified = new Date();
		this.updateTimestamp();
	}
}
