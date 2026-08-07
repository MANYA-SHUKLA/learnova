'use client';

import Editor, { type OnMount } from '@monaco-editor/react';
import { PRACTICE_LANGUAGE_META } from '@learnova/constants';
import type { PracticeLanguage } from '@learnova/types';
import { usePracticeEditorStore } from '../store/editor-store';

const MONACO_MAP: Record<PracticeLanguage, string> = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  go: 'go',
  rust: 'rust',
  csharp: 'csharp',
  kotlin: 'kotlin',
};

interface CodeEditorProps {
  language: PracticeLanguage;
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export function CodeEditor({
  language,
  value,
  onChange,
  height = '420px',
  readOnly = false,
}: CodeEditorProps) {
  const theme = usePracticeEditorStore((s) => s.theme);
  const fontSize = usePracticeEditorStore((s) => s.fontSize);
  const wordWrap = usePracticeEditorStore((s) => s.wordWrap);

  const onMount: OnMount = (editor) => {
    editor.focus();
  };

  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs text-white/70">
        <span>{PRACTICE_LANGUAGE_META[language].name}</span>
        <span>{PRACTICE_LANGUAGE_META[language].version}</span>
      </div>
      <Editor
        height={height}
        language={MONACO_MAP[language]}
        theme={theme}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        onMount={onMount}
        options={{
          fontSize,
          wordWrap: wordWrap ? 'on' : 'off',
          minimap: { enabled: false },
          lineNumbers: 'on',
          automaticLayout: true,
          readOnly,
          scrollBeyondLastLine: false,
          tabSize: 2,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
