import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  Send,
  Mail,
  Webhook,
  CheckCircle2,
  Bell,
  Play,
  Shield,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export const NotificationSettingsView: React.FC = () => {
  const {
    notificationSettings,
    updateNotificationSettings,
    sendTestNotification,
    selectedDomain
  } = useDns();

  const [telegram, setTelegram] = useState(notificationSettings.telegram);
  const [email, setEmail] = useState(notificationSettings.email);
  const [webhook, setWebhook] = useState(notificationSettings.webhook);
  const [newEmailRecipient, setNewEmailRecipient] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettings({
      telegram,
      email,
      webhook
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddEmail = () => {
    if (!newEmailRecipient.trim() || !newEmailRecipient.includes('@')) return;
    if (!email.recipients.includes(newEmailRecipient.trim())) {
      setEmail(prev => ({ ...prev, recipients: [...prev.recipients, newEmailRecipient.trim()] }));
    }
    setNewEmailRecipient('');
  };

  const handleRemoveEmail = (recipient: string) => {
    setEmail(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== recipient)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              HỆ THỐNG THÔNG BÁO THỜI GIAN THỰC
            </span>
            <span className="text-xs text-slate-400">· Telegram Bot & Email Gateway</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Cấu Hình Cảnh Báo Tức Thời Qua Telegram & Email
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Nhận cảnh báo ngay lập tức khi bản ghi DNS bị can thiệp, IP WAN tự động chuyển đổi failover, hoặc chứng chỉ SSL chuẩn bị hết hạn.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã lưu cấu hình!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Telegram Bot Integration (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Telegram Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Telegram Bot Thông Báo</h2>
                  <p className="text-xs text-slate-400">Tích hợp trực tiếp vào kênh Chat Ops hoặc Group Telegram của bạn</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegram.enabled}
                  onChange={(e) => setTelegram(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bot Token (Từ @BotFather)</label>
                <input
                  type="text"
                  value={telegram.botToken}
                  onChange={(e) => setTelegram(prev => ({ ...prev, botToken: e.target.value }))}
                  placeholder="VD: bot7182938471:AAH8-9YyZ1234567890abcdef"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Chat ID hoặc Group ID</label>
                <input
                  type="text"
                  value={telegram.chatId}
                  onChange={(e) => setTelegram(prev => ({ ...prev, chatId: e.target.value }))}
                  placeholder="VD: -1001829471920 hoặc @your_channel"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Event Triggers */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Sự kiện kích hoạt gửi tin Telegram:
                </span>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="text-slate-300">Bản ghi DNS bị can thiệp (Critical DNS Changes)</span>
                  <input
                    type="checkbox"
                    checked={telegram.alertCriticalDnsChanges}
                    onChange={(e) => setTelegram(prev => ({ ...prev, alertCriticalDnsChanges: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="text-slate-300">Cảnh báo tên miền sắp hết hạn (Domain Expiration)</span>
                  <input
                    type="checkbox"
                    checked={telegram.alertDomainExpiration}
                    onChange={(e) => setTelegram(prev => ({ ...prev, alertDomainExpiration: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="text-slate-300">Cảnh báo chứng chỉ SSL sắp hết hạn (15 ngày trước)</span>
                  <input
                    type="checkbox"
                    checked={telegram.alertSslCertificates}
                    onChange={(e) => setTelegram(prev => ({ ...prev, alertSslCertificates: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="text-slate-300">DDNS Auto-Update phát hiện biến động IP WAN</span>
                  <input
                    type="checkbox"
                    checked={telegram.alertDdnsFailover}
                    onChange={(e) => setTelegram(prev => ({ ...prev, alertDdnsFailover: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <span className="text-slate-300">Sự kiện bảo mật hệ thống (2FA, Đổi vai trò, Vi phạm IP)</span>
                  <input
                    type="checkbox"
                    checked={telegram.alertSystemEvents}
                    onChange={(e) => setTelegram(prev => ({ ...prev, alertSystemEvents: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>
              </div>

              {/* Test button */}
              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => sendTestNotification('telegram')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi tin nhắn thử nghiệm</span>
                </button>
              </div>
            </div>
          </div>

          {/* Email Alert Configuration Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Email Cảnh Báo An Ninh</h2>
                  <p className="text-xs text-slate-400">Gửi email thông báo tới đội ngũ SRE & Quản trị viên</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={email.enabled}
                  onChange={(e) => setEmail(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Danh sách người nhận thông báo</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmailRecipient}
                    onChange={(e) => setNewEmailRecipient(e.target.value)}
                    placeholder="VD: devops@company.vn"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-mono text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>

                {/* Recipients pills */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {email.recipients.map((rec) => (
                    <span
                      key={rec}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]"
                    >
                      <span>{rec}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(rec)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Máy chủ SMTP Dispatcher</label>
                  <input
                    type="text"
                    value={email.smtpServer}
                    onChange={(e) => setEmail(prev => ({ ...prev, smtpServer: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tần suất gửi</label>
                  <select
                    value={email.digestFrequency}
                    onChange={(e) => setEmail(prev => ({ ...prev, digestFrequency: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
                  >
                    <option value="immediate">Gửi ngay tức thì (Khuyên dùng)</option>
                    <option value="daily">Tổng hợp hàng ngày</option>
                    <option value="weekly">Báo cáo hàng tuần</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => sendTestNotification('email')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Gửi email kiểm tra</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telegram Simulation Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Giao Diện Tin Nhắn Telegram Thực Tế</span>
            </h2>
            <p className="text-xs text-slate-400">
              Mô phỏng tin nhắn bot tự động định dạng Markdown và gửi vào nhóm quản trị
            </p>

            {/* Telegram simulated card */}
            <div className="p-4 rounded-xl bg-[#17212b] border border-[#2b5278] text-white text-xs font-sans space-y-2 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#242f3d]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center font-bold text-[10px]">
                    DS
                  </div>
                  <span className="font-bold text-sky-300">DNS Sentinel Bot</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">17:30</span>
              </div>

              <div className="space-y-1.5 text-slate-200 text-[11px] leading-relaxed">
                <p className="font-bold text-emerald-400">🚨 [DNS_RECORD_UPDATED]</p>
                <p>
                  <span className="text-slate-400">Tên miền: </span>
                  <span className="font-mono text-white">vnpay-core.vn</span>
                </p>
                <p>
                  <span className="text-slate-400">Bản ghi: </span>
                  <span className="font-mono text-cyan-300">@ (A)</span>
                </p>
                <p>
                  <span className="text-slate-400">IP Cũ: </span>
                  <span className="font-mono text-rose-300 line-through">104.21.52.80</span>
                </p>
                <p>
                  <span className="text-slate-400">IP Mới: </span>
                  <span className="font-mono text-emerald-300">104.21.52.88</span>
                </p>
                <p>
                  <span className="text-slate-400">Tác vụ bởi: </span>
                  <span className="font-mono text-slate-300">huynhthuong.xyz@gmail.com</span>
                </p>
                <p>
                  <span className="text-slate-400">IP Người gửi: </span>
                  <span className="font-mono text-slate-400">113.161.44.18 (Viettel HCM)</span>
                </p>
                <div className="pt-2 text-[10px] text-slate-400 border-t border-[#242f3d] flex justify-between">
                  <span>Trạng thái lan truyền: 100%</span>
                  <span className="text-sky-300">#audit_log_1730</span>
                </div>
              </div>
            </div>

            {/* Webhook Endpoint option */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tùy chỉnh Webhook API bên thứ 3</span>
              </span>
              <input
                type="text"
                value={webhook.endpointUrl}
                onChange={(e) => setWebhook(prev => ({ ...prev, endpointUrl: e.target.value }))}
                placeholder="https://your-api.com/webhooks/dns"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-500 block">
                Tự động gửi Payload JSON với chữ ký HMAC-SHA256 khi có sự kiện.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
            >
              Lưu Toàn Bộ Cấu Hình Cảnh Báo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
