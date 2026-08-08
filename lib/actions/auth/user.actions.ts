"use server"

import { getSession } from "@/lib/auths-functions";
import { getRequestMeta } from "@/lib/getRequestMeta";
import { UserService } from "@/lib/services/auth/user-service";
import { AppResponse } from "@/types/auth/auth";
import { PasswordChangeInput } from "@/types/schema/auth.schema";
import { revalidatePath } from "next/cache";



export async function changePasswordAction(id: string, data: PasswordChangeInput) {
 const session = await getSession();
  if (!session || typeof session === "string") {
    return { success: false, error: "Unauthorized session" } as AppResponse;
  }

  const { ipAddress, userAgent } = await getRequestMeta();

  // const response = await UserService.changePassword(id, userId, facilityId || "", ipAddress, userAgent)
  const response = await UserService.changePassword(id, data, ipAddress, userAgent)

  if (response.success) {
    revalidatePath(`/account/profile`, "layout");
    return { message: response.message, success: response.success};
  } else {
    return { error: response.error, success: response.success };
  }
}