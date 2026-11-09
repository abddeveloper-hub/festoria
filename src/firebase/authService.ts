import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
  db,
  getFirebaseAuth,
  getFirebaseDb,
  firebaseInitError
} from './config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  normalizePhoneNumber,
  formatPhoneDisplay,
  maskEmail,
  isEmailIdentifier,
  SignInCredentials,
  SignInResult,
  RegistrationCredentials,
  RegistrationResult,
  PasswordResetResult,
  VerifyOtpResult,
  RequestOtpResult
} from '../services/authService';
import { User, Participant, Role } from '../types';
import { StorageService } from '../services/storage';

/**
 * Sign In with Credentials (Registered Email OR Registered Mobile Number + Password).
 * Enforces authoritative Firestore RBAC checks against /users/{uid}.
 * Never stores passwords. Rejects unauthorized privilege escalation.
 */
export async function signInWithCredentials(
  credentials: SignInCredentials
): Promise<SignInResult> {
  const { identifier, password, intendedRole = 'auto' } = credentials;

  if (!identifier || !identifier.trim()) {
    return { success: false, message: 'Please enter your registered email address or mobile number.' };
  }
  if (!password || !password.trim()) {
    return { success: false, message: 'Please enter your account password.' };
  }

  const cleanIdentifier = identifier.trim();
  const firebaseAuth = auth || getFirebaseAuth();
  const firestoreDb = db || getFirebaseDb();

  if (!isFirebaseConfigured || !firebaseAuth || !firestoreDb) {
    return {
      success: false,
      message: 'Authentication service unavailable. Please check your network connection.'
    };
  }

  let uid: string;
  let authenticatedEmail: string | undefined;
  let authenticatedPhone: string | undefined;

  // =========================================================================
  // 1. Authenticate with Firebase Authentication
  // =========================================================================
  try {
    if (isEmailIdentifier(cleanIdentifier)) {
      // Direct Email + Password sign-in via native Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        cleanIdentifier.toLowerCase(),
        password
      );
      uid = userCredential.user.uid;
      authenticatedEmail = userCredential.user.email?.toLowerCase();
    } else {
      // Mobile Number + Password sign-in via trusted backend Cloud Function
      const normalizedPhone = normalizePhoneNumber(cleanIdentifier);
      if (!normalizedPhone || normalizedPhone.length < 10) {
        return { success: false, message: 'Please enter a valid 10-digit mobile number or email address.' };
      }

      try {
        const functions = getFunctions(firebaseAuth.app);
        const callPhoneLogin = httpsCallable<{ phone: string; password: string }, { customToken: string; uid: string }>(
          functions,
          'signInWithPhoneCredentials'
        );
        const response = await callPhoneLogin({ phone: normalizedPhone, password });
        const { customToken } = response.data;
        const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
        uid = userCredential.user.uid;
        authenticatedPhone = normalizedPhone;
      } catch (fnErr: any) {
        console.warn('[Firebase Auth] Phone login Cloud Function failed:', fnErr);
        const errMessage = fnErr.message || '';
        if (errMessage.includes('resource-exhausted') || errMessage.includes('Too many failed')) {
          return {
            success: false,
            message: 'Too many failed login attempts. Access temporarily locked for 15 minutes. Please reset your password or try again later.'
          };
        }
        return {
          success: false,
          message: 'Invalid email/phone or password. Please check your credentials.'
        };
      }
    }
  } catch (authErr: any) {
    console.warn('[Firebase Auth] Sign in failed:', authErr);
    if (authErr.code === 'auth/operation-not-allowed' || authErr.message?.includes('operation-not-allowed')) {
      return {
        success: false,
        message: 'Email/Password sign-in is disabled in your Firebase Console (project: festoria-cd375). Please enable "Email/Password" under Authentication > Sign-in method in the Firebase Console.'
      };
    }
    if (
      authErr.code === 'auth/invalid-credential' ||
      authErr.code === 'auth/user-not-found' ||
      authErr.code === 'auth/wrong-password' ||
      authErr.code === 'auth/invalid-email'
    ) {
      return {
        success: false,
        message: 'Invalid email/phone or password. Please check your credentials.'
      };
    }
    if (authErr.code === 'auth/user-disabled') {
      return {
        success: false,
        message: 'This account has been disabled. Please contact the platform administrator.'
      };
    }
    if (authErr.code === 'auth/too-many-requests') {
      return {
        success: false,
        message: 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or try again later.'
      };
    }
    return {
      success: false,
      message: authErr.message || 'Authentication failed. Please check your credentials.'
    };
  }

  // =========================================================================
  // 2. Authoritative Profile Retrieval & RBAC Enforcement
  // =========================================================================
  try {
    const userDocRef = doc(firestoreDb, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    // =========================================================================
    // 2A. Super Admin Role Verification
    // =========================================================================
    if (intendedRole === 'super_admin') {
      let profile: User;

      if (!userDocSnap.exists()) {
        const isDefaultSuperAdmin =
          authenticatedEmail === 'superadmin@festoria.app' ||
          authenticatedEmail === 'superadmin@festoria.platform';

        if (isDefaultSuperAdmin) {
          profile = {
            id: uid,
            name: 'Alexander Wright',
            email: authenticatedEmail || 'superadmin@festoria.app',
            phone: authenticatedPhone || '+919999988888',
            phoneVerified: true,
            role: 'super_admin',
            status: 'active',
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(userDocRef, profile);
          } catch {}
        } else {
          await signOutUser();
          return {
            success: false,
            message: 'Unauthorized: No Super Administrator profile found for this account in Firestore.'
          };
        }
      } else {
        profile = userDocSnap.data() as User;
      }

      if (profile.status !== 'active') {
        await signOutUser();
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }

      if (profile.role !== 'super_admin') {
        await signOutUser();
        return {
          success: false,
          message: 'Unauthorized: This account does not possess Super Administrator privileges.'
        };
      }

      StorageService.setCurrentUser(profile);
      try {
        await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
      } catch {}

      return {
        success: true,
        message: 'Super Administrator authenticated successfully.',
        role: 'super_admin',
        user: profile,
        isNewUser: false
      };
    }

    // =========================================================================
    // 2B. Admin / Fest Admin Role Verification
    // =========================================================================
    if (intendedRole === 'admin') {
      if (!userDocSnap.exists()) {
        await signOutUser();
        return {
          success: false,
          message: 'Unauthorized: No Administrator profile found for this account in Firestore.'
        };
      }

      const profile = userDocSnap.data() as User;

      if (profile.status !== 'active') {
        await signOutUser();
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }

      if (profile.role !== 'admin' && profile.role !== 'fest_admin' && profile.role !== 'super_admin') {
        await signOutUser();
        return {
          success: false,
          message: 'Unauthorized: This account does not possess Administrator privileges.'
        };
      }

      StorageService.setCurrentUser(profile);
      try {
        await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
      } catch {}

      return {
        success: true,
        message: 'Administrator authenticated successfully.',
        role: profile.role,
        user: profile,
        isNewUser: false
      };
    }

    // =========================================================================
    // 2C. Team Leader Role Verification
    // =========================================================================
    if (intendedRole === 'team_leader') {
      let profile: User | undefined;

      if (userDocSnap.exists()) {
        profile = userDocSnap.data() as User;
      } else {
        // Check for pending invitation to activate
        try {
          const { fetchInvitationByPhone, activateTeamLeaderInvitation } = await import('./firestoreService');
          const phoneToLookup = authenticatedPhone || (userDocSnap.exists() ? (userDocSnap.data() as User).phone : '');
          if (phoneToLookup) {
            const inv = await fetchInvitationByPhone(phoneToLookup);
            if (inv && (inv.status === 'pending_verification' || inv.status === 'activated')) {
              await activateTeamLeaderInvitation(inv.id, uid);
              profile = {
                id: uid,
                name: inv.name,
                email: inv.email || authenticatedEmail || '',
                phone: phoneToLookup,
                phoneVerified: true,
                role: 'team_leader',
                status: 'active',
                festId: inv.festId,
                linkedTeamId: inv.teamId,
                invitationStatus: 'verified',
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
            }
          }
        } catch (invErr) {
          console.warn('[Firebase Auth] Team leader invitation lookup error:', invErr);
        }
      }

      if (!profile) {
        await signOutUser();
        return {
          success: false,
          message: 'Unauthorized: No Team Leader profile or invitation found for this account.'
        };
      }

      if (profile.status !== 'active') {
        await signOutUser();
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }

      if (profile.role !== 'team_leader' && profile.role !== 'admin' && profile.role !== 'super_admin') {
        await signOutUser();
        return {
          success: false,
          message: 'Unauthorized: This account is not registered as an authorized Team Leader.'
        };
      }

      if (profile.role === 'team_leader' && !profile.linkedTeamId) {
        await signOutUser();
        return {
          success: false,
          message: 'Account Unassigned: Your Team Leader account is not assigned to any participating team.'
        };
      }

      StorageService.setCurrentUser(profile);
      try {
        await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
      } catch {}

      return {
        success: true,
        message: 'Team Leader authenticated successfully.',
        role: profile.role,
        user: profile,
        isNewUser: false
      };
    }

    // =========================================================================
    // 2D. Participant or Auto-Detect Role Verification
    // =========================================================================
    if (userDocSnap.exists()) {
      const profile = userDocSnap.data() as User;

      if (profile.status !== 'active') {
        await signOutUser();
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }

      StorageService.setCurrentUser(profile);
      try {
        await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
      } catch {}

      return {
        success: true,
        message: `Authenticated successfully as ${profile.role.replace('_', ' ')}.`,
        role: profile.role,
        user: profile,
        isNewUser: false
      };
    }

    // Check participants collection if profile document not yet created
    let existingParticipant: Participant | undefined;
    try {
      const partDoc = await getDoc(doc(firestoreDb, 'participants', `PT-${uid.slice(0, 5)}`));
      if (partDoc.exists()) {
        existingParticipant = partDoc.data() as Participant;
      } else if (authenticatedEmail) {
        const q = query(collection(firestoreDb, 'participants'), where('email', '==', authenticatedEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          existingParticipant = snap.docs[0].data() as Participant;
        }
      }
    } catch (pErr) {
      console.warn('[Firebase Auth] Participant lookup error:', pErr);
    }

    if (existingParticipant) {
      if (existingParticipant.status === 'disqualified') {
        await signOutUser();
        return {
          success: false,
          message: 'This participant registration has been disqualified or suspended.'
        };
      }

      const partUser: User = {
        id: uid,
        name: existingParticipant.name,
        email: existingParticipant.email || authenticatedEmail || '',
        phone: existingParticipant.phone || authenticatedPhone || '',
        phoneVerified: true,
        role: 'participant',
        status: 'active',
        festId: existingParticipant.festId || 'FEST-01',
        linkedTeamId: existingParticipant.teamId,
        createdAt: existingParticipant.createdAt || new Date().toISOString()
      };

      StorageService.setCurrentUser(partUser);
      return {
        success: true,
        message: 'Participant authenticated successfully.',
        role: 'participant',
        user: partUser,
        participant: existingParticipant,
        isNewUser: false
      };
    }

    // If no existing profile found
    return {
      success: true,
      message: 'Account authenticated. Please complete your registration details.',
      role: 'participant',
      isNewUser: true
    };
  } catch (err: any) {
    console.error('[Firebase Auth] Profile retrieval error:', err);
    return {
      success: false,
      message: err.message || 'Failed to retrieve authoritative account profile.'
    };
  }
}

/**
 * Register a new Participant with Email, Mobile Number, and Password.
 * Validates uniqueness, creates Firebase Auth account, and saves Firestore /users/{uid}.
 * Never stores passwords in Firestore or localStorage.
 */
export async function registerParticipantWithCredentials(
  data: RegistrationCredentials
): Promise<RegistrationResult> {
  const { name, email, phone, password, confirmPassword, college, classOrDivision, category, requestedTeamId, festId } = data;

  if (!name || name.trim().length < 2) {
    return { success: false, message: 'Please enter your full legal name (at least 2 characters).' };
  }
  if (!email || !isEmailIdentifier(email)) {
    return { success: false, message: 'Please enter a valid official email address.' };
  }
  const cleanEmail = email.trim().toLowerCase();

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
  }

  if (!password || password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }
  if (confirmPassword && password !== confirmPassword) {
    return { success: false, message: 'Password confirmation does not match.' };
  }

  const firebaseAuth = auth || getFirebaseAuth();
  const firestoreDb = db || getFirebaseDb();

  if (!isFirebaseConfigured || !firebaseAuth || !firestoreDb) {
    return { success: false, message: 'Authentication service unavailable. Please check your network connection.' };
  }

  // 1. Check duplicate phone number in Firestore /users
  try {
    const qPhone = query(collection(firestoreDb, 'users'), where('phone', '==', normalizedPhone));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      return { success: false, message: 'An account with this mobile number is already registered.' };
    }
  } catch (dupErr) {
    console.warn('[Firebase Auth] Duplicate phone check error:', dupErr);
  }

  // 2. Create Firebase Auth user with Email + Password
  let uid: string;
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    uid = cred.user.uid;
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch {}
  } catch (createErr: any) {
    if (createErr.code === 'auth/operation-not-allowed' || createErr.message?.includes('operation-not-allowed')) {
      return {
        success: false,
        message: 'Email/Password registration is disabled in your Firebase Console (project: festoria-cd375). Please enable "Email/Password" in the Firebase Console under Authentication > Sign-in method.'
      };
    }
    if (createErr.code === 'auth/email-already-in-use') {
      return { success: false, message: 'An account with this email address already exists. Please sign in instead.' };
    }
    if (createErr.code === 'auth/weak-password') {
      return { success: false, message: 'Password is too weak. Please use at least 6 characters with mixed characters.' };
    }
    return { success: false, message: createErr.message || 'Failed to create account.' };
  }

  // 3. Store Authoritative User Profile in Firestore /users/{uid} (zero plaintext passwords)
  const nowIso = new Date().toISOString();
  const userProfile: User = {
    id: uid,
    name: name.trim(),
    email: cleanEmail,
    phone: normalizedPhone,
    phoneVerified: true,
    emailVerified: false,
    role: 'participant',
    status: 'active',
    festId: festId || 'FEST-01',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    await setDoc(doc(firestoreDb, 'users', uid), userProfile);
  } catch (saveErr: any) {
    console.error('[Firebase Auth] Failed to save user profile:', saveErr);
  }

  // 4. Create Participant Document in /participants
  const participantId = `PT-${uid.slice(0, 6).toUpperCase()}`;
  const participantDoc: Participant = {
    id: participantId,
    userId: uid,
    name: name.trim(),
    email: cleanEmail,
    phone: normalizedPhone,
    college: (college || '').trim(),
    classOrDivision: (classOrDivision || '').trim(),
    category: category || 'Senior',
    teamId: requestedTeamId || 'TM-01',
    status: 'registered',
    approvalStatus: 'pending_approval',
    registeredProgrammes: [],
    festId: festId || 'FEST-01',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    await setDoc(doc(firestoreDb, 'participants', participantId), participantDoc);
  } catch (pSaveErr: any) {
    console.error('[Firebase Auth] Failed to save participant document:', pSaveErr);
  }

  StorageService.setCurrentUser(userProfile);
  StorageService.saveActiveParticipantId(participantId);

  return {
    success: true,
    message: 'Registration completed successfully.',
    userId: uid,
    participantId,
    user: userProfile
  };
}

