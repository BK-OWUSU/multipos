"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function TenantRootPortal() {
  const { user, currentSlug, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    const assignedShop = user.currentShop;

    // 🟢 CASE 1: USER IS AN EMPLOYEE ASSIGNED TO A SPECIFIC SHOP
    if (assignedShop && assignedShop.shopSlug) {
      router.replace(`/${currentSlug}/${assignedShop.shopSlug}/dashboard`);
      return;
    }

    // 🟢 CASE 2: USER IS A BUSINESS OWNER / SUPER-ADMIN (shop is null)
    // Since they don't belong to a shop, they manage global assets.
    // We send them straight to the Shops Management Dashboard.
    router.replace(`/${currentSlug}/shops`);

  }, [user, currentSlug, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-900"></div>
        <p className="animate-pulse text-sm text-muted-foreground italic">
          Configuring workspace authorizations...
        </p>
      </div>
    </div>
  );
}