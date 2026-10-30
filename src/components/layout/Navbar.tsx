import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  Bell,
  Globe,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Search,
  Command
} from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddModal }) => {
  const {
    domains,
    selectedDomainId,
    setSelectedDomainId,
    activeTab,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    isOffline,
    toggleOfflineMode,
    syncStatus,
    language,
    setLanguage,
    alerts,
    unreadAlertsCount,
    markAlertAsRead,
    clearAlerts,
    setIsSearchPaletteOpen,
    t
  } = useDns();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-neutral-800/80 text-neutral-100 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto h-11">
        {/* Zone 1: Brand wordmark in sleek Next.js style */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Next.js Minimalist Triangle/Monogram */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-white cursor-pointer hover:border-neutral-500 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 180 180" fill="none">
              <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
                <circle cx="90" cy="90" r="90" fill="black" />
              </mask>
              <g mask="url(#mask0)">
                <circle cx="90" cy="90" r="90" fill="black" stroke="white" strokeWidth="6" />
                <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="white" />
                <rect x="115" y="54" width="12" height="72" fill="white" />
              </g>
            </svg>
          </div>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-sm font-bold tracking-tight text-white hover:text-neutral-300 transition-colors whitespace-nowrap">
              DNS Sentinel
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
              v1.4
            </span>
          </div>

          {/* Slash divider Next.js style */}
          <span className="text-neutral-700 font-mono text-sm hidden sm:inline">/</span>

          {/* Quick Domain Select - Touch Friendly on mobile */}
          <div className="relative">
            <select
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value)}
              className="bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-neutral-600 cursor-pointer min-h-[36px] max-w-[150px] sm:max-w-[210px] truncate"
            >
              {domains.map((dom) => (
                <option key={dom.id} value={dom.id}>
                  {dom.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links (Hidden on mobile, handled by bottom nav) */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-neutral-400">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap transition-colors hover:text-white py-1 ${
              activeTab === 'dashboard' ? 'text-white font-semibold' : ''
            }`}
          >
            {t.navDashboard}
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`whitespace-nowrap transition-colors hover:text-white py-1 ${
              activeTab === 'records' ? 'text-white font-semibold' : ''
            }`}
          >
            {t.navRecords}
          </button>
          <button
            onClick={() => setActiveTab('domains')}
            className={`whitespace-nowrap transition-colors hover:text-white py-1 ${
              activeTab === 'domains' ? 'text-white font-semibold' : ''
            }`}
          >
            {t.navDomains}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`whitespace-nowrap transition-colors hover:text-white py-1 ${
              activeTab === 'audit' ? 'text-white font-semibold' : ''
            }`}
          >
            {t.navAudit}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap transition-colors hover:text-white py-1 ${
              activeTab === 'reports' ? 'text-white font-semibold' : ''
            }`}
          >
            {t.navReports}
          </button>
        </nav>

        {/* Global Search Bar (Desktop & Tablet) */}
        <div className="flex-1 max-w-xs mx-2 hidden md:block">
          <button
            onClick={() => setIsSearchPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer min-h-[36px]"
            title="Tìm kiếm bản ghi, tên miền, nhật ký (⌘K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="text-xs font-normal truncate">Tìm kiếm toàn cục...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-400 shrink-0">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Zone 3: Primary action & system controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchPaletteOpen(true)}
            className="md:hidden min-h-[36px] min-w-[36px] p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
            title="Tìm kiếm toàn cục (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Real-time Sync Status Badge (Desktop & Tablet) */}
          <button
            onClick={toggleOfflineMode}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors cursor-pointer ${
              isOffline
                ? 'bg-amber-950/30 text-amber-300 border-amber-800'
                : syncStatus === 'syncing'
                ? 'bg-neutral-900 text-neutral-300 border-neutral-800'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
            title={isOffline ? 'Đang ngoại tuyến. Nhấp để kết nối lại' : 'Realtime Anycast synced'}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="text-[11px]">Offline</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-neutral-400" />
                <span className="text-[11px]">Syncing</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px]">Live</span>
              </>
            )}
          </button>

          {/* Notifications Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(prev => !prev)}
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors relative flex items-center justify-center cursor-pointer"
              title="Thông báo cảnh báo"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full text-[10px] font-mono font-bold flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Cảnh Báo Đẩy Thời Gian Thực</span>
                    <span className="text-[10px] text-neutral-400 font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                      Telegram & Email
                    </span>
                  </div>
                  {alerts.length > 0 && (
                    <button
                      onClick={clearAlerts}
                      className="text-[11px] text-neutral-400 hover:text-white"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-6">Không có cảnh báo mới.</p>
                  ) : (
                    alerts.slice(0, 5).map((alt) => (
                      <div
                        key={alt.id}
                        onClick={() => markAlertAsRead(alt.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          alt.read
                            ? 'bg-neutral-950/40 border-neutral-850 text-neutral-500'
                            : 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white truncate">{alt.title}</span>
                          <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">{alt.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">{alt.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-neutral-800 flex justify-between items-center text-[11px]">
                  <button
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      setActiveTab('notifications');
                    }}
                    className="text-neutral-300 hover:text-white hover:underline flex items-center gap-1 font-mono text-[10px]"
                  >
                    <span>Cấu hình Bot & Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className="text-neutral-500 font-mono text-[10px]">Real-time Push</span>
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA: Add DNS Record Button */}
          <button
            onClick={onOpenAddModal}
            className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">{t.addRecord}</span>
            <span className="sm:hidden">Bản ghi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
