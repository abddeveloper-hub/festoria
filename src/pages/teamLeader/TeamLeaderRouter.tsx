import React from 'react';
import { useFest } from '../../context/FestContext';
import { TeamDashboardPage } from './TeamDashboardPage';
import { TeamLeaderboardPage } from './TeamLeaderboardPage';
import { TeamMembersPage } from './TeamMembersPage';
import { ParticipantRequestsPage } from './ParticipantRequestsPage';
import { ProgrammeAssignmentsPage } from './ProgrammeAssignmentsPage';
import { ProgrammeResultsPage } from './ProgrammeResultsPage';
import { TeamSchedulePage } from './TeamSchedulePage';
import { ComplaintsPage } from './ComplaintsPage';
import { TeamAnnouncementsPage } from './TeamAnnouncementsPage';
import { TeamProfilePage } from './TeamProfilePage';
import { TeamNotificationsPage } from './TeamNotificationsPage';
import { MyAccountPage } from './MyAccountPage';

export const TeamLeaderRouter: React.FC = () => {
  const { teamLeaderTab } = useFest();

  switch (teamLeaderTab) {
    case 'team_dashboard':
      return <TeamDashboardPage />;
    case 'team_leaderboard':
      return <TeamLeaderboardPage />;
    case 'team_members':
      return <TeamMembersPage />;
    case 'team_requests':
      return <ParticipantRequestsPage />;
    case 'team_assignments':
      return <ProgrammeAssignmentsPage />;
    case 'team_results':
      return <ProgrammeResultsPage />;
    case 'team_schedule':
      return <TeamSchedulePage />;
    case 'team_complaints':
      return <ComplaintsPage />;
    case 'team_announcements':
      return <TeamAnnouncementsPage />;
    case 'team_profile':
      return <TeamProfilePage />;
    case 'team_notifications':
      return <TeamNotificationsPage />;
    case 'team_account':
      return <MyAccountPage />;
    default:
      return <TeamDashboardPage />;
  }
};
