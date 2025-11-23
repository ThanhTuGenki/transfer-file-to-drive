# Implementation Rules Summary

> **Tóm tắt các quy tắc QUAN TRỌNG NHẤT khi implement API**  
> Đọc document này TRƯỚC KHI bắt đầu code!

---

## 🔥 Top 10 Quy Tắc Vàng

### 1️⃣ OpenAPI Spec là Source of Truth
```
✅ Luôn kiểm tra openapi.yaml TRƯỚC khi tạo DTO
✅ DTO phải match 100% với OpenAPI schema
❌ KHÔNG tự ý thay đổi type hoặc thêm/bớt fields
```

---

### 2️⃣ BigInt → String (Response DTO)
```typescript
// ❌ SAI
storageUsed: entity.storageUsed  // BigInt không serialize được

// ✅ ĐÚNG
storageUsed: entity.storageUsed.toString()
```

**Lý do:** JSON không hỗ trợ BigInt native.

---

### 3️⃣ Date → ISO String (Response DTO)
```typescript
// ❌ SAI
createdAt: entity.createdAt  // Date object

// ✅ ĐÚNG
createdAt: entity.createdAt.toISOString()  // "2025-11-16T14:20:30.123Z"
```

**Lý do:** Consistency và compatibility.

---

### 4️⃣ Entity Constructor Phải Gọi setInitialState()
```typescript
private constructor(props: IEntity) {
  super();
  // ... assign all properties
  this.setInitialState();  // ⚠️ BẮT BUỘC - để dirty checking hoạt động
}
```

**Lý do:** Để BaseEntity có thể track changes.

---

### 5️⃣ Validation Với Zod
```typescript
// ✅ Luôn sử dụng ZodValidationPipe
@Get(':id')
@UsePipes(new ZodValidationPipe(GetEntityParamsDto))
async getById(@Param() params: GetEntityParamsDto) { }
```

---

### 6️⃣ Query Params Cần z.coerce.number()
```typescript
// ❌ SAI - Query params là string
page: z.number().default(1)

// ✅ ĐÚNG
page: z.coerce.number().default(1)
```

---

### 7️⃣ Response Message Decorator
```typescript
// ✅ Luôn sử dụng @ResponseMessage()
@Post()
@ResponseMessage('Entity created successfully')
async create(@Body() dto: CreateEntityDto) { }
```

---

### 8️⃣ Repository getClient() Trong Custom Methods
```typescript
// ✅ ĐÚNG - Support transaction
async customMethod(..., tx?: PrismaTransactionClient) {
  const client = this.getClient(tx);  // ⚠️ Bắt buộc
  return client.findMany(...);
}
```

---

### 9️⃣ Service Throw NestJS Exceptions
```typescript
// ✅ ĐÚNG
throw new NotFoundException(`Entity with ID '${id}' not found.`);
throw new ConflictException(`Entity already exists.`);

// ❌ SAI
throw new Error('Not found');  // Generic error
```

---

### 🔟 Response DTO Static Method fromEntity()
```typescript
// ✅ ĐÚNG
export class EntityResponseDto {
  public static fromEntity(entity: Entity): EntityResponseDto {
    return {
      id: entity.id,
      numberField: entity.numberField.toString(),    // BigInt → String
      createdAt: entity.createdAt.toISOString(),     // Date → ISO
    };
  }
}
```

---

## 📋 Checklist Trước Khi Commit

### Domain Layer (Entity)
```
[ ] Extend BaseEntity<T>
[ ] Có interface IEntity
[ ] Private properties + getters
[ ] Constructor gọi setInitialState()
[ ] Implement toObject() và getCurrentState()
[ ] Factory methods: create() và fromData()
[ ] Business methods gọi updateTimestamp()
```

### Application Layer (Service)
```
[ ] Inject repository qua interface token
[ ] Throw NestJS exceptions (Not*, Conflict*, etc.)
[ ] Return domain entities (không return DTO)
[ ] Không xử lý HTTP concerns
```

### Infrastructure Layer (Repository)
```
[ ] Extend PrismaBaseRepository
[ ] Implement repository interface
[ ] fromData() và mapEntityToCreateInput()
[ ] Custom methods dùng getClient(tx)
```

### Presentation Layer (DTOs)
```
[ ] Match với OpenAPI spec
[ ] BigInt → String trong Response DTO
[ ] Date → ISO String trong Response DTO
[ ] Sử dụng Zod validation
[ ] Query params dùng z.coerce.number()
[ ] Response DTO có fromEntity()
```

### Presentation Layer (Controller)
```
[ ] @ResponseMessage() decorator
[ ] ZodValidationPipe cho validation
[ ] Convert Entity → Response DTO
[ ] Return IPaginatedData cho list endpoints
[ ] Không chứa business logic
```

