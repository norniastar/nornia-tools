# 设计规范

## 目的

This document defines the current UI design conventions for the tools workspace. Use it to keep new pages and component updates visually consistent.

## 核心原则

- Keep the interface clean, utility-focused, and compact.
- Prefer white content surfaces over colored panels.
- Use subtle borders and restrained shadows before using strong fills.
- Reserve saturated blue for active states, primary actions, and key highlights.
- Favor concise labels and avoid decorative text that does not improve usability.

## 布局

- The app uses a light workspace background with white tool surfaces.
- Tool pages should follow a consistent vertical structure:
  - Page header
  - Primary work area
  - Secondary controls or status areas when needed
- Secondary section labels should be short and explicit, such as `左侧`, `右侧`, `输入`, `过滤结果`.

## 字体

- Page titles use strong visual weight.
- Secondary labels use uppercase microcopy with wide tracking.
- Content areas should prioritize readability over emphasis.
- Do not add bold weight by default unless emphasis is genuinely needed.

## 表面与容器

- Default surface: `bg-white`
- Default border: `border border-slate-200`
- Secondary background: `bg-slate-50` or `bg-slate-100`
- Shadows should stay subtle and mostly support hover or hierarchy.

## 圆角分级

Use a small set of radius levels across the project. Do not introduce extra radius values casually.

### 1. 硬边

- `rounded-none`
- Used for deliberate hard-edge areas such as the sidebar items and the navbar search input.

### 2. 小圆角

- `rounded`
- Used for tiny labels, tooltip shells, and very small control details.

### 3. 标准控件圆角

- `rounded-md`
- Used for icon buttons, regular buttons, small input controls, and compact interaction elements.

### 4. 中型容器圆角

- `rounded-lg`
- Used for segmented controls, status bars, filter bars, dropdown panels, and secondary containers.

### 5. 大工作区圆角

- `rounded-xl`
- Used for large editor panels, major white work surfaces, overview cards, and other primary containers.

### 使用规则

- Small interactive controls should default to `rounded-md`.
- Secondary grouped containers should default to `rounded-lg`.
- Primary work surfaces should default to `rounded-xl`.
- Use `rounded-full` only for dots or intentionally circular elements, not for standard cards or controls.
- Navigation areas and work areas use different radius strategies:
  - Sidebar navigation and other intentional hard-edge navigation surfaces should stay on `rounded-none`.
  - Main content work areas should follow the layered `rounded-md` / `rounded-lg` / `rounded-xl` scale.
- Do not force the sidebar tool list to match the card radius used inside tool pages.

## 主按钮

This is the current reference style for homepage primary CTA buttons such as `开始处理`.

### 视觉意图

- Compact height
- Saturated blue fill
- Inset bottom shadow for a pressed, tactile feel
- Hover removes the shadow and darkens the fill
- Active state slightly translates down and scales in

### Tailwind 参考

```tsx
className="group w-full h-8 px-2.5 rounded-sm border border-transparent bg-[hsl(219,93%,42%)] text-white text-sm tracking-tight transition-all select-none flex items-center justify-center gap-1.5 [box-shadow:hsl(219,_93%,_30%)_0_-2px_0_0_inset,_hsl(219,_93%,_95%)_0_1px_3px_0] hover:bg-[hsl(219,93%,35%)] hover:[box-shadow:none] active:translate-y-px active:scale-[.99] active:[box-shadow:none] disabled:opacity-50 disabled:cursor-not-allowed"
```

### 使用规则

- Use this style for primary CTA actions on overview cards and similar entry actions.
- Do not use this style for destructive actions.
- Do not mix this button with large-radius, soft-pill button styles on the same surface.
- Keep the label short. One icon on the right is allowed.

## 页头操作按钮

For tool-page header actions, follow the lighter icon-button pattern already used in the JSON editor:

- `p-2`
- muted slate icon color
- hover background on light gray
- rounded corners
- optional tooltip

This pattern is preferred for utility actions such as format, clear, collapse, expand, and refresh.

## 页头类型

Tool-page headers currently fall into two distinct patterns. Do not mix them casually.

### 1. 图标操作型页头

Use this for pages where the right side mainly contains immediate actions.

Examples:

- JSON editor
- UUID generator
- Text/code diff
- Calculator

Rules:

- Right side uses compact icon buttons.
- Buttons should rely on tooltip labels instead of inline text.
- Destructive actions remain visually neutral by default and only turn red on hover.

### 2. 参数控制型页头

Use this for pages where the right side primarily controls conversion mode or display mode.

Examples:

- Timestamp converter

Rules:

- Right side can use segmented controls, dropdowns, or parameter chips.
- These controls are not treated as icon action buttons.
- Parameter controls and icon actions should be visually grouped separately if they appear together.

## 状态文案

- Status lines should be short and low-noise.
- Prefer factual summaries like `共 21 行`.
- Avoid verbose operational phrases when a shorter status conveys the same information.

## 草稿保留

Draft retention should feel helpful, not sticky.

### 标准模式

- Keep user-entered content when switching between tools inside the app.
- Clear tool drafts on full-page reload when the tool uses reload-clearing behavior.
- Do not silently expire drafts based on short TTL timers.

### 使用规则

- Persist only user-entered content and user-selected modes that help continuity.
- Do not persist derived data, copied state, or temporary status text.
- Clear storage when the persisted content is effectively empty.
- Use the same draft behavior across tools unless a tool has a strong product reason to differ.

## 复制反馈

Copy interactions must use light local confirmation by default.

### 标准模式

- Keep the original layout stable after copy.
- Use local confirmation instead of page-level interruption.
- The copy icon switches temporarily to a check icon.
- A slight local blue emphasis is allowed on the current item or action area.
- The confirmation resets automatically after a short delay.

### 使用规则

- Prefer local feedback over page-level toast notifications.
- Do not show `已复制` text for normal copy actions.
- Do not add extra success badges, inline pills, or overlays for standard copy flows.
- Do not block repeated copy actions with heavy visual layers.
- Keep the same icon-only confirmation pattern across high-frequency copy actions.

### 当前参考实现

- UUID generator is the reference implementation for copy success feedback.

## 说明

- This document reflects the current baseline, not a locked design system.
- When introducing a new reusable pattern, add it here once it is confirmed in the UI.
