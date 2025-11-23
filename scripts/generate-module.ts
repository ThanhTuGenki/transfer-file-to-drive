#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function question(query: string): Promise<string> {
	return new Promise((resolve) => rl.question(query, resolve));
}

function toPascalCase(str: string): string {
	return str
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

function toKebabCase(str: string): string {
	return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function ensureDir(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		console.log(`✅ Created directory: ${dirPath}`);
	}
}

function writeFile(filePath: string, content: string): void {
	fs.writeFileSync(filePath, content, 'utf8');
	console.log(`✅ Created file: ${filePath}`);
}

// Template generators
function generateEntityTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { BaseEntity } from '@core/base';

/**
 * Interface defining the complete shape of the ${pascalName} entity.
 */
export interface I${pascalName} {
	id: string;
	// TODO: Add your entity properties here
	createdAt: Date;
	updatedAt: Date;
}

export class ${pascalName} extends BaseEntity<I${pascalName}> {
	// --- Internal State ---
	private readonly _id: string;
	// TODO: Add private properties
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(props: I${pascalName}) {
		super();
		this._id = props.id;
		// TODO: Assign properties
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
		this.setInitialState();
	}

	// --- Getters ---
	public get id(): string {
		return this._id;
	}

	public get createdAt(): Date {
		return this._createdAt;
	}

	public get updatedAt(): Date {
		return this._updatedAt;
	}

	// --- Factory Methods ---
	public static fromData(data: any): ${pascalName} {
		const props: I${pascalName} = {
			id: data.id,
			// TODO: Map data properties
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
		};
		return new ${pascalName}(props);
	}

	public static create(props: {
		// TODO: Add creation properties
	}): ${pascalName} {
		const now = new Date();
		const entityProps: I${pascalName} = {
			id: '0', // Temporary ID
			// TODO: Map creation properties
			createdAt: now,
			updatedAt: now,
		};
		return new ${pascalName}(entityProps);
	}

	// --- Abstract Method Implementations ---
	public toObject(): I${pascalName} {
		return {
			id: this._id,
			// TODO: Return all properties
			createdAt: this._createdAt,
			updatedAt: this._updatedAt,
		};
	}

	protected getCurrentState(): Omit<I${pascalName}, 'id'> {
		const { id, ...currentState } = this.toObject();
		return currentState;
	}

	// --- Business Logic ---
	// TODO: Add business methods here

	protected updateTimestamp(): void {
		this._updatedAt = new Date();
	}
}
`;
}

function generateRepositoryInterfaceTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { IBaseRepository } from '@core/base';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { ${pascalName} } from '../../domain/entities/${moduleName}.entity';

export const ${pascalName.toUpperCase()}_REPOSITORY = '${pascalName.toUpperCase()}_REPOSITORY';

export interface I${pascalName}Repository extends IBaseRepository<${pascalName}> {
	// TODO: Add custom repository methods here
	// Example:
	// findByEmail(email: string, tx?: PrismaTransactionClient): Promise<${pascalName} | null>;
}
`;
}

function generateRepositoryImplementationTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { ${pascalName} } from '../domain/entities/${moduleName}.entity';
import { Prisma } from '@prisma/client';
import { PrismaBaseRepository } from '@core/base';
import { I${pascalName}Repository } from '../application/interfaces/${moduleName}.repository.interface';

