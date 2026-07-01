"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient, createClientForSchema } from "@/utils/supabase/server";
import type { ConfirmResult, LedBus, MyBusInfo, PassengerItem } from "@/types/shift-exchange";

export const getAmITripLeader = cache(async (): Promise<boolean> => {
  const supabase = await createClientForSchema("bgs_attendance");
  const { data, error } = await supabase.rpc("am_i_trip_leader");
  if (error) {
    console.error("[shift-exchange] am_i_trip_leader:", error.message);
    return false;
  }
  return data === true;
});

export const getMyBusAssignments = cache(async (): Promise<MyBusInfo[]> => {
  const pub = await createClient();
  const { data: { user } } = await pub.auth.getUser();
  if (!user) return [];

  const { data: pubUser } = await pub
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const internalUserId = pubUser?.id ?? user.id;

  const bgs = await createClientForSchema("bgs_attendance");

  const { data: asgns, error: asgnErr } = await bgs
    .from("passenger_assignments")
    .select("id, bus_id, autobus_direction_id, is_confirmed, confirmed_at")
    .eq("internal_user_id", internalUserId)
    .not("bus_id", "is", null)
    .order("id", { ascending: false });

  if (asgnErr || !asgns?.length) return [];

  const busIds = [...new Set(asgns.map((a: any) => a.bus_id))];

  const [busesRes, routesRes] = await Promise.all([
    bgs
      .from("buses")
      .select(`id, name, capacity, departure_time, direction, shift_exchanges ( name, exchange_date ), trip_leaders ( name, phone )`)
      .in("id", busIds),
    bgs
      .from("bus_routes")
      .select("bus_id, stop_order, direction_id")
      .in("bus_id", busIds)
      .order("stop_order"),
  ]);

  const allDirectionIds = [...new Set((routesRes.data ?? []).map((r: any) => r.direction_id).filter(Boolean))];
  let directionMap: Record<string, { name: string; zamTsag: number | null }> = {};
  if (allDirectionIds.length) {
    const { data: dirs } = await pub
      .from("autobus_direction")
      .select("id, name, zam_tsag")
      .in("id", allDirectionIds);
    for (const d of dirs ?? []) {
      directionMap[String(d.id)] = { name: (d as any).name ?? "—", zamTsag: (d as any).zam_tsag ?? null };
    }
  }

  const nowMs = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  const busMap: Record<string, any> = {};
  for (const b of busesRes.data ?? []) {
    const dep = new Date(b.departure_time).getTime();
    if (Math.abs(dep - nowMs) <= threeDays) busMap[String(b.id)] = b;
  }

  const routesByBus: Record<string, any[]> = {};
  for (const r of routesRes.data ?? []) {
    const key = String(r.bus_id);
    if (!routesByBus[key]) routesByBus[key] = [];
    routesByBus[key].push(r);
  }

  return asgns.map((asgn: any) => {
    const bus = busMap[String(asgn.bus_id)];
    if (!bus) return null;
    const leader = Array.isArray(bus.trip_leaders) ? (bus.trip_leaders[0] ?? null) : (bus.trip_leaders ?? null);
    const se = Array.isArray(bus.shift_exchanges) ? bus.shift_exchanges[0] : bus.shift_exchanges;
    const routes = routesByBus[String(asgn.bus_id)] ?? [];
    return {
      bus: { id: String(bus.id), name: bus.name, departureTime: bus.departure_time, capacity: bus.capacity, direction: bus.direction ?? "departing" },
      shiftName: se?.name ?? null,
      shiftDate: se?.exchange_date ?? null,
      leader: leader ? { name: leader.name, phone: leader.phone ?? null } : null,
      stops: routes.map((r: any) => {
        const dir = directionMap[String(r.direction_id)];
        return { order: r.stop_order, directionName: dir?.name ?? "—", zamTsag: dir?.zamTsag ?? null };
      }),
      myAssignment: { id: String(asgn.id), isConfirmed: asgn.is_confirmed ?? false, confirmedAt: asgn.confirmed_at ?? null },
    };
  }).filter(Boolean) as MyBusInfo[];
});

