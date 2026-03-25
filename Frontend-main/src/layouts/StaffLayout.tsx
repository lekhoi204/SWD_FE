import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Wrench,
  Monitor,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/Toaster';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/staff' },
  { label: 'Build Requests', icon: ClipboardList, to: '/staff/requests' },
  { label: 'PC Builds (Đăng bán)', icon: Monitor, to: '/staff/builds' },
];

export function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const accentColor = 'rgba(16,185,129,';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1120' }}>
      <Toaster />

      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '72px',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0f1d2e 0%, #0b1120 100%)',
          borderRight: `1px solid ${accentColor}0.15)`,
          transition: 'width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
        }}
        className="hidden md:flex"
      >
        <div style={{
          padding: sidebarOpen ? '20px 20px 16px' : '20px 12px 16px',
          borderBottom: `1px solid ${accentColor}0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
        }}>
          {sidebarOpen && (
            <Link to="/staff" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wrench style={{ width: 20, height: 20, color: '#fff' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Tech Support</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft style={{
              width: 20, height: 20,
              transition: 'transform 0.2s',
              transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)',
            }} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === '/staff'
              ? location.pathname === '/staff'
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarOpen ? '12px 16px' : '12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : '#9ca3af',
                  background: isActive ? `${accentColor}0.15)` : 'transparent',
                  borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                  transition: 'all 0.15s',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}
              >
                <item.icon style={{ width: 20, height: 20, flexShrink: 0 }} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: `1px solid ${accentColor}0.1)` }}>
          {sidebarOpen && user && (
            <div style={{ marginBottom: '12px', padding: '0 4px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: 'rgba(239,68,68,0.1)', color: '#f87171',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
          >
            <LogOut style={{ width: 18, height: 18 }} />
            {sidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className="md:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px',
          background: 'linear-gradient(180deg, #0f1d2e 0%, #0b1120 100%)',
          borderRight: `1px solid ${accentColor}0.15)`,
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '20px', borderBottom: `1px solid ${accentColor}0.1)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Tech Support</span>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === '/staff' ? location.pathname === '/staff' : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderRadius: '12px', textDecoration: 'none', fontSize: '14px',
                fontWeight: isActive ? 600 : 500, color: isActive ? '#fff' : '#9ca3af',
                background: isActive ? `${accentColor}0.15)` : 'transparent',
              }}>
                <item.icon style={{ width: 20, height: 20 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: `1px solid ${accentColor}0.1)` }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px',
            borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.1)',
            color: '#f87171', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
          }}>
            <LogOut style={{ width: 18, height: 18 }} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '72px',
        transition: 'margin-left 0.2s ease',
        minHeight: '100vh',
      }} className="!ml-0 md:!ml-auto">
        <header style={{
          height: '64px',
          borderBottom: `1px solid ${accentColor}0.1)`,
          display: 'flex', alignItems: 'center', padding: '0 24px',
          background: 'rgba(11,17,32,0.8)', backdropFilter: 'blur(8px)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginRight: '16px', display: 'flex' }}
          >
            <Menu style={{ width: 24, height: 24 }} />
          </button>
          <Link to="/" style={{ marginLeft: 'auto', fontSize: '13px', color: '#34d399', textDecoration: 'none', fontWeight: 500 }}>
            ← Về trang chủ
          </Link>
        </header>

        <main style={{ padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