@Injectable()
export class Prisma${pascalName}Repository
	extends PrismaBaseRepository<
		${pascalName},
		any, // TODO: Replace with Prisma${pascalName} type
		any, // TODO: Replace with Prisma.${pascalName}CreateInput
		any  // TODO: Replace with Prisma.${pascalName}Delegate
	>
	implements I${pascalName}Repository
{
	constructor(protected readonly prisma: PrismaService) {
		super(prisma, '${moduleName}'); // TODO: Update delegate name
	}

	protected fromData(data: any): ${pascalName} {
		return ${pascalName}.fromData(data);
	}

	protected mapEntityToCreateInput(entity: ${pascalName}): any {
		const { id, ...data } = entity.toObject();
		return data;
	}

	// TODO: Implement custom repository methods
}
`;
}

function generateServiceTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Injectable } from '@nestjs/common';
import { ${pascalName} } from '../domain/entities/${moduleName}.entity';
import {
	Create${pascalName}Dto,
	Update${pascalName}Dto,
	List${pascalName}QueryDto,
} from '../presentation/dto';
import {
	Create${pascalName}UseCase,
	Get${pascalName}UseCase,
	List${pascalName}sUseCase,
	Update${pascalName}UseCase,
	Delete${pascalName}sUseCase,
} from './use-cases';

@Injectable()
export class ${pascalName}Service {
	constructor(
		private readonly createUseCase: Create${pascalName}UseCase,
		private readonly getUseCase: Get${pascalName}UseCase,
		private readonly listUseCase: List${pascalName}sUseCase,
		private readonly updateUseCase: Update${pascalName}UseCase,
		private readonly deleteUseCase: Delete${pascalName}sUseCase,
	) {}

	async create(dto: Create${pascalName}Dto): Promise<${pascalName}> {
		return this.createUseCase.execute(dto);
	}

	async findOne(id: string): Promise<${pascalName}> {
		return this.getUseCase.execute(id);
	}

	async list(query: List${pascalName}QueryDto): Promise<[${pascalName}[], number]> {
		return this.listUseCase.execute(query);
	}

	async update(id: string, dto: Update${pascalName}Dto): Promise<${pascalName}> {
		return this.updateUseCase.execute(id, dto);
	}

	async deleteMany(ids: string[]): Promise<void> {
		return this.deleteUseCase.execute(ids);
	}
}
`;
}

function generateControllerTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { 
	Controller, 
	Get, 
	Post, 
	Put, 
	Delete, 
	Body, 
	Param, 
	Query,
	HttpCode,
	HttpStatus 
} from '@nestjs/common';
import { ${pascalName}Service } from '../application/${moduleName}.service';
import { ResponseMessage } from '@core/decorators/response-message.decorator';
import {
	Create${pascalName}Dto,
	Update${pascalName}Dto,
	List${pascalName}QueryDto,
	Delete${pascalName}Dto,
	${pascalName}ResponseDto,
} from './dto';

@Controller('${moduleName}s')
export class ${pascalName}Controller {
	constructor(private readonly ${moduleName}Service: ${pascalName}Service) {}

	@Post()
	@ResponseMessage('${pascalName} created successfully')
	async create(@Body() dto: Create${pascalName}Dto) {
		const entity = await this.${moduleName}Service.create(dto);
		return ${pascalName}ResponseDto.fromEntity(entity);
	}

	@Get(':id')
	@ResponseMessage('${pascalName} retrieved successfully')
	async getById(@Param('id') id: string) {
		const entity = await this.${moduleName}Service.findOne(id);
		return ${pascalName}ResponseDto.fromEntity(entity);
	}

	@Get()
	@ResponseMessage('${pascalName}s listed successfully')
	async list(@Query() query: List${pascalName}QueryDto) {
		const [entities, total] = await this.${moduleName}Service.list(query);
		return {
			data: entities.map((e) => ${pascalName}ResponseDto.fromEntity(e)),
			meta: {
				total,
				page: query.page,
				limit: query.limit,
			},
		};
	}

	@Put(':id')
	@ResponseMessage('${pascalName} updated successfully')
	async update(@Param('id') id: string, @Body() dto: Update${pascalName}Dto) {
		const entity = await this.${moduleName}Service.update(id, dto);
		return ${pascalName}ResponseDto.fromEntity(entity);
	}

	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ResponseMessage('${pascalName}s deleted successfully')
	async deleteMany(@Body() dto: Delete${pascalName}Dto) {
		await this.${moduleName}Service.deleteMany(dto.ids);
	}
}
`;
}

function generateModuleTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';
import { ${pascalName}Service } from './application/${moduleName}.service';
import { ${pascalName.toUpperCase()}_REPOSITORY } from './application/interfaces/${moduleName}.repository.interface';
import { Prisma${pascalName}Repository } from './infrastructure/prisma-${moduleName}.repository';
import { ${pascalName}Controller } from './presentation/${moduleName}.controller';
import {
	Create${pascalName}UseCase,
	Get${pascalName}UseCase,
	List${pascalName}sUseCase,
	Update${pascalName}UseCase,
	Delete${pascalName}sUseCase,
} from './application/use-cases';

@Module({
	imports: [PrismaModule],
	controllers: [${pascalName}Controller],
	providers: [
		${pascalName}Service,
		{
			provide: ${pascalName.toUpperCase()}_REPOSITORY,
			useClass: Prisma${pascalName}Repository,
		},
		Create${pascalName}UseCase,
		Get${pascalName}UseCase,
		List${pascalName}sUseCase,
		Update${pascalName}UseCase,
		Delete${pascalName}sUseCase,
	],
	exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`;
}

function generateResponseDtoTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { ${pascalName} as ${pascalName}Entity } from '@${moduleName}/domain/entities/${moduleName}.entity';

export class ${pascalName}ResponseDto {
	id: string;
	// TODO: Add DTO properties
	createdAt: string;
	updatedAt: string;

	public static fromEntity(entity: ${pascalName}Entity): ${pascalName}ResponseDto {
		return {
			id: entity.id,
			// TODO: Map entity properties
			createdAt: entity.createdAt.toISOString(),
			updatedAt: entity.updatedAt.toISOString(),
		};
	}
}
`;
}

function generateDtoIndexTemplate(moduleName: string): string {
	return `export * from './create-${moduleName}.dto';
export * from './update-${moduleName}.dto';
export * from './get-${moduleName}.dto';
export * from './list-${moduleName}.query.dto';
export * from './delete-${moduleName}.dto';
export * from './${moduleName}.response.dto';
`;
}

function generateCreateDtoTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { IsString, IsNotEmpty } from 'class-validator';

export class Create${pascalName}Dto {
	@IsString()
	@IsNotEmpty()
	name: string;

	// TODO: Add more DTO properties
}
`;
}

function generateUpdateDtoTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { IsString, IsOptional } from 'class-validator';

export class Update${pascalName}Dto {
	@IsString()
	@IsOptional()
	name?: string;

	// TODO: Add more DTO properties
}
`;
}

function generateGetDtoTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { IsString, IsNotEmpty } from 'class-validator';

export class Get${pascalName}Dto {
	@IsString()
	@IsNotEmpty()
	id: string;
}
`;
}

function generateListQueryDtoTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class List${pascalName}QueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number = 10;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	orderBy?: string = 'createdAt';

	@IsOptional()
	@IsIn(['asc', 'desc'])
	order?: 'asc' | 'desc' = 'desc';

	// TODO: Add more filter properties
}
`;
}

function generateDeleteDtoTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { IsArray, IsString } from 'class-validator';

export class Delete${pascalName}Dto {
	@IsArray()
	@IsString({ each: true })
	ids: string[];
}
`;
}

function generateCreateUseCaseTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ${pascalName} } from '../../domain/entities/${moduleName}.entity';
import { Create${pascalName}Dto } from '../../presentation/dto/create-${moduleName}.dto';
import {
	${pascalName.toUpperCase()}_REPOSITORY,
	I${pascalName}Repository,
} from '../interfaces/${moduleName}.repository.interface';

@Injectable()
export class Create${pascalName}UseCase {
	constructor(
		@Inject(${pascalName.toUpperCase()}_REPOSITORY)
		private readonly ${moduleName}Repo: I${pascalName}Repository,
	) {}

	async execute(dto: Create${pascalName}Dto): Promise<${pascalName}> {
		// TODO: Add business logic validation
		
		const new${pascalName} = ${pascalName}.create({
			name: dto.name,
			// TODO: Map DTO properties
		});

		return this.${moduleName}Repo.save(new${pascalName});
	}
}
`;
}

function generateGetUseCaseTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ${pascalName} } from '../../domain/entities/${moduleName}.entity';
import {
	${pascalName.toUpperCase()}_REPOSITORY,
	I${pascalName}Repository,
} from '../interfaces/${moduleName}.repository.interface';

@Injectable()
export class Get${pascalName}UseCase {
	constructor(
		@Inject(${pascalName.toUpperCase()}_REPOSITORY)
		private readonly ${moduleName}Repo: I${pascalName}Repository,
	) {}

	async execute(id: string): Promise<${pascalName}> {
		const entity = await this.${moduleName}Repo.findById(id);

		if (!entity) {
			throw new NotFoundException(\`${pascalName} with ID '\${id}' not found.\`);
		}

		return entity;
	}
}
`;
}

function generateListUseCaseTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Injectable, Inject } from '@nestjs/common';
import { ${pascalName} } from '../../domain/entities/${moduleName}.entity';
import { List${pascalName}QueryDto } from '../../presentation/dto/list-${moduleName}.query.dto';
import {
	${pascalName.toUpperCase()}_REPOSITORY,
	I${pascalName}Repository,
} from '../interfaces/${moduleName}.repository.interface';

