"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PasswordChangeForm } from "@/components/forms/PasswordChangeForm";



interface PasswordChangeModalProps {
  isOpen: boolean;
  userId: string;
  isMandatory?: boolean;
  onSuccess?: () => void;
}

export function PasswordChangeModal({
  isOpen,
  userId,
  isMandatory = false,
  onSuccess,
}: PasswordChangeModalProps) {
  return (
    <Dialog 
      open={isOpen} 
      // If mandatory, disable closing via the dialog wrapper/header triggers
      onOpenChange={isMandatory ? undefined : onSuccess}
    >
      <DialogContent 
        className="sm:max-w-md font-sans rounded-2xl border-slate-200 shadow-lg"
        // Block closing actions if password change is forced
        onInteractOutside={(e) => {
          if (isMandatory) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isMandatory) e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-slate-900">
              {isMandatory ? "Mandatory Password Update" : "Change Password"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isMandatory
                ? "Your account security requires you to update your temporary or default password before proceeding with clinical operations."
                : "Enter your current password and choose a secure new password for your account."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="pt-2">
          <PasswordChangeForm userId={userId} onSuccess={onSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}