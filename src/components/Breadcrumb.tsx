import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { isDark } = useTheme();

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        padding: '16px 0',
        flexWrap: 'wrap',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: isDark ? '#a78bfa' : '#7c3aed',
          textDecoration: 'none',
          fontWeight: 500,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <Home style={{ width: 16, height: 16 }} />
        Trang chủ
      </Link>

      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChevronRight style={{
              width: 14,
              height: 14,
              color: isDark ? '#6b7280' : '#9ca3af',
              flexShrink: 0,
            }} />
            {isLast || !item.to ? (
              <span style={{
                color: isDark ? '#d1d5db' : '#374151',
                fontWeight: 600,
                maxWidth: '280px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                style={{
                  color: isDark ? '#a78bfa' : '#7c3aed',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
