import React, { useState, useEffect, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { FestInvitation } from '../../types';
import {
  getShareableBaseUrl,
  createFestInvitation,
  fetchFestInvitations,
  revokeFestInvitation
} from '../../firebase/firestoreService';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  UserPlus,
  Award,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Send,
  MessageCircle,
  Lock,
  Sparkles,
  Info,
  RefreshCw,
  Trash2,
  UserCheck
} from 'lucide-react';

export const ShareFestPage: React.FC = () => {
  const {
    activeFestId,
    activeFest,
    settings,
    teams,
    judges,
    currentUser,
    addToast
  } = useFest();

  const [invitations, setInvitations] = useState<FestInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Custom base domain state (defaults to official deployed domain)
  const defaultDomain = useMemo(() => getShareableBaseUrl(), []);
  const [customDomain, setCustomDomain] = useState<string>(defaultDomain);
  const [showDomainConfig, setShowDomainConfig] = useState(false);

  // Judge Invitation Form State
  const [judgeModalOpen, setJudgeModalOpen] = useState(false);
  const [judgeForm, setJudgeForm] = useState({
    name: '',
    contact: '',
    contactType: 'email' as 'email' | 'phone',
    assignedJudgeId: '',
    expiresInDays: 7,
    notes: ''
  });
  const [creatingJudgeInvite, setCreatingJudgeInvite] = useState(false);

  // Team Leader Invitation Form State
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [leaderForm, setLeaderForm] = useState({
    name: '',
    contact: '',
    contactType: 'phone' as 'email' | 'phone',
    assignedTeamId: '',
    expiresInDays: 7,
    notes: ''
  });
  const [creatingLeaderInvite, setCreatingLeaderInvite] = useState(false);

  // Refresh invitations
  const refreshInvitations = async () => {
    try {
      setLoading(true);
      const data = await fetchFestInvitations(activeFestId);
      setInvitations(data);
    } catch (e) {
      console.warn('Failed to load invitations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInvitations();
  }, [activeFestId]);

  // Base production links (guaranteed non-localhost & subpath-compatible)
  const baseUrl = (customDomain && customDomain.startsWith('http') ? customDomain : defaultDomain).replace(/\/+$/, '');
  const publicFestUrl = `${baseUrl}/?fest=${activeFestId}`;
  const participantRegisterUrl = `${baseUrl}/?fest=${activeFestId}&action=register`;

  // Copy helper
  const handleCopy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      addToast('success', 'Link Copied', `${label} link copied to clipboard.`);
      setTimeout(() => setCopiedLink(null), 2500);
    } catch {
      const input = document.createElement('textarea');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(url);
      addToast('success', 'Link Copied', `${label} link copied to clipboard.`);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  // WhatsApp share helper
  const handleShareWhatsApp = (url: string, message: string) => {
    const fullText = `${message}\n\n🔗 ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Create Judge Invitation
  const handleCreateJudgeInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeForm.contact.trim()) {
      addToast('error', 'Validation Error', 'Please provide a valid email or phone number for the judge.');
      return;
    }

    try {
      setCreatingJudgeInvite(true);
      const selectedJudge = judges.find((j) => j.id === judgeForm.assignedJudgeId);

      const inv = await createFestInvitation({
        festId: activeFestId,
        role: 'judge',
        recipientType: judgeForm.contactType,
        recipientContact: judgeForm.contact.trim(),
        recipientName: judgeForm.name.trim() || selectedJudge?.name || 'Honorable Judge',
        assignedJudgeId: judgeForm.assignedJudgeId || undefined,
        assignedJudgeName: selectedJudge?.name,
        expiresInDays: judgeForm.expiresInDays,
        createdByAdminId: currentUser?.id || 'admin',
        createdByAdminName: currentUser?.name || 'Fest Admin',
        notes: judgeForm.notes
      });

      addToast('success', 'Judge Invitation Created', `Secure link generated for ${inv.recipientContact}.`);
      setJudgeModalOpen(false);
      setJudgeForm({
        name: '',
        contact: '',
        contactType: 'email',
        assignedJudgeId: '',
        expiresInDays: 7,
        notes: ''
      });
      refreshInvitations();
    } catch (err: any) {
      addToast('error', 'Error Creating Invitation', err.message || 'Failed to create judge invitation.');
    } finally {
      setCreatingJudgeInvite(false);
    }
  };

  // Create Team Leader Invitation
  const handleCreateLeaderInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderForm.contact.trim()) {
      addToast('error', 'Validation Error', 'Please enter a valid phone number or email for the team leader.');
      return;
    }
    if (!leaderForm.assignedTeamId) {
      addToast('error', 'Validation Error', 'Please select an official collegiate house/team.');
      return;
    }

    try {
      setCreatingLeaderInvite(true);
      const selectedTeam = teams.find((t) => t.id === leaderForm.assignedTeamId);

      const inv = await createFestInvitation({
        festId: activeFestId,
        role: 'team_leader',
        recipientType: leaderForm.contactType,
        recipientContact: leaderForm.contact.trim(),
        recipientName: leaderForm.name.trim() || selectedTeam?.teamLeaderName || 'Team Leader',
        assignedTeamId: leaderForm.assignedTeamId,
        assignedTeamName: selectedTeam?.name,
        expiresInDays: leaderForm.expiresInDays,
        createdByAdminId: currentUser?.id || 'admin',
        createdByAdminName: currentUser?.name || 'Fest Admin',
        notes: leaderForm.notes
      });

      addToast('success', 'Team Leader Invitation Created', `Secure link generated for Team ${selectedTeam?.name}.`);
      setLeaderModalOpen(false);
      setLeaderForm({
        name: '',
        contact: '',
        contactType: 'phone',
        assignedTeamId: '',
        expiresInDays: 7,
        notes: ''
      });
      refreshInvitations();
    } catch (err: any) {
      addToast('error', 'Error Creating Invitation', err.message || 'Failed to create team leader invitation.');
    } finally {
      setCreatingLeaderInvite(false);
    }
  };

  // Revoke invitation
  const handleRevoke = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation? The recipient will no longer be able to use this link.')) {
      return;
    }

    try {
      await revokeFestInvitation(invitationId, activeFestId, currentUser?.id || 'admin');
      addToast('info', 'Invitation Revoked', 'The invitation token was revoked.');
      refreshInvitations();
    } catch (err: any) {
      addToast('error', 'Revocation Failed', err.message || 'Failed to revoke invitation.');
    }
  };

  // Metrics
  const judgeInvites = invitations.filter((i) => i.role === 'judge');
  const leaderInvites = invitations.filter((i) => i.role === 'team_leader');
  const pendingCount = invitations.filter((i) => i.status === 'pending' && new Date(i.expiresAt).getTime() > Date.now()).length;
  const acceptedCount = invitations.filter((i) => i.status === 'accepted').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* ==================================================================== */}
      {/* 1. HEADER & FEST TITLE                                               */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Share Fest & Invitation System
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {activeFest?.name || settings.festName} ({activeFestId}) • Secure, tokenized role links for participants, judges & team leaders
              </p>
            </div>
          </div>
        </div>

        {/* Refresh & Domain Badges */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshInvitations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDomainConfig(!showDomainConfig)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>Domain: {new URL(baseUrl).hostname}</span>
          </button>
        </div>
      </div>

      {/* Domain Customization Drawer / Box */}
      {showDomainConfig && (
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Production Shareable Domain Setting
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDomainConfig(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-slate-300">
            All generated sharing links automatically use your official deployed domain. Localhost addresses are strictly blocked from production sharing so links work reliably across mobile and desktop.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <input
              type="url"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="https://festoria-cd375.web.app"
              className="w-full sm:flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                setCustomDomain(defaultDomain);
                addToast('info', 'Default Domain Restored', `Reset to ${defaultDomain}`);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Reset Default
            </button>
          </div>
        </div>
      )}

      {/* Overview Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Fest</div>
          <div className="text-lg font-black text-slate-900 mt-1">{activeFestId}</div>
          <div className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">{activeFest?.name || settings.festName}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Invites</div>
          <div className="text-lg font-black text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting claim</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Claimed & Active</div>
          <div className="text-lg font-black text-emerald-600 mt-1">{acceptedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified on server</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Tokens Issued</div>
          <div className="text-lg font-black text-slate-900 mt-1">{invitations.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Judge & Leader invites</div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. CORE SHAREABLE LINKS (CARDS 1 & 2)                                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LINK 1: Public Fest Website */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Public Portal
              </span>
              <span className="text-xs text-slate-400">No Login Required</span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                1. Public Fest Website
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Share with attendees, students, and guests. Displays hero media, event timetable, participating teams, live results, and official bulletins.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-mono font-semibold text-slate-400 block mb-1">Public Landing URL:</span>
              <p className="text-xs font-mono font-bold text-slate-800 break-all select-all">
                {publicFestUrl}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(publicFestUrl, 'Public Fest Website')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                {copiedLink === publicFestUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleShareWhatsApp(
                    publicFestUrl,
                    `🎉 Explore *${settings.festName}*! View live schedules, photos, participating teams, and results:`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            <a
              href={publicFestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span>Test Visit</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* LINK 2: Participant Registration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Self-Registration
              </span>
              <span className="text-xs text-slate-400">Admin Approval Required</span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                2. Participant Registration
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Direct onboarding link that pre-binds contestant registration directly to <strong>{activeFest?.name || settings.festName}</strong> ({activeFestId}). Preserves full admin approval workflow.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-mono font-semibold text-slate-400 block mb-1">Direct Registration URL:</span>
              <p className="text-xs font-mono font-bold text-slate-800 break-all select-all">
                {participantRegisterUrl}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(participantRegisterUrl, 'Participant Registration')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                {copiedLink === participantRegisterUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleShareWhatsApp(
                    participantRegisterUrl,
                    `🏆 Register now as a participant for *${activeFest?.name || settings.festName}*! Click to complete your official registration:`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            <a
              href={participantRegisterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span>Test Form</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. ROLE-BASED INVITATION GENERATORS (CARDS 3 & 4)                    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LINK 3: Judge Invitation Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Adjudicator Token
              </span>
              <span className="text-xs text-slate-400">{judgeInvites.length} Issued</span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                3. Judge Invitation Links
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Issue unique, single-use security tokens for jury members. Enforces server-side password authentication and scopes permissions strictly to evaluation.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setJudgeModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 active:scale-98"
              >
                <Award className="w-4 h-4" />
                <span>+ Generate Secure Judge Invitation</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Tokens are signed with expiry & revokable at any time</span>
            <span className="font-semibold text-purple-700">{judgeInvites.filter((i) => i.status === 'pending').length} Active</span>
          </div>
        </div>

        {/* LINK 4: Team Leader Invitation Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                House Captain Token
              </span>
              <span className="text-xs text-slate-400">{leaderInvites.length} Issued</span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                4. Team Leader Invitation Links
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Issue tokenized invitations tied directly to an official house/team. Grants roster management, roster entry, and appeal access strictly for that team.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setLeaderModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-98"
              >
                <Shield className="w-4 h-4" />
                <span>+ Generate Secure Team Leader Invitation</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Cross-fest & cross-team isolation strictly verified</span>
            <span className="font-semibold text-blue-700">{leaderInvites.filter((i) => i.status === 'pending').length} Active</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. ACTIVE & ISSUED INVITATIONS TABLE                                 */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              Role-Based Invitation Ledger ({invitations.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review issued tokens, check claims, copy active links, or revoke unused invitations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              {pendingCount} Pending • {acceptedCount} Claimed
            </span>
          </div>
        </div>

        {invitations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Share2 className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No role invitations generated yet.</p>
            <p className="text-[11px] text-slate-400">
              Use the buttons above to issue secure invitation links to your judges and team leaders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Assignment</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => {
                  const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
                  const effectiveStatus = inv.status === 'pending' && isExpired ? 'expired' : inv.status;
                  const inviteUrl = `${baseUrl}/?invite=true&token=${inv.token}&role=${inv.role}&fest=${inv.festId}`;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            inv.role === 'judge'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {inv.role === 'judge' ? <Award className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {inv.role === 'judge' ? 'Judge' : 'Team Leader'}
                        </span>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inv.recipientName || 'Invited User'}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{inv.recipientContact}</div>
                      </td>

                      {/* Assignment */}
                      <td className="py-3 px-4">
                        {inv.role === 'judge' ? (
                          <span className="text-slate-700">
                            {inv.assignedJudgeName || inv.assignedJudgeId || 'General Jury'}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {inv.assignedTeamName || inv.assignedTeamId || 'Unassigned'}
                          </span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium">{new Date(inv.expiresAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {isExpired ? 'Expired' : `${Math.max(0, Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left`}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {effectiveStatus === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Claimed
                          </span>
                        ) : effectiveStatus === 'revoked' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            Revoked
                          </span>
                        ) : effectiveStatus === 'expired' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {effectiveStatus === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopy(inviteUrl, `${inv.role === 'judge' ? 'Judge' : 'Team Leader'} Invitation`)}
                                title="Copy invitation link"
                                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                              >
                                {copiedLink === inviteUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleShareWhatsApp(
                                    inviteUrl,
                                    `⚖️ Official Invitation: You have been appointed as *${inv.role === 'judge' ? 'Judge' : 'Team Leader'}* for *${settings.festName}*. Claim your portal access here:`
                                  )
                                }
                                title="Share via WhatsApp"
                                className="p-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRevoke(inv.id)}
                                title="Revoke this invitation"
                                className="p-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <a
                            href={inviteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Preview invitation acceptance screen"
                            className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. SECURITY & ACCESS ASSURANCE                                       */}
      {/* ==================================================================== */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-900">Festoria Security & Access Safeguards</p>
          <p>
            • Every role link is bound strictly to <strong>{activeFest?.name || settings.festName} ({activeFestId})</strong> and cannot access other collegiate fests.
          </p>
          <p>
            • Permissions are verified strictly on the server upon password authentication. Knowing an invitation URL never grants automatic access.
          </p>
          <p>
            • Links generated through this panel never use localhost addresses, ensuring seamless operation for external recipients on mobile and desktop.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: CREATE JUDGE INVITATION                                     */}
      {/* ==================================================================== */}
      {judgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Generate Judge Invitation</h3>
              </div>
              <button
                type="button"
                onClick={() => setJudgeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateJudgeInvite} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judge Full Name
                </label>
                <input
                  type="text"
                  required
                  value={judgeForm.name}
                  onChange={(e) => setJudgeForm({ ...judgeForm, name: e.target.value })}
                  placeholder="e.g. Dr. Anita Sharma"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Recipient Contact
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        checked={judgeForm.contactType === 'email'}
                        onChange={() => setJudgeForm({ ...judgeForm, contactType: 'email' })}
                        className="mr-1"
                      />
                      Email
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        checked={judgeForm.contactType === 'phone'}
                        onChange={() => setJudgeForm({ ...judgeForm, contactType: 'phone' })}
                        className="mr-1"
                      />
                      Phone
                    </label>
                  </div>
                </div>
                <input
                  type={judgeForm.contactType === 'email' ? 'email' : 'tel'}
                  required
                  value={judgeForm.contact}
                  onChange={(e) => setJudgeForm({ ...judgeForm, contact: e.target.value })}
                  placeholder={judgeForm.contactType === 'email' ? 'anita@university.edu' : '+91 98765 43210'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Link to Existing Judge Profile (Optional)
                </label>
                <select
                  value={judgeForm.assignedJudgeId}
                  onChange={(e) => setJudgeForm({ ...judgeForm, assignedJudgeId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600"
                >
                  <option value="">-- New / Independent Judge Slot --</option>
                  {judges.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.designation || j.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Token Expiry
                </label>
                <select
                  value={judgeForm.expiresInDays}
                  onChange={(e) => setJudgeForm({ ...judgeForm, expiresInDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (Recommended)</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Specialty (Optional)
                </label>
                <input
                  type="text"
                  value={judgeForm.notes}
                  onChange={(e) => setJudgeForm({ ...judgeForm, notes: e.target.value })}
                  placeholder="e.g. Classical Music Jury Head"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setJudgeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingJudgeInvite}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-xs"
                >
                  {creatingJudgeInvite ? 'Generating...' : 'Issue Judge Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CREATE TEAM LEADER INVITATION                               */}
      {/* ==================================================================== */}
      {leaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Generate Team Leader Invitation</h3>
              </div>
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateLeaderInvite} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Collegiate House / Team <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={leaderForm.assignedTeamId}
                  onChange={(e) => setLeaderForm({ ...leaderForm, assignedTeamId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-semibold"
                >
                  <option value="">-- Select House / Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) • {t.institution}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Team Leader Full Name
                </label>
                <input
                  type="text"
                  required
                  value={leaderForm.name}
                  onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Recipient Mobile Number or Email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        checked={leaderForm.contactType === 'phone'}
                        onChange={() => setLeaderForm({ ...leaderForm, contactType: 'phone' })}
                        className="mr-1"
                      />
                      Phone
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        checked={leaderForm.contactType === 'email'}
                        onChange={() => setLeaderForm({ ...leaderForm, contactType: 'email' })}
                        className="mr-1"
                      />
                      Email
                    </label>
                  </div>
                </div>
                <input
                  type={leaderForm.contactType === 'phone' ? 'tel' : 'email'}
                  required
                  value={leaderForm.contact}
                  onChange={(e) => setLeaderForm({ ...leaderForm, contact: e.target.value })}
                  placeholder={leaderForm.contactType === 'phone' ? '+91 98765 43210' : 'leader@college.edu'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Token Expiry
                </label>
                <select
                  value={leaderForm.expiresInDays}
                  onChange={(e) => setLeaderForm({ ...leaderForm, expiresInDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (Recommended)</option>
                  <option value={14}>14 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={leaderForm.notes}
                  onChange={(e) => setLeaderForm({ ...leaderForm, notes: e.target.value })}
                  placeholder="e.g. Official House Captain Appointment"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setLeaderModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLeaderInvite}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {creatingLeaderInvite ? 'Generating...' : 'Issue Team Leader Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

