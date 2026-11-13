import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal as AuthModal } from '../../components/common/PhoneAuthModal';
import { CreateFestModal } from '../../components/public/CreateFestModal';
import { Role } from '../../types';
import { getAppUrl, navigateTo } from '../../utils/navigation';
import { FESTORIA_LOGO, handleLogoError } from '../../utils/logo';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  Calendar,
  Clock,
  Award,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Lock,
  Users,
  Globe,
  AlertTriangle,
  Scale,
  Compass,
  ExternalLink,
  Activity,
  Menu,
  X,
  Mail,
  Phone,
  Trophy,
  Zap,
  Check
} from 'lucide-react';

export const FestoriaHomePage: React.FC = () => {
  const { fests, setActiveFestId } = useFest();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | 'participant' | 'auto'>('auto');
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [createFestModalOpen, setCreateFestModalOpen] = useState(false);
  const [createFestInitialTab, setCreateFestInitialTab] = useState<'apply' | 'track'>('apply');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active feature tab in the split showcase section
  const [activeFeatureTab, setActiveFeatureTab] = useState<'candidates' | 'schedule' | 'judging'>('candidates');

  // Respond to URL action parameters (e.g. ?action=register)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const action = search.get('action') || search.get('register');
      if (action === 'register' || action === 'true' || action === 'participant') {
        setAuthRole('participant');
        setAuthModalMode('register');
        setAuthModalOpen(true);
      }
    }
  }, []);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const openAuth = (role: Role | 'participant' | 'auto' = 'auto') => {
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  const openCreateFest = (tab: 'apply' | 'track' = 'apply') => {
    setCreateFestInitialTab(tab);
    setCreateFestModalOpen(true);
  };

  // Ticker items for infinite horizontal marquee
  const tickerPills = [
    'Digital Judging',
    'Live Leaderboard',
    'Bulk Candidate Entry',
    'Auto Stage Schedule',
    'Certificate Verification',
    'QR Contestant Passes',
    '3D Stepped Championship Podium',
    'House Standings',
    'Chest Number Search',
    'Grievance Appeals',
    'Public Fest Portals',
    'Result Publishing',
    'ID Card Generator',
    'Poster Generator',
    'Team Manager Access'
  ];

  return (
    <div className="min-h-screen min-h-dvh bg-[#f84454] text-[#0f172a] flex flex-col font-display selection:bg-[#0f172a] selection:text-white relative overflow-x-hidden">
      {/* Subtle festive wave texture watermark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q30 0 60 15 T120 15' fill='none' stroke='%23ffffff' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 30px'
        }}
      />

      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR — CLEAN FESTIVAL HEADER                                */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-50 bg-[#f84454]/95 backdrop-blur-md border-b border-white/15 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {/* Festoria Monogram Logo */}
          <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-sm flex items-center justify-center">
            <img
              src={FESTORIA_LOGO}
              alt="Festoria Logo"
              onError={handleLogoError}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              FESTORIA
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffe066] animate-pulse" />
              Fest OS
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-white/90">
          <a href="#features" className="hover:text-amber-200 transition-colors py-2">
            Features
          </a>
          <a href="#fest-showcase" className="hover:text-amber-200 transition-colors py-2">
            Ecosystem
          </a>
          <a href="#fest-directory" className="hover:text-amber-200 transition-colors py-2">
            Festivals
          </a>
          <a href="#helpdesk" className="hover:text-amber-200 transition-colors py-2">
            Official Helpdesk
          </a>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openCreateFest('track')}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white hover:text-amber-200 transition-colors"
          >
            <Compass className="w-4 h-4 text-amber-200" />
            <span>Track Application</span>
          </button>

          <button
            type="button"
            onClick={() => openAuth('auto')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white hover:text-amber-200 transition-colors"
          >
            <span>Sign In</span>
          </button>

          {/* Clean White Rounded-Full Pill CTA Button */}
          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#f84454] text-xs sm:text-sm font-black shadow-md hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-[#f84454]" />
            <span>Start Free Trial</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <img
                    src={FESTORIA_LOGO}
                    alt="Festoria Logo"
                    onError={handleLogoError}
                    className="w-8 h-8 rounded-lg object-contain bg-slate-100"
                  />
                  <span className="font-black text-[#0f172a] text-lg">Festoria</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col space-y-2 text-sm font-bold text-slate-700">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-rose-50 hover:text-[#f84454]"
                >
                  Features & Capabilities
                </a>
                <a
                  href="#fest-showcase"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-rose-50 hover:text-[#f84454]"
                >
                  Active Ecosystem
                </a>
                <a
                  href="#fest-directory"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-rose-50 hover:text-[#f84454]"
                >
                  Explore Festivals
                </a>
                <a
                  href="#helpdesk"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-rose-50 hover:text-[#f84454]"
                >
                  Official Helpdesk
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCreateFest('track');
                  }}
                  className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-[#f84454]" />
                  <span>Track Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('auto');
                  }}
                  className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCreateFest('apply');
                  }}
                  className="w-full text-center px-6 py-3 rounded-full bg-[#f84454] text-white font-black shadow-md mt-4"
                >
                  Create New Fest
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-2">
              <a href="tel:9844691633" className="flex items-center gap-2 text-slate-700 font-bold">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>9844691633</span>
              </a>
              <a href="mailto:abdwahidbc@gmail.com" className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>abdwahidbc@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. HERO SECTION — INSPIRATION LAYOUT: MAKE YOUR FEST ALIVE           */}
      {/* ==================================================================== */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
          {/* Main Impact Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black uppercase tracking-[-0.035em] leading-[0.92] select-none">
            <span className="text-[#0f172a] block sm:inline sm:mr-4">MAKE YOUR</span>
            <span className="text-[#ffe066] block sm:inline">FEST</span>
            <span className="text-white block mt-1 sm:mt-2">ALIVE</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-white/95 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xs">
            Trusted by 1200+ fest coordinators and deaneries to run the big day without chaos.
            From registration to results, ID cards, congratulation posters, and certificates — everything on one desk, built for the coordinators who make fests alive.
          </p>

          {/* Clean Pill Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0f172a] text-white text-sm font-black shadow-xl hover:bg-black hover:scale-105 active:scale-95 transition-all min-h-[48px]"
            >
              <span>Create Your Fest</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>

            <a
              href="#fest-directory"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#0f172a] text-sm font-black shadow-xl hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all min-h-[48px]"
            >
              <Globe className="w-4 h-4 text-[#f84454]" />
              <span>Explore Active Festivals</span>
            </a>
          </div>

          {/* Quick status trust bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#ffe066]" /> Conflict-Free Automated Slotting
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#ffe066]" /> Tamper-Proof Digital Judging
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#ffe066]" /> Instant Public Live Portals
            </span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. CURVED WHITE BANNER — CLIENT FESTS SHOWCASE (INSPIRATION IMAGE 2) */}
      {/* ==================================================================== */}
      <section id="fest-showcase" className="px-4 sm:px-8 max-w-6xl mx-auto -mb-6 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Trusted by Campus Arts, Cultural & Sports Festivals
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center justify-center text-center">
            {/* Fest 1: Al Murafaqa */}
            <a
              href="?fest=al-murafaqa-2026"
              className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200/80 transition-all group"
            >
              <div className="text-xs font-mono font-bold text-[#f84454]">وفاق</div>
              <div className="text-sm font-black text-slate-900 group-hover:text-[#f84454] transition-colors truncate">
                Al Murafaqa
              </div>
              <span className="text-[10px] text-slate-500">Muyisunnha 2026</span>
            </a>

            {/* Fest 2: Matrix */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-mono font-bold text-indigo-600">MATRIX</div>
              <div className="text-sm font-black text-slate-900 truncate">DH Arts Fest</div>
              <span className="text-[10px] text-slate-500">Campus 2025</span>
            </div>

            {/* Fest 3: Sulook */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-mono font-bold text-amber-500">SULOOK</div>
              <div className="text-sm font-black text-slate-900 truncate">Shams Arts Fest</div>
              <span className="text-[10px] text-slate-500">Edition 2025</span>
            </div>

            {/* Fest 4: Alwanique */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-mono font-bold text-emerald-600">ALWANIQUE</div>
              <div className="text-sm font-black text-slate-900 truncate">Darunnoor Fest</div>
              <span className="text-[10px] text-slate-500">Sports & Arts</span>
            </div>

            {/* Fest 5: Festoria Core */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
              <div className="text-xs font-mono font-bold text-[#f84454]">FESTORIA</div>
              <div className="text-sm font-black text-slate-900 truncate">Collegiate OS</div>
              <span className="text-[10px] text-slate-500">Multi-Fest Hub</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. SPLIT FEATURE SHOWCASE — BULK ENTRY, SKIP THE HURRY (IMAGE 2)      */}
      {/* ==================================================================== */}
      <section id="features" className="py-24 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headline, copy, and clean white pill button */}
          <div className="lg:col-span-5 space-y-6 text-white text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Candidate Management</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
              Bulk Entry, Skip the Hurry
            </h2>

            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
              Upload participant details in bulk and get your candidates organized in minutes—not hours. Bulk Entry removes repetitive data entry, reduces mistakes, and helps your team prepare large participant lists faster.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => openCreateFest('apply')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#f84454] font-black text-sm shadow-xl hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all min-h-[48px]"
              >
                <span>Create my fest</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Cascading grid of translucent glass cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Tile 1 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Globe className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">Launch Your Festival Online</h3>
              <p className="text-xs text-white/80 leading-relaxed">Dedicated public portal partition for contestants and audience.</p>
            </div>

            {/* Tile 2 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Activity className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">See What's Happening at a Glance</h3>
              <p className="text-xs text-white/80 leading-relaxed">Real-time run-of-show cues and multi-stage status monitoring.</p>
            </div>

            {/* Tile 3 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Scale className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">Give Judges the Tools to Score With Confidence</h3>
              <p className="text-xs text-white/80 leading-relaxed">Multi-criteria weightages and digital quorum ratifications.</p>
            </div>

            {/* Tile 4 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Clock className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">Conflict-Free Stage Schedules</h3>
              <p className="text-xs text-white/80 leading-relaxed">Automatic overlap detection across concurrent auditoriums.</p>
            </div>

            {/* Tile 5 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Award className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">Give Every Achievement a Lasting Memory</h3>
              <p className="text-xs text-white/80 leading-relaxed">Digital verified medals and instant congratulation certificates.</p>
            </div>

            {/* Tile 6 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Trophy className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">3D Stepped Championship Podium</h3>
              <p className="text-xs text-white/80 leading-relaxed">Gold, Silver, Bronze house rankings with dynamic point tallies.</p>
            </div>

            {/* Tile 7 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Sparkles className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">Celebrate Every Festival Moment</h3>
              <p className="text-xs text-white/80 leading-relaxed">Instant live leaderboard updates and winner notifications.</p>
            </div>

            {/* Tile 8 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <Layers className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">Build Your Festival Your Way</h3>
              <p className="text-xs text-white/80 leading-relaxed">Custom categories, individual codes, and flexible stage rules.</p>
            </div>

            {/* Tile 9 */}
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-3 hover:bg-white/25 hover:-translate-y-1 transition-all">
              <CheckCircle2 className="w-6 h-6 text-white" />
              <h3 className="font-bold text-sm leading-snug">Make Every Participant Feel Official</h3>
              <p className="text-xs text-white/80 leading-relaxed">Individual chest number lookups, passes, and schedule drawers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. INFINITE TICKER STRIP — PILL BADGES (MATCHING IMAGE 2 BOTTOM)     */}
      {/* ==================================================================== */}
      <div className="py-6 overflow-hidden bg-black/10 border-y border-white/10 select-none">
        <div className="animate-marquee flex items-center gap-3 whitespace-nowrap">
          {tickerPills.concat(tickerPills).map((pill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#f84454] text-xs font-black shadow-md hover:scale-105 transition-transform"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f84454]" />
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. FESTIVAL DIRECTORY — DIRECT PORTALS TO CAMPUS FESTS               */}
      {/* ==================================================================== */}
      <section id="fest-directory" className="py-24 px-4 sm:px-8 bg-white text-[#0f172a]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="text-xs font-black text-[#f84454] uppercase tracking-widest px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200">
                Live Festivals
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] mt-2 tracking-tight">
                Active Campus Festivals
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Explore dedicated public portals featuring real-time timetables, student search, and leaderboards.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f84454] text-white text-xs font-black hover:bg-rose-600 transition-all shadow-md shrink-0"
            >
              <span>Organise Your Fest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fests.map((fest) => (
              <div
                key={fest.id}
                className="p-7 rounded-3xl bg-slate-50 border border-slate-200 hover:border-rose-300 hover:shadow-xl transition-all flex flex-col justify-between space-y-5 group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-mono">
                    <span className="bg-white text-slate-800 px-3 py-1 rounded-full font-bold border border-slate-200">
                      {fest.id}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold uppercase text-[11px] px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {fest.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#0f172a] group-hover:text-[#f84454] transition-colors">
                    {fest.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {fest.tagline || 'Official collegiate festival portal.'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#f84454]" />
                    <span>{fest.startDate} to {fest.endDate}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <a
                    href={getAppUrl(`?fest=${fest.id}`)}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveFestId(fest.id);
                      navigateTo(`?fest=${fest.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f84454] text-white text-xs font-bold hover:bg-rose-600 transition-all min-h-[44px]"
                  >
                    <span>Visit Fest Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveFestId(fest.id);
                      openAuth('participant');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-[#0f172a] transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. OFFICIAL PLATFORM HELPDESK & SUPPORT                              */}
      {/* ==================================================================== */}
      <section id="helpdesk" className="py-24 px-4 sm:px-8 bg-slate-50 border-t border-slate-200 text-[#0f172a]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-100 text-[#f84454] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Help & Support</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
              Festoria Official Platform Helpdesk
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Need assistance with festival onboarding, application tracking, or technical support? Connect directly with our platform coordinators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone Helpdesk */}
            <a
              href="tel:9844691633"
              className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Phone className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Voice Helpline</span>
                  <h3 className="font-black text-lg text-[#0f172a] mt-0.5">Phone Helpline</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Direct phone consultation for coordinators, principals, and festival organizers.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-black text-sm text-[#0f172a]">9844691633</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:underline">
                  Call Now <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>

            {/* Email Helpdesk */}
            <a
              href="mailto:abdwahidbc@gmail.com"
              className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mail className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Official Inquiries</span>
                  <h3 className="font-black text-lg text-[#0f172a] mt-0.5">Official Support Email</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Detailed queries, festival provisioning requests, and administrative support.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-black text-xs text-[#0f172a] truncate max-w-[150px]">
                  abdwahidbc@gmail.com
                </span>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 shrink-0 group-hover:underline">
                  Email Desk <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>

            {/* Instagram Desk */}
            <a
              href="https://instagram.com/abd_l_wahid_"
              target="_blank"
              rel="noopener noreferrer"
              className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-pink-300 hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-600">Social Channel</span>
                  <h3 className="font-black text-lg text-[#0f172a] mt-0.5">Official Instagram</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Official updates, fest highlights, showcase stories, and direct messages.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-black text-sm text-[#0f172a]">@abd_l_wahid_</span>
                <span className="text-xs font-bold text-pink-600 flex items-center gap-1 group-hover:underline">
                  Connect <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. FOOTER                                                            */}
      {/* ==================================================================== */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={FESTORIA_LOGO}
              alt="Festoria Logo"
              onError={handleLogoError}
              className="w-8 h-8 rounded-lg object-contain bg-slate-100"
            />
            <div>
              <span className="text-[#0f172a] font-black">Festoria Platform</span>
              <span className="text-slate-400 block text-[11px]">Unified Collegiate Festival Management</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
            <a href="mailto:abdwahidbc@gmail.com" className="hover:text-[#f84454] transition-colors">
              abdwahidbc@gmail.com
            </a>
            <a href="tel:9844691633" className="hover:text-[#f84454] transition-colors">
              9844691633
            </a>
            <a href="https://instagram.com/abd_l_wahid_" target="_blank" rel="noopener noreferrer" className="hover:text-[#f84454] transition-colors">
              @abd_l_wahid_
            </a>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <button type="button" onClick={() => openCreateFest('track')} className="hover:text-[#f84454] transition-colors min-h-[44px]">
              Track Application
            </button>
            <a href={getAppUrl('admin.html')} className="hover:text-[#f84454] transition-colors inline-flex items-center min-h-[44px]">
              Fest Admin Console
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={authRole}
        initialMode={authModalMode}
        showSuperAdmin={false}
      />

      <CreateFestModal
        isOpen={createFestModalOpen}
        onClose={() => setCreateFestModalOpen(false)}
        initialTab={createFestInitialTab}
      />
    </div>
  );
};
