import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, envSchema } from '@configs/configuration.config';
import { PrismaModule } from '@core/prisma/prisma.module';
import { DriveAccountsModule } from '@drive-account/drive-account.module';
import { UserModule } from '@user/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath:
				process.env.NODE_ENV === 'development' ? '.env.local' : '.env',
			load: [databaseConfig],
			cache: true,
			expandVariables: true,
			validate: (config) => {
				const result = envSchema.safeParse(config);
				if (!result.success) {
					console.error('❌ Invalid environment variables:');
					result.error.issues.forEach((issue) => {
						const path = issue.path.join('.') || 'root';
						console.error(`  - ${path}: ${issue.message}`);
					});
					throw new Error('Invalid environment variables');
				}
				return result.data;
			},
		}),
		PrismaModule,
		DriveAccountsModule,
		UserModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
