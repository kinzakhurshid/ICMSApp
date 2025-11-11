import api from './api';
import { OrgQueryListResponse } from '../types/queries';

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export interface FetchOrgQueriesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  token: string;
}

export async function fetchOrgQueries({
  page = 1,
  limit = 10,
  search,
  status,
  token,
}: FetchOrgQueriesParams): Promise<OrgQueryListResponse> {
  const res = await api.get('/query', {
    ...authHeader(token),
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
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





