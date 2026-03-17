import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider, ThemeProvider, AuthProvider } from "@/context";
import { MainLayout } from "@/layouts/MainLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  HomePage,
  ProductListPage,
  ProductDetailPage,
  PCBuilderPage,
  CartPage,
  CheckoutPage,
} from "@/pages";
import ProfilePage from "@/pages/ProfilePage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
// import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage"; // Moved to manager
import { StaffLayout } from "@/layouts/StaffLayout";
import { StaffDashboardPage } from "@/pages/staff/StaffDashboardPage";
import { StaffRequestsPage } from "@/pages/staff/StaffRequestsPage";
import { ManagerLayout } from "@/layouts/ManagerLayout";
import { ManagerDashboardPage } from "@/pages/manager/ManagerDashboardPage";
import { ManagerProductsPage } from "@/pages/manager/ManagerProductsPage";
import { ManagerCategoriesPage } from "@/pages/manager/ManagerCategoriesPage";
import { ManagerPromotionsPage } from "@/pages/manager/ManagerPromotionsPage";
import { AdminOrdersPage as ManagerOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { RequireRole } from "@/components/RequireRole";
import { AuthModal } from "@/components/AuthModal";
import { StaffPcBuildsPage } from "@/pages/staff/StaffPcBuildsPage";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AuthModal />
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductListPage />} />
                <Route path="products/:category" element={<ProductListPage />} />
                <Route path="product/:id" element={<ProductDetailPage />} />
                <Route path="builder" element={<PCBuilderPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="admin" element={<RequireRole roles={["admin"]}><AdminLayout /></RequireRole>}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
              </Route>

              <Route path="staff" element={<RequireRole roles={["staff", "admin"]}><StaffLayout /></RequireRole>}>
                <Route index element={<StaffDashboardPage />} />
                <Route path="requests" element={<StaffRequestsPage />} />
                <Route path="builds" element={<StaffPcBuildsPage />} />
              </Route>

              <Route path="manager" element={<RequireRole roles={["manager", "admin"]}><ManagerLayout /></RequireRole>}>
                <Route index element={<ManagerDashboardPage />} />
                <Route path="products" element={<ManagerProductsPage />} />
                <Route path="categories" element={<ManagerCategoriesPage />} />
                <Route path="promotions" element={<ManagerPromotionsPage />} />
                <Route path="orders" element={<ManagerOrdersPage />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
