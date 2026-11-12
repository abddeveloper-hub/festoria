import React, { useState, useEffect, useRef } from 'react';
import { useFest } from '../../context/FestContext';
import { getAppUrl } from '../../utils/navigation';
import { FESTORIA_LOGO, handleLogoError } from '../../utils/logo';
import {
  FestPublicPageData,
  FestPhotoItem,
  Role
} from '../../types';
import {
  fetchPublishedFestPage,
  getDefaultFestPublicPage
} from '../../firebase/firestoreService';
import { PhoneAuthModal as AuthModal } from '../../components/common/PhoneAuthModal';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Phone,
  Mail,
  User,
  Shield,
  Award,
  Bell,
  Play,
  Pause,
  X,
  Maximize2,
  Image as ImageIcon,
  Search,
  Medal,
  Users,
  CheckCircle2,
  Menu
} from 'lucide-react';

interface PublicFestPageProps {
  festId?: string;
  previewData?: FestPublicPageData;
}

export const PublicFestPage: React.FC<PublicFestPageProps> = ({
  festId: propFestId,
  previewData
}) => {
  const {
    settings,
    teams,
    participants,
    programmes,
    results,
    announcements,
    activeFestId,
    setActiveFestId,
    fests,
    categories: festCategories,
    leaderboard,
    getCategoryScoreboard
  } = useFest();

  const targetFestId = propFestId || activeFestId || 'FEST-01';
  const fest = fests.find((f) => f.id === targetFestId);
  const festName = fest ? `${fest.name} ${fest.edition || ''}`.trim() : (settings.festName || 'Festoria 2026');

  const [pageData, setPageData] = useState<FestPublicPageData>(
    previewData || getDefaultFestPublicPage(targetFestId, festName)
  );

  const [activeTabSection, setActiveTabSection] = useState<
    'overview' | 'leaderboard' | 'student_search' | 'results' | 'schedule' | 'teams' | 'gallery' | 'bulletin'
  >('overview');

  const [leaderboardType, setLeaderboardType] = useState<'team' | 'individual'>('team');
  const [leaderboardCategory, setLeaderboardCategory] = useState<string>('all');

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any | null>(null);
  const [overviewLeaderboardToggle, setOverviewLeaderboardToggle] = useState<'team' | 'individual'>('team');

  const [resultsSubTab, setResultsSubTab] = useState<'programmes' | 'team_scoreboard' | 'category_scoreboards'>('programmes');
  const [selectedPublicCategory, setSelectedPublicCategory] = useState<string>('Senior');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | 'participant' | 'auto'>('participant');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  // Video playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  // Gallery filter & lightbox
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<FestPhotoItem | null>(null);

  // Load published data if not preview
  useEffect(() => {
    if (previewData) {
      setPageData(previewData);
      return;
    }

    let isMounted = true;
    async function loadPublished() {
      try {
        const published = await fetchPublishedFestPage(targetFestId, festName);
        if (isMounted && published) {
          setPageData(published);
        }
      } catch (err) {
        console.warn('Failed to load published fest page:', err);
      }
    }
    loadPublished();
    return () => {
      isMounted = false;
    };
  }, [targetFestId, previewData, festName]);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const openAuth = (role: Role | 'participant' | 'auto', mode: 'signin' | 'register' = 'signin') => {
    if (targetFestId) {
      setActiveFestId(targetFestId);
    }
    setAuthRole(role);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Check if URL parameters request participant registration directly: ?action=register or ?register=participant
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const action = search.get('action') || search.get('register');
      if (action === 'register' || action === 'true' || action === 'participant') {
        openAuth('participant', 'register');
      }
    }
  }, [targetFestId]);

  const publishedResults = results.filter((r) => r.published);
  const publicAnnouncements = announcements.filter((a) => a.isPublic);
  const publishedProgrammes = programmes.filter((p) => p.status !== 'draft');

  // Participants scoped to this festival
  const festParticipants = React.useMemo(() => {
    return (participants || []).filter((p) => !p.festId || p.festId === targetFestId);
  }, [participants, targetFestId]);

  // Student search filtering by Chest Number or Name
  const matchedStudents = React.useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return festParticipants.filter((p) => {
      const chest = (p.chestNumber || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return chest.includes(q) || id.includes(q) || name.includes(q);
    });
  }, [festParticipants, studentSearchQuery]);

  // Compute student stats helper
  const getStudentStats = (participantId: string) => {
    const studentResults = results.filter(
      (r) => r.participantId === participantId && r.published
    );
    const totalPoints = studentResults.reduce(
      (sum, r) => sum + (r.pointsAwarded || 0),
      0
    );
    const goldCount = studentResults.filter((r) => r.rank === 1).length;
    const silverCount = studentResults.filter((r) => r.rank === 2).length;
    const bronzeCount = studentResults.filter((r) => r.rank === 3).length;
    return { studentResults, totalPoints, goldCount, silverCount, bronzeCount };
  };

  // Dynamic individual leaderboard for selected category or all categories
  const individualLeaderboardData = React.useMemo(() => {
    return getCategoryScoreboard(leaderboardCategory);
  }, [getCategoryScoreboard, leaderboardCategory]);

  // Top individual scorers for Overview spotlight pod
  const topIndividualContestants = React.useMemo(() => {
    return getCategoryScoreboard('all').slice(0, 5);
  }, [getCategoryScoreboard]);

  // Featured photos for main landing section
  const mainFeaturedPhotos = pageData.photos.filter((p) => p.featuredInMain);
  const allPhotos = pageData.photos;

  // Filter gallery photos
  const filteredGalleryPhotos =
    activeCategory === 'All'
      ? allPhotos
      : allPhotos.filter((p) => p.category === activeCategory);

  const categories = ['All', ...Array.from(new Set(allPhotos.map((p) => p.category || 'General')))];

  return (
    <div className="min-h-screen min-h-dvh bg-white text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. PUBLIC TOP NAVIGATION                                             */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {pageData.logo.logoUrl ? (
            <img
              src={pageData.logo.logoUrl}
              alt={festName}
              style={{ width: `${pageData.logo.widthPx || 120}px` }}
              className="h-9 object-contain"
            />
          ) : (
            <img
              src={FESTORIA_LOGO}
              alt={festName}
              onError={handleLogoError}
              className="w-9 h-9 rounded-xl object-contain shadow-xs border border-slate-200/80 bg-white"
            />
          )}

          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
              {festName}
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
              {fest?.institution ? `${fest.institution} · ` : ''}{fest?.edition || settings.festEdition || 'Official Festival Portal'}
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTabSection('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTabSection === 'overview'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTabSection('leaderboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTabSection === 'leaderboard'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTabSection('student_search')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTabSection === 'student_search'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-indigo-600" />
            <span>Student Search</span>
          </button>
          <button
            onClick={() => setActiveTabSection('results')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTabSection === 'results'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Live Results ({publishedResults.length})
          </button>
          <button
            onClick={() => setActiveTabSection('schedule')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTabSection === 'schedule'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Timetable
          </button>
          <button
            onClick={() => setActiveTabSection('teams')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTabSection === 'teams'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Houses & Teams ({teams.length})
          </button>
          {allPhotos.length > 0 && (
            <button
              onClick={() => setActiveTabSection('gallery')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTabSection === 'gallery'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Photo Gallery ({allPhotos.length})
            </button>
          )}
          <button
            onClick={() => setActiveTabSection('bulletin')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTabSection === 'bulletin'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Bulletins
          </button>
        </div>

        {/* Menu Bar Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Menu className="w-4 h-4 text-white" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Horizontal Section Navigation Bar */}
      <div className="flex lg:hidden overflow-x-auto py-2.5 px-3 gap-1.5 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-[57px] z-30 no-scrollbar shadow-2xs">
        <button
          onClick={() => setActiveTabSection('overview')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTabSection === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTabSection('leaderboard')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTabSection === 'leaderboard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3 h-3 text-amber-500" />
          <span>Leaderboard</span>
        </button>
        <button
          onClick={() => setActiveTabSection('student_search')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
            activeTabSection === 'student_search'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-3 h-3 text-indigo-500" />
          <span>Student Search</span>
        </button>
        <button
          onClick={() => setActiveTabSection('results')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTabSection === 'results'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Live Results ({publishedResults.length})
        </button>
        <button
          onClick={() => setActiveTabSection('schedule')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTabSection === 'schedule'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Timetable
        </button>
        <button
          onClick={() => setActiveTabSection('teams')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTabSection === 'teams'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Houses & Teams ({teams.length})
        </button>
        {allPhotos.length > 0 && (
          <button
            onClick={() => setActiveTabSection('gallery')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTabSection === 'gallery'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Photos ({allPhotos.length})
          </button>
        )}
        <button
          onClick={() => setActiveTabSection('bulletin')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTabSection === 'bulletin'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Bulletins
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION WITH ADMIN-MANAGED VIDEO & FALLBACKS                 */}
      {/* ==================================================================== */}
      <section className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[600px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        {/* Background Video */}
        {pageData.hero.videoUrl && !videoFailed ? (
          <>
            <video
              ref={videoRef}
              src={pageData.hero.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              poster={pageData.hero.videoPosterUrl}
              onError={() => setVideoFailed(true)}
              className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-45 scale-105 transition-all duration-700"
            />
            {/* Accessible Video Control Toggle */}
            <button
              type="button"
              onClick={toggleVideoPlayback}
              title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
              className="absolute bottom-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-xs text-xs flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-medium pr-1">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </>
        ) : pageData.hero.videoPosterUrl ? (
          <img
            src={pageData.hero.videoPosterUrl}
            alt="Hero Poster"
            className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-40"
          />
        ) : (
          /* CSS-Designed Vector/Gradient Fallback */
          <div className="absolute inset-0 z-0 bg-linear-to-br from-slate-950 via-indigo-950/80 to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.12),transparent_60%)]" />
            {/* Vector grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
          </div>
        )}

        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-slate-950/70 z-10" />

        {/* Hero Foreground Content */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 text-center space-y-4 sm:space-y-6">
          {/* Logo in Hero if centered */}
          {pageData.logo.logoUrl && pageData.logo.alignment === 'center' && (
            <div className="flex justify-center mb-2">
              <img
                src={pageData.logo.logoUrl}
                alt="Fest Logo"
                style={{ width: `${pageData.logo.widthPx}px` }}
                className="h-auto object-contain drop-shadow-lg"
              />
            </div>
          )}

          {/* Festival Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{fest ? `${fest.name} · ${fest.institution || ''}` : (settings.festEdition || 'Annual Inter-Collegiate Fest')}</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {pageData.hero.heading && !pageData.hero.heading.includes('Celebrate Passion') ? pageData.hero.heading : `Welcome to ${festName}`}
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {fest?.description || pageData.hero.description}
          </p>

          {/* Meta Info Bar (Dates, Venue, Host) */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{fest?.startDate || settings.startDate} to {fest?.endDate || settings.endDate}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>{fest ? `${fest.venue || ''}${fest.institution ? `, ${fest.institution}` : ''}` : (settings.venue || 'Grand University Campus')}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => openAuth('participant', 'register')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-950 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-100 transition-all shadow-lg hover:scale-102"
            >
              <span>{pageData.hero.primaryCtaText || 'Register Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTabSection('schedule')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-white/20 transition-all"
            >
              <span>{pageData.hero.secondaryCtaText || 'View Schedule'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Quick Chest Number Student Search Bar directly in Hero */}
          <div className="w-full max-w-xl mx-auto pt-6 text-left">
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-1.5 sm:p-2 shadow-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <div className="pl-3 text-slate-400">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && studentSearchQuery.trim()) {
                      setActiveTabSection('student_search');
                    }
                  }}
                  placeholder="Search student by Chest Number (e.g. 104) or Name..."
                  className="flex-1 bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm py-2 px-1 font-medium"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (studentSearchQuery.trim()) {
                      setActiveTabSection('student_search');
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
                >
                  Search
                </button>
              </div>

              {/* Floating Instant Matches Dropdown */}
              {studentSearchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {matchedStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No participant found for <strong className="text-slate-800 font-bold">"{studentSearchQuery}"</strong>. Check the chest number and try again.
                    </div>
                  ) : (
                    matchedStudents.slice(0, 6).map((student) => {
                      const team = teams.find((t) => t.id === student.teamId);
                      const stats = getStudentStats(student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentForModal(student);
                            setActiveTabSection('student_search');
                          }}
                          className="w-full p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 truncate">{student.name}</span>
                                <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                                  Chest #{student.chestNumber || student.id}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <span className="text-slate-700 font-medium">{team?.name || 'Team'}</span>
                                <span>•</span>
                                <span>{student.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-sm text-slate-900">{stats.totalPoints} pts</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {stats.goldCount}🥇 {stats.silverCount}🥈 {stats.bronzeCount}🥉
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTabSection('student_search')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View all in Student Directory →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. MAIN SECTION: CURATED MAIN PHOTOS                                */}
      {/* ==================================================================== */}
      {mainFeaturedPhotos.length > 0 && activeTabSection === 'overview' && (
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  Featured Gallery
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Fest Moments & Highlights
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTabSection('gallery')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 group"
              >
                <span>View Full Photo Gallery</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainFeaturedPhotos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  <div className="aspect-16/10 w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {photo.caption}
                    </h4>
                    {photo.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 4. OVERVIEW SECTION: STRUCTURED BENTO GRID & METRICS                 */}
      {/* ==================================================================== */}
      {activeTabSection === 'overview' && (
        <>
          {/* Festival Quick Metrics Strip */}
          <section className="border-b border-slate-200 bg-slate-50/90 py-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono font-black text-lg sm:text-xl text-slate-900 leading-tight block">
                      {publishedProgrammes.length > 0 ? publishedProgrammes.length : '40+'}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                      Collegiate Events
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono font-black text-lg sm:text-xl text-slate-900 leading-tight block">
                      {teams.length > 0 ? teams.length : '4'}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                      Competing Houses
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono font-black text-lg sm:text-xl text-slate-900 leading-tight block">
                      {festParticipants.length > 0 ? festParticipants.length : '100+'}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                      Contestants
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono font-black text-lg sm:text-xl text-slate-900 leading-tight block">
                      {publishedResults.length}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                      Ratified Results
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Structured Bento Grid */}
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
            {/* Bento Row 1: Welcome & Highlights (2 cols) + Official Portals Gateway (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Bento Card 1: Official Festival Brief & Highlights */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Official Festival Portal</span>
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {fest?.edition || settings.festEdition || '2026 Edition'}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {pageData.content.welcomeTitle || `Welcome to ${festName}`}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                    {pageData.content.welcomeMessage || fest?.description || 'Join thousands of delegates, participants, and spectators across multiple stages and auditoriums in this premier inter-collegiate cultural and arts summit.'}
                  </p>
                </div>

                {/* Highlights Feature Grid */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                    Festival Highlights & Standards
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {pageData.content.highlights && pageData.content.highlights.length > 0 ? (
                      pageData.content.highlights.map((h, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                        >
                          <div className="w-8 h-8 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center mb-2">
                            {idx === 0 ? (
                              <Trophy className="w-4 h-4" />
                            ) : idx === 1 ? (
                              <Shield className="w-4 h-4" />
                            ) : (
                              <Award className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-bold text-xs text-slate-900 line-clamp-3">{h}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center mb-2">
                            <Trophy className="w-4 h-4" />
                          </div>
                          <h5 className="font-bold text-xs text-slate-900">40+ Accredited Events</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Stage, on-stage and off-stage arts competitions.</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                          <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center mb-2">
                            <Shield className="w-4 h-4" />
                          </div>
                          <h5 className="font-bold text-xs text-slate-900">Real-Time Scoring</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Instant judge tabulation with transparent ratifications.</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-2">
                            <Award className="w-4 h-4" />
                          </div>
                          <h5 className="font-bold text-xs text-slate-900">Certified Honors</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Official medals, trophies, and university certifications.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Official Portals Gateway */}
              <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2.5 py-0.5 rounded-full">
                      Portals
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Access Open</span>
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white tracking-tight">
                    Participant & Leader Portals
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Access your live scores, view registered stage entries, or manage house contestant rosters.
                  </p>

                  <div className="space-y-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => openAuth('participant', 'signin')}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-xs font-semibold text-white group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Participant Dashboard</div>
                          <div className="text-[10px] text-slate-300">View chest # and events</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openAuth('team_leader', 'signin')}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-xs font-semibold text-white group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Team Leader Portal</div>
                          <div className="text-[10px] text-slate-300">Manage house contestants</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Fast registration CTA */}
                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">New participant?</span>
                  <button
                    type="button"
                    onClick={() => openAuth('participant', 'register')}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-colors shadow-xs"
                  >
                    Register Now →
                  </button>
                </div>
              </div>
            </div>

            {/* Bento Row 2: Live Championship Standings Spotlight (Full Width) */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">
                    Live Championship Standings
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Top Scoring Leaders & Houses
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Live ratified points from individual stage competitions and house performances.
                  </p>
                </div>

                {/* Switcher: Top Teams vs Top Students */}
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setOverviewLeaderboardToggle('team')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      overviewLeaderboardToggle === 'team'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Top Teams
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewLeaderboardToggle('individual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      overviewLeaderboardToggle === 'individual'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Top Students
                  </button>
                </div>
              </div>

              {/* Content for Spotlight */}
              {overviewLeaderboardToggle === 'team' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {leaderboard.length === 0 ? (
                    <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                      Championship house standings will be published once preliminary results are ratified.
                    </div>
                  ) : (
                    leaderboard.slice(0, 3).map((entry, idx) => (
                      <div
                        key={entry.team.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          idx === 0
                            ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                            : idx === 1
                            ? 'bg-slate-100/80 border-slate-300'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : 'bg-amber-200 text-amber-900'
                          }`}>
                            {idx === 0 ? '🥇 1st Place' : idx === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}
                          </span>
                          <span className="font-mono font-black text-lg text-slate-900">
                            {entry.totalPoints} pts
                          </span>
                        </div>
                        <h5 className="font-bold text-base text-slate-900">{entry.team.name}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.team.institution || 'Collegiate House'}</p>
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-600">
                          <span>🥇 {entry.firstPlaceCount} Gold</span>
                          <span>🥈 {entry.secondPlaceCount} Silver</span>
                          <span>🥉 {entry.thirdPlaceCount} Bronze</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topIndividualContestants.length === 0 ? (
                    <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                      Individual student standings will appear once competitive stage events are concluded.
                    </div>
                  ) : (
                    topIndividualContestants.slice(0, 3).map((entry, idx) => (
                      <div
                        key={entry.participant.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          idx === 0
                            ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                            : idx === 1
                            ? 'bg-slate-100/80 border-slate-300'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono font-bold text-xs bg-slate-900 text-amber-300 px-2.5 py-1 rounded-md">
                            Chest #{entry.participant.chestNumber || entry.participant.id}
                          </span>
                          <span className="font-mono font-black text-lg text-slate-900">
                            {entry.totalPoints} pts
                          </span>
                        </div>
                        <h5 className="font-bold text-base text-slate-900">{entry.participant.name}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {entry.team?.name || 'Independent'} • {entry.category}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-600">
                          <span>🥇 {entry.firstPlaceCount} 1st</span>
                          <span>🥈 {entry.secondPlaceCount} 2nd</span>
                          <span>🥉 {entry.thirdPlaceCount} 3rd</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTabSection('leaderboard')}
                  className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                >
                  <span>View Full Championship Leaderboards</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bento Row 3: Upcoming Programme Schedule (2 cols) + Secretariat & Contact Desk (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Bento Card 4: Upcoming Schedule Highlights */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Timetable
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                        Upcoming Programme Schedule
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTabSection('schedule')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Full Schedule</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {publishedProgrammes.slice(0, 3).map((prg) => (
                      <div
                        key={prg.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{prg.name}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                              {prg.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {prg.startTime} - {prg.endTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {prg.venue} ({prg.stage})
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shrink-0">
                          {prg.type === 'individual' ? 'Solo' : 'Group'}
                        </span>
                      </div>
                    ))}
                    {publishedProgrammes.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-6 text-center">
                        Detailed stage schedules are currently being synchronized by the coordinators.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Auditoriums, open amphitheatre & main stages</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className="font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    View all stages →
                  </button>
                </div>
              </div>

              {/* Bento Card 5: Official Secretariat & Help Desk */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 bg-pink-950/80 border border-pink-800/80 px-2.5 py-0.5 rounded-full">
                    Official Helpdesk
                  </span>
                  
                  <h4 className="text-lg font-bold text-white tracking-tight mt-2.5">
                    Festival Secretariat & Support
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Direct official support channels for contestant inquiries, schedule clarifications, and scoring.
                  </p>

                  <div className="space-y-2.5 mt-4 text-xs">
                    <a
                      href={`tel:${settings.contactPhone || '9844691633'}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Phone Helpline</div>
                        <div className="font-bold text-white">{settings.contactPhone || '9844691633'}</div>
                      </div>
                    </a>

                    <a
                      href={`mailto:${settings.contactEmail || 'abdwahidbc@gmail.com'}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Official Email</div>
                        <div className="font-bold text-white truncate">{settings.contactEmail || 'abdwahidbc@gmail.com'}</div>
                      </div>
                    </a>

                    <a
                      href={`https://instagram.com/${settings.contactInstagram || 'abd_l_wahid_'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Official Instagram</div>
                        <div className="font-bold text-white">@{settings.contactInstagram || 'abd_l_wahid_'}</div>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>Venue: <strong className="text-slate-200">{fest?.venue || settings.venue || pageData.content.venueInfo}</strong></span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================================================================== */}
      {/* 4B. OFFICIAL LEADERBOARD TAB (TEAM & INDIVIDUAL)                     */}
      {/* ==================================================================== */}
      {activeTabSection === 'leaderboard' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">
                Championship Standings
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Official Festival Leaderboards
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real-time verified standings for competing houses and top individual student performers.
              </p>
            </div>

            {/* Main Leaderboard Switcher: Team vs Individual */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setLeaderboardType('team')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  leaderboardType === 'team'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Team Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardType('individual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  leaderboardType === 'individual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Individual Leaderboard</span>
              </button>
            </div>
          </div>

          {/* VIEW A: TEAM LEADERBOARD */}
          {leaderboardType === 'team' && (
            <div className="space-y-6">
              {/* Podium for Top 3 Teams */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 2nd Place */}
                  <div className="order-2 md:order-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-slate-200 text-slate-800 px-3 py-1 rounded-lg">
                          🥈 2nd Place
                        </span>
                        <span className="font-mono font-black text-xl text-slate-900">
                          {leaderboard[1].totalPoints} pts
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900">{leaderboard[1].team.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{leaderboard[1].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>🥇 {leaderboard[1].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[1].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[1].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>

                  {/* 1st Place Champion */}
                  <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-amber-100/60 border-2 border-amber-300 rounded-2xl p-6 flex flex-col justify-between shadow-md relative -translate-y-1">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Fest Leader
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className="text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-lg flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          1st Place Champion
                        </span>
                        <span className="font-mono font-black text-2xl text-slate-900">
                          {leaderboard[0].totalPoints} pts
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900">{leaderboard[0].team.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{leaderboard[0].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>🥇 {leaderboard[0].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[0].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[0].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="order-3 bg-amber-50/40 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-amber-200 text-amber-900 px-3 py-1 rounded-lg">
                          🥉 3rd Place
                        </span>
                        <span className="font-mono font-black text-xl text-slate-900">
                          {leaderboard[2].totalPoints} pts
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900">{leaderboard[2].team.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{leaderboard[2].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>🥇 {leaderboard[2].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[2].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[2].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Team Leaderboard Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    House Championship Standings — Cumulative Points from Individual & Team Programmes
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">Live Ratified</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">House / Team</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-3 text-center">🥇 Gold</th>
                        <th className="py-3 px-3 text-center">🥈 Silver</th>
                        <th className="py-3 px-3 text-center">🥉 Bronze</th>
                        <th className="py-3 px-4 text-right">Ratified Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaderboard.map((entry) => (
                        <tr key={entry.team.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                entry.rank === 1
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : entry.rank === 2
                                  ? 'bg-slate-200 text-slate-900'
                                  : entry.rank === 3
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              #{entry.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{entry.team.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{entry.team.code}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {entry.team.institution || 'Collegiate House'}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-700">
                            {entry.firstPlaceCount}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-500">
                            {entry.secondPlaceCount}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-800">
                            {entry.thirdPlaceCount}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-slate-900">
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

          {/* VIEW B: INDIVIDUAL LEADERBOARD */}
          {leaderboardType === 'individual' && (
            <div className="space-y-6">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 mr-1 uppercase tracking-wider">Category:</span>
                <button
                  type="button"
                  onClick={() => setLeaderboardCategory('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    leaderboardCategory === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Categories (Overall Champions)
                </button>
                {festCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setLeaderboardCategory(c.name)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      leaderboardCategory.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Individual Champions Podium (Top 3) */}
              {individualLeaderboardData.length >= 3 && individualLeaderboardData[0].totalPoints > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 2nd Place Individual */}
                  <div className="order-2 md:order-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-slate-200 text-slate-800 px-3 py-1 rounded-lg">
                          🥈 2nd Place
                        </span>
                        <span className="font-mono font-bold text-xs bg-slate-900 text-amber-300 px-2 py-0.5 rounded-md">
                          Chest #{individualLeaderboardData[1].participant.chestNumber || individualLeaderboardData[1].participant.id}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900">{individualLeaderboardData[1].participant.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {individualLeaderboardData[1].team?.name || 'Independent'} • {individualLeaderboardData[1].category}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        🥇 {individualLeaderboardData[1].firstPlaceCount} • 🥈 {individualLeaderboardData[1].secondPlaceCount} • 🥉 {individualLeaderboardData[1].thirdPlaceCount}
                      </span>
                      <span className="font-mono font-black text-lg text-slate-900">
                        {individualLeaderboardData[1].totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* 1st Place Individual Champion */}
                  <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-amber-100/60 border-2 border-amber-300 rounded-2xl p-6 flex flex-col justify-between shadow-md relative -translate-y-1">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Category Champion
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className="text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-lg flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          1st Place Champion
                        </span>
                        <span className="font-mono font-bold text-xs bg-slate-900 text-amber-300 px-2.5 py-1 rounded-md">
                          Chest #{individualLeaderboardData[0].participant.chestNumber || individualLeaderboardData[0].participant.id}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900">{individualLeaderboardData[0].participant.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {individualLeaderboardData[0].team?.name || 'Independent'} • {individualLeaderboardData[0].category}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-bold">
                        🥇 {individualLeaderboardData[0].firstPlaceCount} • 🥈 {individualLeaderboardData[0].secondPlaceCount} • 🥉 {individualLeaderboardData[0].thirdPlaceCount}
                      </span>
                      <span className="font-mono font-black text-2xl text-slate-900">
                        {individualLeaderboardData[0].totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* 3rd Place Individual */}
                  <div className="order-3 bg-amber-50/40 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-amber-200 text-amber-900 px-3 py-1 rounded-lg">
                          🥉 3rd Place
                        </span>
                        <span className="font-mono font-bold text-xs bg-slate-900 text-amber-300 px-2 py-0.5 rounded-md">
                          Chest #{individualLeaderboardData[2].participant.chestNumber || individualLeaderboardData[2].participant.id}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900">{individualLeaderboardData[2].participant.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {individualLeaderboardData[2].team?.name || 'Independent'} • {individualLeaderboardData[2].category}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        🥇 {individualLeaderboardData[2].firstPlaceCount} • 🥈 {individualLeaderboardData[2].secondPlaceCount} • 🥉 {individualLeaderboardData[2].thirdPlaceCount}
                      </span>
                      <span className="font-mono font-black text-lg text-slate-900">
                        {individualLeaderboardData[2].totalPoints} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Individual Leaderboard Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Individual Contestants Standings — {leaderboardCategory === 'all' ? 'All Categories' : `${leaderboardCategory} Category`}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Tie-breaker: Points &gt; 1st &gt; 2nd &gt; Marks
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3 px-3 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Chest #</th>
                        <th className="py-3 px-4">Contestant</th>
                        <th className="py-3 px-4">House / Team</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-2 text-center">🥇 1st</th>
                        <th className="py-3 px-2 text-center">🥈 2nd</th>
                        <th className="py-3 px-2 text-center">🥉 3rd</th>
                        <th className="py-3 px-2 text-center">Total Marks</th>
                        <th className="py-3 px-4 text-right">Individual Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {individualLeaderboardData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400">
                            No participants scored yet in this category.
                          </td>
                        </tr>
                      ) : (
                        individualLeaderboardData.map((entry) => (
                          <tr key={entry.participant.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-3 text-center font-mono font-bold">
                              {entry.totalPoints > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''}
                                  #{entry.rank}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                                #{entry.participant.chestNumber || entry.participant.id}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{entry.participant.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">ID: {entry.participant.id}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{entry.team?.name || 'Independent'}</div>
                              <div className="text-[10px] text-slate-400">{entry.team?.institution}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                                {entry.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-center font-mono font-bold text-amber-700">
                              {entry.firstPlaceCount}
                            </td>
                            <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-500">
                              {entry.secondPlaceCount}
                            </td>
                            <td className="py-3.5 px-2 text-center font-mono font-bold text-amber-800">
                              {entry.thirdPlaceCount}
                            </td>
                            <td className="py-3.5 px-2 text-center font-mono text-slate-700">
                              {entry.totalMarks}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                              {entry.totalPoints} pts
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 4C. OFFICIAL STUDENT LOOKUP & SEARCH TAB                             */}
      {/* ==================================================================== */}
      {activeTabSection === 'student_search' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">
                  Official Student Directory & Live Search
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                  Student & Contestant Lookup
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Search any student by Chest Number or Name to inspect event schedules, registered programmes, and live points won.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
                  {festParticipants.length} Contestants Enrolled
                </span>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="mt-6 max-w-2xl">
              <div className="relative flex items-center bg-white border-2 border-slate-300 rounded-2xl shadow-sm focus-within:border-slate-900 transition-colors">
                <div className="pl-4 text-slate-400">
                  <Search className="w-5 h-5 text-indigo-600" />
                </div>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by Chest Number (e.g. 104, PT-104) or Student Name..."
                  className="w-full pl-3 pr-10 py-3.5 text-sm sm:text-base text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
                  autoFocus
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {(() => {
            const queryPresent = studentSearchQuery.trim().length > 0;
            const studentsToDisplay = queryPresent ? matchedStudents : festParticipants;

            if (queryPresent && studentsToDisplay.length === 0) {
              return (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    No participant found matching "{studentSearchQuery}"
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Please verify the chest number (e.g. 101, CH-12) or try searching by the participant's full name.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>
                    Showing {studentsToDisplay.length} {studentsToDisplay.length === 1 ? 'student' : 'students'}
                    {queryPresent ? ` for "${studentSearchQuery}"` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentsToDisplay.map((student) => {
                    const team = teams.find((t) => t.id === student.teamId);
                    const stats = getStudentStats(student.id);
                    const studentProgs = programmes.filter((prg) =>
                      student.registeredProgrammes?.includes(prg.id)
                    );

                    return (
                      <div
                        key={student.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-mono font-black text-xs bg-slate-900 text-amber-300 px-3 py-1 rounded-xl shadow-xs">
                              Chest #{student.chestNumber || student.id}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {student.category}
                            </span>
                          </div>

                          {/* Student Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-base text-slate-900 truncate">{student.name}</h4>
                              <p className="text-xs text-slate-600 mt-0.5">
                                House: <strong className="text-slate-900">{team?.name || 'Team'}</strong>
                              </p>
                              {team?.institution && (
                                <p className="text-[11px] text-slate-400 truncate">{team.institution}</p>
                              )}
                            </div>
                          </div>

                          {/* Points & Medals Strip */}
                          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Points</span>
                              <span className="font-mono font-black text-base text-slate-900">
                                {stats.totalPoints} pts
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Medals Won</span>
                              <span className="text-xs font-bold text-slate-700">
                                🥇 {stats.goldCount} · 🥈 {stats.silverCount} · 🥉 {stats.bronzeCount}
                              </span>
                            </div>
                          </div>

                          {/* Registered Programmes */}
                          <div className="mt-3.5 space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                              Events ({studentProgs.length})
                            </span>
                            {studentProgs.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No events assigned yet.</p>
                            ) : (
                              studentProgs.slice(0, 3).map((prg) => {
                                const res = stats.studentResults.find((r) => r.programmeId === prg.id);
                                return (
                                  <div
                                    key={prg.id}
                                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                                  >
                                    <span className="font-medium text-slate-800 truncate max-w-[170px]">
                                      {prg.name}
                                    </span>
                                    {res ? (
                                      <span className="font-mono font-bold text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        Rank #{res.rank} (+{res.pointsAwarded} pts)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {prg.venue || 'Scheduled'}
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                            {studentProgs.length > 3 && (
                              <span className="text-[11px] text-slate-400 block pt-0.5">
                                +{studentProgs.length - 3} more events
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View Card Button */}
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForModal(student)}
                            className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View Full Student Card</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 5. PHOTO GALLERY TAB                                                 */}
      {/* ==================================================================== */}
      {activeTabSection === 'gallery' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                Official Photo Gallery
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Admin-curated captures and stage recordings across all festival programs.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredGalleryPhotos.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No photos in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGalleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group cursor-pointer rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden relative">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      {photo.category || 'General'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {photo.caption}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 6. RESULTS TAB                                                       */}
      {/* ==================================================================== */}
      {activeTabSection === 'results' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                Official Festival Results & Standings
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ratified results, championship team standings, and category individual scoreboards.
              </p>
            </div>

            {/* Sub-Tabs: Programmes vs Team Leaderboard vs Individual Scoreboards */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setResultsSubTab('programmes')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  resultsSubTab === 'programmes'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Event Results
              </button>
              <button
                type="button"
                onClick={() => setResultsSubTab('team_scoreboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  resultsSubTab === 'team_scoreboard'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Team Scoreboard
              </button>
              <button
                type="button"
                onClick={() => setResultsSubTab('category_scoreboards')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  resultsSubTab === 'category_scoreboards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Individual Scoreboards
              </button>
            </div>
          </div>

          {/* VIEW 1: PROGRAMME RESULTS */}
          {resultsSubTab === 'programmes' && (
            <div>
              {publishedResults.length === 0 ? (
                <div className="p-12 text-center border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
                  No results have been published yet. Please check back as programmes conclude.
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedResults.map((r) => {
                    const prog = programmes.find((p) => p.id === r.programmeId);
                    const isTeam = r.isTeamProgramme || prog?.programmeType === 'team';
                    return (
                      <div
                        key={r.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              r.rank === 1
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : r.rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : r.rank === 3
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              Rank #{r.rank}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isTeam
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isTeam ? 'Team Programme' : 'Individual'}
                            </span>
                            {r.category && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                {r.category}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-slate-900">
                            {r.programmeName || prog?.name || 'Programme Event'}
                          </h4>

                          <p className="text-xs text-slate-600">
                            {isTeam ? (
                              <>
                                Winning Entry: <strong className="text-purple-900 font-bold">{r.entryName || 'Squad Entry'}</strong>
                                {' '}• Representing <strong className="text-slate-900">{r.teamName}</strong>
                              </>
                            ) : (
                              <>
                                Winner: <strong className="text-slate-900 font-bold">{r.participantName || 'Contestant'}</strong>
                                {' '}• <span className="text-slate-700">{r.teamName}</span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-base font-mono font-bold text-slate-900">
                            +{r.pointsAwarded} pts
                          </div>
                          {r.publishedAt && (
                            <span className="text-[11px] text-slate-400">
                              Ratified {r.publishedAt.slice(0, 10)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: TEAM SCOREBOARD */}
          {resultsSubTab === 'team_scoreboard' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  Official House Championship Standings. Points from both Individual and Team Programmes accrue to the team.
                </span>
                <span className="font-mono text-[11px] text-slate-500">Live Ratified Standings</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                      <th className="py-3 px-4 text-center w-16">Rank</th>
                      <th className="py-3 px-4">House / Team</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-3 text-center">🥇 Gold</th>
                      <th className="py-3 px-3 text-center">🥈 Silver</th>
                      <th className="py-3 px-3 text-center">🥉 Bronze</th>
                      <th className="py-3 px-4 text-right">Ratified Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((entry) => (
                      <tr key={entry.team.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              entry.rank === 1
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : entry.rank === 2
                                ? 'bg-slate-200 text-slate-900'
                                : entry.rank === 3
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{entry.team.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{entry.team.code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {entry.team.institution || 'Collegiate House'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-700">
                          {entry.firstPlaceCount}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-500">
                          {entry.secondPlaceCount}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-800">
                          {entry.thirdPlaceCount}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-slate-900">
                          {entry.totalPoints} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: INDIVIDUAL CATEGORY SCOREBOARDS */}
          {resultsSubTab === 'category_scoreboards' && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 mr-1">Category:</span>
                {festCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedPublicCategory(c.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedPublicCategory.toLowerCase() === c.name.toLowerCase()
                        ? c.isGeneral
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c.name} {c.isGeneral ? '(General / Any Age)' : ''}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span>
                  Official individual rankings for <strong>{selectedPublicCategory} Category</strong>. Individual scores are attributed solely to individual competitors. Team programme scores are kept separate.
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  Tie-breaker: Points &gt; 1st &gt; 2nd &gt; Marks
                </span>
              </div>

              {(() => {
                const scoreboard = getCategoryScoreboard(selectedPublicCategory);
                if (scoreboard.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
                      No participants registered or scored in {selectedPublicCategory} category.
                    </div>
                  );
                }

                return (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                            <th className="py-3 px-3 text-center w-16">Rank</th>
                            <th className="py-3 px-4">Contestant</th>
                            <th className="py-3 px-4">House / Team</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-2 text-center">🥇 1st</th>
                            <th className="py-3 px-2 text-center">🥈 2nd</th>
                            <th className="py-3 px-2 text-center">🥉 3rd</th>
                            <th className="py-3 px-2 text-center">Total Marks</th>
                            <th className="py-3 px-4 text-right">Individual Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {scoreboard.map((entry) => (
                            <tr key={entry.participant.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 text-center font-mono font-bold">
                                {entry.totalPoints > 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''}
                                    #{entry.rank}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{entry.participant.name}</div>
                                <div className="font-mono text-[10px] text-slate-400">{entry.participant.id}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-800">{entry.team?.name || 'Independent'}</div>
                                <div className="text-[10px] text-slate-400">{entry.team?.institution}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                                  {entry.category}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-amber-700">
                                {entry.firstPlaceCount}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-500">
                                {entry.secondPlaceCount}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-amber-800">
                                {entry.thirdPlaceCount}
                              </td>
                              <td className="py-3 px-2 text-center font-mono text-slate-700">
                                {entry.totalMarks}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                                {entry.totalPoints} pts
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 7. TIMETABLE / SCHEDULE TAB                                          */}
      {/* ==================================================================== */}
      {activeTabSection === 'schedule' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              Festival Timetable & Stages
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Official schedule for stage events, contests, and ceremonies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedProgrammes.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {p.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{p.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.venue || 'Main Stage'}
                    </span>
                    <span>•</span>
                    <span>Max {p.maxParticipantsPerTeam || 1} per house</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 8. TEAMS TAB                                                         */}
      {/* ==================================================================== */}
      {activeTabSection === 'teams' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              Participating Houses & Teams
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Official houses competing in {settings.festName}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {t.code}
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {(t.totalPoints ?? t.totalScore) ?? results.filter((r) => r.teamId === t.id && r.published).reduce((sum, r) => sum + (r.pointsAwarded || 0), 0)} pts
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{t.institution || 'Collegiate House'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 9. BULLETINS / ANNOUNCEMENTS TAB                                     */}
      {/* ==================================================================== */}
      {activeTabSection === 'bulletin' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              Official Bulletins & Notices
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Real-time notices and schedule updates from the Fest Administration.
            </p>
          </div>

          {publicAnnouncements.length === 0 ? (
            <div className="p-12 text-center border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
              No public notices posted at this moment.
            </div>
          ) : (
            <div className="space-y-4">
              {publicAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" />
                      {a.category || 'General Notice'}
                    </span>
                    <span className="text-xs text-slate-400">{a.createdAt?.slice(0, 10)}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{a.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* LIGHTBOX MODAL FOR GALLERY PHOTOS                                    */}
      {/* ==================================================================== */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {selectedPhoto.category || 'Fest Photo'}
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedPhoto.caption}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            {selectedPhoto.description && (
              <div className="p-4 bg-slate-950 text-xs text-slate-300">
                {selectedPhoto.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FOOTER                                                               */}
      {/* ==================================================================== */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-medium text-slate-700">© 2026 {settings.festName}. Powered by Festoria Festival Management Platform.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Unified collegiate governance & scoring infrastructure.</p>
          </div>

          {/* Help & Secretariat Support Contact */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600">
            <a
              href={`mailto:${settings.contactEmail || 'abdwahidbc@gmail.com'}`}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>{settings.contactEmail || 'abdwahidbc@gmail.com'}</span>
            </a>
            <a
              href={`tel:${settings.contactPhone || '9844691633'}`}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{settings.contactPhone || '9844691633'}</span>
            </a>
            <a
              href={`https://instagram.com/${settings.contactInstagram || 'abd_l_wahid_'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-pink-600 transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>@{settings.contactInstagram || 'abd_l_wahid_'}</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a href={getAppUrl()} className="hover:text-slate-900 font-semibold min-h-[44px] inline-flex items-center">Festoria Home</a>
            <a href={getAppUrl('admin.html')} className="hover:text-slate-900 font-semibold min-h-[44px] inline-flex items-center">Admin Sign In</a>
          </div>
        </div>
      </footer>

      {/* Student Details / Performance Modal */}
      {selectedStudentForModal && (() => {
        const student = selectedStudentForModal;
        const team = teams.find((t) => t.id === student.teamId);
        const stats = getStudentStats(student.id);
        const studentProgs = programmes.filter((prg) =>
          student.registeredProgrammes?.includes(prg.id)
        );

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => setSelectedStudentForModal(null)}
          >
            <div
              className="max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono font-black text-xs bg-amber-400 text-slate-950 px-3 py-1 rounded-xl shadow-xs">
                    Chest #{student.chestNumber || student.id}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-300">
                    {student.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {student.id}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">{student.name}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Representing <strong className="text-white font-bold">{team?.name || 'Independent'}</strong>
                  {team?.institution ? ` • ${team.institution}` : ''}
                </p>
              </div>

              {/* Statistics Strip */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Total Individual Points
                  </span>
                  <span className="font-mono font-black text-2xl text-slate-900 mt-0.5 block">
                    {stats.totalPoints} pts
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Medals Won
                  </span>
                  <span className="text-sm font-black text-slate-800 mt-1.5 block">
                    🥇 {stats.goldCount} · 🥈 {stats.silverCount} · 🥉 {stats.bronzeCount}
                  </span>
                </div>
              </div>

              {/* Registered Programmes Detail */}
              <div className="p-6 space-y-3 max-h-72 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Registered Programmes ({studentProgs.length})
                </h4>

                {studentProgs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No programmes registered yet.</p>
                ) : (
                  studentProgs.map((prg) => {
                    const res = stats.studentResults.find((r) => r.programmeId === prg.id);
                    return (
                      <div
                        key={prg.id}
                        className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-sm text-slate-900">{prg.name}</h5>
                          {res ? (
                            <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                              Rank #{res.rank} (+{res.pointsAwarded} pts)
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Scheduled
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {prg.startTime} - {prg.endTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {prg.venue} ({prg.stage})
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Modal Action */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* SLIDE-OUT NAVIGATION MENU DRAWER                                     */}
      {/* ==================================================================== */}
      {menuDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMenuDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10 z-50">
            <div className="w-screen max-w-sm sm:max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
                <div className="flex items-center gap-3 min-w-0">
                  {pageData.logo.logoUrl ? (
                    <img
                      src={pageData.logo.logoUrl}
                      alt={festName}
                      style={{ width: `${pageData.logo.widthPx || 100}px` }}
                      className="h-8 object-contain"
                    />
                  ) : (
                    <img
                      src={FESTORIA_LOGO}
                      alt={festName}
                      onError={handleLogoError}
                      className="w-8 h-8 rounded-xl object-contain border border-slate-200 bg-white"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{festName}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider truncate">
                      {fest?.institution ? `${fest.institution} · ` : ''}{fest?.edition || settings.festEdition || 'Official Festival Portal'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Fast Action Card (Register & Sign In) */}
                <div className="bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-2xl p-4 text-white shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      Contestant Access
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                      Live
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Join as a Participant</h4>
                    <p className="text-[11px] text-indigo-200/80 mt-0.5">
                      Register your entries, verify your chest number, and track live scores.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDrawerOpen(false);
                        openAuth('participant', 'register');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-white text-indigo-950 text-xs font-bold hover:bg-indigo-50 transition-colors text-center shadow-xs"
                    >
                      Register Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDrawerOpen(false);
                        openAuth('participant', 'signin');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors text-center"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                {/* Festival Navigation Sections */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                    Festival Navigation
                  </h4>
                  <nav className="space-y-1">
                    {[
                      { id: 'overview', label: 'Festival Overview', icon: Sparkles, badge: null },
                      { id: 'leaderboard', label: 'Leaderboard & Standings', icon: Trophy, badge: 'Live' },
                      { id: 'student_search', label: 'Student Directory & Chest #', icon: Search, badge: `${festParticipants.length}` },
                      { id: 'results', label: 'Official Published Results', icon: Award, badge: `${publishedResults.length}` },
                      { id: 'schedule', label: 'Timetable & Stage Schedule', icon: Calendar, badge: `${publishedProgrammes.length}` },
                      { id: 'teams', label: 'Houses & Competing Teams', icon: Users, badge: `${teams.length}` },
                      ...(allPhotos.length > 0 ? [{ id: 'gallery', label: 'Official Photo Gallery', icon: ImageIcon, badge: `${allPhotos.length}` }] : []),
                      { id: 'bulletin', label: 'Bulletins & Announcements', icon: Bell, badge: `${publicAnnouncements.length}` },
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isActive = activeTabSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTabSection(item.id as any);
                            setMenuDrawerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200/80 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComp className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Portals & Management Access */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                    Portals & Management
                  </h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDrawerOpen(false);
                        openAuth('team_leader', 'signin');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Team Leader Portal</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <a
                      href={getAppUrl('admin.html')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-purple-600" />
                        <span>Fest Admin Console</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>

                    <a
                      href={getAppUrl()}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Festoria Platform Home</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </a>
                  </div>
                </div>

                {/* Secretariat Help & Contact */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900">Festival Secretariat</h5>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                      Help & Support
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <a
                      href={`tel:${settings.contactPhone || '9844691633'}`}
                      className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 font-medium"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <span>{settings.contactPhone || '9844691633'}</span>
                    </a>
                    <a
                      href={`mailto:${settings.contactEmail || 'abdwahidbc@gmail.com'}`}
                      className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 font-medium truncate"
                    >
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-indigo-700" />
                      </div>
                      <span className="truncate">{settings.contactEmail || 'abdwahidbc@gmail.com'}</span>
                    </a>
                    <a
                      href={`https://instagram.com/${settings.contactInstagram || 'abd_l_wahid_'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-slate-700 hover:text-pink-600 font-medium"
                    >
                      <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-pink-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </div>
                      <span>@{settings.contactInstagram || 'abd_l_wahid_'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-[11px] text-slate-500">
                <span>© 2026 {festName} · Powered by Festoria</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={authRole}
        initialMode={authMode}
      />
    </div>
  );
};
