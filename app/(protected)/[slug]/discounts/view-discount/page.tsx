"use client";

import React, { useEffect, useMemo } from "react";
import { 
  Tag, 
  CheckCircle2, 
  CalendarDays, 
  XCircle, 
  Plus, 
} from "lucide-react";

// Shadcn UI Component Primitives
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { useDiscountStore } from "@/store/discountStore";
import TableMain from "@/components/reusables/table/TableMain";
import { discountColumnDef } from "@/components/tablesColumnDef/business/discountColumnDef";

export default function DiscountsPage() {
  // Stores
  const user = useAuthStore((state) => state.user);
  const businessSlug = user?.business.slug;
  const createDiscountPath = `/${businessSlug}/discounts/create-discount`;
  const { discounts, fetchDiscounts } = useDiscountStore();

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // ── DERIVE STATS OVERVIEW CARDS DATA RUNTIME METRICS ──
  const stats = useMemo(() => {
    const list = discounts || [];
    
    const total = list.length;
    const active = list.filter((d) => d.status === "ACTIVE").length;
    const scheduled = list.filter((d) => d.status === "SCHEDULED").length;
    
    // Combines both EXPIRED and INACTIVE fields to match your layout design card
    const expiredOrInactive = list.filter(
      (d) => d.status === "EXPIRED" || d.status === "INACTIVE"
    ).length;

    return {
      total,
      active,
      scheduled,
      expiredOrInactive,
    };
  }, [discounts]);

  return (
    <div className="w-full space-y-6 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-950">Discounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage discounts available across your business.</p>
        </div>
        <Link href={createDiscountPath}>
          <Button className="bg-blue-800 hover:bg-blue-900 text-white self-start sm:self-auto gap-2 shadow-sm font-semibold">
            <Plus className="w-4 h-4" /> New Discount
          </Button>
        </Link>
      </div>

      {/* ── 1. STATS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Discounts */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Discounts</p>
              <h3 className="text-2xl font-bold text-blue-950">{stats.total}</h3>
              <p className="text-xs text-muted-foreground">All time</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Discounts */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Discounts</p>
              <h3 className="text-2xl font-bold text-emerald-600">{stats.active}</h3>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Discounts */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled</p>
              <h3 className="text-2xl font-bold text-amber-600">{stats.scheduled}</h3>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Expired / Inactive */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expired / Inactive</p>
              <h3 className="text-2xl font-bold text-rose-600">{stats.expiredOrInactive}</h3>
              <p className="text-xs text-muted-foreground">Not active</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. DATA TABLE LIST VIEW ── */}
      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <TableMain
              columns={discountColumnDef}
              data={discounts || []}
              columnVisibilityFilter={true}
              tableFilterButtonVisible={true}
              searchKey="name"
              placeholder="Search by name, type, status ..."
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}