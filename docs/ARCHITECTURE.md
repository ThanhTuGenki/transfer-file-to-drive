# 🏗️ Clean Architecture với Use Cases Pattern

> Kiến trúc hệ thống Share Up Backend - Clean Architecture + Use Cases Pattern

---

## 📋 Tổng Quan

Hệ thống được xây dựng theo **Clean Architecture** với **Use Cases Pattern**, mang lại:
- ✅ **Dễ test**: Mỗi use case có thể test độc lập
- ✅ **Dễ maintain**: Logic phân tách rõ ràng
- ✅ **Dễ mở rộng**: Thêm use case mới không ảnh hưởng code cũ
- ✅ **Reusable**: Use cases có thể dùng lại ở nhiều nơi
- ✅ **Business-focused**: Domain logic tách biệt khỏi framework

---

## 🎯 Use Cases Pattern là gì?

**Use Case** = Một hành động cụ thể mà người dùng có thể thực hiện trong hệ thống.

### ❌ Cách cũ (Fat Service)

```typescript
@Injectable()
export class PostService {
  constructor(private repo: PostRepository) {}

  async create(dto: CreateDto) {
    // 50 dòng validation
    // 30 dòng business logic
    // 20 dòng side effects
    return this.repo.save(post);
  }

  async update(id: string, dto: UpdateDto) {
    // 40 dòng validation
    // 30 dòng business logic
    return this.repo.save(post);
  }

  // ... 500 dòng code nữa
}
```

**Vấn đề:**
- Service file quá lớn (500-1000 dòng)
- Khó test (phải mock toàn bộ service)
- Khó maintain (thay đổi logic này ảnh hưởng logic khác)
- Khó reuse logic

### ✅ Cách mới (Use Cases)

```typescript
// create-post.use-case.ts
@Injectable()
export class CreatePostUseCase {
  constructor(private repo: PostRepository) {}

  async execute(dto: CreateDto) {
    // Chỉ logic create
    const post = Post.create(dto);
    return this.repo.save(post);
  }
}

// update-post.use-case.ts
@Injectable()
export class UpdatePostUseCase {
  constructor(private repo: PostRepository) {}

  async execute(id: string, dto: UpdateDto) {
    // Chỉ logic update
    const post = await this.repo.findById(id);
    post.update(dto);
    return this.repo.save(post);
  }
}

// post.service.ts - Chỉ là wrapper
@Injectable()
export class PostService {
  constructor(
    private createUseCase: CreatePostUseCase,
    private updateUseCase: UpdatePostUseCase,
  ) {}

  create(dto: CreateDto) {
    return this.createUseCase.execute(dto);
  }

  update(id: string, dto: UpdateDto) {
    return this.updateUseCase.execute(id, dto);
  }
}
```

**Lợi ích:**
- Mỗi file nhỏ (20-50 dòng)
- Dễ test (mock từng use case)
- Dễ maintain (thay đổi logic độc lập)
- Dễ reuse (inject use case ở nhiều service)

---

## 🏛️ Clean Architecture Layers

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│         (Controllers + DTOs)                │  External interface
│         - API endpoints                     │
│         - Request/Response handling         │
└──────────────────┬──────────────────────────┘
                   │ DTOs
┌──────────────────▼──────────────────────────┐
│        Application Layer                    │
│        (Services + Use Cases)               │  Application business rules
│        - Use case orchestration             │
│        - Service coordination               │
└──────────────────┬──────────────────────────┘
                   │ Entities
┌──────────────────▼──────────────────────────┐
│          Domain Layer                       │
│          (Entities)                         │  Enterprise business rules
│          - Business logic                   │
│          - Domain rules                     │
└──────────────────┬──────────────────────────┘
                   │ Repository Interface
┌──────────────────▼──────────────────────────┐
│       Infrastructure Layer                  │
│       (Repositories + External)             │  External dependencies
│       - Database (Prisma)                   │
│       - External APIs                       │
└─────────────────────────────────────────────┘
```

### Dependency Rule

> **Các layer bên trong KHÔNG biết về layer bên ngoài**

- Domain không biết Application, Infrastructure, Presentation
- Application chỉ biết Domain (qua interfaces)
- Infrastructure implements interfaces của Application
- Presentation chỉ gọi Application

---

## 📁 Cấu Trúc Module

```
src/post/
├── 🔵 domain/                      # Business Logic Layer
│   └── entities/
│       └── post.entity.ts          # Entity với business rules
│
├── 🟢 application/                 # Application Logic Layer
│   ├── interfaces/
│   │   └── post.repository.interface.ts  # Repository contract
│   │
│   ├── use-cases/                  # 👈 Use Cases
│   │   ├── create-post.use-case.ts      # Create logic
│   │   ├── get-post.use-case.ts         # Get logic
│   │   ├── list-posts.use-case.ts       # List logic
│   │   ├── update-post.use-case.ts      # Update logic
│   │   ├── delete-posts.use-case.ts     # Delete logic
│   │   └── index.ts                     # Exports
│   │
│   └── post.service.ts             # Service (wrapper)
│
├── 🟡 infrastructure/              # External Layer
│   └── prisma-post.repository.ts   # Database implementation
│
├── 🟠 presentation/                # API Layer
│   ├── dto/
│   │   ├── create-post.dto.ts
│   │   ├── update-post.dto.ts
│   │   ├── get-post.dto.ts
│   │   ├── list-post.query.dto.ts
│   │   ├── delete-post.dto.ts
│   │   ├── post.response.dto.ts
│   │   └── index.ts
│   │
│   └── post.controller.ts          # API endpoints
│
└── post.module.ts                  # Module definition
```

---

## 🔄 Data Flow

```
1. HTTP Request
   ↓
