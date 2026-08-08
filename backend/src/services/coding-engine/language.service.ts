import {
  JUDGE0_LANGUAGE_IDS,
  PRACTICE_LANGUAGE_META,
  PRACTICE_LANGUAGES,
} from '@learnova/constants';
import type { PracticeLanguage } from '@learnova/types';
import { LanguageModel } from '../../models/language.model.js';

/**
 * Language catalog for the coding engine (Judge0 ids + Monaco ids + boilerplates).
 * Shared by Practice Labs and future Coding Exams.
 */
export class CodingLanguageService {
  async ensureCatalogSeeded(): Promise<void> {
    const count = await LanguageModel.countDocuments();
    if (count > 0) return;
    await this.upsertCatalog();
  }

  async upsertCatalog(): Promise<void> {
    for (const [order, key] of PRACTICE_LANGUAGES.entries()) {
      await LanguageModel.findOneAndUpdate(
        { key },
        {
          $set: {
            key,
            name: PRACTICE_LANGUAGE_META[key].name,
            judge0Id: JUDGE0_LANGUAGE_IDS[key],
            monacoLanguage: PRACTICE_LANGUAGE_META[key].monacoLanguage,
            version: PRACTICE_LANGUAGE_META[key].version,
            enabled: true,
            order,
          },
        },
        { upsert: true },
      );
    }
  }

  async listEnabled() {
    await this.ensureCatalogSeeded();
    const langs = await LanguageModel.find({ enabled: true }).sort({ order: 1 }).exec();
    return langs.map((l) => ({
      id: String(l._id),
      key: l.key as PracticeLanguage,
      name: l.name,
      judge0Id: l.judge0Id,
      monacoLanguage: l.monacoLanguage,
      version: l.version ?? null,
      enabled: l.enabled,
      order: l.order,
    }));
  }

  isSupported(language: string): language is PracticeLanguage {
    return (PRACTICE_LANGUAGES as readonly string[]).includes(language);
  }

  judge0Id(language: PracticeLanguage): number {
    return JUDGE0_LANGUAGE_IDS[language];
  }

  boilerplate(language: PracticeLanguage): string {
    return PRACTICE_LANGUAGE_META[language].defaultBoilerplate;
  }

  boilerplates(languages: PracticeLanguage[]) {
    return languages.map((language) => ({
      language,
      code: this.boilerplate(language),
    }));
  }

  meta(language: PracticeLanguage) {
    return PRACTICE_LANGUAGE_META[language];
  }
}

export const codingLanguageService = new CodingLanguageService();
