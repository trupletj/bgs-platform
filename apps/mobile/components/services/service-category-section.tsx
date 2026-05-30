import { View, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { ServiceGridItem } from "@/components/services/service-grid-item";
import type { ServiceCategory, ServiceItem } from "@/types";

interface ServiceCategorySectionProps {
  category: ServiceCategory;
  services: ServiceItem[];
  columns?: 3 | 4;
}

export function ServiceCategorySection({
  category,
  services,
  columns = 3,
}: ServiceCategorySectionProps) {
  if (services.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
        {category.title}
      </Text>
      <Card className="p-2">
        <View className="flex-row flex-wrap">
          {services.map((item) => (
            <ServiceGridItem key={item.id} item={item} columns={columns} />
          ))}
        </View>
      </Card>
    </View>
  );
}
