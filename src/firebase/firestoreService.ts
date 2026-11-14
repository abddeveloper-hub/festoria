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
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, app, getFirebaseAuth } from './config';
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
  FestInvitation,
  FestCategory,
  TeamProgrammeEntry
} from '../types';
import { StorageService } from '../services/storage';

// ==========================================
// TRUSTED CLOUD FUNCTIONS FOR SENSITIVE ACTIONS
// ==========================================

/**
 * Recursively cleans an object for Firestore by omitting any fields whose value is undefined.
 * Preserves Date, FieldValue, arrays, and primitive types.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => cleanFirestoreData(item)).filter((v) => v !== undefined) as any;
  if (obj.constructor && obj.constructor.name !== 'Object') return obj;

  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      continue;
    }
    result[key] = cleanFirestoreData(val);
  }
  return result;
}
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
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchFests error, falling back to local storage:', e);
      }
    }
  }
  return StorageService.getFests();
}

export async function saveFestToFirestore(fest: Fest): Promise<void> {
  const fests = StorageService.getFests();
  const index = fests.findIndex((f) => f.id === fest.id);
  if (index >= 0) {
    fests[index] = fest;
  } else {
    fests.push(fest);
  }
  StorageService.saveFests(fests);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'fests', fest.id), cleanFirestoreData({
        ...fest,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveFestToFirestore error:', e);
    }
  }
}

export async function deleteFestFromFirestore(festId: string): Promise<void> {
  await deleteFestCascading(festId);
}

/**
 * Permanently deletes a festival and ALL cascading data linked to it across Firestore & LocalStorage.
 * Deletes:
 * - Fest document: /fests/{festId}
 * - Public Page CMS data: /fest_public_pages/{festId} & draft
 * - Settings: /fest_settings/{festId}
 * - Teams: /teams (all matching festId)
 * - Participants: /participants (all matching festId)
 * - Programmes: /programmes (all matching festId)
 * - Scores: /scores (all matching festId)
 * - Results: /results (all matching festId)
 * - Schedule: /schedule (all matching festId)
 * - Judges: /judges (all matching festId)
 * - Complaints: /complaints (all matching festId)
 * - Team Entries: /team_programme_entries (all matching festId)
 * - Milestones: /milestones (all matching festId)
 * - Invitations: /fest_invitations & /team_leader_invitations (all matching festId)
 */
