import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TraceContextManager } from '@core/logging/trace.logging';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const traceContext = TraceContextManager.createFromHeaders(
			req.headers as any,
		);

		traceContext.requestMethod = req.method;
		traceContext.requestPath = req.url;
		traceContext.ip = req.ip;

		TraceContextManager.run(traceContext, () => {
			next();
		});
	}
}
