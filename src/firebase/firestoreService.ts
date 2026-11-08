import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured, app } from './config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  Fest,
  User,
  Team,
  Participant,
  Programme,
  ProgrammeAssignment,
  ScoreSubmission,
  ApprovedResult,
  Announcement,
  Complaint,
  ActivityLog,
  FestSettings,
  TeamLeaderInvitation,
  FestRequest,
  FestPublicPageData,
  FestInvitation
} from '../types';
import { StorageService } from '../services/storage';

// ==========================================
// TRUSTED CLOUD FUNCTIONS FOR SENSITIVE ACTIONS
// ==========================================
export async function publishResultsViaCloudFunction(festId: string, programmeId: string): Promise<boolean> {
  if (isFirebaseConfigured && app) {
    try {
      const functions = getFunctions(app);
      const callPublish = httpsCallable(functions, 'publishResults');
      await callPublish({ festId, programmeId });
      return true;
    } catch (e) {
      console.warn('[CloudFunctions] publishResults call failed:', e);
    }
  }
  return false;
}

export async function resolveComplaintViaCloudFunction(
  festId: string,
  complaintId: string,
  resolutionNote: string,
  calibratedScore?: number
): Promise<boolean> {
  if (isFirebaseConfigured && app) {
    try {
      const functions = getFunctions(app);
      const callResolve = httpsCallable(functions, 'resolveComplaint');
      await callResolve({ festId, complaintId, resolutionNote, calibratedScore });
      return true;
    } catch (e) {
      console.warn('[CloudFunctions] resolveComplaint call failed:', e);
    }
  }
  return false;
}

// ==========================================
// AUDIT LOGGING HELPER
// ==========================================
export async function logAudit(
  festId: string,
  user: { id: string; name: string; role: any },
  action: string,
  targetType: string,
  targetId: string,
  details: string
): Promise<void> {
  const logEntry: ActivityLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action,
    targetType: targetType as any,
    targetId,
    details,
    timestamp: new Date().toISOString()
  };

  // Always log locally
  StorageService.addActivityLog(logEntry);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'audit_logs', logEntry.id), {
        ...logEntry,
        festId,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[Firestore] Failed to write audit log:', e);
    }
  }
}

// ==========================================
// 1. FESTS SERVICE
// ==========================================
export async function fetchFests(): Promise<Fest[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'fests'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Fest);
      }
    } catch (e) {
      console.warn('[Firestore] fetchFests error, falling back to local storage:', e);
    }
  }
  return StorageService.getFests();
}

// ==========================================
// 2. USERS SERVICE
// ==========================================
export async function fetchUserByUid(uid: string): Promise<User | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as User;
      }
    } catch (e) {
      console.warn('[Firestore] fetchUserByUid error:', e);
    }
  }
  const users = StorageService.getUsers();
  return users.find((u) => u.id === uid) || null;
}

export async function fetchUserByPhone(normalizedPhone: string): Promise<User | null> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as User;
      }
    } catch (e) {
      console.warn('[Firestore] fetchUserByPhone error:', e);
    }
  }
  const users = StorageService.getUsers();
  return users.find((u) => u.phone === normalizedPhone) || null;
}

export async function saveUserToFirestore(user: User): Promise<void> {
  // Update local storage
  const users = StorageService.getUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  StorageService.saveUsers(users);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveUserToFirestore error:', e);
    }
  }
}

// ==========================================
// 3. TEAMS SERVICE
// ==========================================
export async function fetchTeams(festId: string = 'FEST-01'): Promise<Team[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'teams'), where('festId', '==', festId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Team);
      }
    } catch (e) {
      console.warn('[Firestore] fetchTeams error:', e);
    }
  }
  return StorageService.getTeams();
}

export async function saveTeamToFirestore(team: Team): Promise<void> {
  const teams = StorageService.getTeams();
  const index = teams.findIndex((t) => t.id === team.id);
  if (index >= 0) {
    teams[index] = team;
  } else {
    teams.push(team);
  }
  StorageService.saveTeams(teams);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'teams', team.id), {
        ...team,
        festId: 'FEST-01',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveTeamToFirestore error:', e);
    }
  }
}

// ==========================================
// 4. PARTICIPANTS SERVICE
// ==========================================
export async function fetchParticipants(festId: string = 'FEST-01'): Promise<Participant[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'participants'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Participant);
      }
    } catch (e) {
      console.warn('[Firestore] fetchParticipants error:', e);
    }
  }
  return StorageService.getParticipants();
}

export async function saveParticipantToFirestore(participant: Participant): Promise<void> {
  const participants = StorageService.getParticipants();
  const index = participants.findIndex((p) => p.id === participant.id);
  if (index >= 0) {
    participants[index] = participant;
  } else {
    participants.push(participant);
  }
  StorageService.saveParticipants(participants);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('festoria_participants_changed', { detail: { participantId: participant.id } })
    );
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'participants', participant.id), {
        ...participant,
        festId: participant.festId || 'FEST-01',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveParticipantToFirestore error:', e);
    }
  }
}

