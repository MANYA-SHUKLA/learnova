import type { PlatformMarketingInput } from '@learnova/validation';
import { PlatformMarketingModel } from '../../models/platform-marketing.model.js';

const SINGLETON_KEY = 'default';

function defaultMarketing(): PlatformMarketingInput {
  return {
    heroTitle: 'Run your college on one live academic stack',
    heroSubtitle:
      'Timetables, courses, coding labs, exams, and gradebook tied to real sections — plus a branded portal at a short URL your campus can share on day one.',
    heroCtaLabel: 'Request a demo',
    features: [
      {
        title: 'Registration-friendly structure',
        body: 'Departments, programs, academic years, semesters, batches, and sections — configured once and reused across timetables and enrollments.',
      },
      {
        title: 'Portals students actually use',
        body: 'Campus home pages explain who may sign in; after login, role dashboards show timetable, courses, notices, and grades with your logo and contact details.',
      },
      {
        title: 'Exams with audit trails',
        body: 'Schedule exam windows, collect submissions, record results, and keep activity logs for academic offices that need traceability.',
      },
    ],
    pricingTitle: 'Pricing',
    pricingBody:
      'We scope ERP, LMS, labs, and exams on a demo call, then send a campus quote by email once intake and modules are clear. Onboarding runs through the platform console with your academic or IT lead.',
    faq: [
      {
        title: 'How do we get started?',
        body: 'Submit the demo form on this page. We email you to schedule a call, walk through modules, then provision a campus URL and institution admin credentials when you are ready.',
      },
      {
        title: 'Who creates logins for students and faculty?',
        body: 'Your institute admin or academic office. They add users, assign roles, and reset passwords from the admin dashboard — the same discipline as issuing college email IDs.',
      },
      {
        title: 'Do you support our own campus URL and branding?',
        body: 'Yes. After allocation you receive a short path such as /your-slug for the trust portal, plus an admin guide. Branding, support email, and portal copy are editable from institution settings.',
      },
      {
        title: 'How long does go-live usually take?',
        body: 'After the demo and scope alignment, initial provisioning is quick. Academic data entry (programs, sections, timetables) depends on your team; we start with admin access and a documented setup path.',
      },
      {
        title: 'How does licensing work?',
        body: 'We quote after a demo when we know your programs, modules, and rough headcount. The agreement is handled by email — this form only books the first conversation.',
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
