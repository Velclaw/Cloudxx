import { DomainZone, DNSRecord, RegistrarIntegration, AuditLogEntry, TeamMember, BackupSnapshot, NotificationSettings, GlobalNodeProbe, ApiToken, PushNotificationAlert, TwoFactorState, DashboardWidgetConfig } from '../types/dns';

export const initialDomains: DomainZone[] = [
  {
    id: 'dom-1',
    name: 'vnpay-core.vn',
    registrar: 'Cloudflare',
    status: 'active',
    autoRenew: true,
    expiresAt: '2027-11-15T00:00:00Z',
    nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
    dnssec: true,
    sslStatus: 'valid',
    sslExpiryDate: '2027-02-14T00:00:00Z',
    sslIssuer: "Let's Encrypt Authority X3",
    autoSslRenewal: true,
    recordCount: 14,
    qps: 4850,
    environment: 'production',
    createdAt: '2024-01-10T08:00:00Z',
    delegationSynced: true
  },
  {
    id: 'dom-2',
    name: 'cloudcore.tech',
    registrar: 'AWS Route 53',
    status: 'active',
    autoRenew: true,
    expiresAt: '2028-06-20T00:00:00Z',
    nameservers: ['ns-120.awsdns-15.com', 'ns-782.awsdns-33.net'],
    dnssec: true,
    sslStatus: 'valid',
    sslExpiryDate: '2027-04-10T00:00:00Z',
    sslIssuer: 'Amazon Trust Services',
    autoSslRenewal: true,
    recordCount: 8,
    qps: 1940,
    environment: 'production',
    createdAt: '2024-03-12T10:30:00Z',
    delegationSynced: true
  },
  {
    id: 'dom-3',
    name: 'payment-mesh.io',
    registrar: 'DigitalOcean',
    status: 'active',
    autoRenew: false,
    expiresAt: '2026-12-05T00:00:00Z',
    nameservers: ['ns1.digitalocean.com', 'ns2.digitalocean.com'],
    dnssec: false,
    sslStatus: 'expiring_soon',
    sslExpiryDate: '2026-11-08T00:00:00Z',
    sslIssuer: 'ZeroSSL Global TLS CA',
    autoSslRenewal: true,
    recordCount: 6,
    qps: 620,
    environment: 'staging',
    createdAt: '2024-08-01T14:15:00Z',
    delegationSynced: true
  },
  {
    id: 'dom-4',
    name: 'internal-ops.net',
    registrar: 'Google Cloud',
    status: 'active',
    autoRenew: true,
    expiresAt: '2027-09-30T00:00:00Z',
    nameservers: ['ns-cloud-a1.googledomains.com', 'ns-cloud-a2.googledomains.com'],
    dnssec: true,
    sslStatus: 'valid',
    sslExpiryDate: '2027-05-18T00:00:00Z',
    sslIssuer: 'Google Trust Services LLC',
    autoSslRenewal: true,
    recordCount: 9,
    qps: 180,
    environment: 'internal',
    createdAt: '2024-09-10T09:00:00Z',
    delegationSynced: true
  }
];

