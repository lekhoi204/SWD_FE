import { useState, useRef, useEffect } from "react";
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
  Send,
  User,
  Bot,
} from "lucide-react";

interface AIAssistantProps {
  onApplyBuild?: (build: any) => void;
}

// AIAssistant interface

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string; // text shown in bubble
  mode: "build";
  data?: any; // raw API response data
  isMock?: boolean;
  loading?: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  cpu: Cpu,
  gpu: Monitor,
  ram: Layers,
  storage: HardDrive,
  psu: Zap,
  case: Box,
  cooler: Wind,
  mainboard: Layout,
  motherboard: Layout,
};
const CATEGORY_COLORS: Record<string, string> = {
  cpu: "from-blue-600 to-blue-400",
  gpu: "from-emerald-600 to-emerald-400",
  ram: "from-purple-600 to-purple-400",
  storage: "from-orange-600 to-orange-400",
  psu: "from-yellow-600 to-yellow-400",
  case: "from-gray-600 to-gray-400",
  cooler: "from-cyan-600 to-cyan-400",
  mainboard: "from-pink-600 to-pink-400",
  motherboard: "from-pink-600 to-pink-400",
};
const CATEGORY_LABELS: Record<string, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Ổ cứng",
  psu: "Nguồn",
  case: "Vỏ case",
  cooler: "Tản nhiệt",
  mainboard: "Mainboard",
  motherboard: "Mainboard",
};

const isMock = (data: any) =>
  data?.mock === true ||
  (typeof data?.explanation === "string" &&
    data.explanation.startsWith("[MOCK]"));
const stripMock = (s?: string) => s?.replace(/^\[MOCK\]\s*/i, "") ?? "";

function extractComponents(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.components)) return data.components;
  if (Array.isArray(data.recommendations)) return data.recommendations;
  return [];
}

function buildSummaryText(data: any): string {
  if (!data) return "";
  if (data.explanation) {
    return stripMock(data.explanation);
  }
  if (data.build) {
    const cost = Number(data.build.estimated_total_cost).toLocaleString(
      "vi-VN",
    );
    const n = data.build.components
      ? Object.keys(data.build.components).length
      : 0;
    return `Đã tạo cấu hình ${n} linh kiện, tổng chi phí ${cost}₫.`;
  }
  return "Đã xử lý xong.";
}

