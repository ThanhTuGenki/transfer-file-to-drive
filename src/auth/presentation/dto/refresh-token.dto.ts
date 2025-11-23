import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RefreshTokenSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

export class RefreshTokenResponseDto {
	accessToken: string;
	refreshToken: string;

	public static fromServiceResponse(data: {
		accessToken: string;
		refreshToken: string;
	}): RefreshTokenResponseDto {
		return {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
		};
	}
}