export const initialRecords: DNSRecord[] = [
  // vnpay-core.vn records
  {
    id: 'rec-1',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'A',
    name: '@',
    content: '104.21.52.88',
    ttl: 300,
    proxied: true,
    category: 'web',
    autoUpdateEnabled: true,
    autoUpdateKey: 'ddns-prod-apex-7f8a9b',
    status: 'active',
    lastUpdated: '2026-10-29T17:30:00Z',
    updatedBy: 'huynhthuong.xyz@gmail.com',
    comment: 'Apex production IP gateway with DDoS shield',
    sortOrder: 1
  },
  {
    id: 'rec-2',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'A',
    name: 'api',
    content: '198.51.100.24',
    ttl: 120,
    proxied: true,
    category: 'web',
    autoUpdateEnabled: true,
    autoUpdateKey: 'ddns-api-cluster-3d2e1c',
    status: 'active',
    lastUpdated: '2026-10-29T17:15:00Z',
    updatedBy: 'huynhthuong.xyz@gmail.com',
    comment: 'Kubernetes ingress controller for API gateway',
    sortOrder: 2
  },
  {
    id: 'rec-3',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'AAAA',
    name: 'api',
    content: '2606:4700:3033::6815:3458',
    ttl: 120,
    proxied: true,
    category: 'web',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-28T10:00:00Z',
    updatedBy: 'Alex Chen',
    comment: 'IPv6 endpoint for mobile transactions',
    sortOrder: 3
  },
  {
    id: 'rec-4',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'CNAME',
    name: 'www',
    content: 'vnpay-core.vn',
    ttl: 3600,
    proxied: true,
    category: 'web',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-20T08:00:00Z',
    updatedBy: 'Alex Chen',
    comment: 'Canonical alias to root domain',
    sortOrder: 4
  },
  {
    id: 'rec-5',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'MX',
    name: '@',
    content: 'aspmx.l.google.com',
    priority: 1,
    ttl: 3600,
    proxied: false,
    category: 'mail',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-15T09:00:00Z',
    updatedBy: 'Sarah Lin',
    comment: 'Primary Google Workspace MX gateway',
    sortOrder: 5
  },
  {
    id: 'rec-6',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'MX',
    name: '@',
    content: 'alt1.aspmx.l.google.com',
    priority: 5,
    ttl: 3600,
    proxied: false,
    category: 'mail',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-15T09:00:00Z',
    updatedBy: 'Sarah Lin',
    comment: 'Secondary failover mail server',
    sortOrder: 6
  },
  {
    id: 'rec-7',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'TXT',
    name: '@',
    content: 'v=spf1 include:_spf.google.com ip4:198.51.100.0/24 ~all',
    ttl: 3600,
    proxied: false,
    category: 'security',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-25T14:20:00Z',
    updatedBy: 'Sarah Lin',
    comment: 'SPF email sender authentication policy',
    sortOrder: 7
  },
  {
    id: 'rec-8',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'TXT',
    name: '_dmarc',
    content: 'v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc-reports@vnpay-core.vn',
    ttl: 3600,
    proxied: false,
    category: 'security',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-25T14:30:00Z',
    updatedBy: 'Sarah Lin',
    comment: 'Strict DMARC protection against domain spoofing',
    sortOrder: 8
  },
  {
    id: 'rec-9',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'CAA',
    name: '@',
    content: '0 issue "letsencrypt.org"',
    ttl: 86400,
    proxied: false,
    category: 'security',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-10T12:00:00Z',
    updatedBy: 'huynhthuong.xyz@gmail.com',
    comment: 'Restrict TLS issuance to Let\'s Encrypt CA',
    sortOrder: 9
  },
  {
    id: 'rec-10',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'SRV',
    name: '_sip._tcp',
    content: 'sip-proxy.vnpay-core.vn',
    priority: 10,
    weight: 60,
    port: 5060,
    ttl: 3600,
    proxied: false,
    category: 'internal',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-12T16:00:00Z',
    updatedBy: 'Alex Chen',
    comment: 'Voice SIP trunk server discovery',
    sortOrder: 10
  },
  {
    id: 'rec-11',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'CNAME',
    name: 'cdn-static',
    content: 'd28g49h2km0z.cloudfront.net',
    ttl: 300,
    proxied: true,
    category: 'cdn',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-18T11:45:00Z',
    updatedBy: 'Alex Chen',
    comment: 'Edge assets storage distribution',
    sortOrder: 11
  },
  {
    id: 'rec-12',
    domainId: 'dom-1',
    domainName: 'vnpay-core.vn',
    type: 'A',
    name: 'db-replica-01',
    content: '10.240.12.99',
    ttl: 60,
    proxied: false,
    category: 'database',
    autoUpdateEnabled: true,
    autoUpdateKey: 'ddns-db-rep1-98ac41',
    status: 'active',
    lastUpdated: '2026-10-29T16:00:00Z',
    updatedBy: 'David Nguyen',
    comment: 'Private VPC internal database endpoint',
    sortOrder: 12
  },

  // cloudcore.tech records
  {
    id: 'rec-13',
    domainId: 'dom-2',
    domainName: 'cloudcore.tech',
    type: 'A',
    name: '@',
    content: '52.76.192.14',
    ttl: 300,
    proxied: false,
    category: 'web',
    autoUpdateEnabled: true,
    autoUpdateKey: 'ddns-cloudcore-apex-228f',
    status: 'active',
    lastUpdated: '2026-10-27T10:12:00Z',
    updatedBy: 'Alex Chen',
    comment: 'AWS ALB primary listener',
    sortOrder: 1
  },
  {
    id: 'rec-14',
    domainId: 'dom-2',
    domainName: 'cloudcore.tech',
    type: 'CNAME',
    name: 'app',
    content: 'cloudcore-frontend.s3-website-ap-southeast-1.amazonaws.com',
    ttl: 300,
    proxied: false,
    category: 'web',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-10-27T10:15:00Z',
    updatedBy: 'Alex Chen',
    comment: 'CloudFront origin S3 hosting',
    sortOrder: 2
  },
  {
    id: 'rec-15',
    domainId: 'dom-2',
    domainName: 'cloudcore.tech',
    type: 'TXT',
    name: 'google-site-verification',
    content: 'google-site-verification=AbCdEf1234567890XyZ_EnterpriseToken',
    ttl: 86400,
    proxied: false,
    category: 'security',
    autoUpdateEnabled: false,
    status: 'active',
    lastUpdated: '2026-09-12T14:00:00Z',
    updatedBy: 'Sarah Lin',
    comment: 'Google Search Console and OAuth verification',
    sortOrder: 3
  },

  // payment-mesh.io records
  {
    id: 'rec-16',
    domainId: 'dom-3',
    domainName: 'payment-mesh.io',
    type: 'A',
    name: 'staging-api',
    content: '167.99.64.120',
    ttl: 120,
    proxied: false,
    category: 'web',
    autoUpdateEnabled: true,
    autoUpdateKey: 'ddns-pmesh-stg-881a',
    status: 'active',
    lastUpdated: '2026-10-29T15:20:00Z',
    updatedBy: 'David Nguyen',
    comment: 'Staging environment API gateway',
    sortOrder: 1
  }
];

