import { updateSessionPayload } from "@/lib/auths-functions";
import { prisma } from "@/lib/dbHelper";
import { mapUserToResponse } from "@/lib/mappers";
import { JwtPayload, UserWithRelations } from "@/types/auth/auth";

export class MeService {
  static async getCurrentUser(userId: string, businessId: string, currentJwt?: JwtPayload) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: { 
          id: userId, 
          employee: { 
            businessId: businessId,
            isActive: true, 
            isDeleted: false
          } 
        },
        include: {
          employee: {
            include: {
              business: true,
              role: true,
              currentShop: true,
              // Fetch the multi-tenant relation junction records
              assignedShops: {
                include: {
                  shop: true // Pull full shop details out of the join table
                }
              }
            },
          },
          userSessionLogs: {
            orderBy: {
              loginAt: "desc",
            },
            take: 2,
          },
        }
      });

      if (!dbUser || !dbUser.employee) {
        return { success: false, error: "User or Employee record not found", status: 404 };
      }
      
      // Clean, straight cast since the include query perfectly matches UserWithRelations now
      const userData = mapUserToResponse(dbUser as UserWithRelations);

      // --- CONDITIONAL SESSION SYNC ---
      if (currentJwt) {
        const dbRoleName = dbUser.employee.role.name;
        const dbRoleId = dbUser.employee.role.id;
        const dbFirstName = dbUser.employee.firstName;
        const dbLastName = dbUser.employee.lastName;
        const dbEmail = dbUser.employee.email;
        const dbAccessArray = userData.role.access || [];

        // Check if database properties differ from the user's active session token
        const hasChanges = 
          currentJwt.roleId !== dbRoleId ||
          currentJwt.roleName !== dbRoleName ||
          currentJwt.firstName !== dbFirstName ||
          currentJwt.lastName !== dbLastName ||
          currentJwt.email !== dbEmail ||
          JSON.stringify(currentJwt.access) !== JSON.stringify(dbAccessArray);

        if (hasChanges) {
          // Update cookie payload safely while preserving shopId and shopSlug
          await updateSessionPayload({
            roleId: dbRoleId,
            roleName: dbRoleName,
            firstName: dbFirstName,
            lastName: dbLastName,
            email: dbEmail,
            access: dbAccessArray
          });
        }
      }
      // ---------------------------------

      return { success: true, user: userData, status: 200 };
    } catch (error) {
      console.error("Auth me error:", error);
      return { success: false, error: "Internal Server Error", status: 500 };
    }
  }
}



// import { prisma } from "@/lib/dbHelper";
// import { mapUserToResponse } from "@/lib/mappers";
// import { UserWithRelations } from "@/types/auth/auth";

// export class MeService {
//   static async getCurrentUser(userId: string, businessId: string) {
//     try {
//       const dbUser = await prisma.user.findFirst({
//         where: { 
//           id: userId, 
//           employee: { 
//             businessId: businessId,
//             isActive: true, 
//             isDeleted: false
//           } 
//         },
//         include: {
//           employee: {
//             include: {
//               business: true,
//               role: true,
//               currentShop: true,
//               // Fetch the multi-tenant relation junction records
//               assignedShops: {
//                 include: {
//                   shop: true // Pull full shop details out of the join table
//                 }
//               }
//             },
//           },
//           userSessionLogs: {
//             orderBy: {
//               loginAt: "desc",
//             },
//             take: 2,
//           },
//         }
//       });

//       if (!dbUser || !dbUser.employee) {
//         return { success: false, error: "User or Employee record not found", status: 404 };
//       }
      
//       // console.dir({ dbUser }, { depth: null, colors: true });
//       // Clean, straight cast since the include query perfectly matches UserWithRelations now
//       const userData = mapUserToResponse(dbUser as UserWithRelations);
//       return { success: true, user: userData, status: 200 };
//     } catch (error) {
//       console.error("Auth me error:", error);
//       return { success: false, error: "Internal Server Error", status: 500 };
//     }
//   }
// }