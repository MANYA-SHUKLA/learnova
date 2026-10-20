import { InstitutionModel } from '../../models/index.js';
import { ensureUniqueSlug, generateSlug } from '../id/entity-id.helpers.js';

async function institutionSlugExists(slug: string): Promise<boolean> {
  const doc = await InstitutionModel.findOne({ slug: slug.toLowerCase(), deletedAt: null })
    .select('_id')
    .lean()
    .exec();
  return Boolean(doc);
}

async function institutionCodeExists(code: string): Promise<boolean> {
  const doc = await InstitutionModel.findOne({ code: code.toUpperCase(), deletedAt: null })
    .select('_id')
    .lean()
    .exec();
  return Boolean(doc);
}

function baseCodeFromName(name: string, slug: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w));
  if (words.length >= 2) {
    const acronym = words
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').charAt(0))
      .join('')
      .toUpperCase();
    if (acronym.length >= 2) {
      return acronym.slice(0, 32);
    }
  }
  const fromSlug = slug.replace(/-/g, '_').toUpperCase().slice(0, 32);
  return fromSlug.length >= 2 ? fromSlug : 'INST';
}

async function ensureUniqueInstitutionCode(base: string): Promise<string> {
  let code = base
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_')
    .slice(0, 32);
  if (code.length < 2) code = 'INST';

  let suffix = 0;
  while (await institutionCodeExists(code)) {
    suffix += 1;
    const tail = String(suffix);
    code = `${code.slice(0, Math.max(2, 32 - tail.length - 1))}_${tail}`;
  }
  return code;
}

/** Derives unique public slug + institution code from the campus name (optional overrides). */
export async function resolveProvisionIdentifiers(
  institutionName: string,
  overrides?: { slug?: string; code?: string },
): Promise<{ slug: string; code: string }> {
  const trimmedSlug = overrides?.slug?.trim().toLowerCase();
  const baseSlug =
    trimmedSlug ||
    generateSlug(institutionName).slice(0, 48) ||
    'campus';
  const slug = await ensureUniqueSlug(baseSlug, institutionSlugExists);

  const baseCode = overrides?.code?.trim().toUpperCase() || baseCodeFromName(institutionName, slug);
  const code = await ensureUniqueInstitutionCode(baseCode);

  return { slug, code };
}
