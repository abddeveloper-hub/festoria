export type Role = 
  | 'super_admin'
  | 'admin'
  | 'fest_admin'
  | 'programme_manager'
  | 'score_manager'
  | 'judge'
  | 'team_leader'
  | 'participant';

export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  role: Role;
  status: UserStatus;
  avatar?: string;
  department?: string;
  institution?: string;
  permissions?: string[];
  lastLogin?: string;
  linkedJudgeId?: string;
  linkedTeamId?: string;
  festId?: string;
  invitationStatus?: 'pending_verification' | 'verified' | 'active' | 'suspended';
  invitedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export type InvitationStatus = 'pending_verification' | 'activated' | 'revoked' | 'expired';

export interface TeamLeaderInvitation {
  id: string; // e.g. "INV-2026-001"
  festId: string;
  teamId: string;
  teamName: string;
  phone: string; // normalized
  name: string;
  email?: string;
  institution?: string;
  status: InvitationStatus;
  createdByAdminId: string;
  createdByAdminName: string;
  createdAt: string;
  activatedAt?: string;
  activatedUserId?: string;
  notes?: string;
}

export type InvitationRole = 'judge' | 'team_leader';
export type FestInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface FestInvitation {
  id: string; // e.g. "INV-JD-A1B2C3" or "INV-TL-X9Y8Z7"
  token: string; // Secure unique token
  festId: string; // Target Fest ID
  role: InvitationRole; // 'judge' | 'team_leader'
  recipientType: 'phone' | 'email';
  recipientContact: string; // Recipient's phone or email
  recipientName?: string;
  assignedJudgeId?: string; // Optional: Link to an existing Judge profile
  assignedJudgeName?: string;
  assignedTeamId?: string; // Optional: Link to a Team (for team leader)
  assignedTeamName?: string;
  expiresAt: string; // ISO 8601 string
  status: FestInvitationStatus;
  createdByAdminId: string;
  createdByAdminName: string;
  createdAt: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  revokedAt?: string;
  revokedByAdminId?: string;
  notes?: string;
}

export type BuiltInParticipantCategory = 'Junior' | 'Senior' | 'Sub-Junior' | 'Open' | 'General';
export type ParticipantCategory = BuiltInParticipantCategory | string;

export interface FestCategory {
  id: string; // e.g. "CAT-GEN", "CAT-SR", "CAT-JR", "CAT-SUBJR" or "CAT-CUSTOM-xxx"
  festId: string;
  name: string; // "General", "Senior", "Junior", "Sub-Junior", etc.
  description?: string;
  isGeneral?: boolean; // Built-in General category (no age restrictions)
  minAge?: number; // Optional minimum age limit
  maxAge?: number; // Optional maximum age limit
  enabled: boolean;
  isSystem?: boolean; // System default categories
  createdAt: string;
  updatedAt?: string;
}

export type RegistrationStatus = 'registered' | 'verified' | 'disqualified' | 'inactive';

export type ParticipantApprovalStatus = 
  | 'approved' 
  | 'pending_approval' 
  | 'pending_verification' 
  | 'rejected' 
  | 'more_info_required';

export type ParticipantRegistrationSource = 'self_registration' | 'team_leader_invitation';

export interface Participant {
  id: string; // e.g. "PT-101"
  userId?: string;
  name: string;
  chestNumber?: string; // Official Chest Number assigned to student (e.g. "101", "CH-12")
  email: string;
  phone: string;
  phoneVerified?: boolean;
  college?: string;
  institution?: string;
  classOrDivision?: string;
  photoUrl?: string;
  teamId: string;
  requestedTeamId?: string;
  category: ParticipantCategory;
  registeredProgrammes: string[]; // Programme IDs
  status: RegistrationStatus;
  approvalStatus?: ParticipantApprovalStatus;
  registrationSource?: ParticipantRegistrationSource;
  approvedAt?: string;
  approvedBy?: string;
  reviewedByAdminId?: string;
  reviewedByLeaderId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  moreInfoRequest?: string;
  festId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type JudgeStatus = 'active' | 'inactive' | 'on_break';

export interface Judge {
  id: string; // e.g. "JD-01"
  festId?: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  institution?: string;
  affiliation?: string;
  specialization?: string;
  assignedProgrammes: string[]; // Programme IDs
  status: JudgeStatus;
  notes?: string;
  createdAt: string;
}

export type ProgrammeCategory = string;

export type ProgrammeType = 'individual' | 'team' | 'group';

export type ProgrammeStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface ScoringCriterion {
  id: string;
  name: string;
  maxMarks: number;
  weightage?: number; // percentage
}

export interface Programme {
  id: string; // e.g. "PRG-201"
  festId?: string;
  code: string;
  name: string;
  description: string;
  rules?: string;
  category: ProgrammeCategory;
  type: ProgrammeType;
  programmeType?: 'individual' | 'team';
  stageType?: 'stage' | 'off_stage';
  eligibleCategories: ParticipantCategory[];
  eligibleCategoryIds?: string[];
  assignedJudgeIds: string[];
  judgeIds?: string[];

