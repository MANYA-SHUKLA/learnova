/**
 * Provision a login User for faculty/student ERP records.
 * Idempotent: if email already has a user, returns existing (no new temp password).
 *
 * New users get a cryptographically random temporary password (bcrypt-hashed)
 * and mustChangePassword=true until they set a personal password.
 */

import { Types } from 'mongoose';
import type { Role } from '@learnova/types';
import { generateTemporaryPassword } from '../../security/temp-password.js';
import { hashPassword } from '../../security/index.js';
import { roleRepository, userRepository } from '../../repositories/auth/index.js';
import { ConflictError, NotFoundError } from '../../utils/errors/index.js';
import { logger } from '../../utils/logger/index.js';

export interface ProvisionLoginUserInput {
  email: string;
  firstName: string;
  lastName: string;
  institutionId: string;
  role: Extract<Role, 'faculty' | 'student'>;
  /** Explicit password (e.g. demo seed). If omitted, a random temp password is generated. */
  password?: string;
  /** Override mustChangePassword (demo accounts may set false). Default: true when creating. */
  mustChangePassword?: boolean;
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

  const temporaryPassword = input.password ?? generateTemporaryPassword(12);
  const mustChangePassword = input.mustChangePassword ?? true;
  const passwordHash = await hashPassword(temporaryPassword);

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
      mustChangePassword,
    });

    logger.info(
      { email, role: input.role, userId: String(user._id), mustChangePassword },
      'Login user provisioned with temporary password',
    );
    return {
      userId: String(user._id),
      created: true,
      temporaryPassword,
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
