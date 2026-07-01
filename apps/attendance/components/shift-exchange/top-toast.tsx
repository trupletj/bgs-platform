"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function TopToast({ message, visible, onHide }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const t = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 300);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 shadow-lg">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
        <p className="text-sm font-semibold text-white">{message}</p>
      </div>
    </div>
  );
}
