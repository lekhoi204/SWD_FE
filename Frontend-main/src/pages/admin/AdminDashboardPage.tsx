import { useState, useEffect } from 'react';
import { Users, Shield, UserCog, User, Briefcase, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUsersApi, type User as UserType } from '@/api/users';

export function AdminDashboardPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setUsers(await getUsersApi());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const admins = users.filter(u => u.role === 'admin');
  const managers = users.filter(u => u.role === 'manager');
  const staffs = users.filter(u => u.role === 'staff');
  const customers = users.filter(u => u.role === 'customer');
  const activeUsers = users.filter(u => u.status === 'active');

  const STATS = [
    { label: 'Tổng tài khoản', value: users.length, icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { label: 'Admin', value: admins.length, icon: Shield, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Manager', value: managers.length, icon: Briefcase, color: '#ea580c', bg: 'rgba(234,88,12,0.15)' },
    { label: 'Staff', value: staffs.length, icon: UserCog, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Customer', value: customers.length, icon: User, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  ];

  const recentUsers = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
    admin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    manager: { color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
    staff: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    customer: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Đang tải...</div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>Tổng quan quản lý tài khoản • {activeUsers.length}/{users.length} đang hoạt động</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)',
            borderRadius: '16px', padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '12px', background: stat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon style={{ width: 22, height: 22, color: stat.color }} />
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>{stat.value}</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(139,92,246,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Tài khoản mới nhất</h2>
          <Link to="/admin/users" style={{
            background: 'none', border: 'none', color: '#a78bfa', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            textDecoration: 'none',
          }}>
            Xem tất cả <ArrowUpRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
                {['Tên', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo'].map((h) => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => {
                const rs = ROLE_STYLE[u.role] || ROLE_STYLE.customer;
                return (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(139,92,246,0.05)' }}>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: '#fff', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: '#d1d5db' }}>{u.email}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: rs.color, background: rs.bg }}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        color: u.status === 'active' ? '#10b981' : '#ef4444',
                        background: u.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      }}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: '#9ca3af' }}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
