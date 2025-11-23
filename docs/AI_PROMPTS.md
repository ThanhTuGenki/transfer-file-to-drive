# 🤖 AI Prompts Guide

> Hướng dẫn viết prompts hiệu quả cho AI coding assistant với 2-Phase Workflow

---

## 📚 Mục Lục

- [Quick Start - Copy & Paste](#-quick-start---copy--paste)
- [2-Phase Workflow](#-2-phase-workflow)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)

---

## ⚡ Quick Start - Copy & Paste

### 📋 Phase 1: Planning (Copy This!)

```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: {ĐIỀN_ENDPOINT_Ở_ĐÂY}

Examples:
- GET /api/v1/categories
- POST /api/v1/categories  
- Toàn bộ CRUD Categories

Plan cần bao gồm:
1. Phân tích OpenAPI spec (endpoint, request, response, validation)
2. Entity structure (fields, types, BigInt/Date conversions)
3. Files structure (list đầy đủ paths)
4. Method signatures (Entity, Repository, Service, Controller)
5. DTO details (Response + Input DTOs với validation)
6. Business logic (nếu có)
7. Critical rules verification

Format output:
- OpenAPI Analysis
- Entity Structure
- Files to Create/Update (checklist)
- Method Signatures
- DTO Mapping
- Business Logic
- Implementation Notes
- Estimated Complexity

⚠️ PHASE 1: CHỈ LÊN PLAN - KHÔNG CODE
```

**Attach:** `@openapi.yaml`

---

### ✅ Phase 2: Implementation (After Approval)

```
PHASE 2: IMPLEMENT

Plan approved! Tiến hành implementation.

Documents:
- @RULES.md (BẮT BUỘC)
- @openapi.yaml
- @drive-account

Critical Rules:
✅ DTO match @openapi.yaml 100%
✅ BigInt → String (.toString())
✅ Date → ISO String (.toISOString())
✅ Entity constructor: setInitialState()
✅ Query params: z.coerce.number()
✅ Repository: getClient(tx)
✅ Service: throw NestJS exceptions
✅ Controller: @ResponseMessage()

Implement theo approved plan + self-review sau khi xong.
```

**Attach:**
- `@RULES.md`
- `@openapi.yaml`
- `@drive-account` (folder)

---

## 🔄 2-Phase Workflow

### 🎯 Tại Sao Dùng 2-Phase?

**❌ 1-Phase (Cũ)**
```
You → Prompt → AI implement ngay → Review code → Fix issues
```
- Rủi ro: AI có thể hiểu sai yêu cầu
- Tốn thời gian: Phải fix nhiều nếu sai direction

**✅ 2-Phase (Mới)**
```
You → Prompt → AI lên plan → You review plan → Approve → AI implement
```
- An toàn: Review plan trước khi code
- Nhanh: Chỉnh plan dễ hơn chỉnh code
- Rõ ràng: Biết chính xác AI sẽ làm gì
- Professional: Có documented plan

---

### 📋 Phase 1: Planning & Analysis

#### Mục Tiêu
- Phân tích OpenAPI spec đầy đủ
- Xác định entity structure và type conversions
- Lên danh sách files cần tạo/update
- Định nghĩa method signatures cho tất cả layers
- Map DTOs từ OpenAPI schemas
- Checklist critical rules

#### Template Chi Tiết

```
# PHASE 1: ANALYSIS & PLANNING

Hãy phân tích @openapi.yaml và lên plan để implement API sau:

## API Request
{Endpoint hoặc feature cần implement}

## Your Tasks (PHASE 1 ONLY - KHÔNG CODE)

### 1. Phân Tích OpenAPI Spec
Từ @openapi.yaml, hãy phân tích:
- [ ] Endpoint path và method
- [ ] Request parameters (path, query, body)
- [ ] Request body schema (nếu có)
- [ ] Response schema
- [ ] Validation rules (required, min, max, format, enum, etc.)
- [ ] Status codes (200, 201, 400, 404, etc.)

### 2. Xác Định Entity & Fields
Based on OpenAPI components/schemas:
- Entity name: ?
- Fields và types:
  * id: ?
  * field1: ? (type, validation)
  * field2: ? (type, validation)
  * ...
- BigInt fields cần convert → String: ?
- Date fields cần convert → ISO String: ?
- Relations (nếu có): ?

### 3. Lên Plan Files Structure

#### Files Mới (Create)
- [ ] src/{feature}/domain/entities/{entity}.entity.ts
- [ ] src/{feature}/application/interfaces/{entity}.repository.interface.ts
- [ ] src/{feature}/application/use-cases/create-{entity}.use-case.ts
- [ ] src/{feature}/application/use-cases/get-{entity}.use-case.ts
- [ ] src/{feature}/application/use-cases/list-{entities}.use-case.ts
- [ ] src/{feature}/application/use-cases/update-{entity}.use-case.ts
- [ ] src/{feature}/application/use-cases/delete-{entities}.use-case.ts
- [ ] src/{feature}/application/use-cases/index.ts
- [ ] src/{feature}/application/{feature}.service.ts
- [ ] src/{feature}/infrastructure/prisma-{entity}.repository.ts
- [ ] src/{feature}/presentation/dto/{entity}.response.dto.ts
- [ ] src/{feature}/presentation/dto/create-{entity}.dto.ts
- [ ] src/{feature}/presentation/dto/update-{entity}.dto.ts
- [ ] src/{feature}/presentation/dto/list-{entities}.query.dto.ts
- [ ] src/{feature}/presentation/dto/get-{entity}.dto.ts
- [ ] src/{feature}/presentation/dto/delete-{entities}.dto.ts
- [ ] src/{feature}/presentation/dto/index.ts
- [ ] src/{feature}/presentation/{feature}.controller.ts
- [ ] src/{feature}/{feature}.module.ts

#### Files Update (nếu có)
- [ ] src/app.module.ts (import và register module)

### 4. Method Signatures Plan

#### Entity Methods
```typescript
// Factory methods
static fromData(data: Prisma{Entity}): {Entity}
static create(props: {...}): {Entity}

// Business methods
update{Field}(value: type): void
```

#### Repository Methods
```typescript
// Custom methods
findByUniqueField(field: string, tx?: PrismaTransactionClient): Promise<{Entity} | null>
findManyWithCount(filter: {...}, tx?: PrismaTransactionClient): Promise<[{Entity}[], number]>
```

#### Use Case Methods
```typescript
// Create use case
async execute(dto: Create{Entity}Dto): Promise<{Entity}>

// Get use case
async execute(id: string): Promise<{Entity}>

// List use case
async execute(query: List{Entities}QueryDto): Promise<[{Entity}[], number]>

// Update use case
async execute(id: string, dto: Update{Entity}Dto): Promise<{Entity}>

// Delete use case
async execute(ids: string[]): Promise<void>
```

#### Service Methods
```typescript
create(dto: Create{Entity}Dto): Promise<{Entity}>
findOne(id: string): Promise<{Entity}>
list(query: List{Entities}QueryDto): Promise<[{Entity}[], number]>
update(id: string, dto: Update{Entity}Dto): Promise<{Entity}>
deleteMany(ids: string[]): Promise<void>
```

#### Controller Endpoints
```typescript
@Post() create(@Body() dto: ...): Promise<{Entity}ResponseDto>
@Get(':id') getById(@Param('id') id: string): Promise<{Entity}ResponseDto>
@Get() list(@Query() query: ...): Promise<IPaginatedData<{Entity}ResponseDto>>
@Put(':id') update(@Param('id') id: string, @Body() dto: ...): Promise<{Entity}ResponseDto>
@Delete() deleteMany(@Body() dto: ...): Promise<void>
```

### 5. DTO Mapping Plan

#### Response DTO
```typescript
export class {Entity}ResponseDto {
  id: string
  field1: string
  bigIntField: string     // ⚠️ BigInt → String
  dateField: string       // ⚠️ Date → ISO String
  
  static fromEntity(entity: {Entity}): {Entity}ResponseDto
}
```

#### Input DTOs
```typescript
// Create DTO
field1: z.string().min(...).max(...)
field2: z.enum([...])

// Update DTO
field1: z.string().optional()

// Query DTO
page: z.coerce.number().min(1).default(1)
limit: z.coerce.number().min(1).max(100).default(10)

// Delete DTO
ids: z.array(z.string()).min(1)
```

### 6. Business Logic Plan

- Validation rules cần implement
- Duplicate checks
- Auto-generation logic (slug, code, etc.)
- Relations handling
- Transaction requirements

### 7. Critical Rules Checklist

- [ ] DTO match 100% với @openapi.yaml
- [ ] BigInt fields → String trong Response DTO
- [ ] Date fields → ISO String trong Response DTO
- [ ] Entity constructor gọi setInitialState()
- [ ] Query params dùng z.coerce.number()
- [ ] Repository dùng getClient(tx)
- [ ] Service throw NestJS exceptions
- [ ] Controller dùng @ResponseMessage()

### 8. Implementation Notes

- Special considerations
- Potential issues
- Dependencies

⚠️ PHASE 1: CHỈ LÊN PLAN - KHÔNG CODE
```

**Attach:** `@openapi.yaml`

---

### ✅ Phase 2: Implementation

#### Sau Khi Review & Approve Plan

```
# PHASE 2: IMPLEMENTATION

Plan đã được approved! Hãy proceed với implementation.

## Implementation Requirements

### Documents to Follow
- @RULES.md (CRITICAL)
- @openapi.yaml (source of truth)
- @drive-account (example code)

### Implementation Order
1. ✅ Domain Layer (Entity)
2. ✅ Application Layer (Use Cases, Repository Interface, Service)
3. ✅ Infrastructure Layer (Prisma Repository)
4. ✅ Presentation Layer (DTOs, Controller)
5. ✅ Module
6. ✅ Register in AppModule

### Critical Rules (MUST FOLLOW)
- ✅ DTO MUST match @openapi.yaml 100%
- ✅ BigInt → String (.toString()) in Response DTO
- ✅ Date → ISO String (.toISOString()) in Response DTO
- ✅ Entity constructor MUST call setInitialState()
- ✅ Query params MUST use z.coerce.number()
- ✅ Repository MUST use getClient(tx)
- ✅ Service MUST throw NestJS exceptions
- ✅ Controller MUST use @ResponseMessage()
- ✅ Use Cases follow pattern: execute() method

### Self-Review After Implementation
Sau khi implement xong, tự check theo checklist trong @RULES.md và báo cáo:
- [ ] All files created successfully
- [ ] All critical rules followed
- [ ] All method signatures match plan
- [ ] All DTOs match OpenAPI spec
- [ ] All use cases registered in module
- [ ] Service delegates to use cases
- [ ] No linting errors
- [ ] Ready for testing

## Start Implementation Now!
```

**Attach:**
- `@RULES.md`
- `@openapi.yaml`
- `@drive-account`

---

### 📊 Workflow Timeline

```
Phase 1 Planning:  5-15 mins
    ↓
User Review:       2-5 mins
    ↓
Phase 2 Implement: 30-60 mins
    ↓
User Review:       5-10 mins
    ↓
Testing:          10-15 mins
═══════════════════════════════
Total:            ~52-105 mins
```

---

## 💡 Best Practices

### ✅ Do's (Nên Làm)

#### 1. Luôn Reference Documents
```
✅ Tốt: "Tuân thủ @RULES.md"
❌ Xấu: "Implement theo clean architecture"
```

#### 2. Reference Example Code
```
✅ Tốt: "Tham khảo @drive-account/presentation/drive-account.controller.ts"
❌ Xấu: "Code giống như controller khác"
```

#### 3. Specific About Files
```
✅ Tốt: "Tạo src/categories/domain/entities/category.entity.ts"
❌ Xấu: "Tạo entity file"
```

#### 4. Explicit About Type Conversions
```
✅ Tốt: "BigInt → String (.toString()), Date → ISO String (.toISOString())"
❌ Xấu: "Convert types properly"
```

#### 5. Request Self-Review
```
✅ Tốt: "Implement và tự review theo checklist, báo cáo kết quả"
❌ Xấu: "Implement code"
```

#### 6. Mention OpenAPI
```
✅ Tốt: "DTO phải MATCH 100% với @openapi.yaml components/schemas/Category"
❌ Xấu: "Tạo DTO cho Category"
```

### ❌ Don'ts (Không Nên)

#### 1. Prompt Quá Chung Chung
```
❌ Xấu: "Tạo API cho Category"
✅ Tốt: "Implement GET /api/v1/categories dựa trên @openapi.yaml với pagination"
```

#### 2. Quên Mention Type Conversion
```
❌ Xấu: "Tạo Response DTO"
✅ Tốt: "Tạo Response DTO, convert BigInt → String, Date → ISO String"
```

#### 3. Không Yêu Cầu Self-Review
```
❌ Xấu: "Implement API"
✅ Tốt: "Implement API và tự review theo checklist"
```

#### 4. Không Reference Documents
```
❌ Xấu: "Follow best practices"
✅ Tốt: "Tuân thủ @RULES.md"
```

#### 5. Không Specify Phase
```
❌ Xấu: "Làm API Categories"
✅ Tốt: "PHASE 1: Lên plan cho API Categories"
```

---

## 🆘 Troubleshooting

### Issue 1: AI Không Tuân Thủ BigInt Rule

**Symptom:** Response DTO vẫn có `bigint` type thay vì `string`

**Solution:**
```
CRITICAL: BigInt PHẢI convert sang String trong Response DTO

Example: @drive-account/presentation/dto/drive-account.response.dto.ts

Property type: string (NOT bigint)
Conversion: entity.field.toString()  // BẮT BUỘC
```

---

### Issue 2: AI Không Gọi setInitialState()

**Symptom:** Entity constructor không gọi `setInitialState()`

**Solution:**
```
CRITICAL: Entity constructor MUST call setInitialState()

Example: @drive-account/domain/entities/drive-account.entity.ts

private constructor(props: IEntity) {
  super();
  // ... assign all properties
  this.setInitialState();  // ⚠️ BẮT BUỘC - MUST BE LAST LINE
}
```

---

### Issue 3: AI Không Match OpenAPI Spec

**Symptom:** DTO fields/types không giống OpenAPI schema

**Solution:**
```
DTO MUST match @openapi.yaml EXACTLY

Check:
1. Property names (exact match, case-sensitive)
2. Property types (string vs integer vs array)
3. Required fields
4. Validation rules (min, max, format, enum)

Reference: @openapi.yaml components/schemas/{EntityName}

Confirm: List all fields và types trước khi implement
```

---

### Issue 4: Query Params Validation Fails

**Symptom:** Validation lỗi với query params (page, limit)

**Solution:**
```
CRITICAL: Query params MUST use z.coerce.number()

Example:
page: z.coerce.number().min(1).default(1)     // ✅ CORRECT
NOT: z.number().min(1).default(1)             // ❌ WRONG

Reason: HTTP query params are strings, must coerce to number
```

---

### Issue 5: Repository Không Support Transaction

**Symptom:** Transaction không hoạt động

**Solution:**
```
CRITICAL: Repository custom methods MUST use getClient(tx)

Example: @drive-account/infrastructure/prisma-drive-account.repository.ts

async customMethod(
  ...,
  tx?: PrismaTransactionClient  // ⚠️ Always include
): Promise<...> {
  const client = this.getClient(tx);  // ⚠️ MUST call this
  return client.findMany(...);
}
```

---

### Issue 6: Use Cases Không Được Register

**Symptom:** Dependency injection lỗi khi chạy

**Solution:**
```
CRITICAL: All use cases MUST be registered trong module providers

Example: @drive-account/drive-account.module.ts

providers: [
  DriveAccountService,
  {
    provide: DRIVE_ACCOUNT_REPOSITORY,
    useClass: PrismaDriveAccountRepository,
  },
  CreateDriveAccountUseCase,  // ⚠️ Register all use cases
  GetDriveAccountUseCase,
  ListDriveAccountsUseCase,
  UpdateDriveAccountUseCase,
  DeleteDriveAccountsUseCase,
]
```

---

## 📝 Prompt Quality Checklist

### Phase 1 Prompt
- [ ] Có từ khóa "PHASE 1"
- [ ] Mention @openapi.yaml
- [ ] Nêu rõ endpoint/feature cần làm
- [ ] Yêu cầu "CHỈ lên plan, không code"

### Phase 2 Prompt
- [ ] Có từ khóa "PHASE 2"
- [ ] Mention "Plan approved"
- [ ] Attach @RULES.md
- [ ] Attach @openapi.yaml
- [ ] Attach @drive-account
- [ ] Nhắc về critical rules
- [ ] Yêu cầu self-review

---

## 🎯 Use Cases Examples

### Example 1: Full CRUD

#### Phase 1
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: Toàn bộ CRUD cho Categories
(GET list, GET :id, POST, PUT :id, DELETE)

{... rest of template ...}
```

#### Phase 2 (sau approve)
```
PHASE 2: IMPLEMENT

Plan approved! Tiến hành implementation.

{... rest of template ...}
```

---

### Example 2: Single Endpoint

#### Phase 1
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: GET /api/v1/categories (list với pagination)

{... rest of template ...}
```

---

### Example 3: With Custom Requirements

#### Phase 1
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: POST /api/v1/categories

Additional requirements:
- Name phải unique (case-insensitive)
- Auto-generate slug từ name
- Slug phải unique

{... rest of template ...}
```

---

## 🎨 Customization

### Thêm Requirements Vào Phase 1

```
API: {endpoint}

Additional requirements:
- {requirement 1}
- {requirement 2}
- {requirement 3}

{... rest of template ...}
```

### Chỉnh Plan Khi Review

```
Plan cần adjust:
- {change 1}
- {change 2}

Cập nhật plan với changes này.
```

---

## 📖 Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Clean Architecture pattern
- [API_GUIDE.md](./API_GUIDE.md) - API implementation guide
- [DTO_GUIDE.md](./DTO_GUIDE.md) - DTO rules chi tiết
- [RULES.md](./RULES.md) - Top implementation rules
- [NAMING.md](./NAMING.md) - Naming conventions

---

**AI Prompts Version:** 2.0.0  
**Last Updated:** 2025-11-21  
**Status:** ⚡ Ready to Use!

