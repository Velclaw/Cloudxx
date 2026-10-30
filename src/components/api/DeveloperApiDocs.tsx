import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  Code2,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Terminal,
  ExternalLink,
  BookOpen,
  Shield,
  X
} from 'lucide-react';

export const DeveloperApiDocs: React.FC = () => {
  const { apiTokens, createApiToken, revokeApiToken, selectedDomain } = useDns();

  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenRole, setNewTokenRole] = useState<'read' | 'write' | 'admin'>('write');
  const [generatedTokenFull, setGeneratedTokenFull] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const token = createApiToken(newTokenName.trim(), newTokenRole);
    setGeneratedTokenFull(token.fullToken || token.tokenPreview);
    setNewTokenName('');
  };

  const domainName = selectedDomain?.name || 'vnpay-core.vn';

  const snippets = {
    curl: {
      ddns: `# 1. Tự động cập nhật Dynamic DNS (DDNS) khi IP WAN thay đổi
curl -X POST https://api.dnssentinel.io/v1/zones/${domainName}/ddns \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "record": "@",
    "ip": "104.21.52.88",
    "auto_detect": false
  }'`,
      list: `# 2. Lấy toàn bộ danh sách bản ghi DNS của vùng
curl -X GET https://api.dnssentinel.io/v1/zones/${domainName}/records \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      create: `# 3. Tạo bản ghi DNS mới bằng cURL
curl -X POST https://api.dnssentinel.io/v1/zones/${domainName}/records \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "A",
    "name": "api-gateway",
    "content": "198.51.100.50",
    "ttl": 300,
    "proxied": true
  }'`
    },
    python: {
      ddns: `# Python 3 - Script cập nhật IP DDNS tự động
import requests

url = "https://api.dnssentinel.io/v1/zones/${domainName}/ddns"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}
payload = {
    "record": "@",
    "ip": "104.21.52.88",
    "auto_detect": True
}

response = requests.post(url, json=payload, headers=headers)
print("Kết quả:", response.json())`,
      list: `# Python 3 - Truy vấn danh sách bản ghi DNS
import requests

url = "https://api.dnssentinel.io/v1/zones/${domainName}/records"
headers = {"Authorization": "Bearer YOUR_API_TOKEN"}

res = requests.get(url, headers=headers)
for record in res.json().get("records", []):
    print(f"{record['name']}.{domainName} ({record['type']}) -> {record['content']}")`,
      create: `# Python 3 - Thêm bản ghi DNS mới
import requests

url = "https://api.dnssentinel.io/v1/zones/${domainName}/records"
payload = {
    "type": "CNAME",
    "name": "app",
    "content": "${domainName}",
    "ttl": 300
}
res = requests.post(url, json=payload, headers={"Authorization": "Bearer YOUR_API_TOKEN"})
print("Thành công:", res.status_code == 201)`
    },
    node: {
      ddns: `// Node.js (TypeScript / JavaScript) DDNS Automation
import axios from 'axios';

async function updateDynamicDns() {
  const { data } = await axios.post(
    'https://api.dnssentinel.io/v1/zones/${domainName}/ddns',
    { record: '@', ip: '104.21.52.88' },
    { headers: { Authorization: 'Bearer YOUR_API_TOKEN' } }
  );
  console.log('DDNS Synced:', data);
}
updateDynamicDns();`,
      list: `// Node.js - Lấy danh sách bản ghi DNS
import axios from 'axios';

async function fetchRecords() {
  const { data } = await axios.get(
    'https://api.dnssentinel.io/v1/zones/${domainName}/records',
    { headers: { Authorization: 'Bearer YOUR_API_TOKEN' } }
  );
  console.table(data.records);
}
fetchRecords();`,
      create: `// Node.js - Tạo bản ghi TXT xác thực SPF
import axios from 'axios';

async function createTxtRecord() {
  await axios.post(
    'https://api.dnssentinel.io/v1/zones/${domainName}/records',
    {
      type: 'TXT',
      name: '@',
      content: 'v=spf1 include:_spf.google.com ~all',
      ttl: 3600
    },
    { headers: { Authorization: 'Bearer YOUR_API_TOKEN' } }
  );
}
createTxtRecord();`
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              NHÀ PHÁT TRIỂN & REST API MỞ RỘNG
            </span>
            <span className="text-xs text-slate-400">· RESTful endpoints & Automation Tokens</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tích Hợp API Bên Thứ Ba & Tự Động Hóa DDNS
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Mở rộng quy trình DevOps, tích hợp GitHub Actions CI/CD và xây dựng các daemon cập nhật Dynamic DNS bằng bộ API bảo mật cao.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedTokenFull(null);
            setIsTokenModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Key className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tạo API Token Mới</span>
        </button>
      </div>

      {/* API Tokens List */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Danh Sách Khóa Truy Cập API (Tokens)</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {apiTokens.length} Token hoạt động
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {apiTokens.map((token) => (
            <div
              key={token.id}
              className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{token.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      token.role === 'admin'
                        ? 'text-purple-400 bg-purple-950 border border-purple-800'
                        : token.role === 'write'
                        ? 'text-cyan-400 bg-cyan-950 border border-cyan-800'
                        : 'text-slate-400 bg-slate-800 border border-slate-700'
                    }`}
                  >
                    {token.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px] mt-1">
                  <span>Mã: <code className="text-slate-300">{token.tokenPreview}</code></span>
                  <span>·</span>
                  <span>Tạo: {new Date(token.createdAt).toLocaleDateString('vi-VN')}</span>
                  {token.lastUsedAt && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-400">Sử dụng: {token.lastUsedAt}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => revokeApiToken(token.id)}
                  className="px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Thu hồi token vĩnh viễn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Thu hồi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Code Snippets Documentation */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Tài Liệu Mẫu Lập Trình (API Code Examples)</h2>
          </div>

          {/* Snippet language tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSnippetTab('curl')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'curl' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL (Bash)
            </button>
            <button
              onClick={() => setActiveSnippetTab('python')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'python' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveSnippetTab('node')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeSnippetTab === 'node' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Node.js
            </button>
          </div>
        </div>

        {/* Snippet Blocks */}
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs relative group">
            <button
              onClick={() => handleCopy(snippets[activeSnippetTab].ddns, 'ddns')}
              className="absolute right-3 top-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedId === 'ddns' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId === 'ddns' ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
            <pre className="text-slate-300 leading-relaxed overflow-x-auto pr-24">
              {snippets[activeSnippetTab].ddns}
            </pre>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs relative group">
            <button
              onClick={() => handleCopy(snippets[activeSnippetTab].create, 'create')}
              className="absolute right-3 top-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedId === 'create' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId === 'create' ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
            <pre className="text-slate-300 leading-relaxed overflow-x-auto pr-24">
              {snippets[activeSnippetTab].create}
            </pre>
          </div>
        </div>
      </div>

      {/* New Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Cấp Phát Mã Xác Thực API Token</span>
              </h2>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedTokenFull ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
                  <span className="font-bold block">Token đã tạo thành công!</span>
                  <p className="text-[11px] text-slate-300">
                    Vui lòng sao chép và lưu trữ mã này an toàn. Bạn sẽ không thể xem lại toàn bộ chuỗi này sau khi đóng hộp thoại.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] flex items-center justify-between gap-2">
                  <span className="truncate text-cyan-300 select-all">{generatedTokenFull}</span>
                  <button
                    onClick={() => handleCopy(generatedTokenFull, 'fulltoken')}
                    className="p-1 text-slate-400 hover:text-cyan-400 shrink-0"
                  >
                    {copiedId === 'fulltoken' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  onClick={() => setIsTokenModalOpen(false)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg mt-2"
                >
                  Đã sao chép & Hoàn tất
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateToken} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mục đích sử dụng (Token Name)</label>
                  <input
                    type="text"
                    required
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="VD: HomeLab DDNS Router hoặc GitLab Pipeline"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Quyền hạn (Scope & Permissions)</label>
                  <select
                    value={newTokenRole}
                    onChange={(e) => setNewTokenRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="write">Write (Đọc & Cập nhật bản ghi DNS/DDNS)</option>
                    <option value="read">Read-only (Chỉ đọc thông số phân giải)</option>
                    <option value="admin">Full Admin (Tạo/Xóa vùng tên miền & quản trị)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTokenModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold"
                  >
                    Tạo Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
