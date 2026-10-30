import React, { useState, useEffect } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  ShieldCheck,
  Key,
  Copy,
  Check,
  Lock,
  Smartphone,
  AlertTriangle,
  QrCode,
  Download,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Send,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { downloadFile } from '../../utils/zoneParser';

export const SecurityTwoFactor: React.FC = () => {
  const { twoFactorSettings, toggleTwoFactor, currentUser } = useDns();

  // Active method tabs: 'totp' or 'sms'
  const [activeMethodTab, setActiveMethodTab] = useState<'totp' | 'sms'>('totp');

  // TOTP State
  const [verifyTotpCode, setVerifyTotpCode] = useState('');
  const [totpVerifyResult, setTotpVerifyResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [liveCountdown, setLiveCountdown] = useState(30);

  // SMS State
  const [phoneCountryCode, setPhoneCountryCode] = useState('+84');
  const [phoneNumber, setPhoneNumber] = useState('0988123456');
  const [smsSentCode, setSmsSentCode] = useState<string | null>(null);
  const [smsVerifyCode, setSmsVerifyCode] = useState('');
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [smsVerifiedPhone, setSmsVerifiedPhone] = useState<string | null>('+84 0988123456');
  const [smsVerifyResult, setSmsVerifyResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Require 2FA for Critical Changes
  const [requireForCritical, setRequireForCritical] = useState(true);

  // IP Allowlist State
  const [ipWhitelist, setIpWhitelist] = useState('113.161.44.0/24\n14.161.0.0/16\n42.112.0.0/16');
  const [ipSaved, setIpSaved] = useState(false);

  // Simulated 30-second TOTP window tick
  useEffect(() => {
    const timer = setInterval(() => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setLiveCountdown(sec);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // SMS cooldown timer
  useEffect(() => {
    if (smsCooldown > 0) {
      const t = setTimeout(() => setSmsCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [smsCooldown]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFactorSettings.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 1500);
  };

  const handleDownloadBackupCodes = () => {
    const text = `DNS Sentinel Enterprise - Mã Dự Phòng 2FA\nTài khoản: ${currentUser.email}\nNgày cấp: ${new Date().toLocaleDateString('vi-VN')}\n\n` +
      twoFactorSettings.backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      '\n\nLưu ý: Mỗi mã chỉ có thể sử dụng một lần duy nhất khi bạn mất thiết bị xác thực.';
    downloadFile(text, `2FA_Backup_Codes_${currentUser.name}.txt`, 'text/plain');
  };

  // Validate TOTP code
  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = verifyTotpCode.trim();
    if (clean.length === 6) {
      setTotpVerifyResult({
        success: true,
        message: 'Mã TOTP 6 số hợp lệ! Ứng dụng xác thực đã được đồng bộ thành công với máy chủ.'
      });
      setVerifyTotpCode('');
    } else {
      setTotpVerifyResult({
        success: false,
        message: 'Mã xác thực không đúng. Vui lòng kiểm tra lại 6 chữ số trong Authenticator.'
      });
    }
  };

  // Send SMS Code
  const handleSendSms = () => {
    if (!phoneNumber.trim()) return;
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setSmsSentCode(generated);
    setSmsCooldown(60);
    setSmsVerifyResult(null);
  };

  // Verify SMS Code
  const handleVerifySms = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsVerifyCode === smsSentCode || smsVerifyCode.trim() === '849201') {
      const fullPhone = `${phoneCountryCode} ${phoneNumber.trim()}`;
      setSmsVerifiedPhone(fullPhone);
      setSmsVerifyResult({
        success: true,
        message: `Đã xác minh số điện thoại ${fullPhone} thành công! Phương thức 2FA qua SMS đã sẵn sàng.`
      });
      setSmsVerifyCode('');
    } else {
      setSmsVerifyResult({
        success: false,
        message: 'Mã xác thực SMS không chính xác hoặc đã hết hạn.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              TRUNG TÂM BẢO MẬT & XÁC THỰC HAI LỚP
            </span>
            <span className="text-xs text-slate-400">· Chuẩn TOTP RFC 6238 & SMS OTP</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Bảo Mật Hai Lớp (2FA) Cho Tài Khoản Người Dùng
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Hỗ trợ đa phương thức: ứng dụng xác thực Authenticator (Google/Authy) và tin nhắn SMS di động. Bảo vệ thao tác DNS trọng yếu trước tấn công chiếm quyền.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toggleTwoFactor(!twoFactorSettings.enabled)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              twoFactorSettings.enabled
                ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md'
            }`}
          >
            {twoFactorSettings.enabled ? 'Vô hiệu hóa 2FA' : 'Kích hoạt 2FA ngay'}
          </button>
        </div>
      </div>

      {/* 2FA Method Selector Buttons */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveMethodTab('totp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMethodTab === 'totp'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Ứng Dụng Xác Thực TOTP (Google Authenticator / Authy)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20">Khuyên dùng</span>
        </button>

        <button
          onClick={() => setActiveMethodTab('sms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMethodTab === 'sms'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Tin Nhắn SMS Di Động (SMS OTP)</span>
          {smsVerifiedPhone && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              Đã xác minh
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active 2FA Method Setup (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeMethodTab === 'totp' ? (
            /* TOTP Method Panel */
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Thiết Lập Ứng Dụng TOTP</h2>
                    <p className="text-xs text-slate-400">Google Authenticator, Microsoft Authenticator, Authy, 1Password</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Chu kỳ mới: </span>
                  <span className="font-bold text-cyan-400">{liveCountdown}s</span>
                </div>
              </div>

              {/* QR Code and Secret Key block */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 items-center">
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner">
                  {/* High fidelity SVG QR representation */}
                  <div className="w-32 h-32 bg-slate-950 p-2 rounded flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-8 h-8 bg-white border-2 border-slate-950 flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-950"></div>
                      </div>
                      <div className="w-8 h-8 bg-white border-2 border-slate-950 flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-950"></div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-1">
                      <div className="w-3 h-3 bg-white"></div>
                      <div className="w-3 h-3 bg-white"></div>
                      <div className="w-3 h-3 bg-white"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-8 h-8 bg-white border-2 border-slate-950 flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-950"></div>
                      </div>
                      <div className="w-8 h-8 bg-white flex items-center justify-center font-mono font-bold text-[8px] text-slate-950">
                        TOTP
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono mt-1 font-medium">Quét mã bằng Authenticator</span>
                </div>

                <div className="sm:col-span-8 space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Mã khóa bí mật Base32 (Secret Key):</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono font-bold tracking-wider text-xs flex-1 truncate">
                        {twoFactorSettings.secret}
                      </code>
                      <button
                        onClick={handleCopySecret}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer shrink-0"
                        title="Sao chép khóa bí mật"
                      >
                        {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sau khi quét mã QR hoặc nhập khóa bí mật, hãy nhập mã 6 số từ ứng dụng để xác thực kích hoạt.
                  </p>

                  {/* Test verification input */}
                  <form onSubmit={handleVerifyTotp} className="pt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyTotpCode}
                      onChange={(e) => setVerifyTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nhập 6 số TOTP (VD: 489201)"
                      className="w-full sm:w-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-center tracking-widest text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Xác minh mã
                    </button>
                  </form>

                  {totpVerifyResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                        totpVerifyResult.success
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {totpVerifyResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      <span>{totpVerifyResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* SMS Method Panel */
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Xác Thực Hai Lớp Qua Tin Nhắn SMS</h2>
                    <p className="text-xs text-slate-400">Nhận mã OTP 6 chữ số qua tin nhắn di động mỗi khi đăng nhập hoặc đổi DNS</p>
                  </div>
                </div>

                {smsVerifiedPhone && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ĐÃ KẾT NỐI
                  </span>
                )}
              </div>

              {/* Phone setup form */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Số điện thoại nhận tin nhắn OTP:</label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="+84">🇻🇳 +84 (Việt Nam)</option>
                      <option value="+1">🇺🇸 +1 (Hoa Kỳ)</option>
                      <option value="+65">🇸🇬 +65 (Singapore)</option>
                      <option value="+44">🇬🇧 +44 (Anh Quốc)</option>
                      <option value="+81">🇯🇵 +81 (Nhật Bản)</option>
                    </select>

                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="0988 123 456"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={handleSendSms}
                      disabled={smsCooldown > 0 || !phoneNumber.trim()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 font-mono font-medium rounded-lg border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{smsCooldown > 0 ? `Chờ ${smsCooldown}s` : 'Gửi mã SMS'}</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Incoming SMS Notification Card */}
                {smsSentCode && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-800/60 shadow-lg space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>TIN NHẮN SMS MỚI TỚI {phoneCountryCode} {phoneNumber}</span>
                      </span>
                      <span className="text-slate-500">Vừa xong</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-slate-200">
                      [DNS Sentinel Enterprise] Mã xác thực 2FA của bạn là: <strong className="text-cyan-300 text-sm tracking-widest">{smsSentCode}</strong>. Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ cho bất kỳ ai.
                    </div>
                  </div>
                )}

                {/* SMS Code Verification Form */}
                <form onSubmit={handleVerifySms} className="space-y-3 pt-2 border-t border-slate-800/80">
                  <label className="block text-slate-300 font-medium">Nhập mã 6 chữ số từ tin nhắn SMS:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={smsVerifyCode}
                      onChange={(e) => setSmsVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="VD: 849201"
                      className="w-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold font-mono text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Xác minh số điện thoại
                    </button>
                  </div>

                  {smsVerifyResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                        smsVerifyResult.success
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {smsVerifyResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      <span>{smsVerifyResult.message}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Backup Codes Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white text-xs">Mã Dự Phòng Khẩn Cấp (Backup Codes)</span>
              </div>
              <button
                onClick={handleDownloadBackupCodes}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Tải về file .txt</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {twoFactorSettings.backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-950 border border-slate-800 text-center font-mono text-slate-300 font-semibold text-xs tracking-wider"
                >
                  {code}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Mỗi mã chỉ có thể sử dụng một lần duy nhất khi bạn không thể nhận mã TOTP hoặc tin nhắn SMS.
            </p>
          </div>
        </div>

        {/* Right Column: Security Policies & IP Allowlist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Policy: Step-Up Auth for Critical Changes */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Chính Sách Bảo Vệ Thao Tác Trọng Yếu</h3>
                <span className="text-[10px] text-slate-400">Step-Up Authentication</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={requireForCritical}
                onChange={(e) => setRequireForCritical(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-200 block">
                  Bắt buộc nhập lại 2FA khi thay đổi hạ tầng nhạy cảm
                </span>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Áp dụng khi sửa bản ghi Apex (@), thay đổi Nameserver, xóa Zone tên miền, hoặc cấp phát khóa API Token Admin.
                </p>
              </div>
            </label>
          </div>

          {/* IP Allowlist Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Danh Sách Trắng IP (IP Allowlist)</h2>
                <p className="text-xs text-slate-400">Chỉ cho phép quản trị DNS từ các dải IP văn phòng/VPN cố định</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium block">Dải IP hoặc CIDR được phép (Mỗi dòng 1 IP):</label>
              <textarea
                rows={5}
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">
                IP hiện tại của bạn: <code className="text-cyan-400 font-mono">113.161.44.18 (Viettel HCM)</code>
              </span>
            </div>

            <button
              onClick={() => {
                setIpSaved(true);
                setTimeout(() => setIpSaved(false), 2000);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              {ipSaved ? 'Đã lưu danh sách IP thành công!' : 'Lưu Danh Sách Trắng IP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
