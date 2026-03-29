# Nornia Tools

轻量、直接可用的开发者工具集合。

在线体验：[tools.nornia.top](https://tools.nornia.top)

## 项目定位

`Nornia Tools` 是一个面向日常开发场景的浏览器工具工作台，目标很简单：

- 打开即用
- 减少在零散工具站之间来回切换
- 保持单页内完成常见处理任务

当前项目聚焦前端可直接完成的本地型工具能力，不依赖后端即可完成核心流程。

## 当前工具

- `JSON 编辑器`
  格式化、压缩、过滤、去注释，并支持复制压缩结果。
- `时间戳转换`
  支持日期与时间戳互转、单位切换、时区切换和当前时间戳复制。
- `UUID 生成器`
  批量生成 RFC 4122 v4 UUID，并提供多种常用格式。
- `文本代码对比`
  基于 Monaco Diff Editor 的并排文本/代码对比，支持 `Text / JSON / YAML / Go`。
- `URL 编解码`
  实时进行 URL 编码与解码，支持自动识别并快速复制结果。
- `计算稿纸`
  用于快速书写和计算数学表达式，适合临时草稿计算。

## 特性

- Hash 路由直达，每个工具都支持书签访问
- 统一的工具页结构和右上角交互规范
- 高频复制操作采用轻量反馈
- 部分工具支持页面内切换保留输入内容，手动刷新后清空
- 首页与工具页遵循统一的设计和架构规范

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- Monaco Editor
- Lucide Icons

## 本地开发

### 环境要求

- Node.js 18+

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 类型检查

```bash
npm run lint
```

## 路由

支持以下 hash 路由：

- `#/`
- `#/json`
- `#/timestamp`
- `#/uuid`
- `#/text-code-diff`
- `#/url-codec`
- `#/calculator`

## 项目结构

```text
src/
  components/        页面级工具与共享组件
  config/            工具注册与路由配置
  hooks/             通用交互 hooks
  utils/             基础工具函数
  App.tsx            应用壳与页面装配
```

## 规范文档

- 设计规范：[DESIGN.md](./DESIGN.md)
- 架构规范：[ARCHITECTURE.md](./ARCHITECTURE.md)
- 新建工具指引：[TOOLING_GUIDE.md](./TOOLING_GUIDE.md)

## 后续开发建议

新增工具时，优先遵循以下约定：

- 工具页文件统一使用 `*Tool.tsx`
- 工具注册统一维护在 `src/config/tools.ts`
- 工具页骨架优先复用 `ToolPage` / `ToolHeader`
- 草稿缓存优先复用 `useToolDraft`
- 复制反馈优先复用 `useCopyFeedback`

## License

[MIT](./LICENSE)
