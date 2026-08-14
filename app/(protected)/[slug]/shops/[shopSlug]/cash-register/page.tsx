"use client"

import ClockInClockOutInterceptor from "@/components/reusables/security/ClockInClockOutInterceptor";
import CashRegisterPage from "./CashRegisterPage"
import ShopSelectionPage from "../../shopPage";
import AppLoader from "@/components/loaders/app-loader";
import { useAuthStore } from "@/store/useAuthStore";

export default function CashRegisterWrapper() {

  const { user, loading } = useAuthStore();
  
    // 1. Show a clean loading state if the auth store is still fetching the user
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <AppLoader/>
        </div>
      );
    }

  // 2. Enforce shop selection guard check
  if (!user?.currentShop?.id) {
    console.log(user?.currentShop?.id)
    console.log(!user?.currentShop?.id)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 p-4 text-center">
        <ShopSelectionPage/>
      </div>
    );
  }  

  return (
      <ClockInClockOutInterceptor>
        <CashRegisterPage/>
      </ClockInClockOutInterceptor>
  );
}