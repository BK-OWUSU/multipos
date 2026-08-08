import { hashPassword, verifyPassword } from "@/lib/auths-functions";
import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { PasswordChangeInput, passwordChangeSchema } from "@/types/schema/auth.schema";




export class UserService {

  static async  changePassword(
    userId: string, 
    data: PasswordChangeInput,
    businessId: string,
    ipAddress?: string,
  ): Promise<AppResponse> {
    const result = passwordChangeSchema.safeParse(data);
    if (!result.success) {
      return { success: false, error: "Invalid form data." };
    }
  
    try {
    //   const user = await prisma.user.findUnique({ where: { id: userId } });
       const user = await prisma.user.findFirst({
        where: { 
          id: userId,
          employee: { businessId: businessId } 
        },
        include: {
          employee: {include: { business: true, role: true }},
        }
      });

      if (!user || !user.employee) {
        throw new Error("User or Employee record not found.");
      }

      
      if (!user) {
        return { success: false, error: "User not found." };
      }
  
      // Verify current password
      const isValidPassword = await verifyPassword(data.currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Incorrect current password." };
      }
  
      // Hash new password
      const hashedPassword = await hashPassword(data.newPassword)
  
      await prisma.$transaction(async (tx) => {
        // Update user record and clear the forced password change flag
        await tx.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            needsPasswordChange: false,
          },
        });

         // Record security audit event
 // 3. Audit Log - using user.employee.businessId
      await tx.auditLog.create({
        data: {
          action: "PASSWORD_UPDATE",
          entity: "USER",
          entityId: userId,
          userId: userId,
          ipAddress: ipAddress,
          businessId: businessId,
          newValue: "User completed complete password reset",
          oldValue: "***SENSITIVE***",
          details: `User, ${user.employee.firstName} ${user.employee.lastName} changed password successfully.`
        }
      });

    
      })
      return { success: true, message: "Password updated successfully." };
    } catch (error) {
      console.error("Error updating password:", error);
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }
}