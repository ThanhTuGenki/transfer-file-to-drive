import { LoggerService } from '@nestjs/common';
import { Logger as AppLogger } from './logger.logging';

export class NestLoggerAdapter implements LoggerService {
	log(message: string, context?: string) {
		AppLogger.info(message, { context });
	}

	error(message: string, trace?: string, context?: string) {
		const error = trace ? new Error(trace) : undefined;
		AppLogger.error(message, error, { context });
	}

	warn(message: string, context?: string) {
		AppLogger.warn(message, { context });
	}

	debug(message: string, context?: string) {
		AppLogger.debug(message, { context });
	}

	verbose(message: string, context?: string) {
		AppLogger.debug(message, { context });
	}
}
