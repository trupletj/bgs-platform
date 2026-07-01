import type { Metadata } from "next";
import "./globals.css";
import { SessionBridge } from "@/components/bridge/session-bridge";
import { IframeResizer } from "@/components/bridge/iframe-resizer";

export const metadata: Metadata = {
  title: "Ирц — BGS",
  description: "BGS компанийн ажилтны ирц харах mini-app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <SessionBridge />
        <IframeResizer>{children}</IframeResizer>
      </body>
    </html>
  );
}
