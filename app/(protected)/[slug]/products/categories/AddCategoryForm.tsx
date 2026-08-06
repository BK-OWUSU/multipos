"use client";

import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CategoryFormValues } from "@/types/schema/inventory.schema";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { FieldLabel } from "@/components/ui/field";
import { Layers, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ImageSection } from "@/components/reusables/ImageSection";
import { useEffect, useState, useRef } from "react";
import CustomButton from "@/components/reusables/CustomButton";
import { useCategoryStore } from "@/store/categoryStore";
import { AppResponse } from "@/types/auth/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { Category } from "@/types/schema/inventory"; // Make sure you have this type

interface CategoryFormProps {
  initialData?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CategoryForm({
  initialData,
  onSuccess,
  onCancel
}: CategoryFormProps) {
  const isEditing = !!initialData;
  const { createCategory, updateCategory } = useCategoryStore();

  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);
  const fileKeyRef = useRef<string>("");

  const methods = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
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

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsSuccessfullySubmitted(true);
      let response: AppResponse;

      if (isEditing && initialData) {
        response = await updateCategory(initialData.id, data) as AppResponse;
      } else {
        response = await createCategory(data) as AppResponse;
      }

      if (response.success) {
        toast.success(response.message || `Category ${isEditing ? 'updated' : 'added'} successfully!`);
        if (onSuccess) onSuccess();
        if (!isEditing) reset();
      } else {
        setIsSuccessfullySubmitted(false);
        toast.error(response.error || "Operation failed");
      }
    } catch (error) {
      setIsSuccessfullySubmitted(false);
      toast.error("An unexpected error occurred");
      console.error("Category Form Error: ", error);
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
          label="Category Icon"
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
          label="Category Name" 
          placeholder="e.g. Electronics" 
        />

        <FormInput 
          textArea
          name="description"
          label="Description" 
          placeholder="Brief details about this category" 
        />

        <div className="flex items-center justify-between p-2 border rounded-md px-4 bg-white shadow-sm">
          <div className="space-y-0.5">
            <FieldLabel className="text-sm">Category Status</FieldLabel>
            <p className="text-xs text-gray-500">Active categories are visible in the POS</p>
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
            text={isEditing ? "Update Category" : "Save Category"}
            type="submit"
            className="flex-1"
            customVariant="primary"
            icon={isEditing ? <Save className="mr-2 h-4 w-4" /> : <Layers className="mr-2 h-4 w-4" />}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </FormProvider>
  );
}