import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader, Home, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { confirmPayment } from "@/api/payments";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadCart } = useCart();
  const { isDark } = useTheme();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const vnpTxnRef = searchParams.get("vnp_TxnRef");
  const vnpAmount = searchParams.get("vnp_Amount");
  const vnpOrderInfo = searchParams.get("vnp_OrderInfo");
  const successParam = searchParams.get("success");

  useEffect(() => {
    const handlePaymentResult = async () => {
      const isSuccess = vnpResponseCode === "00" || successParam === "true";

      if (isSuccess) {
        try {
          await confirmPayment("VNPay payment confirmed automatically");
        } catch (err) {
          console.log("Auto confirm skipped:", err);
        }
        setStatus("success");
        toast.success("Thanh toán thành công!");
        await loadCart();
      } else {
        setStatus("failed");
        toast.error("Thanh toán thất bại hoặc bị hủy.");
      }
    };
    handlePaymentResult();
  }, [vnpResponseCode, successParam, loadCart]);

  const bg = isDark ? '#0a051d' : '#f9fafb';
  const text = isDark ? '#fff' : '#111827';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';
  const border = isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.2)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {status === "loading" && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ width: '100px', height: '100px', margin: '0 auto 32px', position: 'relative' }}>
               <div style={{ position: 'absolute', inset: 0, border: `4px solid ${isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.1)'}`, borderRadius: '50%' }}></div>
               <div style={{ position: 'absolute', inset: 0, border: '4px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
               <Loader size={40} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#8b5cf6' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px', color }}>Đang xác thực giao dịch</h2>
            <p style={{ color: textMuted, fontSize: '15px' }}>Vui lòng không đóng trình duyệt lúc này...</p>
          </div>
        )}

        {status === "success" && (
          <div style={{ animation: 'zoomIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '96px', height: '96px', background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)', border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(16,185,129,0.3)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.1)' }}>
                <CheckCircle size={48} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px', color }}>Thanh toán thành công!</h2>
              <p style={{ color: textMuted, fontSize: '15px', lineHeight: 1.6 }}>Cảm ơn bạn đã tin tưởng. Đơn hàng của bạn đã được tiếp nhận và sớm được xử lý.</p>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '24px', padding: '24px', marginBottom: '32px', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>Thông tin giao dịch</p>
              <div style={{ display: 'grid', gap: '12px' }}>
                {vnpTxnRef && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: textMuted }}>Mã giao dịch</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6', fontFamily: 'monospace' }}>#{vnpTxnRef}</span>
                  </div>
                )}
                {vnpAmount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: textMuted }}>Số tiền thanh toán</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{(parseInt(vnpAmount) / 100).toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                {vnpOrderInfo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '13px', color: textMuted, marginTop: '2px' }}>Nội dung</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'right', maxWidth: '200px', color: isDark ? '#d1d5db' : '#374151' }}>{decodeURIComponent(vnpOrderInfo).replace(/\+/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigate("/")} style={{ flex: 1, padding: '16px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: isDark ? 'none' : '1px solid #e5e7eb', borderRadius: '16px', color: isDark ? '#9ca3af' : '#374151', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                <Home size={18} /> Trang chủ
              </button>
              <button onClick={() => navigate("/orders")} style={{ flex: 1, padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(124,58,237,0.3)', transition: 'transform 0.2s' }}>
                <Package size={18} /> Đơn hàng <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div style={{ animation: 'shake 0.5s ease-in-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '96px', height: '96px', background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)', border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(239,68,68,0.3)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.1)' }}>
                <XCircle size={48} color="#f87171" />
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px', color }}>Thanh toán thất bại</h2>
              <p style={{ color: textMuted, fontSize: '15px', lineHeight: 1.6 }}>Giao dịch đã bị từ chối hoặc bị hủy bởi người dùng.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => navigate("/")} style={{ flex: 1, padding: '16px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: isDark ? 'none' : '1px solid #e5e7eb', borderRadius: '16px', color: isDark ? '#9ca3af' : '#374151', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Home size={18} /> Trang chủ
              </button>
              <button onClick={() => navigate("/checkout")} style={{ flex: 1, padding: '16px', background: '#ef4444', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(239,68,68,0.3)' }}>
                Thử lại thanh toán
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      `}</style>
    </div>
  );
}
