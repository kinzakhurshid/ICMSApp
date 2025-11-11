export interface IdleTimeMetrics {
  totalRecords: number;
  totalHours: number;
  avgPerEmployee: number;
}

export interface IdleTimeRecord {
  _id: string;
  employeeId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
  };
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface IdleTimePreset {
  _id: string;
  name: string;
  start: string;
  end: string;
  days?: Array<string | number>;
  active?: boolean;
  autoApply?: boolean;
}

export interface IdleTimeListResponse {
  data: IdleTimeRecord[];
  total?: number;
  page?: number;
  limit?: number;
  success?: boolean;
}


