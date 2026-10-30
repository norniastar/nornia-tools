// Monaco 同源打包：不再从 jsDelivr 拉取，只带本项目用到的 JSON / YAML / Go 语言支持
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';
import { loader } from '@monaco-editor/react';

self.MonacoEnvironment = {
  getWorker: (_workerId: string, label: string) => (label === 'json' ? new JsonWorker() : new EditorWorker()),
};

loader.config({ monaco });
