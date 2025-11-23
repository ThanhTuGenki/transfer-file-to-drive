# 📚 Backend Documentation

Chào mừng đến với tài liệu kỹ thuật của **Share Up Backend**!

---

## 🎯 Tài Liệu Chính

### 🔥 [RULES.md](./RULES.md) - Implementation Rules
**⚠️ ĐỌC ĐẦU TIÊN - Top 10 quy tắc quan trọng nhất**

- BigInt → String, Date → ISO String
- setInitialState() trong Entity
- OpenAPI là source of truth
- Checklist trước khi commit
- Common mistakes và solutions

👉 **Đọc khi:** Cần nhắc nhở nhanh các quy tắc trước khi code

---

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - Clean Architecture
**Kiến trúc hệ thống với Use Cases Pattern**

- Clean Architecture layers
- Use Cases Pattern là gì?
- Data flow và dependencies
- Best practices
- Testing strategy

👉 **Đọc khi:** Cần hiểu kiến trúc tổng thể và use cases pattern

---

### 📘 [API_GUIDE.md](./API_GUIDE.md) - API Implementation
**Hướng dẫn implement API từ A-Z**

- Quick reference với templates
- Chi tiết từng layer
- Response format patterns
- Validation rules
- Testing checklist

👉 **Đọc khi:** Đang implement API endpoint mới

---

### 📦 [DTO_GUIDE.md](./DTO_GUIDE.md) - DTO Rules
**Quy tắc chi tiết về Data Transfer Objects**

- Type conversion (BigInt, Date)
- Input DTOs (Create, Update, Query)
- Output DTOs (Response, Pagination)
- Validation với Zod
- OpenAPI → DTO mapping

👉 **Đọc khi:** Đang làm việc với DTOs hoặc validation

---

### 🤖 [AI_PROMPTS.md](./AI_PROMPTS.md) - AI Workflow
**Hướng dẫn làm việc với AI Coding Assistant**

- 2-Phase workflow (Plan → Review → Implement)
- Copy-paste prompts
- Best practices
- Troubleshooting

👉 **Đọc khi:** Muốn AI hỗ trợ code an toàn và hiệu quả ⭐

---

### 📝 [NAMING.md](./NAMING.md) - Naming Conventions
**Quy ước đặt tên cho files, classes, variables**

- File naming patterns
- Class naming conventions
- Variable & method naming
- Database naming (Prisma)

👉 **Đọc khi:** Cần biết cách đặt tên đúng chuẩn

---

## 🚀 Quick Start

### Implement Feature Mới

```
1. Đọc RULES.md                     (5 mins)
2. Cập nhật Prisma Schema & OpenAPI  (10 mins)
3. Run Migration                     (2 mins)
4. Generate Module (optional)        (1 min)
5. Implement theo API_GUIDE.md       (60-90 mins)
6. Review theo Checklist             (10 mins)
7. Test API                          (15 mins)
═══════════════════════════════════════════════
Total: ~103-133 mins
```

### Generate Module Nhanh

```bash
npm run generate:module
# Nhập tên module → Hoàn thành!
```

Xem chi tiết tại [scripts/README.md](../scripts/README.md)

---

## 🔄 AI-Powered Workflow

### 2-Phase Approach (Recommended ⭐)

**Phase 1: Planning**
```
You + @openapi.yaml → AI lên plan → You review → Approve
```

**Phase 2: Implementation**
```
You + docs → AI implement → Done! ✅
```

**Timeline:** ~40-80 mins cho 1 feature

**Xem chi tiết:** [AI_PROMPTS.md](./AI_PROMPTS.md)

---

## 📂 Cấu Trúc Project

