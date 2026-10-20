import type { ReactNode } from 'react';
import { DashboardLayoutDynamic } from '@/components/shared/dashboard-layout-dynamic';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutDynamic>{children}</DashboardLayoutDynamic>;
}
