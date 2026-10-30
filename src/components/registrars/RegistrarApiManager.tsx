import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import { RegistrarIntegration, RegistrarProvider } from '../../types/dns';
import {
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Shield,
  Layers,
  ExternalLink,
  Edit2,
  Save,
  X
} from 'lucide-react';

export const RegistrarApiManager: React.FC = () => {
  const { registrars, syncRegistrar, updateRegistrarApiKey, syncStatus } = useDns();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleStartEdit = (reg: RegistrarIntegration) => {
    setEditingId(reg.id);
    setApiKeyInput(reg.apiKey);
    setApiSecretInput(reg.apiSecret || '');
  };

  const handleSaveEdit = (regId: string) => {
    updateRegistrarApiKey(regId, apiKeyInput, apiSecretInput || undefined);
    setEditingId(null);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              TÍCH HỢP NHÀ ĐĂNG KÝ TÊN MIỀN
            </span>
            <span className="text-xs text-slate-400">· REST API & IAM Sync</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Kết Nối API Nhà Đăng Ký Phổ Biến
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Tự động phát hiện và đồng bộ hóa bản ghi DNS trực tiếp từ Cloudflare, AWS Route 53, Namecheap, GoDaddy, DigitalOcean và Google Cloud DNS.
          </p>
        </div>
      </div>

      {/* Registrar Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registrars.map((reg) => {
          const isEditing = editingId === reg.id;
          const isKeyVisible = showKeys[reg.id];

          return (
            <div
              key={reg.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>{reg.provider}</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{reg.name}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      reg.status === 'connected'
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50'
                        : 'text-slate-400 bg-slate-800/60 border border-slate-700'
                    }`}
                  >
                    {reg.status === 'connected' ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Đã kết nối</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Chưa kết nối</span>
                      </>
                    )}
                  </span>
                </div>

                {/* API Key Form or Display */}
                {isEditing ? (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs my-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">API Key / Token:</label>
                      <input
                        type="text"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    {reg.provider === 'AWS Route 53' && (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">IAM Secret Key:</label>
                        <input
                          type="password"
                          value={apiSecretInput}
                          onChange={(e) => setApiSecretInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleSaveEdit(reg.id)}
                        className="px-2.5 py-1 text-[11px] bg-cyan-500 text-slate-950 font-bold rounded flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Lưu Key
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs space-y-1.5 my-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        Khóa Xác Thực API:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleShowKey(reg.id)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                          title={isKeyVisible ? 'Ẩn khóa' : 'Hiện khóa'}
                        >
                          {isKeyVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleStartEdit(reg)}
                          className="p-1 text-slate-400 hover:text-cyan-400"
                          title="Cấu hình lại API Key"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-slate-300 text-[11px] truncate">
                      {isKeyVisible
                        ? reg.apiKey
                        : reg.apiKey
                        ? `${reg.apiKey.slice(0, 10)}****************`
                        : '(Chưa cấu hình API Key)'}
                    </div>
                    {reg.accountEmail && (
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        Tài khoản: {reg.accountEmail}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Tên miền đang quản lý:</span>
                    <span className="text-slate-200 font-bold">{reg.domainsCount} vùng</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đồng bộ lần cuối:</span>
                    <span className="text-slate-400">
                      {new Date(reg.lastSynced).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sync Button */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Định kỳ: {reg.autoSyncIntervalMinutes} phút
                </span>
                <button
                  onClick={() => syncRegistrar(reg.id)}
                  disabled={syncStatus === 'syncing'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Đồng bộ ngay</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
