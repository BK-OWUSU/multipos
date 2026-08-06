"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auths-functions";
import { AppResponse } from "@/types/auth/auth";
import { BulkImportResult } from "@/types/schema/bulkImport";
import { CustomerImportPayload } from "@/lib/configs/customer-config";
import { CreateCustomerSchema } from "@/types/schema/auth.schema";
import { CustomerService } from "@/lib/services/business/customer-service";
import { getRequestMeta } from "@/lib/getRequestMeta";





export async function createSingleCustomer(data: CreateCustomerSchema) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { 
            success: false, 
            error: "Unauthorized session",
            status: 400
        } as AppResponse;
    }

    const { ipAddress } = await getRequestMeta();

    const {businessId, userId, businessSlug} = session;

    const response = await CustomerService.createCustomer(data, userId,businessId, businessSlug, ipAddress);

    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo)
        return response;
    }else {
        return response;
    } 
}

export async function createBulkCustomer(payload: { data: CustomerImportPayload[]; [key: string]: unknown }) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { 
            success: false, 
            total: 0, 
            success_count: 0, 
            failed_count: 0, 
            error: "Unauthorized session" 
        } as BulkImportResult;
    }

    const { ipAddress } = await getRequestMeta();
    const { userId, businessId, businessSlug } = session;
    
    // 2. Call your existing service
    const response = await CustomerService.createBulkCustomersService(payload,userId,businessId, businessSlug,ipAddress);

    // 3. Transform AppResponse to BulkImportResult
    if (response.success) {
        if (response.redirectTo) revalidatePath(response.redirectTo);
        
        return {
            success: true,
            total: payload.data.length,
            success_count: payload.data.length, 
            failed_count: 0,
            message: response.message
        } as BulkImportResult;
    }

    // 4. Handle Failure
    return {
        success: false,
        total: payload.data.length,
        success_count: 0,
        failed_count: payload.data.length,
        error: response.error
    } as BulkImportResult;
}


export async function deleteMultipleUser(ids: string[]) {
    const session = await getSession();

    if(!session || typeof session === "string") {
        return {success: false, error: "Unauthorized session "} as AppResponse;
    }

    const {userId, businessId, businessSlug} = session;

    const { ipAddress } = await getRequestMeta();
    
    const response = await CustomerService.softDeleteBulkCustomers(ids, userId, businessId, businessSlug,ipAddress);

    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo)
        return response;
    }else {
        return response;
    } 
}