"use client";

import React from "react";
import { 
  Store, 
  ChevronDown, 
  Check, 
  Plus, 
  MapPin 
} from "lucide-react";

// Shadcn UI Primitives
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Shop } from "@/types/schema/shop.schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { switchCurrentShop } from "@/lib/actions/business/employeesActions"; 
import { useAuthStore } from "@/store/useAuthStore";

interface ShopSwitcherProps {
  shops: Shop[];
  createShopPath: string;
}

export default function ShopSwitcher({ shops = [], createShopPath }: ShopSwitcherProps) {
  const router = useRouter();
  const { fetchUser, user } = useAuthStore();
  
  // ── SOURCE OF TRUTH ────────────────────────────────────────────────
  // We read directly from the global user object returned by your fixed mapping logic
  const currentShop = user?.currentShop;

  // Fallback structural safety assignment if user state hasn't fully hydrated yet
  if (shops.length === 0) {
    return (
      <Button variant="outline" disabled className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-slate-50 text-slate-400">
        <Store className="w-4 h-4 animate-pulse" /> Loading locations...
      </Button>
    );
  }

  // ── EVENT MUTATION ROUTER TRIGGER ───────────────────────────────────
  const handleShopSwitch = async (targetShop: Shop) => {
    // If clicking the branch they are already active in, close dropdown cleanly
    if (targetShop.id === currentShop?.id) return;

    toast.promise(
      switchCurrentShop({ shopId: targetShop.id }),
      {
        loading: `Switching workspace terminal to ${targetShop.name}...`,
        success: (res) => {
          if (res.success) {
            // Refetches live data profile; your global state updates and re-renders the component
            fetchUser(); 
            return res.message || `Switched workspace down to ${targetShop.name}`;
          } else {
            throw new Error(res.error || "Failed to alter active branch workspace context");
          }
        },
        error: (err) => err.message || "An unexpected error occurred."
      }
    );
  };

  return (
    <DropdownMenu>
      {/* ── DROPDOWN TRIGGER BUTTON ────────────────────────────── */}
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 px-4 bg-indigo-50/40 hover:bg-indigo-50/80 border-indigo-100/80 text-indigo-900 rounded-xl font-bold text-sm shadow-sm gap-2 transition-all duration-200 shrink-0 focus-visible:ring-indigo-200"
        >
          <Store className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
          <span>
            Current Shop: <span className="font-black text-slate-900">{currentShop?.name || "Select Shop"}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-indigo-400 ml-1 stroke-[2.5]" />
        </Button>
      </DropdownMenuTrigger>

      {/* ── DROPDOWN MENU PANEL CONTENT ────────────────────────── */}
      <DropdownMenuContent 
        align="start" 
        className="w-70 bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 mt-1 animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-black tracking-wide text-slate-800 uppercase">
          Switch Shop
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-slate-50 my-1" />

        <DropdownMenuGroup className="space-y-0.5">
          {shops.map((shop) => {
            // Compare directly against the active profile ID string context layout 
            const isSelected = shop.id === currentShop?.id;

            return (
              <DropdownMenuItem
                key={shop.id}
                onClick={() => handleShopSwitch(shop)}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer font-sans transition-colors duration-150 focus:bg-slate-50",
                  isSelected && "bg-indigo-50/30 focus:bg-indigo-50/50"
                )}
              >
                {/* Meta Descriptive Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate tracking-tight">
                    {shop?.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="truncate">{shop?.address || "No address specified"}</span>
                  </p>
                </div>

                {/* Dynamic Selection Indicator Checkmark */}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-in scale-in-75 duration-100">
                    <Check className="w-3 h-3 stroke-3" />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-slate-50 my-1.5" />

        {/* ── BOTTOM UTILITY OPTION: CREATE BRAND NEW SHOP ──────── */}
        <DropdownMenuItem
          onClick={() => router.push(createShopPath)}
          className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs font-black text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 transition-colors duration-150"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-3" />
          </div>
          <span>Create New Shop</span>
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

