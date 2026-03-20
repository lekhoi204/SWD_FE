import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  RefreshCw,
  Send,
  ClipboardList,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getProductsApi } from "@/api/products";
import * as PcBuildsApi from "@/api/pcBuilds";
import * as UserBuildsApi from "@/api/userBuilds";
import * as StaffBuildRequestsApi from "@/api/staffBuildRequests";
import {
  PC_BUILDER_CATEGORIES,
  PC_BUILDER_LABELS,
} from "@/constants/categories";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AIAssistant } from "@/components/AIAssistant";
import BuildModal from "@/components/BuildModal";
import type { Product } from "@/types";

type UserRequest = {
  id: string;
  budget: number;
  purpose: string;
  note: string;
  buildItems: { category: string; name: string; price: number }[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  rejectReason?: string;
  staffBuild?: { category: string; name: string; price: number }[];
  userBuildId?: number | null;
  buildName?: string | null;
  totalPrice?: number | null;
  createdAt: string;
  rawReq?: any;
};

const PURPOSE_OPTIONS = [
  "Gaming",
  "Học tập / Lập trình",
  "Văn phòng",
  "Đồ hoạ / Render",
  "Streaming",
  "Khác",
];

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b', icon: Clock },
  assigned: { label: 'Đã phân công', color: '#3b82f6', icon: CheckCircle },
  in_progress: { label: 'Đang xử lý', color: '#6366f1', icon: Clock },
  completed: { label: 'Hoàn thành', color: '#10b981', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: '#9ca3af', icon: XCircle },
  rejected: { label: 'Từ chối', color: '#ef4444', icon: XCircle },
};

