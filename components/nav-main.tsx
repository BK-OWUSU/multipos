"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { NavGroup } from "@/types/types"
import { useNotificationStore } from "@/store/notification.store"
import { NotificationWithRelations } from "@/types/notification.type"

export function NavMain({ items }: { items: NavGroup[] }) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = React.useState<string | null>(null)
  
  // 2. Extract notification tracking variables (adjust property names if your store structure differs)
  const { notifications } = useNotificationStore()
  const unreadCount = notifications?.filter((n: NotificationWithRelations) => !n.isRead).length || 0

  React.useEffect(() => {
    const activeGroup = items.find((group) =>
      group.items?.some((sub) => sub.url === pathname || sub.items?.some((nested) => nested.url === pathname)) || group.url === pathname
    )
    if (activeGroup) {
      setOpenGroup(activeGroup.title)
    }
  }, [pathname, items])

  // 3. Helper to render the title with an optional badge layout
  const renderTitleWithBadge = (title: string) => {
    if (title.toLowerCase() === "notifications" && unreadCount > 0) {
      return (
        <span className="flex items-center justify-between w-full">
          <span>{title}</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        </span>
      )
    }
    return <span>{title}</span>
  }

  // Helper function to render the inner menu elements to avoid duplicate markup
  const renderMenuItem = (group: NavGroup) => {
    const isActive = 
      group.url === pathname || 
      group.items?.some((sub) => sub.url === pathname || sub.items?.some((nested) => nested.url === pathname))

    const hasSubItems = group.items && group.items.length > 0
    const isOpen = openGroup === group.title

    if (hasSubItems) {
      return (
        <Collapsible
          key={group.title}
          asChild
          open={isOpen}
          onOpenChange={(open) => setOpenGroup(open ? group.title : null)}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton 
                tooltip={group.title}
                className={isActive ? "font-extrabold" : ""}
              >
                {group.icon && <group.icon className="h-4 w-4" />}
                {renderTitleWithBadge(group.title)}
                <ChevronRightIcon 
                  className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" 
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                {group.items?.map((subItem) => {
                  const hasNestedItems = subItem.items && subItem.items.length > 0
                  const isSubActive = subItem.url === pathname || subItem.items?.some((n) => n.url === pathname)

                  // NESTED 3RD TIER TRIGGER
                  if (hasNestedItems) {
                    return (
                      <Collapsible key={subItem.title} className="group/sub-collapsible w-full" defaultOpen={isSubActive}>
                        <SidebarMenuSubItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuSubButton className="text-white hover:text-blue-950 transition-colors flex items-center justify-between w-full">
                              <span className="flex items-center gap-2 w-full pr-2">
                                {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                {renderTitleWithBadge(subItem.title)}
                              </span>
                              <ChevronRightIcon className="h-3 w-3 ml-auto transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
                            </SidebarMenuSubButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-4 border-l border-white my-1 ml-2 space-y-1">
                              {subItem.items?.map((nestedItem) => (
                                <Link
                                  key={nestedItem.title}
                                  href={nestedItem.url || "#"}
                                  className={`flex items-center gap-2 text-md py-1.5 px-2 rounded-md transition-colors w-full ${
                                    pathname === nestedItem.url 
                                      ? "bg-white text-blue-950 font-bold" 
                                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                                  }`}
                                >
                                  {nestedItem.icon && <nestedItem.icon className="h-3.5 w-3.5" />}
                                  {renderTitleWithBadge(nestedItem.title)}
                                </Link>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </SidebarMenuSubItem>
                      </Collapsible>
                    )
                  }

                  // STANDARD 2ND TIER ITEMS
                  return (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        className="text-white hover:text-blue-950 transition-colors" 
                        asChild 
                        isActive={pathname === subItem.url}
                      >
                        <Link href={subItem.url || "#"} className="w-full flex items-center justify-between">
                          <span className="flex items-center gap-2 w-full pr-2">
                            {subItem.icon && <subItem.icon className="h-4 w-4" />}
                            {renderTitleWithBadge(subItem.title)}
                          </span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )
    }

    // STANDALONE TIER 1 LINKS (e.g. Notifications)
    return (
      <SidebarMenuItem key={group.title}>
        <SidebarMenuButton
          tooltip={group.title}
          className={isActive ? "font-extrabold" : ""}
          asChild
        >
          <Link href={group.url || "#"} className="w-full flex items-center justify-between">
            <span className="flex items-center gap-2 w-full pr-2">
              {group.icon && <group.icon className="h-4 w-4" />}
              {renderTitleWithBadge(group.title)}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <>
      {items.map((group, index) => {
        if (group.groupLabel) {
          return (
            <SidebarGroup key={`labeled-group-${index}`}>
              <SidebarGroupLabel className="text-green-300 font-bold" >{group.groupLabel}</SidebarGroupLabel>
              <SidebarMenu>
                {renderMenuItem(group)}
              </SidebarMenu>
            </SidebarGroup>
          )
        }

        return (
          <SidebarGroup key={`unlabeled-group-${index}`} className="py-0">
            <SidebarMenu>
              {renderMenuItem(group)}
            </SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}
