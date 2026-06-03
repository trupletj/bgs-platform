import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { SearchBar } from "@/components/ui/search-bar";
import { ServiceGrid } from "@/components/services/service-grid";
import { FileListItem } from "@/components/services/file-list-item";
import { Card } from "@/components/ui/card";
import { S } from "@/constants/strings";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export default function ServicesScreen() {
  const { servicesTab, setServicesTab } = useAppStore();
  const [search, setSearch] = useState("");

  const { data: services } = useQuery({
    queryKey: queryKeys.services.all,
    queryFn: api.getServices,
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.services.categories,
    queryFn: api.getServiceCategories,
  });

  const { data: files } = useQuery({
    queryKey: queryKeys.files.all,
    queryFn: api.getFiles,
  });

  const filteredFiles = files?.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {S.services.title}
        </Text>
        <SegmentTabs
          tabs={[S.services.services, S.services.companyFiles]}
          activeIndex={servicesTab}
          onChange={setServicesTab}
          className="mb-3"
        />
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={
            servicesTab === 0 ? S.services.searchServices : S.services.search
          }
        />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-4 pt-3">
        {servicesTab === 0 ? (
          categories && services ? (
            <ServiceGrid
              categories={categories}
              services={services}
              searchQuery={search}
              columns={3}
            />
          ) : null
        ) : (
          <Card>
            {filteredFiles?.map((item) => (
              <FileListItem key={item.id} item={item} />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
