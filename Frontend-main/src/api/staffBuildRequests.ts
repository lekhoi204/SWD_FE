import { apiClient } from "./client";

export async function getAllStaffBuildRequests(
  params?: Record<string, string | number>,
): Promise<any[]> {
  const res = await apiClient<{ success: boolean; data: any[] }>(
    `/staff-build-requests`,
    { params: params as any },
  );
  return res.data || [];
}

export async function createMyStaffBuildRequest(data: any): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/staff-build-requests/me`,
    { method: "POST", body: data },
  );
  return res.data;
}

export async function getMyStaffBuildRequests(): Promise<any[]> {
  const res = await apiClient<{ success: boolean; data: any[] }>(
    `/staff-build-requests/me`,
  );
  return res.data || [];
}

export async function getMyAssignedQueue(): Promise<any[]> {
  const res = await apiClient<{ success: boolean; data: any[] }>(
    `/staff-build-requests/staff/my-queue`,
  );
  return res.data || [];
}

export async function assignStaffBuildRequest(
  id: string | number,
  data: { staff_id: number },
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/staff-build-requests/${id}/assign`,
    { method: "PATCH", body: data },
  );
  return res.data;
}

export async function submitBuildForRequest(
  id: string | number,
  payload: any,
): Promise<any> {
  const payloadWithStatus = { ...payload, status: "completed" };
  const res = await apiClient<{ success: boolean; data: any }>(
    `/staff-build-requests/${id}`,
    { method: "PUT", body: payloadWithStatus },
  );
  return res.data;
}

export async function getStaffBuildRequestsByUserId(
  userId: number,
): Promise<any[]> {
  const res = await apiClient<{ success: boolean; data: any[] }>(
    `/staff-build-requests/user/${userId}`,
  );
  return res.data || [];
}

export async function getStaffBuildRequestById(
  id: string | number,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/staff-build-requests/${id}`,
  );
  return res.data;
}

export async function createStaffBuildRequest(data: any): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/staff-build-requests`,
    { method: "POST", body: data },
  );
  return res.data;
}

export async function updateStaffBuildRequest(
  id: string | number,
  data: any,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/staff-build-requests/${id}`,
    { method: "PUT", body: data },
  );
  return res.data;
}

export async function deleteStaffBuildRequest(
  id: string | number,
): Promise<void> {
  await apiClient(`/staff-build-requests/${id}`, { method: "DELETE" });
}

export default {
  getAllStaffBuildRequests,
  createMyStaffBuildRequest,
  getMyStaffBuildRequests,
  getMyAssignedQueue,
  assignStaffBuildRequest,
  submitBuildForRequest,
  getStaffBuildRequestsByUserId,
  getStaffBuildRequestById,
  createStaffBuildRequest,
  updateStaffBuildRequest,
  deleteStaffBuildRequest,
};
