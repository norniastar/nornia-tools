import { Calculator, Clock, Code2, FileDiff, Fingerprint, Link2 } from 'lucide-react';
import type { ToolDefinition, ToolId } from '../types';

export const SITE_URL = 'https://tools.nornia.top';
export const SITE_NAME = 'Nornia Tools';
export const SITE_TITLE = 'Nornia Tools - 在线开发小工具';
// 页面自己声明 openGraph 时不会继承 app/opengraph-image 生成的图片，需显式引用
export const OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'Nornia Tools - Developer Utility Toolkit' };
export const SITE_DESCRIPTION =
  '免费在线开发者工具箱：JSON 格式化与校验、Unix 时间戳转换、UUID 生成、文本代码对比、URL 编解码、计算稿纸。打开即用，数据只在浏览器本地处理。';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'json',
    slug: 'json',
    name: 'JSON 编辑器',
    description: '格式化、验证并转换复杂的 JSON 数据结构。支持一键美化与压缩。',
    icon: Code2,
    seoTitle: 'JSON 格式化 / 校验 / 压缩在线工具',
    seoDescription:
      '在线 JSON 编辑器：格式化美化、语法校验、压缩、转义压缩、去除注释，支持大数字无损解析和 JavaScript 表达式过滤 JSON 数据。全部在浏览器本地完成。',
    keywords: ['JSON 格式化', 'JSON 校验', 'JSON 压缩', 'JSON 转义', 'JSON 在线编辑器'],
    intro:
      '粘贴 JSON 即可自动格式化并校验语法，错误位置会直接在编辑器中标出。可以一键压缩、压缩并转义后复制，或去除 JSON 中的注释；大整数按原样保留，不会丢失精度。右侧过滤框支持写 JavaScript 表达式（例如 .filter(item => item.age >= 18)）对数据做筛选和计算。',
    features: ['格式化与语法校验', '压缩 / 压缩转义并复制', '去除注释', '大数字无损解析', '表达式过滤与计算', '折叠 / 展开全部节点'],
  },
  {
    id: 'timestamp',
    slug: 'timestamp',
    name: '时间戳转换',
    description: '在 Unix 时间戳与人类可读日期之间快速转换，支持多种时区选择。',
    icon: Clock,
    seoTitle: 'Unix 时间戳转换工具（秒 / 毫秒）',
    seoDescription:
      '在线 Unix 时间戳转换：时间戳转日期、日期转时间戳，支持秒和毫秒，支持 UTC、北京时间（UTC+8）、美国东部时间，实时显示当前时间戳。',
    keywords: ['时间戳转换', 'Unix 时间戳', '时间戳转日期', '日期转时间戳', '毫秒时间戳'],
    intro:
      '在「时间戳 → 日期」中输入秒或毫秒级 Unix 时间戳，立即得到对应时区的日期时间；在「日期 → 时间戳」中输入或用日历选择日期，得到对应的时间戳。页面顶部实时显示当前时间戳，可在秒和毫秒之间切换，时区支持 UTC、北京时间与美国东部时间。',
    features: ['时间戳转日期', '日期转时间戳', '秒 / 毫秒切换', 'UTC、北京、美东时区', '实时当前时间戳', '多行批量转换'],
  },
  {
    id: 'uuid',
    slug: 'uuid',
    name: 'UUID 生成器',
    description: '批量生成符合 RFC 4122 的 v4 唯一标识符。',
    icon: Fingerprint,
    seoTitle: 'UUID v4 在线生成器',
    seoDescription:
      '在线生成符合 RFC 4122 标准的 UUID v4（GUID），同时给出小写、大写、去掉连字符等格式，一键复制。使用浏览器加密随机数生成。',
    keywords: ['UUID 生成', 'UUID v4', 'GUID 生成', '随机 UUID', 'RFC 4122'],
    intro:
      '打开页面即自动生成一个 UUID v4，并同时给出小写、大写、去掉连字符的小写和大写四种格式，点击即可复制，点击刷新按钮重新生成。UUID 由浏览器的 crypto.randomUUID() 生成，基于加密安全的随机数。',
    features: ['RFC 4122 v4 标准', '小写 / 大写格式', '去掉连字符格式', '一键复制', '加密安全随机数'],
  },
  {
    id: 'textCodeDiff',
    slug: 'text-code-diff',
    name: '文本代码对比',
    description: '并排对比文本或代码内容，实时高亮新增、删除及修改差异。',
    icon: FileDiff,
    seoTitle: '文本 / 代码 / JSON 在线对比工具',
    seoDescription:
      '在线文本对比与代码 Diff 工具：左右并排对比纯文本、JSON、YAML、Go 代码，实时高亮新增、删除和修改的内容，支持排序后对比。基于 Monaco 编辑器。',
    keywords: ['文本对比', '代码对比', 'Diff 工具', 'JSON 对比', 'YAML 对比'],
    intro:
      '在左右两侧分别粘贴要比较的内容，差异会实时高亮显示：新增、删除和行内修改一目了然。可以按纯文本、JSON、YAML 或 Go 语法高亮；还能一键排序左右内容（JSON / YAML 按键名递归排序，文本按行排序）再比较，排除顺序不同带来的干扰。',
    features: ['左右并排实时 Diff', '文本 / JSON / YAML / Go 高亮', '排序后对比', '行内差异高亮', '基于 Monaco 编辑器'],
  },
  {
    id: 'urlCodec',
    slug: 'url-codec',
    name: 'URL 编解码',
    description: '实时进行 URL 编解码，并支持 \\u0026 这类 Unicode 转义内容的自动还原。',
    icon: Link2,
    seoTitle: 'URL 编码 / 解码在线工具',
    seoDescription:
      '在线 URL 编码与解码（encodeURIComponent / decodeURIComponent），实时转换，并能自动还原 \\u0026 这类 Unicode 转义字符。一键复制结果。',
    keywords: ['自动识别编码 / 解码', 'URL 编码', 'URL 解码', 'urlencode', 'urldecode', 'Unicode 转义还原'],
    intro:
      '输入需要处理的内容，可选择自动识别、编码或解码，结果实时显示在下方。除了常规的 URL 百分号编码和解码，还能识别并还原 \\u0026、\\u003d 这类 Unicode 转义序列，适合处理从日志或 JSON 中复制出来的链接。',
    features: ['自动识别编码 / 解码', 'URL 编码', 'URL 解码', 'Unicode 转义还原', '实时转换', '一键复制'],
  },
  {
    id: 'calculator',
    slug: 'calculator',
    name: '计算稿纸',
    description: '反应式数学笔记本。编写表达式，即时查看结果。',
    icon: Calculator,
    seoTitle: '在线计算稿纸 - 多行表达式计算器',
    seoDescription:
      '在线计算稿纸：一行写一个数学表达式，结果即时显示在右侧，可逐行复制，适合连续的估算与核对。所有计算都在浏览器本地完成。',
    keywords: ['在线计算器', '计算稿纸', '表达式计算', '多行计算器'],
    intro:
      '每行输入一个数学表达式（例如 1200 * 0.08 + 15），右侧会立即显示计算结果，写完最后一行会自动追加新行。每一行的结果都可以单独复制；在不同工具之间切换时草稿会保留。',
    features: ['多行表达式', '结果即时显示', '逐行复制结果', '切换工具保留草稿'],
  },
];

export const TOOL_DEFINITIONS_BY_ID = Object.fromEntries(TOOL_DEFINITIONS.map(tool => [tool.id, tool])) as Record<
  ToolId,
  ToolDefinition
>;

export const TOOL_DEFINITIONS_BY_SLUG = Object.fromEntries(TOOL_DEFINITIONS.map(tool => [tool.slug, tool])) as Record<
  string,
  ToolDefinition
>;

export const toolPath = (tool: ToolDefinition) => `/${tool.slug}`;
