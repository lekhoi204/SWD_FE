export { apiClient, ApiError, setToken, clearToken } from "./client";
export { loginApi, registerApi, logoutApi, getMeApi } from "./auth";
export {
  getProductsApi,
  getProductByIdApi,
  getProductsByCategoryIdApi,
} from "./products";
export {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from "./cart";
export {
  createOrderApi,
  getOrdersApi,
  getOrderByIdApi,
  updateOrderApi,
  deleteOrderApi,
} from "./orders";
export {
  getCategoriesApi,
  getCategoryByIdApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  type Category,
} from "./categories";
export { checkoutApi } from "./checkout";
export {
  getPromotionsApi,
  getPromotionByIdApi,
  getPromotionByCodeApi,
  type Promotion,
} from "./promotions";