```
back-end/
├── docs/                           # 📚 Documentation
│   ├── README.md                   # Index (file này)
│   ├── RULES.md                    # Top implementation rules ⚠️
│   ├── ARCHITECTURE.md             # Clean Architecture + Use Cases
│   ├── API_GUIDE.md                # API implementation guide
│   ├── DTO_GUIDE.md                # DTO rules chi tiết
│   ├── AI_PROMPTS.md               # AI workflow & prompts
│   └── NAMING.md                   # Naming conventions
│
├── scripts/                        # 🔧 Scripts
│   ├── README.md                   # Generator docs
│   ├── QUICKSTART.md               # Quick start generator
│   └── generate-module.ts          # Module generator
│
├── prisma/                         # 🗄️ Database
│   ├── schema.prisma               # Prisma schema
│   └── migrations/                 # Migration files
│
├── src/                            # 💻 Source code
│   ├── core/                       # Core utilities
│   │   ├── base/                   # BaseEntity, BaseRepository
│   │   ├── decorators/             # Custom decorators
│   │   ├── filters/                # Exception filters
│   │   ├── interceptors/           # Response interceptors
│   │   └── prisma/                 # Prisma service
│   │
│   ├── {feature}/                  # Feature modules (Clean Architecture)
│   │   ├── domain/                 # Domain layer
│   │   │   └── entities/           # Entities
│   │   ├── application/            # Application layer
│   │   │   ├── use-cases/          # Use cases
│   │   │   ├── interfaces/         # Repository interfaces
│   │   │   └── {feature}.service.ts
│   │   ├── infrastructure/         # Infrastructure layer
│   │   │   └── prisma-*.repository.ts
│   │   ├── presentation/           # Presentation layer
│   │   │   ├── {feature}.controller.ts
│   │   │   └── dto/                # DTOs
│   │   └── {feature}.module.ts     # Module definition
│   │
│   ├── app.module.ts               # Root module
│   └── main.ts                     # Bootstrap
│
├── openapi.yaml                    # 📋 OpenAPI Specification
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

---

## 📚 Thứ Tự Đọc Tài Liệu

### 🎯 Cho Người Mới

```
1. README.md (file này)           → Overview
2. RULES.md                       → Top rules
3. ARCHITECTURE.md                → Hiểu kiến trúc
4. API_GUIDE.md                   → Implement API
5. DTO_GUIDE.md                   → DTOs chi tiết
6. NAMING.md                      → Naming conventions
```

### ⚡ Cho Developer Đã Biết Clean Architecture

```
1. RULES.md                       → Top rules nhanh
2. API_GUIDE.md Quick Reference   → Templates
3. AI_PROMPTS.md                  → AI workflow (optional)
```

### 🤖 Cho Người Dùng AI Assistant

```
1. AI_PROMPTS.md                  → 2-phase workflow
2. RULES.md                       → Rules để attach cho AI
3. API_GUIDE.md                   → Reference khi cần
```

---

## ❓ FAQ

### Q: Implement API mới, bắt đầu từ đâu?

**A: Workflow chuẩn**
1. Đọc [RULES.md](./RULES.md) (5 mins)
2. Cập nhật Prisma schema + OpenAPI spec
3. Run migration
4. Dùng module generator (optional): `npm run generate:module`
5. Implement theo [API_GUIDE.md](./API_GUIDE.md)
6. Review theo checklist trong RULES.md
7. Test API

**Hoặc dùng AI (2-phase):**
1. Xem [AI_PROMPTS.md](./AI_PROMPTS.md)
2. Phase 1: AI lên plan → Review → Approve
3. Phase 2: AI implement → Review → Test

---

### Q: Làm sao convert BigInt sang String?

**A:** Xem phần "Type Conversion" trong [DTO_GUIDE.md](./DTO_GUIDE.md)

```typescript
// Response DTO
storageUsed: entity.storageUsed.toString()  // BigInt → String
createdAt: entity.createdAt.toISOString()   // Date → ISO String
```

---

### Q: DTO phải tuân theo chuẩn gì?

**A:** 
- DTO PHẢI match 100% với `openapi.yaml`
- BigInt → String trong Response DTO
- Date → ISO String trong Response DTO
- Validation với Zod
- Query params dùng `z.coerce.number()`

Xem chi tiết: [DTO_GUIDE.md](./DTO_GUIDE.md)

---

### Q: Response format chuẩn là gì?

**A:** 

```typescript
// Success
{
  "status": "success",
  "message": "Request successful",
  "data": { ... }
}

// With pagination
{
  "status": "success",
  "message": "Entities listed",
  "data": [ ... ],
  "meta": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}
```

Xem: [API_GUIDE.md - Response Format](./API_GUIDE.md#3-response-format)

---

### Q: Use Cases Pattern là gì?

**A:** 
- Mỗi use case = 1 hành động cụ thể
- Service delegate sang use cases
- Dễ test, maintain, mở rộng

Xem chi tiết: [ARCHITECTURE.md - Use Cases Pattern](./ARCHITECTURE.md#-use-cases-pattern-là-gì)

---

### Q: Làm sao generate module nhanh?

**A:**

```bash
npm run generate:module
# Nhập: my-module
# → Tạo đầy đủ 18 files theo Clean Architecture!
```

Xem: [scripts/QUICKSTART.md](../scripts/QUICKSTART.md)

---

## 🛠️ Development Commands

```bash
# Development
npm install                 # Install dependencies
npm run start:dev           # Run dev server
npm run build               # Build production
npm run start:prod          # Run production

# Database
npm run migrate:dev         # Create & apply migration
npm run migrate:deploy      # Deploy migration (production)
npx prisma studio           # View database UI

# Code Quality
npm run lint                # Run linter
npm run format              # Format code
npm run test                # Run tests

# Module Generator
npm run generate:module     # Generate new module
```

---

## 🔥 Core Rules (Reminder)

### ✅ DO

1. **OpenAPI là source of truth** - DTO match 100%
2. **BigInt → String** - `.toString()` trong Response DTO
3. **Date → ISO String** - `.toISOString()` trong Response DTO
4. **setInitialState()** - Trong Entity constructor
5. **Use Cases Pattern** - Mỗi use case làm 1 việc
6. **Transaction Support** - `getClient(tx)` trong Repository
7. **Validation với Zod** - Tất cả DTOs
8. **Query params coerce** - `z.coerce.number()` cho query params

### ❌ DON'T

1. **Không tự ý thay đổi DTO** - Phải theo OpenAPI
2. **Không quên convert BigInt/Date** - Sẽ crash
3. **Không skip setInitialState()** - Dirty checking fail
4. **Không inject use case vào use case khác** - Tight coupling
5. **Không đặt business logic trong Controller** - Thuộc về Use Case
6. **Không bypass Service layer** - Controller → Service → Use Case

---

## 📖 External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 📞 Support

Nếu có thắc mắc hoặc cần hỗ trợ:

1. ✅ Check [RULES.md](./RULES.md) - Top rules
2. ✅ Xem example code tại `src/drive-account/`
3. ✅ Đọc [API_GUIDE.md](./API_GUIDE.md)
4. ✅ Search trong [DTO_GUIDE.md](./DTO_GUIDE.md)
5. ✅ Liên hệ team lead

---

## 📊 Documentation Map

```
                    README.md (Start Here)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    RULES.md       ARCHITECTURE.md    AI_PROMPTS.md
        │                │                │
        │                ├─────────┐      │
        │                │         │      │
    API_GUIDE.md    DTO_GUIDE.md  NAMING.md
        │                │
        └────────┬───────┘
                 │
         Example Code (src/drive-account/)
```

---

**Documentation Version:** 2.0.0  
**Last Updated:** 2025-11-21  
**Maintainers:** Share Up Backend Team

**✨ Happy Coding!**
