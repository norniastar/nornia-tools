import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Copy, Play, Pause, ChevronDown, X, Check } from 'lucide-react';
import DateTimePicker from './DateTimePicker';
import { ToolHeader, ToolPage } from './ToolPage';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { useToolDraft } from '../hooks/useToolDraft';

const TIMESTAMP_TOOL_CACHE_KEY = 'timestamp_tool_draft';

const TimestampTool = () => {
  const emptyDraft = useMemo(
    () => ({
      unit: 's' as 'ms' | 's',
      timezone: 'Asia/Shanghai',
      dateToTsInput: '',
      confirmedDateToTs: '',
      confirmedTimestamp: Math.floor(Date.now() / 1000),
      tsToDateInput: '',
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

  const [dateToTsInput, setDateToTsInput] = useState(cachedDraft.dateToTsInput);
  const [confirmedDateToTs, setConfirmedDateToTs] = useState(cachedDraft.confirmedDateToTs);
  const [confirmedTimestamp, setConfirmedTimestamp] = useState(cachedDraft.confirmedTimestamp);
  const [tsToDateInput, setTsToDateInput] = useState(cachedDraft.tsToDateInput);
  const persistedDraft = useMemo(
    () => ({
      unit,
      timezone,
      dateToTsInput,
      confirmedDateToTs,
      confirmedTimestamp,
      tsToDateInput,
    }),
    [unit, timezone, dateToTsInput, confirmedDateToTs, confirmedTimestamp, tsToDateInput]
  );

  useEffect(() => {
    persistDraft(persistedDraft, Boolean(dateToTsInput || tsToDateInput));
  }, [persistDraft, persistedDraft, dateToTsInput, tsToDateInput]);

  // Update input when timezone changes
  useEffect(() => {
    if (!confirmedDateToTs) return;
    const date = new Date(confirmedTimestamp * 1000);
    const newStr = formatDateTime(date, timezone);
    setDateToTsInput(newStr);
    setConfirmedDateToTs(newStr);
  }, [timezone, confirmedDateToTs, confirmedTimestamp]);

  const handleUnitChange = (newUnit: 'ms' | 's') => {
    if (newUnit === unit) return;
    
    if (tsToDateInput) {
      const ts = parseFloat(tsToDateInput);
      if (!isNaN(ts)) {
        if (newUnit === 'ms') {
          setTsToDateInput((ts * 1000).toString());
        } else {
          setTsToDateInput(Math.floor(ts / 1000).toString());
        }
      }
    }
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

  const handleDateToTsChange = (val: string) => {
    setDateToTsInput(val);
    setConfirmedDateToTs(val);

    if (!val) return;

    const ts = parseInTimezone(val, timezone).getTime();
    if (!isNaN(ts)) {
      setConfirmedTimestamp(Math.floor(ts / 1000));
    }
  };

  const handleReset = () => {
    setUnit('s');
    setTimezone('Asia/Shanghai');
    setIsPaused(false);
    setNow(Date.now());
    setDateToTsInput('');
    setConfirmedDateToTs('');
    setConfirmedTimestamp(Math.floor(Date.now() / 1000));
    setTsToDateInput('');
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
                onClick={() => setTimezone('UTC')}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${timezone === 'UTC' ? 'text-[#0057c1] font-bold bg-blue-50/50' : 'text-slate-600'}`}
              >
                UTC+00:00 | UTC
              </button>
              <button 
                onClick={() => setTimezone('Asia/Shanghai')}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${timezone === 'Asia/Shanghai' ? 'text-[#0057c1] font-bold bg-blue-50/50' : 'text-slate-600'}`}
              >
                UTC+08:00 | 北京
              </button>
              <button 
                onClick={() => setTimezone('America/New_York')}
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
          {/* Row 1: Date to Timestamp */}
          <div className="group rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-4 flex flex-col gap-2 relative">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-focus-within:bg-blue-50 group-focus-within:text-[#0057c1] transition-colors">
                01
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">日期 → (北京) 时间戳</label>
                <div className="flex items-center gap-6">
                  <div className="flex-1 max-w-md">
                    <DateTimePicker 
                      value={dateToTsInput}
                      onChange={handleDateToTsChange}
                      onPreviewChange={(val) => setDateToTsInput(val)}
                      placeholder="请选择日期"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-slate-300 font-light text-xl">→</span>
                    <span 
                      className="text-xl font-normal text-slate-900 tracking-tight cursor-pointer hover:text-[#0057c1] transition-colors"
                      onClick={() => copyText(dateToTimestamp(confirmedDateToTs).toString(), 'dateToTs')}
                    >
                      {dateToTimestamp(confirmedDateToTs)}
                    </span>
                    <button 
                      onClick={() => copyText(dateToTimestamp(confirmedDateToTs).toString(), 'dateToTs')}
                      className={`p-1 transition-colors ${copiedKey === 'dateToTs' ? 'text-[#0057c1]' : 'text-slate-300 hover:text-[#0057c1]'}`}
                    >
                      {copiedKey === 'dateToTs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Timestamp to Date */}
          <div className="group rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-4 flex flex-col gap-2 relative">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-focus-within:bg-blue-50 group-focus-within:text-[#0057c1] transition-colors">
                02
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">时间戳 → (北京) 日期</label>
                <div className="flex items-center gap-6">
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 p-3 focus-within:border-[#4e45e4] focus-within:ring-1 focus-within:ring-[#4e45e4]/20 transition-all">
                      <input 
                        type="text"
                        value={tsToDateInput}
                        onChange={(e) => setTsToDateInput(e.target.value)}
                        placeholder="请输入时间戳"
                        className="flex-1 bg-transparent border-none outline-none font-mono text-lg text-slate-900 placeholder:text-slate-300"
                      />
                      {tsToDateInput && (
                        <button 
                          onClick={() => setTsToDateInput('')}
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
                      onClick={() => copyText(timestampToDate(tsToDateInput), 'tsToDate')}
                    >
                      {timestampToDate(tsToDateInput)}
                    </span>
                    <button 
                      onClick={() => copyText(timestampToDate(tsToDateInput), 'tsToDate')}
                      className={`p-1 transition-colors ${copiedKey === 'tsToDate' ? 'text-[#0057c1]' : 'text-slate-300 hover:text-[#0057c1]'}`}
                    >
                      {copiedKey === 'tsToDate' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
