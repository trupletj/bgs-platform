import type { ServiceCategory, ServiceItem } from "@/types";

/**
 * Аппын үйлчилгээний цэс. Эдгээр нь DB биш, аппын дотоод дэлгэцүүд тул
 * статик config-оор тодорхойлогдоно. Шинэ mini-app/дэлгэц нэмэгдэхэд энд бүртгэнэ.
 * `route` байхгүй бол "Удахгүй" stub (дарахад мэдэгдэл гарна).
 */
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "hr", title: "Хүний нөөц", order: 1 },
];

export const SERVICES: ServiceItem[] = [
  {
    id: "attendance",
    title: "Цаг бүртгэл & Ээлж",
    icon: "clock",
    iconAsset: require("../assets/images/services/clock.png"),
    description: "Өдрийн ирц, ажилласан цаг, ээлжийн хуваарь",
    route: "/services/attendance",
    categoryId: "hr",
  },
];
