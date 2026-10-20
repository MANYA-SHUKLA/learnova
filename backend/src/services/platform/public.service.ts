import type { PublicInstitutionSummary, PublicPortalPayload } from '@learnova/types';
import { NotFoundError } from '../../utils/errors/index.js';
import { InstitutionModel } from '../../models/institution.model.js';

function defaultPortalSettings() {
  return {
    portalTitle: null,
    portalSubtitle: null,
    termLabel: null,
    notices: [] as string[],
    supportEmail: null,
    officeLabel: null,
    officialCredit: null,
    developerCredit: null,
    showPlatformLink: true,
  };
}

function normalizePortalSettings(raw: Record<string, unknown> | undefined | null) {
  const base = defaultPortalSettings();
  if (!raw) return base;
  return {
    portalTitle: (raw.portalTitle as string | null) ?? null,
    portalSubtitle: (raw.portalSubtitle as string | null) ?? null,
    termLabel: (raw.termLabel as string | null) ?? null,
    notices: Array.isArray(raw.notices) ? (raw.notices as string[]) : [],
    supportEmail: (raw.supportEmail as string | null) ?? null,
    officeLabel: (raw.officeLabel as string | null) ?? null,
    officialCredit: (raw.officialCredit as string | null) ?? null,
    developerCredit: (raw.developerCredit as string | null) ?? null,
    showPlatformLink: raw.showPlatformLink !== false,
  };
}

export class PublicService {
  async listActiveInstitutions(): Promise<PublicInstitutionSummary[]> {
    const docs = await InstitutionModel.find({ status: 'active', deletedAt: null })
      .select('name shortName slug logo')
      .sort({ name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => ({
      slug: doc.slug as string,
      name: doc.name as string,
      shortName: doc.shortName as string,
      logo: (doc.logo as string | null) ?? null,
    }));
  }

  async getPortalBySlug(slug: string): Promise<PublicPortalPayload> {
    const doc = await InstitutionModel.findOne({
      slug: slug.toLowerCase(),
      status: 'active',
      deletedAt: null,
    })
      .select('name shortName slug logo favicon portalSettings')
      .lean()
      .exec();
    if (!doc) throw new NotFoundError('Campus not found');
    return {
      slug: doc.slug as string,
      name: doc.name as string,
      shortName: doc.shortName as string,
      logo: (doc.logo as string | null) ?? null,
      favicon: (doc.favicon as string | null) ?? null,
      portalSettings: normalizePortalSettings(
        doc.portalSettings as Record<string, unknown> | undefined,
      ),
    };
  }
}

export const publicService = new PublicService();
