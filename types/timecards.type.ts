import { Decimal } from "@prisma/client/runtime/client";


export type TimeCardStatus = "ACTIVE" | "COMPLETED" | "MISSED_CLOCK_OUT";

export interface TimeCardEmployee {
  firstName: string;
  lastName: string;
  designation: string | null;
  imageUrl?: string | null;
}

export interface TimeCardShop {
  id: string;
  name: string;
  shopSlug: string;
}

export interface TimeCard {
  id: string;
  customId: string;
  employeeId: string;
  businessId: string;
  shopId: string | null;
  status: TimeCardStatus;
  clockIn: Date;
  clockOut: Date | null;
  totalHours: Decimal | null; // Matches standard @db.Decimal layer
  date: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: TimeCardEmployee;
  shop?: TimeCardShop | null; // 🟢 Added to fix the TypeScript error
}

export interface ClockInDTO {
  employeeId: string;
  businessId: string;
  userId: string;       // 🟢 Added for your backend tx.auditLog execution tracking
  shopId?: string;
  notes?: string;       // 🟢 Added to allow optional shift notes on clock-in
}

export interface ClockOutDTO {
  employeeId?: string;
  timeCardId: string;
  businessId: string;
  userId: string;       // 🟢 Added for your backend tx.auditLog execution tracking
  notes?: string;       // 🟢 Added to capture user reasons/notes on shift completion
}

export interface TimeCardQueryFilters {
  businessId?: string;
  shopId?: string;
  employeeId?: string;
  status?: TimeCardStatus;
  startDate?: string;
  endDate?: string;
  period?: string;
}


export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TimeCardMetricsMeta {
  totalHoursSum: Decimal | number;
  activeEmployees: number;
  avgHoursPerEmployee: Decimal | number | string;
  totalShops: number;
  thisMonthHours: Decimal | number;
}

export interface TimeCardListMeta {
  pagination: PaginationMeta;
  metrics: TimeCardMetricsMeta;
}

/**
 * Type representing the return data structure of your totalHoursWorked method
 */
export interface TotalHoursWorkedResponseData {
  timeCards: TimeCard[];
  meta: TimeCardListMeta;
}