@Injectable()
export class List${pascalName}sUseCase {
	constructor(
		@Inject(${pascalName.toUpperCase()}_REPOSITORY)
		private readonly ${moduleName}Repo: I${pascalName}Repository,
	) {}

	async execute(query: List${pascalName}QueryDto): Promise<[${pascalName}[], number]> {
		const skip = (query.page - 1) * query.limit;
		const take = query.limit;

		// TODO: Implement findManyWithCount in repository
		return this.${moduleName}Repo.findManyWithCount({
			skip,
			take,
			search: query.search,
			orderBy: query.orderBy,
			order: query.order,
		});
	}
}
`;
}

function generateUpdateUseCaseTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ${pascalName} } from '../../domain/entities/${moduleName}.entity';
import { Update${pascalName}Dto } from '../../presentation/dto/update-${moduleName}.dto';
import {
	${pascalName.toUpperCase()}_REPOSITORY,
	I${pascalName}Repository,
} from '../interfaces/${moduleName}.repository.interface';

@Injectable()
export class Update${pascalName}UseCase {
	constructor(
		@Inject(${pascalName.toUpperCase()}_REPOSITORY)
		private readonly ${moduleName}Repo: I${pascalName}Repository,
	) {}

	async execute(id: string, dto: Update${pascalName}Dto): Promise<${pascalName}> {
		const entity = await this.${moduleName}Repo.findById(id);

		if (!entity) {
			throw new NotFoundException(\`${pascalName} with ID '\${id}' not found.\`);
		}

		// TODO: Update entity properties
		// entity.updateName(dto.name);

		return this.${moduleName}Repo.save(entity);
	}
}
`;
}

function generateDeleteUseCaseTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `import { Injectable, Inject } from '@nestjs/common';
import {
	${pascalName.toUpperCase()}_REPOSITORY,
	I${pascalName}Repository,
} from '../interfaces/${moduleName}.repository.interface';

@Injectable()
export class Delete${pascalName}sUseCase {
	constructor(
		@Inject(${pascalName.toUpperCase()}_REPOSITORY)
		private readonly ${moduleName}Repo: I${pascalName}Repository,
	) {}

	async execute(ids: string[]): Promise<void> {
		// TODO: Add validation if needed
		await this.${moduleName}Repo.deleteMany(ids);
	}
}
`;
}

function generateUseCaseIndexTemplate(
	moduleName: string,
	pascalName: string,
): string {
	return `export * from './create-${moduleName}.use-case';
export * from './get-${moduleName}.use-case';
export * from './list-${moduleName}s.use-case';
export * from './update-${moduleName}.use-case';
export * from './delete-${moduleName}s.use-case';
`;
}

