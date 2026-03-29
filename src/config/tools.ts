import { Calculator, Clock, Code2, FileDiff, Fingerprint, Home } from 'lucide-react';
import type { ToolDefinition, ToolId } from '../types';
import JSONEditorTool from '../components/JSONEditorTool';
import TimestampTool from '../components/TimestampTool';
import UUIDGeneratorTool from '../components/UUIDGeneratorTool';
import TextCodeDiffTool from '../components/TextCodeDiffTool';
import CalculatorTool from '../components/CalculatorTool';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'dashboard',
    name: '首页',
    description: '开发工具总览与入口页。',
    icon: Home,
    route: '/',
  },
  {
    id: 'json',
    name: 'JSON 编辑器',
    description: '格式化、验证并转换复杂的 JSON 数据结构。支持一键美化与压缩。',
    icon: Code2,
    route: '/json',
    component: JSONEditorTool,
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: '在 Unix 时间戳与人类可读日期之间快速转换，支持多种时区选择。',
    icon: Clock,
    route: '/timestamp',
    component: TimestampTool,
  },
  {
    id: 'uuid',
    name: 'UUID 生成器',
    description: '批量生成符合 RFC 4122 的 v4 唯一标识符。',
    icon: Fingerprint,
    route: '/uuid',
    component: UUIDGeneratorTool,
  },
  {
    id: 'textCodeDiff',
    name: '文本代码对比',
    description: '并排对比文本或代码内容，实时高亮新增、删除及修改差异。',
    icon: FileDiff,
    route: '/text-code-diff',
    component: TextCodeDiffTool,
  },
  {
    id: 'calculator',
    name: '计算稿纸',
    description: '反应式数学笔记本。编写逻辑，即时查看结果。支持变量定义。',
    icon: Calculator,
    route: '/calculator',
    component: CalculatorTool,
  },
];

export const TOOL_ROUTES = TOOL_DEFINITIONS.reduce<Record<ToolId, string>>((accumulator, tool) => {
  accumulator[tool.id] = tool.route;
  return accumulator;
}, {} as Record<ToolId, string>);

export const TOOL_DEFINITIONS_BY_ID = TOOL_DEFINITIONS.reduce<Record<ToolId, ToolDefinition>>((accumulator, tool) => {
  accumulator[tool.id] = tool;
  return accumulator;
}, {} as Record<ToolId, ToolDefinition>);

export const APP_TOOLS = TOOL_DEFINITIONS.filter(tool => tool.id !== 'dashboard');
