# 📘 API Implementation Guide

> Hướng dẫn đầy đủ về cách implement API trong Share Up Backend

---

## 📚 Mục Lục

- [Quick Reference](#-quick-reference) - Templates nhanh
- [Implementation Guide](#-implementation-guide) - Chi tiết đầy đủ
- [Examples](#-examples) - Ví dụ thực tế

---

## ⚡ Quick Reference

### 📋 Checklist 10 Bước

- [ ] **1.** Cập nhật `prisma/schema.prisma`
- [ ] **2.** Run `npm run migrate:dev`
- [ ] **3.** Cập nhật `openapi.yaml`
- [ ] **4.** Tạo Entity (`domain/entities/*.entity.ts`)
- [ ] **5.** Tạo Use Cases (`application/use-cases/*.use-case.ts`)
- [ ] **6.** Tạo Repository Interface (`application/interfaces/*.interface.ts`)
- [ ] **7.** Tạo Service (`application/*.service.ts`)
- [ ] **8.** Tạo Prisma Repository (`infrastructure/prisma-*.repository.ts`)
- [ ] **9.** Tạo DTOs (`presentation/dto/*.dto.ts`)
- [ ] **10.** Tạo Controller (`presentation/*.controller.ts`)
- [ ] **11.** Tạo Module và register vào AppModule

---

### ⚠️ Critical Rules

#### 1. BigInt → String
```typescript
// ❌ SAI
storageUsed: entity.storageUsed

// ✅ ĐÚNG
storageUsed: entity.storageUsed.toString()
```

#### 2. Date → ISO String
```typescript
// ❌ SAI
createdAt: entity.createdAt

// ✅ ĐÚNG
createdAt: entity.createdAt.toISOString()
```

#### 3. DTO Match OpenAPI
```typescript
// Luôn kiểm tra openapi.yaml trước khi tạo DTO
```

#### 4. Zod Validation
```typescript
// ✅ Luôn sử dụng
@UsePipes(new ZodValidationPipe(YourDto))
```

#### 5. setInitialState() trong Entity
```typescript
private constructor(props: IEntity) {
  super();
  // ... assign properties
  this.setInitialState(); // ⚠️ BẮT BUỘC
}
```

---

### 📝 Templates

#### Entity (Domain)

```typescript
import { BaseEntity } from '@core/base/base.entity';

export interface IMyEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MyEntity extends BaseEntity<IMyEntity> {
  // Private properties
  private readonly _id: string;
  private _name: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // Private constructor
  private constructor(props: IMyEntity) {
    super();
    this._id = props.id;
    this._name = props.name;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this.setInitialState(); // ⚠️ BẮT BUỘC
  }

  // Getters
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // Factory methods
  static fromData(data: any): MyEntity {
    return new MyEntity({
      id: data.id,
      name: data.name,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  static create(props: { name: string }): MyEntity {
    const now = new Date();
    return new MyEntity({
      id: '0', // Temporary ID
      name: props.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Abstract implementations
  toObject(): IMyEntity {
    return {
      id: this._id,
      name: this._name,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  protected getCurrentState(): Omit<IMyEntity, 'id'> {
    const { id, ...state } = this.toObject();
    return state;
  }

  // Business methods
  updateName(name: string): void {
    this._name = name;
    this.updateTimestamp();
  }

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}
```

#### Use Case (Application)

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MyEntity } from '../../domain/entities/my-entity.entity';
import { CreateMyEntityDto } from '../../presentation/dto/create-my-entity.dto';
import {
  MY_ENTITY_REPOSITORY,
  IMyEntityRepository,
} from '../interfaces/my-entity.repository.interface';

@Injectable()
export class CreateMyEntityUseCase {
  constructor(
    @Inject(MY_ENTITY_REPOSITORY)
    private readonly myEntityRepo: IMyEntityRepository,
  ) {}

  async execute(dto: CreateMyEntityDto): Promise<MyEntity> {
    // Business validation
    const existing = await this.myEntityRepo.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Entity with name '${dto.name}' already exists.`);
    }

    // Create entity
    const newEntity = MyEntity.create({
      name: dto.name,
    });

    // Save
    return this.myEntityRepo.save(newEntity);
  }
}
```

#### Service (Application)

```typescript
import { Injectable } from '@nestjs/common';
import { MyEntity } from '../domain/entities/my-entity.entity';
import {
  CreateMyEntityDto,
  UpdateMyEntityDto,
  ListMyEntityQueryDto,
} from '../presentation/dto';
import {
  CreateMyEntityUseCase,
  GetMyEntityUseCase,
  ListMyEntitiesUseCase,
  UpdateMyEntityUseCase,
  DeleteMyEntitiesUseCase,
} from './use-cases';

@Injectable()
export class MyEntityService {
  constructor(
    private readonly createUseCase: CreateMyEntityUseCase,
    private readonly getUseCase: GetMyEntityUseCase,
    private readonly listUseCase: ListMyEntitiesUseCase,
    private readonly updateUseCase: UpdateMyEntityUseCase,
    private readonly deleteUseCase: DeleteMyEntitiesUseCase,
  ) {}

  async create(dto: CreateMyEntityDto): Promise<MyEntity> {
    return this.createUseCase.execute(dto);
  }

  async findOne(id: string): Promise<MyEntity> {
    return this.getUseCase.execute(id);
  }

  async list(query: ListMyEntityQueryDto): Promise<[MyEntity[], number]> {
    return this.listUseCase.execute(query);
  }

  async update(id: string, dto: UpdateMyEntityDto): Promise<MyEntity> {
    return this.updateUseCase.execute(id, dto);
  }

  async deleteMany(ids: string[]): Promise<void> {
    return this.deleteUseCase.execute(ids);
  }
}
```

#### Repository Interface (Application)

```typescript
import { IBaseRepository } from '@core/base';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';
import { MyEntity } from '../../domain/entities/my-entity.entity';

export const MY_ENTITY_REPOSITORY = 'MY_ENTITY_REPOSITORY';

export interface IMyEntityRepository extends IBaseRepository<MyEntity> {
  findByName(name: string, tx?: PrismaTransactionClient): Promise<MyEntity | null>;
  findManyWithCount(
    filter: { skip: number; take: number; search?: string },
    tx?: PrismaTransactionClient,
  ): Promise<[MyEntity[], number]>;
}
```

#### Repository Implementation (Infrastructure)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { MyEntity } from '../domain/entities/my-entity.entity';
import { Prisma } from '@prisma/client';
import { PrismaBaseRepository } from '@core/base';
import { IMyEntityRepository } from '../application/interfaces/my-entity.repository.interface';
import { PrismaTransactionClient } from '@core/prisma/prisma.types';

@Injectable()
export class PrismaMyEntityRepository
  extends PrismaBaseRepository<
    MyEntity,
    Prisma.MyEntityDelegate,
    Prisma.MyEntityCreateInput
  >
  implements IMyEntityRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'myEntity');
  }

  protected fromData(data: any): MyEntity {
    return MyEntity.fromData(data);
  }

  protected mapEntityToCreateInput(entity: MyEntity): Prisma.MyEntityCreateInput {
    const { id, ...data } = entity.toObject();
    return data;
  }

  async findByName(name: string, tx?: PrismaTransactionClient): Promise<MyEntity | null> {
    const client = this.getClient(tx);
    const data = await client.myEntity.findFirst({
      where: { name },
    });
    return data ? this.fromData(data) : null;
  }

  async findManyWithCount(
    filter: { skip: number; take: number; search?: string },
    tx?: PrismaTransactionClient,
  ): Promise<[MyEntity[], number]> {
    const client = this.getClient(tx);
    
    const where: Prisma.MyEntityWhereInput = filter.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, count] = await Promise.all([
      client.myEntity.findMany({
        where,
        skip: filter.skip,
        take: filter.take,
        orderBy: { createdAt: 'desc' },
      }),
      client.myEntity.count({ where }),
    ]);

    return [data.map(this.fromData.bind(this)), count];
  }
}
```

#### DTOs (Presentation)

**Response DTO:**
```typescript
import { MyEntity } from '@my-module/domain/entities/my-entity.entity';

