import { env } from '../config/env.js';
import { hashPassword } from '../security/index.js';
import { roleRepository, userRepository } from '../repositories/auth/index.js';

/**
 * Ensures the platform super admin user exists (env-driven password).
 */
export async function seedSuperAdminUser(): Promise<void> {
  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const password = env.SUPER_ADMIN_PASSWORD;

  const role = await roleRepository.findByName('super_admin');
  if (!role) {
    throw new Error('super_admin role missing — run seed:auth first');
  }

  const existing = await userRepository.findByEmail(email);
  const passwordHash = await hashPassword(password);

  if (existing) {
    await userRepository.updateById(String(existing._id), {
      passwordHash,
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: false,
      roleId: role._id,
    });
    return;
  }

  await userRepository.create({
    email,
    passwordHash,
    firstName: 'Manya',
    lastName: 'Shukla',
    roleId: role._id,
    institutionId: null,
    isEmailVerified: true,
    mustChangePassword: false,
    passwordHistory: [],
    lastPasswordChangedAt: new Date(),
  });
}
