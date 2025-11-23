# AI Workflow - 2 Phase Approach

> **Workflow thông minh:** AI phân tích và lên plan trước, bạn review, approve, rồi AI mới implement.

---

## 🎯 Tại Sao Dùng 2-Phase?

### ❌ 1-Phase (Cũ)
```
You → Prompt → AI implement ngay → Review code → Fix issues
```
- Rủi ro: AI có thể hiểu sai yêu cầu
- Tốn thời gian: Phải fix nhiều nếu sai direction

### ✅ 2-Phase (Mới)
```
You → Prompt → AI lên plan → You review plan → Approve → AI implement
```
- An toàn: Review plan trước khi code
- Nhanh: Chỉnh plan dễ hơn chỉnh code
- Rõ ràng: Biết chính xác AI sẽ làm gì

---

## 📋 Phase 1: Planning & Analysis

### 🎯 Universal Prompt Template

```
# PHASE 1: ANALYSIS & PLANNING

Hãy phân tích @openapi.yaml và lên plan để implement API sau:

## API Request
{Endpoint hoặc feature cần implement}

Examples:
- "GET /api/v1/categories"
- "Toàn bộ CRUD cho Categories"
- "POST /api/v1/categories với validation"

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

List tất cả files cần tạo/update với path đầy đủ:

#### Files Mới (Create)
```
[ ] src/{feature}/domain/entities/{entity}.entity.ts
[ ] src/{feature}/application/interfaces/{entity}.repository.interface.ts
[ ] src/{feature}/application/{feature}.service.ts
[ ] src/{feature}/infrastructure/prisma-{entity}.repository.ts
[ ] src/{feature}/presentation/dto/{entity}.response.dto.ts
[ ] src/{feature}/presentation/dto/create-{entity}.dto.ts
[ ] src/{feature}/presentation/dto/update-{entity}.dto.ts
[ ] src/{feature}/presentation/dto/list-{entities}.query.dto.ts
[ ] src/{feature}/presentation/dto/get-{entity}.dto.ts
[ ] src/{feature}/presentation/dto/delete-{entities}.dto.ts
[ ] src/{feature}/presentation/{feature}.controller.ts
[ ] src/{feature}/{feature}.module.ts
```

#### Files Update (nếu có)
```
[ ] src/app.module.ts (import và register module)
```

### 4. Method Signatures Plan

Cho mỗi layer, list methods cần implement:

#### Entity Methods
```typescript
// Factory methods
static fromData(data: Prisma{Entity}): {Entity}
static create(props: {...}): {Entity}

// Business methods
markAsUpdateAPI(payload: {...}): void
// ... other business logic
```

#### Repository Methods
```typescript
// Custom methods (ngoài IBaseRepository)
findByUniqueField(field: string): Promise<{Entity} | null>
findManyWithCount(filter: {...}): Promise<[{Entity}[], number]>
```

#### Service Methods
```typescript
findOne(id: string): Promise<{Entity}>
create(dto: Create{Entity}Dto): Promise<{Entity}>
list(query: List{Entities}QueryDto): Promise<[{Entity}[], number]>
update(id: string, dto: Update{Entity}Dto): Promise<{Entity}>
deleteMany(ids: string[]): Promise<void>
```

#### Controller Endpoints
```typescript
@Get() list(@Query() query: ...): Promise<IPaginatedData<...>>
@Get(':id') getById(@Param() params: ...): Promise<...>
@Post() create(@Body() dto: ...): Promise<...>
@Put(':id') update(@Param() ..., @Body() ...): Promise<void>
@Delete() deleteMany(@Body() dto: ...): Promise<void>
```

### 5. DTO Mapping Plan

Chi tiết cho từng DTO:

#### Response DTO
```typescript
export class {Entity}ResponseDto {
  // List fields với chính xác type (String cho BigInt, string cho Date)
  id: string
  field1: string
  bigIntField: string     // ⚠️ BigInt → String
  dateField: string       // ⚠️ Date → ISO String
  
  // Conversion method
  static fromEntity(entity: {Entity}): {Entity}ResponseDto {
    // List tất cả conversions
  }
}
```

#### Input DTOs
```typescript
// Create DTO
export class Create{Entity}Dto {
  // List fields với validation rules
  field1: z.string().min(...).max(...)
  field2: z.enum([...])
}

