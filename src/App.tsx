import React from 'react';
import { FestProvider, useFest, PortalType } from './context/FestContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { SuperAdminLayout } from './components/superAdmin/SuperAdminLayout';
import { SuperAdminRouter } from './pages/superAdmin/SuperAdminRouter';
import { TeamLeaderLayout } from './components/teamLeader/TeamLeaderLayout';
import { TeamLeaderRouter } from './pages/teamLeader/TeamLeaderRouter';
import { ParticipantLayout } from './components/participant/ParticipantLayout';
import { ParticipantRouter } from './pages/participant/ParticipantRouter';
import { DashboardPage } from './pages/DashboardPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { JudgesPage } from './pages/JudgesPage';
import { ProgrammesPage } from './pages/ProgrammesPage';
import { ScoresPage } from './pages/ScoresPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamLeadersPage } from './pages/TeamLeadersPage';
import { SchedulePage } from './pages/SchedulePage';
import { UsersPage } from './pages/UsersPage';
import { PublicPage } from './pages/PublicPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ComplaintsManagementPage } from './pages/ComplaintsManagementPage';
import { PublicPageManagement } from './pages/admin/PublicPageManagement';
import { ShareFestPage } from './pages/admin/ShareFestPage';

const AppContent: React.FC = () => {
  const { activeTab, currentPortal } = useFest();

  // If visitor is on public portal
  if (currentPortal === 'public') {
    return <PublicPage />;
  }

  // If on Super Admin Portal (Platform level control)
  if (currentPortal === 'super_admin') {
    return (
      <SuperAdminLayout>
        <SuperAdminRouter />
      </SuperAdminLayout>
    );
  }

  // If on Team Leader Portal
  if (currentPortal === 'team_leader') {
    return (
      <TeamLeaderLayout>
        <TeamLeaderRouter />
      </TeamLeaderLayout>
    );
  }

  // If on Participant Portal
  if (currentPortal === 'participant') {
    return (
      <ParticipantLayout>
        <ParticipantRouter />
      </ParticipantLayout>
    );
  }

  // Otherwise render Fest Admin Panel Layout
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'participants':
        return <ParticipantsPage />;
      case 'judges':
        return <JudgesPage />;
      case 'programmes':
        return <ProgrammesPage />;
      case 'scores':
        return <ScoresPage />;
      case 'teams':
        return <TeamsPage />;
      case 'team_leaders':
        return <TeamLeadersPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'users':
        return <UsersPage />;
      case 'complaints':
        return <ComplaintsManagementPage />;
      case 'public':
        return <PublicPageManagement />;
      case 'share_fest':
        return <ShareFestPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AdminLayout>{renderActiveTabContent()}</AdminLayout>;
};

export default function App({ initialTab }: { initialTab?: any }) {
  return (
    <FestProvider initialTab={initialTab}>
      <AppContent />
    </FestProvider>
  );
}

