# Quick Start Prompts - Copy & Paste Ngay!

> **Prompts cực ngắn** cho 2-Phase Workflow. Chỉ cần copy, điền endpoint, và paste!

---

## 🚀 Phase 1: Planning (Copy This!)

### 📋 Prompt Template

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

## ✅ Phase 2: Implementation (After Approval)

### 📋 Prompt Template

```
PHASE 2: IMPLEMENT

Plan approved! Tiến hành implementation.

Documents:
- @IMPLEMENTATION_RULES_SUMMARY.md (BẮT BUỘC)
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
- `@IMPLEMENTATION_RULES_SUMMARY.md`
- `@openapi.yaml`
- `@drive-account` (folder)

---

## 🎯 Use Cases

### Use Case 1: Full CRUD

#### Phase 1
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: Toàn bộ CRUD cho Categories
(GET list, GET :id, POST, PUT :id, DELETE)

{... rest of Phase 1 template ...}
```

#### Phase 2 (sau khi approve)
```
PHASE 2: IMPLEMENT

Plan approved! Tiến hành implementation.

{... rest of Phase 2 template ...}
```

---

### Use Case 2: Single Endpoint

#### Phase 1
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: GET /api/v1/categories (list với pagination)

{... rest of Phase 1 template ...}
```

---

### Use Case 3: With Custom Requirements

#### Phase 1
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: POST /api/v1/categories

Additional requirements:
- Name phải unique (case-insensitive)
- Auto-generate slug từ name
- Slug phải unique

{... rest of Phase 1 template ...}
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

## 📊 Workflow Timeline

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

## 💡 Pro Tips

### 1. Phase 1 - Chỉ Attach openapi.yaml
```
✅ Nhanh
✅ Đủ thông tin để plan
✅ AI focus vào analysis
```

### 2. Review Plan Kỹ
```
✅ Check files structure
✅ Check method signatures
✅ Check DTO mappings
✅ Check validation rules
```

### 3. Phase 2 - Attach Đầy Đủ
```
✅ IMPLEMENTATION_RULES_SUMMARY.md (rules)
✅ openapi.yaml (spec)
✅ drive-accounts (example)
```

### 4. Note Changes Khi Approve
```
Plan approved!

Additional notes:
- {note 1}
- {note 2}
```

---

## ⚡ Super Quick Version

### Phase 1 (Minimal)
```
PHASE 1: Plan cho {endpoint}

Từ @openapi.yaml, tạo:
- Entity structure
- Files list
- Methods list
- DTOs detail

CHỈ plan, không code.
```

### Phase 2 (Minimal)
```
PHASE 2: Implement approved plan

Tuân thủ @IMPLEMENTATION_RULES_SUMMARY.md
Example: @drive-account
Spec: @openapi.yaml

Implement + self-review.
```

---

## 🔄 Common Adjustments

### Request: Thêm Files
```
Plan cần bổ sung:
- Thêm {file_path} (purpose)
- Update {existing_file} để {reason}
```

### Request: Thay Đổi Logic
```
Business logic adjustment:
- Instead of {old_logic}
- Use {new_logic}
- Reason: {explanation}
```

### Request: Thêm Validation
```
Thêm validations:
- Field {field_name}: {validation_rule}
- Check {condition} before {action}
```

---

## 📱 Mobile-Friendly Version

### P1 (Ultra Short)
```
P1: Plan {endpoint} từ @openapi.yaml
Chi tiết: entity, files, methods, DTOs
Không code.
```

### P2 (Ultra Short)
```
P2: Implement plan
Docs: @IMPLEMENTATION_RULES_SUMMARY.md, @openapi.yaml, @drive-account
Rules: BigInt→String, Date→ISO, setInitialState(), z.coerce
Go!
```

---

## 🎯 Decision Tree

```
Bạn biết chính xác cần gì?
├─ Yes → Use EXAMPLE_PROMPTS.md (1-phase, detailed)
└─ No  → Use QUICK_START_PROMPTS.md (2-phase, safe)

Feature phức tạp?
├─ Yes → Use 2-phase (plan first)
└─ No  → Use 1-phase (direct implement)

Cần review trước?
├─ Yes → Use 2-phase
└─ No  → Use 1-phase
```

---

## 📖 Related Documents

- **AI_WORKFLOW_2_PHASE.md** - Chi tiết đầy đủ về 2-phase approach
- **EXAMPLE_PROMPTS.md** - Ready-to-use prompts (1-phase)
- **PROMPT_TEMPLATES.md** - Prompt templates tổng quát
- **IMPLEMENTATION_RULES_SUMMARY.md** - Rules để attach Phase 2

---

## ✨ Example Conversation

### 👤 You (Phase 1)
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: Toàn bộ CRUD cho Categories

{template}
```

### 🤖 AI
```
# Implementation Plan: Categories CRUD

## 1. OpenAPI Analysis
- Endpoints: GET, POST, PUT, DELETE
...

## 2. Entity Structure
- Category: id, name, slug, description, createdAt, updatedAt
...

## 3. Files to Create
- [ ] src/categories/domain/entities/category.entity.ts
...

WAITING FOR APPROVAL 🚦
```

### 👤 You
```
✅ Approved! 

Note: Thêm validation slug unique.
```

### 👤 You (Phase 2)
```
PHASE 2: IMPLEMENT

Plan approved với note: slug unique validation.

{template}
```

### 🤖 AI
```
Implementing...

✅ All files created
✅ Slug unique validation added
✅ Self-review passed

Ready for testing! 🎉
```

---

**Quick Start Version:** 1.0.0  
**Last Updated:** 2025-11-16  
**Status:** ⚡ Copy & Use Immediately!

