"use client";

import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

interface AppSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  customWidth?: string
}

export function AppSheet({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  maxWidth = "md" ,
  customWidth
}: AppSheetProps) {
  
  const maxClassMap = {
    sm: "sm:max-w-sm!",
    md: "sm:max-w-md!",
    lg: "sm:max-w-lg!",
    xl: "sm:max-w-xl!",
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className={`w-full ${maxClassMap[maxWidth]} ${customWidth} overflow-y-auto bg-white rounded-l-2xl p-6`}>
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-black text-slate-950">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-xs text-slate-500">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}