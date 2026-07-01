"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { MyBusInfo } from "@/types/shift-exchange";
import { BusInfoCard } from "./bus-info-card";

export function PassengerView({ data }: { data: MyBusInfo[] }) {
  const router = useRouter();
  const [infos, setInfos] = useState(data);
  const infosRef = useRef(data);

  // Server дата шинэчлэгдэхэд state болон ref хоёуланг синк хийнэ
  useEffect(() => {
    setInfos(data);
    infosRef.current = data;
  }, [data]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("passenger-assignments-rt")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "bgs_attendance",
          table: "passenger_assignments",
        },
        (payload: any) => {
          const updated = payload.new;
          const idStr = String(updated.id);

          const currentInfos = infosRef.current;
          if (!currentInfos.some((i) => i.myAssignment.id === idStr)) return;

          // bus_id өөрчлөгдсөн → шилжилт хийгдсэн, серверээс дахин татна
          const currentInfo = currentInfos.find((i) => i.myAssignment.id === idStr);
          if (currentInfo && String(updated.bus_id) !== currentInfo.bus.id) {
            router.refresh();
            return;
          }

          // Зөвхөн баталгаажилт өөрчлөгдсөн → state дотор шинэчилнэ
          const next = infosRef.current.map((info) =>
            info.myAssignment.id === idStr
              ? {
                  ...info,
                  myAssignment: {
                    ...info.myAssignment,
                    isConfirmed: updated.is_confirmed ?? false,
                    confirmedAt: updated.confirmed_at ?? null,
                  },
                }
              : info,
          );
          infosRef.current = next;
          setInfos(next);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {infos.map((info) => (
        <BusInfoCard key={info.myAssignment.id} data={info} />
      ))}
    </div>
  );
}
