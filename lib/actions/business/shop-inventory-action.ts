"use server"

import { getSession } from "@/lib/auths-functions";
import { getRequestMeta } from "@/lib/getRequestMeta";
import { InventoryService } from "@/lib/services/business/shopInventory.service";
import { AppResponse } from "@/types/auth/auth";
import { BulkRestockPayload } from "@/types/schema/inventory.schema";
import { revalidatePath } from "next/cache";

export async function restockInventoryAction(payload: BulkRestockPayload) {
    
    const session = await getSession();
    // 1. Check Session
    if(!session || typeof session === "string") {
        return { success: false, error: "Unauthorized session"} as AppResponse;
    }

      const { ipAddress } = await getRequestMeta();

    // We get the current user's details from the session
    const { userId, businessId, employeeId } = session;
   

    const response = await InventoryService.restockInventory(
        payload,
        employeeId || "",
        userId,
        businessId,
        ipAddress,
    );

    if (response.success) {       
        revalidatePath(`/inventory`, 'layout');
        return {message: response.message, success:response.success, data: response.data};
    }else {
        return {error: response.error, success: response.success};
    }
}
