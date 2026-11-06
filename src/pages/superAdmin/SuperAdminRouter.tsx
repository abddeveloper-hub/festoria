import React from 'react';
import { useFest } from '../../context/FestContext';
import { SuperDashboardPage } from './SuperDashboardPage';
import { FestRequestsPage } from './FestRequestsPage';
import { AllFestsPage } from './AllFestsPage';
import { FestMonitoringPage } from './FestMonitoringPage';
import { AdminManagementPage } from './AdminManagementPage';
import { PlatformUsersPage } from './PlatformUsersPage';
import { PlatformParticipantsPage } from './PlatformParticipantsPage';
import { PlatformProgrammesPage } from './PlatformProgrammesPage';
import { PlatformScoresPage } from './PlatformScoresPage';
import { PlatformSchedulePage } from './PlatformSchedulePage';
import { PlatformReportsPage } from './PlatformReportsPage';
import { PlatformNotificationsPage } from './PlatformNotificationsPage';
import { PlatformAuditLogsPage } from './PlatformAuditLogsPage';
import { PlatformSettingsPage } from './PlatformSettingsPage';
import { SecurityPermissionsPage } from './SecurityPermissionsPage';
import { HelpSupportPage } from './HelpSupportPage';

export const SuperAdminRouter: React.FC = () => {
  const { superAdminTab } = useFest();

  switch (superAdminTab) {
    case 'super_dashboard':
      return <SuperDashboardPage />;
    case 'fest_requests':
      return <FestRequestsPage />;
    case 'all_fests':
      return <AllFestsPage />;
    case 'fest_monitoring':
      return <FestMonitoringPage />;
    case 'admin_management':
      return <AdminManagementPage />;
    case 'platform_users':
      return <PlatformUsersPage />;
    case 'platform_participants':
      return <PlatformParticipantsPage />;
    case 'platform_programmes':
      return <PlatformProgrammesPage />;
    case 'platform_scores':
      return <PlatformScoresPage />;
    case 'platform_schedule':
      return <PlatformSchedulePage />;
    case 'platform_reports':
      return <PlatformReportsPage />;
    case 'platform_notifications':
      return <PlatformNotificationsPage />;
    case 'platform_audit_logs':
      return <PlatformAuditLogsPage />;
    case 'platform_settings':
      return <PlatformSettingsPage />;
    case 'security_permissions':
      return <SecurityPermissionsPage />;
    case 'help_support':
      return <HelpSupportPage />;
    default:
      return <SuperDashboardPage />;
  }
};
