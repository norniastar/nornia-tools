import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToolId } from './types';
import { Navbar, Sidebar } from './components/Layout';
import Dashboard from './components/Dashboard';
import { APP_TOOLS, TOOL_DEFINITIONS_BY_ID, TOOL_ROUTES } from './config/tools';

const ROUTE_TO_TOOL = Object.entries(TOOL_ROUTES).reduce<Record<string, ToolId>>((accumulator, [toolId, route]) => {
  accumulator[route] = toolId as ToolId;
  return accumulator;
}, {});

const getToolFromHash = (): ToolId => {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  return ROUTE_TO_TOOL[hash] ?? 'dashboard';
};

const updateHashForTool = (toolId: ToolId) => {
  const nextHash = `#${TOOL_ROUTES[toolId]}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
};

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>(() => getToolFromHash());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize from localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar_width');
    return saved ? JSON.parse(saved) : 240;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar_width', JSON.stringify(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTool(getToolFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleSelectTool = (toolId: ToolId) => {
    setActiveTool(toolId);
    updateHashForTool(toolId);
  };

  const filteredTools = APP_TOOLS.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTool = () => {
    if (activeTool === 'dashboard') {
      return <Dashboard onSelectTool={handleSelectTool} tools={filteredTools} />;
    }

    const ActiveToolComponent = TOOL_DEFINITIONS_BY_ID[activeTool]?.component;
    return ActiveToolComponent ? <ActiveToolComponent /> : <Dashboard onSelectTool={handleSelectTool} tools={filteredTools} />;
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-sans selection:bg-blue-100 flex flex-col">
      <Navbar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onLogoClick={() => handleSelectTool('dashboard')} 
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar 
          activeTool={activeTool} 
          setActiveTool={handleSelectTool} 
          tools={filteredTools} 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          width={sidebarWidth}
          setWidth={setSidebarWidth}
        />
        <main className="flex-1 min-h-0 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full min-h-0"
            >
              {renderTool()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <footer className="w-full border-t border-slate-200 bg-white py-3">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-tighter text-slate-400">© 2026 Nornia Tools Artisan Edition</span>
          <div className="flex gap-8 font-mono text-[10px] uppercase tracking-tighter text-slate-400">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Changelog</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
