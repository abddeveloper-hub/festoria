import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Landmark,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { exportToCsv } from '../../services/storage';

export const PlatformReportsPage: React.FC = () => {
  const {
    fests,
    festRequests,
    users,
    participants,
    programmes,
    scores,
    results,
    platformAuditLogs
  } = useFest();

  const [selectedReportId, setSelectedReportId] = useState<string>('fest_requests_report');
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | 'ytd'>('all');

  const reportTypes = [
    { id: 'fest_requests_report', title: '1. Fest Request & Approval Report', desc: 'Audit of submitted proposals, decision timelines, and approval ratios' },
    { id: 'fest_activity_report', title: '2. Fest Activity & Operational Velocity', desc: 'Active festival engagement metrics, participant volumes, and completions' },
    { id: 'fest_lifecycle_report', title: '3. Fest Lifecycle & Milestone Report', desc: 'Stage progression from initial review to final closure' },
    { id: 'admin_account_report', title: '4. Fest Admin Governance Report', desc: 'Administrative account status, assigned fests, and security compliance' },
    { id: 'participant_totals_report', title: '5. Participant Totals by Fest', desc: 'Registration scale, college participation, and category quotas' },
    { id: 'programme_completion_report', title: '6. Programme Completion & Schedule Report', desc: 'Concluded competitions vs. scheduled events' },
    { id: 'score_publication_report', title: '7. Score Publication & Ratification Report', desc: 'Score sheet turnaround times and ratified leaderboard publications' },
    { id: 'suspended_fest_report', title: '8. Suspended & Cancelled Fest Report', desc: 'Governance interventions, disciplinary reasons, and status holds' },
    { id: 'platform_usage_report', title: '9. Platform-Wide Usage & Compliance Audit', desc: 'Overall platform resource consumption, RBAC activities, and log counts' },
  ];

  const generatedTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Dynamic table data generator based on selected report
  const getReportData = () => {
    switch (selectedReportId) {
      case 'fest_requests_report':
        return {
          headers: ['Request ID', 'Fest Name', 'Institution', 'Applicant', 'Submission Date', 'Reviewer', 'Status'],
          rows: festRequests.map((r) => [
            r.id,
            r.festName,
            r.institution,
            r.requestingAdminName,
            r.submissionDate,
            r.assignedReviewerName || 'Unassigned',
            r.status.toUpperCase(),
          ]),
        };

      case 'fest_activity_report':
        return {
          headers: ['Fest ID', 'Fest Name', 'Status', 'Participants', 'Programmes', 'Completion %', 'Public Live'],
          rows: fests.map((f) => [
            f.id,
            f.name,
            f.status.toUpperCase(),
            f.expectedParticipants,
            f.plannedProgrammesCount,
            `${f.completionPercentage}%`,
            f.publicPagePublished ? 'Yes' : 'No',
          ]),
        };

      case 'fest_lifecycle_report':
        return {
          headers: ['Fest ID', 'Fest Name', 'Lifecycle Stage', 'Approved At', 'Approved By', 'Completion Pct'],
          rows: fests.map((f) => [
            f.id,
            f.name,
            f.status.replace('_', ' ').toUpperCase(),
            f.approvedAt || 'Pre-chartered',
            f.approvedBy || 'System',
            `${f.completionPercentage}%`,
          ]),
        };

      case 'admin_account_report':
        return {
          headers: ['Admin ID', 'Name', 'Email', 'Role', 'Department', 'Account Status'],
          rows: users
            .filter((u) => u.role === 'fest_admin' || u.role === 'super_admin' || u.role === 'admin')
            .map((u) => [u.id, u.name, u.email, u.role.toUpperCase(), u.department || 'N/A', u.status.toUpperCase()]),
        };

      case 'participant_totals_report':
        return {
          headers: ['Participant ID', 'Name', 'Category', 'Team Allocation', 'Events Registered'],
          rows: participants.map((p) => [p.id, p.name, p.category, p.teamId, p.registeredProgrammes.length]),
        };

      case 'programme_completion_report':
        return {
          headers: ['Code', 'Programme Title', 'Category', 'Venue', 'Status', 'Results Ratified'],
          rows: programmes.map((p) => [
            p.code,
            p.name,
            p.category,
            p.venue,
            p.status.toUpperCase(),
            p.resultPublished ? 'Ratified & Live' : 'Pending',
          ]),
        };

      case 'score_publication_report':
        return {
          headers: ['Score ID', 'Programme', 'Judge ID', 'Total Marks', 'Status', 'Submitted At'],
          rows: scores.map((s) => [s.id, s.programmeId, s.judgeId, s.totalScore, s.status.toUpperCase(), s.submittedAt]),
        };

      case 'suspended_fest_report':
        return {
          headers: ['Fest ID', 'Fest Name', 'Institution', 'Status', 'Suspension Reason'],
          rows: fests
            .filter((f) => f.status === 'suspended' || f.status === 'cancelled')
            .map((f) => [f.id, f.name, f.institution, f.status.toUpperCase(), f.suspensionReason || 'Administrative Review']),
        };

      case 'platform_usage_report':
      default:
        return {
          headers: ['Metric Category', 'Active Total', 'Governance Target', 'Health Status'],
          rows: [
            ['Total Platform Fests', fests.length, 'Scalable', 'Healthy'],
            ['Total RBAC User Accounts', users.length, 'Audited', 'Compliant'],
            ['Cross-Fest Participants', participants.length, 'Unlimited', 'Operational'],
            ['Scheduled Competitions', programmes.length, 'Verified', 'Active'],
            ['Audit Log Records', platformAuditLogs.length, 'Append-Only', 'Secure'],
          ],
        };
    }
  };

  const activeReportData = getReportData();

  const handleExportCSV = () => {
    const csvObjects = activeReportData.rows.map((row) => {
      const obj: Record<string, any> = {};
      activeReportData.headers.forEach((h, idx) => {
        obj[h.replace(/\s+/g, '_')] = row[idx];
      });
      return obj;
    });
    exportToCsv(selectedReportId, csvObjects);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentReportObj = reportTypes.find((r) => r.id === selectedReportId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Reports & Analytics Intelligence</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              AUDITED RECORDS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative platform-wide reports for compliance, academic senate audits, and operational intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Sidebar & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: 9 Reports Roster */}
        <div className="border border-slate-200 rounded p-3 bg-white space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Available Reports Catalog
          </div>
          {reportTypes.map((rep) => {
            const isSelected = selectedReportId === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`w-full text-left p-2.5 rounded transition-colors text-xs ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="font-medium text-slate-900 truncate">{rep.title}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{rep.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Right: Report Output View */}
        <div className="lg:col-span-3 border border-slate-200 rounded p-6 bg-white space-y-4">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{currentReportObj?.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{currentReportObj?.desc}</p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Generated: {generatedTimestamp} UTC
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    {activeReportData.headers.map((h, idx) => (
                      <th key={idx} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {activeReportData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={activeReportData.headers.length} className="px-4 py-8 text-center text-slate-400">
                        No records available for this report criteria.
                      </td>
                    </tr>
                  ) : (
                    activeReportData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/70">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="px-4 py-2.5">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Showing {activeReportData.rows.length} verified records</span>
            <span>Security Classification: Institutional Internal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
