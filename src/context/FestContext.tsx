import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
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
  TeamLeaderInvitation,
  FestCategory,
  TeamProgrammeEntry,
  CategoryScoreboardEntry
} from '../types';
import {
  StorageService,
  GUEST_USER,
  DEFAULT_FEST_CATEGORIES,
  calculateLeaderboard,
  calculateCategoryScoreboards,
  CategoryIndividualLeaderboardEntry,
  detectScheduleConflicts,
  TeamLeaderboardEntry,
  ScheduleConflict
} from '../services/storage';
import { normalizePhoneNumber, formatPhoneDisplay } from '../services/authService';
import { signOutUser } from '../firebase/authService';
import { isFirebaseConfigured } from '../firebase/config';
import {
  fetchFests,
  saveFestToFirestore,
  deleteFestFromFirestore,
  deleteFestCascading,
  fetchTeams,
  fetchParticipants,
  fetchProgrammes,
  fetchScores,
  fetchResults,
  fetchUsersFromFirestore,
  deleteUserFromFirestore,
  saveParticipantToFirestore,
  deleteParticipantFromFirestore,
  saveTeamToFirestore,
  deleteTeamFromFirestore,
  saveUserToFirestore,
  saveProgrammeToFirestore,
  deleteProgrammeFromFirestore,
  saveScoreToFirestore,
  saveScoresBatchToFirestore,
  deleteScoreFromFirestore,
  saveResultToFirestore,
  syncProgrammeResultsInFirestore,
  deleteResultFromFirestore,
  deleteProgrammeResultsFromFirestore,
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
  requestMoreInfoViaCloudFunction,
  fetchCategories,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  fetchTeamProgrammeEntries,
  saveTeamProgrammeEntryToFirestore,
  deleteTeamProgrammeEntryFromFirestore,
  fetchJudges,
  saveJudgeToFirestore,
  deleteJudgeFromFirestore,
  subscribeToLeaderboardResults,
  subscribeToScores
} from '../firebase/firestoreService';

