/**
 * Platform verification — health, auth, RBAC, pages, DB collections, seed counts.
 * Usage (from repo root):
 *   pnpm verify:platform
 * Or from apps/backend:
 *   pnpm verify:platform
 */

import '../config/load-env.js';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';

const API = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:4000/api/v1';
const WEB = process.env.SMOKE_WEB_URL ?? 'http://127.0.0.1:3000';

const CREDS = {
  admin: { email: 'shuklamanya99@gmail.com', password: 'Admin@Test1' },
  faculty: { email: 'faculty.demo@learnova.test', password: 'Demo@12345' },
  student: { email: 'student.demo@learnova.test', password: 'Demo@12345' },
} as const;

type LoginResult = {
  token: string;
  role: string;
  cookies: string;
};

async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string; cookies?: string } = {},
): Promise<{ status: number; json: T; headers: Headers }> {
  const res = await fetch(`${API}${path}`, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.cookies ? { Cookie: options.cookies } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    json = { raw: text } as T;
  }
  return { status: res.status, json, headers: res.headers };
}

function extractCookies(setCookie: string | null): string {
  if (!setCookie) return '';
  return setCookie
    .split(/,(?=\s*[^;]+=[^;]+)/)
    .map((c) => c.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

async function login(role: keyof typeof CREDS): Promise<LoginResult | null> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(CREDS[role]),
  });
  const json = (await res.json()) as {
    success: boolean;
    data?: { accessToken: string; user: { role: string } };
    error?: { message?: string };
  };
  if (!json.success || !json.data) {
    console.log(`  LOGIN FAIL (${role}): ${json.error?.message ?? res.status}`);
    return null;
  }
  const cookies = extractCookies(res.headers.get('set-cookie'));
  return {
    token: json.data.accessToken,
    role: json.data.user.role,
    cookies,
  };
}

async function pageStatus(path: string, cookies = ''): Promise<number> {
  const res = await fetch(`${WEB}${path}`, {
    redirect: 'follow',
    headers: cookies ? { Cookie: `${cookies}; learnova_session=1` } : {},
  });
  return res.status;
}

interface ApiProbe {
  path: string;
  expectOk: boolean;
  label?: string;
}

function pass(ok: boolean): string {
  return ok ? 'PASS' : 'FAIL';
}

