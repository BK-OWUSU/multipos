"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useShopStore } from "@/store/shopStore";
import { switchCurrentShop } from "@/lib/actions/business/employeesActions";

import {
  Store,
  MapPin,
  Phone,
  ArrowRight,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ShopSelectionPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { fetchShops } = useShopStore();

  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [switchingShopId, setSwitchingShopId] = useState<string | null>(null);

  /**
   * Only fetch global shops on mount. Avoid calling fetchUser() here 
   * to prevent infinite re-render loops with the auth store state updates.
   */
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingShops(true);
      await fetchShops();
      if (isMounted) setIsLoadingShops(false);
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchShops]);

  /**
   * Handle shop selection/switching.
   */
  const handleSelectShop = async (targetShopId: string, targetShopName: string, targetShopSlug: string) => {
    if (targetShopId === user?.currentShop?.id) return;

    setSwitchingShopId(targetShopId);

    toast.promise(
      switchCurrentShop({
        shopId: targetShopId,
      }),
      {
        loading: `Switching workspace terminal to ${targetShopName}...`,
        success: async (res) => {
          if (!res.success) {
            throw new Error(
              res.error || "Failed to alter active branch workspace context"
            );
          }

          await fetchShops();

          router.push(`/${user?.business?.slug}/shops/${targetShopSlug}/pos`);

          return res.message || `Switched workspace to ${targetShopName}`;
        },
        error: (err) => {
          return err?.message || "An unexpected error occurred.";
        },
        finally: () => {
          setSwitchingShopId(null);
        },
      }
    );
  };

  /**
   * Derive assigned shops securely straight from the cached user object.
   * If user.assignedShops is empty or undefined, they are routed to the empty state.
   */
  const assignedShops = user?.assignedShops?.map((item) => item.shop) || [];
  const hasShops = assignedShops.length > 0;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50/50 dark:bg-slate-950/50 selection:bg-emerald-500 selection:text-white">
      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        {isLoadingShopStore(isLoadingShops, hasShops) ? (
          /* Loading State Skeleton */
          <div className="flex flex-col items-center justify-center space-y-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading your assigned workspaces...
            </p>
          </div>
        ) : hasShops ? (
          <div className="w-full space-y-8 animate-in fade-in-50 duration-300">
            {/* Page Heading */}
            <div className="text-center space-y-3 max-w-lg mx-auto">
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs uppercase tracking-wider font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
              >
                Branch Selection
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Where are you working today?
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose a retail branch location from your assigned workspaces to
                launch your sales terminal.
              </p>
            </div>

            {/* Shop Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {assignedShops.map((shop) => {
                const isCurrent = user?.currentShop?.id === shop.id;
                const isSwitching = switchingShopId === shop.id;
                const hasSwitchingShop = switchingShopId !== null;

                return (
                  <Card
                    key={shop.id}
                    onClick={() => {
                      if (!hasSwitchingShop) {
                        handleSelectShop(shop.id, shop.name, shop.shopSlug);
                      }
                    }}
                    className={`group relative overflow-hidden transition-all duration-200 border flex flex-col justify-between ${
                      hasSwitchingShop
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:shadow-xl hover:-translate-y-1"
                    } ${
                      isCurrent
                        ? "border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-sm"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-start justify-between">
                          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 transition-colors shadow-2xs">
                            <Store className="h-5 w-5" />
                          </div>

                          {isCurrent && (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1 text-[11px] font-medium px-2.5 py-0.5"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-base font-bold pt-4 text-slate-900 dark:text-slate-100 tracking-tight">
                          {shop.name}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono text-slate-400 dark:text-slate-500">
                          /{shop.shopSlug}
                        </CardDescription>
                      </CardHeader>

                      {/* Card Content */}
                      <CardContent className="p-5 pt-0 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                        {shop.address && (
                          <div className="flex items-center gap-2.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{shop.address}</span>
                          </div>
                        )}

                        {shop.phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span>{shop.phone}</span>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    {/* Card Footer */}
                    <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-4">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        {isSwitching
                          ? "Switching..."
                          : isCurrent
                          ? "Current Workspace"
                          : "Launch Terminal"}
                      </span>
                      <ArrowRight
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          !hasSwitchingShop ? "group-hover:translate-x-1.5" : ""
                        }`}
                      />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State (No Assigned Shops) - Positioned Center */
          <div className="max-w-md w-full mx-auto text-center space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl my-auto">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                No Shop Assigned
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your account is active, but you haven&apos;t been assigned to any
                store branches yet. Please reach out to your business
                administrator or manager to grant you access.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => logout()}
                className="w-full text-xs font-semibold gap-2 h-11 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sign Out & Try Different Account
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function isLoadingShopStore(isLoadingShops: boolean, hasShops: boolean) {
  return isLoadingShops && !hasShops;
}