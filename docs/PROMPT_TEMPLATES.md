# AI Prompting Best Practices

> **Mục đích:** Hướng dẫn cách viết prompts hiệu quả để AI generate code chất lượng cao.

---

## 📋 Mục Lục

- [1. Nguyên Tắc Viết Prompt](#1-nguyên-tắc-viết-prompt)
- [2. Reference Documents Hiệu Quả](#2-reference-documents-hiệu-quả)
- [3. Common Mistakes](#3-common-mistakes)
- [4. Troubleshooting](#4-troubleshooting)

---

## 1. Nguyên Tắc Viết Prompt

### ✅ Do's (Nên Làm)

#### 1. Luôn Reference Documents
```
✅ Tốt: "Tuân thủ @IMPLEMENTATION_RULES_SUMMARY.md"
❌ Xấu: "Implement theo clean architecture"
```

**Lý do:** Documents cung cấp context cụ thể, AI sẽ follow rules chính xác hơn.

---

#### 2. Reference Example Code
```
✅ Tốt: "Tham khảo @drive-account/presentation/drive-accounts.controller.ts"
❌ Xấu: "Code giống như controller khác"
```

**Lý do:** Concrete examples giúp AI hiểu exactly bạn muốn gì.

---

#### 3. Specific About Files
```
✅ Tốt: "Tạo src/categories/domain/entities/category.entity.ts"
❌ Xấu: "Tạo entity file"
```

**Lý do:** Rõ ràng về paths tránh AI đặt sai vị trí.

---

#### 4. Include Checklist
```
✅ Tốt: "Sau khi implement, tự review theo checklist trong @IMPLEMENTATION_RULES_SUMMARY.md"
❌ Xấu: "Implement xong là được"
```

**Lý do:** AI sẽ tự verify và báo cáo quality.

---

#### 5. Mention OpenAPI
```
✅ Tốt: "DTO phải MATCH 100% với @openapi.yaml components/schemas/Category"
❌ Xấu: "Tạo DTO cho Category"
```

**Lý do:** OpenAPI là source of truth, phải exact match.

---

#### 6. Explicit About Type Conversions
```
✅ Tốt: "BigInt → String (.toString()), Date → ISO String (.toISOString())"
❌ Xấu: "Convert types properly"
```

**Lý do:** Đây là lỗi thường gặp nhất, phải nói rõ.

---

#### 7. Request Self-Review
```
✅ Tốt: "Implement và tự review theo checklist, báo cáo kết quả"
❌ Xấu: "Implement code"
```

**Lý do:** AI sẽ check lại code trước khi delivery.

---

### ❌ Don'ts (Không Nên)

#### 1. Prompt Quá Chung Chung
```
❌ Xấu: "Tạo API cho Category"
✅ Tốt: "Implement GET /api/v1/categories dựa trên @openapi.yaml với pagination"
```

---

#### 2. Quên Mention Type Conversion
```
❌ Xấu: "Tạo Response DTO"
✅ Tốt: "Tạo Response DTO, convert BigInt → String, Date → ISO String"
```

---

#### 3. Không Yêu Cầu Self-Review
```
❌ Xấu: "Implement API"
✅ Tốt: "Implement API và tự review theo checklist"
```

---

#### 4. Không Reference Documents
```
❌ Xấu: "Follow best practices"
✅ Tốt: "Tuân thủ @IMPLEMENTATION_RULES_SUMMARY.md"
```

---

#### 5. Không Specify Phase (nếu dùng 2-phase)
```
❌ Xấu: "Làm API Categories"
✅ Tốt: "PHASE 1: Lên plan cho API Categories" hoặc "PHASE 2: Implement theo approved plan"
```

---

## 2. Reference Documents Hiệu Quả

### 📚 Documents Hierarchy

#### Phase 1 (Planning)
```
Required:
- @openapi.yaml (source of truth)

Optional:
- Context notes (business requirements)
```

#### Phase 2 (Implementation)
```
Required:
- @IMPLEMENTATION_RULES_SUMMARY.md (critical rules)
- @openapi.yaml (spec)
- @drive-account (example code)

Optional:
- @DTO_RULES.md (nếu cần chi tiết về DTOs)
- @API_IMPLEMENTATION_GUIDE.md (nếu cần hiểu architecture)
```

---

### 🎯 Cách Attach Documents

#### Trong Cursor / Claude / ChatGPT
```
Syntax: @filename hoặc @folder

Phase 1:
@openapi.yaml

Phase 2:
@IMPLEMENTATION_RULES_SUMMARY.md
@openapi.yaml
@drive-account
```

---

### 📝 Khi Nào Reference Document Nào?

| Situation | Documents Needed |
|-----------|------------------|
| Phase 1 - Planning | `@openapi.yaml` |
| Phase 2 - Implementation | `@IMPLEMENTATION_RULES_SUMMARY.md`, `@openapi.yaml`, `@drive-account` |
| Hiểu về DTOs | `@DTO_RULES.md` |
| Hiểu architecture | `@API_IMPLEMENTATION_GUIDE.md` |
| Quick templates | `@API_QUICK_REFERENCE.md` |
| Naming conventions | `@NAMING_CONVENTIONS.md` |

---

## 3. Common Mistakes

### ❌ Mistake 1: Quên Phase Indicator

**Problem:**
```
"Implement Categories API"
```

**Issue:** AI không biết là lên plan hay implement luôn.

**Solution:**
```
"PHASE 1: Lên plan cho Categories API"

hoặc

"PHASE 2: Implement theo approved plan"
```

---

### ❌ Mistake 2: Không Attach OpenAPI

**Problem:**
```
"Tạo API Categories với pagination và filtering"
```

**Issue:** AI phải guess schema, sẽ không match với OpenAPI spec.

**Solution:**
```
"Phân tích @openapi.yaml và lên plan cho GET /api/v1/categories"
```

---

### ❌ Mistake 3: Quên Mention Type Conversions

**Problem:**
```
"Tạo Response DTO cho Category"
```

**Issue:** AI có thể quên convert BigInt/Date.

**Solution:**
```
"Tạo CategoryResponseDto
- BigInt fields → String (.toString())
- Date fields → ISO String (.toISOString())
- Có static method fromEntity()"
```

---

### ❌ Mistake 4: Không Yêu Cầu Self-Review

**Problem:**
```
"Implement CRUD cho Category"
```

**Issue:** AI có thể miss rules, không tự check.

**Solution:**
```
"Implement CRUD cho Category
Tuân thủ @IMPLEMENTATION_RULES_SUMMARY.md
Tự review theo checklist sau khi xong
Báo cáo kết quả"
```

---

### ❌ Mistake 5: Quá Vague About Requirements

**Problem:**
```
"Thêm validation cho Category"
```

**Issue:** AI không biết validation rules cụ thể nào.

**Solution:**
```
"Thêm validation cho CreateCategoryDto:
- name: required, min 1, max 255
- description: optional
- Validation messages rõ ràng
Match với @openapi.yaml schema"
```

---

## 4. Troubleshooting

### Issue: AI Không Tuân Thủ BigInt Rule

**Symptom:** Response DTO vẫn có `bigint` type thay vì `string`

**Root Cause:** Prompt không explicit về conversion.

**Solution:**
```
CRITICAL: BigInt PHẢI convert sang String trong Response DTO

Example: @drive-account/presentation/dto/drive-account.response.dto.ts

Property type: string (NOT bigint)
Conversion: entity.field.toString()  // BẮT BUỘC
```

---

### Issue: AI Không Gọi setInitialState()

**Symptom:** Entity constructor không gọi `setInitialState()`

**Root Cause:** Prompt không remind về rule này.

**Solution:**
```
CRITICAL: Entity constructor MUST call setInitialState()

Example: @drive-account/domain/entities/drive-account.entity.ts line 55

private constructor(props: IEntity) {
  super();
  // ... assign all properties
  this.setInitialState();  // ⚠️ BẮT BUỘC - MUST BE LAST LINE
}
```

---

### Issue: AI Không Match OpenAPI Spec

**Symptom:** DTO fields/types không giống OpenAPI schema

**Root Cause:** AI không được direct đến exact schema location.

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

### Issue: Query Params Validation Fails

**Symptom:** Validation lỗi với query params (page, limit)

**Root Cause:** Query params là string, cần coerce.

**Solution:**
```
CRITICAL: Query params MUST use z.coerce.number()

Example:
page: z.coerce.number().min(1).default(1)     // ✅ CORRECT
NOT: z.number().min(1).default(1)             // ❌ WRONG

Reason: HTTP query params are strings, must coerce to number
```

---

### Issue: Repository Methods Không Support Transaction

**Symptom:** Transaction không hoạt động

**Root Cause:** Custom methods không dùng `getClient(tx)`.

**Solution:**
```
CRITICAL: Repository custom methods MUST use getClient(tx)

Example: @drive-account/infrastructure/prisma-drive-account.repository.ts

async customMethod(
  ...,
  tx?: PrismaTransactionClient  // ⚠️ Always include this param
): Promise<...> {
  const client = this.getClient(tx);  // ⚠️ MUST call this
  return client.findMany(...);
}
```

---

## 5. Prompt Quality Checklist

Trước khi submit prompt, check:

### Phase 1 Prompt
- [ ] Có từ khóa "PHASE 1"
- [ ] Mention @openapi.yaml
- [ ] Nêu rõ endpoint/feature cần làm
- [ ] Yêu cầu "CHỈ lên plan, không code"
- [ ] List các phần cần có trong plan

### Phase 2 Prompt
- [ ] Có từ khóa "PHASE 2"
- [ ] Mention "approved plan"
- [ ] Attach @IMPLEMENTATION_RULES_SUMMARY.md
- [ ] Attach @openapi.yaml
- [ ] Attach @drive-account
- [ ] List critical rules (BigInt, Date, setInitialState, etc.)
- [ ] Yêu cầu self-review sau khi xong

### General
- [ ] Specific về files cần tạo/update
- [ ] Specific về methods cần implement
- [ ] Mention type conversions
- [ ] Include validation requirements
- [ ] Request self-review và report

---

## 6. Template Structure (Best Practice)

### Optimal Prompt Structure

```
# [PHASE X]: [ACTION]

[Context section]
- What: {endpoint/feature}
- Why: {business reason - optional}
- Current state: {existing code/models}

## Documents
- @required-doc-1
- @required-doc-2
- @example-code

## Requirements (CRITICAL)
1. Rule 1 (specific)
2. Rule 2 (specific)
...

## Tasks
- [ ] Task 1 (actionable)
- [ ] Task 2 (actionable)
...

## Self-Review
- [ ] Check 1
- [ ] Check 2
...

## Output Format
{describe expected output}

⚠️ [Any critical reminders]
```

---

## 7. Examples of Good vs Bad Prompts

### Example 1: Planning

#### ❌ Bad Prompt
```
"Tạo API Categories"
```

#### ✅ Good Prompt
```
PHASE 1: LÊN PLAN

Phân tích @openapi.yaml và tạo implementation plan cho:

API: Toàn bộ CRUD cho Categories

Plan cần bao gồm:
1. Phân tích OpenAPI spec
2. Entity structure (fields, types, conversions)
3. Files structure (full paths)
4. Method signatures (all layers)
5. DTO details (với validation)
6. Business logic
7. Critical rules verification

⚠️ PHASE 1: CHỈ LÊN PLAN - KHÔNG CODE
```

---

### Example 2: Implementation

#### ❌ Bad Prompt
```
"Code Categories như trong plan"
```

#### ✅ Good Prompt
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

Implement theo approved plan + self-review sau khi xong.
```

---

## 8. Quick Reference

### Must-Have Elements

Every prompt should have:

1. **Phase Indicator** (if using 2-phase)
   - `PHASE 1: LÊN PLAN` hoặc `PHASE 2: IMPLEMENT`

2. **Documents References**
   - `@openapi.yaml` (always)
   - `@IMPLEMENTATION_RULES_SUMMARY.md` (Phase 2)
   - `@drive-account` (Phase 2, as example)

3. **Critical Rules**
   - BigInt → String
   - Date → ISO String
   - setInitialState()
   - Other context-specific rules

4. **Self-Review Request**
   - "Tự review theo checklist"
   - "Báo cáo kết quả"

5. **Clear Action**
   - "Lên plan" vs "Implement"
   - Specific endpoint/feature

---

## Summary

### 🎯 Perfect Prompt Formula

```
[Phase Indicator] + [Action] + [Context]
+
[Documents @references]
+
[Critical Rules (explicit)]
+
[Tasks/Requirements (specific)]
+
[Self-Review Request]
=
High-Quality AI Output ✨
```

---

**Best Practices Version:** 1.0.0  
**Last Updated:** 2025-11-16  
**Related:** [Quick Start Prompts](./QUICK_START_PROMPTS.md), [AI Workflow 2-Phase](./AI_WORKFLOW_2_PHASE.md)
