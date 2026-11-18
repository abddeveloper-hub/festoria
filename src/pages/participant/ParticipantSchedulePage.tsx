import React, { useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Users
} from 'lucide-react';

export const ParticipantSchedulePage: React.FC = () => {
  const {
    activeParticipant,
    programmes,
    scheduleSlots,
    teamProgrammeEntries,
    assignments,
    teams
  } = useFest();

  // Find all programmes the active participant is enrolled in:
  // 1. Direct registration in participant's registeredProgrammes
  // 2. Active team programme entries where participant is a member
  // 3. Programme assignments created by fest admin
  const myProgrammes = useMemo(() => {
    if (!activeParticipant) return [];
    const partId = activeParticipant.id;
    const directSet = new Set(activeParticipant.registeredProgrammes || []);

    const teamEntryProgIds = new Set(
      (teamProgrammeEntries || [])
        .filter((e) => e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(partId))
        .map((e) => e.programmeId)
    );

    const asgProgIds = new Set(
      (assignments || [])
        .filter((asg) => (asg.participantIds || []).includes(partId))
        .map((asg) => asg.programmeId)
    );

    return programmes.filter(
      (p) => directSet.has(p.id) || teamEntryProgIds.has(p.id) || asgProgIds.has(p.id)
    );
  }, [activeParticipant, programmes, teamProgrammeEntries, assignments]);

  // Merge each programme with its schedule slot to ensure exact date, time, venue, stage as added
  const scheduledItems = useMemo(() => {
    return myProgrammes.map((p) => {
      const slot = (scheduleSlots || []).find((s) => s.programmeId === p.id);
      const isTeam = p.type === 'team' || p.type === 'group' || p.programmeType === 'team';
      const teamEntry = isTeam && activeParticipant
        ? teamProgrammeEntries.find(
            (e) => e.programmeId === p.id && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(activeParticipant.id)
          )
        : undefined;

      return {
        ...p,
        slotId: slot?.id,
        date: slot?.date || p.date || '',
        startTime: slot?.startTime || p.startTime || '',
        endTime: slot?.endTime || p.endTime || '',
        venue: slot?.venue || p.venue || 'Main Venue',
        stage: slot?.stage || p.stage || (p.stageType === 'off_stage' ? 'Off-Stage' : 'Stage 1'),
        status: slot?.status || p.status || 'scheduled',
        isTeam,
        teamEntryName: teamEntry?.entryName,
        teamEntryMembersCount: teamEntry?.memberParticipantIds?.length,
      };
    });
  }, [myProgrammes, scheduleSlots, teamProgrammeEntries, activeParticipant]);

  // Sort chronologically by date and startTime, then by programme code
  const sorted = useMemo(() => {
    return [...scheduledItems].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      const timeA = a.startTime || '';
      const timeB = b.startTime || '';
      if (timeA && timeB && timeA !== timeB) return timeA.localeCompare(timeB);
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });
  }, [scheduledItems]);

  const assignedTeam = useMemo(() => {
    return teams.find((t) => t.id === activeParticipant?.teamId);
  }, [teams, activeParticipant]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Personal Competition Timetable
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Chronological schedule of all stages, roll calls, and competitive slots for your assigned events.
            </p>
          </div>
          {activeParticipant && (
            <div className="text-xs bg-purple-50 text-purple-900 border border-purple-200 rounded-lg px-3 py-1.5 self-start sm:self-auto font-medium">
              <span>{activeParticipant.name}</span>
              {activeParticipant.chestNumber && (
                <span className="font-bold ml-1.5 font-mono">#{activeParticipant.chestNumber}</span>
              )}
              {assignedTeam && (
                <span className="text-purple-600 ml-1.5">({assignedTeam.name})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No Scheduled Events</p>
          <p className="text-[11px] mt-0.5">
            You do not currently have any assigned programmes on the timetable.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
          {sorted.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-[25px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-xs" />

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 hover:border-purple-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.code && (
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.code}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      item.isTeam
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.isTeam ? 'Team Event' : 'Solo Event'}
                    </span>
                    {item.teamEntryName && (
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium border border-purple-200">
                        Squad: {item.teamEntryName}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider self-start sm:self-auto ${
                      item.status === 'completed'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : item.status === 'ongoing'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{item.date || 'Date TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>
                      {item.startTime
                        ? item.endTime
                          ? `${item.startTime} - ${item.endTime}`
                          : `From ${item.startTime}`
                        : 'Time TBA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{item.venue} {item.stage ? `(${item.stage})` : ''}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <strong>Reporting Guideline:</strong> Competitors must report to {item.stage} at least 15 minutes prior to scheduled start time {item.startTime ? `(${item.startTime})` : ''} with their official Fest ID card.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
