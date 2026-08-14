"use client";

import React from "react";
import { useAuthStore } from "@/store/useAuthStore"; // Adjust this import path to match your file structure
import AppLoader from "@/components/loaders/app-loader";
import ShopSelectionPage from "@/app/(protected)/[slug]/shops/shopPage";

interface ShopGuardProps {
  children: React.ReactNode;
}

export function ShopGuard({ children }: ShopGuardProps) {
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

  // 3. Render children safely if shop id exists
  return <>{children}</>;
}
