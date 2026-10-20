import type {
  InstitutionAdminLoginAuditQuery,
  PermanentDeleteCampusInput,
  ProvisionCampusInput,
  ResendAdminCredentialsInput,
} from '@learnova/validation';
import mongoose, { Types } from 'mongoose';
import { hashPassword } from '../../security/index.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors/index.js';
import {
  institutionRepository,
  institutionSettingsRepository,
} from '../../repositories/institution/index.js';
import {
  auditAuthLogRepository,
  roleRepository,
  sessionRepository,
  userRepository,
} from '../../repositories/auth/index.js';
import { sendInstitutionAdminCredentialsEmail } from '../../mail/institution-admin-credentials-email.js';
import { demoRequestService } from './demo-request.service.js';
import type { ActorContext } from '../institution/institution.service.js';
import { UserModel } from '../../models/user.model.js';
import { institutionAuditRepository } from '../../repositories/institution/index.js';
import { resolveProvisionIdentifiers } from './provision-campus.helpers.js';
import { purgeInstitutionData } from './purge-institution.js';

function assertSuperAdmin(actor: ActorContext) {
  if (actor.role !== 'super_admin') {
    throw new ForbiddenError('Super admin access required');
  }
}

async function revokeAllInstitutionSessions(institutionId: string) {
  const oid = new Types.ObjectId(institutionId);
  const users = await UserModel.find({ institutionId: oid }).select('_id').exec();
  for (const user of users) {
    await sessionRepository.revokeAllForUser(String(user._id));
  }
  await UserModel.updateMany({ institutionId: oid }, { $inc: { tokenVersion: 1 } }).exec();
}

function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export class SuperAdminService {
  async listInstitutionAdminLogins(query: InstitutionAdminLoginAuditQuery, actor: ActorContext) {
    assertSuperAdmin(actor);
    const result = await auditAuthLogRepository.listInstitutionAdminLogins({
      page: query.page,
      limit: query.limit,
    });
    const items = result.items.map(
      (row: {
        _id: { toString(): string };
        email?: string;
        institutionId?: { toString(): string } | null;
        institutionName?: string | null;
        loggedInAt?: Date;
        ipAddress?: string | null;
      }) => ({
        id: String(row._id),
        email: row.email ?? '',
        institutionId: row.institutionId ? String(row.institutionId) : null,
        institutionName: row.institutionName ?? null,
        loggedInAt: row.loggedInAt?.toISOString?.() ?? null,
        ipAddress: row.ipAddress ?? null,
      }),
    );
    return { items, meta: pageMeta(result.total, result.page, result.limit) };
  }

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
    const { slug, code } = await resolveProvisionIdentifiers(input.institutionName, {
      slug: input.slug,
      code: input.code,
    });

    try {
      const institution = await institutionRepository.create({
        _id: institutionId,
        name: input.institutionName,
        shortName: input.institutionName.slice(0, 32),
        slug,
        code,
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
        institutionSlug: slug,
        temporaryPassword: input.initialPassword,
      });

      const demoRequestId = input.demoRequestId?.trim();
      if (demoRequestId && mongoose.isValidObjectId(demoRequestId)) {
        await demoRequestService.markProvisioned(demoRequestId, String(institutionId), actor);
      }

      await institutionAuditRepository.log({
        event: 'institution.provisioned',
        institutionId: String(institutionId),
        userId: actor.userId,
        email: actor.email,
        metadata: {
          slug,
          code,
          adminEmail: input.adminEmail,
          demoRequestId: input.demoRequestId ?? null,
        },
      });

      return {
        institutionId: String(institution._id),
        institutionSlug: institution.slug as string,
        institutionCode: institution.code as string,
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

  async suspendCampus(institutionId: string, actor: ActorContext) {
    assertSuperAdmin(actor);
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution not found');
    if (institution.status === 'inactive') {
      return { institutionId, status: 'inactive' as const, alreadySuspended: true };
    }
    const doc = await institutionRepository.updateById(institutionId, { status: 'inactive' });
    if (!doc) throw new NotFoundError('Institution not found');
    await revokeAllInstitutionSessions(institutionId);
    await institutionAuditRepository.log({
      event: 'institution.suspended',
      institutionId,
      userId: actor.userId,
      email: actor.email,
      metadata: { name: institution.name, slug: institution.slug },
    });
    return { institutionId, status: 'inactive' as const, alreadySuspended: false };
  }

  async reactivateCampus(institutionId: string, actor: ActorContext) {
    assertSuperAdmin(actor);
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution not found');
    if (institution.status === 'active') {
      return { institutionId, status: 'active' as const, alreadyActive: true };
    }
    const doc = await institutionRepository.updateById(institutionId, { status: 'active' });
    if (!doc) throw new NotFoundError('Institution not found');
    await institutionAuditRepository.log({
      event: 'institution.reactivated',
      institutionId,
      userId: actor.userId,
      email: actor.email,
      metadata: { name: institution.name, slug: institution.slug },
    });
    return { institutionId, status: 'active' as const, alreadyActive: false };
  }

  async permanentlyDeleteCampus(
    institutionId: string,
    input: PermanentDeleteCampusInput,
    actor: ActorContext,
  ) {
    assertSuperAdmin(actor);
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) throw new NotFoundError('Institution not found');
    const expected = (institution.name as string).trim();
    if (input.confirmName.trim() !== expected) {
      throw new ValidationError('Confirmation name must match the institution name exactly');
    }
    const { deletedByCollection } = await purgeInstitutionData(institutionId);
    return {
      deleted: true,
      institutionId,
      deletedByCollection,
    };
  }
}

export const superAdminService = new SuperAdminService();