export const initialRegistrars: RegistrarIntegration[] = [
  {
    id: 'reg-1',
    provider: 'Cloudflare',
    name: 'Cloudflare Enterprise API',
    apiKey: 'cf_api_tok_9918237469123847192837482',
    accountEmail: 'admin@vnpay-core.vn',
    status: 'connected',
    lastSynced: '2026-10-29T17:55:00Z',
    domainsCount: 2,
    autoSyncIntervalMinutes: 15
  },
  {
    id: 'reg-2',
    provider: 'AWS Route 53',
    name: 'AWS Route 53 IAM Role',
    apiKey: 'AKIAIOSFODNN7EXAMPLE',
    apiSecret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    accountEmail: 'aws-ops@cloudcore.tech',
    status: 'connected',
    lastSynced: '2026-10-29T17:40:00Z',
    domainsCount: 1,
    autoSyncIntervalMinutes: 30
  },
  {
    id: 'reg-3',
    provider: 'DigitalOcean',
    name: 'DigitalOcean DNS Token',
    apiKey: 'dop_v1_08912389147812937812938172938719283719283',
    accountEmail: 'infra@payment-mesh.io',
    status: 'connected',
    lastSynced: '2026-10-29T16:10:00Z',
    domainsCount: 1,
    autoSyncIntervalMinutes: 60
  },
  {
    id: 'reg-4',
    provider: 'Google Cloud',
    name: 'GCP Cloud DNS Service Account',
    apiKey: 'gcp-sa-dns-master@internal-ops.iam.gserviceaccount.com',
    status: 'connected',
    lastSynced: '2026-10-29T15:00:00Z',
    domainsCount: 1,
    autoSyncIntervalMinutes: 60
  },
  {
    id: 'reg-5',
    provider: 'Namecheap',
    name: 'Namecheap Whitelisted API',
    apiKey: 'nc_api_whitelisted_key_554109',
    accountEmail: 'domains@vnpay-core.vn',
    status: 'disconnected',
    lastSynced: '2026-10-28T09:00:00Z',
    domainsCount: 0,
    autoSyncIntervalMinutes: 120
  },
  {
    id: 'reg-6',
    provider: 'GoDaddy',
    name: 'GoDaddy Developer Key',
    apiKey: 'sso-key_471928374918274_prod',
    status: 'disconnected',
    lastSynced: '2026-10-25T11:00:00Z',
    domainsCount: 0,
    autoSyncIntervalMinutes: 120
  }
];

