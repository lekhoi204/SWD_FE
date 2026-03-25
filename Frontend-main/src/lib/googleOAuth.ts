let gsiLoadPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (gsiLoadPromise) return gsiLoadPromise;
  if (typeof document === "undefined") {
    gsiLoadPromise = Promise.reject(new Error("Không thể tải Google Sign-In"));
    return gsiLoadPromise;
  }
  if (window.google?.accounts?.oauth2) {
    gsiLoadPromise = Promise.resolve();
    return gsiLoadPromise;
  }
  gsiLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Không thể tải Google Sign-In"));
    document.head.appendChild(s);
  });
  return gsiLoadPromise;
}

/** Lấy access token qua OAuth (popup), sau đó gọi userinfo để có email đã xác thực. */
export async function getGoogleEmailFromOAuth(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("Chưa cấu hình VITE_GOOGLE_CLIENT_ID");
  }
  await loadGoogleScript();
  const google = window.google;
  if (!google?.accounts?.oauth2) {
    throw new Error("Google OAuth chưa sẵn sàng");
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      redirect_uri: "postmessage",
      callback: (resp: { access_token?: string; error?: string }) => {
        if (resp.error) {
          if (
            resp.error === "popup_closed_by_user" ||
            resp.error === "user_closed_popup"
          ) {
            reject(new Error("Đã hủy đăng nhập Google"));
            return;
          }
          reject(new Error(resp.error));
          return;
        }
        if (!resp.access_token) {
          reject(new Error("Không lấy được token Google"));
          return;
        }
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: "" });
  });

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Không lấy được thông tin tài khoản Google");
  }
  const data = (await res.json()) as { email?: string };
  if (!data.email) {
    throw new Error("Google không trả về email");
  }
  return data.email;
}
