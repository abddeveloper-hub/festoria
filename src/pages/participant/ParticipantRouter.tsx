import React from 'react';
import { useFest } from '../../context/FestContext';
import { ParticipantDashboardPage } from './ParticipantDashboardPage';
import { ParticipantProfilePage } from './ParticipantProfilePage';
import { ParticipantTeamPage } from './ParticipantTeamPage';
import { ParticipantProgrammesPage } from './ParticipantProgrammesPage';
import { ParticipantSchedulePage } from './ParticipantSchedulePage';
import { ParticipantResultsPage } from './ParticipantResultsPage';
import { ParticipantNotificationsPage } from './ParticipantNotificationsPage';
import { ParticipantHelpPage } from './ParticipantHelpPage';
import { ParticipantAccountPage } from './ParticipantAccountPage';

export const ParticipantRouter: React.FC = () => {
  const { participantTab } = useFest();

  switch (participantTab) {
    case 'participant_dashboard':
      return <ParticipantDashboardPage />;
    case 'participant_profile':
      return <ParticipantProfilePage />;
    case 'participant_team':
      return <ParticipantTeamPage />;
    case 'participant_programmes':
      return <ParticipantProgrammesPage />;
    case 'participant_schedule':
      return <ParticipantSchedulePage />;
    case 'participant_results':
      return <ParticipantResultsPage />;
    case 'participant_notifications':
      return <ParticipantNotificationsPage />;
    case 'participant_help':
      return <ParticipantHelpPage />;
    case 'participant_account':
      return <ParticipantAccountPage />;
    default:
      return <ParticipantDashboardPage />;
  }
};

