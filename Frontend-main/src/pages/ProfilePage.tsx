import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Loader,
  Lock,
  Camera,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { updateUserApi } from "@/api/users";
import { uploadImage } from "@/api/uploads";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { User } from "@/types";

type EditMode = "profile" | "password" | null;

export function ProfilePage() {
  const { isDark } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState<EditMode>(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<User | null>(user || null);

  // Profile edit form
  const [formName, setFormName] = useState(user?.name || "");
  const [formEmail, setFormEmail] = useState(user?.email || "");
  const [formPhone, setFormPhone] = useState(user?.phone || "");
  const [formAddress, setFormAddress] = useState(user?.address || "");

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setProfileData(user);
      setFormName(user.name);
      setFormEmail(user.email);
      setFormPhone(user.phone || "");
      setFormAddress(user.address || "");
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-16 h-16 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Cần đăng nhập</h2>
          <p className={`mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Vui lòng đăng nhập để xem hồ sơ cá nhân
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!user || !formName.trim() || !formEmail.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên và email");
      return;
    }

    try {
      setLoading(true);
      const updatedUser = await updateUserApi(user.user_id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
      });

      // Update auth context + local state from backend response
      updateUser(updatedUser);
      setProfileData(updatedUser);
      setEditMode(null);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cập nhật thất bại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setLoading(true);
      const updatedUser = await updateUserApi(user.user_id, {
        password: newPassword,
      });

      // update auth user data returned by backend
      updateUser(updatedUser);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditMode(null);
      toast.success("Thay đổi mật khẩu thành công");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Thay đổi mật khẩu thất bại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Đã đăng xuất thành công");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage(file);
      const updatedUser = await updateUserApi(user!.user_id, {
        avatar: imageUrl,
      });
      updateUser(updatedUser);
      setProfileData(updatedUser);
      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (error) {
      toast.error("Không thể tải ảnh lên, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "manager":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "staff":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    }
  };

  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return {
          label: "Hoạt động",
          className: isDark
            ? "bg-gradient-to-r from-green-700/20 to-emerald-700/20 text-green-400 border-green-400/60 ring-1 ring-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.22)]"
            : "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200 shadow-sm",
        };
      case "inactive":
        return {
          label: "Không hoạt động",
          className: isDark
            ? "bg-gray-500/20 text-gray-300 border-gray-500/30"
            : "bg-gray-100 text-gray-700 border-gray-200",
        };
      case "banned":
        return {
          label: "Bị khóa",
          className: isDark
            ? "bg-red-500/20 text-red-300 border-red-500/30"
            : "bg-red-100 text-red-700 border-red-200",
        };
      default:
        return {
          label: status || "Hoạt động",
          className: isDark
            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
            : "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200 shadow-sm",
        };
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "manager":
        return "Quản lý";
      case "staff":
        return "Nhân viên";
      default:
        return "Khách hàng";
    }
  };

  return (
    <div className="min-h-screen relative z-10">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: "Hồ sơ cá nhân" }]} />

        <div
          className={`max-w-4xl mx-auto rounded-2xl p-6 sm:p-8 ${isDark ? "border border-slate-600/50 shadow-2xl" : ""}`}
          style={isDark ? { backgroundColor: "#0c1428" } : undefined}
        >
          {/* Header Section */}
          <div
            className={`rounded-2xl overflow-hidden mb-8 ${
              isDark
                ? "border border-slate-600/50 shadow-xl"
                : "bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200"
            }`}
            style={isDark ? { backgroundColor: "#0f1729" } : undefined}
          >
            <div className="h-0" />

            <div className="px-6 sm:px-8 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 -mt-6 mb-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div
                    onClick={handleAvatarClick}
                    className={`group relative flex-shrink-0 w-40 h-40 rounded-xl flex items-center justify-center border-2 cursor-pointer overflow-hidden transition-all ${
                      isDark
                        ? "bg-slate-700/80 border-slate-500/50 hover:border-cyan-400/60"
                        : "bg-purple-100 border-purple-300 hover:border-purple-500"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />

                    {profileData?.avatar ? (
                      <>
                        <img
                          src={profileData.avatar}
                          alt={profileData.name}
                          className="w-full h-full object-cover rounded-xl group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <UserIcon className={`w-12 h-12 mx-auto mb-2 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Ảnh đại diện</p>
                      </div>
                    )}

                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                      {profileData?.name}
                    </h1>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-sm font-medium border ${getRoleBadgeColor(profileData?.role)}`}
                      >
                        {getRoleLabel(profileData?.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setEditMode("profile")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all hover:scale-105 shadow-lg border ${isDark ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/30 border-cyan-400/50" : "bg-cyan-500 hover:bg-cyan-600 text-black border-cyan-400/50 shadow-cyan-300/40"}`}
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-all hover:scale-105 ${isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-black"}`}
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div
                className={`rounded-xl p-6 ${
                  isDark
                    ? "border border-slate-600/50 shadow-xl"
                    : "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200"
                }`}
                style={isDark ? { backgroundColor: "#0f1729" } : undefined}
              >
                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-black"}`}>
                  <UserIcon className="w-5 h-5 text-cyan-500" />
                  Thông tin cá nhân
                </h2>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                      <Mail className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Email
                      </p>
                      <p className="font-semibold break-all text-lg text-black">
                        {profileData?.email}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
                      <Phone className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Số điện thoại
                      </p>
                      <p className="font-semibold text-lg text-black">
                        {profileData?.phone || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${isDark ? "bg-green-500/20" : "bg-green-100"}`}>
                      <MapPin className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Địa chỉ
                      </p>
                      <p className="font-semibold text-lg break-all text-black">
                        {profileData?.address || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${isDark ? "bg-orange-500/20" : "bg-orange-100"}`}>
                      <Calendar className={`w-5 h-5 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Ngày tạo tài khoản
                      </p>
                      <p className="font-semibold text-lg text-black">
                        {profileData?.created_at
                          ? formatDate(profileData.created_at)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div
                className={`rounded-xl p-6 ${
                  isDark
                    ? "border border-slate-600/50 shadow-xl"
                    : "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200"
                }`}
                style={isDark ? { backgroundColor: "#0f1729" } : undefined}
              >
                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-black"}`}>
                  <Lock className="w-5 h-5 text-cyan-500" />
                  Bảo mật
                </h2>

                <button
                  onClick={() => setEditMode("password")}
                  className={`w-full px-4 py-3 border rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2 ${isDark ? "bg-cyan-500/25 hover:bg-cyan-500/40 border-cyan-400/60 text-white shadow-cyan-500/20" : "bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-700"}`}
                >
                  <Lock className="w-4 h-4" />
                  Thay đổi mật khẩu
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div
                className={`rounded-xl p-6 ${
                  isDark
                    ? "border border-slate-600/50 shadow-xl"
                    : "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200"
                }`}
                style={isDark ? { backgroundColor: "#0f1729" } : undefined}
              >
                <h3 className={`font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Trạng thái tài khoản</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Trạng thái
                    </span>
                    <span
                      className={`inline-flex items-center justify-center px-4 py-1.5 min-h-[30px] rounded-full text-sm font-bold border transition-all ${getStatusConfig(profileData?.status).className}`}
                    >
                      {getStatusConfig(profileData?.status).label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Vai trò
                    </span>
                    <span className={`inline-flex items-center justify-center px-4 py-1.5 min-h-[30px] text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                      {getRoleLabel(profileData?.role)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div
                className={`rounded-xl p-6 ${
                  isDark
                    ? "border border-slate-600/50 shadow-xl"
                    : "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200"
                }`}
                style={isDark ? { backgroundColor: "#0f1729" } : undefined}
              >
                <h3 className={`font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Thao tác nhanh</h3>
                <div className="space-y-2">
                  <button
                    className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isDark
                        ? "bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200"
                        : "bg-purple-100 hover:bg-purple-200 border border-purple-300 text-black"
                    }`}
                  >
                    Đơn hàng của tôi
                  </button>
                  <button
                    className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isDark
                        ? "bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200"
                        : "bg-purple-100 hover:bg-purple-200 border border-purple-300 text-black"
                    }`}
                  >
                    Máy tính của tôi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editMode === "profile" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl w-full max-w-md ${isDark ? "border border-slate-600/50 shadow-xl" : "bg-white border border-purple-200"} p-6`}
            style={isDark ? { backgroundColor: "#0c1428" } : undefined}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-black"}`}>
                <Edit2 className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                Chỉnh sửa thông tin
              </h2>
              <button
                onClick={() => setEditMode(null)}
                className={`p-1 hover:bg-purple-500/20 rounded-lg transition-colors ${isDark ? "text-white" : "text-black hover:bg-gray-200"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Name */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-black"}`}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark
                      ? "bg-purple-900/50 border-purple-500/30 focus:border-purple-500"
                      : "bg-purple-50 border-purple-200 focus:border-purple-500 text-black"
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-black"}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark
                      ? "bg-purple-900/50 border-purple-500/30 focus:border-purple-500"
                      : "bg-purple-50 border-purple-200 focus:border-purple-500 text-black"
                  }`}
                  placeholder="Nhập email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-black"}`}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark
                      ? "bg-purple-900/50 border-purple-500/30 focus:border-purple-500"
                      : "bg-purple-50 border-purple-200 focus:border-purple-500 text-black"
                  }`}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              {/* Address */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-black"}`}>
                  Địa chỉ
                </label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors resize-none ${
                    isDark
                      ? "bg-purple-900/50 border-purple-500/30 focus:border-purple-500"
                      : "bg-purple-50 border-purple-200 focus:border-purple-500 text-black"
                  }`}
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(null)}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg border font-semibold hover:bg-purple-500/10 transition-colors disabled:opacity-50 ${isDark ? "border-gray-500/30 text-white hover:bg-white/10" : "border-gray-300 text-black hover:bg-gray-100"}`}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${isDark ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/30" : "bg-cyan-500 hover:bg-cyan-600 text-black border border-cyan-400 shadow-cyan-300/50"}`}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {editMode === "password" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl w-full max-w-md ${isDark ? "border border-slate-600/50 shadow-xl" : "bg-white border border-purple-200"} p-6`}
            style={isDark ? { backgroundColor: "#0c1428" } : undefined}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-black"}`}>
                <Lock className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                Thay đổi mật khẩu
              </h2>
              <button
                onClick={() => setEditMode(null)}
                className={`p-1 hover:bg-purple-500/20 rounded-lg transition-colors ${isDark ? "text-white" : "text-black hover:bg-gray-200"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Current Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-black"}`}>
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark
                      ? "bg-purple-900/50 border-purple-500/30 focus:border-purple-500"
                      : "bg-purple-50 border-purple-200 focus:border-purple-500 text-black"
                  }`}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              {/* New Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-black"}`}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark
                      ? "bg-purple-900/50 border-purple-500/30 focus:border-purple-500"
                      : "bg-purple-50 border-purple-200 focus:border-purple-500 text-black"
                  }`}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-black"}`}>
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark
                      ? "bg-purple-900/50 border-purple-500/30 focus:border-purple-500"
                      : "bg-purple-50 border-purple-200 focus:border-purple-500 text-black"
                  }`}
                  placeholder="Xác nhận mật khẩu mới"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(null)}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg border font-semibold hover:bg-purple-500/10 transition-colors disabled:opacity-50 ${isDark ? "border-gray-500/30 text-white hover:bg-white/10" : "border-gray-300 text-black hover:bg-gray-100"}`}
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${isDark ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/30" : "bg-cyan-500 hover:bg-cyan-600 text-black border border-cyan-400 shadow-cyan-300/50"}`}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Cập nhật mật khẩu
                  </>
                )}
              </button>
            </div>

            <p
              className={`text-xs mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              💡 Mật khẩu phải có ít nhất 6 ký tự để đảm bảo bảo mật tài khoản
              của bạn.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
