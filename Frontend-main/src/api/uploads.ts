import { apiClient } from "./client";

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await apiClient<{
    success: boolean;
    message: string;
    image_url: string;
  }>(`/upload/image`, {
    method: "POST",
    body: form,
  });
  return res.image_url;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const form = new FormData();
  files.forEach((f) => form.append("images", f));
  const res = await apiClient<{
    success: boolean;
    message: string;
    image_urls: string[];
  }>(`/upload/images`, {
    method: "POST",
    body: form,
  });
  return res.image_urls;
}
