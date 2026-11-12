import React, { useState, useEffect } from 'react';
import { FESTORIA_LOGO, handleLogoError } from '../../utils/logo';
import {
  Sparkles,
  Building,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Layers,
  ChevronRight,
  Info,
  HelpCircle,
  Briefcase,
  Globe,
  Image as ImageIcon
} from 'lucide-react';
import {
  formatPhoneDisplay,
  normalizePhoneNumber,
  isEmailIdentifier
} from '../../services/authService';
import {
  signInWithCredentials,
  registerOrganizerWithCredentials
} from '../../firebase/authService';
import {
  checkDuplicateFestApplication,
  submitFestApplication,
  fetchFestApplicationById,
  fetchFestApplicationsByPhone
} from '../../firebase/firestoreService';
import { FestRequest, FestRequestStatus } from '../../types';
import { useFest } from '../../context/FestContext';

interface CreateFestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'apply' | 'track';
}

export const CreateFestModal: React.FC<CreateFestModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'apply'
}) => {
  const { addToast, switchPortal, switchCurrentUser, users } = useFest();

  // Active Tab: 'apply' or 'track'
  const [activeTab, setActiveTab] = useState<'apply' | 'track'>(initialTab);

  // ==========================================
  // SECTION A: FEST INFORMATION
  // ==========================================
  const [festName, setFestName] = useState('');
  const [shortName, setShortName] = useState('');
  const [edition, setEdition] = useState('2026');
  const [category, setCategory] = useState('Cultural & Arts');
  const [description, setDescription] = useState('');
  const [institution, setInstitution] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // ==========================================
  // SECTION B: EVENT DETAILS
  // ==========================================
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationStartDate, setRegistrationStartDate] = useState('');
  const [registrationEndDate, setRegistrationEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState(600);

  // ==========================================
  // SECTION C: ORGANIZER INFORMATION
  // ==========================================
  const [organizerName, setOrganizerName] = useState('');
  const [designation, setDesignation] = useState('Faculty Convenor / Cultural Dean');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState('');

  // ==========================================
  // SECTION D: ADDITIONAL INFORMATION
  // ==========================================
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [previousFestDetails, setPreviousFestDetails] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [supportingDocumentUrl, setSupportingDocumentUrl] = useState('');

  // ==========================================
  // AUTHENTICATION & STEP WORKFLOW STATE
  // steps: 'auth' -> 'form' -> 'success'
  // ==========================================
  const [submissionStep, setSubmissionStep] = useState<'auth' | 'form' | 'success'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  // Result state
  const [generatedAppId, setGeneratedAppId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // ==========================================
  // TRACK APPLICATION STATE
  // ==========================================
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedApplication, setTrackedApplication] = useState<FestRequest | null>(null);
  const [trackingError, setTrackingError] = useState('');

  // Sync initial tab and reset state on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab(initialTab);
      setErrorMessage('');
      setTrackingError('');
      if (!verifiedUid) {
        setSubmissionStep('auth');
      } else {
        setSubmissionStep('form');
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab, verifiedUid]);

  if (!isOpen) return null;

  // ------------------------------------------
  // STEP 1: Organizer Password Authentication Handlers
  // ------------------------------------------
  const handleOrganizerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const iden = emailAddress.trim() || mobileNumber.trim();
    if (!iden) {
      setErrorMessage('Please enter your registered email address or mobile number.');
      return;
    }
    if (!authPassword.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithCredentials({
        identifier: iden,
        password: authPassword.trim(),
        intendedRole: 'auto'
      });
      if (res.success && res.user) {
        setVerifiedUid(res.user.id);
        const norm = res.user.phone ? normalizePhoneNumber(res.user.phone) : normalizePhoneNumber(mobileNumber);
        setVerifiedPhone(norm);
        if (res.user.name) setOrganizerName(res.user.name);
        if (res.user.email) setEmailAddress(res.user.email);
        setSubmissionStep('form');
        addToast('success', 'Authenticated', `Welcome, ${res.user.name}! Proceed with your fest application.`);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!organizerName.trim() || organizerName.trim().length < 2) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!emailAddress.trim() || !isEmailIdentifier(emailAddress.trim())) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }
    const norm = normalizePhoneNumber(mobileNumber);
    if (!norm || norm.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerOrganizerWithCredentials({
        name: organizerName.trim(),
        email: emailAddress.trim(),
        phone: norm,
        password: authPassword,
        confirmPassword: authConfirmPassword
      });
      if (res.success && res.userId) {
        setVerifiedUid(res.userId);
        setVerifiedPhone(norm);
        setSubmissionStep('form');
        addToast('success', 'Account Registered', 'Organizer profile established. Proceed with your fest application.');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // STEP 2: Application Form Validation & Submission
  // ------------------------------------------
  const validateForm = (): string | null => {
    // SECTION A
    if (!festName.trim()) return 'Section A: Fest Name is mandatory.';
    if (!institution.trim()) return 'Section A: Institution / Organization Name is mandatory.';
    if (!description.trim() || description.trim().length < 20) {
      return 'Section A: Please provide a descriptive summary of your fest (at least 20 characters).';
    }

    // SECTION B
    if (!startDate) return 'Section B: Fest Start Date is mandatory.';
    if (!endDate) return 'Section B: Fest End Date is mandatory.';
    if (new Date(endDate) < new Date(startDate)) {
      return 'Section B: Fest End Date cannot be earlier than Start Date.';
    }
    if (registrationStartDate && registrationEndDate && new Date(registrationEndDate) < new Date(registrationStartDate)) {
      return 'Section B: Registration End Date cannot be earlier than Registration Start Date.';
    }
    if (registrationEndDate && new Date(registrationEndDate) > new Date(endDate)) {
      return 'Section B: Registration End Date cannot extend past the Fest End Date.';
    }
    if (!venue.trim()) return 'Section B: Venue location is mandatory.';
    if (!expectedParticipants || expectedParticipants < 10) {
      return 'Section B: Expected participant count must be at least 10.';
    }

    // SECTION C
    if (!organizerName.trim()) return "Section C: Organizer Name is mandatory.";
    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      return 'Section C: A valid official email address is mandatory.';
    }
    if (!institutionAddress.trim()) return 'Section C: Institution Address is mandatory.';

    return null;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!verifiedUid || !verifiedPhone) {
      setErrorMessage('Security Alert: Organizer authentication is required before submission.');
      setSubmissionStep('auth');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      // 1. Prevent duplicate pending applications
      const dupCheck = await checkDuplicateFestApplication(institution, verifiedPhone);
      if (dupCheck.isDuplicate) {
        setErrorMessage(
          `A pending application (${dupCheck.existingRequest?.id || 'Under Review'}) already exists for "${institution}". Duplicate submissions are prevented while an application is pending review.`
        );
        setLoading(false);
        return;
      }

      // 2. Generate unique Application ID
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const newAppId = `APP-2026-${randomDigits}`;

      const nowIso = new Date().toISOString();
      const nowFormatted = nowIso.replace('T', ' ').slice(0, 16);

      // 3. Construct application document
      const newApplication: FestRequest = {
        id: newAppId,
        // Section A
        festName: festName.trim(),
        shortName: shortName.trim() || '',
        edition,
        category,
        description: description.trim(),
        institution: institution.trim(),
        logoUrl: logoUrl.trim() || '',

        // Section B
        startDate,
        endDate,
        registrationStartDate: registrationStartDate || startDate,
        registrationEndDate: registrationEndDate || endDate,
        venue: venue.trim(),
        expectedParticipants: Number(expectedParticipants) || 500,
        plannedProgrammesCount: 20,

        // Section C
        requestingAdminId: verifiedUid,
        requestingAdminName: organizerName.trim(),
        designation: designation.trim() || '',
        requestingAdminEmail: emailAddress.trim(),
        requestingAdminPhone: verifiedPhone,
        contactPersonName: organizerName.trim(),
        institutionAddress: institutionAddress.trim() || '',

        // Section D
        websiteUrl: websiteUrl.trim() || '',
        previousFestDetails: previousFestDetails.trim() || '',
        additionalMessage: additionalMessage.trim() || '',
        supportingDocumentUrl: supportingDocumentUrl.trim() || '',
        supportingDocs: supportingDocumentUrl.trim() ? [supportingDocumentUrl.trim()] : [],

        // Lifecycle & Scrutiny
        status: 'pending',
        workspaceStatus: 'pending_approval',
        submissionDate: nowIso.slice(0, 10),
        createdAt: nowIso,
        updatedAt: nowIso,
        history: [
          {
            date: nowFormatted,
            actor: organizerName.trim(),
            action: 'Submitted Application',
            note: `Application submitted for "${festName.trim()}" on behalf of "${institution.trim()}".`
          }
        ]
      };

      // 4. Save to Firestore collection `fest_requests`
      const submitRes = await submitFestApplication(newApplication);
      if (!submitRes.success) {
        setErrorMessage(submitRes.message || 'Failed to submit application to Firestore.');
        setLoading(false);
        return;
      }

      setGeneratedAppId(newAppId);
      setSubmissionStep('success');
      addToast(
        'success',
        'Fest Application Submitted',
        `Proposal for "${festName.trim()}" received under ID ${newAppId}.`
      );
    } catch (err: any) {
      console.error('[CreateFestModal] Submission error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // TRACK APPLICATION HANDLERS
  // ------------------------------------------
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError('');
    setTrackedApplication(null);

    const q = trackingQuery.trim();
    if (!q) {
      setTrackingError('Please enter your Application ID or registered Mobile Number.');
      return;
    }

    setTrackingLoading(true);
    try {
      if (q.toUpperCase().startsWith('APP-') || q.toUpperCase().startsWith('REQ-')) {
        const found = await fetchFestApplicationById(q);
        if (found) {
          setTrackedApplication(found);
        } else {
          setTrackingError(`No application found matching ID "${q}". Please check the ID and try again.`);
        }
      } else {
        const foundList = await fetchFestApplicationsByPhone(q);
        if (foundList && foundList.length > 0) {
          setTrackedApplication(foundList[0]);
        } else {
          setTrackingError(`No applications found for phone number "${q}".`);
        }
      }
    } catch (err: any) {
      setTrackingError('Error retrieving application status. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedAppId) return;
    navigator.clipboard.writeText(generatedAppId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status: FestRequestStatus) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'approved':
      case 'workspace_created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>APPROVED & WORKSPACE READY</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>REJECTED</span>
          </span>
        );
      case 'more_info_required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>MORE INFORMATION REQUIRED</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>UNDER REVIEW</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>PENDING SUPER ADMIN APPROVAL</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={FESTORIA_LOGO}
              alt="Festoria Logo"
              onError={handleLogoError}
              className="w-9 h-9 rounded-lg object-contain border border-slate-700 bg-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Create New Fest / Organise a Fest
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  Super Admin Approval Required
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Apply to host your institution's premier festival with autonomous scoring, houses, and schedule management.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs: Apply vs Track */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'apply'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Submit Application</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'track'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <span>Track Existing Application</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
            {errorMessage.includes('Firebase Console') && (
              <a
                href="https://console.firebase.google.com/project/festoria-cd375/authentication/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-6.5 inline-flex items-center gap-1 text-[11px] font-bold text-rose-900 underline hover:text-black"
              >
                <span>Open Firebase Console Sign-in Providers</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 max-h-[75dvh] overflow-y-auto">
          {/* ========================================================= */}
          {/* TAB 1: SUBMIT APPLICATION */}
          {/* ========================================================= */}
          {activeTab === 'apply' && (
            <div>
              {/* STAGE A: ORGANIZER PASSWORD AUTHENTICATION */}
              {submissionStep === 'auth' && (
                <div className="max-w-md mx-auto py-4 space-y-5">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6 text-slate-700" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Organizer Authentication
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      To preserve platform integrity and securely assign you as the authoritative Fest Admin upon Super Admin approval, please authenticate with your account credentials.
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 rounded-md transition-all ${
                        authMode === 'signin'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 rounded-md transition-all ${
                        authMode === 'register'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Register New Account
                    </button>
                  </div>

                  {authMode === 'signin' ? (
                    <form onSubmit={handleOrganizerSignIn} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Email Address or Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="name@college.edu or 98401 23001"
                            value={emailAddress || mobileNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.includes('@')) {
                                setEmailAddress(val);
                              } else {
                                setMobileNumber(val);
                                setEmailAddress(val);
                              }
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                          />
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Account Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            placeholder="Enter password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                      >
                        {loading ? (
                          <span>Verifying Credentials...</span>
                        ) : (
                          <>
                            <span>Sign In & Proceed</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleOrganizerRegister} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Full Legal Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. K. Ramanathan"
                          value={organizerName}
                          onChange={(e) => setOrganizerName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Official Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="convenor@college.edu"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Mobile Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="98401 23001"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Password (Min 6) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Create password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Confirm Password <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Confirm password"
                            value={authConfirmPassword}
                            onChange={(e) => setAuthConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 mt-1"
                      >
                        {loading ? (
                          <span>Creating Account...</span>
                        ) : (
                          <>
                            <span>Create Account & Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* STAGE B: MULTI-SECTION APPLICATION FORM */}
              {submissionStep === 'form' && (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Verified Identity Pill */}
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Verified Organizer Mobile: <strong className="font-mono">{formatPhoneDisplay(verifiedPhone || '')}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      UID: {verifiedUid?.slice(0, 8)}...
                    </span>
                  </div>

                  {/* SECTION A: FEST INFORMATION */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>SECTION A – FEST INFORMATION</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Fest Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tarang 2026 / Vibrance '26"
                          value={festName}
                          onChange={(e) => setFestName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Short Name / Abbr.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TRG-26"
                          value={shortName}
                          onChange={(e) => setShortName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Fest Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="Cultural & Arts">Cultural & Arts</option>
                          <option value="Technical & Coding">Technical & Coding</option>
                          <option value="Management & Business">Management & Business</option>
                          <option value="Sports & Athletics">Sports & Athletics</option>
                          <option value="Literature & Debating">Literature & Debating</option>
                          <option value="Multi-Disciplinary Summit">Multi-Disciplinary Summit</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Institution / Organization Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. National Institute of Technology, Trichy"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Fest Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Provide an overview of the festival's purpose, scope, and competitions..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Fest Logo URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://yourcollege.edu/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* SECTION B: EVENT DETAILS */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span>SECTION B – EVENT DETAILS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Fest Start Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Fest End Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Registration Start Date
                        </label>
                        <input
                          type="date"
                          value={registrationStartDate}
                          onChange={(e) => setRegistrationStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Registration End Date
                        </label>
                        <input
                          type="date"
                          value={registrationEndDate}
                          onChange={(e) => setRegistrationEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Venue / Campus Location <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Main Auditorium & Open Air Theatre"
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Expected Participants
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="10000"
                          value={expectedParticipants}
                          onChange={(e) => setExpectedParticipants(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION C: ORGANIZER INFORMATION */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <User className="w-4 h-4 text-slate-600" />
                      <span>SECTION C – ORGANIZER INFORMATION</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Organizer Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Rajesh Kumar"
                          value={organizerName}
                          onChange={(e) => setOrganizerName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Designation <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Convenor / Dean of Student Affairs"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Verified Mobile Number (Read-Only)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={formatPhoneDisplay(verifiedPhone || '')}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-xs font-mono text-slate-700 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Official Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="convenor@institution.edu"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Institution Campus Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tanjore Main Road, National Highway 67, Tiruchirappalli, Tamil Nadu"
                        value={institutionAddress}
                        onChange={(e) => setInstitutionAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* SECTION D: ADDITIONAL INFORMATION */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Briefcase className="w-4 h-4 text-slate-600" />
                      <span>SECTION D – ADDITIONAL INFORMATION (OPTIONAL)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Official Website / Social Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://fest.college.edu"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Previous Fest Details / Footfall Heritage
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Previous editions attracted 3,000+ delegates across 40 universities..."
                        value={previousFestDetails}
                        onChange={(e) => setPreviousFestDetails(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Supporting Document / Institutional Approval Link (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/... or sanction letter link"
                        value={supportingDocumentUrl}
                        onChange={(e) => setSupportingDocumentUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Additional Message for Super Admin Reviewer
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Any special notes regarding dates, stage arrangements, or preliminary sanction..."
                        value={additionalMessage}
                        onChange={(e) => setAdditionalMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting Proposal...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Submit Fest Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STAGE C: SUCCESS CONFIRMATION */}
              {submissionStep === 'success' && (
                <div className="text-center space-y-6 py-4 max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      STATUS: PENDING SUPER ADMIN APPROVAL
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 pt-2">
                      Fest Application Successfully Registered!
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your proposal to host <span className="font-semibold text-slate-900">"{festName}"</span> for{' '}
                      <span className="font-semibold text-slate-900">{institution}</span> has been saved in the
                      Festoria Governance Pipeline.
                    </p>
                  </div>

                  {/* Unique ID Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Unique Application Identifier:</span>
                      <span className="text-slate-400">Save for status tracking</span>
                    </div>
                    <div className="flex items-center justify-between bg-white px-3 py-2 border border-slate-200 rounded">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {generatedAppId}
                      </span>
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        {copiedId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-left text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-slate-600" />
                      <span>Next Steps in the Approval Pipeline:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>Super Admins will review your institutional credentials and dates.</li>
                      <li>
                        <strong>Automatic Admin Assignment:</strong> Upon Super Admin approval, your verified account (
                        <span className="font-mono">{formatPhoneDisplay(verifiedPhone || '')}</span>) will automatically be assigned as the Fest Administrator for your new workspace.
                      </li>
                      <li>You can track the live review status anytime using the "Track Application" tab above.</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingQuery(generatedAppId);
                        setActiveTab('track');
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Track This Application
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TRACK APPLICATION STATUS */}
          {/* ========================================================= */}
          {activeTab === 'track' && (
            <div className="space-y-6 max-w-xl mx-auto py-2">
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Track Fest Application Status
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your unique Application ID (e.g. APP-2026-XXXX) or registered mobile number to view real-time governance status.
                </p>
              </div>

              {/* Search Box */}
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Application ID (APP-...) or Phone (+91...)"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackingLoading || !trackingQuery.trim()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {trackingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </form>

              {trackingError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{trackingError}</span>
                </div>
              )}

              {/* Tracked Record Display Card */}
              {trackedApplication && (
                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {trackedApplication.festName} {trackedApplication.edition}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {trackedApplication.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {trackedApplication.institution}
                      </p>
                    </div>
                    <div>{getStatusBadge(trackedApplication.status)}</div>
                  </div>

                  {/* Summary Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Category</span>
                      <span className="font-semibold text-slate-800">{trackedApplication.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Proposed Dates</span>
                      <span className="font-semibold text-slate-800">{trackedApplication.startDate} to {trackedApplication.endDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Organizer</span>
                      <span className="font-semibold text-slate-800">{trackedApplication.requestingAdminName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Submission Date</span>
                      <span className="font-semibold text-slate-800">{trackedApplication.submissionDate}</span>
                    </div>
                  </div>

                  {/* Status-Specific Feedback */}
                  {trackedApplication.status === 'more_info_required' && trackedApplication.moreInfoMessage && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-700" />
                        <span>Action Required: More Information Requested by Super Admin</span>
                      </div>
                      <p className="text-amber-800">{trackedApplication.moreInfoMessage}</p>
                    </div>
                  )}

                  {trackedApplication.status === 'rejected' && trackedApplication.rejectionReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                      <div className="font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-700" />
                        <span>Rejection Reason</span>
                      </div>
                      <p className="text-rose-800">{trackedApplication.rejectionReason}</p>
                    </div>
                  )}

                  {(trackedApplication.status === 'approved' || trackedApplication.status === 'workspace_created') && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-3">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Fest Approved & Admin Workspace Provisioned!</span>
                      </div>
                      <p className="text-emerald-800 leading-relaxed">
                        Workspace <strong className="font-mono">{trackedApplication.allocatedFestId}</strong> has been initialized. You are designated as the official Fest Administrator.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          // Find user or switch to admin
                          const adminUser = users.find((u) => u.id === trackedApplication.requestingAdminId);
                          if (adminUser) {
                            switchCurrentUser(adminUser.id, adminUser);
                          }
                          switchPortal('fest_admin');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sign In to Fest Admin Dashboard</span>
                      </button>
                    </div>
                  )}

                  {/* Audit Trail History */}
                  {trackedApplication.history && trackedApplication.history.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700 block">Governance Activity Trail:</span>
                      <div className="space-y-1.5">
                        {trackedApplication.history.map((h, i) => (
                          <div key={i} className="flex items-start justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded">
                            <div>
                              <strong className="text-slate-800">{h.action}</strong> by {h.actor}
                              {h.note && <div className="text-slate-600 mt-0.5">{h.note}</div>}
                            </div>
                            <span className="font-mono text-slate-400 shrink-0 ml-2">{h.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
