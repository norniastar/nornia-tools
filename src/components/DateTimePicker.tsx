import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Calendar as CalendarIcon } from 'lucide-react';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onPreviewChange?: (value: string) => void;
  placeholder?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, onPreviewChange, placeholder }) => {
  const TIME_ITEM_HEIGHT = 32;
  const [isOpen, setIsOpen] = useState(false);
  const [timeColumnSpacerHeight, setTimeColumnSpacerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef<string>(value);

  // Parse initial value or use current date
  const initialDate = useMemo(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewDate, setViewDate] = useState<Date>(new Date(initialDate));

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const scrollToValue = (container: HTMLDivElement | null, value: number) => {
    if (!container) return;

    const target = container.querySelector<HTMLElement>(`[data-time-value="${value}"]`);
    if (!target) return;

    target.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  };

  const syncTimeColumnSpacer = () => {
    const container = hourRef.current ?? minuteRef.current ?? secondRef.current;
    if (!container) return;

    setTimeColumnSpacerHeight(Math.max(container.clientHeight - TIME_ITEM_HEIGHT, 0));
  };

  // Scroll to current values when opening
  useEffect(() => {
    if (isOpen) {
      initialValueRef.current = value;
      requestAnimationFrame(() => {
        syncTimeColumnSpacer();
        requestAnimationFrame(() => {
        scrollToValue(hourRef.current, selectedDate.getHours());
        scrollToValue(minuteRef.current, selectedDate.getMinutes());
        scrollToValue(secondRef.current, selectedDate.getSeconds());
        });
      });
    }
  }, [isOpen]);

  // Update internal state when external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewDate(new Date(d));
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          // Revert to initial value on cancel
          onPreviewChange?.(initialValueRef.current);
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onPreviewChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    initialValueRef.current = '';
    onChange('');
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    initialValueRef.current = nextValue;
    onChange(nextValue);

    if (!nextValue) {
      return;
    }

    const parsedDate = new Date(nextValue);
    if (!isNaN(parsedDate.getTime())) {
      setSelectedDate(parsedDate);
      setViewDate(new Date(parsedDate));
    }
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setViewDate(new Date(now));
    
    // Auto scroll to top
    scrollToValue(hourRef.current, now.getHours());
    scrollToValue(minuteRef.current, now.getMinutes());
    scrollToValue(secondRef.current, now.getSeconds());

    // Update preview immediately
    onPreviewChange?.(formatDate(now));
  };

  const handleConfirm = () => {
    onChange(formatDate(selectedDate));
    setIsOpen(false);
  };

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days: { date: Date; currentMonth: boolean }[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstDay = firstDayOfMonth(year, month);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        currentMonth: false
      });
    }

    // Current month days
    const count = daysInMonth(year, month);
    for (let i = 1; i <= count; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false
      });
    }

    return days;
  }, [viewDate]);

  const changeYear = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(viewDate.getFullYear() + delta);
    setViewDate(newDate);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const selectDay = (date: Date) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    setSelectedDate(newDate);
    if (date.getMonth() !== viewDate.getMonth()) {
      setViewDate(new Date(date));
    }
    onPreviewChange?.(formatDate(newDate));
  };

  const selectTime = (type: 'h' | 'm' | 's', val: number) => {
    const newDate = new Date(selectedDate);
    if (type === 'h') {
      newDate.setHours(val);
      scrollToValue(hourRef.current, val);
    }
    if (type === 'm') {
      newDate.setMinutes(val);
      scrollToValue(minuteRef.current, val);
    }
    if (type === 's') {
      newDate.setSeconds(val);
      scrollToValue(secondRef.current, val);
    }
    setSelectedDate(newDate);
    onPreviewChange?.(formatDate(newDate));
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`flex items-center gap-2 bg-white border ${isOpen ? 'border-[#4e45e4] ring-1 ring-[#4e45e4]/20' : 'border-slate-200'} p-3 cursor-text transition-all group`}
        onClick={() => setIsOpen(true)}
      >
        <input 
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none font-mono text-xl font-normal text-slate-900 tracking-tight placeholder:text-slate-300 cursor-text"
        />
        <div className="flex items-center gap-2">
          {value && (
            <button 
              onClick={handleClear}
              className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <CalendarIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-2xl z-50 flex flex-col min-w-[450px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex border-b border-slate-100 h-[300px]">
            {/* Calendar Section */}
            <div className="flex-1 p-4 border-r border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                <div className="flex gap-1">
                  <button onClick={() => changeYear(-1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronsLeft className="w-4 h-4" /></button>
                  <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                </div>
                <div className="text-sm font-bold text-slate-700">
                  {viewDate.getFullYear()} - {String(viewDate.getMonth() + 1).padStart(2, '0')}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                  <button onClick={() => changeYear(1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronsRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 shrink-0">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto pr-1 scrollbar-hide hover:scrollbar-default">
                {calendarDays.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => selectDay(d.date)}
                    className={`
                      text-xs py-2 rounded-full transition-all relative
                      ${d.currentMonth ? 'text-slate-700' : 'text-slate-300'}
                      ${isSelected(d.date) ? 'bg-[#4e45e4] text-white font-bold' : 'hover:bg-slate-50'}
                    `}
                  >
                    {d.date.getDate()}
                    {isToday(d.date) && !isSelected(d.date) && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4e45e4] rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Section */}
            <div className="w-[180px] flex flex-col border-l border-slate-100">
              <div className="p-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50 shrink-0">选择时间</div>
              <div className="flex flex-1 overflow-hidden">
                {/* Hours */}
                <div ref={hourRef} className="flex-1 overflow-y-auto scrollbar-hide hover:scrollbar-default border-r border-slate-50 py-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <button
                      key={i}
                      data-time-value={i}
                      onClick={() => selectTime('h', i)}
                      className={`w-full text-xs py-2 transition-colors ${selectedDate.getHours() === i ? 'bg-[#4e45e4] text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {String(i).padStart(2, '0')}
                    </button>
                  ))}
                  <div aria-hidden="true" style={{ height: timeColumnSpacerHeight }} />
                </div>
                {/* Minutes */}
                <div ref={minuteRef} className="flex-1 overflow-y-auto scrollbar-hide hover:scrollbar-default border-r border-slate-50 py-1">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <button
                      key={i}
                      data-time-value={i}
                      onClick={() => selectTime('m', i)}
                      className={`w-full text-xs py-2 transition-colors ${selectedDate.getMinutes() === i ? 'bg-[#4e45e4] text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {String(i).padStart(2, '0')}
                    </button>
                  ))}
                  <div aria-hidden="true" style={{ height: timeColumnSpacerHeight }} />
                </div>
                {/* Seconds */}
                <div ref={secondRef} className="flex-1 overflow-y-auto scrollbar-hide hover:scrollbar-default py-1">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <button
                      key={i}
                      data-time-value={i}
                      onClick={() => selectTime('s', i)}
                      className={`w-full text-xs py-2 transition-colors ${selectedDate.getSeconds() === i ? 'bg-[#4e45e4] text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {String(i).padStart(2, '0')}
                    </button>
                  ))}
                  <div aria-hidden="true" style={{ height: timeColumnSpacerHeight }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 flex justify-between items-center">
            <button 
              onClick={handleNow}
              className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all rounded"
            >
              此刻
            </button>
            <button 
              onClick={handleConfirm}
              className="px-6 py-1.5 text-xs font-bold bg-[#4e45e4] text-white hover:bg-[#6760fd] transition-all rounded shadow-sm"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
