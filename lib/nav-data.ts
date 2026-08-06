// lib/nav-data.ts
import { User } from "@/types/auth/auth";
import { NavGroup, NavItem } from "@/types/types";
import hasAccess from "./accessPermissionSecurity";

import {
  ChartNetwork, Settings, HelpCircle, Users, FileUser, PackageSearch,BanknoteArrowDown,
  LayoutDashboard, HandCoins, ChartColumnStacked, BookUser, Banknote,ShelvingUnit,PlusCircle,
  Monitor, ArrowRightLeft, FileText, List, Layers, Percent, PackagePlus,Columns3Cog,
  UserRoundCog, Clock, Hourglass, Contact2, Trophy, ShieldCheck,FileBox,BrickWallShield,
  Store, MessageSquare, Globe,Dices,CircleGauge,HousePlus,Combine,Warehouse,Landmark, Bell,
  NotepadTextDashed
} from "lucide-react";

// Explicit list of sub-features that require a distinct branch store location parameter context
const SHOP_SCOPED_KEYS = [
  "invoices",
  "time-card",
  "transactions",
  "pos",
  "shop-dashboard",
  "cash-register",
  "shop-inventory",
  "shop-stocks-overview",
  "shop-receive-stock",
];


export const navConfig = [
  {
    groupLabel: "BUSINESS OPERATIONS",
    title: "Dashboard",
    accessKey: "dashboard",
    routeBase: "dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Products",
    accessKey: "product",
    routeBase: "products",
    icon: PackageSearch,
    items: [
      { title: "Products View", accessKey: "product-list", icon: List },
      { title: "Add Product", accessKey: "add-product", icon: PackagePlus },
      { title: "Categories", accessKey: "categories", icon: Layers },
      { title: "Brands", accessKey: "brands", icon: Dices },
    ],
  },

  {
    title: "Inventory",
    accessKey: "inventory",
    routeBase: "inventory",
    icon: ShelvingUnit,
    items: [
      { title: "Stock Levels", accessKey: "stock-levels", icon: Warehouse },
      // { title: "Receive Stock", accessKey: "receive-stock", icon: PackagePlus },
      // { title: "Transfer Stock", accessKey: "transfer-stock", icon: ArrowRightLeft },
      // { title: "Adjustment", accessKey: "adjustment", icon: Columns3Cog },
      // { title: "Purchase Orders", accessKey: "purchase-orders", icon: FileBox },
    ],
  },

  {
    title: "Employees",
    accessKey: "employees",
    routeBase: "employees",
    icon: Users,
    items: [
      { title: "Employee List", accessKey: "employees-list", icon: UserRoundCog },
      { title: "Total Hours Worked", accessKey: "total-hours-worked", icon: Hourglass },
      
      //       ├── employees_list
      //       ├── payroll
      //       ├── leave_management
      //       ├── performance
],
  },
  
  {
    title: "Customers",
    accessKey: "customers",
    routeBase: "customers",
    icon: FileUser,
    items: [
      { title: "Customer Base", accessKey: "customer-base", icon: Contact2 },
      { title: "Loyalty", accessKey: "loyalty", icon: Trophy },
    ],
  },
  {
    title: "Discounts",
    accessKey: "discounts",
    routeBase: "discounts",
    icon: ChartNetwork,
    items: [
      { title: "Create Discount", accessKey: "create-discount", icon: PlusCircle },
      { title: "View Discounts", accessKey: "view-discount", icon: Percent },
    ],
  },
  {
    title: "Sale Transactions",
    accessKey: "sale-transactions",
    routeBase: "sale-transactions",
    icon: NotepadTextDashed,
  }, 
  {
    title: "Notifications",
    accessKey: "notifications",
    routeBase: "notifications",
    icon: Bell,
  },
  {
    title: "Analytics & Reports",
    accessKey: "analysis",
    routeBase: "analysis",
    icon: ChartNetwork,
    items: [
      { title: "Sales Summary", accessKey: "sale-summary", icon: Banknote },
      { title: "Sale By Category", accessKey: "sale-category", icon: ChartColumnStacked },
      { title: "Sale By Employee", accessKey: "sale-employee", icon: BookUser },
      { title: "Sale By Payment", accessKey: "sale-payment-type", icon: HandCoins },
    ],
  },

  {
    title: "Settings",
    accessKey: "settings",
    routeBase: "settings",
    icon: Settings,
    items: [
      { title: "Access Controls", accessKey: "access-controls", icon: ShieldCheck },
      { title: "Business Profile", accessKey: "business-profile", icon: Landmark },
      { title: "Billings", accessKey: "billings", icon: BanknoteArrowDown },
      { title: "Audit Logs", accessKey: "audit-logs", icon: BrickWallShield },
    ],
  },

  {
    groupLabel: "BRANCH OPERATIONS",
    title: "Shops",
    accessKey: "shops",
    routeBase: "shops",
    icon: Store,
    items: [
      { title: "Manage Shops", 
        accessKey: "manage-shops", 
        icon: HousePlus,
         items: [
          { title: "View Shops", accessKey: "view-shops", icon: List },
          { title: "Add Shop", accessKey: "add-shop", icon: PlusCircle }
        ]
      },
      { title: "Shop Dashboard", accessKey: "shop-dashboard", icon: CircleGauge },
      { title: "Pos", accessKey: "pos", icon: Monitor },
      { title: "Transactions", accessKey: "transactions", icon: ArrowRightLeft },
      { title: "Time Cards", accessKey: "time-card", icon: Clock },
      { title: "Cash Register", accessKey: "cash-register", icon: HandCoins },
      { title: "Invoices", accessKey: "invoices", icon: FileText },
      // Nested 3rd Tier Parent Block
      { 
        title: "Inventory", 
        accessKey: "shop-inventory", 
        icon: Combine,
        items: [
          { title: "Stocks", accessKey: "shop-stocks-overview", icon: Warehouse },
          // { title: "Receive Stock", accessKey: "shop-receive-stock", icon: PackagePlus },
        ]
      },
    ],
  },


  {
    title: "Help",
    accessKey: "help",
    routeBase: "help",
    icon: HelpCircle,
    items: [
      { title: "Community", accessKey: "community", icon: Globe },
      { title: "Chat", accessKey: "chat", icon: MessageSquare },
    ],
  },
];