export type NavigationTab =
  | 'dashboard'
  | 'participants'
  | 'judges'
  | 'programmes'
  | 'scores'
  | 'individual_scores'
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
  resendTeamLeaderInvite: (userId: string) => { success: boolean; message: string };

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
    chestNumber?: string;
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
  allTeams?: Team[];
  setTeams?: React.Dispatch<React.SetStateAction<Team[]>>;
  participants: Participant[];
  allParticipants?: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  judges: Judge[];
  allJudges?: Judge[];
  programmes: Programme[];
  allProgrammes?: Programme[];
  categories: FestCategory[];
  allCategories?: FestCategory[];
  teamProgrammeEntries: TeamProgrammeEntry[];
  scores: ScoreSubmission[];
  allScores?: ScoreSubmission[];
  results: ApprovedResult[];
  allResults?: ApprovedResult[];
  scheduleSlots: ScheduleSlot[];
  allScheduleSlots?: ScheduleSlot[];
  users: User[];
  allUsers?: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
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
  getCategoryScoreboard: (categoryName: string) => CategoryIndividualLeaderboardEntry[];
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
  updateParticipant: (id: string, updates: Partial<Participant>) => boolean;
  deleteParticipant: (id: string) => void;
  bulkImportParticipants: (newParticipants: Omit<Participant, 'id' | 'createdAt'>[]) => { added: number; duplicates: number };

  addJudge: (judge: Omit<Judge, 'id' | 'createdAt'>) => string | false;
  updateJudge: (id: string, updates: Partial<Judge>) => void;
  deleteJudge: (id: string) => void;

  addProgramme: (programme: Omit<Programme, 'id' | 'resultPublished'>) => boolean;
  updateProgramme: (id: string, updates: Partial<Programme>) => void;
  deleteProgramme: (id: string) => void;
  duplicateProgramme: (id: string) => void;

  submitOrUpdateScore: (score: Omit<ScoreSubmission, 'id' | 'submittedAt' | 'revisionHistory'> & { id?: string }) => void;
  submitScoresBatch: (scores: Array<Omit<ScoreSubmission, 'id' | 'submittedAt' | 'revisionHistory'> & { id?: string }>) => ScoreSubmission[];
  updateScoreStatus: (id: string, newStatus: ScoreStatus, notes?: string) => void;
  deleteScore: (scoreId: string) => void;
  publishProgrammeResults: (programmeId: string) => void;
  deleteResult: (resultId: string) => void;
  deleteProgrammeResults: (programmeId: string) => void;

  // Categories (General & Custom)
  addCategory: (cat: Omit<FestCategory, 'id' | 'createdAt'>) => Promise<boolean>;
  updateCategory: (id: string, updates: Partial<FestCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleGeneralCategory: (enabled: boolean) => Promise<void>;

  // Team Programme Entries
  createTeamProgrammeEntry: (entry: {
    programmeId: string;
    teamId: string;
    entryName: string;
    categoryId: string;
    memberParticipantIds: string[];
  }) => { success: boolean; error?: string; entryId?: string };
  updateTeamProgrammeEntry: (id: string, updates: Partial<TeamProgrammeEntry>) => { success: boolean; error?: string };
  deleteTeamProgrammeEntry: (id: string) => { success: boolean; error?: string };

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
  refreshFirestoreData: (force?: boolean) => Promise<void>;

  // Mutators - Super Admin & Platform Operations
  approveFestRequest: (requestId: string, approvalNote?: string) => Promise<void>;
  rejectFestRequest: (requestId: string, reason: string, note?: string) => void;
  requestMoreInfo: (requestId: string, message: string) => void;
  assignReviewer: (requestId: string, reviewerId: string, reviewerName: string) => void;
  submitFestRequest: (data: Omit<FestRequest, 'id' | 'submissionDate' | 'status' | 'history'>) => void;
  updateFestRequest: (requestId: string, updates: Partial<FestRequest>) => void;
  suspendFest: (festId: string, reason: string) => void;
  reactivateFest: (festId: string) => void;
  archiveFest: (festId: string) => void;
  deleteFestComplete: (festId: string) => Promise<boolean>;
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
  syncFirestoreData: (force?: boolean) => Promise<void>;
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

      const pathname = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();

      // 1. Explicit administrative / staff path and hash routes take immediate precedence
      if (pathname.includes('super-admin') || hash.includes('super-admin') || hash.includes('super_admin')) return 'super_admin';
      if (pathname.includes('team-leader') || hash.includes('team-leader') || hash.includes('team_leader')) return 'team_leader';
      if (pathname.includes('participant') || hash.includes('participant')) return 'participant';
      if (pathname.includes('admin.html') || pathname.endsWith('/admin') || pathname.includes('/admin/') || hash.includes('admin')) return 'fest_admin';

      // 2. Explicit public parameters override any stored administrative session for public visitors:
      // ?fest=..., ?festId=..., ?action=register, ?register=..., ?invite=..., ?token=..., /f/..., /invite...
      const isExplicitPublicRoute =
        urlParams.has('fest') ||
        urlParams.has('festId') ||
        urlParams.get('action') === 'register' ||
        urlParams.has('register') ||
        urlParams.has('token') ||
        urlParams.has('invite') ||
        pathname.includes('/f/') ||
        pathname.includes('/invite') ||
        hash.includes('/f/') ||
        hash.includes('/invite') ||
        portalParam === 'public';

      if (isExplicitPublicRoute) {
        try {
          localStorage.setItem('festflow_portal', 'public');
        } catch {}
        return 'public';
      }

      // Clean home path matching across local dev, Firebase, and GitHub Pages (/festoria/)
      const isHome =
        pathname === '/' ||
        pathname === '/index.html' ||
        pathname === '' ||
        pathname === '/festoria' ||
        pathname === '/festoria/' ||
        pathname === '/festoria/index.html';

      if (isHome) {
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

  const [superAdminTab, setSuperAdminTabState] = useState<SuperAdminNavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = (urlParams.get('subtab') || urlParams.get('tab') || urlParams.get('view')) as string;
      if (tabParam) {
        if (tabParam === 'users' || tabParam === 'platform_users') return 'platform_users';
        if (tabParam === 'participants' || tabParam === 'platform_participants') return 'platform_participants';
        if (tabParam === 'programmes' || tabParam === 'platform_programmes') return 'platform_programmes';
        if (tabParam === 'scores' || tabParam === 'platform_scores') return 'platform_scores';
        if (tabParam === 'schedule' || tabParam === 'platform_schedule') return 'platform_schedule';
        if (tabParam === 'reports' || tabParam === 'platform_reports') return 'platform_reports';
        if (tabParam === 'notifications' || tabParam === 'platform_notifications') return 'platform_notifications';
        if (tabParam === 'audit_logs' || tabParam === 'platform_audit_logs') return 'platform_audit_logs';
        if (tabParam === 'settings' || tabParam === 'platform_settings') return 'platform_settings';
        return tabParam as SuperAdminNavigationTab;
      }
      try {
        const saved = localStorage.getItem('festflow_super_admin_tab') as SuperAdminNavigationTab;
        if (saved) return saved;
      } catch {}
    }
    return 'super_dashboard';
  });

  const setSuperAdminTab = (tab: SuperAdminNavigationTab | string) => {
    let resolvedTab = tab as SuperAdminNavigationTab;
    if ((tab as string) === 'users') resolvedTab = 'platform_users';
    else if ((tab as string) === 'participants') resolvedTab = 'platform_participants';
    else if ((tab as string) === 'programmes') resolvedTab = 'platform_programmes';
    else if ((tab as string) === 'scores') resolvedTab = 'platform_scores';
    else if ((tab as string) === 'schedule') resolvedTab = 'platform_schedule';
    else if ((tab as string) === 'reports') resolvedTab = 'platform_reports';
    else if ((tab as string) === 'notifications') resolvedTab = 'platform_notifications';
    else if ((tab as string) === 'audit_logs') resolvedTab = 'platform_audit_logs';
    else if ((tab as string) === 'settings') resolvedTab = 'platform_settings';

    setSuperAdminTabState(resolvedTab);
    try {
      localStorage.setItem('festflow_super_admin_tab', resolvedTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', resolvedTab);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

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
  const [categories, setCategories] = useState<FestCategory[]>(() => StorageService.getCategories());
  const [teamProgrammeEntries, setTeamProgrammeEntries] = useState<TeamProgrammeEntry[]>(() => StorageService.getTeamProgrammeEntries());
  const [scores, setScores] = useState<ScoreSubmission[]>(() => (isFirebaseConfigured ? [] : StorageService.getScoreSubmissions()));
  const [results, setResults] = useState<ApprovedResult[]>(() => (isFirebaseConfigured ? [] : StorageService.getApprovedResults()));
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
  const [activeFestId, setActiveFestId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryFest = urlParams.get('fest') || urlParams.get('festId');
      if (queryFest) return queryFest;
    }
    const loggedUser = StorageService.getCurrentUser();
    if (loggedUser && loggedUser.role !== 'super_admin') {
      if (loggedUser.festId) return loggedUser.festId;
      const allFests = StorageService.getFests();
      const matched = allFests.find(
        (f) =>
          (f.adminEmail && loggedUser.email && f.adminEmail.toLowerCase() === loggedUser.email.toLowerCase()) ||
          (f.adminId && f.adminId === loggedUser.id)
      );
      if (matched) return matched.id;
    }
    const allFests = StorageService.getFests();
    if (allFests && allFests.length > 0) {
      return allFests[allFests.length - 1].id;
    }
    return 'FEST-04';
  });

  const activeFest = useMemo(() => {
    return fests.find((f) => f.id === activeFestId) || fests[0];
  }, [fests, activeFestId]);

  // Derived settings strictly scoped to the active fest
  const festSettings = useMemo<FestSettings>(() => {
    const base = settings;
    if (!activeFest) return base;
    return {
      ...base,
      festName: activeFest.name || base.festName,
      festEdition: activeFest.edition || base.festEdition,
      tagline: activeFest.tagline || base.tagline,
      startDate: activeFest.startDate || base.startDate,
      endDate: activeFest.endDate || base.endDate,
      venue: activeFest.venue || base.venue,
      organizer: activeFest.institution || base.organizer,
      contactEmail: activeFest.adminEmail || base.contactEmail,
      contactPhone: activeFest.adminPhone || base.contactPhone,
    };
  }, [activeFest, settings]);

  // Derived categories strictly scoped to the active fest (or default template scoped to this fest)
  const festCategories = useMemo(() => {
    if (currentPortal === 'super_admin') return categories;
    const scoped = (categories || []).filter((c) => (c.festId ? c.festId === activeFestId : activeFestId === 'FEST-01'));
    const list = scoped.length > 0 ? scoped : DEFAULT_FEST_CATEGORIES.map((cat: FestCategory) => ({
      ...cat,
      id: `${cat.id}_${activeFestId}`,
      festId: activeFestId,
    }));

    // Deduplicate and merge categories by case-insensitive name so they are ALWAYS unified as one
    const dedupedMap = new Map<string, FestCategory>();
    for (const cat of list) {
      const key = (cat.name || '').trim().toLowerCase();
      if (!key) continue;
      if (!dedupedMap.has(key)) {
        dedupedMap.set(key, cat);
      } else {
        const existing = dedupedMap.get(key)!;
        dedupedMap.set(key, {
          ...existing,
          description: existing.description || cat.description,
          minAge: existing.minAge ?? cat.minAge,
          maxAge: existing.maxAge ?? cat.maxAge,
          enabled: existing.enabled || cat.enabled
        });
      }
    }
    return Array.from(dedupedMap.values());
  }, [categories, activeFestId, currentPortal]);

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

  // Scoped views for active festival (multi-tenancy isolation across distinct fests)
  // Consistently sorted in authoritative order (Participants by Chest #, Programmes by Code, Teams by Code, etc.)
  const festTeams = useMemo(() => {
    const list = currentPortal === 'super_admin' ? [...teams] : teams.filter((t) => (t.festId ? t.festId === activeFestId : activeFestId === 'FEST-01'));
    return list.sort((a, b) => (a.code || a.id).localeCompare(b.code || b.id, undefined, { numeric: true, sensitivity: 'base' }));
  }, [teams, activeFestId, currentPortal]);

  const festProgrammes = useMemo(() => {
    const list = currentPortal === 'super_admin' ? [...programmes] : programmes.filter((p) => (p.festId ? p.festId === activeFestId : activeFestId === 'FEST-01'));
    return list.sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [programmes, activeFestId, currentPortal]);

  const festParticipants = useMemo(() => {
    const list = currentPortal === 'super_admin' ? [...participants] : participants.filter((p) => (p.festId ? p.festId === activeFestId : activeFestId === 'FEST-01'));
    return list.sort((a, b) => {
      if (a.chestNumber && b.chestNumber) {
        return a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (a.chestNumber) return -1;
      if (b.chestNumber) return 1;
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });
  }, [participants, activeFestId, currentPortal]);

  const festJudges = useMemo(() => {
    const list = currentPortal === 'super_admin' ? [...judges] : judges.filter((j) => (j.festId ? j.festId === activeFestId : activeFestId === 'FEST-01'));
    return list.sort((a, b) => (a.id || a.name).localeCompare(b.id || b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [judges, activeFestId, currentPortal]);

  const festScheduleSlots = useMemo(() => {
    const festProgs = programmes.filter((p) =>
      currentPortal === 'super_admin' ? true : (p.festId ? p.festId === activeFestId : activeFestId === 'FEST-01')
    );

    const explicitSlots = (scheduleSlots || []).filter((s) =>
      currentPortal === 'super_admin' ? true : (s.festId ? s.festId === activeFestId : activeFestId === 'FEST-01')
    );

    const slotsByProgId = new Map<string, ScheduleSlot>();
    explicitSlots.forEach((s) => {
      if (s.programmeId) slotsByProgId.set(s.programmeId, s);
    });

    const mergedSlots: ScheduleSlot[] = [];
    festProgs.forEach((prog) => {
      const explicit = slotsByProgId.get(prog.id);
      mergedSlots.push({
        id: explicit?.id || `SCH-${prog.id}`,
        festId: prog.festId || explicit?.festId || activeFestId,
        programmeId: prog.id,
        venue: prog.venue || explicit?.venue || '',
        stage: prog.stage || explicit?.stage || (prog.stageType === 'off_stage' ? 'Off-Stage' : 'Stage 1'),
        date: prog.date || explicit?.date || activeFest?.startDate || '',
        startTime: prog.startTime || explicit?.startTime || '',
        endTime: prog.endTime || explicit?.endTime || '',
        status: prog.status || explicit?.status || 'scheduled',
      });
    });

    // Also include any slots not tied to programmes (e.g. general session or ceremony slots)
    explicitSlots.forEach((s) => {
      if (!s.programmeId || !festProgs.some((p) => p.id === s.programmeId)) {
        mergedSlots.push(s);
      }
    });

    return mergedSlots.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      const timeA = a.startTime || '';
      const timeB = b.startTime || '';
      if (timeA && timeB && timeA !== timeB) return timeA.localeCompare(timeB);
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      const progA = festProgs.find((p) => p.id === a.programmeId);
      const progB = festProgs.find((p) => p.id === b.programmeId);
      const codeA = progA?.code || a.programmeId || '';
      const codeB = progB?.code || b.programmeId || '';
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' }) ||
        (progA?.name || '').localeCompare(progB?.name || '', undefined, { sensitivity: 'base' });
    });
  }, [scheduleSlots, programmes, activeFestId, activeFest, currentPortal]);

  const festUsers = useMemo(() => {
    if (currentPortal === 'super_admin') return users;
    const currentFestObj = fests.find((f) => f.id === activeFestId);
    return (users || []).filter((u) => {
      if (!u) return false;
      // Super admin accounts are platform-level and belong strictly in the super admin page
      if (u.role === 'super_admin') return false;
      // If user has a festId, only show if it strictly matches activeFestId
      if (u.festId) return u.festId === activeFestId;
      // If user is designated fest admin by email matching or ID
      if (
        (u.role === 'admin' || u.role === 'fest_admin') &&
        ((u.email && currentFestObj?.adminEmail && u.email.toLowerCase() === currentFestObj.adminEmail.toLowerCase()) ||
         (currentFestObj?.adminId && u.id === currentFestObj.adminId))
      ) {
        return true;
      }
      // Check if user is linked to a judge or team belonging to activeFestId
      if (u.linkedJudgeId && judges.some((j) => j.id === u.linkedJudgeId && (!j.festId || j.festId === activeFestId))) {
        return true;
      }
      if (u.linkedTeamId && teams.some((t) => t.id === u.linkedTeamId && (!t.festId || t.festId === activeFestId))) {
        return true;
      }
      // Never leak unassociated or platform accounts into a fest admin page
      return false;
    });
  }, [users, activeFestId, fests, currentPortal, judges, teams]);

  const festScores = useMemo(() => {
    const list = currentPortal === 'super_admin' ? [...scores] : scores.filter((s) => (s.festId ? s.festId === activeFestId : activeFestId === 'FEST-01'));
    return list.sort((a, b) => {
      const progA = programmes.find((p) => p.id === a.programmeId);
      const progB = programmes.find((p) => p.id === b.programmeId);
      const codeA = progA?.code || a.programmeId || '';
      const codeB = progB?.code || b.programmeId || '';
      const progComp = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      if (progComp !== 0) return progComp;

      const partA = participants.find((p) => p.id === a.participantId);
      const partB = participants.find((p) => p.id === b.participantId);
      if (partA?.chestNumber && partB?.chestNumber) {
        return partA.chestNumber.localeCompare(partB.chestNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (partA?.chestNumber) return -1;
      if (partB?.chestNumber) return 1;
      return (b.submittedAt || '').localeCompare(a.submittedAt || '');
    });
  }, [scores, activeFestId, currentPortal, programmes, participants]);

  const festResults = useMemo(() => {
    const list = currentPortal === 'super_admin' ? [...results] : results.filter((r) => (r.festId ? r.festId === activeFestId : activeFestId === 'FEST-01'));
    return list.sort((a, b) => {
      const progA = programmes.find((p) => p.id === a.programmeId);
      const progB = programmes.find((p) => p.id === b.programmeId);
      const codeA = progA?.code || a.programmeId || '';
      const codeB = progB?.code || b.programmeId || '';
      const progComp = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      if (progComp !== 0) return progComp;
      return (a.rank || 0) - (b.rank || 0);
    });
  }, [results, activeFestId, currentPortal, programmes]);

  const festActivityLogs = useMemo(() => {
    if (currentPortal === 'super_admin') return activityLogs;
    return activityLogs.filter((a) => (a.festId ? a.festId === activeFestId : activeFestId === 'FEST-01'));
  }, [activityLogs, activeFestId, currentPortal]);

  const activeTeam = useMemo(() => {
    return festTeams.find((t) => t.id === activeTeamId) || festTeams[0];
  }, [festTeams, activeTeamId]);

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
    return festParticipants.find((p) => p.id === activeParticipantId) || festParticipants[0];
  }, [festParticipants, activeParticipantId]);

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
  useEffect(() => {
    if (!isFirebaseConfigured) {
      StorageService.saveScoreSubmissions(scores);
    }
  }, [scores]);
  useEffect(() => {
    if (!isFirebaseConfigured) {
      StorageService.saveApprovedResults(results);
    }
  }, [results]);

  // Purge any legacy stale scores and results from localStorage on connected clients
  useEffect(() => {
    if (isFirebaseConfigured && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('festflow_scores');
        localStorage.removeItem('festflow_results');
      } catch {}
    }
  }, []);
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
  useEffect(() => { StorageService.saveCategories(categories); }, [categories]);
  useEffect(() => { StorageService.saveTeamProgrammeEntries(teamProgrammeEntries); }, [teamProgrammeEntries]);
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

  // Dynamically respond to URL query parameter changes (e.g. ?fest=FEST-01, ?action=register)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUrlChange = () => {
      const search = new URLSearchParams(window.location.search);
      const queryFest = search.get('fest') || search.get('festId');
      const action = search.get('action') || search.get('register');
      const token = search.get('token') || search.get('invite');
      const portalParam = search.get('portal') as PortalType;
      const pathname = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();

      if (queryFest) {
        setActiveFestId(queryFest);
      }

      // Explicit administrative & staff paths take priority over query params
      const isAdminPath = pathname.includes('admin.html') || pathname.endsWith('/admin') || pathname.includes('/admin/') || hash.includes('admin');
      const isSuperAdminPath = pathname.includes('super-admin') || hash.includes('super-admin') || hash.includes('super_admin');
      const isTeamLeaderPath = pathname.includes('team-leader') || hash.includes('team-leader') || hash.includes('team_leader');
      const isParticipantPath = pathname.includes('participant') || hash.includes('participant');

      if (isAdminPath) {
        setCurrentPortal('fest_admin');
        try { localStorage.setItem('festflow_portal', 'fest_admin'); } catch {}
        return;
      }
      if (isSuperAdminPath) {
        setCurrentPortal('super_admin');
        try { localStorage.setItem('festflow_portal', 'super_admin'); } catch {}
        return;
      }
      if (isTeamLeaderPath) {
        setCurrentPortal('team_leader');
        try { localStorage.setItem('festflow_portal', 'team_leader'); } catch {}
        return;
      }
      if (isParticipantPath) {
        setCurrentPortal('participant');
        try { localStorage.setItem('festflow_portal', 'participant'); } catch {}
        return;
      }

      if (
        queryFest ||
        action === 'register' ||
        action === 'true' ||
        action === 'participant' ||
        token ||
        portalParam === 'public' ||
        pathname.includes('/f/') ||
        pathname.includes('/invite') ||
        hash.includes('/f/')
      ) {
        setCurrentPortal('public');
        try {
          localStorage.setItem('festflow_portal', 'public');
        } catch {}
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Synchronize activeFestId with currentUser's festId or matching fest by email/id
  useEffect(() => {
    if (!currentUser || currentUser.role === 'super_admin') return;
    let targetFestId = currentUser.festId;
    if (!targetFestId) {
      const matchedFest = fests.find(
        (f) =>
          (f.adminEmail && currentUser.email && f.adminEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          (f.adminId && f.adminId === currentUser.id)
      );
      if (matchedFest) targetFestId = matchedFest.id;
    }
    if (targetFestId && activeFestId !== targetFestId) {
      setActiveFestId(targetFestId);
      if (!currentUser.festId) {
        setCurrentUser((prev) => ({ ...prev, festId: targetFestId }));
      }
    }
  }, [currentUser, fests, activeFestId]);

  // Self-healing migration for previously created programmes/categories/teams/participants on laptop
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'fest_admin') || !activeFestId || activeFestId === 'FEST-01') return;

    // 1. Sync programmes that lack festId or have 'FEST-01' fallback
    const misalignedProgrammes = programmes.filter(
      (p) => !p.festId || (p.festId === 'FEST-01' && activeFestId !== 'FEST-01')
    );
    if (misalignedProgrammes.length > 0) {
      misalignedProgrammes.forEach((p) => {
        const aligned: Programme = { ...p, festId: activeFestId };
        saveProgrammeToFirestore(aligned);
      });
      setProgrammes((prev) =>
        prev.map((p) => (!p.festId || p.festId === 'FEST-01' ? { ...p, festId: activeFestId } : p))
      );
    }

    // 2. Sync categories (including custom 'Ground zone', 'Zero zone') to active fest in Firestore
    const festCatsToSync = categories.filter((c: FestCategory) => c.festId === activeFestId);
    if (festCatsToSync.length === 0) {
      const targetCats: FestCategory[] = categories.length > 0 ? categories : DEFAULT_FEST_CATEGORIES;
      const syncedCats: FestCategory[] = targetCats.map((c: FestCategory) => ({
        ...c,
        id: c.id.includes(activeFestId) ? c.id : `${c.id}_${activeFestId}`,
        festId: activeFestId,
      }));
      syncedCats.forEach((cat: FestCategory) => saveCategoryToFirestore(cat));
      setCategories((prev) => [
        ...prev.filter((c: FestCategory) => c.festId !== activeFestId),
        ...syncedCats,
      ]);
    } else {
      const unlinkedCustom = categories.filter(
        (c: FestCategory) => c.festId !== activeFestId && (c.name === 'Ground zone' || c.name === 'Zero zone' || !c.festId)
      );
      if (unlinkedCustom.length > 0) {
        unlinkedCustom.forEach((c: FestCategory) => {
          const targetId = c.id.includes(activeFestId) ? c.id : `${c.id}_${activeFestId}`;
          const alignedCat: FestCategory = { ...c, id: targetId, festId: activeFestId };
          saveCategoryToFirestore(alignedCat);
        });
      }
    }

    // 3. Sync teams that lack festId
    const misalignedTeams = teams.filter((t) => !t.festId);
    if (misalignedTeams.length > 0) {
      misalignedTeams.forEach((t) => {
        const aligned: Team = { ...t, festId: activeFestId };
        saveTeamToFirestore(aligned);
      });
      setTeams((prev) =>
        prev.map((t) => (!t.festId ? { ...t, festId: activeFestId } : t))
      );
    }

    // 4. Sync participants that lack festId
    const misalignedParticipants = participants.filter((p) => !p.festId);
    if (misalignedParticipants.length > 0) {
      misalignedParticipants.forEach((p) => {
        const aligned: Participant = { ...p, festId: activeFestId };
        saveParticipantToFirestore(aligned);
      });
      setParticipants((prev) =>
        prev.map((p) => (!p.festId ? { ...p, festId: activeFestId } : p))
      );
    }
  }, [currentUser, activeFestId, programmes, categories, teams, participants]);

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

  const PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute freshness TTL for student / public viewers

  const invalidateClientCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('festoria_last_fs_sync');
      sessionStorage.removeItem('festoria_last_fs_sync');
    }
  };

  const syncFirestoreData = async (force: boolean = false) => {
    if (!isFirebaseConfigured) return;
    try {
      const isStaffOrAdmin =
        currentUser.role === 'admin' ||
        currentUser.role === 'fest_admin' ||
        currentUser.role === 'super_admin' ||
        currentUser.role === 'judge';

      // For public viewers (students), check if recent data is already cached in memory / storage
      if (!force && !isStaffOrAdmin && typeof window !== 'undefined') {
        const lastSync = Number(localStorage.getItem('festoria_last_fs_sync') || sessionStorage.getItem('festoria_last_fs_sync') || 0);
        const timeSinceSync = Date.now() - lastSync;
        const hasExistingData = programmes.length > 0 && (results.length > 0 || teams.length > 0);
        if (lastSync > 0 && timeSinceSync < PUBLIC_CACHE_TTL_MS && hasExistingData) {
          // Serve from local memory / localStorage / IndexedDB cache — 0 Firestore reads!
          setFirebaseStatus({
            isConfigured: true,
            projectId: 'festoria-cd375',
            status: 'connected'
          });
          return;
        }
      }

      setFirebaseStatus(prev => ({ ...prev, status: 'loading' }));
      await seedFirestoreIfEmpty();

      // Fetch base collections accessible publicly
      const [fsFests, fsTeams, fsParticipants, fsProgrammes, fsResults, fsCategories, fsTeamEntries, fsJudges] = await Promise.all([
        fetchFests(),
        fetchTeams(),
        fetchParticipants(),
        fetchProgrammes(),
        fetchResults(),
        fetchCategories(),
        fetchTeamProgrammeEntries(),
        fetchJudges()
      ]);
      if (fsFests && fsFests.length > 0) {
        setFests(fsFests);
        if (!fsFests.some((f) => f.id === activeFestId)) {
          const defaultFest = fsFests.find((f) => f.id === 'FEST-04') || fsFests[fsFests.length - 1];
          if (defaultFest) {
            setActiveFestId(defaultFest.id);
            if (typeof window !== 'undefined') {
              localStorage.setItem('festflow_active_fest_id', defaultFest.id);
            }
          }
        }
      }
      // Harmonize Team Programme Entries and Participant registeredProgrammes
      const rawTeamEntries = (fsTeamEntries && fsTeamEntries.length > 0 ? fsTeamEntries : teamProgrammeEntries)
        .filter((e) => e.status !== 'withdrawn');

      const teamProgMembersMap = new Map<string, Set<string>>();
      rawTeamEntries.forEach((entry) => {
        (entry.memberParticipantIds || []).forEach((pid) => {
          if (!teamProgMembersMap.has(pid)) {
            teamProgMembersMap.set(pid, new Set<string>());
          }
          teamProgMembersMap.get(pid)!.add(entry.programmeId);
        });
      });

      if (fsTeams && fsTeams.length > 0) setTeams(fsTeams);
      if (fsParticipants && fsParticipants.length > 0) {
        setParticipants((prev) => {
          let deletedIds = new Set<string>();
          try {
            if (typeof window !== 'undefined') {
              deletedIds = new Set<string>(
                JSON.parse(localStorage.getItem('festoria_deleted_participant_ids') || '[]')
              );
            }
          } catch {}

          const cleanFs = (fsParticipants || []).filter((p) => !deletedIds.has(p.id));
          const remoteMap = new Map(cleanFs.map((p) => [p.id, p]));
          const unsynced = prev.filter((p) => !remoteMap.has(p.id) && !deletedIds.has(p.id));

          // Ensure participants have registeredProgrammes populated from teamProgrammeEntries
          const allMerged = [...cleanFs, ...unsynced].map((pt) => {
            const teamProgs = teamProgMembersMap.get(pt.id);
            if (teamProgs && teamProgs.size > 0) {
              const currentProgs = new Set(pt.registeredProgrammes || []);
              let changed = false;
              teamProgs.forEach((progId) => {
                if (!currentProgs.has(progId)) {
                  currentProgs.add(progId);
                  changed = true;
                }
              });
              if (changed) {
                const updated = { ...pt, registeredProgrammes: Array.from(currentProgs) };
                if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'fest_admin' || currentUser.role === 'super_admin')) {
                  saveParticipantToFirestore(updated).catch(() => {});
                }
                return updated;
              }
            }
            return pt;
          });

          unsynced.forEach((p) => {
            saveParticipantToFirestore(p).catch(() => {});
          });
          return allMerged;
        });
      }

      // Auto-harmonize programme categories with canonical fest categories
      const activeCats = fsCategories && fsCategories.length > 0 ? fsCategories : DEFAULT_FEST_CATEGORIES;
      const catLookup = new Map<string, string>();
      activeCats.forEach((c) => {
        if (c.name) catLookup.set(c.name.trim().toLowerCase(), c.name.trim());
      });

      const harmonizedProgrammes = (fsProgrammes || []).map((p) => {
        const norm = (p.category || '').trim().toLowerCase();
        const canonical = catLookup.get(norm);
        const pids = new Set(p.registeredParticipantIds || []);
        (fsParticipants || []).forEach((pt) => {
          if (pt.registeredProgrammes?.includes(p.id) && pt.status !== 'inactive') {
            pids.add(pt.id);
          }
        });
        // Include members from active team programme entries
        rawTeamEntries.forEach((entry) => {
          if (entry.programmeId === p.id) {
            (entry.memberParticipantIds || []).forEach((pid) => pids.add(pid));
          }
        });
        const alignedPids = Array.from(pids);
        const pidsChanged = alignedPids.length !== (p.registeredParticipantIds || []).length;
        const categoryChanged = !!(canonical && p.category !== canonical);

        // Include teams from active team programme entries
        const tids = new Set(p.registeredTeamIds || []);
        rawTeamEntries.forEach((entry) => {
          if (entry.programmeId === p.id && entry.teamId) {
            tids.add(entry.teamId);
          }
        });
        const alignedTids = Array.from(tids);
        const tidsChanged = alignedTids.length !== (p.registeredTeamIds || []).length;

        if (categoryChanged || pidsChanged || tidsChanged) {
          const updated = {
            ...p,
            category: categoryChanged && canonical ? canonical : p.category,
            registeredParticipantIds: alignedPids,
            registeredTeamIds: alignedTids,
          };
          if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'fest_admin' || currentUser.role === 'super_admin')) {
            saveProgrammeToFirestore(updated).catch(() => {});
          }
          return updated;
        }
        return p;
      });
      setProgrammes(harmonizedProgrammes);
      setResults(fsResults);
      if (fsCategories && fsCategories.length > 0) setCategories(fsCategories);
      if (fsTeamEntries && fsTeamEntries.length > 0) setTeamProgrammeEntries(fsTeamEntries);
      if (fsJudges && fsJudges.length > 0) setJudges(fsJudges);

      // Synchronize schedule slots with remote Firestore programmes
      setScheduleSlots((prevSlots) => {
        const slotMap = new Map<string, ScheduleSlot>();
        (prevSlots || []).forEach((s) => {
          if (s.programmeId) slotMap.set(s.programmeId, s);
        });

        const syncedSlots = (harmonizedProgrammes || []).map((p) => {
          const existing = slotMap.get(p.id);
          return {
            id: existing?.id || `SCH-${p.id}`,
            festId: p.festId || existing?.festId || activeFestId,
            programmeId: p.id,
            venue: p.venue || existing?.venue || '',
            stage: p.stage || existing?.stage || (p.stageType === 'off_stage' ? 'Off-Stage' : 'Stage 1'),
            date: p.date || existing?.date || '',
            startTime: p.startTime || existing?.startTime || '',
            endTime: p.endTime || existing?.endTime || '',
            status: p.status || existing?.status || 'scheduled',
          };
        });

        // Also keep non-programme slots (e.g. ceremonies/breaks)
        const nonProgSlots = (prevSlots || []).filter(
          (s) => !s.programmeId || !(harmonizedProgrammes || []).some((p) => p.id === s.programmeId)
        );
        const allSynced = [...syncedSlots, ...nonProgSlots];
        StorageService.saveScheduleSlots(allSynced);
        return allSynced;
      });

      // Record successful sync timestamp in both localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('festoria_last_fs_sync', Date.now().toString());
        sessionStorage.setItem('festoria_last_fs_sync', Date.now().toString());
      }

      // Fetch role-restricted collections safely
      if (currentUser.role === 'super_admin') {
        try {
          const [fsScores, fsFestRequests, fsUsers] = await Promise.all([
            fetchScores(),
            fetchFestRequests(),
            fetchUsersFromFirestore()
          ]);
          setScores(fsScores);
          setFestRequests(fsFestRequests);
          if (fsUsers && fsUsers.length > 0) {
            setUsers(fsUsers);
            StorageService.saveUsers(fsUsers);
          }
        } catch {}
      } else if (currentUser.role === 'admin' || currentUser.role === 'fest_admin' || currentUser.role === 'judge') {
        try {
          const fsScores = await fetchScores();
          setScores(fsScores);
        } catch {}
      }

      setFirebaseStatus({
        isConfigured: true,
        projectId: 'festoria-cd375',
        status: 'connected'
      });
    } catch (e) {
      console.warn('[FestContext] Firestore sync notice:', e);
      setFirebaseStatus({
        isConfigured: true,
        projectId: 'festoria-cd375',
        status: 'connected'
      });
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured) {
      syncFirestoreData();

      // Background freshness check every 3 minutes if tab is active
      const timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          syncFirestoreData(false);
        }
      }, PUBLIC_CACHE_TTL_MS);

      return () => clearInterval(timer);
    }
  }, [currentUser]);

  // Real-time synchronization of published results and leaderboard rankings across all devices
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribeResults = subscribeToLeaderboardResults(activeFestId, (remotePublishedResults) => {
      if (Array.isArray(remotePublishedResults)) {
        setResults((prev) => {
          const remoteMap = new Map(remotePublishedResults.map((r) => [r.id, r]));
          const localDrafts = prev.filter((r) => !r.published && !remoteMap.has(r.id));
          return [...remotePublishedResults, ...localDrafts];
        });
      }
    });

    // Real-time score sync for admins and judges
    let unsubscribeScores: (() => void) | null = null;
    if (currentUser.role === 'admin' || currentUser.role === 'fest_admin' || currentUser.role === 'super_admin' || currentUser.role === 'judge') {
      unsubscribeScores = subscribeToScores(activeFestId, (remoteScores) => {
        if (Array.isArray(remoteScores)) {
          setScores((prev) => {
            const remoteMap = new Map(remoteScores.map((s) => [s.id, s]));
            const localOnly = prev.filter((s) => !remoteMap.has(s.id));
            return [...remoteScores, ...localOnly];
          });
        }
      });
    }

    return () => {
      unsubscribeResults();
      if (unsubscribeScores) unsubscribeScores();
    };
  }, [activeFestId, currentUser]);

  // Retain all valid registered user accounts (Super Admins, Fest Admins, Judges, Team Leaders, and Participants)
  useEffect(() => {
    try {
      const storedUsers = StorageService.getUsers();
      if (Array.isArray(storedUsers) && storedUsers.length > 0) {
        const cleanUsers = storedUsers.filter((u) => u && u.id);
        if (cleanUsers.length !== storedUsers.length) {
          StorageService.saveUsers(cleanUsers);
          setUsers(cleanUsers);
        }
      }
    } catch {}
  }, []);

  // Real-time synchronization across portals when registrations or account updates occur
  useEffect(() => {
    const handleSyncStorage = () => {
      try {
        const currentStoredParticipants = StorageService.getParticipants();
        if (Array.isArray(currentStoredParticipants)) {
          setParticipants(currentStoredParticipants);
        }
        const currentStoredUsers = StorageService.getUsers();
        if (Array.isArray(currentStoredUsers)) {
          setUsers(currentStoredUsers);
        }
      } catch (err) {
        console.warn('[FestContext] Cross-portal sync error:', err);
      }
    };

    window.addEventListener('festoria_participants_changed', handleSyncStorage);
    window.addEventListener('festoria_users_changed', handleSyncStorage);
    window.addEventListener('storage', handleSyncStorage);
    return () => {
      window.removeEventListener('festoria_participants_changed', handleSyncStorage);
      window.removeEventListener('festoria_users_changed', handleSyncStorage);
      window.removeEventListener('storage', handleSyncStorage);
    };
  }, []);

  // Auto-route judges to scores tab and ensure adjudication portal is active
  useEffect(() => {
    if (currentUser.role === 'judge') {
      if (currentPortal !== 'fest_admin') {
        setCurrentPortal('fest_admin');
        try {
          localStorage.setItem('festflow_portal', 'fest_admin');
        } catch {}
      }
      const allowedJudgeTabs: NavigationTab[] = ['scores', 'programmes', 'schedule'];
      if (!allowedJudgeTabs.includes(activeTab)) {
        setActiveTab('scores');
      }
    }
  }, [currentUser.role, activeTab, currentPortal]);

  // Deduplicate fests on mount and clean up duplicate fest entries
  useEffect(() => {
    try {
      const currentFests = StorageService.getFests();
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const deduped: Fest[] = [];
      let hadDuplicates = false;
      for (const fest of currentFests) {
        if (!fest || !fest.id) continue;
        const key = `${(fest.name || '').toLowerCase().trim()}_${(fest.institution || '').toLowerCase().trim()}`;
        if (!seenIds.has(fest.id) && !seenNames.has(key)) {
          seenIds.add(fest.id);
          seenNames.add(key);
          deduped.push(fest);
        } else {
          hadDuplicates = true;
          if (fest.id !== 'FEST-01') {
            deleteFestFromFirestore(fest.id).catch(() => {});
          }
        }
      }
      if (hadDuplicates || deduped.length !== currentFests.length) {
        setFests(deduped);
        StorageService.saveFests(deduped);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Sync users when currentUser becomes Super Admin
  useEffect(() => {
    if (isFirebaseConfigured && currentUser.role === 'super_admin') {
      fetchUsersFromFirestore().then(fsUsers => {
        if (fsUsers && fsUsers.length > 0) {
          setUsers(fsUsers);
          StorageService.saveUsers(fsUsers);
        }
      }).catch(() => {});
      fetchFestRequests().then(reqs => setFestRequests(reqs)).catch(() => {});
    }
  }, [currentUser]);

  // One-time purge of legacy cached demo data from browser localStorage
  useEffect(() => {
    try {
      const PURGE_KEY = 'festflow_legacy_demo_purged_v2';
      if (localStorage.getItem(PURGE_KEY)) {
        return;
      }
      const storedFests = localStorage.getItem('festflow_fests');
      if (
        storedFests &&
        (storedFests.includes('Luminaria') ||
          storedFests.includes('Vibrance') ||
          storedFests.includes('Kalautsav'))
      ) {
        localStorage.removeItem('festflow_fests');
        localStorage.removeItem('festflow_teams');
        localStorage.removeItem('festflow_participants');
        localStorage.removeItem('festflow_programmes');
        localStorage.removeItem('festflow_scores');
        localStorage.removeItem('festflow_results');
        localStorage.removeItem('festflow_schedule');
        localStorage.removeItem('festflow_judges');
        localStorage.removeItem('festflow_milestones');
        localStorage.removeItem('festflow_complaints');
        localStorage.removeItem('festflow_assignments');
        setFests([]);
        setTeams([]);
        setParticipants([]);
        setProgrammes([]);
        setScores([]);
        setResults([]);
        setScheduleSlots([]);
        setJudges([]);
        setMilestones([]);
        setComplaints([]);
        setAssignments([]);
      }
      localStorage.setItem(PURGE_KEY, 'true');
    } catch (e) {
      // ignore
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
      festId: activeFestId,
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
    if (!currentUser || !currentUser.role) return false;
    if (currentUser.role === 'super_admin') return true;
    if (
      (currentUser.role === 'fest_admin' || currentUser.role === 'admin') &&
      (allowedRoles.includes('fest_admin') || allowedRoles.includes('admin'))
    ) {
      return true;
    }
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

  // Dynamic Leaderboard (Scoped to active fest)
  const leaderboard = useMemo(() => {
    return calculateLeaderboard(festTeams, festResults, festProgrammes);
  }, [festTeams, festResults, festProgrammes]);

  // Dynamic Category Scoreboards (Scoped to active fest)
  const getCategoryScoreboard = useCallback(
    (categoryName: string): CategoryIndividualLeaderboardEntry[] => {
      return calculateCategoryScoreboards(categoryName, festParticipants, festTeams, festResults, festProgrammes);
    },
    [festParticipants, festTeams, festResults, festProgrammes]
  );

  // Dynamic Schedule Conflicts (Scoped to active fest)
  const scheduleConflicts = useMemo(() => {
    return detectScheduleConflicts(festProgrammes, festParticipants);
  }, [festProgrammes, festParticipants]);

  // Summary Metrics (Scoped to active fest)
  const summaryStats = useMemo(() => {
    const totalParticipants = festParticipants.filter((p) => p.status !== 'inactive').length;
    const totalTeams = festTeams.filter((t) => t.status === 'active').length;
    const totalProgrammes = festProgrammes.length;
    const totalJudges = festJudges.filter((j) => j.status === 'active').length;
    const completedProgrammes = festProgrammes.filter((p) => p.status === 'completed').length;
    const upcomingProgrammes = festProgrammes.filter((p) => p.status === 'scheduled' || p.status === 'ongoing').length;
    const pendingScores = festScores.filter((s) => s.status === 'pending' || s.status === 'submitted' || s.status === 'reviewed').length;
    const publishedResults = festResults.filter((r) => r.published).length;

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
  }, [festParticipants, festTeams, festProgrammes, festJudges, festScores, festResults]);

  // Participant Management
  const addParticipant = (data: Omit<Participant, 'id' | 'createdAt'>): boolean => {
    // Check duplicates by email (only if email is provided)
    if (data.email && data.email.trim()) {
      const emailLower = data.email.trim().toLowerCase();
      const exists = participants.some((p) => p.email && p.email.trim().toLowerCase() === emailLower);
      if (exists) {
        addToast('error', 'Duplicate Participant', `A participant with email ${data.email} already exists.`);
        return false;
      }
    }

    // Check duplicate chest number within this fest (if provided)
    if (data.chestNumber && data.chestNumber.trim()) {
      const chestTrimmed = data.chestNumber.trim().toLowerCase();
      const festTarget = data.festId || activeFestId;
      const chestExists = participants.some(
        (p) => (p.festId === festTarget || !p.festId) &&
               p.chestNumber &&
               p.chestNumber.trim().toLowerCase() === chestTrimmed
      );
      if (chestExists) {
        addToast('error', 'Duplicate Chest Number', `Chest number "${data.chestNumber}" is already assigned to another participant in this fest.`);
        return false;
      }
    }

    // Validate restrictions on all requested programmes
    const targetTeamId = data.teamId;
    const targetCategory = (data.category || '').toLowerCase().trim();

    for (const progId of (data.registeredProgrammes || [])) {
      const prog = programmes.find((pr) => pr.id === progId);
      if (!prog) continue;

      // 1. Category eligibility
      const allowedCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
      const allowsGeneral = allowedCats.includes('general') || (prog.category || '').toLowerCase() === 'general';
      const isEligible =
        !targetCategory ||
        allowedCats.length === 0 ||
        allowedCats.includes(targetCategory) ||
        (allowsGeneral && targetCategory === 'general') ||
        (prog.category || '').toLowerCase() === targetCategory;
      if (!isEligible) {
        addToast(
          'error',
          'Category Ineligible',
          `Participant category "${data.category}" is not eligible for "${prog.name}". Eligible: [${prog.eligibleCategories.join(', ')}].`
        );
        return false;
      }

      // 2. Team Quota (maxParticipantsPerTeam / maxTeamMembers)
      const isTeam = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';
      const maxAllowed = isTeam ? (prog.maxTeamMembers || 25) : (prog.maxParticipantsPerTeam || 1);
      const teamRegistrations = participants.filter(
        (p) => p.teamId === targetTeamId && p.status !== 'inactive' && p.registeredProgrammes?.includes(prog.id)
      );
      if (teamRegistrations.length >= maxAllowed) {
        const teamObj = teams.find((t) => t.id === targetTeamId);
        const teamName = teamObj ? `${teamObj.name} (${teamObj.code})` : targetTeamId;
        addToast(
          'error',
          'Team Quota Exceeded',
          isTeam
            ? `Team "${teamName}" has reached maximum squad limit of ${maxAllowed} members for team event "${prog.name}".`
            : `Team "${teamName}" already has ${teamRegistrations.length} of ${maxAllowed} allowed participant(s) registered in "${prog.name}" (${teamRegistrations.map((p) => p.name).join(', ')}). Registration blocked.`
        );
        return false;
      }

      // 4. Programme Capacity
      if (prog.maxCapacity && prog.maxCapacity > 0) {
        const totalRegistrations = participants.filter(
          (p) => p.status !== 'inactive' && p.registeredProgrammes?.includes(prog.id)
        ).length;
        if (totalRegistrations >= prog.maxCapacity) {
          addToast(
            'error',
            'Capacity Exceeded',
            `Programme "${prog.name}" has reached maximum capacity of ${prog.maxCapacity} participants.`
          );
          return false;
        }
      }
    }

    // Ensure globally unique, non-colliding ID based on max existing numeric suffix
    let maxNum = 100;
    participants.forEach((p) => {
      const match = p.id.match(/^PT-(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    let candidateNum = maxNum + 1;
    while (participants.some((p) => p.id === `PT-${candidateNum}`)) {
      candidateNum++;
    }
    const newId = `PT-${candidateNum}`;
    const newParticipant: Participant = {
      ...data,
      festId: data.festId || activeFestId,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setParticipants((prev) => [newParticipant, ...prev]);
    saveParticipantToFirestore(newParticipant);

    // Also update registeredProgrammes on programmes and persist
    if (data.registeredProgrammes.length > 0) {
      setProgrammes((prev) =>
        prev.map((prog) => {
          if (data.registeredProgrammes.includes(prog.id)) {
            const currentIds = new Set(prog.registeredParticipantIds || []);
            if (!currentIds.has(newId)) {
              currentIds.add(newId);
              const updatedProg = {
                ...prog,
                registeredParticipantIds: Array.from(currentIds),
              };
              saveProgrammeToFirestore(updatedProg).catch(() => {});
              return updatedProg;
            }
          }
          return prog;
        })
      );
    }

    logActivity('CREATE_PARTICIPANT', 'participant', newId, `Registered participant ${data.name} (${newId}) under team ${data.teamId}.`);
    addToast('success', 'Participant Added', `${data.name} has been successfully registered.`);
    return true;
  };

  const updateParticipant = (id: string, updates: Partial<Participant>): boolean => {
    const current = participants.find((p) => p.id === id);
    if (!current) return false;

    if (updates.chestNumber && updates.chestNumber.trim()) {
      const chestTrimmed = updates.chestNumber.trim().toLowerCase();
      const festTarget = updates.festId || current.festId || activeFestId;
      const chestExists = participants.some(
        (p) => p.id !== id &&
               (p.festId === festTarget || !p.festId) &&
               p.chestNumber &&
               p.chestNumber.trim().toLowerCase() === chestTrimmed
      );
      if (chestExists) {
        addToast('error', 'Duplicate Chest Number', `Chest number "${updates.chestNumber}" is already assigned in this festival.`);
        return false;
      }
    }

    const targetTeamId = updates.teamId || current.teamId;
    const targetCategory = ((updates.category !== undefined ? updates.category : current.category) || '').toLowerCase().trim();
    const targetProgrammes = updates.registeredProgrammes !== undefined ? updates.registeredProgrammes : current.registeredProgrammes;

    // If programmes, team, or category changed, re-validate restrictions
    if (updates.registeredProgrammes !== undefined || updates.teamId !== undefined || updates.category !== undefined) {
      for (const progId of targetProgrammes) {
        const prog = programmes.find((pr) => pr.id === progId);
        if (!prog) continue;

        // 1. Category eligibility
        const allowedCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
        const allowsGeneral = allowedCats.includes('general') || (prog.category || '').toLowerCase() === 'general';
        const isEligible =
          !targetCategory ||
          allowedCats.length === 0 ||
          allowedCats.includes(targetCategory) ||
          (allowsGeneral && targetCategory === 'general') ||
          (prog.category || '').toLowerCase() === targetCategory;
        if (!isEligible) {
          addToast(
            'error',
            'Category Ineligible',
            `Participant category "${updates.category || current.category}" is not eligible for "${prog.name}". Eligible: [${prog.eligibleCategories.join(', ')}].`
          );
          return false;
        }

        // 2. Team Quota (maxParticipantsPerTeam / maxTeamMembers)
        const isTeam = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';
        const maxAllowed = isTeam ? (prog.maxTeamMembers || 25) : (prog.maxParticipantsPerTeam || 1);
        const otherTeamRegistrations = participants.filter(
          (p) => p.id !== id && p.teamId === targetTeamId && p.status !== 'inactive' && p.registeredProgrammes?.includes(prog.id)
        );
        if (otherTeamRegistrations.length >= maxAllowed) {
          const teamObj = teams.find((t) => t.id === targetTeamId);
          const teamName = teamObj ? `${teamObj.name} (${teamObj.code})` : targetTeamId;
          addToast(
            'error',
            'Team Quota Exceeded',
            isTeam
              ? `Team "${teamName}" has reached maximum squad limit of ${maxAllowed} members for team event "${prog.name}".`
              : `Team "${teamName}" already has ${otherTeamRegistrations.length} of ${maxAllowed} allowed participant(s) registered in "${prog.name}" (${otherTeamRegistrations.map((p) => p.name).join(', ')}). Registration blocked.`
          );
          return false;
        }

        // 4. Capacity
        if (prog.maxCapacity && prog.maxCapacity > 0) {
          const totalInProg = participants.filter(
            (p) => p.id !== id && p.status !== 'inactive' && p.registeredProgrammes?.includes(prog.id)
          ).length;
          if (totalInProg >= prog.maxCapacity) {
            addToast(
              'error',
              'Capacity Exceeded',
              `Programme "${prog.name}" has reached maximum capacity of ${prog.maxCapacity} participants.`
            );
            return false;
          }
        }
      }
    }

    let updatedRecord: Participant | undefined;
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          updatedRecord = updated;
          return updated;
        }
        return p;
      })
    );
    if (updatedRecord) {
      saveParticipantToFirestore(updatedRecord);
    }

    // Synchronize programmes registeredParticipantIds
    if (updates.registeredProgrammes !== undefined) {
      const oldProgIds = new Set(current.registeredProgrammes || []);
      const newProgIds = new Set(updates.registeredProgrammes);
      setProgrammes((prev) =>
        prev.map((prog) => {
          let currentIds = prog.registeredParticipantIds ? [...prog.registeredParticipantIds] : [];
          let changed = false;
          if (newProgIds.has(prog.id) && !currentIds.includes(id)) {
            currentIds.push(id);
            changed = true;
          } else if (!newProgIds.has(prog.id) && currentIds.includes(id)) {
            currentIds = currentIds.filter((pId) => pId !== id);
            changed = true;
          }
          if (changed) {
            const updatedProg = { ...prog, registeredParticipantIds: currentIds };
            saveProgrammeToFirestore(updatedProg).catch(() => {});
            return updatedProg;
          }
          return prog;
        })
      );
    }

    logActivity('UPDATE_PARTICIPANT', 'participant', id, `Updated details for participant ID ${id}.`);
    addToast('success', 'Updated', 'Participant record has been updated.');
    return true;
  };

  const deleteParticipant = (id: string) => {
    const target = participants.find((p) => p.id === id);
    setParticipants((prev) => prev.filter((p) => p.id !== id));

    try {
      if (typeof window !== 'undefined') {
        const deletedIds = new Set<string>(
          JSON.parse(localStorage.getItem('festoria_deleted_participant_ids') || '[]')
        );
        deletedIds.add(id);
        localStorage.setItem('festoria_deleted_participant_ids', JSON.stringify(Array.from(deletedIds)));
      }
    } catch {}

    deleteParticipantFromFirestore(id).catch((err) => console.warn('[Firestore] deleteParticipant error:', err));

    // Cascade: remove participant from programmes registeredParticipantIds
    setProgrammes((prev) =>
      prev.map((prog) => {
        if (prog.registeredParticipantIds?.includes(id)) {
          const updated = {
            ...prog,
            registeredParticipantIds: prog.registeredParticipantIds.filter((pId) => pId !== id),
          };
          saveProgrammeToFirestore(updated).catch(() => {});
          return updated;
        }
        return prog;
      })
    );

    // Cascade: remove participant from assignments and team entries
    setAssignments((prev: ProgrammeAssignment[]) =>
      prev.map((asg: ProgrammeAssignment) => {
        if (asg.participantIds.includes(id)) {
          const updatedIds = asg.participantIds.filter((pId: string) => pId !== id);
          const updatedNames = asg.participantNames.filter((_: string, idx: number) => asg.participantIds[idx] !== id);
          const updatedAsg: ProgrammeAssignment = { ...asg, participantIds: updatedIds, participantNames: updatedNames };
          saveProgrammeAssignmentToFirestore(updatedAsg).catch(() => {});
          return updatedAsg;
        }
        return asg;
      })
    );

    setTeamProgrammeEntries((prev: TeamProgrammeEntry[]) =>
      prev.map((entry: TeamProgrammeEntry) => {
        if (entry.memberParticipantIds.includes(id)) {
          const updatedIds = entry.memberParticipantIds.filter((pId: string) => pId !== id);
          const names = entry.memberNames || [];
          const updatedNames = names.filter((_: string, idx: number) => entry.memberParticipantIds[idx] !== id);
          const updatedEntry: TeamProgrammeEntry = { ...entry, memberParticipantIds: updatedIds, memberNames: updatedNames };
          saveTeamProgrammeEntryToFirestore(updatedEntry).catch(() => {});
          return updatedEntry;
        }
        return entry;
      })
    );

    logActivity('DELETE_PARTICIPANT', 'participant', id, `Removed participant ${target?.name || id}.`);
    addToast('info', 'Participant Removed', 'The participant record was permanently removed.');
  };

  const bulkImportParticipants = (newItems: Omit<Participant, 'id' | 'createdAt'>[]) => {
    let addedCount = 0;
    let duplicateCount = 0;
    const existingEmails = new Set(
      participants
        .map((p) => (p.email || '').toLowerCase().trim())
        .filter(Boolean)
    );
    const toAdd: Participant[] = [];

    let maxNum = 100;
    participants.forEach((p) => {
      const match = p.id.match(/^PT-(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    let nextNum = maxNum + 1;

    newItems.forEach((item) => {
      const emailLower = (item.email || '').toLowerCase().trim();
      if (emailLower && existingEmails.has(emailLower)) {
        duplicateCount++;
      } else {
        if (emailLower) existingEmails.add(emailLower);
        while (
          participants.some((p) => p.id === `PT-${nextNum}`) ||
          toAdd.some((p) => p.id === `PT-${nextNum}`)
        ) {
          nextNum++;
        }
        const newId = `PT-${nextNum++}`;
        const pObj: Participant = {
          ...item,
          festId: item.festId || activeFestId,
          id: newId,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        toAdd.push(pObj);
        saveParticipantToFirestore(pObj);
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
  const addJudge = (data: Omit<Judge, 'id' | 'createdAt'>): string | false => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can manage judges.');
      return false;
    }
    const festTarget = (data as any).festId || activeFestId;
    const exists = data.email
      ? judges.some(
          (j) =>
            ((j as any).festId ? (j as any).festId === festTarget : festTarget === 'FEST-01') &&
            j.email &&
            j.email.toLowerCase() === data.email.toLowerCase()
        )
      : false;
    if (exists) {
      addToast('error', 'Duplicate Judge', `A judge with email ${data.email} already exists in this festival.`);
      return false;
    }
    const newId = `JD-0${judges.length + 1}`;
    const newJudge: Judge = {
      ...data,
      festId: festTarget,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setJudges((prev) => [...prev, newJudge]);
    saveJudgeToFirestore(newJudge).catch(() => {});
    logActivity('ADD_JUDGE', 'judge', newId, `Added judge ${data.name} (${newId}) to fest ${festTarget}.`);
    addToast('success', 'Judge Created', `${data.name} has been added to the judging panel.`);
    return newId;
  };

  const updateJudge = (id: string, updates: Partial<Judge>) => {
    let updatedObj: Judge | undefined;
    setJudges((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          updatedObj = { ...j, ...updates };
          return updatedObj;
        }
        return j;
      })
    );
    if (updatedObj) {
      saveJudgeToFirestore(updatedObj).catch(() => {});
    }
    logActivity('UPDATE_JUDGE', 'judge', id, `Updated judge record ${id}.`);
    addToast('success', 'Judge Updated', 'Judge information saved successfully.');
  };

  const deleteJudge = (id: string) => {
    setJudges((prev) => prev.filter((j) => j.id !== id));
    deleteJudgeFromFirestore(id).catch(() => {});
    logActivity('DELETE_JUDGE', 'judge', id, `Removed judge record ${id}.`);
    addToast('info', 'Judge Removed', 'The judge was removed from the panel.');
  };

  // Programme Management
  const addProgramme = (data: Omit<Programme, 'id' | 'resultPublished'>): boolean => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can manage programmes.');
      return false;
    }
    const festTarget = data.festId || activeFestId;
    const exists = programmes.some(
      (p) => (p.festId ? p.festId === festTarget : festTarget === 'FEST-01') &&
             p.code.toLowerCase() === data.code.toLowerCase()
    );
    if (exists) {
      addToast('error', 'Duplicate Programme Code', `Code ${data.code} is already in use in this festival.`);
      return false;
    }
    let nextNum = programmes.length + 101;
    while (programmes.some((p) => p.id === `PRG-${nextNum}`)) {
      nextNum++;
    }
    const newId = `PRG-${nextNum}`;
    const newProgramme: Programme = {
      ...data,
      festId: festTarget,
      id: newId,
      resultPublished: false,
    };
    setProgrammes((prev) => [...prev, newProgramme]);
    saveProgrammeToFirestore(newProgramme);

    // Also add to schedule slots
    const newSlot: ScheduleSlot = {
      id: `SCH-${(scheduleSlots.length + 1).toString().padStart(2, '0')}`,
      festId: festTarget,
      programmeId: newId,
      venue: data.venue,
      stage: data.stage,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
    };
    setScheduleSlots((prev) => [...prev, newSlot]);

    logActivity('CREATE_PROGRAMME', 'programme', newId, `Created programme ${data.name} (${data.code}) for fest ${festTarget}.`);
    addToast('success', 'Programme Added', `${data.name} added successfully.`);
    return true;
  };

  const updateProgramme = (id: string, updates: Partial<Programme>) => {
    setProgrammes((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const updated = next.find((p) => p.id === id);
      if (updated) {
        saveProgrammeToFirestore(updated);
      }
      return next;
    });
    // Also sync schedule slot if time/venue changes
    setScheduleSlots((prev) => {
      const exists = prev.some((s) => s.programmeId === id);
      if (exists) {
        return prev.map((s) => {
          if (s.programmeId === id) {
            return {
              ...s,
              venue: updates.venue !== undefined ? updates.venue : s.venue,
              stage: updates.stage !== undefined ? updates.stage : s.stage,
              date: updates.date !== undefined ? updates.date : s.date,
              startTime: updates.startTime !== undefined ? updates.startTime : s.startTime,
              endTime: updates.endTime !== undefined ? updates.endTime : s.endTime,
              status: updates.status !== undefined ? updates.status : s.status,
            };
          }
          return s;
        });
      }
      const p = programmes.find((pr) => pr.id === id);
      return [
        ...prev,
        {
          id: `SCH-${(prev.length + 1).toString().padStart(2, '0')}`,
          festId: p?.festId || activeFestId,
          programmeId: id,
          venue: updates.venue !== undefined ? updates.venue : p?.venue || 'Auditorium Hall A',
          stage: updates.stage !== undefined ? updates.stage : p?.stage || 'Stage 1',
          date: updates.date !== undefined ? updates.date : p?.date || activeFest?.startDate || new Date().toISOString().split('T')[0],
          startTime: updates.startTime !== undefined ? updates.startTime : p?.startTime || '10:00',
          endTime: updates.endTime !== undefined ? updates.endTime : p?.endTime || '12:00',
          status: updates.status !== undefined ? updates.status : p?.status || 'scheduled',
        },
      ];
    });
    logActivity('UPDATE_PROGRAMME', 'programme', id, `Updated programme ${id}.`);
    addToast('success', 'Programme Updated', 'Programme settings and schedule updated.');
  };

  const deleteProgramme = (id: string) => {
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
    setScheduleSlots((prev) => prev.filter((s) => s.programmeId !== id));
    deleteProgrammeFromFirestore(id);
    logActivity('DELETE_PROGRAMME', 'programme', id, `Deleted programme ${id}.`);
    addToast('info', 'Programme Deleted', 'The programme was deleted.');
  };

  const duplicateProgramme = (id: string) => {
    const existing = programmes.find((p) => p.id === id);
    if (!existing) return;
    let nextNum = programmes.length + 101;
    while (programmes.some((p) => p.id === `PRG-${nextNum}`)) {
      nextNum++;
    }
    const newId = `PRG-${nextNum}`;
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

  // Batch Score Submission & Calibration (Atomic, collision-free, handles multi-contestant saves)
  const submitScoresBatch = (
    scoresPayload: Array<Omit<ScoreSubmission, 'id' | 'submittedAt' | 'revisionHistory'> & { id?: string }>
  ): ScoreSubmission[] => {
    if (!scoresPayload || scoresPayload.length === 0) return [];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Existing scores indexed by id for quick resolution
    const existingById = new Map<string, ScoreSubmission>();
    scores.forEach((s) => existingById.set(s.id, s));

    const processedScores: ScoreSubmission[] = [];

    scoresPayload.forEach((data, index) => {
      const totalScore = data.scores.reduce((sum, item) => sum + item.marksObtained, 0);

      // Check if target score exists either by explicit id or by matching (programmeId, judgeId, competitor)
      let matchedScore = data.id ? existingById.get(data.id) : undefined;
      if (!matchedScore) {
        matchedScore = scores.find((s) => {
          if (s.programmeId !== data.programmeId || s.judgeId !== data.judgeId) return false;
          if (data.participantId && s.participantId === data.participantId) return true;
          if (data.teamEntryId && s.teamEntryId === data.teamEntryId) return true;
          if (!data.participantId && !data.teamEntryId && data.teamId && s.teamId === data.teamId) return true;
          return false;
        });
      }

      if (matchedScore) {
        // Update existing score with audit revision entry
        const revision = {
          revisedBy: currentUser.name,
          revisedAt: now,
          previousTotal: matchedScore.totalScore,
          reason: data.notes || 'Score calibration update',
        };
        const updated: ScoreSubmission = {
          ...matchedScore,
          ...data,
          id: matchedScore.id,
          totalScore,
          revisionHistory: [revision, ...(matchedScore.revisionHistory || [])],
        };
        processedScores.push(updated);
      } else {
        // Create new score with a guaranteed unique, collision-proof ID
        const compIdentifier = data.participantId || data.teamEntryId || data.teamId || `comp${index}`;
        const cleanComp = String(compIdentifier).replace(/[^a-zA-Z0-9_-]/g, '');
        const uniqueRand = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        const newId = data.id || `SC-${data.programmeId}-${cleanComp}-${uniqueRand}`;

        const newScore: ScoreSubmission = {
          ...data,
          festId: (data as any).festId || activeFestId,
          id: newId,
          totalScore,
          submittedAt: now,
          revisionHistory: [],
        };
        processedScores.push(newScore);
      }
    });

    // Update React state in a single atomic update
    setScores((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      processedScores.forEach((s) => map.set(s.id, s));
      return Array.from(map.values());
    });

    // Persist to Firestore in a single atomic batch write
    saveScoresBatchToFirestore(processedScores);

    const firstProgId = scoresPayload[0]?.programmeId || '';
    logActivity('SUBMIT_SCORES', 'score', firstProgId, `Recorded evaluation marks for ${processedScores.length} contestants.`);

    return processedScores;
  };

  // Single Score Submission (Delegates to submitScoresBatch for collision safety)
  const submitOrUpdateScore = (
    data: Omit<ScoreSubmission, 'id' | 'submittedAt' | 'revisionHistory'> & { id?: string }
  ) => {
    const results = submitScoresBatch([data]);
    if (results.length > 0) {
      if (data.id) {
        logActivity('UPDATE_SCORE', 'score', data.id, `Revised score for programme ${data.programmeId} by ${currentUser.name}.`);
        addToast('success', 'Score Updated', 'Score entry saved with audit revision.');
      } else {
        logActivity('SUBMIT_SCORE', 'score', results[0].id, `Submitted score entry for ${data.programmeId} (${results[0].totalScore} marks).`);
        addToast('success', 'Score Submitted', 'Score recorded successfully.');
      }
    }
  };

  const updateScoreStatus = (id: string, newStatus: ScoreStatus, notes?: string) => {
    let updatedScoreObj: ScoreSubmission | undefined;
    setScores((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updates: Partial<ScoreSubmission> = { status: newStatus };
          if (newStatus === 'reviewed') updates.reviewedBy = currentUser.id;
          if (newStatus === 'approved') updates.approvedBy = currentUser.id;
          if (notes) updates.notes = notes;
          const updated = { ...s, ...updates };
          updatedScoreObj = updated;
          return updated;
        }
        return s;
      })
    );
    if (updatedScoreObj) {
      saveScoreToFirestore(updatedScoreObj);
    }
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

    const isTeamProgramme = programme.type === 'group' || programme.type === 'team' || programme.programmeType === 'team';

    // Protect against duplicate scores from the same judge: retain only the latest submission per (judge, competitor)
    const latestScoresPerJudgeComp = new Map<string, ScoreSubmission>();
    progScores.forEach((s) => {
      const compKey = isTeamProgramme
        ? (s.teamEntryId || s.teamId || s.id)
        : (s.participantId || s.teamId || s.id);
      const judgeCompKey = `${s.judgeId || 'default'}_${compKey}`;
      const existing = latestScoresPerJudgeComp.get(judgeCompKey);
      if (!existing || new Date(s.submittedAt || 0).getTime() >= new Date(existing.submittedAt || 0).getTime()) {
        latestScoresPerJudgeComp.set(judgeCompKey, s);
      }
    });

    // Consolidate scores per competitor:
    // For individual: key is participantId
    // For team: key is teamEntryId || teamId
    const scoreMap = new Map<
      string,
      {
        totalScore: number;
        judgeCount: number;
        teamId: string;
        participantId?: string;
        teamEntryId?: string;
        entryName?: string;
      }
    >();

    latestScoresPerJudgeComp.forEach((s) => {
      let key = '';
      if (isTeamProgramme) {
        key = s.teamEntryId || s.teamId || s.id;
      } else {
        key = s.participantId || s.teamId || s.id;
      }
      const participantObj = s.participantId ? participants.find((p) => p.id === s.participantId) : undefined;
      const entryObj = s.teamEntryId ? teamProgrammeEntries.find((e) => e.id === s.teamEntryId) : undefined;
      const resolvedTeamId = s.teamId || participantObj?.teamId || entryObj?.teamId || teams[0]?.id || '';

      const existing = scoreMap.get(key) || {
        totalScore: 0,
        judgeCount: 0,
        teamId: resolvedTeamId,
        participantId: isTeamProgramme ? undefined : s.participantId,
        teamEntryId: isTeamProgramme ? (s.teamEntryId || key) : undefined,
        entryName: isTeamProgramme ? (s.teamEntryName || entryObj?.entryName || teams.find(t => t.id === resolvedTeamId)?.name) : undefined,
      };
      existing.totalScore += s.totalScore;
      existing.judgeCount += 1;
      if (!existing.teamId && resolvedTeamId) existing.teamId = resolvedTeamId;
      scoreMap.set(key, existing);
    });

    // Compute averaged scores and rank
    const sortedEntries = Array.from(scoreMap.entries()).map(([key, data]) => {
      const finalScore = Math.round((data.totalScore / (data.judgeCount || 1)) * 10) / 10;
      return {
        key,
        teamId: data.teamId,
        participantId: data.participantId,
        teamEntryId: data.teamEntryId,
        entryName: data.entryName,
        finalScore,
      };
    });

    sortedEntries.sort((a, b) => b.finalScore - a.finalScore);

    const pointRules = settings.pointRules;
    const multiplier = isTeamProgramme ? (pointRules.groupMultiplier || 2) : 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let prevRank = 1;
    const newResults: ApprovedResult[] = sortedEntries.map((item, idx) => {
      let rank = idx + 1;
      if (idx > 0 && item.finalScore === sortedEntries[idx - 1].finalScore) {
        rank = prevRank;
      } else {
        rank = idx + 1;
        prevRank = rank;
      }

      let basePoints = 0;
      if (item.finalScore > 0) {
        if (rank === 1) basePoints = pointRules.firstPlace;
        else if (rank === 2) basePoints = pointRules.secondPlace;
        else if (rank === 3) basePoints = pointRules.thirdPlace;
        else if (rank === 4) basePoints = pointRules.fourthPlace;
        else if (rank === 5) basePoints = pointRules.fifthPlace;
      }

      const teamObj = teams.find((t) => t.id === item.teamId);
      const participantObj = item.participantId ? participants.find((p) => p.id === item.participantId) : undefined;
      const entryObj = item.teamEntryId ? teamProgrammeEntries.find((e) => e.id === item.teamEntryId) : undefined;

      // Unique, collision-proof ID per competitor in this programme (ties won't collide or overwrite each other!)
      const competitorKey = isTeamProgramme
        ? (item.teamEntryId || item.teamId || `team-${idx + 1}`)
        : (item.participantId || `part-${idx + 1}`);
      const cleanCompKey = String(competitorKey).replace(/[^a-zA-Z0-9_-]/g, '');
      const resultId = `RES-${programmeId}-${cleanCompKey}`;

      const resObj: ApprovedResult = {
        id: resultId,
        festId: programme.festId || activeFestId,
        programmeId,
        programmeName: programme.name,
        rank,
        isTeamProgramme,
        participantId: isTeamProgramme ? undefined : item.participantId,
        participantName: isTeamProgramme ? undefined : participantObj?.name,
        teamEntryId: isTeamProgramme ? (item.teamEntryId || entryObj?.id) : undefined,
        entryName: isTeamProgramme ? (item.entryName || entryObj?.entryName || teamObj?.name) : undefined,
        teamId: item.teamId,
        teamName: teamObj?.name || 'Independent',
        category: programme.category,
        finalScore: item.finalScore,
        pointsAwarded: basePoints * multiplier,
        published: true,
        publishedAt: now,
      };

      return resObj;
    });

    // Atomically sync results in Firestore (removes stale results for this programme and saves new ones)
    syncProgrammeResultsInFirestore(programmeId, newResults);

    // Remove old results for this programme and append newly calculated ones in state
    setResults((prev) => [...prev.filter((r) => r.programmeId !== programmeId), ...newResults]);

    // Mark programme as completed and resultPublished = true
    setProgrammes((prev) =>
      prev.map((p) => {
        if (p.id === programmeId) {
          const updated = { ...p, status: 'completed' as const, resultPublished: true, publishedAt: now };
          saveProgrammeToFirestore(updated).catch(() => {});
          return updated;
        }
        return p;
      })
    );

    // Update all scores to published
    setScores((prev) =>
      prev.map((s) => (s.programmeId === programmeId ? { ...s, status: 'published' } : s))
    );

    // Create an announcement automatically with unique ID
    const announcement: Announcement = {
      id: `ANN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Official Results Ratified: ${programme.name}`,
      content: `The results for ${programme.name} (${programme.category}) have been approved and published. Leaderboard points have been updated!`,
      category: 'results',
      isPublic: true,
      createdAt: now,
      author: currentUser.name,
    };
    setAnnouncements((prev) => [announcement, ...prev]);

    logActivity('PUBLISH_RESULTS', 'score', programmeId, `Published ratified results and awarded leaderboard points for ${programme.name}.`);
    invalidateClientCache();
    addToast('success', 'Results Published', `Results for ${programme.name} are now live on the Public Site.`);

    // Authoritatively publish results via trusted backend Cloud Function (generates secure PUBLISH_RESULTS audit)
    publishResultsViaCloudFunction(activeFestId, programmeId).catch((err) => {
      console.warn('[FestContext] Cloud function publishResults call error:', err);
    });
  };

  // Delete a single result entry
  const deleteResult = (resultId: string) => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can delete results.');
      return;
    }
    const target = results.find((r) => r.id === resultId);
    if (!target) return;

    setResults((prev) => prev.filter((r) => r.id !== resultId));
    deleteResultFromFirestore(resultId);

    // If no more results remain for this programme, reset programme.resultPublished
    const remainingForProg = results.filter((r) => r.programmeId === target.programmeId && r.id !== resultId);
    if (remainingForProg.length === 0) {
      setProgrammes((prev) =>
        prev.map((p) =>
          p.id === target.programmeId ? { ...p, resultPublished: false, publishedAt: undefined } : p
        )
      );
      const prog = programmes.find((p) => p.id === target.programmeId);
      if (prog) {
        saveProgrammeToFirestore({ ...prog, resultPublished: false, publishedAt: undefined });
      }
    }

    logActivity('DELETE_RESULT', 'score', resultId, `Deleted result entry #${resultId} (${target.participantName || target.entryName || 'Rank #' + target.rank}).`);
    invalidateClientCache();
    addToast('info', 'Result Deleted', 'Result entry removed successfully.');
  };

  // Delete all results for a programme (retract results)
  const deleteProgrammeResults = (programmeId: string) => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can delete results.');
      return;
    }
    const prog = programmes.find((p) => p.id === programmeId);
    const progName = prog?.name || programmeId;

    // Remove all results for this programme
    setResults((prev) => prev.filter((r) => r.programmeId !== programmeId));
    deleteProgrammeResultsFromFirestore(programmeId);

    // Mark programme as resultPublished = false
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === programmeId ? { ...p, resultPublished: false, publishedAt: undefined } : p
      )
    );
    if (prog) {
      saveProgrammeToFirestore({ ...prog, resultPublished: false, publishedAt: undefined });
    }

    // Revert scores from 'published' to 'approved'
    setScores((prev) =>
      prev.map((s) => (s.programmeId === programmeId && s.status === 'published' ? { ...s, status: 'approved' } : s))
    );

    logActivity('DELETE_RESULTS', 'score', programmeId, `Deleted and retracted published results for programme ${progName}.`);
    invalidateClientCache();
    addToast('info', 'Results Deleted', `All results for ${progName} have been deleted and retracted from the public scoreboard.`);
  };

  // Delete a score entry
  const deleteScore = (scoreId: string) => {
    if (!hasPermission(['admin', 'fest_admin', 'super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Fest Admins can delete scores.');
      return;
    }
    setScores((prev) => prev.filter((s) => s.id !== scoreId));
    deleteScoreFromFirestore(scoreId);
    logActivity('DELETE_SCORE', 'score', scoreId, `Deleted score entry #${scoreId}.`);
    addToast('info', 'Score Deleted', 'Score sheet entry was deleted.');
  };

  // Team Management
  const addTeam = (data: Omit<Team, 'id' | 'createdAt'>): boolean => {
    const festTarget = data.festId || activeFestId;
    const exists = teams.some(
      (t) => (t.festId ? t.festId === festTarget : festTarget === 'FEST-01') &&
             t.code.toLowerCase() === data.code.toLowerCase()
    );
    if (exists) {
      addToast('error', 'Duplicate Team Code', `Team code "${data.code}" already exists in this festival.`);
      return false;
    }
    const newId = `TM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTeam: Team = {
      ...data,
      festId: festTarget,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTeams((prev) => [...prev, newTeam]);
    saveTeamToFirestore(newTeam);
    logActivity('CREATE_TEAM', 'team', newId, `Created team ${data.name} (${data.code}) for fest ${festTarget}.`);
    addToast('success', 'Team Added', `${data.name} created successfully.`);
    return true;
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) {
        saveTeamToFirestore(updated);
      }
      return next;
    });
    logActivity('UPDATE_TEAM', 'team', id, `Updated team profile for ${id}.`);
    addToast('success', 'Team Updated', 'Team settings saved.');
  };

  const deleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
    deleteTeamFromFirestore(id);
    logActivity('DELETE_TEAM', 'team', id, `Deleted team ${id}.`);
    addToast('info', 'Team Removed', 'Team was deactivated.');
  };

  // Schedule Slot Management
  const addScheduleSlot = (slot: Omit<ScheduleSlot, 'id'>) => {
    const targetFest = slot.festId || activeFestId;
    const newId = `SCH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSlot: ScheduleSlot = { ...slot, festId: targetFest, id: newId };
    setScheduleSlots((prev) => [...prev, newSlot]);
    if (slot.programmeId) {
      setProgrammes((prev) =>
        prev.map((p) => {
          if (p.id === slot.programmeId) {
            const updatedP: Programme = {
              ...p,
              date: slot.date,
              venue: slot.venue,
              stage: slot.stage,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: slot.status,
            };
            saveProgrammeToFirestore(updatedP);
            return updatedP;
          }
          return p;
        })
      );
    }
    logActivity('CREATE_SCHEDULE_SLOT', 'schedule', newId, `Created schedule slot for programme ${slot.programmeId}.`);
    addToast('success', 'Slot Added', 'New schedule entry added.');
  };

  const updateScheduleSlot = (id: string, updates: Partial<ScheduleSlot>) => {
    const progId = updates.programmeId || (id.startsWith('SCH-') ? id.replace('SCH-', '') : undefined);
    setScheduleSlots((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) {
        return prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      }
      return [
        ...prev,
        {
          id,
          festId: activeFestId,
          programmeId: progId || '',
          venue: updates.venue || 'Auditorium Hall A',
          stage: updates.stage || 'Stage 1',
          date: updates.date || '2026-11-22',
          startTime: updates.startTime || '10:00',
          endTime: updates.endTime || '12:00',
          status: updates.status || 'scheduled',
          ...updates,
        },
      ];
    });

    if (progId) {
      setProgrammes((prev) =>
        prev.map((p) => {
          if (p.id === progId) {
            const updatedP: Programme = {
              ...p,
              date: updates.date !== undefined ? updates.date : p.date,
              venue: updates.venue !== undefined ? updates.venue : p.venue,
              stage: updates.stage !== undefined ? updates.stage : p.stage,
              startTime: updates.startTime !== undefined ? updates.startTime : p.startTime,
              endTime: updates.endTime !== undefined ? updates.endTime : p.endTime,
              status: updates.status !== undefined ? updates.status : p.status,
            };
            saveProgrammeToFirestore(updatedP);
            return updatedP;
          }
          return p;
        })
      );
    }
    logActivity('UPDATE_SCHEDULE_SLOT', 'schedule', id, `Updated schedule slot ${id}.`);
    addToast('success', 'Slot Updated', 'Schedule slot time/stage updated.');
  };

  const deleteScheduleSlot = (id: string) => {
    const progId = id.startsWith('SCH-') ? id.replace('SCH-', '') : undefined;
    setScheduleSlots((prev) => prev.filter((s) => s.id !== id));
    if (progId) {
      setProgrammes((prev) =>
        prev.map((p) => {
          if (p.id === progId) {
            const updatedP: Programme = { ...p, status: 'draft' };
            saveProgrammeToFirestore(updatedP);
            return updatedP;
          }
          return p;
        })
      );
    }
    logActivity('DELETE_SCHEDULE_SLOT', 'schedule', id, `Deleted schedule slot ${id}.`);
    addToast('info', 'Slot Removed', 'The schedule slot was removed.');
  };

  // User Management
  const addUser = (data: Omit<User, 'id' | 'createdAt'>): boolean => {
    if (!data?.name || !data?.email) {
      addToast('error', 'Missing Data', 'User name and email are required.');
      return false;
    }
    const festTarget = data.festId || activeFestId;
    const targetEmail = (data.email || '').toLowerCase().trim();
    const exists = (users || []).some(
      (u) => (u?.festId ? u.festId === festTarget : festTarget === 'FEST-01') &&
             u?.email && u.email.toLowerCase().trim() === targetEmail
    );
    if (exists) {
      addToast('error', 'Duplicate Email', `User with email ${data.email} already exists in this festival.`);
      return false;
    }
    const newId = `USR-${(users.length + 1).toString().padStart(2, '0')}`;
    const newUser: User = {
      ...data,
      festId: festTarget,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setUsers((prev) => {
      const updated = [...prev, newUser];
      StorageService.saveUsers(updated);
      return updated;
    });
    saveUserToFirestore(newUser).catch(() => {});
    logActivity('CREATE_USER', 'user', newId, `Created user ${data.name} with role ${data.role} for fest ${festTarget}.`);
    addToast('success', 'User Created', `Account for ${data.name} created.`);
    return true;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    if (!id) return;
    setUsers((prev) => {
      const updated = prev.map((u) => (u?.id === id ? { ...u, ...updates } : u));
      StorageService.saveUsers(updated);
      return updated;
    });
    if (currentUser?.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    saveUserToFirestore({ id, ...updates } as User).catch(() => {});
    logActivity('UPDATE_USER', 'user', id, `Updated user details for ${id}.`);
    addToast('success', 'User Updated', 'Account permissions updated.');
  };

  const deleteUser = (id: string) => {
    if (!id) return;
    if (currentUser?.id === id) {
      addToast('error', 'Action Denied', 'You cannot delete your own active session account.');
      return;
    }
    setUsers((prev) => {
      const updated = prev.filter((u) => u?.id !== id);
      StorageService.saveUsers(updated);
      return updated;
    });
    deleteUserFromFirestore(id);
    logActivity('DELETE_USER', 'user', id, `Removed user account ${id}.`);
    addToast('info', 'User Removed', 'User account was deleted.');
  };

  // Settings
  const updateSettings = (newSettings: FestSettings) => {
    setSettings(newSettings);
    // Also synchronize active fest metadata and pointRules in fests list
    setFests((prev) =>
      prev.map((f) => {
        if (f.id === activeFestId) {
          const updatedFest: Fest = {
            ...f,
            name: newSettings.festName || f.name,
            edition: newSettings.festEdition || f.edition,
            tagline: newSettings.tagline || f.tagline,
            startDate: newSettings.startDate || f.startDate,
            endDate: newSettings.endDate || f.endDate,
            venue: newSettings.venue || f.venue,
            institution: newSettings.organizer || f.institution,
            adminEmail: newSettings.contactEmail || f.adminEmail,
            adminPhone: newSettings.contactPhone || f.adminPhone,
          };
          saveFestToFirestore(updatedFest);
          return updatedFest;
        }
        return f;
      })
    );
    saveFestSettingsToFirestore(activeFestId, newSettings);
    logActivity('UPDATE_SETTINGS', 'settings', undefined, `Updated settings for ${newSettings.festName} (${activeFestId}).`);
    addToast('success', 'Settings Saved', `${newSettings.festName} configuration has been updated.`);
  };

  const addAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => {
    const newId = `ANN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
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

  const approveFestRequest = async (requestId: string, approvalNote?: string) => {
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
      const result = await approveFestApplicationViaCloudFunction(requestId, approvalNote);
      if (!result.success) {
        addToast('error', 'Approval Failed', result.message || 'Firebase could not approve this request.');
        return;
      }
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

    // Guard against duplicate fest creation
    const existingFest = fests.find(
      (f) =>
        f.id === req.id ||
        ((f.name || '').toLowerCase().trim() === (req.festName || '').toLowerCase().trim() &&
         (f.institution || '').toLowerCase().trim() === (req.institution || '').toLowerCase().trim()) ||
        (f.adminEmail && req.requestingAdminEmail && f.adminEmail.toLowerCase().trim() === req.requestingAdminEmail.toLowerCase().trim())
    );

    const adminUserId = req.requestingAdminId || `usr-admin-${Date.now()}`;

    if (existingFest) {
      // Provision/Promote fest admin for existing fest
      const festAdminUser: User = {
        id: adminUserId,
        name: req.requestingAdminName || req.contactPersonName || 'Fest Admin',
        email: req.requestingAdminEmail,
        phone: req.requestingAdminPhone || '',
        phoneVerified: true,
        emailVerified: true,
        role: 'admin',
        status: 'active',
        festId: existingFest.id,
        createdAt: req.createdAt || nowDate,
        updatedAt: now,
      };
      setUsers((prev) => [
        festAdminUser,
        ...prev.filter((u) => u.id !== adminUserId && u.email?.toLowerCase() !== festAdminUser.email?.toLowerCase())
      ]);
      saveUserToFirestore(festAdminUser);
      saveFestToFirestore(existingFest);

      addToast('info', 'Fest Already Approved', `"${req.festName}" is registered as ${existingFest.id}. Fest Admin access is activated.`);
      return;
    }

    const existingNumbers = fests
      .map((f) => {
        const m = f.id.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const newFestId = `FEST-${String(nextNum).padStart(2, '0')}`;

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
    saveFestToFirestore(newFest);

    // Provision and promote Fest Admin account
    const festAdminUser: User = {
      id: adminUserId,
      name: req.requestingAdminName || req.contactPersonName || 'Fest Admin',
      email: req.requestingAdminEmail,
      phone: req.requestingAdminPhone || '',
      phoneVerified: true,
      emailVerified: true,
      role: 'admin',
      status: 'active',
      festId: newFestId,
      createdAt: nowDate,
      updatedAt: now,
    };
    setUsers((prev) => [
      festAdminUser,
      ...prev.filter((u) => u.id !== adminUserId && u.email?.toLowerCase() !== festAdminUser.email?.toLowerCase())
    ]);
    saveUserToFirestore(festAdminUser);

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
      prev.map((f) => {
        if (f.id === festId) {
          const updated = { ...f, status: 'suspended' as const, suspensionReason: reason, publicPagePublished: false };
          saveFestToFirestore(updated);
          return updated;
        }
        return f;
      })
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
      prev.map((f) => {
        if (f.id === festId) {
          const updated = { ...f, status: restoredStatus, suspensionReason: undefined };
          saveFestToFirestore(updated);
          return updated;
        }
        return f;
      })
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
      prev.map((f) => {
        if (f.id === festId) {
          const updated = { ...f, status: 'archived' as const };
          saveFestToFirestore(updated);
          return updated;
        }
        return f;
      })
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

  const deleteFestComplete = async (festId: string): Promise<boolean> => {
    if (!hasPermission(['super_admin'])) {
      addToast('error', 'Permission Denied', 'Only authorized Platform Super Admins can permanently delete a festival.');
      return false;
    }
    const target = fests.find((f) => f.id === festId);
    const targetName = target?.name || festId;

    try {
      // 1. Cascading deletion across Firestore & StorageService
      await deleteFestCascading(festId);

      // 2. Clear state in FestContext immediately
      setFests((prev) => prev.filter((f) => f.id !== festId));
      setTeams((prev) => prev.filter((t) => t.festId !== festId));
      setParticipants((prev) => prev.filter((p) => p.festId !== festId));
      setProgrammes((prev) => prev.filter((p) => p.festId !== festId));
      setScores((prev) => prev.filter((s) => s.festId !== festId));
      setResults((prev) => prev.filter((r) => r.festId !== festId));
      setScheduleSlots((prev) => prev.filter((s) => !s.festId || s.festId !== festId));
      setJudges((prev) => prev.filter((j) => !j.festId || j.festId !== festId));
      setComplaints((prev) => prev.filter((c) => c.festId !== festId));
      setMilestones((prev) => prev.filter((m) => m.festId !== festId));
      setTeamProgrammeEntries((prev) => prev.filter((e) => e.festId !== festId));

      // 3. Fallback active fest selection
      if (activeFestId === festId) {
        const remaining = fests.filter((f) => f.id !== festId);
        setActiveFestId(remaining[0]?.id || '');
      }

      // 4. Audit Log
      logPlatformAudit(
        'DELETE_FEST',
        'fest',
        festId,
        `Permanently deleted festival "${targetName}" (${festId}) and all linked teams, participants, programmes, scores, and portals.`,
        target?.status || 'active',
        'deleted'
      );

      addToast(
        'success',
        'Festival Deleted',
        `"${targetName}" and all associated competition data have been permanently removed.`
      );
      return true;
    } catch (err: any) {
      console.error('[FestContext] deleteFestComplete error:', err);
      addToast('error', 'Deletion Error', err.message || 'Failed to delete festival.');
      return false;
    }
  };

  const updateFestMetadata = (festId: string, updates: Partial<Fest>) => {
    setFests((prev) =>
      prev.map((f) => {
        if (f.id === festId) {
          const updated = { ...f, ...updates };
          saveFestToFirestore(updated);
          return updated;
        }
        return f;
      })
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

      // Refresh participants and users from persistent storage / Firestore when accessing admin
      if (portal === 'fest_admin') {
        const stored = StorageService.getParticipants();
        if (Array.isArray(stored) && stored.length > 0) {
          setParticipants(stored);
        }
        if (isFirebaseConfigured) {
          fetchParticipants(targetFestId || activeFestId)
            .then((pts) => {
              if (pts && pts.length > 0) {
                setParticipants(pts);
                StorageService.saveParticipants(pts);
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      // ignore
    }
  };


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
    const programme = programmes.find((p) => p.id === data.programmeId);
    if (!programme) {
      addToast('error', 'Assignment Error', 'Target competition programme not found.');
      return;
    }

    // 1. Authorised team verification: participants must belong to the requesting team
    const memberObjs = participants.filter((p) => data.participantIds.includes(p.id));
    for (const mem of memberObjs) {
      if (mem.teamId !== data.teamId) {
        addToast('error', 'Unauthorized Assignment', `Participant ${mem.name} does not belong to team #${data.teamId}.`);
        return;
      }
    }

    // 2. Duplicate registration check: do not allow duplicate registration of the same participant
    const existingTeamAssignments = assignments.filter((a) => a.programmeId === data.programmeId && a.teamId === data.teamId);
    const existingAssignedPids = new Set<string>();
    existingTeamAssignments.forEach((a) => a.participantIds.forEach((pid) => existingAssignedPids.add(pid)));

    for (const pid of data.participantIds) {
      if (existingAssignedPids.has(pid)) {
        const mem = memberObjs.find((m) => m.id === pid);
        addToast('error', 'Duplicate Registration', `${mem?.name || pid} is already registered for "${programme.name}".`);
        return;
      }
    }

    // 3. Category eligibility check
    if (programme.eligibleCategories && programme.eligibleCategories.length > 0) {
      const allowed = programme.eligibleCategories.map((c) => c.toLowerCase());
      const allowsGeneral = allowed.includes('general');

      for (const mem of memberObjs) {
        const cat = (mem.category || '').toLowerCase();
        const matchesCategory = allowed.includes(cat) || (allowsGeneral && cat === 'general');
        if (!matchesCategory) {
          addToast(
            'error',
            'Category Ineligible',
            `${mem.name} (${mem.category}) is not eligible for "${programme.name}". Eligible: [${programme.eligibleCategories.join(', ')}].`
          );
          return;
        }
      }
    }

    // 4. Individual Programme Limits Per Team enforcement
    const isIndividual = programme.type === 'individual' || programme.programmeType === 'individual';
    if (isIndividual) {
      const maxAllowed = programme.maxParticipantsPerTeam || 1;
      const currentCount = existingAssignedPids.size;
      const remainingSlots = Math.max(0, maxAllowed - currentCount);

      if (currentCount + data.participantIds.length > maxAllowed) {
        addToast(
          'error',
          'Programme Limit Exceeded',
          `Maximum allowed participants for your team in "${programme.name}" is ${maxAllowed}. Already registered: ${currentCount}. Remaining slots: ${remainingSlots}.`
        );
        return;
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const id = `ASG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
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

    // Update programme registeredParticipantIds if not already present
    setProgrammes((prev) =>
      prev.map((prg) => {
        if (prg.id === data.programmeId) {
          const currentPids = new Set(prg.registeredParticipantIds || []);
          data.participantIds.forEach((pid) => currentPids.add(pid));
          const currentTids = new Set(prg.registeredTeamIds || []);
          currentTids.add(data.teamId);
          return {
            ...prg,
            registeredParticipantIds: Array.from(currentPids),
            registeredTeamIds: Array.from(currentTids),
          };
        }
        return prg;
      })
    );

    addToast('success', 'Programme Assigned', `Assigned ${data.participantNames.join(', ')} to ${data.programmeName}.`);
  };

  // ==========================================
  // CATEGORIES MANAGEMENT (General & Custom)
  // ==========================================
  const addCategory = async (catData: Omit<FestCategory, 'id' | 'createdAt'>): Promise<boolean> => {
    const trimmed = catData.name.trim();
    if (!trimmed) {
      addToast('error', 'Invalid Name', 'Category name is required.');
      return false;
    }
    const currentFestCats = festCategories;
    if (currentFestCats.some((c: FestCategory) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      addToast('error', 'Category Exists', `Category "${trimmed}" already exists.`);
      return false;
    }
    const targetFest = catData.festId || activeFestId;
    const id = `CAT-${targetFest}-${Date.now().toString().slice(-6)}`;
    const newCat: FestCategory = {
      ...catData,
      id,
      name: trimmed,
      festId: targetFest,
      enabled: catData.enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    await saveCategoryToFirestore(newCat);
    logActivity('CREATE_CATEGORY', 'settings', id, `Created category "${trimmed}" for fest ${targetFest}.`);
    addToast('success', 'Category Created', `Category "${trimmed}" successfully added.`);
    return true;
  };

  const updateCategory = async (id: string, updates: Partial<FestCategory>): Promise<void> => {
    const targetFest = activeFestId || 'FEST-04';
    const existing = festCategories.find((c: FestCategory) => c.id === id || c.id === `${id}_${targetFest}`) ||
      categories.find((c: FestCategory) => c.id === id || c.id === `${id}_${targetFest}`);
    const oldName = existing?.name?.trim();
    const newName = updates.name !== undefined ? updates.name.trim() : oldName;

    // Ensure category ID is scoped to active fest
    const effectiveId = id.includes(targetFest) ? id : `${id}_${targetFest}`;

    // CHECK FOR MERGE: If newName matches another existing category in this fest (different id)
    const duplicateMatch = newName
      ? festCategories.find((c: FestCategory) =>
          c.id !== id &&
          c.id !== effectiveId &&
          c.name.trim().toLowerCase() === newName.toLowerCase()
        )
      : undefined;

    const isMerged = !!duplicateMatch;

    const updated: FestCategory = {
      ...(existing || {}),
      ...(duplicateMatch || {}),
      ...updates,
      id: duplicateMatch?.id || effectiveId,
      festId: targetFest,
      name: newName || existing?.name || '',
      enabled: updates.enabled ?? existing?.enabled ?? true,
      createdAt: existing?.createdAt || duplicateMatch?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If merging two categories into one, permanently delete the duplicate record from Firestore
    if (duplicateMatch && duplicateMatch.id !== effectiveId) {
      await deleteCategoryFromFirestore(id, targetFest);
      await deleteCategoryFromFirestore(effectiveId, targetFest);
    }

    setCategories((prev) => {
      const filtered = prev.filter((c: FestCategory) => {
        if (c.id === id || c.id === effectiveId) return false;
        if (duplicateMatch && c.id === duplicateMatch.id) return false;
        if (newName && c.festId === targetFest && c.name.trim().toLowerCase() === newName.toLowerCase()) return false;
        return true;
      });
      return [...filtered, updated];
    });

    await saveCategoryToFirestore(updated);

    // If category name was renamed, changed casing, or merged, cascade updates across programmes, participants, and entries
    const namesToMigrate = new Set<string>();
    if (oldName) namesToMigrate.add(oldName.toLowerCase());
    if (duplicateMatch?.name) namesToMigrate.add(duplicateMatch.name.trim().toLowerCase());
    if (newName) namesToMigrate.add(newName.toLowerCase());

    const shouldCascade = (oldName && newName && oldName !== newName) || isMerged;

    if (shouldCascade && newName) {
      setProgrammes((prev) =>
        prev.map((prg) => {
          if (prg.festId && prg.festId !== targetFest) return prg;
          let modified = false;
          let cat = prg.category;
          let eligible = prg.eligibleCategories;

          const prgCatNorm = (prg.category || '').trim().toLowerCase();
          if (namesToMigrate.has(prgCatNorm)) {
            cat = newName;
            modified = true;
          }
          if (prg.eligibleCategories?.some((ec) => namesToMigrate.has((ec || '').trim().toLowerCase()))) {
            eligible = Array.from(
              new Set(
                prg.eligibleCategories.map((ec) =>
                  namesToMigrate.has((ec || '').trim().toLowerCase()) ? newName : ec
                )
              )
            );
            modified = true;
          }

          if (modified) {
            const updatedPrg = { ...prg, category: cat, eligibleCategories: eligible };
            saveProgrammeToFirestore(updatedPrg);
            return updatedPrg;
          }
          return prg;
        })
      );

      setParticipants((prev) =>
        prev.map((p) => {
          if (p.festId && p.festId !== targetFest) return p;
          const pCatNorm = (p.category || '').trim().toLowerCase();
          if (namesToMigrate.has(pCatNorm)) {
            const updatedP = { ...p, category: newName };
            saveParticipantToFirestore(updatedP);
            return updatedP;
          }
          return p;
        })
      );

      setTeamProgrammeEntries((prev) =>
        prev.map((entry) => {
          if (entry.festId && entry.festId !== targetFest) return entry;
          const entryCatNorm = (entry.categoryId || '').trim().toLowerCase();
          if (namesToMigrate.has(entryCatNorm)) {
            const updatedEntry = { ...entry, categoryId: newName };
            saveTeamProgrammeEntryToFirestore(updatedEntry);
            return updatedEntry;
          }
          return entry;
        })
      );

      if (isMerged) {
        logActivity('UPDATE_CATEGORY', 'settings', updated.id, `Merged categories into unified category "${newName}".`);
        addToast('success', 'Categories Unified', `Categories were successfully merged into single category "${newName}".`);
      } else {
        logActivity('UPDATE_CATEGORY', 'settings', updated.id, `Renamed category from "${oldName}" to "${newName}".`);
        addToast('success', 'Category Renamed', `Category "${oldName}" renamed to "${newName}". Associated records updated.`);
      }
    } else {
      addToast('info', 'Category Updated', 'Category settings saved.');
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    const targetFest = activeFestId || 'FEST-04';
    const cat = festCategories.find((c: FestCategory) => c.id === id) || categories.find((c: FestCategory) => c.id === id);
    if (!cat) return;
    if (cat.isSystem && !id.includes(targetFest)) {
      addToast('warning', 'System Protected', 'System default categories cannot be removed.');
      return;
    }
    setCategories((prev) => prev.filter((c: FestCategory) => c.id !== id && c.id !== `${id}_${targetFest}`));
    await deleteCategoryFromFirestore(id, targetFest);
    addToast('info', 'Category Removed', `Category "${cat.name}" removed.`);
  };

  const toggleGeneralCategory = async (enabled: boolean): Promise<void> => {
    const targetFest = activeFestId || 'FEST-04';
    const genId = `CAT-GEN_${targetFest}`;
    const existing = festCategories.find((c: FestCategory) => c.isGeneral || c.id === 'CAT-GEN' || c.id === genId);
    const updatedGen: FestCategory = {
      id: genId,
      festId: targetFest,
      name: 'General',
      description: 'Open to participants of any age or classification without minimum or maximum age limit.',
      isGeneral: true,
      enabled,
      isSystem: true,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories((prev) => {
      const exists = prev.some((c: FestCategory) => c.id === genId);
      if (exists) {
        return prev.map((c: FestCategory) => (c.id === genId ? updatedGen : c));
      }
      return [...prev, updatedGen];
    });
    await saveCategoryToFirestore(updatedGen);
    updateSettings({ ...settings, generalCategoryEnabled: enabled });
    addToast('info', 'General Category', `General Category ${enabled ? 'Enabled' : 'Disabled'}.`);
  };

  // ==========================================
  // TEAM PROGRAMME ENTRIES MANAGEMENT
  // ==========================================
  const createTeamProgrammeEntry = (data: {
    programmeId: string;
    teamId: string;
    entryName: string;
    categoryId: string;
    memberParticipantIds: string[];
  }): { success: boolean; error?: string; entryId?: string } => {
    const programme = programmes.find((p) => p.id === data.programmeId);
    if (!programme) return { success: false, error: 'Programme not found.' };

    const team = teams.find((t) => t.id === data.teamId);
    if (!team) return { success: false, error: 'Team not found.' };

    // 1. Max entries per team limit
    const maxEntries = programme.maxEntriesPerTeam || 1;
    const existingEntriesForTeam = teamProgrammeEntries.filter(
      (e) => e.programmeId === data.programmeId && e.teamId === data.teamId && e.status !== 'withdrawn'
    );
    if (existingEntriesForTeam.length >= maxEntries) {
      const err = `Maximum ${maxEntries} team ${maxEntries === 1 ? 'entry' : 'entries'} allowed for your team in this programme.`;
      addToast('error', 'Limit Exceeded', err);
      return { success: false, error: err };
    }

    // 2. Team member size limits
    const minMembers = programme.minTeamMembers || 2;
    const maxMembers = programme.maxTeamMembers || 20;
    if (data.memberParticipantIds.length < minMembers) {
      const err = `Requires at least ${minMembers} members (you selected ${data.memberParticipantIds.length}).`;
      addToast('error', 'Team Size Error', err);
      return { success: false, error: err };
    }
    if (data.memberParticipantIds.length > maxMembers) {
      const err = `Maximum ${maxMembers} members allowed (you selected ${data.memberParticipantIds.length}).`;
      addToast('error', 'Team Size Error', err);
      return { success: false, error: err };
    }

    // 3. Verify all participants belong to requesting team
    const memberObjs = participants.filter((p) => data.memberParticipantIds.includes(p.id));
    for (const mem of memberObjs) {
      if (mem.teamId !== data.teamId) {
        const err = `Participant ${mem.name} does not belong to team ${team.name}.`;
        addToast('error', 'Unauthorized Member', err);
        return { success: false, error: err };
      }
    }

    // 4. Category eligibility check
    if (programme.eligibleCategories && programme.eligibleCategories.length > 0) {
      const allowed = programme.eligibleCategories.map((c) => c.toLowerCase());
      const allowsGeneral = allowed.includes('general');

      for (const mem of memberObjs) {
        const memCat = (mem.category || '').toLowerCase();
        const matchesCategory = allowed.includes(memCat) || (allowsGeneral && memCat === 'general');
        if (!matchesCategory) {
          const err = `${mem.name} (${mem.category}) is not eligible for "${programme.name}". Eligible: [${programme.eligibleCategories.join(', ')}].`;
          addToast('error', 'Ineligible Category', err);
          return { success: false, error: err };
        }
      }
    }

    // 5. Check duplicate participant in another entry for THIS programme
    if (!programme.allowMultiEntriesPerParticipant) {
      for (const entry of existingEntriesForTeam) {
        const duplicate = entry.memberParticipantIds.find((id) => data.memberParticipantIds.includes(id));
        if (duplicate) {
          const dupObj = memberObjs.find((m) => m.id === duplicate);
          const err = `${dupObj?.name || duplicate} is already part of another entry ("${entry.entryName}") for this programme.`;
          addToast('error', 'Duplicate Entry Member', err);
          return { success: false, error: err };
        }
      }
    }

    // 6. Check multi-team programme participation restriction
    if (programme.allowMultiTeamProgrammeParticipation === false) {
      const otherTeamEntries = teamProgrammeEntries.filter(
        (e) => e.programmeId !== data.programmeId && e.status !== 'withdrawn'
      );
      for (const entry of otherTeamEntries) {
        const conflictId = entry.memberParticipantIds.find((id) => data.memberParticipantIds.includes(id));
        if (conflictId) {
          const conflictName = memberObjs.find((m) => m.id === conflictId)?.name || conflictId;
          const otherPrg = programmes.find((p) => p.id === entry.programmeId);
          const err = `${conflictName} is already participating in team event "${otherPrg?.name || entry.programmeId}". Multiple team event participation is restricted.`;
          addToast('error', 'Participation Conflict', err);
          return { success: false, error: err };
        }
      }
    }

    const id = `TPE-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();
    const newEntry: TeamProgrammeEntry = {
      id,
      festId: programme.festId || activeFestId || 'FEST-01',
      programmeId: data.programmeId,
      programmeName: programme.name,
      teamId: data.teamId,
      teamName: team.name,
      entryName: data.entryName.trim(),
      categoryId: data.categoryId,
      memberParticipantIds: data.memberParticipantIds,
      memberNames: memberObjs.map((m) => m.name),
      status: 'registered',
      createdAt: now,
      updatedAt: now,
    };

    setTeamProgrammeEntries((prev) => [...prev, newEntry]);
    saveTeamProgrammeEntryToFirestore(newEntry);

    // Update participants registeredProgrammes and persist to Firestore
    setParticipants((prev) =>
      prev.map((p) => {
        if (data.memberParticipantIds.includes(p.id)) {
          if (!p.registeredProgrammes.includes(data.programmeId)) {
            const updated = { ...p, registeredProgrammes: [...p.registeredProgrammes, data.programmeId] };
            saveParticipantToFirestore(updated).catch(() => {});
            return updated;
          }
        }
        return p;
      })
    );

    // Update programme registeredTeamIds and registeredParticipantIds
    const currentProg = programmes.find((p) => p.id === data.programmeId) || programme;
    const existingTeamIds = new Set(currentProg.registeredTeamIds || []);
    const existingParticipantIds = new Set(currentProg.registeredParticipantIds || []);
    existingTeamIds.add(data.teamId);
    data.memberParticipantIds.forEach((pid) => existingParticipantIds.add(pid));

    updateProgramme(data.programmeId, {
      registeredTeamIds: Array.from(existingTeamIds),
      registeredParticipantIds: Array.from(existingParticipantIds),
    });

    logActivity('CREATE_TEAM_ENTRY', 'programme', id, `Registered team entry "${newEntry.entryName}" for ${programme.name}.`);
    addToast('success', 'Entry Registered', `Team entry "${newEntry.entryName}" successfully registered.`);
    return { success: true, entryId: id };
  };

  const updateTeamProgrammeEntry = (id: string, updates: Partial<TeamProgrammeEntry>): { success: boolean; error?: string } => {
    const entry = teamProgrammeEntries.find((e) => e.id === id);
    if (!entry) return { success: false, error: 'Team entry not found.' };

    const programme = programmes.find((p) => p.id === entry.programmeId);
    if (programme) {
      const minMembers = programme.minTeamMembers || 2;
      const maxMembers = programme.maxTeamMembers || 20;
      const memberIds = updates.memberParticipantIds || entry.memberParticipantIds;
      if (memberIds.length < minMembers || memberIds.length > maxMembers) {
        const err = `Entry must have between ${minMembers} and ${maxMembers} members (currently ${memberIds.length}).`;
        addToast('error', 'Validation Error', err);
        return { success: false, error: err };
      }
    }

    const memberObjs = updates.memberParticipantIds
      ? participants.filter((p) => updates.memberParticipantIds!.includes(p.id))
      : undefined;

    const updatedEntry: TeamProgrammeEntry = {
      ...entry,
      ...updates,
      memberNames: memberObjs ? memberObjs.map((m) => m.name) : (updates.memberNames || entry.memberNames),
      updatedAt: new Date().toISOString(),
    };

    setTeamProgrammeEntries((prev) => prev.map((e) => (e.id === id ? updatedEntry : e)));
    saveTeamProgrammeEntryToFirestore(updatedEntry);

    // If memberParticipantIds changed, synchronize participants' registeredProgrammes and programme's registeredParticipantIds
    if (updates.memberParticipantIds) {
      const oldMemberIds = new Set(entry.memberParticipantIds || []);
      const newMemberIds = new Set(updates.memberParticipantIds);

      const addedIds = updates.memberParticipantIds.filter((mId) => !oldMemberIds.has(mId));
      const removedIds = (entry.memberParticipantIds || []).filter((mId) => !newMemberIds.has(mId));

      setParticipants((prev) =>
        prev.map((p) => {
          if (addedIds.includes(p.id)) {
            if (!p.registeredProgrammes.includes(entry.programmeId)) {
              const updated = { ...p, registeredProgrammes: [...p.registeredProgrammes, entry.programmeId] };
              saveParticipantToFirestore(updated).catch(() => {});
              return updated;
            }
          } else if (removedIds.includes(p.id)) {
            const inAnotherEntry = teamProgrammeEntries.some(
              (e) => e.id !== id && e.programmeId === entry.programmeId && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(p.id)
            );
            if (!inAnotherEntry) {
              const updated = { ...p, registeredProgrammes: p.registeredProgrammes.filter((pid) => pid !== entry.programmeId) };
              saveParticipantToFirestore(updated).catch(() => {});
              return updated;
            }
          }
          return p;
        })
      );

      if (programme) {
        const currentPids = new Set(programme.registeredParticipantIds || []);
        addedIds.forEach((pid) => currentPids.add(pid));
        removedIds.forEach((pid) => {
          const inAnotherEntry = teamProgrammeEntries.some(
            (e) => e.id !== id && e.programmeId === entry.programmeId && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(pid)
          );
          if (!inAnotherEntry) {
            currentPids.delete(pid);
          }
        });
        updateProgramme(programme.id, { registeredParticipantIds: Array.from(currentPids) });
      }
    }

    addToast('success', 'Entry Updated', `Team entry "${updatedEntry.entryName}" updated.`);
    return { success: true };
  };

  const deleteTeamProgrammeEntry = (id: string): { success: boolean; error?: string } => {
    const entry = teamProgrammeEntries.find((e) => e.id === id);
    if (!entry) return { success: false, error: 'Team entry not found.' };

    setTeamProgrammeEntries((prev) => prev.filter((e) => e.id !== id));
    deleteTeamProgrammeEntryFromFirestore(id, entry.festId);

    // Remove programme from members' registeredProgrammes if not part of another entry
    setParticipants((prev) =>
      prev.map((p) => {
        if ((entry.memberParticipantIds || []).includes(p.id)) {
          const inAnotherEntry = teamProgrammeEntries.some(
            (e) => e.id !== id && e.programmeId === entry.programmeId && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(p.id)
          );
          if (!inAnotherEntry) {
            const updated = {
              ...p,
              registeredProgrammes: (p.registeredProgrammes || []).filter((pid) => pid !== entry.programmeId),
            };
            saveParticipantToFirestore(updated).catch(() => {});
            return updated;
          }
        }
        return p;
      })
    );

    // Update programme registeredTeamIds and registeredParticipantIds
    const programme = programmes.find((p) => p.id === entry.programmeId);
    if (programme) {
      const remainingTeamEntries = teamProgrammeEntries.filter(
        (e) => e.id !== id && e.programmeId === entry.programmeId && e.teamId === entry.teamId && e.status !== 'withdrawn'
      );
      const remainingTeamIds = remainingTeamEntries.length > 0
        ? (programme.registeredTeamIds || [])
        : (programme.registeredTeamIds || []).filter((tId) => tId !== entry.teamId);

      const remainingPids = new Set(programme.registeredParticipantIds || []);
      (entry.memberParticipantIds || []).forEach((pid) => {
        const inAnother = teamProgrammeEntries.some(
          (e) => e.id !== id && e.programmeId === entry.programmeId && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(pid)
        );
        if (!inAnother) {
          remainingPids.delete(pid);
        }
      });

      updateProgramme(programme.id, {
        registeredTeamIds: remainingTeamIds,
        registeredParticipantIds: Array.from(remainingPids),
      });
    }

    addToast('info', 'Entry Withdrawn', `Team entry "${entry.entryName}" withdrawn.`);
    return { success: true };
  };

  const withdrawAssignment = (assignmentId: string) => {
    const asg = assignments.find((a) => a.id === assignmentId);
    if (!asg) return;
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    deleteProgrammeAssignmentFromFirestore(assignmentId);
    setParticipants((prev) =>
      prev.map((p) => {
        if (asg.participantIds.includes(p.id)) {
          const updated = { ...p, registeredProgrammes: p.registeredProgrammes.filter((pid) => pid !== asg.programmeId) };
          saveParticipantToFirestore(updated).catch(() => {});
          return updated;
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
        chestNumber: data.chestNumber,
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
    addToast('info', 'Invitation Sent', `Invitation resent to ${leader.phone}. They can complete activation using the configured account verification flow.`);
    return { success: true, message: `Invitation resent to ${leader.phone}.` };
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
    chestNumber?: string;
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
      chestNumber: data.chestNumber?.trim() || undefined,
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
        settings: festSettings,
        teams: festTeams,
        allTeams: teams,
        setTeams,
        participants: festParticipants,
        allParticipants: participants,
        setParticipants,
        judges: festJudges,
        allJudges: judges,
        programmes: festProgrammes,
        allProgrammes: programmes,
        categories: festCategories,
        allCategories: categories,
        teamProgrammeEntries,
        scores: festScores,
        allScores: scores,
        results: festResults,
        allResults: results,
        scheduleSlots: festScheduleSlots,
        allScheduleSlots: scheduleSlots,
        users: festUsers,
        allUsers: users,
        setUsers,
        activityLogs: festActivityLogs,
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
        getCategoryScoreboard,
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
        submitScoresBatch,
        updateScoreStatus,
        deleteScore,
        publishProgrammeResults,
        deleteResult,
        deleteProgrammeResults,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleGeneralCategory,
        createTeamProgrammeEntry,
        updateTeamProgrammeEntry,
        deleteTeamProgrammeEntry,
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
        deleteFestComplete,
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
        refreshFirestoreData: (force?: boolean) => syncFirestoreData(force),
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
