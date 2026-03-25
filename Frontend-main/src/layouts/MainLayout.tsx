import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Cpu,
  Menu,
  X,
  Star,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User,
  Settings,
  ShieldCheck,
  Users,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/Toaster";
import { toast } from "sonner";

export function MainLayout() {
  const theme = useTheme();
  const { itemCount: cartItemCount } = useCart();
  const auth = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div
      className={`min-h-screen w-full max-w-full relative overflow-hidden m-0 p-0 ${
        theme.isDark ? "text-white" : "text-slate-900"
      }`}
    >
      <Toaster />

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: theme.isDark
              ? "url(https://images.unsplash.com/photo-1562619425-c307bb83bc42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFjZSUyMGdhbGF4eSUyMG5lYnVsYSUyMGRhcmt8ZW58MXx8fHwxNzY4NTA3ODUzfDA&ixlib=rb-4.1.0&q=80&w=1080)"
              : "url(https://images.unsplash.com/photo-1762951566493-a275fc9f9f48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xvZ3JhcGhpYyUyMGlyaWRlc2NlbnQlMjBncmFkaWVudHxlbnwxfHx8fDE3Njg1MzYzMjJ8MA&ixlib=rb-4.1.0&q=80&w=1080)",
          }}
        />
        <div
          className={`absolute inset-0 ${
            theme.isDark
              ? "bg-gradient-to-b from-slate-950/80 via-purple-950/70 to-slate-950/80"
              : "bg-gradient-to-b from-white/80 via-purple-50/80 to-pink-50/80"
          }`}
        />
      </div>

      {/* Starfield */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div
          className={`absolute inset-0 ${
            theme.isDark
              ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"
              : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/40 via-transparent to-transparent"
          }`}
        />
        {[...Array(50)].map((_, i) => (
          <Star
            key={i}
            className={`absolute ${theme.isDark ? "text-white/20" : "text-purple-400/30"} animate-pulse`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 ${
          theme.isDark
            ? "bg-slate-950/80 border-purple-500/30"
            : "bg-white/80 border-purple-300"
        } backdrop-blur-lg border-b`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:scale-105 transition-transform"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                CosmicTech
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`${theme.isDark ? "hover:text-purple-400" : "hover:text-purple-600"} transition-colors`}
              >
                Trang chủ
              </Link>
              <Link
                to="/products"
                className={`${theme.isDark ? "hover:text-purple-400" : "hover:text-purple-600"} transition-colors`}
              >
                Sản phẩm
              </Link>
              <Link
                to="/builder"
                className={`${theme.isDark ? "hover:text-purple-400" : "hover:text-purple-600"} transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Build PC
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              {/* API Docs link (opens Swagger) */}
              {import.meta.env.VITE_API_DOCS && (
                <a
                  href={import.meta.env.VITE_API_DOCS}
                  target="_blank"
                  rel="noreferrer"
                  className={`hidden md:inline-block mr-4 px-3 py-2 rounded-lg text-sm font-medium ${
                    theme.isDark
                      ? "bg-white/5 hover:bg-white/10 text-gray-200"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  API Docs
                </a>
              )}
              <button
                onClick={theme.toggleTheme}
                className={`p-2 ${
                  theme.isDark
                    ? "hover:bg-purple-500/20"
                    : "hover:bg-purple-200"
                } rounded-lg transition-colors`}
                title={theme.isDark ? "Chế độ sáng" : "Chế độ tối"}
              >
                {theme.isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <Link
                to="/cart"
                className={`relative p-2 ${
                  theme.isDark
                    ? "hover:bg-purple-500/20"
                    : "hover:bg-purple-200"
                } rounded-lg transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {auth.isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-controls="userDropdown"
                    className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full transition-all transform ${
                      theme.isDark
                        ? "hover:bg-purple-500/12 bg-white/5 border border-transparent shadow-sm"
                        : "hover:bg-purple-50 bg-white border border-gray-100 shadow-sm"
                    } focus:outline-none focus:ring-2 focus:ring-purple-400/40 hover:scale-102`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-purple-400/30 overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                      {auth.user?.avatar ? (
                        <img
                          src={auth.user.avatar}
                          alt={auth.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {auth.user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span
                      className={`hidden md:inline text-sm font-semibold max-w-[140px] truncate ${
                        theme.isDark ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {auth.user?.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 hidden md:block transition-transform ${
                        userMenuOpen ? "rotate-180" : ""
                      } ${theme.isDark ? "text-gray-400" : "text-gray-500"}`}
                    />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div
                        id="userDropdown"
                        className={`absolute right-0 mt-3 w-68 sm:w-80 rounded-3xl overflow-hidden z-60 border-transparent ring-1 shadow-2xl`}
                        style={{
                          animation:
                            "dropdownPop .18s cubic-bezier(.2,.9,.25,1)",
                          boxShadow: theme.isDark
                            ? "0 20px 60px rgba(6,4,20,0.8), 0 0 40px rgba(139,92,246,0.15)"
                            : "0 20px 60px rgba(10,12,30,0.15), 0 0 40px rgba(139,92,246,0.1)",
                          border: theme.isDark
                            ? "1px solid rgba(139,92,246,0.15)"
                            : "1px solid rgba(139,92,246,0.12)",
                          background: theme.isDark
                            ? "linear-gradient(135deg, rgba(20,20,40,0.96) 0%, rgba(25,15,50,0.94) 100%)"
                            : "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,247,255,0.96) 100%)",
                          WebkitBackdropFilter: "blur(12px)",
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        <div
                          className={`px-5 py-5 bg-gradient-to-br ${theme.isDark ? "from-purple-950/30 to-transparent" : "from-purple-100/40 to-transparent"}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div
                                className={`absolute inset-0 rounded-full ${theme.isDark ? "bg-purple-600/30" : "bg-purple-400/20"} blur-lg`}
                              />
                              <div
                                className={`w-16 h-16 bg-gradient-to-br from-purple-500 via-purple-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ${theme.isDark ? "ring-purple-400/40" : "ring-purple-300/50"} relative z-10 shadow-lg overflow-hidden`}
                              >
                                {auth.user?.avatar ? (
                                  <img
                                    src={auth.user.avatar}
                                    alt={auth.user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white text-xl font-bold">
                                    {auth.user?.name?.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`font-bold text-sm truncate ${theme.isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {auth.user?.name}
                              </p>
                              <p
                                className={`text-xs truncate mt-1 ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}
                              >
                                {auth.user?.email}
                              </p>
                              {/* Role text removed as requested */}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`h-0.5 bg-gradient-to-r ${theme.isDark ? "from-transparent via-purple-500/30 to-transparent" : "from-transparent via-purple-300/40 to-transparent"}`}
                        />
                        <div className="px-3 py-2.5 space-y-2">
                          <button
                            onClick={() => {
                              navigate("/profile");
                              setUserMenuOpen(false);
                            }}
                            className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all transform ${
                              theme.isDark
                                ? "text-gray-100 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 hover:shadow-lg hover:shadow-purple-500/10"
                                : "text-gray-800 hover:bg-gradient-to-r hover:from-purple-100/60 hover:to-blue-100/40"
                            } hover:scale-105 active:scale-95`}
                          >
                            <User className="w-4 h-4 text-purple-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                            <span>Thông tin cá nhân</span>
                          </button>

                          {/* Customer specific buttons */}
                          {(auth.user?.role === "customer" || !auth.user?.role) && (
                            <button
                              onClick={() => {
                                navigate("/orders");
                                setUserMenuOpen(false);
                              }}
                              className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all transform ${
                                theme.isDark
                                  ? "text-gray-100 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 hover:shadow-lg hover:shadow-green-500/10"
                                  : "text-gray-800 hover:bg-gradient-to-r hover:from-green-100/60 hover:to-emerald-100/40"
                              } hover:scale-105 active:scale-95`}
                            >
                              <Package className="w-4 h-4 text-green-500 group-hover:text-green-400 transition-colors flex-shrink-0" />
                              <span>Theo dõi đơn hàng</span>
                            </button>
                          )}

                           {/* Admin specific extra buttons */}
                          {auth.user?.role === "admin" && (
                            <>
                              <button
                                onClick={() => {
                                  navigate("/manager");
                                  setUserMenuOpen(false);
                                }}
                                className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all transform ${
                                  theme.isDark
                                    ? "text-gray-100 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-yellow-500/20 hover:shadow-lg hover:shadow-orange-500/10"
                                    : "text-gray-800 hover:bg-gradient-to-r hover:from-orange-100/60 hover:to-yellow-100/40"
                                } hover:scale-105 active:scale-95`}
                              >
                                <ShieldCheck className="w-4 h-4 text-orange-500 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                                <span>Trang Quản lý</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigate("/staff");
                                  setUserMenuOpen(false);
                                }}
                                className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all transform ${
                                  theme.isDark
                                    ? "text-gray-100 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-green-500/20 hover:shadow-lg hover:shadow-blue-500/10"
                                    : "text-gray-800 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-green-100/40"
                                } hover:scale-105 active:scale-95`}
                              >
                                <Users className="w-4 h-4 text-blue-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                                <span>Trang Nhân viên</span>
                              </button>
                            </>
                          )}

                          {/* Default Dashboard button based on role */}
                          {(auth.user?.role === "admin" ||
                            auth.user?.role === "staff" ||
                            auth.user?.role === "manager") && (
                            <button
                              onClick={() => {
                                if (auth.user?.role === "admin")
                                  navigate("/admin");
                                else if (auth.user?.role === "staff")
                                  navigate("/staff");
                                else if (auth.user?.role === "manager")
                                  navigate("/manager");
                                setUserMenuOpen(false);
                              }}
                              className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all transform ${
                                theme.isDark
                                  ? "text-gray-100 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 hover:shadow-lg hover:shadow-blue-500/10"
                                  : "text-gray-800 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-cyan-100/40"
                              } hover:scale-105 active:scale-95`}
                            >
                              <Settings className="w-4 h-4 text-blue-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                              <span>{auth.user?.role === "admin" ? "Trang Quản trị" : "Bảng điều khiển"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              auth.logout();
                              setUserMenuOpen(false);
                              navigate("/");
                              toast.success("Đã đăng xuất thành công");
                            }}
                            className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all transform ${
                              theme.isDark
                                ? "text-red-400/90 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-orange-500/20 hover:shadow-lg hover:shadow-red-500/10"
                                : "text-red-600 hover:bg-gradient-to-r hover:from-red-100/60 hover:to-orange-100/40"
                            } hover:scale-105 active:scale-95`}
                          >
                            <LogOut className="w-4 h-4 text-red-500 transition-colors flex-shrink-0" />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                      <style>{`
                        @keyframes dropdownPop { from { opacity: 0; transform: translateY(-8px) scale(0.95); filter: blur(4px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
                        #userDropdown::before { 
                          content: ""; 
                          position: absolute; 
                          top: -8px; 
                          right: 22px; 
                          width: 15px; 
                          height: 15px; 
                          background: ${theme.isDark ? "linear-gradient(135deg, rgba(20,20,40,0.96), rgba(25,15,50,0.94))" : "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,247,255,0.96))"};
                          transform: rotate(45deg); 
                          filter: blur(8px); 
                          opacity: 0.95; 
                          z-index: 0;
                        }
                        #userDropdown::after { 
                          content: ""; 
                          position: absolute; 
                          top: -9px; 
                          right: 22px; 
                          width: 15px; 
                          height: 15px; 
                          background: ${theme.isDark ? "linear-gradient(180deg, rgba(139,92,246,0.2), rgba(59,130,246,0.12))" : "linear-gradient(180deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))"};
                          transform: rotate(45deg); 
                          border-radius: 2px; 
                          z-index: 1; 
                          pointer-events: none;
                        }
                        header { z-index: 50; }
                        #userDropdown { z-index: 60; }
                      `}</style>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={auth.openLogin}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      theme.isDark
                        ? "hover:bg-purple-500/20 text-gray-200"
                        : "hover:bg-purple-100 text-gray-700"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={auth.openRegister}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-sm font-semibold text-white hover:scale-105 transition-transform"
                  >
                    Đăng ký
                  </button>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 ${
                  theme.isDark
                    ? "hover:bg-purple-500/20"
                    : "hover:bg-purple-200"
                } rounded-lg transition-colors`}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav
              className={`md:hidden mt-4 pb-4 space-y-2 border-t ${
                theme.isDark ? "border-purple-500/30" : "border-purple-300"
              } pt-4`}
            >
              <Link
                to="/"
                className={`block w-full text-left px-4 py-2 ${
                  theme.isDark
                    ? "hover:bg-purple-500/20"
                    : "hover:bg-purple-200"
                } rounded-lg transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                to="/products"
                className={`block w-full text-left px-4 py-2 ${
                  theme.isDark
                    ? "hover:bg-purple-500/20"
                    : "hover:bg-purple-200"
                } rounded-lg transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sản phẩm
              </Link>
              <Link
                to="/builder"
                className={`block w-full text-left px-4 py-2 ${
                  theme.isDark
                    ? "hover:bg-purple-500/20"
                    : "hover:bg-purple-200"
                } rounded-lg transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Build PC
              </Link>
              {!auth.isLoggedIn && (
                <div
                  className={`flex gap-2 pt-2 mt-2 border-t ${theme.isDark ? "border-purple-500/20" : "border-purple-200"}`}
                >
                  <button
                    onClick={() => {
                      auth.openLogin();
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      theme.isDark
                        ? "bg-white/5 border border-purple-500/20 text-gray-200"
                        : "bg-gray-50 border border-gray-200 text-gray-700"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      auth.openRegister();
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-sm font-semibold text-white"
                  >
                    Đăng ký
                  </button>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className={`relative z-10 mt-20 border-t ${
          theme.isDark
            ? "border-purple-500/30 bg-slate-950/50"
            : "border-purple-300 bg-white/50"
        } backdrop-blur-sm`}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3
                className={`font-bold text-lg mb-4 ${
                  theme.isDark ? "text-purple-400" : "text-purple-600"
                }`}
              >
                CosmicTech
              </h3>
              <p
                className={`text-sm ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Cung cấp laptop, PC và linh kiện điện tử chất lượng cao với giá
                tốt nhất.
              </p>
            </div>
            <div>
              <h3
                className={`font-bold text-lg mb-4 ${
                  theme.isDark ? "text-purple-400" : "text-purple-600"
                }`}
              >
                Liên hệ
              </h3>
              <p
                className={`text-sm ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Email: support@cosmictech.vn
              </p>
              <p
                className={`text-sm ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Hotline: 1900-xxxx
              </p>
            </div>
            <div>
              <h3
                className={`font-bold text-lg mb-4 ${
                  theme.isDark ? "text-purple-400" : "text-purple-600"
                }`}
              >
                Hỗ trợ
              </h3>
              <p
                className={`text-sm ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Chính sách bảo hành
              </p>
              <p
                className={`text-sm ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Hướng dẫn trả góp
              </p>
              <p
                className={`text-sm ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Chính sách đổi trả
              </p>
            </div>
          </div>
          <div
            className={`mt-8 pt-8 border-t ${
              theme.isDark
                ? "border-purple-500/30 text-gray-400"
                : "border-purple-300 text-gray-600"
            } text-center text-sm`}
          >
            © 2026 CosmicTech. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
