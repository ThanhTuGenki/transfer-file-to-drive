# API Implementation - Quick Reference

> Tài liệu tra cứu nhanh khi implement API. Xem chi tiết tại [API_IMPLEMENTATION_GUIDE.md](./API_IMPLEMENTATION_GUIDE.md)

## 🚀 Quick Start

```bash
# 1. Tạo thư mục feature
mkdir -p src/my-feature/{domain/entities,application/interfaces,infrastructure,presentation/dto}

# 2. Tạo các file cần thiết (xem templates bên dưới)
```

---

## 📋 Checklist 10 Bước

- [ ] **1.** Cập nhật `prisma/schema.prisma`
- [ ] **2.** Run `npm run migrate:dev`
- [ ] **3.** Cập nhật `openapi.yaml`
- [ ] **4.** Tạo Entity (`domain/entities/*.entity.ts`)
- [ ] **5.** Tạo Repository Interface (`application/interfaces/*.interface.ts`)
- [ ] **6.** Tạo Service (`application/*.service.ts`)
- [ ] **7.** Tạo Prisma Repository (`infrastructure/prisma-*.repository.ts`)
- [ ] **8.** Tạo DTOs (`presentation/dto/*.dto.ts`)
- [ ] **9.** Tạo Controller (`presentation/*.controller.ts`)
- [ ] **10.** Tạo Module và register vào AppModule

---

## ⚠️ Quy Tắc Vàng

### 1. BigInt → String
```typescript
// ❌ SAI
storageUsed: entity.storageUsed

// ✅ ĐÚNG
storageUsed: entity.storageUsed.toString()
```

### 2. Date → ISO String
```typescript
// ❌ SAI
createdAt: entity.createdAt

// ✅ ĐÚNG
createdAt: entity.createdAt.toISOString()
```

### 3. DTO Phải Match OpenAPI
```typescript
// Luôn kiểm tra openapi.yaml trước khi tạo DTO
```

### 4. Zod Validation
```typescript
// ✅ Luôn sử dụng
@UsePipes(new ZodValidationPipe(YourDto))
```

### 5. setInitialState() trong Entity Constructor
```typescript
private constructor(props: IEntity) {
  super();
  // ... assign properties
  this.setInitialState(); // ⚠️ BẮT BUỘC
}
```

---

## 📝 Templates Nhanh

### Entity (Domain)

```typescript
import { BaseEntity } from '@core/base/base.entity';

export interface IMyEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MyEntity extends BaseEntity<IMyEntity> {
  private readonly _id: string;
  private _name: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: IMyEntity) {
    super();
    this._id = props.id;
    this._name = props.name;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this.setInitialState(); // ⚠️
  }

  public get id(): string { return this._id; }
  public get name(): string { return this._name; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }

  public static fromData(data: PrismaMyEntity): MyEntity {
    return new MyEntity({
      id: data.id.toString(),
      name: data.name,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  public static create(props: { name: string }): MyEntity {
    const now = new Date();
    return new MyEntity({
      id: '0',
      name: props.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  public toObject(): IMyEntity {
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

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}
```

---

### Repository Interface (Application)

```typescript
import { IBaseRepository } from '@core/base/base.repository';
import { MyEntity } from '../../domain/entities/my-entity.entity';

export const MY_ENTITY_REPOSITORY = 'MyEntityRepository';

export interface IMyEntityRepository extends IBaseRepository<MyEntity> {
  findManyWithCount(filter: {
    skip: number;
    take: number;
    search?: string;
    orderBy: string;
    order: 'asc' | 'desc';
  }): Promise<[MyEntity[], number]>;
}
```

---

### Service (Application)

