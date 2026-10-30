import React, { useState } from 'react';
import { useDns } from '../../context/DnsContext';
import { TeamMember, UserRole } from '../../types/dns';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  Globe,
  Layers,
  X,
  Shield
} from 'lucide-react';

export const TeamRbacManager: React.FC = () => {
  const {
    teamMembers,
    domains,
    inviteTeamMember,
    updateMemberRole,
    deleteMember,
    currentUser
  } = useDns();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('DNS Architect');
  const [inviteGroup, setInviteGroup] = useState('DevOps & SRE');
  const [allowedDomainsType, setAllowedDomainsType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    inviteTeamMember({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face`,
      role: inviteRole,
      teamGroup: inviteGroup,
      twoFactorEnabled: false,
      allowedDomains: allowedDomainsType === 'ALL' ? 'ALL' : selectedDomains
    });

    setInviteName('');
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  const roleDefinitions = [
    {
      role: 'Super Admin',
      desc: 'Toàn quyền quản trị hệ thống, cấp phát API, cấu hình 2FA và phân quyền người dùng.',
      color: 'text-purple-400 bg-purple-950 border-purple-800'
    },
    {
      role: 'DNS Architect',
      desc: 'Quản lý bản ghi DNS (Thêm/Sửa/Xóa), cấu hình DDNS Failover và chứng chỉ SSL.',
      color: 'text-cyan-400 bg-cyan-950 border-cyan-800'
    },
    {
      role: 'SecOps Auditor',
      desc: 'Kiểm tra nhật ký kiểm toán, thẩm định tính toàn vẹn DNSSEC và xuất báo cáo tuân thủ ISO.',
      color: 'text-blue-400 bg-blue-950 border-blue-800'
    },
    {
      role: 'Read-only Viewer',
      desc: 'Chỉ có quyền xem thông số bản ghi và trạng thái phân giải, không thể chỉnh sửa.',
      color: 'text-slate-400 bg-slate-800 border-slate-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              HỆ THỐNG PHÂN QUYỀN RBAC DOANH NGHIỆP
            </span>
            <span className="text-xs text-slate-400">· Kiểm soát truy cập phân tầng nhiều cấp</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Quản Lý Nhóm & Phân Quyền Người Dùng
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Thiết lập quyền hạn chi tiết theo vai trò kỹ thuật, nhóm hạ tầng và giới hạn tên miền cụ thể cho từng kỹ sư.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Mời Thành Viên Mới</span>
        </button>
      </div>

      {/* Role Definitions Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roleDefinitions.map((item) => (
          <div
            key={item.role}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${item.color}`}>
                {item.role}
              </span>
              <Shield className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Team Members Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Danh Sách Thành Viên & Phân Quyền</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {teamMembers.length} Kỹ sư trong tổ chức
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-3">Thành viên</th>
                <th className="py-3 px-3">Vai trò RBAC</th>
                <th className="py-3 px-3">Nhóm phụ trách</th>
                <th className="py-3 px-3">Phạm vi Tên miền</th>
                <th className="py-3 px-3 text-center">Bảo mật 2FA</th>
                <th className="py-3 px-3">Hoạt động gần nhất</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.id === currentUser.id && (
                            <span className="text-[10px] text-cyan-400 font-mono">(Bạn)</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-slate-200">{member.role}</span>
                  </td>

                  <td className="py-3 px-3 text-slate-300 font-mono">
                    {member.teamGroup}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300">
                    {member.allowedDomains === 'ALL' ? (
                      <span className="text-cyan-400 font-semibold">Tất cả tên miền</span>
                    ) : (
                      <span>{member.allowedDomains.join(', ')}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {member.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        ĐÃ BẬT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        CHƯA BẬT
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {member.lastActive}
                  </td>

                  <td className="py-3 px-3 text-right">
                    {member.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Xác nhận thu hồi quyền của ${member.name}?`)) {
                            deleteMember(member.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Thu hồi quyền truy cập"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Mời Kỹ Sư & Phân Quyền Vùng DNS</span>
              </h2>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="VD: Trần Văn Bình"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email doanh nghiệp</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="VD: binh.tran@vnpay-core.vn"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Vai trò kỹ thuật (Role)</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="DNS Architect">DNS Architect</option>
                    <option value="SecOps Auditor">SecOps Auditor</option>
                    <option value="Read-only Viewer">Read-only Viewer</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nhóm hạ tầng</label>
                  <select
                    value={inviteGroup}
                    onChange={(e) => setInviteGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="DevOps & SRE">DevOps & SRE</option>
                    <option value="Core Infrastructure">Core Infrastructure</option>
                    <option value="Security Operations">Security Operations</option>
                    <option value="QA & Staging">QA & Staging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phạm vi vùng tên miền cho phép</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="domScope"
                      checked={allowedDomainsType === 'ALL'}
                      onChange={() => setAllowedDomainsType('ALL')}
                      className="text-cyan-500"
                    />
                    <span>Toàn bộ tên miền</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="domScope"
                      checked={allowedDomainsType === 'SPECIFIC'}
                      onChange={() => setAllowedDomainsType('SPECIFIC')}
                      className="text-cyan-500"
                    />
                    <span>Chỉ định cụ thể</span>
                  </label>
                </div>

                {allowedDomainsType === 'SPECIFIC' && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 max-h-32 overflow-y-auto">
                    {domains.map((dom) => (
                      <label key={dom.id} className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDomains.includes(dom.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDomains(prev => [...prev, dom.name]);
                            } else {
                              setSelectedDomains(prev => prev.filter(name => name !== dom.name));
                            }
                          }}
                          className="rounded border-slate-700 text-cyan-500"
                        />
                        <span>{dom.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold"
                >
                  Gửi lời mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
