import React, { useState, useEffect } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  Globe,
  Server,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Send,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Lock,
  SlidersHorizontal,
  Bell,
  X,
  ShieldAlert
} from 'lucide-react';
import { DashboardCustomizerModal } from './DashboardCustomizerModal';
import { DashboardWidgetConfig, DashboardWidgetId } from '../../types/dns';
import { defaultDashboardWidgets } from '../../data/mockDnsData';

const WIDGETS_STORAGE_KEY = 'dns_sentinel_dashboard_widgets_v1';

export const OverviewDashboard: React.FC<{ onOpenAddModal: () => void }> = ({ onOpenAddModal }) => {
  const {
    domains,
    records,
    auditLogs,
    globalNodes,
    isProbing,
    runGlobalProbe,
    selectedDomain,
    triggerDdnsAutoUpdate,
    sendTestNotification,
    setActiveTab,
    createBackup,
    alerts,
    markAlertAsRead,
    twoFactorSettings,
    t
  } = useDns();

  const [probeHost, setProbeHost] = useState('@');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Load customizable widgets from localStorage
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultDashboardWidgets;
  });

  const handleSaveWidgets = (newWidgets: DashboardWidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(newWidgets));
  };

  const handleResetWidgets = () => {
    setWidgets(defaultDashboardWidgets);
    localStorage.removeItem(WIDGETS_STORAGE_KEY);
  };

  const isWidgetVisible = (id: DashboardWidgetId) => {
    const w = widgets.find(item => item.id === id);
    return w ? w.visible : true;
  };

  // Computed metrics
  const activeDomainsCount = domains.filter(d => d.status === 'active').length;
  const totalQps = domains.reduce((sum, d) => sum + d.qps, 0);
  const ddnsCount = records.filter(r => r.autoUpdateEnabled).length;
  const expiringSslCount = domains.filter(d => d.sslStatus === 'expiring_soon' || d.sslStatus === 'expired').length;
  const unreadAlerts = alerts.filter(a => !a.read);

  // Real-time simulated query chart data (last 12 hours)
  const chartHours = [
    { hour: '07:00', qps: 3420, latency: 28 },
    { hour: '08:00', qps: 4100, latency: 31 },
    { hour: '09:00', qps: 5820, latency: 42 },
    { hour: '10:00', qps: 7490, latency: 48 },
    { hour: '11:00', qps: 8100, latency: 50 },
    { hour: '12:00', qps: 6920, latency: 39 },
    { hour: '13:00', qps: 7650, latency: 44 },
    { hour: '14:00', qps: 8900, latency: 54 },
    { hour: '15:00', qps: 9400, latency: 56 },
    { hour: '16:00', qps: 8600, latency: 49 },
    { hour: '17:00', qps: 7920, latency: 41 },
    { hour: '18:00', qps: totalQps || 7590, latency: 38 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 text-slate-100 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              TRẠM KIỂM SOÁT THỜI GIAN THỰC
            </span>
            <span className="text-xs text-slate-400">· Hệ thống DNS An Toàn Anycast</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Trung Tâm Điều Hành DNS Doanh Nghiệp
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Giám sát đồng bộ hóa đa Registrar, tự động cập nhật bản ghi DDNS khi có biến động IP, cảnh báo tức thời qua Telegram/Email và bảo vệ SSL tự động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Customize Widgets Button */}
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Tùy biến hiển thị các khối widget"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tùy biến Widget</span>
          </button>

          <button
            onClick={() => {
              const target = records.find(r => r.autoUpdateEnabled);
              if (target) {
                triggerDdnsAutoUpdate(target.id);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all cursor-pointer"
            title="Thử nghiệm cập nhật IP tự động DDNS"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kích hoạt DDNS Test</span>
          </button>

          <button
            onClick={() => sendTestNotification('telegram')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Gửi cảnh báo mẫu qua Telegram"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>Báo cáo Telegram</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm Bản Ghi DNS</span>
          </button>
        </div>
      </div>

      {/* Widget 1: Key Metrics Summary Cards */}
      {isWidgetVisible('metrics') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
          {/* Card 1: Total Domains */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.totalDomains}</span>
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">{domains.length}</span>
              <span className="text-xs text-emerald-400 font-mono flex items-center">
                100% Hoạt động
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
              <span>Đã ủy quyền:</span>
              <span className="font-mono text-slate-300">{activeDomainsCount}/{domains.length} Vùng</span>
            </div>
          </div>

          {/* Card 2: Active Records */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.activeRecords}</span>
              <Server className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">{records.length}</span>
              <span className="text-xs text-cyan-400 font-mono">
                {ddnsCount} DDNS bật
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
              <span>Bản ghi CDN Proxy:</span>
              <span className="font-mono text-slate-300">{records.filter(r => r.proxied).length} Bản ghi</span>
            </div>
          </div>

          {/* Card 3: Realtime QPS & Performance */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.qpsQueries}</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {totalQps.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono">queries/s</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
              <span>Độ trễ trung bình:</span>
              <span className="font-mono text-emerald-400">38ms (Toàn cầu)</span>
            </div>
          </div>

          {/* Card 4: SSL Certificates */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{t.sslCertificates}</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {domains.length - expiringSslCount}/{domains.length}
              </span>
              {expiringSslCount > 0 ? (
                <span className="text-xs text-amber-400 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {expiringSslCount} sắp hạn
                </span>
              ) : (
                <span className="text-xs text-emerald-400 font-mono">Bảo mật tối đa</span>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
              <span>Tự động ACME:</span>
              <span className="font-mono text-slate-300">Let's Encrypt / ZeroSSL</span>
            </div>
          </div>
        </div>
      )}

      {/* Widget 2: Active Alerts Feed (if enabled & has alerts) */}
      {isWidgetVisible('active_alerts') && unreadAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-800/40 shadow-lg space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Cảnh Báo Đang Hoạt Động Cần Chú Ý ({unreadAlerts.length})
              </span>
            </div>
            <button
              onClick={() => unreadAlerts.forEach(a => markAlertAsRead(a.id))}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {unreadAlerts.slice(0, 3).map(alert => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate pr-6">{alert.title}</span>
                  <button
                    onClick={() => markAlertAsRead(alert.id)}
                    className="p-1 text-slate-500 hover:text-white rounded"
                    title="Đóng cảnh báo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{alert.message}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{alert.domainName || 'Hệ thống'}</span>
                  <span>{alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Traffic Chart & Global Propagation Prober */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Widget 3: Live Traffic & Latency Chart (7 Cols) */}
        {isWidgetVisible('traffic_chart') && (
          <div className={`${isWidgetVisible('propagation_prober') ? 'lg:col-span-7' : 'lg:col-span-12'} p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Hiệu Suất Phân Giải & Lưu Lượng QPS</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">
                    99.999% Uptime
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo dõi tần suất truy vấn DNS và độ trễ phân giải trong 12 giờ qua
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-800/40">
                Live Anycast
              </span>
            </div>

            {/* Simulated chart bars */}
            <div className="pt-4 pb-2">
              <div className="h-44 flex items-end justify-between gap-2 px-1">
                {chartHours.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.max(25, (item.qps / 10000) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-950 border border-slate-700 text-white text-[10px] font-mono p-1.5 rounded shadow-xl pointer-events-none whitespace-nowrap">
                        <div>QPS: {item.qps.toLocaleString()}</div>
                        <div className="text-cyan-400">Độ trễ: {item.latency}ms</div>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-cyan-600 to-blue-400 group-hover:from-cyan-400 group-hover:to-blue-300 transition-all rounded-t"
                        />
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200">
                        {item.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend and stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Đỉnh điểm trong ngày:</span>
                <span className="font-mono font-bold text-white tabular-nums">9,400 QPS</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Độ trễ trung bình:</span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">41.2 ms</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tỷ lệ trả lời Cache:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">94.8%</span>
              </div>
            </div>
          </div>
        )}

        {/* Widget 4: Global Propagation Checker (5 Cols) */}
        {isWidgetVisible('propagation_prober') && (
          <div className={`${isWidgetVisible('traffic_chart') ? 'lg:col-span-5' : 'lg:col-span-12'} p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Kiểm Tra Lan Truyền Toàn Cầu</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                    8 Điểm nút
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Xác minh bản ghi phân giải đồng nhất trên các máy chủ DNS gốc quốc tế
                </p>
              </div>
            </div>

            {/* Host input and check button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={probeHost}
                  onChange={(e) => setProbeHost(e.target.value)}
                  placeholder="Nhập subdomain (VD: @, api, mail)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-400">
                  .{selectedDomain?.name}
                </span>
              </div>
              <button
                onClick={() => runGlobalProbe(probeHost)}
                disabled={isProbing}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                <span>{isProbing ? 'Đang dò...' : 'Kiểm tra'}</span>
              </button>
            </div>

            {/* 8 Global Nodes List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {globalNodes.map((node) => (
                <div
                  key={node.id}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base" role="img" aria-label={node.country}>
                      {node.flag}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{node.city}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({node.country})</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                        {node.nameserver}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 font-mono text-xs text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{node.ipReturned}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {node.latencyMs} ms · {node.checkedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Bản ghi mục tiêu: {probeHost}.{selectedDomain?.name}</span>
              <span className="text-emerald-400 font-mono font-medium">100% Đồng bộ</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Managed Domains Zones Health & Recent Audit Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Widget 5: Managed Domains Table Quick View (7 cols) */}
        {isWidgetVisible('zones_health') && (
          <div className={`${isWidgetVisible('recent_changes') ? 'lg:col-span-7' : 'lg:col-span-12'} p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Trạng Thái Vùng Tên Miền DNS (DNS Zones Health)</span>
              </h2>
              <button
                onClick={() => setActiveTab('domains')}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2.5">Tên miền</th>
                    <th className="pb-2.5">Nhà đăng ký</th>
                    <th className="pb-2.5">Bản ghi</th>
                    <th className="pb-2.5">Bảo mật SSL</th>
                    <th className="pb-2.5 text-right">Lưu lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {domains.map((dom) => (
                    <tr key={dom.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{dom.name}</span>
                          {dom.dnssec && (
                            <span title="DNSSEC đã bật" className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1 rounded">
                              SEC
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-300 font-mono text-[11px]">
                        {dom.registrar}
                      </td>
                      <td className="py-2.5 font-mono text-slate-300 tabular-nums">
                        {dom.recordCount} records
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded ${
                            dom.sslStatus === 'valid'
                              ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50'
                              : 'text-amber-400 bg-amber-950/60 border border-amber-800/50'
                          }`}
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>{dom.sslStatus === 'valid' ? 'TLS Hợp lệ' : 'Sắp hết hạn'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-cyan-400 tabular-nums">
                        {dom.qps.toLocaleString()} QPS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Widget 6: Recent Audit Activities (5 cols) */}
        {isWidgetVisible('recent_changes') && (
          <div className={`${isWidgetVisible('zones_health') ? 'lg:col-span-5' : 'lg:col-span-12'} p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Biến Động Bản Ghi Gần Nhất (Recent Changes)</span>
              </h2>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem nhật ký</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>{log.actor.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {log.details}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>{log.domainName}</span>
                    <span>{log.ipAddress}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Bảo vệ toàn vẹn lịch sử: HMAC-SHA256</span>
              <span className="text-cyan-400 font-mono">Rollback Enabled</span>
            </div>
          </div>
        )}
      </div>

      {/* Widget 7: Security Status (if visible) */}
      {isWidgetVisible('security_status') && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60 font-mono font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Trạng Thái An Ninh Tài Khoản: BẢO VỆ CAO ĐỘ</span>
              <span className="text-slate-400 text-[11px]">
                Xác thực hai lớp (2FA) đang kích hoạt · Danh sách trắng IP: 3 dải mạng văn phòng · Tuân thủ ISO 27001
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('team')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono text-xs border border-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Quản lý phân quyền & 2FA
          </button>
        </div>
      )}

      {/* Dashboard Customizer Modal */}
      <DashboardCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgets}
        onSaveWidgets={handleSaveWidgets}
        onResetWidgets={handleResetWidgets}
      />
    </div>
  );
};
