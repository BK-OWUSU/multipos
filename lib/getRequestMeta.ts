import { headers } from "next/headers";

export interface RequestMeta {
  ipAddress: string;
  userAgent: string;
}

export async function getRequestMeta(): Promise<RequestMeta> {
  const headersList = await headers();

  // 1. Fallback chain for different hosting providers (Vercel, Cloudflare, etc.)
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || // Standard proxy chain
    headersList.get("x-real-ip") ||                             // Nginx / AWS proxies
    headersList.get("cf-connecting-ip") ||                      // Cloudflare
    "127.0.0.1";                                                // Local fallback

  // 2. Fetch the User-Agent header
  const userAgent = headersList.get("user-agent") || "Unknown User Agent";

  return {
    ipAddress: ip,
    userAgent,
  };
}
