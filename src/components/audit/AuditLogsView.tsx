import React, { useState, useEffect } from 'react';
import { useDns } from '../../context/DnsContext';
import { AuditLogEntry } from '../../types/dns';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  Clock,
  Shield,
  User,
  ChevronDown,
  ChevronUp,
  FileCode,
  ArrowRight
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, rollbackRecord, domains, highlightedItemId, t } = useDns();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Scroll to highlighted audit log
  useEffect(() => {
    if (highlightedItemId) {
      const el = document.getElementById(`audit-${highlightedItemId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedItemId]);

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (domainFilter !== 'ALL' && log.domainName !== domainFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mActor = log.actor.name.toLowerCase().includes(q) || log.actor.email.toLowerCase().includes(q);
      const mDetails = log.details.toLowerCase().includes(q);
      const mDomain = log.domainName.toLowerCase().includes(q);
      const mIp = log.ipAddress.toLowerCase().includes(q);
      return mActor || mDetails || mDomain || mIp;
    }
    return true;
  });

  const handleRollback = (log: AuditLogEntry) => {
    if (
      window.confirm(
        `Xác nhận HOÀN TÁC (Rollback) thay đổi đối với ${log.recordName || log.domainName}? Hệ thống sẽ phục hồi lại phiên bản trước đó ngay lập tức.`
      )
    ) {
      rollbackRecord(log.id);
    }
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATE_RECORD':
        return <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">TẠO BẢN GHI</span>;
      case 'UPDATE_RECORD':
        return <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">CẬP NHẬT</span>;
      case 'DELETE_RECORD':
        return <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/50">XÓA BẢN GHI</span>;
      case 'ROLLBACK':
        return <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">HOÀN TÁC (ROLLBACK)</span>;
      case 'DDNS_AUTO_UPDATE':
        return <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50">DDNS TỰ ĐỘNG</span>;
      case 'SSL_RENEWED':
        return <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/50">SSL RENEWED</span>;
      default:
        return <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              NHẬT KÝ KIỂM TOÁN AN TOÀN
            </span>
            <span className="text-xs text-slate-400">· Lưu vết truy cập & 1-Click Rollback</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Lịch Sử Thao Tác & Khôi Phục Bản Ghi
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ghi nhận toàn bộ thao tác thêm, sửa, xóa, tự động cập nhật IP DDNS cùng địa chỉ IP nguồn. Hỗ trợ khôi phục tức thời phiên bản cũ an toàn.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-slate-400 block font-mono">Tổng số nhật ký:</span>
          <span className="text-xl font-bold font-mono text-white tabular-nums">{auditLogs.length} sự kiện</span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo người thực hiện, chi tiết hoặc địa chỉ IP..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">Mọi loại hành động</option>
            <option value="UPDATE_RECORD">Cập nhật (Update)</option>
            <option value="CREATE_RECORD">Tạo mới (Create)</option>
            <option value="DELETE_RECORD">Xóa (Delete)</option>
            <option value="DDNS_AUTO_UPDATE">DDNS Tự động</option>
            <option value="ROLLBACK">Hoàn tác (Rollback)</option>
            <option value="SSL_RENEWED">SSL Renewed</option>
          </select>

          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">Mọi tên miền</option>
            {domains.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-3">Thời gian</th>
                <th className="py-3 px-3">Người thực hiện</th>
                <th className="py-3 px-3">Hành động</th>
                <th className="py-3 px-3">Tên miền</th>
                <th className="py-3 px-3">Chi tiết thay đổi</th>
                <th className="py-3 px-3">Địa chỉ IP</th>
                <th className="py-3 px-3 text-right">Khôi phục</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không có nhật ký nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const hasDiff = log.diff && (log.diff.before || log.diff.after);
                  const isHighlighted = highlightedItemId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        id={`audit-${log.id}`}
                        className={`transition-all duration-300 ${
                          isHighlighted
                            ? 'bg-neutral-800 ring-2 ring-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={log.actor.avatar}
                              alt={log.actor.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
                            />
                            <div>
                              <span className="font-semibold text-slate-200 block truncate max-w-[120px]">
                                {log.actor.name}
                              </span>
                              <span className="text-[10px] text-cyan-400 font-mono block">
                                {log.actor.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">{getActionBadge(log.action)}</td>

                        <td className="py-3 px-3 font-mono text-slate-300 font-semibold">
                          {log.domainName}
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <p className="text-slate-300 leading-relaxed text-xs">
                            {log.details}
                          </p>
                          {hasDiff && (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="mt-1 text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                            >
                              <FileCode className="w-3 h-3" />
                              <span>{isExpanded ? 'Ẩn so sánh Diff' : 'Xem chi tiết Diff'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {log.ipAddress}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {log.rollbackable ? (
                            <button
                              onClick={() => handleRollback(log)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-slate-700 text-xs font-mono font-medium flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                              title="Hoàn tác thay đổi này về trạng thái trước đó"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rollback</span>
                            </button>
                          ) : (
                            <span className="text-slate-600 font-mono text-[11px]">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Diff Row */}
                      {isExpanded && hasDiff && (
                        <tr className="bg-slate-950/70 border-b border-slate-800">
                          <td colSpan={7} className="p-4">
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
                              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                                So sánh dữ liệu trước và sau (Delta Diff):
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {log.diff?.before && (
                                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40">
                                    <span className="text-[10px] text-rose-400 font-bold block mb-1">
                                      - DỮ LIỆU CŨ (BEFORE):
                                    </span>
                                    <pre className="text-rose-200 text-[11px] overflow-x-auto">
                                      {JSON.stringify(log.diff.before, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.diff?.after && (
                                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
                                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">
                                      + DỮ LIỆU MỚI (AFTER):
                                    </span>
                                    <pre className="text-emerald-200 text-[11px] overflow-x-auto">
                                      {JSON.stringify(log.diff.after, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
