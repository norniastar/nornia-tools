import { useEffect, useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import Tooltip from './Tooltip';
import { ToolHeader, ToolPage } from './ToolPage';
import { useCopyFeedback } from '../hooks/useCopyFeedback';

const UUIDGeneratorTool = () => {
  const [baseUuid, setBaseUuid] = useState('');
  const { copiedKey, copyText } = useCopyFeedback<number>(1200);
  
  const generate = () => {
    setBaseUuid(crypto.randomUUID());
  };

  useEffect(() => {
    generate();
  }, []);

  const formats = [
    { label: '小写', value: baseUuid.toLowerCase() },
    { label: '大写', value: baseUuid.toUpperCase() },
    { label: '去掉 [-] 小写', value: baseUuid.toLowerCase().replace(/-/g, '') },
    { label: '去掉 [-] 大写', value: baseUuid.toUpperCase().replace(/-/g, '') },
  ];

  return (
    <ToolPage>
      <ToolHeader
        title="UUID 生成器"
        actions={
          <Tooltip text="刷新">
            <button 
              onClick={generate} 
              className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-md"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </Tooltip>
        }
      />
      
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">生成的标识符</h3>
          </div>
          {formats.map((format, i) => (
            <div 
              key={i} 
              onClick={() => copyText(format.value, i)}
              className={`group bg-white border transition-all p-4 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden ${copiedKey === i ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'}`}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-8 h-8 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-white group-hover:text-[#0057c1] transition-colors">0{i+1}</div>
                <div className="flex flex-col">
                  <code className="font-mono text-base md:text-lg text-slate-900 font-medium break-all">{format.value}</code>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{format.label}</span>
                </div>
              </div>

              <div className={`shrink-0 flex items-center gap-2 transition-colors ${copiedKey === i ? 'text-[#0057c1]' : 'text-slate-300 group-hover:text-[#0057c1]'}`}>
                {copiedKey === i ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolPage>
  );
};

export default UUIDGeneratorTool;
