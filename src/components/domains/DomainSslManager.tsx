import React, { useState, useEffect } from 'react';
import { useDns } from '../../context/DnsContext';
import { DomainZone, RegistrarProvider } from '../../types/dns';
import {
  Globe,
  Plus,
  Shield,
  ShieldAlert,
  Lock,
  RefreshCw,
  ExternalLink,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  X
} from 'lucide-react';

export const DomainSslManager: React.FC = () => {
  const {
    domains,
    selectedDomainId,
    setSelectedDomainId,
    createDomain,
    renewSslCertificate,
    deleteDomain,
    highlightedItemId,
    t
  } = useDns();

  const [isAddDomainModalOpen, setIsAddDomainModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newRegistrar, setNewRegistrar] = useState<RegistrarProvider>('Cloudflare');
  const [newEnvironment, setNewEnvironment] = useState<'production' | 'staging' | 'internal' | 'client_projects'>('production');
  const [newDnssec, setNewDnssec] = useState(true);

  // Scroll to highlighted domain
  useEffect(() => {
    if (highlightedItemId) {
      const el = document.getElementById(`domain-${highlightedItemId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedItemId]);

  const handleCreateDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    const cleanedName = newDomainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const nextExpiry = new Date();
    nextExpiry.setFullYear(nextExpiry.getFullYear() + 1);

    const sslExpiry = new Date();
    sslExpiry.setMonth(sslExpiry.getMonth() + 3);

    createDomain({
      name: cleanedName,
      registrar: newRegistrar,
      status: 'active',
      autoRenew: true,
      expiresAt: nextExpiry.toISOString(),
      nameservers: [
        `ns1.${newRegistrar.toLowerCase().replace(/\s+/g, '')}.com`,
        `ns2.${newRegistrar.toLowerCase().replace(/\s+/g, '')}.com`
      ],
      dnssec: newDnssec,
      sslStatus: 'valid',
      sslExpiryDate: sslExpiry.toISOString(),
      sslIssuer: "Let's Encrypt Authority X3 (ACME DNS-01)",
      autoSslRenewal: true,
      environment: newEnvironment
    });

    setNewDomainName('');
    setIsAddDomainModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              QUẢN LÝ TÊN MIỀN & CHỨNG CHỈ BẢO MẬT
            </span>
            <span className="text-xs text-slate-400">· Hệ thống ủy quyền NS & ACME Let's Encrypt</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Danh Mục Tên Miền & Chứng Chỉ SSL Tự Động
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tự động theo dõi hạn tên miền, kích hoạt DNSSEC chống giả mạo và cấp phát SSL TLS qua giao thức DNS-01.
          </p>
        </div>

        <button
          onClick={() => setIsAddDomainModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t.addDomain}</span>
        </button>
      </div>

      {/* Domains Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {domains.map((dom) => {
          const isSelected = dom.id === selectedDomainId;
          const daysToExpiry = Math.ceil(
            (new Date(dom.expiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );
          const sslDays = Math.ceil(
            (new Date(dom.sslExpiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );

          const isHighlighted = highlightedItemId === dom.id;

          return (
            <div
              key={dom.id}
              id={`domain-${dom.id}`}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                isHighlighted
                  ? 'bg-slate-900 border-white ring-2 ring-white/90 shadow-[0_0_25px_rgba(255,255,255,0.25)]'
                  : isSelected
                  ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white font-mono">{dom.name}</h2>
                    {dom.dnssec && (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60 font-semibold flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        DNSSEC
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                    <span>{dom.registrar}</span>
                    <span>·</span>
                    <span className="capitalize">{dom.environment}</span>
                    <span>·</span>
                    <span>{dom.recordCount} bản ghi</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedDomainId(dom.id)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Đang chọn' : 'Chọn quản lý'}
                  </button>

                  {domains.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Xác nhận xóa hoàn toàn vùng DNS ${dom.name}?`)) {
                          deleteDomain(dom.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Xóa vùng tên miền"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Nameservers preview */}
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs font-mono space-y-1 my-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Máy chủ phân giải Nameservers:
                </span>
                <div className="text-slate-300 text-[11px] truncate">
                  {dom.nameservers.join('  ·  ')}
                </div>
              </div>

              {/* SSL Certificate & Expiration Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Chứng chỉ SSL TLS:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                        dom.sslStatus === 'valid'
                          ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50'
                          : dom.sslStatus === 'provisioning'
                          ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/50'
                          : 'text-amber-400 bg-amber-950/60 border border-amber-800/50'
                      }`}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>
                        {dom.sslStatus === 'valid'
                          ? `Còn ${sslDays} ngày`
                          : dom.sslStatus === 'provisioning'
                          ? 'Đang cấp ACME...'
                          : 'Sắp hết hạn'}
                      </span>
                    </span>
                    <button
                      onClick={() => renewSslCertificate(dom.id)}
                      disabled={dom.sslStatus === 'provisioning'}
                      className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
                      title="Tái cấp / Gia hạn SSL qua ACME DNS-01"
                    >
                      <RefreshCw className={`w-3 h-3 ${dom.sslStatus === 'provisioning' ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{dom.sslIssuer}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Thời hạn tên miền:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-200">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Còn {daysToExpiry} ngày</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">Tự động gia hạn (Auto-renew)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Domain Modal */}
      {isAddDomainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Thêm Vùng Tên Miền Mới</span>
              </h2>
              <button
                onClick={() => setIsAddDomainModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDomain} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tên miền (Domain name)</label>
                <input
                  type="text"
                  required
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  placeholder="VD: fintech-pay.vn hoặc enterprise-cloud.io"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Không cần nhập http:// hoặc www.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nhà đăng ký tên miền (Registrar)</label>
                <select
                  value={newRegistrar}
                  onChange={(e) => setNewRegistrar(e.target.value as RegistrarProvider)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="Cloudflare">Cloudflare DNS</option>
                  <option value="AWS Route 53">AWS Route 53</option>
                  <option value="DigitalOcean">DigitalOcean DNS</option>
                  <option value="Google Cloud">Google Cloud DNS</option>
                  <option value="Namecheap">Namecheap</option>
                  <option value="GoDaddy">GoDaddy</option>
                  <option value="Porkbun">Porkbun</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Môi trường dự án (Environment)</label>
                <select
                  value={newEnvironment}
                  onChange={(e) => setNewEnvironment(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="production">Production (Môi trường chính thức)</option>
                  <option value="staging">Staging (Kiểm thử QA)</option>
                  <option value="internal">Internal (Hạ tầng nội bộ)</option>
                  <option value="client_projects">Client Projects (Dự án khách hàng)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-200">Kích hoạt DNSSEC & ACME SSL</span>
                    <p className="text-[11px] text-slate-400">Tự động cấu hình chữ ký bảo mật DNSSEC và cấp SSL Let's Encrypt.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newDnssec}
                    onChange={(e) => setNewDnssec(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDomainModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold"
                >
                  Tạo vùng tên miền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
