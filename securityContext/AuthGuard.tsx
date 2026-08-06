"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { Pill } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { SessionInfo } from "@/components/formatSessionDate";
import { useNotificationStore } from "@/store/notification.store";
import { FaCashRegister } from "react-icons/fa";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // Extract variables from stores
  const { user, loading, fetchUser } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();
  const hasToasted = useRef(false);
  
  // Extract target slug from URL parameters
  const slug = params?.slug as string | undefined;
  const currentSlug = user?.business?.slug || null;
  
  // Group your public and special routes cleanly
  const isResetPasswordPage = pathname.endsWith("/reset-password");
  
  const publicAuthRoutes = ["/verify-email", "/login", "/signup", "/change-password", "/"];
  const isPublicPage = publicAuthRoutes.some(route => pathname.endsWith(route));

  // 1. HYDRATION: Fetch user profile if missing and not on reset-password
  useEffect(() => {
    if (!user && !loading && !isResetPasswordPage) {
      fetchUser();
    }
  }, [user, loading, fetchUser, isResetPasswordPage]);

  // 2. ROUTE-BASED NOTIFICATION FETCH
  useEffect(() => {
    if (user && !isPublicPage) {
      fetchNotifications({limit: 200});
    }
  }, [pathname, fetchNotifications, user, isPublicPage]);

  // 3. SECURITY SNAPSHOT TOAST: Renders exactly once upon successful session initialization
  useEffect(() => {
    if (loading || !user?.session || hasToasted.current || isResetPasswordPage) {
      return;
    }
    
    const session = user.session;
    const sessionNotify = localStorage.getItem("sessionNotify");
    if (sessionNotify === "true") {
      return;
    }

    localStorage.setItem("sessionNotify", "true");

    toast.custom((t) => (
      <div className="bg-white border shadow-lg rounded-lg p-4 w-87.5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <h4 className="font-bold text-sm text-slate-900">Security Snapshot</h4>
        </div>
        
        <SessionInfo 
          currentLoginAt={session.currentLoginAt}
          lastLoginAt={session.lastLoginAt}
          logoutAt={session.logoutAt}
          ipAddress={session.ipAddress}
          userAgent={session.userAgent}
        />
        
        <button 
          onClick={() => toast.dismiss(t)}
          className="mt-3 w-full bg-slate-900 text-white py-2 rounded-md text-[11px] font-bold uppercase hover:bg-slate-800 transition-colors"
        >
          Dismiss
        </button>
      </div>
    ), {
      duration: Infinity,
      position: "bottom-right",
    });

    hasToasted.current = true;
  }, [loading, user, isResetPasswordPage]);

  // 4. TENANT PROTECTION & ROUTING: Ensure the user belongs to the active route's slug
  useEffect(() => {
    if (loading || !user || isResetPasswordPage) return;

    if (slug && currentSlug && currentSlug !== slug) {
      const access = user.role?.access || [];

      if (access.includes("dashboard")) {
        router.replace(`/${currentSlug}/dashboard`);
      } else if (access.length > 0) {
        router.replace(`/${currentSlug}/${access[0]}`); // Fixed indexing error here ✅
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, slug, currentSlug, router, isResetPasswordPage]);

  // 5. BYPASS FOR GUEST/PUBLIC PATHS
  if (isResetPasswordPage) {
    return <>{children}</>;
  }

  // 6. LOADING & SYNCING GUARD: Prevent content flash while fetching auth status
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-800"></div>
            <FaCashRegister className="h-4 w-4 text-blue-800 absolute animate-pulse" />
          </div>
          <p className="animate-pulse text-sm font-semibold text-slate-500 tracking-wider">
            Syncing your workspace...
          </p>
        </div>
      </div>
    );
  }

  // 7. RENDER PROTECTED CONTENT
  return <>{children}</>;
}
