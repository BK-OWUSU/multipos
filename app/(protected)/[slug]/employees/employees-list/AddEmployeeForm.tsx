"use client";

import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateEmployeeSchema, createEmployeeSchema } from "@/types/schema/auth.schema";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { Field, FieldLabel } from "@/components/ui/field";
import { Plus, ShieldCheck, Save } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AppResponse, Employee } from "@/types/auth/auth";
import CustomButton from "@/components/reusables/CustomButton";
import { ImageSection } from "@/components/reusables/ImageSection";
import { useEffect, useRef, useState } from "react";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { createEmployeeAction, updateEmployeeAction } from "@/lib/actions/business/employeesActions";

interface EmployeeFormProps {
  initialData?: Employee;
  roles?: { id: string; name: string }[];
  shops?: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmployeeForm({
  initialData,
  roles = [],
  shops = [],
  onSuccess,
  onCancel
}: EmployeeFormProps) {
  const isEditing = !!initialData;
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);
  const fileKeyRef = useRef<string>("");

  // Helper utility to safely format date values back into HTML element strings (YYYY-MM-DD)
  const formatBirthDateForInput = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  };

  const methods = useForm<CreateEmployeeSchema>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      imageUrl: initialData?.imageUrl || "",
      fileKey: initialData?.fileKey || "",
      phone: initialData?.phone || "",
      designation: initialData?.designation || "",
      address: initialData?.address || "",
      // Cast cleanly via unknown to keep form fields bound to a string structure safely
      dateOfBirth: (initialData?.dateOfBirth ? formatBirthDateForInput(initialData.dateOfBirth) : "") as unknown as Date,
      roleId: initialData?.roleId || "",
      currentShopId: initialData?.currentShopId || "floating",
      hasSystemAccess: initialData?.hasSystemAccess ?? false,
    },
  });

  const { formState: { isSubmitting }, control, handleSubmit, setValue, reset } = methods;

  // Sync fresh incoming row states smoothly 
  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        imageUrl: initialData.imageUrl || "",
        fileKey: initialData.fileKey || "",
        phone: initialData.phone || "",
        designation: initialData.designation || "",
        address: initialData.address || "",
        dateOfBirth: (initialData.dateOfBirth ? formatBirthDateForInput(initialData.dateOfBirth) : "") as unknown as Date,
        roleId: initialData.roleId,
        currentShopId: initialData.currentShopId || "floating",
        hasSystemAccess: initialData.hasSystemAccess,
      });
      fileKeyRef.current = initialData.fileKey || "";
    }
  }, [initialData, reset]);

  // Clean layout instances up if images are abandoned on cancel paths
  useEffect(() => {
    return () => {
      if (fileKeyRef.current && !isSuccessfullySubmitted && !isEditing) {
        deleteUTFile(fileKeyRef.current);
      }
    };
  }, [isSuccessfullySubmitted, isEditing]);

  const onSubmit = async (data: CreateEmployeeSchema) => {
    try {
      const payload = {
        ...data,
        currentShopId: data.currentShopId === "floating" ? null : data.currentShopId, 
        designation: data.designation || null,
        address: data.address || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        imageUrl: data.imageUrl || null,
        fileKey: data.fileKey || null,
      };

      let response: AppResponse;

      if (isEditing && initialData) {
         response = await updateEmployeeAction(payload, initialData.id)
      } else {
        // response = await addEmployee(payload) as AppResponse;
        response =  await createEmployeeAction(payload)
      }

      if (response.success) {
        setIsSuccessfullySubmitted(true);
        toast.success(response.message || `Employee ${isEditing ? 'updated' : 'added'} successfully!`);
        if (onSuccess) onSuccess();
        if (!isEditing) reset();
      } else {
        toast.error(response.error || "Operation failed");
      }
    } catch (error) {
      setIsSuccessfullySubmitted(false);
      toast.error("An unexpected error occurred");
      console.error("Employee Form Error: ", error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow border"
      >
        <ImageSection 
          control={control} 
          setValue={setValue} 
          name="imageUrl" 
          endpoint="imageUploader" 
          label="Employee Image"
          onImageUpload={(key) => {
            setValue("fileKey", key);
            fileKeyRef.current = key;
          }}
          onImageRemove={() => {
            setValue("fileKey", "");
            setValue("imageUrl", "");
            fileKeyRef.current = "";
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="firstName" label="First Name" placeholder="Isaac" />
          <FormInput name="lastName" label="Last Name" placeholder="Mensah" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput 
            name="email" 
            label="Email Address" 
            type="email" 
            placeholder="staff@business.com"
            disabled={isEditing} 
          />
          <FormInput name="designation" label="Designation" placeholder="e.g. Sales Associate" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="phone" label="Phone Number" placeholder="Optional" />
          <FormInput name="dateOfBirth" label="Date of Birth" type="date" />
        </div>

        <FormInput name="address" label="Home Address" placeholder="123 POS Street, Accra" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ROLE SELECT */}
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* SHOP SELECT */}
          <Field>
            <FieldLabel>Home Shop Assignment</FieldLabel>
            <Controller
              control={control}
              name="currentShopId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? "floating"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Floating / All Shops" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      <SelectItem value="floating">Floating / All Shops</SelectItem>
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
        </div>

        {/* SYSTEM ACCESS TOGGLE */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              {isEditing ? "System Access Status" : "Grant System Access"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isEditing 
                ? "Toggle to grant or revoke system access for this employee."
                : "Checking this will create a login account and send a temporary password to their email."
              }
            </p>
          </div>
          <Controller
            control={control}
            name="hasSystemAccess"
            render={({ field }) => (
              <Switch 
                checked={field.value} 
                onCheckedChange={field.onChange} 
              />
            )}
          />
        </div>

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
            text={isEditing ? "Update Employee" : "Add Employee"}
            type="submit"
            className="flex-1"
            customVariant="primary"
            icon={isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </FormProvider>
  );
}