// Update DTO
// Query DTO
// Param DTO
// Delete DTO
```

### 6. Business Logic Plan

Nếu có business logic đặc biệt:
- Validation rules cần implement
- Duplicate checks
- Auto-generation logic (slug, code, etc.)
- Relations handling
- Transaction requirements

### 7. Dependencies Check

- [ ] Prisma model {Entity} đã tồn tại?
- [ ] Cần migration mới?
- [ ] Cần install packages mới?
- [ ] Cần import từ modules khác?

### 8. Critical Rules Checklist

Confirm rằng plan tuân thủ:
- [ ] DTO match 100% với @openapi.yaml
- [ ] BigInt fields → String trong Response DTO
- [ ] Date fields → ISO String trong Response DTO
- [ ] Entity constructor gọi setInitialState()
- [ ] Query params dùng z.coerce.number()
- [ ] Repository dùng getClient(tx)
- [ ] Service throw NestJS exceptions
- [ ] Controller dùng @ResponseMessage()
- [ ] Naming convention đúng chuẩn

## Output Format (PHASE 1)

Trình bày plan theo format:

```markdown
# Implementation Plan: {Feature/Endpoint}

## 1. OpenAPI Analysis
- Endpoint: ...
- Method: ...
- Request: ...
- Response: ...
- Validations: ...

## 2. Entity Structure
- Name: ...
- Fields: ...
- BigInt fields: ...
- Date fields: ...

## 3. Files to Create
- [ ] path/to/file1.ts
- [ ] path/to/file2.ts
...

## 4. Files to Update
- [ ] path/to/existing-file.ts (what to add)

## 5. Method Signatures
### Entity
...
### Repository
...
### Service
...
### Controller
...

## 6. DTO Details
### Response DTO
...
### Input DTOs
...

## 7. Business Logic
...

## 8. Implementation Notes
- Special considerations
- Potential issues
- Dependencies

## 9. Estimated Complexity
- Simple / Medium / Complex
- Estimated files: X
- Estimated LOC: ~Y

## 10. Next Steps
Nếu plan được approve:
1. Implement Domain layer
2. Implement Application layer
3. Implement Infrastructure layer
4. Implement Presentation layer
5. Create Module
6. Register in AppModule
7. Self-review checklist
```

---

⚠️ **QUAN TRỌNG:** 
- PHASE 1: CHỈ phân tích và lên plan, KHÔNG viết code
- Đợi approval trước khi proceed to PHASE 2
```

---

## 📋 Phase 2: Implementation

### 🎯 Approval & Implementation Prompt

Sau khi review plan ở Phase 1, dùng prompt này:

```
# PHASE 2: IMPLEMENTATION

Plan đã được approved! Hãy proceed với implementation.

## Approved Plan
{Copy plan từ Phase 1 đã được approve}

## Implementation Requirements

### Documents to Follow
- @IMPLEMENTATION_RULES_SUMMARY.md (CRITICAL)
- @openapi.yaml (source of truth)
- @drive-account (example code)

### Implementation Order
1. ✅ Domain Layer (Entity)
2. ✅ Application Layer (Repository Interface, Service)
3. ✅ Infrastructure Layer (Prisma Repository)
4. ✅ Presentation Layer (DTOs, Controller)
5. ✅ Module
6. ✅ Register in AppModule

### Critical Rules (MUST FOLLOW)
- ✅ DTO MUST match @openapi.yaml 100%
- ✅ BigInt → String in Response DTO
- ✅ Date → ISO String in Response DTO
- ✅ Entity constructor MUST call setInitialState()
- ✅ Query params MUST use z.coerce.number()
- ✅ Repository MUST use getClient(tx)
- ✅ Service MUST throw NestJS exceptions
- ✅ Controller MUST use @ResponseMessage()

### Self-Review After Implementation
Sau khi implement xong, tự check theo checklist trong @IMPLEMENTATION_RULES_SUMMARY.md và báo cáo:
- [ ] All files created successfully
- [ ] All critical rules followed
- [ ] All method signatures match plan
- [ ] All DTOs match OpenAPI spec
- [ ] No linting errors
- [ ] Ready for testing

## Start Implementation Now!
```

---

## 🎯 Example Usage

### Ví Dụ 1: Implement Category CRUD

#### 👤 User (Phase 1 - Planning)

```
# PHASE 1: ANALYSIS & PLANNING

Hãy phân tích @openapi.yaml và lên plan để implement API sau:

## API Request
Toàn bộ CRUD cho Categories (GET list, GET :id, POST, PUT :id, DELETE)

## Your Tasks (PHASE 1 ONLY - KHÔNG CODE)
{... rest of template ...}
```

**Attach files:**
- `@openapi.yaml`

#### 🤖 AI Response (Phase 1)

