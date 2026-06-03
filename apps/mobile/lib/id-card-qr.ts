import md5Import from "js-md5";

import type { User } from "@/types";

// js-md5 нь `export =` callable — default import-ийг callable болгож cast хийв.
const md5 = md5Import as unknown as (message: string) => string;

/**
 * Дижитал үнэмлэхийн QR payload. bgs-dining киоск болон legacy
 * bteg-bmisc-тэй нийцтэй формат:
 *   { id_card_number, bteg_id, key }
 * key = md5(YYYY-MM-DD + idcard_number + "bmisckey") — өдөр бүр шинэчлэгдэнэ
 * (ProfileController::edit-тэй ижил томъёо).
 */
const QR_SECRET = "bmisckey";

/** Төхөөрөмжийн локал огноог YYYY-MM-DD (Carbon toDateString-тэй ижил). */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function idCardKey(idCardNumber: string, date: Date = new Date()): string {
  return md5(`${localDateString(date)}${idCardNumber}${QR_SECRET}`);
}

/** QR-д кодлогдох JSON текст. Дата дутуу бол null. */
export function buildIdCardPayload(user: User | null, date: Date = new Date()): string | null {
  if (!user?.idCardNumber || !user?.employeeId) return null;
  const btegId = Number(user.employeeId);
  return JSON.stringify({
    id_card_number: user.idCardNumber,
    bteg_id: Number.isNaN(btegId) ? user.employeeId : btegId,
    key: idCardKey(user.idCardNumber, date),
  });
}

/** Шөнө дунд хүртэлх үлдсэн секунд (QR өдөр бүр шинэчлэгддэг). */
export function secondsUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}
