"use server"

import { revalidatePath } from "next/cache";
import { getSession, updateSessionPayload, updateSessionShop } from "@/lib/auths-functions";
import { AppResponse } from "@/types/auth/auth";
import { EmployeeImportPayload } from '@/lib/configs/employee-config';
import { EmployeeService } from "@/lib/services/business/employee-services";
import { BulkImportResult } from "@/types/schema/bulkImport";
import { setCurrentShopInput } from "@/types/schema/shop.schema";
import { CreateEmployeeSchema, UpdateEmployeeShopsInput } from "@/types/schema/auth.schema";


export async function createEmployeeAction(payload: CreateEmployeeSchema) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    // We get the current user's details from the session
    const { userId, businessId, businessSlug, employeeId } = session;


    const response = await EmployeeService.createEmployee(payload, userId, employeeId || "", businessId)

    if (response.success && response.message) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return response;
    }else {
        return response;
    }
}

export async function createBulkEmployees(payload: { data: EmployeeImportPayload[]; [key: string]: unknown }) {
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

    const { userId, employeeId, businessId, businessSlug } = session;
    
    // 2. Call your existing service
    const response = await EmployeeService.createBulkEmployeesService(
        payload, 
        userId,
        employeeId || "", 
        businessId, 
        businessSlug
    );

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


export async function updateEmployeeAction(payload: CreateEmployeeSchema, targetEmployeeId: string) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    // We get the current user's details from the session
    const { userId, businessId, businessSlug, employeeId } = session;


    const response = await EmployeeService.updateEmployee(targetEmployeeId,payload, userId, employeeId || "", businessId)

    if (response.success && response.message) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return response;
    }else {
        return response;
    }
}


export async function deleteMultipleUser(ids: string[]) {
    const session = await getSession();

    if(!session || typeof session === "string") {
        return {success: false, error: "Unauthorized session "} as AppResponse;
    }

    const {userId, businessId, businessSlug} = session;
    
    const response = await EmployeeService.softDeleteMultipleUserService(ids, userId, businessId, businessSlug);

    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo)
        return response;
    }else {
        return response;
    } 
}

export async function toggleMultipleUser(ids: string[]) {
    const session = await getSession();

    if(!session || typeof session === "string") {
        return {success: false, error: "Unauthorized session "} as AppResponse;
    }

    const {userId, businessId, businessSlug} = session;
    
    const response = await EmployeeService.toggleBulkEmployeeStatusService(ids, userId, businessId, businessSlug);

    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo)
        return response;
    }else {
        return response;
    }
}

export async function grantEmployeeAccess(empId: string) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    const { userId, businessId, employeeId,businessSlug } = session;

    // 2. Call your existing service
    const response = await EmployeeService.grantEmployeeSystemAccess(empId, userId, employeeId || "", businessId, businessSlug);

    // 3. Handle Response
    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo);
        return response;
    } else {
        return response;
    }
   
}

export async function revokeEmployeeAccess(employeeId: string) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    const { userId, businessId, businessSlug } = session;

    // 2. Call your existing service
    const response = await EmployeeService.revokeEmployeeSystemAccess(employeeId, userId, businessId, businessSlug);

    // 3. Handle Response
    if (response.success && response.message && response.redirectTo) {
        revalidatePath(response.redirectTo);
        return response;
    } else {
        return response;
    }  
}


export async function switchCurrentShop(payload: setCurrentShopInput) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    // We get the current user's details from the session
    const { userId, businessId, employeeId, businessSlug } = session;

    const response = await EmployeeService.switchCurrentShop(
        payload, 
        employeeId || "", 
        businessId, 
        userId
    );


    // 3. Handle Response & Cache Invalidation
    if (response.success) {
        await updateSessionPayload({ 
            shopId:  response.data?.currentShopId|| "", 
            shopSlug:  response.data?.currentShopSlug || "" 
        });
        
        revalidatePath(`/${businessSlug}`, 'layout');
        return response;
    } else {
        return response;
    }
}

export async function updateEmployeeShops(payload: UpdateEmployeeShopsInput) {
    const session = await getSession();

    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await EmployeeService.updateEmployeeShops(
        payload, 
        userId,
        businessId, 
    );


    // 3. Handle Response & Cache Invalidation
    if (response.success) {
        revalidatePath(`/${businessSlug}`, 'layout');
        return response;
    } else {
        return response;
    }
}