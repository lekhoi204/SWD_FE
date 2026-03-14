import { ClipboardList, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATS = [
  { label: 'Tổng requests', value: '24', icon: ClipboardList, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { label: 'Chờ duyệt', value: '8', icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { label: 'Đã duyệt', value: '12', icon: CheckCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { label: 'Hoàn thành', value: '4', icon: CheckCircle, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
];

const RECENT_REQUESTS = [
  { id: 'REQ-008', user: 'Nguyễn Văn A', budget: '30,000,000đ', purpose: 'Gaming', status: 'Chờ duyệt', statusColor: '#f59e0b', date: '09/03/2026' },
  { id: 'REQ-007', user: 'Trần Thị B', budget: '15,000,000đ', purpose: 'Học tập', status: 'Chờ duyệt', statusColor: '#f59e0b', date: '08/03/2026' },
  { id: 'REQ-006', user: 'Lê Văn C', budget: '50,000,000đ', purpose: 'Đồ hoạ', status: 'Đã duyệt', statusColor: '#3b82f6', date: '07/03/2026' },
  { id: 'REQ-005', user: 'Phạm Thị D', budget: '20,000,000đ', purpose: 'Văn phòng', status: 'Hoàn thành', statusColor: '#8b5cf6', date: '06/03/2026' },
  { id: 'REQ-004', user: 'Hoàng Văn E', budget: '40,000,000đ', purpose: 'Gaming', status: 'Từ chối', statusColor: '#ef4444', date: '05/03/2026' },
];

export function StaffDashboardPage() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>Tổng quan yêu cầu build PC</p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {STATS.map((s) => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(16,185,129,0.12)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '12px', background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(16,185,129,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(16,185,129,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Requests gần đây</h2>
          <Link to="/staff/requests" style={{
            background: 'none', border: 'none', color: '#34d399', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            textDecoration: 'none',
          }}>
            Xem tất cả <ArrowUpRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                {['Mã', 'Khách hàng', 'Ngân sách', 'Mục đích', 'Trạng thái', 'Ngày gửi'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 24px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_REQUESTS.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(16,185,129,0.05)' }}>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#34d399', fontWeight: 600 }}>{r.id}</td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#d1d5db' }}>{r.user}</td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#fff', fontWeight: 500 }}>{r.budget}</td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#9ca3af' }}>{r.purpose}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: 600, color: r.statusColor,
                      background: `${r.statusColor}18`,
                    }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#9ca3af' }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
