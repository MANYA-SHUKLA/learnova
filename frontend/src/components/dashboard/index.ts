/**
 * Dashboard template system — institution dashboard is the reference layout.
 *
 * Contract:
 * - DashboardPage → page-shell rhythm (32px / space-y-8)
 * - PageHeader (@learnova/ui) → title block with optional eyebrow + actions
 * - StatGrid + StatCard → KPI row
 * - DashboardHeroCard / DashboardAnalyticsGrid → hero + two-column analytics
 * - DashboardSection + DashboardQuickActionGrid → below-the-fold shortcuts
 *
 * Faculty/student home pages reuse DashboardPage + dashboard-panels task lists.
 */

export {
  DASHBOARD_CHART_COLORS,
  DASHBOARD_CHART_TOOLTIP,
  DashboardAnalyticsGrid,
  DashboardCapacityMetric,
  DashboardHeroCard,
  DashboardInsightRow,
  DashboardPage,
  DashboardPanelCard,
  DashboardPanelEmpty,
  DashboardPanelLink,
  DashboardProgressMetric,
  DashboardQuickActionGrid,
  DashboardSection,
  dashboardFadeUp,
} from './dashboard-template';

export {
  DashboardPanel,
  DashboardQuickActions,
  DashboardTaskList,
  type DashboardTaskItem,
} from './dashboard-panels';
