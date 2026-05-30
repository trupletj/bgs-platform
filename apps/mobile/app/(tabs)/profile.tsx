import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileHeader } from "@/components/profile/profile-header";
import { QRSection } from "@/components/profile/qr-section";
import { ProfileActions } from "@/components/profile/profile-actions";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const biometricAvailable = useAuthStore((s) => s.biometricAvailable);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-4">
        <ProfileHeader user={user} />
        <QRSection name={user.name} employeeId={user.employeeId} />
        <Card className="mt-3">
          <ProfileActions
            onLogout={logout}
            biometricAvailable={biometricAvailable}
            biometricEnabled={biometricEnabled}
            onToggleBiometric={setBiometricEnabled}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
