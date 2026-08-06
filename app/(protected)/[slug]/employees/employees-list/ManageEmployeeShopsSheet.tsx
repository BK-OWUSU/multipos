"use client";

import { useState, useTransition } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Store, MapPin, Save } from "lucide-react";
import { updateEmployeeShops } from "@/lib/actions/business/employeesActions";
import CustomButton from "@/components/reusables/CustomButton";

interface Shop {
  id: string;
  name: string;
  address?: string | null;
}

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  assignedShops?: { shop: { id: string } }[];
}

interface ManageShopsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRow | null;
  allShops: Shop[];
  onSuccess?: () => void; 
}

export default function ManageEmployeeShopsSheet({ 
  isOpen, 
  onOpenChange, 
  employee, 
  allShops = [], 
  onSuccess 
}: ManageShopsSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);

  if (!employee) return null;

  const handleToggleShop = (shopId: string) => {
    setSelectedShopIds((prev) =>
      prev.includes(shopId)
        ? prev.filter((id) => id !== shopId)
        : [...prev, shopId]
    );
  };

  const handleSaveChanges = () => {
    startTransition(async () => {
      try {
        const res = await updateEmployeeShops({
          employeeId: employee.id,
          shopIds: selectedShopIds,
        });

        if (res.success) {
          toast.success(res.message);
          if (onSuccess) onSuccess();
          onOpenChange(false);
        } else {
          toast.error(res.error || "Failed to update shop assignments");
        }
      } catch (err ) {
        toast.error("An unexpected error occurred during assignment.");
        console.error("ERROR_ASSIGNING_SHOPS: ", err)
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white p-6">
        
        {/* Header Block */}
        <SheetHeader className="pb-4 border-b border-slate-100">
          <SheetTitle className="text-lg font-black text-slate-900">
            Manage Assigned Shops
          </SheetTitle>
          <SheetDescription className="text-xs font-medium text-slate-500">
            Select the branch locations <span className="font-bold text-slate-800">{employee.firstName} {employee.lastName}</span> is permitted to access and manage.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Checkbox Checklist Area */}
        <div className="flex-1 py-4 overflow-hidden">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2">
              {allShops.map((shop) => {
                const isChecked = selectedShopIds.includes(shop.id);
                
                return (
                  <div
                    key={shop.id}
                    onClick={() => handleToggleShop(shop.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                      isChecked 
                        ? "bg-indigo-50/20 border-indigo-200/60 shadow-sm" 
                        : "bg-white border-slate-100 hover:bg-slate-50/60"
                    }`}
                  >
                    <Checkbox
                      id={`shop-${shop.id}`}
                      checked={isChecked}
                      onCheckedChange={() => handleToggleShop(shop.id)}
                      className="mt-0.5 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <label
                        htmlFor={`shop-${shop.id}`}
                        className="text-xs font-bold text-slate-900 cursor-pointer block truncate"
                      >
                        {shop.name}
                      </label>
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="truncate">{shop.address || "No explicit address setup"}</span>
                      </p>
                    </div>
                    <Store className={`w-4 h-4 shrink-0 transition-colors ${isChecked ? "text-indigo-500" : "text-slate-300"}`} />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Action Button Footer */}
        <SheetFooter className="pt-4 border-t border-slate-100 gap-2 sm:gap-4">
          <SheetClose asChild>
            {/* <Button variant="outline" className="rounded-xl text-xs font-bold border-slate-200 text-slate-700">
              Cancel
            </Button> */}
            <CustomButton
             text="Cancel"
             variant="outline"
             className="p-3!"
            />
          </SheetClose>
           <CustomButton
             text="Save Changes"
             type="submit"
             className="flex-1 p-2"
             customVariant="primary"
             icon={<Save className="mr-2 h-4 w-4" />}
             isLoading={isPending}
             disabled = {isPending}
             onClick={handleSaveChanges}
            />
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}