import api from './api';
import { PMDashboardStats, HRDashboardStats, OrgStats, PayrollTrend } from '../types/dashboard';

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export async function fetchPMStats(orgId: string, token: string): Promise<PMDashboardStats> {
  const res = await api.get(`/projects/dashStats/${orgId}`, authHeader(token));
  return res.data.data as PMDashboardStats;
}

export async function fetchHRStats(token: string): Promise<HRDashboardStats> {
  const res = await api.get('/HR/stats', authHeader(token));
  return res.data.data as HRDashboardStats;
}

export async function fetchOrgStats(token: string): Promise<OrgStats> {
  const res = await api.get('/HR/org', authHeader(token));
  return res.data.data as OrgStats;
}

export async function fetchPayrollTrends(
  startDateIso: string,
  endDateIso: string,
  token: string
): Promise<PayrollTrend[]> {
  const res = await api.get('/salary/dashboard', {
    ...authHeader(token),
    params: { startDate: startDateIso, endDate: endDateIso }
  });
  return (res.data.payrollTrends || []) as PayrollTrend[];
}