/**
 * Real-time listener for pending/roster participants for a specific team.
 * Returns an unsubscribe cleanup callback.
 */
export function subscribeToTeamRequests(
  teamId: string,
  festId: string = 'FEST-01',
  callback: (requests: Participant[]) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;

  const notifyLocal = () => {
    const all = StorageService.getParticipants();
    const teamReqs = all.filter(
      (p) =>
        (p.festId === festId || !p.festId) &&
        (p.teamId === teamId || p.requestedTeamId === teamId)
    );
    callback(teamReqs);
  };

  notifyLocal();

  const handleLocalChange = () => {
    notifyLocal();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('festoria_participants_changed', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'participants'),
        where('festId', '==', festId),
        where('teamId', '==', teamId)
      );

      unsubscribeFirestore = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => d.data() as Participant);
          callback(list);
        },
        (err) => {
          console.warn(`[Firestore] subscribeToTeamRequests error for team ${teamId}:`, err);
          if (onError) onError(err);
        }
      );
    } catch (e: any) {
      console.warn('[Firestore] Failed to establish team requests listener:', e);
      if (onError) onError(e);
    }
  }

  return () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('festoria_participants_changed', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    }
  };
}

/**
 * Real-time listener for a single participant's registration and approval status.
 * Returns an unsubscribe cleanup callback.
 */
export function subscribeToParticipantStatus(
  participantId: string,
  callback: (participant: Participant | null) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;

  const notifyLocal = () => {
    const all = StorageService.getParticipants();
    const target = all.find((p) => p.id === participantId) || null;
    callback(target);
  };

  notifyLocal();

  const handleLocalChange = () => {
    notifyLocal();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('festoria_participants_changed', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'participants', participantId);
      unsubscribeFirestore = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            callback(snap.data() as Participant);
          } else {
            callback(null);
          }
        },
        (err) => {
          console.warn(`[Firestore] subscribeToParticipantStatus error for ${participantId}:`, err);
          if (onError) onError(err);
        }
      );
    } catch (e: any) {
      console.warn('[Firestore] Failed to establish participant listener:', e);
      if (onError) onError(e);
    }
  }

  return () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('festoria_participants_changed', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    }
  };
}

/**
 * Real-time listener for all participant requests across a fest (Admin view).
 * Returns an unsubscribe cleanup callback.
 */
export function subscribeToFestParticipantRequests(
  festId: string = 'FEST-01',
  callback: (requests: Participant[]) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;

  const notifyLocal = () => {
    const all = StorageService.getParticipants();
    const festReqs = all.filter((p) => p.festId === festId || !p.festId);
    callback(festReqs);
  };

  notifyLocal();

  const handleLocalChange = () => {
    notifyLocal();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('festoria_participants_changed', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'participants'),
        where('festId', '==', festId)
      );

      unsubscribeFirestore = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => d.data() as Participant);
          callback(list);
        },
        (err) => {
          console.warn(`[Firestore] subscribeToFestParticipantRequests error for fest ${festId}:`, err);
          if (onError) onError(err);
        }
      );
    } catch (e: any) {
      console.warn('[Firestore] Failed to establish fest requests listener:', e);
      if (onError) onError(e);
    }
  }

  return () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('festoria_participants_changed', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    }
  };
}

// ==========================================
// 5. PROGRAMMES SERVICE
// ==========================================
export async function fetchProgrammes(festId: string = 'FEST-01'): Promise<Programme[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'programmes'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Programme);
      }
    } catch (e) {
      console.warn('[Firestore] fetchProgrammes error:', e);
    }
  }
  return StorageService.getProgrammes();
}

export async function saveProgrammeToFirestore(programme: Programme): Promise<void> {
  const programmes = StorageService.getProgrammes();
  const index = programmes.findIndex((p) => p.id === programme.id);
  if (index >= 0) {
    programmes[index] = programme;
  } else {
    programmes.push(programme);
  }
  StorageService.saveProgrammes(programmes);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'programmes', programme.id), {
        ...programme,
        festId: 'FEST-01',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveProgrammeToFirestore error:', e);
    }
  }
}

// ==========================================
// 6. SCORES & RESULTS SERVICE
// ==========================================
export async function fetchScores(): Promise<ScoreSubmission[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'scores'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ScoreSubmission);
      }
    } catch (e) {
      console.warn('[Firestore] fetchScores error:', e);
    }
  }
  return StorageService.getScoreSubmissions();
}

