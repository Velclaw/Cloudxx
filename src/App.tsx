import React, { useState } from 'react';
import { DnsProvider, useDns } from './context/DnsContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { DnsRecordsManager } from './components/records/DnsRecordsManager';
import { DomainSslManager } from './components/domains/DomainSslManager';
import { RegistrarApiManager } from './components/registrars/RegistrarApiManager';
import { NotificationSettingsView } from './components/notifications/NotificationSettings';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { TeamRbacManager } from './components/rbac/TeamRbacManager';
import { SecurityTwoFactor } from './components/security/SecurityTwoFactor';
import { ReportsExporter } from './components/reports/ReportsExporter';
import { BackupSnapshotManager } from './components/backup/BackupSnapshotManager';
import { DeveloperApiDocs } from './components/api/DeveloperApiDocs';
import { RecordModal } from './components/records/RecordModal';
import { GlobalCommandPalette } from './components/common/GlobalCommandPalette';
import { DNSRecord } from './types/dns';
import { WifiOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, isOffline, toggleOfflineMode } = useDns();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);

  const handleOpenAddRecord = () => {
    setEditingRecord(null);
    setIsRecordModalOpen(true);
  };

  const handleEditRecord = (rec: DNSRecord) => {
    setEditingRecord(rec);
    setIsRecordModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans transition-colors antialiased selection:bg-neutral-800 selection:text-white">
      {/* Offline Alert Ribbon if in offline mode */}
      {isOffline && (
        <div className="bg-amber-500 text-black px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-50">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                Chế Độ Ngoại Tuyến (Offline Mode) đang kích hoạt. Dữ liệu được lưu trong bộ nhớ đệm cục bộ và sẽ tự động đồng bộ khi có kết nối lại.
              </span>
            </div>
            <button
              onClick={toggleOfflineMode}
              className="px-3 py-1 bg-black text-white rounded font-mono text-[11px] font-bold shrink-0 hover:bg-neutral-900 cursor-pointer"
            >
              Kết nối lại
            </button>
          </div>
        </div>
      )}

      {/* 3-Zone Contract Top Navbar */}
      <Navbar onOpenAddModal={handleOpenAddRecord} />

      {/* Main Container with Sidebar and Content Viewport */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar />

        {/* Content Viewport with mobile bottom padding */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-full pb-24 md:pb-8">
          {activeTab === 'dashboard' && <OverviewDashboard onOpenAddModal={handleOpenAddRecord} />}
          {activeTab === 'records' && (
            <DnsRecordsManager
              onOpenAddModal={handleOpenAddRecord}
              onEditRecord={handleEditRecord}
            />
          )}
          {activeTab === 'domains' && <DomainSslManager />}
          {activeTab === 'registrars' && <RegistrarApiManager />}
          {activeTab === 'notifications' && <NotificationSettingsView />}
          {activeTab === 'audit' && <AuditLogsView />}
          {activeTab === 'team' && <TeamRbacManager />}
          {activeTab === 'security' && <SecurityTwoFactor />}
          {activeTab === 'reports' && <ReportsExporter />}
          {activeTab === 'backup' && <BackupSnapshotManager />}
          {activeTab === 'api' && <DeveloperApiDocs />}
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Add / Edit Record Modal (Slides up as Bottom Sheet on Mobile) */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        editRecord={editingRecord}
      />

      {/* Global Command Palette Search Modal (⌘K / Ctrl+K) */}
      <GlobalCommandPalette />
    </div>
  );
};

export default function App() {
  return (
    <DnsProvider>
      <AppContent />
    </DnsProvider>
  );
}
