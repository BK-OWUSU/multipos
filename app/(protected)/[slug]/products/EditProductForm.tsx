"use client";

import { useForm, FormProvider, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


import { FormInput } from "@/components/reusables/inputs/FormInput";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { LookUpField, Product } from "@/types/schema/inventory";
import { editProductSchema, EditProductFormValue } from "@/types/schema/inventory.schema";
import Image from "next/image";
import { UploadButton } from "@/utils/uploadthing";
import CustomButton from "@/components/reusables/CustomButton";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { deleteUTFile } from "@/lib/actions/uploadthing";

interface EditProductFormProps {
  initialProductData: Product;
  categories: LookUpField[];
  brands: LookUpField[];
  shops: { id: string; name: string }[]; // Available system shops for inventory titles
  onSave: (data: EditProductFormValue) => Promise<void>;
  onCancel: () => void;
}

export default function EditProductForm({
  initialProductData,
  categories = [],
  brands = [],
  shops = [],
  onSave,
  onCancel
}: EditProductFormProps) {
  
  // 1. Initialize Form Context
  const methods = useForm<EditProductFormValue>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: initialProductData.name || "",
      baseSku: initialProductData.baseSku || "",
      description: initialProductData.description || "",
      categoryId: initialProductData.category?.id || "",
      brandId: initialProductData.brand?.id || "",
      variants: initialProductData.variants.map((v) => {
        // Find the variant's primary image row from your Prisma array layout
        const primaryImageRecord = v.images?.find((img) => img.isPrimary) || v.images?.[0];

        return {
          id: v.id,
          sku: v.sku,
          barcode: v.barcode || "",
          price: Number(v.price) || 0,
          costPrice: Number(v.costPrice) || 0,
          isActive: v.isActive,
          sortOrder: v.sortOrder,

          weight: v.weight,
          length: v.length,
          height: v.height,
          width: v.width,

          imageUrl: primaryImageRecord ? primaryImageRecord.imageUrl : "",
          fileKey: primaryImageRecord ? primaryImageRecord.imageKey : "",
          shopInventories: shops.map((systemShop) => {
            const existingInv = v.shopInventories.find((inv) => inv.shopId === systemShop.id);
            return {
              id: existingInv?.id || "",
              shopId: systemShop.id,
              stock: existingInv ? existingInv.stock : 0,
              lowStockAlert: existingInv ? existingInv.lowStockAlert : 0,
            };
          }),
        };
      }),
    },
  });

 const { handleSubmit, control, formState: { isSubmitting }, setValue, reset } = methods;
 const watchedVariants = useWatch({
  control,
  name: "variants",
});

  // 2. Setup Field Array Hook for Top-Level Variants Loop
  const { fields: variantFields, remove: removeVariant } = useFieldArray({
    control,
    name: "variants",
  });

