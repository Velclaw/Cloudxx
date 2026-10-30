export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    appName: 'Cloudxx',
    appTagline: 'Quản lý DNS & tên miền',
    
    // Nav items
    navDashboard: 'Tổng quan',
    navRecords: 'Bản ghi DNS',
    navDomains: 'Tên miền & SSL',
    navRegistrars: 'Nhà đăng ký API',
    navNotifications: 'Thông báo Telegram/Email',
    navAudit: 'Nhật ký kiểm toán',
    navTeam: 'Phân quyền & Nhóm',
    navReports: 'Báo cáo & Xuất dữ liệu',
    navBackup: 'Sao lưu & Phục hồi',
    navApi: 'Nhà phát triển API',
    
    // Status badges
    statusActive: 'Hoạt động',
    statusPropagating: 'Đang lan truyền',
    statusPaused: 'Tạm dừng',
    statusError: 'Lỗi',
    statusValid: 'Hợp lệ',
    statusExpiringSoon: 'Sắp hết hạn',
    statusExpired: 'Đã hết hạn',
    statusProvisioning: 'Đang cấp phát',
    
    // General
    search: 'Tìm kiếm nhanh...',
    filter: 'Bộ lọc',
    all: 'Tất cả',
    export: 'Xuất dữ liệu',
    addRecord: 'Thêm bản ghi',
    addDomain: 'Thêm tên miền',
    save: 'Lưu thay đổi',
    cancel: 'Hủy bỏ',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    rollback: 'Khôi phục (Rollback)',
    refresh: 'Làm mới',
    syncNow: 'Đồng bộ ngay',
    connected: 'Đã kết nối',
    disconnected: 'Chưa kết nối',
    
    // Categories
    catWeb: 'Web & Ứng dụng',
    catMail: 'Email & Định tuyến',
    catSecurity: 'Bảo mật & Xác thực',
    catInternal: 'Nội bộ & VPN',
    catCdn: 'CDN & Proxy',
    catDatabase: 'Cơ sở dữ liệu',
    
    // Metrics
    totalDomains: 'Tổng tên miền',
    activeRecords: 'Bản ghi hoạt động',
    propagationRate: 'Tỷ lệ lan truyền toàn cầu',
    qpsQueries: 'Truy vấn DNS / Giây',
    sslCertificates: 'Chứng chỉ SSL',
    activeAlerts: 'Cảnh báo thời gian thực',
    
    // Auto-update
    autoUpdate: 'DDNS Tự Động Cập Nhật',
    proxied: 'Bảo vệ Proxy (CDN)',
    
    // Notifications
    telegramBot: 'Telegram Bot Cảnh Báo',
    emailAlerts: 'Email Cảnh Báo',
    sendTestNotification: 'Gửi thông báo test',
    testSentSuccess: 'Đã gửi cảnh báo test thành công!',
    
    // Security
    twoFactor: 'Xác thực 2 yếu tố (2FA)',
    twoFactorEnabled: '2FA đã kích hoạt',
    twoFactorDisabled: 'Chưa bật 2FA',
    enable2FA: 'Kích hoạt 2FA',
    disable2FA: 'Vô hiệu hóa 2FA',
    
    // Cloud sync & offline
    cloudSync: 'Đồng bộ đám mây',
    synced: 'Đã đồng bộ thời gian thực',
    syncing: 'Đang đồng bộ...',
    offlineMode: 'Chế độ ngoại tuyến',
    offlineNotice: 'Bạn đang ở chế độ ngoại tuyến. Các thay đổi được lưu cục bộ và sẽ tự động đồng bộ khi kết nối lại.',
  },
  en: {
    appName: 'Cloudxx',
    appTagline: 'DNS & domain management',
    
    // Nav items
    navDashboard: 'Dashboard',
    navRecords: 'DNS Records',
    navDomains: 'Domains & SSL',
    navRegistrars: 'Registrar APIs',
    navNotifications: 'Telegram & Email Alerts',
    navAudit: 'Audit Logs',
    navTeam: 'RBAC & Teams',
    navReports: 'Reports & Export',
    navBackup: 'Backup & Restore',
    navApi: 'Developer API',
    
    // Status badges
    statusActive: 'Active',
    statusPropagating: 'Propagating',
    statusPaused: 'Paused',
    statusError: 'Error',
    statusValid: 'Valid',
    statusExpiringSoon: 'Expiring Soon',
    statusExpired: 'Expired',
    statusProvisioning: 'Provisioning',
    
    // General
    search: 'Quick search...',
    filter: 'Filter',
    all: 'All',
    export: 'Export Data',
    addRecord: 'Add Record',
    addDomain: 'Add Domain',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    rollback: 'Rollback',
    refresh: 'Refresh',
    syncNow: 'Sync Now',
    connected: 'Connected',
    disconnected: 'Disconnected',
    
    // Categories
    catWeb: 'Web & Apps',
    catMail: 'Mail & Routing',
    catSecurity: 'Security & Verification',
    catInternal: 'Internal & VPN',
    catCdn: 'CDN & Edge',
    catDatabase: 'Databases',
    
    // Metrics
    totalDomains: 'Total Domains',
    activeRecords: 'Active Records',
    propagationRate: 'Global Propagation',
    qpsQueries: 'DNS Queries / Sec',
    sslCertificates: 'SSL Certificates',
    activeAlerts: 'Real-time Alerts',
    
    // Auto-update
    autoUpdate: 'DDNS Auto-Updater',
    proxied: 'Proxy Protected (CDN)',
    
    // Notifications
    telegramBot: 'Telegram Bot Alert',
    emailAlerts: 'Email Alert Dispatch',
    sendTestNotification: 'Send Test Alert',
    testSentSuccess: 'Test alert sent successfully!',
    
    // Security
    twoFactor: 'Two-Factor Authentication (2FA)',
    twoFactorEnabled: '2FA Enabled',
    twoFactorDisabled: '2FA Disabled',
    enable2FA: 'Enable 2FA',
    disable2FA: 'Disable 2FA',
    
    // Cloud sync & offline
    cloudSync: 'Cloud Synchronization',
    synced: 'Real-time Synced',
    syncing: 'Syncing...',
    offlineMode: 'Offline Mode',
    offlineNotice: 'You are working offline. Changes are saved locally and will auto-sync upon reconnection.',
  }
};
