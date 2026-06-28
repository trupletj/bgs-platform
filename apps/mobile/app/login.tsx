import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { BrandMark } from "@/components/brand/brand-mark";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { normalizePhone } from "@/lib/phone";
import { S } from "@/constants/strings";

const RESEND_SECONDS = 30;

export default function LoginScreen() {
  const t = useTheme();
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [step, setStep] = useState<"request" | "verify">("request");
  const [register, setRegister] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timerRef.current) clearInterval(timerRef.current);
        return c - 1;
      });
    }, 1000);
  };
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const phoneOk = normalizePhone(phone).length === 8;
  const regOk = register.trim().length >= 4;
  const codeOk = code.trim().length === 6;

  const onRequest = async () => {
    if (!phoneOk || !regOk || loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestOtp(phone, register);
      setStep("verify");
      setCode("");
      startCooldown();
    } catch (e: any) {
      setError(e?.message ?? S.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!codeOk || loading) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, code.trim());
      // Амжилттай бол AuthGate (_layout) автоматаар /(tabs) руу шилжүүлнэ.
    } catch (e: any) {
      setError(e?.message ?? S.auth.errorOtpFailed);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestOtp(phone, register);
      startCooldown();
    } catch (e: any) {
      setError(e?.message ?? S.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    fontSize: 16,
    color: t.text,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  } as const;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <BrandMark height={44} variant="orange" />
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: t.text,
                marginTop: 18,
                letterSpacing: -0.4,
              }}
            >
              {step === "request" ? S.auth.loginTitle : S.auth.otpTitle}
            </Text>
            {step === "verify" && (
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 6, textAlign: "center" }}>
                +976 {phone} {S.auth.otpDescription}
              </Text>
            )}
          </View>

          {step === "request" ? (
            <View style={{ gap: 12 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: t.sub, marginLeft: 4 }}>
                  {S.auth.registerNumber}
                </Text>
                <TextInput
                  value={register}
                  onChangeText={(v) => setRegister(v.toUpperCase())}
                  placeholder={S.auth.registerPlaceholder}
                  placeholderTextColor={t.faint}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={inputStyle}
                />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: t.sub, marginLeft: 4 }}>
                  {S.auth.phoneNumber}
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={S.auth.phonePlaceholder}
                  placeholderTextColor={t.faint}
                  keyboardType="phone-pad"
                  style={inputStyle}
                />
              </View>

              {error && (
                <Text style={{ fontSize: 13, color: "#E5484D", marginLeft: 4 }}>{error}</Text>
              )}

              <Pressable
                onPress={onRequest}
                disabled={!phoneOk || !regOk || loading}
                style={{
                  marginTop: 8,
                  paddingVertical: 15,
                  borderRadius: 14,
                  backgroundColor: phoneOk && regOk && !loading ? t.accent : t.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontSize: 15.5,
                      fontWeight: "700",
                      color: phoneOk && regOk ? "#fff" : t.accent,
                    }}
                  >
                    {S.auth.sendOtp}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                placeholderTextColor={t.faint}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={{
                  ...inputStyle,
                  textAlign: "center",
                  fontSize: 24,
                  fontWeight: "800",
                  letterSpacing: 8,
                }}
              />

              {error && (
                <Text style={{ fontSize: 13, color: "#E5484D", marginLeft: 4 }}>{error}</Text>
              )}

              <Pressable
                onPress={onVerify}
                disabled={!codeOk || loading}
                style={{
                  marginTop: 8,
                  paddingVertical: 15,
                  borderRadius: 14,
                  backgroundColor: codeOk && !loading ? t.accent : t.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ fontSize: 15.5, fontWeight: "700", color: codeOk ? "#fff" : t.accent }}
                  >
                    {S.auth.verify}
                  </Text>
                )}
              </Pressable>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 6,
                }}
              >
                <Pressable
                  onPress={() => {
                    setStep("request");
                    setError(null);
                  }}
                  hitSlop={8}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <ChevronLeft size={18} color={t.sub} strokeWidth={2} />
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.sub }}>
                    {S.auth.back}
                  </Text>
                </Pressable>
                <Pressable onPress={onResend} disabled={cooldown > 0 || loading} hitSlop={8}>
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: "600",
                      color: cooldown > 0 ? t.faint : t.accent,
                    }}
                  >
                    {cooldown > 0
                      ? `${S.auth.resendIn} ${cooldown} ${S.auth.seconds}`
                      : S.auth.resendOtp}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
