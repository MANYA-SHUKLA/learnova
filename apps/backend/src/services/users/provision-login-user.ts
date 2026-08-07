/**
 * Provision a login User for faculty/student ERP records.
 * Idempotent: if email already has a user, returns existing.
 */

import { Types } from 'mongoose';
import type { Role } from '@learnova/types';
import { hashPassword } from '../../security/index.js';
import { roleRepository, userRepository } from '../../repositories/auth/index.js';
import { ConflictError, NotFoundError } from '../../utils/errors/index.js';
import { logger } from '../../utils/logger/index.js';

const DEFAULT_TEMP_PASSWORD = 'Learnova@ChangeMe1';

export interface ProvisionLoginUserInput {
  email: string;
  firstName: string;
  lastName: string;
  institutionId: string;
  role: Extract<Role, 'faculty' | 'student'>;
  /** Plain password; defaults to a known demo temp password */
  password?: string;
}

export async function provisionLoginUser(input: ProvisionLoginUserInput): Promise<{
  userId: string;
  created: boolean;
  temporaryPassword: string | null;
}> {
  const email = input.email.toLowerCase().trim();
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return { userId: String(existing._id), created: false, temporaryPassword: null };
  }

  const role = await roleRepository.findByName(input.role);
  if (!role) {
    throw new NotFoundError(`${input.role} role is not seeded — run seed:auth`);
  }

  const password = input.password ?? DEFAULT_TEMP_PASSWORD;
  const passwordHash = await hashPassword(password);

  try {
    const user = await userRepository.create({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: role._id,
      institutionId: new Types.ObjectId(input.institutionId),
      isEmailVerified: true,
      passwordHistory: [],
      lastPasswordChangedAt: new Date(),
    });

    logger.info({ email, role: input.role, userId: String(user._id) }, 'Login user provisioned');
    return {
      userId: String(user._id),
      created: true,
      temporaryPassword: input.password ? null : DEFAULT_TEMP_PASSWORD,
    };
  } catch (err) {
    const again = await userRepository.findByEmail(email);
    if (again) {
      return { userId: String(again._id), created: false, temporaryPassword: null };
    }
    if (err instanceof ConflictError) throw err;
    throw err;
  }
}

export { DEFAULT_TEMP_PASSWORD };
