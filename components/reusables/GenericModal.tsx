"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode } from "react";

interface GenericModalProps {
  triggerBtn: ReactNode;      
  header: string;         
  description?: string;    
  children: ReactNode;    
  isOpen?: boolean;
  width?: string | null; // Optional width prop for custom sizing
  onOpenChange?: (open: boolean) => void;
}

export function GenericModal({
  triggerBtn,
  header,
  description,
  children,
  isOpen,
  width,
  onOpenChange,
}: GenericModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {triggerBtn}
      </DialogTrigger>
      
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${width}`}>
        <DialogHeader>
          <DialogTitle className="text-center font-bold my-1">{header}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* This is where other component goes */}
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}