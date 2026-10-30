export type RecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA' | 'PTR' | 'SOA' | 'ALIAS';

export type RecordCategory = 'web' | 'mail' | 'security' | 'internal' | 'cdn' | 'database';

export type RecordStatus = 'active' | 'propagating' | 'paused' | 'error';

export interface DNSRecord {
  id: string;
  domainId: string;
  domainName: string;
  type: RecordType;
  name: string; // e.g. '@', 'api', 'mail', 'www'
  content: string; // e.g. '192.168.1.1', 'mail.example.com'
  ttl: number | 'Auto'; // in seconds or Auto (300)
  priority?: number; // For MX, SRV
  port?: number; // For SRV
  weight?: number; // For SRV
  proxied: boolean; // Cloudflare-style proxy / CDN acceleration
  category: RecordCategory;
  autoUpdateEnabled: boolean; // Dynamic DNS (DDNS) auto-updater
  autoUpdateKey?: string;
  status: RecordStatus;
  lastUpdated: string;
  updatedBy: string;
  comment?: string;
  sortOrder: number;
}

export type RegistrarProvider = 'Cloudflare' | 'AWS Route 53' | 'Namecheap' | 'GoDaddy' | 'DigitalOcean' | 'Google Cloud' | 'Porkbun';

export type SSLStatus = 'valid' | 'expiring_soon' | 'expired' | 'provisioning';

export interface DomainZone {
  id: string;
  name: string; // e.g. "vnpay-gateway.vn"
  registrar: RegistrarProvider;
  status: 'active' | 'pending_verification' | 'expired' | 'delegation_error';
  autoRenew: boolean;
  expiresAt: string;
  nameservers: string[];
  dnssec: boolean;
  sslStatus: SSLStatus;
  sslExpiryDate: string;
  sslIssuer: string;
  autoSslRenewal: boolean;
  recordCount: number;
  qps: number;
  environment: 'production' | 'staging' | 'internal' | 'client_projects';
  createdAt: string;
  delegationSynced: boolean;
}

export interface RegistrarIntegration {
  id: string;
  provider: RegistrarProvider;
  name: string;
  apiKey: string;
  apiSecret?: string;
  accountEmail?: string;
  status: 'connected' | 'disconnected' | 'rate_limited';
  lastSynced: string;
  domainsCount: number;
  autoSyncIntervalMinutes: number;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  alertCriticalDnsChanges: boolean;
  alertDomainExpiration: boolean;
  alertSystemEvents: boolean;
  alertSslCertificates: boolean;
  alertDdnsFailover: boolean;
  severityThreshold: 'all' | 'critical' | 'warn_crit';
  lastSentAlert?: string;
}

export interface EmailConfig {
  enabled: boolean;
  recipients: string[];
  smtpServer: string;
  senderEmail: string;
  alertCriticalDnsChanges: boolean;
  alertDomainExpiration: boolean;
  alertSystemEvents: boolean;
  alertSslCertificates: boolean;
  alertDdnsFailover: boolean;
  digestFrequency: 'immediate' | 'daily' | 'weekly';
  severityThreshold: 'all' | 'critical' | 'warn_crit';
}

export interface WebhookConfig {
  enabled: boolean;
  endpointUrl: string;
  secretToken: string;
  events: string[];
}

export interface NotificationSettings {
  telegram: TelegramConfig;
  email: EmailConfig;
  webhook: WebhookConfig;
}

export type TwoFactorMethod = 'totp' | 'sms';

export interface TwoFactorState {
  enabled: boolean;
  activeMethod: TwoFactorMethod;
  totpSecret: string;
  phoneNumber: string;
  phoneCountryCode: string;
  backupCodes: string[];
  smsCodePending?: string;
  smsCodeExpiresAt?: string;
  requireForCriticalChanges: boolean;
}

export type DashboardWidgetId =
  | 'metrics'
  | 'traffic_chart'
  | 'propagation_prober'
  | 'zones_health'
  | 'recent_changes'
  | 'security_status'
  | 'active_alerts';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  visible: boolean;
  order: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    email: string;
    role: string;
    avatar: string;
  };
  ipAddress: string;
  action: 'CREATE_RECORD' | 'UPDATE_RECORD' | 'DELETE_RECORD' | 'ROLLBACK' | 'REGISTRAR_SYNC' | 'DDNS_AUTO_UPDATE' | 'SSL_RENEWED' | '2FA_ENABLED' | 'ROLE_CHANGED' | 'DOMAIN_ADDED' | 'DOMAIN_DELETED';
  domainName: string;
  recordName?: string;
  recordType?: RecordType;
  details: string;
  diff?: {
    before?: Partial<DNSRecord>;
    after?: Partial<DNSRecord>;
  };
  rollbackable: boolean;
}

export type UserRole = 'Super Admin' | 'DNS Architect' | 'SecOps Auditor' | 'Read-only Viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  teamGroup: string;
  twoFactorEnabled: boolean;
  allowedDomains: string[] | 'ALL';
  lastActive: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  name: string;
  domainsCount: number;
  recordsCount: number;
  trigger: 'manual' | 'scheduled' | 'pre_update';
  sizeKb: number;
  records: DNSRecord[];
  domains: DomainZone[];
}

export interface GlobalNodeProbe {
  id: string;
  city: string;
  country: string;
  flag: string;
  nameserver: string;
  status: 'synced' | 'propagating' | 'failed';
  ipReturned: string;
  latencyMs: number;
  checkedAt: string;
}

export interface ApiToken {
  id: string;
  name: string;
  tokenPreview: string;
  fullToken?: string;
  role: 'read' | 'write' | 'admin';
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
}

export interface PushNotificationAlert {
  id: string;
  title: string;
  message: string;
  channel: 'telegram' | 'email' | 'webhook' | 'system';
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  domainName?: string;
}
