import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  FileText,
  Filter
} from 'lucide-react';

export const TeamNotificationsPage: React.FC = () => {
  const {
    platformNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useFest();

  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const displayedNotifs = platformNotifications.filter((n) => {
    if (filterMode === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Alerts & Real-time Notifications
          </h1>
          <p className="text-sm text-slate-500">
            System alerts regarding results approval, schedule revisions, and appeal updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsAsRead}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filterMode === 'all'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Notifications ({platformNotifications.length})
        </button>
        <button
          onClick={() => setFilterMode('unread')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filterMode === 'unread'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread ({platformNotifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayedNotifs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-white">
            <Bell size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No notifications</h3>
            <p className="text-xs text-slate-500 mt-1">
              You are all caught up on fest updates.
            </p>
          </div>
        ) : (
          displayedNotifs.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                !item.read
                  ? 'border-blue-200 bg-blue-50/30 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : item.severity === 'critical'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Bell size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                    {item.createdAt}
                  </span>
                </div>
              </div>

              {!item.read && (
                <button
                  onClick={() => markNotificationAsRead(item.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
