import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type BuildItem = {
  user_build_id?: number;
  build_name: string;
  total_price?: number;
  items?: any[];
};

type BuildModalProps = {
  open: boolean;
  mode: "save" | "choose" | "buy";
  title?: string;
  builds?: BuildItem[];
  defaultName?: string;
  loading?: boolean;
  onConfirm: (value: string | BuildItem) => void;
  onCancel: () => void;
};

export function BuildModal({
  open,
  mode,
  title,
  builds = [],
  defaultName = "",
  loading = false,
  onConfirm,
  onCancel,
}: BuildModalProps) {
  const [name, setName] = useState(defaultName);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(defaultName || "");
    setSelectedIndex(null);
    if (open && inputRef.current) inputRef.current.focus();
  }, [open, defaultName]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onCancel}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 680,
          background: "linear-gradient(160deg,#0f1724,#0b1220)",
          borderRadius: 12,
          padding: 20,
          color: "#e5e7eb",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            background: "none",
            border: "none",
            color: "#9ca3af",
          }}
        >
          <X />
        </button>

        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          {title ||
            (mode === "save"
              ? "Lưu build"
              : mode === "buy"
                ? "Tạo sản phẩm build"
                : "Chọn build")}
        </h3>

        {mode === "choose" ? (
          <div style={{ maxHeight: 320, overflow: "auto", padding: 6 }}>
            {builds.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>Không có build nào</p>
            ) : (
              builds.map((b, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: "pointer",
                    background:
                      selectedIndex === i
                        ? "rgba(99,102,241,0.12)"
                        : "rgba(255,255,255,0.02)",
                    border:
                      selectedIndex === i
                        ? "1px solid rgba(99,102,241,0.2)"
                        : "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{b.build_name}</div>
                      <div style={{ fontSize: 13, color: "#9ca3af" }}>
                        {b.total_price
                          ? `${b.total_price.toLocaleString("vi-VN")}₫`
                          : "—"}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {b.user_build_id ? `#${b.user_build_id}` : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <label
              style={{ display: "block", marginBottom: 8, color: "#9ca3af" }}
            >
              {mode === "save" ? "Tên build" : "Tên sản phẩm"}
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "transparent",
                color: "#fff",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              color: "#d1d5db",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (mode === "choose") {
                if (selectedIndex === null) return;
                onConfirm(builds[selectedIndex]);
              } else {
                if (!name || name.trim() === "") return;
                onConfirm(name.trim());
              }
            }}
            disabled={loading || (mode === "choose" && selectedIndex === null)}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              background: (mode === "choose" && selectedIndex === null) 
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg,#7c3aed,#3b82f6)",
              color: (mode === "choose" && selectedIndex === null) ? "#6b7280" : "#fff",
              fontWeight: 700,
              cursor: (loading || (mode === "choose" && selectedIndex === null)) ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Đang xử lý..."
              : mode === "save"
                ? "Lưu"
                : mode === "buy"
                  ? "Tạo & Mua"
                  : "Chọn"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuildModal;