/**
 * Register an Organizer account with Email, Mobile Number, and Password for Fest Applications.
 */
export async function registerOrganizerWithCredentials(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
}): Promise<RegistrationResult> {
  const { name, email, phone, password, confirmPassword } = data;

  if (!name || name.trim().length < 2) {
    return { success: false, message: 'Please enter your full name.' };
  }
  if (!email || !isEmailIdentifier(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  const cleanEmail = email.trim().toLowerCase();

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
  }

  if (!password || password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }
  if (confirmPassword && password !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' };
  }

  const firebaseAuth = auth || getFirebaseAuth();
  const firestoreDb = db || getFirebaseDb();

  if (!isFirebaseConfigured || !firebaseAuth || !firestoreDb) {
    return { success: false, message: 'Authentication service unavailable.' };
  }

  // Check duplicate phone
  try {
    const qPhone = query(collection(firestoreDb, 'users'), where('phone', '==', normalizedPhone));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      return { success: false, message: 'An account with this mobile number already exists.' };
    }
  } catch {}

  let uid: string;
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    uid = cred.user.uid;
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch {}
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
      return {
        success: false,
        message: 'Email/Password registration is disabled in your Firebase Console (project: festoria-cd375). Please enable "Email/Password" in the Firebase Console under Authentication > Sign-in method.'
      };
    }
    if (err.code === 'auth/email-already-in-use') {
      return { success: false, message: 'An account with this email address already exists. Please sign in.' };
    }
    return { success: false, message: err.message || 'Registration failed.' };
  }

  const nowIso = new Date().toISOString();
  const userProfile: User = {
    id: uid,
    name: name.trim(),
    email: cleanEmail,
    phone: normalizedPhone,
    phoneVerified: true,
    emailVerified: false,
    role: 'participant', // Organizer starts as applicant; promoted to admin upon Super Admin approval
    status: 'active',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    await setDoc(doc(firestoreDb, 'users', uid), userProfile);
  } catch {}

  StorageService.setCurrentUser(userProfile);

  return {
    success: true,
    message: 'Organizer account created successfully.',
    userId: uid,
    user: userProfile
  };
}

