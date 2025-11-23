import { User, UserRole } from '@prisma/client';

export class UserResponseDto {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	role: UserRole;
	createdAt: string;
	updatedAt: string;

	public static fromEntity(user: Omit<User, 'password'>): UserResponseDto {
		return {
			id: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
			role: user.role,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		};
	}
}

export class LoginResponseDto {
	accessToken: string;
	refreshToken: string;
	user: UserResponseDto;

	public static fromServiceResponse(data: {
		accessToken: string;
		refreshToken: string;
		user: Omit<User, 'password'>;
	}): LoginResponseDto {
		return {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			user: UserResponseDto.fromEntity(data.user),
		};
	}
}