export const getMyLedBusesWithPassengers = cache(async (): Promise<LedBus[]> => {
  const bgs = await createClientForSchema("bgs_attendance");

  const { data: buses, error } = await bgs.rpc("get_my_led_buses");
  if (error || !buses || !(buses as any[]).length) return [];

  const busIds = (buses as any[]).map((b: any) => b.bus_id).filter(Boolean);

  // Манай автобусуудын зорчигчид + ахлахын жагсаалт зэрэг
  const [assignmentsRes, leadersRes, transferredOutRes] = await Promise.all([
    bgs
      .from("passenger_assignments")
      .select("id, bus_id, original_bus_id, bteg_id, internal_user_id, autobus_direction_id, is_confirmed, confirmed_at")
      .in("bus_id", busIds),
    bgs
      .from("trip_leaders")
      .select("bus_id, bteg_id, name, phone")
      .in("bus_id", busIds)
      .eq("is_active", true),
    // Манай автобусаас гарсан зорчигчид (original_bus_id манайх, bus_id өөр — өөр ахлахын автобус руу шилжсэн ч орно)
    // bus_id = null (хасагдсан) тохиолдлыг оруулахгүй — тэр нь шилжилт биш
    bgs
      .from("passenger_assignments")
      .select("id, bus_id, original_bus_id, bteg_id, internal_user_id, autobus_direction_id, is_confirmed, confirmed_at")
      .in("original_bus_id", busIds)
      .not("bus_id", "is", null),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const leaders = leadersRes.data ?? [];
  const transferredOutAll = transferredOutRes.data ?? [];

  type UserInfo = {
    btegId: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    departmentName: string | null;
    positionName: string | null;
  };

  const allAssignments = [...assignments, ...transferredOutAll];
  const userIds = [...new Set(allAssignments.map((a: any) => a.internal_user_id).filter(Boolean))];

  const assignedBtegIds = new Set(assignments.map((a: any) => String(a.bteg_id ?? "")).filter(Boolean));
  const leaderOnlyBtegIds = leaders
    .map((l: any) => String(l.bteg_id ?? ""))
    .filter((id: string) => id && !assignedBtegIds.has(id));

  // Автобусны нэр хэрэгтэй гадны bus_id-ууд (шилжилтийн "хаанаас/хаашаа" гэдгийг харуулна)
  const knownBusIdSet = new Set(busIds.map(String));
  const extraBusIds = [...new Set([
    ...assignments.map((a: any) => a.original_bus_id).filter(Boolean).map(String),
    ...transferredOutAll.map((a: any) => a.bus_id).filter(Boolean).map(String),
  ])].filter((id) => !knownBusIdSet.has(id));

  const pub = await createClient();
  const userSelect = "id, bteg_id, first_name, last_name, phone, department_name, position_name";

  const [userRes, leaderUserRes, extraBusRes] = await Promise.all([
    userIds.length
      ? pub.from("users").select(userSelect).in("id", userIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    leaderOnlyBtegIds.length
      ? pub.from("users").select(userSelect).in("bteg_id", leaderOnlyBtegIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    extraBusIds.length
      ? bgs.from("buses").select("id, name").in("id", extraBusIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  const userMap: Record<string, UserInfo> = {};
  for (const u of userRes.data ?? []) {
    userMap[u.id] = {
      btegId: String((u as any).bteg_id ?? ""),
      firstName: (u as any).first_name ?? null,
      lastName: (u as any).last_name ?? null,
      phone: (u as any).phone ?? null,
      departmentName: (u as any).department_name ?? null,
      positionName: (u as any).position_name ?? null,
    };
  }
  const leaderUserMap: Record<string, UserInfo & { userId: string }> = {};
  for (const u of leaderUserRes.data ?? []) {
    const bid = String((u as any).bteg_id ?? "");
    leaderUserMap[bid] = {
      userId: u.id, btegId: bid,
      firstName: (u as any).first_name ?? null,
      lastName: (u as any).last_name ?? null,
      phone: (u as any).phone ?? null,
      departmentName: (u as any).department_name ?? null,
      positionName: (u as any).position_name ?? null,
    };
  }

  // Автобусны нэр (манай + гадны)
  const busNameMap: Record<string, string> = {};
  for (const b of buses as any[]) {
    busNameMap[String(b.bus_id)] = b.bus_name ?? "—";
  }
  for (const b of extraBusRes.data ?? []) {
    busNameMap[String(b.id)] = (b as any).name ?? "—";
  }

  return (buses as any[]).map((b: any) => {
    const busIdNum: number = b.bus_id;
    const busIdStr = String(busIdNum);

    const busLeaders = leaders.filter((l: any) => Number(l.bus_id) === busIdNum);
    const leaderBtegIds = new Set(busLeaders.map((l: any) => String(l.bteg_id ?? "")).filter(Boolean));
    const busAssignments = assignments.filter((a: any) => Number(a.bus_id) === busIdNum);

    function mapPassenger(a: any, fromBusName: string | null = null, toBusName: string | null = null): PassengerItem {
      const u = userMap[a.internal_user_id] ?? null;
      const btegId = u?.btegId ?? String(a.bteg_id ?? "");
      const isLeader = leaderBtegIds.has(btegId);
      return {
        assignmentId: String(a.id),
        userId: a.internal_user_id ?? "",
        btegId,
        firstName: u?.firstName ?? null,
        lastName: u?.lastName ?? null,
        phone: u?.phone ?? null,
        departmentName: u?.departmentName ?? null,
        positionName: u?.positionName ?? null,
        stopName: a.autobus_direction_id ?? null,
        isConfirmed: isLeader ? true : (a.is_confirmed ?? false),
        confirmedAt: isLeader ? (a.confirmed_at ?? new Date().toISOString()) : (a.confirmed_at ?? null),
        fromBusName,
        toBusName,
      };
    }

    // original_bus_id = NULL → жирийн зорчигч
    const regularAssignments = busAssignments.filter(
      (a: any) => !a.original_bus_id,
    );
    // original_bus_id = bus_id → ахлахаар шууд нэмэгдсэн ("Ээлжийн бус")
    const directlyAddedAssignments = busAssignments.filter(
      (a: any) => a.original_bus_id && String(a.original_bus_id) === busIdStr,
    );
    // original_bus_id ≠ bus_id → өөр автобусаас шилжин ирсэн
    const transferredInAssignments = busAssignments.filter(
      (a: any) => a.original_bus_id && String(a.original_bus_id) !== busIdStr,
    );
    // Энэ автобусаас гарсан зорчигчид (original = манайх, current ≠ манайх)
    const transferredOutForBus = transferredOutAll.filter(
      (a: any) => String(a.original_bus_id) === busIdStr && String(a.bus_id) !== busIdStr,
    );

    const passengers = regularAssignments.map((a: any) => mapPassenger(a));
    const transferredIn = [
      ...directlyAddedAssignments.map((a: any) => mapPassenger(a, "Ээлжийн бус")),
      ...transferredInAssignments.map((a: any) =>
        mapPassenger(a, busNameMap[String(a.original_bus_id)] ?? null),
      ),
    ];
    const transferredOut = transferredOutForBus.map((a: any) =>
      mapPassenger(a, null, busNameMap[String(a.bus_id)] ?? null),
    );

    // passenger_assignments-д байхгүй ахлахуудыг жагсаалтын эхэнд нэмнэ
    const busAssignmentBtegIds = new Set(
      busAssignments.map((a: any) => {
        const u = userMap[a.internal_user_id];
        return u?.btegId ?? String(a.bteg_id ?? "");
      }).filter(Boolean),
    );
    for (const leader of busLeaders) {
      const bid = String(leader.bteg_id ?? "");
      if (!bid || busAssignmentBtegIds.has(bid)) continue;
      const u = leaderUserMap[bid];
      passengers.unshift({
        assignmentId: `leader-${busIdNum}-${bid}`,
        userId: u?.userId ?? "",
        btegId: bid,
        firstName: u?.firstName ?? null,
        lastName: u?.lastName ?? (leader.name as string | null),
        phone: u?.phone ?? (leader.phone as string | null),
        departmentName: u?.departmentName ?? null,
        positionName: u?.positionName ?? null,
        stopName: null,
        isConfirmed: true,
        confirmedAt: new Date().toISOString(),
        fromBusName: null,
        toBusName: null,
      });
    }

    return {
      id: busIdStr,
      name: b.bus_name ?? "Автобус",
      departureTime: b.departure_time ?? "",
      capacity: b.capacity ?? 0,
      passengers,
      transferredIn,
      transferredOut,
    };
  });
});

// Бүртгэлгүй зорчигчийг энэ автобусанд шилжүүлэн нэмэх.
// Зорчигчийн одоогийн assignment-г bteg_id-аар хайж, transfer_passenger RPC дуудна.
export async function addPassengerToBus(
  btegId: string,
  busId: string,
): Promise<{ status: "transferred" | "error"; name?: string; message?: string }> {
  // public.users-с bteg_id → internal user id + нэр авна
  const pub = await createClient();
  const { data: u, error: userErr } = await pub
    .from("users")
    .select("id, first_name, last_name")
    .eq("bteg_id", btegId)
    .maybeSingle();

  if (userErr) return { status: "error", message: userErr.message };
  if (!u) return { status: "error", message: "Хэрэглэгч олдсонгүй" };

  const bgs = await createClientForSchema("bgs_attendance");

  // Зорчигчийн shift_exchange-г target bus-аар олно
  const { data: targetBus, error: busErr } = await bgs
    .from("buses")
    .select("shift_exchange_id")
    .eq("id", busId)
    .maybeSingle();

  if (busErr || !targetBus) return { status: "error", message: "Автобус олдсонгүй" };

  // Ижил ээлж солилцооны assignment-г хайна (олон ээлжийн давхардлаас зайлсхийнэ)
  const { data: asgn, error: findErr } = await bgs
    .from("passenger_assignments")
    .select("id, bus_id")
    .eq("internal_user_id", u.id)
    .eq("shift_exchange_id", targetBus.shift_exchange_id)
    .maybeSingle();

  if (findErr) return { status: "error", message: findErr.message };

  if (!asgn) {
    // Ямар ч автобусанд бүртгэлгүй — шууд нэмнэ. original_bus_id = bus_id
    // нь "Ээлжийн бус" (direct add) тэмдэглэгээ болно.
    const { error: insertErr } = await bgs
      .from("passenger_assignments")
      .insert({
        internal_user_id: u.id,
        bteg_id: String(btegId),
        bus_id: Number(busId),
        original_bus_id: Number(busId),
        shift_exchange_id: targetBus.shift_exchange_id,
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
      });
    if (insertErr) return { status: "error", message: insertErr.message };
    revalidatePath("/");
    const directName = [(u as any).last_name, (u as any).first_name].filter(Boolean).join(" ") || "—";
    return { status: "transferred", name: directName };
  }

  if (String(asgn.bus_id) === String(busId)) {
    return { status: "error", message: "Аль хэдийн энэ автобусанд бүртгэлтэй" };
  }

  const { error: transferErr } = await bgs.rpc("transfer_passenger", {
    p_assignment_id: Number(asgn.id),
    p_target_bus_id: Number(busId),
  });

  if (transferErr) return { status: "error", message: transferErr.message };

  // Шилжилтийг аялалын ахлах зөвшөөрсөн тул автоматаар бүртгэгдсэн болгоно
  await bgs.rpc("confirm_passenger", {
    p_bteg_id: Number(btegId),
    p_bus_id: Number(busId),
  });

  revalidatePath("/");
  const name = [(u as any).last_name, (u as any).first_name].filter(Boolean).join(" ") || "—";
  return { status: "transferred", name };
}

// bteg_id-аар зорчигчийн мэдээлэл авах (TransferDialog-д харуулах).
export async function getPassengerInfoByBtegId(btegId: string, targetBusId?: string): Promise<{
  name: string | null;
  departmentName: string | null;
  positionName: string | null;
  currentBusName: string | null;
} | null> {
  const pub = await createClient();
  const bgs = await createClientForSchema("bgs_attendance");

  const userRes = await pub
    .from("users")
    .select("id, first_name, last_name, department_name, position_name")
    .eq("bteg_id", btegId)
    .maybeSingle();

  if (!userRes.data) return null;
  const u = userRes.data;

  let shiftExchangeId: number | null = null;
  if (targetBusId) {
    const { data: bus } = await bgs.from("buses").select("shift_exchange_id").eq("id", targetBusId).maybeSingle();
    shiftExchangeId = bus?.shift_exchange_id ?? null;
  }

  let currentBusName: string | null = null;
  if (shiftExchangeId) {
    const { data: asgn } = await bgs
      .from("passenger_assignments")
      .select("bus_id")
      .eq("internal_user_id", (u as any).id)
      .eq("shift_exchange_id", shiftExchangeId)
      .maybeSingle();

    if (asgn?.bus_id) {
      const { data: bus } = await bgs.from("buses").select("name").eq("id", asgn.bus_id).maybeSingle();
      currentBusName = (bus as any)?.name ?? null;
    }
  }

  return {
    name: [(u as any).last_name, (u as any).first_name].filter(Boolean).join(" ") || null,
    departmentName: (u as any).department_name ?? null,
    positionName: (u as any).position_name ?? null,
    currentBusName,
  };
}

// Шууд нэмэгдсэн зорчигчийг ("Ээлжийн бус") жагсаалтаас бүрмөсөн хасах.
export async function removeDirectPassenger(
  assignmentId: string,
): Promise<{ status: "removed" | "error"; message?: string }> {
  const bgs = await createClientForSchema("bgs_attendance");
  const { error } = await bgs
    .from("passenger_assignments")
    .delete()
    .eq("id", Number(assignmentId));
  if (error) return { status: "error", message: error.message };
  revalidatePath("/");
  return { status: "removed" };
}

// Шилжилтийг буцаах — зорчигчийг анхны автобус руу нь буцаана.
// reverse_transfer(p_assignment_id bigint) SECURITY DEFINER RPC.
export async function reverseTransfer(
  assignmentId: string,
): Promise<{ status: "reversed" | "not_found" | "not_a_transfer" | "error"; message?: string }> {
  const bgs = await createClientForSchema("bgs_attendance");
  const { data, error } = await bgs.rpc("reverse_transfer", {
    p_assignment_id: Number(assignmentId),
  });
  if (error) return { status: "error", message: error.message };
  const res = data as { status: string };
  if (res.status === "reversed") {
    revalidatePath("/");
    return { status: "reversed" };
  }
  if (res.status === "not_found") return { status: "not_found" };
  if (res.status === "not_a_transfer") return { status: "not_a_transfer" };
  return { status: "error" };
}

// Баталгаажсан зорчигчийн бүртгэлийг цуцлах.
// unconfirm_passenger(p_bteg_id bigint, p_bus_id bigint) SECURITY DEFINER RPC.
export async function unconfirmPassenger(
  btegId: string,
  busId: string,
): Promise<{ status: "unconfirmed" | "not_found" | "forbidden" | "error"; message?: string }> {
  const bgs = await createClientForSchema("bgs_attendance");
  const { data, error } = await bgs.rpc("unconfirm_passenger", {
    p_bteg_id: Number(btegId),
    p_bus_id: Number(busId),
  });
  if (error) return { status: "error", message: error.message };
  const res = data as { status: string; message?: string };
  if (res.status === "unconfirmed") return { status: "unconfirmed" };
  if (res.status === "not_found") return { status: "not_found" };
  if (res.status === "forbidden") return { status: "forbidden" };
  return { status: "error", message: res.message ?? "Алдаа гарлаа" };
}

// QR-аас авсан bteg_id болон bus_id-аар зорчигч баталгаажуулах.
// confirm_passenger(p_bteg_id, p_bus_id, p_device_info?) SECURITY DEFINER RPC.
// { status: 'confirmed'|'already'|'not_found'|'forbidden'|'error', passenger_name?, ... }
export async function confirmPassenger(
  btegId: string,
  busId: string,
  stopName: string | null = null,
): Promise<ConfirmResult> {
  const bgs = await createClientForSchema("bgs_attendance");

  const { data, error } = await bgs.rpc("confirm_passenger", {
    p_bteg_id: Number(btegId),
    p_bus_id: Number(busId),
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const res = data as { status: string; passenger_name?: string; message?: string };

  if (res.status === "confirmed") {
    return { status: "confirmed", name: res.passenger_name ?? "—", stopName };
  }
  if (res.status === "already") {
    const pub = await createClient();
    const { data: u } = await pub
      .from("users")
      .select("department_name, position_name")
      .eq("bteg_id", btegId)
      .maybeSingle();
    return {
      status: "already",
      name: res.passenger_name ?? "—",
      departmentName: (u as any)?.department_name ?? null,
      positionName: (u as any)?.position_name ?? null,
    };
  }
  if (res.status === "not_found") {
    return { status: "not_found" };
  }
  if (res.status === "forbidden") {
    return { status: "forbidden" };
  }
  return { status: "error", message: res.message ?? "Алдаа гарлаа" };
}
