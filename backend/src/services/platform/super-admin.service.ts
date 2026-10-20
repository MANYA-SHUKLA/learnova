import type { ProvisionCampusInput, ResendAdminCredentialsInput } from '@learnova/validation';
import { Types } from 'mongoose';
import { hashPassword } from '../../security/index.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors/index.js';
import {
  institutionRepository,
  institutionSettingsRepository,
} from '../../repositories/institution/index.js';
import { roleRepository, userRepository } from '../../repositories/auth/index.js';
import { sendInstitutionAdminCredentialsEmail } from '../../mail/institution-admin-credentials-email.js';
import { demoRequestService } from './demo-request.service.js';
import type { ActorContext } from '../institution/institution.service.js';
import { UserModel } from '../../models/user.model.js';
import { institutionAuditRepository } from '../../repositories/institution/index.js';

function assertSuperAdmin(actor: ActorContext) {
  if (actor.role !== 'super_admin') {
    throw new ForbiddenError('Super admin access required');
  }
}

export class SuperAdminService {
  async provisionCampus(input: ProvisionCampusInput, actor: ActorContext) {
    assertSuperAdmin(actor);

    const existingUser = await userRepository.findByEmail(input.adminEmail);
    if (existingUser) {
      throw new ConflictError('Admin email is already registered');
    }

    const role = await roleRepository.findByName('institution_admin');
    if (!role) throw new NotFoundError('Institution admin role is not seeded');

    const institutionId = new Types.ObjectId();
    const passwordHash = await hashPassword(input.initialPassword);

    try {
      const institution = await institutionRepository.create({
        _id: institutionId,
        name: input.institutionName,
        shortName: input.institutionName.slice(0, 32),
        slug: input.slug.toLowerCase(),
        code: input.code.toUpperCase(),
        email: input.contactEmail,
        phone: input.phone ?? null,
        status: 'active',
        deletedAt: null,
      });

      await institutionSettingsRepository.getOrCreate(String(institutionId));

      const adminUser = await userRepository.create({
        email: input.adminEmail,
        passwordHash,
        firstName: input.adminFirstName,
        lastName: input.adminLastName,
        roleId: role._id,
        institutionId,
        isEmailVerified: true,
        mustChangePassword: true,
        passwordHistory: [],
      });

      void sendInstitutionAdminCredentialsEmail({
        to: input.adminEmail,
        firstName: input.adminFirstName,
        institutionName: input.institutionName,
        institutionSlug: input.slug.toLowerCase(),
        temporaryPassword: input.initialPassword,
      });

      if (input.demoRequestId) {
        await demoRequestService.markProvisioned(input.demoRequestId, String(institutionId), actor);
      }

      await institutionAuditRepository.log({
        event: 'institution.provisioned',
        institutionId: String(institutionId),
        userId: actor.userId,
        email: actor.email,
        metadata: {
          slug: input.slug.toLowerCase(),
          adminEmail: input.adminEmail,
          demoRequestId: input.demoRequestId ?? null,
        },
      });

      return {
        institutionId: String(institution._id),
        institutionSlug: institution.slug as string,
        adminUserId: String(adminUser._id),
        credentialsEmailSent: true,
      };
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictError('Institution slug, code, or email already exists');
      }
      throw err;
    }
  }

  async resendAdminCredentials(
    institutionId: string,
    input: ResendAdminCredentialsInput,
    actor: ActorContext,
  ) {
    assertSuperAdmin(actor);
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution not found');

    const roleDoc = await roleRepository.findByName('institution_admin');
    if (!roleDoc) throw new NotFoundError('Institution admin role is not seeded');

    const target = await UserModel.findOne({
      institutionId: new Types.ObjectId(institutionId),
      roleId: roleDoc._id,
      isActive: true,
    }).exec();
    if (!target) {
      throw new NotFoundError('Institution admin user not found');
    }

    let plainPassword = input.newPassword;
    if (input.rotatePassword || !plainPassword) {
      plainPassword = input.newPassword ?? `Temp${Math.random().toString(36).slice(2, 10)}!9`;
    }
    if (!plainPassword || plainPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const passwordHash = await hashPassword(plainPassword);
    await userRepository.updateById(String(target._id), {
      passwordHash,
      mustChangePassword: true,
    });

    void sendInstitutionAdminCredentialsEmail({
      to: target.email,
      firstName: target.firstName,
      institutionName: institution.name as string,
      institutionSlug: institution.slug as string,
      temporaryPassword: plainPassword,
    });

    return { sent: true, adminEmail: target.email };
  }
}

export const superAdminService = new SuperAdminService();
