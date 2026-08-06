import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth/auth";
import { Product, ProductsVariants } from "@/types/schema/inventory";
import { ProductFormValues } from "@/types/schema/inventory.schema";
import { toast } from "sonner";

type ProductStore = {
    products: Product[] | null;
    productsVariants: ProductsVariants[] | null;
    productsShopsVariants: ProductsVariants[] | null;
    loading: boolean;
    fetchProducts: () => Promise<void>;
    // fetchProductById: (productId: string) => Promise<Product | null>;
    fetchProductsVariant: () => Promise<void>;
    fetchProductsVariantByShop: () => Promise<void>;
    toggleProductStatusLocal: (productId: string)=>void;
    createProduct: (data: ProductFormValues) => Promise<AppResponse>;
    updateProduct: (productId: string, data: ProductFormValues) => Promise<AppResponse>;
    toggleProductStatus: (productId: string, currentStatus: boolean) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
    products: null,
    loading: false,
    productsVariants: null,
    productsShopsVariants: null,

    toggleProductStatusLocal : (productId: string)=> set((state)=> ({
        products: state.products?.map((p)=>
            p.id === productId ? {...p, isActive: !p.isActive} : p
        )
    })),

    fetchProducts: async () => {
        try {
            set({ loading: true });
            const response = await apiClient.get("/business/products");
            set({
                products: response.data.products as Product[],
                loading: false
            });
        
        } catch (error) {
            console.log("Error fetching products: ", error);
            set({ products: null, loading: false });
        }
    },

    fetchProductsVariant: async () => {
        try {
            set({ loading: true });
            const response = await apiClient.get("/business/products/variants");
            set({
                productsVariants: response.data.productsVariants as ProductsVariants[],
                loading: false
            });
        } catch (error) {
            console.log("Error fetching products: ", error);
            set({ productsVariants: null, loading: false });
        }
    },    
    fetchProductsVariantByShop: async () => {
        try {
            set({ loading: true });
            const response = await apiClient.get("/business/shops/products");
            set({
                productsShopsVariants: response.data.productsVariants as ProductsVariants[],
                loading: false
            });
        } catch (error) {
            console.log("Error fetching products: ", error);
            set({ productsVariants: null, loading: false });
        }
    },

    createProduct: async (data: ProductFormValues) => {
        set({ loading: true });
        try {
            const response = await apiClient.post("/business/products", data);
            if (response.data.success) {
                await get().fetchProducts();
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    status: response.status
                } as AppResponse;
            }
            set({ loading: false });
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error creating product";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    updateProduct: async (productId: string, data: ProductFormValues) => {
        set({ loading: true });
        try {
            const response = await apiClient.patch(`/business/products/${productId}`, data);
            if (response.data.success) {
                await get().fetchProducts();
                toast.success(response.data.message || "Product updated successfully");
                return {
                    success: true,
                    message: response.data.message || "Product updated successfully",
                    status: response.status
                } as AppResponse;
            }
            set({ loading: false });
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error updating product";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    toggleProductStatus: async (productId: string, currentStatus: boolean) => {
        try {
            const response = await apiClient.patch(`/business/products/${productId}`, {
                isActive: !currentStatus
            });

            if (response.data.success) {
                // Update local state
                set((state) => ({
                    products: state.products
                        ? state.products.map((prod) => prod.id === productId ? { ...prod, isActive: !currentStatus } : prod)
                        : null,
                }));
                toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
            }
        } catch (error: unknown) {
            toast.error("Failed to update product status");
            console.log(error);
        }
    },

    deleteProduct: async (productId: string) => {
        try {
            const response = await apiClient.delete(`/business/products/${productId}`);

            if (response.data.success) {
                set((state) => ({
                    products: state.products
                        ? state.products.filter((prod) => prod.id !== productId)
                        : null,
                }));
                toast.success("Product deleted successfully");
            }
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                const message = error.response?.data?.error || "Cannot delete product with transaction history";
                toast.error(message);
            } else {
                toast.error("Cannot delete product with transaction history");
            }
        }
    },
}));