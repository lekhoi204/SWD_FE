import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/Toaster";
import { AuthModal } from "@/components/AuthModal";

export function MainLayout() {
  const theme = useTheme();
  const { itemCount: cartItemCount } = useCart();
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
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
                    className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full transition-all ${
                      theme.isDark
                        ? 'hover:bg-purple-500/15 bg-white/5 border border-purple-500/20'
                        : 'hover:bg-purple-50 bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-purple-400/30">
                      <span className="text-white text-sm font-bold">
                        {auth.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={`hidden md:inline text-sm font-semibold max-w-[140px] truncate ${
                      theme.isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {auth.user?.name}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 hidden md:block transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    } ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div
                        className={`absolute right-0 mt-3 w-64 rounded-2xl overflow-hidden shadow-2xl z-50 border ${
                          theme.isDark
                            ? 'bg-slate-900/95 border-purple-500/25 backdrop-blur-xl'
                            : 'bg-white border-gray-200'
                        }`}
                        style={{
                          animation: 'dropdownIn 0.15s ease-out',
                        }}
                      >
                        <div className={`px-4 py-4 border-b ${theme.isDark ? 'border-purple-500/15' : 'border-gray-100'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-purple-400/20">
                              <span className="text-white text-base font-bold">
                                {auth.user?.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm truncate ${theme.isDark ? 'text-white' : 'text-gray-900'}`}>
                                {auth.user?.name}
                              </p>
                              <p className={`text-xs truncate mt-0.5 ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {auth.user?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              auth.logout();
                              setUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${
                              theme.isDark
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                      <style>{`
                        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
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

      <AuthModal />

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