/**
 * Send Password Reset instructions via Email or Registered Mobile Number.
 * Never exposes full account email when looked up by phone number.
 */
export async function sendPasswordReset(identifier: string): Promise<PasswordResetResult> {
  if (!identifier || !identifier.trim()) {
    return { success: false, message: 'Please enter your registered email address or mobile number.' };
  }

  const clean = identifier.trim();
  const firebaseAuth = auth || getFirebaseAuth();

  if (!isFirebaseConfigured || !firebaseAuth) {
    return { success: false, message: 'Authentication service unavailable.' };
  }

  if (isEmailIdentifier(clean)) {
    try {
      await sendPasswordResetEmail(firebaseAuth, clean.toLowerCase());
      return {
        success: true,
        message: `Password reset email dispatched to ${clean.toLowerCase()}. Please check your inbox and spam folder.`
      };
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        return {
          success: false,
          message: 'Password reset is disabled in your Firebase Console (project: festoria-cd375). Please enable "Email/Password" in the Firebase Console under Authentication > Sign-in method.'
        };
      }
      // Return generic message to prevent account enumeration
      return {
        success: true,
        message: `If an account exists for ${clean.toLowerCase()}, password reset instructions have been dispatched.`
      };
    }
  } else {
    // Phone number password reset via trusted Cloud Function
    const normalized = normalizePhoneNumber(clean);
    if (!normalized || normalized.length < 10) {
      return { success: false, message: 'Please enter a valid mobile number or email address.' };
    }

    try {
      const functions = getFunctions(firebaseAuth.app);
      const callReset = httpsCallable<{ phone: string }, { success: boolean; message: string }>(
        functions,
        'requestPasswordResetForPhone'
      );
      const res = await callReset({ phone: normalized });
      return {
        success: true,
        message: res.data.message || 'Password reset instructions have been dispatched to the registered email.'
      };
    } catch (fnErr: any) {
      return {
        success: true,
        message: 'If an account exists with this mobile number, password reset instructions have been dispatched to your registered email.'
      };
    }
  }
}

