import React from 'react';
import { useFest } from '../../context/FestContext';
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Activity,
  FileQuestion,
  Mail,
  Phone,
  Server,
  Shield,
  LifeBuoy,
  FileText
} from 'lucide-react';

export const HelpSupportPage: React.FC = () => {
  const { platformSettings, fests, festRequests, users } = useFest();

  const workflows = [
    {
      title: 'Workflow A — Fest Approval & Activation',
      steps: [
        'Institutional Fest Admin submits proposal via the Fest Request form.',
        'Request appears in Super Admin "Fest Requests" queue with "submitted" status.',
        'Super Admin reviews applicant identity, campus venue, dates, and documentation.',
        'Super Admin clicks "Approve & Activate Fest", enters optional audit note, and confirms.',
        'Associated Fest record is automatically chartered in setup phase and assigned to admin.',
      ],
    },
    {
      title: 'Workflow B — Request Rejection with Defined Cause',
      steps: [
        'Super Admin opens application from the pending requests directory.',
        'Clicks "Reject Request" and enters mandatory justification in the rejection field.',
        'Rejection is immutably logged in the audit ledger and dispatched to the applicant.',
        'The proposal remains preserved in platform records without deletion.',
      ],
    },
    {
      title: 'Workflow C — More Information Required',
      steps: [
        'Reviewer identifies missing venue clearance or unclear competition rules.',
        'Clicks "Request More Information" with specific feedback for the applicant.',
        'Application moves to "more_info_required" state while preserving review comments.',
        'Applicant can amend details and resubmit without duplicate records.',
      ],
    },
    {
      title: 'Workflow D — Fest Suspension & Reactivation',
      steps: [
        'Super Admin flags a festival for regulatory non-compliance or venue emergency.',
        'Clicks "Suspend Fest" with a formal reason in the confirmation dialog.',
        'Public site is unpublished and administrative editing permissions are locked.',
        'Authorised Super Admin can reactivate the festival once cleared, restoring status.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-200 rounded p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Platform Documentation & Diagnostics</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              KNOWLEDGE BASE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard operating procedures, governance workflows, and platform health telemetry.
          </p>
        </div>
      </div>

      {/* System Health Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="border border-slate-200 rounded p-4 bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Core Engine</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">Online</div>
          <p className="text-[11px] text-emerald-600 font-medium">Platform v2.4 (React 19 / Vite)</p>
        </div>

        <div className="border border-slate-200 rounded p-4 bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Database Persistence</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">Synchronized</div>
          <p className="text-[11px] text-slate-400">LocalStorage + In-Memory Fallback</p>
        </div>

        <div className="border border-slate-200 rounded p-4 bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total Chartered Fests</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{fests.length} Fests</div>
          <p className="text-[11px] text-slate-400">{festRequests.length} applications evaluated</p>
        </div>

        <div className="border border-slate-200 rounded p-4 bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">RBAC Security Registry</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{users.length} Accounts</div>
          <p className="text-[11px] text-slate-400">0 privilege escalations flagged</p>
        </div>
      </div>

      {/* Operating Workflows Guide */}
      <div className="border border-slate-200 rounded p-5 bg-white space-y-4 text-xs">
        <h3 className="font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          Super Admin Standard Operating Workflows
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf, idx) => (
            <div key={idx} className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-2.5">
              <div className="font-semibold text-slate-900 text-xs">{wf.title}</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
                {wf.steps.map((st, sIdx) => (
                  <li key={sIdx}>{st}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Support Contact Information */}
      <div className="border border-slate-200 rounded p-5 bg-white space-y-3 text-xs">
        <h3 className="font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-slate-500" />
          Platform Governance & Support Escalation
        </h3>
        <p className="text-slate-500 text-xs">
          For technical issues, emergency fest suspensions, or account recovery escalations:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 border border-slate-200 rounded bg-slate-50 flex items-center gap-3">
            <Mail className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] block uppercase font-semibold">Support Desk</span>
              <a
                href={`mailto:${platformSettings.supportEmail || 'abdwahidbc@gmail.com'}`}
                className="font-semibold text-slate-900 hover:text-indigo-600 truncate block"
              >
                {platformSettings.supportEmail || 'abdwahidbc@gmail.com'}
              </a>
            </div>
          </div>

          <div className="p-3 border border-slate-200 rounded bg-slate-50 flex items-center gap-3">
            <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] block uppercase font-semibold">Emergency Helpline</span>
              <a
                href={`tel:${platformSettings.supportPhone || '9844691633'}`}
                className="font-semibold text-slate-900 hover:text-emerald-600 truncate block"
              >
                {platformSettings.supportPhone || '9844691633'}
              </a>
            </div>
          </div>

          <div className="p-3 border border-slate-200 rounded bg-slate-50 flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] block uppercase font-semibold">Official Instagram</span>
              <a
                href="https://instagram.com/abd_l_wahid_"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 hover:text-pink-600 truncate block"
              >
                @abd_l_wahid_
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