2. Controller (presentation/)
   ├─ Validate DTO (Zod)
   ├─ Call Service method
   ↓
3. Service (application/)
   ├─ Delegate to appropriate Use Case
   ↓
4. Use Case (application/use-cases/)
   ├─ Business validation
   ├─ Create/Update Entity
   ├─ Call Repository
   ↓
5. Repository (infrastructure/)
   ├─ Prisma query
   ├─ Map Prisma data → Entity
   ↓
6. Entity (domain/)
   ├─ Apply business logic
   ├─ Validate business rules
   ├─ Return updated Entity
   ↓
7. Repository
   ├─ Save Entity
   ├─ Return Entity to Use Case
   ↓
8. Use Case
   ├─ Return Entity to Service
   ↓
9. Service
   ├─ Return Entity to Controller
   ↓
10. Controller
    ├─ Map Entity → Response DTO
    ├─ Return HTTP Response
```

---

## 💡 Khi Nào Thêm Use Case Mới?

### ✅ Nên tạo Use Case mới khi:

1. **Logic phức tạp** (> 20 dòng)
```typescript
// approve-post.use-case.ts
async execute(id: string) {
  const post = await this.repo.findById(id);
  // Complex approval logic
  // Send notifications
  // Update analytics
  return this.repo.save(post);
}
```

2. **Logic có thể reuse**
```typescript
// publish-post.use-case.ts
// Có thể dùng từ API, Queue, Cron job
async execute(id: string) {
  const post = await this.repo.findById(id);
  post.publish();
  return this.repo.save(post);
}
```

3. **Logic có dependency riêng**
```typescript
// export-posts.use-case.ts
constructor(
  private repo: PostRepository,
  private excelService: ExcelService,
  private s3Service: S3Service,
) {}
```

4. **Logic cần transaction**
```typescript
// transfer-ownership.use-case.ts
async execute(postId: string, newOwnerId: string) {
  return this.repo.transaction(async (tx) => {
    const post = await this.repo.findById(postId, tx);
    const newOwner = await this.userRepo.findById(newOwnerId, tx);
    post.transferOwnership(newOwner);
    return this.repo.save(post, tx);
  });
}
```

### ❌ Không cần Use Case khi:

1. **Logic đơn giản** (< 10 dòng)
```typescript
// Đặt trực tiếp trong Service
async findById(id: string) {
  return this.repo.findById(id);
}
```

2. **Chỉ gọi repository**
```typescript
// Không cần use case cho logic này
async count() {
  return this.repo.count();
}
```

---

## 🧪 Testing Strategy

### Test Use Case

```typescript
describe('CreatePostUseCase', () => {
  let useCase: CreatePostUseCase;
  let mockRepo: jest.Mocked<IPostRepository>;

  beforeEach(() => {
    mockRepo = { save: jest.fn() } as any;
    useCase = new CreatePostUseCase(mockRepo);
  });

  it('should create post successfully', async () => {
    const dto = { title: 'Test Post' };
    const createdPost = Post.create(dto);
    mockRepo.save.mockResolvedValue(createdPost);

    const result = await useCase.execute(dto);

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test Post' })
    );
    expect(result).toBe(createdPost);
  });

  it('should throw if post already exists', async () => {
    // Test business rule
  });
});
```

### Test Service

```typescript
describe('PostService', () => {
  let service: PostService;
  let mockCreateUseCase: jest.Mocked<CreatePostUseCase>;

  it('should delegate to create use case', async () => {
    const dto = { title: 'Test' };
    mockCreateUseCase.execute.mockResolvedValue(mockPost);

    await service.create(dto);

    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto);
  });
});
```

### Test Entity (Domain)

```typescript
describe('Post Entity', () => {
  it('should create new post with valid data', () => {
    const post = Post.create({ title: 'Test' });
    
    expect(post.title).toBe('Test');
    expect(post.id).toBeDefined();
  });

  it('should update title', () => {
    const post = Post.create({ title: 'Old' });
    
    post.updateTitle('New');
    
    expect(post.title).toBe('New');
    expect(post.isDirty()).toBe(true);
  });
});
```

---

## 📚 Best Practices

### ✅ DO

1. **Mỗi Use Case làm 1 việc duy nhất**
```typescript
// Good - Single Responsibility
CreatePostUseCase
UpdatePostUseCase
PublishPostUseCase
```

2. **Use Case không phụ thuộc lẫn nhau**
```typescript
// Good - Independent
class CreatePostUseCase {
  constructor(private repo: IPostRepository) {}
}

