"use server"

import { getSession } from "@/lib/auths-functions";
import { getRequestMeta } from "@/lib/getRequestMeta";
import { BusinessService } from "@/lib/services/business/business-profile-service";
import { AppResponse } from "@/types/auth/auth";
import { BusinessProfileInput } from "@/types/schema/business-profile.schema";
import { revalidatePath } from "next/cache";

export async function updateBusinessProfileAction(data: BusinessProfileInput) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

      const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId} = session;
   

    const response = await BusinessService.updateBusinessProfileService(data, businessId, userId, ipAddress);
    if (response.success) {       
        revalidatePath(`/settings`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}
