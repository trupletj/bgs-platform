/**
 * Утасны дугаарыг нормчлох: цифрээс бусдыг хасаад, 11 оронтой `976` кодтой бол
 * салгаж 8 оронтой дотоод формат болгоно (Supabase OTP / verify-user-д ийм хэрэгтэй).
 */
export function normalizePhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("976") ? digits.slice(3) : digits;
}
