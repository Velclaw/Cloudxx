import React, { useState, useEffect } from 'react';
import { useDns } from '../../context/DnsContext';
import { DNSRecord, RecordCategory, RecordType } from '../../types/dns';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Zap,
  Shield,
  Cloud,
  CloudOff,
  Copy,
  Check,
  Download,
  Layers,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { generateBindZoneFile, generateExcelCsv, downloadFile } from '../../utils/zoneParser';

interface DnsRecordsManagerProps {
  onOpenAddModal: () => void;
  onEditRecord: (record: DNSRecord) => void;
}

export const DnsRecordsManager: React.FC<DnsRecordsManagerProps> = ({
  onOpenAddModal,
  onEditRecord
}) => {
  const {
    selectedDomain,
    domainRecords,
    updateRecord,
    deleteRecord,
    triggerDdnsAutoUpdate,
    reorderRecords,
    highlightedItemId,
    t
  } = useDns();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [expandedMobileCardId, setExpandedMobileCardId] = useState<string | null>(null);

  // Scroll to highlighted record when selected from global command palette
  useEffect(() => {
    if (highlightedItemId) {
      const el = document.getElementById(`record-${highlightedItemId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedItemId]);

  // Filter records
  const filteredRecords = domainRecords.filter((rec) => {
    if (activeCategory !== 'all' && rec.category !== activeCategory) {
      return false;
    }
    if (typeFilter !== 'ALL' && rec.type !== typeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.name.toLowerCase().includes(q);
      const matchContent = rec.content.toLowerCase().includes(q);
      const matchType = rec.type.toLowerCase().includes(q);
      const matchComment = rec.comment?.toLowerCase().includes(q);
      return matchName || matchContent || matchType || matchComment;
    }
    return true;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: t.all },
    { id: 'web', label: t.catWeb },
    { id: 'mail', label: t.catMail },
    { id: 'security', label: t.catSecurity },
    { id: 'cdn', label: t.catCdn },
    { id: 'internal', label: t.catInternal },
    { id: 'database', label: t.catDatabase }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === domainRecords.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...domainRecords];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    reorderRecords(reordered.map((r) => r.id));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRecordIds(filteredRecords.map((r) => r.id));
    } else {
      setSelectedRecordIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportZone = () => {
    if (!selectedDomain) return;
    const zoneStr = generateBindZoneFile(selectedDomain, domainRecords);
    downloadFile(zoneStr, `${selectedDomain.name}.zone`, 'text/plain');
  };

  const handleExportCsv = () => {
    if (!selectedDomain) return;
    const csvStr = generateExcelCsv(domainRecords);
    downloadFile(csvStr, `${selectedDomain.name}_dns_records.csv`, 'text/csv;charset=utf-8;');
  };

  const handleBulkDelete = () => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedRecordIds.length} bản ghi DNS đã chọn không?`
      )
    ) {
      selectedRecordIds.forEach((id) => deleteRecord(id));
      setSelectedRecordIds([]);
    }
  };

  const handleBulkChangeTtl = (newTtl: number) => {
    selectedRecordIds.forEach((id) => updateRecord(id, { ttl: newTtl }));
    setSelectedRecordIds([]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Domain Header Card - Next.js Minimalist */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-neutral-400">
            <span>VÙNG DNS ĐANG QUẢN TRỊ</span>
            <span>·</span>
            <span>{selectedDomain?.registrar}</span>
            <span>·</span>
            <span className="text-emerald-400">DNSSEC Hoạt động</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
            <span>{selectedDomain?.name}</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 truncate">
            NS: {selectedDomain?.nameservers.join(', ')} · Tổng {domainRecords.length} bản ghi
          </p>
        </div>

        {/* Action buttons (Touch friendly on mobile) */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={handleExportZone}
            className="min-h-[38px] px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            title="Xuất file BIND RFC 1035"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.zone</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="min-h-[38px] px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            title="Xuất file Excel CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="min-h-[38px] px-3.5 py-1.5 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t.addRecord}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Swipeable Category Tabs (Touch-friendly on mobile) */}
      <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800/80 rounded-xl overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-neutral-900 text-white font-semibold border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1">
          {/* Search box with thumb touch height */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Host, IP, giá trị..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono min-h-[40px]"
            />
          </div>

          {/* Record type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-neutral-600 cursor-pointer min-h-[40px]"
          >
            <option value="ALL">Mọi loại ({domainRecords.length})</option>
            <option value="A">A (IPv4)</option>
            <option value="AAAA">AAAA (IPv6)</option>
            <option value="CNAME">CNAME (Alias)</option>
            <option value="MX">MX (Mail)</option>
            <option value="TXT">TXT (SPF/DMARC)</option>
            <option value="CAA">CAA (SSL CA)</option>
            <option value="SRV">SRV (Service)</option>
          </select>
        </div>

        {/* Bulk Action Toolbar if items selected */}
        {selectedRecordIds.length > 0 && (
          <div className="flex items-center gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs animate-in fade-in">
            <span className="font-mono text-neutral-300 px-1 font-semibold">
              Đã chọn: {selectedRecordIds.length}
            </span>
            <button
              onClick={() => handleBulkChangeTtl(300)}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-mono cursor-pointer"
            >
              TTL 300s
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[11px] font-medium cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MOBILE TOUCH-FRIENDLY VIEW (< md screens) */}
      {/* ========================================================= */}
      <div className="md:hidden space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 rounded-2xl bg-neutral-950 border border-neutral-800/80">
            <p className="text-sm font-semibold text-neutral-300 mb-1">
              Không tìm thấy bản ghi nào
            </p>
            <p className="text-xs text-neutral-500">
              Hãy thử thay đổi từ khóa hoặc bộ lọc danh mục.
            </p>
          </div>
        ) : (
          filteredRecords.map((rec, index) => {
            const isExpanded = expandedMobileCardId === rec.id;
            const isHighlighted = highlightedItemId === rec.id;
            return (
              <div
                key={rec.id}
                id={`record-${rec.id}`}
                className={`p-3.5 rounded-2xl border shadow-sm space-y-2.5 transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-neutral-900 border-white ring-2 ring-white/80 shadow-[0_0_25px_rgba(255,255,255,0.25)]'
                    : 'bg-neutral-950 border-neutral-800/80'
                }`}
              >
                {/* Header: Type, Hostname & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-neutral-900 text-white border border-neutral-800">
                      {rec.type}
                    </span>
                    <span className="font-mono font-bold text-sm text-white truncate max-w-[170px]">
                      {rec.name}
                      <span className="text-neutral-500 font-normal text-xs">.{selectedDomain?.name}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditRecord(rec)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-900 cursor-pointer"
                      title="Chỉnh sửa bản ghi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Xóa bản ghi ${rec.name} (${rec.type})?`)) {
                          deleteRecord(rec.id);
                        }
                      }}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-neutral-400 hover:text-rose-400 rounded-lg active:bg-neutral-900 cursor-pointer"
                      title="Xóa bản ghi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Target Value Box (Tap to copy with thumb) */}
                <div
                  onClick={() => handleCopy(rec.content, rec.id)}
                  className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80 flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <span className="font-mono text-xs text-neutral-200 truncate select-all">
                    {rec.content}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 shrink-0 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                    {copiedId === rec.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Chép</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Mobile Attributes Strip */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/60">
                  <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
                    <span>TTL: {rec.ttl === 'Auto' ? 'Auto' : `${rec.ttl}s`}</span>
                    {rec.priority !== undefined && (
                      <span className="text-amber-400">Pri: {rec.priority}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* CDN Proxy Toggle */}
                    {['A', 'AAAA', 'CNAME'].includes(rec.type) && (
                      <button
                        onClick={() => updateRecord(rec.id, { proxied: !rec.proxied })}
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-colors ${
                          rec.proxied
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {rec.proxied ? <Cloud className="w-3 h-3 fill-amber-400/20" /> : <CloudOff className="w-3 h-3" />}
                        <span>{rec.proxied ? 'Proxy ON' : 'DNS Only'}</span>
                      </button>
                    )}

                    {/* Auto DDNS Toggle */}
                    {['A', 'AAAA'].includes(rec.type) && (
                      <button
                        onClick={() =>
                          updateRecord(rec.id, {
                            autoUpdateEnabled: !rec.autoUpdateEnabled,
                            autoUpdateKey: !rec.autoUpdateEnabled
                              ? `ddns-${rec.name}-${Math.random().toString(36).substr(2, 6)}`
                              : undefined
                          })
                        }
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-colors ${
                          rec.autoUpdateEnabled
                            ? 'bg-neutral-800 text-white border-neutral-600'
                            : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                        }`}
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>{rec.autoUpdateEnabled ? 'DDNS Bật' : 'DDNS Tắt'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {rec.comment && (
                  <p className="text-[10px] text-neutral-500 italic truncate pt-0.5">
                    Ghi chú: {rec.comment}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP HIGH-DENSITY DATA TABLE (>= md screens) */}
      {/* ========================================================= */}
      <div className="hidden md:block rounded-2xl bg-neutral-950 border border-neutral-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 font-mono text-[11px]">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredRecords.length > 0 &&
                      selectedRecordIds.length === filteredRecords.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-neutral-700 text-white focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-10 text-center">Thứ tự</th>
                <th className="py-3 px-3">Loại</th>
                <th className="py-3 px-3">Tên Host</th>
                <th className="py-3 px-3">Giá trị đích (Value/Content)</th>
                <th className="py-3 px-3">TTL</th>
                <th className="py-3 px-3 text-center">Proxy CDN</th>
                <th className="py-3 px-3 text-center">DDNS Tự Động</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    <p className="text-sm font-semibold text-neutral-300 mb-1">
                      Không tìm thấy bản ghi DNS nào phù hợp
                    </p>
                    <button
                      onClick={onOpenAddModal}
                      className="mt-3 px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 cursor-pointer"
                    >
                      Tạo bản ghi đầu tiên
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const isSelected = selectedRecordIds.includes(rec.id);
                  const isHighlighted = highlightedItemId === rec.id;
                  return (
                    <tr
                      key={rec.id}
                      id={`record-${rec.id}`}
                      className={`transition-all duration-300 group ${
                        isHighlighted
                          ? 'bg-neutral-800/90 ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                          : isSelected
                          ? 'bg-neutral-900/40 hover:bg-neutral-900/60'
                          : 'hover:bg-neutral-900/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(rec.id)}
                          className="rounded border-neutral-700 text-white focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Reorder / Priority */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === domainRecords.length - 1}
                            className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-neutral-900 text-neutral-200 border border-neutral-800 inline-block">
                          {rec.type}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{rec.name}</span>
                          <span className="text-[10px] text-neutral-500 font-normal">
                            .{selectedDomain?.name}
                          </span>
                        </div>
                      </td>

                      {/* Content / Value */}
                      <td className="py-3 px-3 max-w-md">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-neutral-200 truncate select-all">
                            {rec.content}
                          </span>
                          <button
                            onClick={() => handleCopy(rec.content, rec.id)}
                            className="p-1 text-neutral-500 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Sao chép giá trị"
                          >
                            {copiedId === rec.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {rec.comment && (
                          <p className="text-[10px] text-neutral-500 italic truncate mt-0.5">
                            {rec.comment}
                          </p>
                        )}
                        {rec.priority !== undefined && (
                          <span className="text-[10px] font-mono text-amber-400 block mt-0.5">
                            Ưu tiên: {rec.priority}
                          </span>
                        )}
                      </td>

                      {/* TTL */}
                      <td className="py-3 px-3 font-mono text-neutral-400 tabular-nums">
                        {rec.ttl === 'Auto' ? 'Tự động' : `${rec.ttl}s`}
                      </td>

                      {/* Proxy toggle */}
                      <td className="py-3 px-3 text-center">
                        {['A', 'AAAA', 'CNAME'].includes(rec.type) ? (
                          <button
                            onClick={() => updateRecord(rec.id, { proxied: !rec.proxied })}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              rec.proxied
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 shadow-sm'
                                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-white'
                            }`}
                            title={rec.proxied ? 'Proxy CDN bật' : 'Chỉ trỏ DNS'}
                          >
                            {rec.proxied ? (
                              <Cloud className="w-4 h-4 fill-amber-400/20" />
                            ) : (
                              <CloudOff className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-neutral-700 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Auto DDNS toggle & trigger */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() =>
                              updateRecord(rec.id, {
                                autoUpdateEnabled: !rec.autoUpdateEnabled,
                                autoUpdateKey: !rec.autoUpdateEnabled
                                  ? `ddns-${rec.name}-${Math.random().toString(36).substr(2, 6)}`
                                  : undefined
                              })
                            }
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              rec.autoUpdateEnabled
                                ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-white'
                            }`}
                            title={rec.autoUpdateEnabled ? 'DDNS Bật' : 'Bật DDNS tự động'}
                          >
                            <Zap className="w-4 h-4 text-cyan-400" />
                          </button>

                          {rec.autoUpdateEnabled && (
                            <button
                              onClick={() => triggerDdnsAutoUpdate(rec.id)}
                              className="p-1 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                              title="Kiểm tra & Cập nhật IP ngay lập tức"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditRecord(rec)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            title="Chỉnh sửa bản ghi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Xác nhận xóa bản ghi ${rec.name} (${rec.type})?`)) {
                                deleteRecord(rec.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
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
