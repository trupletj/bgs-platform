import type { NextConfig } from "next";

const parentOrigins = (process.env.NEXT_PUBLIC_PARENT_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const frameAncestors = ["'self'", ...parentOrigins].join(" ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ljlywyhpxsutvrdeyyla.supabase.co",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // CSP frame-ancestors нь parent домэйнүүдийг iframe-аар embed
            // хийхэд зөвшөөрнө. X-Frame-Options тавихгүй — CSP давамгайлна.
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors};`,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
