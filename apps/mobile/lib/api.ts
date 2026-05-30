import { supabase } from "@/lib/supabase";
import {
  mockUser,
  mockServiceCategories,
  mockServices,
  mockNews,
  mockFiles,
  mockNotifications,
} from "@/mock/data";
import type { AttendanceDay, AttendanceDetailDay, AttendanceWeek, EmployeeContact, LeaveType, LeaveRequest, LeaveRequestRow } from "@/types";
import { S } from "@/constants/strings";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    await delay(200);
    return mockServices;
  },

  getServiceCategories: async () => {
    await delay(200);
    return mockServiceCategories;
  },

  getNews: async () => {
    await delay(500);
    return mockNews;
  },

  getFiles: async () => {
    await delay(400);
    return mockFiles;
  },

  getNotifications: async () => {
    await delay(300);
    return mockNotifications;
  },

  getEmployeeContacts: async (departmentId: string, heltesId: string): Promise<EmployeeContact[]> => {
    let query = supabase
      .from("users_with_stats")
      .select("first_name, last_name, phone, department_name, heltes_name, position_name")
      .eq("is_working", true);

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    } else if (heltesId) {
      query = query.eq("heltes_id", heltesId);
    }

    const { data, error } = await query
      .order("first_name");

    if (error || !data) return [];

    return data.map((row: any) => ({
      firstName: row.first_name ?? "",
      lastName: row.last_name ?? "",
      phone: row.phone ?? "",
      departmentName: row.department_name ?? "",
      heltesName: row.heltes_name ?? "",
      positionName: row.position_name ?? "",
    }));
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
