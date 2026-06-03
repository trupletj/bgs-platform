"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-base font-semibold text-foreground">
        Ирц ачаалахад алдаа гарлаа
      </p>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={() => reset()}>
        Дахин ачааллах
      </Button>
    </div>
  );
}
