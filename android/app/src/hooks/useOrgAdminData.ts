import { useEffect, useState } from 'react';
import { fetchPMStats, fetchHRStats, fetchOrgStats, fetchPayrollTrends } from '../Services/orgAdmin';
import { PMDashboardStats, HRDashboardStats, OrgStats, PayrollTrend } from '../types/dashboard';

export function useOrgAdminData(orgId: string, token: string, startDateIso: string, endDateIso: string) {
  const [pmStats, setPmStats] = useState<PMDashboardStats | null>(null);
  const [hrStats, setHrStats] = useState<HRDashboardStats | null>(null);
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null);
  const [payroll, setPayroll] = useState<PayrollTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [pm, hr, org, payrollTrends] = await Promise.all([
          fetchPMStats(orgId, token),
          fetchHRStats(token),
          fetchOrgStats(token),
          fetchPayrollTrends(startDateIso, endDateIso, token),
        ]);
        if (!mounted) return;
        setPmStats(pm);
        setHrStats(hr);
        setOrgStats(org);
        setPayroll(payrollTrends);
      } catch (e: any) {
        if (mounted) setError(typeof e === 'string' ? e : e?.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [orgId, token, startDateIso, endDateIso]);

  return { pmStats, hrStats, orgStats, payroll, loading, error };
}








