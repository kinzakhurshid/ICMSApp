
 interface UserResponse {
  success: boolean;
  message: string;
  user: User;
}

 interface User {
  _id: string;
  name: string;
  email: string;
  profilePic: string;
  organization:string,
  role: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  employee: Employee;
  token: string;
}

 interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

 interface Experience {
  position: string;
  company: string;
  jobType: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

 interface Education {
  degree: string;
  institute: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  gender:string;
  status:string;
  city:string;
  state:string;
  contactNumber: string;
  user?: string;  // Made optional
  role: string;
  skills: string[];
  experiences: Experience[];
  isActive: boolean;
  profileImage: string;
  createdAt?: string;  // Made optional
  updatedAt?: string;  // Made optional
  __v?: number;       // Made optional
  password?: string;   // Made optional
  emergencyContact: EmergencyContact;
}

 interface FrontendEmployee extends Employee {
  experiences: Experience[];
  city: string;
  state: string;
  education: Education;
}
export interface Leave {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  isHalfDay: boolean;
  halfDayType?: 'first' | 'second';
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half-day' | 'Leave';
  checkIn?: string;
  checkOut?: string;
  arrivalStatus?: 'Late' | 'On Time' | 'Early';
}

 interface EmployeeFormData extends Omit<FrontendEmployee, '_id' | 'createdAt' | 'updatedAt' | '__v'> {
  password?: string;
}
export type {
  UserResponse,
  User,
  EmergencyContact,
  Experience,
  Education,
  Employee,
  FrontendEmployee,
  EmployeeFormData
};
export {};