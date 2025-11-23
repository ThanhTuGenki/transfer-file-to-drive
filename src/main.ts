import { HttpExceptionFilter } from '@core/filters/http-exception.filter';
import { ResponseInterceptor } from '@core/interceptors/response.interceptor';
import { logger } from '@core/logging'; // Custom logger for application code
import { TraceMiddleware } from '@core/middlewares';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	// Keep NestJS default logger for framework logs (colorful, clean format)
	const app = await NestFactory.create(AppModule);

	// Global middlewares
	app.use(new TraceMiddleware().use);
	app.setGlobalPrefix('api/v1');

	// Enable shutdown hooks
	app.enableShutdownHooks();

	// Global filters
	app.useGlobalFilters(new HttpExceptionFilter());

	// Global interceptors
	app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

	const configService = app.get(ConfigService);
	const port = configService.get('PORT') ?? 3000;
	await app.listen(port);

	// This is YOUR custom application log (with JSON format)
	logger.info(`Application is ready and listening on port ${port}`, {
		context: 'Bootstrap',
	});
}

bootstrap();
