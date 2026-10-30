import React from 'react';
import { useDns } from '../../context/DnsContext';
import {
  LayoutDashboard,
  Server,
  Globe,
  Radio,
  Send,
  History,
  Users,
  FileSpreadsheet,
  HardDriveDownload,
  Code2,
  Shield,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    domains,
    records,
    auditLogs,
    currentUser,
    twoFactorSettings,
    t
  } = useDns();

  const navItems = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'records',
      label: t.navRecords,
      icon: Server,
      badge: records.length.toString()
    },
    {
      id: 'domains',
      label: t.navDomains,
      icon: Globe,
      badge: domains.length.toString()
    },
    {
      id: 'registrars',
      label: t.navRegistrars,
      icon: Radio,
      badge: '5 APIs'
    },
    {
      id: 'notifications',
      label: t.navNotifications,
      icon: Send,
      badge: 'Telegram'
    },
    {
      id: 'audit',
      label: t.navAudit,
      icon: History,
      badge: auditLogs.length.toString()
    },
    {
      id: 'team',
      label: t.navTeam,
      icon: Users,
      badge: '4 Roles'
    },
    {
      id: 'reports',
      label: t.navReports,
      icon: FileSpreadsheet,
      badge: 'PDF/XLSX'
    },
    {
      id: 'backup',
      label: t.navBackup,
      icon: HardDriveDownload,
      badge: null
    },
    {
      id: 'api',
      label: t.navApi,
      icon: Code2,
      badge: 'REST v1'
    }
  ];

  return (
    <aside className="w-60 shrink-0 bg-black border-r border-neutral-800/80 flex flex-col justify-between hidden md:flex transition-colors select-none">
      <div className="p-3.5 space-y-5">
        {/* Navigation list */}
        <div className="space-y-0.5">
          <div className="px-3 pb-2 text-[10px] font-mono font-semibold tracking-wider text-neutral-500 uppercase">
            Hạ Tầng DNS
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white font-semibold shadow-sm border border-neutral-800'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-200'
                        : 'bg-neutral-950 text-neutral-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Security & System Status Banner */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-300">Tiêu chuẩn bảo mật</span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>ISO 27001</span>
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-normal">
            Bảo mật 2FA phần cứng & mã hóa khóa API Registrar đa tầng.
          </p>
          <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <span>2FA TOTP:</span>
            <span className={twoFactorSettings.enabled ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {twoFactorSettings.enabled ? 'ĐÃ BẬT' : 'CHƯA BẬT'}
            </span>
          </div>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-neutral-700 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-neutral-400 font-mono truncate">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('team')}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
            title="Xem hồ sơ & phân quyền"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
