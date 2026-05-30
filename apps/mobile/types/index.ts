export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId: string;
  heltesId: string;
  heltesName: string;
  employeeId: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  isWorking: boolean;
}

export interface AttendanceDay {
  day: string;
  status: "present" | "absent" | "current" | "future";
  checkIn?: string;
  checkOut?: string;
}

export interface AttendanceWeek {
  days: AttendanceDay[];
  totalHours: string;
}

export interface AttendanceDetailDay {
  dayDate: string;
  workStartAt: string | null;
  workEndAt: string | null;
  workDuration: number | null;
  statusId: number | null;
  isHotsorson: boolean;
  isErtTarsan: boolean;
  startAt: string | null;
  endAt: string | null;
}

export interface ServiceCategory {
  id: string;
  title: string;
  order: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  categoryId?: string;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "danger" | "warning" | "info";
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  likes: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "doc" | "xls" | "img" | "other";
  size: string;
  date: string;
}

export interface VerifyUserResponse {
  message?: string;
  error?: string;
}

export interface LeaveType {
  id: number;
  name: string;
}

export interface LeaveRequest {
  leaveTypeId: number;
  durationDays: number;
  description?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface LeaveRequestRow {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  durationDays: number;
  description?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface EmployeeContact {
  firstName: string;
  lastName: string;
  phone: string;
  departmentName: string;
  heltesName: string;
  positionName: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: "info" | "warning" | "success";
}
