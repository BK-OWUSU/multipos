import { AccessControlNode, NavItem } from "@/types/types";
import { navConfig } from "./nav-data";
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];

//ACCESS ROUTES KEYS DEFINITIONS
export const getAccessOnly = (): AccessControlNode[] => {
  // Purely typed recursive tree mapper matching your NavItem contract
  const mapItem = (item: NavItem): AccessControlNode => ({
    title: item.title,
    accessKey: item.accessKey,
    icon: item.icon,
    ...(item.items ? { items: item.items.map(mapItem) } : {})
  });

  return navConfig.map((group): AccessControlNode => ({
    title: group.title,
    accessKey: group.accessKey,
    icon: group.icon,
    ...(group.items ? { items: group.items.map(mapItem) } : {})
  }));
};

export const getAllAccessKeys = (): string[] => {
  const keys: string[] = [];

  // Tailored structural handler checking both NavGroup or NavItem branches safely
  const extractKeys = (node: { accessKey: string; items?: NavItem[] }): void => {
    if (node.accessKey) {
      keys.push(node.accessKey);
    }
    if (node.items && Array.isArray(node.items)) {
      node.items.forEach(extractKeys);
    }
  };

  navConfig.forEach(extractKeys);
  
  return Array.from(new Set(keys));
};

export const ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "import",
  "export",
  "print",
  "approve",
  "cancel",
  "refund",
  "assign",
  "transfer",
  "adjust",
  "open",
  "close",
  "download",
  "award",
  "redeem",
  "receive",
  "send",
  "reset-password",
] as const;

export const PERMISSIONS = {
  business: {
    VIEW: "business:view",
    UPDATE: "business:update",
  },

  dashboard: {
    VIEW: "dashboard:view",
  },

  product: {
    VIEW: "product:view",
    CREATE: "product:create",
    UPDATE: "product:update",
    DELETE: "product:delete",
    IMPORT: "product:import",
    EXPORT: "product:export",
  },

  categories: {
    VIEW: "category:view",
    CREATE: "category:create",
    UPDATE: "category:update",
    DELETE: "category:delete",
  },
  brands: {
    VIEW: "brand:view",
    CREATE: "brand:create",
    UPDATE: "brand:update",
    DELETE: "brand:delete",
  },
  sale: {
    VIEW: "sale:view",
    CREATE: "sale:create",
    CANCEL: "sale:cancel",
    REFUND: "sale:refund",
  },
  shops: { // Matched to accessKey: "shops"
    VIEW: "shop:view",
    CREATE: "shop:create",
    UPDATE: "shop:update",
    DELETE: "shop:delete",
  },
  invoices: { // Matched to accessKey: "invoices"
    VIEW: "invoice:view",
    PRINT: "invoice:print",
    DOWNLOAD: "invoice:download",
  },
  report: {
    VIEW: "report:view",
    EXPORT: "report:export",
    PRINT: "report:print",
  },
  
  loyalty: {
    VIEW: "loyalty:view",
    UPDATE: "loyalty:update",
    AWARD: "loyalty:award",
    REDEEM: "loyalty:redeem",
  },
} as const;

export const getAllPermissions = Object.values(PERMISSIONS).flatMap(
  (resource) => Object.values(resource)
);