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
    data?: { accessToken: string; user: { role: string; permissions?: string[] } };
    error?: { message?: string; code?: string };
  };
  if (!json.success || !json.data) {
    const msg = json.error?.message ?? String(res.status);
    const hint = msg.toLowerCase().includes('too many') ? ' (auth rate limit — wait ~1 min, re-run)' : '';
    console.log(`  LOGIN FAIL (${role}): ${msg}${hint}`);
    return null;
  }
  const cookies = extractCookies(res.headers.get('set-cookie'));
  return {
    token: json.data.accessToken,
    role: json.data.user.role,
    cookies,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pageStatus(path: string, cookies = '', role?: string): Promise<number> {
  const cookieParts = [cookies, 'learnova_session=1'];
  if (role) cookieParts.push(`learnova_role=${encodeURIComponent(role)}`);
  const res = await fetch(`${WEB}${path}`, {
    redirect: 'follow',
    headers: cookieParts.filter(Boolean).length > 0 ? { Cookie: cookieParts.filter(Boolean).join('; ') } : {},
  });
  return res.status;
}

async function pageRedirect(path: string, cookies: string, role: string): Promise<{ status: number; location: string | null }> {
  const res = await fetch(`${WEB}${path}`, {
    redirect: 'manual',
    headers: {
      Cookie: `${cookies}; learnova_session=1; learnova_role=${encodeURIComponent(role)}`,
    },
  });
  return { status: res.status, location: res.headers.get('location') };
}

interface ApiListResponse {
  success: boolean;
  data?: { items?: unknown[] };
  meta?: { total?: number };
}

interface ApiProbe {
  path: string;
  expectOk: boolean;
  label?: string;
}

function listTotal(json: ApiListResponse): number {
  return json.meta?.total ?? json.data?.items?.length ?? 0;
}

function pass(ok: boolean): string {
  return ok ? 'PASS' : 'FAIL';
}

function track(failures: string[], label: string, ok: boolean): string {
  if (!ok) failures.push(label);
  return pass(ok);
}

async function main(): Promise<void> {
  const failures: string[] = [];
  console.log('\n=== Backend Health ===');
  for (const path of ['/health', '/ready', '/live']) {
    const { status, json } = await api<{ success?: boolean; data?: { status?: string } }>(path);
    const ok = status === 200 && (json as { success?: boolean }).success !== false;
    console.log(`  GET /api/v1${path}: HTTP ${status} ${pass(ok)}`);
  }

  console.log('\n=== Authentication ===');
  const admin = await login('admin');
  await sleep(300);
  const faculty = await login('faculty');
  await sleep(300);
  const student = await login('student');
  console.log(`  Login admin: ${admin ? pass(true) : 'FAIL (run set-admin-password.ts)'}`);
  console.log(`  Login faculty: ${faculty ? pass(true) : 'FAIL (run pnpm seed:demo)'}`);
  console.log(`  Login student: ${student ? pass(true) : 'FAIL (run pnpm seed:demo or wait for rate limit)'}`);

  if (admin) {
    const me = await api<{ success: boolean }>('/auth/me', { token: admin.token });
    console.log(`  GET /auth/me (admin): ${pass(me.status === 200 && me.json.success)}`);

    const sessions = await api<{ success: boolean; data?: { sessions?: unknown[] } }>(
      '/auth/sessions',
      { token: admin.token },
    );
    const sessionCount = Array.isArray(sessions.json.data?.sessions)
      ? sessions.json.data.sessions.length
      : 0;
    console.log(
      `  GET /auth/sessions: ${pass(sessions.json.success)} (${sessionCount} active)`,
    );

    if (admin.cookies) {
      const refresh = await api<{ success: boolean; error?: { message?: string } }>(
        '/auth/refresh',
        { method: 'POST', cookies: admin.cookies },
      );
      const refreshOk = refresh.json.success;
      const rateLimited = refresh.json.error?.message?.toLowerCase().includes('too many');
      console.log(
        `  POST /auth/refresh: ${rateLimited ? 'SKIP (rate limited)' : pass(refreshOk)}`,
      );
    }

    const logout = await api<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      token: admin.token,
      cookies: admin.cookies,
    });
    console.log(`  POST /auth/logout: ${pass(logout.json.success)}`);
  }

  await sleep(500);
  const forgot = await api<{ success: boolean; error?: { message?: string } }>(
    '/auth/forgot-password',
    { method: 'POST', body: { email: 'shuklamanya99@gmail.com' } },
  );
  const forgotRateLimited = forgot.json.error?.message?.toLowerCase().includes('too many');
  console.log(
    `  POST /auth/forgot-password: ${forgotRateLimited ? 'SKIP (rate limited)' : pass(forgot.status === 200 && forgot.json.success)}`,
  );

  for (const [name, path] of [
    ['Forgot Password page', '/en/forgot-password'],
    ['Reset Password page', '/en/reset-password'],
    ['Verify Email page', '/en/verify-email'],
    ['Sessions page', '/en/sessions'],
  ] as const) {
    const code = admin
      ? await pageStatus(path, admin.cookies, admin.role)
      : await pageStatus(path);
    console.log(`  ${name}: HTTP ${code} ${pass(code === 200)}`);
  }

  console.log('\n=== Faculty Pages ===');
  const facultyPages: [string, string][] = [
    ['Dashboard', '/en/faculty/dashboard'],
    ['My Courses', '/en/faculty/enrollments'],
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
      const code = await pageStatus(path, faculty.cookies, faculty.role);
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
      const code = await pageStatus(path, student.cookies, student.role);
      console.log(`  ${name}: HTTP ${code} ${pass(code === 200)}`);
    }
  } else {
    console.log('  Skipped — student login unavailable');
  }

  console.log('\n=== RBAC (Pages) ===');
  if (faculty) {
    const blocked = await pageRedirect('/en/institution/dashboard', faculty.cookies, faculty.role);
    const redirected =
      blocked.status >= 300 &&
      blocked.status < 400 &&
      blocked.location?.includes('/faculty/dashboard');
    console.log(
      `  Faculty blocked from institution dashboard: ${track(failures, 'Faculty blocked from institution dashboard', redirected)}`,
    );
  }
  if (student) {
    const blockedFaculty = await pageRedirect('/en/faculty/dashboard', student.cookies, student.role);
    const blockedInstitution = await pageRedirect(
      '/en/institution/dashboard',
      student.cookies,
      student.role,
    );
    const blockedInstitutionStudents = await pageRedirect(
      '/en/institution/students',
      student.cookies,
      student.role,
    );
    const facultyRedirect =
      blockedFaculty.status >= 300 &&
      blockedFaculty.status < 400 &&
      blockedFaculty.location?.includes('/student/dashboard');
    const institutionRedirect =
      blockedInstitution.status >= 300 &&
      blockedInstitution.status < 400 &&
      blockedInstitution.location?.includes('/student/dashboard');
    const institutionStudentsRedirect =
      blockedInstitutionStudents.status >= 300 &&
      blockedInstitutionStudents.status < 400 &&
      blockedInstitutionStudents.location?.includes('/student/dashboard');

    console.log(
      `  Student blocked from faculty dashboard: ${track(failures, 'Student blocked from faculty dashboard', facultyRedirect)}`,
    );
    console.log(
      `  Student blocked from institution dashboard: ${track(failures, 'Student blocked from institution dashboard', institutionRedirect)}`,
    );
    console.log(
      `  Student blocked from institution students: ${track(failures, 'Student blocked from institution students', institutionStudentsRedirect)}`,
    );
  }
  if (admin) {
    const blocked = await pageRedirect('/en/student/dashboard', admin.cookies, admin.role);
    const redirected =
      blocked.status >= 300 &&
      blocked.status < 400 &&
      blocked.location?.includes('/institution/dashboard');
    console.log(
      `  Admin blocked from student dashboard: ${track(failures, 'Admin blocked from student dashboard', redirected)}`,
    );
  }

  console.log('\n=== RBAC (API) ===');
  if (faculty) {
    const readProbes: ApiProbe[] = [
      { path: '/courses?page=1&limit=5', expectOk: true, label: 'Faculty read courses' },
      { path: '/students?page=1&limit=5', expectOk: true, label: 'Faculty read enrolled students (student:read)' },
      { path: '/institution-settings', expectOk: false, label: 'Faculty read settings (must deny)' },
    ];
    for (const p of readProbes) {
      const r = await api<{ success: boolean }>(p.path, { token: faculty.token });
      const ok = p.expectOk ? r.json.success : !r.json.success;
      console.log(`  ${p.label}: ${track(failures, p.label ?? p.path, ok)}`);
    }
    const patchSettings = await api<{ success: boolean }>('/institution-settings', {
      method: 'PATCH',
      token: faculty.token,
      body: { timezone: 'UTC' },
    });
    console.log(
      `  Faculty PATCH settings (must deny): ${track(failures, 'Faculty PATCH settings (must deny)', !patchSettings.json.success)}`,
    );
    const createStudent = await api<{ success: boolean }>('/students', {
      method: 'POST',
      token: faculty.token,
      body: {
        studentId: 'RBAC-TEST',
        firstName: 'Test',
        lastName: 'User',
        email: 'rbac-test@learnova.test',
      },
    });
    console.log(
      `  Faculty POST student (must deny): ${track(failures, 'Faculty POST student (must deny)', !createStudent.json.success)}`,
    );
  }

  if (student) {
    const createFaculty = await api<{ success: boolean }>('/faculty', {
      method: 'POST',
      token: student.token,
      body: {
        employeeId: 'RBAC-TEST',
        firstName: 'Test',
        lastName: 'Faculty',
        email: 'rbac-faculty@learnova.test',
      },
    });
    console.log(
      `  Student POST faculty (must deny): ${track(failures, 'Student POST faculty (must deny)', !createFaculty.json.success)}`,
    );

    const readFaculty = await api<{ success: boolean }>('/faculty?page=1&limit=5', {
      token: student.token,
    });
    console.log(
      `  Student read faculty list (must deny): ${track(failures, 'Student read faculty list (must deny)', !readFaculty.json.success)}`,
    );

    const readInstitution = await api<{ success: boolean }>('/institution-settings', {
      token: student.token,
    });
    console.log(
      `  Student read institution settings (must deny): ${track(failures, 'Student read institution settings (must deny)', !readInstitution.json.success)}`,
    );

    const ownGrades = await api<{ success: boolean }>('/gradebook/dashboard/student', {
      token: student.token,
    });
    console.log(`  Student own gradebook dash: ${pass(ownGrades.json.success)}`);

    const ownCertificates = await api<{
      success: boolean;
      data?: { certificateCount?: number; recentCertificates?: unknown[] };
    }>('/certificates/dashboard/student', { token: student.token });
    const certCount =
      ownCertificates.json.data?.certificateCount ??
      ownCertificates.json.data?.recentCertificates?.length ??
      0;
    console.log(
      `  Student own certificates: ${track(failures, 'Student own certificates', ownCertificates.json.success && certCount > 0)} (${certCount})`,
    );
  }

  if (faculty && student) {
    const facultyCourses = await api<ApiListResponse>('/courses?page=1&limit=5', {
      token: faculty.token,
    });
    const facultyStudents = await api<ApiListResponse>('/students?page=1&limit=5', {
      token: faculty.token,
    });
    const courseTotal = listTotal(facultyCourses.json);
    const studentTotal = listTotal(facultyStudents.json);
    console.log(
      `  Faculty scoped courses (>0): ${track(failures, 'Faculty scoped courses (>0)', courseTotal > 0)} (${courseTotal})`,
    );
    console.log(
      `  Faculty scoped students (>0): ${track(failures, 'Faculty scoped students (>0)', studentTotal > 0)} (${studentTotal})`,
    );
  }

  if (admin) {
    const inst = await api<{ success: boolean }>('/campuses?page=1&limit=1', { token: admin.token });
    console.log(`  Admin campuses: ${pass(inst.json.success)}`);
  }

  if (admin && faculty) {
    const [adminCourses, facultyCourses] = await Promise.all([
      api<ApiListResponse>('/courses?page=1&limit=1', { token: admin.token }),
      api<ApiListResponse>('/courses?page=1&limit=1', { token: faculty.token }),
    ]);
    const adminTotal = listTotal(adminCourses.json);
    const facultyTotal = listTotal(facultyCourses.json);
    const scoped = facultyTotal > 0 && adminTotal > facultyTotal;
    console.log(
      `  Faculty course count scoped vs admin (${facultyTotal}/${adminTotal}): ${track(failures, 'Faculty course count scoped vs admin', scoped)}`,
    );
  }

  console.log('\n=== Permissions (role bundles) ===');
  if (admin && faculty && student) {
    const permChecks = [
      { label: 'admin', token: admin.token, perm: 'certificate:manage', expect: true },
      { label: 'faculty', token: faculty.token, perm: 'certificate:write', expect: true },
      { label: 'faculty', token: faculty.token, perm: 'certificate:manage', expect: false },
      { label: 'student', token: student.token, perm: 'certificate:read', expect: true },
      { label: 'student', token: student.token, perm: 'gradebook:write', expect: false },
    ];
    for (const c of permChecks) {
      const me = await api<{ success: boolean; data?: { user?: { permissions?: string[] } } }>(
        '/auth/me',
        { token: c.token },
      );
      const perms = me.json.data?.user?.permissions ?? [];
      const has = perms.includes(c.perm);
      console.log(`  ${c.label} has ${c.perm}: ${pass(has === c.expect)} (${has})`);
    }
  } else {
    console.log('  Skipped — need all three role logins (avoid rate limit: wait ~1 min)');
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
    { label: 'Teams', collection: 'project_teams', min: 80 },
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
    const certMin = 1;
    console.log(
      `  Certificates: ${certCount} ${certCount >= certMin ? pass(true) : 'WARN (run pnpm seed:certificates or pnpm seed:complete)'}`,
    );
  }

  const gradeCount = existing.has('gradebook_entries')
    ? await db.collection('gradebook_entries').countDocuments({})
    : 0;
  if (gradeCount > 0 && gradeCount < 5000) {
    console.log(
      `  Note: gradebook seed may still be running (${gradeCount}/5000). Wait, then re-run verify — or run pnpm seed:complete`,
    );
  }

  await disconnectMongo();

  if (failures.length > 0) {
    console.log(`\nRBAC / security verification failed (${failures.length}):`);
    for (const label of failures) {
      console.log(`  - ${label}`);
    }
    process.exit(1);
  }

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
