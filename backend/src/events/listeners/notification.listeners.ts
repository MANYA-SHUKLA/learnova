import { EVENTS } from '@learnova/events';
import { notificationService } from '../../services/notification/notification.service.js';
import { logger } from '../../utils/logger/index.js';
import { eventBus } from '../event-bus.js';

export function registerNotificationListeners(): void {
  eventBus.on(EVENTS.EXAM_SCHEDULED, async (event) => {
    try {
      await notificationService.onExamScheduled(
        event.payload as { examId: string; institutionId?: string },
      );
    } catch (err) {
      logger.warn({ err, event: EVENTS.EXAM_SCHEDULED }, 'Exam scheduled notification failed');
    }
  });

  eventBus.on(EVENTS.GRADE_PUBLISHED, async (event) => {
    try {
      await notificationService.onGradePublished(
        event.payload as { courseId: string; institutionId: string },
      );
    } catch (err) {
      logger.warn({ err, event: EVENTS.GRADE_PUBLISHED }, 'Grade published notification failed');
    }
  });

  eventBus.on(EVENTS.CERTIFICATE_ISSUED, async (event) => {
    try {
      const payload = event.payload as { certificateId: string; userId: string };
      await notificationService.onCertificateIssued({
        certificateId: payload.certificateId,
        userId: payload.userId,
      });
    } catch (err) {
      logger.warn({ err, event: EVENTS.CERTIFICATE_ISSUED }, 'Certificate notification failed');
    }
  });

  logger.info('Notification event listeners registered');
}

export function startDueReminderScheduler(): void {
  const run = () => {
    void notificationService.sendDueReminders().catch((err) => {
      logger.warn({ err }, 'Due reminder scan failed');
    });
  };
  run();
  setInterval(run, 6 * 60 * 60 * 1000);
  logger.info('Due reminder scheduler started (every 6h)');
}