export async function saveScoreToFirestore(score: ScoreSubmission): Promise<void> {
  const scores = StorageService.getScoreSubmissions();
  const index = scores.findIndex((s) => s.id === score.id);
  if (index >= 0) {
    scores[index] = score;
  } else {
    scores.push(score);
  }
  StorageService.saveScoreSubmissions(scores);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'scores', score.id), {
        ...score,
        festId: 'FEST-01',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveScoreToFirestore error:', e);
    }
  }
}

export async function fetchResults(): Promise<ApprovedResult[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'results'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ApprovedResult);
      }
    } catch (e) {
      console.warn('[Firestore] fetchResults error:', e);
    }
  }
  return StorageService.getApprovedResults();
}

export async function saveResultToFirestore(result: ApprovedResult): Promise<void> {
  const results = StorageService.getApprovedResults();
  const index = results.findIndex((r) => r.id === result.id);
  if (index >= 0) {
    results[index] = result;
  } else {
    results.push(result);
  }
  StorageService.saveApprovedResults(results);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'results', result.id), {
        ...result,
        festId: 'FEST-01',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveResultToFirestore error:', e);
    }
  }
}

// ==========================================
// 7. SEED DATA MIGRATION HELPER (DISABLED FOR PRODUCTION)
// ==========================================
export async function seedFirestoreIfEmpty(): Promise<{ seeded: boolean; message: string }> {
  return { seeded: false, message: 'Production mode: mock auto-seeding disabled.' };
}

// ==========================================
// 8. TEAM LEADER INVITATIONS SERVICE
// ==========================================
export async function fetchTeamLeaderInvitations(festId: string = 'FEST-01'): Promise<TeamLeaderInvitation[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'team_leader_invitations'), where('festId', '==', festId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as TeamLeaderInvitation);
      }
    } catch (e) {
      console.warn('[Firestore] fetchTeamLeaderInvitations error:', e);
    }
  }
  return StorageService.getTeamLeaderInvitations();
}

export async function fetchInvitationByPhone(
  normalizedPhone: string,
  festId: string = 'FEST-01'
): Promise<TeamLeaderInvitation | null> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'team_leader_invitations'),
        where('festId', '==', festId),
        where('phone', '==', normalizedPhone)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as TeamLeaderInvitation;
      }
    } catch (e) {
      console.warn('[Firestore] fetchInvitationByPhone error:', e);
    }
  }
  const invitations = StorageService.getTeamLeaderInvitations();
  return invitations.find((inv) => inv.phone === normalizedPhone && inv.festId === festId) || null;
}

export async function saveTeamLeaderInvitation(invitation: TeamLeaderInvitation): Promise<void> {
  const invitations = StorageService.getTeamLeaderInvitations();
  const index = invitations.findIndex((inv) => inv.id === invitation.id);
  if (index >= 0) {
    invitations[index] = invitation;
  } else {
    invitations.push(invitation);
  }
  StorageService.saveTeamLeaderInvitations(invitations);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'team_leader_invitations', invitation.id), {
        ...invitation,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveTeamLeaderInvitation error:', e);
    }
  }
}

export async function activateTeamLeaderInvitation(
  invitationId: string,
  activatedUserId: string
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const invitations = StorageService.getTeamLeaderInvitations();
  const target = invitations.find((i) => i.id === invitationId);
  if (target) {
    target.status = 'activated';
    target.activatedAt = now;
    target.activatedUserId = activatedUserId;
    StorageService.saveTeamLeaderInvitations(invitations);
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'team_leader_invitations', invitationId), {
        status: 'activated',
        activatedAt: serverTimestamp(),
        activatedUserId
      });
    } catch (e) {
      console.warn('[Firestore] activateTeamLeaderInvitation error:', e);
    }
  }
}

// ==========================================
// 9. PROGRAMME ASSIGNMENTS SERVICE
// ==========================================
export async function fetchProgrammeAssignments(festId: string = 'FEST-01'): Promise<ProgrammeAssignment[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'programme_assignments'), where('festId', '==', festId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ProgrammeAssignment);
      }
    } catch (e) {
      console.warn('[Firestore] fetchProgrammeAssignments error:', e);
    }
  }
  return StorageService.getAssignments();
}

export async function saveProgrammeAssignmentToFirestore(assignment: ProgrammeAssignment): Promise<void> {
  const assignments = StorageService.getAssignments();
  const index = assignments.findIndex((a) => a.id === assignment.id);
  if (index >= 0) {
    assignments[index] = assignment;
  } else {
    assignments.push(assignment);
  }
  StorageService.saveAssignments(assignments);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'programme_assignments', assignment.id), {
        ...assignment,
        festId: assignment.festId || 'FEST-01',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveProgrammeAssignmentToFirestore error:', e);
    }
  }
}

