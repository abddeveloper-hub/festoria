import React, { useState, useMemo, useEffect } from 'react';
import { useFest } from '../context/FestContext';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Search,
  CheckCircle2,
  Trophy,
  Filter,
  Users,
  Trash2,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  RotateCcw,
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
    settings,
    submitOrUpdateScore,
    deleteScore,
    publishProgrammeResults,
    deleteResult,
    deleteProgrammeResults,
    teamProgrammeEntries,
    assignments,
    hasPermission,
    addToast,
  } = useFest();

  // Active View Tab: 'winners' (Simple 1st/2nd/3rd Winner Selection) or 'published' (View Published Results)
  const [activeTab, setActiveTab] = useState<'winners' | 'published'>('winners');

  // Search in contestant list
  const [contestantSearch, setContestantSearch] = useState('');

  // Search & Filter in published results tab
  const [resultsSearch, setResultsSearch] = useState('');
  const [resultsFilterProgramme, setResultsFilterProgramme] = useState('all');

  // Event Picker Modal
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [eventPickerSearch, setEventPickerSearch] = useState('');
  const [eventPickerFilter, setEventPickerFilter] = useState<'all' | 'pending' | 'published'>('all');

  // Optional 4th and 5th places
  const [showExtraPlaces, setShowExtraPlaces] = useState(false);

  // Confirmations
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmRetractId, setConfirmRetractId] = useState<string | null>(null);
  const [confirmDeleteResultId, setConfirmDeleteResultId] = useState<string | null>(null);
  const [confirmClearWinners, setConfirmClearWinners] = useState(false);

  // Permissions & Role
  const isJudgeOnly = currentUser.role === 'judge';
  const judgeId = currentUser.linkedJudgeId || (isJudgeOnly ? currentUser.id : undefined);
  const canApprove = hasPermission(['super_admin', 'admin', 'score_manager', 'fest_admin']);

  // Scorable Programmes
  const scorableProgrammes = useMemo(() => {
    let list = programmes;
    if (isJudgeOnly && judgeId) {
      const assigned = programmes.filter((p) => p.assignedJudgeIds?.includes(judgeId));
      if (assigned.length > 0) {
        return [...assigned].sort((a, b) =>
          (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
          (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
        );
      }
    }
    return [...programmes].sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [programmes, isJudgeOnly, judgeId]);

  // Selected Programme
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(
    () => scorableProgrammes[0]?.id || programmes[0]?.id || ''
  );

  useEffect(() => {
    if (scorableProgrammes.length > 0 && !scorableProgrammes.some((p) => p.id === selectedProgrammeId)) {
      setSelectedProgrammeId(scorableProgrammes[0].id);
    }
  }, [scorableProgrammes, selectedProgrammeId]);

  const activeProgramme = useMemo(
    () => programmes.find((p) => p.id === selectedProgrammeId),
    [programmes, selectedProgrammeId]
  );

  const isTeamProg = useMemo(() => {
    if (!activeProgramme) return false;
    return (
      activeProgramme.type === 'team' ||
      activeProgramme.type === 'group' ||
      activeProgramme.programmeType === 'team'
    );
  }, [activeProgramme]);

  // Point rules for current event
  const pointRules = settings?.pointRules || {
    firstPlace: 10,
    secondPlace: 5,
    thirdPlace: 3,
    fourthPlace: 1,
    fifthPlace: 0,
    groupMultiplier: 2,
  };
  const multiplier = isTeamProg ? (pointRules.groupMultiplier || 2) : 1;
  const pts1 = (pointRules.firstPlace || 10) * multiplier;
  const pts2 = (pointRules.secondPlace || 5) * multiplier;
  const pts3 = (pointRules.thirdPlace || 3) * multiplier;
  const pts4 = (pointRules.fourthPlace || 0) * multiplier;
  const pts5 = (pointRules.fifthPlace || 0) * multiplier;

  // Selected Winners State (Keys: participantId for solo, or teamEntryId/teamId for team)
  const [firstPlaceKey, setFirstPlaceKey] = useState<string>('');
  const [secondPlaceKey, setSecondPlaceKey] = useState<string>('');
  const [thirdPlaceKey, setThirdPlaceKey] = useState<string>('');
  const [fourthPlaceKey, setFourthPlaceKey] = useState<string>('');
  const [fifthPlaceKey, setFifthPlaceKey] = useState<string>('');

  // Competitors enrolled in the active programme
  const competitors = useMemo(() => {
    if (!activeProgramme) return [];

    if (isTeamProg) {
      // 1. Team Programme Entries
      const entries = teamProgrammeEntries.filter((e) => e.programmeId === activeProgramme.id);
      if (entries.length > 0) {
        return entries.map((entry) => {
          const tm = teams.find((t) => t.id === entry.teamId);
          return {
            key: entry.id,
            id: entry.id,
            name: entry.entryName,
            teamId: entry.teamId,
            teamName: entry.teamName || tm?.name || entry.teamId,
            teamCode: tm?.code || '',
            isTeamEntry: true,
            chestNumber: entry.id.replace('TPE-', '#'),
            subtitle: `${entry.memberParticipantIds?.length || 0} members • ${entry.categoryName || entry.categoryId || 'General'}`,
          };
        });
      }

      // 2. Registered Team IDs
      if (activeProgramme.registeredTeamIds && activeProgramme.registeredTeamIds.length > 0) {
        return activeProgramme.registeredTeamIds.map((tId) => {
          const tm = teams.find((t) => t.id === tId);
          return {
            key: tId,
            id: tId,
            name: tm?.name || tId,
            teamId: tId,
            teamName: tm?.name || tId,
            teamCode: tm?.code || '',
            isTeamEntry: false,
            chestNumber: tm?.code || tId,
            subtitle: `Team Entry (${tm?.code || tId})`,
          };
        });
      }

      // 3. Fallback to all teams
      return teams.map((tm) => ({
        key: tm.id,
        id: tm.id,
        name: tm.name,
        teamId: tm.id,
        teamName: tm.name,
        teamCode: tm.code,
        isTeamEntry: false,
        chestNumber: tm.code,
        subtitle: `Team Entry (${tm.code})`,
      }));
    } else {
      // Individual Programme
      const candidateIds = new Set<string>();
      (activeProgramme.registeredParticipantIds || []).forEach((id) => candidateIds.add(id));
      participants.forEach((p) => {
        if (p.registeredProgrammes?.includes(activeProgramme.id)) candidateIds.add(p.id);
      });
      (assignments || []).forEach((asg) => {
        if (asg.programmeId === activeProgramme.id) {
          (asg.participantIds || []).forEach((pId) => candidateIds.add(pId));
        }
      });

      const registered = participants.filter((p) => candidateIds.has(p.id));
      const targetList = registered.length > 0
        ? registered
        : participants.filter((p) => !activeProgramme.category || p.category === activeProgramme.category || participants.length <= 10);

      const finalList = targetList.length > 0 ? targetList : participants;

      return finalList
        .map((pt) => {
          const tm = teams.find((t) => t.id === pt.teamId);
          return {
            key: pt.id,
            id: pt.id,
            name: pt.name,
            teamId: pt.teamId,
            teamName: tm?.name || pt.teamId,
            teamCode: tm?.code || '',
            isTeamEntry: false,
            chestNumber: pt.chestNumber ? `#${pt.chestNumber}` : pt.id.replace('PT-', '#'),
            rawChestNumber: pt.chestNumber || '',
            subtitle: `${pt.category} • ${tm?.name || pt.teamId}`,
          };
        })
        .sort((a, b) => {
          if (a.rawChestNumber && b.rawChestNumber) {
            return a.rawChestNumber.localeCompare(b.rawChestNumber, undefined, { numeric: true, sensitivity: 'base' });
          }
          if (a.rawChestNumber) return -1;
          if (b.rawChestNumber) return 1;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
    }
  }, [activeProgramme, isTeamProg, teamProgrammeEntries, teams, participants, assignments]);

  // Synchronize winners when selectedProgrammeId changes
  useEffect(() => {
    if (!selectedProgrammeId) return;

    // Check if official results exist for this programme
    const progResults = results.filter((r) => r.programmeId === selectedProgrammeId);
    if (progResults.length > 0) {
      const r1 = progResults.find((r) => r.rank === 1);
      const r2 = progResults.find((r) => r.rank === 2);
      const r3 = progResults.find((r) => r.rank === 3);
      const r4 = progResults.find((r) => r.rank === 4);
      const r5 = progResults.find((r) => r.rank === 5);

      setFirstPlaceKey(r1 ? (r1.teamEntryId || r1.participantId || r1.teamId || '') : '');
      setSecondPlaceKey(r2 ? (r2.teamEntryId || r2.participantId || r2.teamId || '') : '');
      setThirdPlaceKey(r3 ? (r3.teamEntryId || r3.participantId || r3.teamId || '') : '');
      setFourthPlaceKey(r4 ? (r4.teamEntryId || r4.participantId || r4.teamId || '') : '');
      setFifthPlaceKey(r5 ? (r5.teamEntryId || r5.participantId || r5.teamId || '') : '');

      if (r4 || r5) {
        setShowExtraPlaces(true);
      }
    } else {
      // Check if draft scores exist
      const progScores = scores.filter((s) => s.programmeId === selectedProgrammeId);
      if (progScores.length > 0) {
        const sorted = [...progScores].sort((a, b) => b.totalScore - a.totalScore);
        const k1 = sorted[0] ? (sorted[0].teamEntryId || sorted[0].participantId || sorted[0].teamId || '') : '';
        const k2 = sorted[1] ? (sorted[1].teamEntryId || sorted[1].participantId || sorted[1].teamId || '') : '';
        const k3 = sorted[2] ? (sorted[2].teamEntryId || sorted[2].participantId || sorted[2].teamId || '') : '';
        const k4 = sorted[3] ? (sorted[3].teamEntryId || sorted[3].participantId || sorted[3].teamId || '') : '';
        const k5 = sorted[4] ? (sorted[4].teamEntryId || sorted[4].participantId || sorted[4].teamId || '') : '';

        setFirstPlaceKey(k1);
        setSecondPlaceKey(k2);
        setThirdPlaceKey(k3);
        setFourthPlaceKey(k4);
        setFifthPlaceKey(k5);

        if (k4 || k5) {
          setShowExtraPlaces(true);
        }
      } else {
        setFirstPlaceKey('');
        setSecondPlaceKey('');
        setThirdPlaceKey('');
        setFourthPlaceKey('');
        setFifthPlaceKey('');
      }
    }
  }, [selectedProgrammeId, results, scores]);

  // Quick navigation: prev & next programme
  const currentProgIndex = scorableProgrammes.findIndex((p) => p.id === selectedProgrammeId);
  const handlePrevProgramme = () => {
    if (currentProgIndex > 0) {
      setSelectedProgrammeId(scorableProgrammes[currentProgIndex - 1].id);
    }
  };
  const handleNextProgramme = () => {
    if (currentProgIndex < scorableProgrammes.length - 1) {
      setSelectedProgrammeId(scorableProgrammes[currentProgIndex + 1].id);
    }
  };

  // Helper to toggle or assign rank from the contestant list
  const handleAssignRank = (key: string, rank: 1 | 2 | 3) => {
    if (rank === 1) {
      if (firstPlaceKey === key) {
        setFirstPlaceKey('');
      } else {
        setFirstPlaceKey(key);
        if (secondPlaceKey === key) setSecondPlaceKey('');
        if (thirdPlaceKey === key) setThirdPlaceKey('');
      }
    } else if (rank === 2) {
      if (secondPlaceKey === key) {
        setSecondPlaceKey('');
      } else {
        setSecondPlaceKey(key);
        if (firstPlaceKey === key) setFirstPlaceKey('');
        if (thirdPlaceKey === key) setThirdPlaceKey('');
      }
    } else if (rank === 3) {
      if (thirdPlaceKey === key) {
        setThirdPlaceKey('');
      } else {
        setThirdPlaceKey(key);
        if (firstPlaceKey === key) setFirstPlaceKey('');
        if (secondPlaceKey === key) setSecondPlaceKey('');
      }
    }
  };

  // Save and Publish Results
  const handlePublishResults = () => {
    if (!activeProgramme) return;

    if (!firstPlaceKey) {
      addToast('warning', 'Missing 1st Place', 'Please select at least a 1st place winner.');
      return;
    }

    const effectiveJudgeId = judges[0]?.id || currentUser.id;
    const judgeName = judges[0]?.name || currentUser.name || 'Jury Official';

    // 1. Clean up old scores for this programme so only our new ranked winners are processed
    const oldScores = scores.filter((s) => s.programmeId === activeProgramme.id);
    oldScores.forEach((s) => deleteScore(s.id));

    // 2. Submit ranked scores (1st: 100, 2nd: 90, 3rd: 80, 4th: 70, 5th: 60)
    const comp1 = competitors.find((c) => c.key === firstPlaceKey);
    const comp2 = competitors.find((c) => c.key === secondPlaceKey);
    const comp3 = competitors.find((c) => c.key === thirdPlaceKey);
    const comp4 = competitors.find((c) => c.key === fourthPlaceKey);
    const comp5 = competitors.find((c) => c.key === fifthPlaceKey);

    if (comp1) {
      submitOrUpdateScore({
        programmeId: activeProgramme.id,
        judgeId: effectiveJudgeId,
        judgeName,
        participantId: isTeamProg ? undefined : comp1.id,
        teamEntryId: isTeamProg && comp1.isTeamEntry ? comp1.id : undefined,
        teamEntryName: isTeamProg ? comp1.name : undefined,
        teamId: comp1.teamId,
        scores: [{ criterionId: 'ranking', criterionName: 'Official Rank', marksObtained: 100, maxMarks: 100 }],
        totalScore: 100,
        notes: '1st Place Winner',
        status: 'approved',
      });
    }

    if (comp2) {
      submitOrUpdateScore({
        programmeId: activeProgramme.id,
        judgeId: effectiveJudgeId,
        judgeName,
        participantId: isTeamProg ? undefined : comp2.id,
        teamEntryId: isTeamProg && comp2.isTeamEntry ? comp2.id : undefined,
        teamEntryName: isTeamProg ? comp2.name : undefined,
        teamId: comp2.teamId,
        scores: [{ criterionId: 'ranking', criterionName: 'Official Rank', marksObtained: 90, maxMarks: 100 }],
        totalScore: 90,
        notes: '2nd Place Runner-Up',
        status: 'approved',
      });
    }

    if (comp3) {
      submitOrUpdateScore({
        programmeId: activeProgramme.id,
        judgeId: effectiveJudgeId,
        judgeName,
        participantId: isTeamProg ? undefined : comp3.id,
        teamEntryId: isTeamProg && comp3.isTeamEntry ? comp3.id : undefined,
        teamEntryName: isTeamProg ? comp3.name : undefined,
        teamId: comp3.teamId,
        scores: [{ criterionId: 'ranking', criterionName: 'Official Rank', marksObtained: 80, maxMarks: 100 }],
        totalScore: 80,
        notes: '3rd Place',
        status: 'approved',
      });
    }

    if (comp4) {
      submitOrUpdateScore({
        programmeId: activeProgramme.id,
        judgeId: effectiveJudgeId,
        judgeName,
        participantId: isTeamProg ? undefined : comp4.id,
        teamEntryId: isTeamProg && comp4.isTeamEntry ? comp4.id : undefined,
        teamEntryName: isTeamProg ? comp4.name : undefined,
        teamId: comp4.teamId,
        scores: [{ criterionId: 'ranking', criterionName: 'Official Rank', marksObtained: 70, maxMarks: 100 }],
        totalScore: 70,
        notes: '4th Place',
        status: 'approved',
      });
    }

    if (comp5) {
      submitOrUpdateScore({
        programmeId: activeProgramme.id,
        judgeId: effectiveJudgeId,
        judgeName,
        participantId: isTeamProg ? undefined : comp5.id,
        teamEntryId: isTeamProg && comp5.isTeamEntry ? comp5.id : undefined,
        teamEntryName: isTeamProg ? comp5.name : undefined,
        teamId: comp5.teamId,
        scores: [{ criterionId: 'ranking', criterionName: 'Official Rank', marksObtained: 60, maxMarks: 100 }],
        totalScore: 60,
        notes: '5th Place',
        status: 'approved',
      });
    }

    // 3. Ratify and publish official results to Firestore and public scoreboard
    publishProgrammeResults(activeProgramme.id);
    setConfirmPublish(false);
  };

  // Grouped Published Results for Tab 2
  const groupedResults = useMemo(() => {
    const filtered = results.filter((r) => {
      if (resultsFilterProgramme !== 'all' && r.programmeId !== resultsFilterProgramme) {
        return false;
      }
      if (!resultsSearch.trim()) return true;
      const q = resultsSearch.toLowerCase();
      const prog = programmes.find((p) => p.id === r.programmeId);
      const team = teams.find((t) => t.id === r.teamId);
      const part = r.participantId ? participants.find((p) => p.id === r.participantId) : undefined;
      return (
        (prog?.name.toLowerCase().includes(q) ?? false) ||
        (prog?.code.toLowerCase().includes(q) ?? false) ||
        (team?.name.toLowerCase().includes(q) ?? false) ||
        (part?.name.toLowerCase().includes(q) ?? false) ||
        (part?.chestNumber?.toLowerCase().includes(q) ?? false) ||
        (r.entryName?.toLowerCase().includes(q) ?? false) ||
        (r.participantName?.toLowerCase().includes(q) ?? false) ||
        String(r.rank).includes(q)
      );
    });

    const map = new Map<string, typeof results>();
    filtered.forEach((r) => {
      const key = r.programmeId || 'unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    const groups: {
      programme: (typeof programmes)[0] | undefined;
      programmeId: string;
      results: typeof results;
      totalPoints: number;
    }[] = [];

    map.forEach((resList, progId) => {
      const prog = programmes.find((p) => p.id === progId);
      const sorted = [...resList].sort((a, b) => a.rank - b.rank);
      const totalPoints = sorted.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
      groups.push({
        programme: prog,
        programmeId: progId,
        results: sorted,
        totalPoints,
      });
    });

    return groups.sort((a, b) => {
      const codeA = a.programme?.code || a.programmeId || '';
      const codeB = b.programme?.code || b.programmeId || '';
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' }) ||
        (a.programme?.name || '').localeCompare(b.programme?.name || '', undefined, { sensitivity: 'base' });
    });
  }, [results, resultsFilterProgramme, resultsSearch, programmes, teams, participants]);

  // Selected winner objects
  const firstWinner = competitors.find((c) => c.key === firstPlaceKey);
  const secondWinner = competitors.find((c) => c.key === secondPlaceKey);
  const thirdWinner = competitors.find((c) => c.key === thirdPlaceKey);
  const fourthWinner = competitors.find((c) => c.key === fourthPlaceKey);
  const fifthWinner = competitors.find((c) => c.key === fifthPlaceKey);

  const isCurrentPublished = activeProgramme?.resultPublished;
  const publishedCount = programmes.filter((p) => p.resultPublished).length;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & TABS                                                */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Event Results & Winners
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Quick Winner Selection
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simply pick 1st, 2nd, and 3rd place winners to award points and publish results to the leaderboard.
          </p>
        </div>

        {/* 2 Clean Tabs: Pick Winners & Published Results */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('winners')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 font-bold rounded-md transition-all ${
              activeTab === 'winners'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Select Winners</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('published')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 font-bold rounded-md transition-all ${
              activeTab === 'published'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Published Results ({publishedCount})</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ULTRA-SIMPLE WINNER SELECTION                                */}
      {/* =================================================================== */}
      {activeTab === 'winners' && (
        <div className="space-y-5">
          {/* Programme Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Event Stepper / Dropdown */}
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevProgramme}
                  disabled={currentProgIndex <= 0}
                  className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700 shrink-0"
                  title="Previous event"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextProgramme}
                  disabled={currentProgIndex >= scorableProgrammes.length - 1}
                  className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700 shrink-0"
                  title="Next event"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                  <select
                    value={selectedProgrammeId}
                    onChange={(e) => setSelectedProgrammeId(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all cursor-pointer truncate"
                  >
                    {scorableProgrammes.map((p) => {
                      const isPub = p.resultPublished;
                      const statusSymbol = isPub ? '🟢 Published' : '⚪ Pending';
                      const typeLabel = (p.type === 'team' || p.type === 'group' || p.programmeType === 'team') ? 'Team' : 'Solo';
                      return (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ''}{p.name} • {p.category} ({typeLabel}) — {statusSymbol}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEventPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {isCurrentPublished ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Live on Public Scoreboard</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
                    <span>Not Published Yet</span>
                  </span>
                )}
              </div>
            </div>

            {/* Event Metadata */}
            {activeProgramme && (
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    {activeProgramme.code}
                  </span>
                  <span className="font-bold text-slate-900">{activeProgramme.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>Category: <strong className="text-slate-800">{activeProgramme.category}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Type: <strong className="text-slate-800">{isTeamProg ? 'Team Squad' : 'Solo'}</strong></span>
                  {activeProgramme.venue && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>Venue: <strong className="text-slate-800">{activeProgramme.venue}</strong></span>
                    </>
                  )}
                </div>

                <div className="font-semibold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 font-mono text-[11px]">
                  {competitors.length} Contestants Enrolled
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* THE 3 WINNER SELECTION CARDS                                    */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 🥇 1st Place Card (Gold) */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              firstWinner
                ? 'bg-amber-50/70 border-amber-400 shadow-xs ring-1 ring-amber-300/60'
                : 'bg-white border-dashed border-amber-300 hover:border-amber-400'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥇</span>
                  <span className="font-bold text-sm text-amber-950">1st Place (Winner)</span>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  +{pts1} pts
                </span>
              </div>

              {/* Dropdown */}
              <div className="space-y-2 mt-3">
                <select
                  value={firstPlaceKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    setFirstPlaceKey(key);
                    if (secondPlaceKey === key) setSecondPlaceKey('');
                    if (thirdPlaceKey === key) setThirdPlaceKey('');
                  }}
                  className="w-full text-xs font-bold bg-white border border-amber-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer truncate"
                >
                  <option value="">-- Select 1st Place Winner --</option>
                  {competitors.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.chestNumber} • {c.name} ({c.teamName})
                    </option>
                  ))}
                </select>

                {/* Display Selected Details */}
                {firstWinner ? (
                  <div className="p-2.5 bg-white/90 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">
                        <span className="font-mono text-purple-700 mr-1.5">{firstWinner.chestNumber}</span>
                        {firstWinner.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {firstWinner.teamName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFirstPlaceKey('')}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear 1st place"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800/80 italic text-center py-1">
                    Choose winner from dropdown or tap "1st" below
                  </p>
                )}
              </div>
            </div>

            {/* 🥈 2nd Place Card (Silver) */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              secondWinner
                ? 'bg-slate-100/80 border-slate-400 shadow-xs ring-1 ring-slate-300'
                : 'bg-white border-dashed border-slate-300 hover:border-slate-400'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥈</span>
                  <span className="font-bold text-sm text-slate-900">2nd Place (Runner-Up)</span>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                  +{pts2} pts
                </span>
              </div>

              {/* Dropdown */}
              <div className="space-y-2 mt-3">
                <select
                  value={secondPlaceKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    setSecondPlaceKey(key);
                    if (firstPlaceKey === key) setFirstPlaceKey('');
                    if (thirdPlaceKey === key) setThirdPlaceKey('');
                  }}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer truncate"
                >
                  <option value="">-- Select 2nd Place Winner --</option>
                  {competitors.map((c) => (
                    <option key={c.key} value={c.key} disabled={c.key === firstPlaceKey}>
                      {c.chestNumber} • {c.name} ({c.teamName}) {c.key === firstPlaceKey ? '(Already 1st)' : ''}
                    </option>
                  ))}
                </select>

                {/* Display Selected Details */}
                {secondWinner ? (
                  <div className="p-2.5 bg-white/90 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">
                        <span className="font-mono text-purple-700 mr-1.5">{secondWinner.chestNumber}</span>
                        {secondWinner.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {secondWinner.teamName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecondPlaceKey('')}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear 2nd place"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic text-center py-1">
                    Choose runner-up from dropdown or tap "2nd" below
                  </p>
                )}
              </div>
            </div>

            {/* 🥉 3rd Place Card (Bronze) */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              thirdWinner
                ? 'bg-orange-50/70 border-orange-400 shadow-xs ring-1 ring-orange-300/60'
                : 'bg-white border-dashed border-orange-300 hover:border-orange-400'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥉</span>
                  <span className="font-bold text-sm text-orange-950">3rd Place</span>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-300">
                  +{pts3} pts
                </span>
              </div>

              {/* Dropdown */}
              <div className="space-y-2 mt-3">
                <select
                  value={thirdPlaceKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    setThirdPlaceKey(key);
                    if (firstPlaceKey === key) setFirstPlaceKey('');
                    if (secondPlaceKey === key) setSecondPlaceKey('');
                  }}
                  className="w-full text-xs font-bold bg-white border border-orange-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer truncate"
                >
                  <option value="">-- Select 3rd Place Winner --</option>
                  {competitors.map((c) => (
                    <option
                      key={c.key}
                      value={c.key}
                      disabled={c.key === firstPlaceKey || c.key === secondPlaceKey}
                    >
                      {c.chestNumber} • {c.name} ({c.teamName}) {c.key === firstPlaceKey ? '(Already 1st)' : c.key === secondPlaceKey ? '(Already 2nd)' : ''}
                    </option>
                  ))}
                </select>

                {/* Display Selected Details */}
                {thirdWinner ? (
                  <div className="p-2.5 bg-white/90 border border-orange-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">
                        <span className="font-mono text-purple-700 mr-1.5">{thirdWinner.chestNumber}</span>
                        {thirdWinner.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {thirdWinner.teamName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setThirdPlaceKey('')}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear 3rd place"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-orange-800/80 italic text-center py-1">
                    Choose 3rd place from dropdown or tap "3rd" below
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Optional 4th and 5th Place Toggle */}
          {showExtraPlaces && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* 4th Place */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4th Place (Optional • +{pts4} pts)
                </label>
                <select
                  value={fourthPlaceKey}
                  onChange={(e) => setFourthPlaceKey(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                >
                  <option value="">-- No 4th Place --</option>
                  {competitors.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.chestNumber} • {c.name} ({c.teamName})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5th Place */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  5th Place (Optional • +{pts5} pts)
                </label>
                <select
                  value={fifthPlaceKey}
                  onChange={(e) => setFifthPlaceKey(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                >
                  <option value="">-- No 5th Place --</option>
                  {competitors.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.chestNumber} • {c.name} ({c.teamName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <button
              type="button"
              onClick={() => setShowExtraPlaces(!showExtraPlaces)}
              className="text-purple-700 hover:text-purple-900 font-semibold hover:underline"
            >
              {showExtraPlaces ? '− Hide 4th & 5th Place' : '+ Need 4th or 5th Place?'}
            </button>

            {(firstPlaceKey || secondPlaceKey || thirdPlaceKey) && (
              <button
                type="button"
                onClick={() => setConfirmClearWinners(true)}
                className="text-slate-500 hover:text-rose-600 transition-colors font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Winner Selections</span>
              </button>
            )}
          </div>

          {/* =============================================================== */}
          {/* QUICK TAP LIST OF CONTESTANTS                                   */}
          {/* =============================================================== */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Enrolled Contestants
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tap 🥇, 🥈, or 🥉 to assign winner positions instantly:
                </p>
              </div>

              {/* Contestant Search Filter */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, chest #, house..."
                  value={contestantSearch}
                  onChange={(e) => setContestantSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {competitors.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No contestants registered for this event</p>
                  <p className="text-xs text-slate-500 mt-1">Assign participants or teams to this event first.</p>
                </div>
              ) : (
                competitors
                  .filter((c) => {
                    if (!contestantSearch.trim()) return true;
                    const q = contestantSearch.toLowerCase();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      c.chestNumber.toLowerCase().includes(q) ||
                      c.teamName.toLowerCase().includes(q)
                    );
                  })
                  .map((comp) => {
                    const is1st = firstPlaceKey === comp.key;
                    const is2nd = secondPlaceKey === comp.key;
                    const is3rd = thirdPlaceKey === comp.key;

                    return (
                      <div
                        key={comp.key}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          is1st
                            ? 'bg-amber-50/70 border-l-4 border-amber-500'
                            : is2nd
                            ? 'bg-slate-100/70 border-l-4 border-slate-400'
                            : is3rd
                            ? 'bg-orange-50/70 border-l-4 border-orange-500'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Competitor Info */}
                        <div className="min-w-0 flex items-center gap-3">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 border border-purple-200 shrink-0">
                            {comp.chestNumber}
                          </span>

                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {comp.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                              <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                {comp.teamName}
                              </span>
                              <span>•</span>
                              <span>{comp.subtitle}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick 1st, 2nd, 3rd Click Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAssignRank(comp.key, 1)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              is1st
                                ? 'bg-amber-500 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900'
                            }`}
                            title="Assign 1st place"
                          >
                            🥇 {is1st ? '1st Place' : '1st'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAssignRank(comp.key, 2)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              is2nd
                                ? 'bg-slate-700 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                            }`}
                            title="Assign 2nd place"
                          >
                            🥈 {is2nd ? '2nd Place' : '2nd'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAssignRank(comp.key, 3)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              is3rd
                                ? 'bg-orange-600 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-orange-100 hover:text-orange-900'
                            }`}
                            title="Assign 3rd place"
                          >
                            🥉 {is3rd ? '3rd Place' : '3rd'}
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* BOTTOM PUBLISH ACTION BAR                                       */}
          {/* =============================================================== */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              {firstWinner ? (
                <span>
                  Ready to publish: 🥇 <strong className="text-slate-900">{firstWinner.name}</strong>
                  {secondWinner ? <>, 🥈 <strong className="text-slate-900">{secondWinner.name}</strong></> : ''}
                  {thirdWinner ? <>, 🥉 <strong className="text-slate-900">{thirdWinner.name}</strong></> : ''}
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  Select at least a 1st place winner above to publish results.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {canApprove && activeProgramme && (
                <>
                  {isCurrentPublished ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmPublish(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                        title="Update winners for this event"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-300" />
                        <span>Update Winners</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmRetractId(activeProgramme.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                        title="Retract and delete results from public portal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Retract</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!firstPlaceKey}
                      onClick={() => setConfirmPublish(true)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-300" />
                      <span>Publish Results to Leaderboard 🚀</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PUBLISHED RESULTS OVERVIEW                                   */}
      {/* =================================================================== */}
      {activeTab === 'published' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full md:w-auto relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search winner by name, chest #, house, or event..."
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={resultsFilterProgramme}
                onChange={(e) => setResultsFilterProgramme(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">All Programmes ({programmes.length})</option>
                {programmes.map((p) => {
                  const count = results.filter((r) => r.programmeId === p.id).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} {count > 0 ? `(${count} winners)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Grouped Results Cards */}
          {groupedResults.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">No Published Results Yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Select 1st, 2nd, and 3rd place winners in the "Select Winners" tab to publish official results.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedResults.map((group) => {
                const prog = group.programme;
                const progName = prog?.name || group.programmeId;

                return (
                  <div
                    key={group.programmeId}
                    className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {prog?.code && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                              {prog.code}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                            {prog?.category}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{progName}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          +{group.totalPoints} pts awarded
                        </span>

                        {prog && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProgrammeId(prog.id);
                              setActiveTab('winners');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                          >
                            <span>Change Winners</span>
                          </button>
                        )}

                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => setConfirmRetractId(group.programmeId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                            title="Retract all results for this event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Winners Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-4 text-center w-20">Rank</th>
                            <th className="py-2.5 px-4">Winner</th>
                            <th className="py-2.5 px-4">House / Team</th>
                            <th className="py-2.5 px-4 text-center">Points Awarded</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.results.map((res) => {
                            const team = teams.find((t) => t.id === res.teamId);
                            const participant = res.participantId
                              ? participants.find((p) => p.id === res.participantId)
                              : undefined;
                            const entryName =
                              res.participantName || participant?.name || res.entryName || 'Winner';
                            const isGold = res.rank === 1;
                            const isSilver = res.rank === 2;
                            const isBronze = res.rank === 3;

                            return (
                              <tr
                                key={res.id}
                                className={`hover:bg-slate-50/70 transition-colors ${
                                  isGold ? 'bg-amber-50/30' : isSilver ? 'bg-slate-50/30' : isBronze ? 'bg-orange-50/20' : ''
                                }`}
                              >
                                <td className="py-3 px-4 text-center font-bold">
                                  {isGold ? '🥇 1st' : isSilver ? '🥈 2nd' : isBronze ? '🥉 3rd' : `#${res.rank}`}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{entryName}</div>
                                  {participant?.chestNumber && (
                                    <div className="text-[10px] text-purple-700 font-mono">
                                      Chest #{participant.chestNumber}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-700">
                                  {team?.name || res.teamName}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                                  +{res.pointsAwarded} pts
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {canApprove && (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteResultId(res.id)}
                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                      title="Remove this single winner"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* EVENT SEARCH / SELECT MODAL                                         */}
      {/* =================================================================== */}
      <Modal
        isOpen={isEventPickerOpen}
        onClose={() => setIsEventPickerOpen(false)}
        title="Select Event to Score"
        maxWidth="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search event name, code, category..."
                value={eventPickerSearch}
                onChange={(e) => setEventPickerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEventPickerFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  eventPickerFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Events ({scorableProgrammes.length})
              </button>
              <button
                type="button"
                onClick={() => setEventPickerFilter('pending')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  eventPickerFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending ({scorableProgrammes.filter((p) => !p.resultPublished).length})
              </button>
              <button
                type="button"
                onClick={() => setEventPickerFilter('published')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  eventPickerFilter === 'published'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Published ({scorableProgrammes.filter((p) => p.resultPublished).length})
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
            {scorableProgrammes
              .filter((p) => {
                if (eventPickerFilter === 'published' && !p.resultPublished) return false;
                if (eventPickerFilter === 'pending' && p.resultPublished) return false;
                if (!eventPickerSearch.trim()) return true;
                const q = eventPickerSearch.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  (p.code && p.code.toLowerCase().includes(q)) ||
                  (p.category && p.category.toLowerCase().includes(q))
                );
              })
              .map((prog) => {
                const isPub = prog.resultPublished;
                const isCurrent = prog.id === selectedProgrammeId;

                return (
                  <div
                    key={prog.id}
                    onClick={() => {
                      setSelectedProgrammeId(prog.id);
                      setIsEventPickerOpen(false);
                    }}
                    className={`p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-purple-50 border border-purple-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {prog.code && (
                          <span className="font-mono font-bold text-[11px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-800">
                            {prog.code}
                          </span>
                        )}
                        <h4 className="font-bold text-slate-900">{prog.name}</h4>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {prog.category} • {prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team' ? 'Team' : 'Solo'}
                      </div>
                    </div>

                    <div>
                      {isPub ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* =================================================================== */}
      {/* CONFIRMATION DIALOGS                                                */}
      {/* =================================================================== */}
      {/* Publish Confirm */}
      <ConfirmDialog
        isOpen={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={handlePublishResults}
        title="Publish Official Event Winners"
        message={`Are you sure you want to publish these winners for ${activeProgramme?.name}? Official ranks will be awarded, points will be credited to winning houses on the leaderboard, and winners will be visible to everyone on the public website.`}
        confirmLabel="Publish to Scoreboard 🚀"
        isDestructive={false}
      />

      {/* Retract All Programme Results Confirm */}
      <ConfirmDialog
        isOpen={!!confirmRetractId}
        onClose={() => setConfirmRetractId(null)}
        onConfirm={() => {
          if (confirmRetractId) {
            deleteProgrammeResults(confirmRetractId);
            setConfirmRetractId(null);
          }
        }}
        title="Retract Event Results"
        message="Are you sure you want to retract published results for this event? Winners will be removed from the public website, and awarded leaderboard points will be revoked."
        confirmLabel="Retract Results"
        isDestructive={true}
      />

      {/* Remove Single Winner Confirm */}
      <ConfirmDialog
        isOpen={!!confirmDeleteResultId}
        onClose={() => setConfirmDeleteResultId(null)}
        onConfirm={() => {
          if (confirmDeleteResultId) {
            deleteResult(confirmDeleteResultId);
            setConfirmDeleteResultId(null);
          }
        }}
        title="Remove Winner Entry"
        message="Are you sure you want to remove this winner entry? Awarded leaderboard points will be subtracted."
        confirmLabel="Remove Entry"
        isDestructive={true}
      />

      {/* Reset Winners Confirm */}
      <ConfirmDialog
        isOpen={confirmClearWinners}
        onClose={() => setConfirmClearWinners(false)}
        onConfirm={() => {
          setFirstPlaceKey('');
          setSecondPlaceKey('');
          setThirdPlaceKey('');
          setFourthPlaceKey('');
          setFifthPlaceKey('');
          setConfirmClearWinners(false);
          addToast('info', 'Selections Reset', 'Selected winners have been cleared.');
        }}
        title="Clear Selected Winners"
        message="Are you sure you want to clear your current 1st, 2nd, and 3rd place selections for this event?"
        confirmLabel="Clear Selections"
        isDestructive={true}
      />
    </div>
  );
};
