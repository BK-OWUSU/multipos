// components/forms/PasswordChangeForm.tsx
"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordChangeInput, passwordChangeSchema } from "@/types/schema/auth.schema";
import { changePasswordAction } from "@/lib/actions/auth/user.actions";

interface PasswordChangeFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function PasswordChangeForm({ userId, onSuccess }: PasswordChangeFormProps) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordChangeInput) {
    startTransition(async () => {
      const res = await changePasswordAction(userId, data);
      if (!res.success) {
        toast.error(res.error || "Failed to update password");
      } else {
        toast.success(res.message || "Password updated successfully");
        onSuccess?.();
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup className="space-y-3">
        {/* Current Password */}
        <Controller name="currentPassword" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-bold text-slate-700">Current Password</FieldLabel>
            <Input type="password" {...field} placeholder="••••••••" />
            {fieldState.error?.message && <FieldError errors={[{ message: fieldState.error.message }]} />}
          </Field>
        )} />

        {/* New Password */}
        <Controller name="newPassword" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-bold text-slate-700">New Password</FieldLabel>
            <Input type="password" {...field} placeholder="••••••••" />
            {fieldState.error?.message && <FieldError errors={[{ message: fieldState.error.message }]} />}
          </Field>
        )} />

        {/* Confirm Password */}
        <Controller name="confirmPassword" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-bold text-slate-700">Confirm New Password</FieldLabel>
            <Input type="password" {...field} placeholder="••••••••" />
            {fieldState.error?.message && <FieldError errors={[{ message: fieldState.error.message }]} />}
          </Field>
        )} />
      </FieldGroup>

      <Button type="submit" disabled={isPending} className="w-full bg-blue-900 hover:bg-blue-800 text-white rounded-lg h-10 mt-2">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Change Password
      </Button>
    </form>
  );
}