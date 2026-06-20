"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

// Session байхгүй үед харуулах хүлээлтийн дэлгэц.
// Эхэндээ spinner — SessionBridge parent-аас токен авч setSession() → router.refresh()
// хийхэд RSC дахин render хийж энэ component-ийг бодит контентоор солино (унтрана).
// Хэрэв тогтоосон хугацаанд токен ирэхгүй бол "нэвтрэх шаардлагатай" мессеж гаргана.
const TIMEOUT_MS = 8000;

export function SessionPending() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      {timedOut ? (
        <>
          <AlertCircle className="h-8 w-8 text-rose-500" strokeWidth={2} />
          <p className="text-sm font-medium text-foreground">
            Нэвтрэх шаардлагатай
          </p>
          <p className="text-xs text-muted-foreground">
            Холболт тогтоож чадсангүй. Аппликэйшнээс дахин нээнэ үү.
          </p>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={2} />
          <p className="text-sm text-muted-foreground">Холбогдож байна…</p>
        </>
      )}
    </div>
  );
}
