import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Copy, CopyPlus, Play, Pause, ChevronDown, X, Check } from 'lucide-react';
import DateTimePicker from './DateTimePicker';
import { ToolHeader, ToolPage } from './ToolPage';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { useToolDraft } from '../hooks/useToolDraft';

const TIMESTAMP_TOOL_CACHE_KEY = 'timestamp_tool_draft';

type DateToTsRow = {
  id: string;
  input: string;
  confirmedInput: string;
  confirmedTimestamp: number;
};

type TsToDateRow = {
  id: string;
  input: string;
};

const createRowId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createDateToTsRow = (seed?: Partial<Omit<DateToTsRow, 'id'>>): DateToTsRow => ({
  id: createRowId(),
  input: '',
  confirmedInput: '',
  confirmedTimestamp: Math.floor(Date.now() / 1000),
  ...seed,
});

const createTsToDateRow = (seed?: Partial<Omit<TsToDateRow, 'id'>>): TsToDateRow => ({
  id: createRowId(),
  input: '',
  ...seed,
});

const getLegacyDraftValue = <T,>(draft: Record<string, unknown>, key: string, fallback: T): T =>
  key in draft ? (draft[key] as T) : fallback;

const getRowLabel = (baseLabel: string, index: number) => (index === 0 ? baseLabel : `${baseLabel}-${index + 1}`);