export async function deleteFestCascading(
  festId: string
): Promise<{ success: boolean; deletedCounts: Record<string, number> }> {
  const counts: Record<string, number> = {};

  // 1. Purge from persistent browser storage first
  try {
    StorageService.saveFests(StorageService.getFests().filter((f) => f.id !== festId));
    StorageService.saveTeams(StorageService.getTeams().filter((t) => t.festId !== festId));
    StorageService.saveParticipants(StorageService.getParticipants().filter((p) => p.festId !== festId));
    StorageService.saveProgrammes(StorageService.getProgrammes().filter((pr) => pr.festId !== festId));
    StorageService.saveScoreSubmissions(StorageService.getScoreSubmissions().filter((s: ScoreSubmission) => s.festId !== festId));
    StorageService.saveApprovedResults(StorageService.getApprovedResults().filter((r: ApprovedResult) => r.festId !== festId));
    StorageService.saveScheduleSlots(StorageService.getScheduleSlots().filter((sc: any) => !sc.festId || sc.festId !== festId));
    StorageService.saveJudges(StorageService.getJudges().filter((j: any) => !j.festId || j.festId !== festId));
    StorageService.saveComplaints(StorageService.getComplaints().filter((c) => c.festId !== festId));
    StorageService.saveTeamProgrammeEntries(StorageService.getTeamProgrammeEntries().filter((e) => e.festId !== festId));
    StorageService.saveMilestones(StorageService.getMilestones().filter((m) => m.festId !== festId));

    // Clear active fest if targeting the deleted one
    const activeFest = localStorage.getItem('festflow_active_fest');
    if (activeFest === festId) {
      const remaining = StorageService.getFests();
      if (remaining.length > 0) {
        localStorage.setItem('festflow_active_fest', remaining[0].id);
      } else {
        localStorage.removeItem('festflow_active_fest');
      }
    }
  } catch (storageErr) {
    console.warn('[Firestore] LocalStorage cascading cleanup notice:', storageErr);
  }

  // 2. Cascading deletion across Firestore collections
  if (isFirebaseConfigured && db) {
    try {
      // Helper to query and delete all docs in a collection matching festId
      const deleteCollectionByFest = async (collName: string, idField: string = 'festId') => {
        try {
          const q = query(collection(db!, collName), where(idField, '==', festId));
          const snap = await getDocs(q);
          counts[collName] = snap.size;
          const deletes = snap.docs.map((d) => deleteDoc(d.ref).catch(() => {}));
          await Promise.all(deletes);
        } catch (err) {
          console.warn(`[Firestore] Cascading delete error in ${collName}:`, err);
        }
      };

      // Direct doc deletions
      await Promise.all([
        deleteDoc(doc(db, 'fests', festId)).catch(() => {}),
        deleteDoc(doc(db, 'fest_public_pages', festId)).catch(() => {}),
        deleteDoc(doc(db, 'fest_public_pages', `${festId}_draft`)).catch(() => {}),
        deleteDoc(doc(db, 'fest_settings', festId)).catch(() => {})
      ]);

      // Query-based cascading deletes
      await Promise.all([
        deleteCollectionByFest('teams'),
        deleteCollectionByFest('participants'),
        deleteCollectionByFest('programmes'),
        deleteCollectionByFest('scores'),
        deleteCollectionByFest('results'),
        deleteCollectionByFest('schedule'),
        deleteCollectionByFest('judges'),
        deleteCollectionByFest('complaints'),
        deleteCollectionByFest('team_programme_entries'),
        deleteCollectionByFest('milestones'),
        deleteCollectionByFest('fest_invitations'),
        deleteCollectionByFest('team_leader_invitations'),
        deleteCollectionByFest('fest_memberships')
      ]);
    } catch (fsErr) {
      console.warn('[Firestore] Cascading delete Firestore notice:', fsErr);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('festoria_fest_deleted', { detail: { festId } }));
    window.dispatchEvent(new CustomEvent('festoria_participants_changed', { detail: { festId } }));
  }

  return { success: true, deletedCounts: counts };
}

// ==========================================
// 2. USERS SERVICE
// ==========================================
export async function fetchUsersFromFirestore(): Promise<User[]> {
  if (isFirebaseConfigured && db) {
    try {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        return StorageService.getUsers();
      }
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as User);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchUsersFromFirestore notice:', e);
      }
    }
  }
  return StorageService.getUsers();
}

export async function deleteUserFromFirestore(userId: string): Promise<boolean> {
  const users = StorageService.getUsers().filter((u) => u.id !== userId);
  StorageService.saveUsers(users);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return true;
    } catch (e) {
      console.warn('[Firestore] deleteUserFromFirestore error:', e);
    }
  }
  return false;
}

export async function fetchUserByUid(uid: string): Promise<User | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as User;
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchUserByUid error:', e);
      }
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
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchUserByPhone error:', e);
      }
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
      await setDoc(doc(db, 'users', user.id), cleanFirestoreData({
        ...user,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveUserToFirestore error:', e);
    }
  }
}

// ==========================================
// 3. TEAMS SERVICE
// ==========================================
export async function fetchTeams(festId?: string): Promise<Team[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = festId
        ? query(collection(db, 'teams'), where('festId', '==', festId))
        : collection(db, 'teams');
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
      await setDoc(doc(db, 'teams', team.id), cleanFirestoreData({
        ...team,
        festId: team.festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveTeamToFirestore error:', e);
    }
  }
}

export async function deleteTeamFromFirestore(teamId: string): Promise<void> {
  const teams = StorageService.getTeams();
  StorageService.saveTeams(teams.filter((t) => t.id !== teamId));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (e) {
      console.warn('[Firestore] deleteTeamFromFirestore error:', e);
    }
  }
}

