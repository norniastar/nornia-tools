import React from 'react';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { ToolDefinition, ToolId } from '../types';
import Tooltip from './Tooltip';

export const Navbar = ({ searchQuery, setSearchQuery, onLogoClick }: { searchQuery: string, setSearchQuery: (val: string) => void, onLogoClick: () => void }) => (
  <nav className="sticky top-0 w-full z-50 bg-white border-b border-slate-200 h-14">
    <div className="flex items-center justify-between px-6 h-full max-w-[1600px] mx-auto">
      <div className="flex items-center gap-8">
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-3 text-lg font-bold tracking-tight text-[#0057c1] hover:opacity-80 transition-opacity"
        >
          <span className="relative flex h-8 w-8 items-center justify-center">
            <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
              <rect x="3.5" y="3.5" width="24" height="24" rx="4.5" stroke="#2f5cff" strokeWidth="2.4" />
              <rect x="9.5" y="9.5" width="12" height="12" rx="2.5" fill="#2f5cff" />
              <path d="M8 25L24 9" stroke="#2f5cff" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M12.5 11.8V19.2H14.2V15.1L17.6 19.2H19.1V11.8H17.4V15.8L14.1 11.8H12.5Z" fill="white" />
            </svg>
          </span>
          Nornia Tools
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="搜索工具..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-100 border-none rounded-none pl-10 pr-4 py-1.5 text-sm w-64 focus:ring-1 focus:ring-[#0057c1]"
          />
        </div>
      </div>
    </div>
  </nav>
);

export const Sidebar = ({ activeTool, setActiveTool, tools, isCollapsed, setIsCollapsed, width, setWidth }: { 
  activeTool: ToolId, 
  setActiveTool: (id: ToolId) => void, 
  tools: ToolDefinition[],
  isCollapsed: boolean,
  setIsCollapsed: (val: boolean) => void,
  width: number,
  setWidth: (val: number) => void
}) => {
  const isResizing = React.useRef(false);

  const [isResizingState, setIsResizingState] = React.useState(false);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth >= 160 && newWidth <= 480) {
      setWidth(newWidth);
    }
  }, [setWidth]);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    setIsResizingState(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    setIsResizingState(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, stopResizing]);

  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  return (
    <aside 
      style={{ width: isCollapsed ? 64 : width }}
      className={`hidden lg:flex self-stretch border-r border-slate-200 bg-[#f8f9ff] flex-col ${isResizingState ? '' : 'transition-[width] duration-300 ease-in-out'} group relative`}
    >
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className={`mb-6 px-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <p className="text-[10px] text-slate-400 font-mono">v0.0.1</p>}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 transition-colors"
            title={isCollapsed ? "展开菜单" : "收起菜单"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
          <nav className="flex flex-col gap-1">
            {tools.map(tool => {
              const button = (
                <button 
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 transition-all rounded-none ${activeTool === tool.id ? 'bg-white text-[#0057c1] shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                  <tool.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium truncate">{tool.name}</span>}
                </button>
              );

              return (
                <React.Fragment key={tool.id}>
                  {isCollapsed ? (
                    <Tooltip text={tool.name} position="right">
                      {button}
                    </Tooltip>
                  ) : button}
                </React.Fragment>
              );
            })}
          </nav>
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 transition-colors z-50"
        />
      )}
    </aside>
  );
};