async function main(): Promise<void> {
  console.log('\n=== Backend Health ===');
  for (const path of ['/health', '/ready', '/live']) {
    const { status, json } = await api<{ success?: boolean; data?: { status?: string } }>(path);
    const ok = status === 200 && (json as { success?: boolean }).success !== false;
    console.log(`  GET /api/v1${path}: HTTP ${status} ${pass(ok)}`);
  }

  console.log('\n=== Authentication ===');
  const admin = await login('admin');
  const faculty = await login('faculty');
  const student = await login('student');
  console.log(`  Login admin: ${admin ? pass(true) : 'FAIL (run seed:demo + set-admin-password)'}`);
  console.log(`  Login faculty: ${faculty ? pass(true) : 'FAIL (run pnpm seed:demo)'}`);
  console.log(`  Login student: ${student ? pass(true) : 'FAIL (run pnpm seed:demo)'}`);

  if (admin) {
    const me = await api<{ success: boolean }>('/auth/me', { token: admin.token });
    console.log(`  GET /auth/me (admin): ${pass(me.status === 200 && me.json.success)}`);

    const sessions = await api<{ success: boolean; data?: unknown[] }>('/auth/sessions', {
      token: admin.token,
    });
    const sessionCount = Array.isArray(sessions.json.data) ? sessions.json.data.length : 0;
    console.log(
      `  GET /auth/sessions: ${pass(sessions.json.success)} (${sessionCount} active)`,
    );

    if (admin.cookies) {
      const refresh = await api<{ success: boolean }>('/auth/refresh', {
        method: 'POST',
        cookies: admin.cookies,
      });
      console.log(`  POST /auth/refresh: ${pass(refresh.json.success)}`);
    }

    const logout = await api<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      token: admin.token,
      cookies: admin.cookies,
    });
    console.log(`  POST /auth/logout: ${pass(logout.json.success)}`);

    // Re-login admin for remaining checks
    const admin2 = await login('admin');
    if (admin2) Object.assign(admin, admin2);
  }

  const forgot = await api<{ success: boolean }>('/auth/forgot-password', {
    method: 'POST',
    body: { email: 'shuklamanya99@gmail.com' },
  });
  console.log(`  POST /auth/forgot-password: ${pass(forgot.status === 200 && forgot.json.success)}`);

  for (const [name, path] of [
    ['Forgot Password page', '/en/forgot-password'],
    ['Reset Password page', '/en/reset-password'],
    ['Verify Email page', '/en/verify-email'],
    ['Sessions page', '/en/sessions'],
  ] as const) {
    const code = admin ? await pageStatus(path, admin.cookies) : await pageStatus(path);
    console.log(`  ${name}: HTTP ${code} ${pass(code === 200)}`);
  }

  console.log('\n=== Faculty Pages ===');
  const facultyPages: [string, string][] = [
    ['Dashboard', '/en/faculty/dashboard'],
    ['My Courses', '/en/faculty/enrollments'],
    ['Students (nav link)', '/en/institution/students'],
    ['Assignments', '/en/faculty/assignments'],
    ['Labs', '/en/faculty/practice-labs'],
    ['Projects', '/en/faculty/projects'],
    ['Quizzes', '/en/faculty/quizzes'],
    ['Exams', '/en/faculty/exams'],
    ['Gradebook', '/en/faculty/gradebook'],
    ['Profile', '/en/faculty/profile'],
  ];
  if (faculty) {
    for (const [name, path] of facultyPages) {
      const code = await pageStatus(path, faculty.cookies);
      console.log(`  ${name}: HTTP ${code} ${pass(code === 200)}`);
    }
  } else {
    console.log('  Skipped — faculty login unavailable');
  }

  console.log('\n=== Student Pages ===');
  const studentPages: [string, string][] = [
    ['Dashboard', '/en/student/dashboard'],
    ['Courses', '/en/student/enrollments'],
    ['Learning', '/en/student/progress'],
    ['Assignments', '/en/student/assignments'],
    ['Practice Labs', '/en/student/practice-labs'],
    ['Projects', '/en/student/projects'],
    ['Quizzes', '/en/student/quizzes'],
    ['Exams', '/en/student/exams'],
    ['Grades', '/en/student/grades'],
    ['Certificates', '/en/student/certificates'],
    ['Profile', '/en/student/profile'],
  ];
  if (student) {
    for (const [name, path] of studentPages) {
      const code = await pageStatus(path, student.cookies);
      console.log(`  ${name}: HTTP ${code} ${pass(code === 200)}`);
    }
  } else {
    console.log('  Skipped — student login unavailable');
  }

  console.log('\n=== RBAC (API) ===');
  if (faculty) {
    const probes: ApiProbe[] = [
      { path: '/courses?page=1&limit=5', expectOk: true, label: 'Faculty list courses' },
      { path: '/students?page=1&limit=5', expectOk: false, label: 'Faculty global students' },
      { path: '/institution-settings', expectOk: false, label: 'Faculty institution settings' },
      { path: '/campuses?page=1&limit=1', expectOk: false, label: 'Faculty manage campuses' },
    ];
    for (const p of probes) {
      const r = await api<{ success: boolean }>(p.path, { token: faculty.token });
      const ok = p.expectOk ? r.json.success : !r.json.success;
      console.log(`  ${p.label}: ${pass(ok)} (success=${r.json.success})`);
    }
  }

  if (student) {
    const probes: ApiProbe[] = [
      { path: '/students?page=1&limit=5', expectOk: false, label: 'Student list all students' },
      { path: '/faculty?page=1&limit=5', expectOk: false, label: 'Student list faculty' },
      { path: '/institutions/me', expectOk: false, label: 'Student institution me' },
      { path: '/gradebook/entries?page=1&limit=5', expectOk: false, label: 'Student all gradebook entries' },
    ];
    for (const p of probes) {
      const r = await api<{ success: boolean }>(p.path, { token: student.token });
      const ok = p.expectOk ? r.json.success : !r.json.success;
      console.log(`  ${p.label}: ${pass(ok)} (success=${r.json.success})`);
    }

    const ownGrades = await api<{ success: boolean }>('/gradebook/dashboard/student', {
      token: student.token,
    });
    console.log(`  Student own gradebook dash: ${pass(ownGrades.json.success)}`);
  }

  if (admin) {
    const inst = await api<{ success: boolean }>('/campuses?page=1&limit=1', { token: admin.token });
    console.log(`  Admin campuses: ${pass(inst.json.success)}`);
  }

  console.log('\n=== Permissions (role bundles) ===');
  if (admin && faculty && student) {
    const permChecks = [
      { role: 'admin', token: admin.token, perm: 'certificate:manage', expect: true },
      { role: 'faculty', token: faculty.token, perm: 'certificate:write', expect: true },
      { role: 'faculty', token: faculty.token, perm: 'certificate:manage', expect: false },
      { role: 'student', token: student.token, perm: 'certificate:read', expect: true },
      { role: 'student', token: student.token, perm: 'gradebook:write', expect: false },
    ];
    for (const c of permChecks) {
      const me = await api<{ success: boolean; data?: { permissions?: string[] } }>('/auth/me', {
        token: c.token,
      });
      const perms = me.json.data?.permissions ?? [];
      const has = perms.includes(c.perm);
      console.log(`  ${c.role} has ${c.perm}: ${pass(has === c.expect)} (${has})`);
    }
  }

  console.log('\n=== Database Collections ===');
  await connectMongo();
  const db = mongoose.connection.db!;
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));

  const expectedCollections: Record<string, string[]> = {
    users: ['users'],
    roles: ['roles'],
    permissions: ['permissions'],
    sessions: ['sessions'],
    refresh_tokens: ['refreshtokens', 'refresh_tokens'],
    institutions: ['institutions'],
    campuses: ['campuses'],
    schools: ['schools'],
    departments: ['departments'],
    programs: ['programs'],
    academic_years: ['academic_years', 'academicyears'],
    semesters: ['semesters'],
    sections: ['sections'],
    batches: ['batches'],
    faculty: ['faculties', 'faculty'],
    students: ['students'],
    courses: ['courses'],
    course_modules: ['course_modules', 'coursemodules'],
    course_lessons: ['course_lessons', 'courselessons'],
    enrollments: ['enrollments'],
    progress: [
      'course_progress',
      'module_progress',
      'lesson_progress',
      'resource_progress',
      'progress_records',
    ],
    assignments: ['assignments'],
    assignment_submissions: ['assignment_submissions'],
    practice_labs: ['practice_labs'],
    lab_submissions: ['student_code_submissions', 'lab_submissions'],
    projects: ['projects'],
    project_teams: ['project_teams'],
    project_submissions: ['project_submissions'],
    question_bank: ['question_banks', 'questions'],
    quizzes: ['quizzes'],
    quiz_attempts: ['quiz_attempts'],
    examinations: ['exams', 'examinations'],
    exam_attempts: ['exam_attempts'],
    gradebooks: ['gradebook_entries', 'gradebooks'],
    gradebook_items: ['gradebook_entries'],
    gradebook_snapshots: ['gradebook_snapshots'],
    certificates: ['academic_certificates', 'certificates'],
    audit_logs: ['audit_logs', 'gradebook_audit_logs', 'assignment_audit_logs'],
  };

  for (const [label, aliases] of Object.entries(expectedCollections)) {
    const found = aliases.find((a) => existing.has(a));
    console.log(`  ${label}: ${found ? pass(true) + ` (${found})` : 'FAIL (missing)'}`);
  }

  console.log('\n=== Seed Data Counts ===');
  const counts: { label: string; collection: string; min: number }[] = [
    { label: 'Institution', collection: 'institutions', min: 1 },
    { label: 'Faculty', collection: 'faculty', min: 30 },
    { label: 'Students', collection: 'students', min: 200 },
    { label: 'Courses', collection: 'courses', min: 30 },
    { label: 'Projects', collection: 'projects', min: 50 },
    { label: 'Teams', collection: 'project_teams', min: 100 },
    { label: 'Quizzes', collection: 'quizzes', min: 50 },
    { label: 'Exams', collection: 'exams', min: 50 },
    { label: 'Grade Records', collection: 'gradebook_entries', min: 5000 },
  ];

  for (const { label, collection, min } of counts) {
    if (!existing.has(collection)) {
      console.log(`  ${label}: FAIL (collection ${collection} missing)`);
      continue;
    }
    const n = await db.collection(collection).countDocuments({});
    console.log(`  ${label}: ${n} ${pass(n >= min)} (min ${min})`);
  }

  const certCount = existing.has('academic_certificates')
    ? await db.collection('academic_certificates').countDocuments({})
    : 0;
  if (existing.has('academic_certificates')) {
    console.log(`  Certificates: ${certCount} (implemented)`);
  }

  await disconnectMongo();
  console.log('\nDone.\n');
}

main().catch(async (err: unknown) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
