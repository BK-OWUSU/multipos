"use client";

import { useForm, FormProvider, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/types/schema/inventory.schema";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { Package, Save, X, Plus, Info, Trash2, Wand2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ImageSection } from "@/components/reusables/ImageSection";
import { useEffect, useState } from "react";
import CustomButton from "@/components/reusables/CustomButton";
import { useProductStore } from "@/store/productsStore";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { UploadButton } from "@/utils/uploadthing";
import { GenericModal } from "@/components/reusables/GenericModal";
import CategoryForm from "../categories/AddCategoryForm";
import { useCategoryStore } from "@/store/categoryStore";
import BrandForm from "../brands/AddBrandForm";
import { useBrandStore } from "@/store/brandStore";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { Can } from "@/components/reusables/security/Can";
import { PERMISSIONS } from "@/lib/accessAndPermissionsDef";

interface AddProductPageFormProps {
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
  shops: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}


export default function AddProductPageForm({ 
  categories = [], 
  brands = [],
  shops = [], 
  onSuccess, 
  onCancel 
}: AddProductPageFormProps) {
  //Stores
  const { createProduct } = useProductStore();
  const {fetchCategories} = useCategoryStore();
  const {fetchBrands} = useBrandStore();
  //States
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [trackBranchStock, setTrackBranchStock] = useState(false);
  

  //FIXED: Default values now precisely match our root-level attribute schema
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      baseSku: "",
      categoryId: "none",
      brandId: "none",
      hasVariant: false,
      isActive: true,
      attributes: [], // Managed via append button
      variants: [{
        sku: "",
        barcode: "", 
        costPrice: undefined,
        sortOrder: 0, 
        price: undefined, 
        shopInventories: [
        { shopId: "", stock: undefined, lowStockAlert: 5 }
      ],
        length: null, 
        width: null, 
        height: null, 
        weight: null, 
        isActive: true,
        imageUrl: "",
        fileKey: "",
        options: []
      }],
    },
  });
  
  const { formState: { isSubmitting }, control, handleSubmit, setValue, reset, getValues } = methods;

  const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray<ProductFormValues>({
    control,
    name: "attributes",
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray<ProductFormValues>({
    control,
    name: "variants",
  });

  // 👇 TRACK INDIVIDUAL FIELDS INSTEAD OF THE ENTIRE FORM
  const hasVariant = useWatch({ control, name: "hasVariant" });
  const baseSku = useWatch({ control, name: "baseSku" });
  const attributes = useWatch({ control, name: "attributes" }) || [];
  const variants = useWatch({ control, name: "variants" }) || [];


  // Temporary local state array to capture comma-separated token values per row index
  const [predefinedState, setPredefinedState] = useState<Record<number, string[]>>({});

  useEffect(() => {
    return () => {
      if (uploadedFileKey && !isSuccessfullySubmitted) {
        fetch("/api/uploadthing/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey: uploadedFileKey }),
          keepalive: true,
        }).catch(console.error);
      }
    };
  }, [uploadedFileKey, isSuccessfullySubmitted]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      console.log(data)
      setIsSuccessfullySubmitted(true);
      const response = await createProduct(data);

      if (response.success) {
        toast.success(response.message || "Product added successfully!");
        setUploadedFileKey(null);
        setPredefinedState({});
        reset();
        if (onSuccess) onSuccess();
      } else {
        setIsSuccessfullySubmitted(false);
        toast.error(response.error || "Failed to add product");
      }
    } catch (error) {
      setIsSuccessfullySubmitted(false);
      toast.error("An unexpected error occurred");
      console.error("Error Creating Product: ", error);
    }
  };

  // Generates variations combining local state map references safely
  const generateVariants = () => {
  const currentValues = getValues() as ProductFormValues;
  const rawAttributes = currentValues.attributes || [];
  const baseSku = currentValues.baseSku || "PROD";

  if (rawAttributes.length === 0) {
    toast.error("Please add at least one attribute rule first.");
    return;
  }

  // 1. Map attribute names by tracking the row context index
  const validAttributes = rawAttributes
    .map((attr, idx) => ({ name: attr.name?.trim(), originalIndex: idx }))
    .filter((attr) => Boolean(attr.name));

  if (validAttributes.length === 0) {
    toast.error("Attribute names cannot be empty.");
    return;
  }

  // 2. Build configuration option matrices using your local tags state
  const groupedValues: Record<string, string[]> = {};
  const attributeLists: string[][] = [];
  const uniqueNames: string[] = [];

  validAttributes.forEach((attr) => {
  const attrName = attr.name!;
  
  // Extract values directly from React Hook Form state 
  const rawValuesString = currentValues.attributes?.[attr.originalIndex]?.matrixSplitValues || "";
  const localTags = rawValuesString ? rawValuesString.split(",").map(v => v.trim()) : [];
  
  groupedValues[attrName] = Array.from(new Set(localTags));
  
  if (groupedValues[attrName].length === 0) {
    groupedValues[attrName] = ["Standard"];
  }

  attributeLists.push(groupedValues[attrName]);
  uniqueNames.push(attrName);
});

  // 3. Mathematical reduction logic computing Cartesian variants
  const cartesian = (arrays: string[][]) => {
    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
      [[]]
    );
  };

  const valueCombinations = cartesian(attributeLists);

  // 4. Map back onto your strict productVariantSchema shape arrays
 const generatedVariants = valueCombinations.map((combo, variantIdx) => {
  const options = combo.map((value, idx) => ({
    attributeName: uniqueNames[idx],
    attributeValueId: null,
    value: value,
  }));

  const skuSuffix = combo.join("-").toUpperCase().replace(/\s+/g, "");
  
  return {
    sku: `${baseSku.toUpperCase()}-${skuSuffix}`,
    barcode: null,
    price: undefined,
    costPrice: undefined,
   shopInventories: shops.map(shop => ({
      shopId: shop.id,
      stock: undefined,
      lowStockAlert: 5
    })),
    weight: null,
    length: null,
    width: null,
    height: null,
    isActive: true,
    sortOrder: variantIdx,
    options,
    imageUrl: "",
    fileKey: "",
  };
});

  // 5. Instantly flash onto your grid view
  setValue("variants", generatedVariants);
  toast.success(`Successfully generated ${generatedVariants.length} variants!`);
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
  if (e.key === ',' || e.key === 'Enter') {
    e.preventDefault();
    const val = e.currentTarget.value.trim();
    if (val) {
      // Get current tag list for this specific attribute row or default to empty array
      const currentTags = predefinedState[index] || [];     
      // Prevent duplicate tags within the same attribute row
      if (!currentTags.includes(val)) {
        const updatedTags = [...currentTags, val];
        setPredefinedState((prev) => ({
          ...prev,
          [index]: updatedTags,
        }));
        //Sync with React Hook Form state 
        setValue(`attributes.${index}.matrixSplitValues`, updatedTags.join(","));
      }   
      // Clear input bar for the next tag entry
      e.currentTarget.value = ""; 
    }
  }
};

