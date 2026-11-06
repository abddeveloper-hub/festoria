import React, { useState } from 'react';
import { useFest } from '../context/FestContext';
import { Badge } from '../components/common/Badge';
import { PhoneAuthModal } from '../components/common/PhoneAuthModal';
import { Role } from '../types';
import {
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Award,
  Bell,
  Image,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  LogIn,
  User,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const PublicPage: React.FC = () => {
  const {
    settings,
    teams,
    programmes,
    results,
    announcements,
    gallery,
    leaderboard,
    setActiveTab,
    switchPortal,
  } = useFest();

  const [activeTabSection, setActiveTabSection] = useState<'overview' | 'results' | 'schedule' | 'teams' | 'bulletin' | 'gallery'>('overview');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | 'participant' | 'auto'>('auto');

  const openAuth = (role: Role | 'participant' | 'auto') => {
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  // Only published items for public eyes!
  const publishedResults = results.filter((r) => r.published);
  const publicAnnouncements = announcements.filter((a) => a.isPublic);
  const publicGallery = gallery.filter((g) => g.isPublic);
  const publishedProgrammes = programmes.filter((p) => p.status !== 'draft');

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Public Top Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-slate-900 bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider">
            FL
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
              {settings.festName}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Official Public Fest Portal
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTabSection('overview')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTabSection === 'overview'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTabSection('results')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTabSection === 'results'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Live Results ({publishedResults.length})
          </button>
          <button
            onClick={() => setActiveTabSection('schedule')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTabSection === 'schedule'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Timetable
          </button>
          <button
            onClick={() => setActiveTabSection('teams')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTabSection === 'teams'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTabSection('bulletin')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTabSection === 'bulletin'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Announcements
          </button>
          <button
            onClick={() => setActiveTabSection('gallery')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTabSection === 'gallery'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Media
          </button>
        </div>

        {/* Visible Sign-In Options */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAuth('participant')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span>Participant Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => openAuth('team_leader')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Team Leader Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => openAuth('admin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Welcome Hero (Clean white, subtle border) */}
        <div className="border border-slate-200 rounded-xl p-6 sm:p-10 bg-white shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                {settings.festEdition}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                {settings.festName}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 font-medium">
                "{settings.tagline}"
              </p>
              <p className="mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Hosted by the {settings.organizer} at the {settings.venue}. Welcome participants, jury, and guests to the premier inter-collegiate cultural fest.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{settings.startDate} to {settings.endDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{settings.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>{teams.length} Competing Houses</span>
                </div>
              </div>
            </div>

            {/* Quick Portal Access Card */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Official Portal Sign-In
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Phone OTP Active
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Access your personalized dashboard with secure phone verification:
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => openAuth('participant')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-colors shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="text-slate-900 group-hover:text-black">Participant Sign In / Register</div>
                      <div className="text-[10px] text-slate-500 font-normal">Self-registration, roster & live results</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => openAuth('team_leader')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-colors shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="text-slate-900 group-hover:text-black">Team Leader Sign In</div>
                      <div className="text-[10px] text-slate-500 font-normal">Manage team roster, requests & events</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openAuth('admin')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Admin Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('super_admin')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Super Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Live Leaderboard Overview */}
        {(activeTabSection === 'overview' || activeTabSection === 'results') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Official Team Leaderboard & Championship Standings
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Ratified Points
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 text-center w-14">Rank</th>
                      <th className="py-3 px-4">Team / Institution</th>
                      <th className="py-3 px-3 text-center">1st</th>
                      <th className="py-3 px-3 text-center">2nd</th>
                      <th className="py-3 px-3 text-center">3rd</th>
                      <th className="py-3 px-4 text-right">Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((entry) => (
                      <tr key={entry.team.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {entry.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              1
                            </span>
                          ) : (
                            `#${entry.rank}`
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: entry.team.colorHex || '#64748b' }}
                            />
                            <div>
                              <div className="font-bold text-slate-900">{entry.team.name}</div>
                              <div className="text-[11px] text-slate-500">{entry.team.institution}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{entry.firstPlaceCount}</td>
                        <td className="py-3 px-3 text-center font-mono">{entry.secondPlaceCount}</td>
                        <td className="py-3 px-3 text-center font-mono">{entry.thirdPlaceCount}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          {entry.totalPoints} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Section: Published Programme Results */}
        {activeTabSection === 'results' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
              Published Competition Results
            </h3>

            {publishedResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
                No programme results have been published yet. Check back soon.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programmes
                  .filter((p) => p.resultPublished)
                  .map((prog) => {
                    const progResults = publishedResults.filter((r) => r.programmeId === prog.id);
                    return (
                      <div
                        key={prog.id}
                        className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs"
                      >
                        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="font-mono text-[10px] text-slate-500 font-bold">
                              {prog.code}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {prog.name}
                            </h4>
                          </div>
                          <Badge variant="published" size="sm">
                            Results Ratified
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs">
                          {progResults.map((res) => (
                            <div
                              key={res.id}
                              className="p-2 rounded bg-slate-50/70 border border-slate-100 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-700 w-5">
                                  #{res.rank}
                                </span>
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {res.participantName || res.teamName}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {res.teamName}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-slate-900">
                                  {res.pointsAwarded} pts
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  Score: {res.finalScore}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Section: Published Timetable & Schedule */}
        {(activeTabSection === 'overview' || activeTabSection === 'schedule') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Published Fest Timetable
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Official Programme Schedule
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedProgrammes.map((prog) => (
                <div
                  key={prog.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {prog.code}
                      </span>
                      <Badge variant={prog.status} size="sm">
                        {prog.status}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-slate-900 mt-1 leading-snug">
                      {prog.name}
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                      {prog.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-slate-600 text-[11px]">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prog.date} • {prog.startTime} - {prog.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prog.venue} ({prog.stage})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Category: {prog.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Participating Teams */}
        {(activeTabSection === 'overview' || activeTabSection === 'teams') && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
              Participating Teams & Houses
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: team.colorHex || '#64748b' }}
                    />
                    <span className="font-mono font-bold text-slate-500 text-[11px]">
                      {team.code}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1">{team.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {team.institution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Bulletin & Announcements */}
        {(activeTabSection === 'overview' || activeTabSection === 'bulletin') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Official Bulletins & Announcements
              </h3>
            </div>

            <div className="space-y-3">
              {publicAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700 capitalize">
                      {ann.category.replace('_', ' ')} Update
                    </span>
                    <span className="font-mono">{ann.createdAt}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                  <p className="mt-1 text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Approved Media Gallery */}
        {(activeTabSection === 'overview' || activeTabSection === 'gallery') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Image className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                Fest Media & Highlights Gallery
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {publicGallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 overflow-hidden shadow-xs bg-white text-xs"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {item.category}
                    </span>
                    <h5 className="font-bold text-slate-900 leading-snug mt-0.5">
                      {item.title}
                    </h5>
                    {item.programmeName && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        {item.programmeName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Public Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-slate-900">{settings.festName}</div>
            <div className="mt-0.5">{settings.organizer} • {settings.venue}</div>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Email: {settings.contactEmail}</span>
            <span>Tel: {settings.contactPhone}</span>
            <a
              href="/admin.html"
              onClick={(e) => {
                if (!window.location.pathname.includes('admin.html')) {
                  e.preventDefault();
                  setActiveTab('dashboard');
                }
              }}
              className="text-slate-900 font-semibold hover:underline"
            >
              Admin Sign In
            </a>
          </div>
        </div>
      </footer>

      {/* Phone OTP Authentication Modal */}
      <PhoneAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={authRole}
      />
    </div>
  );
};
