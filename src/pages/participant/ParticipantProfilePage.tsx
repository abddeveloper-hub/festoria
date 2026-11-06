import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import { formatPhoneDisplay } from '../../services/authService';
import {
  User,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Info
} from 'lucide-react';

export const ParticipantProfilePage: React.FC = () => {
  const { activeParticipant, teams, updateParticipant, addToast } = useFest();

  const assignedTeam = teams.find((t) => t.id === activeParticipant?.teamId);

  const [formData, setFormData] = useState({
    name: activeParticipant?.name || '',
    email: activeParticipant?.email || '',
    college: activeParticipant?.college || activeParticipant?.institution || '',
    classOrDivision: activeParticipant?.classOrDivision || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParticipant) return;

    updateParticipant(activeParticipant.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      college: formData.college.trim(),
      institution: formData.college.trim(),
      classOrDivision: formData.classOrDivision.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    addToast('success', 'Profile Updated', 'Your profile details have been saved.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Competitor Profile & Personal Details
        </h1>
        <p className="text-sm text-slate-500">
          Review your official registration credentials and update permitted contact information.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* RBAC Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Security & Integrity Policy:</strong> Official competition categories, assigned teams, registered mobile numbers, and results cannot be modified directly by participants. If you require a change in team or category, please contact your Team Leader.
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
        {/* Read-Only Identity Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Participant ID</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{activeParticipant?.id}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Assigned Team</span>
            <span className="font-bold text-slate-900 mt-0.5 block font-sans">
              {assignedTeam?.name || 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Competition Category</span>
            <span className="font-semibold text-slate-800 mt-0.5 block font-sans">
              {activeParticipant?.category} Category
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Phone Number (Locked)
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                value={formatPhoneDisplay(activeParticipant?.phone || '')}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Verified
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Phone number is bound to OTP verification. Contact support to update.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class / Division
            </label>
            <input
              type="text"
              value={formData.classOrDivision}
              onChange={(e) => setFormData({ ...formData, classOrDivision: e.target.value })}
              placeholder="e.g. BTech CSE - Sec A"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            College / Institution / Organization <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.college}
            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile Updates</span>
          </button>
        </div>
      </form>
    </div>
  );
};

