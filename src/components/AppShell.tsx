'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar, Sidebar } from './Layout';
import { SIDEBAR_COLLAPSED_KEY, SIDEBAR_WIDTH_KEY } from '../config/sidebar';
import { TOOL_DEFINITIONS } from '../config/tools';
import type { ToolDefinition } from '../types';

const FilteredToolsContext = createContext<ToolDefinition[]>(TOOL_DEFINITIONS);

export const useFilteredTools = () => useContext(FilteredToolsContext);

const readStoredJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export default function AppShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // 静态 HTML 里侧边栏宽度由 <head> 内联脚本写入的 CSS 变量决定，
  // 水合后再读 localStorage 接管，避免首屏布局跳动
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useLayoutEffect(() => {
    setIsSidebarCollapsed(readStoredJson(SIDEBAR_COLLAPSED_KEY, false));
    setSidebarWidth(readStoredJson(SIDEBAR_WIDTH_KEY, 240));
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (prefsLoaded) localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed, prefsLoaded]);

  useEffect(() => {
    if (prefsLoaded) localStorage.setItem(SIDEBAR_WIDTH_KEY, JSON.stringify(sidebarWidth));
  }, [sidebarWidth, prefsLoaded]);

  // 首次加载直接显示静态内容，只有站内切换页面时才播放进入动画
  const initialPathname = useRef(pathname);
  const hasNavigated = useRef(false);
  if (pathname !== initialPathname.current) hasNavigated.current = true;
  const shouldAnimate = hasNavigated.current;

  const query = searchQuery.toLowerCase();
  const filteredTools = TOOL_DEFINITIONS.filter(
    tool => tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query),
  );

  return (
    <FilteredToolsContext.Provider value={filteredTools}>
      <div className="min-h-screen bg-[#f8f9ff] font-sans selection:bg-blue-100 flex flex-col">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            pathname={pathname}
            tools={filteredTools}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            width={prefsLoaded ? (isSidebarCollapsed ? 64 : sidebarWidth) : 'var(--sidebar-width, 240px)'}
            setWidth={setSidebarWidth}
          />
          <main className="flex-1 min-h-0 p-4 lg:p-6 max-w-7xl mx-auto w-full">
            <div key={pathname} className={shouldAnimate ? 'tool-enter' : undefined}>
              {children}
            </div>
          </main>
        </div>
        {footer}
      </div>
    </FilteredToolsContext.Provider>
  );
}
