"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, QrCode, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { addPassengerToBus, removeDirectPassenger } from "@/actions/shift-exchange";
import { PassengerList } from "./passenger-list";
import { QRScanner } from "./qr-scanner";
import { TopToast } from "./top-toast";
import { TransferDialog } from "./transfer-dialog";
import type { LedBus } from "@/types/shift-exchange";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1} сарын ${d.getDate()}`;
}

function formatTimeOnly(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// QR Уншуулах эхэнд харагдана
const TABS = [
  { key: "qr", label: "QR Уншуулах", icon: QrCode },
  { key: "list", label: "Жагсаалт", icon: Users },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function LeaderView({ buses }: { buses: LedBus[] }) {
  const router = useRouter();
  const [selectedBusId, setSelectedBusId] = useState<string>(buses[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<TabKey>("qr");
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  // Toast
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });
  const hideToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  // Already confirmed dialog
  const [alreadyInfo, setAlreadyInfo] = useState<{ name: string; departmentName: string | null; positionName: string | null } | null>(null);

  // Transfer dialog
  const [transferDialog, setTransferDialog] = useState<{
    open: boolean;
    btegId: string;
    passengerName: string | null;
    departmentName: string | null;
    positionName: string | null;
    currentBusName: string | null;
    pending: boolean;
  }>({ open: false, btegId: "", passengerName: null, departmentName: null, positionName: null, currentBusName: null, pending: false });


  useEffect(() => {
    const supabase = createClient();
    const busIdSet = new Set(buses.map((b) => b.id));

    const passengerMap = new Map<string, { isConfirmed: boolean; isTransferredOut: boolean }>();
    for (const bus of buses) {
      for (const p of [...bus.passengers, ...bus.transferredIn]) {
        if (!p.assignmentId.startsWith("leader-")) {
          passengerMap.set(p.assignmentId, { isConfirmed: p.isConfirmed, isTransferredOut: false });
        }
      }
      for (const p of bus.transferredOut) {
        if (!p.assignmentId.startsWith("leader-")) {
          passengerMap.set(p.assignmentId, { isConfirmed: p.isConfirmed, isTransferredOut: true });
        }
      }
    }

    const channel = supabase
      .channel("leader-assignments-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "bgs_attendance", table: "passenger_assignments" },
        (payload: any) => {
          const updated = payload.new;
          const idStr = String(updated.id);
          const entry = passengerMap.get(idStr);
          const newBusId = String(updated.bus_id);

          // Манай жагсаалтад байгаагүй зорчигч орж ирсэн → refresh
          if (!entry) {
            if (busIdSet.has(newBusId)) router.refresh();
            return;
          }

          if (entry.isTransferredOut) {
            // Гарсан зорчигч манай автобусанд буцаж ирвэл refresh
            if (busIdSet.has(newBusId)) router.refresh();
            return;
          }

          // Зорчигч манай автобусаас явсан бол refresh
          if (!busIdSet.has(newBusId)) {
            router.refresh();
            return;
          }

          if (updated.is_confirmed !== entry.isConfirmed) {
            if (updated.is_confirmed) {
              setConfirmedIds((prev) => new Set([...prev, idStr]));
            } else {
              setConfirmedIds((prev) => {
                const s = new Set(prev);
                s.delete(idStr);
                return s;
              });
            }
            passengerMap.set(idStr, { ...entry, isConfirmed: updated.is_confirmed });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buses]);

  const selectedBus = buses.find((b) => b.id === selectedBusId) ?? buses[0];

  function showToast(message: string) {
    setToast({ visible: true, message });
  }

  function handleConfirmed(assignmentId: string, name: string) {
    setConfirmedIds((prev) => new Set([...prev, assignmentId]));
    showToast(`${name} амжилттай бүртгэгдлээ`);
  }

  function handleUnconfirmed(assignmentId: string) {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      next.delete(assignmentId);
      return next;
    });
    router.refresh();
  }

  function handleQRConfirmed(btegId: string, name: string) {
    const matched = selectedBus?.passengers.find((p) => p.btegId === btegId);
    if (matched) setConfirmedIds((prev) => new Set([...prev, matched.assignmentId]));
    showToast(`${name} амжилттай бүртгэгдлээ`);
  }

  function handleNotFound(btegId: string, info: { name: string | null; departmentName: string | null; positionName: string | null; currentBusName: string | null } | null) {
    setTransferDialog({ open: true, btegId, passengerName: info?.name ?? null, departmentName: info?.departmentName ?? null, positionName: info?.positionName ?? null, currentBusName: info?.currentBusName ?? null, pending: false });
  }

  async function handleAddPassenger() {
    if (!selectedBus) return;
    setTransferDialog((d) => ({ ...d, pending: true }));
    const res = await addPassengerToBus(transferDialog.btegId, selectedBus.id);
    setTransferDialog({ open: false, btegId: "", passengerName: null, departmentName: null, positionName: null, currentBusName: null, pending: false });
    if (res.status === "transferred") {
      showToast(`${res.name ?? ""} амжилттай бүртгэгдлээ`);
      router.refresh();
    } else {
      showToast(res.message ?? "Алдаа гарлаа");
    }
  }

  if (!selectedBus) {
    return (
      <Card className="items-center gap-3 px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">Хариуцсан автобус олдсонгүй</p>
      </Card>
    );
  }

  const allOnBus = [...selectedBus.passengers, ...selectedBus.transferredIn];
  const confirmedCount = allOnBus.filter(
    (p) => p.isConfirmed || confirmedIds.has(p.assignmentId),
  ).length;

  return (
    <>
      <TopToast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {alreadyInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </span>
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-foreground">{alreadyInfo.name}</p>
                {alreadyInfo.departmentName && (
                  <p className="text-sm text-muted-foreground">{alreadyInfo.departmentName}</p>
                )}
                {alreadyInfo.positionName && (
                  <p className="text-sm text-muted-foreground">{alreadyInfo.positionName}</p>
                )}
                <p className="text-base font-semibold text-indigo-600 pt-1">Энэ автобусанд бүртгэгдсэн байна</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlreadyInfo(null)}
              className="mt-6 w-full rounded-xl bg-muted py-2.5 text-sm font-semibold text-foreground"
            >
              Хаах
            </button>
          </div>
        </div>
      )}

      {transferDialog.open && (
        <TransferDialog
          btegId={transferDialog.btegId}
          passengerName={transferDialog.passengerName}
          departmentName={transferDialog.departmentName}
          positionName={transferDialog.positionName}
          currentBusName={transferDialog.currentBusName}
          busName={selectedBus.name}
          pending={transferDialog.pending}
          onAdd={handleAddPassenger}
          onCancel={() => setTransferDialog({ open: false, btegId: "", passengerName: null, departmentName: null, positionName: null, currentBusName: null, pending: false })}
        />
      )}

      <div className="flex flex-col gap-4">
        {buses.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {buses.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBusId(b.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedBusId === b.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <img src="/bus-icon.png" alt="bus" className="h-3.5 w-3.5 object-contain mix-blend-multiply" />
                {b.name}
              </button>
            ))}
          </div>
        )}

        <Card className="gap-4 px-5 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <img src="/bus-icon.png" alt="bus" className="h-10 w-10 object-contain mix-blend-multiply" />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">{selectedBus.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedBus.departureTime)}{" · "}
                <span className="font-semibold text-foreground">{formatTimeOnly(selectedBus.departureTime)}</span>
              </p>
              <p className="text-xs text-muted-foreground">{selectedBus.capacity} суудал</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                key={selectedBusId}
                className="h-full rounded-full bg-emerald-500"
                style={{
                  "--progress-target": `${allOnBus.length > 0 ? Math.min(100, (confirmedCount / allOnBus.length) * 100) : 0}%`,
                  animation: "progress-fill 0.8s ease-out forwards",
                } as React.CSSProperties}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-emerald-500">
                {confirmedCount} / {selectedBus.passengers.length + selectedBus.transferredIn.length}
              </span>
              {" "}бүртгэгдсэн
            </p>
          </div>
        </Card>

        <div className="flex rounded-xl bg-muted p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
                activeTab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "qr" ? (
          <QRScanner
            busId={selectedBus.id}
            passengers={selectedBus.passengers}
            onConfirmed={handleQRConfirmed}
            onAlready={(info) => setAlreadyInfo(info)}
            onNotFound={handleNotFound}
          />
        ) : (
          <PassengerList
            busId={selectedBus.id}
            passengers={selectedBus.passengers}
            confirmedIds={confirmedIds}
            transferredIn={selectedBus.transferredIn}
            transferredOut={selectedBus.transferredOut}
            onConfirmed={handleConfirmed}
            onUnconfirmed={handleUnconfirmed}
          />
        )}
      </div>
    </>
  );
}