export const initialNotificationSettings: NotificationSettings = {
  telegram: {
    enabled: true,
    botToken: 'bot7182938471:AAH8-9YyZ1234567890abcdef',
    chatId: '-1001829471920', // Enterprise SRE Ops Group
    alertCriticalDnsChanges: true,
    alertDomainExpiration: true,
    alertSystemEvents: true,
    alertSslCertificates: true,
    alertDdnsFailover: true,
    severityThreshold: 'all',
    lastSentAlert: '2026-10-29T17:30:10Z'
  },
  email: {
    enabled: true,
    recipients: ['huynhthuong.xyz@gmail.com', 'noc-alerts@vnpay-core.vn', 'security-team@vnpay-core.vn'],
    smtpServer: 'smtp.sendgrid.net:587',
    senderEmail: 'dns-sentinel@vnpay-core.vn',
    alertCriticalDnsChanges: true,
    alertDomainExpiration: true,
    alertSystemEvents: true,
    alertSslCertificates: true,
    alertDdnsFailover: true,
    digestFrequency: 'immediate',
    severityThreshold: 'all'
  },
  webhook: {
    enabled: true,
    endpointUrl: 'https://api.vnpay-core.vn/webhooks/dns-events',
    secretToken: 'whsec_enterprise_dns_sentinel_hmac_sha256',
    events: ['record.created', 'record.updated', 'record.deleted', 'ssl.expiring', 'ddns.triggered']
  }
};

export const initialTwoFactorState: TwoFactorState = {
  enabled: true,
  activeMethod: 'totp',
  totpSecret: 'JBSWY3DPEHPK3PXP',
  phoneNumber: '0988123456',
  phoneCountryCode: '+84',
  backupCodes: ['4819-2041', '9912-3814', '7721-0943', '1284-9042', '5519-8231', '3349-1102'],
  requireForCriticalChanges: true
};

export const defaultDashboardWidgets: DashboardWidgetConfig[] = [
  { id: 'metrics', title: 'Chỉ số hạ tầng tổng quan', visible: true, order: 1 },
  { id: 'active_alerts', title: 'Cảnh báo hệ thống thời gian thực', visible: true, order: 2 },
  { id: 'traffic_chart', title: 'Biểu đồ phân giải QPS & Độ trễ', visible: true, order: 3 },
  { id: 'propagation_prober', title: 'Kiểm tra lan truyền Anycast 8 điểm', visible: true, order: 4 },
  { id: 'zones_health', title: 'Trạng thái vùng tên miền DNS', visible: true, order: 5 },
  { id: 'recent_changes', title: 'Biến động bản ghi gần nhất', visible: true, order: 6 },
  { id: 'security_status', title: 'Bảo mật 2FA & Trạng thái DNSSEC', visible: true, order: 7 }
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-29T17:30:00Z',
    actor: {
      name: 'Huỳnh Thưởng',
      email: 'huynhthuong.xyz@gmail.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
    },
    ipAddress: '113.161.44.18 (Viettel HCM)',
    action: 'UPDATE_RECORD',
    domainName: 'vnpay-core.vn',
    recordName: '@',
    recordType: 'A',
    details: 'Cập nhật IP Gateway Apex từ 104.21.52.80 sang 104.21.52.88 (Bật DDNS Auto-updater)',
    diff: {
      before: { content: '104.21.52.80', autoUpdateEnabled: false },
      after: { content: '104.21.52.88', autoUpdateEnabled: true }
    },
    rollbackable: true
  },
  {
    id: 'log-2',
    timestamp: '2026-10-29T17:15:00Z',
    actor: {
      name: 'Huỳnh Thưởng',
      email: 'huynhthuong.xyz@gmail.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
    },
    ipAddress: '113.161.44.18 (Viettel HCM)',
    action: 'DDNS_AUTO_UPDATE',
    domainName: 'vnpay-core.vn',
    recordName: 'api',
    recordType: 'A',
    details: 'DDNS Agent tự động cập nhật IP failover cụm API Kubernetes Ingress',
    diff: {
      before: { content: '198.51.100.20' },
      after: { content: '198.51.100.24' }
    },
    rollbackable: true
  },
  {
    id: 'log-3',
    timestamp: '2026-10-29T16:50:00Z',
    actor: {
      name: 'Alex Chen',
      email: 'alex.chen@vnpay-core.vn',
      role: 'DNS Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    ipAddress: '14.161.22.9 (FPT Telecom)',
    action: 'REGISTRAR_SYNC',
    domainName: 'vnpay-core.vn',
    details: 'Đồng bộ tự động thông tin Zone từ Cloudflare API (14 bản ghi)',
    rollbackable: false
  },
  {
    id: 'log-4',
    timestamp: '2026-10-29T15:20:00Z',
    actor: {
      name: 'David Nguyen',
      email: 'david.n@vnpay-core.vn',
      role: 'Read-only Viewer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
    },
    ipAddress: '42.112.33.102 (VNPT)',
    action: 'CREATE_RECORD',
    domainName: 'payment-mesh.io',
    recordName: 'staging-api',
    recordType: 'A',
    details: 'Khởi tạo bản ghi staging API trỏ về DigitalOcean Droplet 167.99.64.120',
    diff: {
      after: { name: 'staging-api', type: 'A', content: '167.99.64.120', ttl: 120 }
    },
    rollbackable: true
  },
  {
    id: 'log-5',
    timestamp: '2026-10-29T14:10:00Z',
    actor: {
      name: 'Sarah Lin',
      email: 'sarah.lin@vnpay-core.vn',
      role: 'SecOps Auditor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
    },
    ipAddress: '27.72.60.15 (Viettel HN)',
    action: 'SSL_RENEWED',
    domainName: 'vnpay-core.vn',
    details: 'ACME Let\'s Encrypt tự động cấp lại chứng chỉ SSL Wildcard *.vnpay-core.vn',
    rollbackable: false
  },
  {
    id: 'log-6',
    timestamp: '2026-10-29T12:00:00Z',
    actor: {
      name: 'Huỳnh Thưởng',
      email: 'huynhthuong.xyz@gmail.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
    },
    ipAddress: '113.161.44.18 (Viettel HCM)',
    action: '2FA_ENABLED',
    domainName: 'Global System',
    details: 'Kích hoạt xác thực 2 bước phần cứng TOTP và cấp 8 mã dự phòng',
    rollbackable: false
  }
];