```typescript
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MyEntity } from '../domain/entities/my-entity.entity';
import { MY_ENTITY_REPOSITORY, IMyEntityRepository } from './interfaces/...';

@Injectable()
export class MyEntitiesService {
  constructor(
    @Inject(MY_ENTITY_REPOSITORY)
    private readonly repo: IMyEntityRepository,
  ) {}

  async findOne(id: string): Promise<MyEntity> {
    const entity = await this.repo.findById(id);
    if (!entity) {
      throw new NotFoundException(`MyEntity with ID '${id}' not found.`);
    }
    return entity;
  }

  async create(dto: CreateMyEntityDto): Promise<MyEntity> {
    const entity = MyEntity.create({ name: dto.name });
    return this.repo.save(entity);
  }

  async list(query: ListMyEntitiesQueryDto): Promise<[MyEntity[], number]> {
    const skip = (query.page - 1) * query.limit;
    return this.repo.findManyWithCount({
      skip,
      take: query.limit,
      search: query.search,
      orderBy: query.orderBy,
      order: query.order,
    });
  }

  async update(id: string, dto: UpdateMyEntityDto): Promise<MyEntity> {
    const entity = await this.findOne(id);
    entity.markAsUpdateAPI(dto);
    return this.repo.save(entity);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const count = await this.repo.deleteByIds(ids);
    if (count === 0 && ids.length > 0) {
      throw new NotFoundException('Entities not found.');
    }
  }
}
```

---

### Repository (Infrastructure)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { PrismaBaseRepository } from '@core/base';
import { MyEntity } from '../domain/entities/my-entity.entity';
import { MyEntity as PrismaMyEntity, Prisma } from '@prisma/client';
import { IMyEntityRepository } from '../application/interfaces/...';

@Injectable()
export class PrismaMyEntityRepository
  extends PrismaBaseRepository<
    MyEntity,
    PrismaMyEntity,
    Prisma.MyEntityCreateInput,
    Prisma.MyEntityDelegate
  >
  implements IMyEntityRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'myEntity'); // ⚠️ camelCase
  }

  protected fromData(data: PrismaMyEntity): MyEntity {
    return MyEntity.fromData(data);
  }

  protected mapEntityToCreateInput(entity: MyEntity): Prisma.MyEntityCreateInput {
    const { id, ...data } = entity.toObject();
    return data;
  }

  async findManyWithCount(filter: { ... }): Promise<[MyEntity[], number]> {
    const client = this.getClient(filter.tx);
    
    const whereClause: Prisma.MyEntityWhereInput = {
      ...(filter.search && {
        name: { contains: filter.search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      client.findMany({
        skip: filter.skip,
        take: filter.take,
        where: whereClause,
        orderBy: { [filter.orderBy]: filter.order },
      }),
      client.count({ where: whereClause }),
    ]);

    return [items.map(MyEntity.fromData), total];
  }
}
```

---

### Response DTO (Presentation)

```typescript
import { MyEntity } from '@my-feature/domain/entities/my-entity.entity';

export class MyEntityResponseDto {
  id: string;
  name: string;
  numberField: string;    // ⚠️ BigInt → String
  createdAt: string;      // ⚠️ Date → ISO String
  updatedAt: string;

  public static fromEntity(entity: MyEntity): MyEntityResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      numberField: entity.numberField.toString(),  // ⚠️
      createdAt: entity.createdAt.toISOString(),   // ⚠️
      updatedAt: entity.updatedAt.toISOString(),   // ⚠️
    };
  }
}
```

---

### Create DTO (Presentation)

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMyEntitySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
});

export class CreateMyEntityDto extends createZodDto(CreateMyEntitySchema) {}
```

---

### Update DTO (Presentation)

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MyEnum } from '@prisma/client';

const UpdateMyEntitySchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum([MyEnum.VALUE1, MyEnum.VALUE2]),
});

export class UpdateMyEntityDto extends createZodDto(UpdateMyEntitySchema) {}
```

---

### List Query DTO (Presentation)

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ListMyEntitiesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  orderBy: z.enum(['id', 'createdAt', 'name']).default('id'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export class ListMyEntitiesQueryDto extends createZodDto(
  ListMyEntitiesQuerySchema,
) {}
```

---

### Delete DTO (Presentation)

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DeleteMyEntitiesSchema = z.object({
  ids: z
    .array(z.string().regex(/^\d+$/, 'Each ID must be a numeric string'))
    .min(1, 'IDs array cannot be empty'),
});

export class DeleteMyEntitiesDto extends createZodDto(DeleteMyEntitiesSchema) {}
```

---

### Param DTO (Presentation)

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetMyEntityParamsSchema = z.object({
  id: z.string().regex(/^[0-9]+$/, 'ID must be a numeric string'),
});

export class GetMyEntityParamsDto extends createZodDto(
  GetMyEntityParamsSchema,
) {}
```

---