const removeTag = (rowIndex: number, tagValue: string) => {
  const updatedTags = (predefinedState[rowIndex] || []).filter((t) => t !== tagValue);
  // 1. Update local UI state
  setPredefinedState((prev) => ({
    ...prev,
    [rowIndex]: updatedTags,
  }));
  // 2. Sync with React Hook Form state 
  setValue(`attributes.${rowIndex}.matrixSplitValues`, updatedTags.join(","));
};

// Simple helper fallback used by the "Add Manually" button if needed
const addVariantManually = () => {
  const currentBaseSku = getValues("baseSku");
  appendVariant({
   sku: currentBaseSku ? `${currentBaseSku.toUpperCase()}-CUSTOM` : "PROD-CUSTOM",
    barcode: null,
    price: undefined,
    costPrice: undefined,
   shopInventories: shops.map(shop => ({
      shopId: shop.id,
      stock: undefined,
      lowStockAlert: 5
    })),
    weight: null,
    length: null,
    width: null,
    height: null,
    isActive: true,
    sortOrder: variantFields.length,
    options: [],
    imageUrl: "",
    fileKey: "",
  });
};

// Auto-clear or reset branch inventory metrics when tracking is toggled off
useEffect(() => {
  const currentVariants = getValues("variants") || [];
  if (!trackBranchStock) {
    // Reset all generated variant inventories to empty arrays or base defaults
const clearedVariants = currentVariants.map(v => ({
        ...v,
        shopInventories: [] // Clears out tracking requirements entirely
      }));
    setValue("variants", clearedVariants);
  } else {
  // Re-initialize branch mappings if turned back on
      const restoredVariants = currentVariants.map(v => ({
        ...v,
        shopInventories: v.shopInventories?.length ? v.shopInventories : shops.map(shop => ({
          shopId: shop.id,
          stock: undefined,
          lowStockAlert: 5
        }))
      }));
      setValue("variants", restoredVariants);
  }
}, [trackBranchStock, shops, setValue, getValues]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-[90vw] mx-auto space-y-6 pb-10">
        
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-white py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
            <p className="text-sm text-gray-500">Create a new product with variants and attributes</p>
          </div>
          <div className="flex items-center gap-3">
            <CustomButton 
              text="Cancel"
              icon={<X className="h-4 w-4 mr-2" />}
              type="button" 
              customVariant="primary-outline"
              onClick={() => {
                reset();
                setPredefinedState({});
                if (uploadedFileKey) {
                  deleteUTFile(uploadedFileKey)
                }
                if (onCancel) onCancel();
              }}
            />
            <CustomButton
              text="Save Product"
              type="submit"
              customVariant="primary"
              icon={<Save className="h-4 w-4 mr-2" />}
              isLoading={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Basic Information */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center text-sm">1</span>
                Product Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormInput name="name" label="Product Name *" type="text" placeholder="Enter product name"/>
                </div>
                <div className="space-y-2">
                  <FormInput 
                    type="text"
                    hintText="Used to generate variant SKUs" 
                    name="baseSku" 
                    label="SKU (Prefix) *" 
                    placeholder="e.g., TEE"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FormInput textArea name="description" label="Description" placeholder="Enter product description (optional)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <FormInput
                      label="Category"
                      name="categoryId"
                      select
                      options={categories}
                      selectDefaultValue="Uncategorized"
                    />
                    <Can permission={PERMISSIONS.categories.CREATE}>
                      <GenericModal
                        header="Add Category"
                        description="Create a new category to organize your products."
                        isOpen={isCategoryModalOpen}
                        onOpenChange={setIsCategoryModalOpen}
                        triggerBtn={
                          <CustomButton
                            className="self-baseline-last py-4 shadow-md hover:shadow-lg transition-all"
                            customVariant="primary"
                            text="Add" 
                            icon={<Plus className="w-4 h-4 mr-2" />} 
                          />
                        }
                      >
                        <CategoryForm 
                          onSuccess={() =>{ 
                            setIsCategoryModalOpen(false)
                            fetchCategories();
                          }}
                          onCancel={()=>setIsCategoryModalOpen(false)} 
                          />
                      </GenericModal>  
                    </Can>   
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <FormInput
                      label="Brand"
                      name="brandId"
                      select
                      options={brands}
                      selectDefaultValue="No Brand"
                    />
                    <Can permission = {PERMISSIONS.brands.CREATE}>
                       <GenericModal
                          header="Add Brand"
                          description="Create a new brand label for your product inventory."
                          isOpen={isBrandModalOpen}
                          onOpenChange={setIsBrandModalOpen}
                          triggerBtn={
                            <CustomButton
                              className="self-baseline-last py-4 shadow-md hover:shadow-lg transition-all"
                              customVariant="primary"
                              text="Add" 
                              icon={<Plus className="w-4 h-4 mr-2" />} 
                            />
                          }
                        >
                        <BrandForm 
                        onSuccess={() => {
                          setIsBrandModalOpen(false);
                          fetchBrands();
                        }} 
                        onCancel={() => setIsBrandModalOpen(false)} />
                      </GenericModal>
                    </Can>
                  </div>
                </div>
              </div>
              {/* PRODUCT CONFIGURATION PANEL */}
              <div className="pt-6 border-t mt-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Product Configuration Options
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Option 1: Variants */}
                  <div className="flex items-start justify-between p-4 bg-gray-50/60 rounded-xl border border-gray-100 transition-all hover:bg-gray-50">
                    <div className="space-y-0.5 pr-4">
                      <label htmlFor="hasVariant-toggle" className="text-sm font-medium text-gray-900 cursor-pointer block">
                        Product Has Variants
                      </label>
                      <span className="text-xs text-gray-500 block leading-normal">
                        Enable if your product comes in multiple sizes, colors, or configurations.
                      </span>
                    </div>
                    <Controller
                      control={control}
                      name="hasVariant"
                      render={({ field }) => (
                        <Switch 
                          id="hasVariant-toggle"
                          className="mt-0.5"
                          checked={field.value} 
                          onCheckedChange={(checked)=>{
                            // 1. Let React Hook Form know the value changed
                            field.onChange(checked);
                            // 2. Clear state cleanly in the user action handler instead of an effect!
                            if (!checked) {
                              setValue("attributes", []);
                              
                              // Clear your local state safely here!
                              setPredefinedState({}); 
                              
                              // Get current baseSku value safely on-the-fly
                              const currentBaseSku = getValues("baseSku") || "";

                              setValue("variants", [{
                                sku: currentBaseSku,
                                barcode: "", 
                                costPrice: undefined, 
                                price: undefined, 
                                shopInventories: shops.map(shop => ({
                                  shopId: shop.id,
                                  stock: undefined,
                                  lowStockAlert: 5
                                })),
                                sortOrder: 0,
                                length: null, 
                                width: null, 
                                height: null, 
                                weight: null, 
                                isActive: true,
                                imageUrl: "",
                                fileKey: "",
                                options: []
                              }]);
                            }
                          }} 
                        />
                      )}
                    />
                  </div>

                  {/* Option 2: Stock Tracking (UPDATED TEXT) */}
                  <div className="flex items-start justify-between p-4 bg-gray-50/60 rounded-xl border border-gray-100 transition-all hover:bg-gray-50">
                    <div className="space-y-0.5 pr-4">
                      <label htmlFor="trackStock-toggle" className="text-sm font-medium text-gray-900 cursor-pointer block">
                        Assign Multi-Branch Inventory
                      </label>
                      <span className="text-xs text-gray-700 block font-medium leading-normal">
                        Enable if you want to assign stocks to shops during initial products creation.
                      </span>
                      <span className="text-[11px] text-amber-600 block font-medium pt-0.5">
                        Note: Shops must exist before proceeding.
                      </span>
                    </div>
                    <Switch 
                      id="trackStock-toggle"
                      checked={trackBranchStock} 
                      onCheckedChange={(checked) => setTrackBranchStock(checked)} 
                      className="mt-0.5"
                    />
                  </div>

                </div>
              </div>
            </section>

           {hasVariant ? (
            <>      
            {/* 2. Attributes Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <h3 className="text-sm font-medium">Product Attributes Setup</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendAttribute({ name: "", sortOrder: attributeFields.length, matrixSplitValues: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Attribute Group
                </Button>
              </div>

              {attributeFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-white shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    
                    {/* Attribute Name Group (e.g., Size) */}
                    <div>
                      <FormInput
                       label="Attribute Name"
                       labelClassName="text-xs font-medium text-gray-500 block mb-1"
                       name={`attributes.${index}.name`}
                       placeholder="e.g., Color, Size"
                      />
                    </div>

                    {/* Matrix Tag Field Entry */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">
                        Matrix Split Values (Press Enter or Comma)
                      </label>
                      
                      {/* Dynamic Badges Block container */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(predefinedState[index] || []).map((tag) => (
                          <Badge key={tag} className="flex items-center gap-1 bg-blue-200 text-gray-800 hover:bg-gray-200 border text-xs py-0.5">
                            {tag}
                            <button
                            className="h-3 w-3 cursor-pointer hover:bg-white"
                             onClick={(e) => {
                                e.preventDefault();  
                                e.stopPropagation();
                                removeTag(index, tag);
                              }}
                            >
                              <X className="h-3 w-3 cursor-pointer text-gray-500 hover:text-red-500"
                            />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      <Input
                        type="text"
                        placeholder="Type values (e.g. Blue) and press Enter"
                        onKeyDown={(e) => handleKeyDown(e, index)} 
                      />
                    </div>

                    {/* Sort Layout Actions */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 block mb-1">Sort Order</label>
                        <Controller
                          control={control}
                          name={`attributes.${index}.sortOrder`}
                          render={({ field }) => (
                            <Input 
                              type="number" 
                              value={field.value} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                            />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeAttribute(index);
                          // Clean up state references if row is cleared
                          setPredefinedState((prev) => {
                            const updated = { ...prev };
                            delete updated[index];
                            return updated;
                          });
                        }}
                        className="text-red-500 hover:text-red-600 self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                  </div>
                </div>
              ))}
            </section>

            {/* 4. Variants Matrix */}
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center text-sm">4</span>
                  Variants SKU Matrix
                </h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateVariants}
                    disabled={attributes.length === 0}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Variants
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariantManually}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <Info className="h-4 w-4 inline mr-2" />
                Configure unique SKUs, retail pricing points, barcodes, dimensions, and tracking logic per variation.
              </div>

              {variantFields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900">No variants generated yet</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Image</TableHead>
                        <TableHead>SKU *</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Options</TableHead>
                        <TableHead>{<CurrencyFormatter.Header title="Price"/>}</TableHead>
                        <TableHead>{<CurrencyFormatter.Header title="Cost"/>}</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead className="w-48">Dimensions (L x W x H cm)</TableHead>
                        {trackBranchStock && (
                        <>
                          <TableHead>Stock QTY Per-Shop</TableHead>
                          <TableHead>Alert Limit</TableHead>
                        </>
                        )}
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variantFields.map((field, index) => (
                        <TableRow key={field.id}>
                          {/* 1. Variant Image Drop/Upload */}
                          <TableCell>
                            <div className="relative w-16 h-16 bg-gray-50 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer group hover:bg-gray-100 overflow-hidden">
                              {variants?.[index]?.imageUrl ? (
                                <>
                                  <Image 
                                    src={variants?.[index]?.imageUrl || ""} 
                                    alt="Variant" 
                                    className="w-full h-full object-cover"
                                    width={56}
                                    height={56}
                                  />
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const currentKey = variants?.[index]?.fileKey;
                                      
                                      // Proactively remove the file from your UploadThing server
                                      if (currentKey) {
                                        deleteUTFile(currentKey)
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
                                    endpoint="imageUploader" // 🚀 Match your exact core.ts route key name
                                    onClientUploadComplete={(res) => {
                                      if (res?.[0]) {
                                        setValue(`variants.${index}.imageUrl`, res[0].ufsUrl);
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
                          </TableCell>

                          {/* 2. SKU */}
                          <TableCell>
                            <Controller
                              control={control}
                              name={`variants.${index}.sku`}
                              render={({ field }) => (
                                <Input {...field} placeholder="SKU" className="w-32 text-xs" />
                              )}
                            />
                          </TableCell>

                          {/* 3. Barcode */}
                          <TableCell>
                            <FormInput
                              className="w-28 text-xs"
                              name={`variants.${index}.barcode`}
                              placeholder="Barcode/UPC"
                              />
                          </TableCell>

                          {/* 4. Variant Attributes/Options */}
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-37.5">
                              {variants?.[index]?.options?.map((opt, optIdx) => (
                                <Badge key={optIdx} variant="outline" className="text-[10px] whitespace-nowrap">
                                  {opt.attributeName}: {opt.value}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>

                          {/* 5. Price */}
                          <TableCell>
                            <Controller
                              control={control}
                              name={`variants.${index}.price`}
                              render={({ field }) => (
                                <Input 
                                  {...field} 
                                  type="number"
                                  value={field.value ?? ""}
                                  step = "0.01" 
                                  placeholder="0.00"
                                  className="w-20 text-xs"
                                 onChange={(e) => {
                                  const val = e.target.value;
                                  // If the input is empty, pass an empty string so it stays blank, otherwise parse it
                                  field.onChange(val === "" ? "" : parseFloat(val) || 0);
                                }}
                                />
                              )}
                            />
                          </TableCell>

                          {/* 6. Cost Price */}
                          <TableCell>
                            <Controller
                              control={control}
                              name={`variants.${index}.costPrice`}
                              render={({ field }) => (
                                <Input 
                                  {...field} 
                                  type="number"
                                  value={field.value ?? ""}
                                  step = "0.01"  
                                  placeholder="0.00"
                                  className="w-20 text-xs"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    // If the input is empty, pass an empty string so it stays blank, otherwise parse it
                                    field.onChange(val === "" ? "" : parseFloat(val) || 0);
                                  }}
                                />
                              )}
                            />
                          </TableCell>

                          {/* 9. Weight */}
                          <TableCell>
                            <Controller
                              control={control}
                              name={`variants.${index}.weight`}
                              render={({ field }) => (
                                <Input 
                                  value={field.value ?? ""} 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="w-20 text-xs"
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                />
                              )}
                            />
                          </TableCell>

                          {/* 10. Dimensions Bundle (Length, Width, Height) */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Controller
                                control={control}
                                name={`variants.${index}.length`}
                                render={({ field }) => (
                                  <Input 
                                    value={field.value ?? ""} 
                                    type="number"
                                    placeholder="L" 
                                    className="w-12 text-xs px-1 text-center" 
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  />
                                )}
                              />
                              <span className="text-gray-400 text-xs">×</span>
                              <Controller
                                control={control}
                                name={`variants.${index}.width`}
                                render={({ field }) => (
                                  <Input 
                                    value={field.value ?? ""} 
                                    type="number"
                                    placeholder="W" 
                                    className="w-12 text-xs px-1 text-center" 
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  />
                                )}
                              />
                              <span className="text-gray-400 text-xs">×</span>
                              <Controller
                                control={control}
                                name={`variants.${index}.height`}
                                render={({ field }) => (
                                  <Input 
                                    value={field.value ?? ""} 
                                    type="number"
                                    placeholder="H" 
                                    className="w-12 text-xs px-1 text-center" 
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  />
                                )}
                              />
                            </div>
                          </TableCell>

                         {/* 7. Multi-Tenant Stock Allocation  */}

                      {trackBranchStock && (
                        <>   
                          <TableCell className="py-2 alignment-stock-cell">
                            <div className="space-y-2 min-w-37.5">
                              {shops.map((shop, shopIdx) => (
                                <div key={shop.id} className="flex items-center justify-between gap-2 h-7">
                                  <span className="text-[10px] text-gray-500 font-medium w-14 truncate" title={shop.name}>
                                    {shop.name}
                                  </span>
                                  <Controller
                                    control={control}
                                    name={`variants.${index}.shopInventories.${shopIdx}.stock`}
                                    render={({ field }) => (
                                      <Input 
                                        {...field} 
                                        type="number"
                                        className="w-16 h-7 text-xs px-1.5 text-right"
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    )}
                                  />
                                </div>
                              ))}
                            </div>
                          </TableCell>

                          {/* 8. Multi-Tenant Low Stock Alert Limits */}
                          <TableCell className="py-2 alignment-alert-cell">
                            <div className="space-y-2">
                              {shops.map((shop, shopIdx) => (
                                <div key={shop.id} className="flex items-center h-7">
                                  <Controller
                                    control={control}
                                    name={`variants.${index}.shopInventories.${shopIdx}.lowStockAlert`}
                                    render={({ field }) => (
                                      <Input 
                                        {...field} 
                                        type="number"
                                        className="w-16 h-7 text-xs px-1.5 text-right"
                                        placeholder="5"
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    )}
                                  />
                                </div>
                              ))}
                            </div>
                          </TableCell> 
                          </>
                          )}

                          {/* Actions */}
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVariant(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
            </>
            ) : (
           /* ── NEW DESIGN FOR SINGLE VARIANT (Simple Product View) ── */
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-6 animate-in fade-in duration-200">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <span className="bg-emerald-100 text-emerald-700 h-6 w-6 rounded-full flex items-center justify-center text-sm">2</span>
                Inventory & Pricing
              </h2>

              {/* Main split: Left side for core identifiers/pricing, Right side for location matrices */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT PANELS: Product Info & Pricing (Takes up 5 columns out of 12) */}
                <div className={trackBranchStock ? "lg:col-span-5 space-y-4" : "lg:col-span-12 space-y-4"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Product SKU *</label>
                      <Controller
                        control={control}
                        name="variants.0.sku"
                        render={({ field }) => <Input {...field} placeholder="e.g., TEE-BLK-MD" />}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Barcode / EAN</label>
                      <Controller
                        control={control}
                        name="variants.0.barcode"
                        render={({ field }) => 
                        <Input 
                          {...field} 
                          value={field.value ?? ""} 
                          placeholder="Scan or type barcode" />}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-dashed">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{<CurrencyFormatter.Header title="Price"/>}</label>
                      <Controller
                        control={control}
                        name="variants.0.price"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value ?? ""} 
                            placeholder="0.00" 
                            onChange={(e) => {
                              const val = e.target.value;
                              // If the input is empty, pass an empty string so it stays blank, otherwise parse it
                              field.onChange(val === "" ? "" : parseFloat(val) || 0);
                            }} 
                            />
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{<CurrencyFormatter.Header title="Cost Price"/>}</label>
                      <Controller
                        control={control}
                        name="variants.0.costPrice"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                             onChange={(e) => {
                              const val = e.target.value;
                              // If the input is empty, pass an empty string so it stays blank, otherwise parse it
                              field.onChange(val === "" ? "" : parseFloat(val) || 0);
                            }}  
                            />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT PANELS: Multi-Branch Distributed Tracking Grid (Takes up 7 columns out of 12) */}
                {trackBranchStock && (
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/40 p-4 rounded-xl border border-dashed">
                  {/* Branch Stock Allocation Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Branch Stock Allocations</h3>
                      <div className="space-y-2">
                        {shops.map((shop, shopIdx) => (
                          <div key={shop.id} className="border bg-white px-3 py-2 rounded-lg flex items-center justify-between gap-4 shadow-sm">
                            <span className="text-xs font-medium text-gray-700 truncate" title={shop.name}>{shop.name}</span>
                            <Controller
                              control={control}
                              name={`variants.0.shopInventories.${shopIdx}.stock`}
                              render={({ field }) => (
                                <Input type="number" className="w-20 h-8 text-right px-2" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                  {/* Low Stock Alert Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Low Stock Thresholds</h3>
                      <div className="space-y-2">
                        {shops.map((shop, shopIdx) => (
                          <div key={shop.id} className="border bg-white px-3 py-2 rounded-lg flex items-center justify-between gap-4 shadow-sm">
                            <span className="text-xs font-medium text-gray-500 truncate" title={`${shop.name} Alert`}>{shop.name} Alert</span>
                            <Controller
                              control={control}
                              name={`variants.0.shopInventories.${shopIdx}.lowStockAlert`}
                              render={({ field }) => (
                                <Input type="number" className="w-20 h-8 text-right px-2" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
              </div>)}

              </div>

              {/* SHIPPING & PHYSICAL DIMENSIONS PANEL */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Shipping & Dimensions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Weight (kg)</label>
                    <Controller
                      control={control}
                      name="variants.0.weight"
                      render={({ field }) => (
                        <Input type="number" step="0.01" value={field.value ?? ""} placeholder="0.00" onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Length (cm)</label>
                    <Controller
                      control={control}
                      name="variants.0.length"
                      render={({ field }) => (
                        <Input type="number" value={field.value ?? ""} placeholder="L" onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Width (cm)</label>
                    <Controller
                      control={control}
                      name="variants.0.width"
                      render={({ field }) => (
                        <Input type="number" value={field.value ?? ""} placeholder="W" onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Height (cm)</label>
                    <Controller
                      control={control}
                      name="variants.0.height"
                      render={({ field }) => (
                        <Input type="number" value={field.value ?? ""} placeholder="H" onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                      )}
                    />
                  </div>
                </div>
              </div>
            </section>
            )}          
           </div>

           {/* RIGHT COLUMN */}
           <div className="space-y-6">
            {!hasVariant &&
            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900">Product Image</h2>
              <ImageSection 
                control={control} 
                setValue={setValue} 
                name={`variants.${0}.imageUrl`}
                endpoint="imageUploader" 
                label="" 
                onImageUpload={(key) => {
                  setUploadedFileKey(key);
                  setValue(`variants.${0}.fileKey`, key);
                }}
                onImageRemove={() => {
                  setUploadedFileKey(null);
                   setValue(`variants.${0}.fileKey`, "");
                }}
              />
            </section>
            }

            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Product Name</span>
                  <span className="font-medium">{useWatch({ control, name: "name" }) || "-"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Base SKU</span>
                  <span className="font-medium">{baseSku || "-"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total Variants</span>
                  <span className="font-medium">{variants.length}</span>
                </div>
                {trackBranchStock && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total Shops</span>
                  <span className="font-medium">{shops.length}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Total Stock</span>
              <span className="font-medium">
                {variants.reduce((sum, v) => {
                  // Sum up the stock from all branch assignments inside this variant row
                  const variantStockTotal = v.shopInventories?.reduce((bSum, b) => bSum + (b.stock || 0), 0) || 0;
                  return sum + variantStockTotal;
                }, 0)}
              </span>
              
            </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900">Status</h2>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <RadioGroup 
                    onValueChange={(val) => field.onChange(val === "active")} 
                    value={field.value ? "active" : "inactive"}
                  >
                    <div className="flex items-center space-x-3 border p-3 rounded-lg">
                      <RadioGroupItem value="active" id="active" />
                      <label htmlFor="active" className="flex-1 cursor-pointer text-sm font-medium">Active</label>
                    </div>
                    <div className="flex items-center space-x-3 border p-3 rounded-lg">
                      <RadioGroupItem value="inactive" id="inactive" />
                      <label htmlFor="inactive" className="flex-1 cursor-pointer text-sm font-medium">Inactive</label>
                    </div>
                  </RadioGroup>
                )}
              />
            </section>
          </div>

        </div>
      </form>
    </FormProvider>
  );
}