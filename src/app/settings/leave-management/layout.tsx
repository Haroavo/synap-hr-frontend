import type { ReactNode } from "react";

import { LeavePolicyProvider } from "@/features/leave-settings/leave-policy-provider";

import {
  LeaveSettingsActions,
  LeaveSettingsHeader,
  LeaveSettingsMessages,
  LeaveSettingsNavigation,
} from "@/features/leave-settings/leave-settings-shell";

type LeaveManagementLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function LeaveManagementLayout({
  children,
}: LeaveManagementLayoutProps) {
  return (
    <LeavePolicyProvider>
      <div className="h-full overflow-y-auto p-4 sm:p-5 lg:p-7">
        <LeaveSettingsHeader />

        <LeaveSettingsNavigation />

        <LeaveSettingsMessages />

        <main>{children}</main>

        <LeaveSettingsActions />
      </div>
    </LeavePolicyProvider>
  );
}
