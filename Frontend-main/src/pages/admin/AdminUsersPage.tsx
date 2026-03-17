import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Shield, User, UserCog, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi, type User as UserType } from '@/api/users';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const ROLES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'customer', label: 'Customer' },
];

const ROLE_STYLE: Record<string, { color: string; bg: string; icon: typeof Shield }> = {
  admin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Shield },
  manager: { color: '#ea580c', bg: 'rgba(234,88,12,0.12)', icon: Briefcase },
  staff: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: UserCog },
  customer: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: User },
};

type ModalMode = 'create' | 'edit' | null;

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer', password: '', address: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setUsers(await getUsersApi());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '', role: 'customer', password: '', address: '', status: 'active' });
    setEditUser(null);
    setModal('create');
  };

  const openEdit = (u: UserType) => {
    setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '', address: u.address || '', status: u.status });
    setEditUser(u);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditUser(null); };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Vui lòng điền đầy đủ họ tên và email');
      return;
    }
    if (modal === 'create' && !form.password) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        await createUserApi({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone || undefined,
          address: form.address || undefined,
        });
        toast.success('Thêm người dùng thành công');
      } else if (modal === 'edit' && editUser) {
        const body: Record<string, string | undefined> = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
          phone: form.phone || undefined,
          address: form.address || undefined,
        };
        if (form.password) body.password = form.password;
        await updateUserApi(editUser.user_id, body);
        toast.success('Cập nhật người dùng thành công');
      }
      closeModal();
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUserApi(deleteTarget.user_id);
      toast.success('Xóa người dùng thành công');
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) { toast.error(err?.message || 'Xóa thất bại'); }
    finally { setDeleting(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Đang tải...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Quản lý người dùng</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{users.length} tài khoản</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px',
          border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus style={{ width: 18, height: 18 }} /> Thêm người dùng
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
          <input placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '140px', cursor: 'pointer' }}>
          {ROLES.map((r) => <option key={r.value} value={r.value} style={{ background: '#0f0a24', color: '#fff' }}>{r.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
                {['#', 'Người dùng', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map((h) => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const rs = ROLE_STYLE[u.role] || ROLE_STYLE.customer;
                const RoleIcon = rs.icon;
                return (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(139,92,246,0.05)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#6b7280' }}>{i + 1}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '10px', background: rs.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <RoleIcon style={{ width: 18, height: 18, color: rs.color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#fff', margin: 0 }}>{u.name}</p>
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#d1d5db' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: rs.color, background: rs.bg }}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        color: u.status === 'active' ? '#10b981' : '#ef4444',
                        background: u.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      }}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#9ca3af' }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEdit(u)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex' }}>
                          <Pencil style={{ width: 16, height: 16 }} />
                        </button>
                        <button onClick={() => setDeleteTarget(u)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#f87171', display: 'flex' }}>
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Không tìm thấy người dùng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={closeModal} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: '540px',
            background: 'linear-gradient(160deg, #1a1035, #0f0e17)',
            border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '28px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {modal === 'create' ? 'Thêm người dùng' : 'Chỉnh sửa người dùng'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Họ và tên *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Nhập họ tên" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="email@example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Số điện thoại</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="0xxx..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Vai trò</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="customer" style={{ background: '#0f0a24', color: '#fff' }}>Customer</option>
                    <option value="staff" style={{ background: '#0f0a24', color: '#fff' }}>Staff</option>
                    <option value="manager" style={{ background: '#0f0a24', color: '#fff' }}>Manager</option>
                    <option value="admin" style={{ background: '#0f0a24', color: '#fff' }}>Admin</option>
                  </select>
                </div>
              </div>
              {modal === 'edit' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Trạng thái</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="active" style={{ background: '#0f0a24', color: '#fff' }}>Active</option>
                    <option value="inactive" style={{ background: '#0f0a24', color: '#fff' }}>Inactive</option>
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Địa chỉ</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} placeholder="Nhập địa chỉ" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>
                  {modal === 'create' ? 'Mật khẩu *' : 'Mật khẩu mới (để trống nếu không đổi)'}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} placeholder={modal === 'create' ? 'Nhập mật khẩu' : 'Để trống nếu không đổi'} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button onClick={closeModal} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: '1px solid rgba(139,92,246,0.2)', background: 'transparent', color: '#9ca3af', cursor: 'pointer',
              }}>Hủy</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Đang lưu...' : modal === 'create' ? 'Thêm' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa tài khoản"
        message={`Bạn chắc chắn muốn xóa tài khoản "${deleteTarget?.name}" (${deleteTarget?.email})? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tài khoản"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