  // Individual Programme Limits
  maxParticipantsPerTeam?: number; // Maximum participants each team/institution can register

  // Team Programme Limits
  minTeamMembers?: number; // Minimum team members required per entry (e.g. 5)
  maxTeamMembers?: number; // Maximum team members allowed per entry (e.g. 8)
  maxEntriesPerTeam?: number; // Maximum team entries per team/institution (e.g. 1 or 2)
  allowMultiTeamProgrammeParticipation?: boolean; // Can a participant join >1 team programme
  allowMultiEntriesPerParticipant?: boolean; // Can a participant join multiple entries of the same programme

  venue: string;
  stage: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxCapacity?: number;
  status: ProgrammeStatus;
  criteria: ScoringCriterion[];
  resultPublished: boolean;
  publishedAt?: string;
  registeredParticipantIds: string[];
  registeredTeamIds: string[];
}

export interface TeamProgrammeEntry {
  id: string; // e.g. "TPE-001"
  festId: string;
  programmeId: string;
  programmeName?: string;
  teamId: string;
  teamName: string;
  entryName: string; // e.g. "St. Mary's Team A"
  categoryId: string; // Category ID or name
  categoryName?: string;
  memberParticipantIds: string[];
  memberNames?: string[];
  status: 'registered' | 'verified' | 'withdrawn' | 'disqualified';
  createdAt: string;
  updatedAt?: string;
}

export type ScoreStatus = 'pending' | 'submitted' | 'reviewed' | 'approved' | 'published';

export interface ScoreDetail {
  criterionId: string;
  criterionName: string;
  marksObtained: number;
  maxMarks: number;
}

export interface ScoreSubmission {
  id: string;
  festId?: string;
  programmeId: string;
  judgeId: string;
  judgeName: string;
  participantId?: string; // For individual programmes
  teamId?: string; // For team or individual programmes
  teamEntryId?: string; // For team programmes (links to TeamProgrammeEntry)
  teamEntryName?: string;
  scores: ScoreDetail[];
  totalScore: number;
  notes?: string;
  status: ScoreStatus;
  submittedAt: string;
  reviewedBy?: string;
  approvedBy?: string;
  revisionHistory: {
    revisedBy: string;
    revisedAt: string;
    previousTotal: number;
    reason?: string;
  }[];
}

export interface ApprovedResult {
  id: string;
  festId?: string;
  programmeId: string;
  programmeName?: string;
  rank: number; // 1, 2, 3, etc.
  participantId?: string;
  participantName?: string;
  teamId: string;
  teamName: string;
  teamEntryId?: string;
  entryName?: string;
  category?: string; // Participant or event category
  isTeamProgramme?: boolean;
  finalScore: number;
  pointsAwarded: number;
  isTieBroken?: boolean;
  tieBreakNotes?: string;
  published: boolean;
  publishedAt?: string;
}

export interface CategoryScoreboardEntry {
  rank: number;
  participantId: string;
  participantName: string;
  teamId: string;
  teamName: string;
  institution?: string;
  category: string;
  programmeId: string;
  programmeName: string;
  marksObtained: number;
  pointsAwarded: number;
  medal?: 'Gold' | 'Silver' | 'Bronze' | 'None';
  position: string;
  totalCategoryPoints: number;
}

export interface Team {
  id: string; // e.g. "TM-01"
  festId?: string; // e.g. "FEST-01"
  code: string;
  name: string;
  institution: string;
  teamLeaderName: string;
  teamLeaderContact: string;
  logoUrl?: string;
  colorHex?: string;
  totalPoints?: number;
  totalScore?: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ScheduleSlot {
  id: string;
  festId?: string;
  programmeId: string;
  venue: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ProgrammeStatus;
  isOverlapping?: boolean;
}

export interface ActivityLog {
  id: string;
  festId?: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  targetType: 'participant' | 'programme' | 'score' | 'judge' | 'team' | 'schedule' | 'user' | 'settings';
  targetId?: string;
  details: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'schedule_change' | 'results' | 'urgent';
  isPublic: boolean;
  createdAt: string;
  author: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  programmeName?: string;
  isPublic: boolean;
  uploadedAt: string;
}

export interface ScoringPointRules {
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  fourthPlace: number;
  fifthPlace: number;
  groupMultiplier: number;
}

export interface FestSettings {
  festName: string;
  festEdition: string;
  tagline: string;
  startDate: string;
  endDate: string;
  venue: string;
  organizer: string;
  contactEmail: string;
  contactPhone: string;
  contactInstagram?: string;
  pointRules: ScoringPointRules;
  tieBreakPolicy: 'average_marks' | 'highest_single_judge' | 're_evaluation';
  publicResultsVisible: boolean;
  publicScheduleVisible: boolean;
  registrationOpen: boolean;
  timezone: string;
  generalCategoryEnabled?: boolean;
}

// ==========================================
// SUPER ADMIN & PLATFORM-WIDE DATA MODELS
// ==========================================

export type FestLifecycleStatus = 
  | 'request_submitted' 
  | 'request_under_review' 
  | 'approved' 
  | 'setup' 
  | 'registration_open' 
  | 'registration_closed' 
  | 'ongoing' 
  | 'scoring' 
  | 'completed' 
  | 'archived' 
  | 'suspended' 
  | 'cancelled';

export type FestRequestStatus = 
  | 'pending'
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'more_info_required' 
  | 'approved' 
  | 'rejected' 
  | 'workspace_created'
  | 'withdrawn'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'MORE_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WORKSPACE_CREATED';

export interface Fest {
  id: string; // e.g. "FEST-01"
  name: string;
  edition: string;
  tagline: string;
  description: string;
  institution: string;
  category: string;
  venue: string;
  startDate: string;
  endDate: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  status: FestLifecycleStatus;
  publicPagePublished: boolean;
  publicUrl: string;
  expectedParticipants: number;
  plannedProgrammesCount: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  suspensionReason?: string;
  completionPercentage: number;
  generalCategoryEnabled?: boolean;
}

export interface RequestHistoryEntry {
  date: string;
  actor: string;
  action: string;
  note?: string;
}

export interface FestRequest {
  id: string; // e.g. "APP-2026-001" or "REQ-2026-01"
  // SECTION A: Fest Information
  festName: string;
  shortName?: string;
  edition: string;
  category: string;
  description: string;
  institution: string;
  logoUrl?: string;

