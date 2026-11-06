import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Fest, FestLifecycleStatus } from '../../types';
import {
  Landmark,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Edit2,
  Ban,
  RotateCcw,
  Archive,
  Download,
  Calendar,
  Building,
  User,
  Users,
  CalendarCheck,
  ShieldAlert,
  Globe,
  X,
  CheckCircle2
} from 'lucide-react';
import { exportToCsv } from '../../services/storage';

export const AllFestsPage: React.FC = () => {
  const {
    fests,
    participants,
    teams,
    programmes,
    suspendFest,
    reactivateFest,
    archiveFest,
    updateFestMetadata,
    switchPortal,
    setSuperAdminTab,
    setActiveFestId
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [publicFilter, setPublicFilter] = useState<string>('all');

  // Modal states
  const [editFest, setEditFest] = useState<Fest | null>(null);
  const [suspendModalFest, setSuspendModalFest] = useState<Fest | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [archiveModalFest, setArchiveModalFest] = useState<Fest | null>(null);
  const [detailModalFest, setDetailModalFest] = useState<Fest | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editExpectedParticipants, setEditExpectedParticipants] = useState(0);

  const filteredFests = useMemo(() => {
    return fests.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.adminName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || f.category === categoryFilter;
      const matchPublic =
        publicFilter === 'all' ||
        (publicFilter === 'published' && f.publicPagePublished) ||
        (publicFilter === 'draft' && !f.publicPagePublished);
      return matchSearch && matchStatus && matchCategory && matchPublic;
    });
  }, [fests, searchQuery, statusFilter, categoryFilter, publicFilter]);

  const uniqueCategories = Array.from(new Set(fests.map((f) => f.category)));

  const handleOpenEdit = (f: Fest) => {
    setEditFest(f);
    setEditName(f.name);
    setEditCategory(f.category);
    setEditInstitution(f.institution);
    setEditVenue(f.venue);
    setEditExpectedParticipants(f.expectedParticipants);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFest) return;
    updateFestMetadata(editFest.id, {
      name: editName,
      category: editCategory,
      institution: editInstitution,
      venue: editVenue,
      expectedParticipants: Number(editExpectedParticipants),
    });
    setEditFest(null);
  };

  const handleConfirmSuspend = () => {
    if (!suspendModalFest || !suspensionReason.trim()) return;
    suspendFest(suspendModalFest.id, suspensionReason);
    setSuspendModalFest(null);
    setSuspensionReason('');
  };

  const handleConfirmArchive = () => {
    if (!archiveModalFest) return;
    archiveFest(archiveModalFest.id);
    setArchiveModalFest(null);
  };

  const handleExportFests = () => {
    const exportData = filteredFests.map((f) => ({
      Fest_ID: f.id,
      Name: f.name,
      Institution: f.institution,
      Category: f.category,
      Status: f.status,
      Admin_Name: f.adminName,
      Admin_Email: f.adminEmail,
      Start_Date: f.startDate,
      End_Date: f.endDate,
      Public_Published: f.publicPagePublished ? 'Yes' : 'No',
      Expected_Participants: f.expectedParticipants,
      Completion_Pct: `${f.completionPercentage}%`,
    }));
    exportToCsv('platform_fests_directory', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Central Fest Directory</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {fests.length} REGISTERED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive platform directory of all approved, ongoing, completed, and suspended institutional festivals.
          </p>
        </div>

        <button
          onClick={handleExportFests}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Directory (CSV)</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search fest name, ID, institution, or administrator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ongoing">Active / Ongoing</option>
              <option value="setup">Setup</option>
              <option value="registration_open">Registration Open</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <span className="text-slate-400">Public:</span>
            <select
              value={publicFilter}
              onChange={(e) => setPublicFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Hidden / Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Central Table */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Fest ID</th>
                <th className="px-4 py-3">Fest Name & Category</th>
                <th className="px-4 py-3">Institution & Venue</th>
                <th className="px-4 py-3">Fest Admin</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Scale</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Public Portal</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredFests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No fests match the current filters.
                  </td>
                </tr>
              ) : (
                filteredFests.map((fest) => (
                  <tr key={fest.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {fest.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{fest.name} {fest.edition}</div>
                      <div className="text-[11px] text-slate-500">{fest.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 truncate max-w-xs">{fest.institution}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{fest.venue}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{fest.adminName}</div>
                      <div className="text-[11px] text-slate-500">{fest.adminEmail}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {fest.startDate} &rarr; {fest.endDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                      <span className="font-semibold text-slate-900">{fest.expectedParticipants}</span> participants
                      <div className="text-[10px] text-slate-400">{fest.plannedProgrammesCount} programmes</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        fest.status === 'ongoing'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : fest.status === 'suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : fest.status === 'setup'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : fest.status === 'completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {fest.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {fest.publicPagePublished ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Unpublished
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveFestId(fest.id);
                            setSuperAdminTab('fest_monitoring');
                          }}
                          title="Open Fest Monitoring"
                          className="p-1 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(fest)}
                          title="Edit Platform Metadata"
                          className="p-1 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => switchPortal('fest_admin', fest.id)}
                          title="Enter Fest Admin Panel"
                          className="p-1 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {fest.status === 'suspended' ? (
                          <button
                            onClick={() => reactivateFest(fest.id)}
                            title="Reactivate Fest"
                            className="px-2 py-1 text-[11px] font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendModalFest(fest)}
                            title="Suspend Fest"
                            className="p-1 rounded border border-slate-200 text-rose-600 hover:bg-rose-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {fest.status === 'completed' && (
                          <button
                            onClick={() => setArchiveModalFest(fest)}
                            title="Archive Fest"
                            className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT METADATA MODAL */}
      {editFest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Edit Platform Metadata: {editFest.name}
              </h3>
              <button onClick={() => setEditFest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Fest Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Institution</label>
                <input
                  type="text"
                  required
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Campus Venue</label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Expected Capacity</label>
                <input
                  type="number"
                  value={editExpectedParticipants}
                  onChange={(e) => setEditExpectedParticipants(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <p className="text-[11px] text-slate-500 pt-1">
                Note: Updating metadata does not modify competition scores, points, or individual participant registration entries.
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditFest(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPENSION MODAL */}
      {suspendModalFest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900 text-xs">
            <h3 className="text-base font-semibold text-rose-700 flex items-center gap-2 mb-2">
              <Ban className="w-5 h-5" />
              Suspend Fest: {suspendModalFest.name}
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Suspending this fest will place it on administrative hold, restrict Fest Admin management access, unpublish its public portal, and record the action in the audit trail.
            </p>

            <div className="space-y-1 mb-4">
              <label className="font-semibold text-slate-700">Suspension Reason (Required):</label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g., Code of conduct violation; venue safety non-compliance."
                rows={3}
                className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSuspendModalFest(null)}
                className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={!suspensionReason.trim()}
                className="px-4 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 font-medium"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {archiveModalFest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900 text-xs">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <Archive className="w-5 h-5 text-slate-500" />
              Archive Concluded Fest: {archiveModalFest.name}
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Archiving seals the fest records, locks editing, and preserves all ratified scores and standings in cold storage.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setArchiveModalFest(null)}
                className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-medium"
              >
                Archive Fest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