// Sync fresh state changes cleanly
  useEffect(() => {
    if (initialProductData && shops.length > 0) {
      reset({
        name: initialProductData.name,
        baseSku: initialProductData.baseSku,
        description: initialProductData.description,
        categoryId: initialProductData.category?.id || "",
        brandId: initialProductData.brand?.id || "",
        variants: initialProductData.variants.map((v) => {
          const primaryImageRecord = v.images?.find((img) => img.isPrimary) || v.images?.[0];
          
          return {
            id: v.id,
            sku: v.sku,
            barcode: v.barcode || "",
            price: Number(v.price) || 0,
            costPrice: Number(v.costPrice) || 0,
            isActive: v.isActive,
            sortOrder: v.sortOrder,
            
            weight: v.weight,
            length: v.length,
            height: v.height,
            width: v.width,


            imageUrl: primaryImageRecord ? primaryImageRecord.imageUrl : "",
            fileKey: primaryImageRecord ? primaryImageRecord.imageKey : "",
            shopInventories: shops.map((systemShop) => {
              const existingInv = v.shopInventories.find((inv) => inv.shopId === systemShop.id);
              return {
                id: existingInv?.id || "",
                shopId: systemShop.id,
                stock: existingInv ? existingInv.stock : 0,
                lowStockAlert: existingInv ? existingInv.lowStockAlert : 0,
              };
            }),
          };
        }),
      });
    }
  }, [initialProductData, shops, reset]);

  const onSubmitForm = async (data: EditProductFormValue) => {
    try {
      await onSave(data);
      toast.success("Product configurations updated successfully.");
    } catch (err) {
      console.error("Product Mutation Failure:", err);
      toast.error("Could not synchronize variant settings.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8 max-w-7xl mx-auto pb-12">
        
        {/* TOP COMMAND ACTION STACK BAR */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product Blueprint</h1>
              <p className="text-xs text-muted-foreground">Manage variants, pricing structures, and multi-branch stocks.</p>
            </div>
          </div>
          <CustomButton
           type="submit" 
           customVariant = "primary"
           disabled={isSubmitting}
           text={isSubmitting ? "Saving Changes..." : "Update Product Structure"}
           icon = {<Save className="mr-2 h-4 w-4" />}
          />
        </div>

        {/* SECTION 1: CORE PRODUCT DETAILS CARD */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">1. Product Meta Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput name="name" label="Product Name *" placeholder="e.g. Lacoste Classic Polo" />
            <FormInput name="skuPrefix" label="SKU (Prefix) *" placeholder="LA" />
          </div>
          <FormInput name="description" label="Product Description" placeholder="Detailed inventory item description..." textArea />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              name="categoryId" 
              label="Assigned Category *" 
              select 
              placeholder="Select structural category"
              options={categories} 
            />
            <FormInput 
              name="brandId" 
              label="Assigned Brand *" 
              select 
              placeholder="Select operational brand"
              options={brands} 
            />
          </div>
        </div>

        {/* SECTION 2: THE VARIANT DISTRIBUTION MATRIX ROW TABLE */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">2. Variants SKU Operational Matrix</h2>
            <p className="text-xs text-muted-foreground mt-1">Configure individual attributes, prices, costs, and branch level thresholds.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-250">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="p-4 w-22.5">Image</th>
                  <th className="p-4 w-40">SKU / Barcode</th>
                  <th className="p-4 w-37.5">Option Values</th>
                  <th className="p-4 w-37.5">Weight (kg)</th>
                  <th className="p-4 w-32.5">Dimensions (L x W x H cm)</th>
                  <th className="p-4 w-32.5">{<CurrencyFormatter.Header title="Price"/>}</th>
                  <th className="p-4 w-32.5">{<CurrencyFormatter.Header title="Cost"/>}</th>
                  <th className="p-4 min-w-60">Stock QTY Per-Shop Distribution</th>
                  <th className="p-4 w-20 text-center">Status</th>
                  <th className="p-4 w-15 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-slate-700">
                {variantFields.map((field, index) => {
                  // Reference the original transformed payload variant to draw custom names cleanly
                  const originalVariant = initialProductData.variants[index];
                  
                  return (
                    <tr key={field.id} className="hover:bg-slate-50/50 transition-colors align-top">

                      {/* ──CELL FOR VARIANT IMAGE PREVIEW ── */}
                      <td className="p-4">
                        <div className="relative w-16 h-16 bg-gray-50 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer group hover:bg-gray-100 overflow-hidden">
                          {watchedVariants?.[index]?.imageUrl ? (
                            <>
                              <Image
                                src={watchedVariants?.[index]?.imageUrl || ""} 
                                alt="Variant Thumbnail" 
                                className="w-full h-full object-cover"
                                width={56}
                                height={56}
                              />
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const currentKey = watchedVariants?.[index]?.fileKey;
                                  
                                  if (currentKey) {
                                    await deleteUTFile(currentKey); 
                                  }
                                  setValue(`variants.${index}.imageUrl`, "");
                                  setValue(`variants.${index}.fileKey`, "");
                                }}
                                className="absolute inset-0 bg-black/50 text-blue-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium"
                              >
                                Remove 
                              </button>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center scale-75 transform origin-center">
                              <UploadButton
                                endpoint="imageUploader"
                                onClientUploadComplete={(res) => {
                                  if (res?.[0]) {
                                    setValue(`variants.${index}.imageUrl`, res[0].ufsUrl || res[0].url);
                                    setValue(`variants.${index}.fileKey`, res[0].key);
                                    toast.success("Variant image linked!");
                                  }
                                }}
                                onUploadError={(error: Error) => {
                                  toast.error(`Upload Failed: ${error.message}`);
                                }}
                                appearance={{
                                  button: "bg-primary hover:bg-primary/90 font-medium text-[16px] w-full h-full p-1 transition-all shadow-sm border-none after:content-none before:content-none text-center disabled:bg-gray-400",
                                  container: "w-full h-full flex items-center justify-center m-0 p-0",
                                  allowedContent: "hidden" // Hides text descriptions to protect table sizing
                                }}
                                content={{
                                  button({ ready }) {
                                    if (ready) return "+ Image";
                                    return "Loading...";
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* SKU / BARCODE LAYOUT */}
                      <td className="p-4 space-y-2">
                        <FormInput name={`variants.${index}.sku`} placeholder="SKU" className="h-8 text-sm font-mono" />
                        <FormInput name={`variants.${index}.barcode`} placeholder="Barcode/UPC" className="h-8 text-xs" />
                      </td>

                      {/* DISPLAY OPTIONS CHIPS */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 pt-1">
                          {originalVariant?.variantOptions?.map((opt) => (
                            <span 
                              key={opt.valueId} 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              {opt.attributeName}: <strong className="ml-1 text-slate-900">{opt.value}</strong>
                            </span>
                          )) || <span className="text-xs text-muted-foreground italic">Standard Base Item</span>}
                        </div>
                      </td>

                      {/* PHYSICAL DIMENSIONS */}
                      <td className="p-4">
                        <FormInput type="number" step="0.01" name={`variants.${index}.weight`} placeholder="0.00" className="h-8 w-20" />
                      </td>
                      <div className="flex items-center gap-0">
                        <td className="p-4">
                          <FormInput type="number" step="0.01" name={`variants.${index}.weight`} placeholder="0.00" className="w-15 h-8 text-xs px-1 text-center"  />
                        </td>
                        <td className="p-4">
                          <FormInput type="number" step="0.01" name={`variants.${index}.width`} placeholder="0.00" className="w-15 h-8 text-xs px-1 text-center"  />
                        </td>
                        <td className="p-4">
                          <FormInput type="number" step="0.01" name={`variants.${index}.height`} placeholder="0.00" className="w-15 h-8 text-xs px-1 text-center"  />
                        </td>
                      </div>
                      
                      {/* RETAIL SELLING PRICE */}
                      <td className="p-4">
                        <FormInput type="number" step="0.01" name={`variants.${index}.price`} placeholder="0.00" className="h-8" />
                      </td>


                      {/* COST ACQUISITION PRICE */}
                      <td className="p-4">
                        <FormInput type="number" step="0.01" name={`variants.${index}.costPrice`} placeholder="0.00" className="h-8" />
                      </td>

                      {/* MULTI-SHOP INVENTORY NESTED DISTRIBUTION CELL */}
                      <td className="p-4">
                        <div className="space-y-3 bg-slate-50 p-3 rounded-md border border-slate-100">
                          {field.shopInventories?.map((shopInv, shopIndex) => {
                            // Find matching system label dynamically to render the correct location context
                            const currentShopLabel = shops.find((s) => s.id === shopInv.shopId)?.name || "Unknown Branch";
                            
                            return (
                              <div key={shopInv.id} className="grid grid-cols-12 gap-2 items-center lg:w-60">
                                <span className="col-span-4 text-xs font-semibold text-slate-600 truncate" title={currentShopLabel}>
                                  {currentShopLabel}
                                </span>
                                <div className="col-span-4">
                                  <FormInput 
                                    type="number" 
                                    name={`variants.${index}.shopInventories.${shopIndex}.stock`} 
                                    placeholder="Qty" 
                                    className="h-8 text-xs bg-white" 
                                  />
                                </div>
                                <div className="col-span-4">
                                  <FormInput 
                                    type="number" 
                                    name={`variants.${index}.shopInventories.${shopIndex}.lowStockAlert`} 
                                    placeholder="Alert" 
                                    className="h-8 text-xs bg-white" 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* ACTIVE LIFE STATE TOGGLE */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center pt-2">
                          <Controller
                            control={control}
                            name={`variants.${index}.isActive`}
                            render={({ field: switchField }) => (
                              <Switch 
                                checked={switchField.value} 
                                onCheckedChange={switchField.onChange} 
                              />
                            )}
                          />
                        </div>
                      </td>

                      {/* TRASH ACTION ACTION DELETE */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center pt-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            onClick={() => removeVariant(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {variantFields.length === 0 && (
            <div className="p-8 text-center text-muted-foreground border-t bg-slate-50/50">
              No variant configurations are registered to this database node layout.
            </div>
          )}
        </div>

      </form>
    </FormProvider>
  );
}