import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import { BackupSnapshot } from '../../types/dns';
import {
  HardDriveDownload,
  RotateCcw,
  Plus,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  FileJson,
  Shield,
  Trash2
} from 'lucide-react';
import { downloadFile } from '../../utils/zoneParser';

export const BackupSnapshotManager: React.FC = () => {
  const { backups, createBackup, restoreBackup, uploadRestoreBackup, domains, records } = useDns();

  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [retentionDays, setRetentionDays] = useState(30);
  const [manualLabel, setManualLabel] = useState('');

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    createBackup(manualLabel.trim() || undefined);
    setManualLabel('');
  };

  const handleDownloadSnapshot = (snap: BackupSnapshot) => {
    const jsonStr = JSON.stringify(snap, null, 2);
    downloadFile(jsonStr, `DNS_Backup_${snap.name.replace(/\s+/g, '_')}_${new Date(snap.timestamp).toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = uploadRestoreBackup(content);
        if (ok) {
          alert('Khôi phục dữ liệu thành công từ file JSON tải lên!');
        } else {
          alert('Tệp tin không đúng định dạng sao lưu của Cloudxx.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              SAO LƯU & PHỤC HỒI THẢM HỌA (DR)
            </span>
            <span className="text-xs text-slate-400">· Tự động chụp Snapshot & 1-Click Restore</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Quản Lý Sao Lưu Dữ Liệu Tự Động Định Kỳ
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Chụp ảnh snapshot toàn bộ các vùng tên miền và bản ghi DNS. Đảm bảo khôi phục tức thời khi có sự cố tấn công hoặc lỗi cấu hình.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Phục hồi từ File JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Snapshot Policy Settings & Create Snapshot Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Create Snapshot Form (7 cols) */}
        <div className="md:col-span-7 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDriveDownload className="w-4 h-4 text-cyan-400" />
            <span>Tạo Bản Chụp Snapshot Thủ Công Ngay Bây Giờ</span>
          </h2>
          <p className="text-xs text-slate-400">
            Lưu trữ trạng thái hiện tại gồm {domains.length} tên miền và {records.length} bản ghi DNS vào kho dự phòng.
          </p>

          <form onSubmit={handleCreateManual} className="flex gap-2 pt-2">
            <input
              type="text"
              value={manualLabel}
              onChange={(e) => setManualLabel(e.target.value)}
              placeholder="Nhập ghi chú cho bản sao lưu (VD: Trước khi bảo trì router)"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Chụp Snapshot Ngay
            </button>
          </form>
        </div>

        {/* Right: Automated Backup Schedule Policy (5 cols) */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Chính Sách Sao Lưu Định Kỳ Tự Động</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Chu kỳ tự động sao lưu</label>
              <select
                value={backupSchedule}
                onChange={(e) => setBackupSchedule(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
              >
                <option value="hourly">Mỗi giờ một lần</option>
                <option value="daily">Hàng ngày (Lúc 02:00 AM)</option>
                <option value="weekly">Hàng tuần (Chủ nhật)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Thời gian lưu giữ (Retention)</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
              >
                <option value="7">7 ngày gần nhất</option>
                <option value="30">30 ngày gần nhất (Khuyên dùng)</option>
                <option value="90">90 ngày</option>
                <option value="365">1 năm</option>
              </select>
            </div>
          </div>

          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bản sao lưu được mã hóa AES-256 trước khi lưu vào kho lưu trữ đám mây.</span>
          </div>
        </div>
      </div>

      {/* Snapshots History Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Kho Lưu Trữ Các Bản Snapshot Điểm Thời Gian</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {backups.length} bản sao lưu sẵn sàng phục hồi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-3">Thời gian chụp</th>
                <th className="py-3 px-3">Tên / Ghi chú Snapshot</th>
                <th className="py-3 px-3">Cơ chế chụp</th>
                <th className="py-3 px-3">Dung lượng</th>
                <th className="py-3 px-3">Quy mô tài sản</th>
                <th className="py-3 px-3 text-right">Hành động phục hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {backups.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                    {new Date(snap.timestamp).toLocaleString('vi-VN')}
                  </td>

                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {snap.name}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        snap.trigger === 'scheduled'
                          ? 'text-cyan-400 bg-cyan-950 border-cyan-800'
                          : snap.trigger === 'pre_update'
                          ? 'text-purple-400 bg-purple-950 border-purple-800'
                          : 'text-slate-300 bg-slate-800 border-slate-700'
                      }`}
                    >
                      {snap.trigger === 'scheduled'
                        ? 'ĐỊNH KỲ'
                        : snap.trigger === 'pre_update'
                        ? 'TỰ ĐỘNG LƯU TRƯỚC SỬA'
                        : 'THỦ CÔNG'}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-400 tabular-nums">
                    {snap.sizeKb} KB
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300">
                    {snap.domainsCount} Vùng · {snap.recordsCount} Bản ghi
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadSnapshot(snap)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Tải về tệp tin JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `CẢNH BÁO: Khôi phục từ bản ghi "${snap.name}"? Dữ liệu hiện tại sẽ được thay thế bằng trạng thái thời điểm ${new Date(snap.timestamp).toLocaleString('vi-VN')}. (Hệ thống sẽ tự động tạo 1 bản lưu dự phòng trước khi phục hồi).`
                            )
                          ) {
                            restoreBackup(snap.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-slate-700 font-mono text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Phục hồi Snapshot</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
