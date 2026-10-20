import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../models/index.js';
import { hashPassword } from '../security/index.js';
import { roleRepository, userRepository } from '../repositories/auth/index.js';

/**
 * Ensures SOE / primary institution admin exists (env-driven email + password).
 * Login at `/login` — not super-admin console.
 */
export async function seedInstitutionAdminUser(institutionId: string): Promise<void> {
  const email = env.PLATFORM_ADMIN_EMAIL.toLowerCase();
  const password = env.INSTITUTION_ADMIN_PASSWORD;

  const role = await roleRepository.findByName('institution_admin');
  if (!role) {
    throw new Error('institution_admin role missing — run seed:auth first');
  }

  const passwordHash = await hashPassword(password);
  const institutionOid = new Types.ObjectId(institutionId);

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    await UserModel.findByIdAndUpdate(existing._id, {
      $set: {
        passwordHash,
        isActive: true,
        isEmailVerified: true,
        mustChangePassword: false,
        roleId: role._id,
        institutionId: institutionOid,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    return;
  }

  await userRepository.create({
    email,
    passwordHash,
    firstName: 'SOE',
    lastName: 'Admin',
    roleId: role._id,
    institutionId: institutionOid,
    isEmailVerified: true,
    mustChangePassword: false,
    passwordHistory: [],
    lastPasswordChangedAt: new Date(),
  });
}
