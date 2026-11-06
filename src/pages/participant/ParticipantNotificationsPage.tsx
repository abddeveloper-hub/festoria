import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Trophy,
  Info,
  Trash2,
  CheckCheck
} from 'lucide-react';

export const ParticipantNotificationsPage: React.FC = () => {
  const { announcements, activeParticipant } = useFest();
  const [filter, setFilter] = useState<'all' | 'urgent' | 'schedule' | 'results'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Synthesize notifications from fest announcements + participant account milestones
  const participantNotices = [
    {
      id: 'notice-account-status',
      title:
        activeParticipant?.approvalStatus === 'approved'
          ? 'Registration Approved by Team Leader'
          : activeParticipant?.approvalStatus === 'pending_approval'
          ? 'Registration Pending Team Leader Approval'
          : activeParticipant?.approvalStatus === 'more_info_required'
          ? 'Additional Verification Info Required'
          : 'Registration Under Review',
      content:
        activeParticipant?.approvalStatus === 'approved'
          ? `Your participant profile (${activeParticipant.name}, Chest #${activeParticipant.id}) has been formally approved for participation.`
          : activeParticipant?.approvalStatus === 'pending_approval'
          ? 'Your registration is queued in your Team Leader\'s review drawer. You will receive real-time access once approved.'
          : activeParticipant?.approvalStatus === 'more_info_required'
          ? `Your Team Leader requested clarification: "${activeParticipant.moreInfoRequest || 'Please contact your leader'}"`
          : 'Status is currently under review.',
      category: activeParticipant?.approvalStatus === 'approved' ? 'general' : 'urgent',
      createdAt: activeParticipant?.approvedAt || activeParticipant?.createdAt || new Date().toISOString(),
      author: 'Registration Desk'
    },
    {
      id: 'notice-phone-verified',
      title: 'Phone Number Authenticated',
      content: `Your phone number ${activeParticipant?.phone || ''} was securely verified with OTP-2FA encryption.`,
      category: 'general',
      createdAt: activeParticipant?.createdAt || new Date().toISOString(),
      author: 'System Security'
    }
  ];

  // Combine announcements with participant notices
  const allNotifications = [
    ...participantNotices,
    ...announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      createdAt: a.createdAt,
      author: a.author
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter
  const filtered = allNotifications.filter((n) => {
    if (filter === 'urgent') return n.category === 'urgent';
    if (filter === 'schedule') return n.category === 'schedule_change';
    if (filter === 'results') return n.category === 'results';
    return true;
  });

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  };

  const markAllAsRead = () => {
    setReadIds(new Set(allNotifications.map((n) => n.id)));
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            Urgent Notice
          </span>
        );
      case 'schedule_change':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Schedule Update
          </span>
        );
      case 'results':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Trophy className="w-3 h-3 text-blue-600" />
            Results Declared
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            <Info className="w-3 h-3 text-slate-500" />
            Announcement
          </span>
        );
    }
  };

  const unreadCount = allNotifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Notifications & Broadcasts
          </h1>
          <p className="text-sm text-slate-500">
            Important updates, schedule modifications, and fest committee announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `All Notices (${allNotifications.length})` },
          { key: 'urgent', label: 'Urgent Alerts' },
          { key: 'schedule', label: 'Schedule Changes' },
          { key: 'results', label: 'Results' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            You're all caught up! New alerts will appear here as they are published.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isRead = readIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`bg-white border rounded-lg p-4 transition-all ${
                  isRead
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-300 shadow-sm ring-1 ring-slate-900/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      {getCategoryBadge(item.category)}
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <h3
                      className={`text-sm ${
                        isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>

                    <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Source: {item.author}</span>
                    </div>
                  </div>

                  {!isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-700 p-1"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

