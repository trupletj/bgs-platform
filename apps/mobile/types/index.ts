export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId: string;
  heltesId: string;
  heltesName: string;
  employeeId: string;
  idCardNumber: string;
  /** Цаг бүртгэлийн дугаар (регистрийн цифр хэсэг) */
  attendanceNumber: string;
  /** Ээлжийн (eelj) группын нэр, жишээ "BTEG B-2" */
  shiftName: string;
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
  description?: string;
  iconAsset?: number;
  route?: string;
  categoryId?: string;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "danger" | "warning" | "info";
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

export type ContactStatus =
  | "none"
  | "pending_out"
  | "pending_in"
  | "accepted"
  | "self";

/** Системийн хэрэглэгч (хайлт / группийн гишүүн) */
export interface DirectoryUser {
  id: string;
  name: string;
  positionName: string;
  heltesName: string;
  phone: string;
  contactStatus: ContactStatus;
}

/** Баталгаажсан contact */
export interface Contact {
  userId: string;
  name: string;
  positionName: string;
  heltesName: string;
  phone: string;
  avatarUrl?: string;
}

/** Надад ирсэн найзын хүсэлт */
export interface ContactRequest {
  requesterId: string;
  name: string;
  positionName: string;
  createdAt: string;
}

/** Байгууллагын групп (миний харьяалагдах) */
export interface OrgGroup {
  groupId: string;
  name: string;
  memberCount: number;
}

export interface ChatThread {
  id: string;
  name: string;
  /** Direct чатад нөгөө хэрэглэгчийн зураг; группд группийн зураг */
  avatarUrl?: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup: boolean;
  /** Системийн/албан ёсны суваг (жишээ: Цаг бүртгэл, HR мэдэгдэл) */
  isOfficial?: boolean;
  /** Чимээгүй болгосон эсэх */
  muted?: boolean;
}

/** Системийн мессеж дээрх үйлдлийн товч / бэлэн хариулт */
export interface MessageAction {
  label: string;
  kind: "route" | "flow" | "reply";
  value?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  text: string;
  fromMe: boolean;
  time: string;
  /** Raw ISO timestamp — pagination/огноо тооцоход */
  createdAt?: string;
  /** Optimistic илгээлтийн төлөв */
  pending?: boolean;
  failed?: boolean;
  /** Мессежийн төрөл: text | image | file | system */
  kind?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
  /** Бүлгийн чатад илгээгчийн нэр; official сувагт сувгийн нэр (badge) */
  senderName?: string;
  /** Бүлгийн чатад илгээгчийн зураг (bubble-ийн өмнө харуулна) */
  senderAvatarUrl?: string;
  /** Official сувагт бичсэн ажилтны нэр (автомат бол хоосон) */
  senderStaff?: string;
  /** Системийн мессеж дээрх үйлдлийн товчнууд */
  actions?: MessageAction[];
}

export type GroupVisibility = "private" | "public";
export type GroupJoinStatus = "member" | "pending" | "none";

/** Хайлтаар олдсон нийтийн групп */
export interface PublicGroup {
  id: string;
  name: string;
  memberCount: number;
  joinStatus: GroupJoinStatus;
}

/** Группын дэлгэрэнгүй (мэдээллийн дэлгэц) */
export interface GroupDetail {
  id: string;
  title: string;
  visibility: GroupVisibility;
  isAdmin: boolean;
  memberCount: number;
}

export interface GroupMember {
  userId: string;
  name: string;
  positionName: string;
  role: string;
}

/** Группэд нэгдэх хүсэлт (админд харагдана) */
export interface GroupJoinRequest {
  userId: string;
  name: string;
  positionName: string;
  createdAt: string;
}