```markdown
# Implementation Plan: Categories CRUD

## 1. OpenAPI Analysis

### Endpoints
1. GET /api/v1/categories
   - Query params: page, limit, search, orderBy, order
   - Response: Paginated list of categories
   
2. GET /api/v1/categories/:id
   - Path param: id (string)
   - Response: Single category
   
3. POST /api/v1/categories
   - Body: { name: string, description?: string }
   - Response: Created category (201)
   
4. PUT /api/v1/categories/:id
   - Path param: id
   - Body: { name: string, description: string }
   - Response: Success message
   
5. DELETE /api/v1/categories
   - Body: { ids: string[] }
   - Response: Success message

## 2. Entity Structure

### Category Entity
Fields from OpenAPI schema:
- id: string (BigInt in DB)
- name: string (required, 1-255 chars)
- slug: string (required, auto-generated)
- description: string | null
- createdAt: Date → ISO String
- updatedAt: Date → ISO String

**Type Conversions Required:**
- ✅ BigInt → String: id
- ✅ Date → ISO String: createdAt, updatedAt

## 3. Files to Create

### Domain Layer
- [ ] src/categories/domain/entities/category.entity.ts

### Application Layer
- [ ] src/categories/application/interfaces/category.repository.interface.ts
- [ ] src/categories/application/categories.service.ts

### Infrastructure Layer
- [ ] src/categories/infrastructure/prisma-category.repository.ts

### Presentation Layer - DTOs
- [ ] src/categories/presentation/dto/category.response.dto.ts
- [ ] src/categories/presentation/dto/create-category.dto.ts
- [ ] src/categories/presentation/dto/update-category.dto.ts
- [ ] src/categories/presentation/dto/list-categories.query.dto.ts
- [ ] src/categories/presentation/dto/get-category.dto.ts
- [ ] src/categories/presentation/dto/delete-categories.dto.ts

### Presentation Layer - Controller
- [ ] src/categories/presentation/categories.controller.ts

### Module
- [ ] src/categories/categories.module.ts

## 4. Files to Update
- [ ] src/app.module.ts (import CategoriesModule)

## 5. Method Signatures

### Entity (category.entity.ts)
```typescript
// Interface
export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Factory methods
static fromData(data: PrismaCategory): Category
static create(props: { name: string; description?: string }): Category

// Business methods
markAsUpdateAPI(payload: { name?: string; description?: string }): void
private static generateSlug(name: string): string
```

### Repository Interface
```typescript
export interface ICategoryRepository extends IBaseRepository<Category> {
  findByName(name: string, tx?: PrismaTransactionClient): Promise<Category | null>;
  findManyWithCount(filter: {
    skip: number;
    take: number;
    search?: string;
    orderBy: string;
    order: 'asc' | 'desc';
  }, tx?: PrismaTransactionClient): Promise<[Category[], number]>;
}
```

### Service (categories.service.ts)
```typescript
async findOne(id: string): Promise<Category>
async create(dto: CreateCategoryDto): Promise<Category>
async list(query: ListCategoriesQueryDto): Promise<[Category[], number]>
async update(id: string, dto: UpdateCategoryDto): Promise<Category>
async deleteMany(ids: string[]): Promise<void>
```

### Controller (categories.controller.ts)
```typescript
@Get() 
list(@Query() query: ListCategoriesQueryDto): Promise<IPaginatedData<CategoryResponseDto>>

@Get(':id')
getById(@Param() params: GetCategoryParamsDto): Promise<CategoryResponseDto>

@Post()
create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto>

@Put(':id')
update(
  @Param() params: GetCategoryParamsDto,
  @Body() dto: UpdateCategoryDto
): Promise<void>

@Delete()
deleteMany(@Body() dto: DeleteCategoriesDto): Promise<void>
```

## 6. DTO Details

### CategoryResponseDto
```typescript
export class CategoryResponseDto {
  id: string;              // BigInt → String
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;       // Date → ISO String
  updatedAt: string;       // Date → ISO String

