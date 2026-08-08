export const REPORT_EXPORT_FORMATS = ['csv', 'excel', 'pdf'] as const;
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export const REPORT_SCOPES = ['institution', 'faculty', 'student'] as const;
export type ReportScope = (typeof REPORT_SCOPES)[number];
