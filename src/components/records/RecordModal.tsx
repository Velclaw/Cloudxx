import React, { useState, useEffect } from 'react';
import { useDns } from '../../context/DnsContext';
import { DNSRecord, RecordCategory, RecordType } from '../../types/dns';
import { X, Sparkles, Check, HelpCircle } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  editRecord?: DNSRecord | null;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  editRecord
}) => {
  const { selectedDomain, createRecord, updateRecord, t } = useDns();

  const [type, setType] = useState<RecordType>('A');
  const [name, setName] = useState('@');
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState<number | 'Auto'>(300);
  const [priority, setPriority] = useState<number>(10);
  const [port, setPort] = useState<number>(5060);
  const [weight, setWeight] = useState<number>(10);
  const [proxied, setProxied] = useState<boolean>(true);
  const [category, setCategory] = useState<RecordCategory>('web');
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (editRecord) {
      setType(editRecord.type);
      setName(editRecord.name);
      setContent(editRecord.content);
      setTtl(editRecord.ttl);
      setPriority(editRecord.priority ?? 10);
      setPort(editRecord.port ?? 5060);
      setWeight(editRecord.weight ?? 10);
      setProxied(editRecord.proxied);
      setCategory(editRecord.category);
      setAutoUpdateEnabled(editRecord.autoUpdateEnabled);
      setComment(editRecord.comment ?? '');
    } else {
      setType('A');
      setName('@');
      setContent('');
      setTtl(300);
      setPriority(10);
      setPort(5060);
      setWeight(10);
      setProxied(true);
      setCategory('web');
      setAutoUpdateEnabled(false);
      setComment('');
    }
  }, [editRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedDomain) return;

    if (editRecord) {
      updateRecord(editRecord.id, {
        type,
        name: name.trim() || '@',
        content: content.trim(),
        ttl,
        priority: ['MX', 'SRV'].includes(type) ? Number(priority) : undefined,
        port: type === 'SRV' ? Number(port) : undefined,
        weight: type === 'SRV' ? Number(weight) : undefined,
        proxied: ['A', 'AAAA', 'CNAME'].includes(type) ? proxied : false,
        category,
        autoUpdateEnabled,
        comment: comment.trim() || undefined
      });
    } else {
      createRecord({
        domainId: selectedDomain.id,
        domainName: selectedDomain.name,
        type,
        name: name.trim() || '@',
        content: content.trim(),
        ttl,
        priority: ['MX', 'SRV'].includes(type) ? Number(priority) : undefined,
        port: type === 'SRV' ? Number(port) : undefined,
        weight: type === 'SRV' ? Number(weight) : undefined,
        proxied: ['A', 'AAAA', 'CNAME'].includes(type) ? proxied : false,
        category,
        autoUpdateEnabled,
        comment: comment.trim() || undefined
      });
    }

    onClose();
  };

  const applyTemplate = (tpl: string) => {
    if (tpl === 'spf_google') {
      setType('TXT');
      setName('@');
      setContent('v=spf1 include:_spf.google.com ~all');
      setCategory('security');
      setComment('Google Workspace SPF');
    } else if (tpl === 'spf_office365') {
      setType('TXT');
      setName('@');
      setContent('v=spf1 include:spf.protection.outlook.com -all');
      setCategory('security');
      setComment('Microsoft 365 SPF');
    } else if (tpl === 'dmarc_strict') {
      setType('TXT');
      setName('_dmarc');
      setContent(`v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc@${selectedDomain?.name}`);
      setCategory('security');
      setComment('Strict DMARC Policy');
    } else if (tpl === 'caa_letsencrypt') {
      setType('CAA');
      setName('@');
      setContent('0 issue "letsencrypt.org"');
      setCategory('security');
      setComment('Allow Let\'s Encrypt TLS only');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      {/* Backdrop tap to dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal / Mobile Bottom Sheet */}
      <div className="w-full sm:max-w-lg bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-100 max-h-[90vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom-4 duration-200">
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1.5 bg-neutral-850 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white font-mono">
              {editRecord ? 'Chỉnh Sửa Bản Ghi DNS' : 'Thêm Bản Ghi DNS Mới'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Vùng: <span className="font-mono text-white font-semibold">{selectedDomain?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates for Security / Mail */}
        {!editRecord && (
          <div className="mt-3 p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1 shrink-0 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Mẫu:</span>
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => applyTemplate('spf_google')}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-mono whitespace-nowrap cursor-pointer"
              >
                SPF Google
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('spf_office365')}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-mono whitespace-nowrap cursor-pointer"
              >
                SPF M365
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('dmarc_strict')}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-mono whitespace-nowrap cursor-pointer"
              >
                DMARC Reject
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('caa_letsencrypt')}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-mono whitespace-nowrap cursor-pointer"
              >
                CAA TLS
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Row 1: Type & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Loại bản ghi</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as RecordType;
                  setType(t);
                  if (['A', 'AAAA', 'CNAME'].includes(t)) {
                    setCategory('web');
                  } else if (t === 'MX') {
                    setCategory('mail');
                  } else if (['TXT', 'CAA'].includes(t)) {
                    setCategory('security');
                  }
                }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-white font-mono text-xs focus:border-neutral-500 focus:outline-none min-h-[42px]"
              >
                <option value="A">A (IPv4)</option>
                <option value="AAAA">AAAA (IPv6)</option>
                <option value="CNAME">CNAME (Alias)</option>
                <option value="MX">MX (Mail)</option>
                <option value="TXT">TXT (SPF/DMARC)</option>
                <option value="CAA">CAA (SSL CA)</option>
                <option value="SRV">SRV (Service)</option>
                <option value="ALIAS">ALIAS (Flattened CNAME)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Danh mục phân loại</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RecordCategory)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-white font-mono text-xs focus:border-neutral-500 focus:outline-none min-h-[42px]"
              >
                <option value="web">Web & Ứng dụng</option>
                <option value="mail">Email & Định tuyến</option>
                <option value="security">Bảo mật & Xác thực</option>
                <option value="cdn">CDN & Proxy Edge</option>
                <option value="internal">Nội bộ & VPN</option>
                <option value="database">Cơ sở dữ liệu</option>
              </select>
            </div>
          </div>

          {/* Row 2: Name (Host) */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Tên Host (Subdomain)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: @, api, mail, vpn"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-white font-mono text-xs focus:border-neutral-500 focus:outline-none min-h-[42px]"
              />
              <span className="absolute right-3 top-2.5 text-neutral-500 font-mono text-[11px]">
                .{selectedDomain?.name}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Dùng "@" để trỏ trực tiếp vào tên miền gốc (Apex domain).</p>
          </div>

          {/* Row 3: Content / Target Value */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Giá trị đích (Target / IP / Canonical)
            </label>
            <input
              type="text"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === 'A'
                  ? 'VD: 104.21.52.88'
                  : type === 'AAAA'
                  ? 'VD: 2606:4700:3033::6815:3458'
                  : type === 'CNAME'
                  ? 'VD: target-host.domain.com'
                  : type === 'MX'
                  ? 'VD: mail.google.com'
                  : type === 'TXT'
                  ? 'VD: v=spf1 include:_spf.google.com ~all'
                  : 'Giá trị bản ghi'
              }
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-white font-mono text-xs focus:border-neutral-500 focus:outline-none min-h-[42px]"
            />
          </div>

          {/* Row 4: MX / SRV specific inputs */}
          {['MX', 'SRV'].includes(type) && (
            <div className="grid grid-cols-3 gap-2.5 p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Độ ưu tiên</label>
                <input
                  type="number"
                  min="0"
                  max="65535"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
              {type === 'SRV' && (
                <>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Cổng (Port)</label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Trọng số</label>
                    <input
                      type="number"
                      min="0"
                      max="65535"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Row 5: TTL & Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Thời gian sống (TTL)</label>
              <select
                value={ttl}
                onChange={(e) => setTtl(e.target.value === 'Auto' ? 'Auto' : Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none min-h-[42px]"
              >
                <option value="Auto">Tự động (Auto 300s)</option>
                <option value="60">60 giây (DDNS / Cực nhanh)</option>
                <option value="120">2 phút</option>
                <option value="300">5 phút (Khuyên dùng)</option>
                <option value="3600">1 giờ</option>
                <option value="86400">1 ngày</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Ghi chú quản trị</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="VD: Ingress cluster"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none min-h-[42px]"
              />
            </div>
          </div>

          {/* Feature toggles */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            {['A', 'AAAA', 'CNAME'].includes(type) && (
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 cursor-pointer min-h-[44px]">
                <div>
                  <span className="font-semibold text-white block">Bảo vệ Proxy CDN</span>
                  <p className="text-[11px] text-neutral-400">Ẩn IP gốc và chống DDoS</p>
                </div>
                <input
                  type="checkbox"
                  checked={proxied}
                  onChange={(e) => setProxied(e.target.checked)}
                  className="rounded border-neutral-700 text-white focus:ring-0 cursor-pointer w-5 h-5"
                />
              </label>
            )}

            {['A', 'AAAA'].includes(type) && (
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 cursor-pointer min-h-[44px]">
                <div>
                  <span className="font-semibold text-white block">Kích hoạt Dynamic DNS (DDNS)</span>
                  <p className="text-[11px] text-neutral-400">Tự cập nhật bản ghi khi phát hiện IP WAN thay đổi</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoUpdateEnabled}
                  onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                  className="rounded border-neutral-700 text-white focus:ring-0 cursor-pointer w-5 h-5"
                />
              </label>
            )}
          </div>

          {/* Form Actions - Full thumb reach on mobile */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold shadow-md transition-all cursor-pointer"
            >
              {editRecord ? 'Lưu thay đổi' : 'Tạo bản ghi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