export async function deleteProgrammeAssignmentFromFirestore(assignmentId: string): Promise<void> {
  const assignments = StorageService.getAssignments();
  StorageService.saveAssignments(assignments.filter((a) => a.id !== assignmentId));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'programme_assignments', assignmentId));
    } catch (e) {
      console.warn('[Firestore] deleteProgrammeAssignmentFromFirestore error:', e);
    }
  }
}

// ==========================================
// 10. COMPLAINTS & APPEALS SERVICE
// ==========================================
export async function fetchComplaints(festId: string = 'FEST-01'): Promise<Complaint[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'complaints'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Complaint);
      }
    } catch (e) {
      console.warn('[Firestore] fetchComplaints error:', e);
    }
  }
  return StorageService.getComplaints();
}

export async function saveComplaintToFirestore(complaint: Complaint): Promise<void> {
  const complaints = StorageService.getComplaints();
  const index = complaints.findIndex((c) => c.id === complaint.id);
  if (index >= 0) {
    complaints[index] = complaint;
  } else {
    complaints.push(complaint);
  }
  StorageService.saveComplaints(complaints);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'complaints', complaint.id), {
        ...complaint,
        festId: 'FEST-01',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveComplaintToFirestore error:', e);
    }
  }
}

export async function updateComplaintInFirestore(
  complaintId: string,
  updates: Partial<Complaint>
): Promise<void> {
  const complaints = StorageService.getComplaints();
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index >= 0) {
    complaints[index] = { ...complaints[index], ...updates };
    StorageService.saveComplaints(complaints);
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[Firestore] updateComplaintInFirestore error:', e);
    }
  }
}

// ==========================================
// 11. ANNOUNCEMENTS SERVICE
// ==========================================
export async function fetchAnnouncements(festId: string = 'FEST-01'): Promise<Announcement[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Announcement);
      }
    } catch (e) {
      console.warn('[Firestore] fetchAnnouncements error:', e);
    }
  }
  return StorageService.getAnnouncements();
}

export async function saveAnnouncementToFirestore(announcement: Announcement): Promise<void> {
  const announcements = StorageService.getAnnouncements();
  const index = announcements.findIndex((a) => a.id === announcement.id);
  if (index >= 0) {
    announcements[index] = announcement;
  } else {
    announcements.push(announcement);
  }
  StorageService.saveAnnouncements(announcements);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'announcements', announcement.id), {
        ...announcement,
        festId: 'FEST-01',
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveAnnouncementToFirestore error:', e);
    }
  }
}

export async function deleteAnnouncementFromFirestore(announcementId: string): Promise<void> {
  const announcements = StorageService.getAnnouncements();
  StorageService.saveAnnouncements(announcements.filter((a) => a.id !== announcementId));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (e) {
      console.warn('[Firestore] deleteAnnouncementFromFirestore error:', e);
    }
  }
}

// ==========================================
// 12. FEST SETTINGS SERVICE
// ==========================================
export async function saveFestSettingsToFirestore(
  festId: string = 'FEST-01',
  settings: FestSettings
): Promise<void> {
  StorageService.saveSettings(settings);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'fest_settings', festId), {
        ...settings,
        festId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveFestSettingsToFirestore error:', e);
    }
  }
}

// ==========================================
// 13. REAL-TIME LEADERBOARD & RESULTS LISTENER
// ==========================================
export function subscribeToLeaderboardResults(
  festId: string = 'FEST-01',
  callback: (results: ApprovedResult[]) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;

  const notifyLocal = () => {
    const all = StorageService.getApprovedResults();
    const published = all.filter((r) => r.published);
    callback(published);
  };

  notifyLocal();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'results'), where('published', '==', true));
      unsubscribeFirestore = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => d.data() as ApprovedResult);
          callback(list);
        },
        (err) => {
          console.warn('[Firestore] subscribeToLeaderboardResults error:', err);
          if (onError) onError(err);
        }
      );
    } catch (e: any) {
      console.warn('[Firestore] Failed to establish leaderboard listener:', e);
      if (onError) onError(e);
    }
  }

  return () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

// ==========================================
// 14. FEST REQUESTS & GOVERNANCE PIPELINE
// ==========================================

/**
 * Checks if a pending or under-review fest application already exists for this institution or phone number.
 */