export const getNavData = (slug: string, shopSlug?: string | null): NavGroup[] => {
  return navConfig.map((group): NavGroup => {
    let groupUrl = "#";

    // Top-level base routes
    switch (group.accessKey) {
      case "dashboard": groupUrl = `/${slug}/dashboard`; break;
      case "shops": groupUrl = `/${slug}/shops`; break;
      case "products": groupUrl = `/${slug}/products`; break;
      case "discounts": groupUrl = `/${slug}/discounts`; break;
      case "inventory": groupUrl = `/${slug}/inventory`; break;
      case "employees": groupUrl = `/${slug}/employees`; break;
      case "customers": groupUrl = `/${slug}/customers`; break;
      case "sale-transactions": groupUrl = `/${slug}/sale-transactions`; break;
      case "analysis": groupUrl = `/${slug}/analysis`; break;
      case "notifications": groupUrl = `/${slug}/notifications`; break;
      case "settings": groupUrl = `/${slug}/settings`; break;
      default: groupUrl = "#";
    }

    /**
     * Fully typed recursive helper to safely resolve urls through multiple child tiers
     * @param itemList The array of items to map over
     * @param isShopContext True if this item or any of its ancestors are shop-scoped
     * @param runningPath Tracks the URL segments built by parent items
     */
    const resolveItems = (
      itemList: NavItem[] | undefined,
      isShopContext = false,
      runningPath = ""
    ): NavItem[] | undefined => {
      return itemList?.map((item): NavItem => {
        // Determine if this specific item starts a shop-scoped boundary
        const currentIsShopScoped = isShopContext || SHOP_SCOPED_KEYS.includes(item.accessKey);
        
        let compiledUrl = "#";

        if (currentIsShopScoped && shopSlug) {
          // If a parent already built a path segment, append this item's key to it
          const nextRunningPath = runningPath 
            ? `${runningPath}/${item.accessKey}` 
            : item.accessKey;

          compiledUrl = `/${slug}/shops/${shopSlug}/${nextRunningPath}`;

          return {
            ...item,
            url: compiledUrl,
            // Pass down the combined running path to deeper children
            items: resolveItems(item.items, true, nextRunningPath),
          };
        } 
        
        // Business / Group-scoped fallback routes
        if (group.routeBase) {
          compiledUrl = `/${slug}/${group.routeBase}/${item.accessKey}`;
        } else {
          compiledUrl = `/${slug}/${item.accessKey}`;
        }

        return {
          ...item,
          url: compiledUrl,
          items: resolveItems(item.items, false, ""),
        };
      });
    };

    return {
      ...group,
      url: groupUrl,
      items: resolveItems(group.items),
    };
  });
};


export function filterNavData(navData: NavGroup[], user: User): NavGroup[] {
  return navData
    .map((group) => {
      if (group.items?.length) {
        const hasParentAccess = hasAccess(user, group.accessKey);

        const filteredItems = group.items.filter((item) =>
          hasAccess(user, item.accessKey)
        );
        // Show group if:
        // - parent allowed OR
        // - at least one child allowed
        if (hasParentAccess || filteredItems.length > 0) {
          return {
            ...group,
            items: filteredItems,
          };
        }

        return null;
      } else {
        return hasAccess(user, group.accessKey) ? group : null;
      }
    })
    .filter((group): group is NavGroup => group !== null);
}
