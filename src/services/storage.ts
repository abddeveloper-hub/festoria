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
  Fest,
  FestRequest,
  FestMilestone,
  PlatformSettings,
  PlatformNotification,
  PlatformAuditLog,
  Complaint,
  ProgrammeAssignment,
  TeamLeaderInvitation
} from '../types';

export const DEFAULT_PRODUCTION_SETTINGS: FestSettings = {
  festName: 'Festoria 2026',
  festEdition: 'Annual Cultural Festival',
  tagline: 'Inspire, Compete, Illuminate',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  venue: 'Grand Central Convention Campus',
  organizer: 'Council of Cultural & Fine Arts',
  contactEmail: 'contact@festoria.app',
  contactPhone: '',
  pointRules: {
    firstPlace: 10,
    secondPlace: 7,
    thirdPlace: 5,
    fourthPlace: 3,
    fifthPlace: 1,
    groupMultiplier: 2,
  },
  tieBreakPolicy: 'average_marks',
  publicResultsVisible: true,
  publicScheduleVisible: true,
  registrationOpen: true,
  timezone: 'Asia/Kolkata',
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'Festoria Platform',
  platformLogo: '',
  platformDescription: 'Unified Inter-Collegiate Fest Management & Governance System',
  supportEmail: 'support@festoria.app',
  supportPhone: '',
  defaultTimezone: 'Asia/Kolkata',
  defaultLanguage: 'en',
  maintenanceMode: false,
  allowNewFestRequests: true,
  requiredRequestFields: ['festName', 'institution', 'contactEmail'],
  allowedFestCategories: ['Cultural', 'Arts', 'Literary', 'Technical'],
  requireApprovalNote: false,
  resubmissionAllowed: true,
  defaultPublicVisibility: true,
  mfaRequired: false,
  sessionTimeoutMinutes: 60,
  auditLogRetentionDays: 90,
};

const STORAGE_KEYS = {
  SETTINGS: 'festflow_settings',
  TEAMS: 'festflow_teams',
  JUDGES: 'festflow_judges',
  PROGRAMMES: 'festflow_programmes',
  PARTICIPANTS: 'festflow_participants',
  SCORES: 'festflow_scores',
  RESULTS: 'festflow_results',
  SCHEDULE: 'festflow_schedule',
  USERS: 'festflow_users',
  LOGS: 'festflow_logs',
  ANNOUNCEMENTS: 'festflow_announcements',
  GALLERY: 'festflow_gallery',
  CURRENT_USER: 'festflow_current_user',
  FESTS: 'festflow_fests',
  FEST_REQUESTS: 'festflow_fest_requests',
  PLATFORM_SETTINGS: 'festflow_platform_settings',
  MILESTONES: 'festflow_milestones',
  NOTIFICATIONS: 'festflow_notifications',
  PLATFORM_AUDIT_LOGS: 'festflow_platform_audit_logs',
  COMPLAINTS: 'festflow_complaints',
  ASSIGNMENTS: 'festflow_assignments',
  ACTIVE_PARTICIPANT_ID: 'festflow_active_participant_id',
  TEAM_LEADER_INVITATIONS: 'festflow_team_leader_invitations',
};

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Visitor',
  email: '',
  phone: '',
  phoneVerified: false,
  role: 'participant',
  status: 'inactive',
  createdAt: '',
};

