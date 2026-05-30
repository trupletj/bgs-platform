import { View, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { ServiceGridItem } from "./service-grid-item";
import { S } from "@/constants/strings";
import type { ServiceItem } from "@/types";

interface ServiceGridProps {
  services: ServiceItem[];
}

export function ServiceGrid({ services }: ServiceGridProps) {
  return (
    <Card>
      <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        {S.home.services}
      </Text>
      <View className="flex-row flex-wrap">
        {services.map((service) => (
          <View key={service.id} className="w-1/3">
            <ServiceGridItem item={service} />
          </View>
        ))}
      </View>
    </Card>
  );
}
