import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFest } from '../context/FestContext';
import {
  ScoreSubmission,
  ScoreStatus,
  ScoreDetail,
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
  Clock,
  Eye,
  Edit2,
  History,
  Trophy,
  Filter,
  FileSpreadsheet,
  Save,
  Users,
  Check,
  Trash2,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  HelpCircle,
  X,
  ListChecks,
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
    submitOrUpdateScore,
    submitScoresBatch,
    updateScoreStatus,
    deleteScore,
    publishProgrammeResults,
    deleteResult,
    deleteProgrammeResults,
    recalculateAllProgrammeResultsPoints,
    teamProgrammeEntries,
    assignments,
    hasPermission,
    addToast,
    dashboardFilters,
    setDashboardFilters,
  } = useFest();

  // Primary Tabs:
  // 'score' = Simple & Fast Scoring Sheet (default workhorse for clients)
  // 'results' = Published Winners & Leaderboard Points
  // 'audit' = Audit Dossier & Historical Submissions
  const [activeTab, setActiveTab] = useState<'score' | 'results' | 'audit'>('score');

  // Search & Filter for Audit Tab
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterProgramme, setAuditFilterProgramme] = useState('all');
  const [auditFilterStatus, setAuditFilterStatus] = useState('all');
  const [auditFilterJudge, setAuditFilterJudge] = useState('all');

  // Search & Filter for Published Results Tab
  const [resultsSearch, setResultsSearch] = useState('');
  const [resultsFilterProgramme, setResultsFilterProgramme] = useState('all');
  const [isRecalculatingPoints, setIsRecalculatingPoints] = useState(false);

  // Modals & Dialogs State
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<ScoreSubmission | null>(null);
  const [viewingScore, setViewingScore] = useState<ScoreSubmission | null>(null);
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [eventPickerSearch, setEventPickerSearch] = useState('');
  const [eventPickerFilter, setEventPickerFilter] = useState<'all' | 'pending' | 'published'>('all');
  const [showHelpBanner, setShowHelpBanner] = useState(true);

  // Confirmations
  const [confirmPublishId, setConfirmPublishId] = useState<string | null>(null);
  const [confirmDeleteResultId, setConfirmDeleteResultId] = useState<string | null>(null);
  const [confirmDeleteProgrammeResultsId, setConfirmDeleteProgrammeResultsId] = useState<string | null>(null);
  const [confirmDeleteScoreId, setConfirmDeleteScoreId] = useState<string | null>(null);
  const [confirmResetMarks, setConfirmResetMarks] = useState(false);

  // Permissions & Role
  const isJudgeOnly = currentUser.role === 'judge';
  const judgeId = currentUser.linkedJudgeId || (isJudgeOnly ? currentUser.id : undefined);
  const canApprove = hasPermission(['super_admin', 'admin', 'score_manager', 'fest_admin']);
  const canRecord = canApprove || isJudgeOnly;

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
    // Fallback: If no specific programmes are assigned to this judge yet
    return [...programmes].sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [programmes, isJudgeOnly, judgeId]);

  // Selected Programme for Scoring Sheet
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(
    () => (dashboardFilters?.programmeId && dashboardFilters.programmeId !== 'all') ? dashboardFilters.programmeId : (scorableProgrammes[0]?.id || programmes[0]?.id || '')
  );

  // Sync selectedProgrammeId if dashboardFilters has a programmeId set from navigation
  useEffect(() => {
    if (dashboardFilters?.programmeId && dashboardFilters.programmeId !== 'all' && dashboardFilters.programmeId !== selectedProgrammeId) {
      setSelectedProgrammeId(dashboardFilters.programmeId);
      setDashboardFilters((prev) => ({ ...prev, programmeId: 'all' }));
    }
  }, [dashboardFilters?.programmeId, selectedProgrammeId, setDashboardFilters]);

  // Keep selectedProgrammeId valid if programmes change
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

  // Scoring Criteria for Active Programme
  const criteriaList = useMemo(() => {
    if (activeProgramme?.criteria && activeProgramme.criteria.length > 0) {
      return activeProgramme.criteria;
    }
    return [
      {
        id: 'performance',
        name: 'General Performance',
        maxMarks: 100,
      },
    ];
  }, [activeProgramme]);

  const maxTotalMarks = useMemo(() => {
    return criteriaList.reduce((sum, c) => sum + c.maxMarks, 0);
  }, [criteriaList]);

  // Judge Selection for Active Sheet
  const [sheetJudgeId, setSheetJudgeId] = useState<string>('');
  const [sheetMode, setSheetMode] = useState<'simple' | 'criteria'>('simple');

  // Smart Judge Resolution: If previous scores exist for this programme, auto-select that judge
  useEffect(() => {
    if (isJudgeOnly && judgeId) {
      setSheetJudgeId(judgeId);
      return;
    }

    if (!activeProgramme) return;

    // Check if there are existing scores for this programme
    const existingScores = scores.filter((s) => s.programmeId === activeProgramme.id);
    if (existingScores.length > 0) {
      const scoringJudgeId = existingScores[0].judgeId;
      if (scoringJudgeId && (!sheetJudgeId || !existingScores.some((s) => s.judgeId === sheetJudgeId))) {
        setSheetJudgeId(scoringJudgeId);
        return;
      }
    }

    // Fallback: assigned judges or first available judge
    if (activeProgramme.assignedJudgeIds && activeProgramme.assignedJudgeIds.length > 0) {
      if (!sheetJudgeId || !activeProgramme.assignedJudgeIds.includes(sheetJudgeId)) {
        setSheetJudgeId(activeProgramme.assignedJudgeIds[0]);
      }
    } else if ((!sheetJudgeId || !judges.some((j) => j.id === sheetJudgeId)) && judges.length > 0) {
      setSheetJudgeId(judges[0].id);
    }
  }, [activeProgramme, isJudgeOnly, judgeId, judges, scores, sheetJudgeId]);

  // Competitors enrolled in the active programme
  const competitors = useMemo(() => {
    if (!activeProgramme) return [];

    if (isTeamProg) {
      // 1. Team Programme Entries
      const entries = teamProgrammeEntries.filter((e) => e.programmeId === activeProgramme.id);
      if (entries.length > 0) {
        return entries.map((entry) => ({
          key: entry.id,
          id: entry.id,
          name: entry.entryName,
          teamId: entry.teamId,
          teamName: entry.teamName || teams.find((t) => t.id === entry.teamId)?.name || entry.teamId,
          teamCode: teams.find((t) => t.id === entry.teamId)?.code || '',
          isTeamEntry: true,
          chestNumber: entry.id.replace('TPE-', '#'),
          subtitle: `${entry.memberParticipantIds?.length || 0} members • ${entry.categoryName || entry.categoryId || 'General'}`,
        }));
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

  // Track the last loaded event & judge so switching events loads cleanly, while background/sync updates merge safely
  const lastLoadedProgJudgeRef = useRef<{ progId: string; judgeId: string }>({
    progId: '',
    judgeId: '',
  });

  // Sync existing scores into sheet whenever programme, judge, or remote scores update
  useEffect(() => {
    if (!selectedProgrammeId) return;

    // Look for scores matching this programme and current judge, or any judge if sheetJudgeId is empty
    const matchingScores = scores.filter(
      (s) => s.programmeId === selectedProgrammeId && (!sheetJudgeId || s.judgeId === sheetJudgeId)
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

    matchingScores.forEach((s) => {
      const key = isTeamProg
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

    const isDifferentEventOrJudge =
      lastLoadedProgJudgeRef.current.progId !== selectedProgrammeId ||
      lastLoadedProgJudgeRef.current.judgeId !== sheetJudgeId;

    if (isDifferentEventOrJudge) {
      lastLoadedProgJudgeRef.current = { progId: selectedProgrammeId, judgeId: sheetJudgeId };
      setSheetMarks(initialMarks);
    } else {
      // Safe non-destructive merge:
      // Never wipe out contestant marks that the user is actively entering/editing!
      setSheetMarks((prev) => {
        const merged: typeof prev = { ...prev };
        Object.entries(initialMarks).forEach(([k, dbScore]) => {
          if (!merged[k]) {
            merged[k] = dbScore;
          } else if (merged[k].isSaved) {
            // Already marked saved locally: update with authoritative DB score
            merged[k] = dbScore;
          } else {
            // Unsaved edits in progress: preserve entered marks & connect existingScoreId
            merged[k] = {
              ...merged[k],
              existingScoreId: dbScore.existingScoreId || merged[k].existingScoreId,
            };
          }
        });
        return merged;
      });
    }
  }, [selectedProgrammeId, sheetJudgeId, scores, isTeamProg]);

  // Handle total score input change (Simple mode)
  const handleQuickTotalChange = (key: string, valStr: string) => {
    const rawVal = valStr === '' ? 0 : parseFloat(valStr);
    const val = isNaN(rawVal) ? 0 : Math.max(0, Math.min(maxTotalMarks, Math.round(rawVal * 10) / 10));

    setSheetMarks((prev) => {
      const current = prev[key] || {
        criteria: {},
        quickTotal: 0,
        notes: '',
        isSaved: false,
      };

      // Distribute proportionally across criteria
      const updatedCriteria: Record<string, number> = {};
      if (criteriaList.length > 0 && maxTotalMarks > 0) {
        let remaining = val;
        criteriaList.forEach((c, idx) => {
          if (idx === criteriaList.length - 1) {
            updatedCriteria[c.id] = Math.max(0, Math.min(c.maxMarks, Math.round(remaining * 10) / 10));
          } else {
            const portion = Math.round(((c.maxMarks / maxTotalMarks) * val) * 10) / 10;
            const clamped = Math.max(0, Math.min(c.maxMarks, portion));
            updatedCriteria[c.id] = clamped;
            remaining = Math.round((remaining - clamped) * 10) / 10;
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

  // Handle individual criterion change (Criteria mode)
  const handleCriterionChange = (
    key: string,
    critId: string,
    valStr: string,
    critMax: number
  ) => {
    const rawVal = valStr === '' ? 0 : parseFloat(valStr);
    const val = isNaN(rawVal) ? 0 : Math.max(0, Math.min(critMax, Math.round(rawVal * 10) / 10));

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
      const sum = criteriaList.reduce(
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

  const handleNotesChange = (key: string, notes: string) => {
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

  // Save all entered scores to state & database in one atomic batch
  const handleSaveAllScores = (silent = false): number => {
    if (!activeProgramme) {
      if (!silent) addToast('warning', 'No Event Selected', 'Please select a competition event.');
      return 0;
    }

    const effectiveJudgeId = sheetJudgeId || judges[0]?.id || currentUser.id;
    const judgeObj = judges.find((j) => j.id === effectiveJudgeId) || {
      name: currentUser.name || 'Official Fest Judge',
    };

    const batchPayload: Array<Omit<ScoreSubmission, 'id' | 'submittedAt' | 'revisionHistory'> & { id?: string }> = [];
    const compKeyMap: string[] = [];

    competitors.forEach((comp) => {
      const data = sheetMarks[comp.key];
      if (!data || (data.quickTotal === 0 && !data.existingScoreId && !data.notes)) {
        return;
      }

      const scoresPayload: ScoreDetail[] = criteriaList.map((crit) => ({
        criterionId: crit.id,
        criterionName: crit.name,
        marksObtained: data.criteria[crit.id] ?? 0,
        maxMarks: crit.maxMarks,
      }));

      batchPayload.push({
        id: data.existingScoreId,
        programmeId: activeProgramme.id,
        judgeId: effectiveJudgeId,
        judgeName: judgeObj.name,
        participantId: isTeamProg ? undefined : comp.id,
        teamEntryId: isTeamProg && comp.isTeamEntry ? comp.id : undefined,
        teamEntryName: isTeamProg ? comp.name : undefined,
        teamId: comp.teamId,
        scores: scoresPayload,
        totalScore: data.quickTotal,
        notes: data.notes || '',
        status: 'submitted',
      });
      compKeyMap.push(comp.key);
    });

    if (batchPayload.length === 0) {
      if (!silent) {
        addToast('info', 'No Entries to Save', 'Enter marks for at least one contestant before saving.');
      }
      return 0;
    }

    // Save all scores in a single batch write (collision-proof, no missing contestants)
    const savedScores = submitScoresBatch(batchPayload);

    // Link generated/saved score IDs to sheetMarks immediately and mark as saved
    setSheetMarks((prev) => {
      const next = { ...prev };
      compKeyMap.forEach((key, idx) => {
        const saved = savedScores[idx];
        if (next[key]) {
          next[key] = {
            ...next[key],
            isSaved: true,
            existingScoreId: saved?.id || next[key].existingScoreId,
          };
        }
      });
      return next;
    });

    if (!silent) {
      addToast(
        'success',
        'Scores Saved Successfully',
        `Saved evaluations for ${batchPayload.length} contestant${batchPayload.length === 1 ? '' : 's'}. You can now publish official results.`
      );
    }

    return batchPayload.length;
  };

  // Live Rankings & Podium Calculation
  const liveRankings = useMemo(() => {
    const list = competitors.map((comp) => {
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
  }, [competitors, sheetMarks]);

  const livePodium = useMemo(() => {
    return liveRankings.filter((r) => r.rank !== null && r.rank <= 3 && r.total > 0);
  }, [liveRankings]);

  const podiumTies = useMemo(() => {
    const map: Record<number, typeof livePodium> = {};
    livePodium.forEach((p) => {
      map[p.total] = map[p.total] || [];
      map[p.total].push(p);
    });
    return Object.values(map).filter((group) => group.length > 1);
  }, [livePodium]);

  // Quick navigation: next and prev programme
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

  // Grouped Published Results for Tab 2
  const groupedResultsByProgramme = useMemo(() => {
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
      isPublished: boolean;
    }[] = [];

    map.forEach((resList, progId) => {
      const prog = programmes.find((p) => p.id === progId);
      const sorted = [...resList].sort((a, b) => a.rank - b.rank);
      const totalPoints = sorted.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
      const isPublished = prog?.resultPublished || sorted.some((r) => r.published);

      groups.push({
        programme: prog,
        programmeId: progId,
        results: sorted,
        totalPoints,
        isPublished,
      });
    });

    return groups.sort((a, b) => {
      const codeA = a.programme?.code || a.programmeId || '';
      const codeB = b.programme?.code || b.programmeId || '';
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' }) ||
        (a.programme?.name || '').localeCompare(b.programme?.name || '', undefined, { sensitivity: 'base' });
    });
  }, [results, resultsFilterProgramme, resultsSearch, programmes, teams, participants]);

  // Filtered score submissions for Audit Tab (Tab 3)
  const filteredAuditScores = useMemo(() => {
    return scores.filter((s) => {
      if (isJudgeOnly && judgeId && s.judgeId !== judgeId && s.judgeId !== currentUser.id) {
        return false;
      }
      const prog = programmes.find((p) => p.id === s.programmeId);
      const team = teams.find((t) => t.id === s.teamId);
      const participant = participants.find((pt) => pt.id === s.participantId);

      const sText = auditSearch.toLowerCase();
      const matchesSearch =
        (prog?.name ? prog.name.toLowerCase().includes(sText) : false) ||
        (prog?.code ? prog.code.toLowerCase().includes(sText) : false) ||
        (s.judgeName ? s.judgeName.toLowerCase().includes(sText) : false) ||
        (team?.name ? team.name.toLowerCase().includes(sText) : false) ||
        (participant?.name ? participant.name.toLowerCase().includes(sText) : false);
      if (!matchesSearch) return false;

      if (auditFilterProgramme !== 'all' && s.programmeId !== auditFilterProgramme) return false;
      if (auditFilterStatus !== 'all' && s.status !== auditFilterStatus) return false;
      if (auditFilterJudge !== 'all' && s.judgeId !== auditFilterJudge) return false;

      return true;
    });
  }, [scores, auditSearch, auditFilterProgramme, auditFilterStatus, auditFilterJudge, programmes, teams, participants, isJudgeOnly, judgeId, currentUser.id]);

  // Single Entry / Edit Score Modal Form State
  const [modalFormJudgeId, setModalFormJudgeId] = useState('');
  const [modalFormParticipantId, setModalFormParticipantId] = useState('');
  const [modalFormTeamEntryId, setModalFormTeamEntryId] = useState('');
  const [modalFormTeamId, setModalFormTeamId] = useState('');
  const [modalFormStatus, setModalFormStatus] = useState<ScoreStatus>('submitted');
  const [modalFormNotes, setModalFormNotes] = useState('');
  const [modalCriteriaScores, setModalCriteriaScores] = useState<ScoreDetail[]>([]);
  const [modalProgrammeId, setModalProgrammeId] = useState('');

  const modalActiveProg = programmes.find((p) => p.id === modalProgrammeId);

  const handleOpenAddScore = () => {
    setEditingScore(null);
    const targetProg = activeProgramme || scorableProgrammes[0] || programmes[0];
    if (!targetProg) {
      addToast('warning', 'No Events', 'No competition events available.');
      return;
    }

    const isTeam = targetProg.type === 'team' || targetProg.type === 'group' || targetProg.programmeType === 'team';
    const entries = teamProgrammeEntries.filter((e) => e.programmeId === targetProg.id);

    setModalProgrammeId(targetProg.id);
    setModalFormJudgeId(sheetJudgeId || targetProg.assignedJudgeIds[0] || judges[0]?.id || '');
    setModalFormParticipantId(targetProg.registeredParticipantIds[0] || participants[0]?.id || '');
    setModalFormTeamEntryId(entries[0]?.id || '');
    setModalFormTeamId(entries[0]?.teamId || targetProg.registeredTeamIds[0] || teams[0]?.id || '');
    setModalFormStatus('submitted');
    setModalFormNotes('');
    setModalCriteriaScores(
      targetProg.criteria.map((c) => ({
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
    setModalProgrammeId(s.programmeId);
    setModalFormJudgeId(s.judgeId);
    setModalFormParticipantId(s.participantId || '');
    setModalFormTeamEntryId(s.teamEntryId || '');
    setModalFormTeamId(s.teamId || '');
    setModalFormStatus(s.status);
    setModalFormNotes(s.notes || '');
    setModalCriteriaScores(s.scores.map((sc) => ({ ...sc })));
    setIsScoreModalOpen(true);
  };

  const handleSubmitModalForm = (e: React.FormEvent) => {
    e.preventDefault();
    const prog = programmes.find((p) => p.id === modalProgrammeId);
    const judge = judges.find((j) => j.id === modalFormJudgeId) || { name: currentUser.name };
    if (!prog) return;

    for (const item of modalCriteriaScores) {
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
    const entryObj = modalFormTeamEntryId ? teamProgrammeEntries.find((e) => e.id === modalFormTeamEntryId) : undefined;

    submitOrUpdateScore({
      id: editingScore?.id,
      programmeId: modalProgrammeId,
      judgeId: modalFormJudgeId,
      judgeName: judge.name,
      participantId: isTeam ? undefined : modalFormParticipantId,
      teamEntryId: isTeam ? modalFormTeamEntryId : undefined,
      teamEntryName: isTeam ? (entryObj?.entryName || teams.find((t) => t.id === modalFormTeamId)?.name) : undefined,
      teamId: isTeam ? (entryObj?.teamId || modalFormTeamId) : modalFormTeamId,
      scores: modalCriteriaScores,
      totalScore: modalCriteriaScores.reduce((sum, item) => sum + item.marksObtained, 0),
      notes: modalFormNotes,
      status: modalFormStatus,
    });

    setIsScoreModalOpen(false);
  };

  // Programme status helper
  const getProgrammeStatus = (p: typeof programmes[0]) => {
    if (p.resultPublished) return 'published';
    const progScores = scores.filter((s) => s.programmeId === p.id);
    if (progScores.length > 0) return 'draft';
    return 'pending';
  };

  const publishedProgrammesCount = programmes.filter((p) => p.resultPublished).length;
  const scoredProgrammesCount = programmes.filter((p) => scores.some((s) => s.programmeId === p.id)).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & STREAMLINED TABS                                    */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isJudgeOnly ? 'Judge Scoring Sheet' : 'Scoring & Results'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {isJudgeOnly ? 'Jury Mode' : 'Fest Admin'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isJudgeOnly
              ? 'Evaluate competition performances, enter marks, and submit scores.'
              : 'Enter marks for competitors, review podium rankings, and publish official results to the leaderboard.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main 3 View Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('score')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'score'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
              <span>Score Event</span>
            </button>

            {!isJudgeOnly && (
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-all ${
                  activeTab === 'results'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Published Results ({publishedProgrammesCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Submissions ({filteredAuditScores.length})</span>
            </button>
          </div>

          {canRecord && (
            <button
              type="button"
              onClick={handleOpenAddScore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors"
              title="Add or calibrate an individual score entry manually"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Single Score</span>
            </button>
          )}
        </div>
      </div>

      {/* Helpful 3-Step Quick Guide Banner (Dismissible) */}
      {showHelpBanner && activeTab === 'score' && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 rounded-lg p-3 text-xs text-purple-950 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong className="font-semibold text-purple-900">How Scoring Works:</strong>{' '}
              <span className="font-medium text-purple-800">1. Select an event</span> ➜{' '}
              <span className="font-medium text-purple-800">2. Type marks for contestants</span> ➜{' '}
              <span className="font-medium text-purple-800">3. Click "Publish Results"</span> to update the public leaderboard!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowHelpBanner(false)}
            className="text-purple-400 hover:text-purple-700 p-0.5 rounded transition-colors"
            title="Dismiss tip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: EASY EVENT SCORING SHEET                                     */}
      {/* =================================================================== */}
      {activeTab === 'score' && (
        <div className="space-y-4">
          {/* Smart Event Selector & Info Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Event Picker Controls */}
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Prev / Next Quick Step Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevProgramme}
                    disabled={currentProgIndex <= 0}
                    className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700"
                    title="Previous event"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextProgramme}
                    disabled={currentProgIndex >= scorableProgrammes.length - 1}
                    className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700"
                    title="Next event"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Event Dropdown */}
                <div className="flex-1 min-w-[260px] relative">
                  <select
                    value={selectedProgrammeId}
                    onChange={(e) => setSelectedProgrammeId(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all cursor-pointer truncate"
                  >
                    {scorableProgrammes.map((p) => {
                      const status = getProgrammeStatus(p);
                      const statusSymbol = status === 'published' ? '🟢 Published' : status === 'draft' ? '🟡 Draft' : '⚪ Pending';
                      const typeLabel = (p.type === 'team' || p.type === 'group' || p.programmeType === 'team') ? 'Team' : 'Solo';
                      return (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ''}{p.name} • {p.category} ({typeLabel}) — {statusSymbol}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Search / Browse All Events Button */}
                <button
                  type="button"
                  onClick={() => setIsEventPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Search Events ({scorableProgrammes.length})</span>
                </button>
              </div>

              {/* Right Side: Simple Mode vs Criteria Mode & Judge */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Scoring Judge Selection */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium hidden md:inline">Judge:</span>
                  <select
                    disabled={isJudgeOnly}
                    value={sheetJudgeId}
                    onChange={(e) => setSheetJudgeId(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 max-w-[160px] truncate"
                  >
                    {judges.length === 0 ? (
                      <option value="">Default Jury</option>
                    ) : (
                      judges.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Mode Toggle (Simple Marks vs Detailed Criteria) */}
                {criteriaList.length > 1 && (
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-md border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setSheetMode('simple')}
                      className={`px-2.5 py-1 rounded font-medium transition-all ${
                        sheetMode === 'simple'
                          ? 'bg-white text-purple-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Simple Marks
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetMode('criteria')}
                      className={`px-2.5 py-1 rounded font-medium transition-all ${
                        sheetMode === 'criteria'
                          ? 'bg-white text-purple-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Criteria ({criteriaList.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Event Details Card */}
            {activeProgramme && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-600">
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                    {activeProgramme.code}
                  </span>
                  <span className="font-semibold text-slate-800">{activeProgramme.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>Category: <strong className="text-slate-700">{activeProgramme.category}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Type: <strong className="text-slate-700">{isTeamProg ? 'Team Squad' : 'Individual Solo'}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Max Marks: <strong className="text-purple-700 font-mono font-bold">{maxTotalMarks} pts</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {activeProgramme.resultPublished ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live on Public Leaderboard</span>
                    </span>
                  ) : scores.some((s) => s.programmeId === activeProgramme.id) ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Draft Scores Saved (Not Published)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                      <span>Ready for Scoring</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Real-time Podium & Standings Preview */}
          {livePodium.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Current Event Winners (Live Evaluation)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    — Updates automatically as you type
                  </span>
                </div>

                {podiumTies.length > 0 && podiumTies[0]?.length > 1 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                    Tie Detected ({podiumTies[0].map((t) => t.name).join(' & ')} tied at {podiumTies[0][0]?.total ?? 0} pts)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {livePodium.map((pod) => {
                  const medal = pod.rank === 1 ? '🥇 1st Place' : pod.rank === 2 ? '🥈 2nd Place' : '🥉 3rd Place';
                  const bg =
                    pod.rank === 1
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950 ring-1 ring-amber-300/50'
                      : pod.rank === 2
                      ? 'bg-slate-50/90 border-slate-300 text-slate-950'
                      : 'bg-orange-50/90 border-orange-300 text-orange-950';

                  return (
                    <div
                      key={pod.key}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-all ${bg}`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 font-bold truncate">
                          <span>{medal}</span>
                        </div>
                        <div className="font-semibold text-slate-900 truncate mt-0.5">
                          {pod.name}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">
                          {pod.chestNumber} • {pod.teamName}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-lg block text-slate-900">
                          {pod.total}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          points
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contestant Scoring Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Contestants to Score
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
                  {competitors.length} {isTeamProg ? 'Teams' : 'Participants'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="hidden sm:inline italic">
                  Tip: Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Tab</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</kbd> to step down quickly
                </span>
                {competitors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmResetMarks(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
                    title="Clear entered marks on this sheet"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Sheet</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3 w-16 text-center">Rank</th>
                    <th className="py-3 px-3 w-28">Chest #</th>
                    <th className="py-3 px-4 min-w-[200px]">Contestant / House</th>

                    {/* Simple Marks column or Criteria columns */}
                    {sheetMode === 'criteria' && criteriaList.length > 1 ? (
                      criteriaList.map((crit) => (
                        <th key={crit.id} className="py-3 px-3 text-center min-w-[100px]">
                          <div>{crit.name}</div>
                          <div className="text-[10px] text-purple-600 font-normal font-mono">
                            max {crit.maxMarks}
                          </div>
                        </th>
                      ))
                    ) : (
                      <th className="py-3 px-4 text-center min-w-[130px]">
                        <div>Marks / Score</div>
                        <div className="text-[10px] text-purple-600 font-normal font-mono">
                          out of {maxTotalMarks}
                        </div>
                      </th>
                    )}

                    {sheetMode === 'criteria' && criteriaList.length > 1 && (
                      <th className="py-3 px-3 text-center w-24">Total</th>
                    )}

                    <th className="py-3 px-4 min-w-[180px]">Judge Remarks (Optional)</th>
                    <th className="py-3 px-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {competitors.length === 0 ? (
                    <tr>
                      <td colSpan={criteriaList.length + 5} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">No contestants enrolled in this event yet</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Assign participants or teams to this event in the Programmes or Participants page.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    competitors.map((comp) => {
                      const data = sheetMarks[comp.key];
                      const total = data?.quickTotal ?? 0;
                      const rankedObj = liveRankings.find((r) => r.key === comp.key);
                      const rank = rankedObj?.rank;

                      return (
                        <tr
                          key={comp.key}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            rank === 1 ? 'bg-amber-50/20' : rank === 2 ? 'bg-slate-50/30' : rank === 3 ? 'bg-orange-50/20' : ''
                          }`}
                        >
                          {/* Live Rank */}
                          <td className="py-3.5 px-3 text-center font-bold">
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

                          {/* Chest Number (High contrast for easy reading) */}
                          <td className="py-3.5 px-3 font-mono font-bold">
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-md text-xs shadow-2xs">
                              {comp.chestNumber}
                            </span>
                          </td>

                          {/* Contestant / Team info */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{comp.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                {comp.teamName}
                              </span>
                              <span>•</span>
                              <span>{comp.subtitle}</span>
                            </div>
                          </td>

                          {/* Marks Input (Simple or Criteria) */}
                          {sheetMode === 'criteria' && criteriaList.length > 1 ? (
                            criteriaList.map((crit) => {
                              const val = data?.criteria[crit.id] ?? '';
                              return (
                                <td key={crit.id} className="py-3.5 px-3 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={crit.maxMarks}
                                    placeholder="0"
                                    value={val}
                                    onChange={(e) =>
                                      handleCriterionChange(
                                        comp.key,
                                        crit.id,
                                        e.target.value,
                                        crit.maxMarks
                                      )
                                    }
                                    className="w-16 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                  />
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={maxTotalMarks}
                                  placeholder="0"
                                  value={data?.quickTotal ? data.quickTotal : ''}
                                  onChange={(e) => handleQuickTotalChange(comp.key, e.target.value)}
                                  className="w-20 text-center font-mono font-black text-sm bg-white border border-slate-300 hover:border-purple-400 rounded-md px-2.5 py-1.5 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 shadow-2xs transition-all"
                                />
                                <span className="text-[11px] text-slate-400 font-mono">
                                  /{maxTotalMarks}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Calculated Total for Criteria Mode */}
                          {sheetMode === 'criteria' && criteriaList.length > 1 && (
                            <td className="py-3.5 px-3 text-center">
                              <span className={`font-mono text-sm font-bold ${total > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                                {total}
                              </span>
                            </td>
                          )}

                          {/* Remarks */}
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              placeholder="e.g. Good rhythm, minor mistake..."
                              value={data?.notes || ''}
                              onChange={(e) => handleNotesChange(comp.key, e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                            />
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 text-center">
                            {data?.isSaved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" /> Saved
                              </span>
                            ) : total > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Unsaved
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar (Sticky & Crystal Clear) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span>
                  Scored: <strong className="text-slate-900 font-mono">{liveRankings.filter((r) => r.total > 0).length}</strong> of{' '}
                  <strong className="text-slate-900 font-mono">{competitors.length}</strong> contestants
                </span>
                {liveRankings.some((r) => r.total > 0 && !r.isSaved) && (
                  <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Unsaved changes
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* Save Draft Scores Button */}
                {canRecord && (
                  <button
                    type="button"
                    onClick={() => handleSaveAllScores(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Save Draft</span>
                  </button>
                )}

                {/* Ratify & Publish Results Button */}
                {canApprove && activeProgramme && (
                  <>
                    {activeProgramme.resultPublished ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Auto save then re-publish
                            handleSaveAllScores(true);
                            setConfirmPublishId(activeProgramme.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                          title="Update published results with newly entered scores"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-300" />
                          <span>Update Results</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProgrammeResultsId(activeProgramme.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                          title="Retract and delete results from public portal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Retract Results</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          // Auto save marks first before opening publish dialog
                          handleSaveAllScores(true);
                          setConfirmPublishId(activeProgramme.id);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Trophy className="w-4 h-4 text-amber-300" />
                        <span>Ratify & Publish Results 🚀</span>
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
      {/* TAB 2: PUBLISHED WINNERS & LEADERBOARD RESULTS                      */}
      {/* =================================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Published Programmes
                </span>
                <div className="font-mono font-black text-2xl text-slate-900 mt-0.5">
                  {publishedProgrammesCount} <span className="text-xs font-normal text-slate-400">/ {programmes.length}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Total Awarded Winners
                </span>
                <div className="font-mono font-black text-2xl text-slate-900 mt-0.5">
                  {results.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Leaderboard Points Distributed
                </span>
                <div className="font-mono font-black text-2xl text-emerald-600 mt-0.5">
                  {results.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0)} pts
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full md:w-auto relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search winner by contestant name, chest number, house, or event..."
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={resultsFilterProgramme}
                  onChange={(e) => setResultsFilterProgramme(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">All Programmes ({programmes.length})</option>
                  {programmes.map((p) => {
                    const progResultsCount = results.filter((r) => r.programmeId === p.id).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} {progResultsCount > 0 ? `(${progResultsCount} results)` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {hasPermission(['admin', 'fest_admin', 'super_admin']) && (
                <button
                  type="button"
                  disabled={isRecalculatingPoints}
                  onClick={async () => {
                    setIsRecalculatingPoints(true);
                    try {
                      await recalculateAllProgrammeResultsPoints();
                    } finally {
                      setIsRecalculatingPoints(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title="Recalculate official 10-7-4 points for all results"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRecalculatingPoints ? 'animate-spin' : ''}`} />
                  <span>{isRecalculatingPoints ? 'Recalculating...' : 'Recalculate 10-7-4 Points'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Results List Grouped by Programme */}
          {groupedResultsByProgramme.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">No Published Results Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                Score an event and click "Ratify & Publish Results" to publish official rankings here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedResultsByProgramme.map((group) => {
                const prog = group.programme;
                const progName = prog?.name || group.programmeId;
                const isTeam = prog?.type === 'team' || prog?.type === 'group' || prog?.programmeType === 'team' || group.results[0]?.isTeamProgramme;

                return (
                  <div
                    key={group.programmeId}
                    className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
                  >
                    {/* Event Banner */}
                    <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {prog?.code && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                              {prog.code}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isTeam ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {isTeam ? 'Team Event' : 'Solo Event'}
                          </span>
                          {prog?.category && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                              {prog.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {progName}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-mono text-xs font-bold">
                          +{group.totalPoints} pts awarded
                        </div>

                        {group.isPublished ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5" /> Draft
                          </span>
                        )}

                        {/* Open in Scoring Sheet */}
                        {prog && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProgrammeId(prog.id);
                              setActiveTab('score');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                            title="Open event in score sheet to review marks or re-evaluate"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit in Sheet</span>
                          </button>
                        )}

                        {/* Retract / Delete Results */}
                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProgrammeResultsId(group.programmeId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                            title="Delete all results and retract from public portal"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Retract</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Winners Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[580px]">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-4 text-center w-20">Rank</th>
                            <th className="py-2.5 px-4">Winner / Contestant</th>
                            <th className="py-2.5 px-4">House / Team</th>
                            <th className="py-2.5 px-3 text-center">Final Score</th>
                            <th className="py-2.5 px-3 text-center">Points Awarded</th>
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
                              res.participantName || participant?.name || res.entryName || 'Competitor';
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
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                                      isGold
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : isSilver
                                        ? 'bg-slate-200 text-slate-900 border border-slate-300'
                                        : isBronze
                                        ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {isGold
                                      ? '🥇 1st'
                                      : isSilver
                                      ? '🥈 2nd'
                                      : isBronze
                                      ? '🥉 3rd'
                                      : `#${res.rank}`}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{entryName}</div>
                                  {participant && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                      {participant.chestNumber ? (
                                        <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                          Chest #{participant.chestNumber}
                                        </span>
                                      ) : null}
                                      <span>{participant.category}</span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-800">
                                    {team?.name || res.teamName || 'Independent'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">{team?.code}</div>
                                </td>

                                <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                                  {res.finalScore}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">
                                    +{res.pointsAwarded} pts
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  {canApprove && (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteResultId(res.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded transition-colors shadow-2xs cursor-pointer"
                                      title="Delete this individual result entry"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Remove</span>
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
      {/* TAB 3: AUDIT DOSSIER & ALL SUBMISSIONS                              */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search programme, judge, contestant..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-purple-600 text-slate-800"
                />
              </div>

              <div>
                <select
                  value={auditFilterProgramme}
                  onChange={(e) => setAuditFilterProgramme(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-purple-600 text-slate-800 truncate"
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
                  value={auditFilterStatus}
                  onChange={(e) => setAuditFilterStatus(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-purple-600 text-slate-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <select
                  value={auditFilterJudge}
                  onChange={(e) => setAuditFilterJudge(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-purple-600 text-slate-800"
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

          {/* Submissions Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3">Entry ID</th>
                    <th className="py-3 px-3">Programme</th>
                    <th className="py-3 px-3">Competitor / Team</th>
                    <th className="py-3 px-3">Judge</th>
                    <th className="py-3 px-2 text-center">Score</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-3">Submitted At</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditScores.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No score submissions matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditScores.map((score) => {
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
                                title="View Breakdown & Audit"
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
                                  <button
                                    onClick={() => setConfirmDeleteScoreId(score.id)}
                                    className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                    title="Delete Score Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

      {/* =================================================================== */}
      {/* QUICK EVENT SEARCH / PICKER MODAL                                   */}
      {/* =================================================================== */}
      <Modal
        isOpen={isEventPickerOpen}
        onClose={() => setIsEventPickerOpen(false)}
        title="Select Competition Event to Score"
        maxWidth="lg"
      >
        <div className="space-y-3.5 text-xs">
          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search by event name, code, or category..."
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
                Pending Scoring ({scorableProgrammes.filter((p) => !p.resultPublished).length})
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

          {/* List of Programmes */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
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
                const status = getProgrammeStatus(prog);
                const isCurrent = prog.id === selectedProgrammeId;
                const isTeam = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';

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
                        : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {prog.code && (
                          <span className="font-mono font-bold text-[11px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-800">
                            {prog.code}
                          </span>
                        )}
                        <h4 className="font-bold text-slate-900 truncate">{prog.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{prog.category}</span>
                        <span>•</span>
                        <span>{isTeam ? 'Team Squad' : 'Solo'}</span>
                        {prog.venue && (
                          <>
                            <span>•</span>
                            <span>{prog.venue}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : status === 'draft' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" /> Draft
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
      {/* RECORD / EDIT SCORE MODAL (SINGLE ENTRY / CALIBRATION)              */}
      {/* =================================================================== */}
      <Modal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title={editingScore ? `Edit Score: ${editingScore.id}` : 'Record Single Score'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitModalForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Programme / Competition *
              </label>
              <select
                value={modalProgrammeId}
                onChange={(e) => setModalProgrammeId(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
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
                value={modalFormJudgeId}
                onChange={(e) => setModalFormJudgeId(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                {judges.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.designation || 'Jury Member'})
                  </option>
                ))}
              </select>
            </div>

            {modalActiveProg?.type === 'individual' || modalActiveProg?.programmeType === 'individual' ? (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Participant *
                </label>
                <select
                  value={modalFormParticipantId}
                  onChange={(e) => {
                    setModalFormParticipantId(e.target.value);
                    const pt = participants.find((p) => p.id === e.target.value);
                    if (pt) setModalFormTeamId(pt.teamId);
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
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
                {teamProgrammeEntries.filter((e) => e.programmeId === modalProgrammeId).length > 0 ? (
                  <select
                    value={modalFormTeamEntryId}
                    onChange={(e) => {
                      setModalFormTeamEntryId(e.target.value);
                      const ent = teamProgrammeEntries.find((item) => item.id === e.target.value);
                      if (ent) setModalFormTeamId(ent.teamId);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
                  >
                    {teamProgrammeEntries
                      .filter((e) => e.programmeId === modalProgrammeId)
                      .map((ent) => (
                        <option key={ent.id} value={ent.id}>
                          {ent.entryName} ({ent.teamName})
                        </option>
                      ))}
                  </select>
                ) : (
                  <select
                    value={modalFormTeamId}
                    onChange={(e) => setModalFormTeamId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Score Status</label>
              <select
                value={modalFormStatus}
                onChange={(e) => setModalFormStatus(e.target.value as ScoreStatus)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
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
              {modalCriteriaScores.map((crit, idx) => (
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
                        const updated = [...modalCriteriaScores];
                        updated[idx].marksObtained = Number(e.target.value);
                        setModalCriteriaScores(updated);
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
                  {modalCriteriaScores.reduce((sum, item) => sum + item.marksObtained, 0)} marks
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={modalFormNotes}
              onChange={(e) => setModalFormNotes(e.target.value)}
              placeholder="e.g. Excellent timing, expressive performance"
              className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsScoreModalOpen(false)}
              className="px-3.5 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-purple-700 hover:bg-purple-800 rounded font-semibold"
            >
              {editingScore ? 'Save Calibration' : 'Submit Score'}
            </button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* VIEW SCORE DOSSIER & REVISION AUDIT MODAL                          */}
      {/* =================================================================== */}
      {viewingScore && (
        <Modal
          isOpen={!!viewingScore}
          onClose={() => setViewingScore(null)}
          title={`Score Sheet Dossier: ${viewingScore.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
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

            {viewingScore.revisionHistory && viewingScore.revisionHistory.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Score Revision History
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

      {/* =================================================================== */}
      {/* CONFIRMATION DIALOGS                                                */}
      {/* =================================================================== */}
      {/* Ratify & Publish Results Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmPublishId}
        onClose={() => setConfirmPublishId(null)}
        onConfirm={() => {
          if (confirmPublishId) {
            publishProgrammeResults(confirmPublishId);
            setConfirmPublishId(null);
          }
        }}
        title="Ratify & Publish Event Results"
        message="This will calculate official rankings (1st, 2nd, 3rd...), award leaderboard points to the winning houses/teams, and make results instantly visible to the public. Proceed?"
        confirmLabel="Publish to Leaderboard 🚀"
        isDestructive={false}
      />

      {/* Delete Single Result Entry Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteResultId}
        onClose={() => setConfirmDeleteResultId(null)}
        onConfirm={() => {
          if (confirmDeleteResultId) {
            deleteResult(confirmDeleteResultId);
            setConfirmDeleteResultId(null);
          }
        }}
        title="Remove Result Entry"
        message="Are you sure you want to remove this result entry? Leaderboard points for this contestant will be subtracted."
        confirmLabel="Remove Result"
        isDestructive={true}
      />

      {/* Delete/Retract All Programme Results Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteProgrammeResultsId}
        onClose={() => setConfirmDeleteProgrammeResultsId(null)}
        onConfirm={() => {
          if (confirmDeleteProgrammeResultsId) {
            deleteProgrammeResults(confirmDeleteProgrammeResultsId);
            setConfirmDeleteProgrammeResultsId(null);
          }
        }}
        title="Retract Event Results"
        message="Are you sure you want to retract published results for this event? Winners will be removed from the public website, and awarded leaderboard points will be revoked."
        confirmLabel="Retract Results"
        isDestructive={true}
      />

      {/* Delete Raw Score Submission Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteScoreId}
        onClose={() => setConfirmDeleteScoreId(null)}
        onConfirm={() => {
          if (confirmDeleteScoreId) {
            deleteScore(confirmDeleteScoreId);
            setConfirmDeleteScoreId(null);
          }
        }}
        title="Delete Score Entry"
        message="Are you sure you want to permanently delete this score submission?"
        confirmLabel="Delete Score"
        isDestructive={true}
      />

      {/* Reset Sheet Confirmation */}
      <ConfirmDialog
        isOpen={confirmResetMarks}
        onClose={() => setConfirmResetMarks(false)}
        onConfirm={() => {
          setSheetMarks({});
          setConfirmResetMarks(false);
          addToast('info', 'Sheet Reset', 'Scores on the sheet have been cleared.');
        }}
        title="Clear Current Sheet Marks"
        message="Are you sure you want to clear all entered marks on this sheet? (Saved submissions in the database will not be deleted until you click Save)."
        confirmLabel="Clear Marks"
        isDestructive={true}
      />
    </div>
  );
};
