"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { confirmPassenger, getPassengerInfoByBtegId } from "@/actions/shift-exchange";
import { ConfirmResultCard } from "./confirm-result-card";
import type { ConfirmResult, PassengerItem } from "@/types/shift-exchange";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
  }
}

interface QRPayload {
  bteg_id?: number | string;
  id_card_number?: string;
}

interface Props {
  busId: string;
  passengers: PassengerItem[];
  onConfirmed?: (btegId: string, name: string) => void;
  onAlready?: (info: { name: string; departmentName: string | null; positionName: string | null }) => void;
  onNotFound?: (btegId: string, info: { name: string | null; departmentName: string | null; positionName: string | null; currentBusName: string | null } | null) => void;
}

const SCANNER_DIV_ID = "bgs-qr-reader";

export function QRScanner({ busId, passengers: _passengers, onConfirmed, onAlready, onNotFound }: Props) {
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [pending, setPending] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const busyRef = useRef(false);
  const [isInWebView, setIsInWebView] = useState(false);

  // handleScan-г ref-ээр хадгалж stale closure-с зайлсхийнэ
  const handleScanRef = useRef<(raw: string) => Promise<void>>(null!);

  useEffect(() => {
    setIsInWebView(!!window.ReactNativeWebView);
  }, []);

  // Native QR scan result listener
  useEffect(() => {
    if (!isInWebView) return;
    function listener(e: MessageEvent) {
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (msg?.type === "bgs:qr-scan-result") {
          void handleScanRef.current(msg.data as string);
        }
      } catch {}
    }
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [isInWebView]);

  async function handleScan(raw: string) {
    let payload: QRPayload = {};
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { bteg_id: raw };
    }

    const scannedBtegId = String(payload.bteg_id ?? "").trim();
    if (!scannedBtegId) {
      setResult({ status: "not_found" });
      return;
    }

    setPending(true);
    const res = await confirmPassenger(scannedBtegId, busId);
    setPending(false);

    if (res.status === "confirmed") {
      onConfirmed?.(scannedBtegId, res.name);
      setResult(null);
    } else if (res.status === "already") {
      onAlready?.({ name: res.name, departmentName: res.departmentName, positionName: res.positionName });
      setResult(null);
    } else if (res.status === "not_found") {
      const info = await getPassengerInfoByBtegId(scannedBtegId, busId);
      onNotFound?.(scannedBtegId, info);
      setResult(null);
    } else {
      setResult(res);
    }
  }
  handleScanRef.current = handleScan;

  // html5-qrcode — browser mode only
  async function startScanner() {
    setStatus("starting");
    setResult(null);
    setErrorMsg(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(SCANNER_DIV_ID);
      scannerRef.current = scanner as unknown as { stop: () => Promise<void> };
      await scanner.start(
        { facingMode: "environment" },
        // 192 = h-48/w-48 (манай саарал rounded frame-ийн CSS хэмжээ) — html5-qrcode-ийн
        // "харагдах" (unshaded) хэсгийг тэр frame-тэй давхцуулна.
        { fps: 10, qrbox: { width: 192, height: 192 } },
        async (decoded: string) => {
          if (busyRef.current) return;
          busyRef.current = true;
          await handleScan(decoded);
          setTimeout(() => { busyRef.current = false; }, 3000);
        },
        () => {},
      );
      setStatus("scanning");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Камер нээж чадсангүй";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  function stopScanner() {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setStatus("idle");
    setResult(null);
    busyRef.current = false;
  }

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  // WebView (native) mode
  if (isInWebView) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30">
          <Camera className="h-10 w-10 text-muted-foreground/40" />
        </div>

        {pending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Бүртгэж байна...
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              window.ReactNativeWebView?.postMessage(
                JSON.stringify({ type: "bgs:qr-scan-request" }),
              )
            }
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Camera className="h-4 w-4" />
            QR Уншуулах
          </button>
        )}

        {result && !pending && <ConfirmResultCard result={result} />}
      </div>
    );
  }

  // Browser mode
  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-square w-full max-w-xs mx-auto">
        <div id={SCANNER_DIV_ID} className="w-full h-full" />
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
            <Camera className="h-10 w-10" />
            <p className="text-sm">Камер асаагүй байна</p>
          </div>
        )}
        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-white/70">
            <CameraOff className="h-8 w-8" />
            <p className="text-xs">{errorMsg}</p>
          </div>
        )}
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* box-shadow spotlight — html5-qrcode-ийн own shading-с (globals.css-д нуусан)
                бүрэн хамааралгүйгээр, яг энэ frame-тэй тохирсон харлуулалт үүсгэнэ. */}
            <div
              className="h-48 w-48 rounded-lg border-2 border-white/60"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
            />
          </div>
        )}
      </div>

      {status === "idle" || status === "error" ? (
        <button
          type="button"
          onClick={startScanner}
          className="mx-auto flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Camera className="h-4 w-4" />
          Камер асаах
        </button>
      ) : (
        <button
          type="button"
          onClick={stopScanner}
          className="mx-auto flex items-center gap-2 rounded-full bg-muted px-6 py-2.5 text-sm font-semibold text-foreground"
        >
          Камер унтраах
        </button>
      )}

      {pending && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Бүртгэж байна...
        </div>
      )}

      {result && !pending && <ConfirmResultCard result={result} />}
    </div>
  );
}
