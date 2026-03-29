# 新建工具指引

## 目的

Use this guide when adding a new tool to `Nornia Tools`.

The goal is not just to make the tool work.  
The goal is to make the tool fit the existing product, architecture, and UI rules without creating special-case debt.

## 开始前先确认

Define these five things first:

1. Tool name
2. Internal `ToolId`
3. Hash route
4. Core input
5. Core output

If any of these is unclear, the tool is not ready to implement.

## 验收标准

A new tool is complete only if it has:

- a home/dashboard entry
- a route
- a page header
- a usable default empty state
- clear primary interaction
- clear clear/reset behavior when applicable
- copy behavior aligned with `DESIGN.md`
- lint passing

## 分步清单

### 1. 添加工具 id

Update [`src/types.ts`](/Users/nornia/code/codex/tools/src/types.ts).

Rules:

- add one stable `ToolId`
- use English camelCase
- do not rename existing ids casually

Example:

```ts
export type ToolId =
  | 'dashboard'
  | 'json'
  | 'timestamp'
  | 'uuid'
  | 'textCodeDiff'
  | 'calculator'
  | 'newTool';
```

### 2. 创建工具组件

Add a new page-level component in [`src/components`](/Users/nornia/code/codex/tools/src/components).

Naming rules:

- file name: `PascalCase.tsx`
- default export name should match the file
- name should describe the tool, not the implementation detail

Examples:

- `Base64Tool.tsx`
- `RegexTester.tsx`
- `CronPreviewTool.tsx`

### 3. 注册路由

Update [`src/config/tools.ts`](/Users/nornia/code/codex/tools/src/config/tools.ts).

Required changes:

- add the new tool definition
- set the route
- register the component
- register the icon and metadata

Route rules:

- kebab-case
- short
- one route per tool

Example:

```ts
newTool: '/new-tool'
```

### 4. 注册首页入口

Dashboard and sidebar entries are derived from [`src/config/tools.ts`](/Users/nornia/code/codex/tools/src/config/tools.ts).

Required fields:

- `id`
- `name`
- `description`
- `icon`

Rules:

- name should be user-facing and direct
- description should explain the value in one sentence
- avoid inflated wording

### 5. 构建页面页头

Every tool page needs a consistent header.

Use [`src/components/ToolPage.tsx`](/Users/nornia/code/codex/tools/src/components/ToolPage.tsx) as the default page skeleton.

Header must include:

- left: page title
- right: action area or parameter controls

Use the correct header type from [`DESIGN.md`](/Users/nornia/code/codex/tools/DESIGN.md):

- `Icon Action Header`
- `Parameter Control Header`

Do not invent a third header type unless it becomes a documented pattern.

### 6. 构建主工作区

The work area should be immediately usable.

Rules:

- keep the primary task visible without extra clicks
- do not rely on demo data unless there is a strong reason
- do not add decorative empty states that slow down usage
- use short secondary labels such as `输入`, `输出`, `左侧`, `右侧`

### 7. 明确持久化策略

Ask whether the tool benefits from draft retention.

Use [`src/hooks/useToolDraft.ts`](/Users/nornia/code/codex/tools/src/hooks/useToolDraft.ts) when:

- the tool has user-entered content
- the content is likely to be revisited during the current browser session
- restoring the draft improves continuity

Rules:

- persist only user-entered or user-selected values
- do not persist ephemeral UI state
- do not persist copy feedback state
- prefer keeping content across in-app tool switching
- prefer clearing drafts on full-page reload for temporary tools
- clear the draft when content is effectively empty

### 8. 正确接入复制反馈

If the tool supports copy:

- use [`src/hooks/useCopyFeedback.ts`](/Users/nornia/code/codex/tools/src/hooks/useCopyFeedback.ts)
- use icon-based confirmation
- switch to a check icon briefly
- do not show `已复制` text
- do not use global toast by default

Reference:

- [`DESIGN.md`](/Users/nornia/code/codex/tools/DESIGN.md)
- [`src/components/UUIDGeneratorTool.tsx`](/Users/nornia/code/codex/tools/src/components/UUIDGeneratorTool.tsx)

### 9. 只添加真实有效的操作按钮

Do not add header actions just because other tools have them.

Only include:

- format if the tool has a meaningful formatter
- clear if the tool has user-entered content
- reset if the tool has multiple settings and reset materially helps

Every action must have actual behavior.

No placeholder actions.

### 10. 保持工具自包含

New tools should not require touching unrelated components.

Normal change scope:

- `src/types.ts`
- `src/config/tools.ts`
- one new tool file
- optional shared helper if truly justified
- docs if a new reusable pattern is introduced

If a new tool requires widespread shell rewrites, re-evaluate the design first.

## 推荐工具文件结构

Use this structure as the default mental model:

1. imports
2. local constants
3. helper functions
4. local types
5. component state
6. effects
7. event handlers
8. derived view state
9. JSX

Keep helper logic above the component unless it depends on hooks.

## 示例骨架

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Tooltip from './Tooltip';
import { ToolHeader, ToolPage } from './ToolPage';
import { useToolDraft } from '../hooks/useToolDraft';
import { useCopyFeedback } from '../hooks/useCopyFeedback';

const NEW_TOOL_CACHE_KEY = 'new_tool_draft';

const NewTool = () => {
  const emptyDraft = useMemo(() => ({ input: '' }), []);
  const { initialDraft, persistDraft } = useToolDraft(
    NEW_TOOL_CACHE_KEY,
    emptyDraft,
    { clearOnReload: true }
  );
  const { copyText, copiedKey } = useCopyFeedback<'result'>();
  const [input, setInput] = useState(initialDraft.input);
  const [result, setResult] = useState('');

  useEffect(() => {
    persistDraft({ input }, Boolean(input));
  }, [persistDraft, input]);

  const handleClear = () => {
    setInput('');
    setResult('');
  };

  return (
    <ToolPage>
      <ToolHeader
        title="新工具"
        actions={
          <Tooltip text="清除全部">
            <button className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors rounded-md">
              <Trash2 className="w-5 h-5" />
            </button>
          </Tooltip>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {/* primary work area */}
      </div>
    </ToolPage>
  );
};

export default NewTool;
```

## 何时抽取共享组件

Extract only when:

- the UI pattern is now stable
- the same pattern appears in at least two tools
- extraction reduces drift more than it adds abstraction cost

Good examples:

- tooltip
- draft cache utility
- shared picker input

Bad examples:

- generic “tool card body”
- generic “two panel tool layout” before requirements stabilize

## 合并前检查清单

- route works from hash directly
- sidebar selection works
- dashboard card opens the tool
- empty state is clean
- copy interaction matches current design rules
- clear/reset behavior is real and safe
- no unused imports
- no fake shortcut labels
- no default demo data unless intentionally approved
- `npm run lint` passes

## 文档更新规则

If the new tool introduces a reusable UI or interaction pattern:

- update [`DESIGN.md`](/Users/nornia/code/codex/tools/DESIGN.md)

If the new tool changes structural app rules:

- update [`ARCHITECTURE.md`](/Users/nornia/code/codex/tools/ARCHITECTURE.md)

## 最终原则

New tools should feel native to the workspace on day one.

That means:

- no extra visual language
- no one-off routing style
- no ad hoc state policy
- no fake actions
- no undocumented exceptions
