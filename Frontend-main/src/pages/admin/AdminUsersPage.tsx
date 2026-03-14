import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

type UserItem = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  created_at: string;
};

const MOCK_USERS: UserItem[] = [
  { id: 1, name: 'Nguyễn Văn Admin', email: 'admin@cosmictech.vn', phone: '0901234567', role: 'admin', created_at: '2026-01-15' },
  { id: 2, name: 'Trần Thị Bình', email: 'binh.tran@gmail.com', phone: '0912345678', role: 'user', created_at: '2026-02-20' },
  { id: 3, name: 'Lê Văn Cường', email: 'cuong.le@gmail.com', phone: '0923456789', role: 'user', created_at: '2026-02-28' },
  { id: 4, name: 'Phạm Thị Dung', email: 'dung.pham@gmail.com', phone: '0934567890', role: 'user', created_at: '2026-03-01' },
  { id: 5, name: 'Hoàng Văn Hùng', email: 'hung.hoang@gmail.com', phone: '0945678901', role: 'user', created_at: '2026-03-05' },
  { id: 6, name: 'Lê Nguyên Xuân Khôi', email: 'lenguyenxuankhoi@gmail.com', phone: '0379896749', role: 'user', created_at: '2026-03-09' },
];

const ROLES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

type ModalMode = 'create' | 'edit' | null;

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'user' as 'admin' | 'user', password: '' });

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '', role: 'user', password: '' });
    setEditUser(null);
    setModal('create');
  };

  const openEdit = (u: UserItem) => {
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, password: '' });
    setEditUser(u);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditUser(null);
  };

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (modal === 'create') {
      if (!form.password) {
        toast.error('Vui lòng nhập mật khẩu');
        return;
      }
      const newUser: UserItem = {
        id: Date.now(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        created_at: new Date().toISOString().split('T')[0],
      };
      setUsers([newUser, ...users]);
      toast.success('Thêm người dùng thành công');
    } else if (modal === 'edit' && editUser) {
      setUsers(users.map((u) =>
        u.id === editUser.id
          ? { ...u, name: form.name, email: form.email, phone: form.phone, role: form.role }
          : u
      ));
      toast.success('Cập nhật người dùng thành công');
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    setUsers(users.filter((u) => u.id !== id));
    toast.success('Xóa người dùng thành công');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(139,92,246,0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Quản lý người dùng</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{users.length} người dùng</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '12px', border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus style={{ width: 18, height: 18 }} /> Thêm người dùng
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
          <input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '40px' }}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '140px', cursor: 'pointer' }}
        >
          {ROLES.map((r) => <option key={r.value} value={r.value} style={{ background: '#0f0a24', color: '#fff' }}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(139,92,246,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
                {['#', 'Người dùng', 'Số điện thoại', 'Vai trò', 'Ngày tạo', 'Thao tác'].map((h) => (
                  <th key={h} style={{
                    padding: '14px 20px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(139,92,246,0.05)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '10px',
                        background: u.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {u.role === 'admin'
                          ? <Shield style={{ width: 18, height: 18, color: '#f59e0b' }} />
                          : <User style={{ width: 18, height: 18, color: '#a78bfa' }} />
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#fff', margin: 0 }}>{u.name}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#d1d5db' }}>{u.phone}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      color: u.role === 'admin' ? '#f59e0b' : '#10b981',
                      background: u.role === 'admin' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                    }}>
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#9ca3af' }}>{u.created_at}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(u)} style={{
                        padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex',
                      }}>
                        <Pencil style={{ width: 16, height: 16 }} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} style={{
                        padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(239,68,68,0.15)', color: '#f87171', display: 'flex',
                      }}>
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
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
            position: 'relative', zIndex: 1, width: '100%', maxWidth: '500px',
            background: 'linear-gradient(160deg, #1a1035, #0f0e17)',
            border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '28px',
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Họ và tên</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Nhập họ tên" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="email@example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Số điện thoại</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="0xxx..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Vai trò</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="user" style={{ background: '#0f0a24', color: '#fff' }}>User</option>
                    <option value="admin" style={{ background: '#0f0a24', color: '#fff' }}>Admin</option>
                  </select>
                </div>
              </div>
              {modal === 'create' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Mật khẩu</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} placeholder="Nhập mật khẩu" />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button onClick={closeModal} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: '1px solid rgba(139,92,246,0.2)', background: 'transparent', color: '#9ca3af', cursor: 'pointer',
              }}>Hủy</button>
              <button onClick={handleSave} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', cursor: 'pointer',
              }}>{modal === 'create' ? 'Thêm' : 'Lưu thay đổi'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
