import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Landmark,
  Inbox,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Calendar,
  CheckCheck,
  Ban,
  UserCheck,
  Users,
  GraduationCap,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Filter,
  BarChart2,
  PieChart,
  FileText
} from 'lucide-react';
import { FestLifecycleStatus, SuperAdminNavigationTab } from '../../types';

export const SuperDashboardPage: React.FC = () => {
  const {
    fests,
    festRequests,
    users,
    participants,
    programmes,
    scores,
    results,
    platformAuditLogs,
    setSuperAdminTab,
    setActiveFestId
  } = useFest();

  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | 'this_year'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered fests for metrics
  const filteredFests = useMemo(() => {
    return fests.filter((f) => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      return true;
    });
  }, [fests, categoryFilter, statusFilter]);

  // Dynamic Metrics - Exact 12 requested summary items
  const totalFests = fests.length;
  const pendingRequests = festRequests.filter(
    (r) => ['pending', 'submitted', 'under_review', 'more_info_required', 'PENDING', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED'].includes(r.status)
  ).length;
  const approvedFests = fests.filter((f) => f.status !== 'suspended' && f.status !== 'cancelled').length;
  const rejectedRequests = festRequests.filter((r) => r.status === 'rejected').length;
  const activeFests = fests.filter((f) => f.status === 'ongoing' || f.status === 'scoring').length;
  const upcomingFests = fests.filter((f) => f.status === 'setup' || f.status === 'registration_open' || f.status === 'registration_closed').length;
  const completedFests = fests.filter((f) => f.status === 'completed' || f.status === 'archived').length;
  const suspendedFests = fests.filter((f) => f.status === 'suspended').length;
  const totalFestAdmins = users.filter((u) => u.role === 'fest_admin' || u.role === 'admin').length;
  const totalPlatformUsers = users.length;
  const totalParticipantsCount = participants.length;
  const totalProgrammesCount = programmes.length;

  const summaryCards = [
    {
      title: 'Total Fests',
      value: totalFests,
      desc: 'Hosted across platform',
      icon: Landmark,
      color: 'slate',
      tab: 'all_fests' as SuperAdminNavigationTab,
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      desc: 'Awaiting admin review',
      icon: Inbox,
      color: 'amber',
      tab: 'fest_requests' as SuperAdminNavigationTab,
    },
    {
      title: 'Approved Fests',
      value: approvedFests,
      desc: 'Chartered & active',
      icon: CheckCircle2,
      color: 'emerald',
      tab: 'all_fests' as SuperAdminNavigationTab,
    },
    {
      title: 'Rejected Requests',
      value: rejectedRequests,
      desc: 'Declined submissions',
      icon: XCircle,
      color: 'rose',
      tab: 'fest_requests' as SuperAdminNavigationTab,
    },
    {
      title: 'Active / Live Fests',
      value: activeFests,
      desc: 'Currently in progress',
      icon: PlayCircle,
      color: 'indigo',
      tab: 'all_fests' as SuperAdminNavigationTab,
    },
    {
      title: 'Upcoming Fests',
      value: upcomingFests,
      desc: 'In setup or reg phase',
      icon: Calendar,
      color: 'sky',
      tab: 'all_fests' as SuperAdminNavigationTab,
    },
    {
      title: 'Completed Fests',
      value: completedFests,
      desc: 'Concluded & archived',
      icon: CheckCheck,
      color: 'slate',
      tab: 'all_fests' as SuperAdminNavigationTab,
    },
    {
      title: 'Suspended Fests',
      value: suspendedFests,
      desc: 'Under administrative hold',
      icon: Ban,
      color: 'rose',
      tab: 'all_fests' as SuperAdminNavigationTab,
    },
    {
      title: 'Fest Admins',
      value: totalFestAdmins,
      desc: 'Authorized fest managers',
      icon: UserCheck,
      color: 'slate',
      tab: 'admin_management' as SuperAdminNavigationTab,
    },
    {
      title: 'Platform Users',
      value: totalPlatformUsers,
      desc: 'Active RBAC accounts',
      icon: Users,
      color: 'slate',
      tab: 'platform_users' as SuperAdminNavigationTab,
    },
    {
      title: 'Total Participants',
      value: totalParticipantsCount,
      desc: 'Across all active fests',
      icon: GraduationCap,
      color: 'slate',
      tab: 'platform_participants' as SuperAdminNavigationTab,
    },
    {
      title: 'Total Programmes',
      value: totalProgrammesCount,
      desc: 'Scheduled competitions',
      icon: CalendarCheck,
      color: 'slate',
      tab: 'platform_programmes' as SuperAdminNavigationTab,
    },
  ];

  // Lifecycle stage breakdown
  const lifecycleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      ongoing: 0,
      setup: 0,
      registration_open: 0,
      completed: 0,
      suspended: 0,
      archived: 0,
    };
    fests.forEach((f) => {
      counts[f.status] = (counts[f.status] || 0) + 1;
    });
    return counts;
  }, [fests]);

  const uniqueCategories = Array.from(new Set(fests.map((f) => f.category)));

  return (
    <div className="space-y-6">
      {/* Top Banner & Governance Notice */}
      <div className="border border-slate-200 rounded p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Platform Command Centre</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              ALL SYSTEMS ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global oversight across {fests.length} fests, {totalPlatformUsers} user accounts, and {totalProgrammesCount} scheduled programmes.
          </p>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ongoing">Active / Ongoing</option>
              <option value="setup">In Setup</option>
              <option value="registration_open">Registration Open</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* 12 Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => setSuperAdminTab(card.tab)}
              className="p-3.5 rounded border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 truncate">{card.title}</span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    card.color === 'amber'
                      ? 'text-amber-600'
                      : card.color === 'emerald'
                      ? 'text-emerald-600'
                      : card.color === 'rose'
                      ? 'text-rose-600'
                      : card.color === 'indigo'
                      ? 'text-indigo-600'
                      : card.color === 'sky'
                      ? 'text-sky-600'
                      : 'text-slate-500'
                  }`}
                />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">{card.value}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{card.desc}</div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium group-hover:text-slate-900">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Analytical Visualisations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fest Status & Lifecycle Distribution */}
        <div className="border border-slate-200 rounded p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-slate-500" />
              Fest Status Distribution
            </h3>
            <span className="text-[11px] text-slate-400">{fests.length} Total</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Active & Ongoing', count: lifecycleBreakdown.ongoing || 0, color: 'bg-emerald-500', text: 'text-emerald-700' },
              { label: 'Under Setup & Config', count: lifecycleBreakdown.setup || 0, color: 'bg-indigo-500', text: 'text-indigo-700' },
              { label: 'Registration Open', count: lifecycleBreakdown.registration_open || 0, color: 'bg-sky-500', text: 'text-sky-700' },
              { label: 'Completed / Concluded', count: lifecycleBreakdown.completed || 0, color: 'bg-slate-400', text: 'text-slate-700' },
              { label: 'Archived', count: lifecycleBreakdown.archived || 0, color: 'bg-slate-300', text: 'text-slate-500' },
              { label: 'Suspended (Admin Hold)', count: lifecycleBreakdown.suspended || 0, color: 'bg-rose-500', text: 'text-rose-700' },
            ].map((item, idx) => {
              const pct = fests.length > 0 ? Math.round((item.count / fests.length) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-semibold text-slate-900">
                      {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fest Approval & Rejection Trends */}
        <div className="border border-slate-200 rounded p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              Fest Request Approval Flow
            </h3>
            <span className="text-[11px] text-slate-400">{festRequests.length} Requests</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 border border-slate-200 rounded bg-slate-50">
              <div className="text-2xl font-bold text-emerald-700">
                {festRequests.filter((r) => r.status === 'approved').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Approved Fests</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">
                {Math.round((festRequests.filter((r) => r.status === 'approved').length / (festRequests.length || 1)) * 100)}% approval rate
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded bg-slate-50">
              <div className="text-2xl font-bold text-amber-700">
                {festRequests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Awaiting Review</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Action required</div>
            </div>
          </div>

          <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
            <div className="text-xs font-semibold text-slate-900">Recent Request Decisions</div>
            <div className="space-y-1.5">
              {festRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0">
                  <div className="truncate mr-2">
                    <span className="font-medium text-slate-900 truncate block">{req.festName}</span>
                    <span className="text-[10px] text-slate-400">{req.institution}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize shrink-0 ${
                    req.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : req.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines & Programme Completion */}
        <div className="border border-slate-200 rounded p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Upcoming Fest Milestones
            </h3>
            <span className="text-[11px] text-slate-400">Scheduled Dates</span>
          </div>

          <div className="space-y-2.5">
            {fests.slice(0, 4).map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  setActiveFestId(f.id);
                  setSuperAdminTab('fest_monitoring');
                }}
                className="p-2.5 border border-slate-200 rounded hover:border-slate-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-900 group-hover:text-slate-700">{f.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{f.startDate}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{f.institution}</span>
                  <span className="font-semibold text-slate-700">{f.completionPercentage}% setup</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5">
                  <div
                    className="h-1 rounded-full bg-slate-900"
                    style={{ width: `${f.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Fests Directory Snapshot & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Platform Directory */}
        <div className="border border-slate-200 rounded p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Platform Fests Operational Roster
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Live status of registered festivals</p>
            </div>
            <button
              onClick={() => setSuperAdminTab('all_fests')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden">
            {filteredFests.map((fest) => (
              <div key={fest.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">{fest.name}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600">{fest.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {fest.institution} • Admin: {fest.adminName}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                    fest.status === 'ongoing'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : fest.status === 'suspended'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : fest.status === 'setup'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {fest.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => {
                      setActiveFestId(fest.id);
                      setSuperAdminTab('fest_monitoring');
                    }}
                    className="text-xs px-2 py-1 border border-slate-200 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  >
                    Monitor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Platform Activity & Audit Log Feed */}
        <div className="border border-slate-200 rounded p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Recent Platform Audit Events
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Immutable governance log stream</p>
            </div>
            <button
              onClick={() => setSuperAdminTab('platform_audit_logs')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Audit Trail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {platformAuditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-2.5 border border-slate-100 rounded bg-slate-50/50 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <span className="font-semibold">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({log.targetId})</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{log.details}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Acting User: <span className="font-medium text-slate-600">{log.actorName}</span> ({log.actorRole.replace('_', ' ')})
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{log.timestamp.slice(5, 16)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
