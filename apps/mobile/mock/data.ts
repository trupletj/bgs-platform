import type { User, AttendanceWeek, FileItem } from "@/types";

export const mockUser: User = {
  id: "1",
  name: "Батболд Ганзориг",
  role: "Ахлах програмист",
  department: "Мэдээллийн технологийн алба",
  departmentId: "",
  heltesId: "",
  heltesName: "",
  employeeId: "BGS-2024-0042",
  idCardNumber: "430180652506",
  email: "batbold@bgs.mn",
  phone: "+976 9911 2233",
  isWorking: true,
};

export const mockAttendance: AttendanceWeek = {
  days: [
    { day: "Да", status: "present", checkIn: "09:02", checkOut: "18:15" },
    { day: "Мя", status: "present", checkIn: "08:55", checkOut: "18:30" },
    { day: "Лх", status: "absent" },
    { day: "Пү", status: "current", checkIn: "09:10" },
    { day: "Ба", status: "future" },
  ],
  totalHours: "27ц 30м",
};

export const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "Компанийн дүрэм.pdf",
    type: "pdf",
    size: "2.4 MB",
    date: "2026-01-15",
  },
  {
    id: "2",
    name: "Цалингийн журам.docx",
    type: "doc",
    size: "1.1 MB",
    date: "2026-01-10",
  },
  {
    id: "3",
    name: "Ажилтны гарын авлага.pdf",
    type: "pdf",
    size: "5.6 MB",
    date: "2025-12-20",
  },
  {
    id: "4",
    name: "Төсвийн тайлан.xlsx",
    type: "xls",
    size: "890 KB",
    date: "2026-02-01",
  },
];

