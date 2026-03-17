import { useEffect, useState } from 'react';
import { ClipboardList, Clock, CheckCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StaffBuildRequestsApi from '@/api/staffBuildRequests';

export function StaffDashboardPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, completed: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const reqs = await StaffBuildRequestsApi.getAllStaffBuildRequests();
        if (mounted) {
          const list = reqs || [];
          
          let pending = 0, accepted = 0, completed = 0;
          list.forEach((r: any) => {
            if (r.status === 'pending') pending++;
            else if (r.status === 'accepted') accepted++;
            else if (r.status === 'completed') completed++;
          });

          setStats({ total: list.length, pending, accepted, completed });

          // Map and slice top 5
          const recent = list.slice(0, 5).map((req: any) => {
            const noteLines = (req.customer_note || '').split('\n');
            let purpose = 'Khác';
            for (const line of noteLines) {
              if (line.startsWith('Mục đích:')) purpose = line.replace('Mục đích:', '').trim();
            }
            
            let statusColor = '#9ca3af';
            let statusLabel = req.status || 'Chờ duyệt';
            if (req.status === 'pending') { statusColor = '#f59e0b'; statusLabel = 'Chờ duyệt'; }
            if (req.status === 'accepted') { statusColor = '#3b82f6'; statusLabel = 'Đã duyệt'; }
            if (req.status === 'completed') { statusColor = '#8b5cf6'; statusLabel = 'Hoàn thành'; }
            if (req.status === 'rejected') { statusColor = '#ef4444'; statusLabel = 'Từ chối'; }

            return {
              id: req.request_id || req.id || 'N/A',
              user: req.user?.username || req.user?.name || req.user_id || 'Khách',
              budget: Number(req.budget_range || 0).toLocaleString('vi-VN') + 'đ',
              purpose,
              status: statusLabel,
              statusColor,
              date: req.created_at ? req.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            };
          });
          setRecentRequests(recent);
        }
      } catch (err) {
        console.error('Fetch dashboard staff requests failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const STATS_CARDS = [
    { label: 'Tổng requests', value: stats.total, icon: ClipboardList, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Chờ duyệt', value: stats.pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Đã duyệt', value: stats.accepted, icon: CheckCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Hoàn thành', value: stats.completed, icon: CheckCircle, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#9ca3af' }}>
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p>Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

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
        {STATS_CARDS.map((s) => (
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
              {recentRequests.map((r) => (
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
              {recentRequests.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280' }}>
                    Chưa có request nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
