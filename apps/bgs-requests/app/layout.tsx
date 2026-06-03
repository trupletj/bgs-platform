import type { Metadata } from "next";
import "./globals.css";
import { SessionBridge } from "@/components/bridge/session-bridge";
import { IframeResizer } from "@/components/bridge/iframe-resizer";

export const metadata: Metadata = {
  title: "Хүсэлтүүд — BGS",
  description: "BGS компанийн ажилтны төрөл бүрийн хүсэлтийн mini-app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <SessionBridge />
        <IframeResizer>{children}</IframeResizer>
      </body>
    </html>
  );
}
