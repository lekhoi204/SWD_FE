import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { Breadcrumb } from '@/components/Breadcrumb';

const INSTALLMENT_PLANS = [
  { id: '3-months', name: 'Trả góp 3 tháng', months: 3, interest: 0 },
  { id: '6-months', name: 'Trả góp 6 tháng', months: 6, interest: 0 },
  { id: '12-months', name: 'Trả góp 12 tháng', months: 12, interest: 0 },
  { id: '18-months', name: 'Trả góp 18 tháng', months: 18, interest: 2 },
  { id: '24-months', name: 'Trả góp 24 tháng', months: 24, interest: 3 },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { cart, total, clearCart } = useCart();
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'installment'>('full');
  const [installmentPlan, setInstallmentPlan] = useState('3-months');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    notes: '',
  });

  const selectedPlan = INSTALLMENT_PLANS.find((p) => p.id === installmentPlan)!;
  const totalWithInterest = total * (1 + selectedPlan.interest / 100);
  const monthlyPayment = totalWithInterest / selectedPlan.months;

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    // TODO: gọi createOrderApi() từ @/api khi backend sẵn sàng
    // const order = await createOrderApi({
    //   items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price })),
    //   shippingInfo: formData,
    //   paymentMethod,
    //   installmentPlan: paymentMethod === 'installment' ? installmentPlan : undefined,
    // });
    toast.info('Chức năng đặt hàng chưa được kết nối API');
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg text-gray-400 mb-6">Giỏ hàng trống. Vui lòng thêm sản phẩm.</p>
        <Link
          to="/products"
          className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold"
        >
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Đặt hàng thành công!</h2>
          <p className="text-gray-400 mb-8">
            Cảm ơn bạn đã mua hàng tại CosmicTech. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm
            nhất.
          </p>
          <div className="animate-pulse text-purple-400">Đang chuyển hướng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: 'Giỏ hàng', to: '/cart' },
        { label: 'Thanh toán' },
      ]} />

      <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === 'info' ? 'text-purple-400' : 'text-gray-400'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'info' ? 'bg-purple-500/30 border-2 border-purple-400' : 'bg-gray-700'
                }`}
              >
                1
              </div>
              <span className="font-semibold hidden sm:inline">Thông tin</span>
            </div>
            <div className="flex-1 h-px bg-purple-500/30" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-purple-400' : 'text-gray-400'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'payment' ? 'bg-purple-500/30 border-2 border-purple-400' : 'bg-gray-700'
                }`}
              >
                2
              </div>
              <span className="font-semibold hidden sm:inline">Thanh toán</span>
            </div>
          </div>

          {step === 'info' && (
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
                <h2 className="text-xl font-bold mb-6 text-purple-400">Thông tin giao hàng</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Họ và tên <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Số điện thoại <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                        placeholder="0901234567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Địa chỉ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                      placeholder="Số nhà, tên đường"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Thành phố/Tỉnh</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                        placeholder="TP. Hồ Chí Minh"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Quận/Huyện</label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                        placeholder="Quận 1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ghi chú</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 h-24 resize-none"
                      placeholder="Ghi chú thêm về đơn hàng..."
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/50"
              >
                Tiếp tục
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
                <h2 className="text-xl font-bold mb-6 text-purple-400">Phương thức thanh toán</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => setPaymentMethod('full')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'full'
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6" />
                      <div>
                        <div className="font-semibold">Thanh toán toàn bộ</div>
                        <div className="text-sm text-gray-400">Thanh toán một lần khi nhận hàng</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('installment')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'installment'
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6" />
                      <div>
                        <div className="font-semibold">Trả góp 0%</div>
                        <div className="text-sm text-gray-400">Trả góp lãi suất 0% qua thẻ tín dụng</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'installment' && (
                <div
                  className={`${
                    isDark
                      ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30'
                      : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300'
                  } backdrop-blur-sm rounded-xl border p-6`}
                >
                  <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                    Chọn kỳ hạn trả góp
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {INSTALLMENT_PLANS.map((plan) => {
                      const planTotal = total * (1 + plan.interest / 100);
                      const planMonthly = planTotal / plan.months;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => setInstallmentPlan(plan.id)}
                          className={`p-5 rounded-xl border-2 transition-all text-left ${
                            installmentPlan === plan.id
                              ? isDark
                                ? 'border-purple-400 bg-purple-500/30'
                                : 'border-purple-500 bg-purple-100'
                              : isDark
                                ? 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50'
                                : 'border-purple-300 bg-white hover:border-purple-400'
                          }`}
                        >
                          <div className="font-bold text-lg mb-2">{plan.name}</div>
                          <div className="text-sm text-gray-400 mb-2">
                            {plan.interest > 0 ? `Lãi ${plan.interest}%` : 'Lãi 0%'}
                          </div>
                          <div className="text-2xl font-bold text-purple-400">
                            {planMonthly.toLocaleString('vi-VN')}₫/tháng
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className={`mt-6 p-4 rounded-lg ${
                      isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>Trả mỗi tháng:</span>
                      <span className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                        {monthlyPayment.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 py-4 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleCompleteOrder}
                  className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/50"
                >
                  Hoàn tất đặt hàng
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6 text-purple-400">Đơn hàng</h2>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 pb-4 border-b border-purple-500/20">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2">{item.product.name}</h4>
                    <div className="text-sm text-gray-400">Số lượng: {item.quantity}</div>
                    <div className="font-bold text-purple-400">
                      {(item.product.price * item.quantity).toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-4 border-t border-purple-500/30">
              <div className="flex justify-between">
                <span className="text-gray-400">Tạm tính:</span>
                <span className="font-semibold">{total.toLocaleString('vi-VN')}₫</span>
              </div>
              {paymentMethod === 'installment' && selectedPlan.interest > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Lãi suất ({selectedPlan.interest}%):</span>
                  <span className="font-semibold">
                    {(totalWithInterest - total).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-purple-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-purple-400">
                    {(paymentMethod === 'installment' && selectedPlan.interest > 0
                      ? totalWithInterest
                      : total
                    ).toLocaleString('vi-VN')}
                    ₫
                  </span>
                </div>
                {paymentMethod === 'installment' && (
                  <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30 mt-3">
                    <div className="text-sm text-gray-300 mb-1">
                      Trả góp {selectedPlan.months} tháng
                    </div>
                    <div className="text-xl font-bold text-blue-400">
                      {monthlyPayment.toLocaleString('vi-VN')}₫/tháng
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