export async function checkDuplicateFestApplication(
  institutionName: string,
  phone?: string
): Promise<{ isDuplicate: boolean; existingRequest?: FestRequest }> {
  const normInst = institutionName.trim().toLowerCase();
  const normPhone = phone ? phone.trim().replace(/\D/g, '') : '';

  // 1. Check live Firestore
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'fest_requests'));
      for (const d of snap.docs) {
        const req = d.data() as FestRequest;
        const activeStatuses = ['pending', 'submitted', 'under_review', 'more_info_required', 'PENDING', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED'];
        if (activeStatuses.includes(req.status)) {
          if (req.institution && req.institution.trim().toLowerCase() === normInst) {
            return { isDuplicate: true, existingRequest: req };
          }
          if (normPhone && req.requestingAdminPhone) {
            const reqPhone = req.requestingAdminPhone.replace(/\D/g, '');
            if (reqPhone.length >= 10 && normPhone.endsWith(reqPhone.slice(-10))) {
              return { isDuplicate: true, existingRequest: req };
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Firestore] checkDuplicateFestApplication error:', e);
    }
  }

  // 2. Check Local Storage fallback
  const localRequests = StorageService.getFestRequests();
  for (const req of localRequests) {
    const activeStatuses = ['pending', 'submitted', 'under_review', 'more_info_required', 'PENDING', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED'];
    if (activeStatuses.includes(req.status)) {
      if (req.institution && req.institution.trim().toLowerCase() === normInst) {
        return { isDuplicate: true, existingRequest: req };
      }
      if (normPhone && req.requestingAdminPhone) {
        const reqPhone = req.requestingAdminPhone.replace(/\D/g, '');
        if (reqPhone.length >= 10 && normPhone.endsWith(reqPhone.slice(-10))) {
          return { isDuplicate: true, existingRequest: req };
        }
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Submits a new Fest Application to Firestore collection `fest_requests`.
 */
export async function submitFestApplication(application: FestRequest): Promise<{ success: boolean; id: string; message: string }> {
  // 1. Save to Local Storage for immediate responsive UI
  const existing = StorageService.getFestRequests();
  const filtered = existing.filter((r) => r.id !== application.id);
  StorageService.saveFestRequests([application, ...filtered]);

  // 2. Save to authoritative Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'fest_requests', application.id), {
        ...application,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return {
        success: true,
        id: application.id,
        message: 'Fest application submitted successfully.'
      };
    } catch (e: any) {
      console.error('[Firestore] submitFestApplication error:', e);
      return {
        success: false,
        id: application.id,
        message: e.message || 'Failed to persist application to Firestore.'
      };
    }
  }

  return {
    success: true,
    id: application.id,
    message: 'Application recorded successfully.'
  };
}

/**
 * Fetches all fest requests from Firestore or local storage.
 */
export async function fetchFestRequests(): Promise<FestRequest[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'fest_requests'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as FestRequest);
        list.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
        return list;
      }
    } catch (e) {
      console.warn('[Firestore] fetchFestRequests error:', e);
    }
  }
  return StorageService.getFestRequests();
}

/**
 * Approves a fest application via trusted Cloud Function.
 */
export async function approveFestApplicationViaCloudFunction(
  requestId: string,
  approvalNote?: string
): Promise<{ success: boolean; festId?: string; message: string }> {
  if (isFirebaseConfigured && app) {
    try {
      const functions = getFunctions(app);
      const callApprove = httpsCallable<
        { requestId: string; approvalNote?: string },
        { success: boolean; festId?: string; message: string }
      >(functions, 'approveFestApplication');

      const result = await callApprove({ requestId, approvalNote });
      return result.data;
    } catch (e: any) {
      console.warn('[CloudFunctions] approveFestApplication failed:', e);
      return { success: false, message: e.message || 'Approval function execution failed.' };
    }
  }
  return { success: false, message: 'Cloud functions not available.' };
}

/**
 * Rejects a fest application via trusted Cloud Function.
 */
export async function rejectFestApplicationViaCloudFunction(
  requestId: string,
  rejectionReason: string,
  note?: string
): Promise<{ success: boolean; message: string }> {
  if (isFirebaseConfigured && app) {
    try {
      const functions = getFunctions(app);
      const callReject = httpsCallable<
        { requestId: string; rejectionReason: string; note?: string },
        { success: boolean; message: string }
      >(functions, 'rejectFestApplication');

      const result = await callReject({ requestId, rejectionReason, note });
      return result.data;
    } catch (e: any) {
      console.warn('[CloudFunctions] rejectFestApplication failed:', e);
      return { success: false, message: e.message || 'Rejection function execution failed.' };
    }
  }
  return { success: false, message: 'Cloud functions not available.' };
}

/**
 * Requests more information for a fest application via trusted Cloud Function.
 */
export async function requestMoreInfoViaCloudFunction(
  requestId: string,
  moreInfoMessage: string
): Promise<{ success: boolean; message: string }> {
  if (isFirebaseConfigured && app) {
    try {
      const functions = getFunctions(app);
      const callMoreInfo = httpsCallable<
        { requestId: string; moreInfoMessage: string },
        { success: boolean; message: string }
      >(functions, 'requestMoreInfoFestApplication');

      const result = await callMoreInfo({ requestId, moreInfoMessage });
      return result.data;
    } catch (e: any) {
      console.warn('[CloudFunctions] requestMoreInfoFestApplication failed:', e);
      return { success: false, message: e.message || 'Request more info function execution failed.' };
    }
  }
  return { success: false, message: 'Cloud functions not available.' };
}

