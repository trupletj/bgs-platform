import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronDown,
  Paperclip,
  X,
  Check,
  FileText,
  Calendar,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { S } from "@/constants/strings";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAppStore } from "@/stores/app-store";
import type { LeaveType, LeaveRequestRow } from "@/types";

const statusBadgeVariant: Record<
  LeaveRequestRow["status"],
  "warning" | "success" | "danger"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const statusLabel: Record<LeaveRequestRow["status"], string> = {
  pending: S.leave.pending,
  approved: S.leave.approved,
  rejected: S.leave.rejected,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/* ── Request List (Tab 0) ── */
function LeaveRequestList() {
  const { data: requests, isLoading } = useQuery({
    queryKey: queryKeys.leave.requests,
    queryFn: api.getLeaveRequests,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator />
      </View>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20 gap-3">
        <FileText size={48} color="#9CA3AF" />
        <Text className="text-sm text-gray-400 dark:text-gray-500">
          {S.leave.noRequests}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => String(item.id)}
      contentContainerClassName="px-4 pb-8 gap-3"
      renderItem={({ item }) => (
        <Card>
          {/* Top row: type name + duration badge */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-900 dark:text-white flex-1 mr-2">
              {item.leaveTypeName}
            </Text>
            <Badge variant="info">
              {item.durationDays} {S.leave.days}
            </Badge>
          </View>

          {/* Description preview */}
          {item.description ? (
            <Text
              className="text-xs text-gray-500 dark:text-gray-400 mb-2"
              numberOfLines={1}
            >
              {item.description}
            </Text>
          ) : null}

          {/* Bottom row: date + status */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-400 dark:text-gray-500">
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <Badge variant={statusBadgeVariant[item.status]}>
              {statusLabel[item.status]}
            </Badge>
          </View>
        </Card>
      )}
    />
  );
}

/* ── New Request Form (Tab 1) ── */
function LeaveRequestForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();

  const { data: leaveTypes, isLoading: typesLoading } = useQuery({
    queryKey: queryKeys.leave.types,
    queryFn: api.getLeaveTypes,
  });

  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    selectedType !== null && duration.length > 0 && Number(duration) > 0;

  async function pickFile() {
    if (Platform.OS === "web") {
      await new Promise<void>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,application/pdf";
        input.onchange = () => {
          const picked = input.files?.[0];
          if (picked) {
            setFile({
              uri: URL.createObjectURL(picked),
              name: picked.name,
              mimeType: picked.type || "application/octet-stream",
            });
          }
          resolve();
        };
        input.click();
      });
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      });
    }
  }

  async function handleSubmit() {
    if (!canSubmit || !selectedType) return;

    setSubmitting(true);
    try {
      await api.submitLeaveRequest(
        {
          leaveTypeId: selectedType.id,
          durationDays: Number(duration),
          description: description.trim() || undefined,
        },
        file ?? undefined
      );
      setSelectedType(null);
      setDuration("");
      setDescription("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.leave.requests });
      onSuccess();
      Alert.alert("", S.leave.success);
    } catch {
      Alert.alert("", S.auth.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        {/* Leave Type */}
        <Card>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {S.leave.leaveType}
          </Text>
          <Pressable
            onPress={() => setShowTypePicker(true)}
            className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3"
          >
            <Text
              className={
                selectedType
                  ? "text-sm text-gray-900 dark:text-white"
                  : "text-sm text-gray-400 dark:text-gray-500"
              }
            >
              {selectedType?.name ?? S.leave.selectType}
            </Text>
            <ChevronDown size={18} color="#6B7280" />
          </Pressable>
        </Card>

        {/* Duration */}
        <Card>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {S.leave.duration}
          </Text>
          <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4">
            <TextInput
              value={duration}
              onChangeText={(text) => setDuration(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              className="flex-1 py-3 text-sm text-gray-900 dark:text-white"
            />
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {S.leave.durationUnit}
            </Text>
          </View>
        </Card>

        {/* Description */}
        <Card>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {S.leave.description}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder={S.leave.descriptionPlaceholder}
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
            className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white min-h-[100px]"
          />
        </Card>

        {/* File Attachment */}
        <Card>
          {file ? (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1">
                <Paperclip size={16} color="#6B7280" />
                <Text
                  className="text-sm text-gray-900 dark:text-white flex-1"
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
              </View>
              <Pressable
                onPress={() => setFile(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
              >
                <X size={14} color="#6B7280" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickFile}
              className="flex-row items-center justify-center gap-2 py-2"
            >
              <Paperclip size={16} color="#6B7280" />
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {S.leave.attachFile}
              </Text>
            </Pressable>
          )}
        </Card>

        {/* Submit */}
        <Button
          onPress={handleSubmit}
          className={!canSubmit || submitting ? "opacity-50" : ""}
        >
          {submitting ? S.leave.submitting : S.leave.submit}
        </Button>
      </ScrollView>

      {/* Leave Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowTypePicker(false)}
        >
          <Pressable
            className="bg-white dark:bg-gray-900 rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center py-3">
              <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </View>
            <Text className="text-base font-bold text-gray-900 dark:text-white px-5 pb-3">
              {S.leave.leaveType}
            </Text>
            {typesLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator />
              </View>
            ) : (
              <FlatList
                data={leaveTypes}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setSelectedType(item);
                      setShowTypePicker(false);
                    }}
                    className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"
                  >
                    <Text className="text-sm text-gray-900 dark:text-white">
                      {item.name}
                    </Text>
                    {selectedType?.id === item.id && (
                      <Check size={18} color="#22C55E" />
                    )}
                  </Pressable>
                )}
              />
            )}
            <SafeAreaView edges={["bottom"]}>
              <View className="h-2" />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ── Main Screen ── */
export default function LeaveScreen() {
  const leaveTab = useAppStore((s) => s.leaveTab);
  const setLeaveTab = useAppStore((s) => s.setLeaveTab);

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
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          {S.leave.title}
        </Text>
      </View>

      {/* Segment Tabs */}
      <View className="px-4 pb-3">
        <SegmentTabs
          tabs={[S.leave.requests, S.leave.newRequest]}
          activeIndex={leaveTab}
          onChange={setLeaveTab}
        />
      </View>

      {/* Tab Content */}
      {leaveTab === 0 ? (
        <LeaveRequestList />
      ) : (
        <LeaveRequestForm onSuccess={() => setLeaveTab(0)} />
      )}
    </SafeAreaView>
  );
}
