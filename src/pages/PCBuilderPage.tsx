import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, RefreshCw, Send, ClipboardList, X, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { products } from '@/data/products';
import { PC_BUILDER_CATEGORIES, PC_BUILDER_LABELS } from '@/constants/categories';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Product } from '@/types';

type UserRequest = {
  id: string;
  budget: number;
  purpose: string;
  note: string;
  buildItems: { category: string; name: string; price: number }[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  rejectReason?: string;
  staffBuild?: { category: string; name: string; price: number }[];
  createdAt: string;
};

const MOCK_USER_REQUESTS: UserRequest[] = [
  {
    id: 'REQ-010', budget: 25000000, purpose: 'Gaming',
    note: 'Muốn chơi Valorant, GTA V ở high settings',
    buildItems: [{ category: 'cpu', name: 'AMD Ryzen 5 5600X', price: 4990000 }],
    status: 'completed', createdAt: '2026-03-05',
    staffBuild: [
      { category: 'cpu', name: 'AMD Ryzen 5 5600X', price: 4990000 },
      { category: 'gpu', name: 'RTX 3060 12GB', price: 8990000 },
      { category: 'ram', name: 'Corsair 16GB DDR4', price: 1490000 },
      { category: 'motherboard', name: 'MSI B550M', price: 2890000 },
      { category: 'storage', name: 'Samsung 980 500GB', price: 1890000 },
      { category: 'psu', name: 'Corsair CV650', price: 1490000 },
      { category: 'case', name: 'NZXT H510', price: 1890000 },
    ],
  },
  {
    id: 'REQ-009', budget: 40000000, purpose: 'Đồ hoạ / Render',
    note: 'Dùng Blender, After Effects', buildItems: [],
    status: 'pending', createdAt: '2026-03-08',
  },
];

const PURPOSE_OPTIONS = ['Gaming', 'Học tập / Lập trình', 'Văn phòng', 'Đồ hoạ / Render', 'Streaming', 'Khác'];

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b', icon: Clock },
  accepted: { label: 'Đang xử lý', color: '#3b82f6', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: '#ef4444', icon: XCircle },
  completed: { label: 'Hoàn thành', color: '#8b5cf6', icon: CheckCircle },
};

type BuildComponent = {
  category: (typeof PC_BUILDER_CATEGORIES)[number];
  product: Product | null;
};

const ALLOCATIONS: Record<string, number> = {
  cpu: 0.25,
  gpu: 0.35,
  motherboard: 0.15,
  ram: 0.1,
  storage: 0.08,
  psu: 0.05,
  case: 0.02,
};

