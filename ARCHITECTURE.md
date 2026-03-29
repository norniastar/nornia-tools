# 架构规范

## 目的

This document defines the current frontend architecture for `Nornia Tools`.  
Every new tool, refactor, or Codex-generated change should follow these rules unless the project explicitly changes direction.

## 产品范围

`Nornia Tools` is a compact browser-based developer tool workspace.

Current product shape:

- One application shell
- One overview page
- Multiple independent tools
- Hash-route direct access for every tool
- Local-first interactions
- No backend dependency for core tool flows

The project is not a marketing site and not a large multi-domain application.  
Architecture should therefore stay flat, explicit, and low-ceremony.

## 核心架构原则

### 1. 工具是独立特性模块

Each tool must behave like an independent feature module:

- Own page-level state
- Own transformation logic
- Own header actions
- Own local persistence when needed
- Minimal awareness of other tools

Do not create hidden coupling between tools.

### 2. 共享基础设施保持精简

Only extract shared code when it is genuinely reused or architectural:

- app shell
- routing
- tool metadata
- shared UI primitives
- shared utility helpers

Do not prematurely create generic abstractions for one-off tool behavior.

### 3. 优先本地状态而不是全局状态

This app currently works best with page-local state inside each tool component.

Use local component state by default for:

- inputs
- transient status
- copy feedback
- tool-specific settings
- derived results

Avoid introducing app-wide stores unless multiple tools truly need synchronized state.

### 4. 派生状态保持为派生状态

Do not persist or duplicate state that can be recomputed cheaply.

Examples:

- diff summary should be derived from the diff editor
- calculator result should be derived from expressions
- formatted output should be derived from source input

Persist only user intent, not temporary UI artifacts.

### 5. 布局不要和内容对抗

Tool pages should use content-driven layout first.

- Avoid forcing full-height layouts unless an editor truly requires it
- Avoid `100vh`-style coupling inside tool content areas
- Keep page scroll behavior predictable
- Let the app shell own global layout constraints

## 当前项目结构

### 应用壳层

- [`src/App.tsx`](/Users/nornia/code/codex/tools/src/App.tsx)
  App composition, tool registry, route mapping, footer.
- [`src/config/tools.ts`](/Users/nornia/code/codex/tools/src/config/tools.ts)
  Single source of truth for tool metadata, routes, and component registration.
- [`src/components/Layout.tsx`](/Users/nornia/code/codex/tools/src/components/Layout.tsx)
  Navbar and sidebar shell.
- [`src/components/Dashboard.tsx`](/Users/nornia/code/codex/tools/src/components/Dashboard.tsx)
  Home/entry page.

### 工具页面

All tool pages live in [`src/components`](/Users/nornia/code/codex/tools/src/components) as page-level components:

- [`JSONEditorTool.tsx`](/Users/nornia/code/codex/tools/src/components/JSONEditorTool.tsx)
- [`TimestampTool.tsx`](/Users/nornia/code/codex/tools/src/components/TimestampTool.tsx)
- [`UUIDGeneratorTool.tsx`](/Users/nornia/code/codex/tools/src/components/UUIDGeneratorTool.tsx)
- [`TextCodeDiffTool.tsx`](/Users/nornia/code/codex/tools/src/components/TextCodeDiffTool.tsx)
- [`URLCodecTool.tsx`](/Users/nornia/code/codex/tools/src/components/URLCodecTool.tsx)
- [`CalculatorTool.tsx`](/Users/nornia/code/codex/tools/src/components/CalculatorTool.tsx)

### 共享基础组件与工具

- [`Tooltip.tsx`](/Users/nornia/code/codex/tools/src/components/Tooltip.tsx)
- [`DateTimePicker.tsx`](/Users/nornia/code/codex/tools/src/components/DateTimePicker.tsx)
- [`ToolPage.tsx`](/Users/nornia/code/codex/tools/src/components/ToolPage.tsx)
- [`useToolDraft.ts`](/Users/nornia/code/codex/tools/src/hooks/useToolDraft.ts)
- [`useCopyFeedback.ts`](/Users/nornia/code/codex/tools/src/hooks/useCopyFeedback.ts)
- [`draftCache.ts`](/Users/nornia/code/codex/tools/src/utils/draftCache.ts)
- [`types.ts`](/Users/nornia/code/codex/tools/src/types.ts)

## 路由规则

Routing is hash-based and lightweight by design.

Rules:

- Every tool must have one stable `ToolId`
- Every tool must have one stable hash route
- `ToolId`, route map, and dashboard entry must stay aligned
- Route naming should be short, explicit, and kebab-case