export class MyEntityResponseDto {
  id: string;
  name: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String

  static fromEntity(entity: MyEntity): MyEntityResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt.toISOString(), // ⚠️ Date → ISO
      updatedAt: entity.updatedAt.toISOString(), // ⚠️ Date → ISO
    };
  }
}
```

**Input DTOs:**
```typescript
import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

// Create DTO
const createMyEntitySchema = z.object({
  name: z.string().min(1).max(255),
});

export class CreateMyEntityDto extends createZodDto(createMyEntitySchema) {}

// Update DTO
const updateMyEntitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export class UpdateMyEntityDto extends createZodDto(updateMyEntitySchema) {}

// Query DTO
const listMyEntityQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1), // ⚠️ coerce for query params
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export class ListMyEntityQueryDto extends createZodDto(listMyEntityQuerySchema) {}

// Delete DTO
const deleteMyEntitiesSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export class DeleteMyEntitiesDto extends createZodDto(deleteMyEntitiesSchema) {}
```

#### Controller (Presentation)

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { MyEntityService } from '../application/my-entity.service';
import { ResponseMessage } from '@core/decorators/response-message.decorator';
import {
  CreateMyEntityDto,
  UpdateMyEntityDto,
  ListMyEntityQueryDto,
  DeleteMyEntitiesDto,
  MyEntityResponseDto,
} from './dto';
import { IPaginatedData } from '@core/interfaces/paginated-data.interface';

@Controller('my-entities')
export class MyEntityController {
  constructor(private readonly myEntityService: MyEntityService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateMyEntityDto))
  @ResponseMessage('Entity created successfully')
  async create(@Body() dto: CreateMyEntityDto): Promise<MyEntityResponseDto> {
    const entity = await this.myEntityService.create(dto);
    return MyEntityResponseDto.fromEntity(entity);
  }

  @Get(':id')
  @ResponseMessage('Entity retrieved successfully')
  async getById(@Param('id') id: string): Promise<MyEntityResponseDto> {
    const entity = await this.myEntityService.findOne(id);
    return MyEntityResponseDto.fromEntity(entity);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(ListMyEntityQueryDto))
  @ResponseMessage('Entities listed successfully')
  async list(
    @Query() query: ListMyEntityQueryDto,
  ): Promise<IPaginatedData<MyEntityResponseDto>> {
    const [entities, total] = await this.myEntityService.list(query);
    
    return {
      data: entities.map((e) => MyEntityResponseDto.fromEntity(e)),
      meta: {
        currentPage: query.page,
        itemsPerPage: query.limit,
        totalItems: total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(UpdateMyEntityDto))
  @ResponseMessage('Entity updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMyEntityDto,
  ): Promise<MyEntityResponseDto> {
    const entity = await this.myEntityService.update(id, dto);
    return MyEntityResponseDto.fromEntity(entity);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(DeleteMyEntitiesDto))
  @ResponseMessage('Entities deleted successfully')
  async deleteMany(@Body() dto: DeleteMyEntitiesDto): Promise<void> {
    await this.myEntityService.deleteMany(dto.ids);
  }
}
```