// ─── BUILD result card ───────────────────────────────────────────────────────
function BuildResult({
  data,
  isDark,
  onApplyBuild,
}: {
  data: any;
  isDark: boolean;
  onApplyBuild?: (b: any) => void;
}) {
  const build = data.build;
  if (!build) return null;
  const comps = build.components ? Object.entries(build.components) : [];
  return (
    <div
      className={`mt-4 space-y-3 border-t pt-3 ${
        isDark ? "border-white/10" : "border-slate-300"
      }`}
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className={`rounded-lg p-3 border backdrop-blur-sm transition-all ${
            isDark
              ? "bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border-cyan-500/30 hover:border-cyan-500/50"
              : "bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-300/60 hover:border-cyan-400 shadow-sm"
          }`}
        >
          <p
            className={`text-[11px] font-bold ${isDark ? "text-cyan-300/90" : "text-cyan-900"}`}
          >
            Tổng chi phí
          </p>
          <p
            className={`mt-1 text-base font-bold ${isDark ? "text-cyan-100" : "text-cyan-950"}`}
          >
            {Number(build.estimated_total_cost).toLocaleString("vi-VN")}₫
          </p>
        </div>
        {build.compatibility && (
          <div
            className={`rounded-lg p-3 border backdrop-blur-sm transition-all ${
              isDark
                ? "bg-gradient-to-br from-purple-500/15 to-indigo-500/15 border-purple-500/30 hover:border-purple-500/50"
                : "bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-300/60 hover:border-purple-400 shadow-sm"
            }`}
          >
            <p
              className={`text-[11px] font-bold ${isDark ? "text-purple-300/90" : "text-purple-900"}`}
            >
              Tương thích
            </p>
            <p
              className={`mt-1 text-base font-bold ${isDark ? "text-purple-100" : "text-purple-950"}`}
            >
              {build.compatibility.compatibility_score ?? "—"}/100
            </p>
          </div>
        )}
      </div>

      {/* Components */}
      <div className="space-y-2">
        {comps.map(([key, comp]: any, idx) => {
          const Icon = CATEGORY_ICONS[key] || Box;
          const label = CATEGORY_LABELS[key] || key.toUpperCase();
          const componentGradients = [
            "from-blue-100 to-cyan-100 border-blue-300/80",
            "from-purple-100 to-indigo-100 border-purple-300/80",
            "from-emerald-100 to-teal-100 border-emerald-300/80",
            "from-rose-100 to-pink-100 border-rose-300/80",
            "from-amber-100 to-orange-100 border-amber-300/80",
            "from-cyan-100 to-teal-100 border-cyan-300/80",
          ];
          const gradientClass = isDark
            ? componentGradients[idx % componentGradients.length].replace(
                /\sborder.*/,
                "",
              )
            : componentGradients[idx % componentGradients.length];

          return (
            <div
              key={key}
              className={`flex items-start gap-3 rounded-lg p-2 border backdrop-blur-sm transition-all ${
                isDark
                  ? `bg-gradient-to-br ${gradientClass} hover:border-opacity-60`
                  : `bg-gradient-to-br ${componentGradients[idx % componentGradients.length]} hover:shadow-md shadow-sm`
              }`}
            >
              <div
                className="h-8 w-8 shrink-0 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mt-0.5 shadow-lg"
                style={{ boxShadow: "0 4px 16px rgba(34,211,238,0.3)" }}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-white/80" : "text-blue-900"}`}
                >
                  {label}
                </p>
                <p
                  className={`truncate text-sm font-bold mt-0.5 ${isDark ? "text-white/95" : "text-slate-950"}`}
                >
                  {comp.product_name || comp.name || "—"}
                </p>
                {comp.price && (
                  <p
                    className={`text-[10px] mt-0.5 font-bold ${isDark ? "text-white/70" : "text-blue-800"}`}
                  >
                    {Number(comp.price).toLocaleString("vi-VN")}₫
                  </p>
                )}
              </div>
              <div className="shrink-0 mt-0.5">
                <div
                  className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg"
                  style={{ boxShadow: "0 0 12px rgba(16,185,129,0.4)" }}
                >
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onApplyBuild && (
        <button
          onClick={() => {
            onApplyBuild(build);
            toast.success("Đã áp dụng cấu hình!");
          }}
          className={`w-full rounded-lg py-2 text-sm font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isDark
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30"
              : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg"
          }`}
        >
          <Check className="h-4 w-4 inline mr-2" />
          Áp dụng cấu hình
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

  // Add global animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .message-slide-in {
        animation: slideIn 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // auto-grow textarea
  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function handleSend() {
    const text = query.trim();
    if (!text) return;
    if (loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      mode: "build",
    };
    const loadingMsg: Message = {
      id: Date.now() + "l",
      role: "assistant",
      content: "",
      mode: "build",
      loading: true,
    };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setQuery("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await buildPcApi(text);

      const summary = res?.success
        ? buildSummaryText(res.data)
        : res?.message || "Có lỗi xảy ra.";
      const assistantMsg: Message = {
        id: Date.now() + "a",
        role: "assistant",
        content: summary,
        mode: "build",
        data: res?.success ? res.data : undefined,
        isMock: res?.success ? isMock(res.data) : false,
      };
      setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
      if (res?.success) toast.success("Xong rồi!");
    } catch (err: any) {
      const errMsg: Message = {
        id: Date.now() + "e",
        role: "assistant",
        content: err?.message || "Có lỗi kết nối. Vui lòng thử lại.",
        mode: "build",
      };
      setMessages((prev) => [...prev.slice(0, -1), errMsg]);
      toast.error("Lỗi: " + (err?.message || "Không thể kết nối"));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div
      className={`flex flex-col border overflow-hidden rounded-xl ${
        isDark
          ? "border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-900 shadow-2xl shadow-blue-500/20"
          : "border-blue-300/60 bg-gradient-to-br from-blue-50 via-blue-100/50 to-slate-50 shadow-2xl shadow-blue-300/30"
      }`}
      style={{ height: "680px" }}
    >
      {/* ── MINIMAL HEADER ── */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-sm ${
          isDark
            ? "border-white/10 bg-gradient-to-r from-blue-600/15 via-cyan-600/15 to-blue-600/15"
            : "border-blue-300/40 bg-gradient-to-r from-blue-100/60 via-blue-50/60 to-cyan-100/60"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg"
            style={{ boxShadow: "0 0 20px rgba(34,211,238,0.5)" }}
          >
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span
            className={`text-sm font-bold ${isDark ? "text-white/95" : "text-slate-900"}`}
          >
            AI PC Builder
          </span>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setMessages([])}
            className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all transform hover:scale-105 active:scale-95 backdrop-blur-sm ${
              isDark
                ? "text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
                : "text-slate-700 hover:text-blue-900 hover:bg-white/80 border border-slate-300"
            }`}
          >
            Làm mới
          </button>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth ${
          isDark
            ? "bg-gradient-to-b from-slate-900/40 via-blue-900/20 to-slate-900/40 backdrop-blur-sm"
            : "bg-gradient-to-b from-blue-50/40 via-slate-50/30 to-blue-100/40"
        }`}
      >
        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <h4
                className={`text-2xl font-bold ${isDark ? "text-blue-200" : "text-blue-900"}`}
              >
                Xin chào!
              </h4>
              <p
                className={`mt-2 text-sm max-w-sm font-medium ${isDark ? "text-blue-100/80" : "text-blue-800"}`}
              >
                Tôi có thể giúp bạn xây dựng cấu hình PC hoàn hảo. Hãy mô tả nhu
                cầu của bạn.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              {[
                {
                  label: "Gaming 25 triệu",
                  gradient:
                    "from-rose-500/20 to-pink-500/20 border-rose-500/40",
                },
                {
                  label: "Văn phòng 10 triệu",
                  gradient:
                    "from-amber-500/20 to-orange-500/20 border-amber-500/40",
                },
                {
                  label: "Đồ họa 3D 50 triệu",
                  gradient:
                    "from-emerald-500/20 to-teal-500/20 border-emerald-500/40",
                },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setQuery(s.label);
                    textareaRef.current?.focus();
                  }}
                  className={`rounded-lg border px-4 py-2 text-xs font-extrabold transition-all transform hover:scale-110 active:scale-95 backdrop-blur-sm ${
                    isDark
                      ? `bg-gradient-to-br ${s.gradient} text-white/95 hover:text-white hover:border-opacity-100`
                      : `bg-gradient-to-br ${s.gradient} text-white font-extrabold hover:shadow-lg border-opacity-70 shadow-md`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const rainbowStyles = [
            {
              bg: "linear-gradient(135deg, rgba(34,211,238,0.4), rgba(59,130,246,0.4))",
              border: "rgba(34,211,238,0.5)",
              shadow: "rgba(34,211,238,0.2)",
            },
            {
              bg: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(99,102,241,0.4))",
              border: "rgba(168,85,247,0.5)",
              shadow: "rgba(168,85,247,0.2)",
            },
            {
              bg: "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(34,211,238,0.4))",
              border: "rgba(16,185,129,0.5)",
              shadow: "rgba(16,185,129,0.2)",
            },
            {
              bg: "linear-gradient(135deg, rgba(244,63,94,0.4), rgba(236,72,153,0.4))",
              border: "rgba(244,63,94,0.5)",
              shadow: "rgba(244,63,94,0.2)",
            },
            {
              bg: "linear-gradient(135deg, rgba(251,146,60,0.4), rgba(255,165,0,0.4))",
              border: "rgba(251,146,60,0.5)",
              shadow: "rgba(251,146,60,0.2)",
            },
            {
              bg: "linear-gradient(135deg, rgba(20,184,166,0.4), rgba(16,185,129,0.4))",
              border: "rgba(20,184,166,0.5)",
              shadow: "rgba(20,184,166,0.2)",
            },
          ];
          const assistantMsgIndex = messages.filter(
            (m, i) => m.role === "assistant" && i < idx,
          ).length;
          const styleIdx = assistantMsgIndex % rainbowStyles.length;
          const currentStyle =
            msg.role === "assistant" ? rainbowStyles[styleIdx] : null;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 transition-all duration-300 transform ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              style={{ animation: `slideIn 0.3s ease-out ${idx * 50}ms both` }}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div
                  className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mt-0.5 shadow-lg"
                  style={{ boxShadow: "0 0 20px rgba(34,211,238,0.4)" }}
                >
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              {msg.role === "user" && (
                <div
                  className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center mt-0.5 shadow-lg ${
                    isDark
                      ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                      : "bg-gradient-to-br from-blue-500 to-blue-600"
                  }`}
                  style={
                    isDark
                      ? { boxShadow: "0 0 16px rgba(34,211,238,0.4)" }
                      : { boxShadow: "0 0 12px rgba(59,130,246,0.4)" }
                  }
                >
                  <User className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 backdrop-blur-xl transition-all duration-300 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white border border-blue-400/60 font-medium"
                      : isDark
                        ? "text-slate-100 border font-medium"
                        : "bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-950 border border-blue-300/80 shadow-md font-semibold"
                  }`}
                  style={
                    msg.role === "assistant" && isDark && currentStyle
                      ? {
                          background: currentStyle.bg,
                          borderColor: currentStyle.border,
                          boxShadow: `0 8px 32px ${currentStyle.shadow}`,
                        }
                      : msg.role === "user"
                        ? { boxShadow: "0 8px 24px rgba(59,130,246,0.3)" }
                        : !isDark
                          ? { boxShadow: "0 4px 16px rgba(59,130,246,0.15)" }
                          : {}
                  }
                >
                  {/* Loading spinner - typing effect */}
                  {msg.loading ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 rounded-full bg-white/90 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-white/90 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-white/90 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                      <span className="text-sm text-white font-bold">
                        Đang suy nghĩ...
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-semibold">
                      {msg.content}
                    </p>
                  )}

                  {/* Rich result cards */}
                  {!msg.loading && msg.role === "assistant" && msg.data && (
                    <BuildResult
                      data={msg.data}
                      isDark={isDark}
                      onApplyBuild={onApplyBuild}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div
        className={`border-t px-4 py-3 ${
          isDark
            ? "border-white/10 bg-gradient-to-r from-slate-900/80 via-blue-900/30 to-slate-900/80 backdrop-blur-sm"
            : "border-blue-300/40 bg-gradient-to-r from-blue-100/40 via-blue-50/40 to-cyan-100/40 backdrop-blur-sm"
        }`}
      >
        <div
          className={`flex items-end gap-2 rounded-2xl border px-4 py-3 focus-within:ring-2 transition-all duration-300 ${
            isDark
              ? "border-cyan-500/40 bg-gradient-to-br from-slate-800/70 via-blue-800/40 to-slate-800/70 focus-within:border-cyan-400/80 focus-within:ring-2 focus-within:ring-cyan-400/40 hover:border-cyan-500/60 backdrop-blur-lg shadow-lg shadow-cyan-500/10"
              : "border-blue-400/50 bg-gradient-to-br from-blue-100/80 via-blue-50/60 to-cyan-100/80 focus-within:border-blue-500 focus-within:ring-blue-400/50 hover:border-blue-500/60 backdrop-blur-sm shadow-lg shadow-blue-300/30"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Hãy mô tả cấu hình PC bạn cần..."
            rows={1}
            disabled={loading}
            className={`flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed disabled:opacity-50 transition-colors font-semibold ${
              isDark
                ? "text-blue-100 placeholder:text-cyan-300/50"
                : "text-blue-900 placeholder:text-blue-700"
            }`}
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !query.trim()}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95 font-semibold ${
              isDark
                ? "bg-gradient-to-br from-cyan-500 via-blue-500 to-cyan-600 hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60"
                : "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-400/50 hover:shadow-blue-400/70"
            } text-white`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
