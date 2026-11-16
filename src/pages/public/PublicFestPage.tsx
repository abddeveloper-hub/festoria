import React, { useState, useEffect, useRef } from 'react';
import { useFest } from '../../context/FestContext';
import { getAppUrl } from '../../utils/navigation';
import { FESTORIA_LOGO, handleLogoError } from '../../utils/logo';
import {
  FestPublicPageData,
  FestPhotoItem,
  Role,
  Programme,
  ApprovedResult
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
  ChevronLeft,
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
  Menu,
  Crown,
  FileText,
  Send,
  Filter,
  Check,
  SlidersHorizontal
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
    getCategoryScoreboard,
    addToast,
    scheduleSlots
  } = useFest();

  // Contact Message form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSent(true);
    addToast('success', 'Message Sent', 'Thank you! Your message has been sent to the festival convenors.');
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setTimeout(() => setContactSent(false), 4000);
  };

  // Media carousel slide index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const targetFestId = propFestId || activeFestId || 'FEST-01';
  const fest = fests.find((f) => f.id === targetFestId);
  const festName = fest ? `${fest.name} ${fest.edition || ''}`.trim() : (settings.festName || 'Festoria 2026');

  const [pageData, setPageData] = useState<FestPublicPageData>(
    previewData || getDefaultFestPublicPage(targetFestId, festName)
  );

  const [activeTabSection, setActiveTabSection] = useState<
    'overview' | 'leaderboard' | 'student_search' | 'results' | 'schedule' | 'teams' | 'gallery' | 'bulletin'
  >('overview');

  // Theme Switcher State: Varsity Heritage (Collegiate Vintage) vs Modern
  const [publicTheme, setPublicTheme] = useState<'varsity_heritage' | 'modern'>(() => {
    try {
      const saved = localStorage.getItem('festoria_public_theme');
      if (saved === 'modern' || saved === 'varsity_heritage') return saved;
    } catch {}
    return 'varsity_heritage';
  });

  const togglePublicTheme = () => {
    const next = publicTheme === 'varsity_heritage' ? 'modern' : 'varsity_heritage';
    setPublicTheme(next);
    try {
      localStorage.setItem('festoria_public_theme', next);
    } catch {}
  };

  const isVarsity = publicTheme === 'varsity_heritage';

  const [leaderboardType, setLeaderboardType] = useState<'team' | 'individual'>('team');
  const [leaderboardCategory, setLeaderboardCategory] = useState<string>('all');

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any | null>(null);
  const [overviewLeaderboardToggle, setOverviewLeaderboardToggle] = useState<'team' | 'individual'>('team');

  const [resultsSubTab, setResultsSubTab] = useState<'programmes' | 'team_scoreboard' | 'category_scoreboards'>('programmes');
  const [selectedPublicCategory, setSelectedPublicCategory] = useState<string>('Senior');
  const [publicResultsSearch, setPublicResultsSearch] = useState('');
  const [publicResultsFilterCat, setPublicResultsFilterCat] = useState('all');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | 'participant' | 'auto'>('participant');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  // Real-time Festival Countdown Clock State
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    status: 'upcoming' | 'live' | 'concluded';
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'upcoming' });

  useEffect(() => {
    const startStr = fest?.startDate || settings.startDate || '2027-01-08';
    const endStr = fest?.endDate || settings.endDate || '2027-01-10';

    const updateCountdown = () => {
      const now = new Date().getTime();
      const startDate = new Date(startStr).getTime();
      const endDate = new Date(`${endStr}T23:59:59`).getTime();

      if (isNaN(startDate)) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'upcoming' });
        return;
      }

      if (now < startDate) {
        const diff = Math.max(0, startDate - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds, status: 'upcoming' });
      } else if (now >= startDate && now <= endDate) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'live' });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'concluded' });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [fest?.startDate, fest?.endDate, settings.startDate, settings.endDate]);

  // Video playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  // Gallery filter & lightbox
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<FestPhotoItem | null>(null);

  // Timetable & Schedule filters
  const [scheduleCategoryFilter, setScheduleCategoryFilter] = useState('All');
  const [scheduleStageFilter, setScheduleStageFilter] = useState<'all' | 'stage' | 'off_stage'>('all');
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');

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

  // Lock body scroll when mobile navigation drawer is open
  useEffect(() => {
    if (menuDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuDrawerOpen]);

  const publishedResults = results.filter((r) => r.published);
  const publicAnnouncements = announcements.filter((a) => a.isPublic);
  const publishedProgrammes = programmes.filter((p) => p.status !== 'draft');

  // Schedule slots scoped to this festival
  const festScheduleSlots = React.useMemo(() => {
    return (scheduleSlots || []).filter((s) => !s.festId || s.festId === targetFestId);
  }, [scheduleSlots, targetFestId]);

  // Available categories in the schedule (preserving fest category order and deduplicating by case-insensitive name)
  const availableScheduleCategories = React.useMemo(() => {
    const catMap = new Map<string, string>();
    (festCategories || []).forEach((c) => {
      if (c.name) catMap.set(c.name.trim().toLowerCase(), c.name.trim());
    });
    (publishedProgrammes || []).forEach((p) => {
      if (p.category) {
        const norm = p.category.trim().toLowerCase();
        if (!catMap.has(norm)) {
          catMap.set(norm, p.category.trim());
        }
      }
    });
    return Array.from(catMap.values());
  }, [publishedProgrammes, festCategories]);

  // Filtered programmes for schedule view (Sorted by Code & Schedule Time)
  const filteredScheduleProgrammes = React.useMemo(() => {
    const list = publishedProgrammes.filter((p) => {
      if (scheduleCategoryFilter !== 'All' && (p.category || '').trim().toLowerCase() !== scheduleCategoryFilter.trim().toLowerCase()) {
        return false;
      }
      if (scheduleStageFilter === 'stage') {
        if (p.stageType === 'off_stage') return false;
      } else if (scheduleStageFilter === 'off_stage') {
        if (p.stageType !== 'off_stage') return false;
      }
      if (scheduleSearchQuery.trim()) {
        const q = scheduleSearchQuery.trim().toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesCode = (p.code || '').toLowerCase().includes(q);
        const matchesVenue = (p.venue || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesVenue && !matchesCat) {
          return false;
        }
      }
      return true;
    });

    return list.sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
    );
  }, [publishedProgrammes, scheduleCategoryFilter, scheduleStageFilter, scheduleSearchQuery]);

  // Participants scoped to this festival (Sorted by Chest Number)
  const festParticipants = React.useMemo(() => {
    return (participants || [])
      .filter((p) => !p.festId || p.festId === targetFestId)
      .sort((a, b) => {
        if (a.chestNumber && b.chestNumber) {
          return a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (a.chestNumber) return -1;
        if (b.chestNumber) return 1;
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      });
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

  // Grouped published results by event/programme for consolidated results display
  const groupedPublishedResults = React.useMemo(() => {
    const map = new Map<string, ApprovedResult[]>();
    publishedResults.forEach((r) => {
      const key = r.programmeId || r.programmeName || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    const groups: {
      programme: Programme | undefined;
      programmeId: string;
      programmeName: string;
      category?: string;
      isTeam: boolean;
      results: ApprovedResult[];
      publishedAt?: string;
      totalPointsAwarded: number;
    }[] = [];

    map.forEach((resList, progId) => {
      const prog = programmes.find((p) => p.id === progId);
      const sorted = [...resList].sort((a, b) => a.rank - b.rank);
      const first = sorted[0];
      const isTeam = first.isTeamProgramme || prog?.type === 'team' || prog?.type === 'group' || prog?.programmeType === 'team';
      const totalPts = sorted.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);

      groups.push({
        programme: prog,
        programmeId: progId,
        programmeName: prog?.name || first.programmeName || 'Programme Event',
        category: prog?.category || first.category,
        isTeam,
        results: sorted,
        publishedAt: first.publishedAt,
        totalPointsAwarded: totalPts,
      });
    });

    return groups
      .filter((g) => {
        const matchesCat =
          publicResultsFilterCat === 'all' ||
          (g.category && g.category.toLowerCase() === publicResultsFilterCat.toLowerCase());
        const query = publicResultsSearch.toLowerCase().trim();
        const matchesSearch =
          !query ||
          (g.programmeName || '').toLowerCase().includes(query) ||
          (g.programme?.code ? g.programme.code.toLowerCase().includes(query) : false) ||
          (g.results || []).some(
            (r) =>
              (r.participantName ? r.participantName.toLowerCase().includes(query) : false) ||
              (r.entryName ? r.entryName.toLowerCase().includes(query) : false) ||
              (r.teamName ? r.teamName.toLowerCase().includes(query) : false)
          );
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        const codeA = a.programme?.code || a.programmeId || '';
        const codeB = b.programme?.code || b.programmeId || '';
        return (
          codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' }) ||
          a.programmeName.localeCompare(b.programmeName, undefined, { sensitivity: 'base' })
        );
      });
  }, [publishedResults, programmes, publicResultsSearch, publicResultsFilterCat]);

  const availableResultCategories = React.useMemo(() => {
    const catSet = new Set<string>();
    publishedResults.forEach((r) => {
      if (r.category) catSet.add(r.category.trim());
      const prog = programmes.find((p) => p.id === r.programmeId);
      if (prog?.category) catSet.add(prog.category.trim());
    });
    return Array.from(catSet);
  }, [publishedResults, programmes]);

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
    <div
      className={`min-h-screen min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col ${
        isVarsity
          ? 'theme-varsity-heritage bg-[#fdf9f3] text-[#1c1c18] font-body-serif selection:bg-[#782f40] selection:text-white'
          : 'bg-[#faf8ff] text-slate-800 font-sans selection:bg-[#0d9488] selection:text-white'
      }`}
    >
      {/* ==================================================================== */}
      {/* 1. PUBLIC TOP NAVIGATION                                             */}
      {/* ==================================================================== */}
      <nav
        className={`sticky top-0 z-40 px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shadow-2xs w-full max-w-full ${
          isVarsity
            ? 'bg-[#fdf9f3]/95 border-b-2 border-[#1c1c18]'
            : 'bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#e2e8f0]'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {pageData.logo.logoUrl ? (
            <img
              src={pageData.logo.logoUrl}
              alt={festName}
              style={{ width: `${pageData.logo.widthPx || 120}px` }}
              className="h-8 sm:h-9 max-w-[110px] sm:max-w-none object-contain shrink-0"
            />
          ) : (
            <img
              src={FESTORIA_LOGO}
              alt={festName}
              onError={handleLogoError}
              className={`w-8 h-8 sm:w-9 sm:h-9 object-contain bg-white p-0.5 shrink-0 ${
                isVarsity
                  ? 'border-2 border-[#1c1c18] rounded-none shadow-[2px_2px_0px_#782f40]'
                  : 'rounded-xl shadow-xs border border-[#e2e8f0]'
              }`}
            />
          )}

          <div className="min-w-0 flex-1">
            <h1
              className={`text-xs sm:text-base font-bold tracking-tight leading-tight truncate ${
                isVarsity ? 'font-headline text-[#1c1c18]' : 'font-display text-[#0f172a]'
              }`}
            >
              {festName}
            </h1>
            <p
              className={`text-[9px] sm:text-[11px] tracking-wide truncate ${
                isVarsity ? 'font-body-serif text-[#534345]' : 'font-medium text-[#64748b]'
              }`}
            >
              {fest?.institution ? `${fest.institution} · ` : ''}
              {fest?.edition || settings.festEdition || 'Official Festival Portal'}
            </p>
          </div>
        </div>

        {/* Menu Bar & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={togglePublicTheme}
            title={isVarsity ? 'Switch to Modern Theme' : 'Switch to Varsity Heritage Theme'}
            className={
              isVarsity
                ? 'vh-btn-brass px-2.5 sm:px-3 py-1.5 text-xs inline-flex items-center gap-1.5'
                : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-300'
            }
          >
            <span>{isVarsity ? '🏛️ Varsity Heritage' : '✨ Modern'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            className={
              isVarsity
                ? 'vh-btn-primary px-3 sm:px-4 py-2 text-xs inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-[40px]'
                : 'inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#0d9488] hover:bg-[#0f766e] active:bg-[#115e59] text-white text-xs font-bold transition-all shadow-[0_4px_14px_rgba(13,148,136,0.25)] hover:shadow-[0_6px_18px_rgba(13,148,136,0.35)] active:scale-95 cursor-pointer shrink-0 min-h-[36px] sm:min-h-[40px] touch-manipulation'
            }
          >
            <Menu className="w-4 h-4 text-white shrink-0" />
            <span className={isVarsity ? 'font-anton tracking-wider uppercase' : 'font-semibold tracking-wide'}>
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* Subview Navigation Breadcrumb (When viewing a specific section) */}
      {activeTabSection !== 'overview' && (
        <div
          className={`py-2.5 sm:py-3 px-3.5 sm:px-8 sticky top-[59px] z-30 w-full max-w-full ${
            isVarsity
              ? 'bg-[#f7f3ed] border-b-2 border-[#1c1c18]'
              : 'bg-[#f0fdfa]/90 border-b border-[#ccfbf1] backdrop-blur-md'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTabSection('overview')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                isVarsity
                  ? 'font-anton uppercase tracking-wider text-[#782f40] hover:text-[#5b192a]'
                  : 'text-[#0f766e] hover:text-[#0d9488]'
              }`}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Back to Festival Overview</span>
            </button>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider truncate text-right ${
                isVarsity ? 'font-anton text-[#1c1c18]' : 'text-[#64748b]'
              }`}
            >
              {activeTabSection === 'student_search' ? 'Student Directory' : activeTabSection.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. OVERVIEW TAB: MATCHING STRUCTURE MODEL (MINT & SKY COLORS)        */}
      {/* ==================================================================== */}
      {activeTabSection === 'overview' && (
        <>
          {/* ================================================================ */}
          {/* A. FEATURED MEDIA CAROUSEL / SHOWCASE BANNER                     */}
          {/* ================================================================ */}
          <section className="relative px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-6 max-w-7xl mx-auto w-full">
            <div
              className={`relative w-full overflow-hidden flex flex-col justify-between p-4 sm:p-8 lg:p-10 min-h-[440px] sm:min-h-[520px] ${
                isVarsity
                  ? 'rounded-none border-2 border-[#1c1c18] bg-[#f7f3ed] text-[#1c1c18] shadow-[6px_6px_0px_#782f40] vh-crest-watermark'
                  : 'rounded-3xl shadow-[0_15px_40px_-10px_rgba(15,23,42,0.12)] border border-[#e2e8f0] bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] text-white'
              }`}
            >
              
              {/* Carousel Background Layer: Video / Photos / Radial Compass Placeholder */}
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
                    className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-40 scale-105 transition-all duration-700"
                  />
                  {/* Accessible Video Control Toggle */}
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
                    className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white backdrop-blur-md transition-colors text-xs flex items-center gap-1.5"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-medium pr-1">{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                </>
              ) : mainFeaturedPhotos.length > 0 ? (
                <>
                  <img
                    src={mainFeaturedPhotos[currentSlideIndex % mainFeaturedPhotos.length]?.url}
                    alt={mainFeaturedPhotos[currentSlideIndex % mainFeaturedPhotos.length]?.caption || 'Featured Festival Moment'}
                    className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-35 transition-all duration-500"
                  />
                  <div
                    className={`absolute inset-0 z-0 ${
                      isVarsity
                        ? 'bg-gradient-to-t from-[#f7f3ed] via-[#f7f3ed]/60 to-[#782f40]/30'
                        : 'bg-gradient-to-t from-[#06332e] via-[#06332e]/40 to-[#06332e]/70'
                    }`}
                  />
                </>
              ) : (
                /* Concentric Radial Compass Placeholder Illustration as in the reference model */
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
                  <div className="relative w-[240px] sm:w-[460px] h-[240px] sm:h-[460px] rounded-full border border-white/20 flex items-center justify-center">
                    <div className="w-[180px] sm:w-[350px] h-[180px] sm:h-[350px] rounded-full border border-white/25 flex items-center justify-center">
                      <div className="w-[120px] sm:w-[240px] h-[120px] sm:h-[240px] rounded-full border border-white/30 flex items-center justify-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
                        </div>
                      </div>
                    </div>
                    {/* Radial crosshair lines */}
                    <div className="absolute inset-x-0 top-1/2 h-px bg-white/20"></div>
                    <div className="absolute inset-y-0 left-1/2 w-px bg-white/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-white/10 rotate-45"></div>
                      <div className="w-full h-px bg-white/10 -rotate-45"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ambient Luminous Floating Glow Orbs */}
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                <div className={`absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl ${isVarsity ? 'bg-[#782f40]/10' : 'bg-[#89f5e7]/15'}`}></div>
                <div className={`absolute top-1/2 -right-20 w-88 h-88 rounded-full blur-3xl ${isVarsity ? 'bg-[#1b365d]/10' : 'bg-[#5bb8fe]/15'}`}></div>
              </div>

              {/* Top Controls: 1/1 Slide Indicator Badge */}
              <div className="relative z-20 flex items-center justify-between w-full">
                {pageData.logo.logoUrl && pageData.logo.alignment === 'center' ? (
                  <img
                    src={pageData.logo.logoUrl}
                    alt="Fest Logo"
                    style={{ width: `${pageData.logo.widthPx || 120}px` }}
                    className="h-9 max-w-[120px] object-contain drop-shadow-md"
                  />
                ) : isVarsity ? (
                  <div className="vh-pennant-burgundy truncate max-w-[75%] shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffdeab] mr-1.5 shrink-0" />
                    <span className="truncate">
                      {fest ? `${fest.name} · ${fest.institution || ''}` : (settings.festEdition || 'Annual Inter-Collegiate Fest')}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#89f5e7] text-xs font-semibold tracking-wide uppercase shadow-sm truncate max-w-[75%]">
                    <Sparkles className="w-3.5 h-3.5 text-[#6ffbbe] shrink-0" />
                    <span className="truncate">{fest ? `${fest.name} · ${fest.institution || ''}` : (settings.festEdition || 'Annual Inter-Collegiate Fest')}</span>
                  </div>
                )}

                {/* Top Right Slide Counter Badge */}
                <div
                  className={`font-mono text-xs font-bold shadow-sm shrink-0 ${
                    isVarsity
                      ? 'px-3 py-1 bg-[#1c1c18] text-[#fdf9f3] font-anton border border-[#782f40]'
                      : 'px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white'
                  }`}
                >
                  {mainFeaturedPhotos.length > 0 ? `${(currentSlideIndex % mainFeaturedPhotos.length) + 1}/${mainFeaturedPhotos.length}` : '1/1'}
                </div>
              </div>

              {/* Carousel Navigation Chevrons (< and >) */}
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : (mainFeaturedPhotos.length > 0 ? mainFeaturedPhotos.length - 1 : 0)))}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (mainFeaturedPhotos.length > 0 ? (prev + 1) % mainFeaturedPhotos.length : 0))}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Center Hero Information Overlay */}
              <div className="relative z-20 max-w-4xl mx-auto text-center space-y-4 my-auto py-4 sm:py-6 w-full min-w-0">
                <h2
                  className={`text-2xl sm:text-5xl lg:text-6xl font-bold leading-tight break-words ${
                    isVarsity
                      ? 'font-headline text-[#1c1c18]'
                      : 'font-display font-extrabold tracking-tight text-white drop-shadow-md'
                  }`}
                >
                  {pageData.hero.heading && !pageData.hero.heading.includes('Celebrate Passion') ? pageData.hero.heading : `Welcome to ${festName}`}
                </h2>

                <p
                  className={`text-xs sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed ${
                    isVarsity
                      ? 'font-body-serif text-[#534345]'
                      : 'text-white/90 font-normal'
                  }`}
                >
                  {fest?.description || pageData.hero.description}
                </p>

                {/* Dates & Venue Info Pills */}
                <div
                  className={`flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1 text-xs max-w-full ${
                    isVarsity ? 'font-body-serif text-[#1c1c18]' : 'font-medium text-white/90'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 truncate max-w-full ${
                      isVarsity
                        ? 'bg-[#ffffff] border-2 border-[#1c1c18] text-[#1c1c18] shadow-[2px_2px_0px_#1c1c18] rounded-none font-bold'
                        : 'bg-white/10 backdrop-blur-md rounded-full border border-white/20'
                    }`}
                  >
                    <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isVarsity ? 'text-[#782f40]' : 'text-[#89f5e7]'}`} />
                    <span className="truncate">{fest?.startDate || settings.startDate} to {fest?.endDate || settings.endDate}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 truncate max-w-full ${
                      isVarsity
                        ? 'bg-[#ffffff] border-2 border-[#1c1c18] text-[#1c1c18] shadow-[2px_2px_0px_#1c1c18] rounded-none font-bold'
                        : 'bg-white/10 backdrop-blur-md rounded-full border border-white/20'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isVarsity ? 'text-[#1b365d]' : 'text-[#89f5e7]'}`} />
                    <span className="truncate">{fest ? `${fest.venue || ''}${fest.institution ? `, ${fest.institution}` : ''}` : (settings.venue || 'Grand University Campus')}</span>
                  </div>
                </div>

                {/* Dynamic Countdown Clock / Status Indicator */}
                <div className="pt-2 max-w-full overflow-hidden">
                  {countdown.status === 'upcoming' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1 sm:gap-2.5 max-w-full">
                        <div
                          className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-center min-w-[48px] sm:min-w-[68px] ${
                            isVarsity
                              ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[3px_3px_0px_#782f40] rounded-none'
                              : 'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-lg'
                          }`}
                        >
                          <span
                            className={`block leading-none ${
                              isVarsity
                                ? 'font-anton text-lg sm:text-2xl text-[#782f40]'
                                : 'font-mono font-black text-lg sm:text-2xl text-white'
                            }`}
                          >
                            {countdown.days}
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-wider block ${
                              isVarsity ? 'font-anton text-[#1b365d]' : 'font-bold text-teal-100'
                            }`}
                          >
                            Days
                          </span>
                        </div>
                        <span className={`text-base sm:text-lg leading-none ${isVarsity ? 'text-[#1c1c18] font-anton font-bold' : 'text-white/60 font-black'}`}>:</span>
                        <div
                          className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-center min-w-[48px] sm:min-w-[68px] ${
                            isVarsity
                              ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[3px_3px_0px_#782f40] rounded-none'
                              : 'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-lg'
                          }`}
                        >
                          <span
                            className={`block leading-none ${
                              isVarsity
                                ? 'font-anton text-lg sm:text-2xl text-[#782f40]'
                                : 'font-mono font-black text-lg sm:text-2xl text-white'
                            }`}
                          >
                            {String(countdown.hours).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-wider block ${
                              isVarsity ? 'font-anton text-[#1b365d]' : 'font-bold text-teal-100'
                            }`}
                          >
                            Hours
                          </span>
                        </div>
                        <span className={`text-base sm:text-lg leading-none ${isVarsity ? 'text-[#1c1c18] font-anton font-bold' : 'text-white/60 font-black'}`}>:</span>
                        <div
                          className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-center min-w-[48px] sm:min-w-[68px] ${
                            isVarsity
                              ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[3px_3px_0px_#782f40] rounded-none'
                              : 'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-lg'
                          }`}
                        >
                          <span
                            className={`block leading-none ${
                              isVarsity
                                ? 'font-anton text-lg sm:text-2xl text-[#782f40]'
                                : 'font-mono font-black text-lg sm:text-2xl text-white'
                            }`}
                          >
                            {String(countdown.minutes).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-wider block ${
                              isVarsity ? 'font-anton text-[#1b365d]' : 'font-bold text-teal-100'
                            }`}
                          >
                            Mins
                          </span>
                        </div>
                        <span className={`text-base sm:text-lg leading-none ${isVarsity ? 'text-[#1c1c18] font-anton font-bold' : 'text-white/60 font-black'}`}>:</span>
                        <div
                          className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-center min-w-[48px] sm:min-w-[68px] ${
                            isVarsity
                              ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[3px_3px_0px_#782f40] rounded-none'
                              : 'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-lg'
                          }`}
                        >
                          <span
                            className={`block leading-none ${
                              isVarsity
                                ? 'font-anton text-lg sm:text-2xl text-[#a47e3b]'
                                : 'font-mono font-black text-lg sm:text-2xl text-[#6ffbbe]'
                            }`}
                          >
                            {String(countdown.seconds).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-wider block ${
                              isVarsity ? 'font-anton text-[#a47e3b]' : 'font-bold text-[#6ffbbe]'
                            }`}
                          >
                            Secs
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {countdown.status === 'live' && (
                    <div
                      className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider max-w-full ${
                        isVarsity
                          ? 'bg-[#1b365d] text-white border-2 border-[#1c1c18] shadow-[3px_3px_0px_#782f40] rounded-none font-anton'
                          : 'rounded-full bg-[#10b981]/25 backdrop-blur-md border border-[#10b981]/60 text-[#6ffbbe] shadow-lg'
                      }`}
                    >
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
                      </span>
                      <span className="truncate">Festival Is Live · Competitions in Progress</span>
                    </div>
                  )}

                  {countdown.status === 'concluded' && (
                    <div
                      className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider max-w-full ${
                        isVarsity
                          ? 'bg-[#a47e3b] text-white border-2 border-[#1c1c18] shadow-[3px_3px_0px_#1b365d] rounded-none font-anton'
                          : 'rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-200 shadow-md'
                      }`}
                    >
                      <Trophy className="w-4 h-4 text-[#ffdeab] shrink-0" />
                      <span className="truncate">Festival Concluded · Official Ratified Standings</span>
                    </div>
                  )}
                </div>

                {/* Call To Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => openAuth('participant', 'register')}
                    className={
                      isVarsity
                        ? 'vh-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 text-xs sm:text-sm'
                        : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-full text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(13,148,136,0.35)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.45)] active:scale-[0.98] transition-all cursor-pointer'
                    }
                  >
                    <span>{pageData.hero.primaryCtaText || 'Register Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className={
                      isVarsity
                        ? 'vh-btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 text-xs sm:text-sm'
                        : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-white/15 backdrop-blur-md border border-white/25 text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-white/25 active:scale-[0.98] transition-all cursor-pointer'
                    }
                  >
                    <span>{pageData.hero.secondaryCtaText || 'View Schedule'}</span>
                    <ChevronRight className="w-4 h-4 text-teal-200" />
                  </button>
                </div>

                {/* Quick Chest Number Student Search Bar */}
                <div className="w-full max-w-lg mx-auto pt-3 sm:pt-4 text-left">
                  <div
                    className={`relative space-y-1.5 p-2 sm:p-2.5 ${
                      isVarsity
                        ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[4px_4px_0px_#782f40] rounded-none'
                        : 'bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_20px_-4px_rgba(13,148,136,0.15)] border border-[#99f6e4]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`pl-2 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`}>
                        <Search className="w-4 h-4" />
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
                        className={`flex-1 bg-transparent border-0 focus:outline-none text-base sm:text-sm py-1.5 px-1 font-medium ${
                          isVarsity
                            ? 'text-[#1c1c18] placeholder:text-[#867275] font-body-serif'
                            : 'text-[#0f172a] placeholder:text-slate-400 font-sans'
                        }`}
                      />
                      {studentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                          title="Clear"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (studentSearchQuery.trim()) {
                            setActiveTabSection('student_search');
                          }
                        }}
                        className={
                          isVarsity
                            ? 'vh-btn-primary px-4 py-2 text-xs'
                            : 'px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-full text-xs font-bold transition-all shrink-0 shadow-xs active:scale-95 cursor-pointer'
                        }
                      >
                        Search
                      </button>
                    </div>

                    {/* Fast Search Pills */}
                    <div
                      className={`flex flex-wrap items-center gap-1.5 pt-0.5 px-1 text-[11px] ${
                        isVarsity ? 'text-[#534345]' : 'text-slate-400'
                      }`}
                    >
                      <span className={`font-semibold ${isVarsity ? 'text-[#1c1c18] font-anton' : 'text-slate-500'}`}>
                        Quick Lookups:
                      </span>
                      {festParticipants.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setStudentSearchQuery(p.chestNumber || p.name);
                            setActiveTabSection('student_search');
                          }}
                          className={
                            isVarsity
                              ? 'px-2 py-0.5 bg-[#f1ede7] hover:bg-[#e6e2dc] border border-[#1c1c18] text-[#1c1c18] font-anton font-bold transition-colors cursor-pointer text-[10px] rounded-none'
                              : 'px-2 py-0.5 rounded-full bg-[#f0fdfa] hover:bg-[#ccfbf1] border border-[#99f6e4] text-[#0f766e] font-mono font-bold transition-colors cursor-pointer text-[10px]'
                          }
                        >
                          #{p.chestNumber || p.id}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setActiveTabSection('student_search')}
                        className={
                          isVarsity
                            ? 'px-2 py-0.5 bg-[#ffffff] hover:bg-[#f1ede7] border border-[#1c1c18] text-[#782f40] font-anton font-bold transition-colors cursor-pointer text-[10px] rounded-none'
                            : 'px-2 py-0.5 rounded-full bg-[#f0f9ff] hover:bg-[#e0f2fe] border border-[#bae6fd] text-[#0284c7] font-semibold transition-colors cursor-pointer text-[10px]'
                        }
                      >
                        Directory →
                      </button>
                    </div>

                    {/* Floating Instant Matches Dropdown */}
                    {studentSearchQuery.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#99f6e4] shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto divide-y divide-[#f0fdfa]">
                        {matchedStudents.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No participant found for <strong className="text-slate-800 font-bold">"{studentSearchQuery}"</strong>.
                          </div>
                        ) : (
                          matchedStudents.slice(0, 5).map((student) => {
                            const team = teams.find((t) => t.id === student.teamId);
                            const stats = getStudentStats(student.id);
                            return (
                              <div
                                key={student.id}
                                onClick={() => {
                                  setSelectedStudentForModal(student);
                                  setActiveTabSection('student_search');
                                }}
                                className="w-full p-2.5 hover:bg-[#f0fdfa] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-[#0d9488] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {student.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs sm:text-sm text-[#0f172a] truncate">{student.name}</span>
                                      <span className="font-mono font-bold text-[10px] bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-1.5 py-0.2 rounded-full">
                                        #{student.chestNumber || student.id}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                      <span>{team?.name || 'Team'}</span>
                                      <span>•</span>
                                      <span>{student.category}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-bold text-xs text-[#0f172a]">{stats.totalPoints} pts</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Dot Pagination Indicator */}
              <div className="relative z-20 flex items-center justify-center gap-2 pt-2">
                {(mainFeaturedPhotos.length > 0 ? mainFeaturedPhotos : [1]).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === (currentSlideIndex % (mainFeaturedPhotos.length || 1))
                        ? 'w-6 bg-white'
                        : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* B. 4 STATS BADGES STRIP                                          */}
          {/* ================================================================ */}
          <section
            className={`py-10 sm:py-12 ${
              isVarsity ? 'bg-[#f7f3ed] border-b-2 border-[#1c1c18]' : 'bg-[#faf8ff] border-b border-[#e2e8f0]'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
                
                {/* 1. Programs */}
                <div
                  className={`flex flex-col items-center ${
                    isVarsity
                      ? 'p-5 bg-white border-2 border-[#1c1c18] shadow-[4px_4px_0px_#782f40] rounded-none'
                      : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center mb-3 ${
                      isVarsity
                        ? 'w-12 h-12 bg-[#fdf9f3] border-2 border-[#1c1c18] text-[#782f40] rounded-none shadow-[2px_2px_0px_#1c1c18]'
                        : 'w-16 h-16 rounded-full bg-[#f0fdfa] border border-[#ccfbf1] text-[#0d9488] shadow-xs group hover:scale-105 transition-transform'
                    }`}
                  >
                    <Calendar className={`w-6 h-6 sm:w-7 sm:h-7 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                  </div>
                  <span
                    className={`block leading-none ${
                      isVarsity
                        ? 'font-anton text-3xl sm:text-4xl text-[#782f40]'
                        : 'font-mono font-black text-3xl sm:text-4xl text-[#0f172a]'
                    }`}
                  >
                    {publishedProgrammes.length > 0 ? publishedProgrammes.length : 0}
                  </span>
                  <h4
                    className={`mt-2 ${
                      isVarsity
                        ? 'font-headline font-bold text-sm sm:text-base text-[#1c1c18]'
                        : 'font-bold text-sm sm:text-base text-[#0f172a]'
                    }`}
                  >
                    Programs
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                    Exciting programs · Collegiate Events
                  </p>
                </div>

                {/* 2. Participants */}
                <div
                  className={`flex flex-col items-center ${
                    isVarsity
                      ? 'p-5 bg-white border-2 border-[#1c1c18] shadow-[4px_4px_0px_#782f40] rounded-none'
                      : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center mb-3 ${
                      isVarsity
                        ? 'w-12 h-12 bg-[#fdf9f3] border-2 border-[#1c1c18] text-[#1b365d] rounded-none shadow-[2px_2px_0px_#1c1c18]'
                        : 'w-16 h-16 rounded-full bg-[#f0f9ff] border border-[#bae6fd] text-[#0284c7] shadow-xs group hover:scale-105 transition-transform'
                    }`}
                  >
                    <Users className={`w-6 h-6 sm:w-7 sm:h-7 ${isVarsity ? 'text-[#1b365d]' : 'text-[#0284c7]'}`} />
                  </div>
                  <span
                    className={`block leading-none ${
                      isVarsity
                        ? 'font-anton text-3xl sm:text-4xl text-[#1b365d]'
                        : 'font-mono font-black text-3xl sm:text-4xl text-[#0f172a]'
                    }`}
                  >
                    {festParticipants.length}
                  </span>
                  <h4
                    className={`mt-2 ${
                      isVarsity
                        ? 'font-headline font-bold text-sm sm:text-base text-[#1c1c18]'
                        : 'font-bold text-sm sm:text-base text-[#0f172a]'
                    }`}
                  >
                    Participants
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                    Talented individuals
                  </p>
                </div>

                {/* 3. Teams */}
                <div
                  className={`flex flex-col items-center ${
                    isVarsity
                      ? 'p-5 bg-white border-2 border-[#1c1c18] shadow-[4px_4px_0px_#782f40] rounded-none'
                      : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center mb-3 ${
                      isVarsity
                        ? 'w-12 h-12 bg-[#fdf9f3] border-2 border-[#1c1c18] text-[#a47e3b] rounded-none shadow-[2px_2px_0px_#1c1c18]'
                        : 'w-16 h-16 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[#d97706] shadow-xs group hover:scale-105 transition-transform'
                    }`}
                  >
                    <Award className={`w-6 h-6 sm:w-7 sm:h-7 ${isVarsity ? 'text-[#a47e3b]' : 'text-[#d97706]'}`} />
                  </div>
                  <span
                    className={`block leading-none ${
                      isVarsity
                        ? 'font-anton text-3xl sm:text-4xl text-[#a47e3b]'
                        : 'font-mono font-black text-3xl sm:text-4xl text-[#0f172a]'
                    }`}
                  >
                    {teams.length > 0 ? teams.length : 4}
                  </span>
                  <h4
                    className={`mt-2 ${
                      isVarsity
                        ? 'font-headline font-bold text-sm sm:text-base text-[#1c1c18]'
                        : 'font-bold text-sm sm:text-base text-[#0f172a]'
                    }`}
                  >
                    Teams
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                    Collaborating groups · Competing Houses
                  </p>
                </div>

                {/* 4. Venues */}
                <div
                  className={`flex flex-col items-center ${
                    isVarsity
                      ? 'p-5 bg-white border-2 border-[#1c1c18] shadow-[4px_4px_0px_#782f40] rounded-none'
                      : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center mb-3 ${
                      isVarsity
                        ? 'w-12 h-12 bg-[#fdf9f3] border-2 border-[#1c1c18] text-[#782f40] rounded-none shadow-[2px_2px_0px_#1c1c18]'
                        : 'w-16 h-16 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#10b981] shadow-xs group hover:scale-105 transition-transform'
                    }`}
                  >
                    <MapPin className={`w-6 h-6 sm:w-7 sm:h-7 ${isVarsity ? 'text-[#782f40]' : 'text-[#10b981]'}`} />
                  </div>
                  <span
                    className={`block leading-none ${
                      isVarsity
                        ? 'font-anton text-3xl sm:text-4xl text-[#782f40]'
                        : 'font-mono font-black text-3xl sm:text-4xl text-[#0f172a]'
                    }`}
                  >
                    {publishedResults.length > 0 ? publishedResults.length : 6}
                  </span>
                  <h4
                    className={`mt-2 ${
                      isVarsity
                        ? 'font-headline font-bold text-sm sm:text-base text-[#1c1c18]'
                        : 'font-bold text-sm sm:text-base text-[#0f172a]'
                    }`}
                  >
                    Venues
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                    Event locations · Ratified Results
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* C. ABOUT {FESTNAME} SECTION                                      */}
          {/* ================================================================ */}
          <section
            className={`py-10 sm:py-16 w-full max-w-full ${
              isVarsity ? 'bg-[#fdf9f3] border-b-2 border-[#1c1c18]' : 'bg-[#faf8ff] border-b border-[#e2e8f0]'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              {/* Centered Heading */}
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
                <h3
                  className={`text-2xl sm:text-4xl font-bold tracking-tight break-words ${
                    isVarsity ? 'font-headline text-[#1c1c18]' : 'font-display font-extrabold text-[#0f172a]'
                  }`}
                >
                  About{' '}
                  <span
                    className={
                      isVarsity
                        ? 'text-[#782f40]'
                        : 'bg-gradient-to-r from-[#00685f] via-[#0d9488] to-[#006398] bg-clip-text text-transparent'
                    }
                  >
                    {festName}
                  </span>
                </h3>
                <div
                  className={`mx-auto mt-2.5 ${
                    isVarsity ? 'w-24 h-1 bg-[#a47e3b] rounded-none' : 'w-20 h-1 bg-gradient-to-r from-[#00685f] to-[#006398] rounded-full'
                  }`}
                />
                <p className={`text-xs sm:text-sm mt-2 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b] font-medium'}`}>
                  Festival overview
                </p>
              </div>

              {/* 2-Column Split: Our Vision vs Festival Image */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Column: Our Vision & Highlights */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-1.5 h-6 ${isVarsity ? 'bg-[#782f40] rounded-none' : 'bg-[#0d9488] rounded-full'}`} />
                      <h4 className={`text-xl font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'font-display text-[#0f172a]'}`}>
                        Our Vision
                      </h4>
                    </div>
                    <p className={`text-sm leading-relaxed ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#334155]'}`}>
                      Welcome to our festival platform. {fest?.description || pageData.hero.description || 'Welcome to our premier inter-collegiate arts and cultural championship. Designed to celebrate competitive spirit, creative expression, and authentic teamwork with real-time scoring and clash-free coordination.'}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div
                      className={`p-4 ${
                        isVarsity
                          ? 'vh-card rounded-none border-2 border-[#1c1c18]'
                          : 'rounded-2xl bg-white border border-[#e2e8f0] shadow-xs'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center mb-2 ${
                          isVarsity
                            ? 'bg-[#f7f3ed] text-[#782f40] border border-[#1c1c18] rounded-none'
                            : 'rounded-xl bg-[#f0fdfa] text-[#0d9488] border border-[#ccfbf1]'
                        }`}
                      >
                        <Trophy className="w-4 h-4" />
                      </div>
                      <h5 className={`text-xs font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>40+ Events</h5>
                      <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>Stage & literary arts</p>
                    </div>

                    <div
                      className={`p-4 ${
                        isVarsity
                          ? 'vh-card rounded-none border-2 border-[#1c1c18]'
                          : 'rounded-2xl bg-white border border-[#e2e8f0] shadow-xs'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center mb-2 ${
                          isVarsity
                            ? 'bg-[#f7f3ed] text-[#1b365d] border border-[#1c1c18] rounded-none'
                            : 'rounded-xl bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <h5 className={`text-xs font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>Live Scoring</h5>
                      <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>Transparent tallies</p>
                    </div>

                    <div
                      className={`p-4 ${
                        isVarsity
                          ? 'vh-card rounded-none border-2 border-[#1c1c18]'
                          : 'rounded-2xl bg-white border border-[#e2e8f0] shadow-xs'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center mb-2 ${
                          isVarsity
                            ? 'bg-[#f7f3ed] text-[#a47e3b] border border-[#1c1c18] rounded-none'
                            : 'rounded-xl bg-[#f0fdf4] text-[#10b981] border border-[#bbf7d0]'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                      </div>
                      <h5 className={`text-xs font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>Honors</h5>
                      <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>Medals & certs</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Festival Image Showcase or Model Placeholder */}
                <div>
                  {mainFeaturedPhotos.length > 0 ? (
                    <div
                      onClick={() => setSelectedPhoto(mainFeaturedPhotos[0])}
                      className={`group cursor-pointer overflow-hidden bg-white relative aspect-16/10 ${
                        isVarsity
                          ? 'border-2 border-[#1c1c18] shadow-[6px_6px_0px_#782f40] rounded-none'
                          : 'rounded-3xl border border-[#e2e8f0] shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:border-[#99f6e4] transition-all'
                      }`}
                    >
                      <img
                        src={mainFeaturedPhotos[0].url}
                        alt={mainFeaturedPhotos[0].caption || 'Festival showcase'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                        <div>
                          <h5 className={`text-white font-bold text-sm ${isVarsity ? 'font-headline' : ''}`}>{mainFeaturedPhotos[0].caption}</h5>
                          {mainFeaturedPhotos[0].description && (
                            <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{mainFeaturedPhotos[0].description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-8 sm:p-12 flex flex-col items-center justify-center text-center aspect-16/10 ${
                        isVarsity
                          ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[4px_4px_0px_#782f40] rounded-none'
                          : 'bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-3xl'
                      }`}
                    >
                      <div
                        className={`w-16 h-16 flex items-center justify-center mb-3 ${
                          isVarsity
                            ? 'bg-[#f7f3ed] border-2 border-[#1c1c18] text-[#782f40] rounded-none shadow-[2px_2px_0px_#1c1c18]'
                            : 'rounded-2xl bg-white border border-[#e2e8f0] text-[#0d9488] shadow-xs'
                        }`}
                      >
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <h5 className={`text-sm font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>Festival Image</h5>
                      <p className={`text-[11px] mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>Image placeholder for festival showcase</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* D. CHAMPIONSHIP STANDINGS (3D PODIUM) & CAMPUS GATEWAYS          */}
          {/* ================================================================ */}
          <section className="py-8 sm:py-12 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 sm:space-y-8 w-full max-w-full">
            
            {/* Bento Row 1: Official Portals Gateway & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
              {/* Official Festival Brief Card */}
              <div
                className={`lg:col-span-2 p-4 sm:p-8 flex flex-col justify-between ${
                  isVarsity
                    ? 'vh-card rounded-none border-2 border-[#1c1c18] shadow-[4px_4px_0px_#1b365d]'
                    : 'bg-white rounded-3xl border border-[#e2e8f0] shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        isVarsity
                          ? 'vh-pennant-burgundy rounded-none'
                          : 'rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]'
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#ffdeab]' : 'text-[#0d9488]'}`} />
                      <span>Official Festival Portal</span>
                    </span>
                    <span className={`text-xs font-semibold ${isVarsity ? 'font-anton text-[#1b365d]' : 'text-[#64748b]'}`}>
                      {fest?.edition || settings.festEdition || '2026 Edition'}
                    </span>
                  </div>

                  <h3
                    className={`text-xl sm:text-3xl font-bold tracking-tight leading-tight break-words ${
                      isVarsity ? 'font-headline text-[#1c1c18]' : 'font-display font-extrabold text-[#0f172a]'
                    }`}
                  >
                    {pageData.content.welcomeTitle || `Welcome to ${festName}`}
                  </h3>
                  
                  <p className={`text-xs sm:text-sm mt-2.5 leading-relaxed ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#334155]'}`}>
                    {pageData.content.welcomeMessage || fest?.description || 'Join thousands of delegates, participants, and spectators across multiple stages and auditoriums in this premier inter-collegiate cultural and arts summit.'}
                  </p>
                </div>

                <div className={`mt-6 pt-5 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#534345]' : 'border-[#e2e8f0] text-[#64748b]'}`}>
                  <span>Accredited Collegiate Championship</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className={isVarsity ? 'vh-btn-brass px-3 py-1 text-xs' : 'font-bold text-[#0d9488] hover:text-[#0f766e] cursor-pointer'}
                  >
                    View Timetable →
                  </button>
                </div>
              </div>

              {/* Bento Card 2: Official Portals Gateway */}
              <div
                className={`p-4 sm:p-7 flex flex-col justify-between text-white ${
                  isVarsity
                    ? 'bg-[#1b365d] border-2 border-[#1c1c18] shadow-[6px_6px_0px_#782f40] rounded-none'
                    : 'bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] rounded-3xl shadow-xl border border-teal-700/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isVarsity
                          ? 'vh-pennant bg-[#a47e3b] text-white'
                          : 'text-[#89f5e7] bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-full'
                      }`}
                    >
                      Portals
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#6ffbbe]">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                      <span>Access Open</span>
                    </span>
                  </div>

                  <h4 className={`text-lg font-bold text-white tracking-tight ${isVarsity ? 'font-headline' : ''}`}>
                    Participant & Leader Portals
                  </h4>
                  <p className={`text-xs mt-1.5 leading-relaxed ${isVarsity ? 'font-body-serif text-slate-200' : 'text-teal-100/80'}`}>
                    Access your live scores, view registered stage entries, or manage house contestant rosters.
                  </p>

                  <div className="space-y-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => openAuth('participant', 'signin')}
                      className={`w-full flex items-center justify-between p-3 transition-all text-xs font-semibold text-white group cursor-pointer ${
                        isVarsity
                          ? 'bg-white/10 hover:bg-white/20 border border-white/20 rounded-none'
                          : 'rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 flex items-center justify-center ${isVarsity ? 'bg-white/15 text-[#ffdeab] rounded-none' : 'rounded-xl bg-white/15 text-[#89f5e7]'}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className={`text-xs font-bold text-white ${isVarsity ? 'font-headline' : ''}`}>Participant Dashboard</div>
                          <div className="text-[10px] text-teal-100/70">View chest # and events</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-200/70 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openAuth('team_leader', 'signin')}
                      className={`w-full flex items-center justify-between p-3 transition-all text-xs font-semibold text-white group cursor-pointer ${
                        isVarsity
                          ? 'bg-white/10 hover:bg-white/20 border border-white/20 rounded-none'
                          : 'rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 flex items-center justify-center ${isVarsity ? 'bg-white/15 text-[#ffdeab] rounded-none' : 'rounded-xl bg-white/15 text-[#6ffbbe]'}`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className={`text-xs font-bold text-white ${isVarsity ? 'font-headline' : ''}`}>Team Leader Portal</div>
                          <div className="text-[10px] text-teal-100/70">Manage house contestants</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-200/70 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Fast registration CTA */}
                <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
                  <span className={`text-[11px] ${isVarsity ? 'font-body-serif text-slate-200' : 'text-teal-100/80'}`}>New participant?</span>
                  <button
                    type="button"
                    onClick={() => openAuth('participant', 'register')}
                    className={
                      isVarsity
                        ? 'vh-btn-brass px-4 py-1.5 text-xs'
                        : 'px-4 py-1.5 rounded-full bg-[#89f5e7] hover:bg-[#6bd8cb] text-[#00201d] font-bold text-xs transition-colors shadow-md cursor-pointer'
                    }
                  >
                    Register Now →
                  </button>
                </div>
              </div>
            </div>

            {/* Bento Row 2: 3D Stepped Championship Podium */}
            <div
              className={`p-4 sm:p-8 space-y-6 w-full max-w-full ${
                isVarsity
                  ? 'vh-card rounded-none border-2 border-[#1c1c18] shadow-[6px_6px_0px_#782f40]'
                  : 'bg-white border border-[#e2e8f0] rounded-3xl shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isVarsity
                          ? 'vh-pennant-burgundy'
                          : 'text-[#0f766e] bg-[#f0fdfa] border border-[#99f6e4] px-3 py-0.5 rounded-full'
                      }`}
                    >
                      Live Championship Spotlight
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  </div>
                  <h4
                    className={`text-xl sm:text-2xl font-bold tracking-tight mt-1.5 ${
                      isVarsity ? 'font-headline text-[#1c1c18]' : 'font-display font-extrabold text-[#0f172a]'
                    }`}
                  >
                    3D Stepped Championship Podium
                  </h4>
                  <p className={`text-xs sm:text-sm mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                    Real-time ratified scores from stage competitions and house performances.
                  </p>
                </div>

                {/* Switcher: Top Teams vs Top Students */}
                <div
                  className={`flex items-center gap-1.5 p-1 self-start sm:self-auto max-w-full overflow-x-auto scrollbar-none shrink-0 ${
                    isVarsity
                      ? 'bg-[#f7f3ed] border-2 border-[#1c1c18] rounded-none'
                      : 'bg-[#f0fdfa] rounded-full border border-[#ccfbf1] shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOverviewLeaderboardToggle('team')}
                    className={
                      isVarsity
                        ? `px-3.5 py-1.5 text-xs font-anton tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap rounded-none ${
                            overviewLeaderboardToggle === 'team'
                              ? 'bg-[#782f40] text-white shadow-xs'
                              : 'text-[#1c1c18] hover:text-[#782f40]'
                          }`
                        : `px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            overviewLeaderboardToggle === 'team'
                              ? 'bg-[#0d9488] text-white shadow-xs'
                              : 'text-[#0f766e] hover:text-[#0d9488]'
                          }`
                    }
                  >
                    House Championship
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewLeaderboardToggle('individual')}
                    className={
                      isVarsity
                        ? `px-3.5 py-1.5 text-xs font-anton tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap rounded-none ${
                            overviewLeaderboardToggle === 'individual'
                              ? 'bg-[#782f40] text-white shadow-xs'
                              : 'text-[#1c1c18] hover:text-[#782f40]'
                          }`
                        : `px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            overviewLeaderboardToggle === 'individual'
                              ? 'bg-[#0d9488] text-white shadow-xs'
                              : 'text-[#0f766e] hover:text-[#0d9488]'
                          }`
                    }
                  >
                    Star Contestants
                  </button>
                </div>
              </div>

              {/* Stepped 3D Podium Visualization */}
              {overviewLeaderboardToggle === 'team' ? (
                <div>
                  {leaderboard.length === 0 ? (
                    <div className={`p-8 text-center text-xs border ${isVarsity ? 'bg-[#ffffff] border-2 border-[#1c1c18] text-[#534345] font-body-serif rounded-none' : 'bg-white rounded-2xl border-[#e2e8f0] text-[#64748b]'}`}>
                      Championship house standings will appear once competitive events are ratified.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-end pt-4">
                      {/* Step 2: Silver / 2nd Place (Left) */}
                      {leaderboard[1] && (
                        <div
                          className={`order-2 md:order-1 p-4 sm:p-5 md:pt-7 md:pb-6 flex flex-col justify-between relative min-h-[220px] ${
                            isVarsity
                              ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[4px_4px_0px_#1b365d] rounded-none'
                              : 'bg-white border-2 border-[#e2e8f0] rounded-3xl shadow-[0_4px_14px_rgba(15,23,42,0.05)]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`text-xs font-black px-3 py-1 flex items-center gap-1.5 ${
                                  isVarsity
                                    ? 'bg-[#f1ede7] text-[#1c1c18] border border-[#1c1c18] rounded-none font-anton'
                                    : 'bg-[#f1f5f9] text-[#334155] rounded-full border border-[#e2e8f0]'
                                }`}
                              >
                                <Medal className="w-3.5 h-3.5 text-slate-700" />
                                <span>2nd Place</span>
                              </span>
                              <span className={`text-xl ${isVarsity ? 'font-anton text-[#1b365d]' : 'font-mono font-black text-[#0f172a]'}`}>
                                {leaderboard[1].totalPoints} pts
                              </span>
                            </div>
                            <h5 className={`text-base font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'font-black text-[#0f172a]'}`}>{leaderboard[1].team.name}</h5>
                            <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{leaderboard[1].team.institution || 'Collegiate House'}</p>
                          </div>
                          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#1c1c18]' : 'border-[#e2e8f0] font-medium text-[#334155]'}`}>
                            <span>🥇 {leaderboard[1].firstPlaceCount} Gold</span>
                            <span>🥈 {leaderboard[1].secondPlaceCount} Silver</span>
                            <span>🥉 {leaderboard[1].thirdPlaceCount} Bronze</span>
                          </div>
                        </div>
                      )}

                      {/* Step 1: Gold / 1st Place Champion (Center - Elevated) */}
                      {leaderboard[0] && (
                        <div
                          className={`order-1 md:order-2 p-5 sm:p-6 md:pt-9 md:pb-7 flex flex-col justify-between relative md:-translate-y-3 z-10 min-h-[250px] ${
                            isVarsity
                              ? 'bg-[#fdf9f3] border-3 border-[#782f40] shadow-[6px_6px_0px_#a47e3b] rounded-none'
                              : 'bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl shadow-[0_12px_30px_rgba(13,148,136,0.15)] ring-2 md:ring-4 ring-[#0d9488]/20'
                          }`}
                        >
                          <div
                            className={`absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap ${
                              isVarsity
                                ? 'vh-pennant-burgundy px-4 py-1 font-anton text-[11px] shadow-sm'
                                : 'bg-[#0d9488] text-white font-black text-[11px] px-4 py-1 rounded-full shadow-md'
                            }`}
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                            <span>Championship Leader</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-3 mt-1">
                              <span
                                className={`text-xs font-black px-3.5 py-1.5 flex items-center gap-1.5 ${
                                  isVarsity
                                    ? 'bg-[#a47e3b] text-white rounded-none font-anton'
                                    : 'bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] rounded-full shadow-xs'
                                }`}
                              >
                                <Trophy className={`w-4 h-4 ${isVarsity ? 'text-amber-200' : 'text-[#0d9488]'}`} />
                                <span>1st Place</span>
                              </span>
                              <span className={`text-2xl ${isVarsity ? 'font-anton text-[#782f40]' : 'font-mono font-black text-[#0f172a]'}`}>
                                {leaderboard[0].totalPoints} pts
                              </span>
                            </div>
                            <h5 className={`text-lg font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'font-black text-[#0f172a]'}`}>{leaderboard[0].team.name}</h5>
                            <p className={`text-xs font-medium mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{leaderboard[0].team.institution || 'Collegiate House'}</p>
                          </div>
                          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold ${isVarsity ? 'border-[#782f40]/20 text-[#782f40] font-body-serif' : 'border-[#ccfbf1] text-[#0f766e]'}`}>
                            <span>🥇 {leaderboard[0].firstPlaceCount} Gold</span>
                            <span>🥈 {leaderboard[0].secondPlaceCount} Silver</span>
                            <span>🥉 {leaderboard[0].thirdPlaceCount} Bronze</span>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Bronze / 3rd Place (Right) */}
                      {leaderboard[2] && (
                        <div
                          className={`order-3 md:order-3 p-5 md:pt-6 md:pb-5 flex flex-col justify-between relative min-h-[200px] ${
                            isVarsity
                              ? 'bg-[#ffffff] border-2 border-[#1c1c18] shadow-[4px_4px_0px_#a47e3b] rounded-none'
                              : 'bg-white border-2 border-amber-200 rounded-3xl shadow-[0_4px_14px_rgba(15,23,42,0.04)]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`text-xs font-black px-3 py-1 flex items-center gap-1.5 ${
                                  isVarsity
                                    ? 'bg-[#f7f3ed] text-[#a47e3b] border border-[#1c1c18] rounded-none font-anton'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200 rounded-full shadow-2xs'
                                }`}
                              >
                                <Medal className="w-3.5 h-3.5 text-amber-800" />
                                <span>3rd Place</span>
                              </span>
                              <span className={`text-xl ${isVarsity ? 'font-anton text-[#a47e3b]' : 'font-mono font-black text-[#0f172a]'}`}>
                                {leaderboard[2].totalPoints} pts
                              </span>
                            </div>
                            <h5 className={`text-base font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'font-black text-[#0f172a]'}`}>{leaderboard[2].team.name}</h5>
                            <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{leaderboard[2].team.institution || 'Collegiate House'}</p>
                          </div>
                          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#1c1c18]' : 'border-[#e2e8f0] font-medium text-[#334155]'}`}>
                            <span>🥇 {leaderboard[2].firstPlaceCount} Gold</span>
                            <span>🥈 {leaderboard[2].secondPlaceCount} Silver</span>
                            <span>🥉 {leaderboard[2].thirdPlaceCount} Bronze</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {topIndividualContestants.length === 0 ? (
                    <div className={`p-8 text-center text-xs ${isVarsity ? 'vh-card font-body-serif text-[#534345]' : 'bg-white rounded-2xl border border-[#e2e8f0] text-[#64748b]'}`}>
                      Individual student standings will appear once competitive events are concluded.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-end pt-4">
                      {/* Step 2: Silver Contestant (Left) */}
                      {topIndividualContestants[1] && (
                        <div
                          onClick={() => {
                            setSelectedStudentForModal(topIndividualContestants[1].participant);
                            setActiveTabSection('student_search');
                          }}
                          className={`order-2 md:order-1 ${
                            isVarsity
                              ? 'vh-card rounded-none p-4 sm:p-5 md:pt-7 md:pb-6 flex flex-col justify-between relative min-h-[220px] cursor-pointer'
                              : 'bg-white border-2 border-[#e2e8f0] rounded-3xl p-4 sm:p-5 md:pt-7 md:pb-6 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.05)] relative min-h-[220px] cursor-pointer hover:border-[#99f6e4] transition-all'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className={isVarsity ? 'font-anton text-xs bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] px-3 py-1 uppercase tracking-wider' : 'font-mono font-bold text-xs bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-3 py-1 rounded-full'}>
                                Chest #{topIndividualContestants[1].participant.chestNumber || topIndividualContestants[1].participant.id}
                              </span>
                              <span className={isVarsity ? 'font-anton text-2xl text-[#1c1c18]' : 'font-mono font-black text-xl text-[#0f172a]'}>
                                {topIndividualContestants[1].totalPoints} pts
                              </span>
                            </div>
                            <h5 className={isVarsity ? 'font-headline font-bold text-base text-[#1c1c18]' : 'font-black text-base text-[#0f172a]'}>{topIndividualContestants[1].participant.name}</h5>
                            <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                              {topIndividualContestants[1].team?.name || 'Independent'} • {topIndividualContestants[1].category}
                            </p>
                          </div>
                          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#1c1c18]' : 'border-[#e2e8f0] font-medium text-[#334155]'}`}>
                            <span>🥇 {topIndividualContestants[1].firstPlaceCount} 1st</span>
                            <span>🥈 {topIndividualContestants[1].secondPlaceCount} 2nd</span>
                            <span>🥉 {topIndividualContestants[1].thirdPlaceCount} 3rd</span>
                          </div>
                        </div>
                      )}

                      {/* Step 1: Gold / Top Contestant (Center - Elevated) */}
                      {topIndividualContestants[0] && (
                        <div
                          onClick={() => {
                            setSelectedStudentForModal(topIndividualContestants[0].participant);
                            setActiveTabSection('student_search');
                          }}
                          className={`order-1 md:order-2 ${
                            isVarsity
                              ? 'bg-[#fdf9f3] border-2 border-[#782f40] p-5 sm:p-6 md:pt-9 md:pb-7 flex flex-col justify-between shadow-[6px_6px_0px_#782f40] relative md:-translate-y-3 z-10 min-h-[250px] cursor-pointer'
                              : 'bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl p-5 sm:p-6 md:pt-9 md:pb-7 flex flex-col justify-between shadow-[0_12px_30px_rgba(13,148,136,0.15)] relative ring-2 md:ring-4 ring-[#0d9488]/20 md:-translate-y-3 z-10 min-h-[250px] cursor-pointer hover:border-[#0f766e] transition-all'
                          }`}
                        >
                          {isVarsity ? (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 vh-pennant-burgundy px-4 py-1 text-[11px] flex items-center gap-1.5 uppercase whitespace-nowrap shadow-sm">
                              <Crown className="w-3.5 h-3.5 text-[#dbb067] fill-[#dbb067]" />
                              <span>Golden Performer</span>
                            </div>
                          ) : (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white font-black text-[11px] px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap">
                              <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                              <span>Golden Performer</span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between mb-3 mt-1">
                              <span className={isVarsity ? 'font-anton text-xs bg-[#ffd9de] text-[#5b192a] border border-[#782f40] px-3 py-1 uppercase tracking-wider' : 'font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full'}>
                                Chest #{topIndividualContestants[0].participant.chestNumber || topIndividualContestants[0].participant.id}
                              </span>
                              <span className={isVarsity ? 'font-anton text-3xl text-[#5b192a]' : 'font-mono font-black text-2xl text-[#0f172a]'}>
                                {topIndividualContestants[0].totalPoints} pts
                              </span>
                            </div>
                            <h5 className={isVarsity ? 'font-headline font-bold text-lg text-[#1c1c18]' : 'font-black text-lg text-[#0f172a]'}>{topIndividualContestants[0].participant.name}</h5>
                            <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b] font-medium'}`}>
                              {topIndividualContestants[0].team?.name || 'Independent'} • {topIndividualContestants[0].category}
                            </p>
                          </div>
                          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#782f40]/30 font-anton text-[#5b192a]' : 'border-[#ccfbf1] font-bold text-[#0f766e]'}`}>
                            <span>🥇 {topIndividualContestants[0].firstPlaceCount} 1st</span>
                            <span>🥈 {topIndividualContestants[0].secondPlaceCount} 2nd</span>
                            <span>🥉 {topIndividualContestants[0].thirdPlaceCount} 3rd</span>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Bronze Contestant (Right) */}
                      {topIndividualContestants[2] && (
                        <div
                          onClick={() => {
                            setSelectedStudentForModal(topIndividualContestants[2].participant);
                            setActiveTabSection('student_search');
                          }}
                          className={`order-3 md:order-3 ${
                            isVarsity
                              ? 'vh-card rounded-none p-5 md:pt-6 md:pb-5 flex flex-col justify-between relative min-h-[200px] cursor-pointer'
                              : 'bg-white border-2 border-amber-200 rounded-3xl p-5 md:pt-6 md:pb-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.04)] relative min-h-[200px] cursor-pointer hover:border-amber-300 transition-all'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className={isVarsity ? 'font-anton text-xs bg-[#ffdeab] text-[#432d00] border border-[#a47e3b] px-3 py-1 uppercase tracking-wider' : 'font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full'}>
                                Chest #{topIndividualContestants[2].participant.chestNumber || topIndividualContestants[2].participant.id}
                              </span>
                              <span className={isVarsity ? 'font-anton text-2xl text-[#1c1c18]' : 'font-mono font-black text-xl text-[#0f172a]'}>
                                {topIndividualContestants[2].totalPoints} pts
                              </span>
                            </div>
                            <h5 className={isVarsity ? 'font-headline font-bold text-base text-[#1c1c18]' : 'font-black text-base text-[#0f172a]'}>{topIndividualContestants[2].participant.name}</h5>
                            <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                              {topIndividualContestants[2].team?.name || 'Independent'} • {topIndividualContestants[2].category}
                            </p>
                          </div>
                          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#1c1c18]' : 'border-[#e2e8f0] font-medium text-[#334155]'}`}>
                            <span>🥇 {topIndividualContestants[2].firstPlaceCount} 1st</span>
                            <span>🥈 {topIndividualContestants[2].secondPlaceCount} 2nd</span>
                            <span>🥉 {topIndividualContestants[2].thirdPlaceCount} 3rd</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTabSection('leaderboard')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isVarsity
                      ? 'vh-btn-secondary rounded-none uppercase'
                      : 'rounded-full bg-[#f0fdfa] hover:bg-[#ccfbf1] text-[#0d9488] border border-[#ccfbf1]'
                  }`}
                >
                  <span>View Full Championship Leaderboards</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bento Row 3: Upcoming Programme Schedule + Campus Grounds & Stages */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Bento Card 4: Upcoming Schedule Highlights */}
              <div className={`lg:col-span-2 ${isVarsity ? 'vh-card rounded-none p-4 sm:p-7 flex flex-col justify-between' : 'bg-white rounded-3xl border border-[#e2e8f0] p-4 sm:p-7 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between'}`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className={isVarsity ? 'vh-pennant px-2.5 py-0.5 text-[10px] inline-flex items-center gap-1 uppercase' : 'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0d9488] bg-[#f0fdfa] border border-[#ccfbf1] px-2.5 py-0.5 rounded-full'}>
                        Timetable
                      </span>
                      <h4 className={`text-lg tracking-tight mt-1 ${isVarsity ? 'font-headline font-bold text-[#1c1c18]' : 'font-bold text-[#0f172a] font-display'}`}>
                        Upcoming Programme Schedule
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTabSection('schedule')}
                      className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${isVarsity ? 'font-anton text-[#5b192a] hover:text-[#782f40] tracking-wider uppercase' : 'text-[#0d9488] hover:text-[#0f766e]'}`}
                    >
                      <span>Full Schedule</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {publishedProgrammes.slice(0, 3).map((prg) => (
                      <div
                        key={prg.id}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          isVarsity
                            ? 'vh-ticket-stub rounded-none border border-[#1c1c18]/20 bg-[#f7f3ed] hover:border-[#782f40]'
                            : 'rounded-2xl bg-[#faf8ff] border border-[#e2e8f0] hover:bg-[#f0fdfa] hover:border-[#99f6e4]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className={`truncate ${isVarsity ? 'font-headline font-bold text-xs sm:text-sm text-[#1c1c18]' : 'font-bold text-xs sm:text-sm text-[#0f172a]'}`}>{prg.name}</h5>
                            <span className={isVarsity ? 'font-anton text-[10px] px-2 py-0.5 bg-[#ffd9de] text-[#5b192a] border border-[#782f40] uppercase tracking-wider shrink-0' : 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#e2e8f0] text-[#0f766e] shrink-0'}>
                              {prg.category}
                            </span>
                          </div>
                          <div className={`flex items-center gap-3 text-xs mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                            <span className="flex items-center gap-1">
                              <Clock className={`w-3 h-3 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                              {prg.startTime} - {prg.endTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className={`w-3 h-3 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                              {prg.venue} ({prg.stage})
                            </span>
                          </div>
                        </div>

                        <span className={isVarsity ? 'font-anton text-[11px] px-2.5 py-0.5 bg-[#d6e3ff] text-[#1b365d] border border-[#1b365d] uppercase tracking-wider shrink-0' : 'text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-[#e2e8f0] text-[#0f766e] shrink-0'}>
                          {prg.type === 'individual' ? 'Solo' : 'Group'}
                        </span>
                      </div>
                    ))}
                    {publishedProgrammes.length === 0 && (
                      <p className={`text-xs italic py-6 text-center ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                        Detailed stage schedules are currently being synchronized by the coordinators.
                      </p>
                    )}
                  </div>
                </div>

                <div className={`mt-4 pt-4 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#534345]' : 'border-[#e2e8f0] text-[#64748b]'}`}>
                  <span>Auditoriums, open amphitheatre & main stages</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className={`cursor-pointer ${isVarsity ? 'font-anton text-[#5b192a] hover:text-[#782f40] uppercase tracking-wider' : 'font-bold text-[#0d9488] hover:text-[#0f766e]'}`}
                  >
                    View all stages →
                  </button>
                </div>
              </div>

              {/* Bento Card 5: Festival Campus & Stage Locations */}
              <div className={`${isVarsity ? 'bg-[#1b365d] text-[#fdf9f3] border-2 border-[#1c1c18] rounded-none p-4 sm:p-7 shadow-[6px_6px_0px_#a47e3b] flex flex-col justify-between' : 'bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] text-white rounded-3xl p-4 sm:p-7 shadow-xl border border-teal-700/40 flex flex-col justify-between'}`}>
                <div>
                  <span className={isVarsity ? 'vh-pennant px-2.5 py-0.5 text-[10px] inline-flex items-center gap-1 uppercase' : 'text-[10px] font-bold uppercase tracking-wider text-[#89f5e7] bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-full'}>
                    Festival Grounds
                  </span>
                  
                  <h4 className={`text-lg tracking-tight mt-2.5 ${isVarsity ? 'font-headline font-bold text-[#fdf9f3]' : 'font-bold text-white font-display'}`}>
                    Campus Grounds & Stages
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isVarsity ? 'font-body-serif text-[#fdf9f3]/80' : 'text-teal-100/80'}`}>
                    Official venues, stage distribution, and campus grounds for all accredited festival events.
                  </p>

                  <div className="space-y-2.5 mt-4 text-xs">
                    <div className={`p-3 space-y-1 ${isVarsity ? 'bg-[#142948] border border-[#a47e3b]/40 rounded-none' : 'rounded-2xl bg-white/10 border border-white/15'}`}>
                      <div className={`flex items-center gap-2 font-semibold text-[11px] ${isVarsity ? 'font-anton text-[#ffdeab] uppercase tracking-wider' : 'text-[#89f5e7]'}`}>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Festival Venue</span>
                      </div>
                      <div className={`font-bold text-sm ${isVarsity ? 'font-body-serif text-[#fdf9f3]' : 'text-white'}`}>
                        {fest ? `${fest.venue || ''}${fest.institution ? `, ${fest.institution}` : ''}` : (pageData.content.venueInfo || settings.venue || 'Grand Campus Convention Center')}
                      </div>
                    </div>

                    <div className={`p-3 space-y-1 ${isVarsity ? 'bg-[#142948] border border-[#a47e3b]/40 rounded-none' : 'rounded-2xl bg-white/10 border border-white/15'}`}>
                      <div className={`flex items-center gap-2 font-semibold text-[11px] ${isVarsity ? 'font-anton text-[#ffdeab] uppercase tracking-wider' : 'text-[#89f5e7]'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Festival Dates</span>
                      </div>
                      <div className={`font-bold ${isVarsity ? 'font-body-serif text-[#fdf9f3]' : 'text-white'}`}>
                        {fest?.startDate || settings.startDate} to {fest?.endDate || settings.endDate}
                      </div>
                    </div>

                    <div className={`p-3 space-y-1 ${isVarsity ? 'bg-[#142948] border border-[#a47e3b]/40 rounded-none' : 'rounded-2xl bg-white/10 border border-white/15'}`}>
                      <div className={`flex items-center gap-2 font-semibold text-[11px] ${isVarsity ? 'font-anton text-[#ffdeab] uppercase tracking-wider' : 'text-[#89f5e7]'}`}>
                        <Layers className="w-3.5 h-3.5" />
                        <span>Official Stages</span>
                      </div>
                      <div className={`text-xs ${isVarsity ? 'font-body-serif text-[#fdf9f3]/80' : 'text-teal-100/80'}`}>
                        Main Stage, Open Amphitheatre, Cultural Hall & Seminar Stage
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`mt-5 pt-4 border-t flex items-center justify-between text-[11px] ${isVarsity ? 'border-[#a47e3b]/30 font-body-serif text-[#fdf9f3]/80' : 'border-white/15 text-teal-100/80'}`}>
                  <span>Entry open to contestants & delegates</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className={`cursor-pointer ${isVarsity ? 'font-anton text-[#ffdeab] hover:text-[#ffffff] uppercase tracking-wider' : 'text-[#89f5e7] hover:text-white font-bold'}`}
                  >
                    View Schedule →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* E. "GET IN TOUCH" CONTACT DESK (MATCHING REFERENCE MODEL)        */}
          {/* ================================================================ */}
          <section id="contact" className="py-16 max-w-3xl mx-auto px-4 sm:px-8">
            <div className="text-center mb-8">
              <h3 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
                Get in Touch
              </h3>
              <div className={`w-16 h-1 mx-auto mt-2.5 ${isVarsity ? 'bg-[#a47e3b] rounded-none' : 'bg-gradient-to-r from-[#00685f] to-[#006398] rounded-full'}`}></div>
              <p className={`text-xs sm:text-sm mt-2 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                Have questions? Want to collaborate? We'd love to hear from you!
              </p>
            </div>

            <div className={isVarsity ? 'vh-card rounded-none p-6 sm:p-8' : 'bg-white rounded-3xl border border-[#e2e8f0] p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]'}>
              <div className="flex items-center gap-2 mb-5">
                <span className={`w-1.5 h-5 ${isVarsity ? 'bg-[#782f40] rounded-none' : 'bg-[#0d9488] rounded-full'}`}></span>
                <h4 className={`font-bold text-base ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>Send us a Message</h4>
              </div>

              {contactSent && (
                <div className={`mb-4 p-4 text-xs font-semibold flex items-center gap-2 ${isVarsity ? 'bg-[#ffd9de] border-2 border-[#782f40] text-[#5b192a] font-body-serif rounded-none' : 'rounded-2xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                  <span>Thank you! Your message has been sent to the festival convenors.</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ml-1 ${isVarsity ? 'font-anton uppercase tracking-wider text-[#1c1c18]' : 'text-slate-700'}`}>Your Name</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Enter your full name"
                      className={`w-full pl-11 pr-4 py-3 text-xs sm:text-sm transition-all ${isVarsity ? 'bg-[#fdf9f3] rounded-none border-2 border-[#1c1c18] focus:border-[#782f40] focus:bg-[#ffffff] focus:outline-none font-body-serif text-[#1c1c18]' : 'bg-[#faf8ff] rounded-2xl border border-[#e2e8f0] focus:border-[#0d9488] focus:bg-white focus:outline-none'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ml-1 ${isVarsity ? 'font-anton uppercase tracking-wider text-[#1c1c18]' : 'text-slate-700'}`}>Email Address</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className={`w-full pl-11 pr-4 py-3 text-xs sm:text-sm transition-all ${isVarsity ? 'bg-[#fdf9f3] rounded-none border-2 border-[#1c1c18] focus:border-[#782f40] focus:bg-[#ffffff] focus:outline-none font-body-serif text-[#1c1c18]' : 'bg-[#faf8ff] rounded-2xl border border-[#e2e8f0] focus:border-[#0d9488] focus:bg-white focus:outline-none'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ml-1 ${isVarsity ? 'font-anton uppercase tracking-wider text-[#1c1c18]' : 'text-slate-700'}`}>Your Message</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Tell us how we can help you..."
                      className={`w-full pl-11 pr-4 py-3 text-xs sm:text-sm transition-all resize-none ${isVarsity ? 'bg-[#fdf9f3] rounded-none border-2 border-[#1c1c18] focus:border-[#782f40] focus:bg-[#ffffff] focus:outline-none font-body-serif text-[#1c1c18]' : 'bg-[#faf8ff] rounded-2xl border border-[#e2e8f0] focus:border-[#0d9488] focus:bg-white focus:outline-none'}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3.5 px-6 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isVarsity
                      ? 'vh-btn-primary rounded-none uppercase'
                      : 'rounded-full bg-gradient-to-r from-[#00685f] to-[#006398] hover:from-[#0f766e] hover:to-[#0284c7] text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>
          </section>
        </>
      )}

      {/* ==================================================================== */}
      {/* 4B. OFFICIAL LEADERBOARD TAB (TEAM & INDIVIDUAL)                     */}
      {/* ==================================================================== */}
      {activeTabSection === 'leaderboard' && (
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
            <div>
              <span className={isVarsity ? 'vh-pennant uppercase' : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider'}>
                Championship Standings
              </span>
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
                Official Festival Leaderboards
              </h3>
              <p className={`text-xs sm:text-sm mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                Real-time verified standings for competing houses and top individual student performers.
              </p>
            </div>

            {/* Main Leaderboard Switcher: Team vs Individual */}
            <div className={`flex items-center gap-1.5 p-1 self-start sm:self-auto max-w-full overflow-x-auto scrollbar-none shrink-0 ${
              isVarsity ? 'bg-[#f7f3ed] border-2 border-[#1c1c18] rounded-none' : 'bg-[#f0fdfa] rounded-full border border-[#ccfbf1] shadow-2xs'
            }`}>
              <button
                type="button"
                onClick={() => setLeaderboardType('team')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isVarsity
                    ? leaderboardType === 'team'
                      ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                      : 'text-[#5b192a] hover:bg-[#ffd9de]/50 font-anton uppercase tracking-wider rounded-none'
                    : leaderboardType === 'team'
                    ? 'bg-[#0d9488] text-white shadow-xs rounded-full'
                    : 'text-[#0f766e] hover:text-[#0d9488] rounded-full'
                }`}
              >
                <Trophy className={`w-4 h-4 ${isVarsity ? 'text-[#ffdeab]' : 'text-amber-300'}`} />
                <span>Team Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardType('individual')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isVarsity
                    ? leaderboardType === 'individual'
                      ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                      : 'text-[#5b192a] hover:bg-[#ffd9de]/50 font-anton uppercase tracking-wider rounded-none'
                    : leaderboardType === 'individual'
                    ? 'bg-[#0d9488] text-white shadow-xs rounded-full'
                    : 'text-[#0f766e] hover:text-[#0d9488] rounded-full'
                }`}
              >
                <Award className={`w-4 h-4 ${isVarsity ? 'text-[#ffdeab]' : 'text-teal-200'}`} />
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
                  <div className={`order-2 md:order-1 ${isVarsity ? 'vh-card rounded-none p-5 flex flex-col justify-between' : 'bg-white border border-[#e2e8f0] rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.05)]'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={isVarsity ? 'font-anton text-xs bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] px-3 py-1 uppercase tracking-wider' : 'text-xs font-black bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-3 py-1 rounded-full'}>
                          🥈 2nd Place
                        </span>
                        <span className={isVarsity ? 'font-anton text-2xl text-[#1c1c18]' : 'font-mono font-black text-xl text-[#0f172a]'}>
                          {leaderboard[1].totalPoints} pts
                        </span>
                      </div>
                      <h4 className={isVarsity ? 'font-headline font-bold text-lg text-[#1c1c18]' : 'text-lg font-black text-[#0f172a]'}>{leaderboard[1].team.name}</h4>
                      <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{leaderboard[1].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#1c1c18]' : 'border-[#e2e8f0] font-semibold text-[#334155]'}`}>
                      <span>🥇 {leaderboard[1].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[1].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[1].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>

                  {/* 1st Place Champion */}
                  <div className={`order-1 md:order-2 ${
                    isVarsity
                      ? 'bg-[#fdf9f3] border-2 border-[#782f40] rounded-none p-6 flex flex-col justify-between shadow-[6px_6px_0px_#782f40] relative -translate-y-1'
                      : 'bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl p-6 flex flex-col justify-between shadow-[0_12px_30px_rgba(13,148,136,0.15)] relative -translate-y-1 ring-4 ring-[#0d9488]/20'
                  }`}>
                    {isVarsity ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 vh-pennant-burgundy px-3.5 py-0.5 text-[11px] uppercase tracking-wider">
                        Fest Leader
                      </div>
                    ) : (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                        Fest Leader
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className={isVarsity ? 'font-anton text-xs bg-[#ffd9de] text-[#5b192a] border border-[#782f40] px-3 py-1 uppercase tracking-wider flex items-center gap-1' : 'text-xs font-black bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full flex items-center gap-1'}>
                          <Trophy className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                          1st Place Champion
                        </span>
                        <span className={isVarsity ? 'font-anton text-3xl text-[#5b192a]' : 'font-mono font-black text-2xl text-[#0f172a]'}>
                          {leaderboard[0].totalPoints} pts
                        </span>
                      </div>
                      <h4 className={isVarsity ? 'font-headline font-bold text-xl text-[#1c1c18]' : 'text-xl font-black text-[#0f172a]'}>{leaderboard[0].team.name}</h4>
                      <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{leaderboard[0].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#782f40]/30 font-anton text-[#5b192a]' : 'border-[#ccfbf1] font-bold text-[#0f766e]'}`}>
                      <span>🥇 {leaderboard[0].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[0].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[0].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className={`order-3 ${isVarsity ? 'vh-card rounded-none p-5 flex flex-col justify-between' : 'bg-white border border-amber-200 rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.04)]'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={isVarsity ? 'font-anton text-xs bg-[#ffdeab] text-[#432d00] border border-[#a47e3b] px-3 py-1 uppercase tracking-wider' : 'text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full'}>
                          🥉 3rd Place
                        </span>
                        <span className={isVarsity ? 'font-anton text-2xl text-[#1c1c18]' : 'font-mono font-black text-xl text-[#0f172a]'}>
                          {leaderboard[2].totalPoints} pts
                        </span>
                      </div>
                      <h4 className={isVarsity ? 'font-headline font-bold text-lg text-[#1c1c18]' : 'text-lg font-black text-[#0f172a]'}>{leaderboard[2].team.name}</h4>
                      <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{leaderboard[2].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif text-[#1c1c18]' : 'border-[#e2e8f0] font-semibold text-[#334155]'}`}>
                      <span>🥇 {leaderboard[2].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[2].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[2].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Team Leaderboard Table */}
              <div className={isVarsity ? 'bg-[#fdf9f3] border-2 border-[#1c1c18] rounded-none overflow-hidden shadow-[4px_4px_0px_#1c1c18]' : 'bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs'}>
                <div className={`p-4 border-b text-xs flex items-center justify-between ${
                  isVarsity ? 'bg-[#e6e2dc] border-[#1c1c18] text-[#1c1c18]' : 'bg-[#f0fdfa] border-[#ccfbf1] text-[#0f766e]'
                }`}>
                  <span className={`font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>
                    House Championship Standings — Cumulative Points from Individual & Team Programmes
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${isVarsity ? 'text-[#5b192a]' : 'text-[#0f766e]'}`}>Live Ratified</span>
                </div>
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left text-xs min-w-[560px]">
                    <thead>
                      <tr className={`border-b text-[11px] ${
                        isVarsity ? 'border-[#1c1c18] text-[#1c1c18] font-anton uppercase tracking-wider bg-[#f1ede7]' : 'border-[#e2e8f0] text-[#64748b] uppercase tracking-wider bg-[#faf8ff]'
                      }`}>
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">House / Team</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-3 text-center">🥇 Gold</th>
                        <th className="py-3 px-3 text-center">🥈 Silver</th>
                        <th className="py-3 px-3 text-center">🥉 Bronze</th>
                        <th className="py-3 px-4 text-right">Ratified Points</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isVarsity ? 'divide-[#1c1c18]/15 font-body-serif' : 'divide-[#f1f5f9]'}`}>
                      {leaderboard.map((entry) => (
                        <tr key={entry.team.id} className={isVarsity ? 'hover:bg-[#ffd9de]/20 transition-colors' : 'hover:bg-[#f0fdfa]/60 transition-colors'}>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold ${
                                isVarsity
                                  ? entry.rank === 1
                                    ? 'bg-[#ffd9de] text-[#5b192a] border border-[#782f40] rounded-none font-anton'
                                    : entry.rank === 2
                                    ? 'bg-[#d6e3ff] text-[#1b365d] border border-[#1b365d] rounded-none font-anton'
                                    : entry.rank === 3
                                    ? 'bg-[#ffdeab] text-[#432d00] border border-[#a47e3b] rounded-none font-anton'
                                    : 'bg-[#e6e2dc] text-[#1c1c18] rounded-none font-anton'
                                  : entry.rank === 1
                                  ? 'bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] rounded-full'
                                  : entry.rank === 2
                                  ? 'bg-slate-200 text-slate-900 rounded-full'
                                  : entry.rank === 3
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200 rounded-full'
                                  : 'bg-slate-100 text-slate-600 rounded-full'
                              }`}
                            >
                              #{entry.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className={`font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>{entry.team.name}</div>
                            <div className={`text-[10px] ${isVarsity ? 'font-anton text-[#534345]' : 'font-mono text-[#64748b]'}`}>{entry.team.code}</div>
                          </td>
                          <td className={`py-3.5 px-4 ${isVarsity ? 'text-[#534345]' : 'text-[#334155]'}`}>
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
                          <td className={`py-3.5 px-4 text-right font-bold text-base ${isVarsity ? 'font-anton text-[#5b192a]' : 'font-mono text-[#0f172a]'}`}>
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
              <div className={`flex flex-wrap items-center gap-2 pb-2 border-b ${isVarsity ? 'border-[#1c1c18]/20' : 'border-[#e2e8f0]'}`}>
                <span className={`text-xs font-bold mr-1 uppercase tracking-wider ${isVarsity ? 'font-anton text-[#1c1c18]' : 'text-[#64748b]'}`}>Category:</span>
                <button
                  type="button"
                  onClick={() => setLeaderboardCategory('all')}
                  className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isVarsity
                      ? leaderboardCategory === 'all'
                        ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                        : 'bg-[#f7f3ed] text-[#5b192a] border border-[#1c1c18] font-anton uppercase tracking-wider rounded-none hover:bg-[#ffd9de]/40'
                      : leaderboardCategory === 'all'
                      ? 'bg-[#0d9488] text-white shadow-xs rounded-full'
                      : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1] rounded-full'
                  }`}
                >
                  All Categories (Overall Champions)
                </button>
                {festCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setLeaderboardCategory(c.name)}
                    className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isVarsity
                        ? leaderboardCategory.toLowerCase() === c.name.toLowerCase()
                          ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                          : 'bg-[#f7f3ed] text-[#5b192a] border border-[#1c1c18] font-anton uppercase tracking-wider rounded-none hover:bg-[#ffd9de]/40'
                        : leaderboardCategory.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-[#0d9488] text-white shadow-xs rounded-full'
                        : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1] rounded-full'
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
                  <div className={`order-2 md:order-1 ${isVarsity ? 'vh-card rounded-none p-5 flex flex-col justify-between' : 'bg-white border border-[#e2e8f0] rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.05)]'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={isVarsity ? 'font-anton text-xs bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] px-3 py-1 uppercase tracking-wider' : 'text-xs font-black bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-3 py-1 rounded-full'}>
                          🥈 2nd Place
                        </span>
                        <span className={isVarsity ? 'font-anton text-xs bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] px-2.5 py-0.5 uppercase tracking-wider' : 'font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-2.5 py-0.5 rounded-full'}>
                          Chest #{individualLeaderboardData[1].participant.chestNumber || individualLeaderboardData[1].participant.id}
                        </span>
                      </div>
                      <h4 className={isVarsity ? 'font-headline font-bold text-lg text-[#1c1c18]' : 'text-lg font-black text-[#0f172a]'}>{individualLeaderboardData[1].participant.name}</h4>
                      <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                        {individualLeaderboardData[1].team?.name || 'Independent'} • {individualLeaderboardData[1].category}
                      </p>
                    </div>
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif' : 'border-[#e2e8f0]'}`}>
                      <span className={`text-xs ${isVarsity ? 'text-[#534345]' : 'text-[#64748b] font-medium'}`}>
                        🥇 {individualLeaderboardData[1].firstPlaceCount} • 🥈 {individualLeaderboardData[1].secondPlaceCount} • 🥉 {individualLeaderboardData[1].thirdPlaceCount}
                      </span>
                      <span className={`font-bold ${isVarsity ? 'font-anton text-2xl text-[#1c1c18]' : 'font-mono font-black text-lg text-[#0f172a]'}`}>
                        {individualLeaderboardData[1].totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* 1st Place Individual Champion */}
                  <div className={`order-1 md:order-2 ${
                    isVarsity
                      ? 'bg-[#fdf9f3] border-2 border-[#782f40] rounded-none p-6 flex flex-col justify-between shadow-[6px_6px_0px_#782f40] relative -translate-y-1'
                      : 'bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl p-6 flex flex-col justify-between shadow-[0_12px_30px_rgba(13,148,136,0.15)] relative -translate-y-1 ring-4 ring-[#0d9488]/20'
                  }`}>
                    {isVarsity ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 vh-pennant-burgundy px-3.5 py-0.5 text-[11px] uppercase tracking-wider">
                        Category Champion
                      </div>
                    ) : (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                        Category Champion
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className={isVarsity ? 'font-anton text-xs bg-[#ffd9de] text-[#5b192a] border border-[#782f40] px-3 py-1 uppercase tracking-wider flex items-center gap-1' : 'text-xs font-black bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full flex items-center gap-1'}>
                          <Trophy className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                          1st Place Champion
                        </span>
                        <span className={isVarsity ? 'font-anton text-xs bg-[#ffd9de] text-[#5b192a] border border-[#782f40] px-2.5 py-0.5 uppercase tracking-wider' : 'font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-2.5 py-1 rounded-full'}>
                          Chest #{individualLeaderboardData[0].participant.chestNumber || individualLeaderboardData[0].participant.id}
                        </span>
                      </div>
                      <h4 className={isVarsity ? 'font-headline font-bold text-xl text-[#1c1c18]' : 'text-xl font-black text-[#0f172a]'}>{individualLeaderboardData[0].participant.name}</h4>
                      <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                        {individualLeaderboardData[0].team?.name || 'Independent'} • {individualLeaderboardData[0].category}
                      </p>
                    </div>
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isVarsity ? 'border-[#782f40]/30 font-anton text-[#5b192a]' : 'border-[#ccfbf1] text-[#0f766e] font-bold'}`}>
                      <span className="text-xs">
                        🥇 {individualLeaderboardData[0].firstPlaceCount} • 🥈 {individualLeaderboardData[0].secondPlaceCount} • 🥉 {individualLeaderboardData[0].thirdPlaceCount}
                      </span>
                      <span className={isVarsity ? 'font-anton text-3xl text-[#5b192a]' : 'font-mono font-black text-2xl text-[#0f172a]'}>
                        {individualLeaderboardData[0].totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* 3rd Place Individual */}
                  <div className={`order-3 ${isVarsity ? 'vh-card rounded-none p-5 flex flex-col justify-between' : 'bg-white border border-amber-200 rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.04)]'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={isVarsity ? 'font-anton text-xs bg-[#ffdeab] text-[#432d00] border border-[#a47e3b] px-3 py-1 uppercase tracking-wider' : 'text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full'}>
                          🥉 3rd Place
                        </span>
                        <span className={isVarsity ? 'font-anton text-xs bg-[#ffdeab] text-[#432d00] border border-[#a47e3b] px-2.5 py-0.5 uppercase tracking-wider' : 'font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full'}>
                          Chest #{individualLeaderboardData[2].participant.chestNumber || individualLeaderboardData[2].participant.id}
                        </span>
                      </div>
                      <h4 className={isVarsity ? 'font-headline font-bold text-lg text-[#1c1c18]' : 'text-lg font-black text-[#0f172a]'}>{individualLeaderboardData[2].participant.name}</h4>
                      <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                        {individualLeaderboardData[2].team?.name || 'Independent'} • {individualLeaderboardData[2].category}
                      </p>
                    </div>
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isVarsity ? 'border-[#1c1c18]/20 font-body-serif' : 'border-[#e2e8f0]'}`}>
                      <span className={`text-xs ${isVarsity ? 'text-[#534345]' : 'text-[#64748b] font-medium'}`}>
                        🥇 {individualLeaderboardData[2].firstPlaceCount} • 🥈 {individualLeaderboardData[2].secondPlaceCount} • 🥉 {individualLeaderboardData[2].thirdPlaceCount}
                      </span>
                      <span className={`font-bold ${isVarsity ? 'font-anton text-2xl text-[#1c1c18]' : 'font-mono font-black text-lg text-[#0f172a]'}`}>
                        {individualLeaderboardData[2].totalPoints} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Individual Leaderboard Table */}
              <div className={isVarsity ? 'bg-[#fdf9f3] border-2 border-[#1c1c18] rounded-none overflow-hidden shadow-[4px_4px_0px_#1c1c18]' : 'bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs'}>
                <div className={`p-4 border-b text-xs flex items-center justify-between ${
                  isVarsity ? 'bg-[#e6e2dc] border-[#1c1c18] text-[#1c1c18]' : 'bg-[#f0fdfa] border-[#ccfbf1] text-[#0f766e]'
                }`}>
                  <span className={`font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>
                    Individual Contestants Standings — {leaderboardCategory === 'all' ? 'All Categories' : `${leaderboardCategory} Category`}
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${isVarsity ? 'text-[#5b192a]' : 'text-[#0f766e]'}`}>
                    Tie-breaker: Points &gt; 1st &gt; 2nd &gt; Marks
                  </span>
                </div>
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left text-xs min-w-[560px]">
                    <thead>
                      <tr className={`border-b text-[11px] ${
                        isVarsity ? 'border-[#1c1c18] text-[#1c1c18] font-anton uppercase tracking-wider bg-[#f1ede7]' : 'border-[#e2e8f0] text-[#64748b] uppercase tracking-wider bg-[#faf8ff]'
                      }`}>
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
                    <tbody className={`divide-y ${isVarsity ? 'divide-[#1c1c18]/15 font-body-serif' : 'divide-[#f1f5f9]'}`}>
                      {individualLeaderboardData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className={`py-12 text-center ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                            No participants scored yet in this category.
                          </td>
                        </tr>
                      ) : (
                        individualLeaderboardData.map((entry) => (
                          <tr key={entry.participant.id} className={isVarsity ? 'hover:bg-[#ffd9de]/20 transition-colors' : 'hover:bg-[#f0fdfa]/60 transition-colors'}>
                            <td className="py-3.5 px-3 text-center font-mono font-bold">
                              {entry.totalPoints > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''}
                                  #{entry.rank}
                                </span>
                              ) : (
                                <span className={isVarsity ? 'text-[#534345] font-normal' : 'text-[#64748b] font-normal'}>-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className={`font-mono font-bold text-xs px-2.5 py-1 ${
                                isVarsity
                                  ? 'bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] rounded-none font-anton'
                                  : 'bg-[#ccfbf1] text-[#0f766e] rounded-full border border-[#99f6e4] shadow-2xs'
                              }`}>
                                #{entry.participant.chestNumber || entry.participant.id}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className={`font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>{entry.participant.name}</div>
                              <div className={`text-[10px] ${isVarsity ? 'font-anton text-[#534345]' : 'font-mono text-[#64748b]'}`}>ID: {entry.participant.id}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className={`font-semibold ${isVarsity ? 'text-[#1c1c18]' : 'text-[#0f172a]'}`}>{entry.team?.name || 'Independent'}</div>
                              <div className={`text-[10px] ${isVarsity ? 'text-[#534345]' : 'text-[#64748b]'}`}>{entry.team?.institution}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className={`px-2.5 py-0.5 ${
                                isVarsity
                                  ? 'bg-[#ffd9de] text-[#5b192a] border border-[#782f40] rounded-none font-anton text-[10px] uppercase'
                                  : 'rounded-full bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f766e] font-medium'
                              }`}>
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
                            <td className="py-3.5 px-2 text-center font-mono text-[#334155]">
                              {entry.totalMarks}
                            </td>
                            <td className={`py-3.5 px-4 text-right font-bold text-base ${isVarsity ? 'font-anton text-[#5b192a]' : 'font-mono text-[#0f172a]'}`}>
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
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
          <div className="border-b border-[#e2e8f0] pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className={isVarsity ? 'vh-pennant uppercase' : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider'}>
                  Official Student Directory & Live Search
                </span>
                <h3 className={`text-xl sm:text-3xl font-extrabold tracking-tight mt-2 break-words ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
                  Student & Contestant Lookup
                </h3>
                <p className={`text-xs sm:text-sm mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                  Search any student by Chest Number or Name to inspect event schedules, registered programmes, and live points won.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={isVarsity ? 'font-anton text-xs bg-[#e6e2dc] text-[#1c1c18] px-3.5 py-1.5 border border-[#1c1c18] uppercase tracking-wider' : 'text-xs font-bold bg-[#f0fdfa] text-[#0f766e] px-3.5 py-1.5 rounded-full border border-[#ccfbf1]'}>
                  {festParticipants.length} Contestants Enrolled
                </span>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="mt-5 sm:mt-6 max-w-2xl w-full">
              <div className={`relative flex items-center border-2 transition-colors ${
                isVarsity
                  ? 'bg-[#fdf9f3] border-[#1c1c18] rounded-none focus-within:border-[#782f40] shadow-[4px_4px_0px_#1c1c18]'
                  : 'bg-white border-[#e2e8f0] focus-within:border-[#0d9488] focus-within:ring-3 focus-within:ring-[#0d9488]/15 rounded-2xl shadow-xs'
              }`}>
                <div className={`pl-4 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`}>
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by Chest Number (e.g. 104, PT-104) or Student Name..."
                  className={`w-full pl-3 pr-10 py-3 text-base bg-transparent focus:outline-none font-medium ${
                    isVarsity ? 'font-body-serif text-[#1c1c18] placeholder:text-[#534345]' : 'text-[#0f172a] placeholder:text-[#64748b]'
                  }`}
                  autoFocus
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                <div className={`p-16 text-center border-2 space-y-3 ${
                  isVarsity ? 'vh-card rounded-none' : 'border-dashed border-[#e2e8f0] rounded-3xl bg-[#faf8ff]'
                }`}>
                  <div className={`w-12 h-12 flex items-center justify-center mx-auto ${
                    isVarsity ? 'bg-[#ffd9de] text-[#5b192a] border border-[#782f40]' : 'rounded-2xl bg-[#f0fdfa] text-[#0d9488] border border-[#ccfbf1]'
                  }`}>
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className={`text-base font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>
                    No participant found matching "{studentSearchQuery}"
                  </h4>
                  <p className={`text-xs max-w-md mx-auto ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                    Please verify the chest number (e.g. 101, CH-12) or try searching by the participant's full name.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className={`flex items-center justify-between text-xs font-medium ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
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
                        className={isVarsity ? 'vh-card rounded-none p-5 flex flex-col justify-between space-y-4' : 'bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(13,148,136,0.12)] hover:border-[#99f6e4] transition-all flex flex-col justify-between space-y-4'}
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={isVarsity ? 'font-anton text-xs bg-[#ffd9de] text-[#5b192a] border border-[#782f40] px-3 py-1 uppercase tracking-wider' : 'font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full shadow-2xs'}>
                              Chest #{student.chestNumber || student.id}
                            </span>
                            <span className={isVarsity ? 'font-anton text-[11px] px-2.5 py-0.5 bg-[#d6e3ff] text-[#1b365d] border border-[#1b365d] uppercase tracking-wider' : 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1]'}>
                              {student.category}
                            </span>
                          </div>

                          {/* Student Info */}
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                              isVarsity ? 'bg-[#5b192a] text-white font-anton rounded-none' : 'rounded-full bg-[#0d9488] text-white'
                            }`}>
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`font-bold text-base truncate ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>{student.name}</h4>
                              <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#334155]'}`}>
                                House: <strong className={isVarsity ? 'text-[#1c1c18]' : 'text-[#0f172a]'}>{team?.name || 'Team'}</strong>
                              </p>
                              {team?.institution && (
                                <p className={`text-[11px] truncate ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{team.institution}</p>
                              )}
                            </div>
                          </div>

                          {/* Points & Medals Strip */}
                          <div className={`mt-4 p-3 border flex items-center justify-between ${
                            isVarsity ? 'bg-[#f7f3ed] border-[#1c1c18]/20 rounded-none' : 'bg-[#faf8ff] border-[#e2e8f0] rounded-xl'
                          }`}>
                            <div>
                              <span className={`text-[10px] uppercase font-bold tracking-wider block ${isVarsity ? 'font-anton text-[#534345]' : 'text-[#64748b]'}`}>Total Points</span>
                              <span className={`font-black text-base ${isVarsity ? 'font-anton text-xl text-[#5b192a]' : 'font-mono text-[#0f172a]'}`}>
                                {stats.totalPoints} pts
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] uppercase font-bold tracking-wider block ${isVarsity ? 'font-anton text-[#534345]' : 'text-[#64748b]'}`}>Medals Won</span>
                              <span className={`text-xs font-bold ${isVarsity ? 'font-body-serif text-[#1c1c18]' : 'text-[#334155]'}`}>
                                🥇 {stats.goldCount} · 🥈 {stats.silverCount} · 🥉 {stats.bronzeCount}
                              </span>
                            </div>
                          </div>

                          {/* Registered Programmes */}
                          <div className="mt-3.5 space-y-1.5">
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isVarsity ? 'font-anton text-[#534345]' : 'text-[#64748b]'}`}>
                              Events ({studentProgs.length})
                            </span>
                            {studentProgs.length === 0 ? (
                              <p className={`text-xs italic ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>No events assigned yet.</p>
                            ) : (
                              studentProgs.slice(0, 3).map((prg) => {
                                const res = stats.studentResults.find((r) => r.programmeId === prg.id);
                                return (
                                  <div
                                    key={prg.id}
                                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 border ${
                                      isVarsity
                                        ? 'bg-[#f7f3ed] border-[#1c1c18]/20 rounded-none font-body-serif text-[#1c1c18]'
                                        : 'rounded-lg bg-[#faf8ff] border-[#e2e8f0]'
                                    }`}
                                  >
                                    <span className="font-medium truncate max-w-[170px]">
                                      {prg.name}
                                    </span>
                                    {res ? (
                                      <span className={isVarsity ? 'font-anton text-[11px] text-[#5b192a] bg-[#ffd9de] px-2 py-0.5 border border-[#782f40] uppercase' : 'font-mono font-bold text-[11px] text-[#0f766e] bg-[#ccfbf1] px-2 py-0.5 rounded-full border border-[#99f6e4]'}>
                                        Rank #{res.rank} (+{res.pointsAwarded} pts)
                                      </span>
                                    ) : (
                                      <span className={`text-[10px] font-medium ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                                        {prg.venue || 'Scheduled'}
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                            {studentProgs.length > 3 && (
                              <span className={`text-[11px] block pt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                                +{studentProgs.length - 3} more events
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View Card Button */}
                        <div className={`pt-2 border-t ${isVarsity ? 'border-[#1c1c18]/20' : 'border-[#e2e8f0]'}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForModal(student)}
                            className={`w-full py-2 px-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                              isVarsity
                                ? 'vh-btn-secondary rounded-none uppercase'
                                : 'text-[#0f766e] bg-[#f0fdfa] border border-[#ccfbf1] rounded-full hover:bg-[#ccfbf1]'
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
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
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
            <div>
              <h3 className={`text-2xl font-extrabold tracking-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
                Official Photo Gallery
              </h3>
              <p className={`text-xs mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                Admin-curated captures and stage recordings across all festival programs.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isVarsity
                      ? activeCategory === cat
                        ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                        : 'bg-[#f7f3ed] text-[#5b192a] border border-[#1c1c18] font-anton uppercase tracking-wider rounded-none hover:bg-[#ffd9de]/40'
                      : activeCategory === cat
                      ? 'bg-[#0d9488] text-white shadow-xs font-bold rounded-full'
                      : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1] rounded-full'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredGalleryPhotos.length === 0 ? (
            <div className={`p-16 text-center border-2 ${isVarsity ? 'vh-card rounded-none' : 'border-dashed border-[#e2e8f0] rounded-2xl bg-[#faf8ff]'}`}>
              <ImageIcon className={`w-10 h-10 mx-auto mb-2 ${isVarsity ? 'text-[#782f40]/40' : 'text-[#0d9488]/40'}`} />
              <p className={`text-xs font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>No photos in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGalleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className={`group cursor-pointer overflow-hidden transition-all flex flex-col ${
                    isVarsity
                      ? 'vh-card rounded-none hover:border-[#782f40]'
                      : 'rounded-2xl bg-white border border-[#e2e8f0] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(13,148,136,0.12)] hover:border-[#99f6e4]'
                  }`}
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
                  <div className={`p-3 ${isVarsity ? 'bg-[#fdf9f3]' : 'bg-white'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${isVarsity ? 'font-anton text-[#5b192a]' : 'text-[#0d9488]'}`}>
                      {photo.category || 'General'}
                    </span>
                    <h4 className={`text-xs font-bold mt-0.5 truncate transition-colors ${
                      isVarsity ? 'font-headline text-[#1c1c18] group-hover:text-[#782f40]' : 'text-[#0f172a] group-hover:text-[#0d9488]'
                    }`}>
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
      {/* 6. DEDICATED OFFICIAL PUBLISHED RESULTS (GROUPED BY EVENT)           */}
      {/* ==================================================================== */}
      {activeTabSection === 'results' && (
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 w-full max-w-full overflow-hidden">
          {/* Results Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
            <div>
              <div className={isVarsity ? 'vh-pennant uppercase text-xs inline-flex items-center gap-1.5 px-3 py-1 mb-2' : 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d9488]/10 text-[#0d9488] font-bold text-xs uppercase tracking-wider mb-2'}>
                <Trophy className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#ffdeab]' : 'text-[#0d9488]'}`} />
                Live Ratified Standings
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
                Official Published Results
              </h3>
              <p className={`text-xs sm:text-sm mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                Official podium winners and ratified scores consolidated by competition event.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 text-center ${isVarsity ? 'bg-[#f7f3ed] border border-[#1c1c18] rounded-none' : 'bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl'}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isVarsity ? 'font-anton text-[#534345]' : 'text-[#0f766e]'}`}>Events Published</span>
                <span className={`font-black text-lg ${isVarsity ? 'font-anton text-[#1c1c18]' : 'font-mono text-[#0f172a]'}`}>{new Set(publishedResults.map(r => r.programmeId)).size}</span>
              </div>
              <div className={`px-4 py-2 text-center ${isVarsity ? 'bg-[#ffd9de]/30 border border-[#782f40] rounded-none' : 'bg-amber-50/70 border border-amber-200 rounded-2xl'}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isVarsity ? 'font-anton text-[#5b192a]' : 'text-amber-800'}`}>Total Winners</span>
                <span className={`font-black text-lg ${isVarsity ? 'font-anton text-[#5b192a]' : 'font-mono text-amber-900'}`}>{publishedResults.length}</span>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 shadow-xs ${
            isVarsity ? 'vh-card rounded-none' : 'bg-white border border-[#e2e8f0] rounded-2xl'
          }`}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event name, winner, chest number, or team..."
                value={publicResultsSearch}
                onChange={(e) => setPublicResultsSearch(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-transparent border-0 focus:outline-none placeholder:text-slate-400 font-medium ${
                  isVarsity ? 'font-body-serif text-[#1c1c18]' : 'text-[#0f172a]'
                }`}
              />
              {publicResultsSearch && (
                <button
                  type="button"
                  onClick={() => setPublicResultsSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {availableResultCategories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => setPublicResultsFilterCat('all')}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isVarsity
                      ? publicResultsFilterCat === 'all'
                        ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                        : 'bg-[#f7f3ed] text-[#5b192a] border border-[#1c1c18] font-anton uppercase tracking-wider rounded-none hover:bg-[#ffd9de]/40'
                      : publicResultsFilterCat === 'all'
                      ? 'bg-[#0d9488] text-white shadow-xs font-bold rounded-full'
                      : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1] rounded-full'
                  }`}
                >
                  All Categories
                </button>
                {availableResultCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPublicResultsFilterCat(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      isVarsity
                        ? publicResultsFilterCat.toLowerCase() === cat.toLowerCase()
                          ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                          : 'bg-[#f7f3ed] text-[#5b192a] border border-[#1c1c18] font-anton uppercase tracking-wider rounded-none hover:bg-[#ffd9de]/40'
                        : publicResultsFilterCat.toLowerCase() === cat.toLowerCase()
                        ? 'bg-[#0d9488] text-white shadow-xs font-bold rounded-full'
                        : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1] rounded-full'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grouped Event Results List */}
          {groupedPublishedResults.length === 0 ? (
            <div className={`p-12 text-center shadow-xs ${isVarsity ? 'vh-card rounded-none' : 'border border-[#e2e8f0] rounded-3xl bg-white'}`}>
              <div className={`w-12 h-12 flex items-center justify-center mx-auto mb-3 ${
                isVarsity ? 'bg-[#ffd9de] text-[#5b192a] border border-[#782f40] rounded-none' : 'rounded-full bg-[#f0fdfa] border border-[#ccfbf1] text-[#0d9488]'
              }`}>
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className={`text-base font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>No Results Found</h4>
              <p className={`text-xs mt-1 max-w-sm mx-auto ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                {publicResultsSearch || publicResultsFilterCat !== 'all'
                  ? 'No published event results match your search and filter criteria.'
                  : 'Official results have not been ratified and published yet. Please check back as events conclude.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedPublishedResults.map((group) => {
                const isTeam = group.isTeam;
                const topResults = group.results.slice(0, 3);
                const extraResults = group.results.slice(3);

                return (
                  <div
                    key={group.programmeId}
                    className={isVarsity ? 'vh-card rounded-none overflow-hidden transition-all' : 'bg-white border border-[#e2e8f0] rounded-3xl shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] overflow-hidden transition-all hover:border-[#99f6e4]'}
                  >
                    {/* Unified Event Header */}
                    <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isVarsity ? 'bg-[#e6e2dc] border-[#1c1c18]' : 'bg-gradient-to-r from-[#f0fdfa]/90 via-white to-[#faf8ff] border-[#e2e8f0]'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {group.programme?.code && (
                            <span className={isVarsity ? 'px-2 py-0.5 text-[10px] font-anton bg-[#5b192a] text-white rounded-none uppercase' : 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4]'}>
                              {group.programme.code}
                            </span>
                          )}
                          <span
                            className={isVarsity ? 'px-2.5 py-0.5 text-[10px] font-anton bg-[#d6e3ff] text-[#1b365d] border border-[#1b365d] rounded-none uppercase' : `px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isTeam
                                ? 'bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]'
                                : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1]'
                            }`}
                          >
                            {isTeam ? 'Team Event' : 'Individual'}
                          </span>
                          {group.category && (
                            <span className={isVarsity ? 'px-2.5 py-0.5 text-[10px] font-anton bg-[#ffd9de] text-[#5b192a] border border-[#782f40] rounded-none uppercase' : 'px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium'}>
                              {group.category}
                            </span>
                          )}
                          {group.programme?.venue && (
                            <span className={`text-[11px] hidden sm:inline flex items-center gap-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-slate-500'}`}>
                              <MapPin className={`w-3 h-3 inline ${isVarsity ? 'text-[#782f40]' : 'text-slate-400'}`} />
                              {group.programme.venue} {group.programme.stage ? `(${group.programme.stage})` : ''}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-lg sm:text-xl font-extrabold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
                          {group.programmeName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                        <span className={isVarsity ? 'vh-pennant uppercase text-[10px] inline-flex items-center gap-1.5' : 'inline-flex items-center gap-1.5 bg-[#ccfbf1]/70 px-3 py-1 rounded-full text-[11px] font-bold text-[#0f766e] border border-[#99f6e4]'}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#a47e3b]' : 'text-[#0d9488]'}`} />
                          Official Ratified
                        </span>
                        {group.totalPointsAwarded > 0 && (
                          <span className={isVarsity ? 'font-anton text-xs text-[#5b192a] bg-[#ffd9de] border border-[#782f40] px-2.5 py-0.5 rounded-none uppercase' : 'font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full'}>
                            {group.totalPointsAwarded} pts pool
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Consolidated Winners Container (Rank #1, #2, #3 together in one card) */}
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {topResults.map((r) => {
                          const participant = r.participantId
                            ? festParticipants.find((p) => p.id === r.participantId)
                            : undefined;
                          const chestNumber = participant?.chestNumber;
                          const isGold = r.rank === 1;
                          const isSilver = r.rank === 2;
                          const isBronze = r.rank === 3;

                          return (
                            <div
                              key={r.id}
                              className={`p-4 transition-all flex flex-col justify-between ${
                                isVarsity
                                  ? isGold
                                    ? 'bg-[#fdf9f3] border-2 border-[#a47e3b] shadow-[4px_4px_0px_#a47e3b] rounded-none'
                                    : isSilver
                                    ? 'bg-[#f7f3ed] border-2 border-[#1c1c18] rounded-none'
                                    : isBronze
                                    ? 'bg-[#f7f3ed] border-2 border-[#1c1c18]/40 rounded-none'
                                    : 'bg-[#fdf9f3] border border-[#1c1c18] rounded-none'
                                  : isGold
                                  ? 'rounded-2xl border bg-gradient-to-b from-amber-50/70 to-amber-50/20 border-amber-200 ring-1 ring-amber-400/20'
                                  : isSilver
                                  ? 'rounded-2xl border bg-gradient-to-b from-slate-50 to-white border-slate-200'
                                  : isBronze
                                  ? 'rounded-2xl border bg-gradient-to-b from-orange-50/60 to-white border-orange-200'
                                  : 'rounded-2xl border bg-white border-slate-200'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={isVarsity ? (
                                      isGold
                                        ? 'vh-pennant px-2 py-0.5 text-xs uppercase'
                                        : isSilver
                                        ? 'font-anton text-xs bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] px-2 py-0.5 uppercase'
                                        : isBronze
                                        ? 'font-anton text-xs bg-[#ffdeab] text-[#432d00] border border-[#a47e3b] px-2 py-0.5 uppercase'
                                        : 'font-anton text-xs bg-[#f7f3ed] text-[#1c1c18] px-2 py-0.5 uppercase'
                                    ) : (
                                      `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                        isGold
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : isSilver
                                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                          : isBronze
                                          ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                          : 'bg-slate-100 text-slate-700'
                                      }`
                                    )}
                                  >
                                    {isGold
                                      ? '🥇 1st Place'
                                      : isSilver
                                      ? '🥈 2nd Place'
                                      : isBronze
                                      ? '🥉 3rd Place'
                                      : `Rank #${r.rank}`}
                                  </span>

                                  <span className={isVarsity ? 'font-anton text-xs text-[#5b192a] bg-[#ffd9de] border border-[#782f40] px-2 py-0.5 uppercase' : 'font-mono font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full'}>
                                    +{r.pointsAwarded} pts
                                  </span>
                                </div>

                                <div>
                                  <div className={`font-extrabold text-sm sm:text-base leading-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-slate-900'}`}>
                                    {isTeam
                                      ? r.entryName || 'Squad Entry'
                                      : r.participantName || participant?.name || 'Contestant'}
                                  </div>

                                  {chestNumber && (
                                    <div className="mt-1">
                                      <span className={isVarsity ? 'inline-block font-anton text-[10px] text-[#5b192a] bg-[#ffd9de] border border-[#782f40] px-1.5 py-0.5 uppercase' : 'inline-block font-mono text-[10px] font-bold text-[#0f766e] bg-[#ccfbf1] border border-[#99f6e4] px-1.5 py-0.5 rounded'}>
                                        Chest #{chestNumber}
                                      </span>
                                    </div>
                                  )}

                                  <div className={`text-xs mt-1.5 flex items-center gap-1.5 font-medium ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-slate-600'}`}>
                                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{r.teamName || 'House / Team'}</span>
                                  </div>
                                </div>
                              </div>

                              {r.finalScore !== undefined && r.finalScore > 0 && (
                                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${isVarsity ? 'border-[#1c1c18]/20 font-anton text-[#534345]' : 'border-slate-200/60 font-mono text-slate-500'}`}>
                                  <span>Final Score</span>
                                  <span className={`font-bold ${isVarsity ? 'text-[#1c1c18]' : 'text-slate-800'}`}>{r.finalScore} marks</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Additional Positions beyond Rank 3 (if applicable) */}
                      {extraResults.length > 0 && (
                        <div className={`mt-4 pt-3 border-t ${isVarsity ? 'border-[#1c1c18]/20' : 'border-slate-100'}`}>
                          <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${isVarsity ? 'font-anton text-[#534345]' : 'text-slate-500'}`}>
                            Additional Positions
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {extraResults.map((r) => (
                              <div
                                key={r.id}
                                className={`flex items-center justify-between p-2 text-xs ${
                                  isVarsity
                                    ? 'bg-[#f7f3ed] border border-[#1c1c18]/20 rounded-none font-body-serif'
                                    : 'rounded-xl bg-slate-50 border border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`font-bold text-[11px] ${isVarsity ? 'font-anton text-[#1c1c18]' : 'font-mono text-slate-500'}`}>#{r.rank}</span>
                                  <span className={`font-semibold truncate ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-slate-800'}`}>
                                    {r.participantName || r.entryName}
                                  </span>
                                  <span className="text-slate-400 text-[10px] truncate">({r.teamName})</span>
                                </div>
                                <span className={`font-bold shrink-0 ${isVarsity ? 'font-anton text-[#5b192a]' : 'font-mono text-emerald-700'}`}>
                                  +{r.pointsAwarded} pts
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 7. TIMETABLE / SCHEDULE TAB                                          */}
      {/* ==================================================================== */}
      {activeTabSection === 'schedule' && (
        <section className="py-8 sm:py-10 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 sm:space-y-8 pb-8 sm:pb-12 w-full max-w-full overflow-hidden">
          {/* Header & Overview Stats */}
          <div className={isVarsity ? 'vh-card rounded-none p-6 sm:p-8' : 'bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa] border border-[#e2e8f0] rounded-3xl p-6 sm:p-8 shadow-xs'}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className={isVarsity ? 'vh-pennant uppercase text-xs inline-flex items-center gap-1.5 px-3 py-1 mb-2' : 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d9488]/10 text-[#0d9488] font-bold text-xs uppercase tracking-wider mb-2'}>
                  <Clock className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#ffdeab]' : 'text-[#0d9488]'}`} />
                  Official Festival Programme
                </div>
                <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
                  Festival Timetable & Stages
                </h3>
                <p className={`text-sm mt-1 max-w-2xl ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                  Explore all competition stages, venues, timings, and rules organized by age division and category.
                </p>
              </div>

              {/* Quick Stat Badges */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className={isVarsity ? 'bg-[#f7f3ed] border border-[#1c1c18] rounded-none px-4 py-2.5' : 'bg-white border border-[#e2e8f0] rounded-2xl px-4 py-2.5 shadow-2xs'}>
                  <div className={`text-xs font-semibold ${isVarsity ? 'font-anton uppercase tracking-wider text-[#534345]' : 'text-[#64748b]'}`}>Total Events</div>
                  <div className={`text-xl font-black ${isVarsity ? 'font-anton text-[#1c1c18]' : 'text-[#0f172a] font-mono'}`}>{publishedProgrammes.length}</div>
                </div>
                <div className={isVarsity ? 'bg-[#ffd9de]/30 border border-[#782f40] rounded-none px-4 py-2.5' : 'bg-white border border-[#e2e8f0] rounded-2xl px-4 py-2.5 shadow-2xs'}>
                  <div className={`text-xs font-semibold ${isVarsity ? 'font-anton uppercase tracking-wider text-[#782f40]' : 'text-[#64748b]'}`}>Divisions</div>
                  <div className={`text-xl font-black ${isVarsity ? 'font-anton text-[#5b192a]' : 'text-[#0d9488] font-mono'}`}>{availableScheduleCategories.length}</div>
                </div>
                <div className={isVarsity ? 'bg-[#d6e3ff]/30 border border-[#1b365d] rounded-none px-4 py-2.5' : 'bg-white border border-[#e2e8f0] rounded-2xl px-4 py-2.5 shadow-2xs'}>
                  <div className={`text-xs font-semibold ${isVarsity ? 'font-anton uppercase tracking-wider text-[#1b365d]' : 'text-[#64748b]'}`}>On-Stage</div>
                  <div className={`text-xl font-black ${isVarsity ? 'font-anton text-[#1b365d]' : 'text-teal-700 font-mono'}`}>
                    {publishedProgrammes.filter((p) => p.stageType !== 'off_stage').length}
                  </div>
                </div>
                <div className={isVarsity ? 'bg-[#ffdeab]/30 border border-[#a47e3b] rounded-none px-4 py-2.5' : 'bg-white border border-[#e2e8f0] rounded-2xl px-4 py-2.5 shadow-2xs'}>
                  <div className={`text-xs font-semibold ${isVarsity ? 'font-anton uppercase tracking-wider text-[#a47e3b]' : 'text-[#64748b]'}`}>Off-Stage</div>
                  <div className={`text-xl font-black ${isVarsity ? 'font-anton text-[#432d00]' : 'text-amber-700 font-mono'}`}>
                    {publishedProgrammes.filter((p) => p.stageType === 'off_stage').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Filtering & Search Control Toolbar */}
          <div className={isVarsity ? 'vh-card rounded-none p-4 sm:p-5 space-y-4' : 'bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4'}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by event name, code (e.g. LOZ-01), venue..."
                  value={scheduleSearchQuery}
                  onChange={(e) => setScheduleSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-9 py-2.5 text-sm transition-all focus:outline-none ${
                    isVarsity
                      ? 'bg-[#fdf9f3] border-2 border-[#1c1c18] rounded-none focus:border-[#782f40] font-body-serif text-[#1c1c18]'
                      : 'bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0d9488] focus:border-transparent'
                  }`}
                />
                {scheduleSearchQuery && (
                  <button
                    onClick={() => setScheduleSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Stage Type Toggle */}
              <div className={`flex items-center gap-1 p-1 max-w-full overflow-x-auto scrollbar-none shrink-0 ${
                isVarsity ? 'bg-[#e6e2dc] border border-[#1c1c18] rounded-none' : 'bg-[#f1f5f9] rounded-xl'
              }`}>
                <button
                  type="button"
                  onClick={() => setScheduleStageFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isVarsity
                      ? scheduleStageFilter === 'all'
                        ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                        : 'text-[#1c1c18] hover:bg-[#ffd9de]/40 font-anton uppercase tracking-wider rounded-none'
                      : scheduleStageFilter === 'all'
                      ? 'bg-white text-[#0f172a] shadow-xs rounded-lg'
                      : 'text-[#64748b] hover:text-[#0f172a] rounded-lg'
                  }`}
                >
                  All ({publishedProgrammes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleStageFilter('stage')}
                  className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isVarsity
                      ? scheduleStageFilter === 'stage'
                        ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                        : 'text-[#1c1c18] hover:bg-[#ffd9de]/40 font-anton uppercase tracking-wider rounded-none'
                      : scheduleStageFilter === 'stage'
                      ? 'bg-white text-teal-800 shadow-xs rounded-lg'
                      : 'text-[#64748b] hover:text-[#0f172a] rounded-lg'
                  }`}
                >
                  🎭 On-Stage ({publishedProgrammes.filter((p) => p.stageType !== 'off_stage').length})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleStageFilter('off_stage')}
                  className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isVarsity
                      ? scheduleStageFilter === 'off_stage'
                        ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                        : 'text-[#1c1c18] hover:bg-[#ffd9de]/40 font-anton uppercase tracking-wider rounded-none'
                      : scheduleStageFilter === 'off_stage'
                      ? 'bg-white text-amber-800 shadow-xs rounded-lg'
                      : 'text-[#64748b] hover:text-[#0f172a] rounded-lg'
                  }`}
                >
                  🎨 Off-Stage ({publishedProgrammes.filter((p) => p.stageType === 'off_stage').length})
                </button>
              </div>
            </div>

            {/* Category Division Pills */}
            <div className={`pt-2 border-t ${isVarsity ? 'border-[#1c1c18]/20' : 'border-[#f1f5f9]'}`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                isVarsity ? 'font-anton text-[#1c1c18]' : 'text-[#64748b]'
              }`}>
                <SlidersHorizontal className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                Filter by Category Division:
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setScheduleCategoryFilter('All')}
                  className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isVarsity
                      ? scheduleCategoryFilter === 'All'
                        ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                        : 'bg-[#f7f3ed] text-[#5b192a] border border-[#1c1c18] font-anton uppercase tracking-wider rounded-none hover:bg-[#ffd9de]/40'
                      : scheduleCategoryFilter === 'All'
                      ? 'bg-[#0f172a] text-white shadow-xs rounded-xl'
                      : 'bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] hover:bg-slate-100 rounded-xl'
                  }`}
                >
                  All Divisions ({publishedProgrammes.length})
                </button>

                {availableScheduleCategories.map((catName) => {
                  const count = publishedProgrammes.filter((p) => (p.category || '').trim().toLowerCase() === catName.trim().toLowerCase()).length;
                  const catConfig = festCategories?.find((c) => (c.name || '').trim().toLowerCase() === catName.trim().toLowerCase());
                  const isSelected = scheduleCategoryFilter.trim().toLowerCase() === catName.trim().toLowerCase();
                  const ageLabel = catConfig?.minAge !== undefined && catConfig?.maxAge !== undefined
                    ? `Ages ${catConfig.minAge}-${catConfig.maxAge}`
                    : catConfig?.minAge !== undefined
                    ? `Ages ${catConfig.minAge}+`
                    : catConfig?.maxAge !== undefined
                    ? `Up to age ${catConfig.maxAge}`
                    : catConfig?.description;

                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setScheduleCategoryFilter(catName)}
                      className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                        isVarsity
                          ? isSelected
                            ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider rounded-none'
                            : 'bg-[#f7f3ed] text-[#5b192a] border border-[#1c1c18] font-anton uppercase tracking-wider rounded-none hover:bg-[#ffd9de]/40'
                          : isSelected
                          ? 'bg-[#0d9488] text-white shadow-xs rounded-xl'
                          : 'bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] hover:bg-slate-100 rounded-xl'
                      }`}
                    >
                      <span>{catName}</span>
                      {ageLabel && (
                        <span className={`text-[10px] font-normal ${isSelected ? 'text-white/80' : 'text-[#94a3b8]'}`}>
                          ({ageLabel})
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 ${
                          isVarsity
                            ? isSelected ? 'bg-white/20 text-white rounded-none font-anton' : 'bg-[#e6e2dc] text-[#1c1c18] rounded-none font-anton'
                            : isSelected ? 'bg-white/20 text-white rounded-full' : 'bg-slate-200 text-slate-700 rounded-full'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Filter Clear Bar */}
            {(scheduleCategoryFilter !== 'All' || scheduleStageFilter !== 'all' || scheduleSearchQuery.trim()) && (
              <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#64748b]">
                <span>
                  Showing <strong className="text-[#0f172a]">{filteredScheduleProgrammes.length}</strong> of{' '}
                  <strong className="text-[#0f172a]">{publishedProgrammes.length}</strong> programmes
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleCategoryFilter('All');
                    setScheduleStageFilter('all');
                    setScheduleSearchQuery('');
                  }}
                  className="font-bold text-[#0d9488] hover:text-[#0f766e] hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Helper Card Renderer */}
          {(() => {
            const renderCard = (p: typeof publishedProgrammes[0]) => {
              const slot = festScheduleSlots.find((s) => s.programmeId === p.id);
              const startTime = slot?.startTime || p.startTime;
              const endTime = slot?.endTime || p.endTime;
              const slotDate = slot?.date || p.date;
              const timeDisplay =
                startTime && endTime ? `${startTime} - ${endTime}` : startTime ? `From ${startTime}` : 'Schedule TBA';
              const isOffStage = p.stageType === 'off_stage';
              const isTeam = p.type === 'team' || p.programmeType === 'team';

              return (
                <div
                  key={p.id}
                  className={`transition-all duration-200 p-5 flex flex-col justify-between group ${
                    isVarsity
                      ? 'vh-ticket-stub rounded-none border-2 border-[#1c1c18] bg-[#f7f3ed] hover:border-[#782f40]'
                      : 'bg-white border border-[#e2e8f0] hover:border-[#0d9488]/40 hover:shadow-md rounded-2xl'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header badge row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={isVarsity ? 'font-anton text-xs bg-[#5b192a] text-white px-2.5 py-0.5 rounded-none uppercase tracking-wider' : 'font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#0f172a] text-white tracking-wider shadow-2xs'}>
                          {p.code}
                        </span>
                        {isOffStage ? (
                          <span className={isVarsity ? 'font-anton text-[11px] px-2 py-0.5 uppercase tracking-wider bg-[#ffdeab] text-[#432d00] border border-[#a47e3b] rounded-none' : 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200'}>
                            🎨 Off-Stage
                          </span>
                        ) : (
                          <span className={isVarsity ? 'font-anton text-[11px] px-2 py-0.5 uppercase tracking-wider bg-[#ffd9de] text-[#5b192a] border border-[#782f40] rounded-none' : 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200'}>
                            🎭 On-Stage
                          </span>
                        )}
                        <span className={isVarsity ? 'font-anton text-[11px] px-2 py-0.5 uppercase tracking-wider bg-[#d6e3ff] text-[#1b365d] border border-[#1b365d] rounded-none' : 'text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200'}>
                          {isTeam ? '👥 Team' : '👤 Individual'}
                        </span>
                      </div>
                      {p.status === 'ongoing' ? (
                        <span className={isVarsity ? 'vh-pennant-burgundy px-2 py-0.5 text-[10px] animate-pulse uppercase' : 'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse'}>
                          LIVE NOW
                        </span>
                      ) : p.status === 'completed' ? (
                        <span className={isVarsity ? 'font-anton text-[10px] px-2 py-0.5 bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] rounded-none uppercase' : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700'}>
                          Concluded
                        </span>
                      ) : null}
                    </div>

                    {/* Programme Title */}
                    <div>
                      <h4 className={`text-base font-bold leading-snug transition-colors ${
                        isVarsity ? 'font-headline text-[#1c1c18] group-hover:text-[#782f40]' : 'text-[#0f172a] group-hover:text-[#0d9488]'
                      }`}>
                        {p.name}
                      </h4>
                      <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'font-medium text-[#0d9488]'}`}>{p.category}</p>
                    </div>

                    {/* Details: Venue & Timing */}
                    <div className={`space-y-2 pt-1 border-t ${isVarsity ? 'border-[#1c1c18]/15' : 'border-[#f1f5f9]'}`}>
                      <div className={`flex items-center gap-2 text-xs ${isVarsity ? 'font-body-serif text-[#1c1c18]' : 'text-[#334155]'}`}>
                        <MapPin className={`w-4 h-4 shrink-0 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                        <span className="font-medium truncate">{p.venue || slot?.venue || 'Auditorium / Main Hall'}</span>
                      </div>

                      <div className={`flex items-center gap-2 text-xs ${isVarsity ? 'font-body-serif text-[#1c1c18]' : 'text-[#334155]'}`}>
                        <Clock className={`w-4 h-4 shrink-0 ${isVarsity ? 'text-[#1b365d]' : 'text-[#0284c7]'}`} />
                        <span className="font-medium">
                          {slotDate ? `${slotDate} • ` : ''}
                          {timeDisplay}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer info: Limits */}
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                    isVarsity ? 'border-[#1c1c18]/15 font-body-serif text-[#534345]' : 'border-[#f8fafc] text-[#64748b]'
                  }`}>
                    <span>
                      {isTeam
                        ? `Min ${p.minTeamMembers || 2} - Max ${p.maxTeamMembers || 6} / house`
                        : `Max ${p.maxParticipantsPerTeam || 1} participant / house`}
                    </span>
                    {p.rules && (
                      <span className={isVarsity ? 'font-anton text-[#5b192a] uppercase tracking-wider' : 'text-[#0d9488] font-medium'} title={p.rules}>
                        Rules available
                      </span>
                    )}
                  </div>
                </div>
              );
            };

            // CASE 1: When no filter is active, display cleanly structured by Category Sections!
            if (scheduleCategoryFilter === 'All' && !scheduleSearchQuery.trim() && scheduleStageFilter === 'all') {
              if (publishedProgrammes.length === 0) {
                return (
                  <div className={`p-12 text-center max-w-lg mx-auto ${isVarsity ? 'vh-card rounded-none' : 'bg-white border border-[#e2e8f0] rounded-3xl'}`}>
                    <div className={`w-12 h-12 mx-auto flex items-center justify-center mb-3 ${isVarsity ? 'bg-[#ffd9de] text-[#5b192a] border border-[#782f40] rounded-none' : 'rounded-2xl bg-slate-100 text-slate-400'}`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <h4 className={`text-base font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>No Programmes Published Yet</h4>
                    <p className={`text-xs mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                      The official festival timetable is currently being finalized by the organizing committee.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-10">
                  {availableScheduleCategories.map((catName) => {
                    const catProgrammes = publishedProgrammes.filter(
                      (p) => (p.category || '').trim().toLowerCase() === catName.trim().toLowerCase()
                    );
                    if (catProgrammes.length === 0) return null;
                    const catConfig = festCategories?.find(
                      (c) => (c.name || '').trim().toLowerCase() === catName.trim().toLowerCase()
                    );
                    const ageLabel = catConfig?.minAge !== undefined && catConfig?.maxAge !== undefined
                      ? `Ages ${catConfig.minAge}-${catConfig.maxAge}`
                      : catConfig?.minAge !== undefined
                      ? `Ages ${catConfig.minAge}+`
                      : catConfig?.maxAge !== undefined
                      ? `Up to age ${catConfig.maxAge}`
                      : catConfig?.description;

                    return (
                      <div key={catName} className="space-y-4">
                        {/* Category Section Header Banner */}
                        <div className={`flex items-center justify-between gap-4 pb-3 border-b-2 ${isVarsity ? 'border-[#1c1c18]' : 'border-[#0d9488]/20'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 flex items-center justify-center font-black text-sm ${
                              isVarsity ? 'bg-[#5b192a] text-white font-anton rounded-none' : 'rounded-xl bg-[#0d9488]/10 text-[#0d9488]'
                            }`}>
                              {catName.charAt(0)}
                            </div>
                            <div>
                              <h4 className={`text-xl font-extrabold tracking-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>{catName}</h4>
                              {ageLabel && (
                                <p className={`text-xs ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>Age Division: {ageLabel}</p>
                              )}
                            </div>
                          </div>
                          <span className={isVarsity ? 'font-anton text-xs px-3 py-1 bg-[#e6e2dc] text-[#1c1c18] border border-[#1c1c18] rounded-none uppercase' : 'text-xs font-bold px-3 py-1 rounded-full bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]'}>
                            {catProgrammes.length} {catProgrammes.length === 1 ? 'Competition' : 'Competitions'}
                          </span>
                        </div>

                        {/* Category Programme Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {catProgrammes.map(renderCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // CASE 2: Filters or search query are active
            if (filteredScheduleProgrammes.length === 0) {
              return (
                <div className="bg-white border border-[#e2e8f0] rounded-3xl p-12 text-center max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-[#0f172a]">No Matching Programmes Found</h4>
                  <p className="text-xs text-[#64748b] mt-1">
                    Try adjusting your search keywords, category division, or stage filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleCategoryFilter('All');
                      setScheduleStageFilter('all');
                      setScheduleSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 bg-[#0d9488] text-white rounded-xl text-xs font-bold hover:bg-[#0f766e] transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span className="font-semibold text-[#0f172a]">
                    Showing {filteredScheduleProgrammes.length} filtered results:
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredScheduleProgrammes.map(renderCard)}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 8. TEAMS TAB                                                         */}
      {/* ==================================================================== */}
      {activeTabSection === 'teams' && (
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 w-full max-w-full overflow-hidden">
          <div className="border-b border-[#e2e8f0] pb-4">
            <h3 className={`text-2xl font-extrabold tracking-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
              Participating Houses & Teams
            </h3>
            <p className={`text-xs mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
              Official houses competing in {settings.festName}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className={isVarsity ? 'vh-card rounded-none p-5 space-y-3' : 'bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] space-y-3 hover:border-[#99f6e4] transition-colors'}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-xs shadow-xs ${
                    isVarsity ? 'bg-[#5b192a] text-white font-anton rounded-none' : 'rounded-xl bg-[#0d9488] text-white'
                  }`}>
                    {t.code}
                  </div>
                  <span className={isVarsity ? 'text-xs font-anton text-[#5b192a]' : 'text-xs font-mono font-bold text-[#0d9488]'}>
                    {(t.totalPoints ?? t.totalScore) ?? results.filter((r) => r.teamId === t.id && r.published).reduce((sum, r) => sum + (r.pointsAwarded || 0), 0)} pts
                  </span>
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>{t.name}</h4>
                  <p className={`text-xs mt-0.5 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{t.institution || 'Collegiate House'}</p>
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
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-3.5 sm:px-8 space-y-6 w-full max-w-full overflow-hidden">
          <div className="border-b border-[#e2e8f0] pb-4">
            <h3 className={`text-2xl font-extrabold tracking-tight ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>
              Official Bulletins & Notices
            </h3>
            <p className={`text-xs mt-1 ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
              Real-time notices and schedule updates from the Fest Administration.
            </p>
          </div>

          {publicAnnouncements.length === 0 ? (
            <div className={`p-12 text-center text-xs ${isVarsity ? 'vh-card rounded-none font-body-serif text-[#534345]' : 'border border-[#e2e8f0] rounded-2xl bg-[#faf8ff] text-[#64748b]'}`}>
              No public notices posted at this moment.
            </div>
          ) : (
            <div className="space-y-4">
              {publicAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className={isVarsity ? 'vh-card rounded-none p-5 space-y-2' : 'bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] space-y-2 hover:border-[#99f6e4] transition-colors'}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${isVarsity ? 'font-anton text-[#5b192a] uppercase tracking-wider' : 'text-[#0d9488]'}`}>
                      <Bell className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                      {a.category || 'General Notice'}
                    </span>
                    <span className={`text-xs ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>{a.createdAt?.slice(0, 10)}</span>
                  </div>
                  <h4 className={`text-base font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>{a.title}</h4>
                  <p className={`text-xs leading-relaxed whitespace-pre-line ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#334155]'}`}>{a.content}</p>
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
      {/* 10. FESTIVAL FOOTER                                                  */}
      {/* ==================================================================== */}
      <footer className={`mt-auto pt-12 sm:pt-16 pb-12 sm:pb-16 w-full max-w-full overflow-hidden ${
        isVarsity
          ? 'bg-[#1b365d] text-[#fdf9f3] border-t-4 border-[#782f40]'
          : 'bg-[#0b1120] text-slate-300 border-t border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b ${isVarsity ? 'border-[#a47e3b]/30' : 'border-slate-800'}`}>
            {/* Col 1: Fest Brand & Copyright */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 flex items-center justify-center text-white font-black text-sm shadow-md select-none ${
                  isVarsity ? 'bg-[#5b192a] border border-[#a47e3b] font-anton rounded-none' : 'rounded-xl bg-gradient-to-tr from-[#00685f] to-[#0d9488]'
                }`}>
                  <span>{festName.charAt(0) || 'F'}</span>
                </div>
                <span className={`text-xl font-black tracking-tight ${isVarsity ? 'font-headline text-[#fdf9f3]' : 'text-white font-display'}`}>
                  {festName}
                </span>
              </div>
              <p className={`text-xs leading-relaxed max-w-sm ${isVarsity ? 'font-body-serif text-[#fdf9f3]/80' : 'text-slate-400'}`}>
                {fest?.description || 'The official autonomous digital festival portal powered by Festoria OS.'}
              </p>
              <div className={`text-[11px] pt-1 ${isVarsity ? 'font-body-serif text-[#fdf9f3]/60' : 'text-slate-500'}`}>
                © {new Date().getFullYear()} {festName}. All rights reserved.
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h5 className={`text-xs uppercase tracking-wider mb-4 ${isVarsity ? 'font-anton text-[#ffdeab]' : 'font-bold text-white'}`}>
                Quick Links
              </h5>
              <ul className={`space-y-2.5 text-xs ${isVarsity ? 'font-body-serif text-[#fdf9f3]/80' : 'text-slate-400'}`}>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('results')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Results
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('student_search')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    My Result
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('bulletin')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Downloads
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Schedules
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('gallery')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Wall
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Made with Festoria Platform */}
            <div className="space-y-3">
              <span className={`text-xs uppercase tracking-wider ${isVarsity ? 'font-anton text-[#ffdeab]' : 'font-bold text-slate-400'}`}>
                Made with
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 flex items-center justify-center text-white font-extrabold text-xs shadow-xs ${
                  isVarsity ? 'bg-[#5b192a] font-anton rounded-none border border-[#a47e3b]' : 'rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400'
                }`}>
                  <span>F</span>
                </div>
                <span className={`font-extrabold text-base ${isVarsity ? 'font-headline text-[#fdf9f3]' : 'font-display text-white'}`}>
                  Festoria
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isVarsity ? 'font-body-serif text-[#fdf9f3]/80' : 'text-slate-400'}`}>
                Manage registrations, scheduling, scoring, and results — all in one platform. No paperwork, no chaos. Just smooth fests, every time.
              </p>
              <div className="pt-2">
                <a
                  href={getAppUrl()}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all ${
                    isVarsity
                      ? 'vh-btn-brass rounded-none uppercase'
                      : 'rounded-full bg-gradient-to-r from-[#00685f] to-[#0d9488] hover:from-[#0f766e] text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  <span>Create Your Own Fest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Sub Footer */}
          <div className={`pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${isVarsity ? 'text-[#fdf9f3]/60 font-body-serif' : 'text-slate-500'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono ${isVarsity ? 'bg-[#142948] text-[#ffdeab] rounded-none' : 'rounded-full bg-slate-800 text-slate-400'}`}>
                OS
              </div>
              <span>Powered by Festoria Festival Operating System</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
              <a href="#" className={`transition-colors ${isVarsity ? 'hover:text-[#ffdeab]' : 'hover:text-slate-300'}`}>Privacy Policy</a>
              <a href="#" className={`transition-colors ${isVarsity ? 'hover:text-[#ffdeab]' : 'hover:text-slate-300'}`}>Terms and Conditions</a>
              <a href="#contact" className={`transition-colors ${isVarsity ? 'hover:text-[#ffdeab]' : 'hover:text-slate-300'}`}>Contact Us</a>
            </div>
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
              className={`max-w-lg w-full overflow-hidden shadow-2xl ${
                isVarsity ? 'bg-[#fdf9f3] border-2 border-[#1c1c18] rounded-none' : 'bg-white rounded-3xl border border-[#e2e8f0]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div className={`p-6 relative text-white ${isVarsity ? 'bg-[#5b192a] border-b-2 border-[#1c1c18]' : 'bg-gradient-to-r from-[#06332e] to-[#00685f]'}`}>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className={`absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${isVarsity ? 'text-[#ffd9de] hover:text-white' : 'text-teal-200 hover:text-white'}`}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <span className={isVarsity ? 'font-anton text-xs bg-[#ffd9de] text-[#5b192a] px-3.5 py-1 rounded-none uppercase tracking-wider' : 'font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] px-3.5 py-1 rounded-full shadow-xs'}>
                    Chest #{student.chestNumber || student.id}
                  </span>
                  <span className={isVarsity ? 'font-anton text-[11px] px-2.5 py-0.5 bg-[#d6e3ff] text-[#1b365d] rounded-none uppercase' : 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-teal-100'}>
                    {student.category}
                  </span>
                  <span className={`text-[10px] font-mono ${isVarsity ? 'text-[#ffd9de]/80' : 'text-teal-200/70'}`}>ID: {student.id}</span>
                </div>

                <h3 className={`text-xl sm:text-2xl font-extrabold ${isVarsity ? 'font-headline text-white' : 'text-white font-display'}`}>{student.name}</h3>
                <p className={`text-xs mt-1 ${isVarsity ? 'font-body-serif text-[#ffd9de]' : 'text-teal-100/90'}`}>
                  Representing <strong className="text-white font-bold">{team?.name || 'Independent'}</strong>
                  {team?.institution ? ` • ${team.institution}` : ''}
                </p>
              </div>

              {/* Statistics Strip */}
              <div className={`p-5 border-b grid grid-cols-2 gap-3 text-center ${
                isVarsity ? 'bg-[#f7f3ed] border-[#1c1c18]/20' : 'border-[#e2e8f0] bg-[#faf8ff]'
              }`}>
                <div className={isVarsity ? 'p-3 bg-[#fdf9f3] border border-[#1c1c18] rounded-none' : 'p-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs'}>
                  <span className={`text-[10px] uppercase tracking-wider block ${isVarsity ? 'font-anton text-[#534345]' : 'text-[#64748b] font-bold'}`}>
                    Total Individual Points
                  </span>
                  <span className={`mt-0.5 block ${isVarsity ? 'font-anton text-2xl text-[#5b192a]' : 'font-mono font-black text-2xl text-[#0f172a]'}`}>
                    {stats.totalPoints} pts
                  </span>
                </div>
                <div className={isVarsity ? 'p-3 bg-[#fdf9f3] border border-[#1c1c18] rounded-none' : 'p-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs'}>
                  <span className={`text-[10px] uppercase tracking-wider block ${isVarsity ? 'font-anton text-[#534345]' : 'text-[#64748b] font-bold'}`}>
                    Medals Won
                  </span>
                  <span className={`mt-1.5 block ${isVarsity ? 'font-anton text-base text-[#1c1c18]' : 'text-sm font-black text-[#0f172a]'}`}>
                    🥇 {stats.goldCount} · 🥈 {stats.silverCount} · 🥉 {stats.bronzeCount}
                  </span>
                </div>
              </div>

              {/* Registered Programmes Detail */}
              <div className="p-6 space-y-3 max-h-72 overflow-y-auto">
                <h4 className={`text-xs uppercase tracking-wider ${isVarsity ? 'font-anton text-[#534345]' : 'font-bold text-[#64748b]'}`}>
                  Registered Programmes ({studentProgs.length})
                </h4>

                {studentProgs.length === 0 ? (
                  <p className={`text-xs italic ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>No programmes registered yet.</p>
                ) : (
                  studentProgs.map((prg) => {
                    const res = stats.studentResults.find((r) => r.programmeId === prg.id);
                    return (
                      <div
                        key={prg.id}
                        className={isVarsity ? 'p-3 border border-[#1c1c18]/20 bg-[#fdf9f3] rounded-none space-y-1.5' : 'p-3 rounded-2xl border border-[#e2e8f0] bg-white shadow-2xs space-y-1.5'}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className={`font-bold text-sm ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>{prg.name}</h5>
                          {res ? (
                            <span className={isVarsity ? 'font-anton text-xs text-[#5b192a] bg-[#ffd9de] px-2.5 py-0.5 border border-[#782f40] rounded-none uppercase' : 'font-mono font-black text-xs text-[#0f766e] bg-[#ccfbf1] px-2.5 py-0.5 rounded-full border border-[#99f6e4]'}>
                              Rank #{res.rank} (+{res.pointsAwarded} pts)
                            </span>
                          ) : (
                            <span className={isVarsity ? 'font-anton text-[11px] text-[#432d00] bg-[#ffdeab] px-2 py-0.5 border border-[#a47e3b] rounded-none uppercase' : 'text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200'}>
                              Scheduled
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center gap-3 text-xs ${isVarsity ? 'font-body-serif text-[#534345]' : 'text-[#64748b]'}`}>
                          <span className="flex items-center gap-1">
                            <Clock className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                            {prg.startTime} - {prg.endTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className={`w-3.5 h-3.5 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                            {prg.venue} ({prg.stage})
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Modal Action */}
              <div className={`p-4 border-t flex justify-end ${isVarsity ? 'bg-[#f7f3ed] border-[#1c1c18]/20' : 'bg-[#faf8ff] border-[#e2e8f0]'}`}>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className={`px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                    isVarsity ? 'vh-btn-primary rounded-none uppercase' : 'bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-full shadow-xs'
                  }`}
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

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 z-50">
            <div className={`w-full max-w-sm sm:max-w-md shadow-2xl flex flex-col justify-between border-l duration-300 ${
              isVarsity ? 'bg-[#fdf9f3] border-[#1c1c18] text-[#1c1c18]' : 'bg-white border-[#e2e8f0] animate-in slide-in-from-right'
            }`}>
              
              {/* Drawer Header */}
              <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                isVarsity ? 'bg-[#e6e2dc] border-[#1c1c18]' : 'bg-[#faf8ff] border-[#e2e8f0]'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  {pageData.logo.logoUrl ? (
                    <img
                      src={pageData.logo.logoUrl}
                      alt={festName}
                      style={{ width: `${pageData.logo.widthPx || 100}px` }}
                      className="h-8 max-w-[100px] object-contain shrink-0"
                    />
                  ) : (
                    <img
                      src={FESTORIA_LOGO}
                      alt={festName}
                      onError={handleLogoError}
                      className={`w-8 h-8 object-contain p-0.5 ${
                        isVarsity ? 'rounded-none border-2 border-[#1c1c18] bg-[#fdf9f3]' : 'rounded-xl border border-[#e2e8f0] bg-white'
                      }`}
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className={`font-extrabold text-sm truncate ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a] font-display'}`}>{festName}</h3>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider truncate ${isVarsity ? 'font-anton text-[#534345]' : 'text-[#64748b]'}`}>
                      {fest?.institution ? `${fest.institution} · ` : ''}{fest?.edition || settings.festEdition || 'Official Festival Portal'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuDrawerOpen(false)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isVarsity ? 'text-[#1c1c18] hover:bg-[#ffd9de]/40' : 'text-slate-400 hover:text-slate-700 hover:bg-[#f0fdfa]'
                  }`}
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Theme Switcher in Mobile Drawer */}
                <div className={`p-2.5 border flex items-center justify-between ${
                  isVarsity ? 'bg-[#f7f3ed] border-[#1c1c18] rounded-none' : 'bg-slate-50 border-slate-200 rounded-2xl'
                }`}>
                  <span className={`text-xs font-bold ${isVarsity ? 'font-anton uppercase tracking-wider text-[#1c1c18]' : 'text-slate-700'}`}>
                    Theme
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPublicTheme('varsity_heritage')}
                      className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        publicTheme === 'varsity_heritage'
                          ? 'bg-[#5b192a] text-white font-anton uppercase tracking-wider shadow-xs'
                          : 'text-[#5b192a] hover:bg-[#ffd9de]/40 font-anton uppercase tracking-wider'
                      } ${isVarsity ? 'rounded-none' : 'rounded-full'}`}
                    >
                      🏛️ Varsity
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublicTheme('modern')}
                      className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        publicTheme === 'modern'
                          ? 'bg-[#0d9488] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      } ${isVarsity ? 'rounded-none font-anton uppercase tracking-wider' : 'rounded-full'}`}
                    >
                      ✨ Modern
                    </button>
                  </div>
                </div>

                {/* Fast Action Card (Register & Sign In) */}
                <div className={`p-4 space-y-3 ${
                  isVarsity
                    ? 'bg-[#1b365d] text-[#fdf9f3] border-2 border-[#1c1c18] rounded-none shadow-[4px_4px_0px_#a47e3b]'
                    : 'bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] rounded-2xl text-white shadow-lg'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isVarsity ? 'font-anton text-[#ffdeab]' : 'text-[#89f5e7]'}`}>
                      Contestant Access
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 font-semibold ${
                      isVarsity ? 'bg-[#5b192a] text-white border border-[#a47e3b] font-anton uppercase rounded-none' : 'bg-white/15 text-[#89f5e7] border border-white/20 rounded-full'
                    }`}>
                      Live
                    </span>
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isVarsity ? 'font-headline text-[#fdf9f3]' : 'text-white font-display'}`}>Join as a Participant</h4>
                    <p className={`text-[11px] mt-0.5 ${isVarsity ? 'font-body-serif text-[#fdf9f3]/80' : 'text-teal-100/80'}`}>
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
                      className={`w-full py-2 px-3 text-xs font-bold transition-colors text-center shadow-md cursor-pointer ${
                        isVarsity
                          ? 'bg-[#a47e3b] hover:bg-[#8d692f] text-white font-anton uppercase rounded-none'
                          : 'rounded-full bg-[#89f5e7] hover:bg-[#6bd8cb] text-[#00201d]'
                      }`}
                    >
                      Register Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDrawerOpen(false);
                        openAuth('participant', 'signin');
                      }}
                      className={`w-full py-2 px-3 text-xs font-semibold transition-colors text-center cursor-pointer ${
                        isVarsity
                          ? 'bg-[#142948] hover:bg-[#1a345c] border border-[#a47e3b] text-white font-anton uppercase rounded-none'
                          : 'rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                      }`}
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                {/* Festival Navigation Sections */}
                <div>
                  <h4 className={`text-[11px] uppercase tracking-wider mb-2 px-2 ${
                    isVarsity ? 'font-anton text-[#534345]' : 'font-bold text-[#64748b]'
                  }`}>
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
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                            isVarsity
                              ? isActive
                                ? 'bg-[#ffd9de] text-[#5b192a] font-anton uppercase tracking-wider rounded-none border border-[#782f40]'
                                : 'text-[#1c1c18] hover:bg-[#f7f3ed] font-anton uppercase tracking-wider rounded-none'
                              : isActive
                              ? 'bg-[#f0fdfa] text-[#0d9488] font-bold border border-[#ccfbf1] shadow-2xs rounded-full'
                              : 'text-[#334155] hover:bg-[#faf8ff] hover:text-[#0d9488] rounded-full'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComp className={`w-4 h-4 ${
                              isVarsity
                                ? isActive ? 'text-[#782f40]' : 'text-[#534345]'
                                : isActive ? 'text-[#0d9488]' : 'text-[#64748b]'
                            }`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 ${
                              isVarsity
                                ? isActive ? 'bg-[#5b192a] text-white rounded-none font-anton' : 'bg-[#e6e2dc] text-[#1c1c18] rounded-none font-anton border border-[#1c1c18]'
                                : isActive ? 'bg-[#0d9488] text-white rounded-full' : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] rounded-full'
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
                  <h4 className={`text-[11px] uppercase tracking-wider mb-2 px-2 ${
                    isVarsity ? 'font-anton text-[#534345]' : 'font-bold text-[#64748b]'
                  }`}>
                    Portals & Management
                  </h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDrawerOpen(false);
                        openAuth('team_leader', 'signin');
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                        isVarsity
                          ? 'text-[#1c1c18] hover:bg-[#f7f3ed] font-anton uppercase tracking-wider rounded-none'
                          : 'text-[#334155] hover:bg-[#f0fdfa] hover:text-[#0d9488] rounded-full font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className={`w-4 h-4 ${isVarsity ? 'text-[#782f40]' : 'text-[#0284c7]'}`} />
                        <span>Team Leader Portal</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <a
                      href={getAppUrl()}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
                        isVarsity
                          ? 'text-[#1c1c18] hover:bg-[#f7f3ed] font-anton uppercase tracking-wider rounded-none'
                          : 'text-[#334155] hover:bg-[#f0fdfa] hover:text-[#0d9488] rounded-full font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className={`w-4 h-4 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                        <span>Festoria Platform Home</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </a>
                  </div>
                </div>

                {/* Festival Grounds & Edition Info */}
                <div className={`p-4 space-y-2 text-xs ${
                  isVarsity
                    ? 'bg-[#f7f3ed] border border-[#1c1c18] rounded-none font-body-serif'
                    : 'bg-[#faf8ff] rounded-2xl border border-[#e2e8f0]'
                }`}>
                  <div className="flex items-center justify-between">
                    <h5 className={`font-bold ${isVarsity ? 'font-headline text-[#1c1c18]' : 'text-[#0f172a]'}`}>Festival Info</h5>
                    <span className={isVarsity ? 'text-[10px] bg-[#ffd9de] text-[#5b192a] border border-[#782f40] px-2.5 py-0.5 rounded-none font-anton uppercase' : 'text-[10px] bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] font-semibold px-2.5 py-0.5 rounded-full'}>
                      {fest?.edition || 'Official Edition'}
                    </span>
                  </div>
                  <div className={`space-y-1.5 text-[11px] pt-1 ${isVarsity ? 'text-[#534345]' : 'text-[#334155]'}`}>
                    <div className="flex items-start gap-1.5">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                      <span>Venue: <strong className={isVarsity ? 'text-[#1c1c18]' : 'text-[#0f172a]'}>{fest?.venue || settings.venue || 'Campus Convention Grounds'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 shrink-0 ${isVarsity ? 'text-[#782f40]' : 'text-[#0d9488]'}`} />
                      <span>Dates: <strong className={isVarsity ? 'text-[#1c1c18]' : 'text-[#0f172a]'}>{fest?.startDate || settings.startDate} to {fest?.endDate || settings.endDate}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className={`p-4 border-t text-center text-[11px] ${
                isVarsity ? 'border-[#1c1c18] bg-[#e6e2dc] font-body-serif text-[#534345]' : 'border-[#e2e8f0] bg-[#faf8ff] text-[#64748b]'
              }`}>
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
