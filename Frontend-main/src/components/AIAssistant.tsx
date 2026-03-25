import { useState, useRef, useEffect, type CSSProperties } from "react";
import { toast } from "sonner";
import { buildPcApi } from "@/api/ai";
import { useTheme } from "@/context/ThemeContext";
import {
  Loader2,
  Check,
  Cpu,
  Monitor,
  Layers,
  HardDrive,
  Zap,
  Box,
  Wind,
  Layout,
  User,
} from "lucide-react";

/** SVG inline — bundle Tailwind thiếu class màu/size khiến Lucide bị trùng màu nền (trông như hình lỗi). */
function SvgBot({ className, color }: { className?: string; color: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function SvgSend({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

interface AIAssistantProps {
  onApplyBuild?: (build: any) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: "build";
  data?: any;
  isMock?: boolean;
  loading?: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  cpu: Cpu, gpu: Monitor, ram: Layers, storage: HardDrive,
  psu: Zap, case: Box, cooler: Wind, mainboard: Layout, motherboard: Layout,
};

const CATEGORY_LABELS: Record<string, string> = {
  cpu: "CPU", gpu: "GPU", ram: "RAM", storage: "Ổ cứng",
  psu: "Nguồn", case: "Vỏ case", cooler: "Tản nhiệt",
  mainboard: "Mainboard", motherboard: "Mainboard",
};

const isMock = (data: any) =>
  data?.mock === true ||
  (typeof data?.explanation === "string" && data.explanation.startsWith("[MOCK]"));
const stripMock = (s?: string) => s?.replace(/^\[MOCK\]\s*/i, "") ?? "";

function buildSummaryText(data: any): string {
  if (!data) return "";
  if (data.explanation) return stripMock(data.explanation);
  if (data.build) {
    const cost = Number(data.build.estimated_total_cost).toLocaleString("vi-VN");
    const n = data.build.components ? Object.keys(data.build.components).length : 0;
    return `Đã tạo cấu hình ${n} linh kiện, tổng chi phí ${cost}₫.`;
  }
  return "Đã xử lý xong.";
}

// ─── BUILD result card ───────────────────────────────────────────────────────
function BuildResult({
  data, isDark, onApplyBuild,
}: {
  data: any; isDark: boolean; onApplyBuild?: (b: any) => void;
}) {
  const build = data.build;
  if (!build) return null;
  const comps = build.components ? Object.entries(build.components) : [];

  return (
    <div className={`mt-4 space-y-3 border-t pt-3 min-w-0 max-w-full overflow-x-hidden ${isDark ? "border-white/10" : "border-pink-200"}`}>
      <div className="grid grid-cols-2 gap-2 min-w-0">
        <div className={`rounded-lg p-3 border ${isDark ? "bg-white/5 border-white/10" : "bg-pink-50 border-pink-200"}`}>
          <p className={`text-[11px] font-bold ${isDark ? "text-white/50" : "text-pink-600"}`}>Tổng chi phí</p>
          <p className={`mt-1 text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {Number(build.estimated_total_cost).toLocaleString("vi-VN")}₫
          </p>
        </div>
        {build.compatibility && (
          <div className={`rounded-lg p-3 border ${isDark ? "bg-white/5 border-white/10" : "bg-pink-50 border-pink-200"}`}>
            <p className={`text-[11px] font-bold ${isDark ? "text-white/50" : "text-pink-600"}`}>Tương thích</p>
            <p className={`mt-1 text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {build.compatibility.compatibility_score ?? "—"}/100
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {comps.map(([key, comp]: any, idx) => {
          const Icon = CATEGORY_ICONS[key] || Box;
          const label = CATEGORY_LABELS[key] || key.toUpperCase();
          const colors = isDark
            ? ["border-purple-500/40", "border-blue-500/40", "border-emerald-500/40", "border-amber-500/40"][idx % 4]
            : ["border-pink-300", "border-blue-300", "border-emerald-300", "border-amber-300"][idx % 4];
          return (
            <div key={key} className={`flex items-start gap-2 rounded-lg p-2 border min-w-0 ${isDark ? "bg-white/5 " + colors : "bg-white " + colors}`}>
              <div className={`h-8 w-8 shrink-0 rounded-md flex items-center justify-center mt-0.5 ${isDark ? "bg-white/10" : "bg-pink-100"}`}>
                <Icon className={`h-4 w-4 ${isDark ? "text-white" : "text-pink-600"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-white/50" : "text-slate-500"}`}>{label}</p>
                <p className={`truncate text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{comp.product_name || comp.name || "—"}</p>
                {comp.price && (
                  <p className={`text-[10px] mt-0.5 font-bold ${isDark ? "text-white/50" : "text-slate-500"}`}>{Number(comp.price).toLocaleString("vi-VN")}₫</p>
                )}
              </div>
              <div className={`shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${isDark ? "bg-white/10" : "bg-pink-100"}`}>
                <Check className={`h-3 w-3 ${isDark ? "text-white" : "text-pink-600"}`} />
              </div>
            </div>
          );
        })}
      </div>

      {onApplyBuild && (
        <button
          type="button"
          onClick={() => onApplyBuild(build)}
          className="w-full rounded-lg py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            backgroundColor: isDark ? "#ffffff" : "#db2777",
            color: isDark ? "#0f172a" : "#ffffff",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Check className="h-4 w-4 inline mr-2" style={{ verticalAlign: "middle" }} strokeWidth={2.5} /> Áp dụng cấu hình
        </button>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function AIAssistant({ onApplyBuild }: AIAssistantProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const s = document.createElement("style");
    s.innerHTML = `@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  async function handleSend() {
    const text = query.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, mode: "build" };
    const loadingMsg: Message = { id: Date.now() + "l", role: "assistant", content: "", mode: "build", loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setQuery("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await buildPcApi(text);
      const summary = res?.success ? buildSummaryText(res.data) : res?.message || "Có lỗi xảy ra.";
      const assistantMsg: Message = {
        id: Date.now() + "a", role: "assistant", content: summary, mode: "build",
        data: res?.success ? res.data : undefined,
        isMock: res?.success ? isMock(res.data) : false,
      };
      setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
      if (res?.success) toast.success("Xong rồi!");
    } catch (err: any) {
      const errMsg: Message = { id: Date.now() + "e", role: "assistant", content: err?.message || "Có lỗi kết nối.", mode: "build" };
      setMessages((prev) => [...prev.slice(0, -1), errMsg]);
      toast.error("Lỗi: " + (err?.message || "Không thể kết nối"));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isEmpty = messages.length === 0;

  /* Dùng màu nền inline vì bundle Tailwind (index.css) không có .bg-black — class đó không ra CSS → nền trong suốt. */
  const shellStyle: CSSProperties = {
    height: 720,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    overflowX: "hidden",
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    borderRadius: 20,
    ...(isDark
      ? { border: "1px solid rgba(255,255,255,0.1)" }
      : { border: "2px solid #f472b6", boxShadow: "0 4px 24px rgba(244,114,182,0.2)" }),
  };

  const inputTextColor = isDark ? "#f8fafc" : "#0f172a";
  const inputPlaceholderColor = isDark ? "rgba(248,250,252,0.45)" : "#64748b";

  return (
    <div
      className={`overflow-x-hidden overflow-y-hidden flex flex-col min-h-0 min-w-0 max-w-full ${
        isDark ? "" : "shadow-lg shadow-pink-200/50"
      }`}
      style={shellStyle}
    >
      <style>{`
        .ai-assistant-textarea::placeholder {
          color: ${inputPlaceholderColor};
          opacity: 1;
        }
      `}</style>
      {/* ── HEADER ── */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? "border-white/10" : "border-pink-200"
      }`}>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 36,
              height: 36,
              backgroundColor: isDark ? "#ffffff" : "#ec4899",
            }}
          >
            <SvgBot color={isDark ? "#0f172a" : "#ffffff"} />
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: isDark ? "#ffffff" : "#0f172a" }}
          >
            AI PC Builder
          </span>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setMessages([])}
            className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all ${
              isDark
                ? "text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-pink-50 border border-pink-200"
            }`}
          >
            Làm mới
          </button>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div
        className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto px-4 py-4 space-y-4"
        style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
      >

        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 min-w-0 w-full max-w-full px-1 box-border">
            <div className="text-center min-w-0 max-w-full">
              <h4 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Xin chào!</h4>
              <p
                className={`mt-2 text-sm max-w-sm mx-auto ${isDark ? "text-white/50" : "text-slate-600"}`}
                style={{ wordBreak: "break-word" }}
              >
                Tôi có thể giúp bạn xây dựng cấu hình PC hoàn hảo. Hãy mô tả nhu cầu của bạn.
              </p>
            </div>
            {/* Flex + inline-flex: khung ôm chữ; px-5 = 20px hai bên chữ */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 w-full max-w-lg mx-auto">
              {[
                "Gaming 25 triệu",
                "Văn phòng 10 triệu",
                "Đồ họa 3D 50 triệu",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setQuery(s); textareaRef.current?.focus(); }}
                  className={`inline-flex items-center justify-center rounded-lg border text-[11px] font-bold transition-all hover:scale-[1.02] max-w-full px-8 py-2 ${
                    isDark
                      ? "border-white/20 text-white hover:bg-white/10"
                      : "border-pink-300 hover:bg-pink-50"
                  }`}
                  style={!isDark ? { color: "#0f172a" } : undefined}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex gap-3 min-w-0 max-w-full ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            style={{ animation: `slideIn 0.3s ease-out ${idx * 50}ms both` }}
          >
            {/* Avatar */}
            {msg.role === "assistant" && (
              <div
                className="shrink-0 rounded-full flex items-center justify-center mt-0.5"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: isDark ? "#ffffff" : "#ec4899",
                }}
              >
                <SvgBot color={isDark ? "#0f172a" : "#ffffff"} />
              </div>
            )}
            {msg.role === "user" && (
              <div
                className="shrink-0 rounded-full flex items-center justify-center mt-0.5"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "#fce7f3",
                }}
              >
                <User
                  className="h-4 w-4"
                  style={{ color: isDark ? "#ffffff" : "#db2777" }}
                  strokeWidth={2}
                />
              </div>
            )}

            {/* Bubble — màu chữ user dùng inline (bundle không có text-black → chữ trắng đè nền trắng) */}
            <div
              className="min-w-0 flex-1"
              style={{
                maxWidth: msg.role === "user" ? "min(85%, 28rem)" : "min(100%, 28rem)",
              }}
            >
              <div
                className={`rounded-2xl px-4 py-3 min-w-0 overflow-hidden ${
                  msg.role === "user"
                    ? ""
                    : isDark
                      ? "bg-white/10 border border-white/10 text-white"
                      : "bg-pink-50 border border-pink-200 text-slate-900"
                }`}
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  ...(msg.role === "user"
                    ? isDark
                      ? { backgroundColor: "#ffffff", color: "#0f172a", border: "1px solid rgba(15,23,42,0.12)" }
                      : { backgroundColor: "#db2777", color: "#ffffff", border: "1px solid rgba(219,39,119,0.5)" }
                    : {}),
                }}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <div
                          key={d}
                          className={`w-2 h-2 rounded-full animate-bounce ${msg.role === "user" && !isDark ? "bg-white" : ""} ${msg.role === "assistant" && !isDark ? "bg-pink-400" : ""}`}
                          style={{
                            animationDelay: d + "ms",
                            backgroundColor:
                              msg.role === "user"
                                ? (isDark ? "#0f172a" : "#ffffff")
                                : isDark
                                  ? "rgba(255,255,255,0.55)"
                                  : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: msg.role === "user"
                          ? (isDark ? "#0f172a" : "#ffffff")
                          : (isDark ? "rgba(255,255,255,0.65)" : "#475569"),
                      }}
                    >
                      Đang suy nghĩ...
                    </span>
                  </div>
                ) : (
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap font-medium"
                    style={{
                      color: msg.role === "user"
                        ? (isDark ? "#0f172a" : "#ffffff")
                        : undefined,
                    }}
                  >
                    {msg.content}
                  </p>
                )}

                {!msg.loading && msg.role === "assistant" && msg.data && (
                  <BuildResult data={msg.data} isDark={isDark} onApplyBuild={onApplyBuild} />
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div
        className={`border-t shrink-0 ${isDark ? "border-white/10" : "border-pink-200"}`}
        style={{
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          padding: "16px 18px 18px",
        }}
      >
        <div
          className={`flex items-end gap-3 border transition-all duration-200 min-w-0 ${
            isDark
              ? "border-white/20 focus-within:border-white/40 focus-within:ring-white/20 hover:border-white/30"
              : "border-pink-300 focus-within:border-pink-400 focus-within:ring-pink-200 hover:border-pink-400"
          }`}
          style={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderRadius: 18,
            padding: "14px 14px 14px 18px",
            minHeight: 64,
            maxWidth: "100%",
          }}
        >
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder="Hãy mô tả cấu hình PC bạn cần..."
            rows={2}
            disabled={loading}
            className="ai-assistant-textarea flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed disabled:opacity-50 transition-colors min-w-0"
            style={{
              maxHeight: 140,
              minHeight: 56,
              color: inputTextColor,
              width: 0,
              flex: "1 1 0%",
            }}
          />
          <button
            type="button"
            aria-label="Gửi tin nhắn"
            onClick={handleSend}
            disabled={loading || !query.trim()}
            style={{
              width: 52,
              height: 52,
              minWidth: 52,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              opacity: loading || !query.trim() ? 0.45 : 1,
              backgroundColor: isDark ? "#ffffff" : "#db2777",
              boxShadow: isDark ? "none" : "0 2px 8px rgba(219,39,119,0.35)",
            }}
          >
            {loading ? (
              <Loader2
                className="animate-spin"
                style={{ width: 24, height: 24, color: isDark ? "#0f172a" : "#ffffff" }}
                strokeWidth={2.5}
              />
            ) : (
              <SvgSend color={isDark ? "#0f172a" : "#ffffff"} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
