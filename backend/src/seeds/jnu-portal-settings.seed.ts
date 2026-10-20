/**
 * Applies default SOE JNU campus portal copy to the primary institution (by slug or first active).
 * Run after institution exists: pnpm --filter @learnova/backend seed:jnu-portal
 */

import { env } from '../config/env.js';
import { InstitutionModel } from '../models/institution.model.js';

const DEFAULT_PORTAL = {
  portalTitle: 'Campus academic portal',
  portalSubtitle:
    'Use the email and password issued by the institute office. After sign-in you will see your timetable, courses, assignments, grades, and notices — this page is only the entry gate, not your workspace.',
  termLabel: 'School of Engineering, JNU',
  notices: [
    'Monsoon semester 2026 — timetables are available after you sign in.',
    'Accounts are created by the institute; there is no public student registration.',
    'Forgot your password? Contact the academic office or use Forgot password on the sign-in page.',
  ],
  supportEmail: 'shuklamanya99@gmail.com',
  officeLabel: 'Academic office',
  officialCredit: 'Official academic portal — School of Engineering, Jawaharlal Nehru University.',
  developerCredit: 'System developed by Manya Shukla · Learnova',
  showPlatformLink: true,
};

export async function seedJnuPortalSettings(): Promise<void> {
  const slug = env.DEFAULT_INSTITUTION_SLUG?.toLowerCase();
  const filter = slug
    ? { slug, deletedAt: null }
    : { deletedAt: null, status: 'active' as const };

  const doc = await InstitutionModel.findOne(filter).sort({ createdAt: 1 }).exec();
  if (!doc) {
    throw new Error('No institution found — create JNU tenant before running seed:jnu-portal');
  }

  await InstitutionModel.updateOne(
    { _id: doc._id },
    { $set: { portalSettings: DEFAULT_PORTAL } },
  ).exec();
}
