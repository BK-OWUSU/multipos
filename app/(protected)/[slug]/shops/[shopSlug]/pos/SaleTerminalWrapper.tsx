"use client";

import React from "react";
import SaleTerminalPage from "./SalesTerminalPage";
import { useSaleStore } from "@/store/saleStore";
import CashRegisterInterceptor from "@/components/reusables/security/CashRegisterInterceptor";

export default function SaleTerminalWrapper() {
  const { fetchActiveCashSession, activeSession, loading } = useSaleStore();

  // Trigger the shift check on initial mount
  React.useEffect(() => {
    fetchActiveCashSession();
  }, [fetchActiveCashSession]);

  // Prevent flashing interceptor UI while checking backend status
  if (loading && activeSession === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <span className="h-8 w-8 border-4 border-blue-950/30 border-t-blue-950 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Verifying cash register session state...
        </p>
      </div>
    );
  }

  // If loading is finished and there is still no session, force open/float input modal wrapper
  if (!activeSession) {
    return <CashRegisterInterceptor />;
  }

  // Otherwise, let them sell!
  return (
      <SaleTerminalPage />
  );
}