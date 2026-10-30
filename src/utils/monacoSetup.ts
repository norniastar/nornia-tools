// Monaco 同源打包：不再从 jsDelivr 拉取，只带本项目用到的 JSON / YAML / Go 语言支持
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution.js';
import { loader } from '@monaco-editor/react';

self.MonacoEnvironment = {
  getWorker: (_workerId: string, label: string) =>
    label === 'json'
      ? new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url), { type: 'module' })
      : new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
};

loader.config({ monaco });
