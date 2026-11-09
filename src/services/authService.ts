// ============================================================================
// Festoria Authentication Utilities & Account Verification
// Supports Password Authentication via Registered Email OR Registered Mobile.
// Zero SMS OTP. Native Firebase Auth with secure server-side phone lookup.
// ============================================================================

import { User, Participant, Role, ParticipantCategory } from '../types';

export interface AuthCheckResult {
  exists: boolean;
  role?: Role | 'participant';
  user?: User;
  participant?: Participant;
  isVerified: boolean;
  accountStatus: 'active' | 'pending_verification' | 'suspended' | 'inactive' | 'not_found';
}

export interface SignInCredentials {
  identifier: string; // Registered email OR registered mobile number
  password: string;
  intendedRole?: Role | 'participant' | 'auto';
}

export interface SignInResult {
  success: boolean;
  message: string;
  role?: Role | 'participant';
  user?: User;
  participant?: Participant;
  isNewUser?: boolean;
}

export interface RegistrationCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  college?: string;
  classOrDivision?: string;
  category?: ParticipantCategory;
  requestedTeamId?: string;
  festId?: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  userId?: string;
  participantId?: string;
  user?: User;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

// Backward-compatibility aliases for legacy test suites
export interface RequestOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  account?: AuthCheckResult;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  role?: Role | 'participant';
  user?: User;
  participant?: Participant;
  isNewUser?: boolean;
}

/**
 * Normalizes phone numbers into a standard international format.
 * Strips whitespace, dashes, brackets, and prefixes local 10-digit Indian numbers with +91.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If 10 digits starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // If starts with 91 and has 12 digits
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  
  // Fallback with plus if only digits
  if (/^\d{10,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Formats a phone number for clean readable display: e.g. "+91 98401 23001"
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.startsWith('+91') && normalized.length === 13) {
    return `+91 ${normalized.slice(3, 8)} ${normalized.slice(8)}`;
  }
  return normalized;
}

/**
 * Masks a phone number for privacy display: e.g. "+91 98*** **001"
 */
export function maskPhoneNumber(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  if (norm.length >= 10) {
    const prefix = norm.slice(0, 5);
    const suffix = norm.slice(-3);
    return `${prefix}*** **${suffix}`;
  }
  return '***-***-****';
}

/**
 * Masks an email address for privacy display: e.g. "j***n@college.edu"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'your registered email';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Checks if an input string is an email address.
 */
export function isEmailIdentifier(identifier: string): boolean {
  return typeof identifier === 'string' && identifier.includes('@');
}

/**
 * Checks if a given phone number belongs to an existing User or Participant (in-memory lookup).
 */
export function checkAccountEligibility(
  phone: string,
  users: User[],
  participants: Participant[]
): AuthCheckResult {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) {
    return { exists: false, isVerified: false, accountStatus: 'not_found' };
  }

  const matchedUser = users.find((u) => u.phone && normalizePhoneNumber(u.phone) === normalized);
  if (matchedUser) {
    const status = matchedUser.status === 'suspended' ? 'suspended' : matchedUser.status === 'inactive' ? 'inactive' : 'active';
    return {
      exists: true,
      role: matchedUser.role,
      user: matchedUser,
      isVerified: !!matchedUser.phoneVerified,
      accountStatus: status,
    };
  }

  const matchedParticipant = participants.find(
    (p) => p.phone && normalizePhoneNumber(p.phone) === normalized
  );
  if (matchedParticipant) {
    return {
      exists: true,
      role: 'participant',
      participant: matchedParticipant,
      isVerified: !!matchedParticipant.phoneVerified,
      accountStatus: matchedParticipant.status === 'disqualified' ? 'suspended' : 'active',
    };
  }

  return {
    exists: false,
    isVerified: false,
    accountStatus: 'not_found',
  };
}
