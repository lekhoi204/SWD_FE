import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, Loader } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Breadcrumb } from "@/components/Breadcrumb";
import { createOrderApi, CreateOrderRequest } from "@/api/orders";

import {
  createQrFullPayment,
  createQrInstallmentPayment,
  confirmPayment,
} from "@/api/payments";
import { getPromotionByCodeApi } from "@/api/promotions";
import type { InstallmentPlan } from "@/types";

const INSTALLMENT_PLANS: InstallmentPlan[] = [
  { id: "3-months", name: "Trả góp 3 tháng", months: 3, interest: 0 },
  { id: "6-months", name: "Trả góp 6 tháng", months: 6, interest: 0.48 },
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
  const [qrPaymentData, setQrPaymentData] = useState<Record<string, unknown> | null>(null);
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
  const [promotionInput, setPromotionInput] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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
  const baseSubtotal = selectedAmount + shipping;
  const discountAmount = appliedPromotion ? baseSubtotal * (appliedPromotion.discount_percent / 100) : 0;
  const subtotal = Math.max(0, baseSubtotal - discountAmount);
  const totalWithInterest =
    paymentMethod === "installment"
      ? subtotal * (1 + selectedPlan.interest / 100)
      : subtotal;
  const monthlyPayment =
    paymentMethod === "installment"
      ? totalWithInterest / selectedPlan.months
      : 0;

  const handleApplyPromotion = async () => {
    if (!promotionInput.trim()) {
      setAppliedPromotion(null);
      return;
    }
    setIsApplyingPromo(true);
    try {
      const p = await getPromotionByCodeApi(promotionInput.toUpperCase());
      setAppliedPromotion(p);
      toast.success("Áp dụng mã khuyến mãi thành công!");
    } catch (err: any) {
      toast.error(err.message || "Mã khuyến mãi không hợp lệ hoặc đã hết hạn");
      setAppliedPromotion(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

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
        promotion_code: appliedPromotion ? appliedPromotion.code : null,
      };

      const orderResult = await createOrderApi(orderData);
      setOrderId(orderResult.order_id);

      if (paymentMethod === "cod") {
        await loadCart();
        toast.success("Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.");
        setTimeout(() => {
          setStep("success");
          setTimeout(() => navigate("/"), 2000);
        }, 1500);
        return;
      }

      try {
        let paymentData: any;
        if (paymentMethod === "full") {
          paymentData = await createQrFullPayment();
        } else {
          paymentData = await createQrInstallmentPayment(selectedPlan.months);
        }
        const url =
          paymentData?.payment_url ??
          paymentData?.qr_url ??
          paymentData?.image_url ??
          paymentData?.url ??
          paymentData?.data?.payment_url ??
          paymentData?.data?.qr_url ??
          paymentData?.data?.image_url ??
          paymentData?.data?.url;
        if (!url) {
          console.warn("Payment QR response (no url found):", paymentData);
        }
        setQrUrl(url || null);
        setQrPaymentData(paymentData?.data ?? paymentData ?? null);
        setStep("qr");
      } catch (qrError) {
        console.error("Payment generation error:", qrError);
        toast.error("Không thể tạo liên kết thanh toán. Vui lòng thử lại.");
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
        <p className={`text-lg mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Vui lòng đăng nhập để thanh toán.
        </p>
      </div>
    );
  }

  if (cart.length === 0 && step !== "success") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className={`text-lg mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Giỏ hàng trống.</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? "bg-green-500/20" : "bg-green-100"}`}>
            <Check className={`w-16 h-16 ${isDark ? "text-green-400" : "text-green-600"}`} />
          </div>
          <h2 className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Đặt hàng thành công!</h2>
          <p className={`mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {paymentMethod === "cod"
              ? "Đơn hàng sẽ được giao COD. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất."
              : "Cảm ơn bạn đã thanh toán. Đơn hàng sẽ được xử lý ngay."}
          </p>
          <div className={`animate-pulse ${isDark ? "text-purple-400" : "text-purple-600"}`}>
            Đang chuyển hướng...
          </div>
        </div>
      </div>
    );
  }

  const handleConfirmPaid = async () => {
    setIsConfirming(true);
    try {
      await confirmPayment();
      await loadCart();
      toast.success("Đã ghi nhận xác nhận thanh toán. Đơn hàng sẽ được duyệt bởi admin.");
      setStep("success");
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      toast.error(err?.message || "Xác nhận thất bại. Vui lòng thử lại.");
    } finally {
      setIsConfirming(false);
    }
  };

  const transferContentCode = orderId != null ? `ORDER${orderId}` : "";
  const displayAmount = paymentMethod === "installment" ? totalWithInterest : subtotal;
  const bankInfo = qrPaymentData as Record<string, unknown> | null;

  const VIETQR_ACCOUNT_NO = bankInfo?.accountNo ?? bankInfo?.account_no ?? "9931330034";
  const VIETQR_ACCOUNT_NAME = bankInfo?.accountName ?? bankInfo?.account_name ?? "TRAN ANH TU";
  const VIETQR_BANK_NAME = bankInfo?.bankName ?? bankInfo?.bank_name ?? "VCB – Vietcombank";

  // Input style helper
  const inputClass = isDark
    ? "w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-gray-500"
    : "w-full px-4 py-3 bg-white border border-pink-400 rounded-lg focus:outline-none focus:border-pink-500 text-black placeholder-gray-400";

  // Section card style
  const sectionCard = isDark
    ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6"
    : "bg-white rounded-xl border border-pink-300 p-6 shadow-sm";

  // Label style
  const labelClass = isDark ? "text-sm font-semibold mb-2 text-white" : "text-sm font-semibold mb-2 text-black";
  const labelPinkClass = isDark ? "text-sm font-semibold mb-2 text-red-400" : "text-sm font-semibold mb-2 text-red-500";

  // Text colors
  const textPrimary = isDark ? "text-white" : "text-black";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const textPurple = isDark ? "text-purple-400" : "text-purple-600";
  const textGreen = isDark ? "text-green-400" : "text-green-600";
  const borderColor = isDark ? "border-purple-500/30" : "border-pink-300";
  const selectedBorder = isDark ? "rgb(168, 85, 247)" : "rgb(236, 72, 153)";
  const selectedBg = isDark ? "rgba(168, 85, 247, 0.1)" : "rgba(236, 72, 153, 0.1)";

  if (step === "qr") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[{ label: "Giỏ hàng", to: "/cart" }, { label: "Thanh toán" }]}
        />

        <div className="max-w-5xl mx-auto">
          <h1 className={`text-2xl font-bold mb-6 text-center ${textPrimary}`}>
            Mã QR chuyển khoản ngân hàng
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8 items-start">
            {/* Trái: QR + thông tin chuyển khoản */}
            <div className={`rounded-xl p-6 lg:p-8 ${isDark ? "bg-white/5 backdrop-blur-sm border border-white/10" : "bg-white border border-pink-300 shadow-sm"}`}>
              <div className="flex items-center gap-3 mb-6">
                <span className={`text-lg font-semibold ${textPurple}`}>VietQR</span>
              </div>

              {qrUrl ? (
                <>
                  <div className="flex justify-center mb-8">
                    <div className={`w-[240px] h-[240px] rounded-xl overflow-hidden bg-white flex-shrink-0 ${isDark ? "border border-white/20" : "border border-pink-300"}`}>
                      <img
                        src={qrUrl}
                        alt="Mã QR chuyển khoản"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <p className={`text-center text-sm mb-8 ${textSecondary}`}>
                    Quét mã bằng app ngân hàng hoặc ví điện tử (napas 247)
                  </p>

                  <h2 className={`text-lg font-semibold mb-3 ${textPrimary}`}>
                    Thông tin chuyển khoản ngân hàng
                  </h2>
                  {transferContentCode && (
                    <p className="text-red-500 text-sm font-medium mb-4">
                      Vui lòng chuyển đúng nội dung <strong>{transferContentCode}</strong> để chúng tôi có thể xác nhận thanh toán.
                    </p>
                  )}
                  <div className={`overflow-hidden rounded-lg border ${isDark ? "border-white/10" : "border-pink-200"}`}>
                    <table className="w-full text-sm">
                      <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-pink-100"}`}>
                        <tr className={isDark ? "bg-white/5" : "bg-pink-50"}>
                          <td className={`py-3 px-4 w-[140px] ${textSecondary}`}>Tên tài khoản</td>
                          <td className={`py-3 px-4 font-medium ${textPrimary}`}>
                            {VIETQR_ACCOUNT_NAME}
                          </td>
                        </tr>
                        <tr>
                          <td className={`py-3 px-4 ${textSecondary}`}>Số tài khoản</td>
                          <td className={`py-3 px-4 font-medium ${textPrimary}`}>
                            {VIETQR_ACCOUNT_NO}
                          </td>
                        </tr>
                        <tr className={isDark ? "bg-white/5" : "bg-pink-50"}>
                          <td className={`py-3 px-4 ${textSecondary}`}>Ngân hàng</td>
                          <td className={`py-3 px-4 ${textPrimary}`}>
                            {VIETQR_BANK_NAME}
                          </td>
                        </tr>
                        <tr>
                          <td className={`py-3 px-4 ${textSecondary}`}>Số tiền</td>
                          <td className={`py-3 px-4 font-semibold ${textPrimary}`}>
                            {displayAmount.toLocaleString("vi-VN")} ₫
                          </td>
                        </tr>
                        <tr className={isDark ? "bg-white/5" : "bg-pink-50"}>
                          <td className={`py-3 px-4 ${textSecondary}`}>Nội dung</td>
                          <td className={`py-3 px-4 font-mono font-semibold ${textPrimary}`}>
                            {transferContentCode || "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className={`flex flex-col items-center justify-center py-16 ${textSecondary}`}>
                  <Loader className="w-12 h-12 animate-spin mb-4" />
                  <span>Đang tạo mã QR...</span>
                </div>
              )}
            </div>

            {/* Phải: Thông tin đơn hàng */}
            <div className={`rounded-xl p-6 lg:sticky lg:top-24 ${isDark ? "bg-white/5 backdrop-blur-sm border border-white/10" : "bg-white border border-pink-300 shadow-sm"}`}>
              <p className={`font-medium mb-5 ${textGreen}`}>
                Cảm ơn bạn. Đơn hàng của bạn đã được nhận.
              </p>
              <ul className="space-y-3 text-sm mb-6">
                <li className="flex justify-between">
                  <span className={textSecondary}>Mã đơn hàng</span>
                  <span className={`font-semibold ${textPrimary}`}>#{orderId ?? "—"}</span>
                </li>
                <li className="flex justify-between">
                  <span className={textSecondary}>Ngày</span>
                  <span className={textPrimary}>{new Date().toLocaleDateString("vi-VN")}</span>
                </li>
                <li className="flex justify-between">
                  <span className={textSecondary}>Email</span>
                  <span className={`truncate max-w-[160px] ${textPrimary}`} title={formData.email}>{formData.email || "—"}</span>
                </li>
                <li className={`flex justify-between pt-3 border-t ${isDark ? "border-white/10" : "border-pink-200"}`}>
                  <span className={textSecondary}>Tổng cộng</span>
                  <span className={`font-bold text-lg ${textPrimary}`}>
                    {displayAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className={textSecondary}>Phương thức thanh toán</span>
                  <span className={textPrimary}>
                    {paymentMethod === "full"
                      ? "Chuyển khoản ngân hàng (Quét mã QR)"
                      : "Trả góp (Quét mã QR)"}
                  </span>
                </li>
              </ul>
              {qrUrl && (
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  disabled={isConfirming}
                  style={{
                    background: isDark
                      ? "linear-gradient(to right, rgb(16, 185, 129), rgb(6, 182, 212))"
                      : "linear-gradient(to right, rgb(16, 185, 129), rgb(6, 182, 212))",
                    color: "white",
                    boxShadow: isDark
                      ? "0 4px 14px rgba(16, 185, 129, 0.4)"
                      : "0 4px 14px rgba(16, 185, 129, 0.5)",
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all`}
                >
                  {isConfirming ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin inline-block mr-2 align-middle" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận đã thanh toán"
                  )}
                </button>
              )}
            </div>
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

      <h1 className={`text-3xl md:text-4xl font-bold mb-8 ${isDark ? "bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" : "text-black"}`}>
        Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div
              className={`flex items-center gap-2 ${step === "info" ? textPurple : textSecondary}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "info"
                    ? "bg-purple-500/30 border-2 border-purple-400"
                    : isDark ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="font-semibold hidden sm:inline">Thông tin</span>
            </div>
            <div className={`flex-1 h-px ${isDark ? "bg-purple-500/30" : "bg-pink-300"}`} />
            <div
              className={`flex items-center gap-2 ${step === "payment" ? textPurple : textSecondary}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "payment"
                    ? "bg-purple-500/30 border-2 border-purple-400"
                    : isDark ? "bg-gray-700" : "bg-gray-200"
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
              <div className={sectionCard}>
                <h2 className={`text-xl font-bold mb-6 ${textPurple}`}>
                  Chọn sản phẩm
                </h2>
                <div className="space-y-4">
                  <label className={`flex items-center gap-3 cursor-pointer ${textPrimary}`}>
                    <input
                      type="checkbox"
                      checked={selectedCartItems.length === cart.length}
                      onChange={handleSelectAll}
                      className={`w-4 h-4 rounded ${isDark ? "" : "accent-pink-500"}`}
                    />
                    <span className="font-semibold">Chọn tất cả</span>
                  </label>

                  {cart.map((item) => (
                    <label
                      key={item.cart_item_id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isDark ? "hover:bg-purple-500/10" : "hover:bg-pink-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCartItems.includes(item.cart_item_id)}
                        onChange={() => handleSelectItem(item.cart_item_id)}
                        className={`w-4 h-4 rounded ${isDark ? "" : "accent-pink-500"}`}
                      />
                      <div className="flex-1">
                        <p className={`font-semibold ${textPrimary}`}>{item.product.name}</p>
                        <p className={`text-sm ${textSecondary}`}>
                          {item.quantity} x{" "}
                          {item.product.price.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                      <span className={`font-semibold ${textPurple}`}>
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
              <div className={sectionCard}>
                <h2 className={`text-xl font-bold mb-6 ${textPurple}`}>
                  Thông tin giao hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>
                      Họ và tên <span className={labelPinkClass}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        Số điện thoại <span className={labelPinkClass}>*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className={inputClass}
                        placeholder="0901234567"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={inputClass}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Địa chỉ <span className={labelPinkClass}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Số nhà, tên đường"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        Thành phố/Tỉnh
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className={inputClass}
                        placeholder="TP. Hồ Chí Minh"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Quận/Huyện
                      </label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) =>
                          setFormData({ ...formData, district: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Quận 1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Ghi chú
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className={inputClass}
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
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"}`}
                >
                  <ArrowLeft className="w-5 h-5 inline mr-2" />
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </form>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              {/* Payment Method Selection */}
              <div className={sectionCard}>
                <h2 className={`text-xl font-bold mb-6 ${textPurple}`}>
                  Phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  <label
                    className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: paymentMethod === "full" ? selectedBorder : (isDark ? "rgba(168,85,247,0.3)" : "rgba(236,72,153,0.3)"),
                      backgroundColor: paymentMethod === "full" ? selectedBg : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      value="full"
                      checked={paymentMethod === "full"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className={`w-4 h-4 ${isDark ? "" : "accent-pink-500"}`}
                    />
                    <div>
                      <p className={`font-semibold ${textPrimary}`}>Thanh toán toàn bộ</p>
                      <p className={`text-sm ${textSecondary}`}>
                        Thanh toán một lần bằng mã QR / chuyển khoản
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: paymentMethod === "installment" ? selectedBorder : (isDark ? "rgba(168,85,247,0.3)" : "rgba(236,72,153,0.3)"),
                      backgroundColor: paymentMethod === "installment" ? selectedBg : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      value="installment"
                      checked={paymentMethod === "installment"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className={`w-4 h-4 ${isDark ? "" : "accent-pink-500"}`}
                    />
                    <div>
                      <p className={`font-semibold ${textPrimary}`}>Trả góp</p>
                      <p className={`text-sm ${textSecondary}`}>
                        Chia đơn hàng thành nhiều kỳ thanh toán
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: paymentMethod === "cod" ? selectedBorder : (isDark ? "rgba(168,85,247,0.3)" : "rgba(236,72,153,0.3)"),
                      backgroundColor: paymentMethod === "cod" ? selectedBg : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className={`w-4 h-4 ${isDark ? "" : "accent-pink-500"}`}
                    />
                    <div>
                      <p className={`font-semibold ${textPrimary}`}>Thanh toán khi nhận hàng (COD)</p>
                      <p className={`text-sm ${textSecondary}`}>
                        Thanh toán sau khi nhận hàng
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Installment Plans */}
              {paymentMethod === "installment" && (
                <div className={sectionCard}>
                  <h2 className={`text-xl font-bold mb-6 ${textPurple}`}>
                    Chọn kỳ hạn
                  </h2>
                  <div className="space-y-3">
                    {INSTALLMENT_PLANS.map((plan) => (
                      <label
                        key={plan.id}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                        style={{
                          borderColor: installmentPlan === plan.id ? selectedBorder : (isDark ? "rgba(168,85,247,0.3)" : "rgba(236,72,153,0.3)"),
                          backgroundColor: installmentPlan === plan.id ? selectedBg : undefined,
                        }}
                      >
                        <input
                          type="radio"
                          value={plan.id}
                          checked={installmentPlan === plan.id}
                          onChange={(e) => setInstallmentPlan(e.target.value)}
                          className={`w-4 h-4 ${isDark ? "" : "accent-pink-500"}`}
                        />
                        <div className="flex-1">
                          <p className={`font-semibold ${textPrimary}`}>{plan.name}</p>
                          <p className={`text-sm ${textSecondary}`}>
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
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"}`}
                >
                  <ArrowLeft className="w-5 h-5 inline mr-2" />
                  Quay lại
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 text-white"
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
          <div className={`rounded-xl p-6 sticky top-24 ${sectionCard}`}>
            <h2 className={`text-2xl font-bold mb-6 ${textPurple}`}>
              Tổng đơn hàng
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className={textSecondary}>Tạm tính:</span>
                <span className={`font-semibold ${textPrimary}`}>
                  {selectedAmount.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex justify-between">
                <span className={textSecondary}>Phí vận chuyển:</span>
                <span className={`font-semibold ${textPrimary}`}>
                  {shipping === 0 ? (
                    <span className={textGreen}>Miễn phí</span>
                  ) : (
                    `${shipping.toLocaleString("vi-VN")}₫`
                  )}
                </span>
              </div>
              {paymentMethod === "installment" && (
                <div className="flex justify-between">
                  <span className={textSecondary}>Lãi suất:</span>
                  <span className={`font-semibold ${textPrimary}`}>
                    {(totalWithInterest - subtotal).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}
              {/* Promotion UI */}
              <div className={`pt-4 border-t ${borderColor}`}>
                <label className={labelClass}>Mã khuyến mãi</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={promotionInput}
                    onChange={(e) => setPromotionInput(e.target.value)}
                    placeholder="Nhập mã giảm giá..."
                    className={`flex-1 px-3 py-2 rounded-lg focus:outline-none text-sm ${inputClass.replace("w-full px-4 py-3", "")}`}
                  />
                  <button
                    onClick={handleApplyPromotion}
                    disabled={isApplyingPromo}
                    className={`px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center text-white`}
                  >
                     {isApplyingPromo ? <Loader className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                  </button>
                </div>
                {appliedPromotion && (
                  <div className={`text-sm font-medium ${textGreen}`}>
                    Đã áp dụng mã {appliedPromotion.code} (-{appliedPromotion.discount_percent}%)
                  </div>
                )}
              </div>

              {appliedPromotion && (
                <div className={`flex justify-between ${textGreen}`}>
                  <span>Giảm giá:</span>
                  <span className="font-semibold">
                    -{discountAmount.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}

              <div className={`pt-4 border-t ${borderColor}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className={`text-3xl font-bold ${textPurple}`}>
                    {(paymentMethod === "installment"
                      ? totalWithInterest
                      : subtotal
                    ).toLocaleString("vi-VN")}
                    ₫
                  </span>
                </div>
                {paymentMethod === "installment" && (
                  <div className={`text-sm ${textPurple.replace("400", "300")}`}>
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
