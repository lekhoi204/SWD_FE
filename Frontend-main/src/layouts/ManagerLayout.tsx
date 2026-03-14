import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Percent,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/Toaster';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/manager' },
  { label: 'Sản phẩm', icon: Package, to: '/manager/products' },
  { label: 'Danh mục', icon: FolderTree, to: '/manager/categories' },
  { label: 'Khuyến mãi', icon: Percent, to: '/manager/promotions' },
];

const ACCENT = '#f59e0b';
const ACCENT_BG = 'rgba(245,158,11,';

export function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (to: string) =>
    to === '/manager' ? location.pathname === '/manager' : location.pathname.startsWith(to);

  const navStyle = (active: boolean, collapsed: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: collapsed ? '12px' : '12px 16px', borderRadius: '12px',
    textDecoration: 'none', fontSize: '14px',
    fontWeight: active ? 600 : 500,
    color: active ? '#fff' : '#9ca3af',
    background: active ? `${ACCENT_BG}0.15)` : 'transparent',
    borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
    transition: 'all 0.15s',
    justifyContent: collapsed ? 'center' : 'flex-start',
  });

  const renderNav = (mobile: boolean) => (
    <>
      <div style={{
        padding: (mobile || sidebarOpen) ? '20px 20px 16px' : '20px 12px 16px',
        borderBottom: `1px solid ${ACCENT_BG}0.1)`,
        display: 'flex', alignItems: 'center',
        justifyContent: (mobile || sidebarOpen) ? 'space-between' : 'center',
      }}>
        {(mobile || sidebarOpen) && (
          <Link to="/manager" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: `linear-gradient(135deg, ${ACCENT}, #ea580c)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Manager</span>
          </Link>
        )}
        {mobile ? (
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        ) : (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
            padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronLeft style={{ width: 20, height: 20, transition: 'transform 0.2s', transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)' }} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.to} to={item.to} onClick={mobile ? () => setMobileOpen(false) : undefined}
            style={navStyle(isActive(item.to), !mobile && !sidebarOpen)}>
            <item.icon style={{ width: 20, height: 20, flexShrink: 0 }} />
            {(mobile || sidebarOpen) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: `1px solid ${ACCENT_BG}0.1)` }}>
        {(mobile || sidebarOpen) && user && (
          <div style={{ marginBottom: '12px', padding: '0 4px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>{user.name}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{user.email}</p>
          </div>
        )}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
          padding: '10px 16px', borderRadius: '10px', border: 'none',
          background: 'rgba(239,68,68,0.1)', color: '#f87171',
          fontSize: '14px', fontWeight: 500, cursor: 'pointer',
          justifyContent: (mobile || sidebarOpen) ? 'flex-start' : 'center',
        }}>
          <LogOut style={{ width: 18, height: 18 }} />
          {(mobile || sidebarOpen) && 'Đăng xuất'}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0e17' }}>
      <Toaster />
      {mobileOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={() => setMobileOpen(false)} />}

      <aside style={{
        width: sidebarOpen ? '260px' : '72px', minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1a0e 0%, #0f0e17 100%)',
        borderRight: `1px solid ${ACCENT_BG}0.15)`,
        transition: 'width 0.2s ease', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }} className="hidden md:flex">
        {renderNav(false)}
      </aside>

      <aside className="md:hidden" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px',
        background: 'linear-gradient(180deg, #1a1a0e 0%, #0f0e17 100%)',
        borderRight: `1px solid ${ACCENT_BG}0.15)`, zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s ease', display: 'flex', flexDirection: 'column',
      }}>
        {renderNav(true)}
      </aside>

      <div style={{ flex: 1, marginLeft: sidebarOpen ? '260px' : '72px', transition: 'margin-left 0.2s ease', minHeight: '100vh' }} className="!ml-0 md:!ml-auto">
        <header style={{
          height: '64px', borderBottom: `1px solid ${ACCENT_BG}0.1)`,
          display: 'flex', alignItems: 'center', padding: '0 24px',
          background: 'rgba(15,14,23,0.8)', backdropFilter: 'blur(8px)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button onClick={() => setMobileOpen(true)} className="md:hidden"
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginRight: '16px', display: 'flex' }}>
            <Menu style={{ width: 24, height: 24 }} />
          </button>
          <Link to="/" style={{ marginLeft: 'auto', fontSize: '13px', color: ACCENT, textDecoration: 'none', fontWeight: 500 }}>
            ← Về trang chủ
          </Link>
        </header>
        <main style={{ padding: '24px' }}><Outlet /></main>
      </div>
    </div>
  );
}
