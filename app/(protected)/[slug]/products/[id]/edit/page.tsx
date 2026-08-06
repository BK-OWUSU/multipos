"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Product } from "@/types/schema/inventory";
import EditProductForm from "../../EditProductForm";
import { EditProductFormValue } from "@/types/schema/inventory.schema";
import { getProductByIdAction, updateSingleProductAction } from "@/lib/actions/business/productsActions";
import { useShopStore } from "@/store/shopStore";
import { useCategoryStore } from "@/store/categoryStore";
import { useBrandStore } from "@/store/brandStore";
import { AppResponse } from "@/types/auth/auth";
import { useAuthStore } from "@/store/useAuthStore";



export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const user = useAuthStore((state)=> state.user);
  const productListPath = `/${user?.business.slug}/products/product-list`

  // 1. Pull Global State Assets & Fetch Methods from your Zustand Stores
  const { fetchShops, shops } = useShopStore();
  const { fetchCategories, categories } = useCategoryStore();
  const { fetchBrands, brands } = useBrandStore();

  // 2. Only retain local state for the product row profile being loaded
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // 3. Mount Pipeline Synchronizer
  useEffect(() => {
    async function loadPageData() {
      try {
        setLoading(true);
        
        const productRes = await getProductByIdAction(productId) as AppResponse;

        if (!productRes.success || !productRes.data) {
        toast.error("Failed to fetch product profiles.");
        router.push("/products");
        return;
        }

        // 2. Load lookups concurrently into Zustand background layers 
        await Promise.all([
        fetchShops(),
        fetchCategories(),
        fetchBrands()
        ]);

        // 3. Mount target data into your state
        setProduct(productRes.data as Product);
            } catch (err) {
                console.error("Initialization error:", err);
                toast.error("An error occurred while loading dependencies.");
            } finally {
                setLoading(false);
            }
        }

            if (productId) loadPageData();
        }, [productId, router, fetchShops, fetchCategories, fetchBrands]);

        // 4. Central Mutation Save Endpoint Handler
        const handleProductUpdate = async (formData: EditProductFormValue) => {
            // 1. Create the promise variable WITHOUT using 'await' up front
            const updatePromise = updateSingleProductAction(productId, formData);
            
            // 2. Pass the raw promise directly into toast.promise
            toast.promise(updatePromise, {
            loading: "Updating product configurations...",
            success: (response) => {
                if (!response.success) {
                throw new Error(response.error || "Failed to update product structural blueprint.");
                }
                return response.message || "Product structures successfully synchronized.";
            },
            error: (err) => {
                console.error("Mutation Sync Error:", err);
                return err.message || "Could not synchronize variant settings.";
            },
            });
            // 3. Await the promise to handle downstream navigation on success
            try {
            const response = await updatePromise;
            // 👇 Only navigate if the server explicitly flags a successful operation
            if (response.success) {
                router.push(productListPath);
            }
            } catch (e) {
            // Fail silently here because our toast.promise error configuration handles the visual feedback
            console.log("Navigation held back due to mutation rejection:", e);
            }
        };

    if (loading) {
        return (
        <div className="flex items-center justify-center min-h-100 text-sm text-muted-foreground">
            Loading product matrix channels...
        </div>
        );
    }

  if (!product) return null;

  return (
    <div className="p-6 md:p-10">
      <EditProductForm
        initialProductData={product}
        categories={categories || [] }
        brands={brands || []}
        shops={shops}
        onSave={handleProductUpdate}
        onCancel={() => router.push(productListPath)}
      />
    </div>
  );
}