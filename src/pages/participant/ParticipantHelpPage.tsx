import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  HelpCircle,
  Phone,
  Mail,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Clock,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { ComplaintCategory } from '../../types';

export const ParticipantHelpPage: React.FC = () => {
  const {
    activeParticipant,
    teams,
    programmes,
    settings,
    complaints,
    submitComplaint
  } = useFest();

  const myTeam = teams.find((t) => t.id === activeParticipant?.teamId);
  const myProgrammes = programmes.filter((p) =>
    activeParticipant?.registeredProgrammes?.includes(p.id)
  );

  // Tickets/complaints relevant to this participant
  const myComplaints = complaints.filter(
    (c) =>
      c.teamId === activeParticipant?.teamId &&
      (c.participantId === activeParticipant?.id ||
        c.participantName === activeParticipant?.name)
  );

  // Form State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formData, setFormData] = useState<{
    subject: string;
    category: ComplaintCategory;
    programmeId: string;
    description: string;
    expectedCorrection: string;
  }>({
    subject: '',
    category: 'incorrect_score_calc',
    programmeId: myProgrammes[0]?.id || '',
    description: '',
    expectedCorrection: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the mandatory reporting time before my scheduled competition?',
      a: 'Participants must report to the Stage Coordinator at the designated venue exactly 30 minutes before the scheduled start time. Roll call is taken 15 minutes prior. Late arrivals after final call will be marked disqualified.'
    },
    {
      q: 'Do I need to wear my physical Chest Number badge at all times?',
      a: 'Yes. Your official chest badge (or digital ID card with photo) must be visibly pinned to your upper attire during all stage appearances and backstage roll calls.'
    },
    {
      q: 'How do I raise a dispute regarding published competition scores?',
      a: 'Disputes or grievances regarding scoring calculation errors or rule violations must be submitted via this Helpdesk or directly through your Team Leader within 60 minutes of the official result declaration.'
    },
    {
      q: 'What should I do if two of my registered competitions clash in schedule?',
      a: 'Submit an urgent Schedule Clash inquiry immediately using the grievance form below. Our stage managers prioritize time-staggering for dual-event competitors.'
    },
    {
      q: 'Can I change my registered phone number or team assignment?',
      a: 'Team assignment is fixed by your institution\'s festival delegation. For phone number updates, please coordinate with your Team Leader or Central Fest Helpdesk.'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParticipant) return;

    submitComplaint({
      festId: activeParticipant.festId || 'FEST-01',
      teamId: activeParticipant.teamId,
      teamName: myTeam?.name || 'Assigned House',
      programmeId: formData.programmeId || myProgrammes[0]?.id || 'GENERAL',
      programmeName: programmes.find((p) => p.id === formData.programmeId)?.name || 'General Inquiry',
      participantId: activeParticipant.id,
      participantName: activeParticipant.name,
      category: formData.category,
      description: `[Subject: ${formData.subject}] ${formData.description}`,
      expectedCorrection: formData.expectedCorrection || 'Investigation and clarification',
      status: 'submitted'
    });

    setSubmitSuccess(true);
    setFormData({
      subject: '',
      category: 'incorrect_score_calc',
      programmeId: myProgrammes[0]?.id || '',
      description: '',
      expectedCorrection: ''
    });

    setTimeout(() => {
      setSubmitSuccess(false);
      setShowSubmitModal(false);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Helpdesk, FAQs & Grievance Redressal
        </h1>
        <p className="text-sm text-slate-500">
          Festival regulations, leader contacts, and direct grievance escalation to festival coordinators.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Leader Contact */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Your Team Leader
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {myTeam?.teamLeaderName || 'Assigned Coordinator'}
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Primary point of contact for team logistics, stage reporting authorizations, and substitutions.
          </p>
          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{myTeam?.teamLeaderContact || 'Direct Contact via House Portal'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                🏛
              </span>
              <span>{myTeam?.name} ({myTeam?.institution})</span>
            </div>
          </div>
        </div>

        {/* Central Fest Helpdesk */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Central Fest Control Desk
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {settings.festName} Secretariat
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            For campus-wide security, medical emergency, or official competition governance disputes.
          </p>
          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{settings.contactPhone || '+91 98400 12345'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{settings.contactEmail || 'fest-support@festoria.edu'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket / Grievance CTA Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Need to dispute a score or report a schedule clash?
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit an official grievance ticket directly to the Fest Review Committee and your Team Leader.
          </p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          Submit Official Grievance
        </button>
      </div>

      {/* My Submitted Grievances (if any) */}
      {myComplaints.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Your Submitted Grievances & Appeals ({myComplaints.length})</span>
          </h2>

          <div className="space-y-2">
            {myComplaints.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {item.id} — {item.programmeName || 'General Grievance'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.status === 'under_review'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600">{item.description}</p>
                {item.resolutionNote && (
                  <div className="mt-2 p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                    <strong className="text-slate-900">Resolution:</strong> {item.resolutionNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Accordion */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <HelpCircle className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Frequently Asked Questions & Regulations
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 hover:text-slate-950 gap-4"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pr-6">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grievance Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  Submit Grievance / Appeal
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">
                  Grievance Submitted Successfully
                </h4>
                <p className="text-xs text-slate-500">
                  Your ticket has been logged and assigned to the Review Jury & Team Leader.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stage time clash between Western Vocal and Elocution"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as ComplaintCategory })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    >
                      <option value="incorrect_score_calc">Scoring Calculation Error</option>
                      <option value="score_entry_error">Score Entry / Typo Error</option>
                      <option value="incorrect_result">Incorrect Result Position</option>
                      <option value="eligibility_dispute">Eligibility Dispute</option>
                      <option value="judging_procedure">Judging Procedure Violation</option>
                      <option value="schedule_issue">Schedule Clash or Stage Timing</option>
                      <option value="other">Other Inquiry / Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Related Programme
                    </label>
                    <select
                      value={formData.programmeId}
                      onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    >
                      <option value="">General (Not Programme Specific)</option>
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Explanation *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific details, timestamps, or stage occurrences..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Redressal / Action
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Recalculate criteria scores / Reschedule reporting window"
                    value={formData.expectedCorrection}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedCorrection: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
