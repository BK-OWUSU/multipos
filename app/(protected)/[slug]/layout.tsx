"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { usePathname, useParams } from "next/navigation"
import { Toaster } from "sonner"
import { NavbarNotifications } from "@/components/NavbarNotifications"
import { NavbarUser } from "@/components/NavbarUser"
import { SessionTimeoutProvider } from "@/components/reusables/security/SessionTimeoutProvider"
import { AuthGuard } from "@/securityContext/AuthGuard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const { user } = useAuthStore();

  const currentSlug = user?.business?.slug || null;
  const shopSlug = user?.currentShop?.shopSlug || null;
  const slug = (params?.slug as string) || "";
  const isResetPasswordPage = pathname.endsWith("/reset-password");

  // Dynamic Page Title logic
  const title = pathname.split("/")[2] || slug;
  const pageTitle = title.includes("_") 
    ? title.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") 
    : title.charAt(0).toUpperCase() + title.slice(1);

  // 1. CLEAN LAYOUT FOR RESET PASSWORD
  if (isResetPasswordPage) {
    return (
      <main className="min-h-screen bg-background">
        {children}
        <Toaster position="top-right" richColors />
      </main>
    );
  }

  // 2. STANDARD DASHBOARD LAYOUT WITH WRAPPED GUARD
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar shopSlug={shopSlug} slug={currentSlug || ""} />
        <SidebarInset>
          <header className="flex bg-transparent z-10 backdrop-blur-md sticky top-0 border-b p-2 h-16 shrink-0 items-center gap-2 transition-[width,height] justify-between ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={`/${slug}/${shopSlug || ""}/dashboard`}>multiPOS</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {/* Top Right NavBar Section */}
            <div className="flex items-center gap-6">
              <NavbarNotifications />
              <NavbarUser />
            </div>
          </header>
          <SessionTimeoutProvider>
            <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
          </SessionTimeoutProvider>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </AuthGuard>
  );
}
