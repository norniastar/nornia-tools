'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useFilteredTools } from './AppShell';
import { toolPath } from '../config/tools';

export const ToolCount = () => <>{useFilteredTools().length}</>;

const ToolGrid = () => {
  const tools = useFilteredTools();

  return (
    <section className="relative z-10 -mt-8 border border-slate-200 bg-[#f8f9ff] p-4 shadow-[0_-1px_0_rgba(255,255,255,0.9)_inset]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-1 pb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Tools</div>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-slate-950">工具列表</h2>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">共 <ToolCount /> 项</div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tools.map(tool => (
          <Link
            key={tool.id}
            href={toolPath(tool)}
            className="group flex h-full w-full flex-col rounded-xl border border-slate-300 bg-[linear-gradient(180deg,#fcfdff_0%,#f7f9fd_100%)] px-4 py-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_3px_rgba(15,23,42,0.06)] transition-all hover:border-slate-400 hover:shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_8px_18px_rgba(15,23,42,0.08)]"
          >
            <div className="min-w-0">
              <div className="truncate text-base font-medium tracking-tight text-slate-950">{tool.name}</div>
            </div>

            <p className="mt-3 line-clamp-2 min-h-[48px] text-sm leading-6 tracking-tight text-slate-700">
              {tool.description}
            </p>

            <div className="mt-4 flex justify-start">
              <span className="inline-flex h-8 shrink-0 select-none items-center justify-center gap-1.5 rounded-sm border border-transparent bg-[hsl(219,93%,42%)] px-2.5 text-sm tracking-tight text-white transition-all [box-shadow:hsl(219,_93%,_30%)_0_-2px_0_0_inset,_hsl(219,_93%,_95%)_0_1px_3px_0] group-hover:bg-[hsl(219,93%,35%)] group-hover:[box-shadow:none] group-active:translate-y-px group-active:scale-[.99] group-active:[box-shadow:none]">
                开始处理
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}

        {tools.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-300 bg-white py-24 text-center">
            <p className="text-lg text-slate-400">未找到匹配的工具</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ToolGrid;
