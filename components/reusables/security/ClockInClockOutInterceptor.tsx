"use client"

import React, { useEffect } from "react"
import { Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTimeCardStore } from "@/store/timeCardStore"
import { useAuthStore } from "@/store/useAuthStore"

export default function ClockInClockOutInterceptor({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const businessSlug = user?.business?.slug;
  const shopSlug = user?.currentShop?.shopSlug;
  const clockInPath = `/${businessSlug}/shops/${shopSlug}/time-card`;

  // Pull actions and states explicitly from store hooks
  const loading = useTimeCardStore((state) => state.loading);
  const fetchTimeCards = useTimeCardStore((state) => state.fetchTimeCards);
  const isUserClockedIn = useTimeCardStore((state) => state.isUserClockedIn);

  const isClockedIn = isUserClockedIn();

  useEffect(() => {
    fetchTimeCards({});
  }, [fetchTimeCards]);

  // Loading indicator layout fallback view
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Verifying shift authentication status...</p>
      </div>
    );
  }

  // Intercept access and prompt clock-in view layout
  if (!isClockedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 bg-amber-50 rounded-full text-amber-600">
          <Lock size={40} className="animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Terminal Interface Locked</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          You must log a <strong className="text-red-400 font-bold">Clock In</strong> shift entry on your employee attendance profile before you can open a cash register session or access the point-of-sale grid.
        </p>
        <div className="pt-2">
          <Link href={clockInPath}>
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
              Go to Attendance Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 🟢 Fix 2: Wrap inside a true JSX React Fragment wrapper element block 
  return <>{children}</>;
}