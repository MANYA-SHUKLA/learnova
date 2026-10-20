'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CourseListParams } from '@/features/course';
import { useCourseList } from '@/features/course';
import type { FacultyListParams } from '@/features/faculty';
import { useFacultyList } from '@/features/faculty';
import type { OrgListParams } from '@/features/institution';
import {
  useAcademicYears,
  useBatches,
  useCampuses,
  useDepartments,
  usePrograms,
  useSchools,
  useSections,
  useSemesters,
} from '@/features/institution';
import type { StudentListParams } from '@/features/student';
import { useStudentList } from '@/features/student';
import {
  SearchableSelect,
  type SearchableSelectOption,
  type SearchableSelectProps,
} from './searchable-select';
import { SearchableMultiSelect } from './searchable-multi-select';

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

const DEFAULT_LIST_LIMIT = 25;

function useDebouncedSearch(delay = 300) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => { setDebounced(search.trim()); }, delay);
    return () => { clearTimeout(id); };
  }, [search, delay]);
  return { search, setSearch, debouncedQuery: debounced || undefined };
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
  placeholder = 'Select a course',
  emptyMessage = 'No courses found.',
  ...props
}: CourseSelectProps & { value: string; onChange: (value: string) => void }) {
  const { search, setSearch, debouncedQuery } = useDebouncedSearch();
  const query = useCourseList(
    {
      page: 1,
      limit,
      sortBy: 'title',
      sortOrder: 'asc',
      includeDeleted: false,
      q: debouncedQuery,
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
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      searchPlaceholder="Search courses…"
      searchQuery={search}
      onSearchQueryChange={setSearch}
      serverSideSearch
    />
  );
}

export function StudentSelect({
  label = 'Student',
  listParams,
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  ...props
}: PersonSelectProps & { value: string; onChange: (value: string) => void }) {
  const { search, setSearch, debouncedQuery } = useDebouncedSearch();
  const query = useStudentList(
    {
      page: 1,
      limit,
      sortBy: 'fullName',
      sortOrder: 'asc',
      includeDeleted: false,
      q: debouncedQuery,
      ...(listParams as StudentListParams | undefined),
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
      searchQuery={search}
      onSearchQueryChange={setSearch}
      serverSideSearch
    />
  );
}

export function FacultySelect({
  label = 'Faculty',
  listParams,
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  ...props
}: PersonSelectProps & { value: string; onChange: (value: string) => void }) {
  const { search, setSearch, debouncedQuery } = useDebouncedSearch();
  const query = useFacultyList(
    {
      page: 1,
      limit,
      sortBy: 'fullName',
      sortOrder: 'asc',
      includeDeleted: false,
      q: debouncedQuery,
      ...(listParams as FacultyListParams | undefined),
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
      searchQuery={search}
      onSearchQueryChange={setSearch}
      serverSideSearch
    />
  );
}

export function DepartmentSelect({
  label = 'Department',
  listParams,
  limit = DEFAULT_LIST_LIMIT,
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
  btechOnly = false,
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  ...props
}: EntitySelectProps & {
  value: string;
  onChange: (value: string) => void;
  /** Hide M.Tech / Ph.D — B.Tech CSE & ECE only */
  btechOnly?: boolean;
}) {
  const query = usePrograms({
    page: 1,
    limit: btechOnly ? 100 : limit,
    status: btechOnly ? 'active' : undefined,
    btechOnly: btechOnly ? true : undefined,
    ...listParams,
  });
  const options = useMemo(() => {
    const items = (query.data?.items ?? []).filter(
      (program) => !btechOnly || program.code.startsWith('BT-'),
    );
    return items.map((program) => ({
      value: program.id,
      label: `${program.code} — ${program.name}`,
    }));
  }, [btechOnly, query.data?.items]);

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

export function CampusSelect({
  label = 'Campus',
  listParams,
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  ...props
}: EntitySelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useCampuses({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (campus) => ({
    value: campus.id,
    label: `${campus.code} — ${campus.name}`,
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
      emptyLabel="No campus"
      placeholder="Select a campus"
      searchPlaceholder="Search campuses…"
    />
  );
}

export function SchoolSelect({
  label = 'School',
  listParams,
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  ...props
}: EntitySelectProps & { value: string; onChange: (value: string) => void }) {
  const query = useSchools({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (school) => ({
    value: school.id,
    label: `${school.code} — ${school.name}`,
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
      emptyLabel="No school"
      placeholder="Select a school"
      searchPlaceholder="Search schools…"
    />
  );
}

export function AcademicYearSelect({
  label = 'Academic year',
  listParams,
  limit = DEFAULT_LIST_LIMIT,
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
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  allowEmpty = true,
  emptyLabel = 'No semester',
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
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      placeholder="Select a semester"
      searchPlaceholder="Search semesters…"
    />
  );
}

export function BatchSelect({
  label = 'Batch',
  listParams,
  programId,
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  disabled,
  ...props
}: EntitySelectProps & {
  value: string;
  onChange: (value: string) => void;
  programId?: string;
}) {
  const mergedParams = useMemo(
    () => ({
      ...listParams,
      ...(programId?.trim()
        ? { programId: programId.trim(), status: 'active' as const }
        : {}),
    }),
    [listParams, programId],
  );
  const query = useBatches({ page: 1, limit, ...mergedParams });
  const options = useListOptions(query.data?.items, (batch) => ({
    value: batch.id,
    label: batch.name,
  }));

  return (
    <SearchableSelect
      {...props}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      disabled={disabled}
      allowEmpty
      emptyLabel="No batch"
      placeholder="Select a batch"
      searchPlaceholder="Search batches…"
    />
  );
}

export function SectionSelect({
  label = 'Section',
  listParams,
  programId,
  semesterId,
  limit = DEFAULT_LIST_LIMIT,
  value,
  onChange,
  disabled,
  ...props
}: EntitySelectProps & {
  value: string;
  onChange: (value: string) => void;
  /** When set, only sections for this degree program (e.g. B.Tech CSE) are listed. */
  programId?: string;
  /** When set, only sections for this semester term are listed. */
  semesterId?: string;
}) {
  const scoped = programId !== undefined || semesterId !== undefined;
  const missingScope = scoped && (!programId?.trim() || !semesterId?.trim());

  const mergedParams = useMemo(
    () => ({
      ...listParams,
      ...(programId?.trim() ? { programId: programId.trim() } : {}),
      ...(semesterId?.trim() ? { semesterId: semesterId.trim() } : {}),
      ...(scoped ? { status: 'active' as const } : {}),
    }),
    [listParams, programId, semesterId, scoped],
  );

  const query = useSections(
    { page: 1, limit: scoped ? 100 : limit, ...mergedParams },
    !missingScope,
  );
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
      disabled={disabled || missingScope}
      allowEmpty
      emptyLabel="No section"
      placeholder={
        missingScope ? 'Choose program and semester first' : 'Select a section'
      }
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
  limit = DEFAULT_LIST_LIMIT,
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
  limit = DEFAULT_LIST_LIMIT,
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

interface OrgMultiSelectProps extends OmitSelectProps {
  label?: string;
  listParams?: OrgListParams;
  values: string[];
  onChange: (values: string[]) => void;
  limit?: number;
}

export function ProgramMultiSelect({
  label = 'Programs',
  listParams,
  values,
  onChange,
  limit = DEFAULT_LIST_LIMIT,
  ...props
}: OrgMultiSelectProps) {
  const query = usePrograms({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (program) => ({
    value: program.id,
    label: `${program.code} — ${program.name}`,
  }));

  return (
    <SearchableMultiSelect
      {...props}
      label={label}
      values={values}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      emptyMessage="No programs found."
      searchPlaceholder="Search programs…"
    />
  );
}

export function SemesterMultiSelect({
  label = 'Semesters',
  listParams,
  values,
  onChange,
  limit = DEFAULT_LIST_LIMIT,
  ...props
}: OrgMultiSelectProps) {
  const query = useSemesters({ page: 1, limit, ...listParams });
  const options = useListOptions(query.data?.items, (semester) => ({
    value: semester.id,
    label: semester.name,
  }));

  return (
    <SearchableMultiSelect
      {...props}
      label={label}
      values={values}
      onChange={onChange}
      options={options}
      loading={query.isLoading}
      emptyMessage="No semesters found."
      searchPlaceholder="Search semesters…"
    />
  );
}
