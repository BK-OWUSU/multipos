"use server"

import { revalidatePath } from "next/cache";
import { getSession, updateSessionPayload } from "@/lib/auths-functions";
import { AppResponse } from "@/types/auth/auth";
import { getRequestMeta } from "@/lib/getRequestMeta";
import { CreateRoleInput, UpdateRoleInput } from "@/types/role.schema";
import { RoleService } from "@/lib/services/auth/role-service";
import { Role } from "@/generated/prisma/client";



export async function createRoleAction(payload: CreateRoleInput) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

    const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await RoleService.createRole(payload, { userId, businessId, ipAddress });

    if (response.success) {       
        revalidatePath(`/${businessSlug}`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}


export async function updateRoleAction(roleId: string, payload: UpdateRoleInput) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

      const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, businessSlug } = session;

    const response = await RoleService.updateRole(roleId, payload, { userId, businessId, ipAddress });

    if (response.success) {
        if(response.data) {
            const role = response.data as Role
            console.log("ROLE SESSION ACCESS VALUE UPDATED: ")
            console.log(role.access)
            await updateSessionPayload({access: role.access  }); 
        }      
        revalidatePath(`/${businessSlug}`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}