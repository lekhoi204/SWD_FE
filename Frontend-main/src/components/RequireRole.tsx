import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { ShieldX } from 'lucide-react';

type RequireRoleProps = {
  roles: UserRole[];
  children: React.ReactNode;
};

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, isLoggedIn, openLogin } = useAuth();

  if (!isLoggedIn || !user) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0e17', padding: '24px',
      }}>
        <div style={{
          textAlign: 'center', maxWidth: '420px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)',
          borderRadius: '24px', padding: '48px 32px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <ShieldX style={{ width: 32, height: 32, color: '#fbbf24' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
            Yêu cầu đăng nhập
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 28px', lineHeight: 1.6 }}>
            Bạn cần đăng nhập với tài khoản có quyền truy cập để xem trang này.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: '1px solid rgba(139,92,246,0.2)', background: 'transparent',
                color: '#9ca3af', cursor: 'pointer',
              }}
            >
              Về trang chủ
            </button>
            <button
              onClick={openLogin}
              style={{
                padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                color: '#fff', cursor: 'pointer',
              }}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user.role || !roles.includes(user.role)) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0e17', padding: '24px',
      }}>
        <div style={{
          textAlign: 'center', maxWidth: '420px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: '24px', padding: '48px 32px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <ShieldX style={{ width: 32, height: 32, color: '#f87171' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
            Không có quyền truy cập
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 8px', lineHeight: 1.6 }}>
            Tài khoản của bạn không có quyền truy cập trang này.
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 28px' }}>
            Yêu cầu role: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{roles.join(', ')}</span>
            {' '} — Role của bạn: <span style={{ color: '#ef4444', fontWeight: 600 }}>{user.role || 'không xác định'}</span>
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
              border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
