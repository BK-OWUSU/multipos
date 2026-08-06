import { User } from "@/types/auth/auth";
import { getAllAccessKeys, getAllPermissions, Permission } from "./accessAndPermissionsDef";


export default function hasAccess(user: User | null, key: string): boolean { 
    if (!user) return false;
    // Full access (OWNER / SUPER ADMIN)
    if (user?.role?.access.includes("*")) return true;
    // Check specific access key
    return user?.role?.access.includes(key);
}

export function hasPermission(user: User | null, key: string): boolean { 
    if (!user) return false;
    //Full permission (OWNER / SUPER ADMIN)
    if (user?.role?.permissions.includes("*")) return true;
    return user?.role?.permissions.includes(key);
}

// LENGTHS
//Access
export  function accessLength(key: string[]): number { 
    const accessRoutes = getAllAccessKeys()
    // Full access (OWNER / SUPER ADMIN)
    if (key.includes("*")) return accessRoutes.length;
    // Check specific access key
    return key.filter(k => accessRoutes.some(route => route === k || route === k)).length;
}

//Permissions
export function permissionLength(key: string[]): number { 
  if (key.includes("*")) {
    // Read length directly from your static array without spreading memory
    return getAllPermissions.length;
  }
  // Create an instant O(1) lookup set from your literal array
  const permissionSet = new Set<string>(getAllPermissions);
  // Safely count valid permissions without allocating a new filtered array in memory
  return key.reduce((count, p) => permissionSet.has(p) ? count + 1 : count, 0);
}

// LIST OF ACCESS KEYS
export function accessRoutesFilteredValues(key: string[]): string[] { 
    const accessRoutes = getAllAccessKeys();
    // Full access (OWNER / SUPER ADMIN)
    if (key.includes("*")) return accessRoutes;
    // Create a Set for fast O(1) lookups
    const routeSet = new Set(accessRoutes);
    // Return only the keys that exist in the access routes
    return key.filter(k => routeSet.has(k));
}

//TODO: Implement a more robust permission system in the future, possibly using a dedicated permissions library or framework.
// export function permissionFilteredValues(key: string[]): string[] { 
//     const permissions = getAllPermissions;
//     // Full access (OWNER / SUPER ADMIN)
//     if (key.includes("*")) return permissions;
//     // Create a Set for fast O(1) lookups
//     const permissionSet = new Set(permissions);
//     // Return only the keys that exist in the access routes
//     return key.filter(k => permissionSet.has(k));
// }




export function getRolePermissionsForForm(rolePermissions: string[]): Permission[] {
  // Cast the strict array to string[] inside the function to allow flexible checking
  const allPermissionsList = getAllPermissions as readonly string[]; 

  if (rolePermissions.includes("*")) {
    // Return all permissions, cast safely to your strict Permission type
    return [...getAllPermissions] as Permission[];
  }

  // Use a TypeScript Type Guard (permission is Permission) to filter safely
  return rolePermissions.filter((permission): permission is Permission =>
    allPermissionsList.includes(permission)
  );
}


export function accessRouteCleaner(key: string[]): string[] { 
  const accessRoutes = getAllAccessKeys(); 
  // Checks if every item in accessRoutes is included in the key array
  const hasFullAccess = accessRoutes.every(route => key.includes(route));
  if (hasFullAccess) {
    return ["*"]; 
  }
  //Return a fallback string if they do not match
  return key; 
}

export function permissionRouteCleaner(key: string[]): string[] { 
  const allPermissions = getAllPermissions; 
  // Checks if every item in permission is included in the key array
  const hasFullAccess = allPermissions.every(permission => key.includes(permission));
  if (hasFullAccess) {
    return ["*"]; 
  }
  //Return a fallback string if they do not match
  return key; 
}
