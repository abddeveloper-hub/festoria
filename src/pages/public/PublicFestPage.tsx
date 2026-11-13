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
  Send
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
    addToast
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
    <div className="min-h-screen min-h-dvh bg-[#faf8ff] text-slate-800 flex flex-col font-sans selection:bg-[#0d9488] selection:text-white">
      {/* ==================================================================== */}
      {/* 1. PUBLIC TOP NAVIGATION                                             */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-40 bg-[#faf8ff]/85 backdrop-blur-md border-b border-[#e2e8f0] px-4 sm:px-8 py-3.5 flex items-center justify-between">
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
              className="w-9 h-9 rounded-xl object-contain shadow-xs border border-[#e2e8f0] bg-white p-0.5"
            />
          )}

          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#0f172a] leading-tight font-display">
              {festName}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-[#64748b] font-medium tracking-wide">
              {fest?.institution ? `${fest.institution} · ` : ''}{fest?.edition || settings.festEdition || 'Official Festival Portal'}
            </p>
          </div>
        </div>

        {/* Menu Bar Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold transition-all shadow-[0_4px_14px_rgba(13,148,136,0.25)] hover:shadow-[0_6px_18px_rgba(13,148,136,0.35)] active:scale-95 cursor-pointer"
          >
            <Menu className="w-4 h-4 text-white" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Subview Navigation Breadcrumb (When viewing a specific section) */}
      {activeTabSection !== 'overview' && (
        <div className="bg-[#f0fdfa]/90 border-b border-[#ccfbf1] py-3 px-4 sm:px-8 sticky top-[59px] z-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTabSection('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f766e] hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Festival Overview</span>
            </button>
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
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
          <section className="relative px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 max-w-7xl mx-auto w-full">
            <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_15px_40px_-10px_rgba(15,23,42,0.12)] border border-[#e2e8f0] bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] text-white min-h-[460px] sm:min-h-[520px] flex flex-col justify-between p-6 sm:p-10">
              
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06332e] via-[#06332e]/40 to-[#06332e]/70 z-0" />
                </>
              ) : (
                /* Concentric Radial Compass Placeholder Illustration as in the reference model */
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
                  <div className="relative w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full border border-white/20 flex items-center justify-center">
                    <div className="w-[260px] sm:w-[350px] h-[260px] sm:h-[350px] rounded-full border border-white/25 flex items-center justify-center">
                      <div className="w-[180px] sm:w-[240px] h-[180px] sm:h-[240px] rounded-full border border-white/30 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-white/80" />
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
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#89f5e7]/15 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 -right-20 w-88 h-88 bg-[#5bb8fe]/15 rounded-full blur-3xl"></div>
              </div>

              {/* Top Controls: 1/1 Slide Indicator Badge */}
              <div className="relative z-20 flex items-center justify-between w-full">
                {pageData.logo.logoUrl && pageData.logo.alignment === 'center' ? (
                  <img
                    src={pageData.logo.logoUrl}
                    alt="Fest Logo"
                    style={{ width: `${pageData.logo.widthPx || 120}px` }}
                    className="h-9 object-contain drop-shadow-md"
                  />
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#89f5e7] text-xs font-semibold tracking-wide uppercase shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#6ffbbe]" />
                    <span>{fest ? `${fest.name} · ${fest.institution || ''}` : (settings.festEdition || 'Annual Inter-Collegiate Fest')}</span>
                  </div>
                )}

                {/* Top Right Slide Counter Badge (Matching Model 1/1) */}
                <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold shadow-sm">
                  {mainFeaturedPhotos.length > 0 ? `${(currentSlideIndex % mainFeaturedPhotos.length) + 1}/${mainFeaturedPhotos.length}` : '1/1'}
                </div>
              </div>

              {/* Carousel Navigation Chevrons (< and >) */}
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : (mainFeaturedPhotos.length > 0 ? mainFeaturedPhotos.length - 1 : 0)))}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (mainFeaturedPhotos.length > 0 ? (prev + 1) % mainFeaturedPhotos.length : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Center Hero Information Overlay */}
              <div className="relative z-20 max-w-4xl mx-auto text-center space-y-4 my-auto py-6">
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md font-display">
                  {pageData.hero.heading && !pageData.hero.heading.includes('Celebrate Passion') ? pageData.hero.heading : `Welcome to ${festName}`}
                </h2>

                <p className="text-xs sm:text-base lg:text-lg text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
                  {fest?.description || pageData.hero.description}
                </p>

                {/* Dates & Venue Info Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-1 text-xs font-medium text-white/90">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <Calendar className="w-4 h-4 text-[#89f5e7]" />
                    <span>{fest?.startDate || settings.startDate} to {fest?.endDate || settings.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <MapPin className="w-4 h-4 text-[#89f5e7]" />
                    <span>{fest ? `${fest.venue || ''}${fest.institution ? `, ${fest.institution}` : ''}` : (settings.venue || 'Grand University Campus')}</span>
                  </div>
                </div>

                {/* Dynamic Countdown Clock / Status Indicator */}
                <div className="pt-2">
                  {countdown.status === 'upcoming' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                        <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-center min-w-[58px] sm:min-w-[68px] shadow-lg">
                          <span className="font-mono font-black text-xl sm:text-2xl text-white block leading-none">
                            {countdown.days}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-teal-100 tracking-wider">Days</span>
                        </div>
                        <span className="text-white/60 font-black text-lg leading-none">:</span>
                        <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-center min-w-[58px] sm:min-w-[68px] shadow-lg">
                          <span className="font-mono font-black text-xl sm:text-2xl text-white block leading-none">
                            {String(countdown.hours).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-teal-100 tracking-wider">Hours</span>
                        </div>
                        <span className="text-white/60 font-black text-lg leading-none">:</span>
                        <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-center min-w-[58px] sm:min-w-[68px] shadow-lg">
                          <span className="font-mono font-black text-xl sm:text-2xl text-white block leading-none">
                            {String(countdown.minutes).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-teal-100 tracking-wider">Mins</span>
                        </div>
                        <span className="text-white/60 font-black text-lg leading-none">:</span>
                        <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-center min-w-[58px] sm:min-w-[68px] shadow-lg">
                          <span className="font-mono font-black text-xl sm:text-2xl text-[#6ffbbe] block leading-none">
                            {String(countdown.seconds).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-[#6ffbbe] tracking-wider">Secs</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {countdown.status === 'live' && (
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#10b981]/25 backdrop-blur-md border border-[#10b981]/60 text-[#6ffbbe] text-xs font-bold uppercase tracking-wider shadow-lg">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
                      </span>
                      <span>Festival Is Live · Competitions in Progress</span>
                    </div>
                  )}

                  {countdown.status === 'concluded' && (
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-bold uppercase tracking-wider shadow-md">
                      <Trophy className="w-4 h-4 text-amber-300" />
                      <span>Festival Concluded · Official Ratified Standings</span>
                    </div>
                  )}
                </div>

                {/* Call To Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => openAuth('participant', 'register')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-full text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(13,148,136,0.35)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>{pageData.hero.primaryCtaText || 'Register Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-md border border-white/25 text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-white/25 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>{pageData.hero.secondaryCtaText || 'View Schedule'}</span>
                    <ChevronRight className="w-4 h-4 text-teal-200" />
                  </button>
                </div>

                {/* Quick Chest Number Student Search Bar */}
                <div className="w-full max-w-lg mx-auto pt-4 text-left">
                  <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-[0_8px_20px_-4px_rgba(13,148,136,0.15)] border border-[#99f6e4] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="pl-2 text-[#0d9488]">
                        <Search className="w-4 h-4 text-[#0d9488]" />
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
                        className="flex-1 bg-transparent border-0 focus:outline-none text-[#0f172a] placeholder:text-slate-400 text-xs sm:text-sm py-1.5 px-1 font-medium"
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
                        className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-full text-xs font-bold transition-all shrink-0 shadow-xs active:scale-95 cursor-pointer"
                      >
                        Search
                      </button>
                    </div>

                    {/* Fast Search Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 px-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-500">Quick Lookups:</span>
                      {festParticipants.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setStudentSearchQuery(p.chestNumber || p.name);
                            setActiveTabSection('student_search');
                          }}
                          className="px-2 py-0.5 rounded-full bg-[#f0fdfa] hover:bg-[#ccfbf1] border border-[#99f6e4] text-[#0f766e] font-mono font-bold transition-colors cursor-pointer text-[10px]"
                        >
                          #{p.chestNumber || p.id}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setActiveTabSection('student_search')}
                        className="px-2 py-0.5 rounded-full bg-[#f0f9ff] hover:bg-[#e0f2fe] border border-[#bae6fd] text-[#0284c7] font-semibold transition-colors cursor-pointer text-[10px]"
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
          {/* B. 4 CIRCULAR STATS BADGES STRIP (EXACT MATCH TO REFERENCE MODEL)*/}
          {/* ================================================================ */}
          <section className="py-12 bg-[#faf8ff] border-b border-[#e2e8f0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
                
                {/* 1. Programs */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#f0fdfa] border border-[#ccfbf1] text-[#0d9488] flex items-center justify-center shadow-xs mb-3 group hover:scale-105 transition-transform">
                    <Calendar className="w-7 h-7 text-[#0d9488]" />
                  </div>
                  <span className="font-mono font-black text-3xl sm:text-4xl text-[#0f172a] block leading-none">
                    {publishedProgrammes.length > 0 ? publishedProgrammes.length : 0}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-[#0f172a] mt-2">Programs</h4>
                  <p className="text-[11px] text-[#64748b] mt-0.5">Exciting programs · Collegiate Events</p>
                </div>

                {/* 2. Participants */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#f0f9ff] border border-[#bae6fd] text-[#0284c7] flex items-center justify-center shadow-xs mb-3 group hover:scale-105 transition-transform">
                    <Users className="w-7 h-7 text-[#0284c7]" />
                  </div>
                  <span className="font-mono font-black text-3xl sm:text-4xl text-[#0f172a] block leading-none">
                    {festParticipants.length}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-[#0f172a] mt-2">Participants</h4>
                  <p className="text-[11px] text-[#64748b] mt-0.5">Talented individuals</p>
                </div>

                {/* 3. Teams */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[#d97706] flex items-center justify-center shadow-xs mb-3 group hover:scale-105 transition-transform">
                    <Award className="w-7 h-7 text-[#d97706]" />
                  </div>
                  <span className="font-mono font-black text-3xl sm:text-4xl text-[#0f172a] block leading-none">
                    {teams.length > 0 ? teams.length : 4}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-[#0f172a] mt-2">Teams</h4>
                  <p className="text-[11px] text-[#64748b] mt-0.5">Collaborating groups · Competing Houses</p>
                </div>

                {/* 4. Venues */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#10b981] flex items-center justify-center shadow-xs mb-3 group hover:scale-105 transition-transform">
                    <MapPin className="w-7 h-7 text-[#10b981]" />
                  </div>
                  <span className="font-mono font-black text-3xl sm:text-4xl text-[#0f172a] block leading-none">
                    {publishedResults.length > 0 ? publishedResults.length : 6}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-[#0f172a] mt-2">Venues</h4>
                  <p className="text-[11px] text-[#64748b] mt-0.5">Event locations · Ratified Results</p>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* C. ABOUT {FESTNAME} SECTION (MATCHING REFERENCE MODEL)           */}
          {/* ================================================================ */}
          <section className="py-16 bg-[#faf8ff] border-b border-[#e2e8f0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              {/* Centered Heading with Decorative Gradient Underline */}
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight font-display">
                  About <span className="bg-gradient-to-r from-[#00685f] via-[#0d9488] to-[#006398] bg-clip-text text-transparent">{festName}</span>
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-[#00685f] to-[#006398] rounded-full mx-auto mt-2.5"></div>
                <p className="text-xs sm:text-sm text-[#64748b] mt-2 font-medium">Festival overview</p>
              </div>

              {/* 2-Column Split: Our Vision vs Festival Image */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Column: Our Vision & Highlights */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-6 bg-[#0d9488] rounded-full"></span>
                      <h4 className="font-bold text-xl text-[#0f172a] font-display">Our Vision</h4>
                    </div>
                    <p className="text-sm text-[#334155] leading-relaxed">
                      Welcome to our festival platform. {fest?.description || pageData.hero.description || 'Welcome to our premier inter-collegiate arts and cultural championship. Designed to celebrate competitive spirit, creative expression, and authentic teamwork with real-time scoring and clash-free coordination.'}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-[#f0fdfa] text-[#0d9488] border border-[#ccfbf1] flex items-center justify-center mb-2">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs text-[#0f172a]">40+ Events</h5>
                      <p className="text-[11px] text-[#64748b] mt-0.5">Stage & literary arts</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd] flex items-center justify-center mb-2">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs text-[#0f172a]">Live Scoring</h5>
                      <p className="text-[11px] text-[#64748b] mt-0.5">Transparent tallies</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] text-[#10b981] border border-[#bbf7d0] flex items-center justify-center mb-2">
                        <Award className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs text-[#0f172a]">Honors</h5>
                      <p className="text-[11px] text-[#64748b] mt-0.5">Medals & certs</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Festival Image Showcase or Model Placeholder */}
                <div>
                  {mainFeaturedPhotos.length > 0 ? (
                    <div
                      onClick={() => setSelectedPhoto(mainFeaturedPhotos[0])}
                      className="group cursor-pointer rounded-3xl overflow-hidden bg-white border border-[#e2e8f0] shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:border-[#99f6e4] transition-all relative aspect-16/10"
                    >
                      <img
                        src={mainFeaturedPhotos[0].url}
                        alt={mainFeaturedPhotos[0].caption || 'Festival showcase'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                        <div>
                          <h5 className="text-white font-bold text-sm">{mainFeaturedPhotos[0].caption}</h5>
                          {mainFeaturedPhotos[0].description && (
                            <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{mainFeaturedPhotos[0].description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center aspect-16/10">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-[#e2e8f0] text-[#0d9488] shadow-xs flex items-center justify-center mb-3">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <h5 className="font-bold text-sm text-[#0f172a]">Festival Image</h5>
                      <p className="text-[11px] text-[#64748b] mt-1">Image placeholder for festival showcase</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* D. CHAMPIONSHIP STANDINGS (3D PODIUM) & CAMPUS GATEWAYS          */}
          {/* ================================================================ */}
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
            
            {/* Bento Row 1: Official Portals Gateway & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Official Festival Brief Card */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e2e8f0] p-6 sm:p-8 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
                      <span>Official Festival Portal</span>
                    </span>
                    <span className="text-xs text-[#64748b] font-semibold">
                      {fest?.edition || settings.festEdition || '2026 Edition'}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight leading-tight font-display">
                    {pageData.content.welcomeTitle || `Welcome to ${festName}`}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-[#334155] mt-2.5 leading-relaxed">
                    {pageData.content.welcomeMessage || fest?.description || 'Join thousands of delegates, participants, and spectators across multiple stages and auditoriums in this premier inter-collegiate cultural and arts summit.'}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
                  <span>Accredited Collegiate Championship</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className="font-bold text-[#0d9488] hover:text-[#0f766e] cursor-pointer"
                  >
                    View Timetable →
                  </button>
                </div>
              </div>

              {/* Bento Card 2: Official Portals Gateway */}
              <div className="bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-teal-700/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#89f5e7] bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-full">
                      Portals
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#6ffbbe]">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                      <span>Access Open</span>
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white tracking-tight">
                    Participant & Leader Portals
                  </h4>
                  <p className="text-xs text-teal-100/80 mt-1.5 leading-relaxed">
                    Access your live scores, view registered stage entries, or manage house contestant rosters.
                  </p>

                  <div className="space-y-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => openAuth('participant', 'signin')}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-xs font-semibold text-white group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/15 text-[#89f5e7] flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Participant Dashboard</div>
                          <div className="text-[10px] text-teal-100/70">View chest # and events</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-200/70 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openAuth('team_leader', 'signin')}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-xs font-semibold text-white group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/15 text-[#6ffbbe] flex items-center justify-center">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Team Leader Portal</div>
                          <div className="text-[10px] text-teal-100/70">Manage house contestants</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-200/70 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Fast registration CTA */}
                <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
                  <span className="text-[11px] text-teal-100/80">New participant?</span>
                  <button
                    type="button"
                    onClick={() => openAuth('participant', 'register')}
                    className="px-4 py-1.5 rounded-full bg-[#89f5e7] hover:bg-[#6bd8cb] text-[#00201d] font-bold text-xs transition-colors shadow-md cursor-pointer"
                  >
                    Register Now →
                  </button>
                </div>
              </div>
            </div>

            {/* Bento Row 2: 3D Stepped Championship Podium (Olympic Style) */}
            <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#0f766e] bg-[#f0fdfa] border border-[#99f6e4] px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Live Championship Spotlight
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight mt-1.5 font-display">
                    3D Stepped Championship Podium
                  </h4>
                  <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                    Real-time ratified scores from stage competitions and house performances.
                  </p>
                </div>

                {/* Switcher: Top Teams vs Top Students */}
                <div className="flex items-center gap-1.5 p-1 bg-[#f0fdfa] rounded-full border border-[#ccfbf1] shadow-2xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setOverviewLeaderboardToggle('team')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      overviewLeaderboardToggle === 'team'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'text-[#0f766e] hover:text-[#0d9488]'
                    }`}
                  >
                    House Championship
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewLeaderboardToggle('individual')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      overviewLeaderboardToggle === 'individual'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'text-[#0f766e] hover:text-[#0d9488]'
                    }`}
                  >
                    Star Contestants
                  </button>
                </div>
              </div>

              {/* Stepped 3D Podium Visualization */}
              {overviewLeaderboardToggle === 'team' ? (
                <div>
                  {leaderboard.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#64748b] bg-white rounded-2xl border border-[#e2e8f0]">
                      Championship house standings will appear once competitive events are ratified.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-end pt-4">
                      {/* Step 2: Silver / 2nd Place (Left) */}
                      {leaderboard[1] && (
                        <div className="order-2 md:order-1 bg-white border-2 border-[#e2e8f0] rounded-3xl p-5 md:pt-7 md:pb-6 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.05)] relative min-h-[220px]">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-black bg-[#f1f5f9] text-[#334155] px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5 border border-[#e2e8f0]">
                                <Medal className="w-3.5 h-3.5 text-slate-700" />
                                <span>2nd Place</span>
                              </span>
                              <span className="font-mono font-black text-xl text-[#0f172a]">
                                {leaderboard[1].totalPoints} pts
                              </span>
                            </div>
                            <h5 className="font-black text-base text-[#0f172a]">{leaderboard[1].team.name}</h5>
                            <p className="text-xs text-[#64748b] mt-0.5">{leaderboard[1].team.institution || 'Collegiate House'}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-medium text-[#334155]">
                            <span>🥇 {leaderboard[1].firstPlaceCount} Gold</span>
                            <span>🥈 {leaderboard[1].secondPlaceCount} Silver</span>
                            <span>🥉 {leaderboard[1].thirdPlaceCount} Bronze</span>
                          </div>
                        </div>
                      )}

                      {/* Step 1: Gold / 1st Place Champion (Center - Elevated) */}
                      {leaderboard[0] && (
                        <div className="order-1 md:order-2 bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl p-6 md:pt-9 md:pb-7 flex flex-col justify-between shadow-[0_12px_30px_rgba(13,148,136,0.15)] relative ring-4 ring-[#0d9488]/20 md:-translate-y-3 z-10 min-h-[250px]">
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white font-black text-[11px] px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                            <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                            <span>Championship Leader</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-3 mt-1">
                              <span className="text-xs font-black bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3.5 py-1.5 rounded-full shadow-xs flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-[#0d9488]" />
                                <span>1st Place</span>
                              </span>
                              <span className="font-mono font-black text-2xl text-[#0f172a]">
                                {leaderboard[0].totalPoints} pts
                              </span>
                            </div>
                            <h5 className="font-black text-lg text-[#0f172a]">{leaderboard[0].team.name}</h5>
                            <p className="text-xs text-[#64748b] font-medium mt-0.5">{leaderboard[0].team.institution || 'Collegiate House'}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#ccfbf1] flex items-center justify-between text-xs font-bold text-[#0f766e]">
                            <span>🥇 {leaderboard[0].firstPlaceCount} Gold</span>
                            <span>🥈 {leaderboard[0].secondPlaceCount} Silver</span>
                            <span>🥉 {leaderboard[0].thirdPlaceCount} Bronze</span>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Bronze / 3rd Place (Right) */}
                      {leaderboard[2] && (
                        <div className="order-3 md:order-3 bg-white border-2 border-amber-200 rounded-3xl p-5 md:pt-6 md:pb-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.04)] relative min-h-[200px]">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                                <Medal className="w-3.5 h-3.5 text-amber-800" />
                                <span>3rd Place</span>
                              </span>
                              <span className="font-mono font-black text-xl text-[#0f172a]">
                                {leaderboard[2].totalPoints} pts
                              </span>
                            </div>
                            <h5 className="font-black text-base text-[#0f172a]">{leaderboard[2].team.name}</h5>
                            <p className="text-xs text-[#64748b] mt-0.5">{leaderboard[2].team.institution || 'Collegiate House'}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-medium text-[#334155]">
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
                    <div className="p-8 text-center text-xs text-[#64748b] bg-white rounded-2xl border border-[#e2e8f0]">
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
                          className="order-2 md:order-1 bg-white border-2 border-[#e2e8f0] rounded-3xl p-5 md:pt-7 md:pb-6 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.05)] relative min-h-[220px] cursor-pointer hover:border-[#99f6e4] transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-mono font-bold text-xs bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-3 py-1 rounded-full">
                                Chest #{topIndividualContestants[1].participant.chestNumber || topIndividualContestants[1].participant.id}
                              </span>
                              <span className="font-mono font-black text-xl text-[#0f172a]">
                                {topIndividualContestants[1].totalPoints} pts
                              </span>
                            </div>
                            <h5 className="font-black text-base text-[#0f172a]">{topIndividualContestants[1].participant.name}</h5>
                            <p className="text-xs text-[#64748b] mt-0.5">
                              {topIndividualContestants[1].team?.name || 'Independent'} • {topIndividualContestants[1].category}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-medium text-[#334155]">
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
                          className="order-1 md:order-2 bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl p-6 md:pt-9 md:pb-7 flex flex-col justify-between shadow-[0_12px_30px_rgba(13,148,136,0.15)] relative ring-4 ring-[#0d9488]/20 md:-translate-y-3 z-10 min-h-[250px] cursor-pointer hover:border-[#0f766e] transition-all"
                        >
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white font-black text-[11px] px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                            <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                            <span>Golden Performer</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-3 mt-1">
                              <span className="font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full">
                                Chest #{topIndividualContestants[0].participant.chestNumber || topIndividualContestants[0].participant.id}
                              </span>
                              <span className="font-mono font-black text-2xl text-[#0f172a]">
                                {topIndividualContestants[0].totalPoints} pts
                              </span>
                            </div>
                            <h5 className="font-black text-lg text-[#0f172a]">{topIndividualContestants[0].participant.name}</h5>
                            <p className="text-xs text-[#64748b] font-medium mt-0.5">
                              {topIndividualContestants[0].team?.name || 'Independent'} • {topIndividualContestants[0].category}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#ccfbf1] flex items-center justify-between text-xs font-bold text-[#0f766e]">
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
                          className="order-3 md:order-3 bg-white border-2 border-amber-200 rounded-3xl p-5 md:pt-6 md:pb-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.04)] relative min-h-[200px] cursor-pointer hover:border-amber-300 transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full">
                                Chest #{topIndividualContestants[2].participant.chestNumber || topIndividualContestants[2].participant.id}
                              </span>
                              <span className="font-mono font-black text-xl text-[#0f172a]">
                                {topIndividualContestants[2].totalPoints} pts
                              </span>
                            </div>
                            <h5 className="font-black text-base text-[#0f172a]">{topIndividualContestants[2].participant.name}</h5>
                            <p className="text-xs text-[#64748b] mt-0.5">
                              {topIndividualContestants[2].team?.name || 'Independent'} • {topIndividualContestants[2].category}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-medium text-[#334155]">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f0fdfa] hover:bg-[#ccfbf1] text-xs sm:text-sm font-bold text-[#0d9488] border border-[#ccfbf1] transition-all cursor-pointer"
                >
                  <span>View Full Championship Leaderboards</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bento Row 3: Upcoming Programme Schedule + Campus Grounds & Stages */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Bento Card 4: Upcoming Schedule Highlights */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e2e8f0] p-6 sm:p-7 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0d9488] bg-[#f0fdfa] border border-[#ccfbf1] px-2.5 py-0.5 rounded-full">
                        Timetable
                      </span>
                      <h4 className="text-lg font-bold text-[#0f172a] tracking-tight mt-1 font-display">
                        Upcoming Programme Schedule
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTabSection('schedule')}
                      className="text-xs font-bold text-[#0d9488] hover:text-[#0f766e] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Schedule</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {publishedProgrammes.slice(0, 3).map((prg) => (
                      <div
                        key={prg.id}
                        className="p-3.5 rounded-2xl bg-[#faf8ff] border border-[#e2e8f0] flex items-center justify-between gap-3 hover:bg-[#f0fdfa] hover:border-[#99f6e4] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-xs sm:text-sm text-[#0f172a] truncate">{prg.name}</h5>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#e2e8f0] text-[#0f766e] shrink-0">
                              {prg.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#64748b] mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#0d9488]" />
                              {prg.startTime} - {prg.endTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-[#0d9488]" />
                              {prg.venue} ({prg.stage})
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-[#e2e8f0] text-[#0f766e] shrink-0">
                          {prg.type === 'individual' ? 'Solo' : 'Group'}
                        </span>
                      </div>
                    ))}
                    {publishedProgrammes.length === 0 && (
                      <p className="text-xs text-[#64748b] italic py-6 text-center">
                        Detailed stage schedules are currently being synchronized by the coordinators.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
                  <span>Auditoriums, open amphitheatre & main stages</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className="font-bold text-[#0d9488] hover:text-[#0f766e] cursor-pointer"
                  >
                    View all stages →
                  </button>
                </div>
              </div>

              {/* Bento Card 5: Festival Campus & Stage Locations */}
              <div className="bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-teal-700/40 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#89f5e7] bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-full">
                    Festival Grounds
                  </span>
                  
                  <h4 className="text-lg font-bold text-white tracking-tight mt-2.5 font-display">
                    Campus Grounds & Stages
                  </h4>
                  <p className="text-xs text-teal-100/80 mt-1 leading-relaxed">
                    Official venues, stage distribution, and campus grounds for all accredited festival events.
                  </p>

                  <div className="space-y-2.5 mt-4 text-xs">
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                      <div className="flex items-center gap-2 text-[#89f5e7] font-semibold text-[11px]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Festival Venue</span>
                      </div>
                      <div className="font-bold text-white text-sm">
                        {fest ? `${fest.venue || ''}${fest.institution ? `, ${fest.institution}` : ''}` : (pageData.content.venueInfo || settings.venue || 'Grand Campus Convention Center')}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                      <div className="flex items-center gap-2 text-[#89f5e7] font-semibold text-[11px]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Festival Dates</span>
                      </div>
                      <div className="font-bold text-white">
                        {fest?.startDate || settings.startDate} to {fest?.endDate || settings.endDate}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                      <div className="flex items-center gap-2 text-[#89f5e7] font-semibold text-[11px]">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Official Stages</span>
                      </div>
                      <div className="text-teal-100/80 text-xs">
                        Main Stage, Open Amphitheatre, Cultural Hall & Seminar Stage
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-teal-100/80">
                  <span>Entry open to contestants & delegates</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('schedule')}
                    className="text-[#89f5e7] hover:text-white font-bold cursor-pointer"
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
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight font-display">
                Get in Touch
              </h3>
              <div className="w-16 h-1 bg-gradient-to-r from-[#00685f] to-[#006398] rounded-full mx-auto mt-2.5"></div>
              <p className="text-xs sm:text-sm text-[#64748b] mt-2">
                Have questions? Want to collaborate? We'd love to hear from you!
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1.5 h-5 bg-[#0d9488] rounded-full"></span>
                <h4 className="font-bold text-base text-[#0f172a]">Send us a Message</h4>
              </div>

              {contactSent && (
                <div className="mb-4 p-4 rounded-2xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                  <span>Thank you! Your message has been sent to the festival convenors.</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">Your Name</label>
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
                      className="w-full pl-11 pr-4 py-3 bg-[#faf8ff] rounded-2xl border border-[#e2e8f0] focus:border-[#0d9488] focus:bg-white focus:outline-none text-xs sm:text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">Email Address</label>
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
                      className="w-full pl-11 pr-4 py-3 bg-[#faf8ff] rounded-2xl border border-[#e2e8f0] focus:border-[#0d9488] focus:bg-white focus:outline-none text-xs sm:text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">Your Message</label>
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
                      className="w-full pl-11 pr-4 py-3 bg-[#faf8ff] rounded-2xl border border-[#e2e8f0] focus:border-[#0d9488] focus:bg-white focus:outline-none text-xs sm:text-sm transition-all resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#00685f] to-[#006398] hover:from-[#0f766e] hover:to-[#0284c7] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider">
                Championship Standings
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a] mt-2 font-display">
                Official Festival Leaderboards
              </h3>
              <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                Real-time verified standings for competing houses and top individual student performers.
              </p>
            </div>

            {/* Main Leaderboard Switcher: Team vs Individual */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f0fdfa] rounded-full border border-[#ccfbf1] self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setLeaderboardType('team')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  leaderboardType === 'team'
                    ? 'bg-[#0d9488] text-white shadow-xs'
                    : 'text-[#0f766e] hover:text-[#0d9488]'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Team Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardType('individual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  leaderboardType === 'individual'
                    ? 'bg-[#0d9488] text-white shadow-xs'
                    : 'text-[#0f766e] hover:text-[#0d9488]'
                }`}
              >
                <Award className="w-4 h-4 text-teal-200" />
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
                  <div className="order-2 md:order-1 bg-white border border-[#e2e8f0] rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-3 py-1 rounded-full">
                          🥈 2nd Place
                        </span>
                        <span className="font-mono font-black text-xl text-[#0f172a]">
                          {leaderboard[1].totalPoints} pts
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#0f172a]">{leaderboard[1].team.name}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">{leaderboard[1].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-semibold text-[#334155]">
                      <span>🥇 {leaderboard[1].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[1].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[1].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>

                  {/* 1st Place Champion */}
                  <div className="order-1 md:order-2 bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl p-6 flex flex-col justify-between shadow-[0_12px_30px_rgba(13,148,136,0.15)] relative -translate-y-1 ring-4 ring-[#0d9488]/20">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                      Fest Leader
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className="text-xs font-black bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-[#0d9488]" />
                          1st Place Champion
                        </span>
                        <span className="font-mono font-black text-2xl text-[#0f172a]">
                          {leaderboard[0].totalPoints} pts
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-[#0f172a]">{leaderboard[0].team.name}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">{leaderboard[0].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#ccfbf1] flex items-center justify-between text-xs font-bold text-[#0f766e]">
                      <span>🥇 {leaderboard[0].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[0].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[0].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="order-3 bg-white border border-amber-200 rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full">
                          🥉 3rd Place
                        </span>
                        <span className="font-mono font-black text-xl text-[#0f172a]">
                          {leaderboard[2].totalPoints} pts
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#0f172a]">{leaderboard[2].team.name}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">{leaderboard[2].team.institution || 'Collegiate House'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-semibold text-[#334155]">
                      <span>🥇 {leaderboard[2].firstPlaceCount} Gold</span>
                      <span>🥈 {leaderboard[2].secondPlaceCount} Silver</span>
                      <span>🥉 {leaderboard[2].thirdPlaceCount} Bronze</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Team Leaderboard Table */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 bg-[#f0fdfa] border-b border-[#ccfbf1] text-xs text-[#0f766e] flex items-center justify-between">
                  <span className="font-bold text-[#0f172a]">
                    House Championship Standings — Cumulative Points from Individual & Team Programmes
                  </span>
                  <span className="font-mono text-[11px] text-[#0f766e] font-bold">Live Ratified</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[11px] bg-[#faf8ff]">
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">House / Team</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-3 text-center">🥇 Gold</th>
                        <th className="py-3 px-3 text-center">🥈 Silver</th>
                        <th className="py-3 px-3 text-center">🥉 Bronze</th>
                        <th className="py-3 px-4 text-right">Ratified Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {leaderboard.map((entry) => (
                        <tr key={entry.team.id} className="hover:bg-[#f0fdfa]/60 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                entry.rank === 1
                                  ? 'bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4]'
                                  : entry.rank === 2
                                  ? 'bg-slate-200 text-slate-900'
                                  : entry.rank === 3
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              #{entry.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0f172a]">{entry.team.name}</div>
                            <div className="font-mono text-[10px] text-[#64748b]">{entry.team.code}</div>
                          </td>
                          <td className="py-3.5 px-4 text-[#334155]">
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
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-[#0f172a]">
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
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#e2e8f0]">
                <span className="text-xs font-bold text-[#64748b] mr-1 uppercase tracking-wider">Category:</span>
                <button
                  type="button"
                  onClick={() => setLeaderboardCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    leaderboardCategory === 'all'
                      ? 'bg-[#0d9488] text-white shadow-xs'
                      : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1]'
                  }`}
                >
                  All Categories (Overall Champions)
                </button>
                {festCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setLeaderboardCategory(c.name)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      leaderboardCategory.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1]'
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
                  <div className="order-2 md:order-1 bg-white border border-[#e2e8f0] rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-3 py-1 rounded-full">
                          🥈 2nd Place
                        </span>
                        <span className="font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-2.5 py-0.5 rounded-full">
                          Chest #{individualLeaderboardData[1].participant.chestNumber || individualLeaderboardData[1].participant.id}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#0f172a]">{individualLeaderboardData[1].participant.name}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {individualLeaderboardData[1].team?.name || 'Independent'} • {individualLeaderboardData[1].category}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
                      <span className="text-xs text-[#64748b] font-medium">
                        🥇 {individualLeaderboardData[1].firstPlaceCount} • 🥈 {individualLeaderboardData[1].secondPlaceCount} • 🥉 {individualLeaderboardData[1].thirdPlaceCount}
                      </span>
                      <span className="font-mono font-black text-lg text-[#0f172a]">
                        {individualLeaderboardData[1].totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* 1st Place Individual Champion */}
                  <div className="order-1 md:order-2 bg-gradient-to-b from-[#f0fdfa] via-white to-white border-2 border-[#0d9488] rounded-3xl p-6 flex flex-col justify-between shadow-[0_12px_30px_rgba(13,148,136,0.15)] relative -translate-y-1 ring-4 ring-[#0d9488]/20">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                      Category Champion
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className="text-xs font-black bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-[#0d9488]" />
                          1st Place Champion
                        </span>
                        <span className="font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-2.5 py-1 rounded-full">
                          Chest #{individualLeaderboardData[0].participant.chestNumber || individualLeaderboardData[0].participant.id}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-[#0f172a]">{individualLeaderboardData[0].participant.name}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {individualLeaderboardData[0].team?.name || 'Independent'} • {individualLeaderboardData[0].category}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#ccfbf1] flex items-center justify-between">
                      <span className="text-xs text-[#0f766e] font-bold">
                        🥇 {individualLeaderboardData[0].firstPlaceCount} • 🥈 {individualLeaderboardData[0].secondPlaceCount} • 🥉 {individualLeaderboardData[0].thirdPlaceCount}
                      </span>
                      <span className="font-mono font-black text-2xl text-[#0f172a]">
                        {individualLeaderboardData[0].totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* 3rd Place Individual */}
                  <div className="order-3 bg-white border border-amber-200 rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full">
                          🥉 3rd Place
                        </span>
                        <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Chest #{individualLeaderboardData[2].participant.chestNumber || individualLeaderboardData[2].participant.id}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#0f172a]">{individualLeaderboardData[2].participant.name}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {individualLeaderboardData[2].team?.name || 'Independent'} • {individualLeaderboardData[2].category}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
                      <span className="text-xs text-[#64748b] font-medium">
                        🥇 {individualLeaderboardData[2].firstPlaceCount} • 🥈 {individualLeaderboardData[2].secondPlaceCount} • 🥉 {individualLeaderboardData[2].thirdPlaceCount}
                      </span>
                      <span className="font-mono font-black text-lg text-[#0f172a]">
                        {individualLeaderboardData[2].totalPoints} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Individual Leaderboard Table */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 bg-[#f0fdfa] border-b border-[#ccfbf1] text-xs text-[#0f766e] flex items-center justify-between">
                  <span className="font-bold text-[#0f172a]">
                    Individual Contestants Standings — {leaderboardCategory === 'all' ? 'All Categories' : `${leaderboardCategory} Category`}
                  </span>
                  <span className="font-mono text-[11px] text-[#0f766e] font-bold">
                    Tie-breaker: Points &gt; 1st &gt; 2nd &gt; Marks
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[11px] bg-[#faf8ff]">
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
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {individualLeaderboardData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-[#64748b]">
                            No participants scored yet in this category.
                          </td>
                        </tr>
                      ) : (
                        individualLeaderboardData.map((entry) => (
                          <tr key={entry.participant.id} className="hover:bg-[#f0fdfa]/60 transition-colors">
                            <td className="py-3.5 px-3 text-center font-mono font-bold">
                              {entry.totalPoints > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''}
                                  #{entry.rank}
                                </span>
                              ) : (
                                <span className="text-[#64748b] font-normal">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] px-2.5 py-1 rounded-full border border-[#99f6e4] shadow-2xs">
                                #{entry.participant.chestNumber || entry.participant.id}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#0f172a]">{entry.participant.name}</div>
                              <div className="font-mono text-[10px] text-[#64748b]">ID: {entry.participant.id}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#0f172a]">{entry.team?.name || 'Independent'}</div>
                              <div className="text-[10px] text-[#64748b]">{entry.team?.institution}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f766e] font-medium">
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
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0f172a] text-sm">
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
          <div className="border-b border-[#e2e8f0] pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider">
                  Official Student Directory & Live Search
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a] mt-2 font-display">
                  Student & Contestant Lookup
                </h3>
                <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                  Search any student by Chest Number or Name to inspect event schedules, registered programmes, and live points won.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold bg-[#f0fdfa] text-[#0f766e] px-3.5 py-1.5 rounded-full border border-[#ccfbf1]">
                  {festParticipants.length} Contestants Enrolled
                </span>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="mt-6 max-w-2xl">
              <div className="relative flex items-center bg-white border-2 border-[#e2e8f0] focus-within:border-[#0d9488] focus-within:ring-3 focus-within:ring-[#0d9488]/15 rounded-2xl shadow-xs transition-colors">
                <div className="pl-4 text-[#0d9488]">
                  <Search className="w-5 h-5 text-[#0d9488]" />
                </div>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by Chest Number (e.g. 104, PT-104) or Student Name..."
                  className="w-full pl-3 pr-10 py-3.5 text-sm sm:text-base text-[#0f172a] bg-transparent focus:outline-none placeholder:text-[#64748b] font-medium"
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
                <div className="p-16 text-center border-2 border-dashed border-[#e2e8f0] rounded-3xl bg-[#faf8ff] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f0fdfa] text-[#0d9488] border border-[#ccfbf1] flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-[#0f172a]">
                    No participant found matching "{studentSearchQuery}"
                  </h4>
                  <p className="text-xs text-[#64748b] max-w-md mx-auto">
                    Please verify the chest number (e.g. 101, CH-12) or try searching by the participant's full name.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#64748b] font-medium">
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
                        className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(13,148,136,0.12)] hover:border-[#99f6e4] transition-all flex flex-col justify-between space-y-4"
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4] px-3 py-1 rounded-full shadow-2xs">
                              Chest #{student.chestNumber || student.id}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1]">
                              {student.category}
                            </span>
                          </div>

                          {/* Student Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0d9488] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-base text-[#0f172a] truncate">{student.name}</h4>
                              <p className="text-xs text-[#334155] mt-0.5">
                                House: <strong className="text-[#0f172a]">{team?.name || 'Team'}</strong>
                              </p>
                              {team?.institution && (
                                <p className="text-[11px] text-[#64748b] truncate">{team.institution}</p>
                              )}
                            </div>
                          </div>

                          {/* Points & Medals Strip */}
                          <div className="mt-4 p-3 bg-[#faf8ff] border border-[#e2e8f0] rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider block">Total Points</span>
                              <span className="font-mono font-black text-base text-[#0f172a]">
                                {stats.totalPoints} pts
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider block">Medals Won</span>
                              <span className="text-xs font-bold text-[#334155]">
                                🥇 {stats.goldCount} · 🥈 {stats.silverCount} · 🥉 {stats.bronzeCount}
                              </span>
                            </div>
                          </div>

                          {/* Registered Programmes */}
                          <div className="mt-3.5 space-y-1.5">
                            <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider block">
                              Events ({studentProgs.length})
                            </span>
                            {studentProgs.length === 0 ? (
                              <p className="text-xs text-[#64748b] italic">No events assigned yet.</p>
                            ) : (
                              studentProgs.slice(0, 3).map((prg) => {
                                const res = stats.studentResults.find((r) => r.programmeId === prg.id);
                                return (
                                  <div
                                    key={prg.id}
                                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#faf8ff] border border-[#e2e8f0]"
                                  >
                                    <span className="font-medium text-[#0f172a] truncate max-w-[170px]">
                                      {prg.name}
                                    </span>
                                    {res ? (
                                      <span className="font-mono font-bold text-[11px] text-[#0f766e] bg-[#ccfbf1] px-2 py-0.5 rounded-full border border-[#99f6e4]">
                                        Rank #{res.rank} (+{res.pointsAwarded} pts)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-[#64748b] font-medium">
                                        {prg.venue || 'Scheduled'}
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                            {studentProgs.length > 3 && (
                              <span className="text-[11px] text-[#64748b] block pt-0.5">
                                +{studentProgs.length - 3} more events
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View Card Button */}
                        <div className="pt-2 border-t border-[#e2e8f0]">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForModal(student)}
                            className="w-full py-2 px-3 text-xs font-bold text-[#0f766e] bg-[#f0fdfa] border border-[#ccfbf1] rounded-full hover:bg-[#ccfbf1] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5 text-[#0d9488]" />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f172a] font-display">
                Official Photo Gallery
              </h3>
              <p className="text-xs text-[#64748b] mt-1">
                Admin-curated captures and stage recordings across all festival programs.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#0d9488] text-white shadow-xs font-bold'
                      : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredGalleryPhotos.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-[#e2e8f0] rounded-2xl bg-[#faf8ff]">
              <ImageIcon className="w-10 h-10 text-[#0d9488]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0f172a]">No photos in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGalleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-[#e2e8f0] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(13,148,136,0.12)] hover:border-[#99f6e4] transition-all flex flex-col"
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
                    <span className="text-[10px] font-bold text-[#0d9488] uppercase tracking-wider block">
                      {photo.category || 'General'}
                    </span>
                    <h4 className="text-xs font-bold text-[#0f172a] mt-0.5 truncate group-hover:text-[#0d9488] transition-colors">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f172a] font-display">
                Official Festival Results & Standings
              </h3>
              <p className="text-xs text-[#64748b] mt-1">
                Ratified results, championship team standings, and category individual scoreboards.
              </p>
            </div>

            {/* Sub-Tabs: Programmes vs Team Leaderboard vs Individual Scoreboards */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f0fdfa] rounded-full border border-[#ccfbf1] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setResultsSubTab('programmes')}
                className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                  resultsSubTab === 'programmes'
                    ? 'bg-[#0d9488] text-white shadow-2xs font-bold'
                    : 'text-[#0f766e] hover:text-[#0d9488]'
                }`}
              >
                Event Results
              </button>
              <button
                type="button"
                onClick={() => setResultsSubTab('team_scoreboard')}
                className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                  resultsSubTab === 'team_scoreboard'
                    ? 'bg-[#0d9488] text-white shadow-2xs font-bold'
                    : 'text-[#0f766e] hover:text-[#0d9488]'
                }`}
              >
                Team Scoreboard
              </button>
              <button
                type="button"
                onClick={() => setResultsSubTab('category_scoreboards')}
                className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                  resultsSubTab === 'category_scoreboards'
                    ? 'bg-[#0d9488] text-white shadow-2xs font-bold'
                    : 'text-[#0f766e] hover:text-[#0d9488]'
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
                <div className="p-12 text-center border border-[#e2e8f0] rounded-2xl bg-[#faf8ff] text-xs text-[#64748b]">
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
                        className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#99f6e4] transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              r.rank === 1
                                ? 'bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4]'
                                : r.rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : r.rank === 3
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              Rank #{r.rank}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isTeam
                                ? 'bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]'
                                : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1]'
                            }`}>
                              {isTeam ? 'Team Programme' : 'Individual'}
                            </span>
                            {r.category && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#faf8ff] text-[#64748b] border border-[#e2e8f0] font-medium">
                                {r.category}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-[#0f172a]">
                            {r.programmeName || prog?.name || 'Programme Event'}
                          </h4>

                          <p className="text-xs text-[#334155]">
                            {isTeam ? (
                              <>
                                Winning Entry: <strong className="text-[#0284c7] font-bold">{r.entryName || 'Squad Entry'}</strong>
                                {' '}• Representing <strong className="text-[#0f172a]">{r.teamName}</strong>
                              </>
                            ) : (
                              <>
                                Winner: <strong className="text-[#0f172a] font-bold">{r.participantName || 'Contestant'}</strong>
                                {' '}• <span className="text-[#334155]">{r.teamName}</span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-base font-mono font-bold text-[#0f172a]">
                            +{r.pointsAwarded} pts
                          </div>
                          {r.publishedAt && (
                            <span className="text-[11px] text-[#64748b]">
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
            <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-[#f0fdfa] border-b border-[#ccfbf1] text-xs text-[#0f766e] flex items-center justify-between">
                <span>
                  Official House Championship Standings. Points from both Individual and Team Programmes accrue to the team.
                </span>
                <span className="font-mono text-[11px] text-[#0f766e] font-bold">Live Ratified Standings</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[11px] bg-[#faf8ff]">
                      <th className="py-3 px-4 text-center w-16">Rank</th>
                      <th className="py-3 px-4">House / Team</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-3 text-center">🥇 Gold</th>
                      <th className="py-3 px-3 text-center">🥈 Silver</th>
                      <th className="py-3 px-3 text-center">🥉 Bronze</th>
                      <th className="py-3 px-4 text-right">Ratified Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {leaderboard.map((entry) => (
                      <tr key={entry.team.id} className="hover:bg-[#f0fdfa]/60 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              entry.rank === 1
                                ? 'bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4]'
                                : entry.rank === 2
                                ? 'bg-slate-200 text-slate-900'
                                : entry.rank === 3
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0f172a]">{entry.team.name}</div>
                          <div className="font-mono text-[10px] text-[#64748b]">{entry.team.code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#334155]">
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
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-[#0f172a]">
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
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#e2e8f0]">
                <span className="text-xs font-semibold text-[#64748b] mr-1">Category:</span>
                {festCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedPublicCategory(c.name)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedPublicCategory.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-[#0d9488] text-white shadow-xs font-bold'
                        : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] hover:bg-[#ccfbf1]'
                    }`}
                  >
                    {c.name} {c.isGeneral ? '(General / Any Age)' : ''}
                  </button>
                ))}
              </div>

              <div className="p-3.5 bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl text-xs text-[#0f766e] flex items-center justify-between">
                <span>
                  Official individual rankings for <strong>{selectedPublicCategory} Category</strong>. Individual scores are attributed solely to individual competitors. Team programme scores are kept separate.
                </span>
                <span className="font-mono text-[#0f766e] text-[11px] font-bold">
                  Tie-breaker: Points &gt; 1st &gt; 2nd &gt; Marks
                </span>
              </div>

              {(() => {
                const scoreboard = getCategoryScoreboard(selectedPublicCategory);
                if (scoreboard.length === 0) {
                  return (
                    <div className="py-12 text-center text-[#64748b] bg-white border border-[#e2e8f0] rounded-2xl">
                      No participants registered or scored in {selectedPublicCategory} category.
                    </div>
                  );
                }

                return (
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[11px] bg-[#faf8ff]">
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
                        <tbody className="divide-y divide-[#f1f5f9]">
                          {scoreboard.map((entry) => (
                            <tr key={entry.participant.id} className="hover:bg-[#f0fdfa]/60 transition-colors">
                              <td className="py-3 px-3 text-center font-mono font-bold">
                                {entry.totalPoints > 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''}
                                    #{entry.rank}
                                  </span>
                                ) : (
                                  <span className="text-[#64748b] font-normal">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#0f172a]">{entry.participant.name}</div>
                                <div className="font-mono text-[10px] text-[#64748b]">{entry.participant.id}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-[#0f172a]">{entry.team?.name || 'Independent'}</div>
                                <div className="text-[10px] text-[#64748b]">{entry.team?.institution}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f766e] font-medium">
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
                              <td className="py-3 px-2 text-center font-mono text-[#334155]">
                                {entry.totalMarks}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-[#0f172a] text-sm">
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
          <div className="border-b border-[#e2e8f0] pb-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-[#0f172a] font-display">
              Festival Timetable & Stages
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              Official schedule for stage events, contests, and ceremonies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedProgrammes.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] flex items-start gap-3.5 hover:border-[#99f6e4] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f0fdfa] border border-[#ccfbf1] text-[#0d9488] flex items-center justify-center font-bold text-xs shrink-0">
                  <Clock className="w-4 h-4 text-[#0d9488]" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-[#0d9488] uppercase tracking-wider">
                    {p.category}
                  </span>
                  <h4 className="text-sm font-bold text-[#0f172a] mt-0.5">{p.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-[#64748b] mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0d9488]" />
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
          <div className="border-b border-[#e2e8f0] pb-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-[#0f172a] font-display">
              Participating Houses & Teams
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              Official houses competing in {settings.festName}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] space-y-3 hover:border-[#99f6e4] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#0d9488] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {t.code}
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0d9488]">
                    {(t.totalPoints ?? t.totalScore) ?? results.filter((r) => r.teamId === t.id && r.published).reduce((sum, r) => sum + (r.pointsAwarded || 0), 0)} pts
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0f172a]">{t.name}</h4>
                  <p className="text-xs text-[#64748b] mt-0.5">{t.institution || 'Collegiate House'}</p>
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
          <div className="border-b border-[#e2e8f0] pb-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-[#0f172a] font-display">
              Official Bulletins & Notices
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              Real-time notices and schedule updates from the Fest Administration.
            </p>
          </div>

          {publicAnnouncements.length === 0 ? (
            <div className="p-12 text-center border border-[#e2e8f0] rounded-2xl bg-[#faf8ff] text-xs text-[#64748b]">
              No public notices posted at this moment.
            </div>
          ) : (
            <div className="space-y-4">
              {publicAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] space-y-2 hover:border-[#99f6e4] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0d9488] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#0d9488]" />
                      {a.category || 'General Notice'}
                    </span>
                    <span className="text-xs text-[#64748b]">{a.createdAt?.slice(0, 10)}</span>
                  </div>
                  <h4 className="text-base font-bold text-[#0f172a]">{a.title}</h4>
                  <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line">{a.content}</p>
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
      {/* FLOATING BOTTOM NAVIGATION PILL DOCK (MATCHING REFERENCE MODEL)      */}
      {/* ==================================================================== */}
      <aside aria-label="Quick festival navigation" className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-[#e2e8f0] rounded-full px-2 sm:px-3 py-1.5 shadow-[0_12px_36px_-6px_rgba(15,23,42,0.18)] flex items-center gap-1 sm:gap-1.5 ring-1 ring-black/5">
          {/* Brand Monogram */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00685f] to-[#0d9488] flex items-center justify-center text-white font-extrabold text-xs shrink-0 select-none shadow-xs ml-1 mr-0.5">
            <span>{festName.charAt(0) || 'F'}</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTabSection('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTabSection === 'overview'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-[#334155] hover:text-[#0d9488] hover:bg-[#f0fdfa]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTabSection === 'schedule'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-[#334155] hover:text-[#0d9488] hover:bg-[#f0fdfa]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Schedules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('results')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTabSection === 'results'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-[#334155] hover:text-[#0d9488] hover:bg-[#f0fdfa]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Results</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('student_search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTabSection === 'student_search'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-[#334155] hover:text-[#0d9488] hover:bg-[#f0fdfa]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Result</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('bulletin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTabSection === 'bulletin'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-[#334155] hover:text-[#0d9488] hover:bg-[#f0fdfa]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Downloads</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTabSection === 'gallery'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-[#334155] hover:text-[#0d9488] hover:bg-[#f0fdfa]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Wall</span>
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 10. DARK FESTIVAL FOOTER (MATCHING REFERENCE MODEL)                  */}
      {/* ==================================================================== */}
      <footer className="mt-auto bg-[#0b1120] text-slate-300 pt-16 pb-28 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Fest Brand & Copyright */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00685f] to-[#0d9488] flex items-center justify-center text-white font-black text-sm shadow-md select-none">
                  <span>{festName.charAt(0) || 'F'}</span>
                </div>
                <span className="text-xl font-black text-white tracking-tight font-display">
                  {festName}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                {fest?.description || 'The official autonomous digital festival portal powered by Festoria OS.'}
              </p>
              <div className="text-[11px] text-slate-500 pt-1">
                © {new Date().getFullYear()} {festName}. All rights reserved.
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Quick Links
              </h5>
              <ul className="space-y-2.5 text-xs text-slate-400">
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
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Made with
              </span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  <span>F</span>
                </div>
                <span className="font-extrabold text-white text-base font-display">
                  Festoria
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage registrations, scheduling, scoring, and results — all in one platform. No paperwork, no chaos. Just smooth fests, every time.
              </p>
              <div className="pt-2">
                <a
                  href={getAppUrl()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#00685f] to-[#0d9488] hover:from-[#0f766e] hover:to-[#0f766e] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <span>Create Your Own Fest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Sub Footer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                OS
              </div>
              <span>Powered by Festoria Festival Operating System</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms and Conditions</a>
              <a href="#contact" className="hover:text-slate-300 transition-colors">Contact Us</a>
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
              className="max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#e2e8f0]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#06332e] to-[#00685f] text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="absolute top-4 right-4 p-1.5 text-teal-200 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono font-bold text-xs bg-[#ccfbf1] text-[#0f766e] px-3.5 py-1 rounded-full shadow-xs">
                    Chest #{student.chestNumber || student.id}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-teal-100">
                    {student.category}
                  </span>
                  <span className="text-[10px] font-mono text-teal-200/70">ID: {student.id}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display">{student.name}</h3>
                <p className="text-xs text-teal-100/90 mt-1">
                  Representing <strong className="text-white font-bold">{team?.name || 'Independent'}</strong>
                  {team?.institution ? ` • ${team.institution}` : ''}
                </p>
              </div>

              {/* Statistics Strip */}
              <div className="p-5 border-b border-[#e2e8f0] bg-[#faf8ff] grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block">
                    Total Individual Points
                  </span>
                  <span className="font-mono font-black text-2xl text-[#0f172a] mt-0.5 block">
                    {stats.totalPoints} pts
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block">
                    Medals Won
                  </span>
                  <span className="text-sm font-black text-[#0f172a] mt-1.5 block">
                    🥇 {stats.goldCount} · 🥈 {stats.silverCount} · 🥉 {stats.bronzeCount}
                  </span>
                </div>
              </div>

              {/* Registered Programmes Detail */}
              <div className="p-6 space-y-3 max-h-72 overflow-y-auto">
                <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Registered Programmes ({studentProgs.length})
                </h4>

                {studentProgs.length === 0 ? (
                  <p className="text-xs text-[#64748b] italic">No programmes registered yet.</p>
                ) : (
                  studentProgs.map((prg) => {
                    const res = stats.studentResults.find((r) => r.programmeId === prg.id);
                    return (
                      <div
                        key={prg.id}
                        className="p-3 rounded-2xl border border-[#e2e8f0] bg-white shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-sm text-[#0f172a]">{prg.name}</h5>
                          {res ? (
                            <span className="font-mono font-black text-xs text-[#0f766e] bg-[#ccfbf1] px-2.5 py-0.5 rounded-full border border-[#99f6e4]">
                              Rank #{res.rank} (+{res.pointsAwarded} pts)
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Scheduled
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#64748b]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                            {prg.startTime} - {prg.endTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#0d9488]" />
                            {prg.venue} ({prg.stage})
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Modal Action */}
              <div className="p-4 bg-[#faf8ff] border-t border-[#e2e8f0] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-full text-xs font-bold transition-colors shadow-xs cursor-pointer"
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
            <div className="w-full max-w-sm sm:max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#e2e8f0] animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#faf8ff]">
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
                      className="w-8 h-8 rounded-xl object-contain border border-[#e2e8f0] bg-white p-0.5"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-[#0f172a] truncate font-display">{festName}</h3>
                    <p className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider truncate">
                      {fest?.institution ? `${fest.institution} · ` : ''}{fest?.edition || settings.festEdition || 'Official Festival Portal'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-[#f0fdfa] transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Fast Action Card (Register & Sign In) */}
                <div className="bg-gradient-to-br from-[#06332e] via-[#00685f] to-[#044c69] rounded-2xl p-4 text-white shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#89f5e7]">
                      Contestant Access
                    </span>
                    <span className="text-[10px] bg-white/15 text-[#89f5e7] border border-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                      Live
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Join as a Participant</h4>
                    <p className="text-[11px] text-teal-100/80 mt-0.5">
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
                      className="w-full py-2 px-3 rounded-full bg-[#89f5e7] hover:bg-[#6bd8cb] text-[#00201d] text-xs font-bold transition-colors text-center shadow-md cursor-pointer"
                    >
                      Register Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDrawerOpen(false);
                        openAuth('participant', 'signin');
                      }}
                      className="w-full py-2 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors text-center cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                {/* Festival Navigation Sections */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2 px-2">
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
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#f0fdfa] text-[#0d9488] font-bold border border-[#ccfbf1] shadow-2xs'
                              : 'text-[#334155] hover:bg-[#faf8ff] hover:text-[#0d9488]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComp className={`w-4 h-4 ${isActive ? 'text-[#0d9488]' : 'text-[#64748b]'}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isActive ? 'bg-[#0d9488] text-white' : 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1]'
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
                  <h4 className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2 px-2">
                    Portals & Management
                  </h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDrawerOpen(false);
                        openAuth('team_leader', 'signin');
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#334155] hover:bg-[#f0fdfa] hover:text-[#0d9488] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-[#0284c7]" />
                        <span>Team Leader Portal</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <a
                      href={getAppUrl('admin.html')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#334155] hover:bg-[#f0fdfa] hover:text-[#0d9488] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[#0d9488]" />
                        <span>Fest Admin Console</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>

                    <a
                      href={getAppUrl()}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#334155] hover:bg-[#f0fdfa] hover:text-[#0d9488] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-[#0d9488]" />
                        <span>Festoria Platform Home</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </a>
                  </div>
                </div>

                {/* Festival Grounds & Edition Info */}
                <div className="p-4 bg-[#faf8ff] rounded-2xl border border-[#e2e8f0] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-[#0f172a]">Festival Info</h5>
                    <span className="text-[10px] bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] font-semibold px-2.5 py-0.5 rounded-full">
                      {fest?.edition || 'Official Edition'}
                    </span>
                  </div>
                  <div className="text-[#334155] space-y-1.5 text-[11px] pt-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0d9488] shrink-0 mt-0.5" />
                      <span>Venue: <strong className="text-[#0f172a]">{fest?.venue || settings.venue || 'Campus Convention Grounds'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0d9488] shrink-0" />
                      <span>Dates: <strong className="text-[#0f172a]">{fest?.startDate || settings.startDate} to {fest?.endDate || settings.endDate}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#e2e8f0] bg-[#faf8ff] text-center text-[11px] text-[#64748b]">
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
