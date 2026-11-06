import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  FileText,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const SecurityPermissionsPage: React.FC = () => {
  const { currentUser, users, platformSettings } = useFest();

  const [mfaEnabled, setMfaEnabled] = useState(platformSettings.mfaRequired);
  const [bruteForceProtect, setBruteForceProtect] = useState(true);
  const [strictSession, setStrictSession] = useState(true);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-200 rounded p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Security & Platform Defense Architecture</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              LEAST PRIVILEGE ENFORCED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Access policy controls, role boundaries, cryptographic session validation, and database security rules.
          </p>
        </div>
      </div>

      {/* Security Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="border border-slate-200 rounded p-4 bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Session Enforcement</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">Active (TLS 1.3)</div>
          <p className="text-[11px] text-slate-400">Strict SameSite cookies & token signing</p>
        </div>

        <div className="border border-slate-200 rounded p-4 bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Two-Factor Authentication</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {mfaEnabled ? 'Enforced Platform-Wide' : 'Optional for Reviewers'}
          </div>
          <p className="text-[11px] text-slate-400">Required for Super Admin approvals</p>
        </div>

        <div className="border border-slate-200 rounded p-4 bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Audit Trail Verification</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">Append-Only Ledger</div>
          <p className="text-[11px] text-slate-400">Tamper-evident governance history</p>
        </div>
      </div>

      {/* Security Policies Matrix */}
      <div className="border border-slate-200 rounded p-5 bg-white space-y-4 text-xs">
        <h3 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
          Platform Security Controls
        </h3>

        <div className="space-y-3">
          <div className="p-3 border border-slate-200 rounded bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Brute-Force & Credential Stuffing Rate Limiter</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Automatically blocks IP addresses after 5 unsuccessful login attempts within 10 minutes.
              </div>
            </div>
            <input
              type="checkbox"
              checked={bruteForceProtect}
              onChange={(e) => setBruteForceProtect(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="p-3 border border-slate-200 rounded bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Mandatory Multi-Factor Authentication (MFA / 2FA)</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Requires hardware security keys or authenticator apps for all elevated platform roles.
              </div>
            </div>
            <input
              type="checkbox"
              checked={mfaEnabled}
              onChange={(e) => setMfaEnabled(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="p-3 border border-slate-200 rounded bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Strict Inactive Session Invalidation</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Forces session revocation after {platformSettings.sessionTimeoutMinutes} minutes of inactivity.
              </div>
            </div>
            <input
              type="checkbox"
              checked={strictSession}
              onChange={(e) => setStrictSession(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Database Security & Authorization Rules */}
      <div className="border border-slate-200 rounded p-5 bg-white space-y-3 text-xs">
        <h3 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
          Database Collection Security Boundaries
        </h3>
        <p className="text-slate-500 text-xs">
          Trusted backend validation rules enforced across persistent collections.
        </p>

        <div className="border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Collection</th>
                <th className="px-4 py-2.5">Read Privilege</th>
                <th className="px-4 py-2.5">Write Privilege</th>
                <th className="px-4 py-2.5">Audit Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="px-4 py-2 font-mono font-medium text-slate-900">platformSettings</td>
                <td className="px-4 py-2">Super Admin only</td>
                <td className="px-4 py-2 text-rose-700 font-semibold">Super Admin only</td>
                <td className="px-4 py-2 text-emerald-700">Yes (Immediate)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono font-medium text-slate-900">festRequests</td>
                <td className="px-4 py-2">Super Admin & Applicant</td>
                <td className="px-4 py-2">Super Admin & Applicant</td>
                <td className="px-4 py-2 text-emerald-700">Yes (Immediate)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono font-medium text-slate-900">fests</td>
                <td className="px-4 py-2">Public / Authenticated</td>
                <td className="px-4 py-2">Super Admin & Assigned Fest Admin</td>
                <td className="px-4 py-2 text-emerald-700">Yes (Immediate)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono font-medium text-slate-900">scoreSubmissions</td>
                <td className="px-4 py-2">Judges & Fest Admin</td>
                <td className="px-4 py-2">Assigned Judge only</td>
                <td className="px-4 py-2 text-emerald-700">Yes (Revision Log)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono font-medium text-slate-900">auditLogs</td>
                <td className="px-4 py-2">Super Admin only</td>
                <td className="px-4 py-2 text-slate-400 italic">Append-only System Driver</td>
                <td className="px-4 py-2 text-slate-400">N/A (Immutable)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