#### Module

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';
import { MyEntityService } from './application/my-entity.service';
import { MY_ENTITY_REPOSITORY } from './application/interfaces/my-entity.repository.interface';
import { PrismaMyEntityRepository } from './infrastructure/prisma-my-entity.repository';
import { MyEntityController } from './presentation/my-entity.controller';
import {
  CreateMyEntityUseCase,
  GetMyEntityUseCase,
  ListMyEntitiesUseCase,
  UpdateMyEntityUseCase,
  DeleteMyEntitiesUseCase,
} from './application/use-cases';

@Module({
  imports: [PrismaModule],
  controllers: [MyEntityController],
  providers: [
    MyEntityService,
    {
      provide: MY_ENTITY_REPOSITORY,
      useClass: PrismaMyEntityRepository,
    },
    CreateMyEntityUseCase,
    GetMyEntityUseCase,
    ListMyEntitiesUseCase,
    UpdateMyEntityUseCase,
    DeleteMyEntitiesUseCase,
  ],
  exports: [MyEntityService],
})
export class MyEntityModule {}
```

---

## 📖 Implementation Guide

### 1. Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │  Controllers + DTOs
│         (API Interface)                     │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│        Application Layer                    │  Services + Use Cases
│        (Business Logic)                     │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│          Domain Layer                       │  Entities + Rules
│          (Core Business)                    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│       Infrastructure Layer                  │  Repositories + DB
│       (External Dependencies)               │
└─────────────────────────────────────────────┘
```

