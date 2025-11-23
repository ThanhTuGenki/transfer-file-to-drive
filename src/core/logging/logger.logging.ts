import * as winston from 'winston';
import { TraceContextManager } from './trace.logging';

/**
 * Advanced Core Logger với Best Practices
 * - Structured logging với JSON format
 * - Auto trace context injection
 * - Layer-based logging
 * - Performance tracking
 */

// Custom log levels with numeric priorities
const logLevels = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	verbose: 4,
};

// Colors for console output
const logColors = {
	error: 'red',
	warn: 'yellow',
	info: 'green',
	debug: 'blue',
	verbose: 'gray',
};

winston.addColors(logColors);

/**
 * Custom winston format with trace context injection
 */
const createLogFormat = () => {
	return winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss.SSS',
		}),
		winston.format.errors({ stack: true }),
		winston.format.printf((info) => {
			// Auto-inject trace context vào mọi log entry
			const traceContext = TraceContextManager.getContextForLogging();

			// Merge info với trace context
			const logEntry: any = {
				timestamp: info.timestamp,
				service: info.service || 'share-up-core',
				layer: info.layer,
				environment: process.env.NODE_ENV || 'development',
				...traceContext, // traceId, userId, operation, etc.
				...info, // Original log data (will override level, message)
			};

			// Remove undefined values để clean JSON
			for (const key of Object.keys(logEntry)) {
				if (logEntry[key] === undefined) {
					delete logEntry[key];
				}
			}

			return JSON.stringify(logEntry);
		}),
	);
};

/**
 * Development format - human readable với colors
 */
const devFormat = winston.format.combine(
	winston.format.colorize({ all: true }),
	winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
	winston.format.printf(({ timestamp, level, message, layer, ...meta }) => {
		const traceContext = TraceContextManager.getContextForLogging();
		const traceId = traceContext.traceId
			? `[${traceContext.traceId.slice(-8)}]`
			: '';
		const layerLabel = typeof layer === 'string' && layer ? `[${layer}]` : '';
		const operation = traceContext.operation
			? `{${traceContext.operation}}`
			: '';

		// Filter sensitive data for display
		const cleanMeta = { ...meta };
		delete cleanMeta.password;
		delete cleanMeta.token;
		delete cleanMeta.secret;

		const metaStr = Object.keys(cleanMeta).length
			? JSON.stringify(cleanMeta, null, 2)
			: '';

		return `[${timestamp}] ${level} ${traceId}${layerLabel}${operation}: ${message} ${metaStr}`;
	}),
);

/**
 * Core Logger Instance
 */
export const logger = winston.createLogger({
	levels: logLevels,
	level: process.env.LOG_LEVEL || 'info',
	defaultMeta: {
		service: 'share-up-core',
		version: process.env.npm_package_version || '1.0.0',
	},
	transports: [
		new winston.transports.Console({
			format:
				process.env.NODE_ENV === 'production'
					? createLogFormat() // Production: Structured JSON
					: devFormat, // Development: Human readable
			silent: process.env.NODE_ENV === 'test',
		}),
	],
});

/**
 * Layer-specific loggers với auto context
 */
export const domainLogger = logger.child({
	layer: 'domain',
	component: 'business-logic',
});

export const applicationLogger = logger.child({
	layer: 'application',
	component: 'use-cases',
});

export const infrastructureLogger = logger.child({
	layer: 'infrastructure',
	component: 'external-services',
});

export const securityLogger = logger.child({
	layer: 'security',
	component: 'auth-audit',
});

/**
 * Advanced Logger Class với Best Practices
 */
export class Logger {
	// Layer-specific shortcuts
	static readonly domain = domainLogger;
	static readonly app = applicationLogger;
	static readonly infra = infrastructureLogger;
	static readonly security = securityLogger;

	/**
	 * General purpose logging methods
	 */
	static info(message: string, meta?: any) {
		logger.info(message, this.sanitizeData(meta));
	}

