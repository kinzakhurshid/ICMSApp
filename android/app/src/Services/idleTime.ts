import api from './api';
import { IdleTimeListResponse, IdleTimeMetrics, IdleTimePreset, IdleTimeRecord } from '../types/idleTime';

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

export async function getIdleTimeRecordById(id: string, token: string): Promise<IdleTimeRecord | null> {
  const res = await api.get(`/idle-time/${id}`, authHeader(token));
  return res.data?.data ?? res.data ?? null;
}

export async function updateIdleTimeRecord(
  id: string,
  payload: {
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  },
  token: string
): Promise<boolean> {
  const res = await api.put(`/idle-time/${id}`, payload, authHeader(token));
  return !!(res.data?.success ?? (res.status >= 200 && res.status < 300));
}

export interface FetchIdleTimePresetsParams {
  page?: number;
  limit?: number;
  token: string;
}

export interface FetchIdleTimePresetsResponse {
  data: IdleTimePreset[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchIdleTimePresets(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<FetchIdleTimePresetsResponse> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    // Use the correct endpoint: /idle-preset with pagination
    const res = await api.get('/idle-preset', {
      ...authHeader(token),
      params: {
        page,
        limit,
      },
    });

    // API returns: { data: [...], total, page, totalPages }
    const apiData = res.data?.data ?? [];
    
    if (!Array.isArray(apiData)) {
      console.warn('Invalid response format from idle-preset endpoint');
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }

    // Map API response fields to match IdleTimePreset interface
    // API has: startTime, endTime, daysOfWeek, isActive
    // Interface expects: start, end, days, active
    const mappedData = apiData.map((preset: any) => ({
      _id: preset._id,
      name: preset.name,
      start: preset.startTime || preset.start || '',
      end: preset.endTime || preset.end || '',
      days: preset.daysOfWeek || preset.days || [],
      active: preset.isActive ?? preset.active ?? false,
      autoApply: preset.autoApply ?? false,
    }));

    return {
      data: mappedData,
      total: res.data?.total ?? res.data?.pagination?.total ?? mappedData.length,
      page: res.data?.page ?? res.data?.pagination?.page ?? page,
      totalPages: res.data?.totalPages ?? res.data?.pagination?.totalPages ?? Math.ceil((res.data?.total ?? mappedData.length) / limit),
    };
  } catch (error: any) {
    console.warn('Failed to fetch idle time presets:', error?.response?.data || error?.message || 'Unknown error');
    return {
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
  }
}

export async function getIdleTimePresetById(id: string, token: string): Promise<IdleTimePreset | null> {
  const res = await api.get(`/idle-preset/${id}`, authHeader(token));
  const preset = res.data?.data ?? res.data ?? null;
  if (!preset) return null;

  return {
    _id: preset._id,
    name: preset.name,
    start: preset.startTime || preset.start || '',
    end: preset.endTime || preset.end || '',
    days: preset.daysOfWeek || preset.days || [],
    active: preset.isActive ?? preset.active ?? false,
    autoApply: preset.autoApply ?? false,
  };
}

export async function updateIdleTimePreset(
  id: string,
  payload: {
    name: string;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    isActive: boolean;
    autoApply: boolean;
  },
  token: string
): Promise<boolean> {
  const res = await api.put(`/idle-preset/${id}`, payload, authHeader(token));
  return !!(res.data?.success ?? (res.status >= 200 && res.status < 300));
}

export async function deleteIdleTimePreset(id: string, token: string): Promise<boolean> {
  const res = await api.delete(`/idle-preset/${id}`, authHeader(token));
  return !!(res.data?.success ?? (res.status >= 200 && res.status < 300));
}


