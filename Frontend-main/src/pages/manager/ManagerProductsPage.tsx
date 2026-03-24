import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Upload,
  ImageIcon,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from "@/api/products";
import { getCategoriesApi, type Category } from "@/api/categories";
import {
  getSpecsByProductIdApi,
  createSpecApi,
  updateSpecApi,
  deleteSpecApi,
  type Specification,
} from "@/api/specifications";
import { apiClient } from "@/api/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Product } from "@/types";

const formatPrice = (p: number) => p.toLocaleString("vi-VN") + "đ";

type ModalMode = "create" | "edit" | null;

export function ManagerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    price: "",
    stock: "",
    description: "",
    brand: "",
    status: "Available",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [specsProduct, setSpecsProduct] = useState<Product | null>(null);
  const [specs, setSpecs] = useState<Specification[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [newSpec, setNewSpec] = useState({ spec_name: "", spec_value: "" });
  const [editSpec, setEditSpec] = useState<Specification | null>(null);
  const [editSpecForm, setEditSpecForm] = useState({
    spec_name: "",
    spec_value: "",
  });
  const [specSaving, setSpecSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        getProductsApi(),
        getCategoriesApi(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || String(p.category_id) === filterCat;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setForm({
      name: "",
      category_id: categories[0]?.category_id?.toString() || "",
      price: "",
      stock: "",
      description: "",
      brand: "",
      status: "Available",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditProduct(null);
    setModal("create");
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      category_id: p.category_id ? String(p.category_id) : "",
      price: String(p.price),
      stock: String(p.stock),
      description: p.description,
      brand: p.specs?.Brand || "",
      status: "Available",
    });
    setImageFile(null);
    setImagePreview(
      p.image && !p.image.includes("placeholder") ? p.image : null,
    );
    setEditProduct(p);
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setEditProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Vui lòng điền tên và giá sản phẩm");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      if (form.category_id) formData.append("category_id", form.category_id);
      if (form.stock) formData.append("stock_quantity", form.stock);
      if (form.status) formData.append("status", form.status);
      if (form.brand) formData.append("brand", form.brand);
      if (form.description) formData.append("description", form.description);
      if (imageFile) formData.append("image", imageFile);

      if (modal === "create") {
        await createProductApi(formData);
        toast.success("Thêm sản phẩm thành công");
      } else if (modal === "edit" && editProduct) {
        await updateProductApi(editProduct.id, formData);
        toast.success("Cập nhật sản phẩm thành công");
      }
      closeModal();
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProductApi(deleteTarget.id);
      toast.success("Xóa sản phẩm thành công");
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const openSpecs = async (p: Product) => {
    setSpecsProduct(p);
    setSpecsLoading(true);
    setNewSpec({ spec_name: "", spec_value: "" });
    setEditSpec(null);
    try {
      setSpecs(await getSpecsByProductIdApi(p.id));
    } catch (err) {
      console.error(err);
      setSpecs([]);
    } finally {
      setSpecsLoading(false);
    }
  };

  const closeSpecs = () => {
    setSpecsProduct(null);
    setSpecs([]);
    setEditSpec(null);
  };

  const handleAddSpec = async () => {
    if (!newSpec.spec_name || !newSpec.spec_value || !specsProduct) return;
    setSpecSaving(true);
    try {
      const created = await createSpecApi({
        product_id: Number(specsProduct.id),
        spec_name: newSpec.spec_name,
        spec_value: newSpec.spec_value,
      });
      setSpecs([...specs, created]);
      setNewSpec({ spec_name: "", spec_value: "" });
      toast.success("Thêm thông số thành công");
    } catch (err: any) {
      toast.error(err?.message || "Thêm thất bại");
    } finally {
      setSpecSaving(false);
    }
  };

  const handleUpdateSpec = async () => {
    if (!editSpec) return;
    setSpecSaving(true);
    try {
      const updated = await updateSpecApi(editSpec.spec_id, {
        spec_name: editSpecForm.spec_name,
        spec_value: editSpecForm.spec_value,
      });
      setSpecs(
        specs.map((s) => (s.spec_id === editSpec.spec_id ? updated : s)),
      );
      setEditSpec(null);
      toast.success("Cập nhật thông số thành công");
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật thất bại");
    } finally {
      setSpecSaving(false);
    }
  };

  const handleDeleteSpec = async (specId: number) => {
    try {
      await deleteSpecApi(specId);
      setSpecs(specs.filter((s) => s.spec_id !== specId));
      toast.success("Xóa thông số thành công");
    } catch (err: any) {
      toast.error(err?.message || "Xóa thất bại");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(245,158,11,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
        Đang tải...
      </div>
    );

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
              margin: 0,
            }}
          >
            Quản lý sản phẩm
          </h1>
          <p style={{ fontSize: "14px", color: "#9ca3af", marginTop: "4px" }}>
            {products.length} sản phẩm
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #f59e0b, #ea580c)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus style={{ width: 18, height: 18 }} /> Thêm sản phẩm
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: 18,
              height: 18,
              color: "#9ca3af",
            }}
          />
          <input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "40px" }}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{
            ...inputStyle,
            width: "auto",
            minWidth: "160px",
            cursor: "pointer",
          }}
        >
          <option value="all" style={{ background: "#0f0a24", color: "#fff" }}>
            Tất cả danh mục
          </option>
          {categories.map((c) => (
            <option
              key={c.category_id}
              value={String(c.category_id)}
              style={{ background: "#0f0a24", color: "#fff" }}
            >
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(245,158,11,0.12)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(245,158,11,0.08)" }}>
                {[
                  "#",
                  "Tên sản phẩm",
                  "Danh mục",
                  "Giá",
                  "Tồn kho",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid rgba(245,158,11,0.05)" }}
                >
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "14px",
                      color: "#fff",
                      fontWeight: 500,
                      maxWidth: "300px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {p.image && !p.image.includes("placeholder") ? (
                        <img
                          src={p.image}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "8px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "8px",
                            background: "rgba(245,158,11,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ImageIcon
                            style={{ width: 18, height: 18, color: "#6b7280" }}
                          />
                        </div>
                      )}
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#f59e0b",
                        background: "rgba(245,158,11,0.12)",
                      }}
                    >
                      {p.category_name || p.category}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "14px",
                      color: "#10b981",
                      fontWeight: 600,
                    }}
                  >
                    {formatPrice(p.price)}
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "14px",
                      color: p.stock < 10 ? "#ef4444" : "#d1d5db",
                    }}
                  >
                    {p.stock}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openSpecs(p)}
                        title="Thông số kỹ thuật"
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          background: "rgba(16,185,129,0.15)",
                          color: "#34d399",
                          display: "flex",
                        }}
                      >
                        <ListChecks style={{ width: 16, height: 16 }} />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          background: "rgba(59,130,246,0.15)",
                          color: "#60a5fa",
                          display: "flex",
                        }}
                      >
                        <Pencil style={{ width: 16, height: 16 }} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          background: "rgba(239,68,68,0.15)",
                          color: "#f87171",
                          display: "flex",
                        }}
                      >
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={closeModal}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: "540px",
              background: "linear-gradient(160deg, #1a1a0e, #0f0e17)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "20px",
              padding: "28px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                }}
              >
                {modal === "create" ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#9ca3af",
                    marginBottom: "6px",
                  }}
                >
                  Tên sản phẩm *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Danh mục
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      setForm({ ...form, category_id: e.target.value })
                    }
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option
                      value=""
                      style={{ background: "#0f0a24", color: "#fff" }}
                    >
                      -- Chọn --
                    </option>
                    {categories.map((c) => (
                      <option
                        key={c.category_id}
                        value={c.category_id}
                        style={{ background: "#0f0a24", color: "#fff" }}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Thương hiệu
                  </label>
                  <input
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="VD: MSI, ASUS..."
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Giá (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Trạng thái
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option
                      value="Available"
                      style={{ background: "#0f0a24", color: "#fff" }}
                    >
                      Available
                    </option>
                    <option
                      value="Unavailable"
                      style={{ background: "#0f0a24", color: "#fff" }}
                    >
                      Unavailable
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#9ca3af",
                    marginBottom: "6px",
                  }}
                >
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  placeholder="Mô tả sản phẩm..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#9ca3af",
                    marginBottom: "6px",
                  }}
                >
                  Hình ảnh sản phẩm
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed rgba(245,158,11,0.3)",
                    borderRadius: "12px",
                    padding: imagePreview ? "8px" : "28px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(245,158,11,0.03)",
                    transition: "border-color 0.2s",
                  }}
                >
                  {imagePreview ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxHeight: "160px",
                          borderRadius: "8px",
                          objectFit: "contain",
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.7)",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginTop: "8px",
                        }}
                      >
                        {imageFile ? imageFile.name : "Nhấn để đổi ảnh"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload
                        style={{
                          width: 28,
                          height: 28,
                          color: "#f59e0b",
                          margin: "0 auto 8px",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#d1d5db",
                          margin: "0 0 4px",
                        }}
                      >
                        Nhấn để chọn ảnh từ máy
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        PNG, JPG, WEBP
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "1px solid rgba(245,158,11,0.2)",
                  background: "transparent",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                  color: "#fff",
                  cursor: "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving
                  ? "Đang lưu..."
                  : modal === "create"
                    ? "Thêm"
                    : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specs Modal */}
      {specsProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={closeSpecs}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: "600px",
              background: "linear-gradient(160deg, #1a1a0e, #0f0e17)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "20px",
              padding: "28px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  Thông số kỹ thuật
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  {specsProduct.name}
                </p>
              </div>
              <button
                onClick={closeSpecs}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {specsLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "#9ca3af",
                }}
              >
                Đang tải...
              </div>
            ) : (
              <>
                {specs.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    {specs.map((s) => (
                      <div
                        key={s.spec_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(16,185,129,0.1)",
                        }}
                      >
                        {editSpec?.spec_id === s.spec_id ? (
                          <>
                            <input
                              value={editSpecForm.spec_name}
                              onChange={(e) =>
                                setEditSpecForm({
                                  ...editSpecForm,
                                  spec_name: e.target.value,
                                })
                              }
                              style={{
                                ...inputStyle,
                                flex: 1,
                                padding: "8px 10px",
                                fontSize: "13px",
                              }}
                            />
                            <input
                              value={editSpecForm.spec_value}
                              onChange={(e) =>
                                setEditSpecForm({
                                  ...editSpecForm,
                                  spec_value: e.target.value,
                                })
                              }
                              style={{
                                ...inputStyle,
                                flex: 1,
                                padding: "8px 10px",
                                fontSize: "13px",
                              }}
                            />
                            <button
                              onClick={handleUpdateSpec}
                              disabled={specSaving}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: "rgba(16,185,129,0.2)",
                                color: "#34d399",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {specSaving ? "..." : "Lưu"}
                            </button>
                            <button
                              onClick={() => setEditSpec(null)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "none",
                                background: "rgba(255,255,255,0.05)",
                                color: "#9ca3af",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              style={{
                                flex: 1,
                                fontSize: "14px",
                                color: "#d1d5db",
                                fontWeight: 500,
                              }}
                            >
                              {s.spec_name}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                fontSize: "14px",
                                color: "#10b981",
                                fontWeight: 600,
                              }}
                            >
                              {s.spec_value}
                            </span>
                            <button
                              onClick={() => {
                                setEditSpec(s);
                                setEditSpecForm({
                                  spec_name: s.spec_name,
                                  spec_value: s.spec_value,
                                });
                              }}
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                border: "none",
                                background: "rgba(59,130,246,0.15)",
                                color: "#60a5fa",
                                cursor: "pointer",
                                display: "flex",
                              }}
                            >
                              <Pencil style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => handleDeleteSpec(s.spec_id)}
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                border: "none",
                                background: "rgba(239,68,68,0.15)",
                                color: "#f87171",
                                cursor: "pointer",
                                display: "flex",
                              }}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "#6b7280",
                      fontSize: "14px",
                      marginBottom: "20px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "12px",
                    }}
                  >
                    Chưa có thông số kỹ thuật nào
                  </div>
                )}

                <div
                  style={{
                    borderTop: "1px solid rgba(16,185,129,0.1)",
                    paddingTop: "16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#9ca3af",
                      marginBottom: "10px",
                    }}
                  >
                    Thêm thông số mới
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-end",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Tên thông số
                      </label>
                      <input
                        value={newSpec.spec_name}
                        onChange={(e) =>
                          setNewSpec({ ...newSpec, spec_name: e.target.value })
                        }
                        style={{
                          ...inputStyle,
                          padding: "10px 12px",
                          fontSize: "13px",
                          border: "1px solid rgba(16,185,129,0.2)",
                        }}
                        placeholder="VD: Core Clock"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Giá trị
                      </label>
                      <input
                        value={newSpec.spec_value}
                        onChange={(e) =>
                          setNewSpec({ ...newSpec, spec_value: e.target.value })
                        }
                        style={{
                          ...inputStyle,
                          padding: "10px 12px",
                          fontSize: "13px",
                          border: "1px solid rgba(16,185,129,0.2)",
                        }}
                        placeholder="VD: 2.52 GHz"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSpec();
                        }}
                      />
                    </div>
                    <button
                      onClick={handleAddSpec}
                      disabled={
                        specSaving || !newSpec.spec_name || !newSpec.spec_value
                      }
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        border: "none",
                        background:
                          newSpec.spec_name && newSpec.spec_value
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : "rgba(255,255,255,0.05)",
                        color:
                          newSpec.spec_name && newSpec.spec_value
                            ? "#fff"
                            : "#6b7280",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor:
                          newSpec.spec_name && newSpec.spec_value
                            ? "pointer"
                            : "not-allowed",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Plus style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa sản phẩm"
        message={`Bạn chắc chắn muốn xóa "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa sản phẩm"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