const TimestampTool = () => {
  const emptyDraft = useMemo(
    () => ({
      unit: 's' as 'ms' | 's',
      timezone: 'Asia/Shanghai',
      dateToTsRows: [createDateToTsRow()],
      tsToDateRows: [createTsToDateRow()],
    }),
    []
  );
  const { initialDraft: cachedDraft, persistDraft } = useToolDraft(
    TIMESTAMP_TOOL_CACHE_KEY,
    emptyDraft,
    { clearOnReload: true }
  );
  const [unit, setUnit] = useState<'ms' | 's'>(cachedDraft.unit);
  const [timezone, setTimezone] = useState(cachedDraft.timezone);
  const [isPaused, setIsPaused] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { copiedKey, copyText } = useCopyFeedback<string>(1200);
  const legacyDraft = cachedDraft as typeof cachedDraft & {
    dateToTsInput?: string;
    confirmedDateToTs?: string;
    confirmedTimestamp?: number;
    tsToDateInput?: string;
  };
  
  const formatDateTime = (date: Date, tz: string) => {
    return date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false,
      timeZone: tz
    }).replace(/\//g, '-').replace(',', '');
  };

  // Helper to parse a date string as if it were in the target timezone
  const parseInTimezone = (dateStr: string, tz: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return date;
    
    // This is a trick: format the date in the target TZ, then parse it as local
    // and compare with the original local parse to find the offset.
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const partMap: Record<string, string> = {};
    parts.forEach(p => partMap[p.type] = p.value);
    
    const tzDate = new Date(`${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}:${partMap.second}`);
    const offset = date.getTime() - tzDate.getTime();
    return new Date(date.getTime() + offset);
  };

  const [dateToTsRows, setDateToTsRows] = useState<DateToTsRow[]>(() => {
    const persistedRows = cachedDraft.dateToTsRows?.filter(Boolean) ?? [];
    if (persistedRows.length > 0) {
      return persistedRows.map(row => createDateToTsRow(row));
    }

    const legacyInput = getLegacyDraftValue(legacyDraft, 'dateToTsInput', '');
    const legacyConfirmedInput = getLegacyDraftValue(legacyDraft, 'confirmedDateToTs', '');
    const legacyConfirmedTimestamp = getLegacyDraftValue(legacyDraft, 'confirmedTimestamp', Math.floor(Date.now() / 1000));

    if (legacyInput || legacyConfirmedInput) {
      return [
        createDateToTsRow({
          input: legacyInput,
          confirmedInput: legacyConfirmedInput || legacyInput,
          confirmedTimestamp: legacyConfirmedTimestamp,
        }),
      ];
    }

    return [createDateToTsRow()];
  });
  const [tsToDateRows, setTsToDateRows] = useState<TsToDateRow[]>(() => {
    const persistedRows = cachedDraft.tsToDateRows?.filter(Boolean) ?? [];
    if (persistedRows.length > 0) {
      return persistedRows.map(row => createTsToDateRow(row));
    }

    const legacyInput = getLegacyDraftValue(legacyDraft, 'tsToDateInput', '');
    if (legacyInput) {
      return [createTsToDateRow({ input: legacyInput })];
    }

    return [createTsToDateRow()];
  });
  const persistedDraft = useMemo(
    () => ({
      unit,
      timezone,
      dateToTsRows,
      tsToDateRows,
    }),
    [unit, timezone, dateToTsRows, tsToDateRows]
  );

  useEffect(() => {
    persistDraft(
      persistedDraft,
      dateToTsRows.some(row => row.input || row.confirmedInput) || tsToDateRows.some(row => row.input)
    );
  }, [persistDraft, persistedDraft, dateToTsRows, tsToDateRows]);

  const handleTimezoneChange = (nextTimezone: string) => {
    if (nextTimezone === timezone) return;

    setTimezone(nextTimezone);
    setDateToTsRows(rows =>
      rows.map(row => {
        if (!row.confirmedInput) {
          return row;
        }

        const date = new Date(row.confirmedTimestamp * 1000);
        const nextValue = formatDateTime(date, nextTimezone);
        return {
          ...row,
          input: nextValue,
          confirmedInput: nextValue,
        };
      })
    );
  };

  const handleUnitChange = (newUnit: 'ms' | 's') => {
    if (newUnit === unit) return;
    
    setTsToDateRows(rows =>
      rows.map(row => {
        if (!row.input) {
          return row;
        }

        const ts = parseFloat(row.input);
        if (isNaN(ts)) {
          return row;
        }

        return {
          ...row,
          input: newUnit === 'ms' ? (ts * 1000).toString() : Math.floor(ts / 1000).toString(),
        };
      })
    );
    setUnit(newUnit);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, unit === 'ms' ? 50 : 1000);
    return () => clearInterval(timer);
  }, [isPaused, unit]);

  const formatTimestamp = (ts: number) => {
    return unit === 'ms' ? ts : Math.floor(ts / 1000);
  };

  const dateToTimestamp = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = parseInTimezone(dateStr, timezone);
    if (isNaN(date.getTime())) return '-';
    return formatTimestamp(date.getTime());
  };

  const timestampToDate = (tsStr: string) => {
    if (!tsStr) return '-';
    const ts = parseInt(tsStr);
    if (isNaN(ts)) return '-';
    const date = new Date(unit === 'ms' ? ts : ts * 1000);
    if (isNaN(date.getTime())) return '-';
    return formatDateTime(date, timezone);
  };

  const handleDateToTsChange = (rowId: string, value: string) => {
    setDateToTsRows(rows =>
      rows.map(row => {
        if (row.id !== rowId) {
          return row;
        }

        const nextRow: DateToTsRow = {
          ...row,
          input: value,
          confirmedInput: value,
        };

        if (!value) {
          return nextRow;
        }

        const ts = parseInTimezone(value, timezone).getTime();
        if (!isNaN(ts)) {
          nextRow.confirmedTimestamp = Math.floor(ts / 1000);
        }

        return nextRow;
      })
    );
  };

  const handleDateToTsPreviewChange = (rowId: string, value: string) => {
    setDateToTsRows(rows =>
      rows.map(row => (row.id === rowId ? { ...row, input: value } : row))
    );
  };

  const handleTsToDateChange = (rowId: string, value: string) => {
    setTsToDateRows(rows =>
      rows.map(row => (row.id === rowId ? { ...row, input: value } : row))
    );
  };

  const duplicateDateToTsRow = (rowId: string) => {
    setDateToTsRows(rows => {
      if (rows.length >= 2) return rows;

      const index = rows.findIndex(row => row.id === rowId);
      if (index === -1) return rows;

      const sourceRow = rows[index];
      const duplicatedRow = createDateToTsRow({
        input: sourceRow.input,
        confirmedInput: sourceRow.confirmedInput,
        confirmedTimestamp: sourceRow.confirmedTimestamp,
      });

      return [...rows.slice(0, index + 1), duplicatedRow, ...rows.slice(index + 1)];
    });
  };

  const duplicateTsToDateRow = (rowId: string) => {
    setTsToDateRows(rows => {
      if (rows.length >= 2) return rows;

      const index = rows.findIndex(row => row.id === rowId);
      if (index === -1) return rows;

      const sourceRow = rows[index];
      const duplicatedRow = createTsToDateRow({ input: sourceRow.input });

      return [...rows.slice(0, index + 1), duplicatedRow, ...rows.slice(index + 1)];
    });
  };

  const removeDateToTsRow = (rowId: string) => {
    setDateToTsRows(rows => (rows.length === 1 ? rows : rows.filter(row => row.id !== rowId)));
  };

  const removeTsToDateRow = (rowId: string) => {
    setTsToDateRows(rows => (rows.length === 1 ? rows : rows.filter(row => row.id !== rowId)));
  };

  const handleReset = () => {
    setUnit('s');
    setTimezone('Asia/Shanghai');
    setIsPaused(false);
    setNow(Date.now());
    setDateToTsRows([createDateToTsRow()]);
    setTsToDateRows([createTsToDateRow()]);
  };

  return (
    <ToolPage>
      <ToolHeader
        title="时间戳转换"
        actions={
          <div className="flex items-center gap-3">
          {/* Unit Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => handleUnitChange('ms')}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md ${unit === 'ms' ? 'bg-white text-[#0057c1] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              毫秒
            </button>
            <button 
              onClick={() => handleUnitChange('s')}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md ${unit === 's' ? 'bg-white text-[#0057c1] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              秒
            </button>
          </div>

          {/* Timezone Selector */}
          <div className="relative group/tz">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors">
              <span className="text-xs font-medium">
                {timezone === 'UTC' ? 'UTC+00:00 | UTC' : 
                 timezone === 'Asia/Shanghai' ? 'UTC+08:00 | 北京' : 
                 'UTC-05:00 | 美国'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden z-50 opacity-0 invisible group-hover/tz:opacity-100 group-hover/tz:visible transition-all">
              <button 
                onClick={() => handleTimezoneChange('UTC')}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${timezone === 'UTC' ? 'text-[#0057c1] font-bold bg-blue-50/50' : 'text-slate-600'}`}
              >
                UTC+00:00 | UTC
              </button>
              <button 
                onClick={() => handleTimezoneChange('Asia/Shanghai')}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${timezone === 'Asia/Shanghai' ? 'text-[#0057c1] font-bold bg-blue-50/50' : 'text-slate-600'}`}
              >
                UTC+08:00 | 北京
              </button>
              <button 
                onClick={() => handleTimezoneChange('America/New_York')}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${timezone === 'America/New_York' ? 'text-[#0057c1] font-bold bg-blue-50/50' : 'text-slate-600'}`}
              >
                UTC-05:00 | 美国
              </button>
            </div>
          </div>
          </div>
        }
      />

      <div className="space-y-3 pr-1">
        <div className="space-y-3">
          {dateToTsRows.map((row, index) => {
            const result = dateToTimestamp(row.confirmedInput);

            return (
              <div key={row.id} className="group rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-4 flex flex-col gap-2 relative">
                {index === 0 && (
                  <button
                    onClick={() => duplicateDateToTsRow(row.id)}
                    disabled={dateToTsRows.length >= 2}
                    className={`absolute top-3 right-3 p-1.5 rounded-md transition-colors ${dateToTsRows.length >= 2 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-[#0057c1] hover:bg-slate-50'}`}
                    aria-label="复制一行"
                  >
                    <CopyPlus className="w-4 h-4" />
                  </button>
                )}
                {index > 0 && (
                  <button
                    onClick={() => removeDateToTsRow(row.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
                    aria-label="移除该行"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-focus-within:bg-blue-50 group-focus-within:text-[#0057c1] transition-colors">
                    {getRowLabel('01', index)}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">日期 → 时间戳</label>
                    <div className="flex items-center gap-6">
                      <div className="flex-1 max-w-md">
                        <DateTimePicker 
                          value={row.input}
                          onChange={(value) => handleDateToTsChange(row.id, value)}
                          onPreviewChange={(value) => handleDateToTsPreviewChange(row.id, value)}
                          placeholder="请输入或选择日期"
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-slate-300 font-light text-xl">→</span>
                        <span 
                          className="text-xl font-normal text-slate-900 tracking-tight cursor-pointer hover:text-[#0057c1] transition-colors"
                          onClick={() => copyText(result.toString(), `dateToTs-${row.id}`)}
                        >
                          {result}
                        </span>
                        <button 
                          onClick={() => copyText(result.toString(), `dateToTs-${row.id}`)}
                          className={`p-1 transition-colors ${copiedKey === `dateToTs-${row.id}` ? 'text-[#0057c1]' : 'text-slate-300 hover:text-[#0057c1]'}`}
                        >
                          {copiedKey === `dateToTs-${row.id}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {tsToDateRows.map((row, index) => {
            const result = timestampToDate(row.input);

            return (
              <div key={row.id} className="group rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-4 flex flex-col gap-2 relative">
                {index === 0 && (
                  <button
                    onClick={() => duplicateTsToDateRow(row.id)}
                    disabled={tsToDateRows.length >= 2}
                    className={`absolute top-3 right-3 p-1.5 rounded-md transition-colors ${tsToDateRows.length >= 2 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-[#0057c1] hover:bg-slate-50'}`}
                    aria-label="复制一行"
                  >
                    <CopyPlus className="w-4 h-4" />
                  </button>
                )}
                {index > 0 && (
                  <button
                    onClick={() => removeTsToDateRow(row.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
                    aria-label="移除该行"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-focus-within:bg-blue-50 group-focus-within:text-[#0057c1] transition-colors">
                    {getRowLabel('02', index)}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">时间戳 → 日期</label>
                    <div className="flex items-center gap-6">
                      <div className="flex-1 max-w-md">
                        <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 p-3 focus-within:border-[#4e45e4] focus-within:ring-1 focus-within:ring-[#4e45e4]/20 transition-all">
                          <input 
                            type="text"
                            value={row.input}
                            onChange={(event) => handleTsToDateChange(row.id, event.target.value)}
                            placeholder="请输入时间戳"
                            className="flex-1 bg-transparent border-none outline-none font-mono text-lg text-slate-900 placeholder:text-slate-300"
                          />
                          {row.input && (
                            <button 
                              onClick={() => handleTsToDateChange(row.id, '')}
                              className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-slate-300 font-light text-xl">→</span>
                        <span 
                          className="text-xl font-normal text-slate-900 tracking-tight cursor-pointer hover:text-[#0057c1] transition-colors"
                          onClick={() => copyText(result, `tsToDate-${row.id}`)}
                        >
                          {result}
                        </span>
                        <button 
                          onClick={() => copyText(result, `tsToDate-${row.id}`)}
                          className={`p-1 transition-colors ${copiedKey === `tsToDate-${row.id}` ? 'text-[#0057c1]' : 'text-slate-300 hover:text-[#0057c1]'}`}
                        >
                          {copiedKey === `tsToDate-${row.id}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Row 3: Current Timestamp */}
          <div className="group rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-6 flex flex-col gap-4 relative">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-focus-within:bg-blue-50 group-focus-within:text-[#0057c1] transition-colors">
                03
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">当前时间戳</label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="text-xl font-mono font-normal text-slate-900 tracking-tight cursor-pointer hover:text-[#0057c1] transition-colors"
                      onClick={() => copyText(formatTimestamp(now).toString(), 'currentTimestamp')}
                    >
                      {formatTimestamp(now)}
                    </div>
                    <button
                      onClick={() => copyText(formatTimestamp(now).toString(), 'currentTimestamp')}
                      className={`p-1 transition-colors ${copiedKey === 'currentTimestamp' ? 'text-[#0057c1]' : 'text-slate-300 hover:text-[#0057c1]'}`}
                    >
                      {copiedKey === 'currentTimestamp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsPaused(!isPaused)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all font-bold text-xs uppercase tracking-widest ${isPaused ? 'bg-blue-50 text-[#0057c1] hover:bg-blue-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                    >
                      {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                      {isPaused ? '开始' : '暂停'}
                    </button>
                    <button 
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 rounded-md transition-all font-bold text-xs uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重置数据
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  );
};

export default TimestampTool;
