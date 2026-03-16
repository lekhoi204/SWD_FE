import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, Loader } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Breadcrumb } from "@/components/Breadcrumb";
import { createOrderApi, CreateOrderRequest } from "@/api/orders";
import { checkoutApi } from "@/api/checkout";
import { getOnlineQr, getInstallmentQr, confirmPayment } from "@/api/payments";
import type { InstallmentPlan } from "@/types";

const INSTALLMENT_PLANS: InstallmentPlan[] = [
  { id: "3-months", name: "Trả góp 3 tháng", months: 3, interest: 0 },
  { id: "5-months", name: "Trả góp 5 tháng", months: 5, interest: 0.6 },
  { id: "9-months", name: "Trả góp 9 tháng", months: 9, interest: 0.84 },
  { id: "12-months", name: "Trả góp 12 tháng", months: 12, interest: 1.2 },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { cart, loadCart, total } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<"info" | "payment" | "qr" | "success">(
    "info",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "full" | "installment" | "cod"
  >("full");
  const [installmentPlan, setInstallmentPlan] = useState("3-months");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCartItems, setSelectedCartItems] = useState<number[]>([]);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    city: "",
    district: "",
    notes: "",
  });

  // Auto-select all cart items on component mount
  useEffect(() => {
    if (cart.length > 0 && selectedCartItems.length === 0) {
      setSelectedCartItems(cart.map((item) => item.cart_item_id));
    }
  }, [cart, selectedCartItems.length]);

  const selectedPlan = INSTALLMENT_PLANS.find((p) => p.id === installmentPlan)!;
  const selectedAmount = cart
    .filter((item) => selectedCartItems.includes(item.cart_item_id))
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const shipping =
    selectedAmount > 0 ? (selectedAmount > 10000000 ? 0 : 200000) : 0;
  const subtotal = selectedAmount + shipping;
  const totalWithInterest =
    paymentMethod === "installment"
      ? subtotal * (1 + selectedPlan.interest / 100)
      : subtotal;
  const monthlyPayment =
    paymentMethod === "installment"
      ? totalWithInterest / selectedPlan.months
      : 0;

  const handleSelectItem = (cartItemId: number) => {
    setSelectedCartItems((prev) =>
      prev.includes(cartItemId)
        ? prev.filter((id) => id !== cartItemId)
        : [...prev, cartItemId],
    );
  };

  const handleSelectAll = () => {
    if (selectedCartItems.length === cart.length) {
      setSelectedCartItems([]);
    } else {
      setSelectedCartItems(cart.map((item) => item.cart_item_id));
    }
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (selectedCartItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    setStep("payment");
  };

  const handleCreateOrder = async () => {
    if (!user?.user_id) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    try {
      setIsLoading(true);

      const orderData: CreateOrderRequest = {
        cart_item_ids: selectedCartItems,
        shipping_address: `${formData.address}, ${formData.district}, ${formData.city}`,
        phone: formData.phone,
        payment_method:
          paymentMethod === "full"
            ? "QR_FULL"
            : paymentMethod === "installment"
              ? "QR_INSTALLMENT"
              : "COD",
        promotion_code: null,
      };

      // If user selected all cart items, use /checkout endpoint to create order from cart
      const orderResult =
        selectedCartItems.length === cart.length
          ? await checkoutApi({ shipping_address: orderData.shipping_address })
          : await createOrderApi(orderData);
      setOrderId(orderResult.order_id || orderResult.order_id);

      // If COD, skip QR generation and go to success
      if (paymentMethod === "cod") {
        // Clear cart after successful order
        await loadCart();
        toast.success("Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.");
        setTimeout(() => {
          setStep("success");
          setTimeout(() => navigate("/"), 2000);
        }, 1500);
        return;
      }

      // Generate QR code for online/installment payment
      try {
        let qrData;
        if (paymentMethod === "full") {
          qrData = await getOnlineQr();
        } else {
          qrData = await getInstallmentQr(selectedPlan.months);
        }
        setQrUrl(qrData.qr_url);
        setStep("qr");
      } catch (qrError) {
        console.error("QR generation error:", qrError);
        toast.error("Không thể tạo mã QR. Vui lòng thử lại.");
        setStep("payment");
      }
    } catch (error: any) {
      console.error("Create order error:", error);
      toast.error(error.message || "Không thể tạo đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg text-gray-400 mb-6">
          Vui lòng đăng nhập để thanh toán.
        </p>
      </div>
    );
  }

  if (cart.length === 0 && step !== "success") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg text-gray-400 mb-6">Giỏ hàng trống.</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Đặt hàng thành công!</h2>
          <p className="text-gray-400 mb-8">
            {paymentMethod === "cod"
              ? "Đơn hàng sẽ được giao COD. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất."
              : "Cảm ơn bạn đã thanh toán. Đơn hàng sẽ được xử lý ngay."}
          </p>
          <div className="animate-pulse text-purple-400">
            Đang chuyển hướng...
          </div>
        </div>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[{ label: "Giỏ hàng", to: "/cart" }, { label: "Thanh toán" }]}
        />

        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Quét mã QR để thanh toán
          </h1>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-8">
            {qrUrl && (
              <div className="mb-6">
                <img
                  src={qrUrl}
                  alt="VietQR"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Số tiền:</span>
                <span className="font-semibold">
                  {subtotal.toLocaleString("vi-VN")}₫
                </span>
              </div>
              {paymentMethod === "installment" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hạn mức lãi:</span>
                    <span className="font-semibold">
                      {selectedPlan.interest}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tổng cộng:</span>
                    <span className="font-semibold">
                      {totalWithInterest.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mỗi kỳ:</span>
                    <span className="font-semibold">
                      {monthlyPayment.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </>
              )}
            </div>

            <p className="text-sm text-gray-400 text-center mb-6">
              Vui lòng quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử của
              bạn
            </p>

            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await confirmPayment("Đã thanh toán thành công");
                  toast.success("Thanh toán thành công!");
                  // Clear cart after successful payment
                  await loadCart();
                  setTimeout(() => {
                    setStep("success");
                    setTimeout(() => navigate("/"), 2000);
                  }, 1500);
                } catch (error: any) {
                  console.error("Confirm payment error:", error);
                  toast.error(error.message || "Không thể xác nhận thanh toán");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Đã thanh toán"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[{ label: "Giỏ hàng", to: "/cart" }, { label: "Thanh toán" }]}
      />

      <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div
              className={`flex items-center gap-2 ${step === "info" ? "text-purple-400" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "info"
                    ? "bg-purple-500/30 border-2 border-purple-400"
                    : "bg-gray-700"
                }`}
              >
                1
              </div>
              <span className="font-semibold hidden sm:inline">Thông tin</span>
            </div>
            <div className="flex-1 h-px bg-purple-500/30" />
            <div
              className={`flex items-center gap-2 ${step === "payment" ? "text-purple-400" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "payment"
                    ? "bg-purple-500/30 border-2 border-purple-400"
                    : "bg-gray-700"
                }`}
              >
                2
              </div>
              <span className="font-semibold hidden sm:inline">Thanh toán</span>
            </div>
          </div>

          {step === "info" && (
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              {/* Select Items Section */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
                <h2 className="text-xl font-bold mb-6 text-purple-400">
                  Chọn sản phẩm
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCartItems.length === cart.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                    <span className="font-semibold">Chọn tất cả</span>
                  </label>

                  {cart.map((item) => (
                    <label
                      key={item.cart_item_id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-500/10 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCartItems.includes(item.cart_item_id)}
                        onChange={() => handleSelectItem(item.cart_item_id)}
                        className="w-4 h-4 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-gray-400">
                          {item.quantity} x{" "}
                          {item.product.price.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                      <span className="text-purple-400 font-semibold">
                        {(item.product.price * item.quantity).toLocaleString(
                          "vi-VN",
                        )}
                        ₫
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery Info Section */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
                <h2 className="text-xl font-bold mb-6 text-purple-400">
                  Thông tin giao hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Họ và tên <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
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
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                        placeholder="0901234567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
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
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                      placeholder="Số nhà, tên đường"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Thành phố/Tỉnh
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                        placeholder="TP. Hồ Chí Minh"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Quận/Huyện
                      </label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) =>
                          setFormData({ ...formData, district: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                        placeholder="Quận 1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
                      placeholder="Ghi chú thêm (không bắt buộc)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex-1 py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-2" />
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform"
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </form>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              {/* Payment Method Selection */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
                <h2 className="text-xl font-bold mb-6 text-purple-400">
                  Phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  <label
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-colors"
                    style={{
                      borderColor:
                        paymentMethod === "full"
                          ? "rgb(168, 85, 247)"
                          : undefined,
                      backgroundColor:
                        paymentMethod === "full"
                          ? "rgba(168, 85, 247, 0.1)"
                          : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      value="full"
                      checked={paymentMethod === "full"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold">
                        Thanh toán toàn bộ (QR Code)
                      </p>
                      <p className="text-sm text-gray-400">
                        Thanh toán ngay bằng mã QR
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-colors"
                    style={{
                      borderColor:
                        paymentMethod === "installment"
                          ? "rgb(168, 85, 247)"
                          : undefined,
                      backgroundColor:
                        paymentMethod === "installment"
                          ? "rgba(168, 85, 247, 0.1)"
                          : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      value="installment"
                      checked={paymentMethod === "installment"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold">Trả góp (QR Code)</p>
                      <p className="text-sm text-gray-400">
                        Chia đơn hàng thành nhiều kỳ
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-colors"
                    style={{
                      borderColor:
                        paymentMethod === "cod"
                          ? "rgb(168, 85, 247)"
                          : undefined,
                      backgroundColor:
                        paymentMethod === "cod"
                          ? "rgba(168, 85, 247, 0.1)"
                          : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold">
                        Thanh toán khi nhận hàng (COD)
                      </p>
                      <p className="text-sm text-gray-400">
                        Thanh toán sau khi nhận hàng
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Installment Plans */}
              {paymentMethod === "installment" && (
                <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
                  <h2 className="text-xl font-bold mb-6 text-purple-400">
                    Chọn kỳ hạn
                  </h2>
                  <div className="space-y-3">
                    {INSTALLMENT_PLANS.map((plan) => (
                      <label
                        key={plan.id}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-colors"
                        style={{
                          borderColor:
                            installmentPlan === plan.id
                              ? "rgb(168, 85, 247)"
                              : undefined,
                          backgroundColor:
                            installmentPlan === plan.id
                              ? "rgba(168, 85, 247, 0.1)"
                              : undefined,
                        }}
                      >
                        <input
                          type="radio"
                          value={plan.id}
                          checked={installmentPlan === plan.id}
                          onChange={(e) => setInstallmentPlan(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{plan.name}</p>
                          <p className="text-sm text-gray-400">
                            Lãi: {plan.interest}% • Mỗi kỳ:{" "}
                            {(
                              (subtotal * (1 + plan.interest / 100)) /
                              plan.months
                            ).toLocaleString("vi-VN")}
                            ₫
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-2" />
                  Quay lại
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 inline mr-2" />
                      Xác nhận đặt hàng
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 sticky top-24">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">
              Tổng đơn hàng
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Tạm tính:</span>
                <span className="font-semibold">
                  {selectedAmount.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phí vận chuyển:</span>
                <span className="font-semibold">
                  {shipping === 0 ? (
                    <span className="text-green-400">Miễn phí</span>
                  ) : (
                    `${shipping.toLocaleString("vi-VN")}₫`
                  )}
                </span>
              </div>
              {paymentMethod === "installment" && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Lãi suất:</span>
                  <span className="font-semibold">
                    {(totalWithInterest - subtotal).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}
              <div className="pt-4 border-t border-purple-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-3xl font-bold text-purple-400">
                    {(paymentMethod === "installment"
                      ? totalWithInterest
                      : subtotal
                    ).toLocaleString("vi-VN")}
                    ₫
                  </span>
                </div>
                {paymentMethod === "installment" && (
                  <div className="text-sm text-purple-300">
                    Mỗi kỳ: {monthlyPayment.toLocaleString("vi-VN")}₫
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
