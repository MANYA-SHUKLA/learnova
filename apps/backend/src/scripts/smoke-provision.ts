/**
 * Local E2E smoke: provision faculty + student, CSV import, mustChangePassword login gate.
 * Sends real SMTP when MAIL_DRIVER=smtp (use +aliases on your Gmail for test inboxes).
 *
 * Usage:
 *   pnpm --filter @learnova/backend exec tsx --env-file=.env src/scripts/smoke-provision.ts
 *
 * Optional env:
 *   SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD — institution admin login
 *   SMOKE_MAIL_TO — base inbox (default: MAIL_FROM); uses +faculty / +student aliases
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { env } from '../config/env.js';
import mongoose from 'mongoose';
import { roleRepository } from '../repositories/auth/index.js';

const API = process.env.SMOKE_API_URL ?? `http://127.0.0.1:${env.PORT ?? 4000}/api/v1`;

function plusAlias(base: string, tag: string): string {
  const [local, domain] = base.split('@');
  if (!local || !domain) return base;
  const clean = local.split('+')[0];
  return `${clean}+${tag}@${domain}`;
}

async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = (await res.json()) as {
    success: boolean;
    data?: T;
    error?: { message?: string };
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `HTTP ${res.status} ${path}`);
  }
  return json.data as T;
}

async function main(): Promise<void> {
  await connectMongo();
  const db = mongoose.connection.db!;
  const iid = new mongoose.Types.ObjectId(env.SEED_INSTITUTION_ID);
  const adminRole = await roleRepository.findByName('institution_admin');
  if (!adminRole) throw new Error('Run seed:auth first');

  const adminUser = await db.collection('users').findOne({
    institutionId: iid,
    roleId: adminRole._id,
  });
  if (!adminUser) {
    throw new Error(
      'No institution_admin for JNU. Register once at /register-institution or set SMOKE_ADMIN_EMAIL.',
    );
  }

  const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? (adminUser.email as string);
  const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      `Set SMOKE_ADMIN_PASSWORD for admin ${adminEmail} (your institution admin password).`,
    );
  }

  const mailBase = process.env.SMOKE_MAIL_TO ?? env.MAIL_FROM ?? adminEmail;
  const stamp = Date.now().toString(36);
  const facultyEmail = plusAlias(mailBase, `fac-${stamp}`);
  const studentEmail = plusAlias(mailBase, `stu-${stamp}`);
  const importEmail = plusAlias(mailBase, `imp-${stamp}`);

  logger.info({ API, adminEmail, facultyEmail, studentEmail, importEmail }, 'Smoke provision start');

  const login = await api<{
    accessToken: string;
    user: { role: string; mustChangePassword: boolean };
  }>('/auth/login', {
    body: { email: adminEmail, password: adminPassword },
  });
  if (login.user.role !== 'institution_admin') {
    throw new Error(`Expected institution_admin, got ${login.user.role}`);
  }
  const token = login.accessToken;

  const faculty = await api<{
    id: string;
    credentials: { email: string; temporaryPassword: string } | null;
  }>('/faculty', {
    token,
    body: {
      employeeId: `EMP-${stamp}`,
      facultyCode: `FC${stamp.slice(-6).toUpperCase()}`,
      firstName: 'Smoke',
      lastName: 'Faculty',
      email: facultyEmail,
      status: 'active',
    },
  });
  if (!faculty.credentials?.temporaryPassword) {
    throw new Error('Faculty create did not return temporary credentials');
  }
  logger.info({ facultyId: faculty.id, email: faculty.credentials.email }, 'Faculty created + credentials');

  const student = await api<{
    id: string;
    credentials: { email: string; temporaryPassword: string } | null;
  }>('/students', {
    token,
    body: {
      studentId: `STU-${stamp}`,
      admissionNumber: `ADM-${stamp}`,
      firstName: 'Smoke',
      lastName: 'Student',
      email: studentEmail,
      status: 'active',
    },
  });
  if (!student.credentials?.temporaryPassword) {
    throw new Error('Student create did not return temporary credentials');
  }
  logger.info({ studentId: student.id, email: student.credentials.email }, 'Student created + credentials');

  const importResult = await api<{
    imported: number;
    credentialsEmailed?: number;
  }>('/students/import', {
    token,
    body: {
      dryRun: false,
      rows: [
        {
          studentId: `IMP-${stamp}`,
          admissionNumber: `IADM-${stamp}`,
          firstName: 'Import',
          lastName: 'Student',
          email: importEmail,
          status: 'active',
        },
      ],
    },
  });
  logger.info(importResult, 'CSV import result');

  const exportRes = await fetch(`${API}/students/export?format=csv`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
  });
  if (!exportRes.ok) {
    throw new Error(`Export failed HTTP ${exportRes.status}`);
  }
  const csv = await exportRes.text();
  if (!csv.includes('studentId') || !csv.includes(`STU-${stamp}`)) {
    throw new Error('Export CSV missing expected student row');
  }
  logger.info({ csvBytes: csv.length }, 'Export CSV OK');

  const facultyLogin = await api<{
    user: { role: string; mustChangePassword: boolean };
  }>('/auth/login', {
    body: {
      email: faculty.credentials.email,
      password: faculty.credentials.temporaryPassword,
    },
  });
  if (!facultyLogin.user.mustChangePassword || facultyLogin.user.role !== 'faculty') {
    throw new Error(
      `Faculty gate failed: role=${facultyLogin.user.role} mustChange=${facultyLogin.user.mustChangePassword}`,
    );
  }
  logger.info('Faculty first-login mustChangePassword=true ✓');

  const studentLogin = await api<{
    user: { role: string; mustChangePassword: boolean };
  }>('/auth/login', {
    body: {
      email: student.credentials.email,
      password: student.credentials.temporaryPassword,
    },
  });
  if (!studentLogin.user.mustChangePassword || studentLogin.user.role !== 'student') {
    throw new Error(
      `Student gate failed: role=${studentLogin.user.role} mustChange=${studentLogin.user.mustChangePassword}`,
    );
  }
  logger.info('Student first-login mustChangePassword=true ✓');

  logger.info(
    {
      checkInbox: mailBase,
      note: 'Gmail +aliases land in the same inbox; look for 3 credentials emails',
    },
    'SMOKE OK',
  );

  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'smoke-provision failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
