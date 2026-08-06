// components/customers/QuickCustomerForm.tsx
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quickCustomerSchema,QuickCustomerSchema } from "@/types/schema/auth.schema";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import CustomButton from "@/components/reusables/CustomButton";
// import { useCustomerStore } from "@/store/customerStore";
import { AppResponse } from "@/types/auth/auth";

interface QuickCustomerFormProps {
  onSuccess?: (customerId: string) => void;
  onCancel?: () => void;
}

export default function QuickCustomerForm({
  onSuccess,
  onCancel
}: QuickCustomerFormProps) {
//   const { createCustomer } = useCustomerStore();

  const methods = useForm<QuickCustomerSchema>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const { formState: { isSubmitting }, handleSubmit, reset } = methods;

  const onSubmit = async (data: QuickCustomerSchema) => {
    try {
    //   const response = await createCustomer(data) as AppResponse;

    //   if (response.success) {
    //     toast.success("Customer added successfully!");
    //     if (onSuccess && response.data?.id) {
    //       onSuccess(response.data.id);
    //     }
    //     reset();
    //   } else {
    //     toast.error(response.error || "Failed to add customer");
    //   }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Quick Customer Form Error: ", error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="font-semibold text-lg">Quick Add Customer</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <FormInput name="firstName" label="First Name" placeholder="John" />
          <FormInput name="lastName" label="Last Name" placeholder="Doe" />
        </div>

        <FormInput name="phone" label="Phone Number" placeholder="0241234567" />

        <div className="flex gap-3 pt-2">
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
            text="Add Customer"
            type="submit"
            className="flex-1"
            customVariant="primary"
            icon={<UserPlus className="mr-2 h-4 w-4" />}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </FormProvider>
  );
}