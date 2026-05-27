---
name: scene-by-scene
description: Use when debugging bugs, investigating errors, or reproducing issues - describes step-by-step from user action to failure point with scene-by-scene narrative format
---

# Scene-by-Scene Bug Reproduction

## Overview

**Mô tả lỗi theo dạng phim - từng cảnh chậm rãi như đang tái hiện hiện trường.**

Thay vì mô tả lỗi bằng stack trace khô khan, scene-by-scene tái hiện lỗi theo format: User thao tác gì → App gọi gì → Gặp lỗi chỗ nào →Fallback xử lý ra sao.

**Core principle:** Một người đọc không biết gì về code cũng có thể hiểu được "chuyện gì đã xảy ra".

## When to Use

**Áp dụng khi:**
- Gặp bug mà error message không rõ ràng hoặc misleading
- Muốn document lỗi để người khác hiểu nhanh
- Cần trace lỗi qua nhiều layer (client → API → service → repository → DB)
- Lỗi có fallback nhưng không ai biết tại sao data không đúng

**Không dùng khi:**
- Bug đơn giản, rõ ràng (1 dòng fix)
- Chỉ cần stack trace đã đủ hiểu

## Core Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SCENE-BY-SCENE FORMAT                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🎬 Scene 1: [Tên cảnh - hành động user]                                │
│  ─────────────────────────────────                                       │
│  User mở app / click nút / điền form...                                │
│        │                                                                │
│        ▼                                                                │
│  ┌──────────────────┐                                                   │
│  │   📱 App State   │                                                   │
│  └────────┬─────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  🎬 Scene 2: [Layer tiếp theo - API call]                              │
│  ─────────────────────────────────                                       │
│  App tự động gọi: GET /api/xxx                                          │
│        │                                                                │
│        ▼                                                                │
│  ┌──────────────────┐                                                   │
│  │   🔄 Loading...  │                                                   │
│  └────────┬─────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  🎬 Scene N: [Gặp lỗi]                                                  │
│  ─────────────────────────────────                                       │
│  💥 Lỗi xảy ra tại đây                                                 │
│                                                                          │
│  ┌──────────────────────────────────────────┐                           │
│  │ 💥 Error Message                         │                           │
│  │ "Exact error như thực tế"               │                           │
│  └──────────────────────────────────────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Template

```
🎬 Scene 1: [User Action]
─────────────────────────────────────────
  User [hành động cụ thể]
        │
        ▼

🎬 Scene 2: [System Call]
─────────────────────────────────────────
  [Component] gọi [API/Function]
        │
        ▼

🎬 Scene 3: [Database/External]
─────────────────────────────────────────
  [Repo/Service] thực hiện [query/action]
        │
        ▼

🎬 Scene 4: 💥 [Error]
─────────────────────────────────────────
  [Error type]: [message]
  Chi tiết: [relevant code snippet]
        │
        ▼

🎬 Scene 5: [Fallback Handling]
─────────────────────────────────────────
  [Component] bắt lỗi → [xử lý fallback]
        │
        ▼

───────────────────────────────────────────────────────────────────────────────

📌 TÓM LẠI:
  1. [Bước 1]
  2. [Bước 2]
  ...
  N. 💥 [Nguyên nhân gốc rễ]
```

## Example - Prisma updatedAt Field Missing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🎬 TÓE MỜ - GẶP LỖI 🎬                                 │
│                    (Scene-by-Scene Bug Reproduction)                            │
└─────────────────────────────────────────────────────────────────────────────────┘

🎬 Scene 1: User vào trang Home
─────────────────────────────────────────
  User mở app Bondy
        │
        ▼
  ┌──────────────────┐
  │   📱 Bondy App   │
  │  Tap "Trang Chủ"  │
  └────────┬─────────┘
           │
           ▼

🎬 Scene 2: App gọi API healing/home
─────────────────────────────────────────
  App tự động gọi:
  GET /api/healing/home
        │
        ▼

🎬 Scene 3: Server xử lý
─────────────────────────────────────────
  healing.service.ts
        │
        ▼
  healing.repository.ts
  prisma.userHealingCourseProgress.findFirst({
    orderBy: { updatedAt: 'desc' }  ◄── 💥 BẮT ĐẦU SAI
  })
        │
        ▼

🎬 Scene 4: 💥 Prisma Validation Error
─────────────────────────────────────────
  Prisma nhìn schema:
  model UserHealingCourseProgress {
    id, userId, courseId, status,
    startedAt, completedAt, currentDay, lastCompletedDay
    // ❌ KHÔNG CÓ updatedAt!
  }

  ┌──────────────────────────────────────────┐
  │ 💥 Unknown argument `updatedAt`          │
  └──────────────────────────────────────────┘
        │
        ▼

🎬 Scene 5: Fallback xử lý
─────────────────────────────────────────
  healing.service.ts bắt catch
  → trả về "personalization unavailable"
  
───────────────────────────────────────────────────────────────────────────────

📌 TÓM LẠI LỖI:
  1. User vào Home
  2. App gọi GET /api/healing/home
  3. Server gọi Prisma query
  4. ❌ orderBy: { updatedAt: 'desc' } - field không tồn tại
  5. Server fallback → HTTP 200 nhưng data không đúng
  6. 💥 User thấy Home nhưng không personalized

🔧 FIX: Đổi updatedAt → startedAt trong code
```

## Quick Reference

| Element | Format |
|---------|--------|
| Scene header | `🎬 Scene N: [Tên cảnh]` |
| Action | `[Actor] [verb] [object]` |
| Arrow | `│` (vertical), `▼` (down), `──►` (right) |
| Error | `💥 [Error type]: [message]` |
| Code | `inline code` hoặc code block |
| Summary | `📌 TÓM LỠI: 1. 2. 3.` |

## Common Mistakes

| Mistake | Why Bad | Fix |
|---------|---------|-----|
| Mô tả theo stack trace | Đọc không hiểu gì nếu không biết code | Mô tả theo hành động user |
| Bỏ qua fallback | Không ai biết bug ảnh hưởng thế nào | Luôn mô tả fallback xảy ra |
| Quá nhiều code | Tràn ngập chi tiết tech | Chỉ show đoạn gây lỗi |
| Không có summary | Khó để người đọc nắm nhanh | Luôn có phần tóm tắt 3-5 bullet |