/**
 * Fetches an application by its unique Application ID (e.g. APP-2026-XXXX or REQ-2026-XXXX).
 */
export async function fetchFestApplicationById(applicationId: string): Promise<FestRequest | null> {
  const cleanId = applicationId.trim();
  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'fest_requests', cleanId));
      if (docSnap.exists()) {
        return docSnap.data() as FestRequest;
      }
    } catch (e) {
      console.warn('[Firestore] fetchFestApplicationById error:', e);
    }
  }
  const localList = StorageService.getFestRequests();
  return localList.find((r) => r.id.toLowerCase() === cleanId.toLowerCase()) || null;
}

/**
 * Fetches applications associated with a verified phone number.
 */
export async function fetchFestApplicationsByPhone(phone: string): Promise<FestRequest[]> {
  const normDigits = phone.replace(/\D/g, '');
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'fest_requests'));
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as FestRequest)
          .filter((r) => {
            const reqPhone = (r.requestingAdminPhone || '').replace(/\D/g, '');
            return reqPhone.length >= 10 && normDigits.endsWith(reqPhone.slice(-10));
          });
      }
    } catch (e) {
      console.warn('[Firestore] fetchFestApplicationsByPhone error:', e);
    }
  }
  const localList = StorageService.getFestRequests();
  return localList.filter((r) => {
    const reqPhone = (r.requestingAdminPhone || '').replace(/\D/g, '');
    return reqPhone.length >= 10 && normDigits.endsWith(reqPhone.slice(-10));
  });
}

// ==========================================
// PUBLIC FEST PAGE MEDIA & CONTENT MANAGEMENT
// ==========================================

export function getDefaultFestPublicPage(festId: string, festName?: string): FestPublicPageData {
  return {
    festId,
    hero: {
      heading: festName ? `Welcome to ${festName}` : 'Celebrate Passion, Talent & Innovation',
      description: 'The premier inter-collegiate annual cultural and technical championship.',
      primaryCtaText: 'Register Now',
      primaryCtaLink: '#register',
      secondaryCtaText: 'View Schedule',
      secondaryCtaLink: '#schedule',
      showFallbackCss: true
    },
    logo: {
      widthPx: 120,
      alignment: 'left'
    },
    photos: [],
    content: {
      welcomeTitle: 'Official Festival Portal',
      welcomeMessage: 'Join thousands of delegates, participants, and spectators across multiple stages and auditoriums.',
      aboutFest: 'A multi-day symposium of performing arts, literary contests, design hackathons, and intellectual debates.',
      venueInfo: 'Grand Campus Convention Center & Amphitheatre',
      contactEmail: 'convenor@festoria.app',
      contactPhone: '+91 98401 23001',
      highlights: [
        'Over 40+ accredited collegiate events and competitions',
        'Official transparent judge scoring with real-time ratifications',
        'Certified medals and university honorarium trophies'
      ]
    },
    updatedAt: new Date().toISOString(),
    version: 1
  };
}

/**
 * Fetches the published public fest page (viewable by all visitors).
 */
export async function fetchPublishedFestPage(festId: string, festName?: string): Promise<FestPublicPageData> {
  const cleanId = (festId || 'FEST-01').trim();
  const pageDocId = `${cleanId}_published`;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'fest_public_pages', pageDocId));
      if (snap.exists()) {
        return snap.data() as FestPublicPageData;
      }
    } catch (e) {
      console.warn('[Firestore] fetchPublishedFestPage error:', e);
    }
  }

  // Fallback to localStorage or default
  try {
    const local = localStorage.getItem(`festoria_public_page_${pageDocId}`);
    if (local) {
      return JSON.parse(local) as FestPublicPageData;
    }
  } catch {}

  return getDefaultFestPublicPage(cleanId, festName);
}

/**
 * Fetches the draft fest page for the Fest Admin to edit and preview.
 */
export async function fetchDraftFestPage(festId: string, festName?: string): Promise<FestPublicPageData> {
  const cleanId = (festId || 'FEST-01').trim();
  const draftDocId = `${cleanId}_draft`;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'fest_public_pages', draftDocId));
      if (snap.exists()) {
        return snap.data() as FestPublicPageData;
      }
    } catch (e) {
      console.warn('[Firestore] fetchDraftFestPage error:', e);
    }
  }

  // Fallback to published or default
  const published = await fetchPublishedFestPage(cleanId, festName);
  try {
    const localDraft = localStorage.getItem(`festoria_public_page_${draftDocId}`);
    if (localDraft) {
      return JSON.parse(localDraft) as FestPublicPageData;
    }
  } catch {}

  return { ...published };
}

/**
 * Saves draft changes made by Fest Admin without publishing to public visitors.
 */