export const initialTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Huỳnh Thưởng',
    email: 'huynhthuong.xyz@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    role: 'Super Admin',
    teamGroup: 'Core Infrastructure',
    twoFactorEnabled: true,
    allowedDomains: 'ALL',
    lastActive: 'Đang hoạt động (Hiện tại)',
    status: 'active'
  },
  {
    id: 'user-2',
    name: 'Alex Chen',
    email: 'alex.chen@vnpay-core.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: 'DNS Architect',
    teamGroup: 'DevOps & SRE',
    twoFactorEnabled: true,
    allowedDomains: ['vnpay-core.vn', 'cloudcore.tech'],
    lastActive: '12 phút trước',
    status: 'active'
  },
  {
    id: 'user-3',
    name: 'Sarah Lin',
    email: 'sarah.lin@vnpay-core.vn',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    role: 'SecOps Auditor',
    teamGroup: 'Security Operations',
    twoFactorEnabled: true,
    allowedDomains: 'ALL',
    lastActive: '45 phút trước',
    status: 'active'
  },
  {
    id: 'user-4',
    name: 'David Nguyen',
    email: 'david.n@vnpay-core.vn',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    role: 'Read-only Viewer',
    teamGroup: 'QA & Staging',
    twoFactorEnabled: false,
    allowedDomains: ['payment-mesh.io'],
    lastActive: '2 giờ trước',
    status: 'active'
  }
];

export const initialBackups: BackupSnapshot[] = [
  {
    id: 'snap-1',
    timestamp: '2026-10-29T16:00:00Z',
    name: 'Tự động sao lưu định kỳ (Hàng ngày)',
    domainsCount: 4,
    recordsCount: 16,
    trigger: 'scheduled',
    sizeKb: 48,
    records: initialRecords,
    domains: initialDomains
  },
  {
    id: 'snap-2',
    timestamp: '2026-10-28T18:00:00Z',
    name: 'Trước đợt chuyển đổi DNSSEC & Registrar Cloudflare',
    domainsCount: 4,
    recordsCount: 15,
    trigger: 'pre_update',
    sizeKb: 45,
    records: initialRecords,
    domains: initialDomains
  },
  {
    id: 'snap-3',
    timestamp: '2026-10-25T09:00:00Z',
    name: 'Bản lưu trữ mốc kết thúc Sprint Q4',
    domainsCount: 3,
    recordsCount: 14,
    trigger: 'manual',
    sizeKb: 42,
    records: initialRecords,
    domains: initialDomains
  }
];

