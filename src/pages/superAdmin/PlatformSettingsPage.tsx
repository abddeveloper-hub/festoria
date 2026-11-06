import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import { PlatformSettings } from '../../types';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Bell,
  Database,
  Globe,
  Sliders,
  FileCheck
} from 'lucide-react';

export const PlatformSettingsPage: React.FC = () => {
  const { platformSettings, updatePlatformSettings, addToast } = useFest();

  const [settings, setSettings] = useState<PlatformSettings>({ ...platformSettings });
  const [activeSettingsSection, setActiveSettingsSection] = useState<
    'general' | 'requests' | 'defaults' | 'security' | 'data' | 'appearance'
  >('general');

  const [isDirty, setIsDirty] = useState(false);

  const handleChange = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings(settings);
    setIsDirty(false);
  };

  const handleResetForm = () => {
    setSettings({ ...platformSettings });
    setIsDirty(false);
    addToast('info', 'Reverted', 'Settings form reverted to current stored values.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Save Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Platform Settings & Governance</h2>
            {isDirty && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                UNSAVED CHANGES
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure global governance rules, request validation constraints, security policies, and defaults for newly approved fests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              onClick={handleResetForm}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Governance Parameters</span>
          </button>
        </div>
      </div>

      {/* Navigation & Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Submenu */}
        <div className="border border-slate-200 rounded p-3 bg-white space-y-1">
          {[
            { id: 'general', label: 'A. General Platform Settings', icon: Sliders },
            { id: 'requests', label: 'B. Fest Request Policies', icon: FileCheck },
            { id: 'defaults', label: 'C. Fest Defaults & Lifecycle', icon: CheckCircle2 },
            { id: 'security', label: 'D. Security & MFA Policies', icon: Shield },
            { id: 'data', label: 'E. Data Retention & Archival', icon: Database },
            { id: 'appearance', label: 'F. Appearance & Public Brand', icon: Globe },
          ].map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSettingsSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSettingsSection(sec.id as any)}
                className={`w-full text-left px-3 py-2.5 rounded transition-colors text-xs flex items-center gap-2.5 font-medium ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Body */}
        <div className="lg:col-span-3 border border-slate-200 rounded p-6 bg-white space-y-6 text-xs">
          {/* GENERAL SETTINGS */}
          {activeSettingsSection === 'general' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                General Platform Identity & Availability
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Platform Brand Name</label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => handleChange('platformName', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Platform System Timezone</label>
                  <input
                    type="text"
                    value={settings.defaultTimezone}
                    onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Platform Description</label>
                <textarea
                  rows={2}
                  value={settings.platformDescription}
                  onChange={(e) => handleChange('platformDescription', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Support Contact Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Support Helpline Phone</label>
                  <input
                    type="text"
                    value={settings.supportPhone}
                    onChange={(e) => handleChange('supportPhone', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Platform Maintenance Mode</span>
                    <span className="text-[11px] text-slate-500">
                      When enabled, public visitor portal displays a maintenance notice. Super Admin Panel remains accessible.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* REQUEST POLICIES */}
          {activeSettingsSection === 'requests' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Fest Application & Charter Approval Rules
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowNewFestRequests}
                    onChange={(e) => handleChange('allowNewFestRequests', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Accept New Fest Requests</span>
                    <span className="text-[11px] text-slate-500">
                      Allow institutional admins to submit new festival operating applications.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireApprovalNote}
                    onChange={(e) => handleChange('requireApprovalNote', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Mandate Internal Review Note for Approvals</span>
                    <span className="text-[11px] text-slate-500">
                      Require reviewer to provide written justification in audit log before granting festival charter.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.resubmissionAllowed}
                    onChange={(e) => handleChange('resubmissionAllowed', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Allow Resubmissions After Declining</span>
                    <span className="text-[11px] text-slate-500">
                      Permit rejected applicants to re-apply once institutional objections are addressed.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* FEST DEFAULTS */}
          {activeSettingsSection === 'defaults' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Default Configuration for Newly Chartered Fests
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.defaultPublicVisibility}
                    onChange={(e) => handleChange('defaultPublicVisibility', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Default Public Portal Visibility</span>
                    <span className="text-[11px] text-slate-500">
                      Publish public schedule automatically once programmes and venues are scheduled.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* SECURITY & MFA */}
          {activeSettingsSection === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Authentication, Session & Access Control Policies
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.mfaRequired}
                    onChange={(e) => handleChange('mfaRequired', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Enforce Multi-Factor Authentication (MFA)</span>
                    <span className="text-[11px] text-slate-500">
                      Require TOTP / 2FA verification for all Super Admin and Fest Admin sign-in sessions.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Session Inactivity Timeout (Minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => handleChange('sessionTimeoutMinutes', Number(e.target.value))}
                    className="w-48 p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DATA RETENTION */}
          {activeSettingsSection === 'data' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Data Governance, Archival & Audit Ledger Retention
              </h3>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Audit Log Retention Policy (Days)</label>
                <input
                  type="number"
                  value={settings.auditLogRetentionDays}
                  onChange={(e) => handleChange('auditLogRetentionDays', Number(e.target.value))}
                  className="w-48 p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Immutable security records are retained for compliance audits before cold storage archival.
                </span>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeSettingsSection === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Platform White-Label Branding & Public Site
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Default UI Language</label>
                  <input
                    type="text"
                    value={settings.defaultLanguage}
                    onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
