import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Tag, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getPromotionsApi, type Promotion } from '@/api/promotions';
import { apiClient } from '@/api/client';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

type ModalMode = 'create' | 'edit' | null;

export function ManagerPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ code: '', discount_percent: '', valid_from: '', valid_to: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPromotions(await getPromotionsApi());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = promotions.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (p: Promotion) => {
    const now = new Date();
    if (p.valid_from && new Date(p.valid_from) > now) return { label: 'Sắp diễn ra', color: '#3b82f6' };
    if (p.valid_to && new Date(p.valid_to) < now) return { label: 'Hết hạn', color: '#6b7280' };
    return { label: 'Đang chạy', color: '#10b981' };
  };

  const openCreate = () => {
    setForm({ code: '', discount_percent: '', valid_from: '', valid_to: '' });
    setEditPromo(null);
    setModal('create');
  };

  const openEdit = (p: Promotion) => {
    setForm({
      code: p.code,
      discount_percent: String(p.discount_percent),
      valid_from: p.valid_from ? p.valid_from.split('T')[0] : '',
      valid_to: p.valid_to ? p.valid_to.split('T')[0] : '',
    });
    setEditPromo(p);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditPromo(null); };

  const handleSave = async () => {
    if (!form.code || !form.discount_percent) { toast.error('Vui lòng điền mã và phần trăm giảm'); return; }
    setSaving(true);
    try {
      const body = {
        code: form.code.toUpperCase(),
        discount_percent: Number(form.discount_percent),
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
      };
      if (modal === 'create') {
        await apiClient('/promotions', { method: 'POST', body });
        toast.success('Thêm khuyến mãi thành công');
      } else if (modal === 'edit' && editPromo) {
        await apiClient(`/promotions/${editPromo.promotion_id}`, { method: 'PUT', body });
        toast.success('Cập nhật khuyến mãi thành công');
      }
      closeModal();
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient(`/promotions/${deleteTarget.promotion_id}`, { method: 'DELETE' });
      toast.success('Xóa khuyến mãi thành công');
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) { toast.error(err?.message || 'Xóa thất bại'); }
    finally { setDeleting(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Đang tải...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Quản lý khuyến mãi</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{promotions.length} khuyến mãi</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px',
          border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus style={{ width: 18, height: 18 }} /> Thêm khuyến mãi
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
          <input placeholder="Tìm theo mã khuyến mãi..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.map((p) => {
          const status = getStatus(p);
          return (
            <div key={p.promotion_id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)',
              borderRadius: '16px', padding: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Tag style={{ width: 16, height: 16, color: '#f59e0b' }} />
                    <code style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '6px' }}>{p.code}</code>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>ID: {p.promotion_id}</span>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: status.color, background: `${status.color}18` }}>{status.label}</span>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', marginBottom: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>-{p.discount_percent}%</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar style={{ width: 13, height: 13, color: '#6b7280' }} />
                  <span style={{ color: '#6b7280' }}>Từ: {formatDate(p.valid_from)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar style={{ width: 13, height: 13, color: '#6b7280' }} />
                  <span style={{ color: '#6b7280' }}>Đến: {formatDate(p.valid_to)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => openEdit(p)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex' }}>
                  <Pencil style={{ width: 16, height: 16 }} />
                </button>
                <button onClick={() => setDeleteTarget(p)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#f87171', display: 'flex' }}>
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#6b7280' }}>Không tìm thấy khuyến mãi nào</div>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={closeModal} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px', background: 'linear-gradient(160deg, #1a1a0e, #0f0e17)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>{modal === 'create' ? 'Thêm khuyến mãi' : 'Chỉnh sửa khuyến mãi'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Mã khuyến mãi *</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} style={inputStyle} placeholder="VD: SALE20" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Giảm giá (%) *</label>
                  <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} style={inputStyle} placeholder="0" min="1" max="100" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Ngày bắt đầu</label>
                  <input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Ngày kết thúc</label>
                  <input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button onClick={closeModal} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(245,158,11,0.2)', background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Đang lưu...' : modal === 'create' ? 'Thêm' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa khuyến mãi"
        message={`Bạn chắc chắn muốn xóa mã "${deleteTarget?.code}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa khuyến mãi"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
