<!-- br-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_rust](https://github.com/Dicklesworthstone/beads_rust) (`br`/`bd`) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View ready issues (open, unblocked, not deferred)
br ready              # or: bd ready

# List and search
br list --status=open # All open issues
br show <id>          # Full issue details with dependencies
br search "keyword"   # Full-text search

# Create and update
br create --title="..." --description="..." --type=task --priority=2
br update <id> --status=in_progress
br close <id> --reason="Completed"
br close <id1> <id2>  # Close multiple issues at once

# Sync with git
br sync --flush-only  # Export DB to JSONL
br sync --status      # Check sync status
```

### Workflow Pattern

1. **Start**: Run `br ready` to find actionable work
2. **Claim**: Use `br update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `br close <id>`
5. **Sync**: Always run `br sync --flush-only` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `br ready` shows only open, unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers 0-4, not words)
- **Types**: task, bug, feature, epic, chore, docs, question
- **Blocking**: `br dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
br sync --flush-only    # Export beads changes to JSONL
git commit -m "..."     # Commit everything
git push                # Push to remote
```

### Best Practices

- Check `br ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `br create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always sync before ending session

<!-- end-br-agent-instructions -->

<!-- bv-agent-instructions-v2 -->

---

## Beads Workflow Integration

This project uses [beads_rust](https://github.com/Dicklesworthstone/beads_rust) (`br`) for issue tracking and [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) (`bv`) for graph-aware triage. Issues are stored in `.beads/` and tracked in git.

### Using bv as an AI sidecar

bv is a graph-aware triage engine for Beads projects (.beads/beads.jsonl). Instead of parsing JSONL or hallucinating graph traversal, use robot flags for deterministic, dependency-aware outputs with precomputed metrics (PageRank, betweenness, critical path, cycles, HITS, eigenvector, k-core).

**Scope boundary:** bv handles *what to work on* (triage, priority, planning). `br` handles creating, modifying, and closing beads.

**CRITICAL: Use ONLY --robot-* flags. Bare bv launches an interactive TUI that blocks your session.**

#### The Workflow: Start With Triage

**`bv --robot-triage` is your single entry point.** It returns everything you need in one call:
- `quick_ref`: at-a-glance counts + top 3 picks
- `recommendations`: ranked actionable items with scores, reasons, unblock info
- `quick_wins`: low-effort high-impact items
- `blockers_to_clear`: items that unblock the most downstream work
- `project_health`: status/type/priority distributions, graph metrics
- `commands`: copy-paste shell commands for next steps

```bash
bv --robot-triage        # THE MEGA-COMMAND: start here
bv --robot-next          # Minimal: just the single top pick + claim command

# Token-optimized output (TOON) for lower LLM context usage:
bv --robot-triage --format toon
```

Before claiming, verify current state with `br show <id> --json` or `br ready --json`. `recommendations` can include graph-important blocked or assigned work; only `quick_ref.top_picks` and non-empty `claim_command` fields represent claimable work.

#### Other bv Commands

| Command | Returns |
|---------|---------|
| `--robot-plan` | Parallel execution tracks with unblocks lists |
| `--robot-priority` | Priority misalignment detection with confidence |
| `--robot-insights` | Full metrics: PageRank, betweenness, HITS, eigenvector, critical path, cycles, k-core |
| `--robot-alerts` | Stale issues, blocking cascades, priority mismatches |
| `--robot-suggest` | Hygiene: duplicates, missing deps, label suggestions, cycle breaks |
| `--robot-diff --diff-since <ref>` | Changes since ref: new/closed/modified issues |
| `--robot-graph [--graph-format=json\|dot\|mermaid]` | Dependency graph export |

#### Scoping & Filtering

```bash
bv --robot-plan --label backend              # Scope to label's subgraph
bv --robot-insights --as-of HEAD~30          # Historical point-in-time
bv --recipe actionable --robot-plan          # Pre-filter: ready to work (no blockers)
bv --recipe high-impact --robot-triage       # Pre-filter: top PageRank scores
```

### br Commands for Issue Management

```bash
br ready              # Show issues ready to work (no blockers)
br list --status=open # All open issues
br show <id>          # Full issue details with dependencies
br create --title="..." --type=task --priority=2
br update <id> --status=in_progress
br close <id> --reason="Completed"
br close <id1> <id2>  # Close multiple issues at once
br sync --flush-only  # Export DB to JSONL
```

### Workflow Pattern

1. **Triage**: Run `bv --robot-triage` to find the highest-impact actionable work
2. **Claim**: Use `br update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `br close <id>`
5. **Sync**: Always run `br sync --flush-only` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `br ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers 0-4, not words)
- **Types**: task, bug, feature, epic, chore, docs, question
- **Blocking**: `br dep add <issue> <depends-on>` to add dependencies

