import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '@core/decorators/response-message.decorator';

export interface IMeta {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
}

export interface IPaginatedData<T> {
	items: T[];
	meta: IMeta;
}

export interface ISuccessResponse<T> {
	status: 'success';
	message: string;
	data: T;
	meta?: IMeta;
}

function isPaginatedData(data: unknown): data is IPaginatedData<unknown> {
	return (
		typeof data === 'object' &&
		data !== null &&
		Object.hasOwn(data, 'items') &&
		Object.hasOwn(data, 'meta') &&
		Array.isArray((data as IPaginatedData<unknown>).items)
	);
}

@Injectable()
export class ResponseInterceptor<T>
	implements NestInterceptor<T, ISuccessResponse<unknown>> {
	constructor(private readonly reflector: Reflector) { }

	intercept(
		context: ExecutionContext,
		next: CallHandler<T>,
	): Observable<ISuccessResponse<unknown>> {
		const message =
			this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ||
			'Request successful';

		return next.handle().pipe(
			map((data: T) => {
				let responseData: unknown = data;
				let meta: IMeta | undefined = undefined;

				if (isPaginatedData(data)) {
					meta = data.meta;
					responseData = data.items;
				}

				return {
					status: 'success',
					message: message,
					data: responseData,
					...(meta && { meta }),
				};
			}),
		);
	}
}