class UpdatePostUseCase {
  constructor(private repo: IPostRepository) {}
}
```

3. **Tên method là `execute`**
```typescript
// Good - Consistent naming
async execute(dto: CreateDto) { }
```

4. **Inject qua interface**
```typescript
// Good - Dependency Inversion
constructor(
  @Inject(POST_REPOSITORY)
  private repo: IPostRepository
) {}
```

5. **Business logic trong Entity**
```typescript
// Good - Domain-driven
class Post {
  publish() {
    if (this.status === 'draft') {
      this._status = 'published';
      this.updateTimestamp();
    }
  }
}
```

### ❌ DON'T

1. **Không inject Use Case vào Use Case khác**
```typescript
// Bad - Tight coupling
class UpdatePostUseCase {
  constructor(
    private repo: IPostRepository,
    private getUseCase: GetPostUseCase, // ❌
  ) {}
}

// Good - Use repository directly
class UpdatePostUseCase {
  constructor(
    private repo: IPostRepository, // ✅
  ) {}
}
```

2. **Không đặt shared logic trong Use Case**
```typescript
// Bad - Shared logic trong Use Case
class CreatePostUseCase {
  async execute(dto: CreateDto) {
    await this.sendNotification(); // ❌ Shared logic
  }
  
  private sendNotification() { } // ❌
}

// Good - Shared logic trong Service riêng
@Injectable()
class NotificationService {
  sendPostCreated(post: Post) { }
}
```

3. **Không gọi trực tiếp Use Case từ Controller**
```typescript
// Bad - Bypassing Service layer
@Controller('posts')
class PostController {
  constructor(
    private createUseCase: CreatePostUseCase // ❌
  ) {}
}

// Good - Through Service
@Controller('posts')
class PostController {
  constructor(
    private service: PostService // ✅
  ) {}
}
```

4. **Không đặt business logic trong Controller**
```typescript
// Bad
@Post()
async create(@Body() dto: CreateDto) {
  if (dto.title.length < 5) throw new BadRequestException(); // ❌
  return this.service.create(dto);
}

// Good - Validation trong DTO, business logic trong Use Case
@Post()
@UsePipes(new ZodValidationPipe(CreatePostDto)) // ✅ Validation
async create(@Body() dto: CreatePostDto) {
  return this.service.create(dto); // ✅ Delegate
}
```

---

## 🔧 Extending the System

### Thêm Use Case mới

1. **Tạo file** `src/post/application/use-cases/approve-post.use-case.ts`
2. **Implement Use Case**
3. **Export trong `index.ts`**
4. **Register trong `module.ts`**
5. **Inject vào Service**
6. **Thêm endpoint trong Controller**

Xem chi tiết tại [scripts/QUICKSTART.md](../scripts/QUICKSTART.md)

### Thêm Module mới

```bash
npm run generate:module
# Nhập tên module → Hoàn thành!
```

Xem chi tiết tại [scripts/README.md](../scripts/README.md)

---

## 🎓 Tài Liệu Liên Quan

### Kiến Trúc & Patterns
- [API Guide](./API_GUIDE.md) - Hướng dẫn implement API
- [DTO Guide](./DTO_GUIDE.md) - Quy tắc về DTO
- [Rules](./RULES.md) - Top rules quan trọng
- [Naming](./NAMING.md) - Quy ước đặt tên

### Module Generator
- [scripts/README.md](../scripts/README.md) - Hướng dẫn tổng quát
- [scripts/QUICKSTART.md](../scripts/QUICKSTART.md) - Bắt đầu nhanh

### External
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation](https://docs.nestjs.com)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

## ✨ Remember

> **"Clean Architecture không khó, chỉ cần tuân thủ quy tắc!"**

1. **Domain Layer** - Business logic thuần túy
2. **Application Layer** - Orchestration với Use Cases
3. **Infrastructure Layer** - Implementation chi tiết
4. **Presentation Layer** - API interface
5. **Dependency Rule** - Bên trong không biết bên ngoài

---

**Architecture Version:** 2.0.0  
**Last Updated:** 2025-11-21  
**Status:** ✅ Production Ready

