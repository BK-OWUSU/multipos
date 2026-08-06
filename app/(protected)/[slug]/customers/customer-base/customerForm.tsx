// components/customers/CustomerForm.tsx
"use client";

import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { Field, FieldLabel } from "@/components/ui/field";
import { Plus, Save, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import CustomButton from "@/components/reusables/CustomButton";
// import { useCustomerStore } from "@/store/customerStore";
import { AppResponse, Customer } from "@/types/auth/auth";
import { createCustomerSchema ,CreateCustomerSchema} from "@/types/schema/auth.schema";

interface CustomerFormProps {
  initialData?: Customer;
  shops?: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CustomerForm({
  initialData,
  shops = [],
  onSuccess,
  onCancel
}: CustomerFormProps) {
  const isEditing = !!initialData;
  // const { createCustomer, updateCustomer } = useCustomerStore();

  const methods = useForm<CreateCustomerSchema>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      isCreditCustomer: initialData?.isCreditCustomer ?? false ,
      creditLimit: initialData?.creditLimit ? Number(initialData.creditLimit) : 0,
      registeredAtShopId: initialData?.registeredAtShopId || "",
    },
  });

  const { formState: { isSubmitting }, control, handleSubmit, setValue, reset, watch } = methods;

  // Watch isCreditCustomer to show/hide credit limit
  const isCreditCustomer = watch("isCreditCustomer");

  // Sync form values if initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        isCreditCustomer: initialData.isCreditCustomer,
        creditLimit: initialData.creditLimit ? Number(initialData.creditLimit) : 0,
        registeredAtShopId: initialData.registeredAtShopId || "",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: CreateCustomerSchema) => {
    try {
      // Clean data for API
      const payload = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        registeredAtShopId: data.registeredAtShopId && data.registeredAtShopId !== "" 
          ? data.registeredAtShopId 
          : null,
        creditLimit: data.isCreditCustomer ? data.creditLimit : 0,
      };

      let response: AppResponse;

      // if (isEditing && initialData) {
      //   response = await updateCustomer(initialData.id, payload) as AppResponse;
      // } else {
      //   response = await createCustomer(payload) as AppResponse;
      // }

      // if (response.success) {
      //   toast.success(response.message || `Customer ${isEditing ? 'updated' : 'added'} successfully!`);
      //   if (onSuccess) onSuccess();
      //   if (!isEditing) reset();
      // } else {
      //   toast.error(response.error || "Operation failed");
      // }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Customer Form Error: ", error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="firstName" label="First Name" placeholder="John" />
          <FormInput name="lastName" label="Last Name" placeholder="Doe" />
        </div>

        {/* Contact Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="email" label="Email Address" type="email" placeholder="customer@email.com" />
          <FormInput name="phone" label="Phone Number" placeholder="0241234567" />
        </div>

        {/* Address */}
        <FormInput 
          name="address" 
          label="Address" 
          placeholder="123 Main Street, Accra" 
        />

        {/* Shop Selection */}
        {shops.length > 0 && (
          <Field>
            <FieldLabel>Registered At Shop (Optional)</FieldLabel>
            <Controller
              control={control}
              name="registeredAtShopId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Shop" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      <SelectItem value="">No Specific Shop</SelectItem>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        )}

        {/* Credit Customer Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
          <div className="flex flex-col gap-1">
            <FieldLabel className="text-sm font-semibold">Credit Customer</FieldLabel>
            <p className="text-xs text-muted-foreground">
              Allow this customer to purchase on credit
            </p>
          </div>
          <Controller
            control={control}
            name="isCreditCustomer"
            render={({ field }) => (
              <Switch 
                checked={field.value} 
                onCheckedChange={field.onChange} 
              />
            )}
          />
        </div>

        {/* Credit Limit (Conditional) */}
        {isCreditCustomer && (
          <FormInput 
            name="creditLimit" 
            label="Credit Limit (GH₵)" 
            type="number" 
            placeholder="0.00"
          />
        )}

        {/* Actions */}
        <div className="pt-4 flex items-center gap-3">
          {onCancel && (
            <CustomButton
              text="Cancel"
              type="button"
              onClick={onCancel}
              className="flex-1"
              customVariant="secondary"
            />
          )}
          <CustomButton
            text={isEditing ? "Update Customer" : "Add Customer"}
            type="submit"
            className="flex-1"
            customVariant="primary"
            icon={isEditing ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </FormProvider>
  );
}