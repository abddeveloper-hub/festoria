import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Team,
  Participant,
  Judge,
  Programme,
  ScoreSubmission,
  ApprovedResult,
  User,
  ScheduleSlot,
  ActivityLog,
  Announcement,
  GalleryItem,
  FestSettings,
  Role,
  ScoreStatus,
  Fest,
  FestRequest,
  FestMilestone,
  PlatformSettings,
  PlatformNotification,
  PlatformAuditLog,
  SuperAdminNavigationTab,
  FestLifecycleStatus,
  FestRequestStatus,
  RequestHistoryEntry,
  TeamLeaderNavigationTab,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintHistoryEntry,
  Complaint,
  AssignmentStatus,
  ProgrammeAssignment,
  ParticipantNavigationTab,
  ParticipantApprovalStatus,
  ParticipantRegistrationSource,
  TeamLeaderInvitation
} from '../types';
import {
  StorageService,
  GUEST_USER,
  calculateLeaderboard,
  detectScheduleConflicts,
  TeamLeaderboardEntry,
  ScheduleConflict
} from '../services/storage';
import { normalizePhoneNumber, formatPhoneDisplay } from '../services/authService';
import { signOutUser } from '../firebase/authService';
import { isFirebaseConfigured } from '../firebase/config';
import {
  fetchFests,
  fetchTeams,
  fetchParticipants,
  fetchProgrammes,
  fetchScores,
  fetchResults,
  saveParticipantToFirestore,
  saveTeamToFirestore,
  saveUserToFirestore,
  saveProgrammeToFirestore,
  saveScoreToFirestore,
  saveResultToFirestore,
  saveTeamLeaderInvitation,
  saveProgrammeAssignmentToFirestore,
  deleteProgrammeAssignmentFromFirestore,
  saveComplaintToFirestore,
  updateComplaintInFirestore,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  saveFestSettingsToFirestore,
  seedFirestoreIfEmpty,
  publishResultsViaCloudFunction,
  resolveComplaintViaCloudFunction,
  fetchFestRequests,
  submitFestApplication,
  approveFestApplicationViaCloudFunction,
  rejectFestApplicationViaCloudFunction,
  requestMoreInfoViaCloudFunction
} from '../firebase/firestoreService';

export type NavigationTab =
  | 'dashboard'
  | 'participants'
  | 'judges'
  | 'programmes'
  | 'scores'
  | 'teams'
  | 'team_leaders'
  | 'schedule'
  | 'users'
  | 'complaints'
  | 'public'
  | 'share_fest'
  | 'reports'
  | 'settings';