export async function saveDraftFestPage(festId: string, pageData: FestPublicPageData): Promise<void> {
  const cleanId = (festId || 'FEST-01').trim();
  const draftDocId = `${cleanId}_draft`;
  const updated: FestPublicPageData = {
    ...pageData,
    festId: cleanId,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'fest_public_pages', draftDocId), updated, { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveDraftFestPage error:', e);
    }
  }

  try {
    localStorage.setItem(`festoria_public_page_${draftDocId}`, JSON.stringify(updated));
  } catch {}
}

/**
 * Publishes draft changes to the live public-facing website.
 */
export async function publishFestPage(festId: string, pageData: FestPublicPageData): Promise<void> {
  const cleanId = (festId || 'FEST-01').trim();
  const draftDocId = `${cleanId}_draft`;
  const publishedDocId = `${cleanId}_published`;
  const nowIso = new Date().toISOString();

  const published: FestPublicPageData = {
    ...pageData,
    festId: cleanId,
    updatedAt: nowIso,
    publishedAt: nowIso,
    version: (pageData.version || 1) + 1
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'fest_public_pages', publishedDocId), published);
      await setDoc(doc(db, 'fest_public_pages', draftDocId), published);
    } catch (e) {
      console.warn('[Firestore] publishFestPage error:', e);
    }
  }

  try {
    localStorage.setItem(`festoria_public_page_${publishedDocId}`, JSON.stringify(published));
    localStorage.setItem(`festoria_public_page_${draftDocId}`, JSON.stringify(published));
  } catch {}
}

// ============================================================================
// SHARE FEST & ROLE-BASED INVITATION SERVICES
// ============================================================================

/**
 * Returns the authoritative deployed production domain for public sharing.
 * Guaranteed to NEVER output localhost or loopback addresses in shared links.
 */
export function getShareableBaseUrl(): string {
  // 1. Explicit configured production domain in env
  const envUrl = (import.meta.env.VITE_PUBLIC_APP_URL || import.meta.env.VITE_DEPLOYED_URL || '').trim();
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Browser window origin if running on a live deployed domain (non-localhost)
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.includes('192.168.') ||
      hostname.includes('10.');

    if (!isLocal && origin.startsWith('http')) {
      return origin.replace(/\/+$/, '');
    }
  }

  // 3. Official Festoria production domain for project festoria-cd375
  return 'https://festoria-cd375.web.app';
}

/**
 * Generates a cryptographically strong unique token.
 */
