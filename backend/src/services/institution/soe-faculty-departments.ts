import { Types } from 'mongoose';
import { DepartmentModel, FacultyModel } from '../../models/index.js';
import { SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES } from './soe-org-filters.js';

/** Align faculty with SOE B.Tech-only org (same as prune-minimal-org-structure). */
export async function reassignFacultyFromExcludedSoeDepartments(
  institutionId: string,
): Promise<void> {
  const institutionOid = new Types.ObjectId(institutionId);
  const cseDept = await DepartmentModel.findOne({
    institutionId: institutionOid,
    code: 'CSE',
    deletedAt: null,
  })
    .select('_id')
    .lean()
    .exec();
  if (!cseDept) return;

  const excluded = await DepartmentModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    code: { $in: [...SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES] },
  })
    .select('_id code')
    .lean()
    .exec();

  for (const dept of excluded) {
    if (dept.code?.toUpperCase() !== 'MATH') continue;
    await FacultyModel.updateMany(
      { institutionId: institutionOid, departmentId: dept._id, deletedAt: null },
      { $set: { departmentId: cseDept._id } },
    ).exec();
  }
}

export function isExcludedSoeDepartmentCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES.includes(
    code.trim().toUpperCase() as (typeof SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES)[number],
  );
}