### 2. Quy Tắc Về DTO

#### 2.1. OpenAPI là Source of Truth
- **Tất cả DTO phải match 100% với `openapi.yaml`**
- Kiểm tra schema trước khi tạo DTO

#### 2.2. Type Conversion

| Type trong DB | Type trong Entity | Type trong DTO | Conversion |
|---------------|-------------------|----------------|------------|
| `BigInt` | `bigint` | `string` | `.toString()` |
| `DateTime` | `Date` | `string` | `.toISOString()` |
| `Enum` | `Enum` | `Enum` | Giữ nguyên |
| `String` | `string` | `string` | Giữ nguyên |
| `Int` | `number` | `number` | Giữ nguyên |

#### 2.3. Validation với Zod

**Query Params:**
```typescript
// ⚠️ PHẢI dùng z.coerce.number()
page: z.coerce.number().min(1).default(1)
limit: z.coerce.number().min(1).max(100).default(10)
```

**Body Params:**
```typescript
// Dùng z.string(), z.number() bình thường
name: z.string().min(1).max(255)
age: z.number().min(0).max(150)
```

### 3. Response Format

#### 3.1. Success Response

```typescript
// Single item
{
  "status": "success",
  "message": "Request successful",
  "data": { ... }
}

// List with pagination
{
  "status": "success",
  "message": "Entities listed successfully",
  "data": [ ... ],
  "meta": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}

// No data
{
  "status": "success",
  "message": "Entity deleted successfully"
}
```

#### 3.2. Error Response

```typescript
// 400 - Validation Error
{
  "status": "fail",
  "message": "Validation failed",
  "data": [...]
}

// 404 - Not Found
{
  "status": "fail",
  "message": "Entity with ID 'xxx' not found."
}

// 409 - Conflict
{
  "status": "fail",
  "message": "Entity already exists."
}
```

### 4. Entity Best Practices

#### 4.1. Constructor Pattern
```typescript
private constructor(props: IEntity) {
  super();
  // Assign all properties
  this._id = props.id;
  this._name = props.name;
  // ...
  this.setInitialState(); // ⚠️ MUST BE LAST
}
```

#### 4.2. Factory Methods
```typescript
// From database
static fromData(data: PrismaEntity): Entity {
  return new Entity({ ... });
}

// Create new
static create(props: CreateProps): Entity {
  return new Entity({
    id: '0', // Temporary
    ...props,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
```

#### 4.3. Business Methods
```typescript
updateName(name: string): void {
  this._name = name;
  this.updateTimestamp(); // Track changes
}

protected updateTimestamp(): void {
  this._updatedAt = new Date();
}
```

### 5. Use Cases Pattern

#### 5.1. Single Responsibility
- Mỗi use case làm **1 việc duy nhất**
- Không inject use case vào use case khác

#### 5.2. Use Case Structure
```typescript
@Injectable()
export class XxxUseCase {
  constructor(
    @Inject(XXX_REPOSITORY)
    private readonly xxxRepo: IXxxRepository,
  ) {}

  async execute(...params): Promise<Result> {
    // 1. Validation
    // 2. Business logic
    // 3. Call repository
    // 4. Return result
  }
}
```

#### 5.3. Service Delegates
```typescript
@Injectable()
export class XxxService {
  constructor(
    private createUseCase: CreateXxxUseCase,
    private getUseCase: GetXxxUseCase,
    // ... other use cases
  ) {}

  create(dto: CreateXxxDto) {
    return this.createUseCase.execute(dto);
  }
}
```

