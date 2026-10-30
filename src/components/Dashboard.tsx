import { Sparkles } from 'lucide-react';
import ToolGrid, { ToolCount } from './ToolGrid';

// 首页主体是静态内容，只有随搜索变化的工具数量和列表是客户端组件
const Dashboard = () => (
  <div className="space-y-0">
    <section className="relative overflow-hidden border border-slate-200 border-b-0 bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,87,193,0.18),_transparent_38%),radial-gradient(circle_at_80%_20%,_rgba(0,87,193,0.12),_transparent_24%),linear-gradient(180deg,_#fbfdff_0%,_#f3f7fc_100%)]" />
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute inset-0 opacity-80">
        <div className="absolute left-[12%] top-[22%] h-2.5 w-2.5 rounded-full bg-[#0057c1] shadow-[0_0_0_6px_rgba(0,87,193,0.08)]" />
        <div className="absolute left-[30%] top-[34%] h-1.5 w-1.5 rounded-full bg-slate-400" />
        <div className="absolute right-[22%] top-[28%] h-2 w-2 rounded-full bg-slate-300" />
        <div className="absolute right-[12%] bottom-[24%] h-2.5 w-2.5 rounded-full bg-[#0057c1] shadow-[0_0_0_6px_rgba(0,87,193,0.08)]" />
        <div className="absolute left-[12%] top-[22%] h-px w-[18%] rotate-[9deg] bg-gradient-to-r from-[#0057c1]/50 to-transparent" />
        <div className="absolute left-[30%] top-[34%] h-px w-[26%] -rotate-[8deg] bg-gradient-to-r from-slate-400/60 to-transparent" />
        <div className="absolute right-[22%] top-[28%] h-px w-[20%] rotate-[22deg] bg-gradient-to-r from-slate-300/70 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-[#f4f8fd]/85 to-[#f8f9ff]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />

      <div className="relative grid gap-5 px-8 py-7 pb-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:px-10 lg:py-7 lg:pb-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#0057c1]" />
            Developer Utility Toolkit
          </div>
          <h1 className="mt-3 max-w-none text-3xl font-semibold tracking-tight text-slate-950 lg:text-[2.3rem]">
            开发小工具
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
            打开即用，处理常见开发任务。
          </p>
        </div>

        <div className="self-end border border-slate-200 bg-white/90 p-4 backdrop-blur">
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Overview</div>
          <div className="mt-3">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-slate-950"><ToolCount /></div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Tools</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ToolGrid />
  </div>
);

export default Dashboard;
