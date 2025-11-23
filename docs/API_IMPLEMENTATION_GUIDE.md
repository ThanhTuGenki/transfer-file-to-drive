# Hướng Dẫn Implement API - Share Up Backend

> Document này mô tả quy trình và quy tắc để implement một API endpoint hoàn chỉnh trong hệ thống, dựa trên Clean Architecture và Domain-Driven Design.

## 📋 Mục Lục

- [1. Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
- [2. Quy Tắc Chung](#2-quy-tắc-chung)
- [3. Cấu Trúc Thư Mục](#3-cấu-trúc-thư-mục)
- [4. Quy Trình Implement](#4-quy-trình-implement)
- [5. Chi Tiết Từng Layer](#5-chi-tiết-từng-layer)
- [6. Ví Dụ Hoàn Chỉnh](#6-ví-dụ-hoàn-chỉnh)

---

## 1. Tổng Quan Kiến Trúc

Hệ thống sử dụng **Clean Architecture** với **4 layers** chính:

```
┌─────────────────────────────────────────────┐
│         Presentation Layer (API)            │  ← Controllers, DTOs
├─────────────────────────────────────────────┤
│         Application Layer (Service)         │  ← Business Logic, Use Cases
├─────────────────────────────────────────────┤
│         Domain Layer (Entity)               │  ← Domain Models, Rules
├─────────────────────────────────────────────┤
│         Infrastructure Layer (Repository)   │  ← Database, External APIs
└─────────────────────────────────────────────┘
```

### Nguyên Tắc Dependency

- **Presentation** → Application → Domain
- **Application** → Domain
- **Infrastructure** → Domain
- **Domain** không phụ thuộc vào layer nào khác (clean core)

---

## 2. Quy Tắc Chung

### 2.1. Quy Tắc Về DTO

**⚠️ CỰC KỲ QUAN TRỌNG:**

1. **Tất cả DTO phải dựa trên `openapi.yaml` làm chuẩn**
2. **Kiểu dữ liệu BigInt trong Prisma → String trong DTO/API**
   - ✅ `storageUsed: string` (trong DTO)
   - ❌ `storageUsed: bigint` (KHÔNG được dùng trong DTO)
3. **Date phải convert sang ISO 8601 string**
   - ✅ `createdAt: '2025-11-15T09:57:40.888Z'`
   - ❌ `createdAt: Date` (KHÔNG được dùng trong Response DTO)

### 2.2. Validation

- **Sử dụng Zod** cho tất cả validation
- **Sử dụng `nestjs-zod`** để tích hợp với NestJS
- Mọi DTO phải extend từ `createZodDto(schema)`

### 2.3. Response Format

**Tất cả API response phải tuân theo format:**

```typescript
// Success Response (có data)
{
  "status": "success",
  "message": "Request successful",
  "data": { ... }
}

// Success Response (có pagination)
{
  "status": "success",
  "message": "List drive accounts successfully",
  "data": {
    "items": [ ... ]
  },
  "meta": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}

// Success Response (không có data)
{
  "status": "success",
  "message": "Drive account deleted successfully"
}
```

### 2.4. Error Handling

```typescript
// 400 - Validation Error (Zod)
{
  "status": "fail",
  "message": "Validation failed",
  "data": [
    {
      "code": "invalid_type",
      "path": ["email"],
      "message": "Email is required"
    }
  ]
}

// 404 - Not Found
{
  "status": "fail",
  "message": "DriveAccount with ID '123' not found."
}

// 409 - Conflict
{
  "status": "fail",
  "message": "DriveAccount with email 'test@example.com' already exists."
}

// 500 - Internal Server Error
{
  "status": "error",
  "message": "An internal server error occurred. Please try again later."
}
```

---

## 3. Cấu Trúc Thư Mục

```
src/
└── {feature-name}/              # Ví dụ: drive-accounts, categories
    ├── domain/                   # Domain Layer
    │   └── entities/
    │       └── {entity}.entity.ts
    ├── application/              # Application Layer
    │   ├── {feature}.service.ts
    │   └── interfaces/
    │       └── {entity}.repository.interface.ts
    ├── infrastructure/           # Infrastructure Layer
    │   └── prisma-{entity}.repository.ts
    ├── presentation/             # Presentation Layer
    │   ├── {feature}.controller.ts
    │   └── dto/
    │       ├── create-{entity}.dto.ts
    │       ├── update-{entity}.dto.ts
    │       ├── get-{entity}.dto.ts
    │       ├── list-{entities}.query.dto.ts
    │       ├── delete-{entities}.dto.ts
    │       └── {entity}.response.dto.ts
    └── {feature}.module.ts       # Module definition
```

---

## 4. Quy Trình Implement

### Checklist Implement Feature Mới

- [ ] **1. Cập nhật Prisma Schema** (`prisma/schema.prisma`)
- [ ] **2. Run migration** (`npm run migrate:dev`)
- [ ] **3. Định nghĩa OpenAPI Spec** (`openapi.yaml`)
- [ ] **4. Implement Domain Layer**
  - [ ] 4.1. Entity
- [ ] **5. Implement Application Layer**
  - [ ] 5.1. Repository Interface
  - [ ] 5.2. Service
- [ ] **6. Implement Infrastructure Layer**
  - [ ] 6.1. Prisma Repository
- [ ] **7. Implement Presentation Layer**
  - [ ] 7.1. DTOs (Input & Output)
  - [ ] 7.2. Controller
- [ ] **8. Tạo Module**
- [ ] **9. Register vào AppModule**
- [ ] **10. Test API**

---

## 5. Chi Tiết Từng Layer

### 5.1. Domain Layer - Entity

**File:** `domain/entities/{entity}.entity.ts`

**Mục đích:** 
- Định nghĩa model nghiệp vụ
- Chứa business logic
- Implement dirty checking (từ BaseEntity)

**Quy tắc:**

1. **Extend từ `BaseEntity<T>`**
2. **Định nghĩa interface cho entity shape**
3. **Private properties với getters**
4. **Factory methods:** `create()` và `fromData()`
5. **Implement abstract methods:** `toObject()` và `getCurrentState()`
6. **Business logic methods**

**Template:**

```typescript
import { BaseEntity } from '@core/base/base.entity';
import { EntityName as PrismaEntityName, EnumType } from '@prisma/client';

// Interface định nghĩa shape của entity
export interface IEntityName {
  id: string;
  field1: string;
  field2: EnumType;
  numberField: bigint;         // BigInt trong entity
  createdAt: Date;
  updatedAt: Date;
}

export class EntityName extends BaseEntity<IEntityName> {
  // --- Internal State (Private) ---
  private readonly _id: string;
  private _field1: string;
  private _field2: EnumType;
  private _numberField: bigint;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // --- Private Constructor ---
  private constructor(props: IEntityName) {
    super();
    
    this._id = props.id;
    this._field1 = props.field1;
    this._field2 = props.field2;
    this._numberField = props.numberField;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    
    // ⚠️ CRUCIAL: Capture initial state sau khi gán properties
    this.setInitialState();
  }

  // --- Getters ---
  public get id(): string { return this._id; }
  public get field1(): string { return this._field1; }
  public get field2(): EnumType { return this._field2; }
  public get numberField(): bigint { return this._numberField; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }

  // --- Factory: Hydrate từ DB (Prisma) ---
  public static fromData(data: PrismaEntityName): EntityName {
    const props: IEntityName = {
      id: data.id.toString(),        // BigInt → string
      field1: data.field1,
      field2: data.field2,
      numberField: data.numberField, // Giữ nguyên BigInt trong entity
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    return new EntityName(props);
  }

  // --- Factory: Tạo mới (chưa lưu DB) ---
  public static create(props: { field1: string }): EntityName {
    const now = new Date();
    const entityProps: IEntityName = {
      id: '0',                        // Temporary ID
      field1: props.field1,
      field2: 'DEFAULT_VALUE',
      numberField: 0n,
      createdAt: now,
      updatedAt: now,
    };
    return new EntityName(entityProps);
  }

  // --- Abstract Method Implementations ---
  public toObject(): IEntityName {
    return {
      id: this._id,
      field1: this._field1,
      field2: this._field2,
      numberField: this._numberField,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  protected getCurrentState(): Omit<IEntityName, 'id'> {
    const { id, ...currentState } = this.toObject();
    return currentState;
  }

  // --- Business Logic ---
  public updateField1(value: string): void {
    this._field1 = value;
    this.updateTimestamp();
  }

  public markAsUpdateAPI(payload: { 
    field1?: string; 
    field2?: EnumType 
  }): void {
    this._field1 = payload.field1 ?? this._field1;
    this._field2 = payload.field2 ?? this._field2;
    this.updateTimestamp();
  }

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}
```

---

### 5.2. Application Layer - Repository Interface

**File:** `application/interfaces/{entity}.repository.interface.ts`

**Mục đích:** Định nghĩa contract cho repository (để DI)

**Template:**

```typescript
import { IBaseRepository } from '@core/base/base.repository';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { EntityName } from '../../domain/entities/{entity}.entity';
import { EnumType } from '@prisma/client';

export const ENTITY_REPOSITORY = 'EntityNameRepository';

export interface IEntityNameRepository extends IBaseRepository<EntityName> {
  // Custom methods ngoài CRUD cơ bản
  findByUniqueField(
    field: string, 
    tx?: PrismaTransactionClient
  ): Promise<EntityName | null>;

  findManyWithCount(
    filter: {
      skip: number;
      take: number;
      status?: EnumType;
      search?: string;
      orderBy: string;
      order: 'asc' | 'desc';
    },
    tx?: PrismaTransactionClient,
  ): Promise<[EntityName[], number]>;
}
```

---

### 5.3. Application Layer - Service

**File:** `application/{feature}.service.ts`

**Mục đích:** Chứa business logic, use cases

**Quy tắc:**

1. Inject repository qua interface token
2. Throw NestJS exceptions (NotFoundException, ConflictException, etc.)
3. Không xử lý HTTP concerns (đó là việc của Controller)
4. Return domain entities

**Template:**

```typescript
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityName } from '../domain/entities/{entity}.entity';
import { CreateEntityDto } from '../presentation/dto/create-{entity}.dto';
import { ListEntitiesQueryDto } from '../presentation/dto/list-{entities}.query.dto';
import { UpdateEntityDto } from '../presentation/dto/update-{entity}.dto';
import {
  ENTITY_REPOSITORY,
  IEntityNameRepository,
} from './interfaces/{entity}.repository.interface';

@Injectable()
export class EntityNamesService {
  constructor(
    @Inject(ENTITY_REPOSITORY)
    private readonly entityRepo: IEntityNameRepository,
  ) {}

  async findOne(id: string): Promise<EntityName> {
    const entity = await this.entityRepo.findById(id);
    if (!entity) {
      throw new NotFoundException(`EntityName with ID '${id}' not found.`);
    }
    return entity;
  }

  async create(dto: CreateEntityDto): Promise<EntityName> {
    // Validation nghiệp vụ (nếu cần)
    const existing = await this.entityRepo.findByUniqueField(dto.uniqueField);
    if (existing) {
      throw new ConflictException(
        `EntityName with field '${dto.uniqueField}' already exists.`,
      );
    }

    const newEntity = EntityName.create({
      field1: dto.field1,
    });

    return this.entityRepo.save(newEntity);
  }

  async list(query: ListEntitiesQueryDto): Promise<[EntityName[], number]> {
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [items, total] = await this.entityRepo.findManyWithCount({
      skip,
      take,
      status: query.status,
      search: query.search,
      orderBy: query.orderBy,
      order: query.order,
    });

    return [items, total];
  }

  async update(id: string, dto: UpdateEntityDto): Promise<EntityName> {
    const entity = await this.entityRepo.findById(id);
    if (!entity) {
      throw new NotFoundException(`EntityName with ID '${id}' not found.`);
    }

    entity.markAsUpdateAPI(dto);
    return this.entityRepo.save(entity);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const deletedCount = await this.entityRepo.deleteByIds(ids);
    if (deletedCount === 0 && ids.length > 0) {
      throw new NotFoundException('One or more entities not found.');
    }
  }
}
```

---

### 5.4. Infrastructure Layer - Repository

**File:** `infrastructure/prisma-{entity}.repository.ts`

**Mục đích:** Implement repository interface sử dụng Prisma

**Template:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { EntityName } from '../domain/entities/{entity}.entity';
import {
  EntityName as PrismaEntityName,
  Prisma,
  EnumType,
} from '@prisma/client';
import { PrismaBaseRepository } from '@core/base';
import { IEntityNameRepository } from '../application/interfaces/{entity}.repository.interface';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';

@Injectable()
export class PrismaEntityNameRepository
  extends PrismaBaseRepository<
    EntityName,
    PrismaEntityName,
    Prisma.EntityNameCreateInput,
    Prisma.EntityNameDelegate
  >
  implements IEntityNameRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'entityName'); // ⚠️ Tên model trong Prisma (camelCase)
  }

  protected fromData(data: PrismaEntityName): EntityName {
    return EntityName.fromData(data);
  }

  protected mapEntityToCreateInput(
    entity: EntityName,
  ): Prisma.EntityNameCreateInput {
    const { id, ...data } = entity.toObject();
    return data;
  }

  // Custom methods
  async findByUniqueField(
    field: string,
    tx?: PrismaTransactionClient,
  ): Promise<EntityName | null> {
    const client = this.getClient(tx);

    const data = await client.findUnique({
      where: { uniqueField: field },
    });

    if (!data) return null;
    return EntityName.fromData(data);
  }

  async findManyWithCount(
    filter: {
      skip: number;
      take: number;
      status?: EnumType;
      search?: string;
      orderBy: string;
      order: 'asc' | 'desc';
    },
    tx?: PrismaTransactionClient,
  ): Promise<[EntityName[], number]> {
    const client = this.getClient(tx);

    const whereClause: Prisma.EntityNameWhereInput = {
      ...(filter.status && { status: filter.status }),
      ...(filter.search && {
        OR: [
          { field1: { contains: filter.search, mode: 'insensitive' } },
          { field2: { contains: filter.search, mode: 'insensitive' } },
        ],
      }),
    };

    let items: PrismaEntityName[];
    let total: number;

    if (tx) {
      [items, total] = await Promise.all([
        client.findMany({
          skip: filter.skip,
          take: filter.take,
          where: whereClause,
          orderBy: { [filter.orderBy]: filter.order },
        }),
        client.count({ where: whereClause }),
      ]);
    } else {
      [items, total] = await this.prisma.$transaction([
        client.findMany({
          skip: filter.skip,
          take: filter.take,
          where: whereClause,
          orderBy: { [filter.orderBy]: filter.order },
        }),
        client.count({ where: whereClause }),
      ]);
    }

    const entities = items.map(EntityName.fromData);
    return [entities, total];
  }
}
```

---

### 5.5. Presentation Layer - DTOs

#### 5.5.1. Response DTO

**File:** `presentation/dto/{entity}.response.dto.ts`

**⚠️ QUY TẮC CỰC KỲ QUAN TRỌNG:**

1. **Phải map CHÍNH XÁC theo OpenAPI schema**
2. **BigInt → String**
3. **Date → ISO String**

**Template:**

```typescript
import { EntityName as EntityNameEntity } from '@{feature}/domain/entities/{entity}.entity';
import { EnumType } from '@prisma/client';

export class EntityNameResponseDto {
  id: string;
  field1: string;
  field2: EnumType;
  numberField: string;         // ⚠️ BigInt → String
  createdAt: string;           // ⚠️ Date → ISO String
  updatedAt: string;           // ⚠️ Date → ISO String

  public static fromEntity(entity: EntityNameEntity): EntityNameResponseDto {
    return {
      id: entity.id,
      field1: entity.field1,
      field2: entity.field2,
      numberField: entity.numberField.toString(),     // BigInt → String
      createdAt: entity.createdAt.toISOString(),      // Date → ISO
      updatedAt: entity.updatedAt.toISOString(),      // Date → ISO
    };
  }
}
```

#### 5.5.2. Create DTO

**File:** `presentation/dto/create-{entity}.dto.ts`

**Template:**

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ⚠️ Schema phải MATCH với OpenAPI spec
const CreateEntitySchema = z.object({
  field1: z.string().min(1, 'Field1 is required').max(255),
  field2: z.string().email('Invalid email format').max(255),
});

export class CreateEntityDto extends createZodDto(CreateEntitySchema) {}
```

#### 5.5.3. Update DTO

**File:** `presentation/dto/update-{entity}.dto.ts`

**Template:**

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EnumType } from '@prisma/client';

const UpdateEntitySchema = z.object({
  field1: z.string().min(1, 'Field1 cannot be empty').max(255),
  field2: z.enum([
    EnumType.VALUE1,
    EnumType.VALUE2,
    EnumType.VALUE3,
  ]),
});

export class UpdateEntityDto extends createZodDto(UpdateEntitySchema) {}
```

#### 5.5.4. List Query DTO

**File:** `presentation/dto/list-{entities}.query.dto.ts`

**Template:**

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EnumType } from '@prisma/client';

const ListEntitiesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  
  status: z.enum([
    EnumType.VALUE1,
    EnumType.VALUE2,
  ]).optional(),
  
  search: z.string().trim().optional(),
  
  orderBy: z.enum(['id', 'createdAt', 'field1']).default('id'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export class ListEntitiesQueryDto extends createZodDto(
  ListEntitiesQuerySchema,
) {}
```

#### 5.5.5. Delete DTO

**File:** `presentation/dto/delete-{entities}.dto.ts`

**Template:**

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DeleteEntitiesSchema = z.object({
  ids: z
    .array(z.string().regex(/^\d+$/, 'Each ID must be a numeric string'))
    .min(1, 'IDs array cannot be empty'),
});

export class DeleteEntitiesDto extends createZodDto(DeleteEntitiesSchema) {}
```

#### 5.5.6. Param DTO

**File:** `presentation/dto/get-{entity}.dto.ts`

**Template:**

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetEntityParamsSchema = z.object({
  id: z.string().regex(/^[0-9]+$/, 'ID must be a numeric string'),
});

export class GetEntityParamsDto extends createZodDto(GetEntityParamsSchema) {}
```

---

### 5.6. Presentation Layer - Controller

**File:** `presentation/{feature}.controller.ts`

**Mục đích:** Handle HTTP requests, validate input, format response

**Quy tắc:**

1. **Sử dụng `@ResponseMessage()` decorator** cho custom message
2. **Validation qua `ZodValidationPipe`**
3. **Convert Entity → Response DTO**
4. **Không chứa business logic**

**Template:**

```typescript
import { ResponseMessage } from '@core/decorators/response-message.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { EntityNamesService } from '../application/{feature}.service';
import { EntityNameResponseDto } from './dto/{entity}.response.dto';
import { CreateEntityDto } from './dto/create-{entity}.dto';
import { UpdateEntityDto } from './dto/update-{entity}.dto';
import { GetEntityParamsDto } from './dto/get-{entity}.dto';
import { ListEntitiesQueryDto } from './dto/list-{entities}.query.dto';
import { DeleteEntitiesDto } from './dto/delete-{entities}.dto';
import { IPaginatedData } from '@core/interceptors/response.interceptor';

@Controller('entities')  // ⚠️ Route path (plural, kebab-case)
export class EntityNamesController {
  constructor(private readonly service: EntityNamesService) {}

  // ========== LIST ==========
  @Get()
  @UsePipes(new ZodValidationPipe(ListEntitiesQueryDto))
  @ResponseMessage('List entities successfully')
  async list(
    @Query() query: ListEntitiesQueryDto,
  ): Promise<IPaginatedData<EntityNameResponseDto>> {
    const [entities, total] = await this.service.list(query);

    const items = entities.map(EntityNameResponseDto.fromEntity);

    return {
      items: items,
      meta: {
        currentPage: query.page,
        totalPages: Math.ceil(total / query.limit),
        totalItems: total,
        itemsPerPage: query.limit,
      },
    };
  }

  // ========== GET DETAIL ==========
  @Get(':id')
  @UsePipes(new ZodValidationPipe(GetEntityParamsDto))
  @ResponseMessage('Request successful')
  async getById(
    @Param() params: GetEntityParamsDto,
  ): Promise<EntityNameResponseDto> {
    const entity = await this.service.findOne(params.id);
    return EntityNameResponseDto.fromEntity(entity);
  }

  // ========== CREATE ==========
  @Post()
  @UsePipes(new ZodValidationPipe(CreateEntityDto))
  @ResponseMessage('Entity created successfully')
  async create(
    @Body() dto: CreateEntityDto,
  ): Promise<EntityNameResponseDto> {
    const entity = await this.service.create(dto);
    return EntityNameResponseDto.fromEntity(entity);
  }

  // ========== UPDATE ==========
  @Put(':id')
  @ResponseMessage('Entity updated successfully')
  async update(
    @Param(new ZodValidationPipe(GetEntityParamsDto))
    params: GetEntityParamsDto,
    @Body(new ZodValidationPipe(UpdateEntityDto))
    dto: UpdateEntityDto,
  ): Promise<void> {
    await this.service.update(params.id, dto);
  }

  // ========== DELETE MANY ==========
  @Delete()
  @ResponseMessage('Multiple entities deleted successfully')
  async deleteMany(
    @Body(new ZodValidationPipe(DeleteEntitiesDto)) 
    dto: DeleteEntitiesDto
  ): Promise<void> {
    await this.service.deleteMany(dto.ids);
  }
}
```

---

### 5.7. Module

**File:** `{feature}.module.ts`

**Template:**

```typescript
import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { EntityNamesService } from './application/{feature}.service';
import { ENTITY_REPOSITORY } from './application/interfaces/{entity}.repository.interface';
import { PrismaEntityNameRepository } from './infrastructure/prisma-{entity}.repository';
import { EntityNamesController } from './presentation/{feature}.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EntityNamesController],
  providers: [
    EntityNamesService,
    {
      provide: ENTITY_REPOSITORY,
      useClass: PrismaEntityNameRepository,
    },
  ],
  exports: [EntityNamesService],  // Export nếu module khác cần dùng
})
export class EntityNamesModule {}
```

---

## 6. Ví Dụ Hoàn Chỉnh

### Use Case: DriveAccount CRUD

Xem implementation tại:
- `src/drive-accounts/domain/entities/drive-account.entity.ts`
- `src/drive-accounts/application/drive-accounts.service.ts`
- `src/drive-accounts/infrastructure/prisma-drive-account.repository.ts`
- `src/drive-accounts/presentation/drive-accounts.controller.ts`
- `src/drive-accounts/presentation/dto/*.dto.ts`
- `src/drive-accounts/drive-accounts.module.ts`

### Điểm Chú Ý Trong DriveAccount

#### ✅ BigInt Conversion

**Entity (Domain):**
```typescript
export interface IDriveAccount {
  storageUsed: bigint;    // Giữ nguyên BigInt
  storageTotal: bigint;
}
```

**Response DTO (Presentation):**
```typescript
export class DriveAccountResponseDto {
  storageUsed: string;    // Convert → String
  storageTotal: string;

  public static fromEntity(entity: DriveAccountEntity) {
    return {
      ...
      storageUsed: entity.storageUsed.toString(),  // ⚠️ Conversion
      storageTotal: entity.storageTotal.toString(),
    };
  }
}
```

#### ✅ Date Conversion

**Entity:**
```typescript
createdAt: Date;
updatedAt: Date;
```

**Response DTO:**
```typescript
createdAt: string;  // ISO 8601
updatedAt: string;

// Conversion
createdAt: entity.createdAt.toISOString(),
updatedAt: entity.updatedAt.toISOString(),
```

#### ✅ Enum Usage

```typescript
import { DriveAccountStatus } from '@prisma/client';

// In DTO
status: z.enum([
  DriveAccountStatus.ACTIVE,
  DriveAccountStatus.INACTIVE,
  DriveAccountStatus.QUOTA_EXCEEDED,
  DriveAccountStatus.AUTH_ERROR,
]).optional(),
```

#### ✅ List với Pagination

```typescript
@Get()
async list(
  @Query() query: ListDriveAccountsQueryDto,
): Promise<IPaginatedData<DriveAccountResponseDto>> {
  const [entities, total] = await this.service.list(query);
  
  return {
    items: entities.map(DriveAccountResponseDto.fromEntity),
    meta: {
      currentPage: query.page,
      totalPages: Math.ceil(total / query.limit),
      totalItems: total,
      itemsPerPage: query.limit,
    },
  };
}
```

---

## 7. Checklist Review Code

Trước khi commit, hãy kiểm tra:

### Domain Layer
- [ ] Entity extends `BaseEntity<T>`
- [ ] Có interface định nghĩa shape (`IEntityName`)
- [ ] Private properties với getters
- [ ] Implement `toObject()` và `getCurrentState()`
- [ ] Factory methods: `create()` và `fromData()`
- [ ] Call `setInitialState()` trong constructor
- [ ] Business logic methods gọi `updateTimestamp()`

### Application Layer
- [ ] Service inject repository qua interface token
- [ ] Throw appropriate NestJS exceptions
- [ ] Không xử lý HTTP concerns
- [ ] Repository interface extend `IBaseRepository<T>`

### Infrastructure Layer
- [ ] Repository extend `PrismaBaseRepository`
- [ ] Implement repository interface
- [ ] Implement `fromData()` và `mapEntityToCreateInput()`
- [ ] Custom queries sử dụng `getClient(tx)`

### Presentation Layer
- [ ] DTOs dựa trên OpenAPI spec
- [ ] BigInt → String trong Response DTO
- [ ] Date → ISO String trong Response DTO
- [ ] Sử dụng Zod validation
- [ ] Controller sử dụng `@ResponseMessage()`
- [ ] Validation qua `ZodValidationPipe`

### Module
- [ ] Import PrismaModule
- [ ] Register Controller, Service, Repository
- [ ] Provider mapping: interface token → concrete class
- [ ] Export Service nếu cần

---

## 8. Common Pitfalls (Lỗi Thường Gặp)

### ❌ Quên convert BigInt trong Response DTO
```typescript
// SAI
storageUsed: entity.storageUsed,  // TypeError: BigInt không serialize được

// ĐÚNG
storageUsed: entity.storageUsed.toString(),
```

### ❌ Quên gọi setInitialState() trong Entity constructor
```typescript
// SAI
private constructor(props: IEntity) {
  super();
  this._id = props.id;
  // Quên gọi setInitialState()
}

// ĐÚNG
private constructor(props: IEntity) {
  super();
  this._id = props.id;
  this.setInitialState();  // ⚠️ PHẢI CÓ
}
```

### ❌ DTO không match với OpenAPI spec
```typescript
// Kiểm tra lại openapi.yaml để đảm bảo fields, types, validations match
```

### ❌ Quên sử dụng ZodValidationPipe
```typescript
// SAI
@Get(':id')
async getById(@Param() params: GetEntityParamsDto) { }

// ĐÚNG
@Get(':id')
@UsePipes(new ZodValidationPipe(GetEntityParamsDto))
async getById(@Param() params: GetEntityParamsDto) { }
```

### ❌ Quên handle transaction trong repository custom methods
```typescript
// ĐÚNG
async findManyWithCount(..., tx?: PrismaTransactionClient) {
  const client = this.getClient(tx);  // ⚠️ Sử dụng getClient()
  ...
}
```

---

## 9. Tài Liệu Tham Khảo

- **OpenAPI Spec:** `back-end/openapi.yaml`
- **Prisma Schema:** `back-end/prisma/schema.prisma`
- **Naming Conventions:** `back-end/docs/NAMING_CONVENTIONS.md`
- **Base Classes:**
  - `src/core/base/entity.base.ts`
  - `src/core/base/repository.base.ts`
- **Example Implementation:** `src/drive-accounts/`

---

**Created:** 2025-11-16  
**Last Updated:** 2025-11-16  
**Version:** 1.0.0