  // SECTION B: Event Details
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  venue: string;
  expectedParticipants: number;
  plannedProgrammesCount: number;

  // SECTION C: Organizer Information
  requestingAdminId: string; // Authenticated UID
  requestingAdminName: string; // Organizer Name
  designation?: string;
  requestingAdminEmail: string;
  requestingAdminPhone: string; // Verified Phone Number
  contactPersonName?: string;
  institutionAddress?: string;

  // SECTION D: Additional Information
  websiteUrl?: string;
  previousFestDetails?: string;
  additionalMessage?: string;
  supportingDocs?: string[];
  supportingDocumentUrl?: string;

  // Platform Lifecycle & Scrutiny
  status: FestRequestStatus;
  workspaceStatus?: string;
  submissionDate: string;
  createdAt?: string;
  updatedAt?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  moreInfoMessage?: string;
  allocatedFestId?: string;
  history: RequestHistoryEntry[];
}

export interface FestMilestone {
  id: string;
  festId: string;
  name: string;
  category: string;
  completed: boolean;
  completedAt?: string;
  responsibleRole: string;
}

export interface PlatformSettings {
  platformName: string;
  platformLogo: string;
  platformDescription: string;
  supportEmail: string;
  supportPhone: string;
  supportInstagram?: string;
  defaultTimezone: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  allowNewFestRequests: boolean;
  requiredRequestFields: string[];
  allowedFestCategories: string[];
  requireApprovalNote: boolean;
  resubmissionAllowed: boolean;
  defaultPublicVisibility: boolean;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  auditLogRetentionDays: number;
}

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: 'fest_request' | 'deadline' | 'conflict' | 'scoring' | 'security';
  read: boolean;
  createdAt: string;
  relatedFestId?: string;
  relatedRequestId?: string;
}

export interface PlatformAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: 'fest' | 'fest_request' | 'user' | 'platform_settings' | 'security';
  targetId: string;
  details: string;
  beforeValue?: string;
  afterValue?: string;
  timestamp: string;
}

