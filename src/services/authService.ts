// ============================================================================
// FestFlow Phone Number Utilities & Account Eligibility Verification
// Pure production utility module — all OTP generation and verification
// are delegated directly to authoritative Firebase Phone Authentication.
// ============================================================================

import { User, Participant, Role } from '../types';

export interface AuthCheckResult {
  exists: boolean;
  role?: Role | 'participant';
  user?: User;
  participant?: Participant;
  isVerified: boolean;
  accountStatus: 'active' | 'pending_verification' | 'suspended' | 'inactive' | 'not_found';
}

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
 * Checks if a given phone number belongs to an existing User or Participant.
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

  // 1. Look in Users collection (Admin, Super Admin, Team Leader, Judges)
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

  // 2. Look in Participants collection
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