  static fromEntity(entity: Category): CategoryResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
```

### CreateCategoryDto
```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
});
```

### UpdateCategoryDto
```typescript
const schema = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
});
// Required: name, description (theo OpenAPI)
```

### ListCategoriesQueryDto
```typescript
const schema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  orderBy: z.enum(['id', 'createdAt', 'name']).default('id'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

### GetCategoryParamsDto
```typescript
const schema = z.object({
  id: z.string().regex(/^[0-9]+$/, 'ID must be numeric string'),
});
```

### DeleteCategoriesDto
```typescript
const schema = z.object({
  ids: z.array(z.string().regex(/^\d+$/)).min(1),
});
```

## 7. Business Logic

### Slug Generation
- Auto-generate từ name khi create
- Algorithm: lowercase, trim, remove special chars, spaces → hyphens
- Example: "Web Development" → "web-development"

### Duplicate Check
- Check name duplicate (case-insensitive) trước khi create
- Throw ConflictException nếu duplicate

### Search
- Search trong name và description (case-insensitive)
- Prisma: mode: 'insensitive'

## 8. Implementation Notes

### Prisma Model Check
✅ Category model đã có trong schema.prisma (assumed)

### No Additional Migrations Needed
Assuming Category model exists with:
- id: BigInt
- name: String
- slug: String
- description: String?
- createdAt: DateTime
- updatedAt: DateTime

### Dependencies
✅ All required packages already installed:
- nestjs-zod (for validation)
- @prisma/client
- zod

## 9. Estimated Complexity

**Complexity:** Medium

**Files:** 13 files
- 1 Entity
- 2 Application (Interface + Service)
- 1 Repository
- 6 DTOs
- 1 Controller
- 1 Module
- 1 Update (app.module.ts)

**Estimated LOC:** ~800-1000 lines

**Estimated Time:** 
- Phase 1 (Planning): 15-20 mins ✅
- Phase 2 (Implementation): 45-60 mins

## 10. Critical Rules Verification

- [x] Plan matches OpenAPI spec 100%
- [x] BigInt → String conversion planned (id field)
- [x] Date → ISO String conversion planned (createdAt, updatedAt)
- [x] Entity will call setInitialState()
- [x] Query params will use z.coerce.number()
- [x] Repository will use getClient(tx)
- [x] Service will throw NestJS exceptions
- [x] Controller will use @ResponseMessage()
- [x] Naming conventions followed

## 11. Next Steps

**WAITING FOR APPROVAL**

If plan is approved, I will proceed to PHASE 2 with implementation in this order:
1. Domain Layer (Entity)
2. Application Layer (Repository Interface, Service)
3. Infrastructure Layer (Repository)
4. Presentation Layer (DTOs, Controller)
5. Module setup
6. Register in AppModule
7. Self-review & report

Please review and approve to proceed! 🚀
```

#### 👤 User Review & Approval

```
Plan looks good! Proceed to Phase 2.

Note: Thêm validation để slug phải unique.
```

#### 👤 User (Phase 2 - Implementation)

```
# PHASE 2: IMPLEMENTATION

Plan đã được approved! Hãy proceed với implementation.

## Approved Plan
{Copy toàn bộ plan từ Phase 1}

## Additional Requirements
- Thêm validation: slug phải unique

## Implementation Requirements
{... rest of Phase 2 template ...}

Start implementation now!
```

**Attach files:**
- `@IMPLEMENTATION_RULES_SUMMARY.md`
- `@openapi.yaml`
- `@drive-account` (folder)

#### 🤖 AI (Phase 2 - Implementation)

```
Đang implement theo approved plan...

[AI sẽ tạo tất cả files theo plan]

✅ Domain Layer completed
✅ Application Layer completed
✅ Infrastructure Layer completed
✅ Presentation Layer completed
✅ Module completed
✅ AppModule updated

Self-Review Report:
- [x] All 13 files created
- [x] All critical rules followed
- [x] Slug unique validation added
- [x] BigInt/Date conversions correct
- [x] All DTOs match OpenAPI
- [x] Ready for testing

Implementation completed! 🎉
```

---

## 🎯 Quick Reference

### Phase 1: Planning
```
Attach: @openapi.yaml
Prompt: "Phân tích và lên plan cho {endpoint/feature}"
AI: Tạo detailed plan
You: Review & approve/adjust
```

### Phase 2: Implementation
```
Attach: @IMPLEMENTATION_RULES_SUMMARY.md, @openapi.yaml, @drive-account
Prompt: "Implement theo approved plan"
AI: Generate code
You: Review & test
```

---

## 💡 Benefits

### ✅ An Toàn
- Review plan trước khi code
- Catch issues sớm
- Tránh refactor lớn

### ✅ Hiệu Quả
- Clear direction
- No guessing
- Faster implementation

### ✅ Professional
- Documented plan
- Traceability
- Team collaboration friendly

---

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: PLANNING                                      │
├─────────────────────────────────────────────────────────┤
│  1. User: Request + @openapi.yaml                       │
│  2. AI: Analyze & create plan                           │
│  3. User: Review plan                                   │
│  4. User: Approve / Request changes                     │
│     ├─ If changes → AI update plan → back to step 3    │
│     └─ If approved → proceed to PHASE 2                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: IMPLEMENTATION                                │
├─────────────────────────────────────────────────────────┤
│  1. User: Approve + attach documents                    │
│  2. AI: Implement according to plan                     │
│  3. AI: Self-review & report                            │
│  4. User: Review code & test                            │
│  5. Done! ✅                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Best Practices

### Phase 1 - Planning
1. ✅ Chỉ cần attach @openapi.yaml
2. ✅ Yêu cầu rõ ràng: endpoint hoặc feature
3. ✅ Review plan kỹ: files, methods, DTOs
4. ✅ Request changes nếu cần trước khi approve

### Phase 2 - Implementation
1. ✅ Attach đầy đủ documents
2. ✅ Copy approved plan vào prompt
3. ✅ Note any additional requirements
4. ✅ Review code AI generate
5. ✅ Test thoroughly

---

**2-Phase Workflow Version:** 1.0.0  
**Last Updated:** 2025-11-16  
**Recommended:** Use this approach for all new features! ⭐

