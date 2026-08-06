import { Decimal } from "@prisma/client/runtime/client";


export type TimeCardStatus = "ACTIVE" | "COMPLETED" | "MISSED_CLOCK_OUT";

export interface TimeCardEmployee {
  firstName: string;
  lastName: string;
  designation: string | null;
  imageUrl?: string | null;
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