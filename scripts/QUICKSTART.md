# ⚡ Quick Start - Module Generator

## 🚀 Tạo Module Mới trong 30 giây

### 1. Chạy Generator

```bash
npm run generate:module
```

### 2. Nhập Tên Module

```
Module name (kebab-case, e.g., drive-accounts): your-module
```

**Xong!** 🎉 Module structure được tạo tự động.

---

## 📁 Kết Quả

```
src/your-module/
├── domain/
│   └── entities/your-module.entity.ts
├── application/
│   ├── interfaces/your-module.repository.interface.ts
│   ├── use-cases/
│   │   ├── create-your-module.use-case.ts
│   │   ├── get-your-module.use-case.ts
│   │   ├── list-your-modules.use-case.ts
│   │   ├── update-your-module.use-case.ts
│   │   ├── delete-your-modules.use-case.ts
│   │   └── index.ts
│   └── your-module.service.ts
├── infrastructure/
│   └── prisma-your-module.repository.ts
├── presentation/
│   ├── dto/
│   │   ├── create-your-module.dto.ts
│   │   ├── update-your-module.dto.ts
│   │   ├── get-your-module.dto.ts
│   │   ├── list-your-module.query.dto.ts
│   │   ├── delete-your-module.dto.ts
│   │   ├── your-module.response.dto.ts
│   │   └── index.ts
│   └── your-module.controller.ts
└── your-module.module.ts
```

---

## ✅ Next Steps (10 phút)

### 1. Update Prisma Schema

```prisma
// prisma/schema.prisma
model YourModule {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```bash
npm run prisma:migrate
```

### 2. Hoàn Thiện Entity

```typescript
// src/your-module/domain/entities/your-module.entity.ts
// Tìm các // TODO: và implement các properties và business logic
```

### 3. Hoàn Thiện Use Cases

```typescript
// src/your-module/application/use-cases/create-your-module.use-case.ts
// Thêm validation logic và mapping DTO properties

// src/your-module/application/use-cases/update-your-module.use-case.ts
// Implement update logic cho entity
```

### 4. Implement Repository Method

```typescript
// src/your-module/infrastructure/prisma-your-module.repository.ts
// Implement findManyWithCount method nếu cần custom logic
```

### 5. Import Module

```typescript
// src/app.module.ts
import { YourModule } from './your-module/your-module.module';

@Module({
  imports: [YourModule],
})
```

### 6. Run & Test

```bash
npm run start:dev
```

---

## 🎯 Ví Dụ Thực Tế

### Tạo Module "posts"

```bash
$ npm run generate:module
Module name: post
✨ Module generated successfully!
```

### Test API Endpoints

```bash
# Create
curl -X POST http://localhost:4000/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"name":"My Post"}'

# Get by ID
curl http://localhost:4000/api/v1/posts/123

# List with pagination
curl http://localhost:4000/api/v1/posts?page=1&limit=10&search=test

# Update
curl -X PUT http://localhost:4000/api/v1/posts/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Post"}'

# Delete multiple
curl -X DELETE http://localhost:4000/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"ids":["123","456"]}'
```

---

## 💡 Pro Tips

✅ **Naming**: Luôn dùng kebab-case (singular - ưu tiên)
```
✓ post, user-profile, drive-account (singular - recommended)
✗ Post, UserProfile, drive_account, posts
```

✅ **Use Cases Pattern**: 
- Mỗi use case là một class riêng với logic độc lập
- Service chỉ là wrapper, delegate sang các use cases
- Dễ test, maintain và reuse

✅ **File Structure**: 
- Generator tự động tạo chuẩn Clean Architecture
- 5 use cases mặc định: Create, Get, List, Update, Delete
- 6 DTOs đầy đủ cho mọi operation

✅ **TODOs**: 
- Tìm `// TODO:` trong files để biết cần làm gì
- Ưu tiên: Entity properties → Use case logic → Repository methods

✅ **Full CRUD Ready**: 
- Controller có sẵn 5 endpoints hoàn chỉnh
- Chỉ cần implement business logic

---

## 🆘 Common Issues

**Q: Module đã tồn tại?**
```
A: Script sẽ hỏi overwrite. Chọn 'y' để ghi đè.
```

**Q: Lỗi permission?**
```bash
chmod +x scripts/generate-module.ts
```

**Q: findManyWithCount chưa có trong repository?**
```typescript
// Implement trong infrastructure/prisma-{module}.repository.ts
async findManyWithCount(options: any): Promise<[Entity[], number]> {
  const [entities, count] = await Promise.all([
    this.prisma.yourModel.findMany(options),
    this.prisma.yourModel.count({ where: options.where }),
  ]);
  return [entities.map(this.fromData), count];
}
```

**Q: Muốn customize template?**
```
A: Edit scripts/generate-module.ts
```

**Q: Muốn thêm use case mới?**
```
A: Copy từ use case có sẵn, đổi tên và logic, 
   rồi register trong module.ts và service
```

---

📖 **Full docs:** [README.md](./README.md)

