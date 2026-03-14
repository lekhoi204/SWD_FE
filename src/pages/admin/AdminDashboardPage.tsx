import { Package, Users, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';

const STATS = [
  { label: 'Tổng sản phẩm', value: '156', icon: Package, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { label: 'Người dùng', value: '1,240', icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { label: 'Đơn hàng', value: '328', icon: ShoppingCart, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { label: 'Doanh thu', value: '2.4 tỷ', icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
];

const RECENT_ORDERS = [
  { id: 'ORD-001', customer: 'Nguyễn Văn A', total: '15,990,000đ', status: 'Hoàn thành', statusColor: '#10b981' },
  { id: 'ORD-002', customer: 'Trần Thị B', total: '8,490,000đ', status: 'Đang xử lý', statusColor: '#f59e0b' },
  { id: 'ORD-003', customer: 'Lê Văn C', total: '32,000,000đ', status: 'Hoàn thành', statusColor: '#10b981' },
  { id: 'ORD-004', customer: 'Phạm Thị D', total: '5,200,000đ', status: 'Đã hủy', statusColor: '#ef4444' },
  { id: 'ORD-005', customer: 'Hoàng Văn E', total: '12,700,000đ', status: 'Đang giao', statusColor: '#3b82f6' },
];

export function AdminDashboardPage() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>Tổng quan hoạt động hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(139,92,246,0.12)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '12px',
                background: stat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon style={{ width: 22, height: 22, color: stat.color }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '13px', fontWeight: 500 }}>
                <TrendingUp style={{ width: 14, height: 14 }} />
                +12%
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>{stat.value}</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(139,92,246,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(139,92,246,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Đơn hàng gần đây</h2>
          <button style={{
            background: 'none', border: 'none', color: '#a78bfa', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            Xem tất cả <ArrowUpRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
                {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 24px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid rgba(139,92,246,0.05)' }}>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#a78bfa', fontWeight: 600 }}>{order.id}</td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#d1d5db' }}>{order.customer}</td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#fff', fontWeight: 500 }}>{order.total}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: order.statusColor,
                      background: `${order.statusColor}18`,
                    }}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
