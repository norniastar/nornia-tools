import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: 'top' | 'right';
}

const Tooltip = ({ children, text, position = 'top' }: TooltipProps) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div className={`absolute ${
      position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2 translate-y-1 group-hover:translate-y-0' : 
      'left-full ml-2 top-1/2 -translate-y-1/2 -translate-x-1 group-hover:translate-x-0'
    } px-2 py-1 bg-slate-900 text-white text-[10px] whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50`}>
      {text}
      <div className={`absolute ${
    position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-900' : 
        'right-full top-1/2 -translate-y-1/2 border-r-slate-900'
      } border-4 border-transparent`} />
    </div>
  </div>
);

export default Tooltip;