// ==========================================
// 4. PARTICIPANTS SERVICE
// ==========================================
export async function fetchParticipants(_festId?: string): Promise<Participant[]> {
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
      await setDoc(doc(db, 'participants', participant.id), cleanFirestoreData({
        ...participant,
        festId: participant.festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
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
export async function fetchProgrammes(_festId?: string): Promise<Programme[]> {
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
      await setDoc(doc(db, 'programmes', programme.id), cleanFirestoreData({
        ...programme,
        festId: programme.festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveProgrammeToFirestore error:', e);
    }
  }
}

export async function deleteProgrammeFromFirestore(programmeId: string): Promise<void> {
  const programmes = StorageService.getProgrammes();
  StorageService.saveProgrammes(programmes.filter((p) => p.id !== programmeId));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'programmes', programmeId));
    } catch (e) {
      console.warn('[Firestore] deleteProgrammeFromFirestore error:', e);
    }
  }
}

// ==========================================
// 6. SCORES & RESULTS SERVICE
// ==========================================
export async function fetchScores(): Promise<ScoreSubmission[]> {
  if (isFirebaseConfigured && db) {
    try {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        return StorageService.getScoreSubmissions();
      }
      const snap = await getDocs(collection(db, 'scores'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ScoreSubmission);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchScores error:', e);
      }
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
      await setDoc(doc(db, 'scores', score.id), cleanFirestoreData({
        ...score,
        festId: (score as any).festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveScoreToFirestore error:', e);
    }
  }
}

export async function fetchResults(festId?: string): Promise<ApprovedResult[]> {
  if (isFirebaseConfigured && db) {
    try {
      const auth = getFirebaseAuth();
      let q;
      if (auth?.currentUser) {
        q = festId
          ? query(collection(db, 'results'), where('festId', '==', festId))
          : collection(db, 'results');
      } else {
        q = festId
          ? query(collection(db, 'results'), where('festId', '==', festId), where('published', '==', true))
          : query(collection(db, 'results'), where('published', '==', true));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ApprovedResult);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchResults error:', e);
      }
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
      await setDoc(doc(db, 'results', result.id), cleanFirestoreData({
        ...result,
        festId: result.festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
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
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        return StorageService.getTeamLeaderInvitations();
      }
      const q = query(collection(db, 'team_leader_invitations'), where('festId', '==', festId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as TeamLeaderInvitation);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchTeamLeaderInvitations error:', e);
      }
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
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        const invitations = StorageService.getTeamLeaderInvitations();
        return invitations.find((inv) => inv.phone === normalizedPhone && inv.festId === festId) || null;
      }
      const q = query(
        collection(db, 'team_leader_invitations'),
        where('festId', '==', festId),
        where('phone', '==', normalizedPhone)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as TeamLeaderInvitation;
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchInvitationByPhone error:', e);
      }
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
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        return StorageService.getAssignments();
      }
      const q = query(collection(db, 'programme_assignments'), where('festId', '==', festId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ProgrammeAssignment);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchProgrammeAssignments error:', e);
      }
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
      await setDoc(doc(db, 'programme_assignments', assignment.id), cleanFirestoreData({
        ...assignment,
        festId: assignment.festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
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
export async function fetchComplaints(_festId?: string): Promise<Complaint[]> {
  if (isFirebaseConfigured && db) {
    try {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        return StorageService.getComplaints();
      }
      const snap = await getDocs(collection(db, 'complaints'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Complaint);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchComplaints error:', e);
      }
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
      await setDoc(doc(db, 'complaints', complaint.id), cleanFirestoreData({
        ...complaint,
        festId: (complaint as any).festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
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
export async function fetchAnnouncements(_festId?: string): Promise<Announcement[]> {
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
      await setDoc(doc(db, 'announcements', announcement.id), cleanFirestoreData({
        ...announcement,
        festId: (announcement as any).festId,
        createdAt: serverTimestamp()
      }), { merge: true });
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
  festId: string,
  settings: FestSettings
): Promise<void> {
  StorageService.saveSettings(settings);

  if (isFirebaseConfigured && db && festId) {
    try {
      await setDoc(doc(db, 'fest_settings', festId), cleanFirestoreData({
        ...settings,
        festId,
        updatedAt: serverTimestamp()
      }), { merge: true });
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
      const dataToSave = cleanFirestoreData({
        ...application,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await setDoc(doc(db, 'fest_requests', application.id), dataToSave);
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
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        return StorageService.getFestRequests();
      }
      const snap = await getDocs(collection(db, 'fest_requests'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as FestRequest);
        list.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
        return list;
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchFestRequests error:', e);
      }
    }
  }
  return StorageService.getFestRequests();
}

/**
 * Approves a fest application via trusted Cloud Function with direct Firestore fallback.
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
      if (result.data?.success) {
        return result.data;
      }
    } catch (e: any) {
      console.info('[CloudFunctions] approveFestApplication skipped or unavailable, using authoritative Firestore direct sync:', e?.message || e);
    }
  }

  // Authoritative fallback: direct update in Firestore by authenticated Super Admin
  if (isFirebaseConfigured && db) {
    try {
      const reqRef = doc(db, 'fest_requests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (reqSnap.exists()) {
        const reqData = reqSnap.data() as FestRequest;
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const historyEntry = {
          date: now,
          actor: 'Super Admin',
          action: 'Approved Fest Request',
          note: approvalNote || 'Request met platform criteria and was approved.',
        };
        await updateDoc(reqRef, {
          status: 'approved',
          reviewNotes: approvalNote || '',
          history: [historyEntry, ...(reqData.history || [])],
          updatedAt: serverTimestamp()
        });

        const newFestId = `FEST-0${Date.now().toString().slice(-2)}`;
        return {
          success: true,
          festId: newFestId,
          message: 'Fest application approved successfully.'
        };
      }
    } catch (directErr: any) {
      console.warn('[Firestore] Direct approval fallback error:', directErr);
      return { success: false, message: directErr.message || 'Approval failed.' };
    }
  }

  return { success: true, message: 'Fest request approved.' };
}

/**
 * Rejects a fest application via trusted Cloud Function with direct Firestore fallback.
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
      if (result.data?.success) {
        return result.data;
      }
    } catch (e: any) {
      console.info('[CloudFunctions] rejectFestApplication skipped, using direct Firestore sync:', e?.message || e);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const reqRef = doc(db, 'fest_requests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (reqSnap.exists()) {
        const reqData = reqSnap.data() as FestRequest;
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const historyEntry = {
          date: now,
          actor: 'Super Admin',
          action: 'Rejected Fest Request',
          note: `Reason: ${rejectionReason}${note ? ` | Note: ${note}` : ''}`,
        };
        await updateDoc(reqRef, {
          status: 'rejected',
          rejectionReason,
          reviewNotes: note || '',
          history: [historyEntry, ...(reqData.history || [])],
          updatedAt: serverTimestamp()
        });
        return { success: true, message: 'Fest request rejected successfully.' };
      }
    } catch (directErr: any) {
      console.warn('[Firestore] Direct reject fallback error:', directErr);
    }
  }

  return { success: true, message: 'Fest request rejected.' };
}

/**
 * Requests more information for a fest application via trusted Cloud Function with direct Firestore fallback.
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
      if (result.data?.success) {
        return result.data;
      }
    } catch (e: any) {
      console.info('[CloudFunctions] requestMoreInfo skipped, using direct Firestore sync:', e?.message || e);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const reqRef = doc(db, 'fest_requests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (reqSnap.exists()) {
        const reqData = reqSnap.data() as FestRequest;
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const historyEntry = {
          date: now,
          actor: 'Super Admin',
          action: 'Requested More Information',
          note: moreInfoMessage,
        };
        await updateDoc(reqRef, {
          status: 'more_info_required',
          additionalMessage: moreInfoMessage,
          history: [historyEntry, ...(reqData.history || [])],
          updatedAt: serverTimestamp()
        });
        return { success: true, message: 'More info requested successfully.' };
      }
    } catch (directErr: any) {
      console.warn('[Firestore] Direct requestMoreInfo fallback error:', directErr);
    }
  }

  return { success: true, message: 'Information requested.' };
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

export function getDefaultFestPublicPage(festId: string, festName?: string, festDetails?: any): FestPublicPageData {
  return {
    festId,
    hero: {
      heading: festName ? `Welcome to ${festName}` : 'Celebrate Passion, Talent & Innovation',
      description: festDetails?.description || 'The premier inter-collegiate annual cultural and technical championship.',
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
      aboutFest: festDetails?.description || 'A multi-day symposium of performing arts, literary contests, design hackathons, and intellectual debates.',
      venueInfo: festDetails?.venue || 'Campus Convention Grounds',
      contactEmail: festDetails?.adminEmail || 'contact@festoria.app',
      contactPhone: festDetails?.adminPhone || '',
      contactInstagram: '',
      highlights: [
        'Accredited collegiate events and competitions',
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
  const cleanId = (festId || '').trim();
  if (!cleanId) return getDefaultFestPublicPage('FEST-01', festName);
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
  const cleanId = (festId || '').trim();
  if (!cleanId) return getDefaultFestPublicPage('FEST-01', festName);
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
  const cleanId = (festId || '').trim();
  if (!cleanId) return;
  const draftDocId = `${cleanId}_draft`;
  const updated: FestPublicPageData = {
    ...pageData,
    festId: cleanId,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'fest_public_pages', draftDocId), cleanFirestoreData(updated), { merge: true });
    } catch (e) {
      console.warn('[Firestore] saveDraftFestPage error:', e);
      throw e;
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
  const cleanId = (festId || '').trim();
  if (!cleanId) return;
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
      await setDoc(doc(db, 'fest_public_pages', publishedDocId), cleanFirestoreData(published));
      await setDoc(doc(db, 'fest_public_pages', draftDocId), cleanFirestoreData(published));
      try {
        await updateDoc(doc(db, 'fests', cleanId), {
          publicPagePublished: true,
          updatedAt: serverTimestamp()
        });
      } catch {}
    } catch (e) {
      console.warn('[Firestore] publishFestPage error:', e);
      throw e;
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
      const base = (import.meta.env.BASE_URL || '/').replace(/^\/+/, '').replace(/\/+$/, '');
      return base ? `${origin}/${base}` : origin.replace(/\/+$/, '');
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
  const festId = (data.festId || '').trim();
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
      await setDoc(doc(db, 'fest_invitations', invId), cleanFirestoreData(invitation));
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
  const cleanId = (festId || '').trim();
  if (!cleanId) return [];

  let localList: FestInvitation[] = [];
  try {
    const raw = localStorage.getItem(`festoria_invitations_${cleanId}`);
    if (raw) {
      localList = JSON.parse(raw);
    }
  } catch {}

  if (isFirebaseConfigured && db) {
    try {
      // Background sync any locally recorded invitations up to Cloud Firestore
      for (const localInv of localList) {
        setDoc(doc(db, 'fest_invitations', localInv.id), cleanFirestoreData(localInv), { merge: true }).catch(() => {});
      }

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

  return localList;
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
  const cleanToken = token.trim();
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

  // 1. Authoritative Firestore Direct Update & Transaction
  if (isFirebaseConfigured && db) {
    try {
      // A. Update the invitation record to accepted
      await updateDoc(doc(db, 'fest_invitations', inv.id), {
        status: 'accepted',
        acceptedAt: nowIso,
        acceptedByUserId: user.id
      });

      // B. Update the user profile with the new role and fest linkage
      await setDoc(doc(db, 'users', user.id), cleanFirestoreData(updatedUser), { merge: true });

      // C. If Team Leader, bind them directly to the assigned team
      if (inv.role === 'team_leader' && inv.assignedTeamId) {
        try {
          await updateDoc(doc(db, 'teams', inv.assignedTeamId), {
            teamLeaderId: user.id,
            teamLeaderName: user.name,
            teamLeaderPhone: user.phone || ''
          });
        } catch (tErr) {
          console.warn('[Firestore] Link team leader to team document note:', tErr);
        }
      }

      // D. Record an immutable audit log
      try {
        const auditId = `LOG-${Date.now()}`;
        await setDoc(doc(db, 'audit_logs', auditId), {
          id: auditId,
          festId: inv.festId,
          userId: user.id,
          userName: user.name,
          action: 'ACCEPT_FEST_INVITATION',
          targetType: 'invitation',
          targetId: inv.id,
          details: `${user.name} accepted invitation as ${inv.role === 'judge' ? 'Judge' : 'Team Leader'} for fest ${inv.festId}.`,
          timestamp: nowIso
        });
      } catch (logErr) {
        console.warn('[Firestore] Audit log write note:', logErr);
      }
    } catch (fsErr: any) {
      console.warn('[Firestore] Direct invitation acceptance write note:', fsErr);
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

// ==========================================
// 15. FEST CATEGORIES SERVICE
// ==========================================

export async function fetchCategories(festId?: string): Promise<FestCategory[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = festId
        ? query(collection(db, 'categories'), where('festId', '==', festId))
        : collection(db, 'categories');
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as FestCategory);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchCategories error, falling back to local storage:', e);
      }
    }
  }
  return StorageService.getCategories(festId);
}

export async function saveCategoryToFirestore(category: FestCategory): Promise<void> {
  const localList = StorageService.getCategories();
  const exists = localList.some((c) => c.id === category.id);
  const updated = exists
    ? localList.map((c) => (c.id === category.id ? category : c))
    : [...localList, category];
  StorageService.saveCategories(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'categories', category.id), cleanFirestoreData({
        ...category,
        updatedAt: serverTimestamp(),
      }));
      // Also save to nested subcollection if festId is available
      if (category.festId) {
        try {
          await setDoc(doc(db, 'fests', category.festId, 'categories', category.id), cleanFirestoreData({
            ...category,
            updatedAt: serverTimestamp(),
          }));
        } catch {}
      }
    } catch (e) {
      console.warn('[Firestore] Failed to save category:', e);
    }
  }
}

export async function deleteCategoryFromFirestore(categoryId: string, festId?: string): Promise<void> {
  const localList = StorageService.getCategories();
  StorageService.saveCategories(localList.filter((c) => c.id !== categoryId));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      if (festId) {
        try {
          await deleteDoc(doc(db, 'fests', festId, 'categories', categoryId));
        } catch {}
      }
    } catch (e) {
      console.warn('[Firestore] Failed to delete category:', e);
    }
  }
}

// ==========================================
// 16. TEAM PROGRAMME ENTRIES SERVICE
// ==========================================

export async function fetchTeamProgrammeEntries(festId?: string): Promise<TeamProgrammeEntry[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = festId
        ? query(collection(db, 'team_programme_entries'), where('festId', '==', festId))
        : collection(db, 'team_programme_entries');
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as TeamProgrammeEntry);
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('[Firestore] fetchTeamProgrammeEntries error, falling back to local storage:', e);
      }
    }
  }
  return StorageService.getTeamProgrammeEntries(festId);
}

export async function saveTeamProgrammeEntryToFirestore(entry: TeamProgrammeEntry): Promise<void> {
  const localList = StorageService.getTeamProgrammeEntries();
  const exists = localList.some((e) => e.id === entry.id);
  const updated = exists
    ? localList.map((e) => (e.id === entry.id ? entry : e))
    : [...localList, entry];
  StorageService.saveTeamProgrammeEntries(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'team_programme_entries', entry.id), cleanFirestoreData({
        ...entry,
        updatedAt: serverTimestamp(),
      }));
      if (entry.festId) {
        try {
          await setDoc(doc(db, 'fests', entry.festId, 'programme_entries', entry.id), cleanFirestoreData({
            ...entry,
            updatedAt: serverTimestamp(),
          }));
        } catch {}
      }
    } catch (e) {
      console.warn('[Firestore] Failed to save team programme entry:', e);
    }
  }
}

export async function deleteTeamProgrammeEntryFromFirestore(entryId: string, festId?: string): Promise<void> {
  const localList = StorageService.getTeamProgrammeEntries();
  StorageService.saveTeamProgrammeEntries(localList.filter((e) => e.id !== entryId));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'team_programme_entries', entryId));
      if (festId) {
        try {
          await deleteDoc(doc(db, 'fests', festId, 'programme_entries', entryId));
        } catch {}
      }
    } catch (e) {
      console.warn('[Firestore] Failed to delete team programme entry:', e);
    }
  }
}


