"use client";

import { useState, useMemo, useEffect } from "react";
import { Package, CheckCircle2, XCircle, Layers, Plus, Lightbulb,X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomButton from "@/components/reusables/CustomButton";
import TableMain from "@/components/reusables/table/TableMain";
import CategoryForm from "./AddCategoryForm";
import { categoriesColumnDef } from "@/components/tablesColumnDef/business/categoriesColumnDef";
import { useCategoryStore } from "@/store/categoryStore";

export default function CategoryPage() {
  const { fetchCategories, categories } = useCategoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const hasDismissedTips = localStorage.getItem("categoryTipsDismissed") === "true";

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Unified configuration array driving the looped StatCard components
  const stats = useMemo(() => {
    const categoryList = categories || [];
    const active = categoryList.filter(c => c.isActive).length;
    const inactive = categoryList.filter(c => !c.isActive).length;
    const totalProducts = categoryList.reduce((sum, category) => sum + (category._count?.products || 0), 0);
    
    return [  
      { label: "Total Categories", value: categoryList.length, icon: Layers, color: "bg-indigo-50 text-indigo-600", subtitle: "All configurations" },
      { label: "Active Categories", value: active, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", subtitle: "Live on checkout" },
      { label: "Inactive Categories", value: inactive, icon: XCircle, color: "bg-rose-50 text-rose-600", subtitle: "Hidden or archived" },
      { label: "Total Products", value: totalProducts, icon: Package, color: "bg-blue-50 text-blue-600", subtitle: "Items cataloged" },
    ];
  }, [categories]);

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 lg:p-8 text-slate-900 antialiased font-sans">
      <div className="mx-auto space-y-6">
        
        {/* ── 1. RESPONSIVE HEADER REGION ────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-950">Categories</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">Manage product categories to organize your inventory.</p>
          </div>
          
          <div className="self-stretch sm:self-auto flex justify-end">
            <GenericModal
              header="Add Category"
              description="Create a new category to organize your products."
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              triggerBtn={
                <CustomButton
                  customVariant="primary"
                  text="Add Category" 
                  icon={<Plus className="w-4 h-4 mr-2 stroke-[2.5]" />} 
                />
              }
            >
              <CategoryForm 
                onSuccess={() => { 
                  setIsModalOpen(false);
                  fetchCategories();
                }}
                onCancel={() => setIsModalOpen(false)} 
              />
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
          
          {/* Main Grid Table Canvas - Dynamically expands to full width when tips are closed */}
          <div className={showTips && !hasDismissedTips ? "lg:col-span-3 w-full" : "lg:col-span-4 w-full"}>
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="p-4 bg-white">
                <TableMain 
                  data={categories || []}
                  columns={categoriesColumnDef}
                  checkBoxVisibility={true}
                  columnVisibilityFilter={true}
                  tableFilterButtonVisible={true}
                  tableExportButtonVisible={true}
                  searchKey="name"
                  placeholder="Search category by system key..."
                />
              </div>
            </Card>
          </div>

            {/* Quick Informational Tips Sidebar Container */}
            {showTips && !hasDismissedTips && (
              <div className="w-full animate-in fade-in slide-in-from-right-4 duration-200">
                <Card className="rounded-2xl border-none bg-indigo-50/40 p-5 shadow-none space-y-4 relative overflow-hidden">
                  
                  {/* Absolute Positioned Close Button */}
                  <button
                    onClick={() => {
                      setShowTips(false);
                      localStorage.setItem("categoryTipsDismissed", "true");
                    }}
                    className="absolute top-4 right-4 p-1 rounded-lg text-indigo-400 hover:text-indigo-900 hover:bg-indigo-100/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    title="Close tips panel"
                    aria-label="Close tips panel"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wider pr-6">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                      <Lightbulb className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span>Organizational Tips</span>
                  </div>
                  
                  <ul className="space-y-3 text-xs font-semibold text-indigo-950/70 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-black">✓</span> 
                      <span>Create clear and specific category titles for cleaner retail POS parsing keys.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-black">✓</span> 
                      <span>Categories automatically cluster sales matrix parameters inside your analytical charts logs.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-black">✓</span> 
                      <span>You can adjust display sequencing orders safely within your master settings workspace.</span>
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