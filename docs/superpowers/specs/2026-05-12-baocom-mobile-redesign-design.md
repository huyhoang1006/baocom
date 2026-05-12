# BaoCom Mobile Redesign Spec

**Date:** 2026-05-12
**Project:** BaoCom - Hệ thống quản lý suất ăn
**Scope:** Toàn bộ giao diện mobile cho 8 screens
**Design System:** Apple Design Language (SF Pro + Action Blue accent)

---

## 1. Concept & Vision

Thiết kế lại toàn diện theo hướng **mobile-first**. Giao diện lấy cảm hứng từ Apple - **reverent, clean, photography-forward** với UI lùi về để nội dung (thực đơn, thông tin nhân viên) được tỏa sáng. Action Blue (#0066cc) là signal tương tác duy nhất. Typography SF Pro Display/Text với negative letter-spacing tạo cảm giác "Apple tight" ở headlines.

---

## 2. Design Language

### Aesthetic Direction
- **Style:** Apple-inspired, clean, professional
- **Roundness:** Pill buttons (`rounded.pill`), utility cards (`rounded.lg` 18px), no rounding on tiles
- **Icon style:** SF Symbols (or Material Symbols as fallback)
- **Elevation:** Minimal - surface color changes, occasional hairline borders, shadow only on imagery

### Color Palette (Apple Design Tokens)
```
Primary/Accent:
- primary:        #0066cc  (Action Blue - every interactive element)
- primary-focus:  #0071e3  (Keyboard focus ring)
- primary-on-dark: #2997ff (Inline links on dark tiles)

Surface:
- canvas:         #ffffff  (Primary canvas)
- canvas-parchment: #f5f5f7 (Alternating sections)
- surface-pearl:  #fafafc  (Secondary button fill)
- surface-tile-1:  #272729  (Dark tile)
- surface-tile-2:  #2a2a2c  (Dark tile variant)
- surface-tile-3:  #252527  (Dark tile variant)
- surface-black:   #000000  (True black - nav bars)

Text:
- ink:            #1d1d1f  (Primary text on light)
- body-on-dark:   #ffffff  (Text on dark tiles)
- body-muted:     #cccccc  (Secondary on dark)
- ink-muted-80:   #333333  (Body on pearl buttons)
- ink-muted-48:   #7a7a7a  (Disabled, fine-print)

Borders:
- divider-soft:   #f0f0f0  (Soft border ring)
- hairline:       #e0e0e0  (1px border on cards)

Success/Error (local use only - not brand colors):
- success-bg:     #dcfce7
- success:        #16a34a
- error-bg:       #fef2f2
- error:          #dc2626
```

### Typography (Apple System)
```
Display Font: SF Pro Display, system-ui, -apple-system, sans-serif
Body Font:     SF Pro Text, system-ui, -apple-system, sans-serif

Scale:
- hero-display:   56px / 600 / -0.28px tracking (hero headlines)
- display-lg:     40px / 600 / 0 tracking (tile headlines)
- display-md:     34px / 600 / -0.374px tracking
- lead:           28px / 400 / 0.196px tracking
- tagline:        21px / 600 / 0.231px tracking (sub-tile headers)
- body-strong:    17px / 600 / -0.374px tracking
- body:           17px / 400 / -0.374px tracking (default)
- caption:        14px / 400 / -0.224px tracking
- button-utility: 14px / 400 / -0.224px tracking
- fine-print:     12px / 400 / -0.12px tracking
- nav-link:       12px / 400 / -0.12px tracking

Note: On non-Apple platforms, Inter is the fallback.
- Use Inter 600 for headlines
- Tighten tracking by -0.01em on display sizes
- Body text line-height: 1.44 (vs Apple's 1.47)
```

### Roundness Scale
```
none:  0px     (Full-bleed tiles)
xs:    5px     (Rare inline chips)
sm:    8px     (Dark utility buttons, inline imagery)
md:    11px    (Pearl button capsules)
lg:    18px    (Utility cards, store grids)
pill:  9999px  (Primary CTAs, search input, chips)
full:  9999px  (Circular buttons over imagery)
```

### Spacing System (8px base)
```
xxs:   4px
xs:    8px
sm:    12px
md:    17px
lg:    24px
xl:    32px
xxl:   48px
section: 80px   (Vertical padding inside tiles)
```

### Motion Philosophy
- **Micro-interactions:** `transform: scale(0.95)` as active/press state on every button
- **Transitions:** 200ms ease-out for hover, 300ms for page transitions
- **Bounce animation:** Scale 1 → 0.95 → 1 on tap (Apple signature)
- **No decorative gradients** - atmosphere comes from photography/content

---

## 3. Layout & Structure

### Global Mobile Layout
```
┌─────────────────────────────┐
│ [☰]  [Page Title]    [Avatar]│  ← Header: 44px, surface-black
├─────────────────────────────┤
│                             │
│         Content             │  ← Scrollable, canvas background
│         (flex-1)            │
│                             │
│      [Sticky Bar]           │  ← Floating sticky bar (if needed)
│                             │
└─────────────────────────────┘
```

### Navigation: Hamburger + Drawer
- **Trigger:** Hamburger icon top-left (44px tap target)
- **Drawer:** 280px width, full height, slide from left
- **Backdrop:** Black 40% opacity, tap to close
- **Content Structure:**
  - Top: User avatar, name, email (user info section)
  - Middle: Navigation items with SF Symbols icons
  - Bottom: Settings, Logout (destructive actions)

### Touch Targets
- Minimum 44px × 44px for all interactive elements
- Buttons: min 44px height, pill padding 11px × 22px
- Cards: full tap area, minimum 44px height

---

## 4. Screens

### 4.1 Login (`/login`)
**Flow:** Clean, minimal

**Layout:**
- Full-bleed canvas background
- Centered content card (max-width 400px)
- App logo + "BaoCom" wordmark
- "Quản lý suất ăn cho công ty" tagline
- Username field (pill-shaped, search-input style)
- Password field
- Primary CTA button (full-width, pill)
- "Quên mật khẩu?" text link below

**Style:**
- Input height: 44px, rounded.pill
- Button: button-primary style
- Spacing: generous vertical rhythm

### 4.2 Employee Dashboard (`/dashboard`)
**Purpose:** Xem thực đơn tuần

**Layout:**
- Header: "Thực Đơn Tuần này" (display-md)
- Day selector: Horizontal scroll, pill-shaped day buttons (T2 T3 T4 T5 T6)
- Content area: Full-width card
  - Date header: "Thứ Ba, 13 tháng 5" (body-strong)
  - Menu section: Món chính, Món rau, Tráng miệng (caption)
  - Status badge: "Đã đăng ký" pill (success-bg)
  - Action button: Primary pill button

**Interactions:**
- Swipe left/right on day selector (scroll-snap)
- Tap day pill → select day
- Tap "Đăng ký" → register for that day

### 4.3 Báo Cơm (`/book`)
**Purpose:** Đăng ký/hủy suất ăn hàng ngày

**Layout:**
- Header: "Báo Cơm" (display-md) + subtitle (caption)
- Week strip: Horizontal scroll các ngày (scroll-snap)
- Day cards in grid (2 columns on mobile):
  - Day label (T2) + date number (13)
  - Status indicator: dot or checkmark
  - "Hôm nay" badge if applicable

**Quick Toggle Behavior:**
- Tap card → toggle ăn/không immediately
- Animation: scale(0.95) press + color change
- Toast notification: "Đã đăng ký ăn" / "Đã hủy" (auto-dismiss 3s)

**States:**
- Eating: Green dot, green text "Ăn"
- Not eating: Red dot, red text "Không"
- Past: Muted, disabled tap
- Today: Primary border ring

### 4.4 Lịch Sử (`/my-history`)
**Purpose:** Xem lịch sử đăng ký

**Layout:**
- Header: "Lịch Sử" + "Xin chào, [Name]" (body)
- Filter: Segmented control (Tuần | Tháng | Tùy chỉnh)
- Stats row: 3 cards (Tổng | Có ăn | Không ăn)
- Calendar view:
  - Month header with nav arrows (◀ ▶)
  - 7-column grid (T2 → CN)
  - Day cells: 44px minimum
  - Color dots: 🟢 (eating), 🔴 (not eating), muted (past/no data)
- Day detail: Tap day → modal with status + note

**Visual:**
- Calendar dots: green/red color coding
- Stats cards: success-bg / error-bg backgrounds

### 4.5 Admin Dashboard (`/admin/dashboard`)
**Purpose:** Overview for admin

**Layout:**
- Header: "Dashboard" (display-md) + "Admin" role badge
- Stats grid: 2×2 grid of utility cards
  - Tổng nhân viên
  - Đang ăn hôm nay
  - Không ăn
  - Tỷ lệ đăng ký
- Quick actions: Primary pill buttons
  - "Xem báo cáo"
  - "Quản lý nhân sự"
- Recent activity list (if applicable)

**Cards:**
- surface-pearl background
- 1px hairline border
- rounded.lg (18px)
- Padding: lg (24px)

### 4.6 Nhân Sự (`/admin/employees`)
**Purpose:** CRUD employees

**Layout:**
- Header: "Nhân Sự" (display-md)
- Action buttons row: "Thêm nhân viên" (primary pill), "Import" (secondary)
- Search: search-input style (pill, 44px height)
- Employee cards list (vertical scroll):
  ```
  ┌─────────────────────────────┐
  │ [Avatar]  Nguyễn Văn A       │
  │           @nguyenvana        │
  │           0912 345 678       │
  │           ● Đang hoạt động   │
  │           [edit] [delete]    │
  └─────────────────────────────┘
  ```

**Card Design:**
- White background, 1px hairline border, rounded.lg
- Avatar: 40px circle, initials in primary blue bg
- Name: body-strong
- Username: ink-muted-48, monospace
- Phone: caption, ink-muted-48
- Status: pill badge (success-bg + success text)
- Actions: button-icon-circular style (44px, translucent bg)

**Interactions:**
- Real-time search filtering
- Tap card → Edit modal
- Bulk select: checkboxes, bulk action bar appears when selected

**Modals:**
- Add/Edit: Centered modal, max-width 400px
  - Input fields: search-input style
  - Save button: button-primary
  - Cancel: text-link style
- Delete confirmation:
  - Warning text
  - Cancel (secondary), Delete (error red)

### 4.7 Báo Cáo (`/admin/reports`)
**Purpose:** Export meal reports

**Layout (Single screen):**
- Header: "Xuất Báo Cáo" (display-md)
- Segmented control: Ngày | Tuần | Tháng
- Date selector:
  - Ngày: date input (pill style)
  - Tuần: dropdown (pill style)
  - Tháng: dropdown (pill style)
- "Xem trước" button (primary)
- Preview section:
  - Stats: "45 suất ăn" (display-lg)
  - Table preview: first 5 rows
  - "Xem thêm" expandable
- "Tải Excel" button (primary, full-width)

**Single screen flow:**
- All controls visible, vertical scroll
- No wizard steps
- Preview updates on date change

### 4.8 Admin Layout
**Structure:**
- Header: surface-black, 44px height
  - Hamburger icon (left)
  - "BaoCom Admin" (center, nav-link style)
  - User avatar (right, 32px)
- Drawer: white bg, 280px width
  - User info section (top)
  - Nav items (middle, with SF Symbol icons)
  - "Đăng xuất" (bottom, text-link style)
- Content: canvas background, full width

---

## 5. Component Inventory

### Button Primary (`button-primary`)
- Background: `{colors.primary}` (#0066cc)
- Text: `{colors.on-primary}` (#ffffff)
- Typography: `{typography.body}` (17px / 400)
- Rounded: `{rounded.pill}` (full pill)
- Padding: 11px × 22px
- Active: `transform: scale(0.95)`
- Focus: 2px solid `{colors.primary-focus}`

### Button Secondary Pill (`button-secondary-pill`)
- Background: transparent
- Text: `{colors.primary}`
- Border: 1px solid `{colors.primary}`
- Rounded: `{rounded.pill}`
- Used as second CTA

### Button Dark Utility (`button-dark-utility`)
- Background: `{colors.ink}` (#1d1d1f)
- Text: `{colors.on-dark}` (#ffffff)
- Typography: `{typography.button-utility}` (14px)
- Rounded: `{rounded.sm}` (8px)
- Padding: 8px × 15px
- Active: `transform: scale(0.95)`

### Button Pearl Capsule (`button-pearl-capsule`)
- Background: `{colors.surface-pearl}` (#fafafc)
- Text: `{colors.ink-muted-80}` (#333333)
- Border: 3px solid `{colors.divider-soft}`
- Rounded: `{rounded.md}` (11px)
- Padding: 8px × 14px

### Button Icon Circular (`button-icon-circular`)
- Size: 44px × 44px
- Background: `{colors.surface-chip-translucent}` at ~64% alpha
- Rounded: `{rounded.full}` (circular)
- Used for: edit, delete, close actions

### Search Input (`search-input`)
- Background: `{colors.canvas}`
- Text: `{colors.ink}`
- Typography: `{typography.body}`
- Border: 1px solid `rgba(0, 0, 0, 0.08)`
- Rounded: `{rounded.pill}`
- Padding: 12px × 20px
- Height: 44px
- Leading icon: search glyph

### Card / Store Utility Card (`store-utility-card`)
- Background: `{colors.canvas}`
- Border: 1px solid `{colors.hairline}`
- Rounded: `{rounded.lg}` (18px)
- Padding: `{spacing.lg}` (24px)
- No shadow by default

### Product Tile Light (`product-tile-light`)
- Background: `{colors.canvas}`
- Rounded: `{rounded.none}`
- Padding: `{spacing.section}` (80px)
- Used for: alternate sections

### Product Tile Dark (`product-tile-dark`)
- Background: `{colors.surface-tile-1}` (#272729)
- Text: `{colors.body-on-dark}`
- Rounded: `{rounded.none}`
- Padding: `{spacing.section}` (80px)

### Floating Sticky Bar (`floating-sticky-bar`)
- Background: `{colors.canvas-parchment}` at 80% opacity
- Backdrop: blur
- Height: 64px
- Padding: 12px × 32px
- Used for: persistent CTAs at bottom

### Badge / Status Pill
- Pill shape (rounded.pill)
- Padding: 8px × 12px
- Colors:
  - Success: bg `{colors.success-bg}`, text `success`
  - Error: bg `{colors.error-bg}`, text `error`
  - Neutral: bg `{colors.surface-pearl}`, text `{colors.ink-muted-48}`

### Avatar
- Circle, sizes: 32px, 40px, 48px
- Background: primary blue with white text
- Initials: 2 letters, centered

### Tab Bar / Segmented Control
- Horizontal, equal width
- Active: primary color + pill background
- Inactive: transparent, ink-muted-48 text
- Rounded: rounded.pill container

### Drawer
- Width: 280px
- Background: `{colors.canvas}`
- Shadow: right shadow for depth
- Slide animation: 300ms

### Modal
- Centered, max-width 400px
- Background: `{colors.canvas}`
- Backdrop: black 40%
- Animation: slide up

### Toast
- Fixed bottom center
- Auto dismiss: 3s
- Action: Undo button
- Rounded: rounded.lg

### Calendar
- 7-column grid
- Day cells: 44px minimum
- Current month: normal
- Other month: ink-muted-48
- Today: primary color border ring
- Dots: 🟢 eating, 🔴 not eating

---

## 6. Technical Approach

### Framework
- Next.js App Router
- React with TypeScript
- Tailwind CSS for styling

### Architecture
- Layout: `app/(admin|employee)/layout.tsx`
- Shared components: `app/components/`
- Mobile-first breakpoints: sm: 640px primary, lg: 1024px

### CSS Custom Properties (Design Tokens)
```css
:root {
  /* Colors */
  --color-primary: #0066cc;
  --color-primary-focus: #0071e3;
  --color-primary-on-dark: #2997ff;
  --color-ink: #1d1d1f;
  --color-canvas: #ffffff;
  --color-canvas-parchment: #f5f5f7;
  --color-hairline: #e0e0e0;

  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 17px;
  --spacing-lg: 24px;

  /* Rounded */
  --rounded-sm: 8px;
  --rounded-md: 11px;
  --rounded-lg: 18px;
  --rounded-pill: 9999px;
}
```

### Mobile Implementation Details
- `min-height: 100dvh` for proper mobile viewport
- `touch-action: manipulation` for responsive buttons
- `-webkit-tap-highlight-color: transparent` for clean tap
- `overscroll-behavior: none` prevents pull-to-refresh
- `scroll-snap-type: x mandatory` for horizontal day selector
- `transform: scale(0.95)` on active state for Apple feel

---

## 7. Screens to Update (Priority Order)

1. **Employee: Báo Cơm (`/book`)** - Primary use case
2. **Employee: Dashboard (`/dashboard`)** - Weekly menu view
3. **Employee: Lịch Sử (`/my-history`)** - Calendar view
4. **Admin: Nhân Sự (`/admin/employees`)** - Card list
5. **Admin: Báo Cáo (`/admin/reports`)** - Single screen
6. **Admin: Dashboard (`/admin/dashboard`)** - Overview
7. **Login (`/login`)** - Clean up
8. **Shared: Layout/Drawer** - Navigation

---

## 8. Out of Scope

- Backend API integration (mock data stays)
- Authentication flow changes
- Desktop layout optimization (mobile-first only)
- Push notifications
- Offline mode