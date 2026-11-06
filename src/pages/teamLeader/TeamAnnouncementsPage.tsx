import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Megaphone,
  AlertTriangle,
  Calendar,
  Sparkles,
  Info,
  Search,
  Filter,
  Clock,
  User
} from 'lucide-react';

export const TeamAnnouncementsPage: React.FC = () => {
  const { announcements } = useFest();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      }
      return true;
    });
  }, [announcements, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Fest Bulletins & Official Announcements
        </h1>
        <p className="text-sm text-slate-500">
          Official notifications, schedule changes, and alerts broadcasted by Fest Coordinators.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bulletins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Updates ({announcements.length})
          </button>
          <button
            onClick={() => setSelectedCategory('urgent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'urgent'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            Urgent ({announcements.filter((a) => a.category === 'urgent').length})
          </button>
          <button
            onClick={() => setSelectedCategory('schedule_change')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'schedule_change'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Schedule Changes
          </button>
          <button
            onClick={() => setSelectedCategory('results')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'results'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Results Released
          </button>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-white">
            <Megaphone size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No announcements found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check back later for coordinator announcements.
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border bg-white shadow-2xs transition-all ${
                item.category === 'urgent'
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                      item.category === 'urgent'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.category === 'schedule_change'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : item.category === 'results'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {item.author}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock size={12} />
                    {item.createdAt}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {item.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
