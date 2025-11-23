import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface ICurrentUser {
	id: string;
	email: string;
	role: UserRole;
}

export const CurrentUser = createParamDecorator(
	(data: keyof ICurrentUser | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user;

		if (data) {
			return user?.[data];
		}

		return user;
	},
);
