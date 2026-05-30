import { View, Text, FlatList, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Phone, AlertTriangle } from "lucide-react-native";
import { useState, useMemo } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { S } from "@/constants/strings";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { EmployeeContact } from "@/types";

function getInitial(firstName: string, lastName: string): string {
  return (lastName?.charAt(0) || firstName?.charAt(0) || "?").toUpperCase();
}

function ContactRow({ contact }: { contact: EmployeeContact }) {
  const initial = getInitial(contact.firstName, contact.lastName);
  const fullName = `${contact.lastName} ${contact.firstName}`.trim();

  return (
    <View className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-900">
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Text className="text-sm font-bold text-primary">{initial}</Text>
      </View>
      <View className="flex-1 mr-3">
        <Text className="text-sm font-medium text-gray-900 dark:text-white">
          {fullName}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {contact.positionName}
        </Text>
      </View>
      {contact.phone ? (
        <Pressable
          onPress={() => Linking.openURL(`tel:${contact.phone}`)}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950"
        >
          <Phone size={14} color="#16A34A" />
          <Text className="text-xs font-medium text-green-600 dark:text-green-400">
            {contact.phone}
          </Text>
        </Pressable>
      ) : (
        <Text className="text-xs text-gray-400">—</Text>
      )}
    </View>
  );
}

export default function PhoneDirectoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const user = useAuthStore((s) => s.user);

  const departmentId = user?.departmentId ?? "";
  const heltesId = user?.heltesId ?? "";
  const groupLabel = user?.department || user?.heltesName || "";

  const queryKey = departmentId
    ? queryKeys.phoneDirectory.byDepartment(departmentId)
    : queryKeys.phoneDirectory.byHeltes(heltesId);

  const { data: contacts, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.getEmployeeContacts(departmentId, heltesId),
    enabled: !!(departmentId || heltesId),
  });

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const query = search.toLowerCase().trim();
    if (!query) return contacts;
    return contacts.filter(
      (c) =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.positionName.toLowerCase().includes(query)
    );
  }, [contacts, search]);

  const count = filtered.length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center"
        >
          <ChevronLeft size={20} color="#6B7280" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {S.phoneDirectory.title}
          </Text>
          {groupLabel ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {groupLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Search */}
      <View className="px-4 pb-2">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={S.phoneDirectory.search}
        />
      </View>

      {/* Count */}
      {!isLoading && count > 0 && (
        <View className="px-4 py-2">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {count} ажилтан
          </Text>
        </View>
      )}

      {isLoading && (
        <View className="items-center py-10">
          <Text className="text-gray-500 dark:text-gray-400">
            Уншиж байна...
          </Text>
        </View>
      )}

      {!isLoading && count === 0 && (
        <View className="items-center py-10">
          <AlertTriangle size={32} color="#6B7280" />
          <Text className="text-gray-500 dark:text-gray-400 mt-2">
            {S.phoneDirectory.noResults}
          </Text>
        </View>
      )}

      {!isLoading && count > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.phone}-${index}`}
          renderItem={({ item }) => <ContactRow contact={item} />}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 dark:bg-gray-800 ml-16" />
          )}
        />
      )}
    </SafeAreaView>
  );
}
