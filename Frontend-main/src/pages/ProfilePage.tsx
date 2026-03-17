import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserApi } from "@/api/users";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  if (!user) return <div>Đang tải...</div>;

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserApi(user.user_id, { name, phone, address });
      alert("Cập nhật thành công");
    } catch (err) {
      alert("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Thông tin tài khoản</h1>
      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Tên</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Email</label>
        <input
          value={user.email}
          disabled
          style={{ width: "100%", padding: 8, background: "#f3f4f6" }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Số điện thoại
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Địa chỉ</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ padding: "10px 16px", borderRadius: 8 }}
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button
          onClick={logout}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "#ef4444",
            color: "#fff",
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
