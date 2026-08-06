'use client';

import { FacultyForm } from '@/features/faculty/components/faculty-form';

export default function CreateFacultyPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Faculty</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Add faculty</h1>
      </div>
      <FacultyForm mode="create" />
    </div>
  );
}
