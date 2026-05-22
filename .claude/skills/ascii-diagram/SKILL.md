---
name: ascii-diagram
description: |
  Chuyển đổi mọi nội dung thành ASCII diagram để visualize trong terminal. Khi user muốn tạo diagram dưới dạng text/ASCII như use-case, stage, sequence, UI flow, data flow, workflow, plan flowchart. Đặc biệt hữu ích khi user cần visualize logic, luồng xử lý, hoặc cấu trúc dữ liệu ngay trong terminal mà không cần công cụ bên ngoài.
triggers:
  - "c2d"
  - "tạo diagram"
---

# ASCII Diagram Skill

Skill này giúp chuyển đổi mọi nội dung thành ASCII diagram để hiển thị trực tiếp trong terminal.

## Các loại Diagram được hỗ trợ

### 1. Use Case Diagram
Mô tả các actor và use case trong hệ thống.

```
┌──────────────┐         ┌──────────────┐
│   Actor      │         │   Actor 2    │
└──────┬───────┘         └──────┬───────┘
       │                         │
       │    ┌────────────────┐   │
       └───►│   Use Case     │◄──┘
            └────────────────┘
```

### 2. Stage Diagram
Mô tả các giai đoạn/stage trong quy trình.

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Stage 1 │───►│ Stage 2 │───►│ Stage 3 │───►│ Done!   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 3. Sequence Diagram
Mô tả luồng tương tác giữa các thành phần theo thứ tự thời gian.

```
Actor          Service         Database        Cache
  │               │               │               │
  │──►call()────►│               │               │
  │               │───query()───►│               │
  │               │               │               │
  │               │◄──result()───│               │
  │◄──response()──│               │               │
  │               │               │               │
```

### 4. UI Flow Diagram
Mô tả luồng di chuyển giữa các màn hình/GUI.

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───►│  Home    │───►│ Settings │
│   Box    │    │  Page    │    │   Page   │
└──────────┘    └────┬─────┘    └──────────┘
                     │
              ┌──────┴──────┐
              │             │
         ┌────▼────┐   ┌────▼────┐
         │ Profile │   │  Menu   │
         └─────────┘   └─────────┘
```

### 5. Data Flow Diagram
Mô tả luồng dữ liệu giữa các process và data store.

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  Input  │─────►│Process A│─────►│ Output  │
└─────────┘      └────┬────┘      └─────────┘
                      │
               ┌──────┴──────┐
               │             │
          ┌────▼────┐   ┌────▼────┐
          │DataStore│   │   API   │
          └─────────┘   └─────────┘
```

### 6. Workflow Diagram
Mô tả quy trình làm việc với các bước và điều kiện rẽ nhánh.

```
┌──────────┐
│  Start   │
└────┬─────┘
     │
     ▼
┌──────────┐     ┌──────────┐
│  Task A  │────►│ Cond?    │
└────┬─────┘     └────┬─────┘
     │            yes/│\no
     ▼              │ │
┌──────────┐       │ ▼
│  Task B  │◄──────┤
└────┬─────┘       │
     │             ▼
     ▼        ┌──────────┐
┌──────────┐  │  Task C  │
│   End    │◄─└────┬─────┘
└──────────┘       │
              ┌────┴────┐
              │ Done!   │
              └─────────┘
```

### 7. Plan Flow Diagram
Mô tả kế hoạch/lộ trình với các milestone.

```
Timeline:  Week 1      Week 2      Week 3      Week 4
          ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
Milestones│ Plan A │ │ Plan B │ │ Plan C │ │Launch! │
          └────────┘ └────────┘ └────────┘ └────────┘
               │                       ▲
               └───────────────────────┘
                    (adjust based on feedback)
```

## Cách sử dụng

Khi nhận được yêu cầu tạo diagram, phân tích nội dung và:

1. **Xác định loại diagram** phù hợp với nội dung
2. **Trích xuất các thành phần** từ context (actors, steps, data, conditions)
3. **Chọn ký tự ASCII** phù hợp cho box drawing:
   - Box: `┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼`
   - Arrows: `──► │ ◄── ◄►`
   - Connectors: `┌────▼────┐`
4. **Tạo diagram** với cấu trúc rõ ràng, dễ đọc
5. **Thêm labels** cho các box và connections nếu cần

## Quy tắc vẽ ASCII Diagram

### Ký tự Box Drawing
```
Borders:     Corners:      Intersections:
┌ u+250C    ├ u+251C      ┬ u+252C
┐ u+2510    ┤ u+2524      ┴ u+2534
└ u+2514    ┬ u+252C      ┼ u+253C
┘ u+2518    ┴ u+2534
│ u+2502    ─ u+2500
```

### Arrows và Connectors
```
Horizontal:  ───► ────◄── ───►
Vertical:    │    ▼     ▲     │
Diagonal:    ╱     ╲    ╱     ╲
Double:      ═══   ║
```

## Ví dụ

**Input:** "Tạo sequence diagram cho luồng đặt hàng: User -> Cart -> Payment -> Order"

**Output:**
```
User          Cart          Payment        Order
  │               │               │           │
  │──addItem()──►│               │           │
  │◄─confirm()───│               │           │
  │               │               │           │
  │──pay()──────►│               │           │
  │               │──process()──►│           │
  │               │               │           │
  │               │◄──success()──│           │
  │◄─receipt()────│               │           │
  │               │               │           │
  │               │               │──create──►│
  │◄──order───────┼───────────────┼───────────┤
  │               │               │           │
```