/** Practice Lab / Judge0 language catalog & limits */

export const PRACTICE_LANGUAGES = [
  'c',
  'cpp',
  'java',
  'python',
  'javascript',
  'typescript',
  'go',
  'rust',
  'csharp',
  'kotlin',
] as const;

export const PRACTICE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const PRACTICE_LAB_STATUSES = ['draft', 'published', 'archived', 'closed'] as const;

export const TEST_CASE_VISIBILITIES = ['public', 'hidden'] as const;

export const EXECUTION_STATUSES = [
  'queued',
  'running',
  'accepted',
  'wrong_answer',
  'compilation_error',
  'runtime_error',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'internal_error',
  'cancelled',
] as const;

export const SUBMISSION_VERDICTS = [
  'pending',
  'accepted',
  'wrong_answer',
  'compilation_error',
  'runtime_error',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'partial',
  'failed',
] as const;

/** Judge0 CE language IDs (self-hosted CE defaults) */
export const JUDGE0_LANGUAGE_IDS: Record<(typeof PRACTICE_LANGUAGES)[number], number> = {
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
  typescript: 74,
  go: 60,
  rust: 73,
  csharp: 51,
  kotlin: 78,
};

export const PRACTICE_LANGUAGE_META: Record<
  (typeof PRACTICE_LANGUAGES)[number],
  { name: string; monacoLanguage: string; version: string; defaultBoilerplate: string }
> = {
  c: {
    name: 'C',
    monacoLanguage: 'c',
    version: 'GCC 9.2.0',
    defaultBoilerplate: '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n',
  },
  cpp: {
    name: 'C++',
    monacoLanguage: 'cpp',
    version: 'GCC 9.2.0',
    defaultBoilerplate:
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // your code here\n    return 0;\n}\n',
  },
  java: {
    name: 'Java',
    monacoLanguage: 'java',
    version: 'OpenJDK 13',
    defaultBoilerplate:
      'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}\n',
  },
  python: {
    name: 'Python',
    monacoLanguage: 'python',
    version: '3.8.1',
    defaultBoilerplate: '# your code here\n',
  },
  javascript: {
    name: 'JavaScript',
    monacoLanguage: 'javascript',
    version: 'Node.js 12.14.0',
    defaultBoilerplate: '// your code here\nconst fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\n',
  },
  typescript: {
    name: 'TypeScript',
    monacoLanguage: 'typescript',
    version: '3.7.4',
    defaultBoilerplate: '// your code here\n',
  },
  go: {
    name: 'Go',
    monacoLanguage: 'go',
    version: '1.13.5',
    defaultBoilerplate: 'package main\n\nimport "fmt"\n\nfunc main() {\n\t// your code here\n}\n',
  },
  rust: {
    name: 'Rust',
    monacoLanguage: 'rust',
    version: '1.40.0',
    defaultBoilerplate: 'use std::io;\n\nfn main() {\n    // your code here\n}\n',
  },
  csharp: {
    name: 'C#',
    monacoLanguage: 'csharp',
    version: 'Mono 6.6.0',
    defaultBoilerplate:
      'using System;\n\nclass Program {\n    static void Main() {\n        // your code here\n    }\n}\n',
  },
  kotlin: {
    name: 'Kotlin',
    monacoLanguage: 'kotlin',
    version: '1.3.70',
    defaultBoilerplate: 'fun main() {\n    // your code here\n}\n',
  },
};

export const PRACTICE_DEFAULT_MEMORY_MB = 256;
export const PRACTICE_DEFAULT_TIME_MS = 2000;
export const PRACTICE_MAX_SOURCE_CHARS = 200_000;
export const PRACTICE_MAX_STDIN_CHARS = 100_000;
export const PRACTICE_MAX_SUBMISSIONS_DEFAULT = 50;

export const PRACTICE_LAB_AUDIT_EVENTS = [
  'practice_created',
  'practice_updated',
  'practice_deleted',
  'practice_published',
  'practice_archived',
  'practice_restored',
  'practice_duplicated',
  'problem_created',
  'problem_updated',
  'problem_deleted',
  'testcase_created',
  'testcase_updated',
  'testcase_deleted',
  'submission_created',
  'submission_accepted',
  'submission_failed',
  'execution_started',
  'execution_finished',
  'problems_imported',
  'lab_exported',
] as const;

export type PracticeLabAuditEvent = (typeof PRACTICE_LAB_AUDIT_EVENTS)[number];