### 6. Repository Pattern

#### 6.1. Transaction Support
```typescript
async customMethod(
  param: string,
  tx?: PrismaTransactionClient, // ⚠️ Always include
): Promise<Result> {
  const client = this.getClient(tx); // ⚠️ MUST call
  return client.myModel.findMany(...);
}
```

#### 6.2. findManyWithCount Pattern
```typescript
async findManyWithCount(
  filter: FilterOptions,
  tx?: PrismaTransactionClient,
): Promise<[Entity[], number]> {
  const client = this.getClient(tx);
  
  const where = this.buildWhereClause(filter);
  
  const [data, count] = await Promise.all([
    client.myModel.findMany({ where, skip, take }),
    client.myModel.count({ where }),
  ]);

  return [data.map(this.fromData), count];
}
```

### 7. Controller Best Practices

#### 7.1. Always Use Decorators
```typescript
@UsePipes(new ZodValidationPipe(DtoClass))  // Validation
@ResponseMessage('Success message')         // Response
@HttpCode(HttpStatus.NO_CONTENT)           // Status code (if needed)
```

#### 7.2. Transform to Response DTO
```typescript
async getById(@Param('id') id: string) {
  const entity = await this.service.findOne(id);
  return ResponseDto.fromEntity(entity); // ⚠️ Always transform
}
```

#### 7.3. Pagination Response
```typescript
async list(@Query() query: ListQueryDto): Promise<IPaginatedData<ResponseDto>> {
  const [entities, total] = await this.service.list(query);
  
  return {
    data: entities.map(ResponseDto.fromEntity),
    meta: {
      currentPage: query.page,
      itemsPerPage: query.limit,
      totalItems: total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
```

---

## ✅ Checklist Review Code

### Domain Layer
- [ ] Entity extends `BaseEntity<T>`
- [ ] Constructor gọi `setInitialState()`
- [ ] Implement `toObject()` và `getCurrentState()`
- [ ] Factory methods: `create()` và `fromData()`
- [ ] Business methods gọi `updateTimestamp()`

### Application Layer - Use Cases
- [ ] Injectable decorator
- [ ] Inject repository qua interface token
- [ ] Single responsibility
- [ ] Method `execute()` với params rõ ràng
- [ ] Throw NestJS exceptions

### Application Layer - Service
- [ ] Inject use cases (không inject repository trực tiếp)
- [ ] Delegate sang use cases
- [ ] Return entities (không return DTO)

### Infrastructure Layer
- [ ] Extend `PrismaBaseRepository`
- [ ] Implement repository interface
- [ ] `fromData()` map Prisma → Entity
- [ ] `mapEntityToCreateInput()` map Entity → Prisma
- [ ] Custom methods dùng `getClient(tx)`

### Presentation Layer - DTOs
- [ ] Match với OpenAPI spec 100%
- [ ] BigInt → String trong Response DTO
- [ ] Date → ISO String trong Response DTO
- [ ] Query params dùng `z.coerce.number()`
- [ ] Response DTO có `fromEntity()`

### Presentation Layer - Controller
- [ ] `@ResponseMessage()` decorator
- [ ] `ZodValidationPipe` cho validation
- [ ] Convert Entity → Response DTO
- [ ] Return `IPaginatedData` cho list endpoints

### Module
- [ ] Import `PrismaModule`
- [ ] Register Controller, Service
- [ ] Register Repository với interface token
- [ ] Register tất cả Use Cases
- [ ] Export Service nếu cần

---

## 📚 Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Clean Architecture chi tiết
- [DTO_GUIDE.md](./DTO_GUIDE.md) - DTO rules và validation
- [RULES.md](./RULES.md) - Top implementation rules
- [NAMING.md](./NAMING.md) - Naming conventions
- [AI_PROMPTS.md](./AI_PROMPTS.md) - How to work with AI

---

**API Guide Version:** 2.0.0  
**Last Updated:** 2025-11-21  
**Status:** ✅ Production Ready

