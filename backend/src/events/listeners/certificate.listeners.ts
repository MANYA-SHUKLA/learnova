import { EVENTS } from '@learnova/events';
import { InstitutionSettingsModel } from '../../models/institution-settings.model.js';
import { certificateService } from '../../services/certificate/certificate.service.js';
import { logger } from '../../utils/logger/index.js';
import { eventBus } from '../event-bus.js';

interface AutoIssueSettings {
  autoIssueCourseCompletion?: boolean;
  publishOnAutoIssue?: boolean;
}

function readAutoIssueSettings(raw: unknown): AutoIssueSettings {
  if (!raw || typeof raw !== 'object') return {};
  const settings = raw as Record<string, unknown>;
  const autoIssue = settings['autoIssue'];
  if (autoIssue && typeof autoIssue === 'object') {
    const nested = autoIssue as Record<string, unknown>;
    return {
      autoIssueCourseCompletion: nested['courseCompletion'] === true,
      publishOnAutoIssue: nested['publishOnIssue'] !== false,
    };
  }
  return {
    autoIssueCourseCompletion: settings['autoIssueCourseCompletion'] === true,
    publishOnAutoIssue: settings['publishOnAutoIssue'] !== false,
  };
}

/**
 * Auto-issue course completion certificates when grades are published.
 * Controlled by institution `certificateSettings.autoIssue`.
 */
export function registerCertificateListeners(): void {
  eventBus.on(EVENTS.GRADE_PUBLISHED, async (event) => {
    const payload = event.payload as {
      courseId: string;
      institutionId: string;
      count?: number;
    };
    const { courseId, institutionId } = payload;
    if (!courseId || !institutionId) return;

    try {
      const settingsDoc = await InstitutionSettingsModel.findOne({
        institutionId,
      })
        .select('certificateSettings')
        .lean()
        .exec();
      const autoIssue = readAutoIssueSettings(settingsDoc?.certificateSettings);
      if (!autoIssue.autoIssueCourseCompletion) return;

      const actor = {
        userId: event.actorId ?? 'system',
        email: 'system@learnova.internal',
        institutionId,
        role: 'institution_admin',
      };

      const result = await certificateService.bulkIssueCourseCertificates(
        {
          action: 'issue',
          documentType: 'course_completion',
          courseId,
          publish: autoIssue.publishOnAutoIssue ?? true,
        },
        actor,
      );

      logger.info(
        {
          courseId,
          institutionId,
          issued: result.issued ?? 0,
        },
        'Auto-issued course completion certificates after grade publish',
      );
    } catch (err) {
      logger.warn({ err, courseId, institutionId }, 'Auto-issue certificates skipped');
    }
  });

  logger.info('Certificate event listeners registered');
}