export type SuperAdminNavigationTab =
  | 'super_dashboard'
  | 'fest_requests'
  | 'all_fests'
  | 'fest_monitoring'
  | 'admin_management'
  | 'platform_users'
  | 'platform_participants'
  | 'platform_programmes'
  | 'platform_scores'
  | 'platform_schedule'
  | 'platform_reports'
  | 'platform_notifications'
  | 'platform_audit_logs'
  | 'platform_settings'
  | 'security_permissions'
  | 'help_support';

// ==========================================
// TEAM LEADER PANEL DATA MODELS
// ==========================================

export type TeamLeaderNavigationTab =
  | 'team_dashboard'
  | 'team_leaderboard'
  | 'team_members'
  | 'team_requests'
  | 'team_assignments'
  | 'team_results'
  | 'team_schedule'
  | 'team_complaints'
  | 'team_announcements'
  | 'team_profile'
  | 'team_notifications'
  | 'team_account';

export type ComplaintCategory =
  | 'incorrect_score_calc'
  | 'score_entry_error'
  | 'incorrect_result'
  | 'eligibility_dispute'
  | 'judging_procedure'
  | 'missing_result'
  | 'schedule_issue'
  | 'other';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'more_info_required'
  | 'escalated'
  | 'resolved'
  | 'rejected'
  | 'withdrawn';

export interface ComplaintHistoryEntry {
  date: string;
  actor: string;
  status: ComplaintStatus;
  note?: string;
}

export interface Complaint {
  id: string; // e.g. "CMP-2026-001"
  teamId: string;
  teamName: string;
  festId: string;
  programmeId: string;
  programmeName: string;
  participantId?: string;
  participantName?: string;
  category: ComplaintCategory;
  resultReference?: string;
  description: string;
  expectedCorrection: string;
  evidence?: string[];
  status: ComplaintStatus;
  submittedAt: string;
  updatedAt: string;
  reviewerId?: string;
  reviewerName?: string;
  resolutionNote?: string;
  calibratedScore?: number;
  statusHistory: ComplaintHistoryEntry[];
}

export type AssignmentStatus =
  | 'draft'
  | 'pending_approval'
  | 'registered'
  | 'rejected'
  | 'withdrawn'
  | 'completed';

export interface ProgrammeAssignment {
  id: string; // e.g. "ASG-001"
  festId: string;
  teamId: string;
  programmeId: string;
  programmeName: string;
  participantIds: string[];
  participantNames: string[];
  isGroupEntry: boolean;
  status: AssignmentStatus;
  assignedAt: string;
  rejectionReason?: string;
  notes?: string;
}

// ==========================================
// PARTICIPANT PANEL DATA MODELS
// ==========================================

export type ParticipantNavigationTab =
  | 'participant_dashboard'
  | 'participant_profile'
  | 'participant_team'
  | 'participant_programmes'
  | 'participant_schedule'
  | 'participant_results'
  | 'participant_notifications'
  | 'participant_help'
  | 'participant_account';

export interface ParticipantInquiry {
  id: string;
  participantId: string;
  participantName: string;
  teamId: string;
  subject: string;
  category: 'general' | 'schedule' | 'programme' | 'team' | 'grievance';
  message: string;
  status: 'open' | 'in_review' | 'resolved';
  response?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PUBLIC FEST PAGE & MEDIA DATA MODELS
// ==========================================

export interface FestHeroMedia {
  videoUrl?: string;
  videoType?: string;
  videoPosterUrl?: string;
  heading: string;
  description: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  showFallbackCss: boolean;
}

export interface FestLogoMedia {
  logoUrl?: string;
  widthPx: number;
  alignment: 'left' | 'center';
}

export interface FestPhotoItem {
  id: string;
  url: string;
  caption: string;
  description?: string;
  order: number;
  featuredInMain: boolean;
  category?: string;
  createdAt: string;
}

export interface FestPublicPageContent {
  welcomeTitle: string;
  welcomeMessage: string;
  aboutFest: string;
  venueInfo: string;
  contactEmail: string;
  contactPhone: string;
  contactInstagram?: string;
  highlights: string[];
}

export interface FestPublicPageData {
  festId: string;
  hero: FestHeroMedia;
  logo: FestLogoMedia;
  photos: FestPhotoItem[];
  content: FestPublicPageContent;
  updatedAt: string;
  publishedAt?: string;
  version: number;
}



