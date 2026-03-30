import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSONEditorLib from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import { 
  Braces, 
  Check,
  ChevronsDownUp, 
  ChevronsUpDown, 
  FileX, 
  Minimize2, 
  Quote,
  Trash2
} from 'lucide-react';
import Tooltip from './Tooltip';
import { ToolHeader, ToolPage } from './ToolPage';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { useToolDraft } from '../hooks/useToolDraft';

const JSON_EDITOR_CACHE_KEY = 'json_editor_draft';

// --- Sub-component ---

const JSONEditorComponent = React.forwardRef(({ value, onChange, readOnly = false }: { value: string, onChange?: (val: string) => void, readOnly?: boolean }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const isInternalChange = useRef(false);

  React.useImperativeHandle(ref, () => ({
    expandAll: () => {
      if (editorRef.current) {
        try {
          const mode = editorRef.current.getMode();
          if (mode === 'tree' || mode === 'view' || mode === 'form') {
            editorRef.current.expandAll();
          } else if (editorRef.current.aceEditor) {
            editorRef.current.aceEditor.getSession().unfold();
          }
        } catch (e) {
          console.error('Expand all failed', e);
        }
      }
    },
    collapseAll: () => {
      if (editorRef.current) {
        try {
          if (editorRef.current.getMode() === 'tree' || editorRef.current.getMode() === 'view') {
            editorRef.current.collapseAll();
          } else if (editorRef.current.aceEditor) {
            editorRef.current.aceEditor.getSession().foldAll();
          }
        } catch (e) {
          console.error('Collapse all failed', e);
        }
      }
    }
  }));

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new JSONEditorLib(containerRef.current, {
        mode: 'code',
        modes: readOnly ? ['code', 'text'] : ['code', 'tree', 'view', 'form', 'text'],
        onChangeText: (jsonString: string) => {
          if (readOnly) return;
          isInternalChange.current = true;
          onChange?.(jsonString);
          setTimeout(() => {
            isInternalChange.current = false;
          }, 0);
        },
        onEditable: () => !readOnly,
        mainMenuBar: false,
        navigationBar: false,
        statusBar: false,
      });
      
      try {
        const json = JSON.parse(value);
        editorRef.current.set(json);
      } catch (e) {
        editorRef.current.setText(value);
      }

      // Ensure Ace editor is read-only if requested
      if (readOnly && editorRef.current.aceEditor) {
        editorRef.current.aceEditor.setReadOnly(true);
      }
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const currentText = editorRef.current.getText();
      if (currentText !== value) {
        try {
          const json = JSON.parse(value);
          editorRef.current.update(json);
        } catch (e) {
          editorRef.current.updateText(value);
        }
      }
      
      // Re-apply read-only if needed after update
      if (readOnly && editorRef.current.aceEditor) {
        editorRef.current.aceEditor.setReadOnly(true);
      }
    }
  }, [value]);

  return (
    <div className="flex-1 h-full overflow-hidden border-none jsoneditor-custom relative">
      <div ref={containerRef} className="h-full w-full" />
      
      <style>{`
        .jsoneditor-custom .jsoneditor {
          border: none;
        }
        .jsoneditor-custom .jsoneditor-menu {
          display: none;
        }
        .jsoneditor-custom .ace_editor {
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 13px !important;
        }
        .jsoneditor-custom .jsoneditor-outer {
          padding: 0 !important;
          margin: 0 !important;
        }
        .jsoneditor-custom .jsoneditor-tree {
          background: white;
        }
        .jsoneditor-custom .jsoneditor-separator {
          background: transparent;
        }
        .jsoneditor-custom .jsoneditor-search {
          display: none;
        }
      `}</style>
    </div>
  );
});

// --- Main Tool Component ---

