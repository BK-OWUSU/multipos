import { User, UserWithRelations } from "@/types/auth/auth";


export function mapUserToResponse(user: UserWithRelations): User {
  const emp = user.employee;
  const currentSession = user.userSessionLogs?.[0];
  const previousSession = user.userSessionLogs?.[1];

  // Safely extract the primary or first assigned shop out of the join array
  // If your employee model has a direct singular fallback link named 'shop', use that instead
  const activeShopContext = emp.currentShop || emp.assignedShops?.[0]?.shop;

  return {
    id: user.id,
    employeeId: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName,
    fullName: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    imageUrl: emp.imageUrl || null,
    fileKey: emp.fileKey || null,

    role: {
      name: emp.role?.name,
      permissions: emp.role?.permissions || [],
      access: emp.role?.access || [],
    },

    business: {
      id: emp.business.id,
      name: emp.business.name,
      slug: emp.business.slug,
      currencyCode: emp.business.currencyCode,
      currencySymbol: emp.business.currencySymbol,
      locale: emp.business.locale,
      countryCode: emp.business.countryCode || undefined,
    },
  
    currentShop: activeShopContext 
      ? {
          id: activeShopContext.id,
          name: activeShopContext.name,
          shopSlug: activeShopContext.slug,
          address: activeShopContext.address || null,
          phone: activeShopContext.phone || null
        }
        : undefined,
        
        assignedShops: emp.assignedShops?.map(shp => ({
          shop: {
            id: shp.shop.id,
            name: shp.shop.name,
            shopSlug: shp.shop.slug,
            address: shp.shop.address || null,
            phone: shp.shop.phone || null
      }
    })) || undefined,  

    session: currentSession
      ? {
          currentLoginAt: currentSession.loginAt,
          lastLoginAt: previousSession?.loginAt || null,
          logoutAt: previousSession?.logoutAt || null,
          ipAddress: previousSession?.ipAddress || null,
          userAgent: previousSession?.userAgent || null,
        }
      : undefined,
  };
}