export function PCBuilderPage() {
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const { isLoggedIn, openLogin } = useAuth();
  const [budget, setBudget] = useState(30000000);
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>(
    PC_BUILDER_CATEGORIES.map((category) => ({ category, product: null }))
  );
  const [activeTab, setActiveTab] = useState<'build' | 'requests'>('build');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ purpose: 'Gaming', note: '' });
  const [myRequests, setMyRequests] = useState<UserRequest[]>(MOCK_USER_REQUESTS);
  const [viewRequest, setViewRequest] = useState<UserRequest | null>(null);

  const submitRequest = () => {
    if (!requestForm.purpose) { toast.error('Vui lòng chọn mục đích sử dụng'); return; }
    const buildItems = buildComponents
      .filter((c) => c.product)
      .map((c) => ({ category: c.category, name: c.product!.name, price: c.product!.price }));
    const newReq: UserRequest = {
      id: `REQ-${String(Date.now()).slice(-4)}`,
      budget,
      purpose: requestForm.purpose,
      note: requestForm.note,
      buildItems,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setMyRequests([newReq, ...myRequests]);
    setShowRequestModal(false);
    setRequestForm({ purpose: 'Gaming', note: '' });
    toast.success('Đã gửi yêu cầu tư vấn build PC!');
  };

  const totalPrice = buildComponents.reduce(
    (sum, comp) => sum + (comp.product?.price ?? 0),
    0
  );
  const remainingBudget = budget - totalPrice;

  const selectProduct = (category: string, product: Product) => {
    setBuildComponents((prev) =>
      prev.map((comp) =>
        comp.category === category ? { ...comp, product } : comp
      )
    );
  };

  const removeProduct = (category: string) => {
    setBuildComponents((prev) =>
      prev.map((comp) =>
        comp.category === category ? { ...comp, product: null } : comp
      )
    );
  };

  const autoBuild = () => {
    const newBuild: BuildComponent[] = [];
    let remaining = budget;
    for (const comp of buildComponents) {
      const categoryBudget = budget * (ALLOCATIONS[comp.category] ?? 0);
      const available = products
        .filter((p) => p.category === comp.category && p.price <= remaining)
        .sort(
          (a, b) =>
            Math.abs(a.price - categoryBudget) - Math.abs(b.price - categoryBudget)
        );
      const selected = available[0] ?? null;
      if (selected) remaining -= selected.price;
      newBuild.push({ category: comp.category, product: selected });
    }
    setBuildComponents(newBuild);
    toast.success('Đã tự động build PC theo ngân sách!');
  };

  const resetBuild = () => {
    setBuildComponents((prev) => prev.map((comp) => ({ ...comp, product: null })));
    toast.info('Đã xóa cấu hình build');
  };

  const addBuildToCart = () => {
    const selected = buildComponents
      .filter((c): c is BuildComponent & { product: Product } => c.product !== null)
      .map((c) => c.product);
    if (selected.length === 0) {
      toast.error('Vui lòng chọn ít nhất một linh kiện');
      return;
    }
    selected.forEach((p) => addToCart(p, 1));
    toast.success(`Đã thêm ${selected.length} linh kiện vào giỏ hàng!`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: 'Build PC' }]} />
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Build PC theo ý muốn
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Chọn linh kiện phù hợp với ngân sách và nhu cầu của bạn
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', padding: '4px', borderRadius: '14px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('build')}
          style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
            background: activeTab === 'build' ? 'linear-gradient(135deg, #7c3aed, #3b82f6)' : 'transparent',
            color: activeTab === 'build' ? '#fff' : isDark ? '#9ca3af' : '#6b7280',
          }}
        >
          Build PC
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
            background: activeTab === 'requests' ? 'linear-gradient(135deg, #7c3aed, #3b82f6)' : 'transparent',
            color: activeTab === 'requests' ? '#fff' : isDark ? '#9ca3af' : '#6b7280',
          }}
        >
          <ClipboardList style={{ width: 16, height: 16 }} />
          Yêu cầu của tôi
          {myRequests.filter((r) => r.status === 'pending').length > 0 && (
            <span style={{
              background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 700,
              padding: '1px 7px', borderRadius: '10px', minWidth: '18px', textAlign: 'center',
            }}>
              {myRequests.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'build' ? (<>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          className={`lg:col-span-2 backdrop-blur-sm rounded-xl p-6 ${
            isDark
              ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30'
              : 'bg-white/80 border border-purple-300 shadow-lg'
          }`}
        >
          <label className="block mb-4">
            <span
              className={`text-lg font-semibold mb-2 block ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Ngân sách:
            </span>
            <input
              type="range"
              min={10000000}
              max={100000000}
              step={1000000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full"
            />
            <div
              className={`flex justify-between text-sm mt-2 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <span>10 triệu</span>
              <span className="text-2xl font-bold text-purple-400">
                {budget.toLocaleString('vi-VN')}₫
              </span>
              <span>100 triệu</span>
            </div>
          </label>
          <div className="flex gap-4">
            <button
              onClick={autoBuild}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 text-white"
            >
              <RefreshCw className="w-5 h-5" />
              Tự động build
            </button>
            <button
              onClick={resetBuild}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isDark
                  ? 'bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white'
                  : 'bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-700'
              }`}
            >
              Xóa hết
            </button>
          </div>
        </div>

        <div
          className={`backdrop-blur-sm rounded-xl p-6 ${
            isDark
              ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30'
              : 'bg-white/80 border border-blue-300 shadow-lg'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            Tổng quan
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tổng chi phí:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalPrice.toLocaleString('vi-VN')}₫
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Ngân sách:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {budget.toLocaleString('vi-VN')}₫
              </span>
            </div>
            <div
              className={`pt-3 border-t ${
                isDark ? 'border-blue-500/30' : 'border-blue-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Còn lại:</span>
                <span
                  className={`font-bold text-xl ${
                    remainingBudget < 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {remainingBudget.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>
          {totalPrice > 0 && (
            <button
              onClick={addBuildToCart}
              className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
            >
              Thêm vào giỏ hàng
            </button>
          )}
        </div>
      </div>

      {/* Request Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => {
            if (!isLoggedIn) { openLogin(); return; }
            setShowRequestModal(true);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#fff', fontSize: '15px', fontWeight: 600,
          }}
        >
          <Send style={{ width: 20, height: 20 }} />
          Gửi yêu cầu tư vấn build PC
        </button>
        <p style={{ fontSize: '13px', color: isDark ? '#6b7280' : '#9ca3af', marginTop: '6px' }}>
          Đội ngũ kỹ thuật sẽ tư vấn và build cấu hình phù hợp cho bạn
        </p>
      </div>

      <div className="space-y-6">
        {buildComponents.map((comp) => {
          const available = products
            .filter((p) => p.category === comp.category)
            .sort((a, b) => a.price - b.price);
          return (
            <div
              key={comp.category}
              className={`backdrop-blur-sm rounded-xl p-6 ${
                isDark
                  ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30'
                  : 'bg-white/80 border border-purple-300 shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-xl font-bold ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`}
                >
                  {PC_BUILDER_LABELS[comp.category]}
                </h3>
                {comp.product && (
                  <button
                    onClick={() => removeProduct(comp.category)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {comp.product ? (
                <div
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    isDark ? 'bg-slate-900/50' : 'bg-purple-50/80'
                  }`}
                >
                  <img
                    src={comp.product.image}
                    alt={comp.product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {comp.product.name}
                    </h4>
                    <p
                      className={`text-sm line-clamp-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {comp.product.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">
                      {comp.product.price.toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {available.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => selectProduct(comp.category, product)}
                      className={`text-left p-4 rounded-lg border transition-all group ${
                        isDark
                          ? 'bg-slate-900/50 border-purple-500/20 hover:border-purple-400/50'
                          : 'bg-white/80 border-purple-300 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-semibold text-sm line-clamp-2 mb-1 transition-colors ${
                              isDark
                                ? 'text-white group-hover:text-purple-400'
                                : 'text-gray-900 group-hover:text-purple-600'
                            }`}
                          >
                            {product.name}
                          </h4>
                          <div className="text-lg font-bold text-purple-400">
                            {product.price.toLocaleString('vi-VN')}₫
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>) : (
        /* My Requests Tab */
        <div>
          {myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <ClipboardList style={{ width: 64, height: 64, color: isDark ? '#4b5563' : '#d1d5db', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#fff' : '#111', marginBottom: '8px' }}>Chưa có yêu cầu nào</p>
              <p style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#6b7280' }}>Chuyển sang tab "Build PC" để gửi yêu cầu tư vấn</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myRequests.map((req) => {
                const st = STATUS_INFO[req.status];
                const StIcon = st.icon;
                return (
                  <div key={req.id} style={{
                    padding: '20px', borderRadius: '16px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${isDark ? 'rgba(139,92,246,0.15)' : '#e5e7eb'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#fff' : '#111' }}>{req.id}</span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                            color: st.color, background: `${st.color}15`,
                          }}>
                            <StIcon style={{ width: 13, height: 13 }} /> {st.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: isDark ? '#9ca3af' : '#6b7280', flexWrap: 'wrap' }}>
                          <span>Ngân sách: <strong style={{ color: isDark ? '#10b981' : '#059669' }}>{req.budget.toLocaleString('vi-VN')}₫</strong></span>
                          <span>Mục đích: <strong style={{ color: isDark ? '#d1d5db' : '#374151' }}>{req.purpose}</strong></span>
                          <span>{req.createdAt}</span>
                        </div>
                      </div>
                      <button onClick={() => setViewRequest(req)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff',
                        color: isDark ? '#a78bfa' : '#7c3aed', fontSize: '13px', fontWeight: 600,
                      }}>
                        <Eye style={{ width: 15, height: 15 }} /> Chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowRequestModal(false)} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '28px',
            background: isDark ? 'linear-gradient(160deg, #130d30, #0f0e17)' : '#fff',
            border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#fff' : '#111', margin: 0 }}>Gửi yêu cầu tư vấn</h2>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Ngân sách</label>
                <div style={{
                  padding: '12px 14px', borderRadius: '10px', fontSize: '16px', fontWeight: 700,
                  background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5',
                  color: isDark ? '#10b981' : '#059669',
                  border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #a7f3d0',
                }}>{budget.toLocaleString('vi-VN')}₫</div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Lấy từ thanh ngân sách bạn đã chọn</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Mục đích sử dụng</label>
                <select
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
                    border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb',
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                    color: isDark ? '#fff' : '#111', outline: 'none', boxSizing: 'border-box' as const,
                  }}
                >
                  {PURPOSE_OPTIONS.map((o) => <option key={o} value={o} style={{ background: isDark ? '#1a1035' : '#fff', color: isDark ? '#fff' : '#111' }}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Ghi chú thêm</label>
                <textarea
                  value={requestForm.note}
                  onChange={(e) => setRequestForm({ ...requestForm, note: e.target.value })}
                  rows={3}
                  placeholder="Ví dụ: Muốn chơi game AAA ở 1080p, hoặc cần render video 4K..."
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', resize: 'vertical',
                    border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb',
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                    color: isDark ? '#fff' : '#111', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
                  }}
                />
              </div>
              {buildComponents.some((c) => c.product) && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Cấu hình bạn đã chọn (sẽ gửi kèm)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {buildComponents.filter((c) => c.product).map((c) => (
                      <div key={c.category} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px',
                        background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', fontSize: '13px',
                      }}>
                        <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{PC_BUILDER_LABELS[c.category]}: <strong style={{ color: isDark ? '#d1d5db' : '#374151' }}>{c.product!.name}</strong></span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{c.product!.price.toLocaleString('vi-VN')}₫</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowRequestModal(false)} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb',
                background: 'transparent', color: isDark ? '#9ca3af' : '#6b7280',
              }}>Hủy</button>
              <button onClick={submitRequest} style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                border: 'none', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff',
              }}>Gửi yêu cầu</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* View Request Detail Modal */}
      {viewRequest && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setViewRequest(null)} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px', borderRadius: '20px', padding: '28px',
            background: isDark ? 'linear-gradient(160deg, #130d30, #0f0e17)' : '#fff',
            border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#fff' : '#111', margin: 0 }}>{viewRequest.id}</h2>
                <span style={{
                  padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                  color: STATUS_INFO[viewRequest.status].color,
                  background: `${STATUS_INFO[viewRequest.status].color}15`,
                }}>{STATUS_INFO[viewRequest.status].label}</span>
              </div>
              <button onClick={() => setViewRequest(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>Ngân sách</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', margin: 0 }}>{viewRequest.budget.toLocaleString('vi-VN')}₫</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>Mục đích</p>
                <p style={{ fontSize: '15px', fontWeight: 500, color: isDark ? '#d1d5db' : '#374151', margin: 0 }}>{viewRequest.purpose}</p>
              </div>
            </div>

            {viewRequest.note && (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Ghi chú</p>
                <p style={{ fontSize: '14px', color: isDark ? '#d1d5db' : '#4b5563', margin: 0, lineHeight: 1.6,
                  padding: '12px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                }}>{viewRequest.note}</p>
              </div>
            )}

            {viewRequest.buildItems.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>Cấu hình bạn đã gửi</p>
                {viewRequest.buildItems.map((b) => (
                  <div key={b.category} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', marginBottom: '4px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', fontSize: '13px',
                  }}>
                    <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>{b.name}</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{b.price.toLocaleString('vi-VN')}₫</span>
                  </div>
                ))}
              </div>
            )}

            {viewRequest.status === 'rejected' && viewRequest.rejectReason && (
              <div style={{
                marginBottom: '18px', padding: '14px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>Lý do từ chối</p>
                <p style={{ fontSize: '14px', color: '#fca5a5', margin: 0 }}>{viewRequest.rejectReason}</p>
              </div>
            )}

            {viewRequest.status === 'completed' && viewRequest.staffBuild && (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>Cấu hình từ đội kỹ thuật</p>
                {viewRequest.staffBuild.map((b) => (
                  <div key={b.category} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', marginBottom: '6px',
                    background: isDark ? 'rgba(139,92,246,0.06)' : '#faf5ff',
                    border: isDark ? '1px solid rgba(139,92,246,0.12)' : '1px solid #e9d5ff',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{PC_BUILDER_LABELS[b.category as keyof typeof PC_BUILDER_LABELS] ?? b.category}</span>
                      <p style={{ fontSize: '14px', color: isDark ? '#d1d5db' : '#374151', margin: '2px 0 0' }}>{b.name}</p>
                    </div>
                    <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 600, alignSelf: 'center' }}>{b.price.toLocaleString('vi-VN')}₫</span>
                  </div>
                ))}
                <div style={{ textAlign: 'right', paddingTop: '8px', fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>
                  Tổng: {viewRequest.staffBuild.reduce((s, b) => s + b.price, 0).toLocaleString('vi-VN')}₫
                </div>
              </div>
            )}

            <button onClick={() => setViewRequest(null)} style={{
              width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb',
              background: 'transparent', color: isDark ? '#9ca3af' : '#6b7280',
            }}>Đóng</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
