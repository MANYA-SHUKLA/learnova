import type { PlatformMarketingInput } from '@learnova/validation';
import { PlatformMarketingModel } from '../../models/platform-marketing.model.js';

const SINGLETON_KEY = 'default';

function defaultMarketing(): PlatformMarketingInput {
  return {
    heroTitle: 'Learnova ERP for colleges and universities',
    heroSubtitle:
      'Academic structure, timetables, gradebook, examinations, and a trusted campus portal — one platform for your institution.',
    heroCtaLabel: 'Request a demo',
    features: [
      {
        title: 'Academic operations',
        body: 'Programs, sections, enrollments, and calendars aligned to your campus workflow.',
      },
      {
        title: 'Faculty & student portals',
        body: 'Role-based dashboards with official branding on every sign-in.',
      },
      {
        title: 'Assessments & gradebook',
        body: 'Assignments, quizzes, examinations, and transcripts in one place.',
      },
    ],
    pricingTitle: 'Pricing',
    pricingBody:
      'Flexible campus licensing — contact us for a demo. Pricing is agreed after we understand your scale and modules; no self-serve checkout on this site.',
    faq: [
      {
        title: 'How do we get started?',
        body: 'Request a demo, meet our team, and we allocate your campus with admin credentials by email.',
      },
    ],
    footerNote: 'Learnova — built for institutional trust.',
  };
}

function toDto(doc: {
  heroTitle: string;
  heroSubtitle?: string | null;
  heroCtaLabel?: string | null;
  features?: { title: string; body: string }[];
  pricingTitle?: string | null;
  pricingBody?: string | null;
  faq?: { title: string; body: string }[];
  footerNote?: string | null;
  updatedAt?: Date;
}) {
  return {
    heroTitle: doc.heroTitle,
    heroSubtitle: doc.heroSubtitle ?? '',
    heroCtaLabel: doc.heroCtaLabel ?? 'Request a demo',
    features: doc.features ?? [],
    pricingTitle: doc.pricingTitle ?? null,
    pricingBody: doc.pricingBody ?? null,
    faq: doc.faq ?? [],
    footerNote: doc.footerNote ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

export class PlatformMarketingService {
  async getPublicMarketing() {
    let doc = await PlatformMarketingModel.findOne({ singletonKey: SINGLETON_KEY }).exec();
    if (!doc) {
      doc = await PlatformMarketingModel.create({ singletonKey: SINGLETON_KEY, ...defaultMarketing() });
    }
    return toDto(doc);
  }

  async updateMarketing(input: PlatformMarketingInput) {
    const doc = await PlatformMarketingModel.findOneAndUpdate(
      { singletonKey: SINGLETON_KEY },
      { $set: input, $setOnInsert: { singletonKey: SINGLETON_KEY } },
      { upsert: true, new: true },
    ).exec();
    return toDto(doc!);
  }
}

export const platformMarketingService = new PlatformMarketingService();
