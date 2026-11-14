import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import {
  ScoreSubmission,
  ScoreStatus,
  ScoreDetail
} from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Clock,
  Eye,
  Edit2,
  Send,
  History,
  Lock,
  ArrowRight,
  Trophy,
  Filter
} from 'lucide-react';

export const ScoresPage: React.FC = () => {
  const {
    scores,
    programmes,
    judges,
    teams,
    participants,
    results,
    currentUser,
    submitOrUpdateScore,
    updateScoreStatus,
    publishProgrammeResults,
    teamProgrammeEntries,
    hasPermission,
    addToast,
  } = useFest();

  const [search, setSearch] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJudge, setFilterJudge] = useState('all');

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<ScoreSubmission | null>(null);
  const [viewingScore, setViewingScore] = useState<ScoreSubmission | null>(null);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(
    programmes[0]?.id || ''
  );
  const [confirmPublishId, setConfirmPublishId] = useState<string | null>(null);

  // Score Entry Form State
  const [formJudgeId, setFormJudgeId] = useState('');
  const [formParticipantId, setFormParticipantId] = useState('');
  const [formTeamEntryId, setFormTeamEntryId] = useState('');
  const [formTeamId, setFormTeamId] = useState('');
  const [formStatus, setFormStatus] = useState<ScoreStatus>('submitted');
  const [formNotes, setFormNotes] = useState('');
  const [criteriaScores, setCriteriaScores] = useState<ScoreDetail[]>([]);

  // Selected programme object for form
  const activeFormProgramme = programmes.find((p) => p.id === selectedProgrammeId);

  const isJudgeOnly = currentUser.role === 'judge';
  const judgeId = currentUser.linkedJudgeId || (isJudgeOnly ? currentUser.id : undefined);

  // Filtered score submissions
  const filteredScores = useMemo(() => {
    return scores.filter((s) => {
      // Judges only see their own score sheets
      if (isJudgeOnly && judgeId && s.judgeId !== judgeId && s.judgeId !== currentUser.id) {
        return false;
      }

      const prog = programmes.find((p) => p.id === s.programmeId);
      const team = teams.find((t) => t.id === s.teamId);
      const participant = participants.find((pt) => pt.id === s.participantId);

      const sText = search.toLowerCase();
      const matchesSearch =
        (prog?.name.toLowerCase().includes(sText) ?? false) ||
        (prog?.code.toLowerCase().includes(sText) ?? false) ||
        s.judgeName.toLowerCase().includes(sText) ||
        (team?.name.toLowerCase().includes(sText) ?? false) ||
        (participant?.name.toLowerCase().includes(sText) ?? false);
      if (!matchesSearch) return false;

      if (filterProgramme !== 'all' && s.programmeId !== filterProgramme) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterJudge !== 'all' && s.judgeId !== filterJudge) return false;

      return true;
    });
  }, [scores, search, filterProgramme, filterStatus, filterJudge, programmes, teams, participants, isJudgeOnly, judgeId, currentUser.id]);

  // Programmes available for scoring (restricted for judges to assigned events)
  const scorableProgrammes = useMemo(() => {
    if (isJudgeOnly && judgeId) {
      const assigned = programmes.filter((p) => p.assignedJudgeIds?.includes(judgeId));
      if (assigned.length > 0) return assigned;
      // Fallback: If no specific programmes are assigned to this judge yet, allow evaluating active programmes in this fest
      return programmes;
    }
    return programmes;
  }, [programmes, isJudgeOnly, judgeId]);

  // Handle open add score
  const handleOpenAddScore = () => {
    setEditingScore(null);
    const defaultProg = scorableProgrammes[0] || programmes[0];
    if (!defaultProg) {
      addToast('warning', 'No Programmes', 'No programmes assigned to you for scoring.');
      return;
    }

    const isTeam = defaultProg.type === 'team' || defaultProg.type === 'group' || defaultProg.programmeType === 'team';
    const entries = teamProgrammeEntries.filter((e) => e.programmeId === defaultProg.id);

    setSelectedProgrammeId(defaultProg.id);
    setFormJudgeId(judgeId || defaultProg.assignedJudgeIds[0] || judges[0]?.id || '');
    setFormParticipantId(defaultProg.registeredParticipantIds[0] || participants[0]?.id || '');
    setFormTeamEntryId(entries[0]?.id || '');
    setFormTeamId(entries[0]?.teamId || defaultProg.registeredTeamIds[0] || teams[0]?.id || '');
    setFormStatus('submitted');
    setFormNotes('');
    setCriteriaScores(
      defaultProg.criteria.map((c) => ({
        criterionId: c.id,
        criterionName: c.name,
        marksObtained: Math.round(c.maxMarks * 0.8),
        maxMarks: c.maxMarks,
      }))
    );
    setIsScoreModalOpen(true);
  };

  // Handle open edit score
  const handleOpenEditScore = (s: ScoreSubmission) => {
    setEditingScore(s);
    setSelectedProgrammeId(s.programmeId);
    setFormJudgeId(s.judgeId);
    setFormParticipantId(s.participantId || '');
    setFormTeamEntryId(s.teamEntryId || '');
    setFormTeamId(s.teamId || '');
    setFormStatus(s.status);
    setFormNotes(s.notes || '');
    setCriteriaScores(s.scores.map((sc) => ({ ...sc })));
    setIsScoreModalOpen(true);
  };

  // Programme change inside modal
  const handleProgrammeChangeInModal = (progId: string) => {
    setSelectedProgrammeId(progId);
    const prog = programmes.find((p) => p.id === progId);
    if (!prog) return;

    const isTeam = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';
    const entries = teamProgrammeEntries.filter((e) => e.programmeId === progId);

    setFormJudgeId(judgeId || prog.assignedJudgeIds[0] || judges[0]?.id || '');
    setFormParticipantId(prog.registeredParticipantIds[0] || participants[0]?.id || '');
    setFormTeamEntryId(entries[0]?.id || '');
    setFormTeamId(entries[0]?.teamId || prog.registeredTeamIds[0] || teams[0]?.id || '');
    setCriteriaScores(
      prog.criteria.map((c) => ({
        criterionId: c.id,
        criterionName: c.name,
        marksObtained: Math.round(c.maxMarks * 0.75),
        maxMarks: c.maxMarks,
      }))
    );
  };

  // Submit Score Form
  const handleSubmitScoreForm = (e: React.FormEvent) => {
    e.preventDefault();
    const prog = programmes.find((p) => p.id === selectedProgrammeId);
    const judge = judges.find((j) => j.id === formJudgeId) || { name: currentUser.name };
    if (!prog) return;

    // Requirement 6: Ensure judges can only score programmes assigned to them (if specific assignments exist)
    if (isJudgeOnly && judgeId && prog.assignedJudgeIds && prog.assignedJudgeIds.length > 0 && !prog.assignedJudgeIds.includes(judgeId)) {
      addToast('error', 'Unauthorized Score Submission', 'Judges can only record scores for events assigned to them.');
      return;
    }

    // Validate marks within ranges
    for (const item of criteriaScores) {
      if (item.marksObtained < 0 || item.marksObtained > item.maxMarks) {
        addToast(
          'error',
          'Invalid Marks',
          `Marks for "${item.criterionName}" must be between 0 and ${item.maxMarks}.`
        );
        return;
      }
    }

    const isTeam = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';
    const entryObj = formTeamEntryId ? teamProgrammeEntries.find((e) => e.id === formTeamEntryId) : undefined;

    submitOrUpdateScore({
      id: editingScore?.id,
      programmeId: selectedProgrammeId,
      judgeId: formJudgeId,
      judgeName: judge.name,
      participantId: isTeam ? undefined : formParticipantId,
      teamEntryId: isTeam ? formTeamEntryId : undefined,
      teamEntryName: isTeam ? (entryObj?.entryName || teams.find((t) => t.id === formTeamId)?.name) : undefined,
      teamId: isTeam ? (entryObj?.teamId || formTeamId) : formTeamId,
      scores: criteriaScores,
      totalScore: criteriaScores.reduce((sum, item) => sum + item.marksObtained, 0),
      notes: formNotes,
      status: formStatus,
    });

    setIsScoreModalOpen(false);
  };

  const canApprove = hasPermission(['super_admin', 'admin', 'score_manager']);
  const canRecord = canApprove || isJudgeOnly;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isJudgeOnly ? 'Jury Adjudication & Scoring Sheet' : 'Scores & Results Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isJudgeOnly
              ? 'Evaluate competition performances, enter official criteria marks, and submit scores.'
              : 'Record judge evaluation sheets, review marks, calibrate scores, and publish ratified results.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canRecord && (
            <button
              onClick={handleOpenAddScore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Scores</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programme, judge, participant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-800"
            />
          </div>

          <div>
            <select
              value={filterProgramme}
              onChange={(e) => setFilterProgramme(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800 truncate"
            >
              <option value="all">All Programmes ({programmes.length})</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Score Statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <select
              value={filterJudge}
              onChange={(e) => setFilterJudge(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Judges</option>
              {judges.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Programme Results Publication Status Widget */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Programmes Ready for Result Publication
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {programmes.map((prog) => {
            const progScores = scores.filter((s) => s.programmeId === prog.id);
            const hasScores = progScores.length > 0;
            const isPublished = prog.resultPublished;

            return (
              <div
                key={prog.id}
                className="p-3 rounded border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                    {prog.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {prog.code} • {progScores.length} score entries
                  </div>
                </div>

                <div>
                  {isPublished ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  ) : hasScores && canApprove ? (
                    <button
                      onClick={() => setConfirmPublishId(prog.id)}
                      className="px-2.5 py-1 rounded bg-slate-900 text-white font-medium hover:bg-slate-800 text-[11px] flex items-center gap-1"
                    >
                      <Trophy className="w-3 h-3" />
                      <span>Publish</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {hasScores ? 'Reviewing' : 'No entries'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scores Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Entry ID</th>
                <th className="py-3 px-3">Programme</th>
                <th className="py-3 px-3">Competitor / Team</th>
                <th className="py-3 px-3">Judge</th>
                <th className="py-3 px-2 text-center">Total Score</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3">Submitted At</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No score submissions matching current filter.
                  </td>
                </tr>
              ) : (
                filteredScores.map((score) => {
                  const prog = programmes.find((p) => p.id === score.programmeId);
                  const team = teams.find((t) => t.id === score.teamId);
                  const participant = participants.find((pt) => pt.id === score.participantId);

                  return (
                    <tr key={score.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {score.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {prog?.name || score.programmeId}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {prog?.code} • {prog?.category}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {score.teamEntryName || (participant ? participant.name : team?.name)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {score.teamEntryId || (prog && (prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team'))
                            ? `${team?.name} (Team Entry)`
                            : participant
                            ? `${participant.category} • ${team?.name}`
                            : team?.name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {score.judgeName}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {score.totalScore}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={score.status} size="sm">
                          {score.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {score.submittedAt}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setViewingScore(score)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="View Breakdown & Revisions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {(canApprove || (isJudgeOnly && (score.judgeId === judgeId || score.judgeId === currentUser.id) && score.status !== 'approved')) && (
                            <button
                              onClick={() => handleOpenEditScore(score)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Edit / Calibrate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canApprove && (
                            <>
                              {score.status === 'submitted' && (
                                <button
                                  onClick={() => updateScoreStatus(score.id, 'reviewed')}
                                  className="p-1 rounded text-blue-600 hover:bg-blue-50"
                                  title="Mark as Reviewed"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {score.status === 'reviewed' && (
                                <button
                                  onClick={() => updateScoreStatus(score.id, 'approved')}
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                                  title="Approve Score"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Score Modal */}
      <Modal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title={editingScore ? `Edit Score: ${editingScore.id}` : 'Record Judges Evaluation Sheet'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitScoreForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Programme / Competition *
              </label>
              <select
                value={selectedProgrammeId}
                onChange={(e) => handleProgrammeChangeInModal(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Adjudicating Judge *
              </label>
              <select
                value={formJudgeId}
                onChange={(e) => setFormJudgeId(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                {judges.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.designation})
                  </option>
                ))}
              </select>
            </div>

            {activeFormProgramme?.type === 'individual' || activeFormProgramme?.programmeType === 'individual' ? (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Participant * (Shows Category & Team)
                </label>
                <select
                  value={formParticipantId}
                  onChange={(e) => {
                    setFormParticipantId(e.target.value);
                    const pt = participants.find((p) => p.id === e.target.value);
                    if (pt) setFormTeamId(pt.teamId);
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                >
                  {participants.map((pt) => {
                    const tm = teams.find((t) => t.id === pt.teamId);
                    return (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.category}) — {tm?.name || pt.teamId}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Competing Team Entry *
                </label>
                {teamProgrammeEntries.filter((e) => e.programmeId === selectedProgrammeId).length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={formTeamEntryId}
                      onChange={(e) => {
                        setFormTeamEntryId(e.target.value);
                        const ent = teamProgrammeEntries.find((item) => item.id === e.target.value);
                        if (ent) setFormTeamId(ent.teamId);
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
                    >
                      {teamProgrammeEntries
                        .filter((e) => e.programmeId === selectedProgrammeId)
                        .map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.entryName} ({ent.teamName}) — {ent.memberParticipantIds.length} members
                          </option>
                        ))}
                    </select>

                    {(() => {
                      const ent = teamProgrammeEntries.find((item) => item.id === formTeamEntryId);
                      if (!ent) return null;
                      return (
                        <div className="p-2.5 bg-purple-50 rounded border border-purple-200 text-xs text-purple-900">
                          <span className="font-semibold block mb-0.5">
                            Team Entry Members ({ent.memberParticipantIds.length}):
                          </span>
                          <span className="text-slate-700">
                            {ent.memberNames?.join(', ') || ent.memberParticipantIds.join(', ')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      value={formTeamId}
                      onChange={(e) => setFormTeamId(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-amber-700 italic">
                      No explicit team entries registered yet for this event; score will be awarded directly to the team.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Score Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ScoreStatus)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          {/* Criteria Inputs */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Marks per Evaluation Criteria
            </label>
            <div className="space-y-2 border border-slate-200 rounded p-3 bg-slate-50">
              {criteriaScores.map((crit, idx) => (
                <div key={crit.criterionId} className="flex items-center justify-between gap-3">
                  <span className="text-slate-800 font-medium flex-1">
                    {crit.criterionName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      required
                      min={0}
                      max={crit.maxMarks}
                      value={crit.marksObtained}
                      onChange={(e) => {
                        const updated = [...criteriaScores];
                        updated[idx].marksObtained = Number(e.target.value);
                        setCriteriaScores(updated);
                      }}
                      className="w-20 border border-slate-300 rounded px-2.5 py-1 font-mono text-right text-xs bg-white"
                    />
                    <span className="text-slate-400 font-mono w-14">
                      / {crit.maxMarks}
                    </span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Calculated Total:</span>
                <span className="font-mono text-sm">
                  {criteriaScores.reduce((sum, item) => sum + item.marksObtained, 0)} marks
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Adjudicator Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Flawless synchronization, minor pause in intro"
              className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsScoreModalOpen(false)}
              className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-slate-900 rounded hover:bg-slate-800 font-medium"
            >
              {editingScore ? 'Save Calibration' : 'Submit Scores'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Score Details & Revision Audit Modal */}
      {viewingScore && (
        <Modal
          isOpen={!!viewingScore}
          onClose={() => setViewingScore(null)}
          title={`Score Sheet Dossier: ${viewingScore.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Programme</span>
                <p className="font-semibold text-slate-900">
                  {programmes.find((p) => p.id === viewingScore.programmeId)?.name}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                <p className="mt-0.5">
                  <Badge variant={viewingScore.status} size="sm">
                    {viewingScore.status}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Judge</span>
                <p className="font-medium text-slate-800">{viewingScore.judgeName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Submitted At</span>
                <p className="font-mono text-slate-700">{viewingScore.submittedAt}</p>
              </div>
            </div>

            {viewingScore.teamEntryId ? (
              <div className="p-3 bg-purple-50 rounded border border-purple-200">
                <span className="text-[10px] text-purple-900 uppercase font-semibold block mb-0.5">
                  Competing Team Entry
                </span>
                <p className="font-bold text-xs text-purple-950">
                  {viewingScore.teamEntryName || teamProgrammeEntries.find((e) => e.id === viewingScore.teamEntryId)?.entryName || 'Team Entry'}{' '}
                  <span className="text-slate-500 font-normal">
                    ({teams.find((t) => t.id === viewingScore.teamId)?.name})
                  </span>
                </p>
                {(() => {
                  const ent = teamProgrammeEntries.find((e) => e.id === viewingScore.teamEntryId);
                  if (!ent) return null;
                  return (
                    <p className="mt-1 text-[11px] text-slate-700">
                      <strong className="text-slate-800">Members ({ent.memberParticipantIds.length}):</strong>{' '}
                      {ent.memberNames?.join(', ') || ent.memberParticipantIds.join(', ')}
                    </p>
                  );
                })()}
              </div>
            ) : viewingScore.participantId ? (
              <div className="p-2.5 bg-blue-50 rounded border border-blue-200 text-xs text-blue-950">
                <span className="text-[10px] text-blue-800 uppercase font-semibold block mb-0.5">Solo Competitor</span>
                <p className="font-bold">
                  {participants.find((p) => p.id === viewingScore.participantId)?.name}
                  <span className="text-slate-500 font-normal ml-1">
                    (Category: {participants.find((p) => p.id === viewingScore.participantId)?.category}) • {teams.find((t) => t.id === viewingScore.teamId)?.name}
                  </span>
                </p>
              </div>
            ) : null}

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Criteria Breakdown</h4>
              <div className="border border-slate-200 rounded divide-y divide-slate-100">
                {viewingScore.scores.map((sc) => (
                  <div key={sc.criterionId} className="p-2.5 flex justify-between">
                    <span className="text-slate-800">{sc.criterionName}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {sc.marksObtained} / {sc.maxMarks}
                    </span>
                  </div>
                ))}
                <div className="p-2.5 bg-slate-50 flex justify-between font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-sm">{viewingScore.totalScore} pts</span>
                </div>
              </div>
            </div>

            {/* Revision Audit History */}
            {viewingScore.revisionHistory && viewingScore.revisionHistory.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Score Revision History & Audit Trail
                </h4>
                <div className="space-y-1.5 border border-slate-200 rounded p-2.5 bg-slate-50">
                  {viewingScore.revisionHistory.map((rev, i) => (
                    <div key={i} className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">{rev.revisedBy}</span> at{' '}
                      <span className="font-mono">{rev.revisedAt}</span> changed previous total ({rev.previousTotal}). Reason: {rev.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingScore(null)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation to Publish Results */}
      <ConfirmDialog
        isOpen={!!confirmPublishId}
        onClose={() => setConfirmPublishId(null)}
        onConfirm={() => {
          if (confirmPublishId) publishProgrammeResults(confirmPublishId);
        }}
        title="Ratify & Publish Programme Results"
        message="This action computes final rankings using server scoring algorithms, updates the overall team points leaderboard, and makes results visible on the visitor Public Page. Proceed?"
        confirmLabel="Ratify & Publish"
        isDestructive={false}
      />
    </div>
  );
};
