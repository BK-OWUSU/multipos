"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths-functions";
import { AppResponse } from "@/types/auth/auth";
import { ShopService } from "@/lib/services/business/shop-service";
import { CreateShopInput, UpdateShopInput } from "@/types/schema/shop.schema";






export async function createShopAction(data: CreateShopInput) {
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session", status: 400} as AppResponse;
    }
    const {businessId, userId, businessSlug} = session;

    const response = await ShopService.createShop(data ,businessId, userId);

    if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/shops`)
        return response;
    }else {
        return response;
    } 
}



export async function updateShopAction(rawData: UpdateShopInput) {
 const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session", status: 400} as AppResponse;
    }
    const {businessId, userId, businessSlug} = session;
    const shopId = rawData.id;
    const response = await ShopService.updateShop(shopId,rawData ,businessId, userId);

    if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/shops`)
        return response;
    }else {
        return response;
    } 
}