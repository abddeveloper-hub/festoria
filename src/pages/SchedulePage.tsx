import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { ScheduleSlot, ProgrammeStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  Printer,
  Plus,
  Filter,
  Edit2,
  Trash2,
  CalendarCheck,
  LayoutList,
  Columns
} from 'lucide-react';

export const SchedulePage: React.FC = () => {
  const {
    scheduleSlots,
    programmes,
    judges,
    participants,
    scheduleConflicts,
    addScheduleSlot,
    updateScheduleSlot,
    deleteScheduleSlot,
    hasPermission,
    addToast,
  } = useFest();

  // View mode: 'agenda' (list) or 'timetable' (stage columns)
  const [viewMode, setViewMode] = useState<'agenda' | 'timetable'>('agenda');

  // Filters
  const [selectedDate, setSelectedDate] = useState('all');
  const [filterVenue, setFilterVenue] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    programmeId: programmes[0]?.id || '',
    venue: 'Auditorium Hall A',
    stage: 'Stage 1 (Main Hall)',
    date: '2026-11-06',
    startTime: '10:00',
    endTime: '12:00',
    status: 'scheduled' as ProgrammeStatus,
  });

  const distinctDates = useMemo(() => {
    return Array.from(new Set(scheduleSlots.map((s) => s.date))).sort();
  }, [scheduleSlots]);

  const distinctVenues = useMemo(() => {
    return Array.from(new Set(scheduleSlots.map((s) => s.venue))).sort();
  }, [scheduleSlots]);

  const filteredSlots = useMemo(() => {
    return scheduleSlots
      .filter((slot) => {
        if (selectedDate !== 'all' && slot.date !== selectedDate) return false;
        if (filterVenue !== 'all' && slot.venue !== filterVenue) return false;
        if (filterStatus !== 'all' && slot.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [scheduleSlots, selectedDate, filterVenue, filterStatus]);

  const handleOpenAdd = () => {
    setEditingSlot(null);
    setFormData({
      programmeId: programmes[0]?.id || '',
      venue: 'Auditorium Hall A',
      stage: 'Stage 1',
      date: distinctDates[0] || '2026-11-06',
      startTime: '10:00',
      endTime: '12:00',
      status: 'scheduled',
    });
    setIsSlotModalOpen(true);
  };

  const handleOpenEdit = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setFormData({
      programmeId: slot.programmeId,
      venue: slot.venue,
      stage: slot.stage,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
    });
    setIsSlotModalOpen(true);
  };

  const handleSubmitSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.programmeId || !formData.venue || !formData.date) {
      addToast('error', 'Incomplete Form', 'Please complete all required schedule fields.');
      return;
    }

    if (editingSlot) {
      updateScheduleSlot(editingSlot.id, formData);
      setIsSlotModalOpen(false);
    } else {
      addScheduleSlot(formData);
      setIsSlotModalOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const canManage = hasPermission(['super_admin', 'admin', 'programme_manager']);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Fest Timetable & Venue Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate stages, manage session slots, detect clashing bookings, and print run sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                viewMode === 'agenda' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Daily Agenda List"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
            <button
              onClick={() => setViewMode('timetable')}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                viewMode === 'timetable' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Venue Grid"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Schedule</span>
          </button>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Conflict Warnings Box (if detected) */}
      {scheduleConflicts.length > 0 && (
        <div className="p-4 bg-white border border-rose-300 rounded-lg shadow-xs space-y-2 no-print">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Automatic Conflict Engine: {scheduleConflicts.length} Collision(s) Detected</span>
          </div>
          <div className="space-y-1.5">
            {scheduleConflicts.map((conf, i) => (
              <div
                key={i}
                className="text-xs p-2 rounded bg-rose-50/50 border border-rose-100 text-rose-900 flex items-start justify-between"
              >
                <span>{conf.message}</span>
                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                  {conf.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
        >
          <option value="all">All Dates ({distinctDates.length} Days)</option>
          {distinctDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={filterVenue}
          onChange={(e) => setFilterVenue(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
        >
          <option value="all">All Venues & Stages</option>
          {distinctVenues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
        >
          <option value="all">All Statuses</option>
          <option value="ongoing">Ongoing (Live)</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* View 1: Agenda List View */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Time Window</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Competition Programme</th>
                  <th className="py-3 px-3">Venue & Stage</th>
                  <th className="py-3 px-3">Judges</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No schedule slots found.
                    </td>
                  </tr>
                ) : (
                  filteredSlots.map((slot) => {
                    const prog = programmes.find((p) => p.id === slot.programmeId);
                    const assignedJudges = judges.filter((j) =>
                      prog?.assignedJudgeIds.includes(j.id)
                    );

                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {slot.date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">
                            {prog?.name || slot.programmeId}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {prog?.code} • {prog?.category}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{slot.venue}</div>
                          <div className="text-[11px] text-slate-400">{slot.stage}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {assignedJudges.map((j) => j.name).join(', ') || 'Unassigned'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={slot.status} size="sm">
                            {slot.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right no-print">
                          {canManage && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(slot)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Reschedule Slot"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingId(slot.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Cancel Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Venue / Stage Grid Matrix */}
      {viewMode === 'timetable' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distinctVenues.map((venue) => {
            const venueSlots = filteredSlots.filter((s) => s.venue === venue);
            return (
              <div
                key={venue}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <h3 className="font-bold text-xs text-slate-900">{venue}</h3>
                  </div>

                  <div className="mt-3 space-y-2">
                    {venueSlots.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] p-4 text-center">
                        No events booked at this venue.
                      </p>
                    ) : (
                      venueSlots.map((slot) => {
                        const prog = programmes.find((p) => p.id === slot.programmeId);
                        return (
                          <div
                            key={slot.id}
                            className="p-2.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900 text-[11px]">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <Badge variant={slot.status} size="sm">
                                {slot.status}
                              </Badge>
                            </div>
                            <div className="font-semibold text-slate-900 mt-1">
                              {prog?.name || slot.programmeId}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {slot.stage} • {slot.date}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title={editingSlot ? 'Reschedule Competition Slot' : 'Create Timetable Slot'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitSlot} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Assigned Programme *
            </label>
            <select
              value={formData.programmeId}
              onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
            >
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Venue *</label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                placeholder="Auditorium Hall A"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Stage</label>
              <input
                type="text"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                placeholder="Stage 1"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProgrammeStatus })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSlotModalOpen(false)}
              className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-slate-900 rounded hover:bg-slate-800 font-medium"
            >
              {editingSlot ? 'Save Slot' : 'Create Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteScheduleSlot(deletingId);
        }}
        title="Remove Timetable Slot"
        message="Are you sure you want to remove this timetable entry?"
      />
    </div>
  );
};