const JSONEditorTool = () => {
  const EXAMPLE_FILTER = '.filter(item => item.age >= 18)';
  const emptyDraft = useMemo(() => ({ code: '', filter: '' }), []);
  const { initialDraft: cachedDraft, persistDraft } = useToolDraft(
    JSON_EDITOR_CACHE_KEY,
    emptyDraft,
    { clearOnReload: true }
  );
  const [code, setCode] = useState(cachedDraft.code);
  const [resultCode, setResultCode] = useState('');
  const [filter, setFilter] = useState(cachedDraft.filter);
  const draftState = useMemo(() => ({ code, filter }), [code, filter]);
  const { copiedKey, copyText } = useCopyFeedback<'minify' | 'escape'>(1200);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    persistDraft(draftState, Boolean(code || filter));
  }, [persistDraft, draftState, code, filter]);

  useEffect(() => {
    const applyFilter = () => {
      const trimmedFilter = filter.trim();
      if (!trimmedFilter) {
        setResultCode('');
        return;
      }
      
      let activeFilter = trimmedFilter;
      
      // Auto-prepend 'this.data' if it's missing
      if (!activeFilter.startsWith('this')) {
        // If it doesn't start with . or [, assume a property access and add .
        if (!activeFilter.startsWith('.') && !activeFilter.startsWith('[')) {
          activeFilter = 'this.data.' + activeFilter;
        } else {
          activeFilter = 'this.data' + activeFilter;
        }
      }

      try {
        const parsedData = JSON.parse(code);
        
        let executableCode = activeFilter;
        if (!executableCode.includes('return')) {
          executableCode = `return (${executableCode})`;
        }

        const filterFn = new Function('data', `
          try {
            const context = { data: data };
            return (function() { 
              ${executableCode}
            }).call(context);
          } catch (e) {
            throw e;
          }
        `);

        const result = filterFn(parsedData);
        
        if (result === undefined) {
          setResultCode('// Result is undefined');
          return;
        }

        setResultCode(JSON.stringify(result, null, 2));
      } catch (err: any) {
        setResultCode(`// ${err.message}`);
      }
    };

    const timer = setTimeout(applyFilter, 100);
    return () => clearTimeout(timer);
  }, [code, filter]);

  const reformat = () => {
    try {
      const parsed = JSON.parse(code);
      setCode(JSON.stringify(parsed, null, 2));
      // Use setTimeout to ensure the editor has updated its content before expanding
      setTimeout(() => {
        editorRef.current?.expandAll();
      }, 50);
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  const removeComments = () => {
    const stripped = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
    setCode(stripped);
  };

  const minifyAndCopy = () => {
    try {
      const minified = JSON.stringify(JSON.parse(code));
      copyText(minified, 'minify');
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  const minifyEscapeAndCopy = () => {
    try {
      const minified = JSON.stringify(JSON.parse(code));
      const escaped = JSON.stringify(minified);
      copyText(escaped, 'escape');
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  const clearAll = () => {
    setCode('');
    setResultCode('');
    setFilter('');
  };

  return (
    <ToolPage fullHeight>
      <ToolHeader
        title="JSON 编辑器"
        actions={
          <>
            <Tooltip text="重新格式化">
              <button onClick={reformat} className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-md">
                <Braces className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip text="折叠全部">
              <button onClick={() => editorRef.current?.collapseAll()} className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-md">
                <ChevronsDownUp className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip text="展开全部">
              <button onClick={() => editorRef.current?.expandAll()} className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-md">
                <ChevronsUpDown className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip text="去除注释">
              <button onClick={removeComments} className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-md">
                <FileX className="w-5 h-5" />
              </button>
            </Tooltip>
            
            <div className="w-px h-6 bg-slate-200 mx-1" />

            <Tooltip text="压缩 JSON 并复制">
              <button onClick={minifyAndCopy} className={`p-2 transition-colors rounded-md ${copiedKey === 'minify' ? 'text-[#0057c1] bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}>
                {copiedKey === 'minify' ? <Check className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
            </Tooltip>
            <Tooltip text="压缩转义 JSON 并复制">
              <button onClick={minifyEscapeAndCopy} className={`p-2 transition-colors rounded-md ${copiedKey === 'escape' ? 'text-[#0057c1] bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}>
                {copiedKey === 'escape' ? <Check className="w-5 h-5" /> : <Quote className="w-5 h-5" />}
              </button>
            </Tooltip>
            <Tooltip text="清除全部">
              <button onClick={clearAll} className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors rounded-md">
                <Trash2 className="w-5 h-5" />
              </button>
            </Tooltip>
          </>
        }
      />

      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <div className={`grid gap-4 ${resultCode ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          <div className="px-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">输入</div>
          </div>
          {resultCode && (
            <div className="px-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">过滤结果</div>
            </div>
          )}
        </div>

        <div className="flex flex-1 min-h-[440px] lg:min-h-[460px] gap-4 overflow-hidden">
        {/* Original Data */}
        <div className={`flex-1 rounded-xl bg-white border border-slate-200 shadow-sm flex overflow-hidden transition-all ${resultCode ? 'w-1/2' : 'w-full'}`}>
          <div className="flex-1 flex flex-col overflow-hidden">
            <JSONEditorComponent ref={editorRef} value={code} onChange={setCode} />
          </div>
        </div>

        {/* Filtered Result */}
        {resultCode && (
          <div className="flex-1 rounded-xl bg-white border border-slate-200 shadow-sm flex overflow-hidden w-1/2 animate-in fade-in slide-in-from-right-4 duration-300 relative">
            <div className="absolute top-2 right-4 z-10 pointer-events-none">
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                只读模式
              </span>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <JSONEditorComponent value={resultCode} readOnly={true} />
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="rounded-lg p-4 bg-slate-100 border border-slate-200 flex items-center gap-4">
        <div className="flex items-center shrink-0">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">this.data</span>
        </div>
        <input 
          type="text" 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`示例: ${EXAMPLE_FILTER}`}
          className="flex-1 bg-white border-none rounded-md px-4 py-2 text-xs font-mono focus:ring-1 focus:ring-[#0057c1] placeholder:text-slate-400"
        />
      </div>
    </ToolPage>
  );
};

export default JSONEditorTool;
