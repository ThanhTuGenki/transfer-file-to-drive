# DTO Rules - Quy Tắc Về Data Transfer Objects

> **⚠️ QUAN TRỌNG:** Tất cả DTO PHẢI tuân theo OpenAPI spec (`openapi.yaml`) làm chuẩn.

---

## 📋 Mục Lục

- [1. Nguyên Tắc Chung](#1-nguyên-tắc-chung)
- [2. Type Conversion Rules](#2-type-conversion-rules)
- [3. Input DTOs](#3-input-dtos)
- [4. Output DTOs (Response)](#4-output-dtos-response)
- [5. Validation Rules](#5-validation-rules)
- [6. Examples](#6-examples)
- [7. Common Mistakes](#7-common-mistakes)

---

## 1. Nguyên Tắc Chung

### 1.1. Source of Truth

```
OpenAPI Spec (openapi.yaml) = SINGLE SOURCE OF TRUTH
         ↓
    DTOs PHẢI match 100%
```

**Workflow:**
1. ✅ Định nghĩa schema trong `openapi.yaml` TRƯỚC
2. ✅ Implement DTO dựa CHÍNH XÁC theo schema
3. ❌ KHÔNG tự ý thay đổi type hoặc thêm/bớt fields

### 1.2. DTO Naming Convention

```typescript
// Input DTOs
CreateEntityDto           // POST /entities
UpdateEntityDto           // PUT /entities/:id
GetEntityParamsDto        // GET /entities/:id (path params)
ListEntitiesQueryDto      // GET /entities (query params)
DeleteEntitiesDto         // DELETE /entities (body)

// Output DTOs
EntityResponseDto         // Response cho entity
```

---

## 2. Type Conversion Rules

### 2.1. ⚠️ BigInt → String (CỰC KỲ QUAN TRỌNG)

**Lý do:** JSON không hỗ trợ BigInt native, phải convert sang string để tránh mất dữ liệu.

#### ❌ SAI - Không Convert

```typescript
// ❌ Entity
export interface IDriveAccount {
  storageUsed: bigint;  // OK trong entity
}

// ❌ Response DTO (SAI!)
export class DriveAccountResponseDto {
  storageUsed: bigint;  // ❌ TypeError: Do not know how to serialize a BigInt
}

// ❌ Sử dụng (SAI!)
return entity;  // ❌ Crash khi serialize
```

#### ✅ ĐÚNG - Convert Sang String

```typescript
// ✅ Entity (giữ nguyên BigInt)
export interface IDriveAccount {
  storageUsed: bigint;
  storageTotal: bigint;
}

// ✅ Response DTO (convert sang string)
export class DriveAccountResponseDto {
  storageUsed: string;    // ✅ String type
  storageTotal: string;   // ✅ String type

  public static fromEntity(entity: DriveAccount): DriveAccountResponseDto {
    return {
      // ... other fields
      storageUsed: entity.storageUsed.toString(),   // ⚠️ Conversion
      storageTotal: entity.storageTotal.toString(), // ⚠️ Conversion
    };
  }
}
```

#### OpenAPI Schema Tương Ứng

```yaml
# openapi.yaml
DriveAccount:
  type: object
  properties:
    storageUsed:
      type: string              # ⚠️ string, NOT integer
      description: Dung lượng đã dùng (bytes)
    storageTotal:
      type: string              # ⚠️ string, NOT integer
      description: Tổng dung lượng (bytes)
```

---

### 2.2. Date → ISO 8601 String

**Lý do:** Consistency và compatibility với frontend.

#### ❌ SAI - Return Date Object

```typescript
// ❌ Response DTO (SAI!)
export class EntityResponseDto {
  createdAt: Date;    // ❌ Sẽ serialize thành số timestamp
  updatedAt: Date;    // ❌ Không consistent
}
```

#### ✅ ĐÚNG - Convert Sang ISO String

```typescript
// ✅ Response DTO
export class EntityResponseDto {
  createdAt: string;  // ✅ ISO 8601 format
  updatedAt: string;  // ✅ ISO 8601 format

  public static fromEntity(entity: Entity): EntityResponseDto {
    return {
      // ... other fields
      createdAt: entity.createdAt.toISOString(),  // ⚠️ Conversion
      updatedAt: entity.updatedAt.toISOString(),  // ⚠️ Conversion
    };
  }
}
```

#### Output Format

```json
{
  "createdAt": "2025-11-15T09:57:40.888Z",  // ✅ ISO 8601
  "updatedAt": "2025-11-16T14:20:30.123Z"   // ✅ ISO 8601
}
```

#### OpenAPI Schema Tương Ứng

```yaml
# openapi.yaml
createdAt:
  type: string
  format: date-time               # ⚠️ date-time format
  description: Thời gian tạo (ISO 8601)
updatedAt:
  type: string
  format: date-time
  description: Thời gian cập nhật (ISO 8601)
```

---

### 2.3. Enum → String Literal

```typescript
// Prisma enum
enum DriveAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  AUTH_ERROR = 'AUTH_ERROR',
}

// ✅ Response DTO
export class DriveAccountResponseDto {
  status: DriveAccountStatus;  // ✅ Giữ nguyên enum type
}

// ✅ Input DTO (Zod validation)
const schema = z.object({
  status: z.enum([
    DriveAccountStatus.ACTIVE,
    DriveAccountStatus.INACTIVE,
    DriveAccountStatus.QUOTA_EXCEEDED,
    DriveAccountStatus.AUTH_ERROR,
  ]),
});
```

#### OpenAPI Schema Tương Ứng

```yaml
# openapi.yaml
status:
  type: string
  enum:
    - ACTIVE
    - INACTIVE
    - QUOTA_EXCEEDED
    - AUTH_ERROR
  description: Trạng thái
```

---

### 2.4. Nullable vs Optional

```typescript
// OpenAPI: nullable field
description:
  type: string | null    # Có thể null
  
// DTO: 
description: string | null;  // ✅ Cho phép null


// OpenAPI: optional field
search:
  type: string
  required: false        # Optional
  
// DTO:
search?: string;         // ✅ Optional property
```

---

## 3. Input DTOs

### 3.1. Create DTO

**Quy tắc:**
- Chỉ chứa fields CẦN THIẾT để tạo entity
- Validation CHẶT CHẼ
- Match với OpenAPI `requestBody`

**Example:**

```typescript
// openapi.yaml
requestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
            minLength: 1
            maxLength: 255
          email:
            type: string
            format: email
            maxLength: 255
        required:
          - name
          - email

// ⬇️ Convert to DTO

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateDriveAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z
    .string()
    .max(255)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' }),
});

export class CreateDriveAccountDto extends createZodDto(
  CreateDriveAccountSchema,
) {}
```

---

### 3.2. Update DTO

**Quy tắc:**
- Chứa fields CÓ THỂ UPDATE
- Validation tương tự Create DTO
- Match với OpenAPI `requestBody` của PUT/PATCH

**Example:**

```typescript
// openapi.yaml
requestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
            minLength: 1
            maxLength: 255
          status:
            type: string
            enum: [ACTIVE, INACTIVE, QUOTA_EXCEEDED, AUTH_ERROR]
        required:
          - name
          - status

// ⬇️ Convert to DTO

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DriveAccountStatus } from '@prisma/client';

const UpdateDriveAccountSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(255),
  status: z.enum([
    DriveAccountStatus.ACTIVE,
    DriveAccountStatus.INACTIVE,
    DriveAccountStatus.QUOTA_EXCEEDED,
    DriveAccountStatus.AUTH_ERROR,
  ]),
});

export class UpdateDriveAccountDto extends createZodDto(
  UpdateDriveAccountSchema,
) {}
```

---

### 3.3. Query DTO (List/Filter)

**Quy tắc:**
- Pagination: `page`, `limit`
- Filter: `status`, `search`, etc.
- Sorting: `orderBy`, `order`
- Tất cả fields đều OPTIONAL (trừ page/limit có default)
- Sử dụng `z.coerce.number()` cho query params (vì query params là string)

**Example:**

```typescript
// openapi.yaml
parameters:
  - name: page
    in: query
    schema:
      type: integer
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      default: 10
  - name: status
    in: query
    schema:
      type: string
      enum: [ACTIVE, INACTIVE]
  - name: search
    in: query
    schema:
      type: string
  - name: orderBy
    in: query
    schema:
      type: string
      enum: [id, createdAt, name]
      default: id
  - name: order
    in: query
    schema:
      type: string
      enum: [asc, desc]
      default: desc

// ⬇️ Convert to DTO

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DriveAccountStatus } from '@prisma/client';

const ListDriveAccountsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),          // ⚠️ coerce cho query param
  limit: z.coerce.number().min(1).max(100).default(10),
  
  status: z.enum([
    DriveAccountStatus.ACTIVE,
    DriveAccountStatus.INACTIVE,
    DriveAccountStatus.QUOTA_EXCEEDED,
    DriveAccountStatus.AUTH_ERROR,
  ]).optional(),
  
  search: z.string().trim().optional(),
  
  orderBy: z.enum(['id', 'createdAt', 'storageTotal', 'name', 'email']).default('id'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export class ListDriveAccountsQueryDto extends createZodDto(
  ListDriveAccountsQuerySchema,
) {}
```

---

### 3.4. Param DTO

**Quy tắc:**
- Validate path parameters (thường là `id`)
- ID thường là numeric string (Prisma BigInt)

**Example:**

```typescript
// openapi.yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string

// ⬇️ Convert to DTO

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetDriveAccountParamsSchema = z.object({
  id: z.string().regex(/^[0-9]+$/, 'ID must be a numeric string'),
});

export class GetDriveAccountParamsDto extends createZodDto(
  GetDriveAccountParamsSchema,
) {}
```

---

### 3.5. Delete DTO

**Quy tắc:**
- Nhận array of IDs
- Validate: mỗi ID phải là numeric string
- Array không được empty

**Example:**

```typescript
// openapi.yaml
requestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          ids:
            type: array
            items:
              type: string
            minItems: 1
        required:
          - ids

// ⬇️ Convert to DTO

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DeleteDriveAccountsSchema = z.object({
  ids: z
    .array(z.string().regex(/^\d+$/, 'Each ID must be a numeric string'))
    .min(1, 'IDs array cannot be empty'),
});

export class DeleteDriveAccountsDto extends createZodDto(
  DeleteDriveAccountsSchema,
) {}
```

---

## 4. Output DTOs (Response)

### 4.1. Single Entity Response

**Quy tắc:**
- Static method `fromEntity()` để convert từ Domain Entity
- ⚠️ BigInt → String
- ⚠️ Date → ISO String
- Match với OpenAPI response schema

**Example:**

```typescript
// openapi.yaml
responses:
  '200':
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              $ref: '#/components/schemas/DriveAccount'

components:
  schemas:
    DriveAccount:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
        status:
          type: string
          enum: [ACTIVE, INACTIVE, QUOTA_EXCEEDED, AUTH_ERROR]
        storageUsed:
          type: string        # ⚠️ string, NOT integer
        storageTotal:
          type: string        # ⚠️ string, NOT integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

// ⬇️ Convert to DTO

import { DriveAccount as DriveAccountEntity } from '@drive-account/domain/entities/drive-account.entity';
import { DriveAccountStatus } from '@prisma/client';

export class DriveAccountResponseDto {
  id: string;
  name: string;
  email: string;
  status: DriveAccountStatus;
  storageUsed: string;      // ⚠️ BigInt → String
  storageTotal: string;     // ⚠️ BigInt → String
  createdAt: string;        // ⚠️ Date → ISO String
  updatedAt: string;        // ⚠️ Date → ISO String

  public static fromEntity(
    entity: DriveAccountEntity,
  ): DriveAccountResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      status: entity.status,
      storageUsed: entity.storageUsed.toString(),       // ⚠️ Conversion
      storageTotal: entity.storageTotal.toString(),     // ⚠️ Conversion
      createdAt: entity.createdAt.toISOString(),        // ⚠️ Conversion
      updatedAt: entity.updatedAt.toISOString(),        // ⚠️ Conversion
    };
  }
}
```

---

### 4.2. List Response (Pagination)

**Quy tắc:**
- Wrapper object với `items` array và `meta` object
- Meta chứa pagination info

**Example:**

```typescript
// openapi.yaml
responses:
  '200':
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              type: object
              properties:
                items:
                  type: array
                  items:
                    $ref: '#/components/schemas/DriveAccount'
            meta:
              type: object
              properties:
                currentPage:
                  type: integer
                totalPages:
                  type: integer
                totalItems:
                  type: integer
                itemsPerPage:
                  type: integer

// ⬇️ Response structure

export interface IPaginatedData<T> {
  items: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Usage in controller
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

## 5. Validation Rules

### 5.1. String Validation

```typescript
// Required string with min/max length
z.string().min(1, 'Field is required').max(255)

// Email
z.string().email('Invalid email').max(255)

// Custom regex
z.string().regex(/^[0-9]+$/, 'Must be numeric')

// Trim whitespace
z.string().trim()

// Optional string
z.string().optional()

// Nullable string
z.string().nullable()
```

---

### 5.2. Number Validation

```typescript
// Integer
z.number().int()

// Min/Max
z.number().min(1).max(100)

// Coerce from string (for query params)
z.coerce.number().min(1)

// Optional with default
z.coerce.number().default(10)
```

---

### 5.3. Array Validation

```typescript
// Non-empty array
z.array(z.string()).min(1, 'Array cannot be empty')

// Array with element validation
z.array(z.string().regex(/^\d+$/))

// Min/Max items
z.array(z.string()).min(1).max(100)
```

---

### 5.4. Enum Validation

```typescript
// String enum
z.enum(['ACTIVE', 'INACTIVE'])

// Prisma enum
z.enum([
  DriveAccountStatus.ACTIVE,
  DriveAccountStatus.INACTIVE,
])
```

---

## 6. Examples

### 6.1. Complete Example - DriveAccount

Xem implementation đầy đủ tại:
- `src/drive-accounts/presentation/dto/`

### 6.2. OpenAPI → DTO Mapping Checklist

Khi implement DTO từ OpenAPI spec:

```
[ ] Check property names (exact match)
[ ] Check property types (string, integer, boolean, etc.)
[ ] Check required fields
[ ] Check optional/nullable fields
[ ] Check validation rules (min, max, format, pattern)
[ ] Check enum values
[ ] Check array constraints (minItems, maxItems)
[ ] Check date format (date-time → ISO string)
[ ] Check BigInt fields (convert to string)
[ ] Check nested objects
```

---

## 7. Common Mistakes

### ❌ Mistake 1: Không Convert BigInt

```typescript
// ❌ SAI
return {
  storageUsed: entity.storageUsed,  // BigInt
};

// ✅ ĐÚNG
return {
  storageUsed: entity.storageUsed.toString(),
};
```

---

### ❌ Mistake 2: Không Convert Date

```typescript
// ❌ SAI
return {
  createdAt: entity.createdAt,  // Date object
};

// ✅ ĐÚNG
return {
  createdAt: entity.createdAt.toISOString(),
};
```

---

### ❌ Mistake 3: DTO Không Match OpenAPI

```typescript
// openapi.yaml
properties:
  name:
    type: string
    minLength: 1
    maxLength: 255

// ❌ SAI - Thiếu validation
z.string()

// ✅ ĐÚNG
z.string().min(1).max(255)
```

---

### ❌ Mistake 4: Quên Coerce Cho Query Params

```typescript
// ❌ SAI - Query params là string
page: z.number().default(1)

// ✅ ĐÚNG - Coerce string to number
page: z.coerce.number().default(1)
```

---

### ❌ Mistake 5: Validation Message Không Rõ Ràng

```typescript
// ❌ SAI
z.string().min(1)  // Default message: "String must contain at least 1 character(s)"

// ✅ ĐÚNG
z.string().min(1, 'Name is required')
```

---

## 8. Testing DTO

### 8.1. Test Valid Data

```typescript
// Test với Postman/curl
POST /api/v1/drive-accounts
{
  "name": "Test Account",
  "email": "test@example.com"
}

// Expected: 201 Created
```

---

### 8.2. Test Invalid Data

```typescript
// Test missing field
POST /api/v1/drive-accounts
{
  "name": "Test"
  // missing email
}

// Expected: 400 Bad Request
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

---

### 8.3. Test BigInt Fields

```typescript
GET /api/v1/drive-accounts/1

// Response PHẢI có string, KHÔNG PHẢI number
{
  "data": {
    "storageUsed": "1234567890123456789",  // ✅ String
    "storageTotal": "9876543210987654321"  // ✅ String
  }
}
```

---

### 8.4. Test Date Fields

```typescript
GET /api/v1/drive-accounts/1

// Response PHẢI có ISO string
{
  "data": {
    "createdAt": "2025-11-15T09:57:40.888Z",  // ✅ ISO 8601
    "updatedAt": "2025-11-16T14:20:30.123Z"   // ✅ ISO 8601
  }
}
```

---

## 9. Summary - Quick Checklist

Trước khi commit DTO code:

```
Input DTOs:
[ ] Match với OpenAPI requestBody schema
[ ] Có đầy đủ validation rules
[ ] Validation messages rõ ràng
[ ] Sử dụng z.coerce.number() cho query params
[ ] Enum validation sử dụng Prisma enum types

Output DTOs:
[ ] Match với OpenAPI response schema
[ ] BigInt → String conversion
[ ] Date → ISO String conversion
[ ] Có static method fromEntity()
[ ] Không chứa business logic

General:
[ ] File naming đúng convention
[ ] Import từ đúng paths
[ ] Có JSDoc comments (nếu cần)
```

---

**DTO Rules Version:** 1.0.0  
**Last Updated:** 2025-11-16

