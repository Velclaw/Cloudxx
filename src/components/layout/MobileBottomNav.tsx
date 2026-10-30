import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  LayoutDashboard,
  Server,
  Globe,
  Bell,
  MoreHorizontal,
  Radio,
  History,
  Users,
  FileSpreadsheet,
  HardDriveDownload,
  Code2,
  ShieldCheck,
  X,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    unreadAlertsCount,
    isOffline,
    toggleOfflineMode,
    isDarkMode,
    toggleDarkMode,
    language,
    setLanguage,
    t
  } = useDns();

  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'records', label: 'Bản ghi', icon: Server },
    { id: 'domains', label: 'Tên miền', icon: Globe },
    { id: 'notifications', label: 'Cảnh báo', icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : null },
  ];

  const secondaryMenu = [
    { id: 'registrars', label: t.navRegistrars, icon: Radio, desc: 'Cloudflare, AWS, Namecheap' },
    { id: 'team', label: t.navTeam, icon: Users, desc: 'Phân quyền RBAC & Thành viên' },
    { id: 'audit', label: t.navAudit, icon: History, desc: 'Lịch sử thao tác & Rollback' },
    { id: 'reports', label: t.navReports, icon: FileSpreadsheet, desc: 'Xuất PDF & Excel CSV' },
    { id: 'backup', label: t.navBackup, icon: HardDriveDownload, desc: 'Sao lưu Snapshot tự động' },
    { id: 'api', label: t.navApi, icon: Code2, desc: 'Khóa API Tokens & cURL' },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMoreSheetOpen(false);
  };

  return (
    <>
      {/* Fixed Ergonomic Mobile Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-800/80 pb-safe transition-colors">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 transition-all rounded-lg active:scale-95 cursor-pointer relative ${
                  isActive ? 'text-white font-semibold' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 truncate">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 bg-white rounded-full mt-0.5"></span>
                )}
              </button>
            );
          })}

          {/* 5th Tab: More Button */}
          <button
            onClick={() => setIsMoreSheetOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 transition-all rounded-lg active:scale-95 cursor-pointer ${
              ['registrars', 'team', 'audit', 'reports', 'backup', 'api'].includes(activeTab)
                ? 'text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1 truncate">Thêm</span>
            {['registrars', 'team', 'audit', 'reports', 'backup', 'api'].includes(activeTab) && (
              <span className="w-1 h-1 bg-white rounded-full mt-0.5"></span>
            )}
          </button>
        </div>
      </nav>

      {/* Next.js Minimalist Mobile Action Drawer (Bottom Sheet) */}
      {isMoreSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          {/* Backdrop click to dismiss */}
          <div className="flex-1" onClick={() => setIsMoreSheetOpen(false)} />

          <div className="bg-neutral-950 border-t border-neutral-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto pb-safe shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
              <div>
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                  Bảng Điều Khiển Mở Rộng
                </span>
                <h3 className="text-base font-bold text-white">Chức Năng Quản Trị</h3>
              </div>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick toggles row (Offline, Dark mode, Language) */}
            <div className="grid grid-cols-3 gap-2 py-1 text-xs font-mono">
              <button
                onClick={toggleOfflineMode}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${
                  isOffline
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                }`}
              >
                {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                <span className="text-[10px]">{isOffline ? 'Offline' : 'Online'}</span>
              </button>

              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 flex flex-col items-center justify-center gap-1"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span className="text-[10px]">{isDarkMode ? 'Theme Tối' : 'Theme Sáng'}</span>
              </button>

              <button
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 flex flex-col items-center justify-center gap-1"
              >
                <span className="font-bold text-xs">{language.toUpperCase()}</span>
                <span className="text-[10px]">Ngôn ngữ</span>
              </button>
            </div>

            {/* Secondary navigation items list */}
            <div className="space-y-1.5 pt-2">
              {secondaryMenu.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 border-neutral-700 text-white'
                        : 'bg-neutral-950 hover:bg-neutral-900/60 border-neutral-800/80 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-xs block text-white">{item.label}</span>
                        <span className="text-[10px] text-neutral-400 block">{item.desc}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
