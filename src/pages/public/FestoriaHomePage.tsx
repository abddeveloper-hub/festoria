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
  Radio,
  Cpu,
  Database,
  BarChart3,
  SlidersHorizontal
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
    <div className="min-h-screen min-h-dvh bg-[#faf8ff] text-[#0f172a] flex flex-col font-display selection:bg-[#6366f1] selection:text-white relative overflow-x-hidden">
      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR — 3D LAYERED GLASSMORPHISM SPEC                       */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          {/* Official Festoria Monogram Logo with 3D Inset Bevel */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-30 blur-xs group-hover:opacity-60 transition duration-300" />
            <img
              src={FESTORIA_LOGO}
              alt="Festoria Logo"
              onError={handleLogoError}
              className="relative w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-200/80 bg-white transform transition-transform group-hover:scale-105"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-[#0f172a] leading-tight">
                Festoria
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-[0_1px_3px_rgba(16,185,129,0.12)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Vibrant Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Unified Collegiate Festival Management Platform
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#fest-directory"
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors min-h-[44px]"
          >
            <span>Festivals</span>
          </a>

          <a
            href="#capabilities"
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors min-h-[44px]"
          >
            <span>Architecture</span>
          </a>

          <a
            href="#helpdesk"
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors min-h-[44px]"
          >
            <span>Official Helpdesk</span>
          </a>

          <button
            type="button"
            onClick={() => openCreateFest('track')}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors min-h-[44px]"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>Track Application</span>
          </button>

          <button
            type="button"
            onClick={() => openAuth('auto')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.04)] min-h-[44px] active:translate-y-0.5"
          >
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="hidden sm:inline-flex items-center gap-2 px-4.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white text-xs font-bold shadow-[0_4px_14px_rgba(79,70,229,0.35)] border-t border-white/30 hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Create New Fest</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80 shadow-2xs"
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <img
                    src={FESTORIA_LOGO}
                    alt="Festoria Logo"
                    onError={handleLogoError}
                    className="w-8 h-8 rounded-lg object-contain shadow-2xs border border-slate-200/80 bg-white"
                  />
                  <div>
                    <span className="font-black text-slate-900 text-sm block">Festoria Platform</span>
                    <span className="text-[10px] text-slate-500 font-medium">Collegiate Event OS</span>
                  </div>
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
                  className="min-h-[44px] flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 transition-colors"
                >
                  <span>Explore Festivals</span>
                </a>

                <a
                  href="#capabilities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 transition-colors"
                >
                  <span>Architecture & Features</span>
                </a>

                <a
                  href="#helpdesk"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 transition-colors"
                >
                  <span>Official Support Desk</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCreateFest('track');
                  }}
                  className="min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                >
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Track Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('auto');
                  }}
                  className="min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
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
                  className="min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md text-left"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Create New Fest</span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-2 text-xs text-slate-500">
              <a
                href={getAppUrl('admin.html')}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>Fest Administrator Console</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href={getAppUrl('super-admin.html')}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>Super Admin Governance</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Official Platform Helpdesk</span>
                <a href="mailto:abdwahidbc@gmail.com" className="flex items-center gap-2 hover:text-slate-900">
                  <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">abdwahidbc@gmail.com</span>
                </a>
                <a href="tel:9844691633" className="flex items-center gap-2 hover:text-slate-900">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>9844691633</span>
                </a>
                <a href="https://instagram.com/abd_l_wahid_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-pink-600">
                  <svg className="w-3.5 h-3.5 text-pink-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span>@abd_l_wahid_</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. HERO SECTION — 3D PERSPECTIVE CANVAS & RUN-OF-SHOW SHOWCASE       */}
      {/* Strictly ZERO Photos & ZERO Videos. Vector Geometry & Typographic    */}
      {/* ==================================================================== */}
      <section className="relative pt-16 sm:pt-24 pb-20 overflow-hidden border-b border-slate-200/80">
        {/* 3D Ambient Perspective Grid & Luminous Mesh Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Luminous Color Blooms */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-b from-indigo-500/12 via-purple-500/8 to-transparent rounded-full blur-[140px]" />
          <div className="absolute top-28 right-0 w-[500px] h-[380px] bg-purple-500/10 rounded-full blur-[130px]" />
          <div className="absolute top-44 -left-20 w-[450px] h-[340px] bg-cyan-500/8 rounded-full blur-[110px]" />

          {/* 3D Isometric Dot Matrix Canvas */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 1.25px, transparent 1.25px)',
              backgroundSize: '32px 32px'
            }}
          />

          {/* Top Subtle Geometric Horizon Grid Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7">
          {/* 3D Floating Status Capsule */}
          <div className="inline-flex items-center gap-2.5 px-4.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-emerald-200/90 text-emerald-700 text-xs font-bold shadow-[0_8px_20px_-4px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] hover:scale-102 transition-transform cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide">Vibrant Event Studio • Production-Grade Festival Infrastructure</span>
          </div>

          {/* 3D Editorial Display Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-[4rem] font-black tracking-[-0.035em] text-[#0f172a] leading-[1.06] drop-shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            Architect, Schedule & Ratify{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Institutional Festivals.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Festoria powers inter-collegiate symposiums and campus championships with automated conflict-free timetables, tamper-proof judge ratifications, transparent grievance appeals, and dedicated public media hubs.
          </p>

          {/* Primary Action Buttons with 3D Depth */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white rounded-xl text-sm font-bold shadow-[0_12px_28px_-6px_rgba(79,70,229,0.45)] border-t border-white/35 hover:shadow-[0_16px_36px_-6px_rgba(79,70,229,0.55)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Create Your Fest</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#fest-directory"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200/90 text-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-[0_8px_20px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Explore Active Festivals</span>
            </a>

            <button
              type="button"
              onClick={() => openCreateFest('track')}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/75 backdrop-blur-md border border-slate-200 text-indigo-700 rounded-xl text-sm font-bold hover:bg-white hover:border-indigo-300 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Track Application</span>
            </button>
          </div>

          {/* ================================================================ */}
          {/* 3D INTERACTIVE LIVE RUN-OF-SHOW COMMAND CONSOLE                  */}
          {/* ================================================================ */}
          <div className="pt-8 [perspective:1400px]">
            <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-[0_30px_70px_-15px_rgba(15,23,42,0.14),0_0_0_1px_rgba(226,232,240,0.8),inset_0_1px_0_rgba(255,255,255,1)] p-6 sm:p-7 text-left transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(79,70,229,0.18)] md:[transform:rotateX(1.5deg)] md:hover:[transform:rotateX(0deg)]">
              {/* Console Top Bezel / Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/90 gap-3">
                <div className="flex items-center gap-3">
                  {/* 3D Elevated Icon Pedestal */}
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 border-t border-white/40">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#0f172a] leading-tight">
                        Live Run-of-Show Telemetry Console
                      </h3>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Real-time stage sequencing, jury quorum status & operational cues
                    </p>
                  </div>
                </div>

                {/* 3D Floating Telemetry Capsules */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE ON AIR
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-mono font-bold shadow-xs">
                    Mainstage VIP
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-mono font-bold shadow-xs">
                    Latency: 38ms
                  </span>
                </div>
              </div>

              {/* 3D Inset Stage Switcher Bar */}
              <div className="mt-4 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80 shadow-inner flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveStageTab('mainstage')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    activeStageTab === 'mainstage'
                      ? 'bg-white text-indigo-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${activeStageTab === 'mainstage' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Stage Alpha (Mainstage)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStageTab('amphitheatre')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    activeStageTab === 'amphitheatre'
                      ? 'bg-white text-indigo-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${activeStageTab === 'amphitheatre' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Amphitheatre (Debate & Drama)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStageTab('arena')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    activeStageTab === 'arena'
                      ? 'bg-white text-indigo-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${activeStageTab === 'arena' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Arena (Robotics & Tech)</span>
                </button>
              </div>

              {/* Run-of-Show Timeline Spine with 3D Left-Border Bevels */}
              <div className="relative pl-4 space-y-3 pt-4">
                {/* Continuous Vertical Spine */}
                <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-pink-500 via-indigo-500 to-cyan-500 opacity-30" />

                {activeStageTab === 'mainstage' && (
                  <>
                    {/* Item 1: Live Now — Magenta Stripe */}
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow-[0_0_12px_rgba(236,72,153,0.6)] ring-4 ring-pink-100" />
                      <div className="p-4 rounded-2xl border border-pink-200/80 border-l-4 border-l-pink-500 bg-gradient-to-r from-pink-50/50 via-white to-white shadow-[0_4px_16px_rgba(236,72,153,0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#0f172a]">
                            Inter-University Western Band Showcase (Finals)
                          </span>
                          <span className="font-mono text-xs font-black text-pink-600">
                            09:30 – 10:45 AM • LIVE
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px] text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">CUE #04</span>
                          <span>•</span>
                          <span>Auditorium Cap: 850 / 900</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">Jury: 3/3 Ratified</span>
                          <span>•</span>
                          <span className="text-cyan-700 font-semibold">RFID Gate: Synced</span>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Up Next — Indigo Stripe */}
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-[0_0_12px_rgba(99,102,241,0.6)] ring-4 ring-indigo-100" />
                      <div className="p-4 rounded-2xl border border-indigo-200/80 border-l-4 border-l-indigo-600 bg-white shadow-[0_4px_16px_rgba(99,102,241,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#0f172a]">
                            Classical Fusion & Choreography Championship
                          </span>
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            11:00 – 12:15 PM • SOUNDCHECK
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px] text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">CUE #05</span>
                          <span>•</span>
                          <span>Soundcheck: Audio Balanced</span>
                          <span>•</span>
                          <span>8 Competing Houses</span>
                          <span>•</span>
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">Stage Green</span>
                        </div>
                      </div>
                    </div>

                    {/* Item 3: Standby — Cyan Stripe */}
                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-4 h-4 rounded-full bg-cyan-600 border-2 border-white shadow-[0_0_12px_rgba(8,145,178,0.6)] ring-4 ring-cyan-100" />
                      <div className="p-4 rounded-2xl border border-cyan-200/80 border-l-4 border-l-cyan-600 bg-white shadow-[0_4px_16px_rgba(8,145,178,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#0f172a]">
                            Grand Valedictory Ceremony & Overall Trophy Presentation
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600">
                            01:00 – 02:30 PM • STANDBY
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px] text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">CUE #06</span>
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
                      <div className="absolute -left-4 top-4 w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow-[0_0_12px_rgba(236,72,153,0.6)] ring-4 ring-pink-100" />
                      <div className="p-4 rounded-2xl border border-pink-200/80 border-l-4 border-l-pink-500 bg-gradient-to-r from-pink-50/50 via-white to-white shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#0f172a]">
                            National Parliamentary Debate — Quarter Finals
                          </span>
                          <span className="font-mono text-xs font-black text-pink-600">
                            10:00 – 11:30 AM • LIVE
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px] text-slate-500">
                          <span className="font-bold text-indigo-700">MOTION: Clean Energy Governance</span>
                          <span>•</span>
                          <span>Chief Adjudicator: Seated</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">Microphones Live</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-[0_0_12px_rgba(99,102,241,0.6)] ring-4 ring-indigo-100" />
                      <div className="p-4 rounded-2xl border border-indigo-200/80 border-l-4 border-l-indigo-600 bg-white shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#0f172a]">
                            Street Play & Theatrical Monologues
                          </span>
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            12:00 – 01:30 PM • UPCOMING
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px] text-slate-500">
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
                      <div className="absolute -left-4 top-4 w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow-[0_0_12px_rgba(236,72,153,0.6)] ring-4 ring-pink-100" />
                      <div className="p-4 rounded-2xl border border-pink-200/80 border-l-4 border-l-pink-500 bg-gradient-to-r from-pink-50/50 via-white to-white shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#0f172a]">
                            Autonomous Maze Runner & Line Follower Finale
                          </span>
                          <span className="font-mono text-xs font-black text-pink-600">
                            09:00 – 11:00 AM • LIVE
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px] text-slate-500">
                          <span>Arena Lap Timer: Laser Calibrated</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">14 Bots Qualified</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute -left-4 top-4 w-4 h-4 rounded-full bg-cyan-600 border-2 border-white shadow-[0_0_12px_rgba(8,145,178,0.6)] ring-4 ring-cyan-100" />
                      <div className="p-4 rounded-2xl border border-cyan-200/80 border-l-4 border-l-cyan-600 bg-white shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#0f172a]">
                            AI Prompt Engineering & 24hr Hackathon Pitches
                          </span>
                          <span className="font-mono text-xs font-bold text-cyan-700">
                            11:30 – 02:00 PM • JURY REVIEW
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px] text-slate-500">
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

          {/* ================================================================ */}
          {/* 3D STAT TELEMETRY PEDESTALS (4 METRICS)                          */}
          {/* ================================================================ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 max-w-4xl mx-auto text-left">
            <div className="p-4.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 border-t-2 border-t-indigo-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.15)] transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-indigo-600">100%</span>
                <Database className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xs font-bold text-[#0f172a] mt-1">Isolated Workspaces</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Multi-tenant cryptographic security</div>
            </div>

            <div className="p-4.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 border-t-2 border-t-purple-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(147,51,234,0.15)] transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-purple-600">0 Overlaps</span>
                <Clock className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xs font-bold text-[#0f172a] mt-1">Timetable Engine</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Conflict-free stage scheduling</div>
            </div>

            <div className="p-4.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 border-t-2 border-t-emerald-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(16,185,129,0.15)] transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-emerald-600">&lt; 300ms</span>
                <Award className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xs font-bold text-[#0f172a] mt-1">Jury Ratification</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Real-time score audit trail</div>
            </div>

            <div className="p-4.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 border-t-2 border-t-amber-500 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.15)] transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-amber-600">Dedicated</span>
                <Globe className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xs font-bold text-[#0f172a] mt-1">Public Fest Portals</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Admin-managed video & media</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. PLATFORM CAPABILITIES — STRUCTURED 3D BENTO ARCHITECTURE         */}
      {/* ==================================================================== */}
      <section id="capabilities" className="py-24 max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 uppercase tracking-widest px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Platform Architecture & Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#0f172a]">
            Designed for University Deaneries, Cultural Councils & Tech Fests
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every layer of Festoria eliminates the chaos of manual spreadsheets, WhatsApp coordination, and dispute escalation with structured, authoritative workflows.
          </p>
        </div>

        {/* 3D Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Bento Card 1 (Span 2 on lg): Timetable Engine & Algorithmic Matrix */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_45px_-8px_rgba(79,70,229,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 border-t border-white/40 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/70">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  Zero-Clash Algorithmic Engine
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                Automated Conflict-Free Timetable Builder
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Automated multi-stage venue slotting with intelligent conflict detection prevents participants or houses from being scheduled on concurrent stages simultaneously.
              </p>

              {/* 3D Mini Timetable Simulation Matrix */}
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 pb-2 border-b border-slate-200">
                    <span>STAGE VENUE</span>
                    <span>10:00 AM</span>
                    <span>11:30 AM</span>
                    <span>STATUS</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800">Stage Alpha</span>
                    <span className="p-2 rounded-lg bg-indigo-100/80 text-indigo-800 font-medium truncate text-center">Debate Finals</span>
                    <span className="p-2 rounded-lg bg-purple-100/80 text-purple-800 font-medium truncate text-center">Quiz Prelims</span>
                    <span className="font-mono text-emerald-600 font-bold text-right">No Clash ✓</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800">Amphitheatre</span>
                    <span className="p-2 rounded-lg bg-pink-100/80 text-pink-800 font-medium truncate text-center">Western Solo</span>
                    <span className="p-2 rounded-lg bg-cyan-100/80 text-cyan-800 font-medium truncate text-center">Classical Dance</span>
                    <span className="font-mono text-emerald-600 font-bold text-right">No Clash ✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Automatic Buffer Intervals (15m)</span>
              <span className="text-indigo-600 font-bold flex items-center gap-1">
                Explore Matrix <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Bento Card 2 (Span 1 on lg): Immutable Scoring & Jury Quorum */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_45px_-8px_rgba(16,185,129,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 border-t border-white/40 group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                Ratified Scoring & Mathematical Tie-Breakers
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Criteria-based scoring with multi-judge weightages, official jury review checkpoints, and mathematical tie-breaker rankings.
              </p>

              {/* 3D Jury Seal Preview Badge */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jury Quorum</span>
                  </div>
                  <span className="font-mono text-emerald-700 font-bold">3 / 3 Signed</span>
                </div>
                <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-full"></div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 block">Digital Notary Hash: 9f8a...4b12</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs font-mono font-bold text-emerald-700">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Immutable Ledger & Seals</span>
            </div>
          </div>

          {/* Bento Card 3 (Span 1 on lg): Decentralized House Captain Portals */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_45px_-8px_rgba(8,145,178,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 border-t border-white/40 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                Team Leader Delegation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Decentralized roster management enables collegiate house captains to invite, approve, and verify participant eligibility within strict quotas.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">House Captain Quota</div>
                  <div className="text-[11px] text-slate-500">Auto-validated limits</div>
                </div>
                <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                  Strict 100%
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs font-mono font-bold text-cyan-700">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>Token-Based Access Verification</span>
            </div>
          </div>

          {/* Bento Card 4 (Span 2 on lg): Dedicated Public Fest Portals (/f/:id) */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_45px_-8px_rgba(236,72,153,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-pink-500/20 border-t border-white/40 group-hover:scale-105 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200/70">
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                  Dedicated Live URL Partition
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                Admin-Managed Public Portal Hub (/f/:id)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Every approved fest receives its own public website with customizable hero video, collegiate branding, 3D stepped championship podium, and live student chest-number search.
              </p>

              {/* 3D Visual Pillar Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-200/60 text-center space-y-1">
                  <Award className="w-5 h-5 text-pink-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">3D Stepped Podium</div>
                  <div className="text-[10px] text-slate-500">Gold, Silver, Bronze</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/60 text-center space-y-1">
                  <Clock className="w-5 h-5 text-purple-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">Live Countdown</div>
                  <div className="text-[10px] text-slate-500">Dynamic T-0 Clock</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/60 text-center space-y-1">
                  <Compass className="w-5 h-5 text-indigo-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">Chest No. Search</div>
                  <div className="text-[10px] text-slate-500">Instant Participant Lookup</div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Automatic Mobile Slide-out Menu Drawer</span>
              <a href="#fest-directory" className="text-pink-600 font-bold flex items-center gap-1 hover:underline">
                View Live Ecosystem <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Bento Card 5: Grievance & Appeal Calibration */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_45px_-8px_rgba(245,158,11,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 border-t border-white/40 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                Grievance & Appeal Calibration
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Formal grievance logging allows team leaders to submit documented appeals with evidence, enabling administrators to calibrate scores transparently.
              </p>
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Appeal Window</span>
                <span className="font-mono text-amber-700 font-bold">Strict 60m Audit</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs font-mono font-bold text-amber-700">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>Official Review & Score Calibration</span>
            </div>
          </div>

          {/* Bento Card 6: Cryptographic Multi-Tenant Partitioning */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_45px_-8px_rgba(99,102,241,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 border-t border-white/40 group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Multi-Tenant Cryptographic Partitioning
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                Independent Fest Workspaces & Isolation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Every approved fest receives its own isolated Firestore partition. Admins, participants, judges, rosters, and schedules never bleed into other campus festivals.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Encrypted at rest & in transit</span>
              <span className="text-indigo-600 font-bold">100% Zero Data Leakage Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. GOVERNANCE LIFECYCLE: 3D STEPPED PIPELINE                         */}
      {/* ==================================================================== */}
      <section className="py-24 bg-[#f8fafc] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 shadow-2xs">
              Operational Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a]">How Institutions Organise Festivals</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A verified four-stage lifecycle from institutional sanction to real-time champion crowning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 border-t-4 border-t-indigo-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-xl transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 border-t border-white/40">
                01
              </div>
              <h4 className="text-base font-black text-[#0f172a]">Submit Fest Application</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Institutional deaneries register with name, dates, expected footfall, and convenor contact details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 border-t-4 border-t-purple-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-xl transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-purple-500/25 border-t border-white/40">
                02
              </div>
              <h4 className="text-base font-black text-[#0f172a]">Super Admin Provisioning</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applications are scrutinized and ratified. A dedicated workspace & Fest ID are allocated automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 border-t-4 border-t-cyan-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-xl transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-500/25 border-t border-white/40">
                03
              </div>
              <h4 className="text-base font-black text-[#0f172a]">Configure Stages & Media</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admins upload hero video, logos, schedule timetables, assign criteria rubrics, and invite team leaders.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 border-t-4 border-t-emerald-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-xl transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/25 border-t border-white/40">
                04
              </div>
              <h4 className="text-base font-black text-[#0f172a]">Live Ratification & Results</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Judges score live events, results are ratified, and points publish instantly to the public fest portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. FESTIVAL DIRECTORY — 3D ELEVATED FESTIVAL CARDS                  */}
      {/* ==================================================================== */}
      <section id="fest-directory" className="py-24 max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/90 pb-6">
          <div>
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 shadow-2xs">
              Live Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] mt-2">
              Active Institutional Festivals
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Visit dedicated public portals featuring admin-curated media, live schedules, and results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shrink-0 shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:-translate-y-0.5"
          >
            <span>Organise Your Institution's Fest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fests.map((fest) => (
            <div
              key={fest.id}
              className="p-7 rounded-3xl bg-white border border-slate-200/90 border-t-2 border-t-indigo-600 shadow-[0_12px_30px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_45px_-8px_rgba(79,70,229,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-5 group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-mono">
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-200/60">
                    {fest.id}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold uppercase text-[11px] px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {fest.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#0f172a] group-hover:text-indigo-600 transition-colors">
                  {fest.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {fest.tagline || 'Official collegiate festival portal.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{fest.startDate} to {fest.endDate}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={getAppUrl(`?fest=${fest.id}`)}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveFestId(fest.id);
                    navigateTo(`?fest=${fest.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all min-h-[44px]"
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
      </section>

      {/* ==================================================================== */}
      {/* 6. CALL TO ACTION: 3D GLOW BANNER                                   */}
      {/* ==================================================================== */}
      <section className="py-24 px-4 sm:px-8 border-t border-slate-200/80 bg-[#faf8ff]">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-8 sm:p-14 text-center space-y-7 shadow-[0_25px_60px_-15px_rgba(79,70,229,0.35)] border-t border-white/30 relative overflow-hidden">
          {/* Subtle Ambient Decorative Gradients */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white flex items-center justify-center font-bold mx-auto shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Launch Your Campus Festival?
            </h2>

            <p className="text-sm sm:text-base text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Submit your application in under 3 minutes. Upon Super Admin verification, your dedicated workspace and public portal are provisioned automatically.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => openCreateFest('apply')}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-indigo-900 rounded-xl text-sm font-black hover:bg-slate-50 hover:scale-102 transition-all shadow-xl"
              >
                <span>Create Your Fest Now</span>
                <ArrowRight className="w-4 h-4 text-indigo-900" />
              </button>

              <button
                type="button"
                onClick={() => openCreateFest('track')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl text-sm font-bold transition-all backdrop-blur-md"
              >
                <Compass className="w-4 h-4" />
                <span>Track Application</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6.5. OFFICIAL HELPDESK & PLATFORM SUPPORT (3D SUPPORT PODIUMS)       */}
      {/* ==================================================================== */}
      <section id="helpdesk" className="py-24 px-4 sm:px-8 border-t border-slate-200/80 bg-white">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Official Help & Support</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
              Festoria Official Platform Helpdesk
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Need assistance with festival onboarding, application tracking, or technical support? Connect directly with our platform coordinators and support desk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone Helpdesk Podium */}
            <a
              href="tel:9844691633"
              className="p-7 rounded-3xl bg-[#faf8ff] border border-slate-200/90 border-t-4 border-t-emerald-500 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-emerald-300 hover:shadow-[0_20px_45px_-8px_rgba(16,185,129,0.2)] hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20 border-t border-white/40">
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
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <span className="font-mono font-black text-sm text-[#0f172a]">9844691633</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:underline">
                  Call Now <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>

            {/* Email Helpdesk Podium */}
            <a
              href="mailto:abdwahidbc@gmail.com"
              className="p-7 rounded-3xl bg-[#faf8ff] border border-slate-200/90 border-t-4 border-t-indigo-600 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-indigo-300 hover:shadow-[0_20px_45px_-8px_rgba(79,70,229,0.2)] hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-indigo-500/20 border-t border-white/40">
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
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <span className="font-mono font-black text-xs text-[#0f172a] truncate max-w-[150px]">
                  abdwahidbc@gmail.com
                </span>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 shrink-0 group-hover:underline">
                  Email Desk <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>

            {/* Instagram Desk Podium */}
            <a
              href="https://instagram.com/abd_l_wahid_"
              target="_blank"
              rel="noopener noreferrer"
              className="p-7 rounded-3xl bg-[#faf8ff] border border-slate-200/90 border-t-4 border-t-pink-500 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-pink-300 hover:shadow-[0_20px_45px_-8px_rgba(236,72,153,0.2)] hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-pink-500/20 border-t border-white/40">
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
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
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
      {/* 7. FOOTER                                                            */}
      {/* ==================================================================== */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={FESTORIA_LOGO}
              alt="Festoria Logo"
              onError={handleLogoError}
              className="w-8 h-8 rounded-lg object-contain shadow-2xs border border-slate-200/80 bg-white"
            />
            <div>
              <span className="text-[#0f172a] font-black">Festoria Platform</span>
              <span className="text-slate-400 block text-[11px]">Unified Collegiate Festival Management</span>
            </div>
          </div>

          {/* Help & Support Desk Contact Information */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600">
            <a
              href="mailto:abdwahidbc@gmail.com"
              className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>abdwahidbc@gmail.com</span>
            </a>
            <a
              href="tel:9844691633"
              className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>9844691633</span>
            </a>
            <a
              href="https://instagram.com/abd_l_wahid_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-pink-600 transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>@abd_l_wahid_</span>
            </a>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <button type="button" onClick={() => openCreateFest('track')} className="hover:text-indigo-600 transition-colors min-h-[44px]">
              Track Application
            </button>
            <a href={getAppUrl('admin.html')} className="hover:text-indigo-600 transition-colors inline-flex items-center min-h-[44px]">
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
