import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpAZ, FileDiff, RefreshCw, Trash2 } from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';
import YAML from 'yaml';
import Tooltip from './Tooltip';
import { ToolHeader, ToolPage } from './ToolPage';
import { useToolDraft } from '../hooks/useToolDraft';

type Language = 'text' | 'json' | 'yaml' | 'go';

interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
}

const TEXT_CODE_DIFF_CACHE_KEY = 'text_code_diff_draft';

const normalizeLineEndings = (text: string) => text.replace(/\r\n/g, '\n');

const getLanguageLabel = (language: Language) => {
  if (language === 'json') return 'JSON';
  if (language === 'yaml') return 'YAML';
  if (language === 'go') return 'Go';
  return 'Text';
};

const getMonacoLanguage = (language: Language) => {
  if (language === 'json') return 'json';
  if (language === 'yaml') return 'yaml';
  if (language === 'go') return 'go';
  return 'plaintext';
};

const detectLanguage = (value: string): Language => {
  const trimmed = value.trim();
  if (!trimmed) return 'text';

  if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // fall through
    }
  }

  if (
    /\bpackage\s+\w+/.test(trimmed) ||
    /\bfunc\s+\w+\s*\(/.test(trimmed) ||
    /\bimport\s*\(/.test(trimmed) ||
    /\bimport\s+"[^"]+"/.test(trimmed) ||
    /:=/.test(trimmed)
  ) {
    return 'go';
  }

  const lines = normalizeLineEndings(trimmed).split('\n').filter(line => line.trim() !== '');
  const yamlKeyValueLines = lines.filter(line => /^[\s-]*[A-Za-z0-9_"'.-]+\s*:\s*.+$/.test(line));
  if (lines.length >= 2 && yamlKeyValueLines.length >= Math.max(2, Math.ceil(lines.length / 2))) {
    return 'yaml';
  }

  return 'text';
};

const formatContent = (value: string, language: Language) => {
  if (!value.trim()) return '';

  if (language === 'json') {
    return JSON.stringify(JSON.parse(value), null, 2);
  }

  return normalizeLineEndings(value)
    .split('\n')
    .map(line => line.replace(/\s+$/g, ''))
    .join('\n');
};

const sortObjectKeysDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => sortObjectKeysDeep(item));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN', { sensitivity: 'base' }))
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortObjectKeysDeep((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
};

const sortLines = (value: string) =>
  normalizeLineEndings(value)
    .split('\n')
    .sort((left, right) => {
      const leftKey = left.trimStart();
      const rightKey = right.trimStart();
      return leftKey.localeCompare(rightKey, 'zh-Hans-CN', { sensitivity: 'base' }) || left.localeCompare(right, 'zh-Hans-CN', { sensitivity: 'base' });
    })
    .join('\n');

const sortContent = (
  value: string,
  language: Language
): {
  value: string;
  usedFallback: boolean;
} => {
  if (!value.trim()) {
    return {
      value: '',
      usedFallback: false,
    };
  }

  if (language === 'json') {
    try {
      const parsed = JSON.parse(value);

      if (!parsed || typeof parsed !== 'object') {
        return {
          value: sortLines(value),
          usedFallback: true,
        };
      }

      return {
        value: JSON.stringify(sortObjectKeysDeep(parsed), null, 2),
        usedFallback: false,
      };
    } catch {
      return {
        value: sortLines(value),
        usedFallback: true,
      };
    }
  }

  if (language === 'yaml') {
    const document = YAML.parseDocument(value);

    if (document.errors.length > 0) {
      return {
        value: sortLines(value),
        usedFallback: true,
      };
    }

    const parsed = document.toJS();

    if (!parsed || typeof parsed !== 'object') {
      return {
        value: sortLines(value),
        usedFallback: true,
      };
    }

    return {
      value: YAML.stringify(sortObjectKeysDeep(parsed)).trimEnd(),
      usedFallback: false,
    };
  }

  return {
    value: sortLines(value),
    usedFallback: false,
  };
};

const createEmptySummary = (): DiffSummary => ({
  added: 0,
  removed: 0,
  modified: 0,
});

const TextCodeDiffTool = () => {
  const emptyDraft = useMemo(
    () => ({
      language: 'text' as Language,
      leftInput: '',
      rightInput: '',
      hasManualLanguageSelection: false,
      hasAutoDetectedLanguage: false,
    }),
    []
  );
  const { initialDraft: cachedDraft, persistDraft } = useToolDraft(
    TEXT_CODE_DIFF_CACHE_KEY,
    emptyDraft,
    { clearOnReload: true }
  );
  const [language, setLanguage] = useState<Language>(cachedDraft.language);
  const [leftInput, setLeftInput] = useState(cachedDraft.leftInput);
  const [rightInput, setRightInput] = useState(cachedDraft.rightInput);
  const [summary, setSummary] = useState<DiffSummary>(createEmptySummary);
  const [statusMessage, setStatusMessage] = useState('共 1 行');
  const [statusTone, setStatusTone] = useState<'info' | 'error'>('info');
  const diffEditorRef = useRef<any>(null);
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);
  const isApplyingProgrammaticChange = useRef(false);
  const hasManualLanguageSelection = useRef(cachedDraft.hasManualLanguageSelection);
  const hasAutoDetectedLanguage = useRef(cachedDraft.hasAutoDetectedLanguage);
  const draftState = useMemo(
    () => ({
      language,
      leftInput,
      rightInput,
      hasManualLanguageSelection: hasManualLanguageSelection.current,
      hasAutoDetectedLanguage: hasAutoDetectedLanguage.current,
    }),
    [language, leftInput, rightInput]
  );

  useEffect(() => {
    persistDraft(draftState, Boolean(leftInput || rightInput));
  }, [persistDraft, draftState, leftInput, rightInput]);

  useEffect(() => {
    const totalLines = Math.max(leftInput.split('\n').length, rightInput.split('\n').length);
    setStatusMessage(`共 ${totalLines} 行`);
    setStatusTone('info');
  }, [leftInput, rightInput, language]);

  useEffect(() => {
    if (hasManualLanguageSelection.current || hasAutoDetectedLanguage.current || language !== 'text') return;

    const source = leftInput.trim() ? leftInput : rightInput.trim() ? rightInput : '';
    if (!source) return;

    const detectedLanguage = detectLanguage(source);
    if (detectedLanguage !== 'text') {
      hasAutoDetectedLanguage.current = true;
      setLanguage(detectedLanguage);
    }
  }, [leftInput, rightInput, language]);

  const handleFormat = () => {
    try {
      const nextLeft = formatContent(leftEditorRef.current?.getValue?.() ?? leftInput, language);
      const nextRight = formatContent(rightEditorRef.current?.getValue?.() ?? rightInput, language);

      isApplyingProgrammaticChange.current = true;
      leftEditorRef.current?.setValue?.(nextLeft);
      rightEditorRef.current?.setValue?.(nextRight);
      setLeftInput(nextLeft);
      setRightInput(nextRight);
      setStatusMessage(language === 'json' ? 'JSON 已格式化。' : `${getLanguageLabel(language)} 已完成基础整理。`);
      setStatusTone('info');
      queueMicrotask(() => {
        isApplyingProgrammaticChange.current = false;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '格式化失败';
      setStatusMessage(`格式化失败：${message}`);
      setStatusTone('error');
    }
  };

  const handleSort = () => {
    try {
      const leftSorted = sortContent(leftEditorRef.current?.getValue?.() ?? leftInput, language);
      const rightSorted = sortContent(rightEditorRef.current?.getValue?.() ?? rightInput, language);
      const nextLeft = leftSorted.value;
      const nextRight = rightSorted.value;
      const usedFallback = leftSorted.usedFallback || rightSorted.usedFallback;

      isApplyingProgrammaticChange.current = true;
      leftEditorRef.current?.setValue?.(nextLeft);
      rightEditorRef.current?.setValue?.(nextRight);
      setLeftInput(nextLeft);
      setRightInput(nextRight);
      if (usedFallback && language === 'json') {
        setStatusMessage('输入不是有效的结构化 JSON，已按逐行排序。');
      } else if (usedFallback && language === 'yaml') {
        setStatusMessage('输入不是有效的结构化 YAML，已按逐行排序。');
      } else {
        setStatusMessage(`${getLanguageLabel(language)} 已完成排序。`);
      }
      setStatusTone('info');
      queueMicrotask(() => {
        isApplyingProgrammaticChange.current = false;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '排序失败';
      setStatusMessage(`排序失败：${message}`);
      setStatusTone('error');
    }
  };

  const handleClear = () => {
    hasManualLanguageSelection.current = false;
    hasAutoDetectedLanguage.current = false;
    isApplyingProgrammaticChange.current = true;
    leftEditorRef.current?.setValue?.('');
    rightEditorRef.current?.setValue?.('');
    setLanguage('text');
    setLeftInput('');
    setRightInput('');
    setSummary(createEmptySummary());
    setStatusMessage('已清空左右输入内容。');
    setStatusTone('info');
    queueMicrotask(() => {
      isApplyingProgrammaticChange.current = false;
    });
  };

  const updateSummaryFromEditor = () => {
    const editor = diffEditorRef.current;
    if (!editor) return;

    const lineChanges = editor.getLineChanges?.() ?? [];
    const nextSummary = createEmptySummary();

    lineChanges.forEach((change: any) => {
      const originalCount =
        change.originalEndLineNumber === 0
          ? 0
          : change.originalEndLineNumber - change.originalStartLineNumber + 1;
      const modifiedCount =
        change.modifiedEndLineNumber === 0
          ? 0
          : change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;

      if (originalCount > 0 && modifiedCount > 0) {
        nextSummary.modified += Math.max(originalCount, modifiedCount);
      } else if (originalCount > 0) {
        nextSummary.removed += originalCount;
      } else if (modifiedCount > 0) {
        nextSummary.added += modifiedCount;
      }
    });

    setSummary(nextSummary);
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    diffEditorRef.current = editor;
    leftEditorRef.current = editor.getOriginalEditor?.();
    rightEditorRef.current = editor.getModifiedEditor?.();

    monaco.editor.setTheme('vs');
    updateSummaryFromEditor();
    editor.getOriginalEditor?.().onDidChangeModelContent?.(() => {
      if (isApplyingProgrammaticChange.current) return;
      const nextValue = editor.getOriginalEditor().getValue();
      setLeftInput(nextValue);
    });
    editor.getModifiedEditor?.().onDidChangeModelContent?.(() => {
      if (isApplyingProgrammaticChange.current) return;
      const nextValue = editor.getModifiedEditor().getValue();
      setRightInput(nextValue);
    });
    editor.onDidUpdateDiff?.(() => {
      updateSummaryFromEditor();
    });
  };

  const editorOptions = useMemo(
    () => ({
      renderSideBySide: true,
      originalEditable: true,
      readOnly: false,
      minimap: { enabled: false },
      fontSize: 13,
      fontLigatures: true,
      lineNumbers: 'on' as const,
      scrollBeyondLastLine: false,
      wordWrap: 'on' as const,
      automaticLayout: true,
      glyphMargin: false,
      folding: true,
      renderOverviewRuler: false,
      diffWordWrap: 'on' as const,
      ignoreTrimWhitespace: false,
      overviewRulerBorder: false,
      rulers: [],
      padding: {
        top: 16,
        bottom: 16,
      },
    }),
    []
  );

  return (
    <ToolPage fullHeight>
      <ToolHeader
        title="文本代码对比"
        icon={<FileDiff className="text-[#0057c1] w-6 h-6" />}
        wrap
        actions={
          <>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['text', 'json', 'yaml', 'go'] as Language[]).map(option => (
              <button
                key={option}
                onClick={() => {
                  hasManualLanguageSelection.current = true;
                  hasAutoDetectedLanguage.current = true;
                  setLanguage(option);
                }}
                className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md ${
                  language === option ? 'bg-white text-[#0057c1] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {getLanguageLabel(option)}
              </button>
            ))}
          </div>
          <Tooltip text="重新格式化">
            <button onClick={handleFormat} className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-md">
              <RefreshCw className="w-5 h-5" />
            </button>
          </Tooltip>
          <Tooltip text="排序左右内容">
            <button onClick={handleSort} className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-md">
              <ArrowUpAZ className="w-5 h-5" />
            </button>
          </Tooltip>
          <Tooltip text="清除全部">
            <button onClick={handleClear} className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors rounded-md">
              <Trash2 className="w-5 h-5" />
            </button>
          </Tooltip>
          </>
        }
      />

      <div className="flex items-center justify-between gap-4 flex-wrap rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-sm ${statusTone === 'error' ? 'text-red-500' : 'text-slate-500'}`}>{statusMessage}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            新增 {summary.added}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-md">
            删除 {summary.removed}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
            修改 {summary.modified}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 -mb-1">
        <div className="px-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">左侧</div>
        </div>
        <div className="px-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">右侧</div>
        </div>
      </div>

      <div className="flex-1 min-h-[440px] lg:min-h-[460px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <DiffEditor
          height="100%"
          language={getMonacoLanguage(language)}
          original={cachedDraft.leftInput}
          modified={cachedDraft.rightInput}
          onMount={handleEditorMount}
          options={editorOptions}
          loading={<div className="h-full flex items-center justify-center text-sm text-slate-400">正在加载 Monaco 编辑器…</div>}
        />
      </div>
    </ToolPage>
  );
};

export default TextCodeDiffTool;
