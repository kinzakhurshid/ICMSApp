// Project types
export interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  budget: number;
  spent: number;
  client: string;
  clientContact: string;
  clientEmail: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  completeDate?: string;
  fileUrl?: string;
  color?: string;
  projectManager?: {
    _id: string;
    fullName: string;
    profilePic?: string;
  };
  teamMembers: Array<{
    _id: string;
    fullName: string;
    profilePic?: string;
  }>;
}

// Task types
export interface TaskDetails {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId?: {
    _id: string;
    name: string;
    color?: string;
  };
  assignedTo?: Array<{
    _id: string;
    fullName: string;
    profilePic?: string;
  }>;
}

// Sprint types
export interface ISprint {
  _id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  color?: string;
  completed: boolean;
  started: boolean;
  tasks: TaskDetails[];
  projectId: Project[];
}