export const StorageService = {
  getSettings(): FestSettings {
    return getStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_PRODUCTION_SETTINGS);
  },
  saveSettings(settings: FestSettings): void {
    setStorageItem(STORAGE_KEYS.SETTINGS, settings);
  },

  getTeams(): Team[] {
    return getStorageItem(STORAGE_KEYS.TEAMS, []);
  },
  saveTeams(teams: Team[]): void {
    setStorageItem(STORAGE_KEYS.TEAMS, teams);
  },

  getJudges(): Judge[] {
    return getStorageItem(STORAGE_KEYS.JUDGES, []);
  },
  saveJudges(judges: Judge[]): void {
    setStorageItem(STORAGE_KEYS.JUDGES, judges);
  },

  getProgrammes(): Programme[] {
    return getStorageItem(STORAGE_KEYS.PROGRAMMES, []);
  },
  saveProgrammes(programmes: Programme[]): void {
    setStorageItem(STORAGE_KEYS.PROGRAMMES, programmes);
  },

  getParticipants(): Participant[] {
    return getStorageItem(STORAGE_KEYS.PARTICIPANTS, []);
  },
  saveParticipants(participants: Participant[]): void {
    setStorageItem(STORAGE_KEYS.PARTICIPANTS, participants);
  },

  getScoreSubmissions(): ScoreSubmission[] {
    return getStorageItem(STORAGE_KEYS.SCORES, []);
  },
  saveScoreSubmissions(scores: ScoreSubmission[]): void {
    setStorageItem(STORAGE_KEYS.SCORES, scores);
  },

  getApprovedResults(): ApprovedResult[] {
    return getStorageItem(STORAGE_KEYS.RESULTS, []);
  },
  saveApprovedResults(results: ApprovedResult[]): void {
    setStorageItem(STORAGE_KEYS.RESULTS, results);
  },

  getScheduleSlots(): ScheduleSlot[] {
    return getStorageItem(STORAGE_KEYS.SCHEDULE, []);
  },
  saveScheduleSlots(slots: ScheduleSlot[]): void {
    setStorageItem(STORAGE_KEYS.SCHEDULE, slots);
  },

  getUsers(): User[] {
    return getStorageItem(STORAGE_KEYS.USERS, []);
  },
  saveUsers(users: User[]): void {
    setStorageItem(STORAGE_KEYS.USERS, users);
  },

  getCurrentUser(): User {
    const defaultUser = GUEST_USER;
    return getStorageItem(STORAGE_KEYS.CURRENT_USER, defaultUser);
  },
  setCurrentUser(user: User): void {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  getActivityLogs(): ActivityLog[] {
    return getStorageItem(STORAGE_KEYS.LOGS, []);
  },
  addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      ...log,
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.saveActivityLogs([newLog, ...logs]);
  },
  saveActivityLogs(logs: ActivityLog[]): void {
    setStorageItem(STORAGE_KEYS.LOGS, logs);
  },

  getAnnouncements(): Announcement[] {
    return getStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, []);
  },
  saveAnnouncements(announcements: Announcement[]): void {
    setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
  },

  getGallery(): GalleryItem[] {
    return getStorageItem(STORAGE_KEYS.GALLERY, []);
  },
  saveGallery(gallery: GalleryItem[]): void {
    setStorageItem(STORAGE_KEYS.GALLERY, gallery);
  },

  // SUPER ADMIN & PLATFORM METHODS
  getFests(): Fest[] {
    const raw = getStorageItem<Fest[]>(STORAGE_KEYS.FESTS, []);
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const deduped: Fest[] = [];
    for (const fest of raw) {
      if (!fest || !fest.id) continue;
      const key = `${(fest.name || '').toLowerCase().trim()}_${(fest.institution || '').toLowerCase().trim()}`;
      if (!seenIds.has(fest.id) && !seenNames.has(key)) {
        seenIds.add(fest.id);
        seenNames.add(key);
        deduped.push(fest);
      }
    }
    return deduped;
  },
  saveFests(fests: Fest[]): void {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const deduped: Fest[] = [];
    for (const fest of fests) {
      if (!fest || !fest.id) continue;
      const key = `${(fest.name || '').toLowerCase().trim()}_${(fest.institution || '').toLowerCase().trim()}`;
      if (!seenIds.has(fest.id) && !seenNames.has(key)) {
        seenIds.add(fest.id);
        seenNames.add(key);
        deduped.push(fest);
      }
    }
    setStorageItem(STORAGE_KEYS.FESTS, deduped);
  },

  getFestRequests(): FestRequest[] {
    return getStorageItem(STORAGE_KEYS.FEST_REQUESTS, []);
  },
  saveFestRequests(requests: FestRequest[]): void {
    setStorageItem(STORAGE_KEYS.FEST_REQUESTS, requests);
  },

  getPlatformSettings(): PlatformSettings {
    return getStorageItem(STORAGE_KEYS.PLATFORM_SETTINGS, DEFAULT_PLATFORM_SETTINGS);
  },
  savePlatformSettings(settings: PlatformSettings): void {
    setStorageItem(STORAGE_KEYS.PLATFORM_SETTINGS, settings);
  },

  getMilestones(): FestMilestone[] {
    return getStorageItem(STORAGE_KEYS.MILESTONES, []);
  },
  saveMilestones(milestones: FestMilestone[]): void {
    setStorageItem(STORAGE_KEYS.MILESTONES, milestones);
  },

  getPlatformNotifications(): PlatformNotification[] {
    return getStorageItem(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  savePlatformNotifications(notifs: PlatformNotification[]): void {
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  getPlatformAuditLogs(): PlatformAuditLog[] {
    return getStorageItem(STORAGE_KEYS.PLATFORM_AUDIT_LOGS, []);
  },
  savePlatformAuditLogs(logs: PlatformAuditLog[]): void {
    setStorageItem(STORAGE_KEYS.PLATFORM_AUDIT_LOGS, logs);
  },
  addPlatformAuditLog(log: Omit<PlatformAuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getPlatformAuditLogs();
    const newLog: PlatformAuditLog = {
      ...log,
      id: `AUDIT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.savePlatformAuditLogs([newLog, ...logs]);
  },

  getComplaints(): Complaint[] {
    return getStorageItem(STORAGE_KEYS.COMPLAINTS, []);
  },
  saveComplaints(complaints: Complaint[]): void {
    setStorageItem(STORAGE_KEYS.COMPLAINTS, complaints);
  },

  getAssignments(): ProgrammeAssignment[] {
    return getStorageItem(STORAGE_KEYS.ASSIGNMENTS, []);
  },
  saveAssignments(assignments: ProgrammeAssignment[]): void {
    setStorageItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
  },

  getActiveParticipantId(): string {
    return getStorageItem(STORAGE_KEYS.ACTIVE_PARTICIPANT_ID, '');
  },
  saveActiveParticipantId(id: string): void {
    setStorageItem(STORAGE_KEYS.ACTIVE_PARTICIPANT_ID, id);
  },

  getTeamLeaderInvitations(): TeamLeaderInvitation[] {
    return getStorageItem(STORAGE_KEYS.TEAM_LEADER_INVITATIONS, []);
  },
  saveTeamLeaderInvitations(invitations: TeamLeaderInvitation[]): void {
    setStorageItem(STORAGE_KEYS.TEAM_LEADER_INVITATIONS, invitations);
  },

  // Reset to initial demo database
  resetToDefaultData(): void {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.JUDGES);
    localStorage.removeItem(STORAGE_KEYS.PROGRAMMES);
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    localStorage.removeItem(STORAGE_KEYS.GALLERY);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.FESTS);
    localStorage.removeItem(STORAGE_KEYS.FEST_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.PLATFORM_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.MILESTONES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.PLATFORM_AUDIT_LOGS);
  },
};

// BUSINESS LOGIC ENGINE
export interface TeamLeaderboardEntry {
  team: Team;
  totalPoints: number;
  rank: number;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdPlaceCount: number;
  otherPlacesCount: number;
  totalResults: number;
}

export function calculateLeaderboard(
  teams: Team[],
  results: ApprovedResult[],
  programmes: Programme[]
): TeamLeaderboardEntry[] {
  // Only published results contribute to public / ratified points
  const activeResults = results.filter((r) => r.published);

  const teamStats = new Map<
    string,
    {
      totalPoints: number;
      first: number;
      second: number;
      third: number;
      other: number;
      totalResults: number;
    }
  >();

  teams.forEach((t) => {
    teamStats.set(t.id, {
      totalPoints: 0,
      first: 0,
      second: 0,
      third: 0,
      other: 0,
      totalResults: 0,
    });
  });

  activeResults.forEach((res) => {
    const stats = teamStats.get(res.teamId);
    if (!stats) return;

    stats.totalPoints += res.pointsAwarded;
    stats.totalResults += 1;
    if (res.rank === 1) stats.first += 1;
    else if (res.rank === 2) stats.second += 1;
    else if (res.rank === 3) stats.third += 1;
    else stats.other += 1;
  });

  const entries: TeamLeaderboardEntry[] = teams
    .filter((t) => t.status === 'active')
    .map((team) => {
      const stats = teamStats.get(team.id) || {
        totalPoints: 0,
        first: 0,
        second: 0,
        third: 0,
        other: 0,
        totalResults: 0,
      };
      return {
        team,
        totalPoints: stats.totalPoints,
        rank: 0,
        firstPlaceCount: stats.first,
        secondPlaceCount: stats.second,
        thirdPlaceCount: stats.third,
        otherPlacesCount: stats.other,
        totalResults: stats.totalResults,
      };
    });

  // Sort descending by points, tie-breaking by 1st places, then 2nd places
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.firstPlaceCount !== a.firstPlaceCount) {
      return b.firstPlaceCount - a.firstPlaceCount;
    }
    return b.secondPlaceCount - a.secondPlaceCount;
  });

  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (
      i > 0 &&
      entries[i].totalPoints === entries[i - 1].totalPoints &&
      entries[i].firstPlaceCount === entries[i - 1].firstPlaceCount
    ) {
      entries[i].rank = entries[i - 1].rank;
    } else {
      entries[i].rank = currentRank;
    }
    currentRank++;
  }

  return entries;
}

// Conflict detection for schedules
export interface ScheduleConflict {
  type: 'venue' | 'judge' | 'participant';
  message: string;
  programme1Id: string;
  programme2Id: string;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

export function detectScheduleConflicts(
  programmes: Programme[],
  participants: Participant[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < programmes.length; i++) {
    for (let j = i + 1; j < programmes.length; j++) {
      const p1 = programmes[i];
      const p2 = programmes[j];

      // Ignore cancelled or draft
      if (p1.status === 'cancelled' || p2.status === 'cancelled') continue;

      // Must be on the same date to overlap
      if (p1.date !== p2.date) continue;

      // Check time overlap
      if (timesOverlap(p1.startTime, p1.endTime, p2.startTime, p2.endTime)) {
        // 1. Venue collision
        if (p1.venue === p2.venue) {
          conflicts.push({
            type: 'venue',
            message: `Venue conflict: "${p1.name}" and "${p2.name}" are both scheduled at "${p1.venue}" between ${p1.startTime}-${p1.endTime} and ${p2.startTime}-${p2.endTime}.`,
            programme1Id: p1.id,
            programme2Id: p2.id,
          });
        }

        // 2. Judge collision
        const commonJudges = p1.assignedJudgeIds.filter((jId) =>
          p2.assignedJudgeIds.includes(jId)
        );
        if (commonJudges.length > 0) {
          conflicts.push({
            type: 'judge',
            message: `Judge assignment conflict: Judge is booked for both "${p1.name}" and "${p2.name}" at overlapping times on ${p1.date}.`,
            programme1Id: p1.id,
            programme2Id: p2.id,
          });
        }

        // 3. Participant collision
        const commonParticipants = p1.registeredParticipantIds.filter((ptId) =>
          p2.registeredParticipantIds.includes(ptId)
        );
        if (commonParticipants.length > 0) {
          conflicts.push({
            type: 'participant',
            message: `Participant conflict: ${commonParticipants.length} participant(s) are registered for both simultaneous events ("${p1.name}" and "${p2.name}").`,
            programme1Id: p1.id,
            programme2Id: p2.id,
          });
        }
      }
    }
  }

  return conflicts;
}

// CSV export helper
export function exportToCSV(filename: string, rows: object[]): void {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = (row as any)[k];
            if (cell === null || cell === undefined) cell = '';
            else cell = String(cell).replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportToCsv = exportToCSV;
