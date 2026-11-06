import React from 'react';
import { useFest } from '../../context/FestContext';
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

export const ParticipantSchedulePage: React.FC = () => {
  const { activeParticipant, programmes, scheduleSlots } = useFest();

  const myProgrammes = programmes.filter((p) =>
    activeParticipant?.registeredProgrammes?.includes(p.id)
  );

  // Sort programmes by date and startTime
  const sorted = [...myProgrammes].sort((a, b) => {
    const dComp = a.date.localeCompare(b.date);
    if (dComp !== 0) return dComp;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Personal Competition Timetable
        </h1>
        <p className="text-sm text-slate-500">
          Chronological schedule of all stages, roll calls, and competitive slots for your assigned events.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No Scheduled Events</p>
          <p className="text-[11px] mt-0.5">
            You do not currently have any assigned programmes on the timetable.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
          {sorted.map((item, idx) => (
            <div key={item.id} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-[25px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-xs" />

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider self-start sm:self-auto ${
                      item.status === 'completed'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : item.status === 'ongoing'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{item.startTime} - {item.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{item.venue} ({item.stage})</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <strong>Reporting Guideline:</strong> Competitors must report to {item.stage} at least 15 minutes prior to scheduled start time ({item.startTime}) with their official Fest ID card.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

