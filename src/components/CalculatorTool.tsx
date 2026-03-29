import { useEffect, useMemo, useState } from 'react';
import { Trash2, Copy, Check } from 'lucide-react';
import Tooltip from './Tooltip';
import { ToolHeader, ToolPage } from './ToolPage';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { useToolDraft } from '../hooks/useToolDraft';

interface CalcRow {
  id: string;
  expression: string;
  result: number | string | null;
}

const CALCULATOR_TOOL_CACHE_KEY = 'calculator_tool_draft';

const CalculatorTool = () => {
  const emptyDraft = useMemo(() => ({ expressions: [] as string[] }), []);
  const { initialDraft: cachedDraft, persistDraft } = useToolDraft(
    CALCULATOR_TOOL_CACHE_KEY,
    emptyDraft,
    { clearOnReload: true }
  );
  const [rows, setRows] = useState<CalcRow[]>(() => {
    const restoredRows = cachedDraft.expressions
      .filter(expression => expression.trim() !== '')
      .map(expression => ({
        id: crypto.randomUUID(),
        expression,
        result: null,
      }));

    return restoredRows.length > 0
      ? [...restoredRows, { id: crypto.randomUUID(), expression: '', result: null }]
      : [{ id: crypto.randomUUID(), expression: '', result: null }];
  });
  const { copiedKey, copyText } = useCopyFeedback<string>(1200);
  const persistedRows = useMemo(
    () => rows
      .map(row => row.expression)
      .filter(expression => expression.trim() !== ''),
    [rows]
  );

  useEffect(() => {
    persistDraft({ expressions: persistedRows }, persistedRows.length > 0);
  }, [persistDraft, persistedRows]);

  const evaluate = (expr: string) => {
    let trimmed = expr.trim();
    if (!trimmed) return null;
    
    // Remove trailing equals sign if present (e.g., "1+1=" -> "1+1")
    if (trimmed.endsWith('=')) {
      trimmed = trimmed.slice(0, -1).trim();
    }

    if (!trimmed) return null;
    
    // If the expression contains any characters other than numbers, operators, dots, parentheses, or spaces, it's invalid.
    if (/[^-+*/.0-9\s()]/.test(trimmed)) {
      return null;
    }

    try {
      // Use Function constructor for evaluation
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${trimmed}`)();
      
      if (typeof result === 'number' && isFinite(result)) {
        // Format number to avoid long decimals
        return Number.isInteger(result) ? result : Number(result.toFixed(4));
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const MAX_ROWS = 99;

  useEffect(() => {
    setRows(currentRows =>
      currentRows.map(row => ({
        ...row,
        result: row.expression.trim() ? evaluate(row.expression) : null,
      }))
    );
  }, []);

  const handleInputChange = (id: string, value: string) => {
    const newRows = rows.map(row => {
      if (row.id === id) {
        return { ...row, expression: value, result: evaluate(value) };
      }
      return row;
    });

    // If the last row is edited and not empty, add a new row, but only if we haven't reached the limit
    const lastRow = newRows[newRows.length - 1];
    if (lastRow.id === id && value.trim() !== '' && newRows.length < MAX_ROWS) {
      newRows.push({ id: crypto.randomUUID(), expression: '', result: null });
    }

    setRows(newRows);
  };

  const handleClear = () => {
    setRows([{ id: crypto.randomUUID(), expression: '', result: null }]);
  };

  const copyResult = (rowId: string, result: number | string | null) => {
    if (result === null || result === '') return;
    copyText(String(result), rowId);
  };

  return (
    <ToolPage>
      <ToolHeader
        title="计算稿纸"
        actions={
          <Tooltip text="清空全部">
            <button 
              onClick={handleClear} 
              className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors rounded-md"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </Tooltip>
        }
      />
      
      <div className="space-y-3 pr-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">计算草稿</h3>
          </div>
          {rows.map((row, i) => (
            <div 
              key={row.id} 
              className="group rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-4 flex flex-col gap-2 relative"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-focus-within:bg-blue-50 group-focus-within:text-[#0057c1] transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <input 
                  type="text"
                  value={row.expression}
                  onChange={(e) => handleInputChange(row.id, e.target.value)}
                  placeholder="输入数学表达式 (例如: 1200 * 0.08 + 15)"
                  className="flex-1 bg-transparent border-none outline-none font-mono text-lg text-slate-900 placeholder:text-slate-300"
                />
              </div>
              
              <div className="flex justify-end items-center gap-2 min-h-[28px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">结果</span>
                <div
                  onClick={() => copyResult(row.id, row.result)}
                  className={`text-xl font-black text-[#0057c1] tracking-tight ${row.result !== null && row.result !== '' ? 'cursor-pointer hover:text-[#004399]' : ''}`}
                >
                  = {row.result ?? ''}
                </div>
                <button
                  onClick={() => copyResult(row.id, row.result)}
                  className={`p-1 transition-colors ${copiedKey === row.id ? 'text-[#0057c1]' : 'text-slate-300 hover:text-[#0057c1]'}`}
                  disabled={row.result === null || row.result === ''}
                >
                  {copiedKey === row.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolPage>
  );
};

export default CalculatorTool;
