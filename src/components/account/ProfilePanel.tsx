import React, { useEffect, useState } from 'react';
import { CalendarDays, LogOut, Save, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Profile {
  full_name: string;
  username: string;
  phone: string;
  avatar_url: string;
}

const emptyProfile: Profile = { full_name: '', username: '', phone: '', avatar_url: '' };

export const ProfilePanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user || !open) return;
    let active = true;
    supabase.from('profiles')
      .select('full_name, username, phone, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setErrorMessage(error.message);
        if (data) setProfile({
          full_name: data.full_name ?? '',
          username: data.username ?? '',
          phone: data.phone ?? '',
          avatar_url: data.avatar_url ?? '',
        });
        else setProfile({ ...emptyProfile, full_name: String(user.user_metadata?.full_name ?? '') });
      });
    return () => { active = false; };
  }, [user, open]);

  if (!user) return null;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setErrorMessage('');
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.full_name.trim(),
        username: profile.username.trim() || null,
        phone: profile.phone.trim() || null,
        avatar_url: profile.avatar_url.trim() || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setNotice('Hồ sơ đã được lưu vào cơ sở dữ liệu.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể lưu hồ sơ.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể đăng xuất.');
    }
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setNotice(''); setErrorMessage(''); }} title="Hồ sơ người dùng" className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-white shadow-xl hover:bg-neutral-800 md:bottom-6">
        <UserRound className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="profile-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Tài khoản DOMAINS</p>
                <h2 id="profile-title" className="mt-1 text-xl font-semibold text-white">Hồ sơ người dùng</h2>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Đóng" className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-5 rounded-xl border border-neutral-800 bg-black p-3">
              <p className="break-all text-sm font-medium text-white">{user.email}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500"><CalendarDays className="h-3.5 w-3.5" /> Tạo tài khoản: {new Date(user.created_at).toLocaleDateString('vi-VN')}</div>
              <p className="mt-1 text-[11px] text-emerald-400">{user.email_confirmed_at ? 'Email đã xác minh' : 'Email chưa xác minh'}</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              {([
                ['full_name', 'Họ và tên', 'Nguyễn Văn A'],
                ['username', 'Tên người dùng', 'username'],
                ['phone', 'Số điện thoại', '+84…'],
                ['avatar_url', 'URL ảnh đại diện', 'https://…'],
              ] as const).map(([field, label, placeholder]) => (
                <label key={field} className="block text-xs font-medium text-neutral-400">
                  {label}
                  <input value={profile[field]} onChange={e => setProfile(current => ({ ...current, [field]: e.target.value }))} placeholder={placeholder} className="mt-2 w-full rounded-lg border border-neutral-800 bg-black px-3 py-3 text-sm text-white outline-none focus:border-neutral-500" />
                </label>
              ))}
              {notice && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-300">{notice}</p>}
              {errorMessage && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-xs text-red-300">{errorMessage}</p>}
              <button type="submit" disabled={busy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"><Save className="h-4 w-4" />{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
            </form>
            <button onClick={handleSignOut} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-900"><LogOut className="h-4 w-4" />Đăng xuất</button>
          </section>
        </div>
      )}
    </>
  );
};