Current route and tool registration source of truth:

- [`src/config/tools.ts`](/Users/nornia/code/codex/tools/src/config/tools.ts)
- [`src/types.ts`](/Users/nornia/code/codex/tools/src/types.ts)

## 工具组件约定

Every tool component should follow the same high-level contract.

### 必备职责

- Render its own page header
- Render its primary work area
- Own its interactive state
- Handle its own validation and formatting rules
- Provide local user feedback for copy, clear, and transformation actions

### 强烈建议

- Keep the exported component page-level and self-contained
- Keep helper functions close to the tool unless reused elsewhere
- Extract only stable, repeated utilities
- Keep side effects explicit in `useEffect`

### 避免事项

- Tool logic leaking into `App.tsx`
- Cross-tool imports between tool pages
- One huge “shared tool engine” abstraction
- Persisting ephemeral presentation state

## 状态管理规则

### 本地状态

Default to `useState`, `useRef`, and `useEffect`.

Appropriate for:

- current input text
- selected format or mode
- copy icon feedback
- temporary validation status

### 持久化

Use localStorage only for user-value state that improves continuity.

Current persistence examples:

- sidebar UI settings
- JSON editor draft
- timestamp draft
- text/code diff draft
- calculator draft

Use [`draftCache.ts`](/Users/nornia/code/codex/tools/src/utils/draftCache.ts) for tool draft retention.

Persistence rules:

- persist only user-entered content or user-selected mode
- allow page-level continuity without persisting one-shot UI state
- clear drafts on full-page reload when the tool uses reload-clearing behavior
- clear storage when the persisted content is effectively empty
- do not persist one-shot UI feedback such as copied icons or temporary error labels

## 共享工具规则

Create a shared utility only when at least one of these is true:

- logic is used by 2 or more tools
- logic represents infrastructure policy
- logic is hard to keep consistent if duplicated

Good candidates:

- draft caching
- tool draft hook
- copy feedback hook
- lightweight tool page skeleton
- route helpers
- clipboard helpers if unified later

Bad candidates:

- a generic “tool formatter” for unrelated tools
- a large “tool page base component” with many optional branches

## 视觉与交互边界

Architecture and design must stay aligned.

Use [`DESIGN.md`](/Users/nornia/code/codex/tools/DESIGN.md) as the source of truth for:

- header action button style
- copy feedback pattern
- page labels
- status line wording
- homepage CTA patterns

Do not add a reusable interaction pattern without updating `DESIGN.md`.

## 第三方依赖

Only add a dependency when one of these is true:

- the capability is editor-grade and hard to reproduce reliably
- the dependency materially reduces maintenance risk
- the feature is central enough to justify the weight

Current example:

- Monaco Diff Editor for text/code diff

Before adding a new dependency, evaluate:

- bundle cost
- CSS/style integration cost
- accessibility and keyboard behavior
- whether the dependency is now architectural, not just convenient

## 命名规则

### 文件

- Tool pages: `PascalCase.tsx`
- Shared React components: `PascalCase.tsx`
- Shared utilities: `camelCase.ts`

### 工具命名

- User-facing names should be concise and explicit
- Internal ids should be stable and English-based

Examples:

- `textCodeDiff` -> `文本代码对比`
- `timestamp` -> `时间戳转换`

## 职责归属

### `src/config/tools.ts`

Owns:

- tool metadata
- route strings
- tool-to-component registration

Does not own:

- tool business logic
- app layout
- page-specific interaction state

### `App.tsx`

Owns:

- active tool selection
- shell composition

Does not own:

- tool metadata definitions
- tool business logic
- tool-specific formatting
- tool-specific persistence logic

### 工具组件

Owns:

- tool UI
- tool state
- tool-specific interactions
- tool-specific persistence

Does not own:

- global layout
- navigation rules
- unrelated shared concerns

### 共享工具

Owns:

- narrow reusable policy or helper behavior

Does not own:

- page rendering
- tool-specific presentation

## 变更管理规则

When modifying architecture:

- prefer the smallest change that makes the rule clearer
- do not rewrite stable tools just to satisfy abstraction aesthetics
- if a pattern becomes reused, document it
- if a tool needs a justified exception, keep the exception local and explicit

## 架构变更完成标准

An architectural change is not complete unless:

- code follows the current tool isolation model
- routing and naming stay aligned
- persistence is intentional and scoped
- design conventions remain consistent
- README and architecture docs stay accurate when behavior changes materially
