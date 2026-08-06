import { ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { hasPermission } from "@/lib/accessPermissionSecurity";

interface CanProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function Can({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: CanProps) {
  const user = useAuthStore((state) => state.user);

  let allowed = false;

  if (Array.isArray(permission)) {
    allowed = requireAll
      ? permission.every((p) => hasPermission(user, p))
      : permission.some((p) => hasPermission(user, p));
  } else {
    allowed = hasPermission(user, permission);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}