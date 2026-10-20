import type {
  ConfirmDemoRequestInput,
  CreateDemoRequestInput,
  DeclineDemoRequestInput,
  DemoRequestListQuery,
} from '@learnova/validation';
import { Types } from 'mongoose';
import { DemoRequestModel } from '../../models/demo-request.model.js';
import { NotFoundError, ValidationError } from '../../utils/errors/index.js';
import {
  sendDemoConfirmedEmails,
  sendDemoDeclinedEmail,
  sendDemoRequestAckEmail,
  sendDemoRequestSuperAdminNotifyEmail,
} from '../../mail/demo-request-email.js';
import type { ActorContext } from '../institution/institution.service.js';

function toDto(doc: {
  _id: Types.ObjectId;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  message?: string | null;
  status: string;
  confirmedAt?: Date | null;
  meetingAt?: Date | null;
  meetingNotes?: string | null;
  institutionId?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    institutionName: doc.institutionName,
    contactName: doc.contactName,
    contactEmail: doc.contactEmail,
    phone: doc.phone,
    message: doc.message ?? null,
    status: doc.status,
    confirmedAt: doc.confirmedAt?.toISOString?.() ?? null,
    meetingAt: doc.meetingAt?.toISOString?.() ?? null,
    meetingNotes: doc.meetingNotes ?? null,
    institutionId: doc.institutionId ? String(doc.institutionId) : null,
    createdAt: doc.createdAt?.toISOString?.() ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export class DemoRequestService {
  async createPublic(input: CreateDemoRequestInput) {
    const doc = await DemoRequestModel.create({
      ...input,
      status: 'pending',
    });
    void sendDemoRequestAckEmail({
      to: input.contactEmail,
      contactName: input.contactName,
      institutionName: input.institutionName,
    });
    void sendDemoRequestSuperAdminNotifyEmail({
      institutionName: input.institutionName,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      phone: input.phone,
      message: input.message ?? null,
      requestId: String(doc._id),
    });
    return toDto(doc);
  }

  async list(query: DemoRequestListQuery, actor: ActorContext) {
    if (actor.role !== 'super_admin') {
      throw new ValidationError('Only super admin can list demo requests');
    }
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      DemoRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      DemoRequestModel.countDocuments(filter),
    ]);
    return { items: items.map((d) => toDto(d)), meta: pageMeta(total, page, limit) };
  }

  async getById(id: string, actor: ActorContext) {
    if (actor.role !== 'super_admin') {
      throw new ValidationError('Only super admin can view demo requests');
    }
    const doc = await DemoRequestModel.findById(id).exec();
    if (!doc) throw new NotFoundError('Demo request not found');
    return toDto(doc);
  }

  async confirm(id: string, input: ConfirmDemoRequestInput, actor: ActorContext) {
    if (actor.role !== 'super_admin') {
      throw new ValidationError('Only super admin can confirm demo requests');
    }
    const doc = await DemoRequestModel.findById(id).exec();
    if (!doc) throw new NotFoundError('Demo request not found');
    if (doc.status !== 'pending') {
      throw new ValidationError('Only pending requests can be confirmed');
    }
    const meetingAt = new Date(input.meetingAt);
    doc.status = 'confirmed';
    doc.confirmedAt = new Date();
    doc.meetingAt = meetingAt;
    doc.meetingNotes = input.meetingNotes ?? null;
    await doc.save();
    void sendDemoConfirmedEmails({
      requesterEmail: doc.contactEmail,
      contactName: doc.contactName,
      institutionName: doc.institutionName,
      meetingAt,
      meetingNotes: doc.meetingNotes,
    });
    return toDto(doc);
  }

  async decline(id: string, input: DeclineDemoRequestInput, actor: ActorContext) {
    if (actor.role !== 'super_admin') {
      throw new ValidationError('Only super admin can decline demo requests');
    }
    const doc = await DemoRequestModel.findById(id).exec();
    if (!doc) throw new NotFoundError('Demo request not found');
    if (doc.status !== 'pending') {
      throw new ValidationError('Only pending requests can be declined');
    }
    doc.status = 'declined';
    doc.declinedAt = new Date();
    doc.declineReason = input.reason ?? null;
    await doc.save();
    void sendDemoDeclinedEmail({
      to: doc.contactEmail,
      contactName: doc.contactName,
      reason: doc.declineReason,
    });
    return toDto(doc);
  }

  async markProvisioned(id: string, institutionId: string, actor: ActorContext) {
    if (actor.role !== 'super_admin') {
      throw new ValidationError('Only super admin can update demo requests');
    }
    const doc = await DemoRequestModel.findById(id).exec();
    if (!doc) throw new NotFoundError('Demo request not found');
    doc.status = 'provisioned';
    doc.institutionId = new Types.ObjectId(institutionId);
    await doc.save();
    return toDto(doc);
  }
}

export const demoRequestService = new DemoRequestService();
