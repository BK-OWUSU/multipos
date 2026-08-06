"use client";

import { useState, useMemo, useEffect } from "react";
import { Package, XCircle, Award, Plus, Lightbulb, ShieldCheck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomButton from "@/components/reusables/CustomButton";
import TableMain from "@/components/reusables/table/TableMain";
import BrandForm from "./AddBrandForm";
import { brandsColumnDef } from "@/components/tablesColumnDef/business/brandsColumnDef";
import { useBrandStore } from "@/store/brandStore";

export default function BrandPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const { fetchBrands, brands } = useBrandStore();
  const hasDismissedTips = localStorage.getItem("brandTipsDismissed") === "true";

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Unified configurations driving the responsive StatCards layout
  const stats = useMemo(() => {
    const brandList = brands || [];
    const active = brandList.filter(b => b.isActive).length;
    const inactive = brandList.filter(b => !b.isActive).length;
    const totalProducts = brandList.reduce((sum, brand) => sum + (brand._count?.products || 0), 0);

    return [
      { label: "Total Brands", value: brandList.length, icon: Award, color: "bg-purple-50 text-purple-600", subtitle: "All manufacturers" },
      { label: "Active Brands", value: active, icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600", subtitle: "Visible in dropdowns" },
      { label: "Inactive Brands", value: inactive, icon: XCircle, color: "bg-rose-50 text-rose-600", subtitle: "Archived labels" },
      { label: "Total Products", value: totalProducts, icon: Package, color: "bg-blue-50 text-blue-600", subtitle: "Items cataloged" },
    ];
  }, [brands]);

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 lg:p-8 text-slate-900 antialiased font-sans">
      <div className="mx-auto space-y-6">
        
        {/* ── 1. RESPONSIVE HEADER REGION ────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-950">Brands</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">Manage product brands and manufacturer labels.</p>
          </div>
          
          <div className="self-stretch sm:self-auto flex justify-end">
            <GenericModal
              header="Add Brand"
              description="Create a new brand label for your product inventory."
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              triggerBtn={
                <CustomButton
                  customVariant="primary"
                  text="Add Brand" 
                  icon={<Plus className="w-4 h-4 mr-2 stroke-[2.5]" />} 
                />
              }
            >
              <BrandForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
            </GenericModal>
          </div>
        </div>

        {/* ── 2. LOOPED COMPACT SHADCN STAT CARDS GRID ───────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block tracking-normal uppercase">
                  {stat.label}
                </span>
                <h3 className="text-lg font-black text-blue-950 mt-0.5">
                  {stat.value}
                </h3>
                <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                  {stat.subtitle}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── 3. RESPONSIVE MAIN INTERACTIVE DATA SHEET BLOCK ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Grid Table Canvas - Dynamically fluid column layouts based on state */}
          <div className={showTips && !hasDismissedTips ? "lg:col-span-3 w-full" : "lg:col-span-4 w-full"}>
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="p-4 bg-white">
                <TableMain 
                  data={brands || []}
                  columns={brandsColumnDef} 
                  checkBoxVisibility={true}
                  columnVisibilityFilter={true}
                  tableFilterButtonVisible={true}
                  tableExportButtonVisible={true}
                  searchKey="name"
                  placeholder="Search brands by identifier name..."
                />
              </div>
            </Card>
          </div>

          {/* Brand Tips Sidebar Container with Dismiss Logic */}
          {showTips && !hasDismissedTips && (
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-200">
              <Card className="rounded-2xl border-none bg-purple-50/40 p-5 shadow-none space-y-4 relative overflow-hidden">
                
                {/* Micro-interactive Dismiss trigger button */}
                <button
                  onClick={() => {
                    setShowTips(false);
                    localStorage.setItem("brandTipsDismissed", "true");  
                  }}
                  className="absolute top-4 right-4 p-1 rounded-lg text-purple-400 hover:text-purple-900 hover:bg-purple-100/60 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-200"
                  title="Hide layout tips"
                  aria-label="Hide layout tips"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-2 text-purple-900 font-black text-xs uppercase tracking-wider pr-6">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                    <Lightbulb className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span>Brand Workspace Tips</span>
                </div>
                
                <ul className="space-y-3 text-xs font-semibold text-purple-950/70 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-black">✓</span> 
                    <span>Upload high-quality logos for better visual visibility on customer sales invoice screens.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-black">✓</span> 
                    <span>Active cataloged brand entries automatically clear and feed into your dynamic product mapping menus.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-black">✓</span> 
                    <span>Use structured notes fields to archive critical corporate manufacturer or regional origin attributes.</span>
                  </li>
                </ul>
              </Card>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}