### Controller (Presentation)

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
import { MyEntitiesService } from '../application/my-entities.service';
import { MyEntityResponseDto } from './dto/my-entity.response.dto';
import { IPaginatedData } from '@core/interceptors/response.interceptor';

@Controller('my-entities')  // ⚠️ plural, kebab-case
export class MyEntitiesController {
  constructor(private readonly service: MyEntitiesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(ListMyEntitiesQueryDto))
  @ResponseMessage('List entities successfully')
  async list(
    @Query() query: ListMyEntitiesQueryDto,
  ): Promise<IPaginatedData<MyEntityResponseDto>> {
    const [entities, total] = await this.service.list(query);
    return {
      items: entities.map(MyEntityResponseDto.fromEntity),
      meta: {
        currentPage: query.page,
        totalPages: Math.ceil(total / query.limit),
        totalItems: total,
        itemsPerPage: query.limit,
      },
    };
  }

  @Get(':id')
  @UsePipes(new ZodValidationPipe(GetMyEntityParamsDto))
  @ResponseMessage('Request successful')
  async getById(
    @Param() params: GetMyEntityParamsDto,
  ): Promise<MyEntityResponseDto> {
    const entity = await this.service.findOne(params.id);
    return MyEntityResponseDto.fromEntity(entity);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateMyEntityDto))
  @ResponseMessage('Entity created successfully')
  async create(@Body() dto: CreateMyEntityDto): Promise<MyEntityResponseDto> {
    const entity = await this.service.create(dto);
    return MyEntityResponseDto.fromEntity(entity);
  }

  @Put(':id')
  @ResponseMessage('Entity updated successfully')
  async update(
    @Param(new ZodValidationPipe(GetMyEntityParamsDto)) params: GetMyEntityParamsDto,
    @Body(new ZodValidationPipe(UpdateMyEntityDto)) dto: UpdateMyEntityDto,
  ): Promise<void> {
    await this.service.update(params.id, dto);
  }

  @Delete()
  @ResponseMessage('Multiple entities deleted successfully')
  async deleteMany(
    @Body(new ZodValidationPipe(DeleteMyEntitiesDto)) dto: DeleteMyEntitiesDto,
  ): Promise<void> {
    await this.service.deleteMany(dto.ids);
  }
}
```

---

### Module

```typescript
import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { MyEntitiesService } from './application/my-entities.service';
import { MY_ENTITY_REPOSITORY } from './application/interfaces/my-entity.repository.interface';
import { PrismaMyEntityRepository } from './infrastructure/prisma-my-entity.repository';
import { MyEntitiesController } from './presentation/my-entities.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MyEntitiesController],
  providers: [
    MyEntitiesService,
    {
      provide: MY_ENTITY_REPOSITORY,
      useClass: PrismaMyEntityRepository,
    },
  ],
  exports: [MyEntitiesService],
})
export class MyEntitiesModule {}
```

---

## 🔍 Common Commands

```bash
# Tạo migration
npm run migrate:dev -- --name add_my_table

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio

# Run linter
npm run lint

# Run tests
npm run test
```

---

## 📊 Response Format Patterns

### Success (có data)
```json
{
  "status": "success",
  "message": "Request successful",
  "data": { ... }
}
```

### Success (có pagination)
```json
{
  "status": "success",
  "message": "List items successfully",
  "data": {
    "items": [...]
  },
  "meta": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}
```

### Success (không có data)
```json
{
  "status": "success",
  "message": "Operation successful"
}
```

### Error (Validation)
```json
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
```

### Error (Not Found)
```json
{
  "status": "fail",
  "message": "Entity with ID '123' not found."
}
```

### Error (Server Error)
```json
{
  "status": "error",
  "message": "An internal server error occurred."
}
```

---

## 🎯 Testing Checklist

- [ ] Tất cả endpoints hoạt động
- [ ] Validation hoạt động đúng (test với invalid data)
- [ ] Response format đúng chuẩn
- [ ] BigInt fields được convert thành string
- [ ] Date fields ở dạng ISO string
- [ ] Pagination metadata chính xác
- [ ] Error handling đúng (404, 409, 400, 500)
- [ ] OpenAPI spec được cập nhật

---

**Quick Reference Version:** 1.0.0  
**Last Updated:** 2025-11-16

