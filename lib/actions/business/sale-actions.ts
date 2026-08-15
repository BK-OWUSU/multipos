"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths-functions";
import { AppResponse } from "@/types/auth/auth";
import { SaleService } from "@/lib/services/business/sale-service";






export async function verifyOnlinePayment(reference: string) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { 
            success: false, 
            error: "Unauthorized session",
            status: 400
        } as AppResponse;
    }

    const {
        // businessId, 
        businessSlug, 
        shopSlug,
        userId
    } 
        = session;

    const response = await SaleService.verifySalesStatusOnline(reference, userId);

    if (response.success && response.message) {
        revalidatePath(`/${businessSlug}/shops/${shopSlug}/transactions`)
        return response;
    }else {
        return response;
    } 
}

export async function getSaleByIdAction(saleId: string) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { 
            success: false, 
            error: "Unauthorized session",
            status: 400
        } as AppResponse;
    }

    const { businessId } = session;

    const response = await SaleService.getSaleById(saleId, businessId);

    if (response.success) {
        const sale = response.data;
        return {success: true, data: sale} as AppResponse;
    }else {
        return {success:false, error: "Failed to fetch Sale transaction"} as AppResponse;
    } 
}
