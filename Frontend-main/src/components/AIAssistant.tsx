import { useState } from "react";
import { toast } from "sonner";
import {
  buildPcApi,
  analyzeApi,
  getRecommendationsApi,
  testAI,
} from "@/api/ai";
import { Loader2 } from "lucide-react";

export function AIAssistant() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    if (!query.trim()) return toast.error("Nhập yêu cầu trước đã");
    setLoading(true);
    try {
      const res = await analyzeApi(query.trim());
      setResult(res);
    } catch (err) {
      console.error(err);
      toast.error("Phân tích lỗi");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuild() {
    if (!query.trim()) return toast.error("Nhập yêu cầu trước đã");
    setLoading(true);
    try {
      const res = await buildPcApi(query.trim());
      setResult(res);
    } catch (err) {
      console.error(err);
      toast.error("Tạo build lỗi");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecommendations() {
    if (!query.trim()) return toast.error("Nhập yêu cầu/ngữ cảnh để lấy gợi ý");
    setLoading(true);
    try {
      const res = await getRecommendationsApi(query.trim());
      setResult(res);
    } catch (err) {
      console.error(err);
      toast.error("Lấy gợi ý lỗi");
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setLoading(true);
    try {
      const res = await testAI();
      setResult(res);
    } catch (err) {
      console.error(err);
      toast.error("Test AI lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mb-6 p-4 rounded-lg"
      style={{ background: "rgba(99,102,241,0.06)" }}
    >
      <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Mô tả yêu cầu build (ví dụ: 'Gaming 25 triệu, ưu tiên FPS 144Hz')"
        className="w-full p-3 rounded-md border"
        rows={3}
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleAnalyze}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Phân tích
        </button>
        <button
          onClick={handleBuild}
          className="px-3 py-2 bg-green-600 text-white rounded"
        >
          Tạo build (AI)
        </button>
        <button
          onClick={handleRecommendations}
          className="px-3 py-2 bg-indigo-600 text-white rounded"
        >
          Gợi ý linh kiện
        </button>
        <button
          onClick={handleTest}
          className="px-3 py-2 bg-gray-200 text-gray-800 rounded"
        >
          Kiểm tra kết nối
        </button>
        {loading && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
      </div>

      {result && (
        <div
          className="mt-4 p-3 bg-white/80 rounded border"
          style={{ maxHeight: 320, overflow: "auto" }}
        >
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AIAssistant;
