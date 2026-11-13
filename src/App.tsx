import React, { Suspense, lazy } from 'react';
import { FestProvider, useFest } from './context/FestContext';

// Portals & Layouts lazy loaded for optimal initial bundle size and rapid page load
const PublicPage = lazy(() => import('./pages/PublicPage').then((m) => ({ default: m.PublicPage })));

const SuperAdminLayout = lazy(() =>
  import('./components/superAdmin/SuperAdminLayout').then((m) => ({ default: m.SuperAdminLayout }))
);
const SuperAdminRouter = lazy(() =>
  import('./pages/superAdmin/SuperAdminRouter').then((m) => ({ default: m.SuperAdminRouter }))
);

const TeamLeaderLayout = lazy(() =>
  import('./components/teamLeader/TeamLeaderLayout').then((m) => ({ default: m.TeamLeaderLayout }))
);
const TeamLeaderRouter = lazy(() =>
  import('./pages/teamLeader/TeamLeaderRouter').then((m) => ({ default: m.TeamLeaderRouter }))
);

const ParticipantLayout = lazy(() =>
  import('./components/participant/ParticipantLayout').then((m) => ({ default: m.ParticipantLayout }))
);
const ParticipantRouter = lazy(() =>
  import('./pages/participant/ParticipantRouter').then((m) => ({ default: m.ParticipantRouter }))
);

const AdminLayout = lazy(() =>
  import('./components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);

// Admin Pages lazy loaded
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ParticipantsPage = lazy(() => import('./pages/ParticipantsPage').then((m) => ({ default: m.ParticipantsPage })));
const JudgesPage = lazy(() => import('./pages/JudgesPage').then((m) => ({ default: m.JudgesPage })));
const ProgrammesPage = lazy(() => import('./pages/ProgrammesPage').then((m) => ({ default: m.ProgrammesPage })));
const ScoresPage = lazy(() => import('./pages/ScoresPage').then((m) => ({ default: m.ScoresPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then((m) => ({ default: m.TeamsPage })));
const TeamLeadersPage = lazy(() => import('./pages/TeamLeadersPage').then((m) => ({ default: m.TeamLeadersPage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then((m) => ({ default: m.SchedulePage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const ComplaintsManagementPage = lazy(() =>
  import('./pages/ComplaintsManagementPage').then((m) => ({ default: m.ComplaintsManagementPage }))
);
const PublicPageManagement = lazy(() =>
  import('./pages/admin/PublicPageManagement').then((m) => ({ default: m.PublicPageManagement }))
);
const ShareFestPage = lazy(() =>
  import('./pages/admin/ShareFestPage').then((m) => ({ default: m.ShareFestPage }))
);
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const PortalLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
      <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading Festoria...</p>
  </div>
);

const AppContent: React.FC = () => {
  const { activeTab, currentPortal } = useFest();

  // If visitor is on public portal
  if (currentPortal === 'public') {
    return (
      <Suspense fallback={<PortalLoadingFallback />}>
        <PublicPage />
      </Suspense>
    );
  }

  // If on Super Admin Portal (Platform level control)
  if (currentPortal === 'super_admin') {
    return (
      <Suspense fallback={<PortalLoadingFallback />}>
        <SuperAdminLayout>
          <SuperAdminRouter />
        </SuperAdminLayout>
      </Suspense>
    );
  }

  // If on Team Leader Portal
  if (currentPortal === 'team_leader') {
    return (
      <Suspense fallback={<PortalLoadingFallback />}>
        <TeamLeaderLayout>
          <TeamLeaderRouter />
        </TeamLeaderLayout>
      </Suspense>
    );
  }

  // If on Participant Portal
  if (currentPortal === 'participant') {
    return (
      <Suspense fallback={<PortalLoadingFallback />}>
        <ParticipantLayout>
          <ParticipantRouter />
        </ParticipantLayout>
      </Suspense>
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

  return (
    <Suspense fallback={<PortalLoadingFallback />}>
      <AdminLayout>{renderActiveTabContent()}</AdminLayout>
    </Suspense>
  );
};

export default function App({ initialTab }: { initialTab?: any }) {
  return (
    <FestProvider initialTab={initialTab}>
      <AppContent />
    </FestProvider>
  );
}

