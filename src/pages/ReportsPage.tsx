import React, { useState } from 'react';
import { useFest } from '../context/FestContext';
import { exportToCSV } from '../services/storage';
import { Badge } from '../components/common/Badge';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Users,
  Shield,
  CalendarCheck,
  Award,
  CheckSquare,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

type ReportType =
  | 'participants'
  | 'teams'
  | 'programmes'
  | 'judges'
  | 'scores'
  | 'results'
  | 'standings'
  | 'schedule'
  | 'complaints';

export const ReportsPage: React.FC = () => {
  const {
    participants,
    teams,
    programmes,
    judges,
    scores,
    results,
    leaderboard,
    scheduleSlots,
    complaints,
    settings,
  } = useFest();

  const [activeReport, setActiveReport] = useState<ReportType>('standings');

  const reportDefinitions = [
    {
      id: 'standings' as ReportType,
      title: 'Overall Team Standings & Trophies',
      desc: 'Rankings, total points, 1st/2nd/3rd places for all competing houses.',
      icon: Trophy,
    },
    {
      id: 'results' as ReportType,
      title: 'Official Programme Results',
      desc: 'Ratified marks, rankings, and points awarded per competition.',
      icon: Award,
    },
    {
      id: 'participants' as ReportType,
      title: 'Participant Registrations Directory',
      desc: 'All registered participants, contact info, team links, and statuses.',
      icon: Users,
    },
    {
      id: 'teams' as ReportType,
      title: 'Team Participation & Roster Summary',
      desc: 'Institution names, team leaders, and participant headcount per team.',
      icon: Shield,
    },
    {
      id: 'programmes' as ReportType,
      title: 'Competition Programmes Roster',
      desc: 'Categories, maximum capacities, criteria, and completion status.',
      icon: CalendarCheck,
    },
    {
      id: 'judges' as ReportType,
      title: 'Judge Assignments & Panel Status',
      desc: 'Adjudicator empanelling, assigned events, and pending marks.',
      icon: Award,
    },
    {
      id: 'scores' as ReportType,
      title: 'Score Sheets & Evaluation Audits',
      desc: 'Consolidated marks given by judges with revision history.',
      icon: CheckSquare,
    },
    {
      id: 'schedule' as ReportType,
      title: 'Schedule & Programme Completion',
      desc: 'Venues, stages, date/time slots, and run sheet timelines.',
      icon: Clock,
    },
    {
      id: 'complaints' as ReportType,
      title: 'Appeals & Complaints Roster',
      desc: 'All submitted team appeals, resolution statuses, jury notes, and score calibrations.',
      icon: AlertTriangle,
    },
  ];

  // Export CSV handler
  const handleExportCSV = () => {
    const nowStr = new Date().toISOString().slice(0, 10);
    switch (activeReport) {
      case 'standings': {
        const rows = leaderboard.map((e) => ({
          Rank: e.rank,
          TeamCode: e.team.code,
          TeamName: e.team.name,
          Institution: e.team.institution,
          FirstPlaces: e.firstPlaceCount,
          SecondPlaces: e.secondPlaceCount,
          ThirdPlaces: e.thirdPlaceCount,
          TotalPoints: e.totalPoints,
        }));
        exportToCSV(`festflow_team_standings_${nowStr}`, rows);
        break;
      }
      case 'results': {
        const rows = results.map((r) => {
          const prog = programmes.find((p) => p.id === r.programmeId);
          return {
            ProgrammeCode: prog?.code || r.programmeId,
            ProgrammeName: prog?.name || '',
            Rank: r.rank,
            Participant: r.participantName || 'N/A (Group Event)',
            Team: r.teamName,
            FinalScore: r.finalScore,
            PointsAwarded: r.pointsAwarded,
            PublishedDate: r.publishedAt || '',
          };
        });
        exportToCSV(`festflow_official_results_${nowStr}`, rows);
        break;
      }
      case 'participants': {
        const rows = participants.map((p) => {
          const team = teams.find((t) => t.id === p.teamId);
          return {
            ID: p.id,
            Name: p.name,
            Email: p.email,
            Phone: p.phone,
            Team: team?.name || p.teamId,
            Category: p.category,
            Status: p.status,
            AssignedProgrammes: p.registeredProgrammes.length,
          };
        });
        exportToCSV(`festflow_participants_${nowStr}`, rows);
        break;
      }
      case 'teams': {
        const rows = teams.map((t) => {
          const count = participants.filter((p) => p.teamId === t.id).length;
          return {
            TeamCode: t.code,
            Name: t.name,
            Institution: t.institution,
            LeaderName: t.teamLeaderName,
            LeaderContact: t.teamLeaderContact,
            ParticipantsCount: count,
            Status: t.status,
          };
        });
        exportToCSV(`festflow_teams_summary_${nowStr}`, rows);
        break;
      }
      case 'programmes': {
        const rows = programmes.map((p) => ({
          Code: p.code,
          Name: p.name,
          Category: p.category,
          Type: p.type,
          Venue: p.venue,
          Stage: p.stage,
          Date: p.date,
          Time: `${p.startTime} - ${p.endTime}`,
          Status: p.status,
          ResultPublished: p.resultPublished ? 'Yes' : 'No',
        }));
        exportToCSV(`festflow_programmes_${nowStr}`, rows);
        break;
      }
      case 'judges': {
        const rows = judges.map((j) => ({
          ID: j.id,
          Name: j.name,
          Email: j.email,
          Phone: j.phone,
          Designation: j.designation,
          Institution: j.institution || '',
          Status: j.status,
          AssignedEventsCount: j.assignedProgrammes.length,
        }));
        exportToCSV(`festflow_judges_${nowStr}`, rows);
        break;
      }
      case 'scores': {
        const rows = scores.map((s) => {
          const prog = programmes.find((p) => p.id === s.programmeId);
          return {
            EntryID: s.id,
            Programme: prog?.name || s.programmeId,
            Judge: s.judgeName,
            TotalScore: s.totalScore,
            Status: s.status,
            SubmittedAt: s.submittedAt,
            Remarks: s.notes || '',
          };
        });
        exportToCSV(`festflow_score_sheets_${nowStr}`, rows);
        break;
      }
      case 'schedule': {
        const rows = scheduleSlots.map((s) => {
          const prog = programmes.find((p) => p.id === s.programmeId);
          return {
            SlotID: s.id,
            Programme: prog?.name || s.programmeId,
            Venue: s.venue,
            Stage: s.stage,
            Date: s.date,
            StartTime: s.startTime,
            EndTime: s.endTime,
            Status: s.status,
          };
        });
        exportToCSV(`festflow_schedule_${nowStr}`, rows);
        break;
      }
      case 'complaints': {
        const rows = complaints.map((c) => ({
          ComplaintID: c.id,
          Team: c.teamName,
          Programme: c.programmeName,
          Category: c.category,
          Status: c.status,
          Description: c.description,
          ResolutionNote: c.resolutionNote || '',
          CalibratedScore: c.calibratedScore !== undefined ? c.calibratedScore : '',
          SubmittedAt: c.submittedAt,
          Reviewer: c.reviewerName || '',
        }));
        exportToCSV(`festflow_complaints_${nowStr}`, rows);
        break;
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Reports & Data Exports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate printable dossiers and export verified datasets in structured CSV format.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Current Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        {reportDefinitions.map((rep) => {
          const Icon = rep.icon;
          const isSelected = activeReport === rep.id;

          return (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'border-slate-900 bg-slate-50 text-slate-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-2 ${
                  isSelected ? 'text-slate-900' : 'text-slate-400'
                }`}
              />
              <div className="font-semibold text-xs text-slate-900 leading-tight">
                {rep.title}
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                {rep.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Rendered Printable Report Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        {/* Printable Header */}
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Official Fest Dossier
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {reportDefinitions.find((r) => r.id === activeReport)?.title}
            </h3>
            <p className="text-xs text-slate-500">
              {settings.festName} • {settings.organizer}
            </p>
          </div>
          <div className="text-left sm:text-right font-mono text-xs text-slate-500">
            <div>Generated: {new Date().toISOString().replace('T', ' ').slice(0, 19)}</div>
            <div>Timezone: {settings.timezone}</div>
          </div>
        </div>

        {/* Report Content Table based on activeReport */}
        <div className="overflow-x-auto">
          {activeReport === 'standings' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Team Code</th>
                  <th className="py-2.5 px-3">Team Name</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-2 text-center">1st</th>
                  <th className="py-2.5 px-2 text-center">2nd</th>
                  <th className="py-2.5 px-2 text-center">3rd</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((e) => (
                  <tr key={e.team.id}>
                    <td className="py-2 px-3 font-mono font-bold">#{e.rank}</td>
                    <td className="py-2 px-3 font-mono">{e.team.code}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{e.team.name}</td>
                    <td className="py-2 px-3 text-slate-600">{e.team.institution}</td>
                    <td className="py-2 px-2 text-center font-mono">{e.firstPlaceCount}</td>
                    <td className="py-2 px-2 text-center font-mono">{e.secondPlaceCount}</td>
                    <td className="py-2 px-2 text-center font-mono">{e.thirdPlaceCount}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {e.totalPoints} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'results' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-2 text-center">Rank</th>
                  <th className="py-2.5 px-3">Participant / Team</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-2 text-center">Final Score</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => {
                  const prog = programmes.find((p) => p.id === r.programmeId);
                  return (
                    <tr key={r.id}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{prog?.name}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold">#{r.rank}</td>
                      <td className="py-2 px-3 text-slate-800">{r.participantName || 'Group Entry'}</td>
                      <td className="py-2 px-3 text-slate-600">{r.teamName}</td>
                      <td className="py-2 px-2 text-center font-mono">{r.finalScore}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {r.pointsAwarded} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeReport === 'participants' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-2 text-center">Category</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-mono">{p.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2 px-3 text-slate-600">{p.email}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {teams.find((t) => t.id === p.teamId)?.name}
                    </td>
                    <td className="py-2 px-2 text-center">{p.category}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={p.status} size="sm">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'teams' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Team Name</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-3">Leader</th>
                  <th className="py-2.5 px-2 text-center">Headcount</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map((t) => {
                  const count = participants.filter((p) => p.teamId === t.id).length;
                  return (
                    <tr key={t.id}>
                      <td className="py-2 px-3 font-mono font-bold">{t.code}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{t.name}</td>
                      <td className="py-2 px-3 text-slate-600">{t.institution}</td>
                      <td className="py-2 px-3 text-slate-600">{t.teamLeaderName}</td>
                      <td className="py-2 px-2 text-center font-mono">{count}</td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant={t.status} size="sm">{t.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeReport === 'programmes' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Venue</th>
                  <th className="py-2.5 px-3 font-mono">Date & Time</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programmes.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-mono font-bold">{p.code}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2 px-3 text-slate-600">{p.category}</td>
                    <td className="py-2 px-3 text-slate-600">{p.venue}</td>
                    <td className="py-2 px-3 font-mono">{p.date} ({p.startTime})</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={p.status} size="sm">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'judges' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Judge ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-2 text-center">Assigned Events</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {judges.map((j) => (
                  <tr key={j.id}>
                    <td className="py-2 px-3 font-mono">{j.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{j.name}</td>
                    <td className="py-2 px-3 text-slate-600">{j.designation}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{j.phone}</td>
                    <td className="py-2 px-2 text-center font-mono">{j.assignedProgrammes.length}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={j.status} size="sm">{j.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'scores' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Entry ID</th>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3">Judge</th>
                  <th className="py-2.5 px-2 text-center">Total Score</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3 font-mono">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scores.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 px-3 font-mono">{s.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {programmes.find((p) => p.id === s.programmeId)?.name}
                    </td>
                    <td className="py-2 px-3 text-slate-700">{s.judgeName}</td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                      {s.totalScore}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={s.status} size="sm">{s.status}</Badge>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{s.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'schedule' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3 font-mono">Date</th>
                  <th className="py-2.5 px-3 font-mono">Time</th>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3">Venue & Stage</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduleSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="py-2 px-3 font-mono">{slot.date}</td>
                    <td className="py-2 px-3 font-mono">{slot.startTime} - {slot.endTime}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {programmes.find((p) => p.id === slot.programmeId)?.name}
                    </td>
                    <td className="py-2 px-3 text-slate-700">{slot.venue} ({slot.stage})</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={slot.status} size="sm">{slot.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeReport === 'complaints' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Complaint ID</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 font-mono">Date</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3">Resolution Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{c.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{c.teamName}</td>
                    <td className="py-2 px-3 text-slate-800">{c.programmeName}</td>
                    <td className="py-2 px-3 text-slate-600">{c.category.replace('_', ' ')}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{c.submittedAt}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={c.status === 'resolved' ? 'success' : c.status === 'escalated' ? 'error' : 'warning'} size="sm">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-slate-700 italic">{c.resolutionNote || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
