import { useState, useEffect } from 'react';
import { Package, FolderTree, Percent, TrendingUp } from 'lucide-react';
import { getProductsApi } from '@/api/products';
import { getCategoriesApi, type Category } from '@/api/categories';
import { getPromotionsApi, type Promotion } from '@/api/promotions';
import type { Product } from '@/types';

export function ManagerDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [prods, cats, promos] = await Promise.all([
          getProductsApi(), getCategoriesApi(), getPromotionsApi(),
        ]);
        if (mounted) { setProducts(prods); setCategories(cats); setPromotions(promos); }
      } catch (err) { console.error(err); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const stats = [
    { label: 'Tổng sản phẩm', value: products.length, icon: Package, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Danh mục', value: categories.length, icon: FolderTree, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Khuyến mãi', value: promotions.length, icon: Percent, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Sắp hết hàng', value: products.filter(p => p.stock < 10).length, icon: TrendingUp, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Đang tải dữ liệu...</div>
  );

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Dashboard Quản lý</h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>Tổng quan sản phẩm, danh mục & khuyến mãi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="!grid-cols-1 lg:!grid-cols-2">
        {/* Low stock products */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Sản phẩm sắp hết hàng</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
                  {['Sản phẩm', 'Tồn kho', 'Giá'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.filter(p => p.stock < 10).slice(0, 5).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(245,158,11,0.05)' }}>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: '#fff', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: p.stock < 5 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{p.stock}</td>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>{p.price.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
                {products.filter(p => p.stock < 10).length === 0 && (
                  <tr><td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>Tất cả sản phẩm còn đủ hàng</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories + Promotions summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '16px', padding: '20px 24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Danh mục ({categories.length})</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(c => (
                <span key={c.category_id} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                  {c.name}
                </span>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '16px', padding: '20px 24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Khuyến mãi ({promotions.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {promotions.slice(0, 5).map(p => (
                <div key={p.promotion_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'rgba(245,158,11,0.05)' }}>
                  <code style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{p.code}</code>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>-{p.discount_percent}%</span>
                </div>
              ))}
              {promotions.length === 0 && <p style={{ color: '#6b7280', fontSize: '14px' }}>Chưa có khuyến mãi</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
