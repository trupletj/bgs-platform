import { View } from "react-native";
import { ServiceCategorySection } from "@/components/services/service-category-section";
import type { ServiceCategory, ServiceItem } from "@/types";

interface ServiceGridProps {
  categories: ServiceCategory[];
  services: ServiceItem[];
  searchQuery: string;
  columns?: 3 | 4;
}

export function ServiceGrid({
  categories,
  services,
  searchQuery,
  columns = 3,
}: ServiceGridProps) {
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const query = searchQuery.toLowerCase();

  const filtered = query
    ? services.filter((s) => s.title.toLowerCase().includes(query))
    : services;

  return (
    <View>
      {sorted.map((cat) => (
        <ServiceCategorySection
          key={cat.id}
          category={cat}
          services={filtered.filter((s) => s.categoryId === cat.id)}
          columns={columns}
        />
      ))}
    </View>
  );
}
