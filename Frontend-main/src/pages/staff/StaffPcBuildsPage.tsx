import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  X,
  Upload,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { getProductsApi } from "@/api/products";
import { getCategoriesApi, type Category } from "@/api/categories";
import * as PcBuildsApi from "@/api/pcBuilds";
import type { Product } from "@/types";
import {
  PC_BUILDER_CATEGORIES,
  PC_BUILDER_LABELS,
} from "@/constants/categories";

const formatPrice = (p: number) => p.toLocaleString("vi-VN") + "đ";

type BuildComponent = {
  category: typeof PC_BUILDER_CATEGORIES[number];
  product: Product | null;
};

type PcBuildDetailItem = {
  product_id?: number;
  quantity?: number;
  // optional expanded product fields from backend
  product_name?: string;
  product_price?: number;
  image_url?: string;
  category_name?: string;
};

export function StaffPcBuildsPage() {
  const { isDark } = useTheme();
  const [builds, setBuilds] = useState<PcBuildsApi.PcBuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create">("list");

  // Create Mode states
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>(
    PC_BUILDER_CATEGORIES.map((category) => ({ category, product: null }))
  );
  const [searchCat, setSearchCat] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("cpu");
  const [form, setForm] = useState({
    build_name: "",
    description: "",
    category_id: "",
    stock_quantity: 1,
    image_url: "",
  });
  const [saving, setSaving] = useState(false);

  // View details modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewBuild, setViewBuild] = useState<PcBuildsApi.PcBuildSummary | null>(
    null,
  );
  const [viewDetail, setViewDetail] = useState<any>(null);

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    try {
      setLoading(true);
      const data = await PcBuildsApi.getPcBuilds();
      setBuilds(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách PC Builds");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = async () => {
    try {
      setMode("create");
      setBuildComponents(
        PC_BUILDER_CATEGORIES.map((category) => ({ category, product: null }))
      );
      setForm({
        build_name: "",
        description: "",
        category_id: "",
        stock_quantity: 1,
        image_url: "",
      });
      setSelectedCategory("cpu");

      const [prods, cats] = await Promise.all([
        getProductsApi(),
        getCategoriesApi(),
      ]);
      setAllProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải sản phẩm. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa bản build này không?")) return;
    try {
      await PcBuildsApi.deletePcBuild(String(id));
      toast.success("Xóa thành công");
      fetchBuilds();
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  const openView = async (b: PcBuildsApi.PcBuildSummary) => {
    setViewOpen(true);
    setViewBuild(b);
    setViewDetail(null);
    try {
      setViewLoading(true);
      const detail = await PcBuildsApi.getPcBuildById(String(b.pc_build_id));
      setViewDetail(detail);

      // Ensure we have products list for fallback lookup by product_id
      if (!allProducts || allProducts.length === 0) {
        const prods = await getProductsApi();
        setAllProducts(prods);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải chi tiết PC Build");
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewBuild(null);
    setViewDetail(null);
  };

  const getAvailableProducts = (category: string) => {
    // IMPORTANT: `p.category` is already normalized enum (cpu/gpu/ram/...)
    // so we should match by equality, not by Vietnamese display labels.
    let filtered = allProducts.filter((p) => p.category === (category as any));

    const sq = searchCat[category]?.toLowerCase() || "";
    if (sq) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(sq));
    }
    return filtered;
  };

  const selectProduct = (category: string, product: Product) => {
    setBuildComponents((prev) =>
      prev.map((c) => (c.category === category ? { ...c, product } : c))
    );
  };

  const removeProduct = (category: string) => {
    setBuildComponents((prev) =>
      prev.map((c) => (c.category === category ? { ...c, product: null } : c))
    );
  };

  const calculateTotal = () => {
    return buildComponents.reduce((sum, c) => sum + (c.product?.price || 0), 0);
  };

  const handlePublish = async () => {
    const items = buildComponents
      .filter((c) => c.product)
      .map((c) => ({
        product_id: Number(c.product!.id),
        quantity: 1, // Default to 1 per component
      }));

    if (items.length === 0) {
      toast.error("Vui lòng chọn ít nhất một linh kiện");
      return;
    }
    if (!form.build_name) {
      toast.error("Vui lòng nhập tên Build PC");
      return;
    }
    if (!form.category_id) {
      toast.error("Vui lòng chọn danh mục cho sản phẩm đăng bán");
      return;
    }

    setSaving(true);
    try {
      await PcBuildsApi.createPcBuild({
        build_name: form.build_name,
        description: form.description,
        category_id: Number(form.category_id),
        stock_quantity: form.stock_quantity,
        status: "Available",
        image_url: form.image_url || "https://file.hstatic.net/200000636033/file/icon3_5c59c1dc52ec4b81a94a3edba293e895.png",
        items,
      });
      toast.success("Tạo và đăng bán PC Build thành công!");
      setMode("list");
      fetchBuilds();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  };

  // UI Styles
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(139,92,246,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: isDark ? "#fff" : "#111",
    fontSize: "14px",
    outline: "none",
  };

  if (loading && mode === "list")
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
        Đang tải...
      </div>
    );

  if (mode === "create") {
    const availableProducts = getAvailableProducts(selectedCategory);
    return (
      <div style={{ paddingBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "#fff" }}>Tạo cấu hình PC mới</h1>
            <p style={{ color: "#9ca3af", margin: "4px 0 0" }}>Chọn các linh kiện để ghép thành 1 PC Build</p>
          </div>
          <button
            onClick={() => setMode("list")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: isDark ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            Quay lại
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
          {/* Component Selection Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {buildComponents.map((c) => {
              const label = PC_BUILDER_LABELS[c.category as keyof typeof PC_BUILDER_LABELS];
              const isSelected = selectedCategory === c.category;
              return (
                <div
                  key={c.category}
                  onClick={() => setSelectedCategory(c.category)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    border: isSelected ? "2px solid #a855f7" : "1px solid rgba(139,92,246,0.2)",
                    background: isSelected ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px", textTransform: "uppercase", color: "#9ca3af" }}>
                      {label}
                    </span>
                    {c.product && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProduct(c.category);
                        }}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                      >
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    )}
                  </div>
                  {c.product ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="w-16 h-16 bg-white rounded flex items-center justify-center p-1 border border-gray-100/10">
                        <img src={c.product.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {c.product.name}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#10b981", fontWeight: 700 }}>
                          {formatPrice(c.product.price)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>Chưa chọn {label.toLowerCase()}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Product Listing & Publishing Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Component Picker */}
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#fff" }}>
                  Chọn {PC_BUILDER_LABELS[selectedCategory as keyof typeof PC_BUILDER_LABELS]}
                </h3>
                <div style={{ position: "relative", width: "250px" }}>
                  <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
                  <input
                    placeholder="Tìm theo tên..."
                    value={searchCat[selectedCategory] || ""}
                    onChange={(e) => setSearchCat({ ...searchCat, [selectedCategory]: e.target.value })}
                    style={{ ...inputStyle, paddingLeft: "36px", padding: "8px 12px 8px 36px" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
                {availableProducts.map((p) => {
                  const isSelected = buildComponents.find(c => c.category === selectedCategory)?.product?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => selectProduct(selectedCategory, p)}
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        border: isSelected ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.03)",
                        display: "flex", flexDirection: "column"
                      }}
                    >
                      <div className="w-full aspect-[4/3] bg-white rounded-lg flex items-center justify-center p-2 mb-3">
                        <img src={p.image} alt="" className="w-full h-full object-contain max-w-full max-h-full" />
                      </div>
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#fff",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.name}
                      </p>
                      <p style={{ margin: "auto 0 0", fontSize: "14px", color: "#10b981", fontWeight: 700 }}>{formatPrice(p.price)}</p>
                    </div>
                  );
                })}
                {availableProducts.length === 0 && (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    Không có sản phẩm nào
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Settings Modal / Section */}
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(139,92,246,0.2)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 600, color: "#a855f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Thiết lập Đăng bán</span>
                <span style={{ fontSize: "20px", color: "#10b981" }}>Tổng: {formatPrice(calculateTotal())}</span>
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>Tên PC Build *</label>
                  <input value={form.build_name} onChange={(e) => setForm({ ...form, build_name: e.target.value })} style={inputStyle} placeholder="Ví dụ: PC Gaming Cao Nhất" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>Danh mục lưu *</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} style={inputStyle}>
                    <option value="" disabled style={{ color: "#6b7280" }}>-- Chọn danh mục Product --</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id} style={{ background: isDark ? "#1f2937" : "#fff", color: isDark ? '#fff' : '#000' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>Số lượng sản phẩm build (Tồn kho)</label>
                  <input type="number" min={1} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) || 1 })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>Ảnh hiển thị (Tùy chọn, có thể bỏ trống lấy mặc định)</label>
                  <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={inputStyle} placeholder="Link URL ảnh" />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>Mô tả chi tiết</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} placeholder="Tóm tắt hiệu năng, tính năng đặc biệt..."></textarea>
              </div>

              <button
                onClick={handlePublish}
                disabled={saving}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                  border: "none", background: "linear-gradient(135deg, #a855f7, #3b82f6)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? "Đang đăng..." : "Đăng bán cấu hình PC này"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List Mode
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "#fff" }}>
            Quản lý Cấu hình PC (Builds)
          </h1>
          <p style={{ color: "#9ca3af", margin: "4px 0 0" }}>Quản lý các bản ghép linh kiện sẵn của cửa hàng</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, #a855f7, #3b82f6)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus style={{ width: 18, height: 18 }} /> Tạo cấu hình PC mới
        </button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "16px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
              {["ID", "Tên Build", "Tổng giá", "Số linh kiện", "Thao tác"].map((h) => (
                <th key={h} style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {builds.map((b) => (
              <tr key={b.pc_build_id} style={{ borderBottom: "1px solid rgba(139,92,246,0.05)" }}>
                <td style={{ padding: "16px 20px", fontSize: "14px", color: "#6b7280" }}>#{b.pc_build_id}</td>
                <td style={{ padding: "16px 20px", fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#fff" }}>
                    <div className="w-10 h-10 aspect-square bg-white border border-gray-100/10 rounded-md flex items-center justify-center p-1">
                      <img src={b.image_url || "https://file.hstatic.net/200000636033/file/icon3_5c59c1dc52ec4b81a94a3edba293e895.png"} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span>{b.build_name}</span>
                  </div>
                </td>
                <td style={{ padding: "16px 20px", fontSize: "15px", color: "#10b981", fontWeight: 600 }}>{formatPrice(b.total_price || 0)}</td>
                <td style={{ padding: "16px 20px", fontSize: "14px", color: "#9ca3af" }}>{b.item_count || 0} món</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => openView(b)}
                      title="Xem linh kiện"
                      style={{ padding: "8px", borderRadius: "8px", border: "none", background: "rgba(59,130,246,0.15)", color: "#60a5fa", cursor: "pointer", display: "flex" }}
                    >
                      <Eye style={{ width: 16, height: 16 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.pc_build_id)}
                      title="Xóa"
                      style={{ padding: "8px", borderRadius: "8px", border: "none", background: "rgba(239,68,68,0.15)", color: "#f87171", cursor: "pointer", display: "flex" }}
                    >
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {builds.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Chưa có PC Build nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View details modal */}
      {viewOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={closeView} />
          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "720px", borderRadius: "18px", padding: "22px", background: "linear-gradient(160deg, #120b2a, #0b1120)", border: "1px solid rgba(59,130,246,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#fff" }}>
                  Chi tiết linh kiện — {viewBuild?.build_name || `#${viewBuild?.pc_build_id}`}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#9ca3af" }}>
                  Tổng: <span style={{ color: "#10b981", fontWeight: 700 }}>{formatPrice(viewBuild?.total_price || 0)}</span>
                  {" "}• {viewBuild?.item_count || 0} linh kiện
                </p>
              </div>
              <button onClick={closeView} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {viewLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Đang tải chi tiết...</div>
            ) : (
              (() => {
                const items: PcBuildDetailItem[] =
                  (viewDetail?.items || viewDetail?.build_items || viewDetail?.data?.items || []) as any[];

                const normalized = (items || []).map((it: any) => {
                  const pid = Number(it.product_id ?? it.product?.product_id ?? it.product?.id ?? it.id);
                  const quantity = Number(it.quantity ?? 1);
                  const fromApiName = it.product_name ?? it.product?.name;
                  const fromApiPrice = it.product_price ?? it.product?.price;
                  const fromApiImage = it.image_url ?? it.product?.image_url;
                  const fromApiCategory = it.category_name ?? it.product?.category_name;
                  const fallback = allProducts.find((p) => Number(p.id) === pid);
                  return {
                    product_id: pid,
                    quantity,
                    name: fromApiName || fallback?.name || `Product #${pid}`,
                    price: Number(fromApiPrice ?? fallback?.price ?? 0),
                    image: fromApiImage || fallback?.image || "https://via.placeholder.com/120",
                    category_name: fromApiCategory || fallback?.category_name || fallback?.category,
                  };
                });

                if (normalized.length === 0) {
                  return (
                    <div style={{ padding: "28px", textAlign: "center", color: "#9ca3af", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "14px" }}>
                      Build này chưa có danh sách linh kiện (API không trả về items).
                    </div>
                  );
                }

                const total = normalized.reduce((s, it) => s + it.price * (it.quantity || 1), 0);

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {normalized.map((it, idx) => (
                      <div key={`${it.product_id}-${idx}`} style={{ display: "flex", gap: "12px", padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.12)" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "12px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {it.name}
                              </div>
                              <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: 4 }}>
                                {it.category_name ? String(it.category_name) : "—"}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "13px", color: "#9ca3af" }}>SL: <span style={{ color: "#fff", fontWeight: 700 }}>{it.quantity || 1}</span></div>
                              <div style={{ fontSize: "14px", color: "#10b981", fontWeight: 800, marginTop: 2 }}>{formatPrice(it.price)}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 8, fontSize: "12px", color: "#6b7280" }}>
                            Thành tiền: <span style={{ color: "#a78bfa", fontWeight: 800 }}>{formatPrice(it.price * (it.quantity || 1))}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>Tổng linh kiện (tính lại)</span>
                      <span style={{ fontSize: "16px", color: "#10b981", fontWeight: 900 }}>{formatPrice(total)}</span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