### Module
```
[ ] Import PrismaModule
[ ] Register Controller, Service, Repository
[ ] Provide: interface token → concrete class
[ ] Export Service nếu cần
```

---

## 🎯 Type Conversion Matrix

| Type trong Entity | Type trong Response DTO | Conversion |
|-------------------|-------------------------|------------|
| `bigint` | `string` | `.toString()` |
| `Date` | `string` | `.toISOString()` |
| `Enum` | `Enum` | Giữ nguyên |
| `string` | `string` | Giữ nguyên |
| `number` | `number` | Giữ nguyên |
| `boolean` | `boolean` | Giữ nguyên |
| `null` | `null` | Giữ nguyên |

---

## 🚫 Common Mistakes

### ❌ Mistake 1: Không Convert BigInt
```typescript
// CRASH!
return { storageUsed: entity.storageUsed };
```

### ❌ Mistake 2: Quên setInitialState()
```typescript
// Dirty checking không hoạt động!
private constructor(props: IEntity) {
  super();
  this._id = props.id;
  // Quên gọi setInitialState()
}
```

### ❌ Mistake 3: DTO Không Match OpenAPI
```typescript
// OpenAPI: minLength: 1, maxLength: 255
// DTO: z.string()  // Thiếu validation!
```

### ❌ Mistake 4: Query Params Không Coerce
```typescript
// Query params là string, phải coerce!
page: z.number()  // SAI!
```

### ❌ Mistake 5: Repository Không Dùng getClient()
```typescript
// Không support transaction!
async customMethod() {
  return this.prisma.myModel.findMany();  // SAI!
}
```

---

## 📖 Khi Nào Đọc Document Nào?

| Tình Huống | Document Cần Đọc |
|------------|------------------|
| Bắt đầu feature mới | [API Implementation Guide](./API_IMPLEMENTATION_GUIDE.md) |
| Cần template nhanh | [API Quick Reference](./API_QUICK_REFERENCE.md) |
| Làm việc với DTO | [DTO Rules](./DTO_RULES.md) |
| Cần đặt tên file/class | [Naming Conventions](./NAMING_CONVENTIONS.md) |
| Nhắc nhở nhanh quy tắc | **IMPLEMENTATION_RULES_SUMMARY.md** (file này) |

---

## 🔍 Quick Debug Guide

### Problem: Response bị lỗi "Do not know how to serialize a BigInt"
**Solution:** Convert BigInt sang string trong Response DTO
```typescript
storageUsed: entity.storageUsed.toString()
```

---

### Problem: Validation không hoạt động
**Solution:** Kiểm tra ZodValidationPipe
```typescript
@UsePipes(new ZodValidationPipe(YourDto))
```

---

### Problem: Entity changes không được save
**Solution:** Kiểm tra setInitialState() trong constructor
```typescript
this.setInitialState();  // Phải có!
```

---

### Problem: Transaction không hoạt động
**Solution:** Sử dụng getClient(tx) trong repository
```typescript
const client = this.getClient(tx);
```

---

### Problem: Query params validation lỗi type
**Solution:** Dùng z.coerce.number()
```typescript
page: z.coerce.number().min(1).default(1)
```

---

## 📞 Need Help?

1. ✅ Đọc [API Implementation Guide](./API_IMPLEMENTATION_GUIDE.md)
2. ✅ Kiểm tra [API Quick Reference](./API_QUICK_REFERENCE.md)
3. ✅ Xem example code tại `src/drive-accounts/`
4. ✅ Search trong [DTO Rules](./DTO_RULES.md)
5. ✅ Liên hệ team lead

---

## 🎓 Learning Path

```
1. Đọc IMPLEMENTATION_RULES_SUMMARY.md (file này)
           ↓
2. Đọc API_IMPLEMENTATION_GUIDE.md (hiểu kiến trúc)
           ↓
3. Đọc DTO_RULES.md (hiểu chi tiết về DTO)
           ↓
4. Xem code example: src/drive-accounts/
           ↓
5. Implement feature mới với API_QUICK_REFERENCE.md
```

---

## ✨ Remember

> **"Clean Architecture không khó, chỉ cần tuân thủ quy tắc!"**

1. **OpenAPI spec là single source of truth**
2. **BigInt → String, Date → ISO String**
3. **setInitialState() trong Entity constructor**
4. **Validation với Zod + ZodValidationPipe**
5. **getClient(tx) trong Repository**

---

**Summary Version:** 1.0.0  
**Last Updated:** 2025-11-16  
**Priority:** 🔥 HIGH - ĐỌC TRƯỚC KHI CODE!

