"use client";

import { Bus, Clock, Crown, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MyBusInfo } from "@/types/shift-exchange";

function formatDeparture(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getMonth() + 1} сарын ${d.getDate()}`,
    time: `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
  };
}

function cleanShiftName(name: string): string {
  const cleaned = name.replace(/^\d{4}\.\d{2}\.\d{2}-нд\s+/, "").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function BusInfoCard({ data }: { data: MyBusInfo }) {
  const { bus, shiftName, leader, myAssignment } = data;
  const departure = formatDeparture(bus.departureTime);
  const confirmed = myAssignment.isConfirmed;
  const isDeparting = bus.direction === "departing";
  const directionLabel = isDeparting ? "Буух" : "Ирэх";

  return (
    <Card className="gap-5 px-5 py-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <img src="/bus-icon.png" alt="bus" className="h-7 w-7 object-contain mix-blend-multiply" />
          </span>
          <p className="text-lg font-bold text-foreground leading-tight">{bus.name}</p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
            confirmed
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              confirmed ? "bg-emerald-500" : "bg-amber-400",
            )}
          />
          {confirmed ? "Бүртгэгдсэн" : "Хүлээгдэж байна"}
        </span>
      </div>

      {/* Info tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        <InfoTile
          iconBg="bg-blue-50"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          label="Хөдлөх цаг"
          value={
            <>
              <span className="text-[11px] font-normal text-muted-foreground">{departure.date}</span>
              <span className="block text-sm font-bold text-foreground">{departure.time}</span>
            </>
          }
        />
        <InfoTile
          iconBg="bg-rose-50"
          icon={<MapPin className="h-5 w-5 text-rose-500" />}
          label="Чиглэл"
          value={directionLabel}
        />
        {shiftName && (
          <InfoTile
            iconBg="bg-amber-50"
            icon={<Bus className="h-5 w-5 text-amber-500" />}
            label="Ээлж"
            value={cleanShiftName(shiftName)}
          />
        )}
      </div>

      {/* Trip leader */}
      {leader && (
        <div className="flex items-center gap-4 rounded-2xl bg-amber-50/60 px-4 py-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Crown className="h-6 w-6 text-amber-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
              Аялалын ахлах
            </p>
            <p className="text-base font-bold text-foreground">{leader.name}</p>
          </div>
          {leader.phone && (
            <a
              href={`tel:${leader.phone}`}
              aria-label={`${leader.phone} дугаарт залгах`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 active:bg-emerald-100"
            >
              <Phone className="h-5 w-5 text-emerald-500" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

function InfoTile({
  iconBg,
  icon,
  label,
  value,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border/50 bg-background p-3.5 shadow-sm">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconBg)}>
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground leading-tight">{value}</span>
      </div>
    </div>
  );
}
