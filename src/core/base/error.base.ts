import { ERROR_CODES, ErrorCode, HTTP_STATUS, HttpStatus } from './error-codes';

/**
 * Error Options for clean constructor
 */
export interface ErrorOptions {
	context?: Record<string, any>;
	originalError?: Error;
}

/**
 * Base Application Error
 */
export abstract class AppError extends Error {
	public readonly code: ErrorCode;
	public readonly statusCode: HttpStatus;
	public readonly context: Record<string, any>;
	public readonly timestamp: string;
	public readonly isOperational: boolean;
	public readonly originalError: Error | undefined;

	constructor(
		message: string,
		code: ErrorCode,
		statusCode: HttpStatus,
		options: ErrorOptions = {},
	) {
		super(message);

		this.name = this.constructor.name;
		this.code = code;
		this.statusCode = statusCode;
		this.context = options.context || {};
		this.timestamp = new Date().toISOString();
		this.isOperational = true;
		this.originalError = options.originalError;

		Error.captureStackTrace?.(this, this.constructor);
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			statusCode: this.statusCode,
			context: this.context,
			timestamp: this.timestamp,
			isOperational: this.isOperational,
			stack: this.stack,
			originalError: this.originalError
				? {
						name: this.originalError.name,
						message: this.originalError.message,
						stack: this.originalError.stack,
					}
				: undefined,
		};
	}

	toAPIResponse() {
		return {
			error: {
				code: this.code,
				message: this.message,
				timestamp: this.timestamp,
				...(process.env.NODE_ENV === 'development' && {
					stack: this.stack,
					context: this.context,
					originalError: this.originalError
						? {
								name: this.originalError.name,
								message: this.originalError.message,
								stack: this.originalError.stack,
							}
						: undefined,
				}),
			},
		};
	}

	/**
	 * Get complete error chain for logging
	 */
	getFullErrorChain(): string {
		let chain = `${this.name}: ${this.message}`;

		if (this.originalError) {
			chain += `\nCaused by: ${this.originalError.name}: ${this.originalError.message}`;
		}

		return chain;
	}

	/**
	 * Get all stack traces (current + original)
	 */
	getFullStackTrace(): string {
		let fullStack = `Current Error Stack:\n${this.stack}`;

		if (this.originalError?.stack) {
			fullStack += `\n\nOriginal Error Stack:\n${this.originalError.stack}`;
		}

		return fullStack;
	}
}

// =============================================
// Clean Error Classes với Static Factory Methods
// =============================================

/**
 * Validation Error - Input validation failures
 */
export class ValidationError extends AppError {
	constructor(message: string, options?: ErrorOptions) {
		super(
			message,
			ERROR_CODES.VALIDATION_ERROR,
			HTTP_STATUS.BAD_REQUEST,
			options,
		);
	}
}

/**
 * Not Found Error - Resource not found
 */
export class NotFoundError extends AppError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, options);
	}

	// Static factory methods
	static resource(resourceType: string, identifier?: string): NotFoundError {
		const message = identifier
			? `${resourceType} with identifier '${identifier}' not found`
			: `${resourceType} not found`;

		return new NotFoundError(message, {
			context: { resourceType, identifier },
		});
	}

	static entity(
		entityName: string,
		criteria: Record<string, any>,
	): NotFoundError {
		return new NotFoundError(`${entityName} not found`, {
			context: { entityName, criteria },
		});
	}
}

/**
 * Conflict Error - Resource already exists
 */
export class ConflictError extends AppError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, ERROR_CODES.ALREADY_EXISTS, HTTP_STATUS.CONFLICT, options);
	}

	// Static factory methods
	static duplicate(field: string, value: any): ConflictError {
		return new ConflictError(`${field} '${value}' already exists`, {
			context: { field, value, type: 'duplicate' },
		});
	}

	static constraint(constraint: string, message?: string): ConflictError {
		return new ConflictError(message || `Constraint violation: ${constraint}`, {
			context: { constraint, type: 'constraint' },
		});
	}

	static state(
		message: string,
		currentState: string,
		expectedState: string,
	): ConflictError {
		return new ConflictError(message, {
			context: { currentState, expectedState, type: 'state' },
		});
	}
}

/**
 * Business Rule Error - Business logic violations
 */
export class BusinessRuleError extends AppError {
	constructor(message: string, options?: ErrorOptions) {
		super(
			message,
			ERROR_CODES.BUSINESS_RULE_VIOLATION,
			HTTP_STATUS.BAD_REQUEST,
			options,
		);
	}

	// Static factory methods
	static rule(
		ruleName: string,
		message: string,
		violatedValue?: any,
	): BusinessRuleError {
		return new BusinessRuleError(message, {
			context: { rule: ruleName, violatedValue },
		});
	}

	static permission(action: string, resource: string): BusinessRuleError {
		return new BusinessRuleError(
			`Cannot ${action} ${resource}: insufficient permissions`,
			{
				context: { action, resource, type: 'permission' },
			},
		);
	}
}

