import React, { useState, useEffect, useRef } from 'react';
import { useFest } from '../../context/FestContext';
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
  Image as ImageIcon
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
    programmes,
    results,
    announcements,
    activeFestId
  } = useFest();

  const targetFestId = propFestId || activeFestId || 'FEST-01';

  const [pageData, setPageData] = useState<FestPublicPageData>(
    previewData || getDefaultFestPublicPage(targetFestId, settings.festName)
  );

  const [activeTabSection, setActiveTabSection] = useState<
    'overview' | 'results' | 'schedule' | 'teams' | 'gallery' | 'bulletin'
  >('overview');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | 'participant' | 'auto'>('participant');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

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
        const published = await fetchPublishedFestPage(targetFestId, settings.festName);
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
  }, [targetFestId, previewData, settings.festName]);

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
    setAuthRole(role);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const publishedResults = results.filter((r) => r.published);
  const publicAnnouncements = announcements.filter((a) => a.isPublic);
  const publishedProgrammes = programmes.filter((p) => p.status !== 'draft');

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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. PUBLIC TOP NAVIGATION                                             */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {pageData.logo.logoUrl ? (
            <img
              src={pageData.logo.logoUrl}
              alt={settings.festName}
              style={{ width: `${pageData.logo.widthPx || 120}px` }}
              className="h-9 object-contain"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-widest shadow-xs">
              {settings.festName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
              {settings.festName}
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
              {settings.festEdition || 'Official Festival Portal'}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAuth('participant', 'register')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Register Now</span>
          </button>

          <button
            type="button"
            onClick={() => openAuth('participant', 'signin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION WITH ADMIN-MANAGED VIDEO & FALLBACKS                 */}
      {/* ==================================================================== */}
      <section className="relative min-h-[520px] lg:min-h-[620px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
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
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
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
            <span>{settings.festEdition || 'Annual Inter-Collegiate Fest'}</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {pageData.hero.heading}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {pageData.hero.description}
          </p>

          {/* Meta Info Bar (Dates, Venue, Host) */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{settings.startDate} to {settings.endDate}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>{settings.venue || 'Grand University Campus'}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => openAuth('participant', 'register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-950 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-100 transition-all shadow-lg hover:scale-102"
            >
              <span>{pageData.hero.primaryCtaText || 'Register Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTabSection('schedule')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-white/20 transition-all"
            >
              <span>{pageData.hero.secondaryCtaText || 'View Schedule'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
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
      {/* 4. OVERVIEW SECTION: ABOUT & SCHEDULE HIGHLIGHTS                     */}
      {/* ==================================================================== */}
      {activeTabSection === 'overview' && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          {/* Welcome & Highlights Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Welcome
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {pageData.content.welcomeTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {pageData.content.welcomeMessage}
              </p>
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Festival Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pageData.content.highlights.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Portal Access Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-5 shadow-xl border border-slate-800">
              <div>
                <h4 className="text-sm font-bold tracking-tight text-white">
                  Participant & Leader Portals
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Access live scores, verify team assignments, or register as an official contestant.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => openAuth('participant', 'signin')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-xs font-semibold text-white"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-300" />
                    <span>Participant Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => openAuth('team_leader', 'signin')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-xs font-semibold text-white"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-300" />
                    <span>Team Leader Portal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Venue: <strong className="text-slate-200">{pageData.content.venueInfo}</strong></div>
                <div>Contact: <a href={`mailto:${pageData.content.contactEmail}`} className="text-indigo-400 hover:underline">{pageData.content.contactEmail}</a></div>
              </div>
            </div>
          </div>
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
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Approved Results
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ratified results published by the Fest Administrator and Jury.
            </p>
          </div>

          {publishedResults.length === 0 ? (
            <div className="p-12 text-center border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
              No results have been published yet. Please check back as programmes conclude.
            </div>
          ) : (
            <div className="space-y-4">
              {publishedResults.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold uppercase">
                      Rank {r.rank}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {r.programmeName || programmes.find((p) => p.id === r.programmeId)?.name || 'Programme Event'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Winning House: <strong className="text-slate-800">{r.teamName}</strong> • {r.pointsAwarded} points awarded
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Published {r.publishedAt?.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
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
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {settings.festName}. Powered by Festoria Festival Management System.</p>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-slate-900 font-semibold">Festoria Home</a>
            <a href="/admin.html" className="hover:text-slate-900 font-semibold">Admin Sign In</a>
          </div>
        </div>
      </footer>

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
