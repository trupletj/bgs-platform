import { supabase } from "@/lib/supabase";
import { mockUser, mockFiles } from "@/mock/data";
import { SERVICES, SERVICE_CATEGORIES } from "@/constants/services";
import type { AttendanceDay, AttendanceDetailDay, AttendanceWeek, ChatMessage, ChatThread, Contact, ContactRequest, DirectoryUser, GroupDetail, GroupJoinRequest, GroupMember, GroupVisibility, OrgGroup, PublicGroup, LeaveType, LeaveRequest, LeaveRequestRow } from "@/types";
import { S } from "@/constants/strings";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** `mobile` schema-д хандах товч туслах (чатын backend) */
const mobileDb = () => supabase.schema("mobile" as never);

function formatChatTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Өчигдөр";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function mapDirectoryUser(r: any) {
  return {
    id: String(r.id),
    name: r.name ?? "",
    positionName: r.position_name ?? "",
    heltesName: r.heltes_name ?? "",
    phone: r.phone ?? "",
    contactStatus: (r.contact_status ?? "none") as
      | "none"
      | "pending_out"
      | "pending_in"
      | "accepted"
      | "self",
  };
}

function formatTime(timestamp: string | null): string | undefined {
  if (!timestamp) return undefined;
  const d = new Date(timestamp);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getFriday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  // How many days back to the most recent Friday (start of work week)
  const diff = (day + 2) % 7; // Fri=0, Sat=1, Sun=2, Mon=3, Tue=4, Wed=5, Thu=6
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const api = {
  getProfile: async () => {
    await delay(300);
    return mockUser;
  },

  // Чат — `mobile` schema дээрх бодит backend (RPC + Realtime).
  getChatThreads: async (): Promise<ChatThread[]> => {
    const { data, error } = await mobileDb().rpc("get_conversations");
    if (error || !data) return [];
    return (data as any[]).map((row) => ({
      id: String(row.id),
      name: row.name ?? "Чат",
      lastMessage: row.last_message ?? "",
      time: formatChatTime(row.last_message_at),
      unread: row.unread ?? 0,
      isGroup: row.is_group ?? false,
      isOfficial: row.is_official ?? false,
      muted: row.is_muted ?? false,
    }));
  },

  getChatMessages: async (
    threadId: string,
    opts?: { limit?: number; before?: string }
  ): Promise<ChatMessage[]> => {
    const { data, error } = await mobileDb().rpc("get_messages", {
      p_conversation_id: Number(threadId),
      p_limit: opts?.limit ?? 30,
      p_before: opts?.before ?? null,
    });
    if (error || !data) return [];
    return (data as any[]).map((row) => ({
      id: String(row.id),
      threadId,
      text: row.body ?? "",
      fromMe: row.is_mine ?? false,
      time: formatChatTime(row.created_at),
      createdAt: row.created_at ?? undefined,
      senderName: row.sender_name ?? undefined,
      senderStaff: row.sender_staff ?? undefined,
      actions: Array.isArray(row.actions) ? (row.actions as any[]) : undefined,
      kind: row.kind ?? "text",
      attachmentUrl: row.attachment_url ?? undefined,
      attachmentName: row.attachment_name ?? undefined,
      attachmentMime: row.attachment_mime ?? undefined,
    }));
  },

  sendChatMessage: async (threadId: string, body: string): Promise<ChatMessage | null> => {
    const { data, error } = await mobileDb().rpc("send_message", {
      p_conversation_id: Number(threadId),
      p_body: body,
    });
    const row = (data as any[])?.[0];
    if (error || !row) return null;
    return {
      id: String(row.id),
      threadId,
      text: row.body ?? "",
      fromMe: true,
      time: formatChatTime(row.created_at),
    };
  },

  markChatRead: async (threadId: string): Promise<void> => {
    await mobileDb().rpc("mark_read", { p_conversation_id: Number(threadId) });
  },

  // Зураг/файл хавсралт upload хийгээд мессеж илгээх
  sendChatMedia: async (
    threadId: string,
    file: { uri: string; name: string; mime: string; kind: "image" | "file" }
  ): Promise<void> => {
    const ext = file.name.includes(".")
      ? file.name.split(".").pop()
      : file.kind === "image"
        ? "jpg"
        : "bin";
    const path = `${threadId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const resp = await fetch(file.uri);
    const blob = await resp.blob();
    const { error: upErr } = await supabase.storage
      .from("chat-media")
      .upload(path, blob, { contentType: file.mime, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabase.storage.from("chat-media").getPublicUrl(path);
    const { error } = await mobileDb().rpc("send_media_message", {
      p_conversation_id: Number(threadId),
      p_body: "",
      p_url: pub.publicUrl,
      p_name: file.name,
      p_mime: file.mime,
      p_kind: file.kind,
    });
    if (error) throw new Error(error.message);
  },

  createDirectConversation: async (userId: string): Promise<string | null> => {
    const { data, error } = await mobileDb().rpc("create_direct_conversation", {
      p_other_user_id: userId,
    });
    if (error) throw new Error(error.message);
    return data == null ? null : String(data);
  },

  createGroupConversation: async (
    title: string,
    memberIds: string[],
    visibility: GroupVisibility = "private"
  ): Promise<string | null> => {
    const { data, error } = await mobileDb().rpc("create_group_conversation", {
      p_title: title,
      p_member_ids: memberIds,
      p_visibility: visibility,
    });
    if (error) throw new Error(error.message);
    return data == null ? null : String(data);
  },

  // ---- Группын нээлттэй/хаалттай + нэгдэх хүсэлт ----
  searchPublicGroups: async (query: string): Promise<PublicGroup[]> => {
    const { data, error } = await mobileDb().rpc("search_public_groups", { p_query: query });
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      id: String(r.id),
      name: r.name ?? "Группа",
      memberCount: r.member_count ?? 0,
      joinStatus: (r.join_status ?? "none") as PublicGroup["joinStatus"],
    }));
  },

  requestJoinGroup: async (conversationId: string): Promise<string | null> => {
    const { data, error } = await mobileDb().rpc("request_join_group", {
      p_conversation_id: Number(conversationId),
    });
    if (error) return null;
    return data as string;
  },

  getGroupDetail: async (conversationId: string): Promise<GroupDetail | null> => {
    const { data, error } = await mobileDb().rpc("get_group_detail", {
      p_conversation_id: Number(conversationId),
    });
    const row = (data as any[])?.[0];
    if (error || !row) return null;
    return {
      id: String(row.id),
      title: row.title ?? "",
      visibility: (row.visibility ?? "private") as GroupVisibility,
      isAdmin: row.is_admin ?? false,
      memberCount: row.member_count ?? 0,
    };
  },

  getGroupMembers: async (conversationId: string): Promise<GroupMember[]> => {
    const { data, error } = await mobileDb().rpc("get_group_members", {
      p_conversation_id: Number(conversationId),
    });
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      userId: String(r.user_id),
      name: r.name ?? "",
      positionName: r.position_name ?? "",
      role: r.role ?? "member",
    }));
  },

  getGroupJoinRequests: async (conversationId: string): Promise<GroupJoinRequest[]> => {
    const { data, error } = await mobileDb().rpc("get_group_join_requests", {
      p_conversation_id: Number(conversationId),
    });
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      userId: String(r.user_id),
      name: r.name ?? "",
      positionName: r.position_name ?? "",
      createdAt: r.created_at ?? "",
    }));
  },

  respondGroupJoinRequest: async (
    conversationId: string,
    userId: string,
    accept: boolean
  ): Promise<void> => {
    await mobileDb().rpc("respond_group_join_request", {
      p_conversation_id: Number(conversationId),
      p_user_id: userId,
      p_accept: accept,
    });
  },

  setGroupVisibility: async (
    conversationId: string,
    visibility: GroupVisibility
  ): Promise<void> => {
    await mobileDb().rpc("set_group_visibility", {
      p_conversation_id: Number(conversationId),
      p_visibility: visibility,
    });
  },

  addGroupMember: async (conversationId: string, userId: string): Promise<void> => {
    const { error } = await mobileDb().rpc("add_group_member", {
      p_conversation_id: Number(conversationId),
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
  },

  leaveGroup: async (conversationId: string): Promise<void> => {
    const { error } = await mobileDb().rpc("leave_group", {
      p_conversation_id: Number(conversationId),
    });
    if (error) throw new Error(error.message);
  },

  removeGroupMember: async (conversationId: string, userId: string): Promise<void> => {
    const { error } = await mobileDb().rpc("remove_group_member", {
      p_conversation_id: Number(conversationId),
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
  },

  setGroupTitle: async (conversationId: string, title: string): Promise<void> => {
    const { error } = await mobileDb().rpc("set_group_title", {
      p_conversation_id: Number(conversationId),
      p_title: title,
    });
    if (error) throw new Error(error.message);
  },

  setMute: async (conversationId: string, muted: boolean): Promise<void> => {
    await mobileDb().rpc("set_mute", {
      p_conversation_id: Number(conversationId),
      p_muted: muted,
    });
  },

  hideConversation: async (conversationId: string): Promise<void> => {
    await mobileDb().rpc("hide_conversation", {
      p_conversation_id: Number(conversationId),
    });
  },

  getAttendance: async (workerId: string): Promise<AttendanceWeek> => {
    const { data, error } = await supabase.rpc("get_worker_attendance", {
      p_worker_id: Number(workerId),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const friday = getFriday(today);

    const weekDays = S.home.weekDays; // ["Ба", "Бя", "Ня", "Да", "Мя", "Лх", "Пү"]
    // Fri, Sat, Sun, Mon, Tue, Wed, Thu — consecutive from Friday
    const dayOffsets = [0, 1, 2, 3, 4, 5, 6];
    const dayMap = new Map<string, (typeof data)[number]>();
    if (data) {
      for (const row of data) {
        dayMap.set(row.day_date, row);
      }
    }

    let totalMinutes = 0;
    const days: AttendanceDay[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(friday);
      d.setDate(friday.getDate() + dayOffsets[i]);
      const dateStr = toDateStr(d);
      const row = dayMap.get(dateStr);

      let status: AttendanceDay["status"];
      let checkIn: string | undefined;
      let checkOut: string | undefined;

      if (d > today) {
        status = "future";
      } else if (dateStr === toDateStr(today)) {
        status = "current";
        checkIn = formatTime(row?.work_start_at ?? null);
        checkOut = formatTime(row?.work_end_at ?? null);
        if (row?.work_duration) totalMinutes += row.work_duration * 60;
      } else if (row?.work_start_at) {
        status = "present";
        checkIn = formatTime(row.work_start_at);
        checkOut = formatTime(row.work_end_at ?? null);
        if (row.work_duration) totalMinutes += row.work_duration * 60;
      } else {
        status = "absent";
      }

      days.push({ day: weekDays[i], status, checkIn, checkOut });
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const totalHours = `${hours}ц ${mins}м`;

    if (error) {
      return { days: [], totalHours: "0ц 0м" };
    }

    return { days, totalHours };
  },

  getAttendanceDetail: async (workerId: string): Promise<AttendanceDetailDay[]> => {
    const { data, error } = await supabase.rpc("get_worker_attendance", {
      p_worker_id: Number(workerId),
    });

    if (error || !data) return [];

    return data.map((row: any) => ({
      dayDate: row.day_date,
      workStartAt: row.work_start_at,
      workEndAt: row.work_end_at,
      workDuration: row.work_duration,
      statusId: row.status_id,
      isHotsorson: row.is_hotsorson ?? false,
      isErtTarsan: row.is_ert_tarsan ?? false,
      startAt: row.start_at,
      endAt: row.end_at,
    }));
  },

  getServices: async () => {
    return SERVICES;
  },

  getServiceCategories: async () => {
    return SERVICE_CATEGORIES;
  },

  getFiles: async () => {
    await delay(400);
    return mockFiles;
  },

  // ---- Contact (найз) систем ----
  getContacts: async (): Promise<Contact[]> => {
    const { data, error } = await mobileDb().rpc("get_contacts");
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      userId: String(r.user_id),
      name: r.name ?? "",
      positionName: r.position_name ?? "",
      heltesName: r.heltes_name ?? "",
      phone: r.phone ?? "",
    }));
  },

  getContactRequests: async (): Promise<ContactRequest[]> => {
    const { data, error } = await mobileDb().rpc("get_contact_requests");
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      requesterId: String(r.requester_id),
      name: r.name ?? "",
      positionName: r.position_name ?? "",
      createdAt: r.created_at ?? "",
    }));
  },

  searchSystemUsers: async (query: string): Promise<DirectoryUser[]> => {
    const { data, error } = await mobileDb().rpc("search_system_users", {
      p_query: query,
    });
    if (error || !data) return [];
    return (data as any[]).map(mapDirectoryUser);
  },

  getOrgGroups: async (): Promise<OrgGroup[]> => {
    const { data, error } = await mobileDb().rpc("get_org_groups");
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      groupId: String(r.group_id),
      name: r.name ?? "",
      memberCount: r.member_count ?? 0,
    }));
  },

  getOrgGroupMembers: async (groupBtegId: string): Promise<DirectoryUser[]> => {
    const { data, error } = await mobileDb().rpc("get_org_group_members", {
      p_group_bteg_id: groupBtegId,
    });
    if (error || !data) return [];
    return (data as any[]).map(mapDirectoryUser);
  },

  sendContactRequest: async (userId: string): Promise<string | null> => {
    const { data, error } = await mobileDb().rpc("send_contact_request", {
      p_addressee_id: userId,
    });
    if (error) return null;
    return data as string;
  },

  respondContactRequest: async (requesterId: string, accept: boolean): Promise<void> => {
    await mobileDb().rpc("respond_contact_request", {
      p_requester_id: requesterId,
      p_accept: accept,
    });
  },

  removeContact: async (userId: string): Promise<void> => {
    await mobileDb().rpc("remove_contact", { p_user_id: userId });
  },

  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const { data, error } = await supabase
      .from("leave_types")
      .select("id, name")
      .eq("is_active", true)
      .order("id");

    if (error || !data) return [];
    return data;
  },

  getLeaveRequests: async (): Promise<LeaveRequestRow[]> => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("id, leave_type_id, duration_days, description, status, created_at, leave_types(name)")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      leaveTypeId: row.leave_type_id,
      leaveTypeName: row.leave_types?.name ?? "",
      durationDays: row.duration_days,
      description: row.description ?? undefined,
      status: row.status ?? "pending",
      createdAt: row.created_at,
    }));
  },

  submitLeaveRequest: async (
    req: LeaveRequest,
    file?: { uri: string; name: string; mimeType: string }
  ) => {
    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("leave-attachments")
        .upload(path, blob, { contentType: file.mimeType });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("leave-attachments")
          .getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }
    }

    const { error } = await supabase.from("leave_requests").insert({
      leave_type_id: req.leaveTypeId,
      duration_days: req.durationDays,
      description: req.description || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
    });

    if (error) throw error;
  },
};