export type PortalType = 'super_admin' | 'fest_admin' | 'public' | 'team_leader' | 'participant';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface FestContextType {
  // Navigation & Portal
  currentPortal: PortalType;
  setCurrentPortal: (portal: PortalType) => void;
  switchPortal: (portal: PortalType, targetFestId?: string) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  superAdminTab: SuperAdminNavigationTab;
  setSuperAdminTab: (tab: SuperAdminNavigationTab) => void;
  teamLeaderTab: TeamLeaderNavigationTab;
  setTeamLeaderTab: (tab: TeamLeaderNavigationTab) => void;
  // Team Leader Portal Mutators
  activeTeamId: string;
  setActiveTeamId: (id: string) => void;
  activeTeam: Team | undefined;
  complaints: Complaint[];
  assignments: ProgrammeAssignment[];
  submitComplaint: (complaint: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt' | 'statusHistory'>) => void;
  updateComplaintStatus: (complaintId: string, status: ComplaintStatus, note?: string) => void;
  resolveComplaint: (complaintId: string, resolutionNote: string, calibratedScore?: number) => void;
  assignParticipantToProgramme: (assignment: Omit<ProgrammeAssignment, 'id' | 'assignedAt'>) => void;
  withdrawAssignment: (assignmentId: string) => void;
  addTeamMember: (participant: Omit<Participant, 'id' | 'createdAt'>) => boolean;
  updateTeamMember: (id: string, updates: Partial<Participant>) => void;
  navigateToTabWithFilter: (tab: NavigationTab, filterUpdates?: { category?: string; team?: string; programmeId?: string; status?: string }) => void;
  navigateToSuperAdminWithFilter?: (tab: SuperAdminNavigationTab, filterUpdates?: any) => void;

  // Participant Portal State
  participantTab: ParticipantNavigationTab;
  setParticipantTab: (tab: ParticipantNavigationTab) => void;
  activeParticipantId: string;
  setActiveParticipantId: (id: string) => void;
  activeParticipant: Participant | undefined;

  // Admin: Team Leader Account Management
  teamLeaderInvitations: TeamLeaderInvitation[];
  createTeamLeaderAccount: (data: {
    name: string;
    phone: string;
    email: string;
    teamId: string;
    institution?: string;
    status?: 'active' | 'suspended' | 'inactive';
    remarks?: string;
  }) => { success: boolean; message: string; user?: User };
  updateTeamLeaderAccount: (userId: string, updates: Partial<User>) => void;
  reassignTeamLeader: (userId: string, newTeamId: string) => { success: boolean; message: string };
  toggleTeamLeaderStatus: (userId: string, newStatus: 'active' | 'suspended' | 'inactive') => void;
  resendTeamLeaderInvite: (userId: string) => { success: boolean; message: string; otpCode?: string };

  // Participant Registration & Approval (Hybrid Method)
  registerParticipantSelf: (data: {
    name: string;
    phone: string;
    email: string;
    college?: string;
    institution?: string;
    classOrDivision?: string;
    category: Participant['category'];
    requestedTeamId: string;
    photoUrl?: string;
  }) => { success: boolean; message: string; participantId: string };
  inviteParticipantByTeamLeader: (data: {
    name: string;
    phone: string;
    email: string;
    college?: string;
    institution?: string;
    classOrDivision?: string;
    category: Participant['category'];
    teamId: string;
  }) => { success: boolean; message: string; participantId: string };
  approveParticipantRequest: (participantId: string) => { success: boolean; message: string };
  rejectParticipantRequest: (participantId: string, reason: string) => { success: boolean; message: string };
  requestMoreInfoForParticipant: (participantId: string, message: string) => { success: boolean; message: string };
  verifyParticipantPhone: (participantId: string) => boolean;

  // Active Fest in focus
  activeFestId: string;
  setActiveFestId: (id: string) => void;
  activeFest: Fest | undefined;

  // Active User / Session
  currentUser: User;
  switchCurrentUser: (userId: string, directUser?: User) => void;
  hasPermission: (allowedRoles: Role[]) => boolean;
  logout: () => Promise<void>;

  // Fest-Level Data Collections (for current fest)
  settings: FestSettings;
  teams: Team[];
  participants: Participant[];
  judges: Judge[];
  programmes: Programme[];
  scores: ScoreSubmission[];
  results: ApprovedResult[];
  scheduleSlots: ScheduleSlot[];
  users: User[];
  activityLogs: ActivityLog[];
  announcements: Announcement[];
  gallery: GalleryItem[];

  // Platform-Level Collections (Super Admin)
  fests: Fest[];
  festRequests: FestRequest[];
  platformSettings: PlatformSettings;
  milestones: FestMilestone[];
  platformNotifications: PlatformNotification[];
  platformAuditLogs: PlatformAuditLog[];

  // Global Filters for Dashboard
  dashboardFilters: {
    date: string;
    category: string;
    teamId: string;
    programmeId: string;
  };
  setDashboardFilters: React.Dispatch<React.SetStateAction<{
    date: string;
    category: string;
    teamId: string;
    programmeId: string;
  }>>;

  // Derived dynamic analytics
  leaderboard: TeamLeaderboardEntry[];
  scheduleConflicts: ScheduleConflict[];
  summaryStats: {
    totalParticipants: number;
    totalTeams: number;
    totalProgrammes: number;
    totalJudges: number;
    completedProgrammes: number;
    upcomingProgrammes: number;
    pendingScores: number;
    publishedResults: number;
  };

  // Mutators - Fest Admin
  addParticipant: (participant: Omit<Participant, 'id' | 'createdAt'>) => boolean;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;
  bulkImportParticipants: (newParticipants: Omit<Participant, 'id' | 'createdAt'>[]) => { added: number; duplicates: number };

  addJudge: (judge: Omit<Judge, 'id' | 'createdAt'>) => boolean;
  updateJudge: (id: string, updates: Partial<Judge>) => void;
  deleteJudge: (id: string) => void;

  addProgramme: (programme: Omit<Programme, 'id' | 'resultPublished'>) => boolean;
  updateProgramme: (id: string, updates: Partial<Programme>) => void;
  deleteProgramme: (id: string) => void;
  duplicateProgramme: (id: string) => void;

  submitOrUpdateScore: (score: Omit<ScoreSubmission, 'id' | 'submittedAt' | 'revisionHistory'> & { id?: string }) => void;
  updateScoreStatus: (id: string, newStatus: ScoreStatus, notes?: string) => void;
  publishProgrammeResults: (programmeId: string) => void;

  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => boolean;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
  updateScheduleSlot: (id: string, updates: Partial<ScheduleSlot>) => void;
  deleteScheduleSlot: (id: string) => void;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => boolean;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  updateSettings: (newSettings: FestSettings) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => void;
  deleteAnnouncement: (id: string) => void;

  // Mutators - Super Admin & Platform Operations
  approveFestRequest: (requestId: string, approvalNote?: string) => void;
  rejectFestRequest: (requestId: string, reason: string, note?: string) => void;
  requestMoreInfo: (requestId: string, message: string) => void;
  assignReviewer: (requestId: string, reviewerId: string, reviewerName: string) => void;
  submitFestRequest: (data: Omit<FestRequest, 'id' | 'submissionDate' | 'status' | 'history'>) => void;
  updateFestRequest: (requestId: string, updates: Partial<FestRequest>) => void;
  suspendFest: (festId: string, reason: string) => void;
  reactivateFest: (festId: string) => void;
  archiveFest: (festId: string) => void;
  updateFestMetadata: (festId: string, updates: Partial<Fest>) => void;
  reassignFestAdmin: (festId: string, newAdminId: string, newAdminName: string, newAdminEmail: string) => void;
  updateMilestoneStatus: (milestoneId: string, completed: boolean) => void;
  updatePlatformSettings: (newSettings: PlatformSettings) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  logPlatformAudit: (action: string, targetType: PlatformAuditLog['targetType'], targetId: string, details: string, beforeValue?: string, afterValue?: string) => void;

  resetToDefaultData: () => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Firebase State & Sync
  firebaseStatus: {
    isConfigured: boolean;
    projectId: string;
    status: 'connected' | 'demo_mode' | 'loading';
  };
  syncFirestoreData: () => Promise<void>;
}

const FestContext = createContext<FestContextType | undefined>(undefined);

export const FestProvider: React.FC<{ children: ReactNode; initialTab?: NavigationTab }> = ({ children, initialTab }) => {
  const [currentPortal, setCurrentPortal] = useState<PortalType>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const portalParam = urlParams.get('portal') as PortalType;
      if (portalParam && ['super_admin', 'fest_admin', 'public', 'team_leader', 'participant'].includes(portalParam)) {
        return portalParam;
      }
      if (window.location.pathname.includes('super-admin')) return 'super_admin';
      if (window.location.pathname.includes('team-leader')) return 'team_leader';
      if (window.location.pathname.includes('participant')) return 'participant';
      if (window.location.pathname.includes('admin.html')) return 'fest_admin';
      if (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '') {
        const stored = localStorage.getItem('festflow_portal') as PortalType;
        if (stored === 'public') return 'public';
        if (stored && ['super_admin', 'fest_admin', 'team_leader', 'participant'].includes(stored)) {
          const currentUser = StorageService.getCurrentUser();
          if (!currentUser || currentUser.id === 'guest' || currentUser.status !== 'active') {
            return 'public';
          }
          return stored;
        }
        return 'public';
      }
      const stored = localStorage.getItem('festflow_portal') as PortalType;
      if (stored && ['super_admin', 'fest_admin', 'public', 'team_leader', 'participant'].includes(stored)) return stored;
    }
    return 'public';
  });

  const [superAdminTab, setSuperAdminTab] = useState<SuperAdminNavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('subtab') as SuperAdminNavigationTab;
      if (tabParam) return tabParam;
    }
    return 'super_dashboard';
  });

  const [teamLeaderTab, setTeamLeaderTab] = useState<TeamLeaderNavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('teamTab') as TeamLeaderNavigationTab;
      if (tabParam) return tabParam;
    }
    return 'team_dashboard';
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as NavigationTab;
      if (tabParam) return tabParam;
      if (window.location.pathname.includes('admin.html')) return 'dashboard';
    }
    return 'dashboard';
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Raw states
  const [settings, setSettings] = useState<FestSettings>(() => StorageService.getSettings());
  const [teams, setTeams] = useState<Team[]>(() => StorageService.getTeams());
  const [participants, setParticipants] = useState<Participant[]>(() => StorageService.getParticipants());
  const [judges, setJudges] = useState<Judge[]>(() => StorageService.getJudges());
  const [programmes, setProgrammes] = useState<Programme[]>(() => StorageService.getProgrammes());
  const [scores, setScores] = useState<ScoreSubmission[]>(() => StorageService.getScoreSubmissions());
  const [results, setResults] = useState<ApprovedResult[]>(() => StorageService.getApprovedResults());
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => StorageService.getScheduleSlots());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => StorageService.getActivityLogs());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => StorageService.getAnnouncements());
  const [gallery, setGallery] = useState<GalleryItem[]>(() => StorageService.getGallery());

  // Platform Level Raw States
  const [fests, setFests] = useState<Fest[]>(() => StorageService.getFests());
  const [festRequests, setFestRequests] = useState<FestRequest[]>(() => StorageService.getFestRequests());
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => StorageService.getPlatformSettings());
  const [milestones, setMilestones] = useState<FestMilestone[]>(() => StorageService.getMilestones());
  const [platformNotifications, setPlatformNotifications] = useState<PlatformNotification[]>(() => StorageService.getPlatformNotifications());
  const [platformAuditLogs, setPlatformAuditLogs] = useState<PlatformAuditLog[]>(() => StorageService.getPlatformAuditLogs());
  const [activeFestId, setActiveFestId] = useState<string>('FEST-01');

  // Team Leader State
  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('festflow_active_team_id');
      if (stored) return stored;
    }
    return 'TM-01'; // Default Solar Flare
  });
  const [complaints, setComplaints] = useState<Complaint[]>(() => StorageService.getComplaints());
  const [assignments, setAssignments] = useState<ProgrammeAssignment[]>(() => StorageService.getAssignments());
  const [teamLeaderInvitations, setTeamLeaderInvitations] = useState<TeamLeaderInvitation[]>(() => StorageService.getTeamLeaderInvitations());

  const activeTeam = useMemo(() => {
    return teams.find((t) => t.id === activeTeamId) || teams[0];
  }, [teams, activeTeamId]);

  // Participant Portal State
  const [participantTab, setParticipantTab] = useState<ParticipantNavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('pTab') as ParticipantNavigationTab;
      if (tabParam) return tabParam;
    }
    return 'participant_dashboard';
  });

  const [activeParticipantId, setActiveParticipantId] = useState<string>(() => {
    return StorageService.getActiveParticipantId();
  });

  useEffect(() => {
    StorageService.saveActiveParticipantId(activeParticipantId);
  }, [activeParticipantId]);

  const activeParticipant = useMemo(() => {
    return participants.find((p) => p.id === activeParticipantId) || participants[0];
  }, [participants, activeParticipantId]);

  // Dashboard filter state
  const [dashboardFilters, setDashboardFilters] = useState({
    date: 'all',
    category: 'all',
    teamId: 'all',
    programmeId: 'all',
  });

  // Sync to Storage
  useEffect(() => { StorageService.saveSettings(settings); }, [settings]);
  useEffect(() => { StorageService.saveTeams(teams); }, [teams]);
  useEffect(() => { StorageService.saveParticipants(participants); }, [participants]);
  useEffect(() => { StorageService.saveJudges(judges); }, [judges]);
  useEffect(() => { StorageService.saveProgrammes(programmes); }, [programmes]);
  useEffect(() => { StorageService.saveScoreSubmissions(scores); }, [scores]);
  useEffect(() => { StorageService.saveApprovedResults(results); }, [results]);
  useEffect(() => { StorageService.saveScheduleSlots(scheduleSlots); }, [scheduleSlots]);
  useEffect(() => { StorageService.saveUsers(users); }, [users]);
  useEffect(() => { StorageService.setCurrentUser(currentUser); }, [currentUser]);
  useEffect(() => { StorageService.saveActivityLogs(activityLogs); }, [activityLogs]);
  useEffect(() => { StorageService.saveAnnouncements(announcements); }, [announcements]);
  useEffect(() => { StorageService.saveGallery(gallery); }, [gallery]);

  // Sync Platform Collections
  useEffect(() => { StorageService.saveFests(fests); }, [fests]);
  useEffect(() => { StorageService.saveFestRequests(festRequests); }, [festRequests]);
  useEffect(() => { StorageService.savePlatformSettings(platformSettings); }, [platformSettings]);
  useEffect(() => { StorageService.saveMilestones(milestones); }, [milestones]);
  useEffect(() => { StorageService.savePlatformNotifications(platformNotifications); }, [platformNotifications]);
  useEffect(() => { StorageService.savePlatformAuditLogs(platformAuditLogs); }, [platformAuditLogs]);
  useEffect(() => { StorageService.saveComplaints(complaints); }, [complaints]);
  useEffect(() => { StorageService.saveAssignments(assignments); }, [assignments]);
  useEffect(() => { StorageService.saveTeamLeaderInvitations(teamLeaderInvitations); }, [teamLeaderInvitations]);
  useEffect(() => {
    try {
      localStorage.setItem('festflow_active_team_id', activeTeamId);
    } catch (e) {
      // ignore
    }
  }, [activeTeamId]);
  useEffect(() => {
    try {
      localStorage.setItem('festflow_portal', currentPortal);
    } catch (e) {
      // ignore
    }
  }, [currentPortal]);

  // Firebase Live Sync State
  const [firebaseStatus, setFirebaseStatus] = useState<{
    isConfigured: boolean;
    projectId: string;
    status: 'connected' | 'demo_mode' | 'loading';
  }>({
    isConfigured: isFirebaseConfigured,
    projectId: 'festoria-cd375',
    status: isFirebaseConfigured ? 'loading' : 'demo_mode'
  });

  const syncFirestoreData = async () => {
    if (!isFirebaseConfigured) return;
    try {
      setFirebaseStatus(prev => ({ ...prev, status: 'loading' }));
      await seedFirestoreIfEmpty();
      const [fsFests, fsTeams, fsParticipants, fsProgrammes, fsScores, fsResults, fsFestRequests] = await Promise.all([
        fetchFests(),
        fetchTeams(),
        fetchParticipants(),
        fetchProgrammes(),
        fetchScores(),
        fetchResults(),
        fetchFestRequests()
      ]);
      if (fsFests.length > 0) setFests(fsFests);
      if (fsTeams.length > 0) setTeams(fsTeams);
      if (fsParticipants.length > 0) setParticipants(fsParticipants);
      if (fsProgrammes.length > 0) setProgrammes(fsProgrammes);
      if (fsScores.length > 0) setScores(fsScores);
      if (fsResults.length > 0) setResults(fsResults);
      if (fsFestRequests.length > 0) setFestRequests(fsFestRequests);
      setFirebaseStatus({
        isConfigured: true,
        projectId: 'festoria-cd375',
        status: 'connected'
      });
    } catch (e) {
      console.warn('[FestContext] Firestore initial sync notice:', e);
      setFirebaseStatus({
        isConfigured: true,
        projectId: 'festoria-cd375',
        status: 'demo_mode'
      });
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured) {
      syncFirestoreData();
    }
  }, []);

  // Toast Helpers
  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Activity Log Helper
  const logActivity = (action: string, targetType: ActivityLog['targetType'], targetId: string | undefined, details: string) => {
    const newLog: ActivityLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Navigation with pre-filters
  const navigateToTabWithFilter = (
    tab: NavigationTab,
    filterUpdates?: { category?: string; team?: string; programmeId?: string; status?: string }
  ) => {
    if (filterUpdates) {
      if (filterUpdates.category) {
        setDashboardFilters((prev) => ({ ...prev, category: filterUpdates.category! }));
      }
      if (filterUpdates.team) {
        setDashboardFilters((prev) => ({ ...prev, teamId: filterUpdates.team! }));
      }
      if (filterUpdates.programmeId) {
        setDashboardFilters((prev) => ({ ...prev, programmeId: filterUpdates.programmeId! }));
      }
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchCurrentUser = (userId: string, directUser?: User) => {
    const found = directUser || users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      StorageService.setCurrentUser(found);
      if (found.festId) {
        setActiveFestId(found.festId);
      }
      if (!users.some((u) => u.id === found.id)) {
        setUsers((prev) => [found, ...prev]);
      }
      addToast('info', 'Active User Changed', `Switched session to ${found.name} (${found.role.replace('_', ' ').toUpperCase()})`);
      logActivity('SWITCH_USER_SESSION', 'user', found.id, `User session switched to ${found.name} (${found.role})`);
    }
  };

  const hasPermission = (allowedRoles: Role[]): boolean => {
    return allowedRoles.includes(currentUser.role);
  };

  const logout = async () => {
    await signOutUser();
    setCurrentUser(GUEST_USER);
    setActiveParticipantId('');
    setActiveTeamId('');
    switchPortal('public');
    addToast('info', 'Signed Out', 'You have been successfully signed out.');
  };

  // Dynamic Leaderboard
  const leaderboard = useMemo(() => {
    return calculateLeaderboard(teams, results, programmes);
  }, [teams, results, programmes]);

  // Dynamic Schedule Conflicts
  const scheduleConflicts = useMemo(() => {
    return detectScheduleConflicts(programmes, participants);
  }, [programmes, participants]);

  // Summary Metrics (All dynamic!)
  const summaryStats = useMemo(() => {
    const totalParticipants = participants.filter((p) => p.status !== 'inactive').length;
    const totalTeams = teams.filter((t) => t.status === 'active').length;
    const totalProgrammes = programmes.length;
    const totalJudges = judges.filter((j) => j.status === 'active').length;
    const completedProgrammes = programmes.filter((p) => p.status === 'completed').length;
    const upcomingProgrammes = programmes.filter((p) => p.status === 'scheduled' || p.status === 'ongoing').length;
    const pendingScores = scores.filter((s) => s.status === 'pending' || s.status === 'submitted' || s.status === 'reviewed').length;
    const publishedResults = results.filter((r) => r.published).length;

    return {
      totalParticipants,
      totalTeams,
      totalProgrammes,
      totalJudges,
      completedProgrammes,
      upcomingProgrammes,
      pendingScores,
      publishedResults,
    };
  }, [participants, teams, programmes, judges, scores, results]);

  // Participant Management
  const addParticipant = (data: Omit<Participant, 'id' | 'createdAt'>): boolean => {
    // Check duplicates by email
    const exists = participants.some((p) => p.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      addToast('error', 'Duplicate Participant', `A participant with email ${data.email} already exists.`);
      return false;
    }
    const newId = `PT-${(participants.length + 101).toString()}`;
    const newParticipant: Participant = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setParticipants((prev) => [newParticipant, ...prev]);

    // Also update registeredProgrammes on programmes
    if (data.registeredProgrammes.length > 0) {
      setProgrammes((prev) =>
        prev.map((prog) => {
          if (data.registeredProgrammes.includes(prog.id) && !prog.registeredParticipantIds.includes(newId)) {
            return {
              ...prog,
              registeredParticipantIds: [...prog.registeredParticipantIds, newId],
            };
          }
          return prog;
        })
      );
    }

    logActivity('CREATE_PARTICIPANT', 'participant', newId, `Registered participant ${data.name} (${newId}) under team ${data.teamId}.`);
    addToast('success', 'Participant Added', `${data.name} has been successfully registered.`);
    return true;
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    logActivity('UPDATE_PARTICIPANT', 'participant', id, `Updated details for participant ID ${id}.`);
    addToast('success', 'Updated', 'Participant record has been updated.');
  };

  const deleteParticipant = (id: string) => {
    const target = participants.find((p) => p.id === id);
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    logActivity('DELETE_PARTICIPANT', 'participant', id, `Removed participant ${target?.name || id}.`);
    addToast('info', 'Participant Removed', 'The participant record was removed.');
  };

  const bulkImportParticipants = (newItems: Omit<Participant, 'id' | 'createdAt'>[]) => {
    let addedCount = 0;
    let duplicateCount = 0;
    const existingEmails = new Set(participants.map((p) => p.email.toLowerCase()));
    const toAdd: Participant[] = [];

    newItems.forEach((item, index) => {
      if (existingEmails.has(item.email.toLowerCase())) {
        duplicateCount++;
      } else {
        existingEmails.add(item.email.toLowerCase());
        const newId = `PT-${(participants.length + addedCount + 101).toString()}`;
        toAdd.push({
          ...item,
          id: newId,
          createdAt: new Date().toISOString().slice(0, 10),
        });
        addedCount++;
      }
    });

    if (toAdd.length > 0) {
      setParticipants((prev) => [...toAdd, ...prev]);
      logActivity('BULK_IMPORT_PARTICIPANTS', 'participant', undefined, `Imported ${addedCount} participants via CSV.`);
      addToast('success', 'Bulk Import Complete', `Added ${addedCount} participants. ${duplicateCount} duplicates skipped.`);
    } else {
      addToast('warning', 'No New Participants', 'All entries in the file were already registered.');
    }

    return { added: addedCount, duplicates: duplicateCount };
  };

  // Judge Management
  const addJudge = (data: Omit<Judge, 'id' | 'createdAt'>): boolean => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can manage judges.');
      return false;
    }
    const exists = judges.some((j) => j.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      addToast('error', 'Duplicate Judge', `A judge with email ${data.email} already exists.`);
      return false;
    }
    const newId = `JD-0${judges.length + 1}`;
    const newJudge: Judge = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setJudges((prev) => [...prev, newJudge]);
    logActivity('ADD_JUDGE', 'judge', newId, `Added judge ${data.name} (${newId}).`);
    addToast('success', 'Judge Created', `${data.name} has been added to the judging panel.`);
    return true;
  };

  const updateJudge = (id: string, updates: Partial<Judge>) => {
    setJudges((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    logActivity('UPDATE_JUDGE', 'judge', id, `Updated judge record ${id}.`);
    addToast('success', 'Judge Updated', 'Judge information saved successfully.');
  };

  const deleteJudge = (id: string) => {
    setJudges((prev) => prev.filter((j) => j.id !== id));
    logActivity('DELETE_JUDGE', 'judge', id, `Removed judge record ${id}.`);
    addToast('info', 'Judge Removed', 'The judge was removed from the panel.');
  };

  // Programme Management
  const addProgramme = (data: Omit<Programme, 'id' | 'resultPublished'>): boolean => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can manage programmes.');
      return false;
    }
    const exists = programmes.some((p) => p.code.toLowerCase() === data.code.toLowerCase());
    if (exists) {
      addToast('error', 'Duplicate Programme Code', `Code ${data.code} is already in use.`);
      return false;
    }
    const newId = `PRG-${(programmes.length + 101).toString()}`;
    const newProgramme: Programme = {
      ...data,
      id: newId,
      resultPublished: false,
    };
    setProgrammes((prev) => [...prev, newProgramme]);

    // Also add to schedule slots
    const newSlot: ScheduleSlot = {
      id: `SCH-${(scheduleSlots.length + 1).toString().padStart(2, '0')}`,
      programmeId: newId,
      venue: data.venue,
      stage: data.stage,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
    };
    setScheduleSlots((prev) => [...prev, newSlot]);

    logActivity('CREATE_PROGRAMME', 'programme', newId, `Created programme ${data.name} (${data.code}).`);
    addToast('success', 'Programme Added', `${data.name} added successfully.`);
    return true;
  };

  const updateProgramme = (id: string, updates: Partial<Programme>) => {
    setProgrammes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    // Also sync schedule slot if time/venue changes
    setScheduleSlots((prev) =>
      prev.map((s) => {
        if (s.programmeId === id) {
          return {
            ...s,
            venue: updates.venue || s.venue,
            stage: updates.stage || s.stage,
            date: updates.date || s.date,
            startTime: updates.startTime || s.startTime,
            endTime: updates.endTime || s.endTime,
            status: updates.status || s.status,
          };
        }
        return s;
      })
    );
    logActivity('UPDATE_PROGRAMME', 'programme', id, `Updated programme ${id}.`);
    addToast('success', 'Programme Updated', 'Programme settings and schedule updated.');
  };

  const deleteProgramme = (id: string) => {
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
    setScheduleSlots((prev) => prev.filter((s) => s.programmeId !== id));
    logActivity('DELETE_PROGRAMME', 'programme', id, `Deleted programme ${id}.`);
    addToast('info', 'Programme Deleted', 'The programme was deleted.');
  };

  const duplicateProgramme = (id: string) => {
    const existing = programmes.find((p) => p.id === id);
    if (!existing) return;
    const newId = `PRG-${(programmes.length + 101).toString()}`;
    const newCode = `${existing.code}-DUP`;
    const cloned: Programme = {
      ...existing,
      id: newId,
      code: newCode,
      name: `${existing.name} (Copy)`,
      status: 'draft',
      resultPublished: false,
      registeredParticipantIds: [],
      registeredTeamIds: [],
    };
    setProgrammes((prev) => [...prev, cloned]);
    logActivity('DUPLICATE_PROGRAMME', 'programme', newId, `Duplicated programme ${existing.name} to ${cloned.name}.`);
    addToast('success', 'Programme Duplicated', `Created draft clone ${cloned.name}.`);
  };

  // Score Management
  const submitOrUpdateScore = (
    data: Omit<ScoreSubmission, 'id' | 'submittedAt' | 'revisionHistory'> & { id?: string }
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const totalScore = data.scores.reduce((sum, item) => sum + item.marksObtained, 0);

    if (data.id) {
      // Update existing
      setScores((prev) =>
        prev.map((s) => {
          if (s.id === data.id) {
            const revision = {
              revisedBy: currentUser.name,
              revisedAt: now,
              previousTotal: s.totalScore,
              reason: data.notes || 'Score calibration update',
            };
            return {
              ...s,
              ...data,
              totalScore,
              revisionHistory: [revision, ...(s.revisionHistory || [])],
            };
          }
          return s;
        })
      );
      logActivity('UPDATE_SCORE', 'score', data.id, `Revised score for programme ${data.programmeId} by ${currentUser.name}.`);
      addToast('success', 'Score Updated', 'Score entry saved with audit revision.');
    } else {
      // Create new
      const newId = `SC-${Date.now().toString().slice(-4)}`;
      const newScore: ScoreSubmission = {
        ...data,
        id: newId,
        totalScore,
        submittedAt: now,
        revisionHistory: [],
      };
      setScores((prev) => [newScore, ...prev]);
      logActivity('SUBMIT_SCORE', 'score', newId, `Submitted score entry for ${data.programmeId} (${totalScore} marks).`);
      addToast('success', 'Score Submitted', 'Score recorded successfully.');
    }
  };

  const updateScoreStatus = (id: string, newStatus: ScoreStatus, notes?: string) => {
    setScores((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updates: Partial<ScoreSubmission> = { status: newStatus };
          if (newStatus === 'reviewed') updates.reviewedBy = currentUser.id;
          if (newStatus === 'approved') updates.approvedBy = currentUser.id;
          if (notes) updates.notes = notes;
          return { ...s, ...updates };
        }
        return s;
      })
    );
    logActivity('CHANGE_SCORE_STATUS', 'score', id, `Changed score ${id} status to ${newStatus.toUpperCase()}.`);
    addToast('info', 'Status Updated', `Score status updated to ${newStatus}.`);
  };

  // Publish Results Logic (Server-side/trusted calculation)
  const publishProgrammeResults = (programmeId: string) => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can publish results.');
      return;
    }
    const programme = programmes.find((p) => p.id === programmeId);
    if (!programme) return;

    // Get all approved or submitted scores for this programme
    const progScores = scores.filter((s) => s.programmeId === programmeId);
    if (progScores.length === 0) {
      addToast('warning', 'No Scores', 'Cannot publish results without score submissions.');
      return;
    }

    // Consolidate scores per participant / team
    const scoreMap = new Map<string, { totalScore: number; judgeCount: number; teamId: string; participantId?: string }>();

    progScores.forEach((s) => {
      const key = (programme.type === 'individual' ? (s.participantId || s.teamId) : s.teamId) || s.id;
      const teamId = s.teamId || 'TM-01';
      const existing = scoreMap.get(key) || {
        totalScore: 0,
        judgeCount: 0,
        teamId,
        participantId: s.participantId,
      };
      existing.totalScore += s.totalScore;
      existing.judgeCount += 1;
      scoreMap.set(key, existing);
    });

    // Compute averaged scores and rank
    const sortedEntries = Array.from(scoreMap.entries()).map(([key, data]) => {
      const finalScore = Math.round((data.totalScore / (data.judgeCount || 1)) * 10) / 10;
      return {
        key,
        teamId: data.teamId,
        participantId: data.participantId,
        finalScore,
      };
    });

    sortedEntries.sort((a, b) => b.finalScore - a.finalScore);

    const pointRules = settings.pointRules;
    const multiplier = programme.type === 'group' ? pointRules.groupMultiplier : 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newResults: ApprovedResult[] = sortedEntries.map((item, idx) => {
      const rank = idx + 1;
      let basePoints = 0;
      if (rank === 1) basePoints = pointRules.firstPlace;
      else if (rank === 2) basePoints = pointRules.secondPlace;
      else if (rank === 3) basePoints = pointRules.thirdPlace;
      else if (rank === 4) basePoints = pointRules.fourthPlace;
      else if (rank === 5) basePoints = pointRules.fifthPlace;

      const teamObj = teams.find((t) => t.id === item.teamId);
      const participantObj = participants.find((p) => p.id === item.participantId);

      return {
        id: `RES-${programmeId}-${rank}`,
        programmeId,
        rank,
        participantId: item.participantId,
        participantName: participantObj?.name,
        teamId: item.teamId,
        teamName: teamObj?.name || 'Independent',
        finalScore: item.finalScore,
        pointsAwarded: basePoints * multiplier,
        published: true,
        publishedAt: now,
      };
    });

    // Remove old results for this programme and append newly calculated ones
    setResults((prev) => [...prev.filter((r) => r.programmeId !== programmeId), ...newResults]);

    // Mark programme as completed and resultPublished = true
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === programmeId
          ? { ...p, status: 'completed', resultPublished: true, publishedAt: now }
          : p
      )
    );

    // Update all scores to published
    setScores((prev) =>
      prev.map((s) => (s.programmeId === programmeId ? { ...s, status: 'published' } : s))
    );

    // Create an announcement automatically
    const announcement: Announcement = {
      id: `ANN-${Date.now().toString().slice(-4)}`,
      title: `Official Results Ratified: ${programme.name}`,
      content: `The results for ${programme.name} (${programme.category}) have been approved and published. Leaderboard points have been updated!`,
      category: 'results',
      isPublic: true,
      createdAt: now,
      author: currentUser.name,
    };
    setAnnouncements((prev) => [announcement, ...prev]);

    logActivity('PUBLISH_RESULTS', 'score', programmeId, `Published ratified results and awarded leaderboard points for ${programme.name}.`);
    addToast('success', 'Results Published', `Results for ${programme.name} are now live on the Public Site.`);

    // Authoritatively publish results via trusted backend Cloud Function (generates secure PUBLISH_RESULTS audit)
    publishResultsViaCloudFunction(activeFestId, programmeId).catch((err) => {
      console.warn('[FestContext] Cloud function publishResults call error:', err);
    });
  };

  // Team Management
  const addTeam = (data: Omit<Team, 'id' | 'createdAt'>): boolean => {
    const exists = teams.some((t) => t.code.toLowerCase() === data.code.toLowerCase());
    if (exists) {
      addToast('error', 'Duplicate Team Code', `Team code "${data.code}" already exists.`);
      return false;
    }
    const newId = `TM-${(teams.length + 1).toString().padStart(2, '0')}`;
    const newTeam: Team = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTeams((prev) => [...prev, newTeam]);
    logActivity('CREATE_TEAM', 'team', newId, `Created team ${data.name} (${data.code}).`);
    addToast('success', 'Team Added', `${data.name} created successfully.`);
    return true;
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    logActivity('UPDATE_TEAM', 'team', id, `Updated team profile for ${id}.`);
    addToast('success', 'Team Updated', 'Team settings saved.');
  };

  const deleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
    logActivity('DELETE_TEAM', 'team', id, `Deleted team ${id}.`);
    addToast('info', 'Team Removed', 'Team was deactivated.');
  };

  // Schedule Slot Management
  const addScheduleSlot = (slot: Omit<ScheduleSlot, 'id'>) => {
    const newId = `SCH-${Date.now().toString().slice(-4)}`;
    setScheduleSlots((prev) => [...prev, { ...slot, id: newId }]);
    logActivity('CREATE_SCHEDULE_SLOT', 'schedule', newId, `Created schedule slot for programme ${slot.programmeId}.`);
    addToast('success', 'Slot Added', 'New schedule entry added.');
  };

  const updateScheduleSlot = (id: string, updates: Partial<ScheduleSlot>) => {
    setScheduleSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    logActivity('UPDATE_SCHEDULE_SLOT', 'schedule', id, `Updated schedule slot ${id}.`);
    addToast('success', 'Slot Updated', 'Schedule slot time/stage updated.');
  };

  const deleteScheduleSlot = (id: string) => {
    setScheduleSlots((prev) => prev.filter((s) => s.id !== id));
    logActivity('DELETE_SCHEDULE_SLOT', 'schedule', id, `Deleted schedule slot ${id}.`);
    addToast('info', 'Slot Removed', 'The schedule slot was removed.');
  };

  // User Management
  const addUser = (data: Omit<User, 'id' | 'createdAt'>): boolean => {
    const exists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      addToast('error', 'Duplicate Email', `User with email ${data.email} already exists.`);
      return false;
    }
    const newId = `USR-${(users.length + 1).toString().padStart(2, '0')}`;
    const newUser: User = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setUsers((prev) => [...prev, newUser]);
    logActivity('CREATE_USER', 'user', newId, `Created user ${data.name} with role ${data.role}.`);
    addToast('success', 'User Created', `Account for ${data.name} created.`);
    return true;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    logActivity('UPDATE_USER', 'user', id, `Updated user details for ${id}.`);
    addToast('success', 'User Updated', 'Account permissions updated.');
  };

  const deleteUser = (id: string) => {
    if (currentUser.id === id) {
      addToast('error', 'Action Denied', 'You cannot delete your own active session account.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logActivity('DELETE_USER', 'user', id, `Removed user account ${id}.`);
    addToast('info', 'User Removed', 'User account was deleted.');
  };

  // Settings
  const updateSettings = (newSettings: FestSettings) => {
    setSettings(newSettings);
    saveFestSettingsToFirestore(activeFestId, newSettings);
    logActivity('UPDATE_SETTINGS', 'settings', undefined, 'Updated global fest settings & scoring point rules.');
    addToast('success', 'Settings Saved', 'Fest configuration has been updated.');
  };

  const addAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => {
    const newId = `ANN-${Date.now().toString().slice(-4)}`;
    const newAnn: Announcement = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      author: currentUser.name,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    saveAnnouncementToFirestore(newAnn);
    logActivity('CREATE_ANNOUNCEMENT', 'settings', newId, `Posted announcement "${data.title}".`);
    addToast('success', 'Announcement Posted', 'Published update to the public site.');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    deleteAnnouncementFromFirestore(id);
    addToast('info', 'Announcement Removed', 'The bulletin was removed.');
  };

  // Super Admin Platform Operations
  const logPlatformAudit = (
    action: string,
    targetType: PlatformAuditLog['targetType'],
    targetId: string,
    details: string,
    beforeValue?: string,
    afterValue?: string
  ) => {
    const newLog: PlatformAuditLog = {
      id: `AUDIT-${Date.now().toString().slice(-6)}`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      targetType,
      targetId,
      details,
      beforeValue,
      afterValue,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setPlatformAuditLogs((prev) => [newLog, ...prev]);
  };

  const approveFestRequest = (requestId: string, approvalNote?: string) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can approve fest requests.');
      return;
    }
    const req = festRequests.find((r) => r.id === requestId);
    if (!req) return;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nowDate = new Date().toISOString().slice(0, 10);

    // Trigger trusted backend Cloud Function for privileged provisioning
    if (isFirebaseConfigured) {
      approveFestApplicationViaCloudFunction(requestId, approvalNote).catch((err) => {
        console.warn('[FestContext] Cloud Function approveFestApplication error:', err);
      });
    }

    const historyEntry: RequestHistoryEntry = {
      date: now,
      actor: currentUser.name,
      action: 'Approved Fest Request',
      note: approvalNote || 'Request met platform criteria and was approved.',
    };

    setFestRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              reviewNotes: approvalNote || r.reviewNotes,
              history: [historyEntry, ...r.history],
            }
          : r
      )
    );

    const newFestId = `FEST-0${fests.length + 1}`;
    const newFest: Fest = {
      id: newFestId,
      name: req.festName,
      edition: req.edition,
      tagline: `${req.festName} ${req.edition}`,
      description: req.description,
      institution: req.institution,
      category: req.category,
      venue: req.venue,
      startDate: req.startDate,
      endDate: req.endDate,
      adminId: req.requestingAdminId,
      adminName: req.requestingAdminName,
      adminEmail: req.requestingAdminEmail,
      adminPhone: req.requestingAdminPhone,
      status: 'setup',
      publicPagePublished: false,
      publicUrl: `/fests/${req.festName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      expectedParticipants: req.expectedParticipants,
      plannedProgrammesCount: req.plannedProgrammesCount,
      createdAt: nowDate,
      approvedAt: now,
      approvedBy: currentUser.name,
      completionPercentage: 15,
    };
    setFests((prev) => [newFest, ...prev]);

    const newMilestones: FestMilestone[] = [
      { id: `MLS-${newFestId}-1`, festId: newFestId, name: 'Fest Information & Rules Configured', category: 'Setup', completed: true, completedAt: now, responsibleRole: 'fest_admin' },
      { id: `MLS-${newFestId}-2`, festId: newFestId, name: 'Participating Teams Registered', category: 'Setup', completed: false, responsibleRole: 'fest_admin' },
      { id: `MLS-${newFestId}-3`, festId: newFestId, name: 'Competition Programmes Finalised', category: 'Programmes', completed: false, responsibleRole: 'fest_admin' },
      { id: `MLS-${newFestId}-4`, festId: newFestId, name: 'Evaluation Panel Judges Assigned', category: 'Judges', completed: false, responsibleRole: 'fest_admin' },
      { id: `MLS-${newFestId}-5`, festId: newFestId, name: 'Venue Schedule Slots Published', category: 'Schedule', completed: false, responsibleRole: 'fest_admin' },
      { id: `MLS-${newFestId}-6`, festId: newFestId, name: 'Registration Opened to Participants', category: 'Registration', completed: false, responsibleRole: 'fest_admin' },
      { id: `MLS-${newFestId}-7`, festId: newFestId, name: 'Public Portal Site Activated', category: 'Public', completed: false, responsibleRole: 'fest_admin' },
      { id: `MLS-${newFestId}-8`, festId: newFestId, name: 'Final Scores Ratified & Published', category: 'Results', completed: false, responsibleRole: 'super_admin' },
    ];
    setMilestones((prev) => [...prev, ...newMilestones]);

    const notif: PlatformNotification = {
      id: `NOTIF-${Date.now().toString().slice(-5)}`,
      title: `Fest Request Approved: ${req.festName}`,
      message: `${req.festName} (${req.edition}) approved by ${currentUser.name}. Record ${newFestId} activated.`,
      severity: 'success',
      category: 'fest_request',
      read: false,
      createdAt: now,
      relatedFestId: newFestId,
      relatedRequestId: requestId,
    };
    setPlatformNotifications((prev) => [notif, ...prev]);

    logPlatformAudit(
      'APPROVE_FEST_REQUEST',
      'fest_request',
      requestId,
      `Approved request ${requestId} for "${req.festName}". Generated new Fest record ${newFestId} assigned to admin ${req.requestingAdminName}.`,
      req.status,
      'approved'
    );

    addToast('success', 'Fest Request Approved', `"${req.festName}" is approved. Fest record ${newFestId} is created.`);
  };

  const rejectFestRequest = (requestId: string, reason: string, note?: string) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can reject fest requests.');
      return;
    }
    const req = festRequests.find((r) => r.id === requestId);
    if (!req) return;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Trigger trusted backend Cloud Function
    if (isFirebaseConfigured) {
      rejectFestApplicationViaCloudFunction(requestId, reason, note).catch((err) => {
        console.warn('[FestContext] Cloud Function rejectFestApplication error:', err);
      });
    }

    const historyEntry: RequestHistoryEntry = {
      date: now,
      actor: currentUser.name,
      action: 'Rejected Fest Request',
      note: `Reason: ${reason}${note ? ` | Note: ${note}` : ''}`,
    };

    setFestRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              rejectionReason: reason,
              reviewNotes: note || r.reviewNotes,
              history: [historyEntry, ...r.history],
            }
          : r
      )
    );

    const notif: PlatformNotification = {
      id: `NOTIF-${Date.now().toString().slice(-5)}`,
      title: `Fest Request Rejected: ${req.festName}`,
      message: `Request for ${req.festName} was declined by ${currentUser.name}. Reason: ${reason}`,
      severity: 'critical',
      category: 'fest_request',
      read: false,
      createdAt: now,
      relatedRequestId: requestId,
    };
    setPlatformNotifications((prev) => [notif, ...prev]);

    logPlatformAudit(
      'REJECT_FEST_REQUEST',
      'fest_request',
      requestId,
      `Rejected fest request ${requestId} for "${req.festName}". Reason: ${reason}.`,
      req.status,
      'rejected'
    );

    addToast('info', 'Request Rejected', `Request ${requestId} has been declined.`);
  };

  const requestMoreInfo = (requestId: string, message: string) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can request additional info.');
      return;
    }
    const req = festRequests.find((r) => r.id === requestId);
    if (!req) return;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Call Cloud Function if live
    if (isFirebaseConfigured) {
      requestMoreInfoViaCloudFunction(requestId, message).catch((err) => {
        console.warn('[FestContext] Cloud Function requestMoreInfo error:', err);
      });
    }

    const historyEntry: RequestHistoryEntry = {
      date: now,
      actor: currentUser.name,
      action: 'Requested More Information',
      note: message,
    };

    setFestRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'more_info_required',
              moreInfoMessage: message,
              history: [historyEntry, ...r.history],
            }
          : r
      )
    );

    const notif: PlatformNotification = {
      id: `NOTIF-${Date.now().toString().slice(-5)}`,
      title: `Information Requested: ${req.festName}`,
      message: `Reviewer requested additional documentation or details: "${message}"`,
      severity: 'warning',
      category: 'fest_request',
      read: false,
      createdAt: now,
      relatedRequestId: requestId,
    };
    setPlatformNotifications((prev) => [notif, ...prev]);

    logPlatformAudit(
      'REQUEST_MORE_INFO',
      'fest_request',
      requestId,
      `Requested additional information for ${requestId}: "${message}".`,
      req.status,
      'more_info_required'
    );

    addToast('info', 'More Info Requested', `Notification dispatched to ${req.requestingAdminName}.`);
  };

  const assignReviewer = (requestId: string, reviewerId: string, reviewerName: string) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can assign reviewers.');
      return;
    }
    const req = festRequests.find((r) => r.id === requestId);
    if (!req) return;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const historyEntry: RequestHistoryEntry = {
      date: now,
      actor: currentUser.name,
      action: 'Assigned Reviewer',
      note: `Assigned review responsibility to ${reviewerName} (${reviewerId}).`,
    };

    setFestRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              assignedReviewerId: reviewerId,
              assignedReviewerName: reviewerName,
              status: r.status === 'submitted' ? 'under_review' : r.status,
              history: [historyEntry, ...r.history],
            }
          : r
      )
    );

    logPlatformAudit(
      'ASSIGN_REVIEWER',
      'fest_request',
      requestId,
      `Assigned reviewer ${reviewerName} (${reviewerId}) to request ${requestId}.`
    );

    addToast('success', 'Reviewer Assigned', `Request ${requestId} assigned to ${reviewerName}.`);
  };

  const submitFestRequest = (data: Omit<FestRequest, 'id' | 'submissionDate' | 'status' | 'history'>) => {
    const newId = `REQ-2026-0${festRequests.length + 1}`;
    const now = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newReq: FestRequest = {
      ...data,
      id: newId,
      submissionDate: now,
      status: 'submitted',
      history: [
        {
          date: nowTime,
          actor: data.requestingAdminName,
          action: 'Submitted Request',
          note: 'New fest operational application submitted for platform review.',
        },
      ],
    };

    setFestRequests((prev) => [newReq, ...prev]);
    submitFestApplication(newReq);

    const notif: PlatformNotification = {
      id: `NOTIF-${Date.now().toString().slice(-5)}`,
      title: `New Fest Request: ${data.festName}`,
      message: `${data.requestingAdminName} from ${data.institution} submitted request ${newId} for ${data.festName}.`,
      severity: 'info',
      category: 'fest_request',
      read: false,
      createdAt: nowTime,
      relatedRequestId: newId,
    };
    setPlatformNotifications((prev) => [notif, ...prev]);

    logPlatformAudit(
      'SUBMIT_FEST_REQUEST',
      'fest_request',
      newId,
      `Admin ${data.requestingAdminName} submitted application ${newId} for "${data.festName}".`
    );

    addToast('success', 'Application Submitted', `Fest request ${newId} submitted for Super Admin review.`);
  };

  const updateFestRequest = (requestId: string, updates: Partial<FestRequest>) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can update fest requests.');
      return;
    }
    setFestRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, ...updates } : r))
    );
    addToast('success', 'Request Updated', 'Changes saved.');
  };

  const suspendFest = (festId: string, reason: string) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can suspend fests.');
      return;
    }
    const target = fests.find((f) => f.id === festId);
    if (!target) return;
    setFests((prev) =>
      prev.map((f) =>
        f.id === festId
          ? { ...f, status: 'suspended', suspensionReason: reason, publicPagePublished: false }
          : f
      )
    );

    const notif: PlatformNotification = {
      id: `NOTIF-${Date.now().toString().slice(-5)}`,
      title: `Fest Suspended: ${target.name}`,
      message: `Super Admin ${currentUser.name} suspended ${target.name} (${festId}). Reason: ${reason}`,
      severity: 'critical',
      category: 'security',
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      relatedFestId: festId,
    };
    setPlatformNotifications((prev) => [notif, ...prev]);

    logPlatformAudit(
      'SUSPEND_FEST',
      'fest',
      festId,
      `Suspended fest ${festId} ("${target.name}"). Reason: "${reason}". Access restricted and public site unpublished.`,
      target.status,
      'suspended'
    );

    addToast('warning', 'Fest Suspended', `${target.name} has been suspended.`);
  };

  const reactivateFest = (festId: string) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can reactivate fests.');
      return;
    }
    const target = fests.find((f) => f.id === festId);
    if (!target) return;
    const restoredStatus: FestLifecycleStatus = 'ongoing';
    setFests((prev) =>
      prev.map((f) =>
        f.id === festId
          ? { ...f, status: restoredStatus, suspensionReason: undefined }
          : f
      )
    );

    logPlatformAudit(
      'REACTIVATE_FEST',
      'fest',
      festId,
      `Reactivated fest ${festId} ("${target.name}"). Status restored to ${restoredStatus}.`,
      'suspended',
      restoredStatus
    );

    addToast('success', 'Fest Reactivated', `${target.name} is now active.`);
  };

  const archiveFest = (festId: string) => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Super Admins can archive fests.');
      return;
    }
    const target = fests.find((f) => f.id === festId);
    if (!target) return;
    setFests((prev) =>
      prev.map((f) => (f.id === festId ? { ...f, status: 'archived' } : f))
    );

    logPlatformAudit(
      'ARCHIVE_FEST',
      'fest',
      festId,
      `Archived completed fest ${festId} ("${target.name}").`,
      target.status,
      'archived'
    );

    addToast('info', 'Fest Archived', `${target.name} moved to archive.`);
  };

  const updateFestMetadata = (festId: string, updates: Partial<Fest>) => {
    setFests((prev) =>
      prev.map((f) => (f.id === festId ? { ...f, ...updates } : f))
    );

    logPlatformAudit(
      'UPDATE_FEST_METADATA',
      'fest',
      festId,
      `Updated platform metadata for fest ${festId}: ${Object.keys(updates).join(', ')}.`
    );

    addToast('success', 'Fest Details Saved', 'Platform-level fest record updated.');
  };

  const reassignFestAdmin = (festId: string, newAdminId: string, newAdminName: string, newAdminEmail: string) => {
    const target = fests.find((f) => f.id === festId);
    if (!target) return;
    const oldAdmin = target.adminName;

    setFests((prev) =>
      prev.map((f) =>
        f.id === festId
          ? {
              ...f,
              adminId: newAdminId,
              adminName: newAdminName,
              adminEmail: newAdminEmail,
            }
          : f
      )
    );

    logPlatformAudit(
      'REASSIGN_FEST_ADMIN',
      'fest',
      festId,
      `Reassigned administration of ${festId} from ${oldAdmin} to ${newAdminName} (${newAdminEmail}).`,
      target.adminId,
      newAdminId
    );

    addToast('success', 'Admin Reassigned', `Fest ${target.name} is now assigned to ${newAdminName}.`);
  };

  const updateMilestoneStatus = (milestoneId: string, completed: boolean) => {
    const now = completed ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined;
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId ? { ...m, completed, completedAt: now } : m
      )
    );

    const mItem = milestones.find((m) => m.id === milestoneId);
    if (mItem) {
      const festMilestones = milestones
        .map((m) => (m.id === milestoneId ? { ...m, completed } : m))
        .filter((m) => m.festId === mItem.festId);
      const completedCount = festMilestones.filter((m) => m.completed).length;
      const pct = Math.round((completedCount / (festMilestones.length || 1)) * 100);
      setFests((prev) =>
        prev.map((f) => (f.id === mItem.festId ? { ...f, completionPercentage: pct } : f))
      );
    }

    addToast('info', 'Milestone Updated', 'Progress metrics recalculated.');
  };

  const updatePlatformSettings = (newSettings: PlatformSettings) => {
    setPlatformSettings(newSettings);
    logPlatformAudit(
      'UPDATE_PLATFORM_SETTINGS',
      'platform_settings',
      'GLOBAL',
      `Updated platform governance settings by ${currentUser.name}.`
    );
    addToast('success', 'Platform Settings Saved', 'Global platform parameters have been applied.');
  };

  const markNotificationAsRead = (id: string) => {
    setPlatformNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setPlatformNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'Notifications Cleared', 'All alerts marked as read.');
  };

  const switchPortal = (portal: PortalType, targetFestId?: string) => {
    setCurrentPortal(portal);
    if (targetFestId) {
      setActiveFestId(targetFestId);
    }
    try {
      localStorage.setItem('festflow_portal', portal);
      const url = new URL(window.location.href);
      url.searchParams.set('portal', portal);
      if (targetFestId) url.searchParams.set('fest', targetFestId);
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      // ignore
    }
  };

  const activeFest = useMemo(() => {
    return fests.find((f) => f.id === activeFestId) || fests[0];
  }, [fests, activeFestId]);

  // Team Leader Portal Mutators
  const submitComplaint = (data: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt' | 'statusHistory'>) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const id = `CMP-${new Date().getFullYear()}-${String(complaints.length + 1).padStart(3, '0')}`;
    const newComplaint: Complaint = {
      ...data,
      id,
      submittedAt: now,
      updatedAt: now,
      status: 'submitted',
      statusHistory: [
        {
          date: now,
          actor: `${currentUser.name} (${currentUser.role})`,
          status: 'submitted',
          note: 'Initial complaint / appeal lodged.'
        }
      ]
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    saveComplaintToFirestore(newComplaint);
    addToast('success', 'Complaint Submitted', `Complaint reference #${id} has been formally recorded.`);
    logActivity('SUBMIT_COMPLAINT', 'team', activeTeamId, `${activeTeam?.name || 'Team'} lodged appeal #${id} for ${data.programmeName}.`);
  };

  const updateComplaintStatus = (complaintId: string, status: ComplaintStatus, note?: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let updatedHistory: ComplaintHistoryEntry[] = [];
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          updatedHistory = [
            ...c.statusHistory,
            {
              date: now,
              actor: `${currentUser.name} (${currentUser.role})`,
              status,
              note: note || `Status changed to ${status.replace('_', ' ')}`
            }
          ];
          return {
            ...c,
            status,
            updatedAt: now,
            statusHistory: updatedHistory
          };
        }
        return c;
      })
    );
    updateComplaintInFirestore(complaintId, { status, updatedAt: now, statusHistory: updatedHistory });
    addToast('info', 'Complaint Updated', `Complaint #${complaintId} status updated to ${status.replace('_', ' ')}.`);
  };

  const resolveComplaint = (complaintId: string, resolutionNote: string, calibratedScore?: number) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let updatedHistory: ComplaintHistoryEntry[] = [];
    const targetComplaint = complaints.find(c => c.id === complaintId);

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          updatedHistory = [
            ...c.statusHistory,
            {
              date: now,
              actor: `${currentUser.name} (Reviewer)`,
              status: 'resolved',
              note: resolutionNote
            }
          ];
          return {
            ...c,
            status: 'resolved',
            resolutionNote,
            calibratedScore,
            updatedAt: now,
            reviewerId: currentUser.id,
            reviewerName: currentUser.name,
            statusHistory: updatedHistory
          };
        }
        return c;
      })
    );

    updateComplaintInFirestore(complaintId, {
      status: 'resolved',
      resolutionNote,
      calibratedScore,
      updatedAt: now,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      statusHistory: updatedHistory
    });

    // Authoritatively resolve complaint via trusted backend Cloud Function (generates secure RESOLVE_COMPLAINT audit)
    resolveComplaintViaCloudFunction(activeFestId, complaintId, resolutionNote, calibratedScore).catch((err) => {
      console.warn('[FestContext] Cloud function resolveComplaint call error:', err);
    });

    // If calibratedScore is set, route through official score-correction workflow with audit history
    if (calibratedScore !== undefined && targetComplaint?.programmeId) {
      const progScore = scores.find(
        (s) =>
          s.programmeId === targetComplaint.programmeId &&
          (s.teamId === targetComplaint.teamId || (targetComplaint.participantId && s.participantId === targetComplaint.participantId))
      );
      if (progScore) {
        submitOrUpdateScore({
          ...progScore,
          id: progScore.id,
          scores: progScore.scores.map((sc) => ({ ...sc, marksObtained: Math.min(sc.maxMarks, calibratedScore) })),
          notes: `Score calibrated from ${progScore.totalScore} to ${calibratedScore} pursuant to appeal #${complaintId}. Reason: ${resolutionNote}`,
        });
      }
    }

    addToast('success', 'Complaint Resolved', `Complaint #${complaintId} resolved with official jury note.`);
  };

  const assignParticipantToProgramme = (data: Omit<ProgrammeAssignment, 'id' | 'assignedAt'>) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const id = `ASG-${Date.now().toString().slice(-4)}`;
    const newAsg: ProgrammeAssignment = {
      ...data,
      id,
      assignedAt: now,
    };
    setAssignments((prev) => [newAsg, ...prev]);
    saveProgrammeAssignmentToFirestore(newAsg);
    setParticipants((prev) =>
      prev.map((p) => {
        if (data.participantIds.includes(p.id)) {
          if (!p.registeredProgrammes.includes(data.programmeId)) {
            return { ...p, registeredProgrammes: [...p.registeredProgrammes, data.programmeId] };
          }
        }
        return p;
      })
    );
    addToast('success', 'Programme Assigned', `Assigned ${data.participantNames.join(', ')} to ${data.programmeName}.`);
  };

  const withdrawAssignment = (assignmentId: string) => {
    const asg = assignments.find((a) => a.id === assignmentId);
    if (!asg) return;
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    deleteProgrammeAssignmentFromFirestore(assignmentId);
    setParticipants((prev) =>
      prev.map((p) => {
        if (asg.participantIds.includes(p.id)) {
          return { ...p, registeredProgrammes: p.registeredProgrammes.filter((pid) => pid !== asg.programmeId) };
        }
        return p;
      })
    );
    addToast('info', 'Assignment Withdrawn', `Assignment #${assignmentId} was withdrawn.`);
  };

  const addTeamMember = (data: Omit<Participant, 'id' | 'createdAt'>): boolean => {
    if (currentUser.role === 'team_leader') {
      const res = inviteParticipantByTeamLeader({
        name: data.name,
        phone: data.phone,
        email: data.email,
        college: data.college || data.institution,
        institution: data.institution || data.college,
        classOrDivision: data.classOrDivision,
        category: data.category,
        teamId: data.teamId,
      });
      return res.success;
    }
    return addParticipant(data);
  };

  const updateTeamMember = (id: string, updates: Partial<Participant>) => {
    updateParticipant(id, updates);
  };

  // =========================================================================
  // ADMIN: TEAM LEADER ACCOUNT MANAGEMENT
  // =========================================================================

  const createTeamLeaderAccount = (data: {
    name: string;
    phone: string;
    email: string;
    teamId: string;
    institution?: string;
    status?: 'active' | 'suspended' | 'inactive';
    remarks?: string;
  }) => {
    // 1. Validate Admin's permission to manage the fest
    if (!hasPermission(['admin', 'super_admin'])) {
      return {
        success: false,
        message: 'Permission denied: Only authorized Fest Admins or Super Admins can create Team Leaders.'
      };
    }

    if (currentUser.role === 'admin' && currentUser.festId && currentUser.festId !== activeFestId) {
      return {
        success: false,
        message: `Permission denied: You are not authorized to administer fest ${activeFestId}. Authorized fest: ${currentUser.festId}.`
      };
    }

    // 2. Validate that the selected team belongs to that fest
    const targetTeam = teams.find(t => t.id === data.teamId);
    if (!targetTeam) {
      return { success: false, message: 'Invalid team: The selected team does not exist in this fest.' };
    }

    if (targetTeam.festId && targetTeam.festId !== activeFestId) {
      return {
        success: false,
        message: `Invalid team: Team ${targetTeam.name} does not belong to the active fest ${activeFestId}.`
      };
    }

    const normalized = normalizePhoneNumber(data.phone);
    if (!normalized || normalized.length < 10) {
      return { success: false, message: 'Please enter a valid mobile number with country code.' };
    }

    // 3. Check duplicate phone in users
    const existingUser = users.find(u => u.phone && normalizePhoneNumber(u.phone) === normalized);
    if (existingUser) {
      return {
        success: false,
        message: `An account already exists for phone ${data.phone} (${existingUser.name}, Role: ${existingUser.role}).`,
      };
    }

    // 4. Check for existing pending invitation
    const existingInvitation = teamLeaderInvitations.find(
      inv => inv.phone === normalized && inv.status === 'pending_verification'
    );
    if (existingInvitation) {
      return {
        success: false,
        message: `A pending invitation already exists for mobile ${data.phone} (${existingInvitation.name}, Team: ${existingInvitation.teamName}).`
      };
    }

    // 5. Check if team already has an active team leader
    const existingLeader = users.find(
      u => u.role === 'team_leader' && u.linkedTeamId === data.teamId && u.status === 'active'
    );
    if (existingLeader) {
      return {
        success: false,
        message: `Team is already assigned to active Team Leader ${existingLeader.name}. Reassign or deactivate first.`,
      };
    }

    const id = `USR-${String(users.length + 1).padStart(2, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // 6. Create trusted Team Leader invitation record
    const invId = `INV-${new Date().getFullYear()}-${String(teamLeaderInvitations.length + 1).padStart(3, '0')}`;
    const newInvitation: TeamLeaderInvitation = {
      id: invId,
      festId: activeFestId,
      teamId: data.teamId,
      teamName: targetTeam.name,
      phone: normalized,
      name: data.name.trim(),
      email: data.email.trim(),
      institution: data.institution?.trim() || targetTeam.institution,
      status: 'pending_verification',
      createdByAdminId: currentUser.id,
      createdByAdminName: currentUser.name,
      createdAt: now,
      notes: data.remarks?.trim(),
    };
    setTeamLeaderInvitations(prev => [newInvitation, ...prev]);
    saveTeamLeaderInvitation(newInvitation);

    const newUser: User = {
      id,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: formatPhoneDisplay(normalized),
      phoneVerified: false, // Must verify OTP on first login
      role: 'team_leader',
      status: data.status || 'active',
      linkedTeamId: data.teamId,
      institution: data.institution?.trim() || targetTeam.institution || '',
      festId: activeFestId,
      invitationStatus: 'pending_verification',
      invitedAt: now,
      remarks: data.remarks?.trim(),
      createdAt: now.slice(0, 10),
    };

    setUsers(prev => [newUser, ...prev]);
    saveUserToFirestore(newUser);

    // Update team's leader name and contact
    setTeams(prev => prev.map(t => {
      if (t.id === data.teamId) {
        const updatedTeam = {
          ...t,
          teamLeaderName: data.name.trim(),
          teamLeaderContact: formatPhoneDisplay(normalized),
        };
        saveTeamToFirestore(updatedTeam);
        return updatedTeam;
      }
      return t;
    }));

    // Record audit log & activity log
    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Create Team Leader Account',
      targetType: 'user',
      targetId: id,
      details: `Created Team Leader account for ${data.name} assigned to team ${data.teamId}. Invitation sent via phone OTP.`,
    });

    logPlatformAudit(
      'CREATE_TEAM_LEADER',
      'user',
      id,
      `Admin ${currentUser.name} created team leader account for ${data.name} (${formatPhoneDisplay(normalized)}).`
    );

    addToast('success', 'Team Leader Created', `Invitation created for ${data.name}. Phone verification required.`);
    return { success: true, message: 'Team Leader account created successfully.', user: newUser };
  };

  const updateTeamLeaderAccount = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...updates };
        if (updates.name || updates.phone) {
          if (updated.linkedTeamId) {
            setTeams(tPrev => tPrev.map(t => t.id === updated.linkedTeamId ? {
              ...t,
              ...(updates.name ? { teamLeaderName: updates.name } : {}),
              ...(updates.phone ? { teamLeaderContact: updates.phone } : {}),
            } : t));
          }
        }
        return updated;
      }
      return u;
    }));

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Update Team Leader',
      targetType: 'user',
      targetId: userId,
      details: `Updated details for Team Leader ${userId}.`,
    });
    addToast('success', 'Account Updated', 'Team Leader profile updated.');
  };

  const reassignTeamLeader = (userId: string, newTeamId: string) => {
    if (!hasPermission(['admin', 'super_admin'])) {
      return { success: false, message: 'Permission denied: Only authorized Admins can reassign Team Leaders.' };
    }

    if (currentUser.role === 'admin' && currentUser.festId && currentUser.festId !== activeFestId) {
      return {
        success: false,
        message: `Permission denied: You are not authorized to administer fest ${activeFestId}. Authorized fest: ${currentUser.festId}.`
      };
    }

    const leader = users.find(u => u.id === userId);
    if (!leader) return { success: false, message: 'User not found.' };

    const targetTeam = teams.find(t => t.id === newTeamId);
    if (!targetTeam) return { success: false, message: 'Target team does not exist.' };

    if (targetTeam.festId && targetTeam.festId !== activeFestId) {
      return {
        success: false,
        message: `Invalid team: Team ${targetTeam.name} does not belong to the active fest ${activeFestId}.`
      };
    }

    const conflictingLeader = users.find(
      u => u.id !== userId && u.role === 'team_leader' && u.linkedTeamId === newTeamId && u.status === 'active'
    );
    if (conflictingLeader) {
      return { success: false, message: `Team ${targetTeam.name} already has active leader ${conflictingLeader.name}.` };
    }

    const previousTeamId = leader.linkedTeamId;
    const updatedLeader = { ...leader, linkedTeamId: newTeamId };

    setUsers(prev => prev.map(u => u.id === userId ? updatedLeader : u));
    saveUserToFirestore(updatedLeader);

    setTeams(prev => prev.map(t => {
      if (t.id === newTeamId) {
        const updatedNewTeam = { ...t, teamLeaderName: leader.name, teamLeaderContact: leader.phone || leader.email };
        saveTeamToFirestore(updatedNewTeam);
        return updatedNewTeam;
      }
      if (t.id === previousTeamId) {
        const updatedOldTeam = { ...t, teamLeaderName: 'Unassigned', teamLeaderContact: '' };
        saveTeamToFirestore(updatedOldTeam);
        return updatedOldTeam;
      }
      return t;
    }));

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Reassign Team Leader',
      targetType: 'team',
      targetId: newTeamId,
      details: `Reassigned ${leader.name} from team ${previousTeamId || 'None'} to ${targetTeam.name} (${newTeamId}).`,
    });

    logPlatformAudit(
      'REASSIGN_TEAM_LEADER',
      'user',
      userId,
      `Reassigned ${leader.name} to team ${targetTeam.name}.`
    );

    addToast('success', 'Team Reassigned', `${leader.name} reassigned to ${targetTeam.name}.`);
    return { success: true, message: `Successfully reassigned to ${targetTeam.name}.` };
  };

  const toggleTeamLeaderStatus = (userId: string, newStatus: 'active' | 'suspended' | 'inactive') => {
    if (!hasPermission(['admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Admins can change account status.');
      return;
    }

    if (currentUser.role === 'admin' && currentUser.festId && currentUser.festId !== activeFestId) {
      addToast('error', 'Permission Denied', `You are not authorized to administer fest ${activeFestId}.`);
      return;
    }

    const leader = users.find(u => u.id === userId);
    if (leader) {
      const updatedLeader = {
        ...leader,
        status: newStatus,
        invitationStatus: newStatus === 'suspended' ? ('suspended' as const) : leader.invitationStatus,
      };
      saveUserToFirestore(updatedLeader);
    }

    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      status: newStatus,
      invitationStatus: newStatus === 'suspended' ? 'suspended' : u.invitationStatus,
    } : u));

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `${newStatus === 'active' ? 'Reactivate' : 'Suspend'} Team Leader`,
      targetType: 'user',
      targetId: userId,
      details: `Changed account status of ${userId} to ${newStatus}.`,
    });

    logPlatformAudit(
      newStatus === 'active' ? 'REACTIVATE_TEAM_LEADER' : 'SUSPEND_TEAM_LEADER',
      'user',
      userId,
      `Admin ${currentUser.name} changed status of team leader ${leader?.name || userId} to ${newStatus}.`
    );

    addToast('info', 'Status Updated', `Team Leader account marked as ${newStatus}.`);
  };

  const resendTeamLeaderInvite = (userId: string) => {
    const leader = users.find(u => u.id === userId);
    if (!leader || !leader.phone) {
      return { success: false, message: 'User or registered phone number not found.' };
    }
    const normalized = normalizePhoneNumber(leader.phone);
    const invitation = teamLeaderInvitations.find(inv => inv.phone === normalized);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (invitation) {
      const updatedInv = { ...invitation, notes: `Resent at ${now}` };
      saveTeamLeaderInvitation(updatedInv);
    }
    const simulatedOtp = '748291';
    addToast('info', 'Invitation Sent', `SMS sent to ${leader.phone}. OTP for verification: ${simulatedOtp}`);
    return { success: true, message: `Invitation resent to ${leader.phone}.`, otpCode: simulatedOtp };
  };

  // =========================================================================
  // PARTICIPANT REGISTRATION & APPROVAL (HYBRID METHOD)
  // =========================================================================

  const registerParticipantSelf = (data: {
    name: string;
    phone: string;
    email: string;
    college?: string;
    institution?: string;
    classOrDivision?: string;
    category: Participant['category'];
    requestedTeamId: string;
    photoUrl?: string;
  }) => {
    // 1. Validate required fields
    if (!data.name.trim()) {
      return { success: false, message: 'Participant name is required.', participantId: '' };
    }
    if (!data.email.trim() || !data.email.includes('@')) {
      return { success: false, message: 'Valid email address is required.', participantId: '' };
    }
    if (!data.requestedTeamId) {
      return { success: false, message: 'Please select a team to join.', participantId: '' };
    }

    const normalized = normalizePhoneNumber(data.phone);
    if (!normalized || normalized.length < 10) {
      return { success: false, message: 'Invalid mobile phone number format.', participantId: '' };
    }

    // 2. Validate that the selected team belongs to the active fest
    const targetTeam = teams.find(t => t.id === data.requestedTeamId);
    if (!targetTeam) {
      return { success: false, message: 'Invalid team: Requested team does not exist.', participantId: '' };
    }
    if (targetTeam.festId && targetTeam.festId !== activeFestId) {
      return {
        success: false,
        message: `Invalid team: Team ${targetTeam.name} does not belong to active fest ${activeFestId}.`,
        participantId: ''
      };
    }

    // 3. Duplicate phone check in the fest
    const existing = participants.find(
      p => p.phone && normalizePhoneNumber(p.phone) === normalized && (p.festId === activeFestId || !p.festId)
    );
    if (existing) {
      return {
        success: false,
        message: `A participant with mobile ${data.phone} is already registered (${existing.name}, ID: ${existing.id}).`,
        participantId: existing.id,
      };
    }

    const id = `PT-${String(participants.length + 101)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newParticipant: Participant = {
      id,
      userId: currentUser.id || id,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: formatPhoneDisplay(normalized),
      phoneVerified: true, // Self-registered user already verified phone OTP during login
      college: data.college?.trim() || data.institution?.trim() || '',
      institution: data.institution?.trim() || data.college?.trim() || '',
      classOrDivision: data.classOrDivision?.trim() || '',
      photoUrl: data.photoUrl?.trim(),
      teamId: data.requestedTeamId,
      requestedTeamId: data.requestedTeamId,
      category: data.category,
      registeredProgrammes: [],
      status: 'registered',
      approvalStatus: 'pending_approval',
      registrationSource: 'self_registration',
      festId: activeFestId,
      createdAt: now.slice(0, 10),
      updatedAt: now,
    };

    setParticipants(prev => [newParticipant, ...prev]);
    saveParticipantToFirestore(newParticipant);

    setPlatformNotifications(prev => [
      {
        id: `NOTIF-${Date.now().toString().slice(-6)}`,
        title: 'New Participant Registration Request',
        message: `${data.name} has requested to join team ${targetTeam.name}. Review in Participant Requests tab.`,
        severity: 'info',
        category: 'fest_request',
        read: false,
        createdAt: now,
        relatedFestId: activeFestId,
      },
      ...prev,
    ]);

    StorageService.addActivityLog({
      userId: currentUser.id || id,
      userName: data.name,
      userRole: 'participant',
      action: 'Participant Self-Registration',
      targetType: 'participant',
      targetId: id,
      details: `${data.name} self-registered requesting team ${targetTeam.name}. Status: Pending Approval.`,
    });

    addToast('success', 'Registration Submitted', `Registration submitted! Awaiting Team Leader approval.`);
    return { success: true, message: 'Registration submitted successfully. Awaiting approval.', participantId: id };
  };

  const inviteParticipantByTeamLeader = (data: {
    name: string;
    phone: string;
    email: string;
    college?: string;
    institution?: string;
    classOrDivision?: string;
    category: Participant['category'];
    teamId: string;
  }) => {
    // 1. Authorize: Team Leader can only add to their own authorized team
    if (currentUser.role === 'team_leader' && currentUser.linkedTeamId !== data.teamId) {
      return {
        success: false,
        message: `Permission denied: Team Leaders can only add members to their own authorized team (${currentUser.linkedTeamId}).`,
        participantId: ''
      };
    }

    if (!data.name.trim()) {
      return { success: false, message: 'Member full name is required.', participantId: '' };
    }
    if (!data.email.trim() || !data.email.includes('@')) {
      return { success: false, message: 'Valid email address is required.', participantId: '' };
    }

    const normalized = normalizePhoneNumber(data.phone);
    if (!normalized || normalized.length < 10) {
      return { success: false, message: 'Invalid mobile phone number format.', participantId: '' };
    }

    // 2. Validate that the team belongs to the active fest
    const targetTeam = teams.find(t => t.id === data.teamId);
    if (!targetTeam) {
      return { success: false, message: 'Invalid team: Selected team does not exist.', participantId: '' };
    }
    if (targetTeam.festId && targetTeam.festId !== activeFestId) {
      return {
        success: false,
        message: `Invalid team: Team ${targetTeam.name} does not belong to active fest ${activeFestId}.`,
        participantId: ''
      };
    }

    // 3. Prevent duplicate requests/members
    const existing = participants.find(
      p => p.phone && normalizePhoneNumber(p.phone) === normalized && (p.festId === activeFestId || !p.festId)
    );
    if (existing) {
      return {
        success: false,
        message: `Participant with mobile ${data.phone} already exists in the roster (${existing.name}, ID: ${existing.id}).`,
        participantId: existing.id,
      };
    }

    const id = `PT-${String(participants.length + 101)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Team Leader adding participant requires participant phone OTP verification before full activation
    const newParticipant: Participant = {
      id,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: formatPhoneDisplay(normalized),
      phoneVerified: false, // Must verify phone OTP before activation
      college: data.college?.trim() || data.institution?.trim() || targetTeam.institution || '',
      institution: data.institution?.trim() || data.college?.trim() || targetTeam.institution || '',
      classOrDivision: data.classOrDivision?.trim() || '',
      teamId: data.teamId,
      requestedTeamId: data.teamId,
      category: data.category,
      registeredProgrammes: [],
      status: 'registered', // Registered but pending verification
      approvalStatus: 'pending_verification',
      registrationSource: 'team_leader_invitation',
      approvedBy: currentUser.name,
      reviewedByLeaderId: currentUser.id,
      reviewedAt: now,
      festId: activeFestId,
      createdAt: now.slice(0, 10),
      updatedAt: now,
    };

    setParticipants(prev => [newParticipant, ...prev]);
    saveParticipantToFirestore(newParticipant);

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Invite Participant',
      targetType: 'participant',
      targetId: id,
      details: `Team Leader ${currentUser.name} invited ${data.name} to team ${targetTeam.name}. Phone verification required.`,
    });

    addToast('success', 'Participant Invited', `Invitation created for ${data.name}. Participant must verify phone OTP to activate.`);
    return { success: true, message: 'Participant added. Awaiting phone verification by participant.', participantId: id };
  };

  const approveParticipantRequest = (participantId: string) => {
    const target = participants.find(p => p.id === participantId);
    if (!target) return { success: false, message: 'Participant request not found.' };

    const targetTeamId = target.requestedTeamId || target.teamId;

    // 1. Participant cannot approve their own registration
    if (currentUser.role === 'participant' || (currentUser.id && currentUser.id === target.userId)) {
      return {
        success: false,
        message: 'Permission denied: Participants cannot approve their own registration requests.'
      };
    }

    // 2. Reviewer authorization check
    if (!hasPermission(['team_leader', 'admin', 'fest_admin', 'super_admin'])) {
      return {
        success: false,
        message: 'Permission denied: Unauthorized reviewer role.'
      };
    }

    // 3. Team Leader can only review requests for their own team
    if (currentUser.role === 'team_leader' && currentUser.linkedTeamId !== targetTeamId) {
      return {
        success: false,
        message: `Permission denied: Team Leaders can only approve requests for their authorized team (${currentUser.linkedTeamId}).`
      };
    }

    // 4. Fest Admin check
    if (currentUser.role === 'admin' && currentUser.festId && currentUser.festId !== activeFestId) {
      return {
        success: false,
        message: `Permission denied: You are not authorized to administer fest ${activeFestId}.`
      };
    }

    // 5. Confirm that the team belongs to the active fest
    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!targetTeam) {
      return { success: false, message: 'Invalid team: The requested team does not exist.' };
    }
    if (targetTeam.festId && targetTeam.festId !== activeFestId) {
      return {
        success: false,
        message: `Invalid team: Team ${targetTeam.name} does not belong to active fest ${activeFestId}.`
      };
    }

    // 6. Duplicate active membership check: confirm participant is not an active member of another team in the fest
    const targetPhoneNorm = normalizePhoneNumber(target.phone);
    const conflictingActiveMember = participants.find(
      p =>
        p.id !== participantId &&
        p.phone &&
        normalizePhoneNumber(p.phone) === targetPhoneNorm &&
        (p.festId === activeFestId || !p.festId) &&
        p.approvalStatus === 'approved' &&
        p.teamId !== targetTeamId
    );
    if (conflictingActiveMember) {
      return {
        success: false,
        message: `Conflict: Participant is already an active approved member of team ${conflictingActiveMember.teamId}. Cannot belong to multiple teams.`
      };
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const isLeader = currentUser.role === 'team_leader';

    const updatedParticipant: Participant = {
      ...target,
      approvalStatus: 'approved',
      status: target.phoneVerified ? 'verified' : 'registered',
      teamId: targetTeamId,
      requestedTeamId: targetTeamId,
      approvedAt: now,
      approvedBy: currentUser.name,
      reviewedAt: now,
      reviewedByLeaderId: isLeader ? currentUser.id : target.reviewedByLeaderId,
      reviewedByAdminId: !isLeader ? currentUser.id : target.reviewedByAdminId,
      rejectionReason: undefined,
      updatedAt: now,
    };

    setParticipants(prev => prev.map(p => (p.id === participantId ? updatedParticipant : p)));
    saveParticipantToFirestore(updatedParticipant);

    setPlatformNotifications(prev => [
      {
        id: `NOTIF-${Date.now().toString().slice(-6)}`,
        title: 'Participant Request Approved',
        message: `Request for ${target.name} to join team ${targetTeam.name} was approved by ${currentUser.name}.`,
        severity: 'success',
        category: 'fest_request',
        read: false,
        createdAt: now,
        relatedFestId: activeFestId,
      },
      ...prev,
    ]);

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Approve Participant Request',
      targetType: 'participant',
      targetId: participantId,
      details: `${currentUser.name} approved participant ${target.name} (${participantId}) for team ${targetTeam.name}.`,
    });

    logPlatformAudit(
      'APPROVE_PARTICIPANT',
      'user',
      participantId,
      `User ${currentUser.name} approved participant ${target.name} for team ${targetTeam.name}.`
    );

    addToast('success', 'Request Approved', `${target.name} is now an active member of ${targetTeam.name}.`);
    return { success: true, message: 'Participant request approved.' };
  };

  const rejectParticipantRequest = (participantId: string, reason: string) => {
    const target = participants.find(p => p.id === participantId);
    if (!target) return { success: false, message: 'Participant request not found.' };

    const targetTeamId = target.requestedTeamId || target.teamId;

    // 1. Participant cannot reject requests
    if (currentUser.role === 'participant') {
      return {
        success: false,
        message: 'Permission denied: Participants cannot review registration requests.'
      };
    }

    // 2. Reviewer authorization check
    if (!hasPermission(['team_leader', 'admin', 'fest_admin', 'super_admin'])) {
      return {
        success: false,
        message: 'Permission denied: Unauthorized reviewer role.'
      };
    }

    // 3. Team Leader can only reject for their own team
    if (currentUser.role === 'team_leader' && currentUser.linkedTeamId !== targetTeamId) {
      return {
        success: false,
        message: `Permission denied: Team Leaders can only reject requests for their authorized team (${currentUser.linkedTeamId}).`
      };
    }

    if (!reason || !reason.trim()) {
      return { success: false, message: 'Rejection reason is required.' };
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const isLeader = currentUser.role === 'team_leader';

    const updatedParticipant: Participant = {
      ...target,
      approvalStatus: 'rejected',
      status: 'inactive',
      rejectionReason: reason.trim(),
      reviewedAt: now,
      reviewedByLeaderId: isLeader ? currentUser.id : target.reviewedByLeaderId,
      reviewedByAdminId: !isLeader ? currentUser.id : target.reviewedByAdminId,
      updatedAt: now,
    };

    setParticipants(prev => prev.map(p => (p.id === participantId ? updatedParticipant : p)));
    saveParticipantToFirestore(updatedParticipant);

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Reject Participant Request',
      targetType: 'participant',
      targetId: participantId,
      details: `${currentUser.name} rejected participant ${target.name} (${participantId}). Reason: ${reason.trim()}`,
    });

    logPlatformAudit(
      'REJECT_PARTICIPANT',
      'user',
      participantId,
      `User ${currentUser.name} rejected participant ${target.name}. Reason: ${reason.trim()}`
    );

    addToast('error', 'Request Rejected', `Request from ${target.name} has been rejected.`);
    return { success: true, message: 'Participant request rejected.' };
  };

  const requestMoreInfoForParticipant = (participantId: string, message: string) => {
    const target = participants.find(p => p.id === participantId);
    if (!target) return { success: false, message: 'Participant not found.' };

    if (!message || !message.trim()) {
      return { success: false, message: 'Information request message is required.' };
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updatedParticipant: Participant = {
      ...target,
      approvalStatus: 'more_info_required',
      moreInfoRequest: message.trim(),
      updatedAt: now,
    };

    setParticipants(prev => prev.map(p => (p.id === participantId ? updatedParticipant : p)));
    saveParticipantToFirestore(updatedParticipant);

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Request More Information',
      targetType: 'participant',
      targetId: participantId,
      details: `${currentUser.name} requested more info from ${target.name}: ${message.trim()}`,
    });

    addToast('info', 'More Info Requested', `Sent information request to ${target.name}.`);
    return { success: true, message: 'Information request recorded.' };
  };

  const verifyParticipantPhone = (participantId: string): boolean => {
    let updated = false;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        updated = true;
        const newApprovalStatus = p.approvalStatus === 'pending_verification' ? 'approved' : p.approvalStatus;
        const newStatus = (newApprovalStatus === 'approved') ? 'verified' : p.status;
        const updatedPart: Participant = {
          ...p,
          phoneVerified: true,
          approvalStatus: newApprovalStatus,
          status: newStatus,
          updatedAt: now,
        };
        saveParticipantToFirestore(updatedPart);
        return updatedPart;
      }
      return p;
    }));
    return updated;
  };

  // Reset demo data
  const resetToDefaultData = () => {
    StorageService.resetToDefaultData();
    setSettings(StorageService.getSettings());
    setTeams(StorageService.getTeams());
    setParticipants(StorageService.getParticipants());
    setJudges(StorageService.getJudges());
    setProgrammes(StorageService.getProgrammes());
    setScores(StorageService.getScoreSubmissions());
    setResults(StorageService.getApprovedResults());
    setScheduleSlots(StorageService.getScheduleSlots());
    setUsers(StorageService.getUsers());
    setCurrentUser(StorageService.getCurrentUser());
    setActivityLogs(StorageService.getActivityLogs());
    setAnnouncements(StorageService.getAnnouncements());
    setGallery(StorageService.getGallery());
    setFests(StorageService.getFests());
    setFestRequests(StorageService.getFestRequests());
    setPlatformSettings(StorageService.getPlatformSettings());
    setMilestones(StorageService.getMilestones());
    setPlatformNotifications(StorageService.getPlatformNotifications());
    setPlatformAuditLogs(StorageService.getPlatformAuditLogs());
    setComplaints(StorageService.getComplaints());
    setAssignments(StorageService.getAssignments());
    addToast('info', 'Database Reset', 'Platform & fest records restored to baseline.');
  };

  return (
    <FestContext.Provider
      value={{
        currentPortal,
        setCurrentPortal,
        switchPortal,
        activeTab,
        setActiveTab,
        superAdminTab,
        setSuperAdminTab,
        teamLeaderTab,
        setTeamLeaderTab,
        activeTeamId,
        setActiveTeamId,
        activeTeam,
        complaints,
        assignments,
        submitComplaint,
        updateComplaintStatus,
        resolveComplaint,
        assignParticipantToProgramme,
        withdrawAssignment,
        addTeamMember,
        updateTeamMember,
        participantTab,
        setParticipantTab,
        activeParticipantId,
        setActiveParticipantId,
        activeParticipant,
        teamLeaderInvitations,
        createTeamLeaderAccount,
        updateTeamLeaderAccount,
        reassignTeamLeader,
        toggleTeamLeaderStatus,
        resendTeamLeaderInvite,
        registerParticipantSelf,
        inviteParticipantByTeamLeader,
        approveParticipantRequest,
        rejectParticipantRequest,
        requestMoreInfoForParticipant,
        verifyParticipantPhone,
        navigateToTabWithFilter,
        activeFestId,
        setActiveFestId,
        activeFest,
        currentUser,
        switchCurrentUser,
        logout,
        hasPermission,
        settings,
        teams,
        participants,
        judges,
        programmes,
        scores,
        results,
        scheduleSlots,
        users,
        activityLogs,
        announcements,
        gallery,
        fests,
        festRequests,
        platformSettings,
        milestones,
        platformNotifications,
        platformAuditLogs,
        dashboardFilters,
        setDashboardFilters,
        leaderboard,
        scheduleConflicts,
        summaryStats,
        addParticipant,
        updateParticipant,
        deleteParticipant,
        bulkImportParticipants,
        addJudge,
        updateJudge,
        deleteJudge,
        addProgramme,
        updateProgramme,
        deleteProgramme,
        duplicateProgramme,
        submitOrUpdateScore,
        updateScoreStatus,
        publishProgrammeResults,
        addTeam,
        updateTeam,
        deleteTeam,
        addScheduleSlot,
        updateScheduleSlot,
        deleteScheduleSlot,
        addUser,
        updateUser,
        deleteUser,
        updateSettings,
        addAnnouncement,
        deleteAnnouncement,
        approveFestRequest,
        rejectFestRequest,
        requestMoreInfo,
        assignReviewer,
        submitFestRequest,
        updateFestRequest,
        suspendFest,
        reactivateFest,
        archiveFest,
        updateFestMetadata,
        reassignFestAdmin,
        updateMilestoneStatus,
        updatePlatformSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        logPlatformAudit,
        resetToDefaultData,
        toasts,
        addToast,
        removeToast,
        firebaseStatus,
        syncFirestoreData,
      }}
    >
      {children}
    </FestContext.Provider>
  );
};

export const useFest = () => {
  const context = useContext(FestContext);
  if (!context) {
    throw new Error('useFest must be used within a FestProvider');
  }
  return context;
};
