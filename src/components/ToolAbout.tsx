import Link from 'next/link';
import { TOOL_DEFINITIONS, toolPath } from '../config/tools';
import type { ToolDefinition } from '../types';

// 工具说明与站内链接：纯静态内容，保证搜索引擎不执行 JS 也能读到页面主题
const ToolAbout = ({ tool }: { tool: ToolDefinition }) => (
  <section className="mt-6 border border-slate-200 bg-white px-5 py-4">
    <h2 className="text-base font-semibold tracking-tight text-slate-950">关于{tool.name}</h2>
    <p className="mt-2 text-sm leading-7 text-slate-600">{tool.intro}</p>
    <ul className="mt-3 flex flex-wrap gap-2">
      {tool.features.map(feature => (
        <li key={feature} className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
          {feature}
        </li>
      ))}
    </ul>
    <p className="mt-3 text-xs text-slate-400">所有数据只在你的浏览器本地处理，不会上传到服务器。</p>
    <nav aria-label="其他工具" className="mt-4 border-t border-slate-200 pt-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">更多工具</h3>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {TOOL_DEFINITIONS.filter(other => other.id !== tool.id).map(other => (
          <li key={other.id}>
            <Link href={toolPath(other)} className="text-sm text-[#0057c1] hover:underline">
              {other.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </section>
);

export default ToolAbout;