function UserBuildDetail({
  userBuildId,
  fallbackName,
}: {
  userBuildId: number;
  fallbackName?: string;
}) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const d = await UserBuildsApi.getUserBuildById(String(userBuildId));
        if (mounted) setDetail(d);
      } catch (err) {
        console.error(err);
        if (mounted) setDetail(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userBuildId]);

  // Load products for price fallback (API user-builds may not include product_price)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prods = await getProductsApi({ limit: "1000" });
        if (mounted) setProducts(prods);
      } catch (err) {
        console.error(err);
        if (mounted) setProducts(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const items: any[] =
    detail?.items || detail?.build_items || detail?.data?.items || [];

  const normalized = items.map((it: any) => {
    const productId = Number(it.product_id ?? it.productId ?? it.id);
    const quantity = Number(it.quantity ?? 1);
    const fallback = products?.find((p) => Number(p.id) === productId);
    const name = it.product_name || it.name || fallback?.name || `Product #${productId}`;
    const price = Number(it.product_price || it.price || fallback?.price || 0);
    const image = it.image_url || it.image || fallback?.image || "https://via.placeholder.com/120";
    const category = (fallback?.category as any) || "pc";
    const stock = Number(fallback?.stock ?? 999);
    return { productId, quantity, name, price, image, category, stock };
  });

  const total = normalized.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0,
  );

  const addAllToCart = async () => {
    try {
      setAdding(true);
      if (normalized.length === 0) return;
      for (const it of normalized) {
        const p: Product = {
          id: String(it.productId),
          name: it.name,
          category: it.category,
          price: it.price,
          image: it.image,
          description: "",
          specs: {},
          stock: it.stock,
        };
        await addToCart(p, it.quantity || 1);
      }
      toast.success("Đã thêm toàn bộ linh kiện vào giỏ hàng");
    } catch (err) {
      console.error(err);
      toast.error("Không thể thêm vào giỏ hàng");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>
        Build đã lưu trên hệ thống{fallbackName ? `: ${fallbackName}` : ""}
      </p>
      {loading ? (
        <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#9ca3af" }}>
          Đang tải linh kiện...
        </div>
      ) : normalized.length === 0 ? (
        <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#9ca3af" }}>
          Không có danh sách linh kiện trong user build này.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {normalized.map((it, idx) => (
              <div
                key={`${it.productId}-${idx}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(59,130,246,0.06)",
                  border: "1px solid rgba(59,130,246,0.12)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#d1d5db" }}>
                  {it.name} (x{it.quantity || 1})
                </span>
                <span style={{ color: "#a78bfa", fontWeight: 600 }}>
                  {Number(it.price || 0).toLocaleString("vi-VN")}₫
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 10,
              marginTop: 6,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 700 }}>
              Tổng
            </span>
            <span style={{ fontSize: 16, color: "#10b981", fontWeight: 900 }}>
              {total.toLocaleString("vi-VN")}₫
            </span>
          </div>
          <button
            onClick={addAllToCart}
            disabled={adding}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              cursor: adding ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              opacity: adding ? 0.7 : 1,
            }}
          >
            {adding ? "Đang thêm..." : "Thêm tất cả vào giỏ hàng"}
          </button>
        </>
      )}
    </div>
  );
}

type BuildComponent = {
  category: (typeof PC_BUILDER_CATEGORIES)[number];
  product: Product | null;
};

const ALLOCATIONS: Record<string, number> = {
  cpu: 0.25, gpu: 0.35, motherboard: 0.15, ram: 0.1, storage: 0.08, psu: 0.05, case: 0.02,
};

export function PCBuilderPage() {
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const { isLoggedIn, openLogin } = useAuth();
  const { user } = useAuth();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [budget, setBudget] = useState(30000000);
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>(
    PC_BUILDER_CATEGORIES.map((category) => ({ category, product: null }))
  );
  const [activeTab, setActiveTab] = useState<'build' | 'requests'>('build');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    purpose: "Gaming",
    note: "",
  });
  const [myRequests, setMyRequests] = useState<UserRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [viewRequest, setViewRequest] = useState<UserRequest | null>(null);

  // Modal state to replace window.prompt flows
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"save" | "choose" | "buy">("save");
  const [modalBuilds, setModalBuilds] = useState<any[]>([]);
  const [modalDefaultName, setModalDefaultName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  // collapsed / expanded categories and scroll refs
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      PC_BUILDER_CATEGORIES.forEach((c, i) => (map[c] = i < 3));
      return map;
    },
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    PC_BUILDER_CATEGORIES[0] || "cpu",
  );
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function scrollCategory(category: string, delta: number) {
    const el = scrollRefs.current[category];
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setProductsLoading(true);
        const prods = await getProductsApi({ limit: "1000" });
        if (mounted) setAllProducts(prods);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        if (mounted) toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        if (mounted) setProductsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load user requests from API
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    let mounted = true;
    (async () => {
      try {
        setRequestsLoading(true);
        const requests = await StaffBuildRequestsApi.getMyStaffBuildRequests();
        if (mounted && requests) {
          const formattedRequests: UserRequest[] = requests.map((req: any) => {
            // Parse customer_note to extract purpose and note
            const noteLines = (req.customer_note || "").split("\n");
            let purpose = "Khác";
            let note = "";

            for (const line of noteLines) {
              if (line.startsWith("Mục đích:")) {
                purpose = line.replace("Mục đích:", "").trim();
              } else if (line.startsWith("Ghi chú:")) {
                note = line.replace("Ghi chú:", "").trim();
              }
            }

            let staffBuildArr = req.staffBuild || req.staff_build || [];
            if (typeof staffBuildArr === 'string') {
              try { staffBuildArr = JSON.parse(staffBuildArr); } catch(e) { staffBuildArr = []; }
            }

            return {
              id: String(req.request_id || req.id || ""),
              budget: req.budget_range || 0,
              purpose,
              note,
              buildItems: (req.buildItems || req.userBuild || []).map((b: any) => ({
                category: b.category,
                name: b.name || b.productName || '',
                price: Number(b.price) || 0
              })),
              status: req.status || "pending",
              rejectReason: req.rejectReason,
              staffBuild: Array.isArray(staffBuildArr) ? staffBuildArr.map((b: any) => ({
                category: b.category,
                name: b.name || b.productName || '',
                price: Number(b.price) || 0
              })) : undefined,
              userBuildId: req.user_build_id ?? req.userBuildId ?? null,
              buildName: req.build_name ?? req.buildName ?? null,
              totalPrice: req.total_price ?? req.totalPrice ?? null,
              createdAt: req.created_at
                ? req.created_at.split("T")[0]
                : new Date().toISOString().split("T")[0],
              rawReq: req,
            };
          });
          setMyRequests(formattedRequests);
        }
      } catch (err) {
        console.error("Failed to fetch user requests:", err);
      } finally {
        if (mounted) setRequestsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, user]);

  const submitRequest = async () => {
    if (!requestForm.purpose) {
      toast.error("Vui lòng chọn mục đích sử dụng");
      return;
    }
    const buildItems = buildComponents
      .filter((c) => c.product)
      .map((c) => ({
        category: c.category,
        name: c.product!.name,
        price: c.product!.price,
      }));

    try {
      setModalLoading(true);
      // Combine purpose và note thành customer_note
      const customerNote =
        `Mục đích: ${requestForm.purpose}\n${requestForm.note ? `Ghi chú: ${requestForm.note}` : ""}`.trim();

      const payload = {
        customer_note: customerNote,
        budget_range: budget,
      };
      const response =
        await StaffBuildRequestsApi.createMyStaffBuildRequest(payload);

      const newReq: UserRequest = {
        id: String(response.request_id || response.id || `REQ-${Date.now()}`),
        budget: response.budget_range || budget,
        purpose: requestForm.purpose,
        note: requestForm.note,
        buildItems: buildItems,
        status: response.status || "pending",
        rejectReason: response.rejectReason,
        staffBuild: response.staffBuild,
        createdAt:
          response.created_at || new Date().toISOString().split("T")[0],
      };
      setMyRequests([newReq, ...myRequests]);
      setShowRequestModal(false);
      setRequestForm({ purpose: "Gaming", note: "" });
      toast.success("Đã gửi yêu cầu tư vấn build PC!");
    } catch (err) {
      console.error("Submit request failed:", err);
      toast.error("Gửi yêu cầu thất bại");
    } finally {
      setModalLoading(false);
    }
  };

  const saveUserBuild = async () => {
    if (!isLoggedIn || !user) {
      openLogin();
      return;
    }
    const defaultName = `Build ${new Date().toISOString().slice(0, 10)}`;
    setModalDefaultName(defaultName);
    setModalMode("save");
    setModalOpen(true);
  };

  // called when modal confirms save
  const handleSaveConfirm = async (value: string | any) => {
    if (!isLoggedIn || !user) return;
    const buildName = String(value || "");
    const items = buildComponents
      .filter((c) => c.product)
      .map((c) => ({ product_id: Number(c.product!.id), quantity: 1 }));

    if (items.length === 0) {
      toast.error("Vui lòng chọn ít nhất một linh kiện để lưu");
      setModalOpen(false);
      return;
    }

    try {
      setModalLoading(true);
      await UserBuildsApi.createUserBuild(user.user_id, {
        build_name: buildName,
        items,
      });
      toast.success("Đã lưu build thành công");
    } catch (err) {
      console.error("Save user build failed", err);
      toast.error("Lưu build thất bại");
    } finally {
      setModalLoading(false);
      setModalOpen(false);
    }
  };

  const loadMyBuilds = async () => {
    if (!isLoggedIn || !user) {
      openLogin();
      return;
    }
    try {
      const builds = await UserBuildsApi.getUserBuilds(user.user_id);
      if (!builds || builds.length === 0) {
        toast.info("Bạn chưa có build nào");
        return;
      }
      // open modal to choose build
      setModalBuilds(builds || []);
      setModalMode("choose");
      setModalOpen(true);
      return;
    } catch (err) {
      console.error("Load builds failed", err);
      toast.error("Không thể tải builds");
    }
  };

  const handleChooseConfirm = async (value: any) => {
    let pick = value as any;
    if (!pick) {
      setModalOpen(false);
      return;
    }

    try {
      setModalLoading(true);

      // Fetch full build detail if items are missing (list API usually doesn't include them)
      const buildId = pick.user_build_id || pick.id;
      if (buildId && (!pick.items || pick.items.length === 0)) {
        try {
          const full = await UserBuildsApi.getUserBuildById(String(buildId));
          if (full) pick = full;
        } catch (e) {
          console.error("Failed to fetch full build detail:", e);
        }
      }

      const items: any[] = pick.items || pick.build_items || pick.data?.items || [];
      if (items.length === 0) {
        toast.info("Bản build này không có linh kiện nào hoặc chưa được tải xong");
        return;
      }

      if (allProducts.length === 0) {
        toast.error("Dữ liệu linh kiện chưa tải xong, vui lòng thử lại sau giây lát");
        return;
      }

      const newComponents = PC_BUILDER_CATEGORIES.map((category) => {
        // Find saved item by matching its product's category
        const item = items.find((it: any) => {
          const prodId = Number(it.product_id || it.productId || it.id);
          const p = allProducts.find((p) => Number(p.id) === prodId);
          return p?.category === category;
        });

        let product = null;
        if (item) {
          const pid = Number(item.product_id || item.productId || item.id);
          const found = allProducts.find((p) => Number(p.id) === pid);
          product = found ?? null;
        }
        return { category, product };
      });

      setBuildComponents(newComponents);
      toast.success("Đã tải cấu hình build của bạn");
    } catch (err) {
      console.error("Apply build failed", err);
      toast.error("Không thể áp dụng build");
    } finally {
      setModalLoading(false);
      setModalOpen(false);
    }
  };

  const totalPrice = buildComponents.reduce((sum, comp) => sum + (comp.product?.price ?? 0), 0);
  const remainingBudget = budget - totalPrice;

  const selectProduct = (category: string, product: Product) => {
    setBuildComponents((prev) => prev.map((comp) => comp.category === category ? { ...comp, product } : comp));
  };

  const removeProduct = (category: string) => {
    setBuildComponents((prev) => prev.map((comp) => comp.category === category ? { ...comp, product: null } : comp));
  };

  const autoBuild = () => {
    if (allProducts.length === 0) {
      toast.error("Chưa có dữ liệu sản phẩm");
      return;
    }
    const newBuild: BuildComponent[] = [];
    let remaining = budget;
    for (const comp of buildComponents) {
      const categoryBudget = budget * (ALLOCATIONS[comp.category] ?? 0);
      const available = allProducts
        .filter(
          (p) =>
            p.category === comp.category && p.price <= remaining && p.stock > 0,
        )
        .sort(
          (a, b) =>
            Math.abs(a.price - categoryBudget) -
            Math.abs(b.price - categoryBudget),
        );
      const selected = available[0] ?? null;
      if (selected) remaining -= selected.price;
      newBuild.push({ category: comp.category, product: selected });
    }
    setBuildComponents(newBuild);
    const selectedCount = newBuild.filter((c) => c.product).length;
    if (selectedCount === 0)
      toast.error("Không tìm được linh kiện phù hợp ngân sách");
    else
      toast.success(
        `Đã tự động chọn ${selectedCount} linh kiện theo ngân sách!`,
      );
  };

  const resetBuild = () => {
    setBuildComponents((prev) => prev.map((comp) => ({ ...comp, product: null })));
    toast.info('Đã xóa cấu hình build');
  };

  const addBuildToCart = () => {
    const selected = buildComponents
      .filter((c): c is BuildComponent & { product: Product } => c.product !== null)
      .map((c) => c.product);
    if (selected.length === 0) { toast.error('Vui lòng chọn ít nhất một linh kiện'); return; }
    selected.forEach((p) => addToCart(p, 1));
    toast.success(`Đã thêm ${selected.length} linh kiện vào giỏ hàng!`);
  };

  const buyAsBundle = async () => {
    if (!isLoggedIn || !user) {
      openLogin();
      return;
    }

    const selected = buildComponents
      .filter((c) => c.product)
      .map((c) => ({ category: c.category, product: c.product! }));
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất một linh kiện để mua nguyên bộ");
      return;
    }

    const defaultName = `Build ${new Date().toISOString().slice(0, 10)}`;
    setModalDefaultName(defaultName);
    setModalMode("buy");
    setModalOpen(true);
    return;
  };

  const handleBuyConfirm = async (value: string | any) => {
    if (!isLoggedIn || !user) return;
    const buildName = String(value || `Custom Build ${Date.now()}`);
    const selectedItems = buildComponents
      .filter((c) => c.product)
      .map((c) => ({ category: c.category, product: c.product! }));
    const items = selectedItems.map((s) => ({
      product_id: Number(s.product.id),
      quantity: 1,
    }));

    try {
      setModalLoading(true);
      const res = await PcBuildsApi.createPcBuild({
        build_name: buildName,
        items,
      });
      const product = res.product;
      if (!product) {
        toast.error("Tạo sản phẩm build thất bại");
        return;
      }

      const productForCart: Product = {
        id: String(product.product_id || product.id || ""),
        name: product.name || product.product_name || buildName,
        category: "pc" as any,
        price: product.price || res.total_price || 0,
        image: product.image_url || "",
        description: product.description || "",
        specs: {},
        stock: product.stock_quantity ?? 0,
      };

      addToCart(productForCart, 1);
      toast.success("Đã tạo sản phẩm build và thêm vào giỏ hàng");
    } catch (err) {
      console.error("Buy as bundle failed", err);
      toast.error("Không thể tạo sản phẩm build");
    } finally {
      setModalLoading(false);
      setModalOpen(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 min-h-[80vh]">
      <Breadcrumb items={[{ label: "Build PC" }]} />
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Build PC theo ý muốn
        </h1>
        <p
          className={isDark ? "text-sm text-gray-400" : "text-sm text-gray-600"}
        >
          Chọn linh kiện phù hợp với ngân sách
        </p>
      </div>

      {/* Tab Switcher */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "16px",
          padding: "4px",
          borderRadius: "12px",
          background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
          width: "fit-content",
        }}
      >
        <button
          onClick={() => setActiveTab("build")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            background:
              activeTab === "build"
                ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                : "transparent",
            color:
              activeTab === "build" ? "#fff" : isDark ? "#9ca3af" : "#6b7280",
          }}
        >
          Build PC
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background:
              activeTab === "requests"
                ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                : "transparent",
            color:
              activeTab === "requests"
                ? "#fff"
                : isDark
                  ? "#9ca3af"
                  : "#6b7280",
          }}
        >
          <ClipboardList style={{ width: 14, height: 14 }} /> Yêu cầu
          {myRequests.filter((r) => r.status === "pending").length > 0 && (
            <span
              style={{
                background: "#f59e0b",
                color: "#000",
                fontSize: "10px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "10px",
              }}
            >
              {myRequests.filter((r) => r.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "build" ? (
        <>
          {/* Budget & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            {/* Left: Budget controls */}
            <div
              className={`lg:col-span-2 backdrop-blur-sm rounded-lg p-4 ${isDark ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30" : "bg-white/80 border border-purple-300 shadow-lg"}`}
            >
              <label className="block mb-3">
                <span
                  className={`text-base font-semibold mb-2 block ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Ngân sách:
                </span>
                <input
                  type="range"
                  min={10000000}
                  max={100000000}
                  step={1000000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full"
                />
                <div
                  className={`flex justify-between text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  <span>10.000.000₫</span>
                  <span className="text-lg font-bold text-purple-400">
                    {budget.toLocaleString("vi-VN")}₫
                  </span>
                  <span>100.000.000₫</span>
                </div>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={autoBuild}
                  disabled={productsLoading}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 text-white disabled:opacity-50 disabled:hover:scale-100 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />{" "}
                  {productsLoading ? "Tải..." : "Tự động"}
                </button>
                <button
                  onClick={resetBuild}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${isDark ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white" : "bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-700"}`}
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Middle: Selected products sidebar */}
            <div
              className={`backdrop-blur-sm rounded-lg p-4 ${isDark ? "bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30" : "bg-white/80 border border-green-300 shadow-lg"}`}
            >
              <h3
                className={`text-base font-bold mb-3 flex items-center gap-2 ${isDark ? "text-green-400" : "text-green-600"}`}
              >
                <CheckCircle className="w-4 h-4" /> Linh kiện đã chọn
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {buildComponents.filter(c => c.product).length === 0 ? (
                  <p className={`text-xs text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                    Chưa chọn linh kiện nào
                  </p>
                ) : (
                  buildComponents.filter(c => c.product).map((comp) => (
                    <div
                      key={comp.category}
                      className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-50"}`}
                    >
                      <img
                        src={comp.product!.image}
                        alt={comp.product!.name}
                        className="w-10 h-10 object-contain rounded"
                        style={{ background: "#fff" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-black">
                          {PC_BUILDER_LABELS[comp.category]}
                        </p>
                        <p className="text-xs truncate text-gray-700">
                          {comp.product!.name}
                        </p>
                      </div>
                      <button
                        onClick={() => removeProduct(comp.category)}
                        className={`p-1 rounded hover:bg-red-500/20 ${isDark ? "text-red-400" : "text-red-600"}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {buildComponents.filter(c => c.product).length > 0 && (
                <div className={`mt-3 pt-3 border-t ${isDark ? "border-green-500/30" : "border-green-300"}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                      Tổng:
                    </span>
                    <span className={`text-sm font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                      {totalPrice.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div
              className={`backdrop-blur-sm rounded-lg p-4 ${isDark ? "bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30" : "bg-white/80 border border-blue-300 shadow-lg"}`}
            >
              <h3
                className={`text-base font-bold mb-3 ${isDark ? "text-blue-400" : "text-blue-600"}`}
              >
                Tổng quan
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    Tổng chi phí:
                  </span>
                  <span
                    className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {totalPrice.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    Ngân sách:
                  </span>
                  <span
                    className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {budget.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div
                  className={`pt-2 border-t ${isDark ? "border-blue-500/30" : "border-blue-300"}`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Còn lại:
                    </span>
                    <span
                      className={`font-bold ${remainingBudget < 0 ? "text-red-400" : "text-green-400"}`}
                    >
                      {remainingBudget.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </div>
              {totalPrice > 0 && (
                <button
                  onClick={addBuildToCart}
                  className="w-full mt-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-transform text-white text-sm"
                >
                  Thêm giỏ hàng
                </button>
              )}
            </div>
          </div>

          {/* Request Button */}
          <div style={{ marginBottom: "12px" }}>
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  openLogin();
                  return;
                }
                setShowRequestModal(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <Send style={{ width: 16, height: 16 }} /> Gửi yêu cầu tư vấn
            </button>
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <button
                onClick={saveUserBuild}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold text-sm"
              >
                Lưu build
              </button>
              <button
                onClick={loadMyBuilds}
                className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-800 font-semibold text-sm"
              >
                Tải build
              </button>
            </div>
            <p
              style={{
                fontSize: "11px",
                color: isDark ? "#6b7280" : "#9ca3af",
                marginTop: "4px",
              }}
            >
              Đội kỹ thuật sẽ tư vấn build phù hợp cho bạn
            </p>
          </div>

          <BuildModal
            open={modalOpen}
            mode={modalMode}
            builds={modalBuilds}
            defaultName={modalDefaultName}
            loading={modalLoading}
            onCancel={() => setModalOpen(false)}
            onConfirm={(v) => {
              if (modalMode === "save") return handleSaveConfirm(v);
              if (modalMode === "choose") return handleChooseConfirm(v);
              if (modalMode === "buy") return handleBuyConfirm(v);
            }}
          />

          {/* Component Selection */}
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2
                className={`w-10 h-10 animate-spin ${isDark ? "text-purple-400" : "text-purple-600"}`}
              />
              <p
                className={`mt-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Đang tải danh sách linh kiện...
              </p>
            </div>
          ) : (
            <>
              {/* Category Selector Tabs */}
              <div
                className="flex flex-wrap gap-2 mb-6 pb-4 border-b"
                style={{
                  borderColor: isDark ? "rgba(139,92,246,0.2)" : "#e5e7eb",
                }}
              >
                {buildComponents.map((comp) => (
                  <button
                    key={comp.category}
                    onClick={() => setSelectedCategory(comp.category)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                      selectedCategory === comp.category
                        ? isDark
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                        : isDark
                          ? "bg-white/10 text-gray-400 hover:bg-white/20"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {PC_BUILDER_LABELS[comp.category]}
                    {comp.product && (
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Category Content */}
              {buildComponents.map((comp) => {
                if (selectedCategory !== comp.category) return null;

                const available = allProducts
                  .filter((p) => p.category === comp.category && p.stock > 0)
                  .sort((a, b) => a.price - b.price);

                return (
                  <div
                    key={comp.category}
                    className={`rounded-xl p-4 ${isDark ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30" : "bg-white/80 border border-purple-300 shadow-lg"}`}
                  >
                    {/* Header with Title and Remove Button */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3
                          className={`text-xl font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}
                        >
                          {PC_BUILDER_LABELS[comp.category]}
                        </h3>
                        <p
                          className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {available.length} sản phẩm có sẵn
                        </p>
                      </div>
                      {comp.product && (
                        <button
                          onClick={() => removeProduct(comp.category)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-600"}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Selected Product */}
                    {comp.product ? (
                      <div
                        className={`rounded-xl p-4 mb-4 ${isDark ? "bg-slate-900/50 border border-gray-700" : "bg-gray-50 border border-gray-300"}`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={comp.product.image}
                            alt={comp.product.name}
                            className="w-60 h-80 object-contain rounded-xl flex-shrink-0 p-3 bg-white shadow-lg"
                            style={{ width: 240, height: 280 }}
                          />
                          <div className="flex-1">
                            <h4
                              className={`text-base font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {comp.product.name}
                            </h4>
                            <p
                              className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {comp.product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-2xl font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}
                              >
                                {comp.product.price.toLocaleString("vi-VN")}₫
                              </p>
                              {comp.product.stock < 10 && (
                                <p className="text-xs text-orange-500 font-semibold">
                                  ⚠️ Còn {comp.product.stock}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Product List */}
                    {available.length > 0 ? (
                      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {available.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => selectProduct(comp.category, p)}
                            className={`rounded-xl overflow-hidden transition-all duration-300 text-left border ${
                              comp.product?.id === p.id
                                ? isDark
                                  ? "border-purple-500 shadow-lg shadow-purple-500/30"
                                  : "border-purple-400 shadow-lg shadow-purple-300"
                                : isDark
                                  ? "border-gray-700 hover:border-purple-500"
                                  : "border-gray-300 hover:border-purple-400"
                            } ${isDark ? "bg-gray-900/40 hover:bg-gray-900/60" : "bg-white/90 hover:bg-white"}`}
                          >
                            <div className="relative flex items-center justify-center p-3 overflow-hidden rounded-t-xl bg-white border-b border-gray-100/10" style={{ height: 220 }}>
                              <img
                                src={p.image}
                                alt={p.name}
                                className="object-contain transition-transform duration-300 hover:scale-110"
                                style={{ width: 200, height: 200 }}
                              />
                              {comp.product?.id === p.id && (
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                  <CheckCircle className="w-12 h-12 text-green-400" />
                                </div>
                              )}
                              {p.stock < 10 && (
                                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-lg">
                                  Còn {p.stock}
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h5
                                className={`font-bold text-xs mb-1 line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {p.name}
                              </h5>
                              <p
                                className={`text-xs line-clamp-1 mb-2 ${isDark ? "text-gray-500" : "text-gray-600"}`}
                              >
                                {p.description}
                              </p>
                              <p
                                className={`text-sm font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}
                              >
                                {p.price.toLocaleString("vi-VN")}₫
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl py-12 text-center border-2 border-dashed ${isDark ? "bg-gray-900/20 border-gray-700/50" : "bg-gray-50 border-gray-300"}`}
                      >
                        <p
                          className={`text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}
                        >
                          Chưa có sản phẩm nào trong danh mục này
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      ) : (
        /* My Requests Tab */
        <div>
          {myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <ClipboardList style={{ width: 64, height: 64, color: isDark ? '#4b5563' : '#d1d5db', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#fff' : '#111', marginBottom: '8px' }}>Chưa có yêu cầu nào</p>
              <p style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#6b7280' }}>Chuyển sang tab "Build PC" để gửi yêu cầu tư vấn</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myRequests.map((req) => {
                const st = STATUS_INFO[req.status];
                const StIcon = st.icon;
                return (
                  <div key={req.id} style={{ padding: '20px', borderRadius: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${isDark ? 'rgba(139,92,246,0.15)' : '#e5e7eb'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#fff' : '#111' }}>{req.id}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: st.color, background: `${st.color}15` }}>
                            <StIcon style={{ width: 13, height: 13 }} /> {st.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: isDark ? '#9ca3af' : '#6b7280', flexWrap: 'wrap' }}>
                          <span>Ngân sách: <strong style={{ color: isDark ? '#10b981' : '#059669' }}>{req.budget.toLocaleString('vi-VN')}₫</strong></span>
                          <span>Mục đích: <strong style={{ color: isDark ? '#d1d5db' : '#374151' }}>{req.purpose}</strong></span>
                          <span>{req.createdAt}</span>
                        </div>
                      </div>
                      <button onClick={() => setViewRequest(req)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff', color: isDark ? '#a78bfa' : '#7c3aed', fontSize: '13px', fontWeight: 600 }}>
                        <Eye style={{ width: 15, height: 15 }} /> Chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowRequestModal(false)} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '28px', background: isDark ? 'linear-gradient(160deg, #130d30, #0f0e17)' : '#fff', border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#fff' : '#111', margin: 0 }}>Gửi yêu cầu tư vấn</h2>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Mục đích sử dụng <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={requestForm.purpose} onChange={(e) => setRequestForm(p => ({ ...p, purpose: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: isDark ? '#fff' : '#111', border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb', outline: 'none', cursor: 'pointer' }}>
                  <option value="" disabled style={{ color: '#6b7280' }}>Chọn mục đích...</option>
                  <option value="Gaming" style={{ background: isDark ? '#1f2937' : '#fff' }}>Gaming</option>
                  <option value="Văn phòng" style={{ background: isDark ? '#1f2937' : '#fff' }}>Văn phòng (Word, Excel...)</option>
                  <option value="Đồ họa / Render" style={{ background: isDark ? '#1f2937' : '#fff' }}>Đồ họa / Render / Dựng Video</option>
                  <option value="Lập trình" style={{ background: isDark ? '#1f2937' : '#fff' }}>Lập trình / Chạy Server</option>
                  <option value="Khác" style={{ background: isDark ? '#1f2937' : '#fff' }}>Khác</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Ghi chú thêm (Tùy chọn)</label>
                <textarea value={requestForm.note} onChange={(e) => setRequestForm(p => ({ ...p, note: e.target.value }))} rows={3} placeholder="Ví dụ: Cần tản nước AIO, thích màu trắng, RAM RGB..." style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: isDark ? '#fff' : '#111', border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Ngân sách dự kiến</label>
                <div style={{ padding: '12px 14px', borderRadius: '10px', fontSize: '16px', fontWeight: 700, background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', color: isDark ? '#10b981' : '#059669', border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #a7f3d0' }}>{budget.toLocaleString('vi-VN')}₫</div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Lấy từ thanh ngân sách bạn đã chọn</p>
              </div>
              {buildComponents.filter((c) => c.product).length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '6px' }}>Cấu hình bạn đã chọn (sẽ gửi kèm)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {buildComponents.filter((c) => c.product).map((c) => (
                      <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', fontSize: '13px' }}>
                        <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{PC_BUILDER_LABELS[c.category]}: <strong style={{ color: isDark ? '#d1d5db' : '#374151' }}>{c.product!.name}</strong></span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{c.product!.price.toLocaleString('vi-VN')}₫</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowRequestModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb', background: 'transparent', color: isDark ? '#9ca3af' : '#6b7280' }}>Hủy</button>
              <button onClick={submitRequest} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff' }}>Gửi yêu cầu</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* View Request Detail Modal */}
      {viewRequest && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setViewRequest(null)} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px', borderRadius: '20px', padding: '28px', background: isDark ? 'linear-gradient(160deg, #130d30, #0f0e17)' : '#fff', border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#fff' : '#111', margin: 0 }}>Yêu cầu tư vấn</h2>
                <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: STATUS_INFO[viewRequest.status].color, background: `${STATUS_INFO[viewRequest.status].color}15` }}>{STATUS_INFO[viewRequest.status].label}</span>
              </div>
            </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      marginBottom: "2px",
                    }}
                  >
                    Ngân sách
                  </p>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#10b981",
                      margin: 0,
                    }}
                  >
                    {viewRequest.budget.toLocaleString("vi-VN")}₫
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      marginBottom: "2px",
                    }}
                  >
                    Mục đích
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: isDark ? "#d1d5db" : "#374151",
                      margin: 0,
                    }}
                  >
                    {viewRequest.purpose}
                  </p>
                </div>
              </div>
              {viewRequest.note && (
                <div style={{ marginBottom: "18px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      marginBottom: "6px",
                    }}
                  >
                    Ghi chú
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: isDark ? "#d1d5db" : "#4b5563",
                      margin: 0,
                      lineHeight: 1.6,
                      padding: "12px",
                      borderRadius: "10px",
                      background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb",
                    }}
                  >
                    {viewRequest.note}
                  </p>
                </div>
              )}
              {viewRequest.buildItems.length > 0 && (
                <div style={{ marginBottom: "18px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      marginBottom: "8px",
                    }}
                  >
                    Cấu hình bạn đã gửi
                  </p>
                  {viewRequest.buildItems.map((b) => (
                    <div
                      key={b.category}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginBottom: "4px",
                        background: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "#f9fafb",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                        {b.name}
                      </span>
                      <span style={{ color: "#10b981", fontWeight: 600 }}>
                        {b.price.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {viewRequest.status === "rejected" &&
                viewRequest.rejectReason && (
                  <div
                    style={{
                      marginBottom: "18px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#ef4444",
                        marginBottom: "4px",
                      }}
                    >
                      Lý do từ chối
                    </p>
                    <p
                      style={{ fontSize: "14px", color: "#fca5a5", margin: 0 }}
                    >
                      {viewRequest.rejectReason}
                    </p>
                  </div>
                )}
              {/* Completed: Prefer user_build_id (server-stored build) */}
              {viewRequest.status === "completed" && viewRequest.userBuildId && (
                <div style={{ marginBottom: "18px" }}>
                  {typeof viewRequest.totalPrice === "number" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>Tổng</span>
                      <span style={{ fontSize: 16, color: "#10b981", fontWeight: 900 }}>
                        {Number(viewRequest.totalPrice || 0).toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}
                  <UserBuildDetail
                    userBuildId={Number(viewRequest.userBuildId)}
                    fallbackName={viewRequest.buildName || undefined}
                  />
                </div>
              )}

              {/* Fallback: show staffBuild only when no user_build_id */}
              {viewRequest.status === "completed" && !viewRequest.userBuildId && viewRequest.staffBuild && (
                <div style={{ marginBottom: "18px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      marginBottom: "8px",
                    }}
                  >
                    Cấu hình từ đội kỹ thuật
                  </p>
                  {viewRequest.staffBuild.map((b) => (
                    <div
                      key={b.category}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        marginBottom: "6px",
                        background: isDark
                          ? "rgba(139,92,246,0.06)"
                          : "#faf5ff",
                        border: isDark
                          ? "1px solid rgba(139,92,246,0.12)"
                          : "1px solid #e9d5ff",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          {PC_BUILDER_LABELS[
                            b.category as keyof typeof PC_BUILDER_LABELS
                          ] ?? b.category}
                        </span>
                        <p
                          style={{
                            fontSize: "14px",
                            color: isDark ? "#d1d5db" : "#374151",
                            margin: "2px 0 0",
                          }}
                        >
                          {b.name}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#a78bfa",
                          fontWeight: 600,
                          alignSelf: "center",
                        }}
                      >
                        {b.price.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', paddingTop: '8px', fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>
                    Tổng: {viewRequest.staffBuild!.reduce((s, b) => s + b.price, 0).toLocaleString('vi-VN')}₫
                  </div>
                </div>
              )}
              <button
                onClick={() => setViewRequest(null)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isDark
                    ? "1px solid rgba(139,92,246,0.2)"
                    : "1px solid #e5e7eb",
                  background: "transparent",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Đóng
              </button>
            </div>
          </div>,
        document.body
      )}
    </div>
  );
}
