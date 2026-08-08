'use client';

import { useMemo } from 'react';
import type { CourseListParams } from '@/features/course';
import { useCourseList } from '@/features/course';
import type { FacultyListParams } from '@/features/faculty';
import { useFacultyList } from '@/features/faculty';
import type { OrgListParams } from '@/features/institution';
import {
  useAcademicYears,
  useDepartments,
  usePrograms,
  useSections,
  useSemesters,
} from '@/features/institution';
import type { StudentListParams } from '@/features/student';
import { useStudentList } from '@/features/student';
import {
  SearchableMultiSelect,
  SearchableSelect,
  type SearchableSelectOption,
  type SearchableSelectProps,
} from './searchable-select';

type OmitSelectProps = Omit<
  SearchableSelectProps,
  'options' | 'loading' | 'onChange' | 'value' | 'label'
>;

interface EntitySelectProps extends OmitSelectProps {
  label?: string;
  listParams?: OrgListParams;
  limit?: number;
}

interface CourseSelectProps extends OmitSelectProps {
  label?: string;
  listParams?: CourseListParams;
  excludeIds?: string[];
  limit?: number;
}

interface PersonSelectProps extends OmitSelectProps {
  label?: string;
  listParams?: StudentListParams | FacultyListParams;
  limit?: number;
}

function useListOptions<T extends { id: string }>(
  items: T[] | undefined,
  toOption: (item: T) => SearchableSelectOption,
  excludeIds?: string[],
) {
  return useMemo(() => {
    const excluded = new Set(excludeIds ?? []);
    return (items ?? [])
      .filter((item) => !excluded.has(item.id))
      .map(toOption);
  }, [excludeIds, items, toOption]);
}

export function CourseSelect({
  label = 'Course',
  listParams,
  excludeIds,
  limit = 100,
  value,
  onChange,
  ...props
}: CourseSelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useCourseList(
    {
      page: 1,
      limit,
      sortBy: 'title',
      sortOrder: 'asc',
      includeDeleted: false,
      ...listParams,
    },
    true,
  );

  const options = useListOptions(
    query.data?.items,
    (course) => ({
      value: course.id,
      label: `${course.courseCode} — ${course.title}`,
    }),
    excludeIds,
  );

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      placeholder="Select a course"
      emptyMessage="No courses found."
      searchPlaceholder="Search courses…"
    />
  );
}

export function StudentSelect({
  label = 'Student',
  listParams,
  limit = 100,
  value,
  onChange,
  ...props
}: PersonSelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useStudentList(
    {
      page: 1,
      limit,
      sortBy: 'fullName',
      sortOrder: 'asc',
      includeDeleted: false,
      ...listParams,
    },
    true,
  );

  const options = useListOptions(query.data?.items, (student) => ({
    value: student.id,
    label: `${student.fullName} (${student.studentId})`,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      placeholder="Select a student"
      emptyMessage="No students found."
      searchPlaceholder="Search students…"
    />
  );
}

export function FacultySelect({
  label = 'Faculty',
  listParams,
  limit = 100,
  value,
  onChange,
  ...props
}: PersonSelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useFacultyList(
    {
      page: 1,
      limit,
      sortBy: 'fullName',
      sortOrder: 'asc',
      includeDeleted: false,
      ...listParams,
    },
    true,
  );

  const options = useListOptions(query.data?.items, (faculty) => ({
    value: faculty.id,
    label: `${faculty.fullName} (${faculty.facultyCode})`,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      placeholder="Select faculty"
      emptyMessage="No faculty found."
      searchPlaceholder="Search faculty…"
    />
  );
}

export function DepartmentSelect({
  label = 'Department',
  listParams,
  limit = 100,
  value,
  onChange,
  ...props
}: EntitySelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useDepartments({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (department) => ({
    value: department.id,
    label: `${department.code} — ${department.name}`,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      allowEmpty
      emptyLabel="No department"
      placeholder="Select a department"
      searchPlaceholder="Search departments…"
    />
  );
}

export function ProgramSelect({
  label = 'Program',
  listParams,
  limit = 100,
  value,
  onChange,
  ...props
}: EntitySelectProps & { value: string; onChange: (value: string) => void }) {
  const query = usePrograms({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (program) => ({
    value: program.id,
    label: `${program.code} — ${program.name}`,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      allowEmpty
      emptyLabel="No program"
      placeholder="Select a program"
      searchPlaceholder="Search programs…"
    />
  );
}

export function AcademicYearSelect({
  label = 'Academic year',
  listParams,
  limit = 100,
  value,
  onChange,
  ...props
}: EntitySelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useAcademicYears({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (year) => ({
    value: year.id,
    label: year.name,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      allowEmpty
      emptyLabel="No academic year"
      placeholder="Select an academic year"
      searchPlaceholder="Search academic years…"
    />
  );
}

export function SemesterSelect({
  label = 'Semester',
  listParams,
  limit = 100,
  value,
  onChange,
  ...props
}: EntitySelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useSemesters({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (semester) => ({
    value: semester.id,
    label: semester.name,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      allowEmpty
      emptyLabel="No semester"
      placeholder="Select a semester"
      searchPlaceholder="Search semesters…"
    />
  );
}

export function SectionSelect({
  label = 'Section',
  listParams,
  limit = 100,
  value,
  onChange,
  ...props
}: EntitySelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useSections({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (section) => ({
    value: section.id,
    label: section.name,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      allowEmpty
      emptyLabel="No section"
      placeholder="Select a section"
      searchPlaceholder="Search sections…"
    />
  );
}

interface CourseMultiSelectProps extends OmitSelectProps {
  label?: string;
  listParams?: CourseListParams;
  values: string[];
  onChange: (values: string[]) => void;
  limit?: number;
}

export function CourseMultiSelect({
  label = 'Courses',
  listParams,
  values,
  onChange,
  limit = 100,
  ...props
}: CourseMultiSelectProps) {
  const query = useCourseList(
    {
      page: 1,
      limit,
      sortBy: 'title',
      sortOrder: 'asc',
      includeDeleted: false,
      ...listParams,
    },
    true,
  );

  const options = useListOptions(query.data?.items, (course) => ({
    value: course.id,
    label: `${course.courseCode} — ${course.title}`,
  }));

  return (
    <SearchableMultiSelect
      {...props}
      label={label}
      values={values}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      emptyMessage="No courses found."
      searchPlaceholder="Search courses…"
    />
  );
}

interface FacultyMultiSelectProps extends OmitSelectProps {
  label?: string;
  listParams?: FacultyListParams;
  values: string[];
  onChange: (values: string[]) => void;
  limit?: number;
}

export function FacultyMultiSelect({
  label = 'Faculty',
  listParams,
  values,
  onChange,
  limit = 100,
  ...props
}: FacultyMultiSelectProps) {
  const query = useFacultyList(
    {
      page: 1,
      limit,
      sortBy: 'fullName',
      sortOrder: 'asc',
      includeDeleted: false,
      ...listParams,
    },
    true,
  );

  const options = useListOptions(query.data?.items, (faculty) => ({
    value: faculty.id,
    label: `${faculty.fullName} (${faculty.facultyCode})`,
  }));

  return (
    <SearchableMultiSelect
      {...props}
      label={label}
      values={values}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      emptyMessage="No faculty found."
      searchPlaceholder="Search faculty…"
    />
  );
}
