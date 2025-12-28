export interface OrgQueryEmployee {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  position?: string;
  designation?: string;
}

export interface OrgQueryComment {
  comment: string;
  createdAt?: string;
  createdBy?: string;
}

export interface OrgQueryMediaFile {
  name?: string;
  url?: string;
  type?: string;
  _id?: string;
}

export interface OrgQuery {
  _id: string;
  subject?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  employeeId?: OrgQueryEmployee;
  comments?: OrgQueryComment[];
  mediaFiles?: OrgQueryMediaFile[];
  attachments?: OrgQueryMediaFile[];
}

export interface OrgQueryListResponse {
  data: OrgQuery[];
  total?: number;
  page?: number;
  limit?: number;
  success?: boolean;
}






