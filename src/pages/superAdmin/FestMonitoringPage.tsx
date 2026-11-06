import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Activity,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Award,
  CalendarCheck,
  CheckSquare,
  Shield,
  Globe,
  History,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { FestMilestone } from '../../types';

export const FestMonitoringPage: React.FC = () => {
  const {
    fests,
    activeFestId,
    setActiveFestId,
    participants,
    teams,
    programmes,
    judges,
    scores,
    results,
    scheduleSlots,
    milestones,
    updateMilestoneStatus,
    platformAuditLogs,
    switchPortal,
    scheduleConflicts,
    leaderboard
  } = useFest();

  const [activeMonitoringTab, setActiveMonitoringTab] = useState<
    'overview' | 'registrations' | 'programmes' | 'judges' | 'scores' | 'schedule' | 'teams' | 'public' | 'timeline'
  >('overview');

  const currentFest = useMemo(() => {
    return fests.find((f) => f.id === activeFestId) || fests[0];
  }, [fests, activeFestId]);

  // Fest specific milestones
  const festMilestones = useMemo(() => {
    return milestones.filter((m) => m.festId === currentFest?.id);
  }, [milestones, currentFest]);

  // Calculate statistics
  const festParticipants = participants;
  const festTeams = teams;
  const festProgrammes = programmes;
  const festJudges = judges;
  const festScores = scores;
  const festResults = results;
  const festSlots = scheduleSlots;

  // Programmes without judges
  const programmesWithoutJudges = festProgrammes.filter(
    (p) => !p.judgeIds || p.judgeIds.length === 0
  );

  // Scores awaiting review/approval
  const pendingScores = festScores.filter(
    (s) => s.status === 'pending' || s.status === 'submitted'
  );

  // Unresolved schedule conflicts
  const festConflicts = scheduleConflicts;

  // Capacity calculation
  const capacityPct = Math.round(
    (festParticipants.length / (currentFest?.expectedParticipants || 500)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Fest Selector & Top Overview Banner */}
      <div className="border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center font-bold text-slate-800 text-sm">
              {currentFest?.id.slice(-2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {currentFest?.name} {currentFest?.edition}
                </h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                  currentFest?.status === 'ongoing'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentFest?.status === 'suspended'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : currentFest?.status === 'setup'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {currentFest?.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentFest?.institution} • Campus: {currentFest?.venue} • Dates: {currentFest?.startDate} to {currentFest?.endDate}
              </p>
            </div>
          </div>

          {/* Quick Selector Dropdown & Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50">
              <span className="text-slate-400">Monitoring Fest:</span>
              <select
                value={activeFestId}
                onChange={(e) => setActiveFestId(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                {fests.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.id}) - {f.status}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => switchPortal('fest_admin', currentFest?.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium"
            >
              <span>Fest Admin Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Platform Lifecycle Completion</span>
            <span className="font-semibold text-slate-900">{currentFest?.completionPercentage}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-slate-900 transition-all duration-300"
              style={{ width: `${currentFest?.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 9 Tab Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium py-1">
          {[
            { id: 'overview', label: 'A. Overview & Milestones', icon: Activity },
            { id: 'registrations', label: 'B. Registrations', icon: Users, badge: festParticipants.length },
            { id: 'programmes', label: 'C. Programmes', icon: CalendarCheck, badge: festProgrammes.length },
            { id: 'judges', label: 'D. Judges Panel', icon: Award, badge: festJudges.length },
            { id: 'scores', label: 'E. Scores & Results', icon: CheckSquare, badge: pendingScores.length > 0 ? `${pendingScores.length} pending` : undefined },
            { id: 'schedule', label: 'F. Schedule & Conflicts', icon: Clock, badge: festConflicts.length > 0 ? `${festConflicts.length} conflict` : undefined },
            { id: 'teams', label: 'G. Teams & Points', icon: Shield, badge: festTeams.length },
            { id: 'public', label: 'H. Public Page Portal', icon: Globe },
            { id: 'timeline', label: 'I. Activity Timeline', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMonitoringTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMonitoringTab(tab.id as any)}
                className={`px-3 py-2 rounded-t flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 font-medium ${
                  isActive
                    ? 'border-slate-900 text-slate-900 bg-slate-50/70 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    String(tab.badge).includes('conflict') || String(tab.badge).includes('pending')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* A. OVERVIEW & MILESTONES */}
      {activeMonitoringTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="border border-slate-200 rounded p-4 bg-white">
              <span className="text-slate-400 block mb-1">Responsible Fest Admin</span>
              <div className="font-semibold text-slate-900 text-sm">{currentFest?.adminName}</div>
              <div className="text-slate-500 mt-0.5">{currentFest?.adminEmail}</div>
              <div className="text-slate-400 text-[11px] mt-1">{currentFest?.adminPhone}</div>
            </div>

            <div className="border border-slate-200 rounded p-4 bg-white">
              <span className="text-slate-400 block mb-1">Scale & Participation</span>
              <div className="font-semibold text-slate-900 text-sm">
                {festParticipants.length} / {currentFest?.expectedParticipants} Registered
              </div>
              <div className="text-slate-500 mt-0.5">{capacityPct}% venue capacity utilisation</div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                <div className="h-1 rounded-full bg-slate-900" style={{ width: `${Math.min(capacityPct, 100)}%` }} />
              </div>
            </div>

            <div className="border border-slate-200 rounded p-4 bg-white">
              <span className="text-slate-400 block mb-1">Adjudication & Results</span>
              <div className="font-semibold text-slate-900 text-sm">
                {festResults.filter((r) => r.published).length} Published Results
              </div>
              <div className="text-slate-500 mt-0.5">{pendingScores.length} pending scores awaiting review</div>
              <div className="text-emerald-700 text-[11px] font-medium mt-1">
                Leaderboard points auto-ratified
              </div>
            </div>

            <div className="border border-slate-200 rounded p-4 bg-white">
              <span className="text-slate-400 block mb-1">Schedule & Logistics</span>
              <div className="font-semibold text-slate-900 text-sm">{festSlots.length} Programme Slots</div>
              <div className="text-slate-500 mt-0.5">
                {festConflicts.length === 0 ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No timing conflicts
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    {festConflicts.length} timing conflict flagged
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lifecycle Milestones Checklist */}
          <div className="border border-slate-200 rounded p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Platform Lifecycle Milestones
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Milestones determine the fest's operational completion percentage.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-600">
                {festMilestones.filter((m) => m.completed).length} of {festMilestones.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {festMilestones.map((m) => (
                <div
                  key={m.id}
                  onClick={() => updateMilestoneStatus(m.id, !m.completed)}
                  className={`p-3 rounded border transition-colors cursor-pointer flex items-start gap-3 ${
                    m.completed
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className={`font-semibold ${m.completed ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {m.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Category: {m.category}</span>
                      <span>•</span>
                      <span>Responsible: {m.responsibleRole.replace('_', ' ')}</span>
                      {m.completedAt && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600">Done {m.completedAt}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* B. REGISTRATIONS MONITORING */}
      {activeMonitoringTab === 'registrations' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded p-4 bg-white flex items-center justify-between text-xs">
            <div>
              <h3 className="font-semibold text-slate-900">Participant Registrations ({festParticipants.length})</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Official participant roster and category allocations</p>
            </div>
            <div className="text-slate-600">
              Expected Target: <span className="font-semibold text-slate-900">{currentFest?.expectedParticipants}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden bg-white">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Participant ID</th>
                  <th className="px-4 py-3">Name & Email</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Assigned Team</th>
                  <th className="px-4 py-3">Registered Events</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {festParticipants.map((p) => {
                  const teamObj = festTeams.find((t) => t.id === p.teamId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono text-slate-900 font-medium">{p.id}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.email}</div>
                      </td>
                      <td className="px-4 py-2.5">{p.category}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{teamObj?.name || p.teamId}</td>
                      <td className="px-4 py-2.5">{p.registeredProgrammes.length} programmes</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. PROGRAMMES MONITORING */}
      {activeMonitoringTab === 'programmes' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded p-4 bg-white flex items-center justify-between text-xs">
            <div>
              <h3 className="font-semibold text-slate-900">Programmes Roster ({festProgrammes.length})</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Competitive events, rules, venues, and judge assignment checks</p>
            </div>
            {programmesWithoutJudges.length > 0 && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {programmesWithoutJudges.length} programmes missing judges
              </span>
            )}
          </div>

          <div className="border border-slate-200 rounded overflow-hidden bg-white">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Programme Name</th>
                  <th className="px-4 py-3">Category & Type</th>
                  <th className="px-4 py-3">Venue & Stage</th>
                  <th className="px-4 py-3">Timing</th>
                  <th className="px-4 py-3">Judges Assigned</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {festProgrammes.map((pr) => {
                  const assignedCount = pr.judgeIds ? pr.judgeIds.length : 0;
                  return (
                    <tr key={pr.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono text-slate-900 font-medium">{pr.code}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{pr.name}</td>
                      <td className="px-4 py-2.5 text-slate-600 capitalize">{pr.category} ({pr.type})</td>
                      <td className="px-4 py-2.5">{pr.venue} - {pr.stage}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{pr.startTime} - {pr.endTime}</td>
                      <td className="px-4 py-2.5">
                        {assignedCount === 0 ? (
                          <span className="text-amber-700 font-semibold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            No Judges
                          </span>
                        ) : (
                          <span className="font-medium text-slate-800">{assignedCount} Assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                          {pr.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* D. JUDGES MONITORING */}
      {activeMonitoringTab === 'judges' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded p-4 bg-white text-xs">
            <h3 className="font-semibold text-slate-900">Judging Panel Oversight ({festJudges.length})</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Assigned programmes, credentials, and adjudication duties</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {festJudges.map((j) => (
              <div key={j.id} className="border border-slate-200 rounded p-4 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 text-sm">{j.name}</div>
                  <span className="font-mono text-[10px] text-slate-400">{j.id}</span>
                </div>
                <div className="text-slate-500">{j.designation} • {j.affiliation}</div>
                <div className="text-[11px] text-slate-600">Specialisation: {j.specialization}</div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Assigned Events:</span>
                  <span className="font-semibold text-slate-900">{j.assignedProgrammes?.length || 0} Programmes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. SCORES & RESULTS MONITORING */}
      {activeMonitoringTab === 'scores' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded p-4 bg-white flex items-center justify-between text-xs">
            <div>
              <h3 className="font-semibold text-slate-900">Scores & Results Ratification</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Submitted score sheets, audit revisions, and published leaderboards</p>
            </div>
            <span className="font-medium text-slate-600">
              {festScores.length} score submissions • {festResults.filter((r) => r.published).length} published results
            </span>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden bg-white">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Score ID</th>
                  <th className="px-4 py-3">Programme</th>
                  <th className="px-4 py-3">Judge</th>
                  <th className="px-4 py-3">Team / Candidate</th>
                  <th className="px-4 py-3">Total Marks</th>
                  <th className="px-4 py-3">Revisions</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {festScores.map((sc) => {
                  const pr = festProgrammes.find((p) => p.id === sc.programmeId);
                  const jd = festJudges.find((j) => j.id === sc.judgeId);
                  const tm = festTeams.find((t) => t.id === sc.teamId);
                  return (
                    <tr key={sc.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono text-slate-900 font-medium">{sc.id}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{pr?.name || sc.programmeId}</td>
                      <td className="px-4 py-2.5 text-slate-600">{jd?.name || sc.judgeId}</td>
                      <td className="px-4 py-2.5">{tm?.name || sc.teamId}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{sc.totalScore}</td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500">
                        {sc.revisionHistory && sc.revisionHistory.length > 0 ? (
                          <span className="text-amber-700 font-medium">{sc.revisionHistory.length} edits</span>
                        ) : (
                          'Original'
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                          {sc.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* F. SCHEDULE & CONFLICTS */}
      {activeMonitoringTab === 'schedule' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded p-4 bg-white flex items-center justify-between text-xs">
            <div>
              <h3 className="font-semibold text-slate-900">Venue Schedule & Timeline</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Stage allocations, timetable slots, and conflict warnings</p>
            </div>
            {festConflicts.length === 0 ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Zero Conflicts Detected
              </span>
            ) : (
              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {festConflicts.length} Conflict(s) Flagged
              </span>
            )}
          </div>

          <div className="border border-slate-200 rounded overflow-hidden bg-white">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Slot ID</th>
                  <th className="px-4 py-3">Programme</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {festSlots.map((slot) => {
                  const pr = festProgrammes.find((p) => p.id === slot.programmeId);
                  return (
                    <tr key={slot.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono text-slate-900 font-medium">{slot.id}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{pr?.name || slot.programmeId}</td>
                      <td className="px-4 py-2.5 text-slate-700">{slot.venue}</td>
                      <td className="px-4 py-2.5">{slot.stage}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{slot.date}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{slot.startTime} - {slot.endTime}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                          {slot.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* G. TEAMS & POINTS */}
      {activeMonitoringTab === 'teams' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded p-4 bg-white text-xs">
            <h3 className="font-semibold text-slate-900">Participating Teams & Standings</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Approved points, first-place medals, and house leaders</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {leaderboard.map((entry, idx) => (
              <div key={entry.team.id} className="border border-slate-200 rounded p-4 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                    Rank #{idx + 1}
                  </span>
                  <span className="text-xl font-bold text-slate-900">{entry.totalPoints} pts</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm mt-1">{entry.team.name}</div>
                <div className="text-[11px] text-slate-500">
                  {festParticipants.filter((p) => p.teamId === entry.team.id).length} Participants • {entry.totalResults} Events Rated
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>1st Place Medals:</span>
                  <span className="font-bold text-slate-900">{entry.firstPlaceCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* H. PUBLIC PAGE PORTAL */}
      {activeMonitoringTab === 'public' && (
        <div className="space-y-4 text-xs">
          <div className="border border-slate-200 rounded p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Public Portal Status & Diagnostics</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Visitor-facing portal for programmes, schedules, live updates, and ratified results.
                </p>
              </div>
              <button
                onClick={() => switchPortal('public')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 flex items-center gap-1.5"
              >
                <span>Preview Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 border border-slate-200 rounded bg-slate-50">
                <span className="text-slate-500 block mb-1 text-[11px]">Publication State</span>
                <div className="font-bold text-slate-900 text-sm">
                  {currentFest?.publicPagePublished ? 'Published & Live' : 'Unpublished (Draft)'}
                </div>
                <div className="text-emerald-700 text-[11px] mt-1">SEO tags active</div>
              </div>

              <div className="p-3 border border-slate-200 rounded bg-slate-50">
                <span className="text-slate-500 block mb-1 text-[11px]">Portal Route / URL</span>
                <div className="font-mono text-slate-900 font-medium text-xs truncate">
                  {currentFest?.publicUrl || `/fests/${currentFest?.id.toLowerCase()}`}
                </div>
                <div className="text-slate-400 text-[11px] mt-1">Responsive mobile view enabled</div>
              </div>

              <div className="p-3 border border-slate-200 rounded bg-slate-50">
                <span className="text-slate-500 block mb-1 text-[11px]">Live Results Feed</span>
                <div className="font-bold text-slate-900 text-sm">
                  {festResults.filter((r) => r.published).length} Published
                </div>
                <div className="text-slate-500 text-[11px] mt-1">Public leaderboard online</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* I. ACTIVITY TIMELINE */}
      {activeMonitoringTab === 'timeline' && (
        <div className="border border-slate-200 rounded p-5 bg-white space-y-4 text-xs">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Fest Historical Activity Stream
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of operational changes, score submissions, and platform actions.
            </p>
          </div>

          <div className="space-y-3">
            {platformAuditLogs
              .filter((log) => log.targetId === currentFest?.id || log.details.includes(currentFest?.name || ''))
              .slice(0, 10)
              .map((log) => (
                <div key={log.id} className="p-3 border border-slate-100 rounded bg-slate-50/50 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{log.action.replace(/_/g, ' ')}</div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      By {log.actorName} ({log.actorRole}) • Log ID: {log.id}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.timestamp}</span>
                </div>
              ))}
            {platformAuditLogs.filter((log) => log.targetId === currentFest?.id || log.details.includes(currentFest?.name || '')).length === 0 && (
              <div className="p-6 text-center text-slate-400">
                No fest-specific audit logs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
