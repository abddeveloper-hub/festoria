import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { PlatformNotification, NotificationSeverity } from '../../types';
import {
  Bell,
  CheckCheck,
  Filter,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldAlert,
  Clock,
  Inbox,
  Award
} from 'lucide-react';

export const PlatformNotificationsPage: React.FC = () => {
  const {
    platformNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setSuperAdminTab,
    setActiveFestId
  } = useFest();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const filteredNotifs = useMemo(() => {
    return platformNotifications.filter((n) => {
      const matchSeverity = severityFilter === 'all' || n.severity === severityFilter;
      const matchCategory = categoryFilter === 'all' || n.category === categoryFilter;
      const matchUnread = !unreadOnly || !n.read;
      return matchSeverity && matchCategory && matchUnread;
    });
  }, [platformNotifications, severityFilter, categoryFilter, unreadOnly]);

  const unreadCount = platformNotifications.filter((n) => !n.read).length;

  const handleOpenTarget = (n: PlatformNotification) => {
    markNotificationAsRead(n.id);
    if (n.relatedRequestId) {
      setSuperAdminTab('fest_requests');
    } else if (n.relatedFestId) {
      setActiveFestId(n.relatedFestId);
      setSuperAdminTab('fest_monitoring');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Platform Notification Centre</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
              {unreadCount} UNREAD ALERTS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform warnings, governance review notices, deadline reminders, and security events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="fest_request">Fest Requests</option>
              <option value="deadline">Deadlines</option>
              <option value="conflict">Conflicts</option>
              <option value="scoring">Scoring</option>
              <option value="security">Security</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 border border-slate-200 rounded px-3 py-2 bg-white text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0"
            />
            <span>Unread Only</span>
          </label>
        </div>

        <div className="text-slate-500 text-xs">
          Showing {filteredNotifs.length} notifications
        </div>
      </div>

      {/* Notifications List */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white divide-y divide-slate-100">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No notifications match your current filter selection.
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenTarget(n)}
              className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                n.read ? 'bg-white opacity-80 hover:bg-slate-50/70' : 'bg-slate-50/80 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {n.severity === 'critical' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : n.severity === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : n.severity === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-sky-600 shrink-0" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded capitalize ${
                      n.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : n.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : n.severity === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {n.severity}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{n.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Category: <strong className="text-slate-600 capitalize">{n.category.replace('_', ' ')}</strong></span>
                    <span>•</span>
                    <span>{n.createdAt}</span>
                    {(n.relatedRequestId || n.relatedFestId) && (
                      <>
                        <span>•</span>
                        <span className="text-slate-700 underline font-medium">Click to open record &rarr;</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {!n.read ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(n.id);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-900 border border-slate-200 rounded px-2 py-1 bg-white hover:bg-slate-50"
                  >
                    Mark Read
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400">Read</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
