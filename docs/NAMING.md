# 📝 Naming Conventions Guide

## 🎯 Current Convention: kebab-case (Recommended)

Dự án hiện tại sử dụng **kebab-case** cho file names - đây là best practice!

## 📊 Comparison of Naming Conventions

### 1. kebab-case (✅ Current Choice)
```
create-category.usecase.ts
get-categories.usecase.ts
get-category-by-id.usecase.ts
update-category.usecase.ts
delete-category.usecase.ts
```

**Ưu điểm:**
- ✅ URL-friendly (không cần encode)
- ✅ Git-friendly (case-insensitive filesystems)
- ✅ Easy to read
- ✅ Standard trong web development
- ✅ Được các framework lớn sử dụng (Angular, Vue CLI, etc.)

### 2. camelCase
```
createCategoryUsecase.ts
getCategories.ts
getCategoryById.ts
updateCategory.ts
deleteCategory.ts
```

**Nhược điểm:**
- ❌ Có thể gây confusion với class names
- ❌ Khó đọc với tên file dài

### 3. PascalCase
```
CreateCategoryUsecase.ts
GetCategories.ts
GetCategoryById.ts
UpdateCategory.ts
DeleteCategory.ts
```

**Nhược điểm:**
- ❌ Confusion với class/component names
- ❌ Case-sensitive filesystem issues

### 4. snake_case
```
create_category_usecase.ts
get_categories.ts
get_category_by_id.ts
update_category.ts
delete_category.ts
```

**Nhược điểm:**
- ❌ Không phổ biến trong JavaScript/TypeScript ecosystem
- ❌ Thường dùng cho Python, Ruby

## 🏢 Industry Standards

### Major Frameworks Using kebab-case:

**Angular CLI:**
```bash
ng generate component user-profile
# → user-profile.component.ts
# → user-profile.component.html
# → user-profile.component.scss
```

**Vue CLI:**
```bash
vue create my-project
# → các component files sử dụng kebab-case
```

**Next.js Pages Router:**
```
pages/
├── user-profile.tsx
├── product-details.tsx
└── api/
    ├── get-users.ts
    └── create-order.ts
```

**NestJS:**
```bash
nest generate service user-management
# → user-management.service.ts
# → user-management.controller.ts
```

## 🎨 Pattern trong dự án

### File Naming Pattern:
```
{action}-{entity}.{type}.ts
```

**Examples:**
- `create-category.usecase.ts`
- `get-categories.usecase.ts` 
- `update-category.service.ts`
- `category.repository.ts`

### Folder Structure:
```
application/
└── category/           # entity name (singular)
    ├── dto/
    ├── interfaces/
    ├── services/
    └── use-cases/      # kebab-case
        ├── create-category.usecase.ts
        ├── get-categories.usecase.ts
        └── get-category-by-id.usecase.ts
```

## 🔧 Benefits của kebab-case

### 1. URL Compatibility
```typescript
// API routes match file names perfectly
'/api/categories/get-category-by-id'  // ✅ Clean URL
'/api/categories/getCategoryById'     // ❌ Mixed case in URL
```

### 2. Git Compatibility
```bash
# Không bị conflict trên các OS khác nhau
git add create-category.usecase.ts    # ✅ Works everywhere
git add CreateCategory.usecase.ts     # ❌ Có thể bị conflict
```

### 3. Import Statements
```typescript
// Clear và consistent
import { CreateCategoryUseCase } from './create-category.usecase';
import { GetCategoriesUseCase } from './get-categories.usecase';
import { UpdateCategoryUseCase } from './update-category.usecase';
```

### 4. IDE Support
- ✅ Better autocomplete
- ✅ Easier file searching
- ✅ Clear distinction between files and classes

## 📚 Recommended Patterns

### Use Cases:
- `create-{entity}.usecase.ts`
- `get-{entity}.usecase.ts`
- `get-{entity}-by-id.usecase.ts`
- `update-{entity}.usecase.ts`
- `delete-{entity}.usecase.ts`

### Services:
- `{entity}.service.ts`
- `{entity}-validation.service.ts`
- `{entity}-notification.service.ts`

### Repositories:
- `{entity}.repository.ts`
- `firestore-{entity}.repository.ts`
- `mongodb-{entity}.repository.ts`

### DTOs:
- `create-{entity}.dto.ts`
- `update-{entity}.dto.ts`
- `{entity}-response.dto.ts`

## 🚀 Conclusion

Kebab-case là lựa chọn tốt nhất cho:
- ✅ TypeScript/JavaScript projects
- ✅ Web applications  
- ✅ API development
- ✅ Team collaboration
- ✅ Cross-platform compatibility

**Keep using kebab-case! 🎉**