# 🚀 NestJS Module Generator

> Tạo module NestJS theo Clean Architecture với Use Cases Pattern trong 30 giây

## 📖 Tài Liệu

| File | Mô tả |
|------|-------|
| **[QUICKSTART.md](./QUICKSTART.md)** | 🏃 Bắt đầu ngay - Tạo module đầu tiên |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 🏗️ Hiểu về Use Cases Pattern |
| **[generate-module.ts](./generate-module.ts)** | 🔧 Script generator |

---

## ⚡ Quick Start (30s)

### 1️⃣ Chạy Generator

```bash
npm run generate:module
```

### 2️⃣ Nhập Tên Module

```bash
Module name (kebab-case): user
```

### 3️⃣ Done! 🎉

```
✨ Module generated successfully!

📦 Generated structure:
   ├── domain/entities/user.entity.ts
   ├── application/
   │   ├── interfaces/user.repository.interface.ts
   │   ├── use-cases/ (5 use cases)
   │   └── user.service.ts
   ├── infrastructure/prisma-user.repository.ts
   ├── presentation/
   │   ├── dto/ (6 DTOs)
   │   └── user.controller.ts
   └── user.module.ts
```

---

## 🎯 Tính Năng

### ✅ Generated Code

- ✅ **5 Use Cases** (Create, Get, List, Update, Delete)
- ✅ **6 DTOs** (Create, Update, Get, List Query, Delete, Response)
- ✅ **5 API Endpoints** (POST, GET, GET list, PUT, DELETE)
- ✅ **Full CRUD** ready to use
- ✅ **Type-safe** với TypeScript
- ✅ **Validation** với class-validator
- ✅ **Clean Architecture** structure

### 🏗️ Architecture

```
┌─────────────────────────────────────┐
│       Presentation Layer            │  Controller + DTOs
│         (API/UI)                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │  Service + Use Cases
│      (Business Logic)               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Domain Layer                 │  Entities + Rules
│     (Core Business)                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Infrastructure Layer            │  Repository + Prisma
│    (Database/External)              │
└─────────────────────────────────────┘
```

---

## 📦 Generated Files

### Domain Layer
```typescript
// domain/entities/user.entity.ts
export class User extends BaseEntity<IUser> {
  // Business logic & validation
  // Factory methods
  // State management
}
```

### Application Layer
```typescript
// application/use-cases/create-user.use-case.ts
@Injectable()
export class CreateUserUseCase {
  async execute(dto: CreateUserDto): Promise<User> {
    // Business logic for creating user
  }
}

// application/user.service.ts
@Injectable()
export class UserService {
  constructor(
    private createUseCase: CreateUserUseCase,
    private getUseCase: GetUserUseCase,
    // ... other use cases
  ) {}
  
  create(dto: CreateUserDto) {
    return this.createUseCase.execute(dto);
  }
}
```

### Infrastructure Layer
```typescript
// infrastructure/prisma-user.repository.ts
@Injectable()
export class PrismaUserRepository 
  extends PrismaBaseRepository<User>
  implements IUserRepository {
  // Database operations
}
```

### Presentation Layer
```typescript
// presentation/user.controller.ts
@Controller('users')
export class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) { }
  
  @Get(':id')
  getById(@Param('id') id: string) { }
  
  @Get()
  list(@Query() query: ListUserQueryDto) { }
  
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) { }
  
  @Delete()
  deleteMany(@Body() dto: DeleteUserDto) { }
}
```

---

## 🔧 Customize

### Thêm Use Case Mới

```typescript
// 1. Tạo file
touch src/user/application/use-cases/activate-user.use-case.ts

// 2. Implement
@Injectable()
export class ActivateUserUseCase {
  async execute(id: string): Promise<User> {
    // Your logic
  }
}

// 3. Export trong index.ts
export * from './activate-user.use-case';

// 4. Register trong module
providers: [
  // ...
  ActivateUserUseCase,
]

// 5. Inject vào Service
constructor(
  private activateUseCase: ActivateUserUseCase,
) {}
```

### Thêm DTO Mới

```typescript
// presentation/dto/activate-user.dto.ts
export class ActivateUserDto {
  @IsBoolean()
  isActive: boolean;
}

// Export trong index.ts
export * from './activate-user.dto';
```

---

## 💡 Best Practices

### ✅ DO

```typescript
// ✅ Mỗi use case làm 1 việc
CreateUserUseCase
UpdateUserUseCase
ActivateUserUseCase

// ✅ Use case không phụ thuộc lẫn nhau
class CreateUserUseCase {
  constructor(private repo: IUserRepository) {}
}

// ✅ Tên method là execute
async execute(dto: CreateDto) { }

// ✅ Controller gọi qua Service
constructor(private service: UserService) {}
```

### ❌ DON'T

```typescript
// ❌ Không inject use case vào use case khác
class UpdateUserUseCase {
  constructor(
    private repo: IUserRepository,
    private getUseCase: GetUserUseCase, // ❌
  ) {}
}

// ❌ Không gọi trực tiếp use case từ controller
constructor(
  private createUseCase: CreateUserUseCase // ❌
) {}

// ❌ Không đặt shared logic trong use case
class CreateUserUseCase {
  private sendEmail() { } // ❌ Tạo EmailService riêng
}
```

---

## 🧪 Testing

### Test Use Case
```typescript
describe('CreateUserUseCase', () => {
  it('should create user', async () => {
    const mockRepo = { save: jest.fn() };
    const useCase = new CreateUserUseCase(mockRepo);
    
    await useCase.execute(dto);
    
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### Test Service
```typescript
describe('UserService', () => {
  it('should delegate to use case', async () => {
    const mockUseCase = { execute: jest.fn() };
    const service = new UserService(mockUseCase);
    
    await service.create(dto);
    
    expect(mockUseCase.execute).toHaveBeenCalledWith(dto);
  });
});
```

---

## 🎓 Learn More

### 📚 Đọc Thêm
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Hiểu sâu về Use Cases Pattern
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Docs](https://docs.nestjs.com)

### 🆘 Support
Nếu gặp vấn đề, đọc phần **Common Issues** trong [QUICKSTART.md](./QUICKSTART.md)

---

## 📋 Checklist Sau Khi Generate

- [ ] Update Prisma schema
- [ ] Run `npm run prisma:migrate`
- [ ] Complete TODOs in entity
- [ ] Complete TODOs in use cases
- [ ] Implement `findManyWithCount` in repository
- [ ] Import module vào `app.module.ts`
- [ ] Test API endpoints
- [ ] Viết unit tests

---

**Happy Coding! 🚀**

