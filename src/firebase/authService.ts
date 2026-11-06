import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  normalizePhoneNumber,
  formatPhoneDisplay,
  VerifyOtpResult,
  RequestOtpResult
} from '../services/authService';
import { User, Participant, Role } from '../types';
import { StorageService } from '../services/storage';

// Global reference to store active Firebase ConfirmationResult
let activeConfirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// In-memory rate limiting for OTP dispatch (abuse protection)
const lastOtpRequestTimes = new Map<string, number>();
const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Initializes or retrieves a ReCAPTCHA verifier for Firebase Phone Auth.
 */
export function getRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  const firebaseAuth = auth || getFirebaseAuth();
  if (!isFirebaseConfigured || !firebaseAuth) {
    return null;
  }

  // Ensure recaptcha container exists in document.body
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // Clear existing verifier instance and reset DOM container to ensure a fresh session
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    recaptchaVerifier = null;
  }
  container.innerHTML = '';

  try {
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, container, {
      size: 'invisible',
      callback: () => {
        // ReCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('[Firebase Auth] ReCAPTCHA expired. Please re-verify.');
      }
    });
  } catch (e) {
    console.warn('[Firebase Auth] ReCAPTCHA initialization error:', e);
    return null;
  }

  return recaptchaVerifier;
}

/**
 * Request Phone OTP through Firebase Authentication.
 * Removes all client localStorage pre-filters; enforces ReCAPTCHA and cooldown rate-limits.
 */
export async function requestFirebasePhoneOtp(
  phone: string,
  intendedRole?: Role | 'participant' | 'auto',
  recaptchaContainerId: string = 'recaptcha-container'
): Promise<RequestOtpResult> {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) {
    return { success: false, message: 'Invalid phone number format.' };
  }

  // Abuse protection: Enforce 30-second cooldown per phone number
  const lastRequested = lastOtpRequestTimes.get(normalized) || 0;
  const elapsedSeconds = Math.floor((Date.now() - lastRequested) / 1000);
  if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
    const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
    return {
      success: false,
      message: `Please wait ${remaining} seconds before requesting a new verification code.`,
      cooldownSeconds: remaining
    };
  }

  const firebaseAuth = auth || getFirebaseAuth();

  // If live Firebase is configured, execute real Firebase Phone Authentication
  if (isFirebaseConfigured && firebaseAuth) {
    try {
      const verifier = getRecaptchaVerifier(recaptchaContainerId);
      if (verifier) {
        await verifier.render();
        const confirmation = await signInWithPhoneNumber(firebaseAuth, normalized, verifier);
        activeConfirmationResult = confirmation;
        lastOtpRequestTimes.set(normalized, Date.now());
        return {
          success: true,
          message: `Verification code sent via SMS to ${formatPhoneDisplay(phone)}.`,
          cooldownSeconds: RESEND_COOLDOWN_SECONDS
        };
      } else {
        return {
          success: false,
          message: 'ReCAPTCHA verifier could not be initialized. Please refresh the page and try again.'
        };
      }
    } catch (firebaseErr: any) {
      console.warn('[Firebase Auth] signInWithPhoneNumber failed:', firebaseErr);
      try {
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
          recaptchaVerifier = null;
        }
      } catch (e) {
        recaptchaVerifier = null;
      }
      const cEl = document.getElementById(recaptchaContainerId);
      if (cEl) cEl.innerHTML = '';

      if (firebaseErr.code === 'auth/quota-exceeded' || firebaseErr.code === 'auth/too-many-requests') {
        return {
          success: false,
          message: 'SMS quota exceeded or too many attempts. Please try again later.'
        };
      }
      if (firebaseErr.code === 'auth/invalid-phone-number') {
        return {
          success: false,
          message: 'The phone number entered is invalid. Please check the country code and number.'
        };
      }
      if (firebaseErr.code === 'auth/captcha-check-failed') {
        return {
          success: false,
          message: 'ReCAPTCHA verification failed. Please try again.'
        };
      }
      if (firebaseErr.code === 'auth/invalid-app-credential') {
        return {
          success: false,
          message: 'Phone verification credential rejected. Please ensure you are accessing via http://localhost:5173 (not 127.0.0.1) and refresh the page.'
        };
      }
      if (firebaseErr.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          message: 'Phone authentication is not enabled in Firebase Console. Please enable the Phone provider in Firebase Console -> Authentication -> Sign-in method.'
        };
      }
      return {
        success: false,
        message: firebaseErr.message || 'Phone verification failed.'
      };
    }
  }

  // If Firebase is not configured
  if (!isFirebaseConfigured) {
    return {
      success: false,
      message: 'Firebase Authentication is not configured. Please verify your environment credentials.'
    };
  }

  return {
    success: false,
    message: firebaseInitError
      ? `Authentication service unavailable: ${firebaseInitError.message}`
      : 'Authentication service unavailable. Please refresh and check your network connection.'
  };
}

