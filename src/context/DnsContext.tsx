import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DomainZone,
  DNSRecord,
  RegistrarIntegration,
  NotificationSettings,
  AuditLogEntry,
  TeamMember,
  BackupSnapshot,
  GlobalNodeProbe,
  ApiToken,
  PushNotificationAlert,
  UserRole
} from '../types/dns';
import {
  initialDomains,
  initialRecords,
  initialRegistrars,
  initialNotificationSettings,
  initialAuditLogs,
  initialTeamMembers,
  initialBackups,
  initialGlobalNodes,
  initialApiTokens,
  initialPushAlerts
} from '../data/mockDnsData';
import { Language, translations } from '../utils/i18n';

interface DnsContextType {
  // State
  domains: DomainZone[];
  records: DNSRecord[];
  selectedDomainId: string;
  selectedDomain: DomainZone | undefined;
  domainRecords: DNSRecord[];
  registrars: RegistrarIntegration[];
  notificationSettings: NotificationSettings;
  auditLogs: AuditLogEntry[];
  teamMembers: TeamMember[];
  backups: BackupSnapshot[];
  globalNodes: GlobalNodeProbe[];
  apiTokens: ApiToken[];
  alerts: PushNotificationAlert[];
  unreadAlertsCount: number;
  currentUser: TeamMember;
  twoFactorSettings: {
    enabled: boolean;
    secret: string;
    backupCodes: string[];
  };
  isOffline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  activeTab: string;
  language: Language;
  t: typeof translations['vi'];
  isDarkMode: boolean;
  highlightedItemId: string | null;
  isSearchPaletteOpen: boolean;

  // Actions
  setSelectedDomainId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  toggleOfflineMode: () => void;
  setHighlightedItemId: (id: string | null) => void;
  setIsSearchPaletteOpen: (open: boolean) => void;
  navigateToSearchResult: (type: 'domain' | 'record' | 'audit', item: any) => void;
  
  // DNS Records
  createRecord: (record: Omit<DNSRecord, 'id' | 'lastUpdated' | 'updatedBy' | 'status' | 'sortOrder'>) => DNSRecord;
  updateRecord: (id: string, updates: Partial<DNSRecord>) => void;
  deleteRecord: (id: string) => void;
  rollbackRecord: (logId: string) => boolean;
  reorderRecords: (reorderedIds: string[]) => void;
  triggerDdnsAutoUpdate: (recordId: string, customIp?: string) => void;

  // Domains & SSL
  createDomain: (domain: Omit<DomainZone, 'id' | 'createdAt' | 'recordCount' | 'qps' | 'delegationSynced'>) => DomainZone;
  renewSslCertificate: (domainId: string) => void;
  deleteDomain: (id: string) => void;

  // Registrars
  syncRegistrar: (id: string) => void;
  updateRegistrarApiKey: (id: string, apiKey: string, apiSecret?: string) => void;

  // Notifications
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  sendTestNotification: (channel: 'telegram' | 'email') => void;
  markAlertAsRead: (id: string) => void;
  clearAlerts: () => void;

  // Security & 2FA
  toggleTwoFactor: (enabled: boolean) => void;

  // RBAC & Team
  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'lastActive' | 'status'>) => void;
  updateMemberRole: (id: string, role: UserRole, allowedDomains: string[] | 'ALL') => void;
  deleteMember: (id: string) => void;

  // Backup & Restore
  createBackup: (label?: string) => BackupSnapshot;
  restoreBackup: (snapshotId: string) => boolean;
  uploadRestoreBackup: (jsonContent: string) => boolean;

  // API Tokens
  createApiToken: (name: string, role: 'read' | 'write' | 'admin') => ApiToken;
  revokeApiToken: (tokenId: string) => void;

  // Propagation Probe
  runGlobalProbe: (host?: string) => void;
  isProbing: boolean;
}

const DnsContext = createContext<DnsContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'dns_sentinel_enterprise_';

