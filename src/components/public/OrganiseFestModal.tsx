import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import {
  formatPhoneDisplay,
  normalizePhoneNumber
} from '../../services/authService';
import {
  requestFirebasePhoneOtp
} from '../../firebase/authService';
import {
  verifyApplicantPhoneVerification
} from '../../firebase/authService';
import {
  checkDuplicateFestApplication,
  submitFestApplication
} from '../../firebase/firestoreService';
import { FestRequest } from '../../types';
import { useFest } from '../../context/FestContext';

interface OrganiseFestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrganiseFestModal: React.FC<OrganiseFestModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useFest();

  // Form State
  const [institutionName, setInstitutionName] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [proposedFestName, setProposedFestName] = useState('');
  const [festDescription, setFestDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState(500);
  const [supportingDocumentUrl, setSupportingDocumentUrl] = useState('');

  // Workflow State
  // steps: 'form' -> 'verify_otp' -> 'success'
  const [currentStep, setCurrentStep] = useState<'form' | 'verify_otp' | 'success'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [generatedRequestId, setGeneratedRequestId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Authenticated state after phone verification
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('form');
      setOtpCode('');
      setOtpSent(false);
      setLoading(false);
      setErrorMessage('');
      setGeneratedRequestId('');
      setCopiedId(false);
    }
  }, [isOpen]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const validateBasicForm = (): string | null => {
    if (!institutionName.trim()) return 'Institution Name is required.';
    if (!institutionAddress.trim()) return 'Institution Address is required.';
    if (!contactPersonName.trim()) return "Contact Person's Full Name is required.";
    const normPhone = normalizePhoneNumber(mobileNumber);
    if (!normPhone || normPhone.length < 10) return 'Please enter a valid 10-digit mobile number.';
    if (!emailAddress.trim() || !emailAddress.includes('@')) return 'Please enter a valid official email address.';
    if (!proposedFestName.trim()) return 'Proposed Fest Name is required.';
    if (!festDescription.trim() || festDescription.trim().length < 20) {
      return 'Please enter a descriptive summary of your fest (at least 20 characters).';
    }
    if (!startDate) return 'Expected Start Date is required.';
    if (!endDate) return 'Expected End Date is required.';
    if (new Date(endDate) < new Date(startDate)) {
      return 'End Date cannot be earlier than Start Date.';
    }
    return null;
  };

  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validationError = validateBasicForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      // 1. Prevent duplicate pending applications from same institution
      const dupCheck = await checkDuplicateFestApplication(institutionName, mobileNumber);
      if (dupCheck.isDuplicate) {
        setErrorMessage(
          `A pending fest application (${dupCheck.existingRequest?.id || 'In Review'}) is already registered for "${institutionName}". Duplicate applications are not allowed while one is pending review.`
        );
        setLoading(false);
        return;
      }

      // 2. Request Firebase Phone OTP
      const res = await requestFirebasePhoneOtp(mobileNumber, 'auto', 'organise-recaptcha-container');
      if (res.success) {
        setOtpSent(true);
        setCurrentStep('verify_otp');
        setCooldown(res.cooldownSeconds || 30);
      } else {
        setErrorMessage(res.message || 'Failed to send verification SMS.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while initiating phone verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await requestFirebasePhoneOtp(mobileNumber, 'auto', 'organise-recaptcha-container');
      if (res.success) {
        setCooldown(res.cooldownSeconds || 30);
      } else {
        setErrorMessage(res.message || 'Failed to resend verification SMS.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit SMS verification code.');
      return;
    }

    setLoading(true);
    try {
      // 1. Authoritative Firebase Phone Verification
      const verifyRes = await verifyApplicantPhoneVerification(mobileNumber, otpCode.trim());
      if (!verifyRes.success || !verifyRes.uid) {
        setErrorMessage(verifyRes.message || 'Invalid or expired verification code.');
        setLoading(false);
        return;
      }

      const uid = verifyRes.uid;
      const verifiedNormalizedPhone = verifyRes.phone || normalizePhoneNumber(mobileNumber);
      setVerifiedUid(uid);
      setVerifiedPhone(verifiedNormalizedPhone);

      // 2. Double-check duplicates before final commit
      const dupCheck = await checkDuplicateFestApplication(institutionName, verifiedNormalizedPhone);
      if (dupCheck.isDuplicate) {
        setErrorMessage(
          `A pending application already exists for "${institutionName}". Submission prevented.`
        );
        setLoading(false);
        return;
      }

      // 3. Generate unique Request ID
      const timestampSuffix = Math.floor(1000 + Math.random() * 9000);
      const newRequestId = `REQ-2026-${timestampSuffix}`;

      // 4. Construct FestRequest record
      const newApplication: FestRequest = {
        id: newRequestId,
        festName: proposedFestName.trim(),
        edition: '2026',
        description: festDescription.trim(),
        institution: institutionName.trim(),
        institutionAddress: institutionAddress.trim(),
        contactPersonName: contactPersonName.trim(),
        category: 'Inter-Collegiate Cultural Fest',
        venue: institutionAddress.trim(),
        startDate,
        endDate,
        expectedParticipants: Number(expectedParticipants) || 500,
        plannedProgrammesCount: 20,
        requestingAdminId: uid,
        requestingAdminName: contactPersonName.trim(),
        requestingAdminEmail: emailAddress.trim(),
        requestingAdminPhone: verifiedNormalizedPhone,
        status: 'pending',
        submissionDate: new Date().toISOString(),
        supportingDocumentUrl: supportingDocumentUrl.trim() || undefined,
        supportingDocs: supportingDocumentUrl.trim() ? [supportingDocumentUrl.trim()] : [],
        history: [
          {
            date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            actor: contactPersonName.trim(),
            action: 'Submitted Fest Application',
            note: `Application submitted for "${proposedFestName.trim()}" on behalf of "${institutionName.trim()}".`
          }
        ]
      };

      // 5. Persist to Firestore & Local state
      const saveRes = await submitFestApplication(newApplication);
      if (!saveRes.success) {
        setErrorMessage(saveRes.message || 'Failed to submit application to Firestore.');
        setLoading(false);
        return;
      }

      setGeneratedRequestId(newRequestId);
      setCurrentStep('success');
      addToast(
        'success',
        'Fest Application Submitted',
        `Proposal for "${proposedFestName.trim()}" received under ID ${newRequestId}.`
      );
    } catch (err: any) {
      console.error('[OrganiseFestModal] Submission error:', err);
      setErrorMessage(err.message || 'Submission encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedRequestId) return;
    navigator.clipboard.writeText(generatedRequestId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Invisible container for Firebase ReCAPTCHA */}
      <div id="organise-recaptcha-container" className="hidden" />

      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Organise a Fest / Become a Fest Admin
              </h2>
              <p className="text-xs text-slate-400">
                Host your college or university festival on Festoria's platform
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

        {/* Progress Bar / Step indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 'form'
                  ? 'bg-slate-900 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentStep !== 'form' ? '✓' : '1'}
            </span>
            <span className={currentStep === 'form' ? 'text-slate-900 font-bold' : ''}>
              Institution & Fest Proposal
            </span>
          </div>

          <div className="w-8 h-px bg-slate-300" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 'verify_otp'
                  ? 'bg-slate-900 text-white'
                  : currentStep === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep === 'success' ? '✓' : '2'}
            </span>
            <span className={currentStep === 'verify_otp' ? 'text-slate-900 font-bold' : ''}>
              Phone Verification
            </span>
          </div>

          <div className="w-8 h-px bg-slate-300" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </span>
            <span className={currentStep === 'success' ? 'text-emerald-700 font-bold' : ''}>
              Confirmation
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: FORM */}
          {currentStep === 'form' && (
            <form onSubmit={handleProceedToVerification} className="space-y-5">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Building className="w-4 h-4 text-slate-600" />
                  <span>1. Institution & Applicant Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Institution / College Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. National Institute of Technology"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contact Person Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. David Miller / Convenor"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Institution Address & Campus Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Road, Sector 5, Bangalore, Karnataka"
                    value={institutionAddress}
                    onChange={(e) => setInstitutionAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number (for SMS OTP) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Firebase Phone OTP verification will be required in the next step.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Official Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@institution.edu"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>2. Proposed Festival Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Proposed Fest Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tarang 2026 / Revels '26"
                      value={proposedFestName}
                      onChange={(e) => setProposedFestName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fest Description & Theme <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Outline the festival objective, intended competitive categories (dance, music, literary, drama, fine arts), and historical reach..."
                    value={festDescription}
                    onChange={(e) => setFestDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Expected Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Expected End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supporting Document / Institutional Approval Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or institutional website sanction letter"
                    value={supportingDocumentUrl}
                    onChange={(e) => setSupportingDocumentUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Provide a verifiable institutional sanction letter, college website notice, or authorization document.
                  </p>
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Proposal...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Phone Verification</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PHONE OTP VERIFICATION */}
          {currentStep === 'verify_otp' && (
            <form onSubmit={handleVerifyAndSubmit} className="space-y-6 max-w-md mx-auto py-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Verify Applicant Mobile Number
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We have dispatched a 6-digit verification code to{' '}
                  <span className="font-semibold text-slate-800">
                    {formatPhoneDisplay(mobileNumber)}
                  </span>
                  . Please enter it below to authenticate your identity and submit the proposal.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 text-center">
                  6-Digit SMS Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep('form')}
                  className="hover:underline"
                >
                  ← Edit details or number
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  className="text-slate-900 font-semibold hover:underline disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Confirm Verification & Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6 py-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  STATUS: PENDING SUPER ADMIN APPROVAL
                </span>
                <h3 className="text-lg font-bold text-slate-900 pt-2">
                  Application Logged Successfully
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your proposal to organise{' '}
                  <span className="font-semibold text-slate-900">"{proposedFestName}"</span> on behalf
                  of <span className="font-semibold text-slate-900">{institutionName}</span> has been
                  safely registered in the Festoria Governance Pipeline.
                </p>
              </div>

              {/* Request ID Display Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Unique Request Identifier:</span>
                  <span className="text-slate-400">Save for status tracking</span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 border border-slate-200 rounded">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {generatedRequestId}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-left text-xs text-slate-500 bg-slate-50/70 p-3.5 rounded border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-700">What happens next?</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                  <li>Platform Super Admins will review your institutional details and dates.</li>
                  <li>Duplicate submissions for the same institution are prevented during review.</li>
                  <li>Upon approval, your Fest Admin privileges will be initialized and you will receive access to manage programmes, schedules, houses, and scoring.</li>
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Return to Festoria Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
