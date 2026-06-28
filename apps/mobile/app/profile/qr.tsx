import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Brightness from "expo-brightness";
import { RefreshCw, Sun, ChevronLeft } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { BgsCard } from "@/components/bgs/card";
import { BrandMark } from "@/components/brand/brand-mark";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";
import { buildIdCardPayload, localDateString } from "@/lib/id-card-qr";

type Mode = "access" | "attend" | "canteen";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "access", label: "Нэвтрэх", hint: "Хаалга, контрол цэгт уншуулна" },
  { id: "attend", label: "Цаг бүртгэл", hint: "Ирц бүртгэлийн төхөөрөмжид" },
  { id: "canteen", label: "Цайны эрх", hint: "Хоолны газарт уншуулна" },
];

export default function QrScreen() {
  const t = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<Mode>("access");
  const [now, setNow] = useState(() => new Date());
  const [boosted, setBoosted] = useState(false);

  // QR нь өдрийн key-тэй тул минут тутамд л шинэчилнэ (шөнө дундын rollover-т хүрэлцэнэ).
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = localDateString(now);
  // Нэг өдрийн турш ижил статик QR — payload-ыг өдөр бүр л дахин тооцно.
  const payload = useMemo(
    () => buildIdCardPayload(user, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.idCardNumber, user?.employeeId, dateStr]
  );

  // Дэлгэцийг гэрэлтүүлэх — QR харагдаж байх үед хамгийн их гэрэл, гарахад сэргээнэ.
  const applyBrightness = useCallback(async () => {
    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== "granted") return;
      await Brightness.setBrightnessAsync(1);
      setBoosted(true);
    } catch {
      // permission/unsupported — чимээгүй өнгөрөөнө
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // Дэлгэцээс гарахад гэрлийг системд буцаана.
        Brightness.restoreSystemBrightnessAsync().catch(() => {});
        setBoosted(false);
      };
    }, [])
  );

  const cur = MODES.find((m) => m.id === mode)!;
  const empId = user?.employeeId ?? "BGS-00000";
  const initial = user?.name?.charAt(0) ?? "B";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: -8,
            marginTop: 4,
          }}
        >
          <ChevronLeft size={26} color={t.text} strokeWidth={2} />
        </Pressable>

        {/* Title */}
        <View style={{ alignItems: "center", paddingVertical: 10 }}>
          <Text
            style={{ fontSize: 22, fontWeight: "800", color: t.text, letterSpacing: -0.4 }}
          >
            Дижитал үнэмлэх
          </Text>
          <Text style={{ fontSize: 13, color: t.sub, marginTop: 3 }}>{cur.hint}</Text>
        </View>

        {/* Segmented control — нэг үнэмлэх, хэрэглээний заавар */}
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            backgroundColor: t.dark ? "rgba(255,255,255,0.06)" : "#E6E9EE",
            borderRadius: 13,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: active ? t.card : "transparent",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: active ? 0.12 : 0,
                  shadowRadius: 4,
                  elevation: active ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: "700",
                    letterSpacing: -0.2,
                    color: active ? t.accent : t.sub,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* QR Card */}
        <BgsCard t={t} style={{ overflow: "hidden", padding: 0 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
              padding: 18,
              backgroundColor: t.accent,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.22)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 19 }}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16.5, fontWeight: "800", color: "#fff", letterSpacing: -0.2 }}
                numberOfLines={1}
              >
                {user?.name ?? "Ажилтан"}
              </Text>
              <Text style={{ fontSize: 12.5, color: "rgba(255,255,255,0.92)" }} numberOfLines={1}>
                {user?.role ?? "—"}
              </Text>
            </View>
            <BrandMark height={18} variant="white" />
          </View>

          {/* QR + meta */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 26,
              paddingBottom: 14,
              alignItems: "center",
            }}
          >
            <View
              style={{
                padding: 16,
                backgroundColor: "#fff",
                borderRadius: 22,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 30,
                elevation: 4,
              }}
            >
              {payload ? (
                <QRCode
                  value={payload}
                  size={206}
                  ecl="H"
                  color={t.text}
                  backgroundColor="#fff"
                />
              ) : (
                <View
                  style={{
                    width: 206,
                    height: 206,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: t.sub, fontSize: 13, textAlign: "center" }}>
                    Үнэмлэхийн мэдээлэл{"\n"}олдсонгүй
                  </Text>
                </View>
              )}
              {/* Төв лого */}
              <View
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: [{ translateX: -21 }, { translateY: -21 }],
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <BrandMark height={26} variant="orange" markOnly background="#FFFFFF" />
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                marginTop: 16,
              }}
            >
              <RefreshCw size={15} color={t.sub} strokeWidth={2} />
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.sub }}>
                Өнөөдрийн код · шөнө дунд шинэчлэгдэнэ
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "Menlo",
                fontSize: 14,
                letterSpacing: 2,
                color: t.text,
                fontWeight: "700",
                marginTop: 14,
              }}
            >
              {empId}
            </Text>
          </View>
        </BgsCard>

        {/* Brighten button */}
        <Pressable
          onPress={applyBrightness}
          style={{
            marginTop: 16,
            paddingVertical: 15,
            borderRadius: 16,
            backgroundColor: boosted ? t.sub : t.accent,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Sun size={19} color="#fff" strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: -0.2 }}>
            {boosted ? "Дэлгэц гэрэлтэй байна" : "Дэлгэцийг гэрэлтүүлэх"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
