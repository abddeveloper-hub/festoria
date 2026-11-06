import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Badge } from '../../components/common/Badge';
import {
  CalendarCheck,
  Search,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Layers,
  Info,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ParticipantProgrammesPage: React.FC = () => {
  const { activeParticipant, programmes, results } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const myProgrammes = useMemo(() => {
    return programmes.filter((p) =>
      activeParticipant?.registeredProgrammes?.includes(p.id)
    );
  }, [programmes, activeParticipant]);

  const filtered = useMemo(() => {
    return myProgrammes.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.venue.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myProgrammes, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Assigned Programmes & Competitions
          </h1>
          <p className="text-sm text-slate-500">
            Official events allocated to you by your Team Leader. Review schedules, criteria, and results.
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>Assignment Policy:</strong> All programme registrations are authoritatively managed by your Team Leader in accordance with category quotas and entry caps. Competitors cannot add or remove themselves from competitions directly.
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assigned programmes, venue, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
          >
            <option value="all">All Statuses ({myProgrammes.length})</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Programme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Assigned Programmes Found</p>
            <p className="text-[11px] mt-0.5">
              Your Team Leader has not assigned any programmes matching this filter.
            </p>
          </div>
        ) : (
          filtered.map((programme) => {
            const result = results.find(
              (r) =>
                r.programmeId === programme.id &&
                (r.participantId === activeParticipant?.id ||
                  r.participantName === activeParticipant?.name)
            );

            return (
              <div
                key={programme.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      {programme.code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        programme.status === 'completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : programme.status === 'ongoing'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {programme.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{programme.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{programme.description}</p>
                </div>

                {/* Logistics */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{programme.venue}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{programme.stage}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{programme.date} • {programme.startTime} - {programme.endTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500 font-sans">Participation Type:</span>
                    <span className="font-semibold text-slate-800 capitalize font-sans">
                      {programme.type} entry
                    </span>
                  </div>
                </div>

                {/* Published Result Banner if present */}
                {result && result.published ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-emerald-700">Result Published</div>
                      <div className="text-xs font-bold text-slate-900">
                        Official Rank #{result.rank}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-700 font-mono">
                        +{result.pointsAwarded} pts
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Score: {result.finalScore}/100
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic text-center py-1">
                    Evaluation result will be published after official judging.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

