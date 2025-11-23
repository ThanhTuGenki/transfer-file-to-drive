import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodError } from 'zod';
import { AppError, InfrastructureError } from '../base/error.base';

interface IZodErrorResponse {
	message: string;
	errors: ZodError['issues'];
}

interface IHttpErrorResponse {
	message: string | string[];
	error?: string;
	statusCode: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		if (exception instanceof ZodValidationException) {
			const zodError = exception.getZodError() as ZodError | undefined;
			const errorResponse = exception.getResponse() as
				| IZodErrorResponse
				| string;

			const message =
				typeof errorResponse === 'object' && errorResponse !== null
					? errorResponse.message || 'Validation failed'
					: 'Validation failed';

			return response.status(400).json({
				status: 'fail',
				message: message,
				data: zodError?.issues || [],
			});
		}

		if (exception instanceof AppError) {
			if (exception instanceof InfrastructureError) {
				console.error('Infrastructure Error:', exception);
			}

			return response.status(exception.statusCode).json({
				status: 'fail',
				message: exception.code,
			});
		}

		if (exception instanceof HttpException) {
			const statusCode = exception.getStatus();
			const status = statusCode >= 500 ? 'error' : 'fail';
			const errorResponse = exception.getResponse();

			let message = exception.message;

			if (
				typeof errorResponse === 'object' &&
				errorResponse !== null &&
				'message' in errorResponse
			) {
				message = (errorResponse as IHttpErrorResponse).message as string;
			} else if (typeof errorResponse === 'string') {
				message = errorResponse;
			}

			return response.status(statusCode).json({
				status: status,
				message: message,
			});
		}

		console.error('Unhandled Exception:', exception);
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			status: 'error',
			message: 'An internal server error occurred',
		});
	}
}
