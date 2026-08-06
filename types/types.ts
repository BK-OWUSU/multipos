import { type LucideIcon } from "lucide-react";

// Sidebar Navigation Items interface
export interface NavItem {
  title: string;
  url?: string;
  accessKey: string; 
  isExternal?: boolean;
  icon?: LucideIcon;
  items?: NavItem[]; 
}

export interface NavGroup {
  groupLabel?: string;
  title: string;
  url?: string;
  routeBase?: string;
  accessKey: string;
  items?: NavItem[];
  isExternal?: boolean;
  icon?: LucideIcon;
}

// Strict presentation output contract mapping your exact layout requirements
export interface AccessControlNode {
  title: string;
  accessKey: string;
  icon?: LucideIcon;
  items?: AccessControlNode[];
}


// Define the TypeScript shape for your Transfer logs
export type TransferRecord = {
  id: string;
  customId: string;
  fromShop: string;
  toShop: string;
  itemsCount: number;
  unitsCount: number;
  totalValue: number;
  status: "Received" | "In Transit" | "Pending"| "Cancelled";
  transferPriority: "Normal" | "Medium" | "Urgent";
  transferDate: string;
};