export const initialGlobalNodes: GlobalNodeProbe[] = [
  {
    id: 'node-1',
    city: 'Tokyo',
    country: 'Nhật Bản',
    flag: '🇯🇵',
    nameserver: '1.1.1.1 (Cloudflare Edge NRT)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 14,
    checkedAt: 'Vừa xong'
  },
  {
    id: 'node-2',
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    nameserver: '8.8.8.8 (Google Public SIN)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 8,
    checkedAt: 'Vừa xong'
  },
  {
    id: 'node-3',
    city: 'Frankfurt',
    country: 'Đức',
    flag: '🇩🇪',
    nameserver: '9.9.9.9 (Quad9 FRA)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 72,
    checkedAt: 'Vừa xong'
  },
  {
    id: 'node-4',
    city: 'San Jose',
    country: 'Hoa Kỳ',
    flag: '🇺🇸',
    nameserver: '208.67.222.222 (OpenDNS SJC)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 110,
    checkedAt: 'Vừa xong'
  },
  {
    id: 'node-5',
    city: 'London',
    country: 'Anh Quốc',
    flag: '🇬🇧',
    nameserver: '1.0.0.1 (Cloudflare LHR)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 84,
    checkedAt: 'Vừa xong'
  },
  {
    id: 'node-6',
    city: 'Sydney',
    country: 'Úc',
    flag: '🇦🇺',
    nameserver: '8.8.4.4 (Google Public SYD)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 98,
    checkedAt: 'Vừa xong'
  },
  {
    id: 'node-7',
    city: 'São Paulo',
    country: 'Brazil',
    flag: '🇧🇷',
    nameserver: '1.1.1.1 (Cloudflare Anycast GRU)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 145,
    checkedAt: 'Vừa xong'
  },
  {
    id: 'node-8',
    city: 'Mumbai',
    country: 'Ấn Độ',
    flag: '🇮🇳',
    nameserver: '9.9.9.9 (Quad9 BOM)',
    status: 'synced',
    ipReturned: '104.21.52.88',
    latencyMs: 42,
    checkedAt: 'Vừa xong'
  }
];

export const initialApiTokens: ApiToken[] = [
  {
    id: 'tok-1',
    name: 'CI/CD GitHub Actions Deploy Token',
    tokenPreview: 'dns_live_sec_****_99b2',
    role: 'write',
    createdAt: '2026-09-01T10:00:00Z',
    expiresAt: '2027-09-01T10:00:00Z',
    lastUsedAt: '15 phút trước'
  },
  {
    id: 'tok-2',
    name: 'DDNS Gateway Failover Agent',
    tokenPreview: 'dns_live_ddns_****_44c1',
    role: 'admin',
    createdAt: '2026-10-10T14:30:00Z',
    expiresAt: '2028-10-10T14:30:00Z',
    lastUsedAt: '2 phút trước'
  },
  {
    id: 'tok-3',
    name: 'Grafana & Prometheus DNS Metrics Exporter',
    tokenPreview: 'dns_live_read_****_11a8',
    role: 'read',
    createdAt: '2026-08-15T09:00:00Z',
    expiresAt: '2027-08-15T09:00:00Z',
    lastUsedAt: 'Vừa xong'
  }
];

export const initialPushAlerts: PushNotificationAlert[] = [
  {
    id: 'alt-1',
    title: 'Bản ghi DNS được cập nhật',
    message: 'Bản ghi @ (A) trên vnpay-core.vn được chuyển hướng tới 104.21.52.88',
    channel: 'telegram',
    type: 'info',
    timestamp: '17:30 - Hôm nay',
    read: false,
    domainName: 'vnpay-core.vn'
  },
  {
    id: 'alt-2',
    title: 'Cảnh báo gia hạn chứng chỉ SSL',
    message: 'Chứng chỉ SSL của payment-mesh.io sẽ hết hạn trong 10 ngày tới. Chế độ Auto-renewal đang chờ DNS-01 challenge.',
    channel: 'email',
    type: 'warning',
    timestamp: '15:10 - Hôm nay',
    read: false,
    domainName: 'payment-mesh.io'
  },
  {
    id: 'alt-3',
    title: 'Đồng bộ hóa Registrar hoàn tất',
    message: 'API Cloudflare đã đồng bộ thành công 14 bản ghi DNS cho vnpay-core.vn',
    channel: 'telegram',
    type: 'success',
    timestamp: '14:00 - Hôm nay',
    read: true,
    domainName: 'vnpay-core.vn'
  }
];
