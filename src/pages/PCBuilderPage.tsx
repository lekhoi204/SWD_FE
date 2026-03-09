import { useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { products } from '@/data/products';
import { PC_BUILDER_CATEGORIES, PC_BUILDER_LABELS } from '@/constants/categories';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Product } from '@/types';

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
  const [budget, setBudget] = useState(30000000);
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>(
    PC_BUILDER_CATEGORIES.map((category) => ({ category, product: null }))
  );

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
    </div>
  );
}
