"use client";

import { useEffect, useRef } from "react";
import { isEmbedded, postHeight } from "@/lib/bridge";

// iframe-д embed хийгдсэн үед parent-руу одоогийн height-ийг postMessage хийдэг.
// Parent дотор `bgs-attendance:height` event-ийг сонсож iframe-ийн height-ийг
// шинэчлээд auto-grow байдал үүсгэнэ.
export function IframeResizer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEmbedded()) return;
    const el = ref.current;
    if (!el) return;

    let lastHeight = 0;
    const measure = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h !== lastHeight) {
        lastHeight = h;
        postHeight(h);
      }
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const onWindowResize = () => measure();
    window.addEventListener("resize", onWindowResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
