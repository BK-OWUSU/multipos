"use client"

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { getNavData, filterNavData } from "@/lib/nav-data"
import { ClockInButton, ClockOutButton, OpenRegisterButton, QuickActionsGroup, ViewAllSessionsButton } from "./quickActionsComponents/quickActions"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  slug: string;
  shopSlug?: string | null;
}

export function AppSidebar({ slug, shopSlug, ...props }: AppSidebarProps) {
  const {user} = useAuthStore();

  const {state} = useSidebar();
  const isExpanded = state === "expanded";

  const businessName = user?.business.name;
  // 1. Get and Filter Navigation Data based on user permissions
  const filteredNavData = React.useMemo(() => {
    if (!user || !slug) return [];
    const rawData = getNavData(slug, shopSlug);
    return filterNavData(rawData, user);
  }, [user, slug, shopSlug]);

  // console.log("Filtered Navigation Data: ", filteredNavData);
  // 2. Map User data to the format NavUser expects
  const userData = {
    name: user ? `${user.firstName} ${user.lastName}` : "User",
    email: user?.email || "",
    avatar: user ?  user.imageUrl : "", 
  };

  // 3. Map Business data to the format TeamSwitcher expects
  const teamsData = [
    {
      name: businessName || "MultiPOS",
      logo: user?.business.logoUrl || "/imgs/default-logo.png" || GalleryVerticalEnd,
      plan: user?.role?.name || "Member",
    },
  ];

  return (
    <Sidebar collapsible="icon" className=" bg-blue-950 z-30" {...props}>
      <SidebarHeader className="bg-blue-950 text-white border-b border-blue-900/50">
        <TeamSwitcher teams={teamsData} />
      </SidebarHeader>
      
      <SidebarContent className="bg-blue-950 text-white">
        <NavMain items={filteredNavData} />

      <QuickActionsGroup isExpanded={isExpanded}>
          <OpenRegisterButton isExpanded={isExpanded} />
          <ClockInButton isExpanded={isExpanded} />
          <ClockOutButton isExpanded={isExpanded} />
          <ViewAllSessionsButton isExpanded={isExpanded} />
      </QuickActionsGroup>
      
      </SidebarContent>

      <SidebarFooter className="bg-blue-950 text-white border-t border-blue-900/50">
        <NavUser user={userData} />
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}