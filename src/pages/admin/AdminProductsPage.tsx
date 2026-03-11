import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'RTX 4090 Founders Edition', category: 'GPU', price: 45990000, stock: 12, image: '' },
  { id: 2, name: 'Intel Core i9-14900K', category: 'CPU', price: 14990000, stock: 25, image: '' },
  { id: 3, name: 'Samsung 990 Pro 2TB', category: 'Storage', price: 5490000, stock: 40, image: '' },
  { id: 4, name: 'ASUS ROG Maximus Z790', category: 'Motherboard', price: 16990000, stock: 8, image: '' },
  { id: 5, name: 'Corsair Vengeance 32GB DDR5', category: 'RAM', price: 3290000, stock: 50, image: '' },
  { id: 6, name: 'Corsair RM1000x', category: 'PSU', price: 4990000, stock: 18, image: '' },
];

const CATEGORIES = ['Tất cả', 'CPU', 'GPU', 'RAM', 'Storage', 'Motherboard', 'PSU', 'Case', 'Laptop', 'PC'];

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';

type ModalMode = 'create' | 'edit' | null;

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: 'CPU', price: '', stock: '', image: '' });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'Tất cả' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setForm({ name: '', category: 'CPU', price: '', stock: '', image: '' });
    setEditProduct(null);
    setModal('create');
  };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), image: p.image });
    setEditProduct(p);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditProduct(null);
  };

  const handleSave = () => {
    if (!form.name || !form.price || !form.stock) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (modal === 'create') {
      const newProduct: Product = {
        id: Date.now(),
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image,
      };
      setProducts([newProduct, ...products]);
      toast.success('Thêm sản phẩm thành công');
    } else if (modal === 'edit' && editProduct) {
      setProducts(products.map((p) =>
        p.id === editProduct.id
          ? { ...p, name: form.name, category: form.category, price: Number(form.price), stock: Number(form.stock), image: form.image }
          : p
      ));
      toast.success('Cập nhật sản phẩm thành công');
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success('Xóa sản phẩm thành công');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(139,92,246,0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Quản lý sản phẩm</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{products.length} sản phẩm</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '12px', border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus style={{ width: 18, height: 18 }} /> Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
          <input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '40px' }}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '160px', cursor: 'pointer' }}
        >
          {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: '#0f0a24', color: '#fff' }}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(139,92,246,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
                {['#', 'Tên sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Thao tác'].map((h) => (
                  <th key={h} style={{
                    padding: '14px 20px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(139,92,246,0.05)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#fff', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      color: '#a78bfa', background: 'rgba(139,92,246,0.12)',
                    }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>{formatPrice(p.price)}</td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: p.stock < 10 ? '#f59e0b' : '#d1d5db' }}>{p.stock}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(p)} style={{
                        padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex',
                      }}>
                        <Pencil style={{ width: 16, height: 16 }} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{
                        padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(239,68,68,0.15)', color: '#f87171', display: 'flex',
                      }}>
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={closeModal} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: '500px',
            background: 'linear-gradient(160deg, #1a1035, #0f0e17)',
            border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {modal === 'create' ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Tên sản phẩm</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Nhập tên sản phẩm" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Danh mục</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATEGORIES.filter((c) => c !== 'Tất cả').map((c) => <option key={c} value={c} style={{ background: '#0f0a24', color: '#fff' }}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Giá (VNĐ)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Tồn kho</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>URL hình ảnh</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} style={inputStyle} placeholder="https://..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button onClick={closeModal} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: '1px solid rgba(139,92,246,0.2)', background: 'transparent', color: '#9ca3af', cursor: 'pointer',
              }}>Hủy</button>
              <button onClick={handleSave} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', cursor: 'pointer',
              }}>{modal === 'create' ? 'Thêm' : 'Lưu thay đổi'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