export function generateInvitationToken(prefix: string = 'tok'): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(20);
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length; i++) {
      rand += chars[buf[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 24; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `${prefix}_${rand}_${Date.now().toString(36)}`;
}

/**
 * Creates a secure role-based invitation record (Judge or Team Leader).
 */
export async function createFestInvitation(data: {
  festId: string;
  role: 'judge' | 'team_leader';
  recipientType: 'phone' | 'email';
  recipientContact: string;
  recipientName?: string;
  assignedJudgeId?: string;
  assignedJudgeName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  expiresInDays?: number;
  createdByAdminId: string;
  createdByAdminName: string;
  notes?: string;
}): Promise<FestInvitation> {
  const festId = (data.festId || 'FEST-01').trim();
  const tokenPrefix = data.role === 'judge' ? 'tok_jd' : 'tok_tl';
  const token = generateInvitationToken(tokenPrefix);
  const invId = `INV-${data.role === 'judge' ? 'JD' : 'TL'}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const days = data.expiresInDays || 7;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  const invitation: FestInvitation = {
    id: invId,
    token,
    festId,
    role: data.role,
    recipientType: data.recipientType,
    recipientContact: data.recipientContact.trim(),
    recipientName: data.recipientName?.trim(),
    assignedJudgeId: data.assignedJudgeId,
    assignedJudgeName: data.assignedJudgeName,
    assignedTeamId: data.assignedTeamId,
    assignedTeamName: data.assignedTeamName,
    expiresAt: expiryDate.toISOString(),
    status: 'pending',
    createdByAdminId: data.createdByAdminId,
    createdByAdminName: data.createdByAdminName,
    createdAt: new Date().toISOString(),
    notes: data.notes?.trim()
  };

  // 1. Save in Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'fest_invitations', invId), invitation);
    } catch (e) {
      console.warn('[Firestore] createFestInvitation error:', e);
    }
  }

  // 2. Persist in LocalStorage for offline resilience & demo mode
  try {
    const key = `festoria_invitations_${festId}`;
    const raw = localStorage.getItem(key);
    const list: FestInvitation[] = raw ? JSON.parse(raw) : [];
    list.unshift(invitation);
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}

  return invitation;
}

/**
 * Fetches all invitations associated with a specific fest.
 */
export async function fetchFestInvitations(festId: string): Promise<FestInvitation[]> {
  const cleanId = (festId || 'FEST-01').trim();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'fest_invitations'), where('festId', '==', cleanId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const items = snap.docs.map((d) => d.data() as FestInvitation);
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (e) {
      console.warn('[Firestore] fetchFestInvitations error:', e);
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(`festoria_invitations_${cleanId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  return [];
}

/**
 * Revokes an unused fest invitation by its ID.
 */
export async function revokeFestInvitation(
  invitationId: string,
  festId: string,
  adminId: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'fest_invitations', invitationId), {
        status: 'revoked',
        revokedAt: nowIso,
        revokedByAdminId: adminId
      });
    } catch (e) {
      console.warn('[Firestore] revokeFestInvitation error:', e);
    }
  }

  // LocalStorage update
  try {
    const key = `festoria_invitations_${festId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: FestInvitation[] = JSON.parse(raw);
      const updated = list.map((inv) =>
        inv.id === invitationId
          ? { ...inv, status: 'revoked' as const, revokedAt: nowIso, revokedByAdminId: adminId }
          : inv
      );
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch {}

  return true;
}

/**
 * Validates an invitation token from the client or server.
 * Returns the invitation object if valid, or throws/returns descriptive error.
 */
export async function validateInvitationToken(token: string): Promise<{
  valid: boolean;
  invitation?: FestInvitation;
  error?: string;
}> {
  if (!token || !token.trim()) {
    return { valid: false, error: 'Invalid or missing invitation token.' };
  }

  const cleanToken = token.trim();
  let foundInv: FestInvitation | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'fest_invitations'), where('token', '==', cleanToken));
      const snap = await getDocs(q);
      if (!snap.empty) {
        foundInv = snap.docs[0].data() as FestInvitation;
      }
    } catch (e) {
      console.warn('[Firestore] validateInvitationToken error:', e);
    }
  }

  // Fallback scan across local storage keys
  if (!foundInv) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('festoria_invitations_')) {
          const list: FestInvitation[] = JSON.parse(localStorage.getItem(key) || '[]');
          const match = list.find((item) => item.token === cleanToken);
          if (match) {
            foundInv = match;
            break;
          }
        }
      }
    } catch {}
  }

  if (!foundInv) {
    return { valid: false, error: 'Invitation not found. Please verify the URL or contact your Fest Admin.' };
  }

  if (foundInv.status === 'revoked') {
    return { valid: false, error: 'This invitation has been revoked by the Fest Admin.' };
  }

  if (foundInv.status === 'accepted') {
    return { valid: false, error: 'This invitation has already been claimed and activated.' };
  }

  if (new Date(foundInv.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: `This invitation expired on ${new Date(foundInv.expiresAt).toLocaleDateString()}. Please request a new invitation.` };
  }

  return { valid: true, invitation: foundInv };
}

/**
 * Authoritatively claims and accepts a validated invitation for an authenticated user.
 * Assigns the user their requested role, festId, and linked team/judge profile.
 */
export async function acceptFestInvitation(
  token: string,
  user: User
): Promise<{
  success: boolean;
  role: 'judge' | 'team_leader';
  festId: string;
  message: string;
  updatedUser?: User;
}> {
  const check = await validateInvitationToken(token);
  if (!check.valid || !check.invitation) {
    return {
      success: false,
      role: 'judge',
      festId: '',
      message: check.error || 'Failed to validate invitation.'
    };
  }

  const inv = check.invitation;
  const nowIso = new Date().toISOString();

  // Create updated user with authoritative role assignment
  const updatedUser: User = {
    ...user,
    role: inv.role,
    festId: inv.festId,
    status: 'active',
    linkedTeamId: inv.role === 'team_leader' ? inv.assignedTeamId : user.linkedTeamId,
    linkedJudgeId: inv.role === 'judge' ? inv.assignedJudgeId : user.linkedJudgeId,
    invitationStatus: 'active'
  };

  // 1. Update in Firestore
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'fest_invitations', inv.id), {
        status: 'accepted',
        acceptedAt: nowIso,
        acceptedByUserId: user.id
      });

      await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
    } catch (e) {
      console.warn('[Firestore] acceptFestInvitation error:', e);
    }
  }

  // 2. Update LocalStorage
  try {
    const key = `festoria_invitations_${inv.festId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: FestInvitation[] = JSON.parse(raw);
      const updated = list.map((item) =>
        item.id === inv.id
          ? { ...item, status: 'accepted' as const, acceptedAt: nowIso, acceptedByUserId: user.id }
          : item
      );
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch {}

  return {
    success: true,
    role: inv.role,
    festId: inv.festId,
    message: `Congratulations! You have successfully accepted the invitation as ${inv.role === 'judge' ? 'Official Judge' : 'Team Leader'} for ${inv.festId}.`,
    updatedUser
  };
}

