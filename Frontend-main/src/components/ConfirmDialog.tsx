import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const VARIANT = {
  danger: {
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#f87171',
    btnBg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    accent: 'rgba(239,68,68,0.2)',
  },
  warning: {
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#fbbf24',
    btnBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    accent: 'rgba(245,158,11,0.2)',
  },
};

export function ConfirmDialog({
  open,
  title = 'Xác nhận xóa',
  message,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const v = VARIANT[variant];

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      animation: 'confirmFadeIn 0.15s ease-out',
    }}>
      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmSlideUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onCancel}
      />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(160deg, #1e1530, #0f0e17)',
        border: `1px solid ${v.accent}`,
        borderRadius: '20px',
        padding: '32px',
        animation: 'confirmSlideUp 0.2s ease-out',
      }}>
        <button
          onClick={onCancel}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: '#6b7280',
            cursor: 'pointer', display: 'flex', padding: '4px',
            borderRadius: '8px', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
        >
          <X style={{ width: 18, height: 18 }} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: v.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <AlertTriangle style={{ width: 28, height: 28, color: v.iconColor }} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
            {title}
          </h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.6, maxWidth: '320px' }}>
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#d1d5db', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#d1d5db';
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 600,
              border: 'none',
              background: v.btnBg,
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
