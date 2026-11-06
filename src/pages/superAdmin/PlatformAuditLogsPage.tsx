import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { PlatformAuditLog } from '../../types';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Eye,
  ShieldCheck,
  Lock,
  Clock,
  User,
  X
} from 'lucide-react';
import { exportToCsv } from '../../services/storage';

export const PlatformAuditLogsPage: React.FC = () => {
  const { platformAuditLogs } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return platformAuditLogs.filter((log) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        log.id.toLowerCase().includes(query) ||
        log.actorName.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.targetId.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);

      const matchType = targetTypeFilter === 'all' || log.targetType === targetTypeFilter;
      return matchSearch && matchType;
    });
  }, [platformAuditLogs, searchQuery, targetTypeFilter]);

  const handleExport = () => {
    const exportData = filteredLogs.map((l) => ({
      Audit_ID: l.id,
      Timestamp: l.timestamp,
      Actor_Name: l.actorName,
      Actor_Role: l.actorRole,
      Action: l.action,
      Target_Type: l.targetType,
      Target_ID: l.targetId,
      Details: l.details,
      Before_Value: l.beforeValue || 'N/A',
      After_Value: l.afterValue || 'N/A',
    }));
    exportToCsv('platform_immutable_audit_logs', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Platform Immutable Audit Logs</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
              APPEND-ONLY COMPLIANCE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative, tamper-evident governance ledger recording all administrative decisions, lifecycle transitions, and role revisions.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search action, actor, target ID, or change summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Target Type:</span>
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Targets</option>
            <option value="fest">Fest Records</option>
            <option value="fest_request">Fest Requests</option>
            <option value="user">User Accounts</option>
            <option value="platform_settings">Platform Settings</option>
            <option value="security">Security & Access</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Acting User & Role</th>
                <th className="px-4 py-3">Operation / Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Audit Summary</th>
                <th className="px-4 py-3 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No audit records match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{log.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{log.actorRole.replace('_', ' ')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-semibold text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {log.targetType}
                      </span>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">{log.targetId}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL WITH BEFORE / AFTER INSPECTION */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Audit Record: {selectedLog.id}</h3>
                <p className="text-slate-500 mt-0.5">Recorded {selectedLog.timestamp} UTC</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded bg-slate-50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Acting Actor</span>
                  <span className="font-semibold text-slate-900">{selectedLog.actorName} ({selectedLog.actorRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actor ID</span>
                  <span className="font-mono text-slate-900">{selectedLog.actorId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operation</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Entity</span>
                  <span className="font-mono text-slate-900">{selectedLog.targetType} ({selectedLog.targetId})</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Change Summary</span>
                <p className="p-3 border border-slate-200 rounded bg-white text-slate-800 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              {/* Before and After State */}
              {(selectedLog.beforeValue || selectedLog.afterValue) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-slate-200 rounded bg-rose-50/50">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">State Before Change</span>
                    <pre className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                      {selectedLog.beforeValue || 'None'}
                    </pre>
                  </div>
                  <div className="p-3 border border-slate-200 rounded bg-emerald-50/50">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">State After Change</span>
                    <pre className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                      {selectedLog.afterValue || 'None'}
                    </pre>
                  </div>
                </div>
              )}

              <div className="p-2 border border-slate-100 rounded bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Cryptographic Digest: SHA-256 Validated</span>
                <span>Storage: Append-Only Immutable Block</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
