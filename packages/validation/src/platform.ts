import { z } from 'zod';
import { PAGINATION, REGEX } from '@learnova/constants';
const emailSchema = z.string().email().toLowerCase().trim();
const slugSchema = z.string().regex(REGEX.SLUG, 'Invalid slug');

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const createDemoRequestSchema = z.object({
  institutionName: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: emailSchema,
  phone: z.string().trim().min(6).max(30),
  message: z.string().trim().max(2000).optional(),
});

export type CreateDemoRequestInput = z.infer<typeof createDemoRequestSchema>;

export const demoRequestListQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'declined', 'provisioned']).optional(),
});

export type DemoRequestListQuery = z.infer<typeof demoRequestListQuerySchema>;

export const confirmDemoRequestSchema = z.object({
  meetingAt: z.string().datetime({ offset: true }),
  meetingNotes: z.string().trim().max(2000).optional(),
});

export type ConfirmDemoRequestInput = z.infer<typeof confirmDemoRequestSchema>;

export const declineDemoRequestSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export type DeclineDemoRequestInput = z.infer<typeof declineDemoRequestSchema>;

export const provisionCampusSchema = z.object({
  institutionName: z.string().trim().min(2).max(200),
  slug: slugSchema,
  code: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid institution code'),
  contactEmail: emailSchema,
  phone: z.string().trim().min(6).max(30).optional(),
  adminFirstName: z.string().trim().min(1).max(80),
  adminLastName: z.string().trim().min(1).max(80),
  adminEmail: emailSchema,
  initialPassword: z.string().min(8).max(128),
  demoRequestId: z.string().optional(),
});

export type ProvisionCampusInput = z.infer<typeof provisionCampusSchema>;

export const resendAdminCredentialsSchema = z.object({
  rotatePassword: z.boolean().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export type ResendAdminCredentialsInput = z.infer<typeof resendAdminCredentialsSchema>;

const marketingSectionSchema = z.object({
  title: z.string().trim().max(200),
  body: z.string().trim().max(5000),
});

export const platformMarketingSchema = z.object({
  heroTitle: z.string().trim().min(1).max(200),
  heroSubtitle: z.string().trim().max(500),
  heroCtaLabel: z.string().trim().max(80).optional(),
  features: z.array(marketingSectionSchema).max(24).default([]),
  pricingTitle: z.string().trim().max(200).optional(),
  pricingBody: z.string().trim().max(8000).optional(),
  faq: z.array(marketingSectionSchema).max(24).default([]),
  footerNote: z.string().trim().max(500).optional(),
});

export type PlatformMarketingInput = z.infer<typeof platformMarketingSchema>;

export const updatePortalSettingsSchema = z.object({
  portalTitle: z.string().trim().max(200).nullable().optional(),
  portalSubtitle: z.string().trim().max(500).nullable().optional(),
  termLabel: z.string().trim().max(120).nullable().optional(),
  notices: z.array(z.string().trim().max(500)).max(20).optional(),
  supportEmail: emailSchema.nullable().optional(),
  officeLabel: z.string().trim().max(200).nullable().optional(),
  officialCredit: z.string().trim().max(500).nullable().optional(),
  developerCredit: z.string().trim().max(500).nullable().optional(),
  showPlatformLink: z.boolean().optional(),
});

export type UpdatePortalSettingsInput = z.infer<typeof updatePortalSettingsSchema>;

export const publicPortalQuerySchema = z.object({
  slug: slugSchema.optional(),
});
