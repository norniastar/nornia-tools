import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Link2, Trash2 } from 'lucide-react';
import Tooltip from './Tooltip';
import { ToolHeader, ToolPage } from './ToolPage';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { useToolDraft } from '../hooks/useToolDraft';

type URLCodecMode = 'auto' | 'encode' | 'decode';

const URL_CODEC_CACHE_KEY = 'url_codec_draft';

const MODE_LABELS: Record<URLCodecMode, string> = {
  auto: '自动',
  encode: '编码',
  decode: '解码',
};

const hasEncodedPattern = (value: string) => /%[0-9A-Fa-f]{2}/.test(value);

const safeDecode = (value: string) => {
  try {
    return {
      ok: true as const,
      value: decodeURIComponent(value),
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : '解码失败',
    };
  }
};

const URLCodecTool = () => {
  const emptyDraft = useMemo(
    () => ({
      input: '',
      mode: 'auto' as URLCodecMode,
    }),
    []
  );
  const { initialDraft, persistDraft } = useToolDraft(
    URL_CODEC_CACHE_KEY,
    emptyDraft,
    { clearOnReload: true }
  );
  const [input, setInput] = useState(initialDraft.input);
  const [mode, setMode] = useState<URLCodecMode>(initialDraft.mode);
  const [output, setOutput] = useState('');
  const [statusMessage, setStatusMessage] = useState('输入后将实时显示结果。');
  const [statusTone, setStatusTone] = useState<'info' | 'error'>('info');
  const { copiedKey, copyText } = useCopyFeedback<'output'>(1200);

  useEffect(() => {
    persistDraft({ input, mode }, Boolean(input));
  }, [persistDraft, input, mode]);

  useEffect(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setOutput('');
      setStatusMessage('输入后将实时显示结果。');
      setStatusTone('info');
      return;
    }

    if (mode === 'encode') {
      setOutput(encodeURIComponent(input));
      setStatusMessage('已按编码处理');
      setStatusTone('info');
      return;
    }

    if (mode === 'decode') {
      const decoded = safeDecode(input);
      if (decoded.ok) {
        setOutput(decoded.value);
        setStatusMessage('已按解码处理');
        setStatusTone('info');
      } else {
        setOutput(input);
        setStatusMessage('输入不是有效的 URL 编码内容，已保留原始输入');
        setStatusTone('error');
      }
      return;
    }

    if (hasEncodedPattern(input)) {
      const decoded = safeDecode(input);
      if (decoded.ok) {
        setOutput(decoded.value);
        setStatusMessage('已按解码处理');
        setStatusTone('info');
        return;
      }

      setOutput(encodeURIComponent(input));
      setStatusMessage('输入不是有效的 URL 编码内容，已按普通文本编码');
      setStatusTone('error');
      return;
    }

    setOutput(encodeURIComponent(input));
    setStatusMessage('已按编码处理');
    setStatusTone('info');
  }, [input, mode]);

  const handleClear = () => {
    setInput('');
    setOutput('');
    setMode('auto');
    setStatusMessage('输入后将实时显示结果。');
    setStatusTone('info');
  };

  return (
    <ToolPage>
      <ToolHeader
        title="URL 编解码"
        icon={<Link2 className="text-[#0057c1] w-6 h-6" />}
        wrap
        actions={
          <>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['auto', 'encode', 'decode'] as URLCodecMode[]).map(option => (
                <button
                  key={option}
                  onClick={() => setMode(option)}
                  className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md ${
                    mode === option ? 'bg-white text-[#0057c1] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {MODE_LABELS[option]}
                </button>
              ))}
            </div>
            <Tooltip text="清除全部">
              <button onClick={handleClear} className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors rounded-md">
                <Trash2 className="w-5 h-5" />
              </button>
            </Tooltip>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-2">
        <div className="px-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">输入</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="输入需要进行 URL 编码或解码的内容"
            className="h-[220px] w-full resize-none border-none bg-transparent px-4 py-4 text-sm font-mono text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between px-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">结果</div>
          <Tooltip text="复制结果">
            <button
              onClick={() => output && copyText(output, 'output')}
              className={`p-2 transition-colors rounded-md ${copiedKey === 'output' ? 'text-[#0057c1] bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}
              disabled={!output}
            >
              {copiedKey === 'output' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </Tooltip>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className={`border-b border-slate-100 px-4 py-3 text-sm ${statusTone === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
            {statusMessage}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="转换结果会在这里实时显示"
            className="h-[220px] w-full resize-none border-none bg-transparent px-4 py-4 text-sm font-mono text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>
    </ToolPage>
  );
};

export default URLCodecTool;
