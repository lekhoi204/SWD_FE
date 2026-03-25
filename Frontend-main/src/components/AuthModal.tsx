import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { X, Eye, EyeOff, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function AuthModal() {
  const {
    authModal,
    closeModal,
    openLogin,
    openRegister,
    login,
    loginWithGoogle,
    register,
  } = useAuth();
  const { isDark } = useTheme();

  if (!authModal) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
        }}
        onClick={closeModal}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "440px",
          borderRadius: "20px",
          background: isDark
            ? "linear-gradient(160deg, #15102e 0%, #1a1348 50%, #111b3a 100%)"
            : "#ffffff",
          border: isDark
            ? "1px solid rgba(139,92,246,0.25)"
            : "1px solid #e5e7eb",
          boxShadow: isDark
            ? "0 24px 48px rgba(0,0,0,0.5)"
            : "0 24px 48px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px 0 28px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: isDark ? "#fff" : "#111827",
              margin: 0,
            }}
          >
            {authModal === "login"
              ? "ĐĂNG NHẬP TÀI KHOẢN"
              : "TẠO TÀI KHOẢN MỚI"}
          </h2>
          <button
            onClick={closeModal}
            style={{
              background: "none",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              borderRadius: "8px",
              color: isDark ? "#9ca3af" : "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            margin: "20px 28px 0 28px",
            borderRadius: "12px",
            overflow: "hidden",
            background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
            padding: "4px",
          }}
        >
          <button
            onClick={openLogin}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              background:
                authModal === "login"
                  ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                  : "transparent",
              color:
                authModal === "login" ? "#fff" : isDark ? "#9ca3af" : "#6b7280",
              boxShadow:
                authModal === "login"
                  ? "0 2px 8px rgba(124,58,237,0.3)"
                  : "none",
            }}
          >
            Đăng nhập
          </button>
          <button
            onClick={openRegister}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              background:
                authModal === "register"
                  ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                  : "transparent",
              color:
                authModal === "register"
                  ? "#fff"
                  : isDark
                    ? "#9ca3af"
                    : "#6b7280",
              boxShadow:
                authModal === "register"
                  ? "0 2px 8px rgba(124,58,237,0.3)"
                  : "none",
            }}
          >
            Đăng ký
          </button>
        </div>

        {/* Form Content */}
        <div style={{ padding: "24px 28px 28px 28px" }}>
          {authModal === "login" ? (
            <LoginForm
              isDark={isDark}
              onLogin={login}
              onGoogleLogin={loginWithGoogle}
              onSwitch={openRegister}
            />
          ) : (
            <RegisterForm
              isDark={isDark}
              onRegister={register}
              onSwitch={openLogin}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function getInputStyle(isDark: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px 16px 14px 44px",
    borderRadius: "12px",
    border: isDark ? "1.5px solid rgba(139,92,246,0.2)" : "1.5px solid #e5e7eb",
    background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
    color: isDark ? "#fff" : "#111827",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box" as const,
  };
}

const iconWrap: React.CSSProperties = {
  position: "absolute",
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "#9ca3af",
  display: "flex",
};

const eyeWrap: React.CSSProperties = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "#9ca3af",
  display: "flex",
};

function useFocusHandlers(isDark: boolean) {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "#8b5cf6";
      e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = isDark ? "rgba(139,92,246,0.2)" : "#e5e7eb";
      e.target.style.boxShadow = "none";
    },
  };
}

