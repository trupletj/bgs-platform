"use client";

import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";
import type { ConfirmResult } from "@/types/shift-exchange";

export function ConfirmResultCard({ result }: { result: ConfirmResult }) {
  if (result.status === "confirmed") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-emerald-800">
            Амжилттай бүртгэлээ
          </p>
          <p className="text-xs text-emerald-700">
            {result.name}
            {result.stopName ? ` · ${result.stopName}` : ""}
          </p>
        </div>
      </div>
    );
  }

  if (result.status === "already") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-indigo-50 px-4 py-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-indigo-800">
            Өмнө нь бүртгэгдсэн
          </p>
          <p className="text-xs text-indigo-700">{result.name}</p>
        </div>
      </div>
    );
  }

  if (result.status === "forbidden") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-amber-800">
            Эрх хүрэхгүй байна
          </p>
          <p className="text-xs text-amber-700">
            Та энэ автобусны ахлах биш байна.
          </p>
        </div>
      </div>
    );
  }

  if (result.status === "not_found") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-amber-800">
            Энэ автобусанд бүртгэлтэй биш
          </p>
          <p className="text-xs text-amber-700">
            Зорчигч өөр автобус эсвэл бүртгэлгүй байж болно.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3">
      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-red-800">Алдаа гарлаа</p>
        <p className="text-xs text-red-700">{result.message}</p>
      </div>
    </div>
  );
}