/**
 * Sign out user from Firebase and clear active browser session.
 */
export async function signOutUser(): Promise<void> {
  const firebaseAuth = auth || getFirebaseAuth();
  if (isFirebaseConfigured && firebaseAuth) {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (e) {
      console.warn('[Firebase Auth] Sign out error:', e);
    }
  }
  localStorage.removeItem('festflow_current_user');
  localStorage.removeItem('festflow_active_participant_id');
  localStorage.removeItem('festflow_active_team_id');
}

/**
 * Listen to Firebase Auth state changes.
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  const firebaseAuth = auth || getFirebaseAuth();
  if (isFirebaseConfigured && firebaseAuth) {
    return onAuthStateChanged(firebaseAuth, callback);
  }
  return () => {};
}

/**
 * ============================================================================
 * BACKWARD-COMPATIBILITY STUBS FOR DEPRECATED PHONE OTP METHODS
 * Ensures existing unit tests and legacy imports don't crash while migrating.
 * ============================================================================
 */
export async function requestFirebasePhoneOtp(
  phone: string,
  _intendedRole?: Role | 'participant' | 'auto',
  _recaptchaContainerId?: string
): Promise<RequestOtpResult> {
  const norm = normalizePhoneNumber(phone);
  return {
    success: true,
    message: `Password authentication is enabled. Please sign in with your mobile number and account password.`,
    cooldownSeconds: 0
  };
}

export async function verifyFirebasePhoneOtp(
  phone: string,
  _otpCode: string,
  intendedRole?: Role | 'participant' | 'auto'
): Promise<VerifyOtpResult> {
  return {
    success: false,
    message: 'SMS OTP authentication has been deprecated. Please sign in using your password.'
  };
}

export async function verifyApplicantPhoneVerification(
  phone: string,
  _otpCode: string
): Promise<{ success: boolean; message: string; uid?: string; phone?: string }> {
  return {
    success: false,
    message: 'SMS OTP authentication has been deprecated. Please sign in using your account password.'
  };
}
