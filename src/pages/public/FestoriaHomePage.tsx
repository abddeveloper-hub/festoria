import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal as AuthModal } from '../../components/common/PhoneAuthModal';
import { CreateFestModal, CreateFestModal as OrganiseFestModal } from '../../components/public/CreateFestModal';
import { Role } from '../../types';
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
  Building,
  Users,
  FileSpreadsheet,
  Globe,
  Sliders,
  AlertTriangle,
  Scale,
  Compass,
  Check,
  ExternalLink,
  Code2,
  Workflow
} from 'lucide-react';

export const FestoriaHomePage: React.FC = () => {
  const { fests, switchPortal, setActiveFestId } = useFest();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | 'participant' | 'auto'>('auto');
  const [createFestModalOpen, setCreateFestModalOpen] = useState(false);
  const [createFestInitialTab, setCreateFestInitialTab] = useState<'apply' | 'track'>('apply');

  const openAuth = (role: Role | 'participant' | 'auto' = 'auto') => {
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  const openCreateFest = (tab: 'apply' | 'track' = 'apply') => {
    setCreateFestInitialTab(tab);
    setCreateFestModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR                                                        */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-sm tracking-widest shadow-md shadow-indigo-500/20">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white leading-tight">
                Festoria
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Enterprise
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Unified Collegiate Festival Management Platform
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openCreateFest('track')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Track Application</span>
          </button>

          <button
            type="button"
            onClick={() => openAuth('auto')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs font-semibold hover:bg-slate-800 hover:border-slate-600 transition-colors shadow-2xs"
          >
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-linear-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold hover:from-indigo-600 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/25"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Create New Fest</span>
          </button>
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION — PURE TYPOGRAPHY & VECTOR GEOMETRY (NO PHOTOS/VIDEOS) */}
      {/* ==================================================================== */}
      <section className="relative pt-24 pb-20 overflow-hidden border-b border-slate-800/80">
        {/* Subtle Ambient Background Mesh Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-10 w-[400px] h-[300px] bg-violet-600/10 rounded-full blur-[100px]" />
          {/* Subtle Vector Dot Grid */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7">
          {/* AI-Inspired Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-indigo-300 text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Next-Generation Festival Governance & Multi-Stage Orchestration</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            Architect, Schedule & Ratify{' '}
            <span className="bg-linear-to-r from-indigo-300 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
              Institutional Festivals.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Festoria powers inter-collegiate symposiums and campus championships with automated conflict-free timetables, tamper-proof judge ratifications, transparent grievance appeals, and dedicated public media hubs.
          </p>

          {/* Core Action Callouts */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-linear-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Create Your Fest</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#fest-directory"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900/90 border border-slate-700 text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:border-slate-600 transition-all shadow-xs"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Explore Active Festivals</span>
            </a>
          </div>

          {/* Metric Vector Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-8 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-black text-indigo-400">100%</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">Isolated Workspaces</div>
              <div className="text-[11px] text-slate-500 mt-1">Multi-tenant cryptographic security</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-black text-violet-400">0 Overlaps</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">Timetable Engine</div>
              <div className="text-[11px] text-slate-500 mt-1">Conflict-free stage scheduling</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">Real-Time</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">Jury Ratification</div>
              <div className="text-[11px] text-slate-500 mt-1">Live score audit trail</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-black text-amber-400">Dedicated</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">Public Fest Portals</div>
              <div className="text-[11px] text-slate-500 mt-1">Admin-managed video & media</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. PLATFORM CAPABILITIES — VECTOR CARDS (NO PHOTOS/VIDEOS)          */}
      {/* ==================================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Architecture & Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Designed for University Deaneries, Cultural Councils & Tech Fests
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every layer of Festoria eliminates the chaos of manual spreadsheets, WhatsApp coordination, and dispute escalation with structured, authoritative workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Independent Fest Workspaces</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every approved fest receives its own isolated Firestore partition. Admins, participants, judges, and schedules never bleed into other festivals.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Conflict-Free Timetable Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated venue slotting with intelligent conflict detection prevents participants or houses from being scheduled on concurrent stages.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Ratified Scoring & Tie-Breakers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Criteria-based scoring with multi-judge weightages, official jury review checkpoints, and mathematical tie-breaker rankings.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Grievance & Appeal Calibration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Formal grievance logging allows team leaders to submit documented appeals with evidence, enabling administrators to calibrate scores transparently.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Team Leader Delegation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decentralized roster management enables collegiate house captains to invite, approve, and verify participant eligibility within strict quotas.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col space-y-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Admin-Managed Public Portal (/f/:id)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every approved fest receives its own public website with hero background video, PNG logo branding, curated photo albums, and live scorecards.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. HOW IT WORKS: WORKFLOW STEPS                                      */}
      {/* ==================================================================== */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Governance Process
            </span>
            <h2 className="text-3xl font-black text-white">How Institutions Organise Festivals</h2>
            <p className="text-xs text-slate-400">
              A verified four-stage lifecycle from institutional sanction to real-time champion crowning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xs font-mono font-bold text-indigo-400">STEP 01</div>
              <h4 className="text-sm font-bold text-white">Submit Fest Application</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Institutional deaneries register with name, dates, expected footfall, and contact details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xs font-mono font-bold text-violet-400">STEP 02</div>
              <h4 className="text-sm font-bold text-white">Super Admin Provisioning</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applications are scrutinized and approved. A dedicated workspace & Fest ID are allocated automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xs font-mono font-bold text-emerald-400">STEP 03</div>
              <h4 className="text-sm font-bold text-white">Configure Stages & Media</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Admins upload hero video, logos, schedule timetables, assign criteria rubrics, and invite team leaders.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xs font-mono font-bold text-amber-400">STEP 04</div>
              <h4 className="text-sm font-bold text-white">Live Ratification & Results</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Live Ecosystem
            </span>
            <h2 className="text-3xl font-black text-white mt-1">
              Active Institutional Festivals
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visit dedicated public portals featuring admin-curated media, live schedules, and results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateFest('apply')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shrink-0"
          >
            <span>Organise Your Institution's Fest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fests.map((fest) => (
            <div
              key={fest.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>{fest.id}</span>
                  <span className="text-emerald-400 font-semibold uppercase">{fest.status}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{fest.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {fest.tagline || 'Official collegiate festival portal.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{fest.startDate} to {fest.endDate}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <a
                  href={`/f/${fest.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Visit Fest Portal (/f/{fest.id})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFestId(fest.id);
                    openAuth('participant');
                  }}
                  className="text-xs text-slate-400 hover:text-white"
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
      <section className="py-20 border-t border-slate-800/80 bg-linear-to-b from-slate-950 via-indigo-950/20 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold mx-auto shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Ready to Launch Your Campus Festival?
          </h2>

          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Submit your application in under 3 minutes. Upon Super Admin verification, your dedicated workspace and public portal are provisioned automatically.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => openCreateFest('apply')}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-slate-950 rounded-xl text-sm font-black hover:bg-slate-100 hover:scale-102 transition-all shadow-xl shadow-white/10"
            >
              <span>Create Your Fest Now</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. FOOTER                                                            */}
      {/* ==================================================================== */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              F
            </div>
            <span className="text-slate-300 font-bold">Festoria Platform</span>
            <span>— Institutional Festival Management Architecture</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <button type="button" onClick={() => openCreateFest('track')} className="hover:text-white">
              Track Application
            </button>
            <a href="/admin.html" className="hover:text-white">
              Fest Admin Console
            </a>
            <a href="/super-admin.html" className="hover:text-white">
              Super Admin Console
            </a>
          </div>
        </div>
      </footer>

      {/* Unified Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={authRole}
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