### Session Protocol

```bash
git status              # Check what changed
git add <files>         # Stage code changes
br sync --flush-only    # Export beads changes to JSONL
git commit -m "..."     # Commit everything
git push                # Push to remote
```

<!-- end-bv-agent-instructions -->


<!-- codebase-memory-mcp:start -->
# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order
1. `search_graph` — find functions, classes, routes, variables by pattern
2. `trace_path` — trace who calls a function or what it calls
3. `get_code_snippet` — read specific function/class source code
4. `query_graph` — run Cypher queries for complex patterns
5. `get_architecture` — high-level project summary

## When to fall back to grep/glob
- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results

## Examples
- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`
<!-- codebase-memory-mcp:end -->

<?xml version="1.0" encoding="UTF-8"?>
<system_prompt name="Luật Code cho dự án BaoCom" scope="Áp dụng cho MỌI lần generate/sửa code trong dự án bao_com">

  <supreme_principle>
    <rule>Bộ luật này áp dụng cho MỌI lần generate/sửa code, kể cả khi user không nhắc lại trong tin nhắn.</rule>
    <rule>Nếu yêu cầu của user xung đột với luật, PHẢI tuân theo luật và giải thích ngắn gọn lý do, trừ khi user xác nhận rõ ràng muốn phá lệ.</rule>
    <rule>KHÔNG tự ý thêm pattern lạ, không đảo thứ tự luồng, không thay đổi convention naming đã định nghĩa.</rule>
    <rule>Khi code thật trong dự án khác với template trong bộ luật (ví dụ route.ts dùng validation inline thay vì trong controller), tuân theo code thật — bộ luật mô tả pattern chính, không ghi đè mọi chi tiết đã có trong codebase.</rule>
  </supreme_principle>

  <architecture_overview>
    <stack>TypeScript + Next.js 16 (App Router) + Prisma ORM (SQLite) + Tailwind CSS + Vitest</stack>
    <flow>Request → Middleware (auth) → Route/Endpoint → Controller → Service → Repository → Prisma → SQLite</flow>
    <directory_structure>
      <![CDATA[
      src/
      ├── controllers/      # HTTP handling, parse request, map error → response
      │   ├── index.ts       # barrel export
      │   ├── UsersController.ts
      │   ├── RegistrationsController.ts
      │   └── ...
      ├── services/          # Business logic — NƠI DUY NHẤT chứa nghiệp vụ
      │   ├── index.ts       # barrel export
      │   ├── UserService.ts
      │   ├── RegistrationService.ts
      │   └── ...
      ├── repositories/      # DB access thuần túy qua Prisma
      │   ├── index.ts       # barrel export
      │   ├── BaseRepository.ts
      │   ├── UserRepository.ts
      │   └── ...
      ├── dto/               # Data Transfer Objects — hợp đồng dữ liệu vào/ra
      │   ├── index.ts       # barrel export
      │   ├── UserDTO.ts
      │   ├── RegistrationDTO.ts
      │   └── ...
      ├── lib/               # Shared utilities, middleware, config
      │   ├── auth.ts         # JWT sign/verify, password hash
      │   ├── authMiddleware.ts  # withAuth / withAdmin wrappers
      │   ├── prisma.ts       # Prisma client singleton
      │   ├── registrationWindow.ts
      │   └── zalo/           # Zalo bot subsystem (exception flow)
      └── hooks/             # Frontend data-fetching hooks

      app/
      ├── api/               # Next.js Route Handlers (thin layer, chỉ delegate)
      │   ├── auth/
      │   ├── users/
      │   ├── registrations/
      │   └── ...
      ├── (employee)/        # Employee-facing pages
      ├── admin/             # Admin pages
      └── components/        # Shared React components

      prisma/
      ├── schema.prisma      # Database schema
      └── migrations/        # Migration files

      tests/
      ├── unit/              # Unit tests (vitest)
      ├── integration/       # Integration tests
      ├── e2e/               # End-to-end tests (playwright)
      └── fakes/             # Test doubles / mocks
      ]]>
    </directory_structure>
  </architecture_overview>

  <layers>
    <layer name="DTO" order="1">
      <responsibility>Hợp đồng dữ liệu vào/ra — chỉ khai báo kiểu, không có hành vi</responsibility>
      <allowed>
        <item>Interface cho Create, Update, Response DTO</item>
        <item>Type alias cho status enum, union types</item>
      </allowed>
      <forbidden>
        <item>Method, constructor, side-effect</item>
        <item>Import Prisma types trực tiếp (DTO phải độc lập ORM)</item>
      </forbidden>
      <template language="TypeScript">
        <![CDATA[
        // src/dto/UserDTO.ts
        export interface CreateUserDTO {
          username?: string  // Optional - auto-generated if not provided
          password?: string  // Optional - auto-generated if not provided
          name: string
          role?: 'admin' | 'employee'
          departmentId?: string
        }

        export interface UpdateUserDTO {
          name?: string
          password?: string
          role?: 'admin' | 'employee'
          isActive?: boolean
          departmentId?: string | null
        }

        export interface UserResponseDTO {
          id: string
          username: string
          name: string
          role: string
          isActive: boolean
          createdAt: Date
          departmentId: string | null
        }
        ]]>
      </template>
    </layer>

    <layer name="Repository" order="2">
      <responsibility>Truy xuất DB thuần túy qua Prisma — KHÔNG chứa business logic</responsibility>
      <allowed>
        <item>Kế thừa BaseRepository&lt;T, CreateInput, UpdateInput&gt;</item>
        <item>Method truy vấn tùy biến: findByX(), count(), upsert(), findByUsernamePattern()</item>
        <item>Include relation khi cần (vd: include: { department: true })</item>
      </allowed>
      <forbidden>
        <item>Business logic (validation, authorization, tính toán ngày giờ)</item>
        <item>Throw lỗi tùy biến — chỉ để lỗi gốc của Prisma đi qua</item>
        <item>Import từ services/ hoặc controllers/</item>
      </forbidden>
      <mapping_rule>
        Repository trả về Prisma model types (User, Registration...). Service là người map từ Prisma type → DTO/Response nếu shape khác nhau. Nếu shape giống nhau (như User), Service có thể return trực tiếp.
      </mapping_rule>
      <template language="TypeScript">
        <![CDATA[
        // src/repositories/UserRepository.ts
        import { PrismaClient } from '@prisma/client'
        import { BaseRepository } from './BaseRepository'
        import { User, Prisma } from '@prisma/client'

        export class UserRepository extends BaseRepository<
          User,
          Prisma.UserCreateInput,
          Prisma.UserUpdateInput
        > {
          constructor(prisma: PrismaClient) {
            super(prisma)
          }

          async findAll(where?: Prisma.UserWhereInput): Promise<User[]> {
            return this.prisma.user.findMany({
              where,
              include: { department: true }
            })
          }

          async findOne(id: string): Promise<User | null> {
            return this.prisma.user.findUnique({
              where: { id },
              include: { department: true }
            })
          }

          async findByUsername(username: string): Promise<User | null> {
            return this.prisma.user.findUnique({ where: { username } })
          }

          async create(data: Prisma.UserCreateInput): Promise<User> {
            return this.prisma.user.create({ data })
          }

          async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
            return this.prisma.user.update({ where: { id }, data })
          }

          async delete(id: string): Promise<void> {
            await this.prisma.user.delete({ where: { id } })
          }

          async count(where?: Prisma.UserWhereInput): Promise<number> {
            return this.prisma.user.count({ where })
          }
        }
        ]]>
      </template>
    </layer>

    <layer name="Service" order="3">
      <responsibility>NƠI DUY NHẤT chứa business logic — validation nghiệp vụ, authorization theo domain rule, state transition</responsibility>
      <allowed>
        <item>Validation nghiệp vụ (kiểm tra ngày đăng ký, trạng thái hợp lệ, trùng lặp)</item>
        <item>Authorization logic phức tạp (admin override locked date, ownership check phụ thuộc state)</item>
        <item>Gọi service khác (vd: AuditLogService.log() sau khi override)</item>
        <item>Throw lỗi có message/loại rõ ràng để Controller map sang HTTP response</item>
        <item>Map Prisma type → DTO/Response type nếu shape khác nhau</item>
      </allowed>
      <forbidden>
        <item>Không biết gì về HTTP — KHÔNG import NextRequest/NextResponse, KHÔNG trả response object</item>
        <item>Không để rò rỉ Prisma types ra ngoài nếu khác DTO — map ngay trước khi return</item>
        <item>Không import từ controllers/ hoặc app/</item>
      </forbidden>
      <error_convention>
        Service throw Error với message rõ ràng. Dùng custom Error class khi cần code phân biệt (vd: RegistrationDateError có .code). Controller catch và map sang HTTP status.
      </error_convention>
      <template language="TypeScript">
        <![CDATA[
        // src/services/UserService.ts
        import { prisma } from '@/lib/prisma'
        import { UserRepository } from '@/repositories/UserRepository'
        import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '@/dto/UserDTO'
        import { hashPassword } from '@/lib/auth'
        import { generateUsername, generatePassword, generateUniqueUsername } from '@/lib/utils'

        export class UserService {
          private userRepository: UserRepository

          constructor() {
            this.userRepository = new UserRepository(prisma)
          }

          async findAll() {
            return this.userRepository.findAll({ isActive: true })
          }

          async findOne(id: string) {
            return this.userRepository.findOne(id)
          }

          async create(data: CreateUserDTO) {
            // Business logic: generate username if not provided
            let username = data.username
            if (!username) {
              const baseUsername = generateUsername(data.name)
              const existingUsernames = await this.userRepository.findByUsernamePattern(baseUsername)
              username = generateUniqueUsername(baseUsername, existingUsernames)
            } else {
              const existing = await this.userRepository.findByUsername(username)
              if (existing) throw new Error('Username already exists')
            }

            const password = data.password || generatePassword()
            const hashedPassword = await hashPassword(password)

            const user = await this.userRepository.create({
              username,
              password: hashedPassword,
              name: data.name,
              role: data.role || 'employee',
              ...(data.departmentId ? { department: { connect: { id: data.departmentId } } } : {})
            })

            return {
              user: {
                id: user.id, username: user.username, name: user.name,
                role: user.role, departmentId: user.departmentId,
                isActive: user.isActive, createdAt: user.createdAt
              },
              credentials: { username: user.username, password }
            }
          }
        }
        ]]>
      </template>
    </layer>

    <layer name="Controller" order="4">
      <responsibility>Dịch HTTP ↔ Service — parse request, gọi Service, catch lỗi, map thành response</responsibility>
      <allowed>
        <item>Parse/validate input FORMAT (JSON body, query params, missing fields)</item>
        <item>Gọi Service method</item>
        <item>Catch lỗi Service throw ra → map thành HTTP status code</item>
        <item>IDOR check đơn giản (non-admin không được xem data người khác)</item>
        <item>Map Service response → JSON shape trả cho client (loại bỏ password, thêm dateKey...)</item>
      </allowed>
      <forbidden>
        <item>Business logic (validation nghiệp vụ, tính toán, state transition) — đẩy hết vào Service</item>
        <item>Truy cập Prisma trực tiếp — luôn qua Service</item>
        <item>Import prisma client</item>
      </forbidden>
      <template language="TypeScript">
        <![CDATA[
        // src/controllers/UsersController.ts
        import { NextRequest, NextResponse } from 'next/server'
        import { UserService } from '@/services/UserService'
        import { CreateUserDTO, UpdateUserDTO } from '@/dto/UserDTO'

        export class UsersController {
          private userService: UserService

          constructor() {
            this.userService = new UserService()
          }

          async getAll() {
            const users = await this.userService.findAll()
            return NextResponse.json({
              users: users.map(u => ({
                id: u.id, username: u.username, name: u.name,
                role: u.role, isActive: u.isActive,
                createdAt: u.createdAt, departmentId: u.departmentId
              }))
            })
          }

          async create(req: NextRequest) {
            let body: CreateUserDTO
            try {
              body = await req.json()
            } catch {
              return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
            }

            if (!body.name) {
              return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
            }

            try {
              const result = await this.userService.create(body)
              return NextResponse.json({
                user: { id: result.user.id, username: result.user.username,
                        name: result.user.name, role: result.user.role }
              }, { status: 201 })
            } catch (error) {
              if (error instanceof Error && error.message === 'Username already exists') {
                return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
              }
              throw error  // Unknown error → let Next.js handle as 500
            }
          }
        }
        ]]>
      </template>
    </layer>

    <layer name="Route" order="5">
      <responsibility>Khai báo endpoint, KHÔNG chứa logic — chỉ khởi tạo Controller và delegate</responsibility>
      <allowed>
        <item>Export HTTP method handler (GET, POST, PUT, DELETE, PATCH)</item>
        <item>Áp dụng auth middleware (withAuth / withAdmin)</item>
        <item>Validate format input đơn giản (date range params, query string)</item>
      </allowed>
      <forbidden>
        <item>Business logic — đẩy vào Controller/Service</item>
        <item>Truy cập Prisma — luôn qua Controller → Service → Repository</item>
        <item>Định nghĩa response shape — Controller quyết định</item>
      </forbidden>
      <template language="TypeScript">
        <![CDATA[
        // app/api/users/route.ts
        import { NextRequest } from 'next/server'
        import { withAdmin } from '@/lib/authMiddleware'
        import { UsersController } from '@/controllers/UsersController'

        const controller = new UsersController()

        export const GET = withAdmin(async (req: NextRequest) => {
          return controller.getAll()
        })

        export const POST = withAdmin(async (req: NextRequest) => {
          return controller.create(req)
        })
        ]]>
      </template>
    </layer>

    <layer name="Auth Middleware" order="6">
      <responsibility>Bảo vệ endpoint — xác thực JWT, phân quyền admin/employee</responsibility>
      <allowed>
        <item>withAuth(handler) — yêu cầu đăng nhập, truyền userId + role vào handler</item>
        <item>withAdmin(handler) — yêu cầu role = 'admin'</item>
        <item>Kiểm tra tokenVersion against DB để enforce token rotation</item>
        <item>Kiểm tra isActive — disabled account bị từ chối</item>
      </allowed>
      <forbidden>
        <item>Business logic — middleware chỉ xác thực/phân quyền</item>
        <item>Truy cập dữ liệu khác ngoài user auth fields</item>
      </forbidden>
      <template language="TypeScript">
        <![CDATA[
        // src/lib/authMiddleware.ts
        export function withAuth(handler: SimpleHandler): NextHandler {
          return async (req, ctx) => {
            const token = req.cookies.get('token')?.value
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

            const payload = await verifyToken(token)
            if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

            // Validate tokenVersion + isActive
            const user = await prisma.user.findUnique({
              where: { id: payload.userId },
              select: { tokenVersion: true, isActive: true }
            })
            if (!user || user.tokenVersion !== payload.tokenVersion)
              return NextResponse.json({ error: 'Session expired' }, { status: 401 })
            if (!user.isActive)
              return NextResponse.json({ error: 'Account disabled' }, { status: 403 })

            return handler(req, payload.userId, payload.role, ctx)
          }
        }
        ]]>
      </template>
    </layer>
  </layers>

  <import_rules>
    <order>
      <item priority="1">External libraries (next, @prisma/client, bcryptjs, jose, node-cron, zca-js...)</item>
      <item priority="2">Internal shared (src/lib/*)</item>
      <item priority="3">DTOs / types (src/dto/*)</item>
      <item priority="4">Same-layer imports (repository gọi repository, service gọi service)</item>
      <item priority="5">Cross-layer imports THEO ĐÚNG THỨ TỰ: controller→service→repository, KHÔNG đảo</item>
    </order>
    <alias>@/ trỏ đến src/</alias>
    <convention>Mỗi layer có index.ts barrel export. Import từ barrel khi dùng ngoài layer.</convention>
  </import_rules>

  <error_handling>
    <flow>Service throw Error → Controller catch → map thành HTTP response</flow>
    <error_mapping>
      <case service_error="Error('Not found')" http_status="404" response="{ error: 'Not found' }"/>
      <case service_error="Error('Forbidden')" http_status="403" response="{ error: 'Forbidden' }"/>
      <case service_error="Error('Invalid status')" http_status="400" response="{ error: 'Invalid status' }"/>
      <case service_error="Error('Username already exists')" http_status="409" response="{ error: 'Username already exists' }"/>
      <case service_error="RegistrationDateError" http_status="400" response="{ error: message, code: errorCode }"/>
      <case service_error="Error('Invalid JSON body')" http_status="400" response="{ error: 'Invalid JSON body' }"/>
      <case service_error="unknown" http_status="500" response="throw lại, không tự ý nuốt lỗi"/>
    </error_mapping>
    <rule>Controller catch từng loại lỗi cụ thể bằng instanceof hoặc message match. Lỗi không xác định → throw lại để Next.js trả 500.</rule>
    <rule>KHÔNG bao giờ log hoặc return password hash, token, hoặc secret trong error response.</rule>
  </error_handling>

  <naming_conventions>
    <convention element="File (DTO)" pattern="{Entity}DTO.ts" example="UserDTO.ts, RegistrationDTO.ts"/>
    <convention element="File (Repository)" pattern="{Entity}Repository.ts" example="UserRepository.ts, RegistrationRepository.ts"/>
    <convention element="File (Service)" pattern="{Entity}Service.ts" example="UserService.ts, RegistrationService.ts"/>
    <convention element="File (Controller)" pattern="{Entity}sController.ts" example="UsersController.ts, RegistrationsController.ts"/>
    <convention element="File (Route)" pattern="app/api/{entity-s}/route.ts" example="app/api/users/route.ts"/>
    <convention element="File (Hook)" pattern="use{Entity}.ts" example="useRegistrations.ts, useDailyMenus.ts"/>
    <convention element="Class (DTO)" pattern="{Entity}DTO (interface)" example="CreateUserDTO, UpdateUserDTO, UserResponseDTO"/>
    <convention element="Class (Repository)" pattern="{Entity}Repository" example="UserRepository, RegistrationRepository"/>
    <convention element="Class (Service)" pattern="{Entity}Service" example="UserService, RegistrationService"/>
    <convention element="Class (Controller)" pattern="{Entity}sController" example="UsersController, RegistrationsController"/>
    <convention element="DB Table (Prisma model)" pattern="{Entity} (PascalCase)" example="User, Registration, DailyMenu"/>
    <convention element="DB Column" pattern="camelCase" example="createdAt, isActive, tokenVersion"/>
    <convention element="API Response key" pattern="camelCase, entity name ở số nhiều" example="{ users: [...] }, { registrations: [...] }"/>
    <convention element="Error message" pattern="English cho code match, tiếng Việt cho user-facing" example="'Username already exists', 'Ngày này đã khóa báo cơm'"/>
    <convention element="Barrel export" pattern="index.ts trong mỗi layer" example="src/services/index.ts export * from './UserService'"/>
  </naming_conventions>

  <feature_checklist>
    <step order="1">Prisma schema (prisma/schema.prisma) + migration</step>
    <step order="2">DTO (Create/Update/Response interfaces trong src/dto/)</step>
    <step order="3">Repository (extends BaseRepository, CRUD + custom queries trong src/repositories/)</step>
    <step order="4">Service (business logic trong src/services/)</step>
    <step order="5">Controller (HTTP handling, error mapping trong src/controllers/)</step>
    <step order="6">Route Handler (app/api/{entity}/route.ts, áp withAuth/withAdmin)</step>
    <step order="7">API client phía frontend (src/lib/api.ts hoặc src/hooks/) nếu có UI</step>
    <step order="8">Hook (src/hooks/use{Entity}.ts) nếu có UI</step>
    <step order="9">UI page (app/admin/ hoặc app/(employee)/) nếu cần</step>
    <step order="10">Tests (tests/unit/, tests/integration/) — bắt buộc cho service logic mới</step>
    <note>KHÔNG BAO GIỜ skip bước hoặc đảo thứ tự. Mỗi bước tạo file mới, không nhồi nhiều layer vào 1 file.</note>
  </feature_checklist>

  <exceptions>
    <exception name="Zalo Bot subsystem">
      <description>Zalo bot là singleton chạy riêng, KHÔNG tuân theo pattern Controller→Service→Repository. Bot sống trong src/lib/zalo/, dùng zca-js library trực tiếp, quản lý state qua singleton pattern với globalThis để survive HMR.</description>
      <flow>Route Handler → bot singleton (src/lib/zalo/bot.ts) → zca-js API → Zalo server</flow>
      <permitted_deviation>
        <item>Bot KHÔNG qua Service/Repository layer — truy cập Prisma trực tiếp trong auto-send logic (src/lib/zalo/auto-send.ts)</item>
        <item>State management dùng singleton + globalThis pattern (không phải DI/constructor)</item>
        <item>Error handling dùng classifyZaloError() thay vì throw generic Error</item>
        <item>Auto-send dùng node-cron scheduler, không phải HTTP request flow</item>
      </permitted_deviation>
      <rule>Khi thêm tính năng mới cho Zalo bot (không phải sửa bug), tạo file mới trong src/lib/zalo/ — KHÔNG nhồi vào controller/service của business logic chính.</rule>
    </exception>
  </exceptions>

  <security_rules>
    <rule area="auth">Mọi endpoint trong app/api/ PHẢI được bọc withAuth hoặc withAdmin. Endpoint public (login, holiday list) phải được khai báo ngoại lệ rõ ràng.</rule>
    <rule area="idor">Controller PHẢI check quyền sở hữu dữ liệu trước khi trả về. Ví dụ: non-admin chỉ được xem registration của chính mình — kiểm tra registration.userId === userId.</rule>
    <rule area="password">Hash bằng bcryptjs cost 12. KHÔNG bao giờ log, return, hoặc lưu giá trị password thô sau khi hash. Password plaintext chỉ được trả về 1 lần duy nhất khi tạo user (trong credentials field).</rule>
    <rule area="token">Dùng jose library để sign/verify JWT. Token chứa userId, role, tokenVersion. Verify tokenVersion against DB mỗi request để enforce token rotation. Cookie-based (httpOnly), không dùng localStorage.</rule>
    <rule area="password_hash_leak">KHÔNG bao giờ include password field trong response JSON. Khi map User → response, luôn omit password. Đây là lỗi đã xảy ra trong dự án (BUG-002).</rule>
    <rule area="transaction">Mặc định mỗi Repository method là 1 Prisma call. Khi cần transaction nhiều bước (vd: upsert + createOverride), transaction được mở ở Service layer, Repository cung cấp các thao tác đơn lẻ tham gia transaction đó.</rule>
    <rule area="audit">Mọi hành động nhạy cảm (tạo/xóa user, override registration, thay đổi cutoff) PHẢI ghi AuditLog qua AuditLogService.log().</rule>
  </security_rules>

  <testing_conventions>
    <framework>Vitest cho unit + integration, Playwright cho E2E</framework>
    <file_location>
      <item>Unit tests: tests/unit/{feature}.test.ts</item>
      <item>Integration tests: tests/integration/{feature}.test.ts</item>
      <item>E2E tests: tests/e2e/spec/{feature}.spec.ts</item>
      <item>Test fakes/mocks: tests/fakes/</item>
      <item>Component tests: co-located với component (vd: app/admin/zalo-bot/Layout.test.tsx)</item>
    </file_location>
    <naming>Test file name = tên file được test + .test.ts hoặc .spec.ts</naming>
    <convention>
      <item>Test business logic trong Service — KHÔNG test implementation details</item>
      <item>Test error paths: Service throw đúng loại lỗi?</item>
      <item>Dùng describe/it/expect từ vitest</item>
      <item>Mock Prisma bằng fake implementations trong tests/fakes/, không mock module</item>
    </convention>
  </testing_conventions>

  <self_verification_checklist>
    <item>Đúng thứ tự layer? (DTO → Repository → Service → Controller → Route)</item>
    <item>Business logic không lẫn sai layer? (Service là nơi DUY NHẤT chứa nghiệp vụ)</item>
    <item>Controller không import Prisma trực tiếp?</item>
    <item>Naming đúng convention ở mục naming_conventions?</item>
    <item>Import order đúng mục import_rules?</item>
    <item>Lỗi được map đúng bảng ở error_handling?</item>
    <item>Password/secret không bị log hoặc return trong response?</item>
    <item>IDOR check đã được thực hiện cho endpoint cần bảo vệ?</item>
    <item>Không mâu thuẫn với luật ở mục khác trong file này?</item>
    <item>Nếu thêm entity mới, đã điền đủ 10 bước trong feature_checklist?</item>
  </self_verification_checklist>

  <quick_reference>
    Phải dùng đúng template tương ứng layer ở mục layers, không tự sáng tạo pattern mới, không đảo thứ tự import, không thay đổi convention naming. Khi không chắc chắn, đọc lại template code mẫu trong mỗi layer.
  </quick_reference>

</system_prompt>

<?xml version="1.0" encoding="UTF-8"?>
<examples>

  <example>
    <rule_name>Business logic không được nằm trong Controller</rule_name>
    <wrong language="TypeScript">
      <![CDATA[
      // src/controllers/RegistrationsController.ts — SAI: validate ngày ngay trong Controller
      async create(req: NextRequest, userId: string) {
        const body = await req.json()
        // Business logic rò rỉ vào Controller:
        if (!['eating', 'not_eating'].includes(body.status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        const date = new Date(body.date)
        if (date.getDay() === 0 || date.getDay() === 6) {
          return NextResponse.json({ error: 'Không đăng ký cuối tuần' }, { status: 400 })
        }
        // ... gọi repository trực tiếp
      }
      ]]>
    </wrong>
    <correct language="TypeScript">
      <![CDATA[
      // src/controllers/RegistrationsController.ts — ĐÚNG: delegate vào Service
      async create(req: NextRequest, userId: string) {
        let body: CreateRegistrationDTO
        try {
          body = await req.json()
        } catch {
          return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }
        if (!body.date || !body.status) {
          return NextResponse.json({ error: 'Missing date or status' }, { status: 400 })
        }
        try {
          const registration = await this.registrationService.create(userId, body)
          return NextResponse.json({ registration }, { status: 201 })
        } catch (error) {
          if (error instanceof RegistrationDateError) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
          }
          throw error
        }
      }
      ]]>
    </correct>
    <reason>Business logic nằm trong Controller khiến việc test nghiệp vụ phải mock HTTP object, và khi logic dùng ở nơi khác (Zalo auto-send, CLI script) phải copy lại toàn bộ.</reason>
  </example>

  <example>
    <rule_name>Controller không được truy cập Prisma trực tiếp</rule_name>
    <wrong language="TypeScript">
      <![CDATA[
      // src/controllers/AdminStatsController.ts — SAI: dùng prisma client trực tiếp
      import { prisma } from '@/lib/prisma'

      async getStats(date: string) {
        const dayStart = new Date(date)
        const eating = await prisma.registration.count({
          where: { date: dayStart, status: 'eating' }
        })
        return NextResponse.json({ eating })
      }
      ]]>
    </wrong>
    <correct language="TypeScript">
      <![CDATA[
      // src/controllers/AdminStatsController.ts — ĐÚNG: qua Service
      async getStats(date: string) {
        const stats = await this.registrationService.countByStatus(new Date(date))
        return NextResponse.json(stats)
      }
      ]]>
    </correct>
    <reason>Controller truy cập Prisma trực tiếp bỏ qua Service layer — nếu sau này cần thay đổi logic đếm (vd: chỉ đếm active employees), phải sửa ở nhiều nơi thay vì 1 chỗ trong Service.</reason>
  </example>

  <example>
    <rule_name>Không được để password hash rò rỉ trong response</rule_name>
    <wrong language="TypeScript">
      <![CDATA[
      // src/controllers/UsersController.ts — SAI: trả về toàn bộ user object
      async getOne(id: string) {
        const user = await this.userService.findOne(id)
        if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ user }) // password hash bị lộ!
      }
      ]]>
    </wrong>
    <correct language="TypeScript">
      <![CDATA[
      // src/controllers/UsersController.ts — ĐÚNG: omit password khi trả response
      async getOne(id: string) {
        const user = await this.userService.findOne(id)
        if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({
          user: {
            id: user.id, username: user.username, name: user.name,
            role: user.role, isActive: user.isActive,
            createdAt: user.createdAt, departmentId: user.departmentId
          }
        })
      }
      ]]>
    </correct>
    <reason>Password hash (bcrypt) bị lộ cho phép attacker brute-force offline. Đây là BUG-002 đã xảy ra trong dự án — phải luôn omit password field khi map response.</reason>
  </example>

  <example>
    <rule_name>Endpoint phải check IDOR — không được giả định userId từ client là hợp lệ</rule_name>
    <wrong language="TypeScript">
      <![CDATA[
      // app/api/registrations/route.ts — SAI: không check quyền sở hữu
      export const GET = withAuth(async (req: NextRequest, userId: string) => {
        // Lấy registration theo id từ query, nhưng KHÔNG check
        // registration có thuộc về userId này không
        const id = req.nextUrl.searchParams.get('id')
        return controller.getOne(id)
      })
      ]]>
    </wrong>
    <correct language="TypeScript">
      <![CDATA[
      // src/controllers/RegistrationsController.ts — ĐÚNG: check IDOR trong Controller
      async getOne(id: string, userId?: string, role?: string) {
        const registration = await this.registrationService.findOne(id)
        if (!registration) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        // IDOR check: non-admin cannot access other users' registrations
        if (role !== 'admin' && registration.userId !== userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.json({ registration })
      }
      ]]>
    </correct>
    <reason>Không check IDOR cho phép employee xem/sửa registration của người khác chỉ bằng cách đoán ID. Luôn kiểm tra ownership trước khi trả data.</reason>
  </example>

  <example>
    <rule_name>Service throw lỗi có message rõ ràng, KHÔNG throw generic Error mơ hồ</rule_name>
    <wrong language="TypeScript">
      <![CDATA[
      // src/services/RegistrationService.ts — SAI: throw Error không phân biệt được
      async create(userId: string, data: CreateRegistrationDTO) {
        if (!['eating', 'not_eating'].includes(data.status)) {
          throw new Error('Bad request') // Controller không biết đây là 400 hay 500
        }
        // ...
      }
      ]]>
    </wrong>
    <correct language="TypeScript">
      <![CDATA[
      // src/services/RegistrationService.ts — ĐÚNG: throw lỗi có message/code rõ ràng
      async create(userId: string, data: CreateRegistrationDTO, now = new Date()) {
        if (!['eating', 'not_eating'].includes(data.status)) {
          throw new Error('Invalid status')
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
          throw new Error('Invalid date format. Expected YYYY-MM-DD.')
        }
        const date = parseLocalDate(data.date)
        this.validateEditableDate(date, now) // throws RegistrationDateError with .code
        // ...
      }

      // Custom error class khi cần code phân biệt
      export class RegistrationDateError extends Error {
        constructor(public readonly code: 'DATE_LOCKED' | 'DATE_OUTSIDE_WINDOW', message: string) {
          super(message)
          this.name = 'RegistrationDateError'
        }
      }
      ]]>
    </correct>
    <reason>Controller catch lỗi dựa trên message hoặc instanceof. Nếu Service throw 'Bad request', Controller không biết nên trả 400 hay nuốt lỗi → hoặc trả sai status code, hoặc nuốt lỗi gây 500 không rõ nguyên nhân.</reason>
  </example>

</examples>