/**
 * Verify Phone OTP through Firebase ConfirmationResult.
 * Authoritative security check against Cloud Firestore /users/{uid}.
 */
export async function verifyFirebasePhoneOtp(
  phone: string,
  otpCode: string,
  intendedRole?: Role | 'participant' | 'auto'
): Promise<VerifyOtpResult> {
  const normalized = normalizePhoneNumber(phone);
  const firebaseAuth = auth || getFirebaseAuth();
  const firestoreDb = db || getFirebaseDb();

  if (!isFirebaseConfigured || !firebaseAuth) {
    return {
      success: false,
      message: 'Firebase Authentication is not configured.'
    };
  }

  if (!activeConfirmationResult) {
    return {
      success: false,
      message: 'No active Firebase Phone verification session found. Please request a new OTP.'
    };
  }

  try {
    const userCredential = await activeConfirmationResult.confirm(otpCode);
    const firebaseUser = userCredential.user;
    const uid = firebaseUser.uid;
    const authenticatedPhone = normalizePhoneNumber(firebaseUser.phoneNumber || normalized);

    if (!firestoreDb) {
      return {
        success: false,
        message: 'Firestore database is not configured.'
      };
    }

    // Authoritative profile retrieval from Firestore
    const userDocRef = doc(firestoreDb, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    // =========================================================================
    // 1. Privileged Super Admin Access Verification
    // =========================================================================
    if (intendedRole === 'super_admin') {
      if (!userDocSnap.exists()) {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Unauthorized: No Super Administrator profile found for this account in Firestore.'
        };
      }

      const profile = userDocSnap.data() as User;

      if (normalizePhoneNumber(profile.phone || '') !== authenticatedPhone) {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Security Alert: Registered profile phone number does not match authenticated phone number.'
        };
      }

      if (profile.status !== 'active') {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }

      if (profile.role !== 'super_admin') {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Unauthorized: This account does not possess Super Administrator privileges.'
        };
      }

      activeConfirmationResult = null;
      StorageService.setCurrentUser(profile);
      try {
        await updateDoc(userDocRef, { phoneVerified: true, lastLoginAt: serverTimestamp() });
      } catch {
        // ignore non-critical update
      }

      return {
        success: true,
        message: 'Super Administrator authenticated successfully.',
        role: 'super_admin',
        user: profile,
        isNewUser: false
      };
    }

    // =========================================================================
    // 2. Privileged Admin / Fest Admin Access Verification
    // =========================================================================
    if (intendedRole === 'admin') {
      if (!userDocSnap.exists()) {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Unauthorized: No Administrator profile found for this account in Firestore.'
        };
      }

      const profile = userDocSnap.data() as User;

      if (normalizePhoneNumber(profile.phone || '') !== authenticatedPhone) {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Security Alert: Registered profile phone number does not match authenticated phone number.'
        };
      }

      if (profile.status !== 'active') {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }

      if (profile.role !== 'admin' && profile.role !== 'fest_admin' && profile.role !== 'super_admin') {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Unauthorized: This account does not possess Administrator privileges.'
        };
      }

      activeConfirmationResult = null;
      StorageService.setCurrentUser(profile);
      try {
        await updateDoc(userDocRef, { phoneVerified: true, lastLoginAt: serverTimestamp() });
      } catch {
        // ignore
      }

      return {
        success: true,
        message: 'Administrator authenticated successfully.',
        role: profile.role,
        user: profile,
        isNewUser: false
      };
    }

    // =========================================================================
    // 3. Privileged Team Leader Access Verification
    // =========================================================================
    if (intendedRole === 'team_leader') {
      let profile: User | undefined;

      if (userDocSnap.exists()) {
        profile = userDocSnap.data() as User;
      } else {
        // Check for pending invitation to activate
        try {
          const { fetchInvitationByPhone, activateTeamLeaderInvitation } = await import('./firestoreService');
          const inv = await fetchInvitationByPhone(authenticatedPhone);
          if (inv && (inv.status === 'pending_verification' || inv.status === 'activated')) {
            await activateTeamLeaderInvitation(inv.id, uid);
            profile = {
              id: uid,
              name: inv.name,
              email: inv.email || '',
              phone: authenticatedPhone,
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
        } catch (invErr) {
          console.warn('[Firebase Auth] Team leader invitation lookup error:', invErr);
        }
      }

      if (!profile) {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Unauthorized: This phone number is not registered as an authorized Team Leader.'
        };
      }

      if (normalizePhoneNumber(profile.phone || '') !== authenticatedPhone) {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Security Alert: Registered profile phone number does not match authenticated phone number.'
        };
      }

      if (profile.status !== 'active') {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }

      if (profile.role !== 'team_leader' && profile.role !== 'admin' && profile.role !== 'super_admin') {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Unauthorized: This account is not registered as an authorized Team Leader.'
        };
      }

      if (profile.role === 'team_leader' && !profile.linkedTeamId) {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'Account Unassigned: Your Team Leader account is not assigned to any participating team.'
        };
      }

      activeConfirmationResult = null;
      StorageService.setCurrentUser(profile);
      return {
        success: true,
        message: 'Team Leader authenticated successfully.',
        role: profile.role,
        user: profile,
        isNewUser: false
      };
    }

    // =========================================================================
    // 4. Participant or Auto-Detect Role Verification
    // =========================================================================
    if (userDocSnap.exists()) {
      const profile = userDocSnap.data() as User;
      if (profile.status !== 'active') {
        await signOutUser();
        activeConfirmationResult = null;
        return {
          success: false,
          message: profile.status === 'suspended'
            ? 'This account has been suspended by the administrator. Access is denied.'
            : 'This account is currently inactive. Access is denied.'
        };
      }
      activeConfirmationResult = null;
      StorageService.setCurrentUser(profile);
      return {
        success: true,
        message: `Authenticated successfully as ${profile.role.replace('_', ' ')}.`,
        role: profile.role,
        user: profile,
        isNewUser: false
      };
    }

    // Check existing participant record in Firestore
    let existingParticipant: Participant | undefined;
    try {
      const partDoc = await getDoc(doc(firestoreDb, 'participants', `PT-${uid.slice(0, 5)}`));
      if (partDoc.exists()) {
        existingParticipant = partDoc.data() as Participant;
      } else {
        const { query, collection, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(firestoreDb, 'participants'), where('phone', '==', authenticatedPhone));
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
        activeConfirmationResult = null;
        return {
          success: false,
          message: 'This participant registration has been disqualified or suspended.'
        };
      }

      const partUser: User = {
        id: uid,
        name: existingParticipant.name,
        email: existingParticipant.email || '',
        phone: authenticatedPhone,
        phoneVerified: true,
        role: 'participant',
        status: 'active',
        festId: existingParticipant.festId || 'FEST-01',
        linkedTeamId: existingParticipant.teamId,
        createdAt: existingParticipant.createdAt || new Date().toISOString()
      };

      activeConfirmationResult = null;
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

    // No existing user profile or participant record -> New Participant Self-Registration
    activeConfirmationResult = null;
    return {
      success: true,
      message: 'Phone number verified. Please complete your participant registration.',
      role: 'participant',
      isNewUser: true
    };
  } catch (err: any) {
    console.warn('[Firebase Auth] Confirmation code error:', err);
    return {
      success: false,
      message: err.message?.includes('invalid-verification-code')
        ? 'Invalid verification code. Please check and re-enter.'
        : err.message || 'Verification failed.'
    };
  }
}

/**
 * Sign out user from Firebase and clear active session.
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
