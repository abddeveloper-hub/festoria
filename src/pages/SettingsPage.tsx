import React, { useState, useEffect } from 'react';
import { useFest } from '../context/FestContext';
import { FestSettings } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Settings,
  Save,
  RotateCcw,
  Shield,
  Trophy,
  Globe,
  Bell,
  Clock,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    resetToDefaultData,
    hasPermission,
    addToast,
    categories,
    navigateToTabWithFilter,
    activeFestId,
    activeFest,
  } = useFest();

  const [formData, setFormData] = useState<FestSettings>({ ...settings });
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<'general' | 'schedule_change' | 'results' | 'urgent'>('general');

  // Keep form data synchronized with current active fest settings
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const canEdit = hasPermission(['super_admin', 'admin']);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      addToast('error', 'Unauthorized', 'Only Super Admins and Admins can update system settings.');
      return;
    }
    updateSettings(formData);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;

    addAnnouncement({
      title: newAnnTitle,
      content: newAnnContent,
      category: newAnnCategory,
      isPublic: true,
    });
    setIsAnnounceModalOpen(false);
    setNewAnnTitle('');
    setNewAnnContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>System & Fest Settings</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeFest?.name || settings.festName} ({activeFestId})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure fest metadata, venue, scoring rules, public visibility switches, and announcements for {activeFest?.name || settings.festName}.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: General Fest Metadata */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Fest Identity & Venue Details
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Fest Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.festName}
                onChange={(e) => setFormData({ ...formData, festName: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Edition Title</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.festEdition}
                onChange={(e) => setFormData({ ...formData, festEdition: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Tagline</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                disabled={!canEdit}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                disabled={!canEdit}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Campus Venue</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Organizer Body</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={formData.contactEmail}
                placeholder="abdwahidbc@gmail.com"
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.contactPhone || ''}
                placeholder="9844691633"
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Instagram</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.contactInstagram || ''}
                placeholder="abd_l_wahid_"
                onChange={(e) => setFormData({ ...formData, contactInstagram: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Configurable Scoring Rules & Point Allocations */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Trophy className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Scoring Rules & Automated Points Multipliers
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">1st Place Pts</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.pointRules.firstPlace}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointRules: { ...formData.pointRules, firstPlace: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">2nd Place Pts</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.pointRules.secondPlace}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointRules: { ...formData.pointRules, secondPlace: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">3rd Place Pts</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.pointRules.thirdPlace}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointRules: { ...formData.pointRules, thirdPlace: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">4th Place Pts</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.pointRules.fourthPlace}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointRules: { ...formData.pointRules, fourthPlace: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">5th Place Pts</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.pointRules.fifthPlace}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointRules: { ...formData.pointRules, fifthPlace: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Group Multiplier</label>
              <input
                type="number"
                step="0.5"
                disabled={!canEdit}
                value={formData.pointRules.groupMultiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointRules: { ...formData.pointRules, groupMultiplier: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <label className="font-medium text-slate-700 mr-2">Tie Breaking Strategy:</label>
              <select
                disabled={!canEdit}
                value={formData.tieBreakPolicy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tieBreakPolicy: e.target.value as FestSettings['tieBreakPolicy'],
                  })
                }
                className="border border-slate-300 rounded px-2 py-1 bg-white text-xs"
              >
                <option value="average_marks">Mathematical Average Across Judges</option>
                <option value="highest_single_judge">Highest Single Adjudicator Score</option>
                <option value="re_evaluation">Jury Bench Re-Evaluation</option>
              </select>
            </div>

            <span className="text-[11px] text-slate-500">
              Applies to all approved competitions.
            </span>
          </div>
        </div>

        {/* Section: Competition Categories & Age Groups */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Competition Categories & Age Divisions ({categories.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure competition divisions, rename categories, set age boundaries, and enable General Category.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateToTabWithFilter('programmes')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <span>Manage & Rename Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  c.isGeneral
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : c.enabled
                    ? 'bg-slate-50 text-slate-800 border-slate-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                }`}
              >
                {c.name} {c.isGeneral ? '(General / Any Age)' : c.minAge || c.maxAge ? `(Ages ${c.minAge || 0}-${c.maxAge || 'Open'})` : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Section 3: Public Page Visibility & Privacy */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Public Portal Access & Privacy Controls
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
              <div>
                <div className="font-semibold text-slate-900">Public Live Leaderboard</div>
                <div className="text-[11px] text-slate-500">
                  Allow external visitors to view ratified team points and trophies without authentication.
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={formData.publicResultsVisible}
                onChange={(e) => setFormData({ ...formData, publicResultsVisible: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
              <div>
                <div className="font-semibold text-slate-900">Public Programme Timetable</div>
                <div className="text-[11px] text-slate-500">
                  Expose schedule slots and stage lineups to public visitors and students.
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={formData.publicScheduleVisible}
                onChange={(e) => setFormData({ ...formData, publicScheduleVisible: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
              <div>
                <div className="font-semibold text-slate-900">Participant Self-Registration Window</div>
                <div className="text-[11px] text-slate-500">
                  Enable or close participant entry portal across all contingent houses.
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={formData.registrationOpen}
                onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
            </label>
          </div>
        </div>
      </form>

      {/* Section 4: Public Announcements Bulletin Manager */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Public Bulletins & Broadcast Announcements
            </h3>
          </div>
          {canEdit && (
            <button
              onClick={() => setIsAnnounceModalOpen(true)}
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Announcement</span>
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-3 rounded border border-slate-200 bg-slate-50/50 flex items-start justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900">{ann.title}</h4>
                  <span className="font-mono text-[10px] text-slate-400">
                    {ann.createdAt} • by {ann.author}
                  </span>
                  <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {ann.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 text-[11px]">{ann.content}</p>
              </div>

              {canEdit && (
                <button
                  onClick={() => deleteAnnouncement(ann.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove Bulletin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Post Announcement Modal */}
      <Modal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        title="Broadcast Announcement"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Headline *</label>
            <input
              type="text"
              required
              value={newAnnTitle}
              onChange={(e) => setNewAnnTitle(e.target.value)}
              placeholder="e.g. Stage 2 Sound Check Delayed by 15 mins"
              className="w-full border border-slate-300 rounded px-2.5 py-1.5"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Category</label>
            <select
              value={newAnnCategory}
              onChange={(e) => setNewAnnCategory(e.target.value as any)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
            >
              <option value="general">General Information</option>
              <option value="schedule_change">Schedule & Venue Adjustment</option>
              <option value="results">Results Announcement</option>
              <option value="urgent">Urgent Notice</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Announcement Body *</label>
            <textarea
              rows={3}
              required
              value={newAnnContent}
              onChange={(e) => setNewAnnContent(e.target.value)}
              placeholder="Details visible to all public visitors..."
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAnnounceModalOpen(false)}
              className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-slate-900 rounded hover:bg-slate-800 font-medium"
            >
              Broadcast Now
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
