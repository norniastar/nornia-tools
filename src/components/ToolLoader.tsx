'use client';

import dynamic from 'next/dynamic';
import { FileDiff, Link2 } from 'lucide-react';
import { ToolHeader, ToolPage } from './ToolPage';
import { TOOL_DEFINITIONS_BY_ID } from '../config/tools';
import type { ToolId } from '../types';

// 工具代码加载前的占位：标题与真实组件一致，进静态 HTML；
// 高度按各工具在 390px / 1440px 宽度下实测高度的较小值预留（JSON、对比页见 FULL_HEIGHT_CLASS），
// 加载完成后下方内容基本不跳动
const SKELETON: Record<ToolId, { minHeight: number; fullHeight?: boolean; icon?: React.ReactNode; wrap?: boolean }> = {
  json: { minHeight: 0, fullHeight: true },
  timestamp: { minHeight: 397 },
  uuid: { minHeight: 444 },
  textCodeDiff: { minHeight: 0, fullHeight: true, icon: <FileDiff className="text-[#0057c1] w-6 h-6" />, wrap: true },
  urlCodec: { minHeight: 644, icon: <Link2 className="text-[#0057c1] w-6 h-6" /> },
  calculator: { minHeight: 186 },
};

const ToolSkeleton = ({ toolId }: { toolId: ToolId }) => {
  const { fullHeight, icon, wrap } = SKELETON[toolId];
  return (
    <ToolPage fullHeight={fullHeight}>
      <ToolHeader title={TOOL_DEFINITIONS_BY_ID[toolId].name} icon={icon} wrap={wrap} />
    </ToolPage>
  );
};

// 工具依赖浏览器（localStorage 草稿、crypto、编辑器），只在客户端渲染并按需加载
const TOOL_COMPONENTS: Record<ToolId, React.ComponentType> = {
  json: dynamic(() => import('./JSONEditorTool'), { ssr: false, loading: () => <ToolSkeleton toolId="json" /> }),
  timestamp: dynamic(() => import('./TimestampTool'), { ssr: false, loading: () => <ToolSkeleton toolId="timestamp" /> }),
  uuid: dynamic(() => import('./UUIDGeneratorTool'), { ssr: false, loading: () => <ToolSkeleton toolId="uuid" /> }),
  textCodeDiff: dynamic(() => import('./TextCodeDiffTool'), {
    ssr: false,
    loading: () => <ToolSkeleton toolId="textCodeDiff" />,
  }),
  urlCodec: dynamic(() => import('./URLCodecTool'), { ssr: false, loading: () => <ToolSkeleton toolId="urlCodec" /> }),
  calculator: dynamic(() => import('./CalculatorTool'), { ssr: false, loading: () => <ToolSkeleton toolId="calculator" /> }),
};

// 编辑器类工具撑满首屏：视口高度减去导航栏 56px、main 上下内边距和页脚高度，
// 与改造前 h-full 的效果一致（下方的工具说明在首屏之外）
const FULL_HEIGHT_CLASS = 'h-[calc(100vh-151px)] md:h-[calc(100vh-128px)] lg:h-[calc(100vh-144px)]';

const ToolLoader = ({ toolId }: { toolId: ToolId }) => {
  const Tool = TOOL_COMPONENTS[toolId];
  const { minHeight, fullHeight } = SKELETON[toolId];
  return (
    <div className={fullHeight ? FULL_HEIGHT_CLASS : undefined} style={{ minHeight }}>
      <Tool />
    </div>
  );
};

export default ToolLoader;