/**
 * Unauthorized Error - Authentication required
 */
export class UnauthorizedError extends AppError {
	constructor(message?: string, options?: ErrorOptions) {
		super(
			message || 'Authentication required',
			ERROR_CODES.UNAUTHORIZED,
			HTTP_STATUS.UNAUTHORIZED,
			options,
		);
	}

	// Static factory methods
	static missingToken(): UnauthorizedError {
		return new UnauthorizedError('Missing authentication token', {
			context: { type: 'missing_token' },
		});
	}

	static invalidToken(): UnauthorizedError {
		return new UnauthorizedError('Invalid authentication token', {
			context: { type: 'invalid_token' },
		});
	}

	static expiredToken(): UnauthorizedError {
		return new UnauthorizedError('Authentication token has expired', {
			context: { type: 'expired_token' },
		});
	}

	static invalidCredentials(): UnauthorizedError {
		return new UnauthorizedError('Invalid credentials', {
			context: { type: 'invalid_credentials' },
		});
	}
}

/**
 * Forbidden Error - Access denied
 */
export class ForbiddenError extends AppError {
	constructor(message?: string, options?: ErrorOptions) {
		super(
			message || 'Access forbidden',
			ERROR_CODES.FORBIDDEN,
			HTTP_STATUS.FORBIDDEN,
			options,
		);
	}

	// Static factory methods
	static action(action: string, resource: string): ForbiddenError {
		return new ForbiddenError(`Cannot ${action} ${resource}`, {
			context: { action, resource, type: 'action' },
		});
	}

	static role(requiredRole: string, userRole?: string): ForbiddenError {
		return new ForbiddenError(`Requires ${requiredRole} role`, {
			context: { requiredRole, userRole, type: 'role' },
		});
	}
}

/**
 * Infrastructure Error - Database, external services
 */
export class InfrastructureError extends AppError {
	constructor(message: string, options?: ErrorOptions) {
		super(
			message,
			ERROR_CODES.INTERNAL_ERROR,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			options,
		);
	}

	// Static factory methods
	static database(
		operation: string,
		originalError?: Error,
	): InfrastructureError {
		return new InfrastructureError(`Database ${operation} failed`, {
			context: { service: 'database', operation },
			...(originalError && { originalError }),
		});
	}

	static service(
		serviceName: string,
		operation: string,
		originalError?: Error,
	): InfrastructureError {
		return new InfrastructureError(`${serviceName} ${operation} failed`, {
			context: { service: serviceName, operation },
			...(originalError && { originalError }),
		});
	}

	static connection(
		serviceName: string,
		originalError?: Error,
	): InfrastructureError {
		return new InfrastructureError(`Connection to ${serviceName} failed`, {
			context: { service: serviceName, type: 'connection' },
			...(originalError && { originalError }),
		});
	}

	static internal(message: string, originalError?: Error): InfrastructureError {
		return new InfrastructureError(message, {
			context: { type: 'internal' },
			...(originalError && { originalError }),
		});
	}
}

/**
 * External Service Error - Third-party API failures
 */
export class ExternalServiceError extends AppError {
	constructor(message: string, options?: ErrorOptions) {
		super(
			message,
			ERROR_CODES.EXTERNAL_SERVICE_ERROR,
			HTTP_STATUS.BAD_GATEWAY,
			options,
		);
	}

	// Static factory methods
	static api(
		serviceName: string,
		endpoint: string,
		statusCode?: number,
		originalError?: Error,
	): ExternalServiceError {
		return new ExternalServiceError(`${serviceName} API call failed`, {
			context: { service: serviceName, endpoint, statusCode },
			...(originalError && { originalError }),
		});
	}

	static timeout(serviceName: string, operation: string): ExternalServiceError {
		return new ExternalServiceError(`${serviceName} ${operation} timed out`, {
			context: { service: serviceName, operation, type: 'timeout' },
		});
	}

	static unavailable(serviceName: string): ExternalServiceError {
		return new ExternalServiceError(`${serviceName} is currently unavailable`, {
			context: { service: serviceName, type: 'unavailable' },
		});
	}
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
	constructor(message: string, options?: ErrorOptions) {
		super(
			message,
			ERROR_CODES.RATE_LIMIT_EXCEEDED,
			HTTP_STATUS.TOO_MANY_REQUESTS,
			options,
		);
	}

	// Static factory methods
	static exceeded(
		limit: number,
		window: string,
		resource: string,
	): RateLimitError {
		return new RateLimitError(
			`Rate limit exceeded: ${limit} requests per ${window} for ${resource}`,
			{
				context: { limit, window, resource },
			},
		);
	}

	static quota(quotaType: string, limit: number): RateLimitError {
		return new RateLimitError(`${quotaType} quota exceeded: ${limit}`, {
			context: { quotaType, limit, type: 'quota' },
		});
	}
}
