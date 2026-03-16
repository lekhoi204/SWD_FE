import { useState, useEffect } from "react";
import { QrCode, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getOnlineQr, getInstallmentQr, confirmPayment } from "@/api/payments";
import { getMyOrdersApi } from "@/api/orders";
import type { OrderDetail } from "@/types";

export function PaymentPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { loadCart, clearCart } = useCart();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [qrData, setQrData] = useState<any | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      loadOrders();
    }
  }, [user?.user_id]);

  const loadOrders = async () => {
    if (!user?.user_id) return;
    try {
      setIsLoading(true);
      const data = await getMyOrdersApi();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Không thể tải đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQr = async (
    order: OrderDetail,
    type: "online" | "installment",
  ) => {
    try {
      setIsLoading(true);
      let qrData;
      if (type === "online") {
        qrData = await getOnlineQr();
      } else {
        qrData = await getInstallmentQr(3); // Default to 3 months
      }
      setQrData(qrData);
      setSelectedOrder(order);
      setShowQr(true);
    } catch (error: any) {
      console.error("Generate QR error:", error);
      toast.error(error.message || "Không thể tạo mã QR");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    try {
      setIsLoading(true);
      await confirmPayment("Đã thanh toán thành công");
      toast.success("Đã xác nhận thanh toán");
      setShowQr(false);
      // Clear cart and reload orders after successful payment
      await clearCart();
      await loadOrders();
    } catch (error: any) {
      console.error("Confirm payment error:", error);
      toast.error(error.message || "Không thể xác nhận thanh toán");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
      case "Chờ xử lý":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "Processing":
      case "Đang xử lý":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "Completed":
      case "Hoàn Thành":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "Cancelled":
      case "Bị hủy":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
      case "Hoàn Thành":
        return <CheckCircle className="w-5 h-5" />;
      case "Cancelled":
      case "Bị hủy":
        return <AlertCircle className="w-5 h-5" />;
      case "Pending":
      case "Chờ xử lý":
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Vui lòng đăng nhập để xem thanh toán</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Thanh toán" }]} />

      <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Quản lý thanh toán
      </h1>

      {isLoading && orders.length === 0 ? (
        <div className="text-center py-16">
          <Loader className="w-12 h-12 animate-spin mx-auto text-purple-400" />
          <p className="text-gray-400 mt-4">Đang tải...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Chưa có yêu cầu thanh toán nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Đơn hàng #{order.order_id}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Ngày:{" "}
                    {new Date(order.order_date).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getStatusColor(
                    order.status,
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="font-semibold">{order.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm">Loại thanh toán</p>
                  <p className="font-semibold text-lg">
                    {order.payment_type === "One-time"
                      ? "Toàn bộ"
                      : order.payment_type === "Installment"
                        ? "Trả góp"
                        : "COD"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tổng tiền</p>
                  <p className="font-semibold text-lg text-purple-400">
                    {order.total_amount.toLocaleString("vi-VN")}₫
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Địa chỉ</p>
                  <p className="font-semibold text-sm">
                    {order.shipping_address}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Phương thức</p>
                  <p className="font-semibold">
                    {order.payment_method || "Chưa chọn"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {order.status === "Pending" &&
                  order.payment_type === "One-time" && (
                    <button
                      onClick={() => handleGenerateQr(order, "online")}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-5 h-5" />
                      Thanh toán (QR)
                    </button>
                  )}
                {order.status === "Pending" &&
                  order.payment_type === "Installment" && (
                    <button
                      onClick={() => handleGenerateQr(order, "installment")}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-5 h-5" />
                      Thanh toán kỳ (QR)
                    </button>
                  )}
                <button className="flex-1 px-6 py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {showQr && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-purple-900/95 to-purple-800/95 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center text-purple-400">
              Quét mã QR để thanh toán
            </h2>

            {qrData && (
              <>
                <div className="mb-6">
                  <img
                    src={qrData.qr_url}
                    alt="VietQR"
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                <div className="space-y-3 mb-6 p-4 bg-black/20 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số tiền:</span>
                    <span className="font-semibold">
                      {(
                        qrData.total_amount ?? selectedOrder.total_amount
                      ).toLocaleString("vi-VN")}
                      ₫
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Đơn hàng:</span>
                    <span className="font-semibold">
                      #{selectedOrder.order_id}
                    </span>
                  </div>
                  {qrData.payment_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment ID:</span>
                      <span className="font-semibold">{qrData.payment_id}</span>
                    </div>
                  )}
                  {qrData.bank_info && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ngân hàng:</span>
                      <span className="font-semibold">
                        {qrData.bank_info.bank_name} •{" "}
                        {qrData.bank_info.account_no}
                      </span>
                    </div>
                  )}
                  {qrData.months && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Kỳ:</span>
                      <span className="font-semibold">
                        {qrData.months} tháng
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <p className="text-sm text-gray-400 text-center mb-6">
              Quét mã QR này bằng ứng dụng ngân hàng hoặc ví điện tử
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQr(false)}
                className="flex-1 py-2 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Xác nhận thanh toán"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
