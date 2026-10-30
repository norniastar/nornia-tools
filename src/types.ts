import type { LucideIcon } from 'lucide-react';

export type ToolId = 'json' | 'timestamp' | 'uuid' | 'textCodeDiff' | 'urlCodec' | 'calculator';

export interface ToolDefinition {
  id: ToolId;
  /** URL 路径段，例如 json 对应 /json */
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** 页面 <title>，不含站点名 */
  seoTitle: string;
  /** meta description，建议 70～160 字 */
  seoDescription: string;
  keywords: string[];
  /** 工具下方「关于此工具」的说明段落 */
  intro: string;
  features: string[];
}
