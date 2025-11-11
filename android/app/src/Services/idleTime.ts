import api from './api';
import { IdleTimeListResponse, IdleTimeMetrics, IdleTimePreset } from '../types/idleTime';

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export async function fetchIdleTimeMetrics(token: string): Promise<IdleTimeMetrics | null> {
  const res = await api.get('/idle-time/metrics', authHeader(token));
  return res.data?.data ?? res.data ?? null;
}

export interface FetchIdleTimesParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  token: string;
}

export async function fetchIdleTimes({
  page = 1,
  limit = 10,
  search,
  startDate,
  endDate,
  token,
}: FetchIdleTimesParams): Promise<IdleTimeListResponse> {
  const res = await api.get('/idle-time', {
    ...authHeader(token),
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
  });

  return {
    data: res.data?.data ?? res.data ?? [],
    total: res.data?.total ?? res.data?.pagination?.total ?? 0,
    page: res.data?.page ?? res.data?.pagination?.page ?? page,
    limit: res.data?.limit ?? res.data?.pagination?.limit ?? limit,
    success: res.data?.success ?? true,
  };
}

export async function deleteIdleTimeRecord(id: string, token: string): Promise<boolean> {
  const res = await api.delete(`/idle-time/${id}`, authHeader(token));
  return !!(res.data?.success ?? (res.status >= 200 && res.status < 300));
}

export async function fetchIdleTimePresets(token: string): Promise<IdleTimePreset[]> {
  const res = await api.get('/idle-time/presets', authHeader(token));
  return res.data?.data ?? res.data ?? [];
}