async function generateModule(): Promise<void> {
	console.log('\n🚀 NestJS Onion Architecture Module Generator\n');

	const moduleName = await question(
		'Module name (kebab-case, e.g., drive-accounts): ',
	);

	if (!moduleName) {
		console.log('❌ Module name is required!');
		rl.close();
		return;
	}

	const kebabName = toKebabCase(moduleName);
	const pascalName = toPascalCase(kebabName);

	console.log(`\n📦 Generating module: ${kebabName}`);
	console.log(`   Pascal case: ${pascalName}\n`);

	const srcPath = path.join(__dirname, '..', 'src');
	const modulePath = path.join(srcPath, kebabName);

	// Check if module already exists
	if (fs.existsSync(modulePath)) {
		const overwrite = await question(
			`⚠️  Module '${kebabName}' already exists. Overwrite? (y/N): `,
		);
		if (overwrite.toLowerCase() !== 'y') {
			console.log('❌ Generation cancelled.');
			rl.close();
			return;
		}
	}

	// Create directory structure
	console.log('📁 Creating directory structure...\n');

	const directories: string[] = [
		modulePath,
		path.join(modulePath, 'domain', 'entities'),
		path.join(modulePath, 'application', 'interfaces'),
		path.join(modulePath, 'application', 'use-cases'),
		path.join(modulePath, 'infrastructure'),
		path.join(modulePath, 'presentation', 'dto'),
	];

	directories.forEach(ensureDir);

	console.log('\n📝 Generating files...\n');

	// === Domain Layer ===
	writeFile(
		path.join(modulePath, 'domain', 'entities', `${kebabName}.entity.ts`),
		generateEntityTemplate(kebabName, pascalName),
	);

	// === Application Layer ===
	writeFile(
		path.join(
			modulePath,
			'application',
			'interfaces',
			`${kebabName}.repository.interface.ts`,
		),
		generateRepositoryInterfaceTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(modulePath, 'application', `${kebabName}.service.ts`),
		generateServiceTemplate(kebabName, pascalName),
	);

	// Use Cases
	writeFile(
		path.join(
			modulePath,
			'application',
			'use-cases',
			`create-${kebabName}.use-case.ts`,
		),
		generateCreateUseCaseTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(
			modulePath,
			'application',
			'use-cases',
			`get-${kebabName}.use-case.ts`,
		),
		generateGetUseCaseTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(
			modulePath,
			'application',
			'use-cases',
			`list-${kebabName}s.use-case.ts`,
		),
		generateListUseCaseTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(
			modulePath,
			'application',
			'use-cases',
			`update-${kebabName}.use-case.ts`,
		),
		generateUpdateUseCaseTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(
			modulePath,
			'application',
			'use-cases',
			`delete-${kebabName}s.use-case.ts`,
		),
		generateDeleteUseCaseTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(modulePath, 'application', 'use-cases', 'index.ts'),
		generateUseCaseIndexTemplate(kebabName, pascalName),
	);

	// === Infrastructure Layer ===
	writeFile(
		path.join(
			modulePath,
			'infrastructure',
			`prisma-${kebabName}.repository.ts`,
		),
		generateRepositoryImplementationTemplate(kebabName, pascalName),
	);

	// === Presentation Layer ===
	writeFile(
		path.join(modulePath, 'presentation', `${kebabName}.controller.ts`),
		generateControllerTemplate(kebabName, pascalName),
	);

	// DTOs
	writeFile(
		path.join(modulePath, 'presentation', 'dto', `create-${kebabName}.dto.ts`),
		generateCreateDtoTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(modulePath, 'presentation', 'dto', `update-${kebabName}.dto.ts`),
		generateUpdateDtoTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(modulePath, 'presentation', 'dto', `get-${kebabName}.dto.ts`),
		generateGetDtoTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(
			modulePath,
			'presentation',
			'dto',
			`list-${kebabName}.query.dto.ts`,
		),
		generateListQueryDtoTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(modulePath, 'presentation', 'dto', `delete-${kebabName}.dto.ts`),
		generateDeleteDtoTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(
			modulePath,
			'presentation',
			'dto',
			`${kebabName}.response.dto.ts`,
		),
		generateResponseDtoTemplate(kebabName, pascalName),
	);

	writeFile(
		path.join(modulePath, 'presentation', 'dto', 'index.ts'),
		generateDtoIndexTemplate(kebabName),
	);

	// === Module ===
	writeFile(
		path.join(modulePath, `${kebabName}.module.ts`),
		generateModuleTemplate(kebabName, pascalName),
	);

	console.log('\n✨ Module generated successfully!\n');
	console.log('📦 Generated structure:');
	console.log(`   ├── domain/entities/${kebabName}.entity.ts`);
	console.log(`   ├── application/`);
	console.log(`   │   ├── interfaces/${kebabName}.repository.interface.ts`);
	console.log(`   │   ├── use-cases/ (5 use cases)`);
	console.log(`   │   └── ${kebabName}.service.ts`);
	console.log(`   ├── infrastructure/prisma-${kebabName}.repository.ts`);
	console.log(`   ├── presentation/`);
	console.log(`   │   ├── dto/ (6 DTOs)`);
	console.log(`   │   └── ${kebabName}.controller.ts`);
	console.log(`   └── ${kebabName}.module.ts\n`);
	console.log('📋 Next steps:');
	console.log(`   1. Update Prisma schema for ${pascalName}`);
	console.log(`   2. Run: npm run prisma:migrate`);
	console.log(`   3. Complete TODOs in entity and use cases`);
	console.log(`   4. Implement findManyWithCount in repository`);
	console.log(`   5. Import ${pascalName}Module in app.module.ts`);
	console.log(`   6. Run: npm run start:dev\n`);

	rl.close();
}

generateModule().catch((error) => {
	console.error('❌ Error:', error);
	rl.close();
	process.exit(1);
});