function LoginForm({
  isDark,
  onLogin,
  onGoogleLogin,
  onSwitch,
}: {
  isDark: boolean;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onGoogleLogin: () => Promise<boolean>;
  onSwitch: () => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const inputStyle = getInputStyle(isDark);
  const focus = useFocusHandlers(isDark);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);
    const ok = await onLogin(email, password);
    setLoading(false);
    if (ok) toast.success("Đăng nhập thành công!");
    if (ok) {
      try {
        const raw = localStorage.getItem("user");
        const u = raw ? JSON.parse(raw) : null;
        if (u && u.role) {
          if (u.role === "admin") navigate("/admin");
          else if (u.role === "staff") navigate("/staff");
          else if (u.role === "manager") navigate("/manager");
          // For customers and others, we just stay on the current page.
          // The modal is already closed by AuthContext's login function.
        }
      } catch (_) {
        // Fallback to home if something goes wrong
        navigate("/");
      }
    }
  };

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    const ok = await onGoogleLogin();
    setGoogleLoading(false);
    if (ok) toast.success("Đăng nhập thành công!");
    if (ok) {
      try {
        const raw = localStorage.getItem("user");
        const u = raw ? JSON.parse(raw) : null;
        if (u && u.role) {
          if (u.role === "admin") navigate("/admin");
          else if (u.role === "staff") navigate("/staff");
          else if (u.role === "manager") navigate("/manager");
        }
      } catch (_) {
        navigate("/");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Email */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <span style={iconWrap}>
          <Mail style={{ width: 18, height: 18 }} />
        </span>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          {...focus}
          required
        />
      </div>

      {/* Password */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <span style={iconWrap}>
          <Lock style={{ width: 18, height: 18 }} />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, paddingRight: "44px" }}
          {...focus}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={eyeWrap}
        >
          {showPassword ? (
            <EyeOff style={{ width: 18, height: 18 }} />
          ) : (
            <Eye style={{ width: 18, height: 18 }} />
          )}
        </button>
      </div>

      {/* Remember + Forgot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          fontSize: "13px",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            color: isDark ? "#9ca3af" : "#6b7280",
          }}
        >
          <input
            type="checkbox"
            style={{ accentColor: "#8b5cf6", width: 15, height: 15 }}
          />
          Ghi nhớ đăng nhập
        </label>
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#8b5cf6",
            fontWeight: 500,
            fontSize: "13px",
          }}
        >
          Quên mật khẩu?
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          letterSpacing: "0.5px",
          marginBottom: "20px",
        }}
      >
        {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
      </button>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          color: isDark ? "#4b5563" : "#d1d5db",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "currentColor" }} />
        <span
          style={{ fontSize: "12px", letterSpacing: "1px", fontWeight: 500 }}
        >
          hoặc đăng nhập bằng
        </span>
        <div style={{ flex: 1, height: "1px", background: "currentColor" }} />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading || googleLoading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid #e5e7eb",
          background: isDark ? "rgba(255,255,255,0.04)" : "#f9fafb",
          color: isDark ? "#fff" : "#374151",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading || googleLoading ? "not-allowed" : "pointer",
          opacity: loading || googleLoading ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googleLoading ? "Đang kết nối Google..." : "Đăng nhập với Google"}
      </button>

      {/* Switch */}
      <p
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: isDark ? "#9ca3af" : "#6b7280",
          margin: 0,
        }}
      >
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#8b5cf6",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "underline",
          }}
        >
          Đăng ký ngay!
        </button>
      </p>
    </form>
  );
}

function RegisterForm({
  isDark,
  onRegister,
  onSwitch,
}: {
  isDark: boolean;
  onRegister: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<boolean>;
  onSwitch: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputStyle = getInputStyle(isDark);
  const focus = useFocusHandlers(isDark);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    const ok = await onRegister(name, email, password, phone);
    setLoading(false);
    if (ok) toast.success("Đăng ký thành công!");
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Name */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <span style={iconWrap}>
          <UserIcon style={{ width: 18, height: 18 }} />
        </span>
        <input
          type="text"
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          {...focus}
          required
        />
      </div>

      {/* Email */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <span style={iconWrap}>
          <Mail style={{ width: 18, height: 18 }} />
        </span>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          {...focus}
          required
        />
      </div>

      {/* Phone */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <span style={iconWrap}>
          <UserIcon style={{ width: 18, height: 18 }} />
        </span>
        <input
          type="tel"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
          {...focus}
          required
        />
      </div>

      {/* Password */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <span style={iconWrap}>
          <Lock style={{ width: 18, height: 18 }} />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, paddingRight: "44px" }}
          {...focus}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={eyeWrap}
        >
          {showPassword ? (
            <EyeOff style={{ width: 18, height: 18 }} />
          ) : (
            <Eye style={{ width: 18, height: 18 }} />
          )}
        </button>
      </div>

      {/* Confirm Password */}
      <div style={{ position: "relative", marginBottom: "18px" }}>
        <span style={iconWrap}>
          <Lock style={{ width: 18, height: 18 }} />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
          {...focus}
          required
        />
      </div>

      {/* Terms */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          cursor: "pointer",
          marginBottom: "20px",
          fontSize: "13px",
          lineHeight: "1.5",
          color: isDark ? "#9ca3af" : "#6b7280",
        }}
      >
        <input
          type="checkbox"
          required
          style={{
            accentColor: "#8b5cf6",
            width: 15,
            height: 15,
            marginTop: 2,
          }}
        />
        <span>
          Tôi đồng ý với{" "}
          <span
            style={{ color: "#8b5cf6", fontWeight: 500, cursor: "pointer" }}
          >
            Điều khoản dịch vụ
          </span>{" "}
          và{" "}
          <span
            style={{ color: "#8b5cf6", fontWeight: 500, cursor: "pointer" }}
          >
            Chính sách bảo mật
          </span>
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          letterSpacing: "0.5px",
          marginBottom: "20px",
        }}
      >
        {loading ? "Đang tạo tài khoản..." : "ĐĂNG KÝ"}
      </button>

      {/* Switch */}
      <p
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: isDark ? "#9ca3af" : "#6b7280",
          margin: 0,
        }}
      >
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#8b5cf6",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "underline",
          }}
        >
          Đăng nhập
        </button>
      </p>
    </form>
  );
}
