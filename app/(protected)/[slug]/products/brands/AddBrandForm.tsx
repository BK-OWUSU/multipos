"use client";

import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandSchema, BrandFormValues } from "@/types/schema/inventory.schema";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { FieldLabel } from "@/components/ui/field";
import { Award, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ImageSection } from "@/components/reusables/ImageSection";
import { useEffect, useState, useRef } from "react";
import CustomButton from "@/components/reusables/CustomButton";
import { useBrandStore } from "@/store/brandStore"; 
import { AppResponse } from "@/types/auth/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { Brand } from "@/types/schema/inventory"; // Make sure you have this type

interface BrandFormProps {
  initialData?: Brand;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BrandForm({
  initialData,
  onSuccess,
  onCancel
}: BrandFormProps) {
  const isEditing = !!initialData;
  const { createBrand, updateBrand } = useBrandStore();

  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);
  const fileKeyRef = useRef<string>("");

  const methods = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      fileKey: initialData?.fileKey || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const { formState: { isSubmitting }, control, handleSubmit, setValue, reset } = methods;

  // Sync form values if initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
        fileKey: initialData.fileKey || "",
        isActive: initialData.isActive,
      });
      fileKeyRef.current = initialData.fileKey || "";
    }
  }, [initialData, reset]);

  // Cleanup logic: delete uploaded file if form is closed without saving
  useEffect(() => {
    return () => {
      if (fileKeyRef.current && !isSuccessfullySubmitted && !isEditing) {
        deleteUTFile(fileKeyRef.current);
      }
    };
  }, [isSuccessfullySubmitted, isEditing]);

  const onSubmit = async (data: BrandFormValues) => {
    try {
      setIsSuccessfullySubmitted(true);
      let response: AppResponse;

      if (isEditing && initialData) {
        response = await updateBrand(initialData.id, data) as AppResponse;
      } else {
        response = await createBrand(data) as AppResponse;
      }

      if (response.success) {
        toast.success(response.message || `Brand ${isEditing ? 'updated' : 'added'} successfully!`);
        if (onSuccess) onSuccess();
        if (!isEditing) reset();
      } else {
        setIsSuccessfullySubmitted(false);
        toast.error(response.error || "Operation failed");
      }
    } catch (error) {
      setIsSuccessfullySubmitted(false);
      toast.error("An unexpected error occurred");
      console.error("Brand Form Error: ", error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ImageSection 
          control={control} 
          setValue={setValue} 
          name="imageUrl" 
          endpoint="imageUploader" 
          label="Brand Logo"
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

        <FormInput 
          name="name" 
          label="Brand Name" 
          placeholder="e.g. Nike, Samsung" 
        />

        <FormInput 
          textArea
          name="description"
          label="Description" 
          placeholder="Brief details about this brand" 
        />

        <div className="flex items-center justify-between p-2 border rounded-md px-4 bg-white shadow-sm">
          <div className="space-y-0.5">
            <FieldLabel className="text-sm">Brand Status</FieldLabel>
            <p className="text-xs text-gray-500">Active brands are visible in product selection</p>
          </div>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch 
                checked={field.value} 
                onCheckedChange={field.onChange} 
              />
            )}
          />
        </div>

        <div className="pt-4 flex items-center gap-3">
          <CustomButton
            text="Cancel"
            type="button"
            onClick={onCancel}
            className="flex-1"
            customVariant="secondary"
          />
          <CustomButton
            text={isEditing ? "Update Brand" : "Save Brand"}
            type="submit"
            className="flex-1"
            customVariant="primary"
            icon={isEditing ? <Save className="mr-2 h-4 w-4" /> : <Award className="mr-2 h-4 w-4" />}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </FormProvider>
  );
}