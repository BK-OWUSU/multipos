"use server"
import { cookies } from "next/headers";
import {UTApi} from "uploadthing/server"
import { POS_COOKIE_NAME, verifyPOSTokenEdge } from "../auths-functions";

const utApi = new UTApi();

export async function deleteUTFile(fileKey: string) {
   try {
    const cookieStore  = await cookies();
    const token  =  cookieStore.get(POS_COOKIE_NAME)?.value;
    if (!token) throw new Error("Unauthorized");
    
    const session  = verifyPOSTokenEdge(token);
    if (!session) throw new Error("Invalid Session");

    const response = utApi.deleteFiles(fileKey);
    return {success: true, response: response}
    
   } catch (error) {
    console.error("Delete Action Error:", error);
    return { success: false, error: "Failed to delete file" };
   }

}