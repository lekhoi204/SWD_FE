
  # E-commerce Website for Electronics

  This is a code bundle for E-commerce Website for Electronics. The original project is available at https://www.figma.com/design/kX10YAJfRtdjqv3AKzR2yv/E-commerce-Website-for-Electronics.

  ## Cấu trúc project (đã refactor)

  - `src/types/` – Định nghĩa type (Product, CartItem, ThemeMode)
  - `src/constants/` – Hằng (nhãn danh mục, v.v.)
  - `src/context/` – CartContext, ThemeContext (state toàn app)
  - `src/layouts/` – MainLayout (header, footer, background)
  - `src/pages/` – Các trang: Home, ProductList, ProductDetail, PCBuilder, Cart, Checkout
  - `src/components/` – Component dùng chung (Toaster, ImageWithFallback, ui/)
  - `src/data/` – Dữ liệu (products)
  - Routing: React Router (/, /products, /product/:id, /builder, /cart, /checkout)

  ## Chạy project

  Chạy `npm i` để cài dependencies (cần thêm `react-router-dom` nếu chưa có).

  Chạy `npm run dev` để khởi động dev server.
  