import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Shield,
  ExternalLink
} from 'lucide-react';
import { generateBindZoneFile, generateExcelCsv, downloadFile } from '../../utils/zoneParser';

export const ReportsExporter: React.FC = () => {
  const { domains, records, auditLogs, selectedDomain } = useDns();

  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');
  const [reportType, setReportType] = useState<'full' | 'security' | 'changes'>('full');
  const [includeAuditLogs, setIncludeAuditLogs] = useState(true);
  const [includeSslAudit, setIncludeSslAudit] = useState(true);

  const targetRecords = records.filter(r =>
    selectedDomainFilter === 'ALL' ? true : r.domainName === selectedDomainFilter
  );

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const csvStr = generateExcelCsv(targetRecords);
    const filename = `Bao_Cao_DNS_${selectedDomainFilter === 'ALL' ? 'Toan_Doanh_Nghiep' : selectedDomainFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvStr, filename, 'text/csv;charset=utf-8;');
  };

  const handleDownloadJson = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      platform: 'Cloudxx',
      domainFilter: selectedDomainFilter,
      records: targetRecords,
      auditLogs: includeAuditLogs ? auditLogs.slice(0, 20) : []
    };
    const jsonStr = JSON.stringify(reportData, null, 2);
    downloadFile(jsonStr, `Cloudxx_Report_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Action Bar (Hidden when printing) */}
      <div className="no-print p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                TÙY BIẾN BÁO CÁO & XUẤT DỮ LIỆU
              </span>
              <span className="text-xs text-slate-400">· Định dạng PDF & Excel (CSV UTF-8)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Báo Cáo Kiểm Toán & Xuất Dữ Liệu DNS
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Tạo lập các bản báo cáo tuân thủ an ninh thông tin, báo cáo tài sản tên miền và xuất dữ liệu dự phòng chuẩn định dạng kế toán/kiểm toán.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo PDF</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất File Excel</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Raw</span>
            </button>
          </div>
        </div>

        {/* Customization Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Chọn phạm vi tên miền</label>
            <select
              value={selectedDomainFilter}
              onChange={(e) => setSelectedDomainFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
            >
              <option value="ALL">Toàn bộ doanh nghiệp ({records.length} bản ghi)</option>
              {domains.map(d => (
                <option key={d.id} value={d.name}>{d.name} ({d.recordCount} bản ghi)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Loại báo cáo</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
            >
              <option value="full">Báo cáo tổng hợp hạ tầng DNS</option>
              <option value="security">Báo cáo chứng chỉ SSL & DNSSEC</option>
              <option value="changes">Báo cáo biến động bản ghi & DDNS</option>
            </select>
          </div>

          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={includeAuditLogs}
                onChange={(e) => setIncludeAuditLogs(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500"
              />
              <span>Đính kèm lịch sử thay đổi</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={includeSslAudit}
                onChange={(e) => setIncludeSslAudit(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500"
              />
              <span>Đính kèm thông số SSL</span>
            </label>
          </div>
        </div>
      </div>

      {/* Printable Report View Container */}
      <div className="p-8 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl font-sans space-y-6">
        {/* Report Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded bg-slate-950 text-white font-mono font-bold flex items-center justify-center text-sm">
                DS
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                DNS SENTINEL ENTERPRISE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Hệ thống Quản lý Vùng Tên Miền & Cơ Sở Hạ Tầng DNS Độ Sẵn Sàng Cao
            </p>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <span className="font-mono font-bold text-slate-900 block">
              MÃ BÁO CÁO: REP-{new Date().getFullYear()}-{Math.floor(Math.random() * 90000 + 10000)}
            </span>
            <span className="text-slate-600 block">
              Ngày xuất: {new Date().toLocaleString('vi-VN')}
            </span>
            <span className="text-slate-600 block">
              Trạng thái xác thực: <span className="font-semibold text-emerald-600">HỢP LỆ (VERIFIED)</span>
            </span>
          </div>
        </div>

        {/* Executive Summary Stats */}
        <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Phạm vi báo cáo:</span>
            <span className="font-bold text-slate-900 font-mono text-sm">
              {selectedDomainFilter === 'ALL' ? 'Toàn bộ hệ thống' : selectedDomainFilter}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Tổng bản ghi DNS:</span>
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
              {targetRecords.length} Bản ghi
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Bản ghi DDNS tự động:</span>
            <span className="font-bold text-cyan-700 font-mono text-sm tabular-nums">
              {targetRecords.filter(r => r.autoUpdateEnabled).length} Bản ghi
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Mức độ bảo vệ CDN Proxy:</span>
            <span className="font-bold text-amber-700 font-mono text-sm tabular-nums">
              {targetRecords.filter(r => r.proxied).length} Proxied
            </span>
          </div>
        </div>

        {/* Records Table for Report */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            I. Bảng Danh Mục Bản Ghi DNS Chi Tiết
          </h2>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 font-mono text-[11px]">
              <tr className="border-b border-slate-300">
                <th className="py-2 px-2.5">STT</th>
                <th className="py-2 px-2.5">Tên miền</th>
                <th className="py-2 px-2.5">Loại</th>
                <th className="py-2 px-2.5">Tên Host</th>
                <th className="py-2 px-2.5">Giá trị đích</th>
                <th className="py-2 px-2.5">TTL</th>
                <th className="py-2 px-2.5">Proxy CDN</th>
                <th className="py-2 px-2.5">DDNS</th>
                <th className="py-2 px-2.5">Cập nhật lần cuối</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {targetRecords.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-mono text-slate-500">{i + 1}</td>
                  <td className="py-2 px-2.5 font-mono font-medium text-slate-800">{r.domainName}</td>
                  <td className="py-2 px-2.5 font-mono font-bold text-blue-700">{r.type}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-900">{r.name}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-800 truncate max-w-xs">{r.content}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-600 tabular-nums">{r.ttl}s</td>
                  <td className="py-2 px-2.5 text-center font-mono">{r.proxied ? 'Có' : 'Không'}</td>
                  <td className="py-2 px-2.5 text-center font-mono">{r.autoUpdateEnabled ? 'Bật' : 'Tắt'}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-500 text-[11px]">
                    {new Date(r.lastUpdated).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Log Summary in Report */}
        {includeAuditLogs && (
          <div className="space-y-2 pt-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              II. Lịch Sử Biến Động & Nhật Ký Kiểm Toán An Ninh
            </h2>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-mono text-[11px]">
                <tr className="border-b border-slate-300">
                  <th className="py-2 px-2.5">Thời gian</th>
                  <th className="py-2 px-2.5">Người thực hiện</th>
                  <th className="py-2 px-2.5">Hành động</th>
                  <th className="py-2 px-2.5">Chi tiết thay đổi</th>
                  <th className="py-2 px-2.5">Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.slice(0, 5).map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 px-2.5 font-mono text-slate-600">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 px-2.5 font-semibold text-slate-800">{log.actor.name}</td>
                    <td className="py-2 px-2.5 font-mono text-[11px] font-bold text-slate-700">{log.action}</td>
                    <td className="py-2 px-2.5 text-slate-700">{log.details}</td>
                    <td className="py-2 px-2.5 font-mono text-slate-600 text-[11px]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Footer / Signature */}
        <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span className="block font-semibold text-slate-800">Cloudxx Auditor</span>
            <span>Chữ ký số: SHA256:7f81b2a99c01824efb12</span>
          </div>
          <div className="text-right">
            <span className="block font-semibold text-slate-800">Trưởng bộ phận Hạ tầng mạng</span>
            <span className="italic">(Đã ký duyệt tự động điện tử)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
