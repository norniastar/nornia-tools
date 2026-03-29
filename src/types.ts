import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ToolId = 'dashboard' | 'json' | 'timestamp' | 'uuid' | 'textCodeDiff' | 'calculator';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  component?: ComponentType;
}
