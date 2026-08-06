"use client"
import { useEffect } from 'react'
import AddProductPageForm from './AddProductPageForm'
import { useCategoryStore } from '@/store/categoryStore';
import { useBrandStore } from "@/store/brandStore";
import { useShopStore } from '@/store/shopStore';

export default function AddProductPage() {
  const {fetchCategories, categories} = useCategoryStore();
  const {fetchBrands, brands} = useBrandStore();
  const {shops, fetchShops} = useShopStore();
  useEffect(()=>{
    fetchCategories();
    fetchBrands();
    fetchShops();
  },[fetchBrands, fetchCategories,fetchShops])

  //GETTING NAMES OF PRESENT SHOPS AND IDS:
  const shopOptions: { id: string; name: string }[] =
  shops.map((shop) => ({
    id: shop.id,
    name: shop.name,
  }));

  return (
    <div>
        <AddProductPageForm
          categories={categories || []}
          brands={brands || []}
          shops={shopOptions|| []}
        />
    </div>
  )
}

