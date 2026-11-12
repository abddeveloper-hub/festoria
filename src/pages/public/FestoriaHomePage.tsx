import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal as AuthModal } from '../../components/common/PhoneAuthModal';
import { CreateFestModal } from '../../components/public/CreateFestModal';
import { Role } from '../../types';
import { getAppUrl, navigateTo } from '../../utils/navigation';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  Calendar,
  Clock,
  Award,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Lock,
  Users,
  FileSpreadsheet,
  Globe,
  AlertTriangle,
  Scale,
  Compass,
  ExternalLink,
  Activity,
  Menu,
  X
} from 'lucide-react';

export const FestoriaHomePage: React.FC = () => {
  const { fests, setActiveFestId } = useFest();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | 'participant' | 'auto'>('auto');
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [createFestModalOpen, setCreateFestModalOpen] = useState(false);
  const [createFestInitialTab, setCreateFestInitialTab] = useState<'apply' | 'track'>('apply');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Interactive Live Run-of-Show Console Tab State
  const [activeStageTab, setActiveStageTab] = useState<'mainstage' | 'amphitheatre' | 'arena'>('mainstage');

  const openAuth = (role: Role | 'participant' | 'auto' = 'auto') => {
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  const openCreateFest = (tab: 'apply' | 'track' = 'apply') => {
    setCreateFestInitialTab(tab);
    setCreateFestModalOpen(true);
  };

  return (
    <div className="min-h-screen min-h-dvh bg-[#faf8ff] text-[#131b2e] flex flex-col font-display selection:bg-[#6366f1] selection:text-white">
      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR — VIBRANT EVENT STUDIO SPEC                            */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {/* Official Festoria Monogram Logo */}
          <img
            src="/festoria-logo.jpg"
            alt="Festoria Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-200/80 bg-white"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#0f172a] leading-tight">
                Festoria
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                Vibrant Studio
              </span>
            </div>
            <p className="text-[11px] text-[#64748b] font-medium hidden sm:block">
              Unified Collegiate Festival Management Platform
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#fest-directory"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors min-h-[44px]"
          >
            <span>Festivals</span>
          </a>

          <button
            type="button"
            onClick={() => openCreateFest('track')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#464554] hover:text-[#0f172a] transition-colors min-h-[44px]"
          >
            <Compass className="w-3.5 h-3.5 text-[#4648d4]" />
            <span>Track Application</span>
          </button>

          <button
            type="button"
            onClick={() => openAuth('auto')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-[#0f172a] text-xs font-semibold hover:bg-[#f8fafc] hover:border-[#94a3b8] transition-colors shadow-2xs min-h-[44px]"
          >
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-linear-to-r from-[#4648d4] via-[#6063ee] to-[#712ae2] text-white text-xs font-bold hover:shadow-md hover:shadow-[#4648d4]/30 transition-all min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#e1e0ff]" />
            <span>Create New Fest</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation with backdrop blur & body scroll lock */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/festoria-logo.jpg"
                    alt="Festoria Logo"
                    className="w-8 h-8 rounded-lg object-contain shadow-2xs border border-slate-200/80 bg-white"
                  />
                  <span className="font-bold text-slate-900 text-sm">Festoria Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col space-y-2">
                <a
                  href="#fest-directory"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <span>Explore Festivals</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCreateFest('track');
                  }}
                  className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left"
                >
                  <Compass className="w-4 h-4 text-[#4648d4]" />
                  <span>Track Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('auto');
                  }}
                  className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left"
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
                  className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-linear-to-r from-[#4648d4] to-[#712ae2] text-white shadow-sm text-left"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Create New Fest</span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-2 text-xs text-slate-500">
              <a
                href={getAppUrl('admin.html')}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <span>Fest Administrator Console</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href={getAppUrl('super-admin.html')}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <span>Super Admin Governance</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. HERO SECTION — VIBRANT STUDIO CANVAS & RUN-OF-SHOW SHOWCASE       */}
      {/* Strictly ZERO Photos & ZERO Videos. Vector Geometry & Typographic    */}
      {/* ==================================================================== */}
      <section className="relative pt-16 sm:pt-24 pb-20 overflow-hidden border-b border-[#e2e8f0]">
        {/* Ambient Luminous Mesh Glazes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#6366f1]/10 rounded-full blur-[140px]" />
          <div className="absolute top-28 right-4 w-[500px] h-[360px] bg-[#7c3aed]/8 rounded-full blur-[120px]" />
          <div className="absolute top-44 -left-20 w-[450px] h-[320px] bg-[#06b6d4]/6 rounded-full blur-[100px]" />
          {/* Subtle Vector Dot Grid */}
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7">
          {/* Festival Status Pill Token */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>Vibrant Event Studio • Production-Grade Festival Infrastructure</span>
          </div>

          {/* Display Heading — Plus Jakarta Sans 3.5rem */}
          <h1 className="text-4xl sm:text-6xl lg:text-[3.75rem] font-black tracking-[-0.03em] text-[#0f172a] leading-[1.08]">
            Architect, Schedule & Ratify{' '}
            <span className="bg-linear-to-r from-[#4648d4] via-[#712ae2] to-[#ec4899] bg-clip-text text-transparent">
              Institutional Festivals.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#464554] max-w-3xl mx-auto font-normal leading-relaxed">
            Festoria powers inter-collegiate symposiums and campus championships with automated conflict-free timetables, tamper-proof judge ratifications, transparent grievance appeals, and dedicated public media hubs.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-linear-to-r from-[#4648d4] via-[#6063ee] to-[#712ae2] text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-[#4648d4]/25 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#e1e0ff]" />
              <span>Create Your Fest</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#fest-directory"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-[#cbd5e1] text-[#0f172a] rounded-lg text-sm font-semibold hover:bg-[#f8fafc] hover:border-[#94a3b8] transition-all shadow-xs"
            >
              <Globe className="w-4 h-4 text-[#64748b]" />
              <span>Explore Active Festivals</span>
            </a>

            <button
              type="button"
              onClick={() => openCreateFest('track')}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/70 backdrop-blur-xs border border-[#e2e8f0] text-[#4648d4] rounded-lg text-sm font-semibold hover:bg-white hover:border-[#cbd5e1] transition-all shadow-2xs"
            >
              <Compass className="w-4 h-4 text-[#4648d4]" />
              <span>Track Application</span>
            </button>
          </div>

          {/* ================================================================ */}
          {/* INTERACTIVE LIVE RUN-OF-SHOW CONSOLE (LEVEL 1 ELEVATED CARD)     */}
          {/* ================================================================ */}
          <div className="pt-6">
            <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xl shadow-[#0f172a]/5 p-5 sm:p-6 text-left transition-all hover:border-[#cbd5e1]">
              {/* Console Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e2e8f0] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#6063ee]/10 text-[#4648d4] flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4 text-[#4648d4]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0f172a] leading-tight">
                      Live Run-of-Show Telemetry
                    </h3>
                    <p className="text-[11px] text-[#64748b]">
                      Real-time stage sequencing & operational cues
                    </p>
                  </div>
                </div>

                {/* Festival Pill Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] text-xs font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Live On Air
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fdf2f8] border border-[#fbcfe8] text-[#ec4899] text-xs font-mono font-semibold">
                    Mainstage VIP
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfeff] border border-[#a5f3fc] text-[#0891b2] text-xs font-mono font-semibold">
                    Ops Latency: 42ms
                  </span>
                </div>
              </div>

              {/* Stage Switcher Tabs */}
              <div className="flex items-center gap-2 pt-4 pb-3 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveStageTab('mainstage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    activeStageTab === 'mainstage'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'bg-[#f8fafc] text-[#464554] hover:bg-[#f1f5f9]'
                  }`}
                >
                  Stage Alpha (Mainstage)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStageTab('amphitheatre')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    activeStageTab === 'amphitheatre'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'bg-[#f8fafc] text-[#464554] hover:bg-[#f1f5f9]'
                  }`}
                >
                  Amphitheatre (Debate & Drama)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStageTab('arena')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    activeStageTab === 'arena'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'bg-[#f8fafc] text-[#464554] hover:bg-[#f1f5f9]'
                  }`}
                >
                  Arena (Robotics & Tech)
                </button>
              </div>

              {/* Run-of-Show Timeline Spine with Left-Border Color Stripes */}
              <div className="relative pl-4 space-y-3 pt-2">
                {/* Continuous Vertical Spine in #e2e8f0 */}
                <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-[#e2e8f0]" />

                {activeStageTab === 'mainstage' && (
                  <>
                    {/* Item 1: Live Now — Magenta Stripe */}
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-3.5 h-3.5 rounded-full bg-[#ec4899] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#ec4899] bg-[#fdf2f8]/40 hover:bg-[#fdf2f8]/70 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#0f172a]">
                            Inter-University Western Band Showcase (Finals)
                          </span>
                          <span className="font-mono text-xs font-bold text-[#ec4899]">
                            09:30 – 10:45 AM • LIVE
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-[#64748b]">
                          <span>CUE #04</span>
                          <span>•</span>
                          <span>Cap: 850 / 900</span>
                          <span>•</span>
                          <span className="text-[#059669] font-semibold">Jury: 3/3 Ratified</span>
                          <span>•</span>
                          <span className="text-[#0891b2]">RFID Gate: Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Up Next — Indigo Stripe */}
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-3.5 h-3.5 rounded-full bg-[#6366f1] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#6366f1] bg-white hover:bg-[#faf8ff] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#0f172a]">
                            Classical Fusion & Choreography Championship
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#4648d4]">
                            11:00 – 12:15 PM • SOUNDCHECK
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-[#64748b]">
                          <span>CUE #05</span>
                          <span>•</span>
                          <span>Soundcheck: Audio Balanced</span>
                          <span>•</span>
                          <span>8 Competing Teams</span>
                          <span>•</span>
                          <span className="text-[#f59e0b] font-semibold">Stage Ready</span>
                        </div>
                      </div>
                    </div>

                    {/* Item 3: Standby — Cyan Stripe */}
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-3.5 h-3.5 rounded-full bg-[#008096] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#008096] bg-white hover:bg-[#faf8ff] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#0f172a]">
                            Grand Valedictory Ceremony & Overall Trophy Presentation
                          </span>
                          <span className="font-mono text-xs text-[#64748b]">
                            01:00 – 02:30 PM • STANDBY
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-[#64748b]">
                          <span>CUE #06</span>
                          <span>•</span>
                          <span>Official Ratification Seal Ready</span>
                          <span>•</span>
                          <span>Ops Channel 02 Active</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeStageTab === 'amphitheatre' && (
                  <>
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-3.5 h-3.5 rounded-full bg-[#ec4899] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#ec4899] bg-[#fdf2f8]/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#0f172a]">
                            National Parliamentary Debate — Quarter Finals
                          </span>
                          <span className="font-mono text-xs font-bold text-[#ec4899]">
                            10:00 – 11:30 AM • LIVE
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-[#64748b]">
                          <span>MOTION: Clean Energy Governance</span>
                          <span>•</span>
                          <span>Chief Adjudicator: Seated</span>
                          <span>•</span>
                          <span className="text-[#059669] font-semibold">Microphones Live</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-3.5 h-3.5 rounded-full bg-[#6366f1] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#6366f1] bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#0f172a]">
                            Street Play & Theatrical Monologues
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#4648d4]">
                            12:00 – 01:30 PM • UPCOMING
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-[#64748b]">
                          <span>Slotting: 6 Teams Checked-In</span>
                          <span>•</span>
                          <span>Timekeeper Sync: 12m Strict</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeStageTab === 'arena' && (
                  <>
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-3.5 h-3.5 rounded-full bg-[#ec4899] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#ec4899] bg-[#fdf2f8]/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#0f172a]">
                            Autonomous Maze Runner & Line Follower Finale
                          </span>
                          <span className="font-mono text-xs font-bold text-[#ec4899]">
                            09:00 – 11:00 AM • LIVE
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-[#64748b]">
                          <span>Arena Lap Timer: Laser Calibrated</span>
                          <span>•</span>
                          <span className="text-[#059669] font-semibold">14 Bots Qualified</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-3.5 h-3.5 rounded-full bg-[#008096] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#008096] bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#0f172a]">
                            AI Prompt Engineering & 24hr Hackathon Pitches
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#008096]">
                            11:30 – 02:00 PM • JURY REVIEW
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-[#64748b]">
                          <span>Rubric: Innovation + Execution + Pitch</span>
                          <span>•</span>
                          <span>Jury Weightage: Normalized</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metric Telemetry Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-all">
              <div className="text-xl sm:text-2xl font-black font-mono text-[#4648d4]">100%</div>
              <div className="text-xs font-bold text-[#0f172a] mt-0.5">Isolated Workspaces</div>
              <div className="text-[11px] text-[#64748b] mt-1">Multi-tenant cryptographic security</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-all">
              <div className="text-xl sm:text-2xl font-black font-mono text-[#712ae2]">0 Overlaps</div>
              <div className="text-xs font-bold text-[#0f172a] mt-0.5">Timetable Engine</div>
              <div className="text-[11px] text-[#64748b] mt-1">Conflict-free stage scheduling</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-all">
              <div className="text-xl sm:text-2xl font-black font-mono text-[#059669]">&lt; 300ms</div>
              <div className="text-xs font-bold text-[#0f172a] mt-0.5">Jury Ratification</div>
              <div className="text-[11px] text-[#64748b] mt-1">Real-time score audit trail</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-all">
              <div className="text-xl sm:text-2xl font-black font-mono text-[#f59e0b]">Dedicated</div>
              <div className="text-xs font-bold text-[#0f172a] mt-0.5">Public Fest Portals</div>
              <div className="text-[11px] text-[#64748b] mt-1">Admin-managed video & media</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. PLATFORM CAPABILITIES — ELEVATED LEVEL 1 CARDS                     */}
      {/* ==================================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4648d4] uppercase tracking-widest px-3 py-1 rounded-full bg-[#f2f3ff] border border-[#dae2fd]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4648d4]" />
            Architecture & Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f172a]">
            Designed for University Deaneries, Cultural Councils & Tech Fests
          </h2>
          <p className="text-sm text-[#464554] leading-relaxed">
            Every layer of Festoria eliminates the chaos of manual spreadsheets, WhatsApp coordination, and dispute escalation with structured, authoritative workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4648d4]/5 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#6063ee]/10 border border-[#6063ee]/20 text-[#4648d4] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-[#4648d4]" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">Independent Fest Workspaces</h3>
            <p className="text-xs text-[#464554] leading-relaxed">
              Every approved fest receives its own isolated Firestore partition. Admins, participants, judges, and schedules never bleed into other festivals.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#059669]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>Cryptographic Tenant Isolation</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4648d4]/5 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#712ae2]/10 border border-[#712ae2]/20 text-[#712ae2] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-[#712ae2]" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">Conflict-Free Timetable Builder</h3>
            <p className="text-xs text-[#464554] leading-relaxed">
              Automated venue slotting with intelligent conflict detection prevents participants or houses from being scheduled on concurrent stages.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#4648d4]">
              <Zap className="w-3.5 h-3.5 text-[#4648d4]" />
              <span>Zero-Clash Algorithmic Routing</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4648d4]/5 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#059669]/10 border border-[#059669]/20 text-[#059669] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5 text-[#059669]" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">Ratified Scoring & Tie-Breakers</h3>
            <p className="text-xs text-[#464554] leading-relaxed">
              Criteria-based scoring with multi-judge weightages, official jury review checkpoints, and mathematical tie-breaker rankings.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#059669]">
              <Award className="w-3.5 h-3.5 text-[#059669]" />
              <span>Immutable Ledger & Digital Seals</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4648d4]/5 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#d97706] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5 text-[#d97706]" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">Grievance & Appeal Calibration</h3>
            <p className="text-xs text-[#464554] leading-relaxed">
              Formal grievance logging allows team leaders to submit documented appeals with evidence, enabling administrators to calibrate scores transparently.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#d97706]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Official Review Audit Trail</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4648d4]/5 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#0891b2]/10 border border-[#0891b2]/20 text-[#0891b2] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-[#0891b2]" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">Team Leader Delegation</h3>
            <p className="text-xs text-[#464554] leading-relaxed">
              Decentralized roster management enables collegiate house captains to invite, approve, and verify participant eligibility within strict quotas.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#0891b2]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0891b2]" />
              <span>Token-Based Access Verification</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4648d4]/5 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#ec4899]/10 border border-[#ec4899]/20 text-[#ec4899] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5 text-[#ec4899]" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">Admin-Managed Public Portal (/f/:id)</h3>
            <p className="text-xs text-[#464554] leading-relaxed">
              Every approved fest receives its own public website with hero background video, PNG logo branding, curated photo albums, and live scorecards.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#ec4899]">
              <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Dedicated Live URL Partition</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. GOVERNANCE LIFECYCLE: 4 STAGES                                    */}
      {/* ==================================================================== */}
      <section className="py-20 bg-[#f8fafc] border-y border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#4648d4] uppercase tracking-widest px-3 py-1 rounded-full bg-[#f2f3ff] border border-[#dae2fd]">
              Operational Lifecycle
            </span>
            <h2 className="text-3xl font-black text-[#0f172a]">How Institutions Organise Festivals</h2>
            <p className="text-xs text-[#64748b]">
              A verified four-stage lifecycle from institutional sanction to real-time champion crowning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-md transition-all space-y-3">
              <div className="text-xs font-mono font-bold text-[#4648d4]">STEP 01</div>
              <h4 className="text-sm font-bold text-[#0f172a]">Submit Fest Application</h4>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Institutional deaneries register with name, dates, expected footfall, and convenor contact details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-md transition-all space-y-3">
              <div className="text-xs font-mono font-bold text-[#712ae2]">STEP 02</div>
              <h4 className="text-sm font-bold text-[#0f172a]">Super Admin Provisioning</h4>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Applications are scrutinized and ratified. A dedicated workspace & Fest ID are allocated automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-md transition-all space-y-3">
              <div className="text-xs font-mono font-bold text-[#0891b2]">STEP 03</div>
              <h4 className="text-sm font-bold text-[#0f172a]">Configure Stages & Media</h4>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Admins upload hero video, logos, schedule timetables, assign criteria rubrics, and invite team leaders.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-md transition-all space-y-3">
              <div className="text-xs font-mono font-bold text-[#059669]">STEP 04</div>
              <h4 className="text-sm font-bold text-[#0f172a]">Live Ratification & Results</h4>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Judges score live events, results are ratified, and points publish instantly to the public fest portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. FESTIVAL DIRECTORY — DIRECT LINKS TO INDIVIDUAL FEST SITES        */}
      {/* ==================================================================== */}
      <section id="fest-directory" className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e2e8f0] pb-4">
          <div>
            <span className="text-xs font-bold text-[#4648d4] uppercase tracking-widest px-3 py-1 rounded-full bg-[#f2f3ff] border border-[#dae2fd]">
              Live Ecosystem
            </span>
            <h2 className="text-3xl font-black text-[#0f172a] mt-2">
              Active Institutional Festivals
            </h2>
            <p className="text-xs text-[#64748b] mt-1">
              Visit dedicated public portals featuring admin-curated media, live schedules, and results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4648d4] text-white text-xs font-bold hover:bg-[#3d3fb8] transition-colors shrink-0 shadow-xs"
          >
            <span>Organise Your Institution's Fest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fests.map((fest) => (
            <div
              key={fest.id}
              className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4648d4]/5 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#64748b] mb-2 font-mono">
                  <span className="bg-[#f2f3ff] text-[#4648d4] px-2.5 py-0.5 rounded-full font-bold">
                    {fest.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#059669] font-bold uppercase text-[11px] px-2 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    {fest.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">{fest.name}</h3>
                <p className="text-xs text-[#464554] mt-1 line-clamp-2">
                  {fest.tagline || 'Official collegiate festival portal.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#64748b] mt-3 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#4648d4]" />
                  <span>{fest.startDate} to {fest.endDate}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
                <a
                  href={getAppUrl(`?fest=${fest.id}`)}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveFestId(fest.id);
                    navigateTo(`?fest=${fest.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4648d4] hover:text-[#712ae2] transition-colors min-h-[44px]"
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
                  className="text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. CALL TO ACTION: CREATE YOUR FEST                                  */}
      {/* ==================================================================== */}
      <section className="py-20 px-4 sm:px-8 border-t border-[#e2e8f0] bg-[#faf8ff]">
        <div className="max-w-4xl mx-auto rounded-3xl bg-linear-to-r from-[#4648d4] via-[#6063ee] to-[#712ae2] text-white p-8 sm:p-14 text-center space-y-6 shadow-xl shadow-[#4648d4]/20 relative overflow-hidden">
          {/* Subtle Ambient Decorative Gradients */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 text-white flex items-center justify-center font-bold mx-auto shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Launch Your Campus Festival?
            </h2>

            <p className="text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Submit your application in under 3 minutes. Upon Super Admin verification, your dedicated workspace and public portal are provisioned automatically.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openCreateFest('apply')}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#0f172a] rounded-lg text-sm font-bold hover:bg-[#faf8ff] hover:scale-[1.02] transition-all shadow-lg"
              >
                <span>Create Your Fest Now</span>
                <ArrowRight className="w-4 h-4 text-[#0f172a]" />
              </button>

              <button
                type="button"
                onClick={() => openCreateFest('track')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg text-sm font-semibold transition-all backdrop-blur-xs"
              >
                <Compass className="w-4 h-4" />
                <span>Track Application</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. FOOTER                                                            */}
      {/* ==================================================================== */}
      <footer className="border-t border-[#e2e8f0] bg-white py-10 px-4 sm:px-8 text-xs text-[#64748b]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/festoria-logo.jpg"
              alt="Festoria Logo"
              className="w-6 h-6 rounded-md object-contain shadow-2xs border border-slate-200/80 bg-white"
            />
            <span className="text-[#0f172a] font-bold">Festoria Platform</span>
            <span>— Institutional Festival Management Architecture</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#64748b]">
            <button type="button" onClick={() => openCreateFest('track')} className="hover:text-[#0f172a] transition-colors min-h-[44px]">
              Track Application
            </button>
            <a href={getAppUrl('admin.html')} className="hover:text-[#0f172a] transition-colors inline-flex items-center min-h-[44px]">
              Fest Admin Console
            </a>
          </div>
        </div>
      </footer>

      {/* Unified Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={authRole}
        initialMode={authModalMode}
        showSuperAdmin={false}
      />

      {/* Create New Fest / Application Modal */}
      <CreateFestModal
        isOpen={createFestModalOpen}
        onClose={() => setCreateFestModalOpen(false)}
        initialTab={createFestInitialTab}
      />
    </div>
  );
};