	static warn(message: string, meta?: any) {
		logger.warn(message, this.sanitizeData(meta));
	}

	static error(message: string, error?: Error, meta?: any) {
		logger.error(message, {
			error: error?.message,
			stack: error?.stack,
			name: error?.name,
			...this.sanitizeData(meta),
		});
	}

	static debug(message: string, meta?: any) {
		logger.debug(message, this.sanitizeData(meta));
	}

	/**
	 * Use case execution logging với performance tracking
	 */
	static logUseCase(
		useCase: string,
		action: 'start' | 'complete' | 'error',
		data?: any,
	) {
		const baseData = {
			useCase,
			action,
			timestamp: new Date().toISOString(),
		};

		if (action === 'start') {
			applicationLogger.info('Use case started', {
				...baseData,
				input: this.sanitizeData(data),
			});
		} else if (action === 'complete') {
			applicationLogger.info('Use case completed', {
				...baseData,
				result: this.sanitizeData(data),
			});
		} else if (action === 'error') {
			applicationLogger.error('Use case failed', { ...baseData, error: data });
		}
	}

	/**
	 * Domain operation logging
	 */
	static logDomain(entity: string, operation: string, data?: any) {
		domainLogger.info('Domain operation', {
			entity,
			operation,
			data: this.sanitizeData(data),
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Infrastructure operation logging với retry info
	 */
	static logInfrastructure(service: string, operation: string, data?: any) {
		infrastructureLogger.info('Infrastructure call', {
			service,
			operation,
			data: this.sanitizeData(data),
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Performance tracking với automatic timing
	 */
	static logPerformance(operation: string, duration: number, data?: any) {
		const level = duration > 1000 ? 'warn' : 'info'; // Warn if > 1s

		logger[level]('Performance metric', {
			type: 'performance',
			operation,
			duration: `${duration}ms`,
			slow: duration > 1000,
			data: this.sanitizeData(data),
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Data sanitization để remove sensitive info
	 */
	private static readonly sensitiveFields = [
		'password',
		'token',
		'secret',
		'key',
		'auth',
		'credential',
		'ssn',
		'creditCard',
		'bankAccount',
		'pin',
		'signature',
	];

	private static sanitizeData(data: any): any {
		if (!data || typeof data !== 'object') return data;

		const sanitized = Array.isArray(data) ? [...data] : { ...data };

		const sanitizeObject = (obj: any): any => {
			if (!obj || typeof obj !== 'object') return obj;

			for (const key of Object.keys(obj)) {
				const lowerKey = key.toLowerCase();
				const isSensitive = this.sensitiveFields.some((field) =>
					lowerKey.includes(field),
				);

				if (isSensitive) {
					obj[key] = '[REDACTED]';
				} else if (typeof obj[key] === 'object') {
					obj[key] = sanitizeObject(obj[key]);
				}
			}

			return obj;
		};

		return sanitizeObject(sanitized);
	}

	/**
	 * Create timed operation logger
	 */
	static createTimer(operation: string) {
		const startTime = Date.now();

		return {
			end: (data?: any) => {
				const duration = Date.now() - startTime;
				this.logPerformance(operation, duration, data);
				return duration;
			},
		};
	}

	/**
	 * Batch logging để reduce log volume
	 */
	private static batch: any[] = [];
	private static batchTimeout: NodeJS.Timeout | null = null;

	static addToBatch(entry: any) {
		this.batch.push(entry);

		this.batchTimeout ??= setTimeout(() => {
			this.flushBatch();
		}, 1000); // Flush every 1 second
	}

	private static flushBatch() {
		if (this.batch.length > 0) {
			logger.info('Batch log entries', {
				type: 'batch',
				count: this.batch.length,
				entries: this.batch,
				timestamp: new Date().toISOString(),
			});

			this.batch = [];
		}

		this.batchTimeout = null;
	}
}

export default logger;
