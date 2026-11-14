import React, { useState, useMemo, useEffect } from 'react';
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
  AlertTriangle,
  FileCheck2,
  Clock,
  Eye,
  Edit2,
  Send,
  History,
  Lock,
  ArrowRight,
  Trophy,
  Filter,
  FileSpreadsheet,
  Save,
  Users,
  User,
  Sliders,
  Check,
  RotateCcw
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
    assignments,
    hasPermission,
    addToast,
  } = useFest();

  // Active View Tab: 'sheet' (Fast Score Sheet Matrix) or 'all' (Historical Submissions & Audit Dossier)
  const [activeTab, setActiveTab] = useState<'sheet' | 'all'>('sheet');

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

  // Score Entry Modal Form State (Maintained for historical / individual score editing)
  const [formJudgeId, setFormJudgeId] = useState('');
  const [formParticipantId, setFormParticipantId] = useState('');
  const [formTeamEntryId, setFormTeamEntryId] = useState('');
  const [formTeamId, setFormTeamId] = useState('');
  const [formStatus, setFormStatus] = useState<ScoreStatus>('submitted');
  const [formNotes, setFormNotes] = useState('');
  const [criteriaScores, setCriteriaScores] = useState<ScoreDetail[]>([]);

  // Selected programme object for single modal
  const activeFormProgramme = programmes.find((p) => p.id === selectedProgrammeId);

  const isJudgeOnly = currentUser.role === 'judge';
  const judgeId = currentUser.linkedJudgeId || (isJudgeOnly ? currentUser.id : undefined);

  // Filtered score submissions for the 'all' tab
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

  // =========================================================================
  // FAST SCORE SHEET STATE & LOGIC
  // =========================================================================
  const [sheetProgrammeId, setSheetProgrammeId] = useState<string>(() => scorableProgrammes[0]?.id || programmes[0]?.id || '');
  const [sheetJudgeId, setSheetJudgeId] = useState<string>('');
  const [sheetMode, setSheetMode] = useState<'criteria' | 'quick'>('criteria');
  const [sheetStatus, setSheetStatus] = useState<ScoreStatus>('submitted');

  // Currently selected programme in the Fast Score Sheet
  const activeSheetProg = useMemo(
    () => programmes.find((p) => p.id === sheetProgrammeId),
    [programmes, sheetProgrammeId]
  );

  const isSheetProgTeam = useMemo(() => {
    if (!activeSheetProg) return false;
    return (
      activeSheetProg.type === 'team' ||
      activeSheetProg.type === 'group' ||
      activeSheetProg.programmeType === 'team'
    );
  }, [activeSheetProg]);

  // Synchronize sheetProgrammeId if programmes change or current selection is not in scorableProgrammes
  useEffect(() => {
    if (scorableProgrammes.length > 0) {
      if (!scorableProgrammes.some((p) => p.id === sheetProgrammeId)) {
        setSheetProgrammeId(scorableProgrammes[0].id);
      }
    }
  }, [scorableProgrammes, sheetProgrammeId]);

  // Automatically set or synchronize judge when programme or judge changes
  useEffect(() => {
    if (isJudgeOnly && judgeId) {
      setSheetJudgeId(judgeId);
      return;
    }
    if (activeSheetProg) {
      if (activeSheetProg.assignedJudgeIds && activeSheetProg.assignedJudgeIds.length > 0) {
        if (!sheetJudgeId || !activeSheetProg.assignedJudgeIds.includes(sheetJudgeId)) {
          setSheetJudgeId(activeSheetProg.assignedJudgeIds[0]);
        }
      } else if ((!sheetJudgeId || !judges.some((j) => j.id === sheetJudgeId)) && judges.length > 0) {
        setSheetJudgeId(judges[0].id);
      }
    }
  }, [activeSheetProg, isJudgeOnly, judgeId, judges, sheetJudgeId]);

  // Scoring criteria for the active programme
  const sheetCriteriaList = useMemo(() => {
    if (activeSheetProg?.criteria && activeSheetProg.criteria.length > 0) {
      return activeSheetProg.criteria;
    }
    return [
      {
        id: 'performance',
        name: 'Performance & Presentation',
        maxMarks: 100,
      },
    ];
  }, [activeSheetProg]);

  const sheetMaxTotalMarks = useMemo(() => {
    return sheetCriteriaList.reduce((sum, c) => sum + c.maxMarks, 0);
  }, [sheetCriteriaList]);

  // Dynamically resolve only the competitors enrolled in this specific programme
  const sheetCompetitors = useMemo(() => {
    if (!activeSheetProg) return [];

    if (isSheetProgTeam) {
      // 1. Check Team Programme Entries
      const entries = teamProgrammeEntries.filter((e) => e.programmeId === activeSheetProg.id);
      if (entries.length > 0) {
        return entries.map((entry) => ({
          key: entry.id,
          id: entry.id,
          name: entry.entryName,
          teamId: entry.teamId,
          teamName: entry.teamName || teams.find((t) => t.id === entry.teamId)?.name || entry.teamId,
          isTeamEntry: true,
          chestNumber: entry.id.replace('TPE-', '#'),
          subtitle: `${entry.memberParticipantIds?.length || 0} members • ${entry.categoryName || entry.categoryId || 'General'}`,
        }));
      }

      // 2. Fallback to registeredTeamIds on programme
      if (activeSheetProg.registeredTeamIds && activeSheetProg.registeredTeamIds.length > 0) {
        return activeSheetProg.registeredTeamIds.map((tId) => {
          const tm = teams.find((t) => t.id === tId);
          return {
            key: tId,
            id: tId,
            name: tm?.name || tId,
            teamId: tId,
            teamName: tm?.name || tId,
            isTeamEntry: false,
            chestNumber: tm?.code || tId,
            subtitle: `Team Entry (${tm?.code || tId})`,
          };
        });
      }

      // 3. Fallback to all teams in the fest
      return teams.map((tm) => ({
        key: tm.id,
        id: tm.id,
        name: tm.name,
        teamId: tm.id,
        teamName: tm.name,
        isTeamEntry: false,
        chestNumber: tm.code,
        subtitle: `Team Entry (${tm.code})`,
      }));
    } else {
      // Individual Programme Competitors
      const candidateIds = new Set<string>();
      (activeSheetProg.registeredParticipantIds || []).forEach((id) => candidateIds.add(id));
      participants.forEach((p) => {
        if (p.registeredProgrammes?.includes(activeSheetProg.id)) candidateIds.add(p.id);
      });
      (assignments || []).forEach((asg) => {
        if (asg.programmeId === activeSheetProg.id) {
          (asg.participantIds || []).forEach((pId) => candidateIds.add(pId));
        }
      });

      const registered = participants.filter((p) => candidateIds.has(p.id));
      const targetList = registered.length > 0
        ? registered
        : participants.filter((p) => !activeSheetProg.category || p.category === activeSheetProg.category || participants.length <= 10);

      const finalList = targetList.length > 0 ? targetList : participants;

      return finalList.map((pt) => {
        const tm = teams.find((t) => t.id === pt.teamId);
        return {
          key: pt.id,
          id: pt.id,
          name: pt.name,
          teamId: pt.teamId,
          teamName: tm?.name || pt.teamId,
          isTeamEntry: false,
          chestNumber: pt.chestNumber ? `#${pt.chestNumber}` : pt.id.replace('PT-', '#'),
          subtitle: `${pt.category} • ${tm?.name || pt.teamId}`,
        };
      });
    }
  }, [activeSheetProg, isSheetProgTeam, teamProgrammeEntries, teams, participants, assignments]);

  // Fast Score Sheet State: row-keyed marks
  const [sheetMarks, setSheetMarks] = useState<
    Record<
      string,
      {
        criteria: Record<string, number>;
        quickTotal: number;
        notes: string;
        isSaved: boolean;
        existingScoreId?: string;
      }
    >
  >({});

  // Synchronize existing submitted scores into sheet whenever programme or judge changes
  useEffect(() => {
    if (!sheetProgrammeId || !sheetJudgeId) return;

    const existingScores = scores.filter(
      (s) => s.programmeId === sheetProgrammeId && s.judgeId === sheetJudgeId
    );

    const initialMarks: Record<
      string,
      {
        criteria: Record<string, number>;
        quickTotal: number;
        notes: string;
        isSaved: boolean;
        existingScoreId?: string;
      }
    > = {};

    existingScores.forEach((s) => {
      const key = isSheetProgTeam
        ? s.teamEntryId || s.teamId || ''
        : s.participantId || '';
      if (!key) return;

      const critMap: Record<string, number> = {};
      s.scores.forEach((sc) => {
        critMap[sc.criterionId] = sc.marksObtained;
      });

      initialMarks[key] = {
        criteria: critMap,
        quickTotal: s.totalScore,
        notes: s.notes || '',
        isSaved: true,
        existingScoreId: s.id,
      };
    });

    setSheetMarks(initialMarks);
  }, [sheetProgrammeId, sheetJudgeId, scores, isSheetProgTeam]);

  // Handle criterion input change
  const handleSheetCriterionChange = (
    key: string,
    critId: string,
    valStr: string,
    maxVal: number
  ) => {
    const rawVal = valStr === '' ? 0 : parseInt(valStr, 10);
    const val = isNaN(rawVal) ? 0 : Math.max(0, Math.min(maxVal, rawVal));

    setSheetMarks((prev) => {
      const current = prev[key] || {
        criteria: {},
        quickTotal: 0,
        notes: '',
        isSaved: false,
      };
      const updatedCriteria = {
        ...current.criteria,
        [critId]: val,
      };
      const sum = sheetCriteriaList.reduce(
        (acc, c) => acc + (updatedCriteria[c.id] ?? 0),
        0
      );
      return {
        ...prev,
        [key]: {
          ...current,
          criteria: updatedCriteria,
          quickTotal: sum,
          isSaved: false,
        },
      };
    });
  };

  // Handle quick total input change
  const handleSheetQuickTotalChange = (
    key: string,
    valStr: string,
    maxTotal: number
  ) => {
    const rawVal = valStr === '' ? 0 : parseInt(valStr, 10);
    const val = isNaN(rawVal) ? 0 : Math.max(0, Math.min(maxTotal, rawVal));

    setSheetMarks((prev) => {
      const current = prev[key] || {
        criteria: {},
        quickTotal: 0,
        notes: '',
        isSaved: false,
      };

      // Distribute proportionally across criteria
      const updatedCriteria: Record<string, number> = {};
      if (sheetCriteriaList.length > 0 && maxTotal > 0) {
        let remaining = val;
        sheetCriteriaList.forEach((c, idx) => {
          if (idx === sheetCriteriaList.length - 1) {
            updatedCriteria[c.id] = Math.max(0, Math.min(c.maxMarks, remaining));
          } else {
            const portion = Math.round((c.maxMarks / maxTotal) * val);
            const clamped = Math.max(0, Math.min(c.maxMarks, portion));
            updatedCriteria[c.id] = clamped;
            remaining -= clamped;
          }
        });
      }

      return {
        ...prev,
        [key]: {
          ...current,
          criteria: updatedCriteria,
          quickTotal: val,
          isSaved: false,
        },
      };
    });
  };

  // Handle notes change
  const handleSheetNotesChange = (key: string, notes: string) => {
    setSheetMarks((prev) => {
      const current = prev[key] || {
        criteria: {},
        quickTotal: 0,
        notes: '',
        isSaved: false,
      };
      return {
        ...prev,
        [key]: {
          ...current,
          notes,
          isSaved: false,
        },
      };
    });
  };

  // Save all scores from the sheet in one atomic action
  const handleSaveAllSheetMarks = () => {
    if (!activeSheetProg || !sheetJudgeId) {
      addToast('warning', 'Missing Details', 'Please select a programme and judge.');
      return;
    }

    const judgeObj = judges.find((j) => j.id === sheetJudgeId) || {
      name: currentUser.name,
    };

    let savedCount = 0;

    sheetCompetitors.forEach((comp) => {
      const data = sheetMarks[comp.key];
      // Only save if marks have been entered or existing record exists
      if (!data || (data.quickTotal === 0 && !data.existingScoreId && !data.notes)) {
        return;
      }

      const scoresPayload: ScoreDetail[] = sheetCriteriaList.map((crit) => ({
        criterionId: crit.id,
        criterionName: crit.name,
        marksObtained: data.criteria[crit.id] ?? 0,
        maxMarks: crit.maxMarks,
      }));

      submitOrUpdateScore({
        id: data.existingScoreId,
        programmeId: activeSheetProg.id,
        judgeId: sheetJudgeId,
        judgeName: judgeObj.name,
        participantId: isSheetProgTeam ? undefined : comp.id,
        teamEntryId: isSheetProgTeam && comp.isTeamEntry ? comp.id : undefined,
        teamEntryName: isSheetProgTeam ? comp.name : undefined,
        teamId: comp.teamId,
        scores: scoresPayload,
        totalScore: data.quickTotal,
        notes: data.notes || '',
        status: sheetStatus,
      });

      savedCount++;
    });

    if (savedCount > 0) {
      addToast(
        'success',
        'Scores Saved',
        `Successfully saved score evaluation for ${savedCount} competitor(s).`
      );
    } else {
      addToast('info', 'No Entries to Save', 'Enter marks for at least one competitor before saving.');
    }
  };

  // Compute live ranks and tie detection
  const sheetRankings = useMemo(() => {
    const list = sheetCompetitors.map((comp) => {
      const data = sheetMarks[comp.key];
      const total = data?.quickTotal ?? 0;
      return {
        ...comp,
        total,
        isSaved: data?.isSaved ?? false,
      };
    });

    list.sort((a, b) => b.total - a.total);

    let rank = 1;
    return list.map((item, index) => {
      if (index > 0 && item.total < list[index - 1].total) {
        rank = index + 1;
      }
      return {
        ...item,
        rank: item.total > 0 ? rank : null,
      };
    });
  }, [sheetCompetitors, sheetMarks]);

  const sheetPodium = useMemo(() => {
    return sheetRankings.filter((r) => r.rank !== null && r.rank <= 3 && r.total > 0);
  }, [sheetRankings]);

  const sheetPodiumTies = useMemo(() => {
    const map: Record<number, typeof sheetPodium> = {};
    sheetPodium.forEach((p) => {
      map[p.total] = map[p.total] || [];
      map[p.total].push(p);
    });
    return Object.values(map).filter((group) => group.length > 1);
  }, [sheetPodium]);

  // =========================================================================
  // SINGLE ENTRY / EDIT MODAL WORKFLOW (HISTORICAL COMPATIBILITY)
  // =========================================================================
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

  const handleProgrammeChangeInModal = (progId: string) => {
    setSelectedProgrammeId(progId);
    const prog = programmes.find((p) => p.id === progId);
    if (!prog) return;

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

  const handleSubmitScoreForm = (e: React.FormEvent) => {
    e.preventDefault();
    const prog = programmes.find((p) => p.id === selectedProgrammeId);
    const judge = judges.find((j) => j.id === formJudgeId) || { name: currentUser.name };
    if (!prog) return;

    if (isJudgeOnly && judgeId && prog.assignedJudgeIds && prog.assignedJudgeIds.length > 0 && !prog.assignedJudgeIds.includes(judgeId)) {
      addToast('error', 'Unauthorized Score Submission', 'Judges can only record scores for events assigned to them.');
      return;
    }

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
      {/* Top Header */}
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
          {/* View Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('sheet')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'sheet'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Fast Score Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>All Submissions ({filteredScores.length})</span>
            </button>
          </div>

          {canRecord && (
            <button
              onClick={handleOpenAddScore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs"
              title="Record or calibrate single competitor score"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Single Score</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: FAST SCORE SHEET (PRIMARY STREAMLINED INTERFACE)             */}
      {/* =================================================================== */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          {/* Sheet Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* Programme Selector */}
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Select Competition Programme
                </label>
                <select
                  value={sheetProgrammeId}
                  onChange={(e) => setSheetProgrammeId(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  {scorableProgrammes.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} • {p.category} ({p.type === 'team' || p.type === 'group' || p.programmeType === 'team' ? 'Team' : 'Solo'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Judge Selector */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Select Adjudicating Judge
                </label>
                <select
                  disabled={isJudgeOnly}
                  value={sheetJudgeId}
                  onChange={(e) => setSheetJudgeId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-600 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  {judges.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.designation || 'Jury Member'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle & Status */}
              <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2">
                <div className="inline-flex p-1 bg-slate-100 rounded border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setSheetMode('criteria')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      sheetMode === 'criteria'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Criteria Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetMode('quick')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      sheetMode === 'quick'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Quick Total
                  </button>
                </div>
              </div>
            </div>

            {/* Event Info Strip */}
            {activeSheetProg && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-800">
                    Category: <span className="font-normal text-slate-600">{activeSheetProg.category}</span>
                  </span>
                  <span>•</span>
                  <span>
                    Venue: <strong className="text-slate-700">{activeSheetProg.venue || 'Main Stage'}</strong> ({activeSheetProg.stage || 'Stage 1'})
                  </span>
                  <span>•</span>
                  <span>
                    Schedule: <strong className="text-slate-700">{activeSheetProg.date}</strong> at {activeSheetProg.startTime || '10:00'}
                  </span>
                  <span>•</span>
                  <span>
                    Max Marks: <strong className="text-purple-700 font-mono">{sheetMaxTotalMarks} pts</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeSheetProg.resultPublished ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Results Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
                      <Clock className="w-3.5 h-3.5" /> Scoring In Progress
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Podium Standings & Tie Alert Banner */}
          {sheetPodium.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200/80 rounded-lg p-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Live Podium Evaluation Standings</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    (Updates in real-time as you enter marks)
                  </span>
                </div>

                {sheetPodiumTies.length > 0 && sheetPodiumTies[0]?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                    Tie Detected on Podium ({sheetPodiumTies[0].map((t) => t.name).join(' & ')} tied at {sheetPodiumTies[0][0]?.total ?? 0} pts)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {sheetPodium.map((pod) => {
                  const medal = pod.rank === 1 ? '🥇 1st' : pod.rank === 2 ? '🥈 2nd' : '🥉 3rd';
                  const bg =
                    pod.rank === 1
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : pod.rank === 2
                      ? 'bg-slate-50 border-slate-300 text-slate-950'
                      : 'bg-orange-50 border-orange-300 text-orange-950';

                  return (
                    <div
                      key={pod.key}
                      className={`p-2.5 rounded-md border flex items-center justify-between text-xs ${bg}`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 font-bold truncate">
                          <span>{medal}</span>
                          <span className="truncate">{pod.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {pod.chestNumber} • {pod.teamName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm block">
                          {pod.total}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Competitor Scoring Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Contestant Score Sheet
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({sheetCompetitors.length} enrolled competitor{sheetCompetitors.length === 1 ? '' : 's'})
                </span>
              </div>

              <div className="text-xs text-slate-500 italic">
                Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Tab</kbd> to jump between competitors
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-16 text-center">Rank</th>
                    <th className="py-2.5 px-3 w-24">Chest #</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Competitor / Team</th>

                    {sheetMode === 'criteria' ? (
                      sheetCriteriaList.map((crit) => (
                        <th key={crit.id} className="py-2.5 px-3 text-center min-w-[100px]">
                          <div>{crit.name}</div>
                          <div className="text-[10px] text-purple-600 font-normal font-mono">
                            max {crit.maxMarks}
                          </div>
                        </th>
                      ))
                    ) : (
                      <th className="py-2.5 px-3 text-center min-w-[120px]">
                        <div>Total Score</div>
                        <div className="text-[10px] text-purple-600 font-normal font-mono">
                          max {sheetMaxTotalMarks}
                        </div>
                      </th>
                    )}

                    <th className="py-2.5 px-3 text-center w-28">Calculated</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Adjudicator Remarks</th>
                    <th className="py-2.5 px-3 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheetCompetitors.length === 0 ? (
                    <tr>
                      <td colSpan={sheetCriteriaList.length + 5} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No competitors currently registered or available for this event.
                      </td>
                    </tr>
                  ) : (
                    sheetCompetitors.map((comp) => {
                      const data = sheetMarks[comp.key];
                      const total = data?.quickTotal ?? 0;
                      const rankedObj = sheetRankings.find((r) => r.key === comp.key);
                      const rank = rankedObj?.rank;

                      return (
                        <tr key={comp.key} className="hover:bg-slate-50/60 transition-colors">
                          {/* Live Rank */}
                          <td className="py-3 px-3 text-center font-bold">
                            {rank === 1 ? (
                              <span className="text-amber-600 font-extrabold text-sm" title="1st Place">🥇 1</span>
                            ) : rank === 2 ? (
                              <span className="text-slate-600 font-extrabold text-sm" title="2nd Place">🥈 2</span>
                            ) : rank === 3 ? (
                              <span className="text-orange-600 font-extrabold text-sm" title="3rd Place">🥉 3</span>
                            ) : rank ? (
                              <span className="text-slate-500 font-mono text-xs">#{rank}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Chest Number */}
                          <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 text-[11px] border border-slate-200">
                              {comp.chestNumber}
                            </span>
                          </td>

                          {/* Competitor Details */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{comp.name}</div>
                            <div className="text-[11px] text-slate-500">{comp.subtitle}</div>
                          </td>

                          {/* Marks Input Columns */}
                          {sheetMode === 'criteria' ? (
                            sheetCriteriaList.map((crit) => {
                              const val = data?.criteria[crit.id] ?? '';
                              return (
                                <td key={crit.id} className="py-3 px-3 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={crit.maxMarks}
                                    placeholder="0"
                                    value={val}
                                    onChange={(e) =>
                                      handleSheetCriterionChange(
                                        comp.key,
                                        crit.id,
                                        e.target.value,
                                        crit.maxMarks
                                      )
                                    }
                                    className="w-16 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                                  />
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={sheetMaxTotalMarks}
                                placeholder="0"
                                value={data?.quickTotal ? data.quickTotal : ''}
                                onChange={(e) =>
                                  handleSheetQuickTotalChange(
                                    comp.key,
                                    e.target.value,
                                    sheetMaxTotalMarks
                                  )
                                }
                                className="w-20 text-center font-mono font-black text-sm bg-white border border-slate-300 rounded px-2 py-1 text-purple-700 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                              />
                            </td>
                          )}

                          {/* Total Score */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-mono text-sm font-bold ${
                                total > 0 ? 'text-purple-700' : 'text-slate-400'
                              }`}
                            >
                              {total}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              / {sheetMaxTotalMarks}
                            </span>
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              placeholder="e.g. Clean timing, good rhythm..."
                              value={data?.notes || ''}
                              onChange={(e) => handleSheetNotesChange(comp.key, e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                            />
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            {data?.isSaved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="w-3 h-3" /> Saved
                              </span>
                            ) : total > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Unsaved
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <span>
                  Scored: <strong className="text-slate-900">{sheetRankings.filter((r) => r.total > 0).length}</strong> of{' '}
                  <strong className="text-slate-900">{sheetCompetitors.length}</strong> competitors
                </span>
              </div>

              <div className="flex items-center gap-2">
                {canRecord && (
                  <button
                    type="button"
                    onClick={handleSaveAllSheetMarks}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Scores</span>
                  </button>
                )}

                {canApprove && activeSheetProg && (
                  <>
                    {activeSheetProg.resultPublished ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Results Live on Public Portal</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmPublishId(activeSheetProg.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs"
                      >
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>Ratify & Publish Results</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: HISTORICAL SUBMISSIONS TABLE & AUDIT DOSSIER                */}
      {/* =================================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* Record / Edit Score Modal (Single Entry / Calibration) */}
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
