import React from 'react';
import { useFest } from '../../context/FestContext';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
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

  const renderContent = () => {
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
      case 'users' as any:
        return <PlatformUsersPage />;
      case 'platform_participants':
      case 'participants' as any:
        return <PlatformParticipantsPage />;
      case 'platform_programmes':
      case 'programmes' as any:
        return <PlatformProgrammesPage />;
      case 'platform_scores':
      case 'scores' as any:
        return <PlatformScoresPage />;
      case 'platform_schedule':
      case 'schedule' as any:
        return <PlatformSchedulePage />;
      case 'platform_reports':
      case 'reports' as any:
        return <PlatformReportsPage />;
      case 'platform_notifications':
      case 'notifications' as any:
        return <PlatformNotificationsPage />;
      case 'platform_audit_logs':
      case 'audit_logs' as any:
        return <PlatformAuditLogsPage />;
      case 'platform_settings':
      case 'settings' as any:
        return <PlatformSettingsPage />;
      case 'security_permissions':
        return <SecurityPermissionsPage />;
      case 'help_support':
        return <HelpSupportPage />;
      default:
        return <SuperDashboardPage />;
    }
  };

  return (
    <ErrorBoundary fallbackTitle={`Error rendering ${superAdminTab.replace('_', ' ')}`}>
      {renderContent()}
    </ErrorBoundary>
  );
};
