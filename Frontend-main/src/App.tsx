import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider, ThemeProvider, AuthProvider } from '@/context';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  HomePage,
  ProductListPage,
  ProductDetailPage,
  PCBuilderPage,
  CartPage,
  CheckoutPage,
} from '@/pages';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { StaffLayout } from '@/layouts/StaffLayout';
import { StaffDashboardPage } from '@/pages/staff/StaffDashboardPage';
import { StaffRequestsPage } from '@/pages/staff/StaffRequestsPage';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage';
import { ManagerProductsPage } from '@/pages/manager/ManagerProductsPage';
import { ManagerCategoriesPage } from '@/pages/manager/ManagerCategoriesPage';
import { ManagerPromotionsPage } from '@/pages/manager/ManagerPromotionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductListPage />} />
                <Route path="products/:category" element={<ProductListPage />} />
                <Route path="product/:id" element={<ProductDetailPage />} />
                <Route path="builder" element={<PCBuilderPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
              </Route>

              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
              </Route>

              <Route path="staff" element={<StaffLayout />}>
                <Route index element={<StaffDashboardPage />} />
                <Route path="requests" element={<StaffRequestsPage />} />
              </Route>

              <Route path="manager" element={<ManagerLayout />}>
                <Route index element={<ManagerDashboardPage />} />
                <Route path="products" element={<ManagerProductsPage />} />
                <Route path="categories" element={<ManagerCategoriesPage />} />
                <Route path="promotions" element={<ManagerPromotionsPage />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
