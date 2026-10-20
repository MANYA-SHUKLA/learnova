import type { PlatformMarketingInput } from '@learnova/validation';
import { PlatformMarketingModel } from '../../models/platform-marketing.model.js';

const SINGLETON_KEY = 'default';

function defaultMarketing(): PlatformMarketingInput {
  return {
    heroTitle: 'Learnova — campus ERP, LMS, and exams in one place',
    heroSubtitle:
      'Run programs, sections, timetables, assignments, quizzes, examinations, and gradebook work on one stack. Each college gets a branded portal at a short URL (for example /soe) where students and faculty sign in with institute-issued accounts.',
    heroCtaLabel: 'Request a demo',
    features: [
      {
        title: 'Registrar-friendly structure',
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
      'Campus licensing is agreed after a demo — we scope modules (ERP, LMS, coding labs, examinations, analytics) to your size. There is no card checkout on this website; onboarding is human-led through the platform console.',
    faq: [
      {
        title: 'How do we get started?',
        body: 'Submit the demo form on this page. We email you to schedule a call, walk through modules, then provision a campus URL and institution admin credentials when you are ready.',
      },
      {
        title: 'Can anyone sign up on the open internet?',
        body: 'No. Learnova is invite-only per campus. Institution admins create or import faculty and student records; the public marketing site is for discovery and demo requests only.',
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
        title: 'Is payment handled on this website?',
        body: 'No. There is no Razorpay or self-serve checkout here. Commercial terms are discussed offline after we understand your modules and student volume.',
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
