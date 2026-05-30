import type {
  User,
  AttendanceWeek,
  ServiceCategory,
  ServiceItem,
  NewsItem,
  FileItem,
  Notification,
} from "@/types";

export const mockUser: User = {
  id: "1",
  name: "Батболд Ганзориг",
  role: "Ахлах програмист",
  department: "Мэдээллийн технологийн алба",
  departmentId: "",
  heltesId: "",
  heltesName: "",
  employeeId: "BGS-2024-0042",
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

export const mockServiceCategories: ServiceCategory[] = [
  { id: "hr", title: "Хүний нөөц", order: 1 },
  { id: "finance", title: "Санхүү", order: 2 },
  { id: "work", title: "Ажлын удирдлага", order: 3 },
  { id: "other", title: "Бусад", order: 4 },
];

export const mockServices: ServiceItem[] = [
  { id: "1", title: "Ирц", icon: "clock", route: "/services/attendance", categoryId: "hr", iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "#2563EB" },
  { id: "2", title: "Чөлөө", icon: "calendar-off", route: "/services/leave", categoryId: "hr", iconBg: "bg-orange-50 dark:bg-orange-950", iconColor: "#F97316" },
  { id: "3", title: "Ажилтны мэдээлэл", icon: "file-signature", categoryId: "hr", iconBg: "bg-purple-50 dark:bg-purple-950", iconColor: "#8B5CF6", badge: "Шинэ", badgeVariant: "info" },
  { id: "4", title: "Сургалт", icon: "graduation-cap", categoryId: "hr", iconBg: "bg-teal-50 dark:bg-teal-950", iconColor: "#14B8A6" },
  { id: "13", title: "Утасны дугаар", icon: "phone", route: "/services/phone-directory", categoryId: "hr", iconBg: "bg-green-50 dark:bg-green-950", iconColor: "#16A34A" },
  { id: "5", title: "Цалин", icon: "wallet", categoryId: "finance", iconBg: "bg-green-50 dark:bg-green-950", iconColor: "#22C55E" },
  { id: "6", title: "Урамшуулал", icon: "gift", categoryId: "finance", iconBg: "bg-pink-50 dark:bg-pink-950", iconColor: "#EC4899" },
  { id: "7", title: "Зардал", icon: "receipt", categoryId: "finance", iconBg: "bg-yellow-50 dark:bg-yellow-950", iconColor: "#EAB308" },
  { id: "8", title: "Хуваарь", icon: "calendar-days", categoryId: "work", iconBg: "bg-indigo-50 dark:bg-indigo-950", iconColor: "#6366F1" },
  { id: "9", title: "Даалгавар", icon: "list-checks", categoryId: "work", iconBg: "bg-cyan-50 dark:bg-cyan-950", iconColor: "#06B6D4", badge: "3", badgeVariant: "danger" },
  { id: "10", title: "Баримтууд", icon: "file-text", categoryId: "work", iconBg: "bg-red-50 dark:bg-red-950", iconColor: "#EF4444" },
  { id: "11", title: "Тусламж", icon: "help-circle", categoryId: "other", iconBg: "bg-gray-50 dark:bg-gray-800", iconColor: "#6B7280" },
  { id: "12", title: "Тохиргоо", icon: "settings", categoryId: "other", iconBg: "bg-slate-50 dark:bg-slate-900", iconColor: "#475569" },
];

export const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Компанийн шинэ оффис нээгдлээ",
    description:
      "BGS группийн шинэ төв оффис Улаанбаатар хотын төвд нээгдэж, ажилтнууд шинэ орчинд ажиллаж эхэллээ.",
    date: "2026-02-15",
    likes: 24,
  },
  {
    id: "2",
    title: "Хөдөлмөрийн аюулгүй байдлын сургалт",
    description:
      "2026 оны 2-р сарын сургалтын хуваарь гарлаа. Бүх ажилтнууд заавал хамрагдана.",
    date: "2026-02-14",
    likes: 12,
  },
  {
    id: "3",
    title: "Ажилтнуудын спортын өдөрлөг",
    description:
      "Энэ сарын 25-нд компанийн ажилтнуудын дунд спортын өдөрлөг зохион байгуулагдана.",
    date: "2026-02-12",
    likes: 45,
  },
];

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

export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Ирцийн мэдэгдэл",
    message: "Өнөөдрийн ирц амжилттай бүртгэгдлээ. Ирсэн цаг: 09:10",
    date: "2026-02-16",
    read: false,
    type: "success",
  },
  {
    id: "2",
    title: "Шинэ мэдэгдэл",
    message: "Хөдөлмөрийн аюулгүй байдлын сургалтанд бүртгүүлнэ үү.",
    date: "2026-02-16",
    read: false,
    type: "info",
  },
  {
    id: "3",
    title: "Чөлөөний хүсэлт",
    message: "Таны чөлөөний хүсэлт зөвшөөрөгдлөө.",
    date: "2026-02-15",
    read: true,
    type: "success",
  },
  {
    id: "4",
    title: "Системийн мэдэгдэл",
    message: "Цалингийн тооцоолол дууслаа. Дэлгэрэнгүй мэдээллийг шалгана уу.",
    date: "2026-02-15",
    read: true,
    type: "info",
  },
  {
    id: "5",
    title: "Анхааруулга",
    message: "Маргааш 02-14 өдрийн хуваарь өөрчлөгдсөн байна.",
    date: "2026-02-13",
    read: true,
    type: "warning",
  },
];
