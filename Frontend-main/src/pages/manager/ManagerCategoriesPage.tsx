import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi, type Category } from '@/api/categories';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type ModalMode = 'create' | 'edit' | null;

export function ManagerCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setCategories(await getCategoriesApi());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm({ name: '', description: '' });
    setEditCat(null);
    setModal('create');
  };

  const openEdit = (c: Category) => {
    setForm({ name: c.name, description: c.description || '' });
    setEditCat(c);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditCat(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên danh mục'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await createCategoryApi({ name: form.name, description: form.description || undefined });
        toast.success('Thêm danh mục thành công');
      } else if (modal === 'edit' && editCat) {
        await updateCategoryApi(editCat.category_id, { name: form.name, description: form.description || undefined });
        toast.success('Cập nhật danh mục thành công');
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
      await deleteCategoryApi(deleteTarget.category_id);
      toast.success('Xóa danh mục thành công');
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
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Quản lý danh mục</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{categories.length} danh mục</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px',
          border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus style={{ width: 18, height: 18 }} /> Thêm danh mục
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {categories.map((c) => (
          <div key={c.category_id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)',
            borderRadius: '16px', padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>{c.name}</h3>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>ID: {c.category_id}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEdit(c)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex' }}>
                  <Pencil style={{ width: 16, height: 16 }} />
                </button>
                <button onClick={() => setDeleteTarget(c)} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#f87171', display: 'flex' }}>
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
            {c.description && <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{c.description}</p>}
          </div>
        ))}
        {categories.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#6b7280' }}>Chưa có danh mục nào</div>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={closeModal} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px', background: 'linear-gradient(160deg, #1a1a0e, #0f0e17)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>{modal === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Tên danh mục *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="VD: CPU, GPU, RAM..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Mô tả danh mục..." />
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
        title="Xóa danh mục"
        message={`Bạn chắc chắn muốn xóa danh mục "${deleteTarget?.name}"? Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng.`}
        confirmLabel="Xóa danh mục"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
