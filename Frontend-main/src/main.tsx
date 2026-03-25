import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Reset tuyệt đối body/html - loại bỏ khoảng trắng mặc định
document.body.style.margin = "0";
document.body.style.padding = "0";
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";

createRoot(document.getElementById("root")!).render(<App />);