export const DnsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with localStorage fallbacks
  const [domains, setDomains] = useState<DomainZone[]>([]);

  const [records, setRecords] = useState<DNSRecord[]>([]);

  const [selectedDomainId, setSelectedDomainId] = useState<string>(() => {
    return initialDomains[0]?.id || '';
  });

  const [registrars, setRegistrars] = useState<RegistrarIntegration[]>([]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : initialNotificationSettings;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}audit`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}team`);
    return saved ? JSON.parse(saved) : initialTeamMembers;
  });

  const [backups, setBackups] = useState<BackupSnapshot[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}backups`);
    return saved ? JSON.parse(saved) : initialBackups;
  });

  const [globalNodes, setGlobalNodes] = useState<GlobalNodeProbe[]>(initialGlobalNodes);
  const [isProbing, setIsProbing] = useState(false);

  const [apiTokens, setApiTokens] = useState<ApiToken[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}api_tokens`);
    return saved ? JSON.parse(saved) : initialApiTokens;
  });

  const [alerts, setAlerts] = useState<PushNotificationAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}alerts`);
    return saved ? JSON.parse(saved) : initialPushAlerts;
  });

  const [currentUser] = useState<TeamMember>(initialTeamMembers[0]);

  const [twoFactorSettings, setTwoFactorSettings] = useState({
    enabled: true,
    secret: 'JBSWY3DPEHPK3PXP',
    backupCodes: ['4819-2041', '9912-3814', '7721-0943', '1284-9042', '5519-8231', '3349-1102']
  });

  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState<Language>('vi');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);

  const navigateToSearchResult = (type: 'domain' | 'record' | 'audit', item: any) => {
    setIsSearchPaletteOpen(false);
    if (!item) return;

    if (type === 'domain') {
      setSelectedDomainId(item.id);
      setActiveTab('domains');
      setHighlightedItemId(item.id);
    } else if (type === 'record') {
      if (item.domainId) {
        setSelectedDomainId(item.domainId);
      }
      setActiveTab('records');
      setHighlightedItemId(item.id);
    } else if (type === 'audit') {
      setActiveTab('audit');
      setHighlightedItemId(item.id);
    }

    setTimeout(() => {
      setHighlightedItemId(current => (current === item.id ? null : current));
    }, 4500);
  };

  // Domain, DNS record and registrar state is hydrated from the authenticated API.
  // Secrets are never persisted in browser storage.
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        setSyncStatus('syncing');
        const [domainResponse, registrarResponse, auditResponse] = await Promise.all([
          fetch('/api/domains', { cache: 'no-store' }),
          fetch('/api/registrars', { cache: 'no-store' }),
          fetch('/api/audit-logs', { cache: 'no-store' }),
        ]);
        if (!domainResponse.ok || !registrarResponse.ok) throw new Error('API unavailable');
        const domainPayload = await domainResponse.json();
        const registrarPayload = await registrarResponse.json();
        const auditPayload = auditResponse.ok ? await auditResponse.json() : { logs: [] };
        if (!active) return;
        const mappedDomains: DomainZone[] = (domainPayload.domains || []).map((d: any) => ({
          id: d.id, name: d.name, registrar: d.registrar || 'Cloudflare', status: d.status || 'active',
          autoRenew: !!d.autoRenew, expiresAt: d.expiresAt || '', nameservers: d.nameservers || [], dnssec: !!d.dnssec,
          sslStatus: 'provisioning', sslExpiryDate: '', sslIssuer: '', autoSslRenewal: false,
          recordCount: d.records?.length || 0, qps: 0, environment: d.environment || 'production',
          createdAt: d.createdAt, delegationSynced: true,
        }));
        const mappedRecords: DNSRecord[] = (domainPayload.domains || []).flatMap((d: any) => (d.records || []).map((r: any, index: number) => ({
          id: r.id, domainId: d.id, domainName: d.name, type: r.type, name: r.name, content: r.content,
          ttl: r.ttlAuto ? 'Auto' : r.ttl, priority: r.priority ?? undefined, port: r.port ?? undefined,
          weight: r.weight ?? undefined, proxied: !!r.proxied, category: 'web', autoUpdateEnabled: false,
          status: 'active', lastUpdated: r.updatedAt, updatedBy: 'Cloudxx', comment: r.comment || '', sortOrder: index + 1,
        })));
        setDomains(mappedDomains);
        setRecords(mappedRecords);
        setRegistrars((registrarPayload.registrars || []).map((r: any) => ({
          id: r.id, provider: r.provider, name: r.displayName, apiKey: '', accountEmail: r.accountEmail || '',
          status: r.status === 'connected' ? 'connected' : 'disconnected', lastSynced: r.lastSyncedAt || '', domainsCount: 0, autoSyncIntervalMinutes: 15,
        })));
        if (auditPayload.logs) setAuditLogs(auditPayload.logs);
        if (mappedDomains.length) setSelectedDomainId(current => mappedDomains.some(d => d.id === current) ? current : mappedDomains[0].id);
        setSyncStatus('synced');
      } catch {
        if (active) setSyncStatus('offline');
      }
    };
    void hydrate();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}team`, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}backups`, JSON.stringify(backups));
  }, [backups]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}api_tokens`, JSON.stringify(apiTokens));
  }, [apiTokens]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}alerts`, JSON.stringify(alerts));
  }, [alerts]);

  // Dark mode HTML class sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const toggleOfflineMode = () => {
    setIsOffline(prev => {
      const next = !prev;
      setSyncStatus(next ? 'offline' : 'synced');
      
      const newAlert: PushNotificationAlert = {
        id: `alert-${Date.now()}`,
        title: next ? 'Đã kích hoạt chế độ Ngoại tuyến (Offline)' : 'Đã kết nối lại - Đồng bộ đám mây thành công',
        message: next
          ? 'Tất cả thay đổi bản ghi DNS sẽ được xếp vào hàng đợi cục bộ an toàn.'
          : 'Hàng đợi ngoại tuyến đã được đồng bộ với mạng lưới Anycast toàn cầu.',
        channel: 'system',
        type: next ? 'warning' : 'success',
        timestamp: 'Vừa xong',
        read: false
      };
      setAlerts(a => [newAlert, ...a]);
      return next;
    });
  };

  const selectedDomain = domains.find(d => d.id === selectedDomainId) || domains[0];
  const domainRecords = records.filter(r => r.domainId === selectedDomain?.id);

  // Helper to add audit log
  const logAudit = (
    action: AuditLogEntry['action'],
    domainName: string,
    details: string,
    recordName?: string,
    recordType?: any,
    diff?: AuditLogEntry['diff'],
    rollbackable: boolean = true
  ) => {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor: {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar
      },
      ipAddress: '113.161.44.18 (Viettel HCM)',
      action,
      domainName,
      recordName,
      recordType,
      details,
      diff,
      rollbackable
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  // Helper to dispatch alert notification
  const dispatchAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', domainName?: string) => {
    const alertId = `alt-${Date.now()}`;
    const newAlert: PushNotificationAlert = {
      id: alertId,
      title,
      message,
      channel: notificationSettings.telegram.enabled ? 'telegram' : 'email',
      type,
      timestamp: 'Vừa xong',
      read: false,
      domainName
    };
    setAlerts(prev => [newAlert, ...prev]);

    // Simulate transient syncing indicator
    if (!isOffline) {
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('synced'), 700);
    }
  };

  // DNS Record operations
  const createRecord = (recordData: Omit<DNSRecord, 'id' | 'lastUpdated' | 'updatedBy' | 'status' | 'sortOrder'>): DNSRecord => {
    const newRecord: DNSRecord = {
      ...recordData,
      id: `rec-${Date.now()}`,
      status: 'active',
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email,
      sortOrder: records.filter(r => r.domainId === recordData.domainId).length + 1
    };

    setRecords(prev => [...prev, newRecord]);
    void fetch(`/api/domains/${encodeURIComponent(recordData.domainId)}/records`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: recordData.type, name: recordData.name, content: recordData.content, ttl: recordData.ttl, priority: recordData.priority, port: recordData.port, weight: recordData.weight, proxied: recordData.proxied, comment: recordData.comment }),
    }).then(async response => {
      if (!response.ok) throw new Error('DNS record save failed');
      const payload = await response.json();
      if (payload.record?.id) setRecords(prev => prev.map(item => item.id === newRecord.id ? { ...item, id: payload.record.id, lastUpdated: payload.record.updatedAt } : item));
    }).catch(() => {
      setRecords(prev => prev.filter(item => item.id !== newRecord.id));
      setDomains(prev => prev.map(d => d.id === recordData.domainId ? { ...d, recordCount: Math.max(0, d.recordCount - 1) } : d));
      setSyncStatus('offline');
      dispatchAlert('Không thể lưu DNS record', 'PostgreSQL chưa xác nhận thao tác; thay đổi tạm đã được hoàn tác.', 'error', recordData.domainName);
    });

    // Update domain record count
    setDomains(prev => prev.map(d => d.id === recordData.domainId ? { ...d, recordCount: d.recordCount + 1 } : d));

    logAudit(
      'CREATE_RECORD',
      recordData.domainName,
      `Tạo mới bản ghi ${recordData.name} (${recordData.type}) trỏ tới ${recordData.content}`,
      recordData.name,
      recordData.type,
      { after: newRecord },
      true
    );

    dispatchAlert(
      `Bản ghi ${recordData.type} mới đã tạo`,
      `${recordData.name}.${recordData.domainName} -> ${recordData.content}`,
      'success',
      recordData.domainName
    );

    return newRecord;
  };

  const updateRecord = (id: string, updates: Partial<DNSRecord>) => {
    const existing = records.find(r => r.id === id);
    if (!existing) return;

    const updatedRecord: DNSRecord = {
      ...existing,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    };

    setRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
    void fetch(`/api/domains/${encodeURIComponent(existing.domainId)}/records/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: updates.type, name: updates.name, content: updates.content, ttl: updates.ttl, proxied: updates.proxied, comment: updates.comment }),
    }).then(response => { if (!response.ok) throw new Error('DNS record update failed'); })
      .catch(() => {
        setRecords(prev => prev.map(r => r.id === id ? existing : r));
        setSyncStatus('offline');
        dispatchAlert('Không thể cập nhật DNS record', 'PostgreSQL chưa xác nhận thao tác; bản ghi cũ đã được khôi phục.', 'error', existing.domainName);
      });

    logAudit(
      'UPDATE_RECORD',
      existing.domainName,
      `Cập nhật bản ghi ${existing.name} (${existing.type}): ${updates.content ? `Giá trị mới: ${updates.content}` : 'Thay đổi cấu hình'}`,
      existing.name,
      existing.type,
      { before: existing, after: updatedRecord },
      true
    );

    dispatchAlert(
      `Bản ghi DNS được cập nhật`,
      `${existing.name}.${existing.domainName} (${existing.type}) đã được điều chỉnh`,
      'info',
      existing.domainName
    );
  };

  const deleteRecord = (id: string) => {
    const existing = records.find(r => r.id === id);
    if (!existing) return;

    setRecords(prev => prev.filter(r => r.id !== id));
    void fetch(`/api/domains/${encodeURIComponent(existing.domainId)}/records/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then(response => { if (!response.ok) throw new Error('DNS record delete failed'); })
      .catch(() => {
        setRecords(prev => prev.some(r => r.id === id) ? prev : [...prev, existing]);
        setDomains(prev => prev.map(d => d.id === existing.domainId ? { ...d, recordCount: d.recordCount + 1 } : d));
        setSyncStatus('offline');
        dispatchAlert('Không thể xóa DNS record', 'PostgreSQL chưa xác nhận thao tác; bản ghi đã được khôi phục.', 'error', existing.domainName);
      });
    setDomains(prev => prev.map(d => d.id === existing.domainId ? { ...d, recordCount: Math.max(0, d.recordCount - 1) } : d));

    logAudit(
      'DELETE_RECORD',
      existing.domainName,
      `Xóa bản ghi ${existing.name} (${existing.type}) từng trỏ tới ${existing.content}`,
      existing.name,
      existing.type,
      { before: existing },
      true
    );

    dispatchAlert(
      `Bản ghi DNS đã bị xóa`,
      `${existing.name}.${existing.domainName} (${existing.type}) đã bị loại khỏi Zone`,
      'warning',
      existing.domainName
    );
  };

  const rollbackRecord = (logId: string): boolean => {
    const log = auditLogs.find(l => l.id === logId);
    if (!log || !log.rollbackable || !log.diff) return false;

    if (log.action === 'UPDATE_RECORD' && log.diff.before) {
      const targetId = log.diff.before.id;
      if (targetId) {
        setRecords(prev => prev.map(r => r.id === targetId ? { ...r, ...log.diff!.before, lastUpdated: new Date().toISOString(), updatedBy: `${currentUser.email} (Rollback)` } : r));
        logAudit('ROLLBACK', log.domainName, `Hoàn tác thay đổi bản ghi ${log.recordName} theo phiên bản kiểm toán ${log.id}`, log.recordName, log.recordType, undefined, false);
        dispatchAlert('Hoàn tác bản ghi thành công', `Đã khôi phục trạng thái bản ghi ${log.recordName}.${log.domainName}`, 'success', log.domainName);
        return true;
      }
    } else if (log.action === 'CREATE_RECORD' && log.diff.after?.id) {
      // Rollback a create = delete it
      setRecords(prev => prev.filter(r => r.id !== log.diff!.after!.id));
      logAudit('ROLLBACK', log.domainName, `Hoàn tác xóa bản ghi vừa tạo ${log.recordName}`, log.recordName, log.recordType, undefined, false);
      dispatchAlert('Hoàn tác tạo mới thành công', `Bản ghi đã được xóa theo yêu cầu hoàn tác`, 'info', log.domainName);
      return true;
    } else if (log.action === 'DELETE_RECORD' && log.diff.before) {
      // Rollback a delete = re-insert it
      const restored = log.diff.before as DNSRecord;
      setRecords(prev => [...prev, restored]);
      logAudit('ROLLBACK', log.domainName, `Khôi phục bản ghi đã xóa ${restored.name}`, restored.name, restored.type, undefined, false);
      dispatchAlert('Khôi phục bản ghi đã xóa thành công', `Đã phục hồi ${restored.name}.${log.domainName}`, 'success', log.domainName);
      return true;
    }
    return false;
  };

  const reorderRecords = (reorderedIds: string[]) => {
    setRecords(prev => {
      const map = new Map(prev.map(r => [r.id, r]));
      return reorderedIds.map((id, index) => {
        const item = map.get(id);
        if (item) {
          return { ...item, sortOrder: index + 1 };
        }
        return item!;
      }).filter(Boolean);
    });
  };

  const triggerDdnsAutoUpdate = (recordId: string, customIp?: string) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    // Simulate IP change
    const octets = target.content.split('.');
    let newIp = customIp;
    if (!newIp && octets.length === 4) {
      const last = Math.floor(Math.random() * 200) + 10;
      newIp = `${octets[0]}.${octets[1]}.${octets[2]}.${last}`;
    } else if (!newIp) {
      newIp = '104.21.52.99';
    }

    const previousIp = target.content;
    updateRecord(recordId, { content: newIp });

    logAudit(
      'DDNS_AUTO_UPDATE',
      target.domainName,
      `DDNS Daemon phát hiện IP WAN thay đổi từ ${previousIp} -> ${newIp}. Tự động đồng bộ DNS Apex.`,
      target.name,
      target.type,
      { before: { content: previousIp }, after: { content: newIp } }
    );

    dispatchAlert(
      `Cập nhật DDNS tự động thành công!`,
      `${target.name}.${target.domainName} trỏ IP mới: ${newIp}`,
      'success',
      target.domainName
    );
  };

  // Domains & SSL
  const createDomain = (domainData: Omit<DomainZone, 'id' | 'createdAt' | 'recordCount' | 'qps' | 'delegationSynced'>): DomainZone => {
    const newDomain: DomainZone = {
      ...domainData,
      id: `dom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      recordCount: 2,
      qps: 100,
      delegationSynced: true
    };

    // Persist the domain first; replace the temporary UI id with the database id.
    void fetch('/api/domains', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDomain.name, registrar: newDomain.registrar, autoRenew: newDomain.autoRenew, nameservers: newDomain.nameservers, dnssec: newDomain.dnssec, environment: newDomain.environment }),
    }).then(async response => {
      if (!response.ok) throw new Error('Domain create failed');
      const payload = await response.json();
      const persisted = payload.domain;
      if (!persisted?.id) throw new Error('Missing persisted domain id');
      const seeded = [defaultApexA, defaultCname];
      const savedRecords = await Promise.all(seeded.map(async record => {
        const recordResponse = await fetch(`/api/domains/${encodeURIComponent(persisted.id)}/records`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: record.type, name: record.name, content: record.content, ttl: record.ttl, proxied: record.proxied, comment: record.comment }),
        });
        if (!recordResponse.ok) throw new Error('Initial DNS record create failed');
        const recordPayload = await recordResponse.json();
        return { ...record, id: recordPayload.record.id, domainId: persisted.id, lastUpdated: recordPayload.record.updatedAt };
      }));
      setDomains(prev => prev.map(item => item.id === newDomain.id ? { ...item, id: persisted.id, createdAt: persisted.createdAt, recordCount: savedRecords.length } : item));
      setRecords(prev => [...prev.filter(item => item.domainId !== newDomain.id), ...savedRecords]);
      setSelectedDomainId(current => current === newDomain.id ? persisted.id : current);
    }).catch(() => {
      setDomains(prev => prev.filter(item => item.id !== newDomain.id));
      setRecords(prev => prev.filter(item => item.domainId !== newDomain.id));
      setSyncStatus('offline');
      dispatchAlert('Không thể tạo domain', 'PostgreSQL chưa xác nhận thao tác; dữ liệu tạm đã được hoàn tác.', 'error', newDomain.name);
    });
    setDomains(prev => [...prev, newDomain]);

    // Seed default NS records and apex A record
    const defaultApexA: DNSRecord = {
      id: `rec-${Date.now()}-1`,
      domainId: newDomain.id,
      domainName: newDomain.name,
      type: 'A',
      name: '@',
      content: '192.0.2.1',
      ttl: 300,
      proxied: true,
      category: 'web',
      autoUpdateEnabled: false,
      status: 'active',
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email,
      comment: 'Initial apex web address',
      sortOrder: 1
    };

    const defaultCname: DNSRecord = {
      id: `rec-${Date.now()}-2`,
      domainId: newDomain.id,
      domainName: newDomain.name,
      type: 'CNAME',
      name: 'www',
      content: newDomain.name,
      ttl: 3600,
      proxied: true,
      category: 'web',
      autoUpdateEnabled: false,
      status: 'active',
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email,
      comment: 'WWW canonical alias',
      sortOrder: 2
    };

    setRecords(prev => [...prev, defaultApexA, defaultCname]);
    setSelectedDomainId(newDomain.id);

    logAudit('DOMAIN_ADDED', newDomain.name, `Đăng ký & ủy quyền quản lý tên miền mới qua ${newDomain.registrar}`, undefined, undefined, undefined, false);
    dispatchAlert('Tên miền mới đã thêm', `${newDomain.name} đã được thiết lập vùng DNS`, 'success', newDomain.name);

    return newDomain;
  };

  const renewSslCertificate = (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    // Simulate ACME DNS-01 challenge
    setDomains(prev => prev.map(d => d.id === domainId ? { ...d, sslStatus: 'provisioning' } : d));

    setTimeout(() => {
      const nextExpiry = new Date();
      nextExpiry.setMonth(nextExpiry.getMonth() + 3); // 90 days validity
      setDomains(prev => prev.map(d => d.id === domainId ? {
        ...d,
        sslStatus: 'valid',
        sslExpiryDate: nextExpiry.toISOString(),
        sslIssuer: "Let's Encrypt Authority X3 (ACME DNS-01 Verified)"
      } : d));

      logAudit('SSL_RENEWED', domain.name, `Tự động tái tạo chứng chỉ SSL qua ACME DNS-01 Challenge thành công (Hạn 90 ngày)`, undefined, undefined, undefined, false);
      dispatchAlert('Chứng chỉ SSL đã tái cấp thành công', `${domain.name} đã gia hạn chứng chỉ TLS bảo mật mới.`, 'success', domain.name);
    }, 1200);
  };

  const deleteDomain = (id: string) => {
    const domain = domains.find(d => d.id === id);
    if (!domain) return;

    // Confirm deletion in PostgreSQL before removing the domain from the UI.
    void fetch(`/api/domains/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then(response => { if (!response.ok) throw new Error('Domain delete failed'); })
      .then(() => {
        setDomains(prev => prev.filter(d => d.id !== id));
        setRecords(prev => prev.filter(r => r.domainId !== id));
        if (selectedDomainId === id) {
          const remaining = domains.filter(d => d.id !== id);
          setSelectedDomainId(remaining[0]?.id || '');
        }
      })
      .catch(() => {
        setSyncStatus('offline');
        dispatchAlert('Không thể xóa domain', 'PostgreSQL chưa xác nhận thao tác; domain vẫn được giữ lại.', 'error', domain.name);
      });

    logAudit('DELETE_RECORD', domain.name, `Xóa toàn bộ vùng tên miền ${domain.name} và tất cả bản ghi liên quan`, undefined, undefined, undefined, false);
    dispatchAlert('Vùng tên miền đã bị gỡ bỏ', `${domain.name} đã ngừng quản lý DNS`, 'warning', domain.name);
  };

  // Registrars
  const syncRegistrar = (id: string) => {
    const reg = registrars.find(r => r.id === id);
    if (!reg) return;

    setSyncStatus('syncing');
    setTimeout(() => {
      setRegistrars(prev => prev.map(r => r.id === id ? {
        ...r,
        status: 'connected',
        lastSynced: new Date().toISOString()
      } : r));
      setSyncStatus('synced');

      logAudit('REGISTRAR_SYNC', 'Global', `Đồng bộ thông tin từ nhà cung cấp API: ${reg.provider} (${reg.name})`, undefined, undefined, undefined, false);
      dispatchAlert('Đồng bộ Registrar thành công', `Đã đồng bộ bản ghi và ủy quyền từ ${reg.provider}`, 'success');
    }, 1000);
  };

  const updateRegistrarApiKey = (id: string, apiKey: string, apiSecret?: string) => {
    const registrar = registrars.find(item => item.id === id);
    if (!registrar) return;
    const credentials = registrar.provider === 'Cloudflare'
      ? { apiToken: apiKey }
      : { apiKey, ...(apiSecret ? { apiSecret } : {}) };
    void fetch(`/api/registrars/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credentials }),
    }).then(response => {
      if (!response.ok) throw new Error('Credential save failed');
      setRegistrars(prev => prev.map(r => r.id === id ? { ...r, apiKey: '', apiSecret: undefined, status: 'connected', lastSynced: new Date().toISOString() } : r));
      dispatchAlert('Cập nhật API Registrar', 'Credential đã được mã hóa và lưu phía máy chủ.', 'success');
    }).catch(() => dispatchAlert('Không thể lưu API Registrar', 'Kiểm tra cấu hình mã hóa credential trên Vercel Preview.', 'error'));
  };

  // Notifications
  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
    dispatchAlert('Cấu hình thông báo đã lưu', 'Kênh Telegram và Email đã sẵn sàng nhận cảnh báo', 'success');
  };

  const sendTestNotification = (channel: 'telegram' | 'email') => {
    const title = channel === 'telegram'
      ? '🔔 [Telegram Test] Cloudxx Security Alert'
      : '📧 [Email Test] Thông báo kiểm tra hệ thống Cloudxx';
    const msg = `Hệ thống xác nhận kênh thông báo ${channel.toUpperCase()} hoạt động hoàn hảo. IP: 113.161.44.18 | Lúc: ${new Date().toLocaleTimeString('vi-VN')}`;

    dispatchAlert(title, msg, 'info');
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  // Security & 2FA
  const toggleTwoFactor = (enabled: boolean) => {
    setTwoFactorSettings(prev => ({ ...prev, enabled }));
    logAudit('2FA_ENABLED', 'Security System', enabled ? 'Bật bảo mật xác thực hai bước 2FA cho tài khoản' : 'Tắt xác thực hai bước 2FA', undefined, undefined, undefined, false);
    dispatchAlert(enabled ? '2FA đã được kích hoạt' : '2FA đã bị tắt', enabled ? 'Tài khoản của bạn hiện được bảo vệ bằng mã TOTP thời gian thực' : 'Bảo mật tài khoản bị giảm mức độ bảo vệ', enabled ? 'success' : 'warning');
  };

  // RBAC & Team
  const inviteTeamMember = (memberData: Omit<TeamMember, 'id' | 'lastActive' | 'status'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: `user-${Date.now()}`,
      lastActive: 'Vừa mời (Chưa đăng nhập)',
      status: 'invited'
    };
    setTeamMembers(prev => [...prev, newMember]);
    logAudit('MEMBER_INVITED' as any, 'System Team', `Mời thành viên mới ${newMember.name} (${newMember.email}) với vai trò ${newMember.role}`, undefined, undefined, undefined, false);
    dispatchAlert('Đã gửi lời mời thành viên', `Email kích hoạt phân quyền đã được gửi tới ${newMember.email}`, 'success');
  };

  const updateMemberRole = (id: string, role: UserRole, allowedDomains: string[] | 'ALL') => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role, allowedDomains } : m));
    logAudit('ROLE_CHANGED', 'System Team', `Thay đổi vai trò thành viên sang ${role}`, undefined, undefined, undefined, false);
    dispatchAlert('Phân quyền cập nhật', 'Quyền truy cập và vùng quản lý đã được điều chỉnh', 'info');
  };

  const deleteMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    dispatchAlert('Thành viên đã bị gỡ', 'Đã thu hồi toàn bộ quyền truy cập của người dùng', 'warning');
  };

  // Backup & Restore
  const createBackup = (label?: string): BackupSnapshot => {
    const newBackup: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      name: label || `Bản sao lưu thủ công ${new Date().toLocaleTimeString('vi-VN')}`,
      domainsCount: domains.length,
      recordsCount: records.length,
      trigger: 'manual',
      sizeKb: Math.round((JSON.stringify({ domains, records }).length) / 1024),
      records: [...records],
      domains: [...domains]
    };
    setBackups(prev => [newBackup, ...prev]);
    dispatchAlert('Tạo bản sao lưu thành công', `Đã lưu trạng thái ${newBackup.domainsCount} tên miền và ${newBackup.recordsCount} bản ghi DNS`, 'success');
    return newBackup;
  };

  const restoreBackup = (snapshotId: string): boolean => {
    const snapshot = backups.find(b => b.id === snapshotId);
    if (!snapshot) return false;

    // Create a pre-restore safety snapshot first
    createBackup(`Tự động lưu trước khi hoàn tác (${snapshot.name})`);

    setDomains(snapshot.domains);
    setRecords(snapshot.records);
    if (snapshot.domains.length > 0) {
      setSelectedDomainId(snapshot.domains[0].id);
    }

    logAudit('ROLLBACK', 'System Backup', `Khôi phục toàn bộ hệ thống từ bản sao lưu: ${snapshot.name}`, undefined, undefined, undefined, false);
    dispatchAlert('Khôi phục hệ thống hoàn tất', `Dữ liệu DNS đã được phục hồi chính xác từ bản ghi thời điểm ${new Date(snapshot.timestamp).toLocaleString('vi-VN')}`, 'success');
    return true;
  };

  const uploadRestoreBackup = (jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.domains && parsed.records) {
        setDomains(parsed.domains);
        setRecords(parsed.records);
        dispatchAlert('Nhập bản sao lưu thành công', `Đã khôi phục thành công từ tệp tin tải lên`, 'success');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // API Tokens
  const createApiToken = (name: string, role: 'read' | 'write' | 'admin'): ApiToken => {
    const randHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const fullKey = `dns_live_${role}_${randHex}`;
    const token: ApiToken = {
      id: `tok-${Date.now()}`,
      name,
      tokenPreview: `dns_live_${role}_****_${randHex.slice(-4)}`,
      fullToken: fullKey,
      role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
    };
    setApiTokens(prev => [token, ...prev]);
    dispatchAlert('Tạo API Token thành công', `Token mới đã được cấp với quyền hạn: ${role.toUpperCase()}`, 'success');
    return token;
  };

  const revokeApiToken = (tokenId: string) => {
    setApiTokens(prev => prev.filter(t => t.id !== tokenId));
    dispatchAlert('API Token đã bị thu hồi', 'Mã xác thực đã mất hiệu lực vĩnh viễn', 'warning');
  };

  // Propagation Probe
  const runGlobalProbe = (host?: string) => {
    setIsProbing(true);
    // Find target record IP
    const targetRecord = domainRecords.find(r => r.name === (host || '@') || r.content.includes(host || ''));
    const targetIp = targetRecord?.content || '104.21.52.88';

    // Randomize slight ping variance
    setTimeout(() => {
      setGlobalNodes(prev => prev.map(node => ({
        ...node,
        status: 'synced',
        ipReturned: targetIp,
        latencyMs: Math.max(5, node.latencyMs + Math.floor(Math.random() * 11) - 5),
        checkedAt: 'Vừa xong'
      })));
      setIsProbing(false);
      dispatchAlert('Kiểm tra lan truyền DNS hoàn tất', `100% 8/8 trạm kiểm tra toàn cầu đã đồng bộ IP ${targetIp}`, 'success', selectedDomain?.name);
    }, 800);
  };

  const unreadAlertsCount = alerts.filter(a => !a.read).length;
  const t = translations[language];

  return (
    <DnsContext.Provider
      value={{
        domains,
        records,
        selectedDomainId,
        selectedDomain,
        domainRecords,
        registrars,
        notificationSettings,
        auditLogs,
        teamMembers,
        backups,
        globalNodes,
        apiTokens,
        alerts,
        unreadAlertsCount,
        currentUser,
        twoFactorSettings,
        isOffline,
        syncStatus,
        activeTab,
        language,
        t,
        isDarkMode,
        highlightedItemId,
        isSearchPaletteOpen,
        setSelectedDomainId,
        setActiveTab,
        setLanguage,
        toggleDarkMode,
        toggleOfflineMode,
        setHighlightedItemId,
        setIsSearchPaletteOpen,
        navigateToSearchResult,
        createRecord,
        updateRecord,
        deleteRecord,
        rollbackRecord,
        reorderRecords,
        triggerDdnsAutoUpdate,
        createDomain,
        renewSslCertificate,
        deleteDomain,
        syncRegistrar,
        updateRegistrarApiKey,
        updateNotificationSettings,
        sendTestNotification,
        markAlertAsRead,
        clearAlerts,
        toggleTwoFactor,
        inviteTeamMember,
        updateMemberRole,
        deleteMember,
        createBackup,
        restoreBackup,
        uploadRestoreBackup,
        createApiToken,
        revokeApiToken,
        runGlobalProbe,
        isProbing
      }}
    >
      {children}
    </DnsContext.Provider>
  );
};

export const useDns = () => {
  const context = useContext(DnsContext);
  if (!context) {
    throw new Error('useDns must be used within a DnsProvider');
  }
  return context;
};
