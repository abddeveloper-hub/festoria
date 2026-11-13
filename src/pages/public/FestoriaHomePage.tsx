import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal as AuthModal } from '../../components/common/PhoneAuthModal';
import { CreateFestModal } from '../../components/public/CreateFestModal';
import { Role } from '../../types';
import { getAppUrl, navigateTo } from '../../utils/navigation';
import { FESTORIA_LOGO, handleLogoError } from '../../utils/logo';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  Star,
  Layers,
  Activity,
  SlidersHorizontal,
  BarChart3,
  Globe,
  Users,
  FileCheck,
  Megaphone,
  FileText,
  Sparkles,
  Phone,
  Mail,
  ChevronDown,
  Lock,
  ExternalLink,
  Menu,
  X,
  Compass,
  Upload,
  Play
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

  const openAuth = (role: Role | 'participant' | 'auto' = 'auto') => {
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  const openCreateFest = (tab: 'apply' | 'track' = 'apply') => {
    setCreateFestInitialTab(tab);
    setCreateFestModalOpen(true);
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-white pb-32 relative min-h-screen">
      {/* Ambient Animated Background Elements (Tech Emerald & Slate) */}
      <div aria-hidden="true" className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="animate-orb-1 absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-emerald-200/50 via-teal-200/40 to-emerald-100/30 rounded-full blur-3xl"></div>
        <div className="animate-orb-2 absolute top-1/3 -right-24 w-80 h-80 bg-gradient-to-br from-teal-200/35 via-cyan-100/30 to-slate-200/40 rounded-full blur-3xl"></div>
        <div className="animate-orb-3 absolute top-2/3 -left-20 w-88 h-88 bg-gradient-to-tr from-emerald-100/40 via-emerald-200/30 to-indigo-100/25 rounded-full blur-3xl"></div>
      </div>

      {/* ==================================================================== */}
      {/* 1. HEADER                                                            */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all duration-300">
        <div className="px-5 h-16 flex items-center justify-between max-w-5xl mx-auto">
          {/* Brand Logo with micro-interaction */}
          <div className="flex items-center gap-3">
            <a aria-label="Festoria Home" className="group flex items-center gap-2.5" href="#">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_8px_20px_-3px_rgba(5,150,105,0.25)] ring-1 ring-emerald-400/40 group-active:scale-95 group-hover:rotate-6 transition-all duration-200 select-none text-white font-extrabold text-lg">
                <span>F</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-700 bg-clip-text text-transparent font-display">
                    Festoria
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60 uppercase tracking-wide">
                    OS
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors py-2">
              Features
            </a>
            <a href="#fest-directory" className="hover:text-emerald-600 transition-colors py-2">
              Festivals
            </a>
            <a href="#testimonials" className="hover:text-emerald-600 transition-colors py-2">
              Stories
            </a>
            <a href="#helpdesk" className="hover:text-emerald-600 transition-colors py-2">
              Helpdesk
            </a>
          </nav>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCreateFest('track')}
              className="hidden lg:inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all duration-150"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Track</span>
            </button>

            <button
              type="button"
              onClick={() => openAuth('auto')}
              className="text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all duration-150"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="group text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_8px_20px_-3px_rgba(5,150,105,0.25)] hover:shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)] active:scale-95 transition-all duration-200 flex items-center gap-1 min-h-[38px]"
            >
              <span>Start Trial</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white font-extrabold text-sm shadow-xs select-none">
                    <span>F</span>
                  </div>
                  <span className="font-extrabold text-slate-900 text-base font-display">Festoria OS</span>
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
                  className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Core Features
                </a>
                <a
                  href="#fest-directory"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Active Festivals
                </a>
                <a
                  href="#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Coordinator Stories
                </a>
                <a
                  href="#helpdesk"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700"
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
                  <Compass className="w-4 h-4 text-emerald-600" />
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
                  className="w-full text-center px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md mt-4"
                >
                  Start Free Trial
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
      {/* 2. HERO SECTION                                                      */}
      {/* ==================================================================== */}
      <section className="relative pt-10 sm:pt-14 pb-8 px-5 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Live Status Badges Stack */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-200/80 shadow-xs transition-transform hover:scale-[1.02]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wide text-emerald-900">Next-Gen Festival OS</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-sm text-slate-200 text-[10px] font-medium shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Trusted by 1200+ fest coordinators</span>
          </div>
        </div>

        {/* Hero Title & Pitch */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-4 font-display text-center max-w-3xl">
          Festivals Managed <br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Flawlessly & Faster.
          </span>
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed mb-7 font-normal max-w-2xl mx-auto text-center">
          The gold standard for high-energy arts fests, campus tournaments, and inter-college championships. Real-time scores, auto-clash schedules, and instant public micro-portals.
        </p>

        {/* Call to Actions with dynamic micro-interactions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all duration-200 min-h-[48px]"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-150 min-h-[48px]"
          >
            <Play className="w-4 h-4 text-slate-500" />
            <span>Explore Live Features & Demo</span>
          </a>
        </div>

        {/* Live Fest Metrics Ribbon */}
        <div className="grid grid-cols-3 gap-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm text-center divide-x divide-slate-100 w-full max-w-lg mx-auto">
          <div className="pr-1">
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">50k+</p>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Entries Logged</p>
          </div>
          <div className="px-1">
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 font-display flex items-center justify-center gap-0.5">
              <span>0.2s</span>
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            </p>
            <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider mt-0.5">Score Sync</p>
          </div>
          <div className="pl-1">
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">100%</p>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Clash-Free</p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE MARQUEE / CORE MODULES SECTION                        */}
      {/* ==================================================================== */}
      <section className="py-3.5 mb-3 border-y border-slate-200/70 bg-white/60 backdrop-blur-sm overflow-hidden" data-purpose="marquee-modules">
        <div className="px-5 mb-2.5 flex items-center justify-between max-w-5xl mx-auto">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Core Engine Modules
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
            Tap tags to explore
          </span>
        </div>

        {/* Infinite horizontal marquee strip with micro-interactive tag chips */}
        <div className="overflow-x-auto hide-scrollbar px-4">
          <div className="animate-marquee flex gap-2.5 py-1">
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Live Leaderboard</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bulk Entry</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto Scheduling</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Team Manager Access</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Judge Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Fest Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clash-Free Timetable</span>
            </button>

            {/* Repeating set for smooth seamless continuous marquee */}
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Live Leaderboard</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bulk Entry</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto Scheduling</span>
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. FEATURE GRID SECTION (12 FEATURE CARDS WITH SHEEN EFFECT)         */}
      {/* ==================================================================== */}
      <section className="px-5 py-8 max-w-5xl mx-auto" data-purpose="festie-features-grid" id="features">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Built For High Pressure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug font-display">
            Everything you need to pull off perfection.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-lg mx-auto">
            Engineered for seamless campus arts, debates, dances & athletic championships.
          </p>
        </div>

        {/* Feature Cards: Responsive Grid (2-cols on mobile, 3-cols on md, 4-cols on lg) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Bulk Entry */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Bulk Entry, Skip Hurry
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Import hundreds of student & team entries via sheets instantly.
              </p>
            </div>
          </div>

          {/* Card 2: Customizability */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Build Festival Your Way
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Fully customizable categories, stage limits, and point structures.
              </p>
            </div>
          </div>

          {/* Card 3: Smart Validation */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Make Entry Effortless
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Smart validation stops duplicate candidate registrations.
              </p>
            </div>
          </div>

          {/* Card 4: Clash Free Schedule */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Plan With Confidence
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Intelligent timeline scheduling resolves stage & participant clashes.
              </p>
            </div>
          </div>

          {/* Card 5: Digital Judging */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Smarter Fast Judging
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Digital marking sheets secure zero calculation mistakes.
              </p>
            </div>
          </div>

          {/* Card 6: Publish Results */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Instant Public Results
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Single-click official publish to live public screens & web.
              </p>
            </div>
          </div>

          {/* Card 7: Live Web Portal */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-teal-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-teal-700 transition-colors">
                Launch Fest Online
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Ready-to-share public micro-portal updated in real-time.
              </p>
            </div>
          </div>

          {/* Card 8: Role Permissions */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-teal-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-teal-700 transition-colors">
                Empower Teams
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Assign role permissions for volunteers, committee, & judges.
              </p>
            </div>
          </div>

          {/* Card 9: Judge Scoring Tools */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-teal-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-teal-700 transition-colors">
                Score Confidently
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Simple, intuitive numerical scoring forms tailored to each item.
              </p>
            </div>
          </div>

          {/* Card 10: Broadcast */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-teal-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-teal-700 transition-colors">
                Direct Broadcast
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Direct broadcast to social channels, campus reps, and press rooms.
              </p>
            </div>
          </div>

          {/* Card 11: Real-time Glance */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Live Fest Glance
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Live stage delays, points tally, and pending judgment overview.
              </p>
            </div>
          </div>

          {/* Card 12: Automated Printouts */}
          <div className="group sheen-effect p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                Forms Ready to Go
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Generate automated certificates, tabulation printouts & chest IDs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. INTERACTIVE LIVE PREVIEW CARD (VISUAL HOOK)                       */}
      {/* ==================================================================== */}
      <section className="px-5 py-6 max-w-lg md:max-w-xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-900">Stage 01 • Main Arena Live</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Running On Time
            </span>
          </div>
          <div className="pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                  01
                </span>
                <span className="font-semibold text-slate-800">Classical Dance Solo</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                98.4 pts
              </span>
            </div>
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                  02
                </span>
                <span className="font-semibold text-slate-700">Western Group Vocal</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Judging...
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. TESTIMONIAL SECTION (COORDINATOR STORIES)                         */}
      {/* ==================================================================== */}
      <section id="testimonials" className="mt-4 pt-12 pb-10 px-5 bg-gradient-to-b from-white via-slate-50 to-white border-t border-slate-200/80 rounded-t-[32px] max-w-4xl mx-auto">
        <div className="text-center max-w-sm mx-auto mb-6">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Fest Coordinator Stories</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug mt-1 font-display">
            It’s not about <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Saving time. It's about zero errors.
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Festoria is the new standard for high-energy event management across major educational institutions.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto">
          {/* Review 1: Rafeeq Hudawi */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                “Festoria transformed how we organize our All Kerala Inter College Arts Fest. The public portal was absolutely beautiful and attendees loved the real-time updates.”
              </p>
              <button
                type="button"
                onClick={() => openCreateFest('apply')}
                className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 group"
              >
                <span>Read full case study</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center ring-2 ring-emerald-500/20">
                  RH
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Rafeeq Hudawi</p>
                  <p className="text-[10px] text-slate-400">Arts Convener • Aug 2024</p>
                </div>
              </div>
              {/* 5-Star Indicator */}
              <div aria-label="5 stars" className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>

          {/* Review 2: Shakir Mubarak Kaippuram */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                “The analytics and participant handling features are incredible. We boosted team engagement by 60% and cut tabulation time by half.”
              </p>
              <button
                type="button"
                onClick={() => openCreateFest('apply')}
                className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 group"
              >
                <span>Read full case study</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-800">
                  SM
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Shakir Mubarak Kaippuram</p>
                  <p className="text-[10px] text-slate-400">University Coordinator • Aug 2024</p>
                </div>
              </div>
              {/* 5-Star Indicator */}
              <div aria-label="5 stars" className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. ACTIVE INSTITUTIONAL FESTIVALS DIRECTORY                          */}
      {/* ==================================================================== */}
      <section id="fest-directory" className="py-12 px-5 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">Ecosystem</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Active Campus Festivals</h2>
            <p className="text-xs text-slate-500 mt-1">Explore dedicated public portals featuring real-time timetables and leaderboards.</p>
          </div>
          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs hover:from-emerald-700 hover:to-teal-700 transition-colors self-start sm:self-auto"
          >
            <span>Create New Fest / Organise</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fests.map((fest) => (
            <div
              key={fest.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-mono">
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                    {fest.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {fest.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{fest.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {fest.tagline || 'Official collegiate festival portal.'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{fest.startDate} to {fest.endDate}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={getAppUrl(`/f/${fest.id}`)}
                  data-portal-url={`/f/${fest.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveFestId(fest.id);
                    navigateTo(`?fest=${fest.id}`);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <span>Visit Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFestId(fest.id);
                    openAuth('participant');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. INTERACTIVE FAQ ACCORDION                                         */}
      {/* ==================================================================== */}
      <section className="px-5 py-8 max-w-lg mx-auto" data-purpose="faq-accordion">
        <div className="text-center mb-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Got Questions?</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1 font-display">Frequently Asked</h3>
        </div>
        <div className="space-y-2.5">
          {/* FAQ 1 */}
          <details className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-xs text-slate-800">
              <span>Can we run offline during poor network?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2.5">
              Yes! Festoria caches scoring forms locally on mobile devices. When connection drops, judges continue marking and data auto-syncs the moment WiFi or LTE reconnects.
            </p>
          </details>

          {/* FAQ 2 */}
          <details className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-xs text-slate-800">
              <span>How does clash prevention work?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2.5">
              Our scheduling engine checks student candidate IDs against event timetables and stages in real-time, instantly warning you if a student is slotted for two overlapping stages.
            </p>
          </details>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 9. OFFICIAL PLATFORM HELPDESK & SUPPORT                              */}
      {/* ==================================================================== */}
      <section id="helpdesk" className="py-12 px-5 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center space-y-2 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Help & Support</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Festoria Official Platform Helpdesk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Need assistance with festival onboarding, application tracking, or technical support? Connect directly with our platform coordinators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phone Helpdesk */}
          <a
            href="tel:9844691633"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Voice Helpline</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">Phone Helpline</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Direct phone consultation for coordinators, principals, and festival organizers.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-slate-900">9844691633</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:underline">
                Call Now <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </a>

          {/* Email Helpdesk */}
          <a
            href="mailto:abdwahidbc@gmail.com"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Official Inquiries</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">Official Support Email</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Detailed queries, festival provisioning requests, and administrative support.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono font-bold text-[11px] text-slate-900 truncate max-w-[140px]">
                abdwahidbc@gmail.com
              </span>
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 shrink-0 group-hover:underline">
                Email Desk <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </a>

          {/* Instagram Desk */}
          <a
            href="https://instagram.com/abd_l_wahid_"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-pink-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Social Channel</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">Official Instagram</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Official updates, fest highlights, showcase stories, and direct messages.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-slate-900">@abd_l_wahid_</span>
              <span className="text-xs font-bold text-pink-600 flex items-center gap-1 group-hover:underline">
                Connect <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 10. CALL TO ACTION BOTTOM BANNER                                     */}
      {/* ==================================================================== */}
      <section className="px-5 mt-4 mb-8 max-w-lg md:max-w-xl mx-auto" id="trial">
        <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white relative overflow-hidden shadow-2xl ring-1 ring-emerald-500/30">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center mb-3 shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight mb-2 font-display">Ready to Upgrade Your Festival?</h3>
            <p className="text-xs text-emerald-100/80 mb-5 leading-relaxed">
              Create your festival workspace in under 2 minutes. Free trial with complete feature access and priority onboarding.
            </p>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => openCreateFest('apply')}
                className="group py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/30 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <span>Start Free Trial Today</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#helpdesk"
                className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <Phone className="w-4 h-4" />
                <span>Talk to Fest Specialist</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 11. MOBILE DOCK NAVIGATION (STICKY BOTTOM BAR)                       */}
      {/* ==================================================================== */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 px-4 py-2.5 z-40" data-purpose="bottom-sticky-bar">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200/80 shadow-xs">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 leading-tight">Festoria 2026 Edition</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Trusted by 100+ colleges</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all duration-150 flex items-center gap-1"
            >
              <span>Try Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

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
