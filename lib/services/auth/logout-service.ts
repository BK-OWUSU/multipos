import { prisma } from "@/lib/dbHelper";
import { AppResponse, JwtPayload } from "@/types/auth/auth";

export class LogoutService {
    static async logout( session: JwtPayload): Promise<AppResponse> {

        if (!session || typeof session === "string") {
                return { error: "User already logout", success: false ,status: 401 } as AppResponse;
        }

        const {sessionLogId, userId, businessId} = session; 

        await prisma.userSessionLog.update({
            where: {id: sessionLogId},
            data: {
                userId: userId,
                businessId: businessId,
                logoutAt: new Date(),
                reason: "User Logout"
            } 
        })

    return {success: true, message: "Logged out successfully" , status: 200 }
    }


     static async logoutExpiration( sessionLogId: string, userId: string, businessId: string,reason: string): Promise<AppResponse> {
 
        await prisma.userSessionLog.update({
            where: {id: sessionLogId},
            data: {
                userId: userId,
                businessId: businessId,
                logoutAt: new Date(),
                reason: reason
            } 
        })

        return {success: true, message: "Logged out successfully" , status: 200 }
    }

}